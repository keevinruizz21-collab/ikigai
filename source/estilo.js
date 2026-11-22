/* Estilo: módulo de imagen personal dentro de Ikigai.
   Se registra en window.QZ.EXT (vistas) y window.QZ.STY (navegación), y guarda en la misma base de datos:
   sty/main     → outfit actual (cur), outfits guardados (items) y meta de ahorro enlazada (meta)
   styitem/<id> → cada prenda: nombre, categoría, color, estado (tengo / quiero), precio, tienda,
                  prioridad, notas y foto comprimida (WebP/JPEG de máximo 520 px). */
(function(){
'use strict';
const QZ=window.QZ;
if(!QZ||!QZ.EXT||!QZ.S) return;
const S=QZ.S, EXT=QZ.EXT;
const esc=QZ.esc||(s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const NF=new Intl.NumberFormat('es-CO');
const money=n=>'$'+NF.format(Math.round(+n||0));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const clone=o=>JSON.parse(JSON.stringify(o));
const pad=n=>String(n).padStart(2,'0');
const today=()=>{ const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const isImg=s=>typeof s==='string'&&/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(s);

/* ---------------- íconos ---------------- */
const YIC={
  sty:'<svg viewBox="0 0 24 24"><path d="M12 7.4V6.6a1.9 1.9 0 1 1 1.9-1.9"/><path d="M12 7.4 3.3 13.8a1.3 1.3 0 0 0 .8 2.3h15.8a1.3 1.3 0 0 0 .8-2.3z"/></svg>',
  body:'<svg viewBox="0 0 24 24"><circle cx="12" cy="4.6" r="2.1"/><path d="M8.2 8.6h7.6l1.4 6.2h-2.4L14 21h-4l-.8-6.2H6.8z"/></svg>',
  lib:'<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
  bag:'<svg viewBox="0 0 24 24"><path d="M5 8.5h14l-1 12H6z"/><path d="M9 10.5v-4a3 3 0 0 1 6 0v4"/></svg>',
  book:'<svg viewBox="0 0 24 24"><path d="M5 5.5a2 2 0 0 1 2-2h12v14H7a2 2 0 0 0-2 2z"/><path d="M5 19.5a2 2 0 0 0 2 2h12v-4"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  cam:'<svg viewBox="0 0 24 24"><path d="M4 8h3l1.6-2.5h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.4"/></svg>',
  x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  trash:'<svg viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/></svg>',
  ok:'<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>',
  save:'<svg viewBox="0 0 24 24"><path d="M6 4h9.5L19 7.5V20H6z"/><path d="M9 4v5h6M9 20v-6h7v6"/></svg>',
  spark:'<svg viewBox="0 0 24 24"><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1-5.1-1.9 5.1-1.9z"/></svg>'
};
const yic=(n,cls)=>`<span class="ic${cls?' '+cls:''}" aria-hidden="true">${YIC[n]||''}</span>`;

/* ---------------- colores (paleta para su tono de piel) ---------------- */
const PAL=[
  {id:'negro',n:'Negro',h:'#151515',g:'base'},
  {id:'carbon',n:'Gris carbón',h:'#3A3C40',g:'base'},
  {id:'gris',n:'Gris medio',h:'#8C8E92',g:'base'},
  {id:'blanco',n:'Blanco roto',h:'#F2EEE6',g:'base'},
  {id:'marino',n:'Azul marino',h:'#1F2B45',g:'base'},
  {id:'denim',n:'Denim oscuro',h:'#2F4567',g:'base'},
  {id:'denimc',n:'Denim claro',h:'#8AA3C3',g:'acento'},
  {id:'beige',n:'Beige',h:'#D4C7B0',g:'tierra'},
  {id:'cafe',n:'Café oscuro',h:'#4C3528',g:'tierra'},
  {id:'oliva',n:'Verde oliva',h:'#5B6135',g:'tierra'},
  {id:'vino',n:'Vino',h:'#6E2030',g:'acento'},
  {id:'rey',n:'Azul rey',h:'#2A4BB0',g:'acento'},
  {id:'plata',n:'Plata',h:'#BFC3C8',g:'metal'},
  {id:'dorado',n:'Dorado',h:'#C8A24A',g:'metal'}
];
const PALM=Object.fromEntries(PAL.map(p=>[p.id,p]));
const CARE=[['Rosa pastel','#F4C6CF'],['Lila','#CDBDE8'],['Menta','#B7E3CF'],['Amarillo mantequilla','#F5E6A3'],['Durazno','#F6C3A5'],['Neón','#C6FF2E']];
const rgb=h=>{ h=String(h||'').replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return isNaN(n)||h.length!==6?[128,128,128]:[n>>16&255,n>>8&255,n&255]; };
const hex=a=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();
function Lstar(h){ const y=rgb(h).map(v=>{ v/=255; return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4); }); const Y=.2126*y[0]+.7152*y[1]+.0722*y[2]; return Y>.008856?116*Math.cbrt(Y)-16:903.3*Y; }
function hsl(h){ const [r,g,b]=rgb(h).map(v=>v/255), mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2; let s=0; if(mx!==mn){ const d=mx-mn; s=l>.5?d/(2-mx-mn):d/(mx+mn); } return {s,l}; }
function dist(a,b){ const x=rgb(a), y=rgb(b), rm=(x[0]+y[0])/2; return Math.sqrt((2+rm/256)*(x[0]-y[0])**2+4*(x[1]-y[1])**2+(2+(255-rm)/256)*(x[2]-y[2])**2); }
function nearest(h,metal){ let best=PAL[0], bd=1e9; for(const p of PAL){ if(!metal&&p.g==='metal') continue; const d=dist(h,p.h); if(d<bd){ bd=d; best=p; } } return {p:best,d:bd}; }
function kind(col,pc){
  if(pc&&PALM[pc]) return PALM[pc].g;
  const {s,l}=hsl(col);
  if(l>.72&&s>.35) return 'pastel';
  if(s>.85&&l>.42&&l<.72) return 'neon';
  const n=nearest(col,true); if(n.d<70) return n.p.g;
  return s<.15?'base':'acento';
}
const colName=(col,pc)=>PALM[pc]?PALM[pc].n:(nearest(col).d<70?'Tipo '+nearest(col).p.n.toLowerCase():'Color propio');

/* ---------------- categorías y combinaciones ---------------- */
const CATS=[
  {id:'cabeza',n:'Cabeza',sh:'Gorra',hint:'Gorras y gorros'},
  {id:'torso',n:'Camisetas y camisas',sh:'Camiseta',hint:'Camisetas, camisas, tejidos'},
  {id:'chaqueta',n:'Chaquetas y buzos',sh:'Chaqueta',hint:'Chaquetas, buzos, sobrecamisas'},
  {id:'pantalon',n:'Pantalones',sh:'Pantalón',hint:'Jeans, cargo, pantalón'},
  {id:'zapatos',n:'Zapatos',sh:'Tenis',hint:'Tenis y botas'},
  {id:'accesorio',n:'Accesorios',sh:'Accesorio',hint:'Cadena, reloj, anillos, bolso'}
];
const CATM=Object.fromEntries(CATS.map(c=>[c.id,c]));
const PRIO={a:'Alta',m:'Media',b:'Baja'};
const SCH=[
  {id:'dark',n:'Dark urban',d:'Salidas y noche',s:{cabeza:'negro',torso:'negro',chaqueta:'negro',pantalon:'negro',zapatos:'blanco',accesorio:'plata'}},
  {id:'bn',n:'Blanco y negro',d:'Diario y U',s:{torso:'blanco',chaqueta:'negro',pantalon:'negro',zapatos:'blanco',accesorio:'plata'}},
  {id:'oliva',n:'Oliva urbano',d:'Diario',s:{torso:'negro',chaqueta:'oliva',pantalon:'negro',zapatos:'blanco',accesorio:'plata'}},
  {id:'tierra',n:'Tierra',d:'Fin de semana',s:{torso:'beige',chaqueta:'cafe',pantalon:'denim',zapatos:'blanco',accesorio:'plata'}},
  {id:'marino',n:'Marino',d:'Trabajo y clientes',s:{torso:'blanco',chaqueta:'marino',pantalon:'carbon',zapatos:'blanco',accesorio:'plata'}},
  {id:'gris',n:'Gris tonal',d:'Diario, te alarga',s:{torso:'gris',chaqueta:'carbon',pantalon:'carbon',zapatos:'blanco',accesorio:'plata'}},
  {id:'vino',n:'Acento vino',d:'Salidas',s:{torso:'vino',chaqueta:'negro',pantalon:'negro',zapatos:'negro',accesorio:'plata'}}
];

/* ---------------- estado y datos ---------------- */
const Y={started:false,ready:false,demo:false,slow:false,err:null,items:{},main:{cur:{},items:{},meta:''},
  cat:'all',st:'all',sheet:null,edit:null,busy:false,lastView:'estilo',oname:'',mode:'doll'};
let dbRef=null;

function normMain(d){
  const m=Object.assign({cur:{},items:{},meta:''},d||{});
  if(!m.cur||typeof m.cur!=='object') m.cur={};
  if(!m.items||typeof m.items!=='object') m.items={};
  if(typeof m.meta!=='string') m.meta='';
  return m;
}
function normItem(v){
  const it={n:String(v.n||'Prenda').slice(0,80),c:CATM[v.c]?v.c:'torso',col:/^#[0-9A-Fa-f]{6}$/.test(v.col||'')?v.col:'#8C8E92',
    st:v.st==='quiero'?'quiero':'tengo',ts:+v.ts||Date.now(),cr:+v.cr||+v.ts||Date.now()};
  if(PALM[v.pc]) it.pc=v.pc;
  if(+v.p>0) it.p=Math.round(+v.p);
  if(v.t) it.t=String(v.t).slice(0,300);
  if(PRIO[v.pr]) it.pr=v.pr;
  if(v.no) it.no=String(v.no).slice(0,400);
  if(isImg(v.img)) it.img=v.img;
  if(v.bo) it.bo=String(v.bo).slice(0,10);
  return it;
}
function seedDemo(){
  const mk=(n,c,pc,st,extra)=>{ const id=uid(); Y.items[id]=normItem(Object.assign({n,c,col:PALM[pc].h,pc,st,ts:Date.now()},extra||{})); return id; };
  mk('Camiseta tejida blanca','torso','blanco','tengo');
  mk('Jean negro bota recta','pantalon','negro','tengo');
  mk('Chaqueta zip negra','chaqueta','negro','tengo');
  mk('Gorra negra','cabeza','negro','tengo');
  mk('Cadena plata','accesorio','plata','tengo');
  mk('Chaqueta trucker oliva','chaqueta','oliva','quiero',{p:159900,pr:'a',t:'Tienda del centro'});
  mk('Tenis blancos','zapatos','blanco','quiero',{p:229900,pr:'a'});
  mk('Jean azul oscuro bota recta','pantalon','denim','quiero',{p:119900,pr:'m'});
  mk('Camiseta negra fit','torso','negro','quiero',{p:49900,pr:'b'});
  applyScheme('bn',true);
}
function ensure(){
  if(Y.started) return;
  if(S.mode==='demo'){ Y.started=true; Y.demo=true; seedDemo(); Y.ready=true; return; }
  if(S.mode!=='live'||!S.cap||!S.cap.db) return;
  Y.started=true; dbRef=S.cap.db;
  const got={main:false,items:false};
  const timer=setTimeout(()=>{ if(!Y.ready){ Y.slow=true; QZ.scheduleRender(); } },10000);
  const done=()=>{ if(got.main&&got.items&&!Y.ready){ clearTimeout(timer); Y.ready=true; Y.slow=false; } QZ.scheduleRender(); };
  const onErr=e=>{ Y.err=(e&&e.code)||'unavailable'; QZ.scheduleRender(); };
  try{
    dbRef.doc('sty/main').onSnapshot(s=>{ got.main=true; Y.main=normMain(s.exists?s.data():null); done(); },onErr);
    dbRef.collection('styitem').onSnapshot(s=>{ got.items=true; const I={}; for(const d of s.docs){ const v=d.data(); if(v&&v.n) I[d.id]=normItem(v); } Y.items=I; done(); },onErr);
  }catch(e){ onErr(e); }
}
function fail(e){ QZ.toast(e&&e.code==='quota_exceeded'?'Se llenó el espacio de datos de la app.':'No se pudo guardar. Revisa tu conexión e intenta de nuevo.'); }
function saveMain(){
  QZ.scheduleRender();
  if(Y.demo||!dbRef) return;
  const snap=clone(Y.main);
  QZ.enqueue('sty/main',()=>QZ.withRetry(()=>dbRef.doc('sty/main').set(snap))).catch(fail);
}
function saveItem(id,it){
  Y.items[id]=it; QZ.scheduleRender();
  if(Y.demo||!dbRef) return;
  const path='styitem/'+id, snap=clone(it);
  QZ.enqueue(path,()=>QZ.withRetry(()=>dbRef.doc(path).set(snap))).catch(fail);
}
function delItem(id){
  const it=Y.items[id]; if(!it) return;
  delete Y.items[id];
  let touched=false;
  for(const [k,v] of Object.entries(Y.main.cur)) if(v&&v.i===id){ Y.main.cur[k]={c:it.col,pc:it.pc}; touched=true; }
  for(const o of Object.values(Y.main.items)) for(const [k,v] of Object.entries(o.s||{})) if(v&&v.i===id){ o.s[k]={c:it.col,pc:it.pc}; touched=true; }
  if(touched) saveMain(); else QZ.scheduleRender();
  if(Y.demo||!dbRef) return;
  const path='styitem/'+id;
  QZ.enqueue(path,()=>QZ.withRetry(()=>dbRef.doc(path).delete())).catch(fail);
}

/* ---------------- outfit: lectura y combinaciones ---------------- */
function slotInfo(slot,src){
  const v=(src||Y.main.cur)[slot]; if(!v) return null;
  const it=v.i&&Y.items[v.i];
  if(it) return {it,id:v.i,col:it.col,pc:it.pc,name:it.n};
  if(v.c&&/^#[0-9A-Fa-f]{6}$/.test(v.c)) return {col:v.c,pc:v.pc,name:colName(v.c,v.pc)};
  return null;
}
function matchItem(cat,p){
  let best=null, score=-1;
  for(const [id,it] of Object.entries(Y.items)){
    if(it.c!==cat) continue;
    if(!(it.pc===p.id||dist(it.col,p.h)<60)) continue;
    const s=(it.st==='tengo'?2:1)+(it.pc===p.id?.5:0);
    if(s>score){ score=s; best=id; }
  }
  return best;
}
function applyScheme(id,quiet){
  const sc=SCH.find(x=>x.id===id); if(!sc) return;
  const cur={};
  for(const c of CATS){ const p=PALM[sc.s[c.id]]; if(!p) continue; const it=matchItem(c.id,p); cur[c.id]=it?{i:it}:{c:p.h,pc:p.id}; }
  Y.main.cur=cur; Y.main.sc=id;
  if(!quiet){ saveMain(); QZ.toast(`Combinación ${sc.n} aplicada`); }
}
function analyze(){
  const top=slotInfo('torso'), jac=slotInfo('chaqueta'), pan=slotInfo('pantalon'), sho=slotInfo('zapatos'), cap=slotInfo('cabeza'), acc=slotInfo('accesorio');
  const out=[];
  if(!top||!pan||!sho){ out.push({t:'info',h:'Arma el outfit',d:'Toca las partes del muñeco o aplica una combinación. Con camiseta, pantalón y tenis te doy la lectura.'}); return out; }
  const main=[cap,top,jac,pan,sho].filter(Boolean);
  const strong=main.filter(x=>['acento','pastel','neon'].includes(kind(x.col,x.pc)));
  if(!strong.length) out.push({t:'good',h:'Base neutra',d:'Todo combina con todo. Si quieres un punto de interés, usa un solo acento: vino, azul rey o denim claro.'});
  else if(strong.length===1) out.push({t:'good',h:'Un solo acento',d:`${strong[0].name} es el protagonista y lo demás lo acompaña: se ve intencional.`});
  else out.push({t:'warn',h:`${strong.length} colores fuertes`,d:'Compiten entre sí. Deja uno y pasa los demás a negro, gris, blanco roto, beige u oliva.'});
  if(main.some(x=>['pastel','neon'].includes(kind(x.col,x.pc)))) out.push({t:'warn',h:'Pastel o neón',d:'No es que no te quede: rompe la estética urbana que buscas. Si lo usas, que sea en una prenda pequeña.'});
  const waist=jac||top, dw=Math.abs(Lstar(waist.col)-Lstar(pan.col));
  if(dw<20) out.push({t:'good',h:'Línea vertical continua',d:'Arriba y abajo en tonos cercanos: te alarga y te hace ver más alto.'});
  else if(dw>55) out.push({t:'warn',h:'Corte fuerte en la cintura',d:jac?'La chaqueta y el pantalón contrastan mucho y te parten en dos. Prueba una chaqueta del tono del pantalón.':'Camiseta y pantalón muy contrastados te parten en dos. Súmale una chaqueta del color del pantalón o tenis del mismo tono del pantalón.'});
  else out.push({t:'info',h:'Contraste medio en la cintura',d:'Funciona. Para verte más alto, repite el color del pantalón en la chaqueta o en los tenis.'});
  const ds=Math.abs(Lstar(sho.col)-Lstar(pan.col));
  if(ds<15) out.push({t:'good',h:'Tenis del tono del pantalón',d:'Extiende la pierna: suma estatura visual.'});
  else if(Lstar(sho.col)>85) out.push({t:'good',h:'Tenis claros',d:'El clásico streetwear. Mantenlos limpios: unos tenis blancos sucios dañan todo el outfit.'});
  const allDark=[top,jac,pan].filter(Boolean).every(x=>Lstar(x.col)<30);
  if(allDark&&Lstar(sho.col)<70&&!(acc&&Lstar(acc.col)>70)) out.push({t:'info',h:'Todo oscuro',d:'Dark urban total. Dale un punto de luz: cadena plata o tenis blancos.'});
  if(!acc) out.push({t:'info',h:'Sin accesorio',d:'Una cadena plata discreta o el reloj terminan el look.'});
  else if(acc.pc==='dorado'||(!acc.pc&&nearest(acc.col,true).p.id==='dorado')) out.push({t:'info',h:'Metal dorado',d:'Tus aretes y la cadena son plata: mantén un solo metal en el mismo outfit.'});
  return out;
}
function gaps(){
  const g=[];
  for(const c of CATS){ const v=Y.main.cur[c.id]; if(!v) continue; const s=slotInfo(c.id); if(!s) continue;
    if(!s.it) g.push({slot:c.id,col:s.col,pc:s.pc,label:gapName(c.id,s.col,s.pc),state:'none'});
    else if(s.it.st==='quiero') g.push({slot:c.id,id:s.id,label:s.it.n,state:'quiero',p:s.it.p}); }
  return g;
}

/* ---------------- muñeco ---------------- */
const SKIN='#BC8E6B', HAIR='#1C1512';
function doll(){
  const I=s=>slotInfo(s);
  const fill=x=>x?`fill="${esc(x.col)}" class="st-p on"`:'class="st-p off"';
  const lbl=(slot,x)=>`${CATM[slot].sh}: ${x?x.name:'vacío'}. Cambiar`;
  const grp=(slot,x,inner)=>`<g class="st-hit" data-sa="slot" data-s="${slot}" role="button" tabindex="0" aria-label="${esc(lbl(slot,x))}">${inner}</g>`;
  const cap=I('cabeza'), top=I('torso'), jac=I('chaqueta'), pan=I('pantalon'), sho=I('zapatos'), acc=I('accesorio');
  const hair=`<path d="M88 46C86 24 134 22 132 44C127 37 120 33 110 34C100 34 93 38 88 46Z" fill="${HAIR}"/>`;
  const capS=cap?`<path ${fill(cap)} d="M87 44C87 20 133 20 133 44Z"/><path ${fill(cap)} d="M86 44Q110 39 149 46Q124 53 86 49Z"/>`
    :`${hair}<path class="st-p ghost" d="M87 44C87 20 133 20 133 44Z"/>`;
  const jacS=jac?`<path ${fill(jac)} d="M72 87L56 124L53 236L68 236L72 150L77 138Z"/><path ${fill(jac)} d="M148 87L164 124L167 236L152 236L148 150L143 138Z"/>
      <path ${fill(jac)} d="M100 80L72 87L77 138L76 216L104 216L104 98Z"/><path ${fill(jac)} d="M120 80L148 87L143 138L144 216L116 216L116 98Z"/>
      <path ${fill(jac)} d="M98 79Q110 85 122 79L121 86Q110 92 99 86Z"/>`
    :`<path class="st-p ghost" d="M100 80L72 87L56 124L53 236L68 236L72 150L76 140L76 216L104 216L104 98Z"/><path class="st-p ghost" d="M120 80L148 87L164 124L167 236L152 236L148 150L144 140L144 216L116 216L116 98Z"/>`;
  const accS=acc?`<path d="M100 84Q110 101 120 84" fill="none" stroke="${esc(acc.col)}" stroke-width="2.4" class="st-ch"/><rect x="54" y="228" width="15" height="7" rx="2" fill="${esc(acc.col)}" class="st-p on"/>`
    :`<path d="M100 84Q110 101 120 84" class="st-p ghost" fill="none"/><rect x="54" y="228" width="15" height="7" rx="2" class="st-p ghost"/>`;
  return `<svg class="st-svg" viewBox="0 0 220 410" role="group" aria-label="Muñeco con tu outfit">
    <ellipse cx="110" cy="397" rx="58" ry="6" class="st-shadow"/>
    ${jac?'':`<path d="M59 122L73 128L71 196L67 240L56 240L57 196Z" fill="${SKIN}"/><path d="M161 122L147 128L149 196L153 240L164 240L163 196Z" fill="${SKIN}"/>`}
    <circle cx="61.5" cy="246" r="6.5" fill="${SKIN}"/><circle cx="158.5" cy="246" r="6.5" fill="${SKIN}"/>
    <rect x="102" y="64" width="16" height="22" rx="4" fill="${SKIN}"/>
    <circle cx="88" cy="50" r="4" fill="${SKIN}"/><circle cx="132" cy="50" r="4" fill="${SKIN}"/><circle cx="110" cy="48" r="22" fill="${SKIN}"/>
    ${grp('pantalon',pan,`<path ${fill(pan)} d="M78 210L142 210L144 236L139 376L114 376L111 252L109 252L106 376L81 376L76 236Z"/><path class="st-ln" d="M78 218H142M110 218V250"/>`)}
    ${grp('zapatos',sho,`<path ${fill(sho)} d="M80 374L107 374L108 386Q108 392 102 392L72 392Q66 392 68 386Q71 379 80 374Z"/><path ${fill(sho)} d="M140 374L113 374L112 386Q112 392 118 392L148 392Q154 392 152 386Q149 379 140 374Z"/>`)}
    ${grp('torso',top,`<path ${fill(top)} d="M100 82L72 88L58 122L73 128L77 138L78 214L142 214L143 138L147 128L162 122L148 88L120 82Q110 93 100 82Z"/>`)}
    ${grp('chaqueta',jac,jacS)}
    ${grp('cabeza',cap,capS)}
    ${grp('accesorio',acc,`${accS}<path d="M100 84Q110 101 120 84M54 231H69" class="st-hl"/>`)}
  </svg>`;
}
/* vista "Fotos": el outfit armado con las fotos de tus prendas, en el orden del cuerpo */
function flat(){
  const cell=slot=>{ const s=slotInfo(slot), c=CATM[slot];
    const inner=s?(s.it&&s.it.img?`<img src="${s.it.img}" alt="" decoding="async">`:`<span class="st-fc" style="background:${esc(s.col)}"></span>`):`<span class="st-fe">${yic('plus')}</span>`;
    return `<button type="button" class="st-fl st-fl-${slot}${s&&s.it&&s.it.img?' ph':''}" data-sa="slot" data-s="${slot}" aria-label="${esc(c.sh)}: ${esc(s?s.name:'vacío')}. Cambiar">${inner}<span class="st-fn">${esc(s?s.name:c.sh)}</span></button>`; };
  const n=CATS.filter(c=>{ const s=slotInfo(c.id); return s&&s.it&&s.it.img; }).length;
  return `<div class="st-flat">${['cabeza','accesorio','chaqueta','torso','pantalon','zapatos'].map(cell).join('')}</div>
    <p class="xs muted" style="margin-top:10px">${n?`${n} de 6 partes con foto.`:'Aún no hay fotos en este outfit.'} Las partes sin foto muestran su color; toca cualquiera para cambiarla.</p>`;
}
function swatch(col,cls){ return `<span class="st-sw${cls?' '+cls:''}" style="background:${esc(col)}"></span>`; }
function thumb(it,col){
  if(it&&it.img) return `<span class="st-th"><img src="${it.img}" alt="" loading="lazy" decoding="async"></span>`;
  return `<span class="st-th np" style="background:${esc(col||'transparent')}"></span>`;
}
const gapName=(slot,col,pc)=>PALM[pc]?`${CATM[slot].sh} color ${PALM[pc].n.toLowerCase()}`:`${CATM[slot].sh} (${colName(col,pc).toLowerCase()})`;

/* ---------------- vistas ---------------- */
function guard(){
  ensure();
  if(Y.err&&!Y.ready) return `<div class="view st"><div class="banner crit">No se pudieron cargar tus prendas (${esc(Y.err)}). Recarga la app.</div></div>`;
  if(!Y.ready) return `<div class="view st"><div class="loading"><span class="thinking"><i></i>Cargando tu clóset…</span>${Y.slow?'<p class="small">Está tardando más de lo normal.</p>':''}</div></div>`;
  return '';
}
function head(eb,t,p,act){ return `<div class="view-head"><div><span class="eyebrow">Estilo · ${esc(eb)}</span><h1>${esc(t)}</h1>${p?`<p>${esc(p)}</p>`:''}</div>${act||''}</div>`; }

function vOutfit(){
  const g=guard(); if(g) return g;
  const recs=analyze(), gp=gaps(), outs=Object.entries(Y.main.items).sort((a,b)=>(b[1].ts||0)-(a[1].ts||0));
  const slots=CATS.map(c=>{ const s=slotInfo(c.id), q=!!(s&&s.it&&s.it.st==='quiero');
    return `<button type="button" class="st-slot" data-sa="slot" data-s="${c.id}">${s?thumb(s.it,s.col):'<span class="st-th empty">'+yic('plus','sm')+'</span>'}<span class="st-sm"><span class="t">${esc(c.sh)}</span><span class="s${q?' q':''}">${s?(q?'Por comprar · ':'')+esc(s.name):'Toca para elegir'}</span></span></button>`; }).join('');
  const pill={good:'<span class="pill good">Bien</span>',warn:'<span class="pill warn">Ojo</span>',info:'<span class="pill info">Tip</span>'};
  const nNone=gp.filter(x=>x.state==='none').length, nQ=gp.length-nNone;
  const gsub=[nNone?`${nNone} sin prenda`:'',nQ?`${nQ} por comprar`:''].filter(Boolean).join(' · ');
  return `<div class="view st">${head('Outfit','Arma tu outfit','Toca una parte del muñeco para escoger la prenda de tu biblioteca o probar un color.')}
    <div class="grid st-top">
      <section class="panel"><div class="panel-h"><h2>Tu outfit</h2><div class="seg st-mode" role="group" aria-label="Vista">${[['doll','Muñeco'],['flat','Fotos']].map(([v,l])=>`<button type="button" data-sa="mode" data-v="${v}" aria-pressed="${Y.mode===v}">${l}</button>`).join('')}</div></div>
        ${Y.mode==='flat'?flat():`<div class="st-board"><div class="st-doll">${doll()}</div><div class="st-slots">${slots}</div></div>`}</section>
      <div class="stack s16">
        <section class="panel"><div class="panel-h"><h2>Lectura del outfit</h2><span class="sub">según tus proporciones</span></div><div class="recs">${recs.map(r=>`<div class="rec">${pill[r.t]}<span class="t">${esc(r.h)}</span><span class="d">${esc(r.d)}</span></div>`).join('')}</div></section>
        ${gp.length?`<section class="panel"><div class="panel-h"><h2>Para este outfit te falta</h2><span class="sub">${gsub}</span></div><div class="st-gaps">${gp.map(x=>x.state==='none'
          ?`<div class="st-gap">${swatch(x.col)}<span>${esc(x.label)}</span><button type="button" class="btn sm" data-sa="gapadd" data-s="${x.slot}">${yic('plus','sm')}A por comprar</button></div>`
          :`<div class="st-gap">${yic('bag','sm')}<span>${esc(x.label)}${x.p?` · <span class="num">${money(x.p)}</span>`:''}</span><a class="btn sm ghost" href="#s-compras">Ver</a></div>`).join('')}</div></section>`:''}
      </div>
    </div>
    <section class="panel"><div class="panel-h"><h2>Combinaciones para tu tono</h2><span class="sub">piel trigueña cálida · cabello negro</span></div>
      <div class="st-schemes">${SCH.map(sc=>`<button type="button" class="st-sch" data-sa="scheme" data-id="${sc.id}" aria-pressed="${Y.main.sc===sc.id}"><span class="st-strip">${CATS.filter(c=>sc.s[c.id]).map(c=>`<i style="background:${PALM[sc.s[c.id]].h}"></i>`).join('')}</span><span class="t">${esc(sc.n)}</span><span class="s">${esc(sc.d)}</span></button>`).join('')}</div>
      <p class="xs muted" style="margin-top:10px">Al aplicar una combinación busco primero prendas de tu biblioteca con ese color (las que tienes antes que las que quieres comprar).</p></section>
    <section class="panel"><div class="panel-h"><h2>Outfits guardados</h2><span class="sub">${outs.length||'ninguno aún'}</span></div>
      <div class="row st-saverow"><input class="in" id="stOname" maxlength="40" placeholder="Nombre (ej. Viernes noche)" value="${esc(Y.oname)}" aria-label="Nombre del outfit"><button type="button" class="btn primary" data-sa="osave">${yic('save','sm')}Guardar este</button></div>
      ${outs.length?`<div class="st-outs">${outs.map(([id,o])=>`<div class="st-out"><button type="button" class="st-outb" data-sa="oload" data-id="${esc(id)}"><span class="st-strip v">${CATS.map(c=>{ const s=slotInfo(c.id,o.s||{}); return s?`<i style="background:${esc(s.col)}"></i>`:''; }).join('')}</span><span class="t">${esc(o.n||'Outfit')}</span></button><button type="button" class="iconbtn" data-sa="odel" data-id="${esc(id)}" aria-label="Borrar ${esc(o.n||'outfit')}">${yic('trash','sm')}</button></div>`).join('')}</div>`:''}
    </section>
  </div>`;
}

function card(id,it){
  return `<button type="button" class="st-card" data-sa="edit" data-id="${esc(id)}">${thumb(it,it.col)}<span class="st-cb"><span class="t">${esc(it.n)}</span><span class="s">${swatch(it.col,'xs')}${esc(colName(it.col,it.pc))}${it.p?` · <span class="num">${money(it.p)}</span>`:''}</span>${it.st==='quiero'?`<span class="pill warn">Quiero${it.pr?' · '+PRIO[it.pr].toLowerCase():''}</span>`:'<span class="pill good">Lo tengo</span>'}</span></button>`;
}
function vLib(){
  const g=guard(); if(g) return g;
  const all=Object.entries(Y.items);
  const cnt=c=>all.filter(([,it])=>it.c===c).length;
  const list=all.filter(([,it])=>(Y.cat==='all'||it.c===Y.cat)&&(Y.st==='all'||it.st===Y.st)).sort((a,b)=>(b[1].ts||0)-(a[1].ts||0));
  const bytes=all.reduce((s,[,it])=>s+(it.img?Math.round(it.img.length*.75):0),0), nimg=all.filter(([,it])=>it.img).length;
  return `<div class="view st">${head('Biblioteca','Biblioteca','Lo que tienes y lo que quieres comprar, por categoría.',`<button type="button" class="btn primary" data-sa="new">${yic('plus','sm')}Agregar prenda</button>`)}
    <div class="chips" role="group" aria-label="Categoría"><button type="button" class="chip" data-sa="fcat" data-v="all" aria-pressed="${Y.cat==='all'}">Todas <span class="tag">${all.length}</span></button>${CATS.map(c=>`<button type="button" class="chip" data-sa="fcat" data-v="${c.id}" aria-pressed="${Y.cat===c.id}">${esc(c.n)} <span class="tag">${cnt(c.id)}</span></button>`).join('')}</div>
    <div class="seg" role="group" aria-label="Estado">${[['all','Todo'],['tengo','Lo tengo'],['quiero','Quiero comprar']].map(([v,l])=>`<button type="button" data-sa="fst" data-v="${v}" aria-pressed="${Y.st===v}">${l}</button>`).join('')}</div>
    ${list.length?`<div class="st-grid">${list.map(([id,it])=>card(id,it)).join('')}</div>`
      :`<div class="empty"><b>${all.length?'Nada con ese filtro.':'Tu biblioteca está vacía.'}</b><span>Agrega una prenda: tómale foto, o haz captura de pantalla de la tienda y súbela.</span><button type="button" class="btn primary" data-sa="new">${yic('cam','sm')}Agregar la primera</button></div>`}
    <p class="xs muted">${nimg} foto${nimg===1?'':'s'} · ${(bytes/1048576).toFixed(2)} MB en total. Cada foto se comprime (unos 30–60 KB) para que la app no se vuelva pesada.</p>
  </div>`;
}

function linkedMeta(){
  const ms=(S.cfg&&Array.isArray(S.cfg.metas)?S.cfg.metas:[]).filter(m=>!m.arch);
  let m=ms.find(x=>x.id===Y.main.meta);
  if(!m) m=ms.find(x=>/ropa|vestuario|estilo|outfit/i.test(x.n||''));
  return {ms,m};
}
function vCompras(){
  const g=guard(); if(g) return g;
  const po={a:0,m:1,b:2};
  const list=Object.entries(Y.items).filter(([,it])=>it.st==='quiero').sort((a,b)=>(po[a[1].pr||'m']-po[b[1].pr||'m'])||((b[1].ts||0)-(a[1].ts||0)));
  const tot=list.reduce((s,[,it])=>s+(it.p||0),0), alta=list.filter(([,it])=>it.pr==='a').reduce((s,[,it])=>s+(it.p||0),0);
  const sinP=list.filter(([,it])=>!it.p).length;
  const {ms,m}=linkedMeta();
  let metaHtml='';
  if(m){
    let saldo=null; try{ if(typeof QZ.metaStats==='function') saldo=QZ.metaStats(m).saldo; }catch(_){}
    if(saldo!=null){
      let acc=0, n=0; for(const [,it] of list){ if(!it.p) continue; if(acc+it.p<=saldo){ acc+=it.p; n++; } else break; }
      const falta=Math.max(0,tot-saldo);
      metaHtml=`<section class="panel"><div class="panel-h"><h2>Tu ahorro: ${esc(m.n)}</h2>${ms.length>1?`<select class="in st-msel" data-sm="meta" aria-label="Meta enlazada">${ms.map(x=>`<option value="${esc(x.id)}" ${x.id===m.id?'selected':''}>${esc(x.n)}</option>`).join('')}</select>`:''}</div>
        <div class="tiles t4"><div class="tile"><span class="l">Llevas ahorrado</span><span class="v num">${money(saldo)}</span><span class="d">${+m.obj>0?'de '+money(m.obj):'sin objetivo'}</span></div>
        <div class="tile"><span class="l">Te alcanza para</span><span class="v num">${n} de ${list.filter(([,it])=>it.p).length}</span><span class="d">en orden de prioridad</span></div>
        <div class="tile"><span class="l">Para toda la lista</span><span class="v num">${falta?money(falta):'Listo'}</span><span class="d">${falta?'te falta':'ya te alcanza'}</span></div></div>
        <p class="xs muted" style="margin-top:10px">Cuando compres algo con ese ahorro, regístralo en Finanzas → Registrar → <b>Pagar con un ahorro</b> para que descuente de la meta.</p></section>`;
    }
  } else metaHtml=`<div class="note">¿Ahorras para ropa? Crea una meta llamada <b>Ropa</b> en <a href="#metas">Finanzas → Metas</a> y aquí verás cuánto llevas y para qué te alcanza.</div>`;
  const grp=k=>{ const L=list.filter(([,it])=>(it.pr||'m')===k); if(!L.length) return '';
    return `<section class="panel"><div class="panel-h"><h2>Prioridad ${PRIO[k].toLowerCase()}</h2><span class="sub num">${money(L.reduce((s,[,it])=>s+(it.p||0),0))}</span></div><div class="st-list">${L.map(([id,it])=>`<div class="st-li"><button type="button" class="st-lib" data-sa="edit" data-id="${esc(id)}">${thumb(it,it.col)}<span class="st-cb"><span class="t">${esc(it.n)}</span><span class="s">${esc(CATM[it.c].sh)}${it.t?' · '+esc(it.t.length>34?it.t.slice(0,34)+'…':it.t):''}</span><span class="num st-pr${it.p?'':' muted'}">${it.p?money(it.p):'Sin precio'}</span></span></button><button type="button" class="btn sm" data-sa="bought" data-id="${esc(id)}">${yic('ok','sm')}Comprado</button></div>`).join('')}</div></section>`; };
  return `<div class="view st">${head('Por comprar','Por comprar','Lo que quieres comprar, para que nunca se te olvide.',`<span class="row"><button type="button" class="btn" data-sa="copylist" ${list.length?'':'disabled'}>${yic('copy','sm')}Copiar lista</button><button type="button" class="btn primary" data-sa="new" data-st="quiero">${yic('plus','sm')}Agregar</button></span>`)}
    <div class="tiles t4"><div class="tile"><span class="l">Total de la lista</span><span class="v num">${money(tot)}</span><span class="d">${list.length} prenda${list.length===1?'':'s'}${sinP?` · ${sinP} sin precio`:''}</span></div>
      <div class="tile"><span class="l">Prioridad alta</span><span class="v num">${money(alta)}</span><span class="d">lo primero que compras</span></div></div>
    ${metaHtml}
    ${list.length?grp('a')+grp('m')+grp('b'):`<div class="empty"><b>No tienes nada por comprar.</b><span>Cuando veas algo que te guste, agrégalo con foto, precio y tienda.</span><button type="button" class="btn primary" data-sa="new" data-st="quiero">${yic('plus','sm')}Agregar deseo</button></div>`}
  </div>`;
}

function vGuia(){
  const sw=ids=>`<div class="st-pal">${ids.map(id=>`<span class="st-pc">${swatch(PALM[id].h)}<span>${esc(PALM[id].n)}</span></span>`).join('')}</div>`;
  const fit=[
    ['Hombro','La costura justo en el hueso del hombro. Ni caída (drop shoulder) ni montada.'],
    ['Manga corta','A mitad del bíceps, abrazando el brazo con 1–2 dedos de holgura.'],
    ['Pecho','La tela marca sin tirar. Si ves arrugas en X o los botones tensos, es pequeña.'],
    ['Largo de camiseta','Termina 2–4 cm debajo de la pretina, a la mitad de la bragueta. Nunca más abajo del bolsillo trasero.'],
    ['Camisa por fuera','Mismo largo que la camiseta. El puño, en el hueso de la muñeca.'],
    ['Chaqueta corta','Trucker o bomber: termina en la pretina. La manga, en la muñeca.'],
    ['Buzo o hoodie','Hasta la cadera, con resorte. Puño en la muñeca; un pliegue está bien.'],
    ['Tiro del pantalón','Medio o medio-alto: la pretina en el ombligo o 2–3 cm abajo.'],
    ['Ancho de bota','Medido plano en talla 30–32: skinny ≤16 cm · slim 17–18 · bota recta 19–21 · relaxed tapered 18–19 con muslo amplio · ancho ≥23.'],
    ['Largo del pantalón','La bota toca el tenis y hace un solo quiebre. Si se amontona, mándalo a subir en una modistería: es barato y cambia todo.']
  ];
  const styles=[
    ['Urban fitted','Diario y universidad',['negro','blanco','denim','oliva'],'Camiseta ajustada lisa + jean bota recta oscuro o negro + tenis blancos + chaqueta corta.'],
    ['Dark urban','Salidas y noche',['negro','carbon','plata'],'Todo negro: camiseta o camisa negra metida con correa negra, pantalón negro recto, tenis negros o blancos, cadena plata.'],
    ['Smart casual','Trabajo y clientes',['marino','gris','blanco','beige'],'Tejido fino o polo de punto, sobrecamisa marino u oliva, jean oscuro sin rotos o pantalón negro recto, tenis blancos limpios. Aquí entran tu tejida gris de rayas y la Lacoste.']
  ];
  const ul=a=>`<ul class="st-ul">${a.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  return `<div class="view st st-narrow">${head('Tu guía','Mi guía de estilo','Streetwear limpio: ajustado arriba, recto abajo, colores neutros con un acento.')}
    <div class="tiles t4"><div class="tile"><span class="l">Estatura</span><span class="v num">1,68 m</span><span class="d">65 kg · contextura media</span></div>
      <div class="tile"><span class="l">Piel</span><span class="v">Trigueña</span><span class="d">subtono cálido-oliva</span></div>
      <div class="tile"><span class="l">Contraste</span><span class="v">Medio-alto</span><span class="d">cabello y cejas negros</span></div>
      <div class="tile"><span class="l">Metal</span><span class="v">Plata</span><span class="d">el que ya usas</span></div></div>
    <div class="note">Piel y subtono salen de tus fotos con luz de interior. Confírmalo con luz de día: pon junto a tu cara una prenda blanco puro y una blanco roto, y algo plateado y algo dorado. Lo que te ilumine la cara es tu lado.</div>
    <section class="panel stack"><h2>Tus colores</h2>
      <div><h3>Base · el 80 % del clóset</h3>${sw(['negro','carbon','gris','blanco','marino','denim'])}</div>
      <div><h3>Tierra · te favorecen por el subtono cálido</h3>${sw(['beige','cafe','oliva'])}</div>
      <div><h3>Acentos · uno por outfit</h3>${sw(['vino','rey','denimc'])}</div>
      <div><h3>Con cuidado</h3><div class="st-pal">${CARE.map(([n,h])=>`<span class="st-pc">${swatch(h)}<span>${esc(n)}</span></span>`).join('')}</div><p class="small ink2" style="margin-top:6px">No es por tu piel: rompen la estética urbana. Si los usas, en una prenda pequeña o lejos de la cara.</p></div>
    </section>
    <section class="panel"><div class="panel-h"><h2>Dónde debe caer cada prenda</h2></div><div class="st-fit">${fit.map(([k,v])=>`<div class="st-fr"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}</div></section>
    <section class="panel stack"><h2>Tus 3 estilos</h2><div class="st-styles">${styles.map(([n,w,c,f])=>`<div class="st-style"><span class="st-strip">${c.map(id=>`<i style="background:${PALM[id].h}"></i>`).join('')}</span><b>${esc(n)}</b><span class="xs muted">${esc(w)}</span><p class="small ink2">${esc(f)}</p></div>`).join('')}</div></section>
    <div class="grid g2">
      <section class="panel stack s8"><h2>Accesorios</h2>${ul(['Cadena plata de 3–5 mm (la que tienes), por fuera de camisetas lisas.','Reloj de correa metálica plateada o negra. El dorado, solo con looks todo negro y sin cadena.','1 o 2 anillos de plata lisos.','Gorra estructurada negra o azul marino, sin logos grandes.','Bolso cruzado negro pequeño.','Correa negra lisa con hebilla plateada cuando metas la camiseta.','Máximo 3 accesorios visibles a la vez (aretes y piercings cuentan como uno).'])}</section>
      <section class="panel stack s8"><h2>Trucos para tu estatura</h2>${ul(['Monocromo o tonos cercanos arriba y abajo.','Tenis del tono del pantalón, o blancos con 3–4 cm de suela.','Camiseta metida con correa en dark urban: sube la cintura y alarga la pierna.','Chaquetas cortas, no largas.','Rayas o bloques horizontales solo a la altura del pecho.','Nada de oversize ni hombro caído: la tela de más se lee como cuerpo.'])}</section>
    </div>
    <section class="panel stack s8"><h2>Cuidado de la ropa</h2>${ul(['Rodillo quitapelusa en prendas negras antes de salir.','Quitamotas para los tejidos.','Lava al revés, en agua fría, y seca a la sombra lo negro y lo oscuro.','Tenis blancos: limpieza rápida cada semana.'])}</section>
  </div>`;
}

const VIEWS={'estilo':vOutfit,'s-biblioteca':vLib,'s-compras':vCompras,'s-guia':vGuia};
for(const [k,fn] of Object.entries(VIEWS)) EXT.views[k]=()=>{ try{ return fn(); }catch(e){ console.error(e); return `<div class="view"><div class="banner crit">Algo falló al mostrar esta sección (${esc(e&&e.message)}). Recarga la app.</div></div>`; } };

/* ---------------- navegación (la llama entreno.js) ---------------- */
const NAV=[['estilo','body','Outfit'],['s-biblioteca','lib','Biblioteca'],['s-add','plus','Agregar'],['s-compras','bag','Por comprar'],['s-guia','book','Mi guía']];
function buildNav(switchHtml){
  const rail=$('#rail'), tab=$('#tabbar'); if(!rail||!tab) return;
  const link=([v,i,l],rail)=>v==='s-add'
    ?`<a href="#s-biblioteca" data-sa="new" class="${rail?'rail-add':'add'}">${yic(i)}${rail?'Agregar prenda':`<span>${l}</span>`}</a>`
    :`<a href="#${v}" data-nav="${v}">${yic(i)}${rail?l:`<span>${l}</span>`}</a>`;
  rail.innerHTML=`<div class="brand"><span class="brand-mark">生</span><span class="brand-name">Ikigai</span></div>${switchHtml||''}${NAV.map(n=>link(n,true)).join('')}<div class="rail-foot">Tus fotos viajan cifradas en tus respaldos y se sincronizan entre tu celular y tu PC.</div>`;
  tab.innerHTML=NAV.map(n=>link(n,false)).join('');
}
QZ.STY={views:VIEWS,buildNav,ensure,icon:yic('sty')};

/* ---------------- hojas (selector de prenda y editor) ---------------- */
let root=null;
function sheetRoot(){ if(!root){ root=document.createElement('div'); root.id='stySheet'; document.body.appendChild(root); } return root; }
function closeSheet(){ Y.sheet=null; Y.edit=null; renderSheet(); }
function renderSheet(){
  const r=sheetRoot();
  if(!Y.sheet){ r.innerHTML=''; document.body.classList.remove('st-lock'); return; }
  document.body.classList.add('st-lock');
  const body=Y.sheet.t==='slot'?sheetSlot():sheetEdit();
  r.innerHTML=`<div class="sheet-wrap" data-sa="sheetbg"><div class="sheet st-sheet" role="dialog" aria-modal="true" aria-labelledby="stT">${body}</div></div>`;
  const f=r.querySelector('[data-autofocus]'); if(f&&window.matchMedia('(pointer:fine)').matches) f.focus();
}
function sheetSlot(){
  const slot=Y.sheet.s, c=CATM[slot], cur=Y.main.cur[slot]||{};
  const its=Object.entries(Y.items).filter(([,it])=>it.c===slot).sort((a,b)=>(a[1].st===b[1].st?0:a[1].st==='tengo'?-1:1)||((b[1].ts||0)-(a[1].ts||0)));
  const cols=slot==='accesorio'?['plata','dorado','negro']:PAL.filter(p=>p.g!=='metal').map(p=>p.id);
  return `<div class="sheet-h"><h2 id="stT">${esc(c.sh)}</h2><button type="button" class="iconbtn" data-sa="close" aria-label="Cerrar">${yic('x','sm')}</button></div>
    <div class="stack s8"><h3>De tu biblioteca</h3>
    ${its.length?`<div class="st-pick">${its.map(([id,it])=>`<button type="button" class="st-pk" data-sa="pick" data-id="${esc(id)}" aria-pressed="${cur.i===id}">${thumb(it,it.col)}<span class="t">${esc(it.n)}</span>${it.st==='quiero'?'<span class="pill warn">Por comprar</span>':''}</button>`).join('')}</div>`
      :`<p class="small ink2">Aún no tienes ${esc(c.n.toLowerCase())} en la biblioteca.</p>`}
    <button type="button" class="btn" data-sa="new" data-c="${slot}">${yic('cam','sm')}Agregar ${esc(c.sh.toLowerCase())} con foto</button></div>
    <div class="stack s8"><h3>Solo probar un color</h3><div class="st-cols">${cols.map(id=>`<button type="button" class="st-cb2" data-sa="pickc" data-v="${id}" aria-pressed="${!cur.i&&cur.pc===id}" aria-label="${esc(PALM[id].n)}" title="${esc(PALM[id].n)}">${swatch(PALM[id].h)}</button>`).join('')}</div></div>
    <div class="row between"><button type="button" class="btn danger" data-sa="unslot" ${Y.main.cur[slot]?'':'disabled'}>${yic('x','sm')}Quitar del outfit</button><button type="button" class="btn" data-sa="close">Listo</button></div>`;
}
function sheetEdit(){
  const E=Y.edit, isNew=!E.id;
  const cols=E.c==='accesorio'?PAL:PAL.filter(p=>p.g!=='metal');
  return `<div class="sheet-h"><h2 id="stT">${isNew?'Nueva prenda':'Editar prenda'}</h2><button type="button" class="iconbtn" data-sa="close" aria-label="Cerrar">${yic('x','sm')}</button></div>
    <div class="st-photo">${E.img?`<img src="${E.img}" alt="Foto de la prenda">`:`<span class="st-ph0">${yic('cam')}<span>Sin foto</span></span>`}
      <div class="stack s8"><button type="button" class="btn" data-sa="photo" ${Y.busy?'disabled':''}>${yic('cam','sm')}${Y.busy?'Procesando…':E.img?'Cambiar foto':'Tomar o elegir foto'}</button>${E.img?`<button type="button" class="btn ghost sm" data-sa="nophoto">Quitar foto</button>`:''}<span class="xs muted">Sirve una foto tuya o una captura de la tienda.</span></div>
      <input type="file" accept="image/*" id="stFile" hidden></div>
    <label class="f">Nombre<input class="in" data-sf="n" maxlength="80" value="${esc(E.n||'')}" placeholder="Ej. Jean negro bota recta" ${isNew&&!E.img?'':'data-autofocus'}></label>
    <div class="stack s8"><span class="st-lab">Categoría</span><div class="chips">${CATS.map(c=>`<button type="button" class="chip" data-sa="ec" data-v="${c.id}" aria-pressed="${E.c===c.id}">${esc(c.sh)}</button>`).join('')}</div></div>
    <div class="stack s8"><span class="st-lab">Color${E.det?` · <span class="muted">detecté ${esc(E.det)} en la foto</span>`:''}</span><div class="st-cols">${cols.map(p=>`<button type="button" class="st-cb2" data-sa="ecol" data-v="${p.id}" aria-pressed="${E.pc===p.id}" aria-label="${esc(p.n)}" title="${esc(p.n)}">${swatch(p.h)}</button>`).join('')}<label class="st-cb2 st-own" title="Otro color" aria-pressed="${!E.pc}">${swatch(E.pc?'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)':E.col)}<input type="color" data-sf="col" value="${esc(E.col||'#8C8E92')}" aria-label="Otro color"></label></div><span class="xs muted">${esc(colName(E.col,E.pc))}</span></div>
    <div class="stack s8"><span class="st-lab">Estado</span><div class="seg full">${[['tengo','Lo tengo'],['quiero','Quiero comprarla']].map(([v,l])=>`<button type="button" data-sa="est" data-v="${v}" aria-pressed="${E.st===v}">${l}</button>`).join('')}</div></div>
    ${E.st==='quiero'?`<div class="stack s8"><span class="st-lab">Prioridad</span><div class="seg full">${Object.entries(PRIO).map(([v,l])=>`<button type="button" data-sa="epr" data-v="${v}" aria-pressed="${(E.pr||'m')===v}">${l}</button>`).join('')}</div></div>`:''}
    <div class="grid g2" style="gap:12px"><label class="f">Precio<input class="in money" data-sf="p" data-money="sty" inputmode="numeric" autocomplete="off" value="${E.p?NF.format(E.p):''}" placeholder="$ 0"></label>
      <label class="f">Tienda o enlace<input class="in" data-sf="t" maxlength="300" value="${esc(E.t||'')}" placeholder="Ej. Bershka Andino"></label></div>
    <label class="f">Notas<textarea class="in" data-sf="no" maxlength="400" rows="2" placeholder="Talla, fit, con qué combinarla…">${esc(E.no||'')}</textarea></label>
    <div class="row between">${isNew?'<span></span>':`<button type="button" class="btn danger" data-sa="edel">${yic('trash','sm')}Borrar</button>`}<span class="row">${!isNew&&E.t?`<button type="button" class="btn" data-sa="copyt" aria-label="Copiar tienda o enlace">${yic('copy','sm')}</button>`:''}<button type="button" class="btn" data-sa="close">Cancelar</button><button type="button" class="btn primary" data-sa="esave" ${Y.busy?'disabled':''}>Guardar</button></span></div>`;
}
function openEdit(id,preset){
  const it=id&&Y.items[id];
  Y.edit=it?Object.assign({id},clone(it)):Object.assign({n:'',c:'torso',col:PALM.negro.h,pc:'negro',st:'tengo'},preset||{});
  Y.sheet={t:'edit',back:Y.sheet&&Y.sheet.t==='slot'?Y.sheet.s:null};
  renderSheet();
}

/* ---------------- fotos: compresión y color ---------------- */
function loadImg(file){
  return new Promise((res,rej)=>{ const url=URL.createObjectURL(file), im=new Image();
    im.onload=()=>res({im,url}); im.onerror=()=>{ URL.revokeObjectURL(url); rej(new Error('No pude leer esa imagen. Prueba con JPG o PNG.')); }; im.src=url; });
}
async function compress(file){
  const {im,url}=await loadImg(file);
  try{
    const M=520, w0=im.naturalWidth, h0=im.naturalHeight; if(!w0||!h0) throw new Error('Imagen vacía');
    const sc=Math.min(1,M/Math.max(w0,h0)), w=Math.max(1,Math.round(w0*sc)), h=Math.max(1,Math.round(h0*sc));
    const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
    const g=cv.getContext('2d'); g.fillStyle='#ffffff'; g.fillRect(0,0,w,h); g.drawImage(im,0,0,w,h);
    let type='image/webp', d=cv.toDataURL(type,.74);
    if(!d.startsWith('data:image/webp')){ type='image/jpeg'; d=cv.toDataURL(type,.78); }
    for(let q=.62;d.length>110000&&q>.3;q-=.1) d=cv.toDataURL(type,q);
    return {img:d,col:detect(g,w,h)};
  } finally { URL.revokeObjectURL(url); }
}
function detect(g,w,h){
  try{
    const x0=Math.floor(w*.25), y0=Math.floor(h*.2), ww=Math.max(1,Math.floor(w*.5)), hh=Math.max(1,Math.floor(h*.6));
    const d=g.getImageData(x0,y0,ww,hh).data, votes={}; let tot=0, bg=0;
    for(let i=0;i<d.length;i+=4*7){ tot++; const r=d[i],gg=d[i+1],b=d[i+2]; if(Math.min(r,gg,b)>232){ bg++; continue; } const p=nearest(hex([r,gg,b])).p; votes[p.id]=(votes[p.id]||0)+1; }
    if(!tot) return null;
    if(bg/tot>.8) return 'blanco';
    let best=null, bv=0; for(const [k,v] of Object.entries(votes)) if(v>bv){ bv=v; best=k; }
    return best;
  }catch(_){ return null; }
}
async function onFile(file){
  if(!file||!Y.edit) return;
  if(!/^image\//.test(file.type||'image/')){ QZ.toast('Ese archivo no es una imagen.'); return; }
  readForm(); Y.busy=true; renderSheet();
  try{
    const r=await compress(file);
    if(!Y.edit) return;
    Y.edit.img=r.img;
    if(r.col&&PALM[r.col]&&!Y.edit.colTouched){ Y.edit.pc=r.col; Y.edit.col=PALM[r.col].h; Y.edit.det=PALM[r.col].n.toLowerCase(); }
  }catch(e){ QZ.toast((e&&e.message)||'No se pudo procesar la foto.'); }
  finally{ Y.busy=false; renderSheet(); }
}
function readForm(){
  const E=Y.edit, r=root; if(!E||!r) return;
  for(const el of $$('[data-sf]',r)){
    const k=el.dataset.sf;
    if(k==='p'){ const n=parseInt(String(el.value).replace(/\D/g,''),10); E.p=n>0?n:0; }
    else if(k==='col'){ /* lo maneja el evento input */ }
    else E[k]=el.value;
  }
}
function saveEdit(){
  readForm();
  const E=Y.edit; if(!E) return;
  const n=String(E.n||'').trim();
  if(!n){ const el=$('[data-sf="n"]',root); if(el){ el.focus(); el.setAttribute('aria-invalid','true'); } QZ.toast('Ponle un nombre a la prenda.'); return; }
  const id=E.id||uid(), prev=Y.items[id];
  const it=normItem({n,c:E.c,col:E.col,pc:E.pc,st:E.st,p:E.p,t:String(E.t||'').trim(),pr:E.st==='quiero'?(E.pr||'m'):'',no:String(E.no||'').trim(),img:E.img,ts:Date.now(),cr:prev?prev.cr:Date.now(),bo:E.st==='tengo'?(prev&&prev.st==='quiero'?today():E.bo):''});
  saveItem(id,it);
  const back=Y.sheet&&Y.sheet.back;
  if(back&&it.c===back){ Y.main.cur[back]={i:id}; saveMain(); }
  QZ.toast(E.id?'Prenda actualizada':(it.st==='quiero'?'Agregada a Por comprar':'Agregada a tu biblioteca'));
  closeSheet();
}

/* ---------------- eventos ---------------- */
const ACT={
  slot(a){ Y.sheet={t:'slot',s:a.dataset.s}; renderSheet(); },
  pick(a){ const s=Y.sheet&&Y.sheet.s; if(!s) return; Y.main.cur[s]={i:a.dataset.id}; Y.main.sc=''; saveMain(); closeSheet(); },
  pickc(a){ const s=Y.sheet&&Y.sheet.s, p=PALM[a.dataset.v]; if(!s||!p) return; Y.main.cur[s]={c:p.h,pc:p.id}; Y.main.sc=''; saveMain(); closeSheet(); },
  unslot(){ const s=Y.sheet&&Y.sheet.s; if(!s) return; delete Y.main.cur[s]; Y.main.sc=''; saveMain(); closeSheet(); },
  scheme(a){ applyScheme(a.dataset.id); },
  mode(a){ Y.mode=a.dataset.v==='flat'?'flat':'doll'; QZ.scheduleRender(); },
  gapadd(a){ const s=a.dataset.s, v=slotInfo(s); if(!v||v.it) return;
    const id=uid(); saveItem(id,normItem({n:gapName(s,v.col,v.pc),c:s,col:v.col,pc:v.pc,st:'quiero',pr:'m',ts:Date.now()}));
    Y.main.cur[s]={i:id}; saveMain(); QZ.toast('Agregada a Por comprar. Ponle foto y precio cuando la encuentres.'); },
  osave(){ const el=$('#stOname'); const n=String(el&&el.value||'').trim()||('Outfit '+(Object.keys(Y.main.items).length+1));
    if(!Object.keys(Y.main.cur).length){ QZ.toast('Primero arma el outfit.'); return; }
    Y.main.items[uid()]={n:n.slice(0,40),s:clone(Y.main.cur),ts:Date.now()}; Y.oname=''; saveMain(); QZ.toast('Outfit guardado'); },
  oload(a){ const o=Y.main.items[a.dataset.id]; if(!o) return; Y.main.cur=clone(o.s||{}); Y.main.sc=''; saveMain(); window.scrollTo({top:0,behavior:'smooth'}); },
  odel(a){ const o=Y.main.items[a.dataset.id]; if(!o||!window.confirm(`¿Borrar el outfit "${o.n}"?`)) return; delete Y.main.items[a.dataset.id]; saveMain(); },
  fcat(a){ Y.cat=a.dataset.v; QZ.scheduleRender(); },
  fst(a){ Y.st=a.dataset.v; QZ.scheduleRender(); },
  new(a){ const c=a.dataset.c||(Y.cat!=='all'?Y.cat:'torso'), st=a.dataset.st||(location.hash==='#s-compras'?'quiero':'tengo');
    openEdit(null,{c,st,col:c==='accesorio'?PALM.plata.h:PALM.negro.h,pc:c==='accesorio'?'plata':'negro'}); },
  edit(a){ openEdit(a.dataset.id); },
  bought(a){ const it=Y.items[a.dataset.id]; if(!it) return; const n=Object.assign({},it,{st:'tengo',bo:today(),ts:Date.now()}); delete n.pr; saveItem(a.dataset.id,normItem(n)); QZ.toast('¡Bien! Pasó a "Lo tengo". Si la pagaste con tu ahorro, regístralo en Finanzas.'); },
  async copylist(){
    const po={a:0,m:1,b:2};
    const L=Object.values(Y.items).filter(it=>it.st==='quiero').sort((a,b)=>po[a.pr||'m']-po[b.pr||'m']);
    const txt='Por comprar ('+today()+')\n'+L.map(it=>`- ${it.n}${it.p?' · '+money(it.p):''}${it.t?' · '+it.t:''} [${PRIO[it.pr||'m']}]`).join('\n')+`\nTotal: ${money(L.reduce((s,it)=>s+(it.p||0),0))}`;
    try{ await navigator.clipboard.writeText(txt); QZ.toast('Lista copiada'); }catch(_){ QZ.toast('No se pudo copiar en este dispositivo.'); }
  },
  async copyt(){ try{ await navigator.clipboard.writeText(Y.edit&&Y.edit.t||''); QZ.toast('Copiado'); }catch(_){ QZ.toast('No se pudo copiar.'); } },
  photo(){ const f=$('#stFile',root); if(f){ f.value=''; f.click(); } },
  nophoto(){ readForm(); if(Y.edit){ delete Y.edit.img; delete Y.edit.det; } renderSheet(); },
  ec(a){ readForm(); Y.edit.c=a.dataset.v; if(a.dataset.v!=='accesorio'&&PALM[Y.edit.pc]&&PALM[Y.edit.pc].g==='metal'){ Y.edit.pc='negro'; Y.edit.col=PALM.negro.h; } renderSheet(); },
  ecol(a){ readForm(); const p=PALM[a.dataset.v]; if(!p) return; Y.edit.pc=p.id; Y.edit.col=p.h; Y.edit.colTouched=true; renderSheet(); },
  est(a){ readForm(); Y.edit.st=a.dataset.v; renderSheet(); },
  epr(a){ readForm(); Y.edit.pr=a.dataset.v; renderSheet(); },
  esave(){ saveEdit(); },
  edel(){ const E=Y.edit; if(!E||!E.id) return; if(!window.confirm(`¿Borrar "${E.n||'esta prenda'}"? No se puede deshacer.`)) return; delItem(E.id); QZ.toast('Prenda borrada'); closeSheet(); },
  close(){ closeSheet(); },
  sheetbg(a,e){ if(e.target===a) closeSheet(); }
};
document.addEventListener('click',ev=>{
  const a=ev.target.closest('[data-sa]'); if(!a) return;
  const fn=ACT[a.dataset.sa]; if(!fn) return;
  if(a.tagName==='A') ev.preventDefault();
  fn(a,ev);
});
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&Y.sheet){ closeSheet(); return; }
  const a=ev.target&&ev.target.closest&&ev.target.closest('g[data-sa]');
  if(a&&(ev.key==='Enter'||ev.key===' ')){ ev.preventDefault(); const fn=ACT[a.dataset.sa]; if(fn) fn(a,ev); }
});
document.addEventListener('change',ev=>{
  const el=ev.target; if(!el) return;
  if(el.id==='stFile'){ const f=el.files&&el.files[0]; if(f) onFile(f); return; }
  if(el.dataset&&el.dataset.sm==='meta'){ Y.main.meta=el.value; saveMain(); }
});
document.addEventListener('input',ev=>{
  const el=ev.target; if(!el||!el.dataset) return;
  if(el.id==='stOname') Y.oname=el.value;
  if(el.dataset.sf==='col'&&Y.edit){ readForm(); Y.edit.col=String(el.value).toUpperCase(); delete Y.edit.pc; Y.edit.colTouched=true; const sw=el.parentElement&&el.parentElement.querySelector('.st-sw'); if(sw) sw.style.background=el.value; const lab=el.closest('.stack')&&el.closest('.stack').querySelector(':scope > .xs'); if(lab) lab.textContent=colName(Y.edit.col); for(const b of $$('[data-sa="ecol"]',root)) b.setAttribute('aria-pressed','false'); el.parentElement.setAttribute('aria-pressed','true'); }
  if(el.dataset.sf==='n') el.removeAttribute('aria-invalid');
});

/* ---------------- estilos ---------------- */
const CSS=`
.st-narrow{max-width:900px!important}
body.st-lock{overflow:hidden}
.st .view-head .row{flex-wrap:nowrap}
.st-top{grid-template-columns:minmax(0,1fr);align-items:start}
@media (min-width:980px){ .st-top{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)} }
.st-board{display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:12px;align-items:center}
.st-mode button{padding:5px 12px;min-height:32px;font-size:.84rem}
.st-flat{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;grid-template-areas:". cab cab acc" "cha cha tor tor" ". pan pan zap"}
.st-fl{position:relative;border:1px solid var(--line);border-radius:10px;overflow:hidden;padding:0;background:var(--panel-2);display:grid;place-items:center;color:var(--muted);min-width:0}
.st-fl.ph{background:#fff}
.st-fl:hover{border-color:var(--line-2)}
.st-fl img{width:100%;height:100%;object-fit:contain;display:block}
.st-fc{position:absolute;inset:0}
.st-fe{opacity:.7}
.st-fn{position:absolute;left:0;right:0;bottom:0;padding:3px 7px;font-size:.68rem;font-weight:500;color:#fff;background:rgba(10,18,16,.62);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}
.st-fl-cabeza{grid-area:cab;aspect-ratio:2/1}
.st-fl-accesorio{grid-area:acc;aspect-ratio:1}
.st-fl-chaqueta{grid-area:cha;aspect-ratio:4/5}
.st-fl-torso{grid-area:tor;aspect-ratio:4/5}
.st-fl-pantalon{grid-area:pan;aspect-ratio:3/4}
.st-fl-zapatos{grid-area:zap;aspect-ratio:1;align-self:end}
@media (max-width:360px){ .st-board{grid-template-columns:1fr} .st-doll{max-width:220px;margin:0 auto} }
.st-svg{width:100%;height:auto;display:block;max-height:460px}
.st-shadow{fill:var(--line)}
.st-p.on{stroke:color-mix(in srgb,var(--ink) 32%,transparent);stroke-width:1.1;stroke-linejoin:round}
.st-p.off{fill:var(--panel-2);stroke:var(--line-2);stroke-width:1.2;stroke-dasharray:4 3}
.st-p.ghost{fill:none;stroke:var(--muted);stroke-width:1.2;stroke-dasharray:3 3;opacity:.7}
.st-ln{fill:none;stroke:color-mix(in srgb,var(--ink) 22%,transparent);stroke-width:1}
.st-hl{fill:none;stroke:transparent;stroke-width:12;pointer-events:stroke}
.st-ch{stroke-linecap:round}
.st-hit{cursor:pointer;outline:none}
.st-hit:hover .st-p.on,.st-hit:focus-visible .st-p.on{filter:brightness(1.12)}
.st-hit:hover .st-p.off,.st-hit:hover .st-p.ghost,.st-hit:focus-visible .st-p.off,.st-hit:focus-visible .st-p.ghost{stroke:var(--accent);opacity:1}
.st-slots{display:grid;gap:6px}
.st-slot{display:grid;grid-template-columns:40px minmax(0,1fr);gap:10px;align-items:center;text-align:left;border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:6px 8px;color:var(--ink);min-height:52px}
.st-slot:hover{border-color:var(--line-2)}
.st-sm .s.q{color:var(--warn-ink)}
.st-cb > *,.st-sm > *{max-width:100%}
.st-sm{min-width:0;display:grid}
.st-sm .t,.st-cb .t{font-weight:600;font-size:.86rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.st-sm .s,.st-cb .s{font-size:.74rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;gap:5px}
.st-th{width:40px;height:40px;border-radius:8px;overflow:hidden;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);flex:none;background:var(--panel-2)}
.st-th img{width:100%;height:100%;object-fit:cover;display:block}
.st-th.empty{border-style:dashed;color:var(--muted);background:transparent}
.st-sw{width:22px;height:22px;border-radius:50%;display:inline-block;border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);flex:none}
.st-sw.xs{width:10px;height:10px}
.st-gaps{display:grid;gap:8px}
.st-gap{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;font-size:.88rem}
.st-schemes{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px}
.st-sch{display:grid;gap:3px;text-align:left;border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:8px;color:var(--ink)}
.st-sch:hover{border-color:var(--line-2)}
.st-sch[aria-pressed="true"]{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
.st-sch .t{font-weight:600;font-size:.86rem}
.st-sch .s{font-size:.74rem;color:var(--muted)}
.st-strip{display:flex;height:22px;border-radius:6px;overflow:hidden;border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);margin-bottom:4px}
.st-strip i{flex:1;display:block}
.st-strip.v{width:44px;height:44px;flex-direction:column;margin:0;flex:none}
.st-saverow{flex-wrap:nowrap;margin-bottom:10px}
.st-saverow .in{flex:1}
.st-outs{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
.st-out{display:flex;gap:6px;align-items:center}
.st-outb{flex:1;min-width:0;display:flex;gap:10px;align-items:center;border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:6px 10px 6px 6px;text-align:left;color:var(--ink);font-weight:500}
.st-outb:hover{border-color:var(--line-2)}
.st-outb .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.st-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
@media (max-width:420px){ .st-grid{grid-template-columns:repeat(2,minmax(0,1fr))} }
.st-card{display:grid;grid-template-rows:auto 1fr;border:1px solid var(--line);background:var(--panel);border-radius:12px;overflow:hidden;padding:0;text-align:left;color:var(--ink)}
.st-card:hover{border-color:var(--line-2);box-shadow:var(--shadow)}
.st-card .st-th{width:100%;height:auto;aspect-ratio:4/5;border-radius:0;border:0;border-bottom:1px solid var(--line);background:#fff}
.st-card .st-th img{object-fit:contain}
.st-card .st-th.np{aspect-ratio:16/7}
.st-cb{display:grid;gap:3px;padding:8px 10px 10px;min-width:0;justify-items:start}
.st-card .pill{margin-top:3px;font-size:.66rem}
.st-list{display:grid}
.st-li{display:flex;gap:8px;align-items:center;border-bottom:1px solid var(--line);padding:8px 0}
.st-li:last-child{border-bottom:0}
.st-lib{flex:1;min-width:0;display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px;align-items:center;background:none;border:0;padding:0;text-align:left;color:var(--ink)}
.st-lib .st-th{width:44px;height:44px}
.st-lib .st-cb{padding:0}
.st-pr{font-weight:600;font-size:.86rem;white-space:nowrap;color:var(--ink)}
.st-pr.muted{font-weight:400;color:var(--muted)}
select.in.st-msel{width:auto;max-width:100%;min-height:34px;padding:5px 8px;font-size:.84rem}
.st-pal{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:6px}
.st-pc{display:inline-flex;align-items:center;gap:7px;font-size:.84rem;color:var(--ink-2)}
.st h3{font-size:.84rem;color:var(--ink-2);font-weight:500}
.st-fit{display:grid}
.st-fr{display:grid;grid-template-columns:minmax(110px,30%) minmax(0,1fr);gap:12px;padding:9px 0;border-bottom:1px dashed var(--line);font-size:.88rem}
.st-fr:last-child{border-bottom:0}
.st-fr span{color:var(--ink-2)}
@media (max-width:460px){ .st-fr{grid-template-columns:1fr;gap:2px} }
.st-styles{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.st-style{display:grid;gap:4px;align-content:start;border:1px solid var(--line);border-radius:10px;padding:10px}
.st-ul{margin:0;padding-left:18px;display:grid;gap:7px;font-size:.88rem;color:var(--ink-2)}
.st-sheet{gap:16px}
.st-sheet h3{font-size:.84rem;color:var(--ink-2);font-weight:500}
.st-lab{font-size:.82rem;color:var(--ink-2);font-weight:500}
.st-pick{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(104px,1fr))}
.st-pk{display:grid;gap:4px;justify-items:start;border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:6px;text-align:left;color:var(--ink);font-size:.78rem}
.st-pk .st-th{width:100%;height:auto;aspect-ratio:1}
.st-pk .t{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
.st-pk .pill{font-size:.62rem;padding:0 6px}
.st-pk[aria-pressed="true"]{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
.st-cols{display:flex;flex-wrap:wrap;gap:8px}
.st-cb2{width:40px;height:40px;border-radius:50%;border:2px solid transparent;background:transparent;padding:0;display:grid;place-items:center;position:relative;cursor:pointer}
.st-cb2 .st-sw{width:30px;height:30px}
.st-cb2[aria-pressed="true"]{border-color:var(--accent)}
.st-own input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;border:0;padding:0}
.st-photo{display:grid;grid-template-columns:120px minmax(0,1fr);gap:14px;align-items:center}
.st-photo img,.st-ph0{width:120px;height:150px;object-fit:cover;border-radius:10px;border:1px solid var(--line);display:block}
.st-ph0{display:grid;place-items:center;align-content:center;gap:4px;color:var(--muted);font-size:.78rem;border-style:dashed;background:var(--panel-2)}
.st-photo .stack{justify-items:start}
[aria-invalid="true"]{border-color:var(--crit)!important}
`;
const st=document.createElement('style'); st.id='st-css'; st.textContent=CSS; document.head.appendChild(st);

if(document.readyState!=='loading'&&QZ.route&&QZ.render){ try{ QZ.route(); QZ.render(); }catch(e){} }
})();
