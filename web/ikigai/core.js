/* =====================================================================
   Ikigai · núcleo
   - Base de datos local cifrada (IndexedDB + AES-256-GCM, clave derivada de tu frase con PBKDF2).
   - Sincronización automática con Supabase (pull → fusión por campo → push con control de versión).
   - Puerta de acceso: frase local, correo + contraseña y doble factor (TOTP).
   - Respaldos cifrados con rotación abuelo-padre-hijo.
   Expone window.claude.use(name) con la misma interfaz que Quincena usaba dentro de Claude.
   ===================================================================== */
(function(){
'use strict';
const VERSION='1.0.0';
const CFG=window.IKIGAI_CONFIG||{};
const te=new TextEncoder(), td=new TextDecoder();
const isTauri=!!window.__TAURI__;
const isCap=!!(window.Capacitor&&typeof window.Capacitor.isNativePlatform==='function'&&window.Capacitor.isNativePlatform());
const PLATFORM=isTauri?'windows':isCap?'android':'web';
const PLATFORM_NAME={windows:'Windows',android:'Android',web:'Web'}[PLATFORM];
const ITER=600000;
const SUB='items';

/* ---------------- utilidades ---------------- */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const isEmpty=o=>!o||Object.keys(o).length===0;
const same=(a,b)=>JSON.stringify(a===undefined?null:a)===JSON.stringify(b===undefined?null:b);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b64=u8=>{let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);};
const ub64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const rand=n=>crypto.getRandomValues(new Uint8Array(n));
const fmtDate=iso=>{ try{ return new Date(iso).toLocaleString('es-CO',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }catch(_){ return iso; } };
const fmtSize=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';
function toast(msg){
  if(window.QZ&&typeof window.QZ.toast==='function'){ try{ window.QZ.toast(msg); return; }catch(_){} }
  let t=$('#ik-toast'); if(!t){ t=document.createElement('div'); t.id='ik-toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
  t.textContent=msg; t.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>{ t.hidden=true; },3500);
}

/* ---------------- IndexedDB ---------------- */
let IDB=null;
const req2p=r=>new Promise((res,rej)=>{ r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
function idbOpen(){
  return new Promise((res,rej)=>{
    const r=indexedDB.open('ikigai',1);
    r.onupgradeneeded=()=>{ const d=r.result; d.createObjectStore('docs',{keyPath:'path'}); d.createObjectStore('meta',{keyPath:'k'}); d.createObjectStore('backups',{keyPath:'id'}); };
    r.onsuccess=()=>{ IDB=r.result; res(IDB); };
    r.onerror=()=>rej(r.error);
    r.onblocked=()=>rej(new Error('La base local está ocupada por otra ventana de Ikigai.'));
  });
}
const idbGet=(s,k)=>req2p(IDB.transaction(s).objectStore(s).get(k));
const idbAll=s=>req2p(IDB.transaction(s).objectStore(s).getAll());
const idbPut=(s,v)=>req2p(IDB.transaction(s,'readwrite').objectStore(s).put(v));
const idbDel=(s,k)=>req2p(IDB.transaction(s,'readwrite').objectStore(s).delete(k));
const getMeta=async k=>{ const r=await idbGet('meta',k); return r?r.v:undefined; };
const setMeta=(k,v)=>idbPut('meta',{k,v});

/* ---------------- cifrado ---------------- */
async function deriveKey(pass,salt,iter){
  const base=await crypto.subtle.importKey('raw',te.encode(pass.normalize('NFC')),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encBytes(key,u8){ const iv=rand(12); const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,u8)); return {iv:b64(iv),ct:b64(ct)}; }
async function decBytes(key,box){ return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub64(box.iv)},key,ub64(box.ct))); }
const enc=(key,obj)=>encBytes(key,te.encode(JSON.stringify(obj)));
const dec=async(key,box)=>JSON.parse(td.decode(await decBytes(key,box)));
async function gz(u8){ if(typeof CompressionStream==='undefined') return null; const s=new Blob([u8]).stream().pipeThrough(new CompressionStream('gzip')); return new Uint8Array(await new Response(s).arrayBuffer()); }
async function gunz(u8){ const s=new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip')); return new Uint8Array(await new Response(s).arrayBuffer()); }

/* ---------------- estado ---------------- */
const ST={key:null,vault:null,map:new Map(),uid:null,email:null,aal2:false,sb:null,rt:null,
  settings:{lockMin:5,backupDays:15},sync:{state:'idle',last:null,err:null},listeners:new Set(),unlocked:false};
let dbResolve; const dbReady=new Promise(r=>{ dbResolve=r; });

/* ---------------- documentos: escritura, fusión ---------------- */
function kkeys(data){ const ks=new Set(); for(const k of Object.keys(data||{})){ if(k===SUB&&isObj(data[k])){ for(const id of Object.keys(data[k])) ks.add(SUB+'/'+id); } else ks.add(k); } return ks; }
function kval(data,k){ if(!data) return undefined; if(k.startsWith(SUB+'/')){ const id=k.slice(SUB.length+1); return isObj(data[SUB])?data[SUB][id]:undefined; } return data[k]; }
function setK(data,k,v){
  if(k.startsWith(SUB+'/')){ const id=k.slice(SUB.length+1); if(v===undefined){ if(isObj(data[SUB])) delete data[SUB][id]; } else { if(!isObj(data[SUB])) data[SUB]={}; data[SUB][id]=clone(v); } }
  else if(v===undefined) delete data[k]; else data[k]=clone(v);
}
function applyPatch(base,patch){
  for(const [k,v] of Object.entries(patch||{})){
    if(v===null||v===undefined) delete base[k];
    else if(isObj(v)&&isObj(base[k])){ const o=base[k]; for(const [k2,v2] of Object.entries(v)){ if(v2===null||v2===undefined) delete o[k2]; else o[k2]=clone(v2); } }
    else base[k]=clone(v);
  }
  return base;
}
function pruneKt(kt,data){ const lim=Date.now()-180*864e5; for(const k of Object.keys(kt)) if(kt[k]<lim&&kval(data,k)===undefined) delete kt[k]; return kt; }
async function persist(r){ const box=await enc(ST.key,{data:r.data,kt:r.kt}); await idbPut('docs',{path:r.path,box,rev:r.rev||0,dirty:!!r.dirty,ts:r.ts||0}); }
async function loadAll(){
  ST.map.clear();
  for(const x of await idbAll('docs')){
    try{ const o=await dec(ST.key,x.box); ST.map.set(x.path,{path:x.path,data:o.data||{},kt:o.kt||{},rev:x.rev||0,dirty:!!x.dirty,ts:x.ts||0}); }
    catch(e){ console.error('Documento ilegible',x.path,e); }
  }
}
async function write(path,data,opts){
  if(!ST.key) throw Object.assign(new Error('Ikigai está bloqueada'),{code:'unavailable'});
  const had=ST.map.has(path);
  const r=ST.map.get(path)||{path,data:{},kt:{},rev:0,dirty:false,ts:0};
  const now=Date.now(), kt=Object.assign({},r.kt);
  let changed=false;
  for(const k of new Set([...kkeys(r.data),...kkeys(data)])){ if(!same(kval(r.data,k),kval(data,k))){ kt[k]=now; changed=true; } }
  if(!changed&&had) return;
  r.data=data; r.kt=pruneKt(kt,data); r.dirty=true; r.ts=now;
  ST.map.set(path,r); await persist(r); notify(path);
  if(!(opts&&opts.noSync)) scheduleSync(1500);
}
function mergeDoc(L,R){
  const data=clone(L.data)||{}, kt=Object.assign({},L.kt);
  const ks=new Set([...kkeys(L.data),...kkeys(R.data),...Object.keys(L.kt||{}),...Object.keys(R.kt||{})]);
  for(const k of ks){
    const lt=(L.kt||{})[k]||0, rt=(R.kt||{})[k]||0;
    let useR=rt>lt;
    if(rt===lt&&rt>0&&!same(kval(L.data,k),kval(R.data,k))) useR=JSON.stringify(kval(R.data,k)??null)>JSON.stringify(kval(L.data,k)??null);
    if(useR){ setK(data,k,kval(R.data,k)); kt[k]=rt; }
  }
  return {data,kt};
}
async function applyRemote(row){
  const R={data:row.data||{},kt:row.kt||{}};
  const r=ST.map.get(row.path);
  if(!r){ const n={path:row.path,data:R.data,kt:R.kt,rev:row.rev,dirty:false,ts:Date.now()}; ST.map.set(row.path,n); await persist(n); notify(row.path); return; }
  if(!r.dirty){ if(r.rev>=row.rev) return; r.data=R.data; r.kt=R.kt; r.rev=row.rev; await persist(r); notify(row.path); return; }
  const m=mergeDoc(r,R), changed=!same(m.data,r.data);
  r.data=m.data; r.kt=m.kt; r.rev=Math.max(r.rev||0,row.rev);
  r.dirty=!(same(m.data,R.data)&&same(m.kt,R.kt));
  await persist(r); if(changed) notify(row.path);
}

/* ---------------- API tipo Firestore para Quincena ---------------- */
function snap(path){ const r=ST.map.get(path), exists=!!r&&!isEmpty(r.data); return {id:path.split('/').pop(),exists,data:()=>exists?clone(r.data):undefined}; }
function collSnap(path){
  const depth=path.split('/').length+1, docs=[];
  for(const [p,r] of ST.map) if(p.startsWith(path+'/')&&p.split('/').length===depth&&!isEmpty(r.data)) docs.push(snap(p));
  docs.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)};
}
function fire(l){ try{ l.cb(l.type==='doc'?snap(l.path):collSnap(l.path)); }catch(e){ console.error(e); } }
function listen(l){ ST.listeners.add(l); setTimeout(()=>fire(l),0); return ()=>ST.listeners.delete(l); }
const notifyQ=new Set(); let notifyT=null;
function notify(path){
  notifyQ.add(path);
  if(notifyT) return;
  notifyT=setTimeout(()=>{ const ps=[...notifyQ]; notifyQ.clear(); notifyT=null;
    for(const l of ST.listeners){ if(l.type==='doc'?ps.includes(l.path):ps.some(p=>p.startsWith(l.path+'/'))) fire(l); } },0);
}
function docRef(path){
  return Object.freeze({id:path.split('/').pop(),path,
    get:async()=>snap(path),
    set:async d=>{ await write(path,clone(d||{})); },
    update:async p=>{ const cur=ST.map.get(path); await write(path,applyPatch(cur?clone(cur.data):{},p)); },
    delete:async()=>{ await write(path,{}); },
    onSnapshot:(cb)=>listen({type:'doc',path,cb})});
}
function collRef(path){
  return Object.freeze({path,doc:id=>docRef(path+'/'+id),get:async()=>collSnap(path),onSnapshot:(cb)=>listen({type:'col',path,cb})});
}
const DB=Object.freeze({doc:p=>docRef(String(p)),collection:p=>collRef(String(p))});
const USER=Object.freeze({id:async()=>ST.uid||'local',isOwner:async()=>true,email:async()=>ST.email});

/* ---------------- archivos según plataforma ---------------- */
const FILES={
  dirLabel:PLATFORM==='windows'?'Documentos\\Ikigai\\Respaldos':PLATFORM==='android'?'Documentos/Ikigai/Respaldos':null,
  async write(name,text){
    if(PLATFORM==='windows'){ const f=window.__TAURI__.fs, base=f.BaseDirectory.Document; try{ await f.mkdir('Ikigai/Respaldos',{baseDir:base,recursive:true}); }catch(_){} await f.writeTextFile('Ikigai/Respaldos/'+name,text,{baseDir:base}); return true; }
    if(PLATFORM==='android'){ await window.Capacitor.Plugins.Filesystem.writeFile({path:'Ikigai/Respaldos/'+name,data:text,directory:'DOCUMENTS',encoding:'utf8',recursive:true}); return true; }
    return false;
  },
  async remove(name){
    try{
      if(PLATFORM==='windows'){ const f=window.__TAURI__.fs; await f.remove('Ikigai/Respaldos/'+name,{baseDir:f.BaseDirectory.Document}); }
      else if(PLATFORM==='android'){ await window.Capacitor.Plugins.Filesystem.deleteFile({path:'Ikigai/Respaldos/'+name,directory:'DOCUMENTS'}); }
    }catch(_){}
  }
};
const DOWNLOADS=Object.freeze({async save(opts){
  const name=String((opts&&opts.filename)||'archivo').replace(/[\\/:*?"<>|]+/g,'_');
  const data=opts?opts.data:'';
  const blob=data instanceof Blob?data:new Blob([data==null?'':data]);
  if(PLATFORM==='windows'){
    const f=window.__TAURI__.fs; await f.writeFile(name,new Uint8Array(await blob.arrayBuffer()),{baseDir:f.BaseDirectory.Download});
    toast('Guardado en Descargas: '+name); return {ok:true};
  }
  if(PLATFORM==='android'){
    const P=window.Capacitor.Plugins;
    const r=await P.Filesystem.writeFile({path:'Ikigai/'+name,data:b64(new Uint8Array(await blob.arrayBuffer())),directory:'DOCUMENTS',recursive:true});
    try{ await P.Share.share({title:name,url:r.uri}); }catch(_){ toast('Guardado en Documentos/Ikigai: '+name); }
    return {ok:true};
  }
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000);
  return {ok:true};
}});

/* ---------------- Supabase: sesión cifrada en el dispositivo ---------------- */
const AUTHMEM={};
const authStorage={
  getItem:async k=>{ if(k in AUTHMEM) return AUTHMEM[k]; if(!ST.key) return null; const b=await getMeta('auth:'+k); if(!b) return null; try{ const v=await dec(ST.key,b); AUTHMEM[k]=v; return v; }catch(_){ return null; } },
  setItem:async(k,v)=>{ AUTHMEM[k]=v; if(ST.key) await setMeta('auth:'+k,await enc(ST.key,v)); },
  removeItem:async k=>{ delete AUTHMEM[k]; try{ await idbDel('meta','auth:'+k); }catch(_){} }
};
async function flushAuth(){ for(const [k,v] of Object.entries(AUTHMEM)) await setMeta('auth:'+k,await enc(ST.key,v)); }
function initSB(){
  if(ST.sb) return ST.sb;
  ST.sb=window.supabase.createClient(CFG.url,CFG.key,{auth:{storage:authStorage,storageKey:'ikigai-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  ST.sb.auth.onAuthStateChange((ev,s)=>{
    ST.uid=s&&s.user?s.user.id:null; ST.email=s&&s.user?s.user.email:null;
    if(ev==='SIGNED_OUT'){ ST.aal2=false; stopRealtime(); setSync('auth'); }
  });
  return ST.sb;
}
async function checkSession(){
  const sb=initSB();
  try{
    const {data:{session}}=await sb.auth.getSession();
    if(!session) return false;
    ST.uid=session.user.id; ST.email=session.user.email;
    const {data,error}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if(error) return false;
    ST.aal2=data.currentLevel==='aal2';
    return ST.aal2;
  }catch(_){ return false; }
}
function startRealtime(){
  if(ST.rt||!ST.uid||!ST.sb) return;
  try{ ST.rt=ST.sb.channel('ikigai-docs').on('postgres_changes',{event:'*',schema:'public',table:'docs',filter:'user_id=eq.'+ST.uid},()=>scheduleSync(400)).subscribe(); }catch(_){}
}
function stopRealtime(){ if(ST.rt&&ST.sb){ try{ ST.sb.removeChannel(ST.rt); }catch(_){} } ST.rt=null; }

/* ---------------- sincronización ---------------- */
let syncing=false, again=false, syncT=null;
function scheduleSync(ms){ clearTimeout(syncT); syncT=setTimeout(syncNow,ms||0); }
const pendingCount=()=>{ let n=0; for(const r of ST.map.values()) if(r.dirty) n++; return n; };
function errMsg(e){ return (e&&(e.message||e.error_description||e.code))||String(e); }
function isAuthErr(e){ const s=String((e&&(e.code||''))+' '+(e&&e.message||'')); return /JWT|PGRST30|401|42501|row-level security/i.test(s); }
async function pull(){
  const since=(await getMeta('lastPull'))||'1970-01-01T00:00:00.000Z';
  const from=new Date(Date.parse(since)-120000).toISOString();
  let max=since, off=0;
  for(;;){
    const {data,error}=await ST.sb.from('docs').select('path,data,kt,rev,updated_at').eq('user_id',ST.uid).gte('updated_at',from).order('updated_at',{ascending:true}).range(off,off+499);
    if(error) throw error;
    for(const row of data){ await applyRemote(row); if(row.updated_at>max) max=row.updated_at; }
    if(data.length<500) break; off+=500;
  }
  await setMeta('lastPull',max);
}
async function refetch(path){
  const {data,error}=await ST.sb.from('docs').select('path,data,kt,rev,updated_at').eq('user_id',ST.uid).eq('path',path).maybeSingle();
  if(error) throw error;
  if(data) await applyRemote(data);
}
async function pushDirty(){
  for(const r of [...ST.map.values()].filter(x=>x.dirty)){
    for(let attempt=0;attempt<4;attempt++){
      const ts=r.ts, body={data:r.data,kt:r.kt,deleted:isEmpty(r.data)};
      const res=r.rev>0
        ? await ST.sb.from('docs').update(body).eq('user_id',ST.uid).eq('path',r.path).eq('rev',r.rev).select('rev')
        : await ST.sb.from('docs').insert(Object.assign({user_id:ST.uid,path:r.path},body)).select('rev');
      if(res.error){ if(res.error.code==='23505'){ await refetch(r.path); continue; } throw res.error; }
      if(!res.data||!res.data.length){ await refetch(r.path); if(!r.dirty) break; continue; }
      r.rev=res.data[0].rev; if(r.ts===ts) r.dirty=false; await persist(r); break;
    }
  }
}
async function syncNow(){
  if(!ST.key) return;
  if(syncing){ again=true; return; }
  if(!navigator.onLine){ setSync('offline'); return; }
  if(!ST.sb||!ST.uid||!ST.aal2){ setSync('auth'); return; }
  syncing=true; setSync('syncing');
  try{
    await pull(); await pushDirty();
    ST.sync.last=new Date().toISOString(); ST.sync.err=null; await setMeta('lastSync',ST.sync.last);
    setSync(pendingCount()?'pending':'ok');
  }catch(e){ console.error('Sincronización',e); ST.sync.err=errMsg(e); setSync(isAuthErr(e)?'auth':'error'); }
  finally{ syncing=false; if(again){ again=false; scheduleSync(500); } }
}
const SYNC_TXT={idle:'Preparando',syncing:'Sincronizando…',ok:'Sincronizado',pending:'Cambios pendientes',offline:'Sin internet: guardando en el dispositivo',auth:'Inicia sesión para sincronizar',error:'Error al sincronizar'};
function setSync(s){
  ST.sync.state=s;
  const b=$('#ikBtn'); if(b){ b.dataset.s=s; b.title='Ikigai · '+SYNC_TXT[s]; }
  if($('#ik-panel')) renderPanel();
}

/* ---------------- respaldos ---------------- */
async function makeBackup(kind){
  if(!ST.key||!ST.vault) return null;
  const docs={}; for(const [p,r] of ST.map) docs[p]={data:r.data,kt:r.kt};
  const created=new Date().toISOString();
  const raw=te.encode(JSON.stringify({app:'ikigai',v:1,created,docs}));
  const z=await gz(raw);
  const box=await encBytes(ST.key,z||raw);
  const text=JSON.stringify({app:'ikigai-respaldo',v:1,kind,created,z:!!z,kdf:{salt:ST.vault.salt,iter:ST.vault.iter},iv:box.iv,ct:box.ct});
  const id=created+'-'+kind, name='ikigai-'+created.slice(0,16).replace(/[:T]/g,'-')+'-'+kind+'.ikigai';
  let onDisk=false; try{ onDisk=await FILES.write(name,text); }catch(e){ console.warn('Respaldo en disco',e); }
  await idbPut('backups',{id,kind,created,size:text.length,keep:false,name,onDisk,file:text});
  if(kind==='auto') await setMeta('lastAutoBackup',Date.now());
  await rotate();
  return id;
}
async function rotate(){
  const all=(await idbAll('backups')).sort((a,b)=>b.created.localeCompare(a.created));
  const keep=new Set();
  all.filter(b=>b.keep).forEach(b=>keep.add(b.id));
  all.filter(b=>b.kind==='manual').slice(0,10).forEach(b=>keep.add(b.id));
  const autos=all.filter(b=>b.kind==='auto');
  autos.slice(0,6).forEach(b=>keep.add(b.id));
  const byMonth={}, byYear={};
  for(const b of autos){ byMonth[b.created.slice(0,7)]=b; byYear[b.created.slice(0,4)]=b; }
  Object.keys(byMonth).sort().reverse().slice(0,12).forEach(m=>keep.add(byMonth[m].id));
  Object.values(byYear).forEach(b=>keep.add(b.id));
  for(const b of all) if(!keep.has(b.id)){ await idbDel('backups',b.id); if(b.onDisk) await FILES.remove(b.name); }
}
async function openBackup(text,pass){
  const f=JSON.parse(text);
  if(!f||f.app!=='ikigai-respaldo') throw new Error('Ese archivo no es un respaldo de Ikigai.');
  let key=ST.key;
  if(!(ST.vault&&f.kdf&&f.kdf.salt===ST.vault.salt)){ if(!pass) throw Object.assign(new Error('needpass'),{needPass:true}); key=await deriveKey(pass,ub64(f.kdf.salt),f.kdf.iter); }
  let u8; try{ u8=await decBytes(key,{iv:f.iv,ct:f.ct}); }catch(_){ throw Object.assign(new Error('La frase no corresponde a ese respaldo.'),{needPass:true}); }
  if(f.z) u8=await gunz(u8);
  return JSON.parse(td.decode(u8));
}
async function replaceAll(docs){
  const paths=new Set([...ST.map.keys(),...Object.keys(docs)]);
  for(const p of paths){ const d=docs[p]; await write(p,d?clone(d.data!==undefined&&d.kt!==undefined?d.data:d):{}, {noSync:true}); }
  scheduleSync(300);
}
async function autoBackupCheck(){
  try{ const last=await getMeta('lastAutoBackup'); if(!last||Date.now()-last>=ST.settings.backupDays*864e5){ if(ST.map.size) await makeBackup('auto'); } }catch(e){ console.warn(e); }
}

/* ---------------- bloqueo por inactividad ---------------- */
let lastAct=Date.now();
['pointerdown','keydown','touchstart','wheel'].forEach(ev=>addEventListener(ev,()=>{ lastAct=Date.now(); },{passive:true,capture:true}));
function lockNow(){ location.reload(); }
setInterval(()=>{ if(ST.unlocked&&ST.settings.lockMin>0&&Date.now()-lastAct>ST.settings.lockMin*60000) lockNow(); },10000);
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible') return;
  if(ST.unlocked&&ST.settings.lockMin>0&&Date.now()-lastAct>ST.settings.lockMin*60000){ lockNow(); return; }
  scheduleSync(300);
});
addEventListener('online',()=>scheduleSync(300));
addEventListener('offline',()=>setSync('offline'));
setInterval(()=>{ if(document.visibilityState==='visible') scheduleSync(0); },60000);
setInterval(()=>{ if(ST.unlocked) autoBackupCheck(); },3600000);

/* =====================================================================
   Puerta de acceso
   ===================================================================== */
let gate=null;
function gateShow(html){
  if(!gate){ gate=document.createElement('div'); gate.id='ik-gate'; gate.setAttribute('role','dialog'); gate.setAttribute('aria-modal','true'); document.body.appendChild(gate); }
  gate.innerHTML=`<div class="ik-card"><div class="ik-logo" aria-hidden="true">生</div>${html}</div>`;
  const f=gate.querySelector('input'); if(f) setTimeout(()=>f.focus(),50);
}
function gateHide(){ if(gate){ gate.remove(); gate=null; } }
function gateErr(msg){ const e=gate&&gate.querySelector('.ik-err'); if(e){ e.textContent=msg||''; e.hidden=!msg; } }
function gateBusy(on,label){ const b=gate&&gate.querySelector('button[type=submit]'); if(b){ b.disabled=on; if(label) b.textContent=label; } }
function authMsg(e){
  const m=String(e&&e.message||e);
  if(/invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if(/email not confirmed/i.test(m)) return 'Ese correo no está confirmado en Supabase.';
  if(/invalid totp|invalid code|expired/i.test(m)) return 'Código incorrecto o vencido. Usa el código nuevo de Google Authenticator.';
  if(/rate limit|too many/i.test(m)) return 'Demasiados intentos. Espera un momento.';
  if(/fetch|network|Failed to fetch/i.test(m)) return 'Sin conexión con el servidor. Revisa tu internet.';
  return m;
}
function onSubmit(fn){ const form=gate.querySelector('form'); form.addEventListener('submit',async ev=>{ ev.preventDefault(); gateErr(''); try{ await fn(new FormData(form)); }catch(e){ console.error(e); gateErr(authMsg(e)); gateBusy(false); } }); }

let fails=0, waitUntil=0;
function showUnlock(){
  gateShow(`<h1>Ikigai</h1><p class="ik-sub">Escribe tu frase para abrir tus datos.</p>
    <form><label class="ik-f" for="ik-pass">Frase<input id="ik-pass" name="p" type="password" autocomplete="current-password" required></label>
    <p class="ik-err" role="alert" hidden></p><button class="btn primary lg block" type="submit">Abrir</button></form>
    <button type="button" class="ik-link" id="ik-forgot">¿Olvidaste la frase?</button>`);
  onSubmit(async fd=>{
    if(Date.now()<waitUntil){ gateErr(`Espera ${Math.ceil((waitUntil-Date.now())/1000)} s antes de intentar otra vez.`); return; }
    gateBusy(true,'Abriendo…');
    const key=await deriveKey(String(fd.get('p')),ub64(ST.vault.salt),ST.vault.iter);
    try{ const ok=await dec(key,ST.vault.check); if(ok!=='ikigai-ok') throw 0; }
    catch(_){ fails++; if(fails>=5) waitUntil=Date.now()+Math.min(300,15*2**(fails-5))*1000; gateBusy(false,'Abrir'); gateErr('Frase incorrecta.'); return; }
    ST.key=key; await afterUnlock();
  });
  $('#ik-forgot').addEventListener('click',showForgot);
}
function showForgot(){
  gateShow(`<h1>¿Olvidaste la frase?</h1><p class="ik-sub">La frase no se puede recuperar: es la que cifra tus datos en este dispositivo. Puedes borrar los datos de <b>este dispositivo</b> y volver a descargarlos de la nube. Necesitas internet, tu correo, tu contraseña y el código de Google Authenticator. Los cambios que no alcanzaron a sincronizarse se pierden.</p>
    <form><label class="ik-f" for="ik-conf">Escribe BORRAR para confirmar<input id="ik-conf" name="c" autocomplete="off" required></label>
    <p class="ik-err" role="alert" hidden></p><button class="btn danger lg block" type="submit">Borrar datos de este dispositivo</button></form>
    <button type="button" class="ik-link" id="ik-back">Volver</button>`);
  $('#ik-back').addEventListener('click',showUnlock);
  onSubmit(async fd=>{
    if(String(fd.get('c')).trim().toUpperCase()!=='BORRAR'){ gateErr('Escribe BORRAR para confirmar.'); return; }
    IDB.close(); await new Promise(r=>{ const d=indexedDB.deleteDatabase('ikigai'); d.onsuccess=d.onerror=d.onblocked=()=>r(); }); location.reload();
  });
}
function showLogin(opts){
  const first=!ST.vault;
  gateShow(`<h1>${first?'Bienvenido a Ikigai':'Inicia sesión'}</h1><p class="ik-sub">${first?'Entra con tu cuenta para descargar tus datos a este dispositivo.':'Para sincronizar con la nube, entra con tu cuenta.'}</p>
    ${navigator.onLine?'':'<p class="ik-warn">Estás sin internet. La primera vez necesitas conexión.</p>'}
    <form><label class="ik-f" for="ik-mail">Correo<input id="ik-mail" name="e" type="email" autocomplete="username" required></label>
    <label class="ik-f" for="ik-pw">Contraseña<input id="ik-pw" name="p" type="password" autocomplete="current-password" required></label>
    <p class="ik-err" role="alert" hidden></p><button class="btn primary lg block" type="submit">Entrar</button></form>
    ${opts&&opts.skippable?'<button type="button" class="ik-link" id="ik-skip">Seguir sin sincronizar</button>':''}`);
  const sk=$('#ik-skip'); if(sk) sk.addEventListener('click',()=>{ gateHide(); setSync(navigator.onLine?'auth':'offline'); });
  onSubmit(async fd=>{
    gateBusy(true,'Entrando…');
    const sb=initSB();
    const {data,error}=await sb.auth.signInWithPassword({email:String(fd.get('e')).trim(),password:String(fd.get('p'))});
    if(error) throw error;
    if(data&&data.session){ ST.uid=data.session.user.id; ST.email=data.session.user.email; }
    await mfaStep();
  });
}
async function mfaStep(){
  const sb=initSB();
  const {data:aal,error}=await sb.auth.mfa.getAuthenticatorAssuranceLevel(); if(error) throw error;
  const {data:fl,error:e2}=await sb.auth.mfa.listFactors(); if(e2) throw e2;
  const verified=(fl.totp||[]).filter(f=>f.status==='verified');
  if(aal.currentLevel==='aal2') return afterAuth();
  if(verified.length) return showMfaVerify(verified[0].id);
  for(const f of (fl.all||[])) if(f.factor_type==='totp'&&f.status!=='verified'){ try{ await sb.auth.mfa.unenroll({factorId:f.id}); }catch(_){} }
  const {data:en,error:e3}=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'Ikigai '+new Date().toISOString().slice(0,10),issuer:'Ikigai'});
  if(e3) throw e3;
  showMfaEnroll(en);
}
function showMfaEnroll(en){
  gateShow(`<h1>Activa el doble factor</h1><p class="ik-sub">Abre Google Authenticator, toca <b>+</b> y escanea este código. Si estás en el mismo celular, usa <b>Ingresar clave de configuración</b> con la clave de abajo.</p>
    <img class="ik-qr" alt="Código QR para Google Authenticator" src="${esc(en.totp.qr_code)}">
    <p class="ik-secret">${esc(en.totp.secret)}</p>
    <form><label class="ik-f" for="ik-code">Código de 6 dígitos<input id="ik-code" name="c" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required></label>
    <p class="ik-err" role="alert" hidden></p><button class="btn primary lg block" type="submit">Activar</button></form>`);
  onSubmit(async fd=>{
    gateBusy(true,'Verificando…');
    const {error}=await initSB().auth.mfa.challengeAndVerify({factorId:en.id,code:String(fd.get('c')).trim()});
    if(error) throw error;
    await afterAuth();
  });
}
function showMfaVerify(factorId){
  gateShow(`<h1>Código de verificación</h1><p class="ik-sub">Escribe el código de 6 dígitos que muestra Google Authenticator para Ikigai.</p>
    <form><label class="ik-f" for="ik-code">Código<input id="ik-code" name="c" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required></label>
    <p class="ik-err" role="alert" hidden></p><button class="btn primary lg block" type="submit">Verificar</button></form>`);
  onSubmit(async fd=>{
    gateBusy(true,'Verificando…');
    const {error}=await initSB().auth.mfa.challengeAndVerify({factorId,code:String(fd.get('c')).trim()});
    if(error) throw error;
    await afterAuth();
  });
}
function showSetPass(){
  gateShow(`<h1>Crea tu frase</h1><p class="ik-sub">Cifra tus datos en este dispositivo y tus respaldos. Usa la <b>misma frase en todos tus dispositivos</b> para poder restaurar respaldos en cualquiera.</p>
    <p class="ik-warn">No se puede recuperar. Guárdala en un lugar seguro.</p>
    <form><label class="ik-f" for="ik-n1">Frase (mínimo 10 caracteres)<input id="ik-n1" name="a" type="password" autocomplete="new-password" minlength="10" required></label>
    <label class="ik-f" for="ik-n2">Repítela<input id="ik-n2" name="b" type="password" autocomplete="new-password" minlength="10" required></label>
    <p class="ik-err" role="alert" hidden></p><button class="btn primary lg block" type="submit">Guardar frase</button></form>`);
  onSubmit(async fd=>{
    const a=String(fd.get('a')), b=String(fd.get('b'));
    if(a.length<10){ gateErr('Usa al menos 10 caracteres.'); return; }
    if(a!==b){ gateErr('Las dos frases no coinciden.'); return; }
    gateBusy(true,'Preparando…');
    const salt=rand(16), key=await deriveKey(a,salt,ITER);
    const vault={salt:b64(salt),iter:ITER,check:await enc(key,'ikigai-ok'),created:new Date().toISOString()};
    await setMeta('vault',vault); ST.vault=vault; ST.key=key;
    await flushAuth();
    gateShow('<h1>Descargando tus datos…</h1><p class="ik-sub">Un momento.</p>');
    try{ if(navigator.onLine&&ST.aal2) await pull(); }catch(e){ console.error(e); }
    await afterUnlock(true);
  });
}
async function afterAuth(){
  ST.aal2=true;
  try{ const {data:{session}}=await initSB().auth.getSession(); if(session){ ST.uid=session.user.id; ST.email=session.user.email; } }catch(_){}
  if(!ST.vault){ showSetPass(); return; }
  gateHide(); startRealtime(); scheduleSync(0);
}
async function afterUnlock(fresh){
  const s=await getMeta('settings'); if(s) Object.assign(ST.settings,s);
  if(!fresh) await loadAll();
  ST.unlocked=true; lastAct=Date.now();
  gateHide(); mountUI(); dbResolve(DB);
  if(!fresh&&navigator.onLine){
    const ok=await checkSession();
    if(ok){ startRealtime(); scheduleSync(0); }
    else showLogin({skippable:true});
  } else if(fresh){ startRealtime(); scheduleSync(0); }
  else setSync('offline');
  setTimeout(autoBackupCheck,60000);
}

/* =====================================================================
   Panel de Ikigai (sincronización, respaldos, seguridad)
   ===================================================================== */
function mountUI(){
  const top=$('.top-in');
  if(top&&!$('#ikBtn')){
    const b=document.createElement('button'); b.type='button'; b.id='ikBtn'; b.className='iconbtn ik-btn'; b.setAttribute('aria-label','Ikigai: sincronización, respaldos y seguridad');
    b.innerHTML='<span aria-hidden="true">生</span><i aria-hidden="true"></i>';
    b.addEventListener('click',openPanel);
    const gear=top.querySelector('a.iconbtn'); if(gear) top.insertBefore(b,gear); else top.appendChild(b);
  }
  setSync(navigator.onLine?ST.sync.state:'offline');
}
let panelBackups=[];
async function openPanel(){ panelBackups=(await idbAll('backups')).sort((a,b)=>b.created.localeCompare(a.created)); renderPanel(true); }
function closePanel(){ const p=$('#ik-panel'); if(p) p.remove(); }
function renderPanel(open){
  let wrap=$('#ik-panel');
  if(!wrap&&!open) return;
  if(!wrap){ wrap=document.createElement('div'); wrap.id='ik-panel'; wrap.className='sheet-wrap'; wrap.addEventListener('click',e=>{ if(e.target===wrap) closePanel(); }); document.body.appendChild(wrap); }
  const s=ST.sync, total=panelBackups.reduce((a,b)=>a+(b.size||0),0);
  const rows=panelBackups.map(b=>`<div class="ik-bk"><div><b>${esc(fmtDate(b.created))}</b><span class="ik-tag ik-${b.kind}">${b.kind==='auto'?'automático':'manual'}</span>${b.keep?'<span class="ik-tag ik-keep">conservar</span>':''}<div class="ik-mini">${fmtSize(b.size||0)}${b.onDisk?' · también en '+esc(FILES.dirLabel):''}</div></div>
    <div class="ik-bk-a"><button type="button" class="btn sm" data-ik="keep" data-id="${esc(b.id)}" aria-pressed="${!!b.keep}" title="Conservar siempre">${b.keep?'★':'☆'}</button><button type="button" class="btn sm" data-ik="dl" data-id="${esc(b.id)}">Descargar</button><button type="button" class="btn sm" data-ik="restore" data-id="${esc(b.id)}">Restaurar</button></div></div>`).join('')||'<p class="ik-mini">Todavía no hay respaldos.</p>';
  wrap.innerHTML=`<div class="sheet ik-sheet" role="dialog" aria-modal="true" aria-label="Ikigai">
    <div class="sheet-h"><h2>Ikigai</h2><button type="button" class="iconbtn" data-ik="close" aria-label="Cerrar">✕</button></div>
    <section class="ik-sec"><h3>Nube</h3>
      <p class="ik-state" data-s="${s.state}"><i></i>${esc(SYNC_TXT[s.state]||'')}</p>
      <p class="ik-mini">${s.last?'Última sincronización: '+esc(fmtDate(s.last)):'Aún no sincroniza en este dispositivo.'}${pendingCount()?' · '+pendingCount()+' cambios por subir':''}${s.err&&s.state==='error'?'<br>Detalle: '+esc(s.err):''}</p>
      <div class="row">${ST.aal2?'<button type="button" class="btn primary sm" data-ik="sync">Sincronizar ahora</button>':'<button type="button" class="btn primary sm" data-ik="login">Iniciar sesión</button>'}</div>
      ${ST.email?`<p class="ik-mini">Cuenta: ${esc(ST.email)}</p>`:''}</section>
    <section class="ik-sec"><h3>Respaldos</h3>
      <p class="ik-mini">Cifrados con tu frase. Se conservan los últimos 6 automáticos, 1 por mes durante un año, 1 por año para siempre y los últimos 10 manuales. Los marcados ★ nunca se borran.${FILES.dirLabel?' Copia en '+esc(FILES.dirLabel)+'.':''}</p>
      <div class="row"><label class="ik-inline" for="ik-days">Automático cada <select id="ik-days" class="in"><option value="15"${ST.settings.backupDays===15?' selected':''}>15 días</option><option value="20"${ST.settings.backupDays===20?' selected':''}>20 días</option></select></label>
      <button type="button" class="btn primary sm" data-ik="backup">Respaldar ahora</button></div>
      <div class="ik-bks">${rows}</div><p class="ik-mini">Espacio usado: ${fmtSize(total)}</p>
      <label class="btn sm ik-file" for="ik-restore-file">Restaurar desde un archivo .ikigai<input type="file" id="ik-restore-file" accept=".ikigai,application/json"></label></section>
    <section class="ik-sec"><h3>Traer datos de Quincena</h3>
      <p class="ik-mini">Elige el archivo organizador-datos que descargaste de Quincena (Entreno → Ajustes). Después bórralo de tu dispositivo.</p>
      <label class="btn sm ik-file" for="ik-import-file">Importar archivo de Quincena<input type="file" id="ik-import-file" accept=".json,application/json"></label></section>
    <section class="ik-sec"><h3>Seguridad</h3>
      <div class="row"><label class="ik-inline" for="ik-lock">Bloquear tras <select id="ik-lock" class="in">${[1,2,5,10,30].map(m=>`<option value="${m}"${ST.settings.lockMin===m?' selected':''}>${m} min</option>`).join('')}</select> sin uso</label></div>
      <div class="row"><button type="button" class="btn sm" data-ik="lock">Bloquear ahora</button>${ST.uid?'<button type="button" class="btn sm danger" data-ik="logout">Cerrar sesión</button>':''}</div></section>
    <p class="ik-mini">Ikigai ${VERSION} · ${PLATFORM_NAME}</p></div>`;
}
document.addEventListener('click',async ev=>{
  const a=ev.target.closest('[data-ik]'); if(!a) return;
  const act=a.dataset.ik, id=a.dataset.id;
  try{
    if(act==='close') closePanel();
    else if(act==='sync'){ await syncNow(); }
    else if(act==='login'){ closePanel(); showLogin({skippable:true}); }
    else if(act==='backup'){ a.disabled=true; await makeBackup('manual'); toast('Respaldo creado'); await openPanel(); }
    else if(act==='keep'){ const b=await idbGet('backups',id); if(b){ b.keep=!b.keep; await idbPut('backups',b); await rotate(); await openPanel(); } }
    else if(act==='dl'){ const b=await idbGet('backups',id); if(b) await DOWNLOADS.save({filename:b.name,data:b.file}); }
    else if(act==='restore'){ const b=await idbGet('backups',id); if(b) await restoreFrom(b.file,fmtDate(b.created)); }
    else if(act==='lock') lockNow();
    else if(act==='logout'){ if(confirmBox('¿Cerrar sesión en este dispositivo? Tus datos locales siguen cifrados aquí; para volver a sincronizar tendrás que entrar de nuevo.')){ await ST.sb.auth.signOut({scope:'local'}); ST.aal2=false; ST.uid=null; ST.email=null; renderPanel(); } }
  }catch(e){ console.error(e); toast('Error: '+errMsg(e)); }
});
document.addEventListener('change',async ev=>{
  const el=ev.target;
  try{
    if(el.id==='ik-days'){ ST.settings.backupDays=+el.value; await setMeta('settings',ST.settings); toast('Respaldo automático cada '+el.value+' días'); }
    else if(el.id==='ik-lock'){ ST.settings.lockMin=+el.value; await setMeta('settings',ST.settings); }
    else if(el.id==='ik-import-file'&&el.files&&el.files[0]){ await importQuincena(await el.files[0].text()); el.value=''; }
    else if(el.id==='ik-restore-file'&&el.files&&el.files[0]){ await restoreFrom(await el.files[0].text(),el.files[0].name); el.value=''; }
  }catch(e){ console.error(e); toast('Error: '+errMsg(e)); }
});
function confirmBox(msg){ return window.confirm(msg); }
async function importQuincena(text){
  let j; try{ j=JSON.parse(text); }catch(_){ throw new Error('El archivo no es válido.'); }
  if(!j||!isObj(j.docs)) throw new Error('Ese no es el archivo de datos de Quincena.');
  const n=Object.keys(j.docs).length;
  if(!confirmBox(`Se van a importar ${n} documentos (finanzas y entreno). Si ya tienes datos con el mismo nombre, se reemplazan. ¿Continuar?`)) return;
  for(const [p,d] of Object.entries(j.docs)){ if(typeof p==='string'&&/^[\w-]+\/[\w-]+$/.test(p)&&isObj(d)) await write(p,clone(d),{noSync:true}); }
  scheduleSync(300); await makeBackup('manual');
  toast(`Listo: ${n} documentos importados. Borra el archivo de tu dispositivo.`);
  closePanel(); setTimeout(()=>location.reload(),1500);
}
async function restoreFrom(text,label){
  let data;
  try{ data=await openBackup(text); }
  catch(e){ if(!e.needPass) throw e; const p=window.prompt('Ese respaldo se hizo con otra frase. Escríbela:'); if(!p) return; data=await openBackup(text,p); }
  if(!confirmBox(`Restaurar el respaldo (${label}) reemplaza tus datos actuales en este dispositivo y en la nube. Antes se crea un respaldo de lo que tienes ahora. ¿Continuar?`)) return;
  await makeBackup('manual');
  await replaceAll(data.docs||{});
  toast('Respaldo restaurado'); closePanel(); setTimeout(()=>location.reload(),1500);
}

/* =====================================================================
   Arranque
   ===================================================================== */
window.claude=Object.freeze({use:name=>{
  if(name==='db') return dbReady;
  if(name==='user') return dbReady.then(()=>USER);
  if(name==='downloads') return Promise.resolve(DOWNLOADS);
  return Promise.resolve(null);   // sin IA dentro de la app
}});

async function boot(){
  if(!window.crypto||!crypto.subtle||!window.indexedDB){ gateShow('<h1>Navegador no compatible</h1><p class="ik-sub">Ikigai necesita un navegador moderno (Chrome, Edge o Firefox actualizados).</p>'); return; }
  if(!CFG.url||!CFG.key||!window.supabase){ gateShow('<h1>Falta configuración</h1><p class="ik-sub">No se encontró la conexión con Supabase (ikigai/config.js).</p>'); return; }
  try{ await idbOpen(); }catch(e){ gateShow(`<h1>No se pudo abrir Ikigai</h1><p class="ik-sub">${esc(errMsg(e))}</p>`); return; }
  try{ if(navigator.storage&&navigator.storage.persist) navigator.storage.persist(); }catch(_){}
  ST.vault=await getMeta('vault');
  if(ST.vault) showUnlock(); else showLogin();
}
if(PLATFORM==='web'&&'serviceWorker' in navigator&&location.protocol==='https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
