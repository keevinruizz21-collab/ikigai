(function(){
'use strict';

/* =========================================================
   Utilidades
   ========================================================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NF=new Intl.NumberFormat('es-CO',{maximumFractionDigits:0});
const money=n=>{n=Math.round(+n||0);return (n<0?'−$':'$')+NF.format(Math.abs(n));};
const pct=(x,d)=>(x==null||!isFinite(x))?'—':(x*100).toLocaleString('es-CO',{maximumFractionDigits:d||0,minimumFractionDigits:d||0})+'%';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const uid=p=>(p||'')+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const sum=a=>a.reduce((s,v)=>s+(+v||0),0);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clone=o=>JSON.parse(JSON.stringify(o));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pd=s=>{const a=String(s).split('-').map(Number);return new Date(a[0],(a[1]||1)-1,a[2]||1);};
const todayStr=()=>ymd(new Date());
const curMonth=()=>todayStr().slice(0,7);
const addDays=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return ymd(d);};
const addMonthsK=(k,n)=>{const a=k.split('-').map(Number);const d=new Date(a[0],a[1]-1+n,1);return `${d.getFullYear()}-${pad(d.getMonth()+1)}`;};
const dim=(y,m)=>new Date(y,m,0).getDate();
const diffDays=(a,b)=>Math.round((pd(b)-pd(a))/864e5);
const monthsBetween=(a,b)=>{const x=a.split('-').map(Number),y=b.split('-').map(Number);return (y[0]-x[0])*12+(y[1]-x[1]);};
const MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESC=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DIA=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const DIAC=['dom','lun','mar','mié','jue','vie','sáb'];
const fmtD=s=>{const d=pd(s);return `${d.getDate()} ${MESC[d.getMonth()]}`;};
const fmtDL=s=>{const d=pd(s);return `${DIAC[d.getDay()]} ${d.getDate()} ${MESC[d.getMonth()]}`;};
const fmtM=k=>`${MES[+k.slice(5,7)-1]} ${k.slice(0,4)}`;
const fmtMs=k=>`${MESC[+k.slice(5,7)-1]} ${k.slice(2,4)}`;
const parseMoney=v=>{const s=String(v==null?'':v).replace(/[^\d]/g,'');return s?Math.min(parseInt(s,10),9e11):0;};
const fmtIn=n=>n?NF.format(n):'';
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const isYmd=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))&&!isNaN(pd(s));
const isYm=s=>/^\d{4}-\d{2}$/.test(String(s||''));

const IC={
  home:'<svg viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/></svg>',
  list:'<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  chart:'<svg viewBox="0 0 24 24"><path d="M3 20h18M6 16v-5M11 16V6M16 16v-8M21 16v-3"/></svg>',
  target:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/></svg>',
  gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>',
  mic:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
  l:'<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',
  r:'<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  ok:'<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
  warn:'<svg viewBox="0 0 24 24"><path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.2M12 17h.01"/></svg>',
  info:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6h.01"/></svg>',
  spark:'<svg viewBox="0 0 24 24"><path d="M12 3.5 13.9 10l6.6 2-6.6 2L12 20.5 10.1 14l-6.6-2 6.6-2z"/></svg>',
  dl:'<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10.5 12 15.5l5-5M5 20h14"/></svg>',
  up:'<svg viewBox="0 0 24 24"><path d="M12 20V9M7 13.5 12 8.5l5 5M5 4h14"/></svg>',
  trash:'<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/></svg>'
};
const ic=(n,cls)=>`<span class="ic${cls?' '+cls:''}" aria-hidden="true">${IC[n]}</span>`;
const LVL={crit:['crit','warn','Urgente'],warn:['warn','warn','Atención'],info:['info','info','Dato'],good:['good','ok','Bien']};
const lvlPill=l=>{const v=LVL[l]||LVL.info;return `<span class="pill ${v[0]}">${ic(v[1],'sm')}${v[2]}</span>`;};
const TIPOS={g:'Gasto',i:'Ingreso',a:'Ahorro'};
const KINDS={gasto:'Gasto',deuda:'Deuda',ahorro:'Ahorro'};

/* =========================================================
   Configuración por defecto (genérica) y migración
   ========================================================= */
function defaultConfig(){
  const k=curMonth();
  return {
    v:1, nombre:'',
    pagos:{d1:15,d2:30,e1:0,e2:0},
    bolsillos:[{id:'b1',n:'Necesidades',k:'gasto'},{id:'b2',n:'Deudas',k:'deuda'},{id:'b3',n:'Colchón',k:'ahorro'},{id:'b4',n:'Metas',k:'ahorro'},{id:'b5',n:'Educación',k:'gasto'},{id:'b6',n:'Gustos y libre',k:'gasto'}],
    perfiles:[{id:'f1',n:'Plan base',pct:{b1:50,b2:10,b3:10,b4:10,b5:5,b6:15}}],
    perfilMes:[{desde:k,p:'f1'}],
    cats:defaultCats(),
    medios:[{id:'efe',n:'Efectivo'},{id:'deb',n:'Débito / cuenta'},{id:'nequi',n:'Nequi'},{id:'tc',n:'Tarjeta de crédito',cred:true},{id:'trans',n:'Transferencia'},{id:'otro',n:'Otro'}],
    fijos:[], recs:[],
    metas:[{id:'m1',n:'Colchón de emergencia',b:'b3',obj:0,fecha:'',ini:0}],
    deudas:[],
    params:{hormiga:15000,metaAhorro:10,limDeuda:30},
    arranque:{f:todayStr(),saldo:null}
  };
}
function defaultCats(){
  const g=(id,n,b,fijo)=>({id,n,t:'g',b,fijo:!!fijo});
  const i=(id,n,base)=>({id,n,t:'i',base:!!base});
  return [
    g('serv','Servicios (luz, agua)','b1',1),g('cel','Celular e internet','b1',1),g('parq','Parqueadero mensual','b1',1),
    g('comida','Mercado','b1'),g('alm','Almuerzos y comida diaria','b1'),g('gas','Gasolina','b1'),g('mant','Mantenimiento moto','b1'),
    g('lav','Lavada moto','b1'),g('parqu','Parqueadero universidad','b1'),g('soat','SOAT y tecnomecánica','b1'),
    g('salud','Salud y farmacia','b1'),g('pelu','Peluquería y cuidado personal','b1'),g('transp','Transporte','b1'),g('hogar','Hogar','b1'),
    g('tc','Tarjeta de crédito','b2',1),g('credu','Crédito de estudio','b2',1),g('odeuda','Otras deudas','b2'),
    g('curso','Cursos y certificaciones','b5'),g('comp','Componentes y herramientas','b5'),g('libros','Libros y materiales','b5'),
    g('subs','Suscripciones','b6',1),g('salidas','Salidas y comida fuera','b6'),g('antojos','Antojos y snacks','b6'),
    g('ropa','Ropa','b6'),g('tec','Tecnología','b6'),g('regalos','Regalos','b6'),g('entre','Entretenimiento','b6'),g('otros','Otros','b6'),
    i('sal','Salario',1),i('comis','Comisiones',0),i('prima','Prima',0),i('ces','Cesantías',0),i('oing','Otros ingresos',0)
  ];
}
function migrate(c){
  const d=defaultConfig(); c=clone(c||{});
  for(const k of Object.keys(d)) if(c[k]==null) c[k]=d[k];
  c.pagos=Object.assign({},d.pagos,c.pagos);
  c.params=Object.assign({},d.params,c.params);
  if(!Array.isArray(c.bolsillos)||c.bolsillos.length!==6) c.bolsillos=d.bolsillos;
  for(const b of c.bolsillos){ if(!KINDS[b.k]) b.k='gasto'; }
  if(!c.perfiles.length) c.perfiles=d.perfiles;
  for(const p of c.perfiles){ p.pct=Object.assign({b1:0,b2:0,b3:0,b4:0,b5:0,b6:0},p.pct||{}); }
  if(!c.perfilMes.length) c.perfilMes=[{desde:curMonth(),p:c.perfiles[0].id}];
  for(const k of ['cats','medios','fijos','recs','metas','deudas']) if(!Array.isArray(c[k])) c[k]=[];
  if(!c.arranque) c.arranque={f:todayStr(),saldo:null};
  return c;
}

/* =========================================================
   Estado
   ========================================================= */
const S={
  mode:'loading', cfg:null, movsDocs:{}, movs:[], catMap:{}, metaMap:{}, bolMap:{}, medMap:{},
  view:'inicio', month:curMonth(),
  reg:null, regAll:false, regMode:'rapido',
  ia:{text:'',parsing:false,items:null,err:''},
  tabla:[], movF:{q:'',t:'',b:''}, anRange:6, tbl:{},
  ai:{}, ask:{q:'',out:'',state:'idle',err:''},
  cap:{db:null,sample:null,dict:null,dl:null,user:null},
  saving:0, gotCfg:false, gotMovs:false, slow:false, dbErr:null, noCfg:false,
  edit:null, draft:null, dirty:false, imp:null, pendingRender:false, dictState:'idle', abono:{d:'',x:0}
};
const MEMO=new Map();
const memo=(k,fn)=>{if(!MEMO.has(k))MEMO.set(k,fn());return MEMO.get(k);};
function invalidate(){
  MEMO.clear();
  const c=S.cfg;
  S.catMap=Object.fromEntries(c.cats.map(x=>[x.id,x]));
  S.metaMap=Object.fromEntries(c.metas.map(x=>[x.id,x]));
  S.bolMap=Object.fromEntries(c.bolsillos.map((x,i)=>[x.id,Object.assign({},x,{i})]));
  S.medMap=Object.fromEntries(c.medios.map(x=>[x.id,x]));
  const arr=[];
  for(const doc of Object.values(S.movsDocs)){
    const items=(doc&&doc.items)||{};
    for(const [id,v] of Object.entries(items)) if(v&&typeof v==='object'&&isYmd(v.f)) arr.push(Object.assign({},v,{id,m:Math.round(+v.m||0)}));
  }
  arr.sort((a,b)=>a.f===b.f?(b.ts||0)-(a.ts||0):(a.f<b.f?1:-1));
  S.movs=arr;
}
function newReg(over){
  const last=S.movs.find(x=>x.t==='g'&&x.p);
  return Object.assign({t:'g',m:0,c:null,f:todayStr(),p:last?last.p:(S.cfg&&S.cfg.medios[0]?S.cfg.medios[0].id:null),d:'',src:'q',fx:null,err:''},over||{});
}

/* =========================================================
   Cálculos: quincenas, meses, metas, deudas
   ========================================================= */
const bColor=bid=>`var(--s${((S.bolMap[bid]&&S.bolMap[bid].i)||0)+1})`;
const bName=bid=>(S.bolMap[bid]&&S.bolMap[bid].n)||'Sin bolsillo';
const catName=id=>(S.catMap[id]&&S.catMap[id].n)||(S.metaMap[id]&&S.metaMap[id].n)||'Sin categoría';
function bOf(x){ if(x.t==='g') return S.catMap[x.c]?S.catMap[x.c].b:null; if(x.t==='a') return S.metaMap[x.c]?S.metaMap[x.c].b:null; return null; }
function payday2(y,m){ return Math.min(+S.cfg.pagos.d2||30,dim(y,m)); }
function periodOf(s){
  const d=pd(s),y=d.getFullYear(),m=d.getMonth()+1,day=d.getDate(),d1=+S.cfg.pagos.d1||15;
  let start,q;
  if(day<d1){ const pm=m===1?12:m-1,py=m===1?y-1:y; start=`${py}-${pad(pm)}-${pad(payday2(py,pm))}`; q=2; }
  else if(day>=payday2(y,m)){ start=`${y}-${pad(m)}-${pad(payday2(y,m))}`; q=2; }
  else { start=`${y}-${pad(m)}-${pad(d1)}`; q=1; }
  const sd=pd(start),sy=sd.getFullYear(),sm=sd.getMonth()+1;
  let next;
  if(q===1) next=`${sy}-${pad(sm)}-${pad(payday2(sy,sm))}`;
  else { const nm=sm===12?1:sm+1,ny=sm===12?sy+1:sy; next=`${ny}-${pad(nm)}-${pad(d1)}`; }
  return {start,next,q,mkey:start.slice(0,7)};
}
function perfilDe(k){
  const c=S.cfg; let pid=null;
  const list=c.perfilMes.slice().sort((a,b)=>a.desde<b.desde?-1:1);
  for(const r of list) if(r.desde<=k) pid=r.p;
  if(!pid&&list.length) pid=list[0].p;
  return c.perfiles.find(p=>p.id===pid)||c.perfiles[0];
}
const fijoActivo=(f,k)=>(!f.desde||f.desde<=k)&&(!f.hasta||f.hasta>=k);
const fijosMes=k=>S.cfg.fijos.filter(f=>fijoActivo(f,k));
const fijosPeriodo=(k,q)=>S.cfg.fijos.filter(f=>(+f.q||1)===q&&fijoActivo(f,k));
function cuotasProg(k){ return sum(fijosMes(k).filter(f=>{const c=S.catMap[f.c];return c&&S.bolMap[c.b]&&S.bolMap[c.b].k==='deuda';}).map(f=>f.m)); }
function fijoPagado(f,k){ return S.movs.some(x=>x.fx===f.id&&periodOf(x.f).mkey===k&&periodOf(x.f).q===(+f.q||1)); }

function mStats(k){ return memo('m'+k,()=>{
  const c=S.cfg, ms=S.movs.filter(x=>x.f.slice(0,7)===k);
  const r={k,n:ms.length,movs:ms,ingBase:0,ingExtra:0,gas:0,gasQ:0,gasMeta:0,aho:0,fijo:0,vari:0,variQ:0,deuda:0,byCat:{},byB:{},byMed:{},byDay:{}};
  for(const b of c.bolsillos) r.byB[b.id]=0;
  for(const x of ms){
    const m=x.m;
    if(x.t==='i'){ const cat=S.catMap[x.c]; if(cat&&cat.base) r.ingBase+=m; else r.ingExtra+=m; }
    else if(x.t==='g'){
      const cat=S.catMap[x.c];
      r.gas+=m; r.byCat[x.c]=(r.byCat[x.c]||0)+m; r.byDay[x.f]=(r.byDay[x.f]||0)+m;
      const fromQ=!x.src||x.src==='q';
      if(fromQ){ r.gasQ+=m; if(cat&&r.byB[cat.b]!=null) r.byB[cat.b]+=m; } else r.gasMeta+=m;
      if(cat&&cat.fijo) r.fijo+=m; else { r.vari+=m; if(fromQ) r.variQ+=m; }
      if(cat&&S.bolMap[cat.b]&&S.bolMap[cat.b].k==='deuda') r.deuda+=m;
      const pm=x.p||'otro'; r.byMed[pm]=(r.byMed[pm]||0)+m;
    } else if(x.t==='a'){ r.aho+=m; const mt=S.metaMap[x.c]; if(mt&&r.byB[mt.b]!=null) r.byB[mt.b]+=m; }
  }
  r.ing=r.ingBase+r.ingExtra;
  const esperado=(+c.pagos.e1||0)+(+c.pagos.e2||0);
  r.base=k<curMonth()?(r.ingBase||esperado):Math.max(r.ingBase,esperado);
  r.perfil=perfilDe(k);
  r.asig={}; for(const b of c.bolsillos) r.asig[b.id]=Math.round(r.base*(+r.perfil.pct[b.id]||0)/100);
  r.cuotas=Math.max(r.deuda,cuotasProg(k));
  r.tasaAho=r.ing>0?r.aho/r.ing:null;
  r.endeu=r.base>0?r.cuotas/r.base:null;
  r.libre=r.ing-r.gasQ-r.aho;
  const thr=+c.params.hormiga||15000;
  const hm=ms.filter(x=>x.t==='g'&&!(S.catMap[x.c]&&S.catMap[x.c].fijo)&&x.m<=thr);
  r.horm={n:hm.length,tot:sum(hm.map(x=>x.m)),byCat:{}};
  for(const x of hm) r.horm.byCat[x.c]=(r.horm.byCat[x.c]||0)+x.m;
  return r;
});}
function monthHasData(k){ return mStats(k).n>0; }
function firstMonth(){ const a=S.cfg.arranque&&S.cfg.arranque.f?S.cfg.arranque.f.slice(0,7):curMonth(); const m=S.movs.length?S.movs[S.movs.length-1].f.slice(0,7):a; return m<a?m:a; }
function monthsRange(endK,n){ const out=[]; for(let i=n-1;i>=0;i--) out.push(addMonthsK(endK,-i)); return out; }

function pStats(ds){ return memo('p'+ds,()=>{
  const c=S.cfg, p=periodOf(ds), arr=c.arranque||{};
  const inP=x=>x.f>=p.start&&x.f<p.next;
  const startP=!!(arr.f&&arr.saldo!=null&&arr.f>=p.start&&arr.f<p.next);
  const after=x=>!startP||x.f>=arr.f;
  const all=S.movs.filter(inP), live=all.filter(after);
  const totalDays=Math.max(1,diffDays(p.start,p.next));
  const ref=(ds>=p.start&&ds<p.next)?ds:p.start;
  const restDays=Math.max(1,diffDays(ref,p.next));
  const spanStart=startP?arr.f:p.start, spanDays=Math.max(1,diffDays(spanStart,p.next));
  const elapsed=Math.max(0,diffDays(spanStart,ref));
  let ingReg=0,ingExtra=0,gas=0,gasVar=0,aho=0;
  for(const x of live){
    if(x.t==='i'){ const cat=S.catMap[x.c]; if(cat&&cat.base) ingReg+=x.m; else ingExtra+=x.m; }
    else if(x.t==='g'&&(!x.src||x.src==='q')){ gas+=x.m; const cat=S.catMap[x.c]; if(!(cat&&cat.fijo)) gasVar+=x.m; }
    else if(x.t==='a') aho+=x.m;
  }
  const expected=p.q===1?(+c.pagos.e1||0):(+c.pagos.e2||0);
  let ingreso,fuente;
  if(startP){ ingreso=(+arr.saldo||0)+ingReg; fuente='arranque'; }
  else if(ingReg>0){ ingreso=ingReg; fuente='registrado'; }
  else { ingreso=expected; fuente='esperado'; }
  const fx=fijosPeriodo(p.mkey,p.q).map(f=>Object.assign({},f,{paid:all.some(x=>x.fx===f.id)}));
  const fijosTot=sum(fx.map(f=>f.m)), fijosPend=sum(fx.filter(f=>!f.paid).map(f=>f.m));
  const factor=startP?Math.min(1,spanDays/totalDays):1;
  const recs=(c.recs||[]).filter(r=>r.on!==false&&r.m>0).map(r=>{
    const spent=sum(live.filter(x=>x.t==='g'&&x.c===r.c&&(!x.src||x.src==='q')).map(x=>x.m));
    const plan=Math.round(r.m*factor);
    return Object.assign({},r,{plan,spent,pend:Math.max(0,plan-spent)});
  });
  const recPend=sum(recs.map(r=>r.pend));
  const pf=perfilDe(p.mkey);
  const pctAho=sum(c.bolsillos.filter(b=>b.k==='ahorro').map(b=>+pf.pct[b.id]||0));
  const ahoPlan=startP?0:Math.round(ingreso*pctAho/100);
  const ahoPend=Math.max(0,ahoPlan-aho);
  const disp=ingreso-gas-aho-fijosPend-recPend-ahoPend;
  const presVar=Math.max(1,ingreso-fijosTot-ahoPlan);
  const fracDin=gasVar/presVar, fracT=clamp(elapsed/spanDays,0,1);
  let estado='good';
  if(disp<0) estado='over'; else if(fracDin-fracT>0.25) estado='crit'; else if(fracDin-fracT>0.10) estado='warn';
  const rate=gasVar/Math.max(1,elapsed+1);
  let cover=null;
  if(rate>0&&disp>=0){ const days=Math.floor((disp+recPend)/rate); const dd=addDays(ref,days); if(dd<p.next) cover=dd; }
  return {p,start:p.start,next:p.next,q:p.q,startP,ingreso,fuente,ingExtra,gas,gasVar,aho,fx,fijosTot,fijosPend,recs,recPend,ahoPlan,ahoPend,disp,presVar,fracDin,fracT,estado,restDays,totalDays,elapsed,porDia:disp/restDays,cover,ref,needStart:false};
});}

function metaStats(mt){ return memo('mt'+mt.id,()=>{
  let ap=0,us=0; const byM={};
  for(const x of S.movs){ if(x.t==='a'&&x.c===mt.id){ ap+=x.m; const k=x.f.slice(0,7); byM[k]=(byM[k]||0)+x.m; } else if(x.t==='g'&&x.src===mt.id) us+=x.m; }
  const saldo=(+mt.ini||0)+ap-us, cur=curMonth();
  const nM=clamp(monthsBetween(firstMonth(),cur)+1,1,3);
  const prom=sum([0,1,2].slice(0,nM).map(i=>byM[addMonthsK(cur,-i)]||0))/nM;
  const obj=+mt.obj||0, falta=Math.max(0,obj-saldo);
  const meses=falta===0?0:(prom>0?Math.ceil(falta/prom):null);
  const fechaEst=meses!=null?addMonthsK(cur,meses):null;
  let necesita=null;
  if(isYm(mt.fecha)&&falta>0){ const mm=Math.max(1,monthsBetween(cur,mt.fecha)); necesita=Math.ceil(falta/mm); }
  return {ap,us,saldo,prom,falta,meses,fechaEst,necesita,pv:obj>0?saldo/obj:null};
});}
function nper(i,S0,C){ if(S0<=0) return 0; if(C<=0) return null; if(i<=0) return S0/C; if(C<=S0*i) return Infinity; return -Math.log(1-i*S0/C)/Math.log(1+i); }
function cuotaDe(d){ return sum(fijosMes(curMonth()).filter(f=>f.c===d.c).map(f=>+f.m||0))||(+d.cuota||0); }
function deudaStats(d){ return memo('dd'+d.id,()=>{
  const pag=sum(S.movs.filter(x=>x.t==='g'&&x.c===d.c&&(!d.fs||x.f>=d.fs)).map(x=>x.m));
  const saldo=Math.max(0,(+d.saldo||0)-pag);
  const i=(+d.tasa>0)?Math.pow(1+d.tasa/100,1/12)-1:0;
  const n=nper(i,saldo,cuotaDe(d));
  const fin=(n!=null&&isFinite(n))?addMonthsK(curMonth(),Math.ceil(n)):null;
  return {pag,saldo,i,n,fin,interesMes:saldo*i};
});}
function simAbono(d,X){
  const st=deudaStats(d), C=cuotaDe(d);
  if(!(C>0)||st.saldo<=0) return null;
  const x=clamp(X,0,st.saldo), n1=nper(st.i,st.saldo,C), n2=nper(st.i,st.saldo-x,C);
  if(n1==null||!isFinite(n1)||n2==null||!isFinite(n2)) return null;
  const int1=Math.max(0,C*n1-st.saldo), int2=Math.max(0,C*n2-(st.saldo-x));
  return {n1,n2,mesesMenos:n1-n2,intAhorro:int1-int2,fin2:addMonthsK(curMonth(),Math.ceil(n2))};
}
function forecast(vals){
  const n=vals.length; if(!n) return null;
  if(n<3){ const a=sum(vals)/n; return {f:[a,a,a],method:n===1?'basado en 1 mes':'promedio de 2 meses'}; }
  const mx=(n-1)/2,my=sum(vals)/n; let sxy=0,sxx=0;
  for(let i=0;i<n;i++){ sxy+=(i-mx)*(vals[i]-my); sxx+=(i-mx)*(i-mx); }
  const b=sxy/sxx,a=my-b*mx;
  return {f:[n,n+1,n+2].map(x=>Math.max(0,a+b*x)),slope:b,method:`tendencia de ${n} meses`};
}
function projMonth(k){ return memo('pj'+k,()=>{
  const r=mStats(k), a=k.split('-').map(Number), D=dim(a[0],a[1]);
  const t=todayStr(); const day=t.slice(0,7)===k?pd(t).getDate():D;
  let rate;
  if(day>=5) rate=r.variQ/day;
  else { const pr=mStats(addMonthsK(k,-1)); const pa=addMonthsK(k,-1).split('-').map(Number); rate=pr.variQ>0?pr.variQ/dim(pa[0],pa[1]):r.variQ/Math.max(1,day); }
  const fxPend=sum(fijosMes(k).filter(f=>!fijoPagado(f,k)).map(f=>f.m));
  return {proj:Math.round(r.gasQ+rate*(D-day)+fxPend),rate,fxPend,day,D};
});}

/* =========================================================
   Recomendaciones (reglas locales)
   ========================================================= */
function recsFor(k){
  const c=S.cfg, cur=curMonth(), r=mStats(k), out=[];
  const add=(lvl,t,d)=>out.push({lvl,t,d});
  if(k===cur){
    const p=pStats(todayStr());
    if(p.estado==='over') add('crit','Te pasaste en esta quincena',`Vas ${money(-p.disp)} por encima de lo disponible. Hasta el ${fmtD(p.next)} gasta solo en lo indispensable para no terminar usando la tarjeta.`);
    else if(p.estado==='crit') add('crit','Estás gastando muy rápido',`Llevas el ${pct(p.fracDin)} de tu dinero para gastos en el ${pct(p.fracT)} de la quincena.${p.cover?` A este ritmo te alcanza hasta el ${fmtD(p.cover)}.`:''}`);
    else if(p.estado==='warn') add('warn','Vas un poco rápido',`Has usado el ${pct(p.fracDin)} de tu dinero para gastos y ha pasado el ${pct(p.fracT)} de la quincena. Bájale un poco a los gustos estos días.`);
    const pend=p.fx.filter(f=>!f.paid);
    if(pend.length) add('info',pend.length===1?'Pago pendiente esta quincena':'Pagos pendientes esta quincena',pend.map(f=>`${f.n} ${money(f.m)}`).join(' · ')+'. Regístralos cuando los pagues.');
    if(!p.startP&&p.ahoPend>0&&p.restDays<=6) add('warn','Falta separar tu ahorro',`Tu plan es ahorrar ${money(p.ahoPlan)} esta quincena y llevas ${money(p.aho)}. Sepáralo antes del ${fmtD(p.next)}.`);
    if(!S.movs.length) add('info','Empieza a registrar','Registra cada gasto el mismo día, o al final de la semana con el modo "Con IA". Con dos semanas de datos aparecen tus patrones.');
    else { const dd=diffDays(S.movs[0].f,todayStr()); if(dd>=3) add('info','¿Te falta registrar algo?',`Tu último movimiento es del ${fmtD(S.movs[0].f)}.`); }
  }
  const dom=k===cur?pd(todayStr()).getDate():31;
  for(const b of c.bolsillos){
    if(b.k==='ahorro') continue;
    const used=r.byB[b.id]||0, asig=r.asig[b.id]||0;
    if(asig>0&&used>asig) add('crit',`Bolsillo ${b.n} superado`,`Usaste ${money(used)} de ${money(asig)} (${pct(used/asig)}). Compensa con otro bolsillo o ajusta el porcentaje si ese es tu gasto real.`);
    else if(asig>0&&used/asig>=0.85&&dom<25) add('warn',`Bolsillo ${b.n} casi lleno`,`Llevas el ${pct(used/asig)}: ${money(used)} de ${money(asig)}.`);
    else if(asig===0&&used>0) add('warn',`Gasto sin presupuesto en ${b.n}`,`Registraste ${money(used)} y este bolsillo tiene 0% en tu perfil.`);
  }
  const lim=(+c.params.limDeuda||30)/100;
  if(r.endeu!=null&&r.endeu>lim) add('warn','Cuotas por encima del límite sano',`Tus cuotas son el ${pct(r.endeu)} de tu ingreso (tu límite: ${pct(lim)}). No tomes deudas nuevas hasta que bajen.`);
  const cred=sum(r.movs.filter(x=>x.t==='g'&&S.medMap[x.p]&&S.medMap[x.p].cred&&!(S.catMap[x.c]&&S.catMap[x.c].fijo)).map(x=>x.m));
  if(cred>0) add('warn','Compras con tarjeta de crédito',`Este mes pagaste ${money(cred)} con tarjeta de crédito. Mientras pagas deudas, cada compra a cuotas alarga la salida.`);
  const prevKs=[1,2,3].map(i=>addMonthsK(k,-i)).filter(monthHasData);
  if(prevKs.length){
    const ups=[];
    for(const [id,v] of Object.entries(r.byCat)){
      const cat=S.catMap[id]; if(!cat||cat.fijo) continue;
      const avg=sum(prevKs.map(kk=>mStats(kk).byCat[id]||0))/prevKs.length;
      if(avg>0&&v>avg*1.3&&v-avg>=30000) ups.push({cat,v,avg});
    }
    ups.sort((a,b)=>(b.v-b.avg)-(a.v-a.avg)).slice(0,2).forEach(u=>add('warn',`${u.cat.n}: +${pct((u.v-u.avg)/u.avg)}`,`Llevas ${money(u.v)} y tu promedio es ${money(u.avg)} (últimos ${prevKs.length} ${prevKs.length===1?'mes':'meses'}).`));
  }
  if(r.horm.n>=5&&r.horm.tot>=0.1*Math.max(1,r.vari)) add('info','Gastos hormiga',`${r.horm.n} compras pequeñas (hasta ${money(c.params.hormiga)}) suman ${money(r.horm.tot)}: el ${pct(r.horm.tot/Math.max(1,r.vari))} de tus gastos variables.`);
  if(r.ingExtra>0) add('info','Ingreso extra este mes',`Recibiste ${money(r.ingExtra)} fuera de tu salario. Una regla útil: la mitad al colchón y la mitad a la deuda más cara.`);
  const meta=(+c.params.metaAhorro||10)/100;
  if(k<cur&&r.ing>0&&r.tasaAho!=null&&r.tasaAho<meta) add('warn','Ahorro por debajo de tu meta',`Ahorraste el ${pct(r.tasaAho)} de tus ingresos y tu meta es ${pct(meta)}.`);
  for(const mt of c.metas.filter(m=>!m.arch&&m.obj>0)){ const st=metaStats(mt); if(st.saldo>=mt.obj) add('good',`Meta lograda: ${mt.n}`,`Tienes ${money(st.saldo)} de ${money(mt.obj)}.`); }
  if(r.n>0&&!out.some(x=>x.lvl==='crit'||x.lvl==='warn')) add('good','Vas bien este mes','Tus bolsillos están dentro del presupuesto. Sigue registrando para mantener el control.');
  const ord={crit:0,warn:1,info:2,good:3};
  return out.sort((a,b)=>ord[a.lvl]-ord[b.lvl]);
}

/* =========================================================
   Persistencia
   ========================================================= */
const QUEUE={};
function enqueue(path,fn){
  const prev=QUEUE[path]||Promise.resolve();
  S.saving++; setSync();
  const next=prev.catch(()=>{}).then(fn);
  QUEUE[path]=next;
  return next.finally(()=>{ S.saving--; setSync(); });
}
async function withRetry(fn){ try{ return await fn(); }catch(e){ if(e&&e.code==='unavailable'){ await sleep(400+Math.random()*700); return fn(); } throw e; } }
function cleanMov(m){
  const o={f:m.f,t:m.t,c:m.c,m:Math.round(+m.m||0),ts:m.ts||Date.now()};
  if(m.p) o.p=m.p; if(m.src&&m.src!=='q') o.src=m.src; if(m.d) o.d=String(m.d).slice(0,140); if(m.fx) o.fx=m.fx; if(m.o) o.o=m.o;
  return o;
}
function writeItems(k,items){
  if(S.mode==='demo'){
    const doc=S.movsDocs[k]||{items:{}}; S.movsDocs[k]={items:Object.assign({},doc.items,items)};
    invalidate(); scheduleRender(); return Promise.resolve();
  }
  const path='movs/'+k, db=S.cap.db;
  return enqueue(path,()=>withRetry(async()=>{
    const ref=db.doc(path);
    if(S.movsDocs[k]) return ref.update({items});
    const snap=await ref.get();
    if(snap.exists) return ref.update({items});
    const clean={}; for(const [id,v] of Object.entries(items)) if(v) clean[id]=v;
    return ref.set({items:clean});
  }));
}
async function putMovs(list){
  const groups={};
  for(const m of list){ const k=m.f.slice(0,7); (groups[k]=groups[k]||{})[m.id]=cleanMov(m); }
  await Promise.all(Object.entries(groups).map(([k,it])=>writeItems(k,it)));
}
async function delMov(m){ await writeItems(m.f.slice(0,7),{[m.id]:null}); }
function saveCfg(cfg){
  S.cfg=cfg; invalidate();
  if(S.mode==='demo'){ scheduleRender(); return Promise.resolve(); }
  const snapshot=clone(cfg);
  return enqueue('config/main',()=>withRetry(()=>S.cap.db.doc('config/main').set(snapshot)));
}
function failSave(e){
  const code=e&&e.code;
  toast(code==='quota_exceeded'?'Se llenó el espacio de datos. Exporta y borra meses viejos.':code==='invalid_argument'?'No tienes permiso para guardar en esta app.':'No se pudo guardar. Revisa tu conexión e intenta de nuevo.');
}

/* =========================================================
   Arranque: capacidades, modo en vivo y modo ejemplo
   ========================================================= */
async function init(){
  buildShell(); route(); render();
  const cl=window.claude;
  if(!cl||typeof cl.use!=='function'){ startDemo(); return; }
  const dbP=cl.use('db').catch(()=>null), userP=cl.use('user').catch(()=>null);
  cl.use('sample').then(s=>{ S.cap.sample=s||null; scheduleRender(); }).catch(()=>{});
  cl.use('dictation').then(d=>{ S.cap.dict=d||null; if(d) setupDictation(); scheduleRender(); }).catch(()=>{});
  cl.use('downloads').then(d=>{ S.cap.dl=d||null; scheduleRender(); }).catch(()=>{});
  const [db,user]=await Promise.all([dbP,userP]);
  S.cap.user=user;
  if(!db){ startDemo(); return; }
  if(user&&typeof user.isOwner==='function'){ let own=null; try{ own=await user.isOwner(); }catch(e){} if(own===false){ S.mode='noaccess'; render(); return; } }
  S.cap.db=db; startLive();
}
function startLive(){
  const db=S.cap.db;
  S.loadTimer=setTimeout(()=>{ if(S.mode!=='live'){ S.slow=true; render(); } },10000);
  db.doc('config/main').onSnapshot(snap=>{
    S.gotCfg=true;
    if(snap.exists){ S.cfg=migrate(snap.data()); S.noCfg=false; }
    else { S.noCfg=true; if(!S.cfg) S.cfg=defaultConfig(); }
    if(!S.dirty) S.draft=null;
    ready();
  },e=>{ S.dbErr=(e&&e.code)||'unavailable'; render(); });
  db.collection('movs').onSnapshot(snap=>{
    S.gotMovs=true; const docs={};
    for(const d of snap.docs){ const v=d.data(); if(v) docs[d.id]=v; }
    S.movsDocs=docs; ready();
  },e=>{ S.dbErr=(e&&e.code)||'unavailable'; render(); });
}
function ready(){
  if(S.gotCfg&&S.gotMovs){ clearTimeout(S.loadTimer); S.slow=false; if(S.mode!=='live'){ S.mode='live'; } invalidate(); if(!S.reg) S.reg=newReg(); scheduleRender(); }
}
function startDemo(){
  S.mode='demo'; S.cfg=demoConfig(); S.movsDocs=demoMovs(); invalidate(); S.reg=newReg(); render();
}
function demoConfig(){
  const c=defaultConfig(), k=curMonth();
  c.nombre='Ejemplo';
  c.pagos={d1:15,d2:30,e1:1100000,e2:900000};
  c.perfiles=[{id:'f1',n:'Plan de ejemplo',pct:{b1:42,b2:25,b3:8,b4:5,b5:5,b6:15}}];
  c.perfilMes=[{desde:addMonthsK(k,-3),p:'f1'}];
  c.fijos=[{id:'fx1',n:'Servicios',c:'serv',m:110000,q:1,desde:'',hasta:''},{id:'fx2',n:'Plan de celular',c:'cel',m:50000,q:1,desde:'',hasta:''},{id:'fx3',n:'Tarjeta de crédito',c:'tc',m:300000,q:1,desde:'',hasta:''},{id:'fx4',n:'Parqueadero',c:'parq',m:60000,q:2,desde:'',hasta:''},{id:'fx5',n:'Crédito de estudio',c:'credu',m:350000,q:2,desde:'',hasta:''},{id:'fx6',n:'Música',c:'subs',m:20000,q:1,desde:'',hasta:''}];
  c.recs=[{id:'r1',n:'Gasolina',c:'gas',m:70000,on:true},{id:'r2',n:'Parqueadero universidad',c:'parqu',m:30000,on:true}];
  c.metas=[{id:'m1',n:'Colchón de emergencia',b:'b3',obj:1300000,fecha:'',ini:150000},{id:'m2',n:'Ropa',b:'b4',obj:300000,fecha:addMonthsK(k,3),ini:0}];
  c.deudas=[{id:'d1',n:'Tarjeta de crédito',c:'tc',saldo:1800000,fs:addMonthsK(k,-2)+'-01',tasa:26,cuota:300000}];
  c.arranque={f:addMonthsK(k,-3)+'-01',saldo:null};
  return c;
}
function demoMovs(){
  let seed=7; const rnd=()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  const docs={}, today=todayStr(), k0=curMonth();
  const put=(f,t,c,m,o)=>{ if(f>today) return; const k=f.slice(0,7); const id=uid('e'); (docs[k]=docs[k]||{items:{}}).items[id]=Object.assign({f,t,c,m:Math.round(m/100)*100,p:'nequi',ts:Date.now()},o||{}); };
  for(let back=3;back>=0;back--){
    const k=addMonthsK(k0,-back), a=k.split('-').map(Number), D=dim(a[0],a[1]);
    put(`${k}-15`,'i','sal',1100000,{p:'deb'}); put(`${k}-${pad(Math.min(30,D))}`,'i','sal',900000,{p:'deb'});
    put(`${k}-15`,'g','serv',110000,{fx:'fx1',p:'deb'}); put(`${k}-15`,'g','cel',50000,{fx:'fx2',p:'deb'}); put(`${k}-16`,'g','tc',300000,{fx:'fx3',p:'deb'}); put(`${k}-15`,'g','subs',20000,{fx:'fx6',p:'tc'});
    put(`${k}-${pad(Math.min(30,D))}`,'g','parq',60000,{fx:'fx4',p:'efe'}); put(`${k}-${pad(Math.min(30,D))}`,'g','credu',350000,{fx:'fx5',p:'deb'});
    put(`${k}-16`,'a','m1',60000+back*10000,{p:'deb'}); put(`${k}-${pad(Math.min(30,D))}`,'a','m2',40000,{p:'deb'});
    for(let d=1;d<=D;d++){
      const f=`${k}-${pad(d)}`, wd=pd(f).getDay();
      if(wd>=1&&wd<=5){ put(f,'g','alm',11000+rnd()*7000,{p:rnd()<.6?'nequi':'efe'}); if(rnd()<.35) put(f,'g','antojos',3000+rnd()*7000,{p:'efe',d:'Tienda'}); }
      if(wd===1) put(f,'g','gas',33000+rnd()*5000,{p:'deb'});
      if(wd===2||wd===4) put(f,'g','parqu',7500,{p:'efe'});
      if(wd===5&&rnd()<.7) put(f,'g','salidas',25000+rnd()*45000*(1+back*0.1),{p:rnd()<.3?'tc':'nequi'});
      if(wd===6&&rnd()<.5) put(f,'g','comida',60000+rnd()*50000,{p:'deb',d:'Mercado'});
      if(d===12||d===27) put(f,'g','pelu',30000,{p:'efe'});
      if(d===9&&back%2===0) put(f,'g','mant',57000,{p:'efe',d:'Aceite y filtro'});
      if(d===20&&rnd()<.6) put(f,'g','comp',25000+rnd()*40000,{p:'nequi',d:'Componentes'});
    }
  }
  return docs;
}

/* =========================================================
   Shell, navegación, render
   ========================================================= */
const EXT = {views:{},nav:null,after:null};
const VIEWS=['inicio','registrar','movimientos','analisis','metas','ajustes'];
const NAV=[['inicio','home','Inicio'],['movimientos','list','Movimientos'],['registrar','plus','Registrar'],['analisis','chart','Análisis'],['metas','target','Metas']];
function buildShell(){
  const rail=$('#rail'), tab=$('#tabbar');
  rail.innerHTML=`<div class="brand"><span class="brand-mark">生</span><span class="brand-name">Ikigai</span></div>
    <a href="#inicio" data-nav="inicio">${ic('home')}Inicio</a>
    <a href="#registrar" data-nav="registrar" class="rail-add">${ic('plus')}Registrar</a>
    <a href="#movimientos" data-nav="movimientos">${ic('list')}Movimientos</a>
    <a href="#analisis" data-nav="analisis">${ic('chart')}Análisis</a>
    <a href="#metas" data-nav="metas">${ic('target')}Metas y deudas</a>
    <a href="#ajustes" data-nav="ajustes">${ic('gear')}Ajustes</a>
    <div class="rail-foot">Privado: solo tú ves estos datos.</div>`;
  tab.innerHTML=NAV.map(([v,i,l])=>`<a href="#${v}" data-nav="${v}" class="${v==='registrar'?'add':''}">${ic(i)}<span>${l}</span></a>`).join('');
}
function route(){
  const h=(location.hash||'').replace('#','');
  const v=(VIEWS.includes(h)||EXT.views[h])?h:'inicio';
  if(v!==S.view){ S.view=v; window.scrollTo(0,0); }
  S.view=v;
}
window.addEventListener('hashchange',()=>{ route(); if(S.view!=='ajustes'&&!S.dirty) S.draft=null; render(); });
function setSync(){
  const el=$('#sync'); if(!el) return;
  let s='ok',t='Guardado';
  if(S.mode==='demo'){ s='demo'; t='Ejemplo'; }
  else if(S.mode==='loading'){ s='saving'; t='Cargando'; }
  else if(S.dbErr){ s='off'; t='Sin conexión'; }
  else if(S.saving>0){ s='saving'; t='Guardando'; }
  el.dataset.s=s; el.querySelector('span').textContent=t;
}
function setHeader(){
  if(EXT.nav){ try{ EXT.nav(S.view); }catch(e){ console.error(e); } }
  for(const a of $$('[data-nav]')) a.setAttribute('aria-current',a.dataset.nav===S.view?'page':'false');
  const sw=$('#monthSw'), showM=['inicio','movimientos','analisis'].includes(S.view)&&S.cfg;
  sw.hidden=!showM;
  if(showM){
    const cur=curMonth();
    sw.innerHTML=`<button type="button" data-act="mprev" aria-label="Mes anterior">${ic('l','sm')}</button><span class="lbl">${esc(fmtM(S.month))}</span><button type="button" data-act="mnext" aria-label="Mes siguiente" ${S.month>=cur?'disabled':''}>${ic('r','sm')}</button>`;
  }
  setSync();
}
function scheduleRender(){
  const a=document.activeElement;
  if(a&&$('#main').contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=='range'){ S.pendingRender=true; return; }
  render();
}
document.addEventListener('focusout',()=>{ if(S.pendingRender){ setTimeout(()=>{ const a=document.activeElement; if(a&&$('#main').contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return; S.pendingRender=false; render(); },0); } });

const CH={};
function render(){
  S.pendingRender=false;
  hideTip();
  setHeader();
  const main=$('#main');
  let html='';
  if(S.mode==='loading'||(S.mode!=='demo'&&S.mode!=='noaccess'&&(!S.gotCfg||!S.gotMovs))){
    html=`<div class="view"><div class="loading"><span class="thinking"><i></i>Cargando tus datos…</span>${S.slow?'<p class="small">Todavía no responde el almacenamiento. Si sigue así, revisa tu conexión.</p>':''}${S.dbErr?`<p class="small">No se pudo conectar (${esc(S.dbErr)}). Recarga la página para intentar de nuevo.</p>`:''}</div></div>`;
  } else if(S.mode==='noaccess'){
    html=`<div class="view"><div class="loading"><h2>Esta app es privada</h2><p class="ink2">Solo su dueño puede ver y registrar movimientos.</p></div></div>`;
  } else {
    if(!S.reg) S.reg=newReg();
    for(const k of Object.keys(CH)) delete CH[k];
    const ext=EXT.views[S.view];
    const fn=ext||{inicio:vInicio,registrar:vRegistrar,movimientos:vMovs,analisis:vAnalisis,metas:vMetas,ajustes:vAjustes}[S.view];
    html=(S.mode==='demo'?`<div class="view" style="margin-bottom:16px"><div class="banner">${ic('info')}<div><b>Vista de ejemplo con datos inventados.</b> Abre esta app desde Claude con tu cuenta para ver y guardar tus datos reales.</div></div></div>`:'')+(S.noCfg&&S.view!=='ajustes'&&!ext?`<div class="view" style="margin-bottom:16px"><div class="banner warn">${ic('warn')}<div><b>Falta tu configuración.</b> Define tus ingresos, pagos fijos y porcentajes en <a href="#ajustes">Ajustes</a>.</div></div></div>`:'')+fn();
  }
  main.innerHTML=html;
  afterRender();
}
function afterRender(){
  if(EXT.after){ try{ EXT.after(S.view); }catch(e){ console.error(e); } }
  drawCharts();
  for(const b of $$('.segbar > div')){ const sp=b.querySelector('span'); if(sp&&sp.scrollWidth>b.clientWidth-10) sp.classList.add('hide'); }
  if(S.view==='registrar'&&S.regMode==='rapido'&&S.focusAmt){ S.focusAmt=false; const a=$('#amt'); if(a&&window.matchMedia('(pointer:fine)').matches) a.focus(); }
}

/* =========================================================
   Componentes de vista
   ========================================================= */
function tile(label,value,delta,spark,extra){
  return `<div class="tile"><span class="l">${esc(label)}</span><span class="v">${value}</span><span class="d">${delta||''}${extra||''}</span>${spark?`<div class="chart" data-ch="${spark}" style="height:26px"></div>`:''}</div>`;
}
function mtd(k,day){ const r={ing:0,gas:0,aho:0,n:0}; for(const x of S.movs){ if(x.f.slice(0,7)!==k||+x.f.slice(8)>day) continue; r.n++; if(x.t==='i') r.ing+=x.m; else if(x.t==='g') r.gas+=x.m; else if(x.t==='a') r.aho+=x.m; } return r; }
function deltaTxt(now,prev,upGood,isPct,lbl){
  if(prev==null||now==null||!isFinite(prev)||!isFinite(now)) return '<span class="muted">sin mes anterior</span>';
  const d=now-prev; if(Math.abs(d)<(isPct?0.0005:1)) return '<span>igual que el mes anterior</span>';
  const up=d>0, good=up===upGood;
  const txt=isPct?`${up?'+':'−'}${Math.abs(d*100).toLocaleString('es-CO',{maximumFractionDigits:1})} pts`:`${up?'+':'−'}${money(Math.abs(d)).replace('−','')}`;
  return `<span class="${up?(good?'up-good':'up-bad'):(good?'down-good':'down-bad')}">${up?'▲':'▼'} ${txt}</span><span>${esc(lbl||('vs '+fmtMs(addMonthsK(S.month,-1))))}</span>`;
}
function meterRow(b,used,asig){
  const isAho=b.k==='ahorro', p=asig>0?used/asig:(used>0?2:0);
  let cls=''; if(!isAho){ if(p>1) cls='crit'; else if(p>=0.85) cls='warn'; }
  const right=isAho?`${money(used)} de ${money(asig)} ahorrado`:`${money(used)} de ${money(asig)}`;
  const foot=isAho?(used>=asig&&asig>0?'Plan cumplido':`Faltan ${money(Math.max(0,asig-used))}`):(used>asig?`Te pasaste ${money(used-asig)}`:`Quedan ${money(asig-used)}`);
  return `<div class="meter"><div class="meter-h"><span class="n"><i class="dot" style="background:${bColor(b.id)}"></i><span>${esc(b.n)}</span></span><span class="v">${right}</span></div>
    <div class="meter-track" role="progressbar" aria-label="${esc(b.n)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(clamp(p,0,1)*100)}"><div class="meter-fill ${cls}" style="width:${(clamp(p,0,1)*100).toFixed(1)}%"></div></div>
    <div class="meter-foot"><span>${pct(asig>0?used/asig:null)} usado</span><span>${foot}</span></div></div>`;
}
function segbar(parts,label){
  const tot=sum(parts.map(p=>p.v)); if(tot<=0) return '';
  const dark=c=>/s4\)|warn/.test(c);
  return `<div class="segbar" role="img" aria-label="${esc(label)}">${parts.filter(p=>p.v>0).map(p=>`<div style="flex:${p.v} 1 0;background:${p.c}" class="${dark(p.c)?'dark':''}" data-tt="${esc(p.n)}" data-tv="${esc(money(p.v))}" data-tl="${esc(pct(p.v/tot))} del total" data-tk="${p.c}" tabindex="0"><span>${esc(pct(p.v/tot))}</span></div>`).join('')}</div>
  <div class="legend">${parts.filter(p=>p.v>0).map(p=>`<span><i class="key" style="background:${p.c}"></i>${esc(p.n)}</span>`).join('')}</div>`;
}
function movRow(x){
  const cat=S.catMap[x.c], mt=S.metaMap[x.c];
  const name=x.t==='a'?(mt?mt.n:'Ahorro'):(cat?cat.n:'Sin categoría');
  const b=bOf(x), abbr=norm(name).replace(/[^a-z ]/g,'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'·';
  const sub=[x.d, S.medMap[x.p]&&S.medMap[x.p].n, x.src&&x.src!=='q'&&S.metaMap[x.src]?`pagado con ${S.metaMap[x.src].n}`:'', x.fx?'pago fijo':''].filter(Boolean).join(' · ');
  const amt=x.t==='i'?`+${money(x.m)}`:x.t==='a'?money(x.m):`−${money(x.m)}`;
  return `<button type="button" class="mrow" data-act="edit" data-id="${esc(x.id)}"><span class="badge">${b?`<i style="background:${bColor(b)}"></i>`:''}${esc(abbr)}</span><span class="main"><span class="c">${esc(name)}</span><span class="s">${esc(sub||TIPOS[x.t])}</span></span><span class="amt ${x.t==='i'?'in':x.t==='a'?'sv':''}">${amt}</span></button>`;
}
function emptyBox(txt,btn){ return `<div class="empty"><span>${txt}</span>${btn||''}</div>`; }
function tableToggle(id){ return `<button type="button" class="linkbtn" data-act="tbl" data-id="${id}">${S.tbl[id]?'Ver gráfica':'Ver tabla'}</button>`; }

/* ---------------- Inicio ---------------- */
function vInicio(){
  const k=S.month, cur=curMonth(), r=mStats(k), prev=mStats(addMonthsK(k,-1)), hasPrev=prev.n>0;
  const parts=[];
  parts.push(k===cur?heroQuincena():heroMes(r));
  const ks=monthsRange(k,6);
  CH.spIng={type:'spark',v:ks.map(x=>mStats(x).ing)}; CH.spGas={type:'spark',v:ks.map(x=>mStats(x).gas)}; CH.spAho={type:'spark',v:ks.map(x=>mStats(x).aho)};
  const pj=k===cur?projMonth(k):null;
  const day=pd(todayStr()).getDate(), pv=k===cur?mtd(addMonthsK(k,-1),day):{ing:prev.ing,gas:prev.gas,aho:prev.aho};
  const lbl=k===cur?`vs ${day} de ${MESC[pd(addMonthsK(k,-1)+'-01').getMonth()]}`:null;
  parts.push(`<section class="tiles" aria-label="Resumen del mes">
    ${tile('Ingresos',money(r.ing),hasPrev?deltaTxt(r.ing,pv.ing,true,false,lbl):'<span class="muted">primer mes</span>','spIng')}
    ${tile('Gastos',money(r.gas),hasPrev?deltaTxt(r.gas,pv.gas,false,false,lbl):'<span class="muted">primer mes</span>','spGas')}
    ${tile('Ahorro',money(r.aho),hasPrev?deltaTxt(r.aho,pv.aho,true,false,lbl):'<span class="muted">primer mes</span>','spAho')}
    ${tile('Tasa de ahorro',pct(r.tasaAho,1),`<span>meta ${pct((+S.cfg.params.metaAhorro||10)/100)}</span>`)}
    ${tile('Cuotas / ingreso',pct(r.endeu,1),`<span class="${r.endeu>(+S.cfg.params.limDeuda||30)/100?'up-bad':''}">límite ${pct((+S.cfg.params.limDeuda||30)/100)}</span>`)}
    ${pj?tile('Cierre estimado',money(pj.proj),`<span>gasto total si sigues igual</span>`):tile('Saldo libre',money(r.libre),'<span>ingresos − gastos − ahorro</span>')}
  </section>`);
  parts.push(`<div class="grid g2">${panelBolsillos(r)}${panelRecs(k)}</div>`);
  const last=r.movs.slice(0,6);
  parts.push(`<section class="panel"><div class="panel-h"><h2>Últimos movimientos</h2><a class="linkbtn" href="#movimientos">Ver todos</a></div>${last.length?`<div class="mlist">${last.map(movRow).join('')}</div>`:emptyBox(`Aún no hay movimientos en ${esc(fmtM(k))}.`,`<a class="btn primary sm" href="#registrar">${ic('plus','sm')}Registrar el primero</a>`)}</section>`);
  return `<div class="view">${parts.join('')}</div>`;
}
function heroQuincena(){
  const c=S.cfg, a=c.arranque||{}, today=todayStr(), per=periodOf(today);
  const needStart=a.saldo==null&&a.f&&a.f>=per.start&&a.f<per.next;
  if(needStart){
    return `<section class="hero" aria-label="Punto de partida"><div class="hero-top"><span class="eyebrow">Quincena · ${esc(fmtD(per.start))} → ${esc(fmtD(addDays(per.next,-1)))}</span><span class="pill">Primer día</span></div>
      <div><h2 style="font-size:1.35rem">¿Con cuánta plata arrancas hoy?</h2><p class="hero-sub">Suma lo que tienes disponible en efectivo y cuentas, sin contar ahorros. Con eso calculo cuánto puedes gastar por día hasta el ${esc(fmtD(per.next))}.</p></div>
      <div class="row"><div class="amount" style="border-color:var(--hero-line);flex:1;min-width:200px"><span style="color:var(--hero-mute)">$</span><input id="startAmt" inputmode="numeric" autocomplete="off" aria-label="Saldo disponible hoy" placeholder="0" style="color:var(--hero-ink);font-size:2rem" data-money="1"></div><button type="button" class="btn" data-act="setStart">Guardar punto de partida</button></div></section>`;
  }
  const p=pStats(today);
  const stMap={good:['good','ok','A buen ritmo'],warn:['warn','warn','Vas rápido'],crit:['crit','warn','Muy rápido'],over:['crit','warn','Sobregirado']};
  const st=stMap[p.estado];
  const fd=clamp(p.fracDin,0,1), ft=clamp(p.fracT,0,1);
  const fxHtml=p.fx.length?p.fx.map(f=>`<div class="fx ${f.paid?'paid':''}"><span class="n">${esc(f.n)}</span><span class="m">${money(f.m)}</span>${f.paid?`<span class="ok">${ic('ok','sm')}Pagado</span>`:`<button type="button" data-act="payfx" data-id="${esc(f.id)}">Registrar pago</button>`}</div>`).join(''):`<p class="small" style="color:var(--hero-mute)">No hay pagos fijos programados en esta quincena.</p>`;
  const recHtml=p.recs.length?`<div class="eyebrow" style="margin-top:14px">Reservado para gastos que se repiten</div><div class="fx-list">${p.recs.map(r=>`<div class="fx rc" title="${esc(`Gastado ${money(r.spent)} de ${money(r.plan)}`)}"><span class="n">${esc(r.n)}</span><span class="m">${r.pend>0?`queda ${money(r.pend)} de ${money(r.plan)}`:'cubierto'}</span></div>`).join('')}</div>`:'';
  const calc=[
    [p.fuente==='arranque'?'Punto de partida':p.fuente==='registrado'?'Ingreso registrado':'Ingreso esperado',money(p.ingreso)],
    ['Gastado en la quincena','−'+money(p.gas).replace('−','')],
    ['Ahorrado','−'+money(p.aho).replace('−','')],
    ['Pagos fijos pendientes','−'+money(p.fijosPend).replace('−','')],
    ['Reservas de gastos que se repiten','−'+money(p.recPend).replace('−','')],
    ['Ahorro que falta separar','−'+money(p.ahoPend).replace('−','')]
  ];
  return `<section class="hero" aria-label="Quincena actual"><div class="hero-cols"><div>
    <div class="hero-top"><span class="eyebrow">Quincena · ${esc(fmtD(p.start))} → ${esc(fmtD(addDays(p.next,-1)))}</span><span class="pill ${st[0]}">${ic(st[1],'sm')}${st[2]}</span></div>
    <div class="hero-fig ${p.disp<0?'neg':''}">${money(p.disp)}</div>
    <p class="hero-sub">${p.disp>=0?`disponible para gastar · <b>${money(p.porDia)} por día</b>`:'por encima de lo disponible'} · ${p.restDays===1?'último día':`quedan ${p.restDays} días`} (pago el ${esc(fmtD(p.next))})</p>
    <div class="pace" style="margin-top:16px">
      <div class="pace-row"><span>Tiempo</span><div class="pace-track"><div class="pace-fill time" style="width:${(ft*100).toFixed(1)}%"></div></div><span class="v">${pct(ft)}</span></div>
      <div class="pace-row"><span>Dinero usado</span><div class="pace-track"><div class="pace-fill ${p.estado==='good'?'':p.estado==='warn'?'warn':'crit'}" style="width:${(fd*100).toFixed(1)}%"></div></div><span class="v">${pct(p.fracDin)}</span></div>
    </div>
    <details style="margin-top:14px"><summary>¿De dónde sale este número?</summary><div class="calc">${calc.map(x=>`<span>${x[0]}</span><span>${x[1]}</span>`).join('')}<span class="t">Disponible</span><span class="t">${money(p.disp)}</span></div>${p.ingExtra>0?`<p style="margin-top:8px">Ingresos extra (${money(p.ingExtra)}) no se suman al disponible: decide si van al colchón o a una deuda.</p>`:''}</details>
  </div><div>
    <div class="eyebrow">Pagos de esta quincena</div><div class="fx-list" style="margin-top:8px">${fxHtml}</div>${recHtml}
  </div></div></section>`;
}
function heroMes(r){
  return `<section class="hero" aria-label="Resumen del mes"><div class="hero-top"><span class="eyebrow">Mes cerrado · ${esc(fmtM(r.k))}</span><span class="pill">${esc(r.perfil.n)}</span></div>
    <div><div class="hero-fig ${r.libre<0?'neg':''}">${money(r.libre)}</div><p class="hero-sub">saldo libre del mes · ingresos ${money(r.ing)} · gastos ${money(r.gasQ)} · ahorro ${money(r.aho)}</p></div></section>`;
}
function panelBolsillos(r){
  const c=S.cfg;
  const parts=c.bolsillos.map((b,i)=>({n:b.n,v:r.byB[b.id]||0,c:`var(--s${i+1})`}));
  return `<section class="panel"><div class="panel-h"><h2>Bolsillos del mes</h2><span class="sub">${esc(r.perfil.n)} · base ${money(r.base)}</span></div>
    <div class="meters">${c.bolsillos.map(b=>meterRow(b,r.byB[b.id]||0,r.asig[b.id]||0)).join('')}</div>
    ${sum(parts.map(p=>p.v))>0?`<div style="margin-top:16px"><div class="eyebrow">A dónde se fue la plata</div>${segbar(parts,'Distribución del gasto por bolsillo')}</div>`:''}
    <div class="row between" style="margin-top:14px"><span class="small muted">Los porcentajes salen de tu perfil del mes.</span><a class="linkbtn" href="#ajustes">Ajustar porcentajes</a></div></section>`;
}
function panelRecs(k){
  const recs=recsFor(k);
  return `<section class="panel"><div class="panel-h"><h2>Alertas y consejos</h2><span class="sub">${recs.length?`${recs.length} para ${esc(fmtMs(k))}`:''}</span></div>
    ${recs.length?`<div class="recs">${recs.slice(0,6).map(x=>`<div class="rec">${lvlPill(x.lvl)}<span class="t">${esc(x.t)}</span><span class="d">${esc(x.d)}</span></div>`).join('')}</div>`:emptyBox('Sin alertas por ahora. Cuando registres movimientos aparecen aquí.')}
    ${S.cap.sample?`<div class="row" style="margin-top:14px"><a class="btn sm" href="#analisis" data-act="goai">${ic('spark','sm')}Análisis con IA</a><span class="xs muted">Revisa tu mes completo y te propone acciones.</span></div>`:''}</section>`;
}

/* ---------------- Registrar ---------------- */
function catsFor(t){ return S.cfg.cats.filter(c=>c.t===t&&!c.arch); }
function freqCats(t){
  const cnt={}; for(const x of S.movs.slice(0,300)) if(x.t===t) cnt[x.c]=(cnt[x.c]||0)+1;
  return (t==='a'?S.cfg.metas.filter(m=>!m.arch):catsFor(t)).slice().sort((a,b)=>(cnt[b.id]||0)-(cnt[a.id]||0));
}
function vRegistrar(){
  const m=S.regMode;
  const tabs=`<div class="seg" role="group" aria-label="Forma de registrar">${[['rapido','Rápido'],['ia','Con IA'],['tabla','Varios a la vez']].map(([v,l])=>`<button type="button" data-act="regmode" data-v="${v}" aria-pressed="${m===v}">${l}</button>`).join('')}</div>`;
  const left=m==='rapido'?formRapido():m==='ia'?formIA():formTabla();
  return `<div class="view"><div class="view-head"><div><h1>Registrar</h1><p>${m==='rapido'?'Un movimiento en segundos.':m==='ia'?'Escribe o dicta como hablas; la IA lo organiza.':'Pon al día la semana desde el computador.'}</p></div>${tabs}</div>
    <div class="reg"><section class="panel">${left}</section><div class="stack s16">${sidePagos()}${sideRecientes()}</div></div></div>`;
}
function formRapido(){
  const R=S.reg, t=R.t;
  const list=freqCats(t), shown=S.regAll?list:list.slice(0,9);
  let catHtml;
  if(t==='a'){
    catHtml=list.length?`<div class="chips" data-group="c">${list.map(x=>`<button type="button" class="chip" data-act="pick" data-k="c" data-v="${esc(x.id)}" aria-pressed="${R.c===x.id}"><i class="dot" style="background:${bColor(x.b)}"></i>${esc(x.n)}</button>`).join('')}</div>`:emptyBox('Crea una meta en Ajustes para registrar ahorros.');
  } else if(S.regAll&&t==='g'){
    catHtml=`<div class="catgroups">${S.cfg.bolsillos.map(b=>{const cs=catsFor('g').filter(c=>c.b===b.id); return cs.length?`<div class="catgroup"><h4><i class="dot" style="background:${bColor(b.id)}"></i>${esc(b.n)}</h4><div class="chips" data-group="c">${cs.map(x=>`<button type="button" class="chip" data-act="pick" data-k="c" data-v="${esc(x.id)}" aria-pressed="${R.c===x.id}">${esc(x.n)}${x.fijo?'<span class="tag">FIJO</span>':''}</button>`).join('')}</div></div>`:'';}).join('')}</div>`;
  } else {
    catHtml=`<div class="chips" data-group="c">${shown.map(x=>`<button type="button" class="chip" data-act="pick" data-k="c" data-v="${esc(x.id)}" aria-pressed="${R.c===x.id}">${t==='g'?`<i class="dot" style="background:${bColor(x.b)}"></i>`:''}${esc(x.n)}</button>`).join('')}</div>`;
  }
  const more=t!=='a'&&list.length>9?`<button type="button" class="linkbtn" data-act="regall">${S.regAll?'Ver menos':'Ver todas las categorías'}</button>`:'';
  const y=addDays(todayStr(),-1);
  const metas=S.cfg.metas.filter(x=>!x.arch);
  return `<form class="stack s16" data-form="rapido" autocomplete="off" novalidate>
    <div class="seg full" role="group" aria-label="Tipo">${[['g','Gasto'],['i','Ingreso'],['a','Ahorro']].map(([v,l])=>`<button type="button" data-act="regtipo" data-v="${v}" aria-pressed="${t===v}">${l}</button>`).join('')}</div>
    <div><label class="eyebrow" for="amt">Monto</label><div class="amount"><span>$</span><input id="amt" inputmode="numeric" enterkeyhint="done" placeholder="0" value="${esc(fmtIn(R.m))}" data-money="reg" aria-label="Monto en pesos"><button type="button" class="k3" data-act="k3" aria-label="Agregar tres ceros">000</button></div></div>
    <div class="stack s8"><div class="row between"><span class="eyebrow">${t==='a'?'Meta':'Categoría'}</span>${more}</div>${catHtml}</div>
    <div class="stack s8"><span class="eyebrow">Fecha</span><div class="chips" data-group="f">
      <button type="button" class="chip" data-act="pick" data-k="f" data-v="${todayStr()}" aria-pressed="${R.f===todayStr()}">Hoy</button>
      <button type="button" class="chip" data-act="pick" data-k="f" data-v="${y}" aria-pressed="${R.f===y}">Ayer</button>
      <input type="date" class="in" id="regDate" style="width:auto;min-height:36px" value="${esc(R.f)}" max="${addDays(todayStr(),1)}" aria-label="Otra fecha"></div></div>
    ${t!=='a'?`<div class="stack s8"><span class="eyebrow">Medio de pago</span><div class="chips" data-group="p">${S.cfg.medios.filter(x=>!x.arch).map(x=>`<button type="button" class="chip" data-act="pick" data-k="p" data-v="${esc(x.id)}" aria-pressed="${R.p===x.id}">${esc(x.n)}</button>`).join('')}</div></div>`:''}
    <label class="f">Descripción (opcional)<input class="in" id="regDesc" maxlength="140" value="${esc(R.d)}" placeholder="${t==='g'?'Ej: almuerzo con compañeros':t==='i'?'Ej: quincena':'Ej: aporte quincenal'}"></label>
    ${t==='g'&&metas.length?`<details ${R.src&&R.src!=='q'?'open':''}><summary class="linkbtn" style="cursor:pointer">Pagar con un ahorro</summary><div class="chips" data-group="src" style="margin-top:8px">${[{id:'q',n:'Plata de la quincena'}].concat(metas).map(x=>`<button type="button" class="chip" data-act="pick" data-k="src" data-v="${esc(x.id)}" aria-pressed="${(R.src||'q')===x.id}">${esc(x.n)}</button>`).join('')}</div><p class="xs muted" style="margin-top:6px">Úsalo cuando compres algo con lo ahorrado (por ejemplo, la ropa). No cuenta contra tus bolsillos del mes y descuenta de la meta.</p></details>`:''}
    ${R.fx?`<p class="note">Registrando el pago fijo: ${esc((S.cfg.fijos.find(f=>f.id===R.fx)||{}).n||'')}.</p>`:''}
    ${R.err?`<p class="pill crit" role="alert">${esc(R.err)}</p>`:''}
    <button type="submit" class="btn primary lg block">Guardar ${TIPOS[t].toLowerCase()}</button>
  </form>`;
}
function formIA(){
  const I=S.ia, can=!!S.cap.sample;
  let res='';
  if(I.parsing) res=`<span class="thinking"><i></i>Interpretando…</span>`;
  else if(I.err) res=`<p class="pill crit" role="alert">${esc(I.err)}</p>`;
  if(I.items&&I.items.length){
    res+=`<div class="stack s8"><div class="row between"><h3>${I.items.length} ${I.items.length===1?'movimiento':'movimientos'} para revisar</h3><span class="xs muted">${I.items.some(x=>x.duda)?'Los marcados en amarillo tienen la categoría en duda.':'Revisa y guarda.'}</span></div>
      <div class="parsed">${I.items.map((x,i)=>parsedRow(x,i)).join('')}</div>
      <div class="row end"><button type="button" class="btn" data-act="iaclear">Descartar</button><button type="button" class="btn primary" data-act="iasave">Guardar ${I.items.length}</button></div></div>`;
  }
  return `<div class="stack s16">
    <label class="f" for="iaText">Escribe o dicta tus movimientos
      <textarea id="iaText" class="in" rows="5" placeholder="Ej: hoy almuerzo 15 lucas con Nequi, ayer gasolina 35 mil, el lunes peluquería 30 mil en efectivo y me pagaron la quincena 1.200.000">${esc(I.text)}</textarea></label>
    <div class="partial" id="iaPartial" aria-live="polite"></div>
    <div class="row">
      ${S.cap.dict?`<button type="button" class="btn mic" id="micBtn" data-act="mic" data-on="${S.dictState!=='idle'?1:0}">${ic('mic','sm')}<span class="lbl">${S.dictState!=='idle'?'Detener':'Dictar'}</span></button>`:''}
      <button type="button" class="btn primary" data-act="iaparse" ${I.parsing?'disabled':''}>${ic('spark','sm')}${can?'Interpretar con IA':'Interpretar'}</button>
    </div>
    <p class="xs muted">${S.cap.dict?'':'En el celular puedes usar el micrófono de tu teclado para dictar. '}${can?'Entiende "lucas", "mil", "palos", "ayer", "el lunes" y medios como Nequi o efectivo.':'La IA no está disponible en esta vista; uso un lector básico de montos y palabras clave.'}</p>
    ${res}</div>`;
}
function catOptions(t,sel){
  if(t==='a') return S.cfg.metas.filter(m=>!m.arch||m.id===sel).map(m=>`<option value="${esc(m.id)}" ${m.id===sel?'selected':''}>${esc(m.n)}</option>`).join('');
  if(t==='i') return catsFor('i').map(c=>`<option value="${esc(c.id)}" ${c.id===sel?'selected':''}>${esc(c.n)}</option>`).join('');
  return S.cfg.bolsillos.map(b=>{const cs=S.cfg.cats.filter(c=>c.t==='g'&&c.b===b.id&&(!c.arch||c.id===sel)); return cs.length?`<optgroup label="${esc(b.n)}">${cs.map(c=>`<option value="${esc(c.id)}" ${c.id===sel?'selected':''}>${esc(c.n)}</option>`).join('')}</optgroup>`:'';}).join('');
}
function medOptions(sel){ return `<option value="">Medio…</option>`+S.cfg.medios.filter(m=>!m.arch||m.id===sel).map(m=>`<option value="${esc(m.id)}" ${m.id===sel?'selected':''}>${esc(m.n)}</option>`).join(''); }
function parsedRow(x,i){
  return `<div class="prow ${x.duda?'doubt':''}" data-row="${i}" data-list="ia">
    <input type="date" class="in" data-f="f" value="${esc(x.f)}" aria-label="Fecha">
    <select class="in" data-f="t" aria-label="Tipo">${Object.entries(TIPOS).map(([v,l])=>`<option value="${v}" ${x.t===v?'selected':''}>${l}</option>`).join('')}</select>
    <select class="in" data-f="c" aria-label="Categoría">${catOptions(x.t,x.c)}</select>
    <input class="in money" inputmode="numeric" data-f="m" data-money="1" value="${esc(fmtIn(x.m))}" aria-label="Monto">
    <input class="in" data-f="d" value="${esc(x.d||'')}" placeholder="Nota" aria-label="Descripción">
    <button type="button" class="iconbtn" data-act="iadel" data-i="${i}" aria-label="Quitar">${ic('x','sm')}</button></div>`;
}
function formTabla(){
  if(!S.tabla.length) S.tabla=Array.from({length:5},()=>blankRow());
  return `<div class="stack s16"><div class="thead"><span>Fecha</span><span>Tipo</span><span>Categoría</span><span>Monto</span><span>Medio</span><span>Descripción</span><span></span></div>
    <div class="stack s8">${S.tabla.map((x,i)=>`<div class="trow" data-row="${i}" data-list="tabla">
      <input type="date" class="in" data-f="f" value="${esc(x.f)}" aria-label="Fecha">
      <select class="in" data-f="t" aria-label="Tipo">${Object.entries(TIPOS).map(([v,l])=>`<option value="${v}" ${x.t===v?'selected':''}>${l}</option>`).join('')}</select>
      <select class="in" data-f="c" aria-label="Categoría"><option value="">Categoría…</option>${catOptions(x.t,x.c)}</select>
      <input class="in money" inputmode="numeric" data-f="m" data-money="1" value="${esc(fmtIn(x.m))}" placeholder="$0" aria-label="Monto">
      <select class="in" data-f="p" aria-label="Medio">${medOptions(x.p)}</select>
      <input class="in" data-f="d" value="${esc(x.d||'')}" placeholder="Nota" aria-label="Descripción">
      <button type="button" class="iconbtn" data-act="tdel" data-i="${i}" aria-label="Quitar fila">${ic('x','sm')}</button></div>`).join('')}</div>
    <div class="row between"><button type="button" class="btn" data-act="tadd">${ic('plus','sm')}Agregar 5 filas</button><button type="button" class="btn primary" data-act="tsave">Guardar filas con monto</button></div>
    <p class="xs muted">Usa Tab para pasar de campo en campo. Las filas sin monto o sin categoría se ignoran.</p></div>`;
}
function blankRow(){ const last=S.tabla.length?S.tabla[S.tabla.length-1]:null; return {f:last?last.f:todayStr(),t:'g',c:'',m:0,p:last?last.p:'',d:''}; }
function sidePagos(){
  if(S.mode!=='demo'&&S.mode!=='live') return '';
  const p=pStats(todayStr());
  if(!p.fx.length) return '';
  return `<section class="panel"><div class="panel-h"><h2>Pagos de esta quincena</h2><span class="sub">un toque para registrar</span></div><div class="stack s8">${p.fx.map(f=>`<div class="row between"><span class="small">${esc(f.n)} <span class="muted">${money(f.m)}</span></span>${f.paid?`<span class="pill good">${ic('ok','sm')}Pagado</span>`:`<button type="button" class="btn sm" data-act="payfx" data-id="${esc(f.id)}">Registrar</button>`}</div>`).join('')}</div></section>`;
}
function sideRecientes(){
  const l=S.movs.slice(0,5);
  return `<section class="panel"><div class="panel-h"><h2>Recién registrados</h2><a class="linkbtn" href="#movimientos">Ver todos</a></div>${l.length?`<div class="mlist">${l.map(movRow).join('')}</div>`:emptyBox('Lo que registres aparece aquí.')}</section>`;
}

/* ---------------- Movimientos ---------------- */
function vMovs(){
  const k=S.month, F=S.movF, q=norm(F.q);
  let list=mStats(k).movs;
  if(F.t) list=list.filter(x=>x.t===F.t);
  if(F.b) list=list.filter(x=>bOf(x)===F.b);
  if(q) list=list.filter(x=>norm(catName(x.c)+' '+(x.d||'')+' '+((S.medMap[x.p]||{}).n||'')).includes(q));
  const tg=sum(list.filter(x=>x.t==='g').map(x=>x.m)), ti=sum(list.filter(x=>x.t==='i').map(x=>x.m)), ta=sum(list.filter(x=>x.t==='a').map(x=>x.m));
  const days={}; for(const x of list) (days[x.f]=days[x.f]||[]).push(x);
  const body=Object.keys(days).sort().reverse().map(d=>{const g=sum(days[d].filter(x=>x.t==='g').map(x=>x.m)); return `<div class="mday"><span>${esc(fmtDL(d))}</span><span>${g?'−'+money(g):''}</span></div>${days[d].map(movRow).join('')}`;}).join('');
  return `<div class="view"><div class="view-head"><div><h1>Movimientos</h1><p>${list.length} en ${esc(fmtM(k))} · gastos ${money(tg)} · ingresos ${money(ti)} · ahorro ${money(ta)}</p></div>
    <div class="row"><button type="button" class="btn sm" data-act="exportcsv" ${S.cap.dl?'':'hidden'}>${ic('dl','sm')}CSV</button><a class="btn primary sm" href="#registrar">${ic('plus','sm')}Registrar</a></div></div>
    <div class="row" role="group" aria-label="Filtros">
      <input class="in" style="flex:1;min-width:180px" id="mq" type="search" placeholder="Buscar categoría, nota o medio" value="${esc(F.q)}">
      <select class="in" style="width:auto" id="mt" aria-label="Tipo"><option value="">Todos los tipos</option>${Object.entries(TIPOS).map(([v,l])=>`<option value="${v}" ${F.t===v?'selected':''}>${l}s</option>`).join('')}</select>
      <select class="in" style="width:auto" id="mb" aria-label="Bolsillo"><option value="">Todos los bolsillos</option>${S.cfg.bolsillos.map(b=>`<option value="${b.id}" ${F.b===b.id?'selected':''}>${esc(b.n)}</option>`).join('')}</select>
    </div>
    <section class="panel">${list.length?`<div class="mlist">${body}</div>`:emptyBox(F.q||F.t||F.b?'Ningún movimiento coincide con el filtro.':`No hay movimientos en ${esc(fmtM(k))}.`)}</section></div>`;
}

/* ---------------- Análisis ---------------- */
function vAnalisis(){
  const k=S.month, cur=curMonth(), N=S.anRange, ks=monthsRange(k,N).filter(x=>x>=firstMonth()||monthHasData(x));
  const months=ks.length?ks:[k];
  const st=months.map(mStats), r=mStats(k);
  const parts=[];
  // tiles
  const closed=months.filter(x=>x<cur&&monthHasData(x));
  const avgG=closed.length?sum(closed.map(x=>mStats(x).gas))/closed.length:null;
  const peak=st.slice().sort((a,b)=>b.gas-a.gas)[0];
  const prevKs=[1,2,3].map(i=>addMonthsK(k,-i)).filter(monthHasData);
  let grow=null;
  if(prevKs.length){ for(const [id,v] of Object.entries(r.byCat)){ const avg=sum(prevKs.map(x=>mStats(x).byCat[id]||0))/prevKs.length; const d=v-avg; if(!grow||d>grow.d) grow={id,d,v,avg}; } }
  parts.push(`<section class="tiles t4">
    ${tile('Gasto promedio mensual',avgG!=null?money(avgG):'—',`<span>${closed.length?`${closed.length} ${closed.length===1?'mes cerrado':'meses cerrados'}`:'aún sin meses cerrados'}</span>`)}
    ${tile('Mes con más gasto',peak&&peak.gas>0?esc(fmtMs(peak.k)):'—',peak&&peak.gas>0?`<span>${money(peak.gas)}</span>`:'')}
    ${tile('Categoría que más subió',grow&&grow.d>0?esc(catName(grow.id)):'—',grow&&grow.d>0?`<span class="up-bad">+${money(grow.d).replace('−','')}</span><span>vs promedio</span>`:'<span>sin comparación todavía</span>')}
    ${tile('Gastos hormiga',money(r.horm.tot),`<span>${r.horm.n} compras ≤ ${money(S.cfg.params.hormiga)}</span>`)}
  </section>`);
  // trend + forecast
  const fc=forecast(closed.slice(-6).map(x=>mStats(x).gas));
  const labels=months.map(fmtMs), long=months.map(fmtM);
  const esperado=(+S.cfg.pagos.e1||0)+(+S.cfg.pagos.e2||0);
  const gasV=months.map(x=>x===cur?null:mStats(x).gas);
  const ingV=months.map(x=>x===cur?(mStats(x).ingBase>=esperado&&esperado>0?mStats(x).ing:null):mStats(x).ing);
  const ahoV=months.map(x=>x===cur?null:mStats(x).aho);
  let projV=months.map(()=>null);
  const L=labels.slice(), LL=long.slice();
  if(k===cur){
    const pj=projMonth(k), n=months.length;
    LL[n-1]=fmtM(k)+' (en curso)';
    projV=months.map((x,i)=>i===n-1?pj.proj:(i===n-2?gasV[i]:null));
    if(fc) for(let j=1;j<=2;j++){ const nk=addMonthsK(k,j); L.push(fmtMs(nk)); LL.push(fmtM(nk)+' (estimado)'); gasV.push(null); ingV.push(null); ahoV.push(null); projV.push(Math.round(fc.f[j]!=null?fc.f[j]:fc.f[2])); }
  }
  CH.trend={type:'line',labels:L,long:LL,h:240,aria:'Ingresos, gastos y ahorro por mes',series:[
    {n:'Ingresos',c:'var(--s1)',v:ingV},{n:'Gastos',c:'var(--s2)',v:gasV},{n:'Ahorro',c:'var(--s3)',v:ahoV},
    ...(projV.some(v=>v!=null)?[{n:'Gasto estimado',c:'var(--s2)',v:projV,dash:true,hollow:true}]:[])]};
  const trendTable=`<div class="tscroll"><table class="t"><thead><tr><th>Mes</th><th class="r">Ingresos</th><th class="r">Gastos</th><th class="r">Ahorro</th><th class="r">Tasa de ahorro</th></tr></thead><tbody>${months.map(x=>{const s=mStats(x);return `<tr><td>${esc(fmtM(x))}</td><td class="r">${money(s.ing)}</td><td class="r">${money(s.gas)}</td><td class="r">${money(s.aho)}</td><td class="r">${pct(s.tasaAho,1)}</td></tr>`;}).join('')}</tbody></table></div>`;
  const fcTxt=k===cur?`El mes en curso aparece como estimado: cierre de ${esc(fmtMs(k))} en <b>${money(projMonth(k).proj)}</b> (gastado ${money(r.gasQ)} + tu ritmo diario + pagos fijos pendientes). ${fc?`Próximos meses: ${esc(fc.method)}.`:'La tendencia de los próximos meses aparece cuando cierres tu primer mes completo.'}`:'';
  parts.push(`<section class="panel"><div class="panel-h"><h2>Tendencia mensual</h2><div class="ctools"><div class="seg" role="group" aria-label="Rango">${[3,6,12].map(n=>`<button type="button" data-act="range" data-v="${n}" aria-pressed="${N===n}">${n} meses</button>`).join('')}</div>${tableToggle('trend')}</div></div>
    ${S.tbl.trend?trendTable:`<div class="chart" data-ch="trend" style="height:240px"></div><div class="legend"><span><i class="lkey" style="background:var(--s1)"></i>Ingresos</span><span><i class="lkey" style="background:var(--s2)"></i>Gastos</span><span><i class="lkey" style="background:var(--s3)"></i>Ahorro</span>${projV.some(v=>v!=null)?'<span style="color:var(--s2)"><i class="lkey dash"></i><span style="color:var(--ink-2)">Gasto estimado</span></span>':''}</div>`}
    ${fcTxt?`<p class="small ink2" style="margin-top:10px">${fcTxt}</p>`:''}</section>`);
  // ritmo del mes + categorías
  parts.push(`<div class="grid g2">${panelRitmo(k,r)}${panelCats(k,r,prevKs)}</div>`);
  parts.push(`<div class="grid g2">${panelSemana(k)}${panelHeat(months)}</div>`);
  parts.push(`<div class="grid g2">${panelMix(r)}${panelHormiga(r)}</div>`);
  parts.push(panelBolsHist(months));
  parts.push(panelTop(r));
  parts.push(panelIA(k));
  return `<div class="view"><div class="view-head"><div><h1>Análisis</h1><p>${esc(fmtM(k))} y los ${N} meses previos: tendencias, picos y estimaciones.</p></div></div>${parts.join('')}</div>`;
}
function panelRitmo(k,r){
  const a=k.split('-').map(Number), D=dim(a[0],a[1]), cur=curMonth();
  const lastDay=k===cur?pd(todayStr()).getDate():D;
  const budget=sum(S.cfg.bolsillos.filter(b=>b.k!=='ahorro').map(b=>r.asig[b.id]||0));
  let acc=0; const spent=[], ideal=[], labels=[], long=[];
  for(let d=1;d<=D;d++){ const f=`${k}-${pad(d)}`; acc+=sum(r.movs.filter(x=>x.f===f&&x.t==='g'&&(!x.src||x.src==='q')).map(x=>x.m)); spent.push(d<=lastDay?acc:null); ideal.push(Math.round(budget*d/D)); labels.push(String(d)); long.push(fmtDL(f)); }
  let pk=null; for(const [f,v] of Object.entries(r.byDay)) if(!pk||v>pk.v) pk={f,v};
  CH.burn={type:'line',labels,long,h:220,aria:'Gasto acumulado del mes contra el ritmo del presupuesto',series:[{n:'Gastado acumulado',c:'var(--s1)',v:spent},{n:'Ritmo del presupuesto',c:'var(--ink-2)',v:ideal,dash:true}]};
  const now=spent[lastDay-1]||0, ref=ideal[lastDay-1]||0;
  const status=budget>0?(now>ref*1.1?`<span class="pill warn">${ic('warn','sm')}Por encima del ritmo</span>`:`<span class="pill good">${ic('ok','sm')}Dentro del ritmo</span>`):'';
  return `<section class="panel"><div class="panel-h"><h2>Ritmo del mes</h2>${status}</div>
    <div class="chart" data-ch="burn" style="height:220px"></div>
    <div class="legend"><span><i class="lkey" style="background:var(--s1)"></i>Gastado acumulado</span><span><i class="lkey dash" style="color:var(--ink-2)"></i>Ritmo del presupuesto (${money(budget)} en el mes)</span></div>
    <p class="small ink2" style="margin-top:10px">${pk?`Día pico: <b>${esc(fmtDL(pk.f))}</b> con ${money(pk.v)}${(()=>{const top=r.movs.filter(x=>x.f===pk.f&&x.t==='g').sort((a,b)=>b.m-a.m)[0];return top?` (mayor: ${esc(catName(top.c))} ${money(top.m)})`:''})()}.`:'Sin gastos registrados en este mes.'}</p></section>`;
}
function panelCats(k,r,prevKs){
  const rows=Object.entries(r.byCat).map(([id,v])=>({id,v,avg:prevKs.length?sum(prevKs.map(x=>mStats(x).byCat[id]||0))/prevKs.length:null})).sort((a,b)=>b.v-a.v).slice(0,10);
  const mx=Math.max(1,...rows.map(x=>Math.max(x.v,x.avg||0)));
  const body=rows.length?`<div class="hbars">${rows.map(x=>{const cat=S.catMap[x.id]; return `<div class="hb" tabindex="0" data-tt="${esc(catName(x.id))}" data-tv="${esc(money(x.v))}" data-tl="${x.avg!=null?esc('promedio '+money(x.avg)):'sin promedio aún'}" data-tk="${cat?bColor(cat.b):'var(--s1)'}"><span class="l">${esc(catName(x.id))}</span><span class="tr"><span class="b" style="width:${(x.v/mx*100).toFixed(1)}%;background:${cat?bColor(cat.b):'var(--s1)'}"></span>${x.avg!=null?`<span class="mk" style="left:calc(${(x.avg/mx*100).toFixed(1)}% - 1px)"></span>`:''}</span><span class="v">${money(x.v)}${x.avg!=null&&x.avg>0?`<small>${x.v>=x.avg?'+':'−'}${pct(Math.abs(x.v-x.avg)/x.avg)}</small>`:''}</span></div>`;}).join('')}</div>`:emptyBox('Sin gastos este mes.');
  const table=`<div class="tscroll"><table class="t"><thead><tr><th>Categoría</th><th class="r">Este mes</th><th class="r">Promedio</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(catName(x.id))}</td><td class="r">${money(x.v)}</td><td class="r">${x.avg!=null?money(x.avg):'—'}</td></tr>`).join('')}</tbody></table></div>`;
  return `<section class="panel"><div class="panel-h"><h2>Gasto por categoría</h2>${tableToggle('cats')}</div>${S.tbl.cats?table:body}
    ${rows.length?`<p class="xs muted" style="margin-top:10px">El color es el bolsillo. La raya vertical marca tu promedio de ${prevKs.length?`los ${prevKs.length} ${prevKs.length===1?'mes anterior':'meses anteriores'}`:'meses anteriores (aún sin datos)'}.</p>`:''}</section>`;
}
function panelSemana(k){
  const ks=[0,1,2].map(i=>addMonthsK(k,-i)).filter(monthHasData);
  const tot=[0,0,0,0,0,0,0], days=[0,0,0,0,0,0,0];
  for(const kk of ks){ const a=kk.split('-').map(Number), D=kk===curMonth()?pd(todayStr()).getDate():dim(a[0],a[1]); for(let d=1;d<=D;d++) days[pd(`${kk}-${pad(d)}`).getDay()]++; for(const x of mStats(kk).movs) if(x.t==='g'&&!(S.catMap[x.c]&&S.catMap[x.c].fijo)) tot[pd(x.f).getDay()]+=x.m; }
  const order=[1,2,3,4,5,6,0], v=order.map(i=>days[i]?Math.round(tot[i]/days[i]):0);
  const hi=v.indexOf(Math.max(...v));
  CH.week={type:'cols',labels:order.map(i=>DIAC[i]),long:order.map(i=>DIA[i]),v,hi:v[hi]>0?hi:-1,c:'var(--s1)',h:200,unit:'promedio por día'};
  return `<section class="panel"><div class="panel-h"><h2>Gasto variable por día de la semana</h2><span class="sub">promedio diario · ${ks.length} ${ks.length===1?'mes':'meses'}</span></div>
    ${sum(v)>0?`<div class="chart" data-ch="week" style="height:200px"></div><p class="small ink2" style="margin-top:8px">Tu día pico es el <b>${esc(DIA[order[hi]])}</b>: ${money(v[hi])} en promedio, ${v.filter(x=>x>0).length>1?`${pct(v[hi]/(sum(v)/v.filter(x=>x>0).length)-1)} más que tu día promedio`:''}.</p>`:emptyBox('Aparece cuando registres gastos variables.')}</section>`;
}
function panelHeat(months){
  const cats={}; for(const k of months) for(const [id,v] of Object.entries(mStats(k).byCat)) cats[id]=(cats[id]||0)+v;
  const ids=Object.keys(cats).filter(id=>!(S.catMap[id]&&S.catMap[id].fijo)).sort((a,b)=>cats[b]-cats[a]).slice(0,12);
  if(!ids.length) return `<section class="panel"><div class="panel-h"><h2>Mapa de calor</h2></div>${emptyBox('Aparece cuando tengas gastos variables registrados.')}</section>`;
  const rows=ids.map(id=>{ const vals=months.map(k=>mStats(k).byCat[id]||0), mx=Math.max(1,...vals); return `<tr><th class="c" scope="row" title="${esc(catName(id))}">${esc(catName(id))}</th>${vals.map((v,i)=>{const lvl=v<=0?0:Math.max(1,Math.ceil(v/mx*6)); return `<td class="${lvl?'h'+lvl:'z'}" tabindex="0" data-tt="${esc(catName(id))} · ${esc(fmtM(months[i]))}" data-tv="${esc(money(v))}" data-tl="${v>0&&v===mx?'pico de la categoría':''}" data-tk="var(--h4)"></td>`;}).join('')}</tr>`; }).join('');
  const table=`<div class="tscroll"><table class="t"><thead><tr><th>Categoría</th>${months.map(k=>`<th class="r">${esc(fmtMs(k))}</th>`).join('')}</tr></thead><tbody>${ids.map(id=>`<tr><td>${esc(catName(id))}</td>${months.map(k=>`<td class="r">${money(mStats(k).byCat[id]||0)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  return `<section class="panel"><div class="panel-h"><h2>Mapa de calor: picos por categoría</h2>${tableToggle('heat')}</div>
    ${S.tbl.heat?table:`<div class="tscroll"><table class="heat"><thead><tr><th></th>${months.map(k=>`<th>${esc(fmtMs(k))}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
    <div class="scale"><span>menos</span>${[1,2,3,4,5,6].map(i=>`<i style="background:var(--h${i})"></i>`).join('')}<span>más · relativo a cada categoría</span></div>`}</section>`;
}
function panelMix(r){
  const fv=[{n:'Fijos',v:r.fijo,c:'var(--s1)'},{n:'Variables',v:r.vari,c:'var(--s2)'}];
  const meds=Object.entries(r.byMed).sort((a,b)=>b[1]-a[1]);
  const top=meds.slice(0,5), rest=sum(meds.slice(5).map(x=>x[1]));
  const mp=top.map(([id,v],i)=>({n:(S.medMap[id]||{}).n||'Otro',v,c:`var(--s${i+1})`})); if(rest>0) mp.push({n:'Otros',v:rest,c:'var(--s6)'});
  return `<section class="panel"><div class="panel-h"><h2>Cómo gastas</h2></div>
    ${r.gas>0?`<div class="eyebrow">Fijos vs. variables</div>${segbar(fv,'Gasto fijo contra variable')}<div class="eyebrow" style="margin-top:18px">Medios de pago</div>${segbar(mp,'Gasto por medio de pago')}`:emptyBox('Sin gastos este mes.')}</section>`;
}
function panelHormiga(r){
  const thr=+S.cfg.params.hormiga||15000;
  const by=Object.entries(r.horm.byCat).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return `<section class="panel"><div class="panel-h"><h2>Gastos hormiga</h2><span class="sub">compras de hasta ${money(thr)}</span></div>
    ${r.horm.n?`<div class="kv"><span>Compras pequeñas</span><span>${r.horm.n}</span><span>Total</span><span>${money(r.horm.tot)}</span><span>Promedio por compra</span><span>${money(r.horm.tot/r.horm.n)}</span><span>Parte de tus gastos variables</span><span>${pct(r.horm.tot/Math.max(1,r.vari))}</span><span>Si fuera así todo el año</span><span>${money(r.horm.tot*12)}</span></div>
    <div class="eyebrow" style="margin-top:16px">Dónde se van</div><div class="stack s8" style="margin-top:8px">${by.map(([id,v])=>`<div class="row between small"><span>${esc(catName(id))}</span><span class="num">${money(v)}</span></div>`).join('')}</div>`:emptyBox('Sin compras pequeñas este mes.')}</section>`;
}
function panelBolsHist(months){
  const c=S.cfg;
  const cell=(b,s)=>{const used=s.byB[b.id]||0, asig=s.asig[b.id]||0; if(!s.n) return '<td class="r muted">—</td>'; const p=asig>0?used/asig:null; let cls=''; if(b.k!=='ahorro'&&p!=null){ cls=p>1?'crit':p>=0.85?'warn':'good'; } else if(b.k==='ahorro'&&p!=null){ cls=p>=1?'good':'neutral'; } return `<td class="r"><span class="pill ${cls||'neutral'}">${pct(p)}</span></td>`;};
  return `<section class="panel"><div class="panel-h"><h2>Bolsillos mes a mes</h2><span class="sub">% usado de lo asignado</span></div><div class="tscroll"><table class="t"><thead><tr><th>Bolsillo</th>${months.map(k=>`<th class="r">${esc(fmtMs(k))}</th>`).join('')}</tr></thead><tbody>${c.bolsillos.map(b=>`<tr><td><span class="row" style="gap:8px;flex-wrap:nowrap"><i class="dot" style="background:${bColor(b.id)}"></i>${esc(b.n)}</span></td>${months.map(k=>cell(b,mStats(k))).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
function panelTop(r){
  const top=r.movs.filter(x=>x.t==='g').sort((a,b)=>b.m-a.m).slice(0,8);
  return `<section class="panel"><div class="panel-h"><h2>Gastos más grandes del mes</h2></div>${top.length?`<div class="tscroll"><table class="t"><thead><tr><th>Fecha</th><th>Categoría</th><th>Nota</th><th class="r">Monto</th></tr></thead><tbody>${top.map(x=>`<tr><td>${esc(fmtD(x.f))}</td><td>${esc(catName(x.c))}</td><td class="muted">${esc(x.d||'')}</td><td class="r">${money(x.m)}</td></tr>`).join('')}</tbody></table></div>`:emptyBox('Sin gastos este mes.')}</section>`;
}
function panelIA(k){
  if(!S.cap.sample) return `<section class="panel" id="ia"><div class="panel-h"><h2>Asesor con IA</h2></div><p class="small ink2">${S.mode==='demo'?'Disponible al abrir la app desde Claude con tu cuenta.':'La IA no está disponible en esta vista.'}</p></section>`;
  if(S.mode==='live'&&S.ai[k]===undefined){ S.ai[k]={state:'loading'}; loadAI(k); }
  const A=S.ai[k]||{state:'idle'};
  let body='';
  if(A.state==='loading') body=`<span class="thinking"><i></i>Buscando tu último análisis…</span>`;
  else if(A.state==='thinking') body=`<span class="thinking"><i></i>Analizando tu mes. Puede tardar hasta un minuto…</span>`;
  else if(A.state==='error') body=`<p class="pill crit" role="alert">${esc(A.err)}</p>`;
  if(A.res){
    const R=A.res, hs=Array.isArray(R.hallazgos)?R.hallazgos.slice(0,6):[];
    const sc=clamp(Math.round(+R.puntaje||0),0,100), lvl=sc>=70?'good':sc>=45?'warn':'crit';
    body+=`<div class="stack s16"><div class="ai-score"><span class="sc">${sc}<small>/100</small></span><div><span class="pill ${lvl}">${ic(lvl==='good'?'ok':'warn','sm')}${lvl==='good'?'Saludable':lvl==='warn'?'Para ajustar':'En riesgo'}</span><p class="small ink2" style="margin-top:6px">${esc(R.estado||'')}</p></div></div>
      <div class="recs">${hs.map(h=>{const t=h.tipo==='alerta'?'warn':h.tipo==='logro'?'good':'info';return `<div class="rec">${lvlPill(t)}<span class="t">${esc(h.titulo||'')}</span><span class="d">${esc(h.detalle||'')}${h.accion?` <b>Acción:</b> ${esc(h.accion)}`:''}</span></div>`;}).join('')}</div>
      ${R.proyeccion?`<p class="small"><b>Proyección:</b> ${esc(R.proyeccion)}</p>`:''}${R.pregunta?`<p class="note">${esc(R.pregunta)}</p>`:''}
      <p class="xs muted">${A.ts?`Análisis del ${esc(fmtDL(ymd(new Date(A.ts))))}. `:''}Generado con IA a partir de tus registros; revisa las cifras antes de decidir.</p></div>`;
  }
  const busy=A.state==='thinking'||A.state==='loading';
  const askBusy=S.ask.state==='thinking'||S.ask.state==='streaming';
  return `<section class="panel" id="ia"><div class="panel-h"><h2>Asesor con IA</h2><button type="button" class="btn ${A.res?'sm':'primary sm'}" data-act="airun" ${busy?'disabled':''}>${ic('spark','sm')}${A.res?'Volver a analizar':`Analizar ${esc(fmtMs(k))}`}</button></div>
    ${body||'<p class="small ink2">Revisa tus bolsillos, tendencias, metas y deudas, y te propone acciones concretas con montos.</p>'}
    <div class="stack s8" style="margin-top:18px;border-top:1px solid var(--line);padding-top:16px"><label class="f" for="askq">Pregúntale a tu asesor</label>
      <div class="row"><input class="in" id="askq" style="flex:1;min-width:200px" placeholder="¿Me alcanza para unos tenis de 250 mil este mes?" value="${esc(S.ask.q)}"><button type="button" class="btn" data-act="ask" ${askBusy?'disabled':''}>Preguntar</button>${askBusy?'<button type="button" class="btn ghost" data-act="askstop">Detener</button>':''}</div>
      <div id="askout" class="ai-out" aria-live="polite">${askOutHtml()}</div></div></section>`;
}
function askOutHtml(){
  const A=S.ask;
  if(A.state==='thinking'&&!A.out) return '<span class="thinking"><i></i>Pensando…</span>';
  return `${esc(A.out)}${A.state==='error'?`<p class="pill crit" style="margin-top:8px">${esc(A.err)}</p>`:''}`;
}

/* ---------------- Metas y deudas ---------------- */
function vMetas(){
  const c=S.cfg, metas=c.metas.filter(m=>!m.arch);
  const mHtml=metas.map(mt=>{
    const s=metaStats(mt), obj=+mt.obj||0;
    if(!obj) return `<section class="panel goal"><div class="panel-h"><h2><span class="row" style="gap:8px"><i class="dot" style="background:${bColor(mt.b)}"></i>${esc(mt.n)}</span></h2></div><div class="goal-fig"><b>${money(s.saldo)}</b><span class="muted">ahorrado</span></div>${emptyBox('Esta meta no tiene objetivo. Ponle un monto para ver cuánto te falta y cuándo llegas.',`<a class="btn sm" href="#ajustes" data-act="opensec" data-sec="metas">Definir objetivo</a>`)}<div class="row"><button type="button" class="btn sm" data-act="aportar" data-id="${esc(mt.id)}">Aportar</button></div></section>`;
    return `<section class="panel goal"><div class="panel-h"><h2><span class="row" style="gap:8px"><i class="dot" style="background:${bColor(mt.b)}"></i>${esc(mt.n)}</span></h2><span class="sub">${esc(bName(mt.b))}</span></div>
      <div class="goal-fig"><b>${money(s.saldo)}</b><span class="muted">de ${money(obj)}</span><span class="pill ${s.pv>=1?'good':'neutral'}">${pct(s.pv)}</span></div>
      <div class="meter-track"><div class="meter-fill" style="width:${(clamp(s.pv||0,0,1)*100).toFixed(1)}%;background:${bColor(mt.b)}"></div></div>
      <div class="kv"><span>Falta</span><span>${money(s.falta)}</span><span>Aporte promedio</span><span>${s.prom>0?money(s.prom)+'/mes':'sin aportes aún'}</span><span>Llegas en</span><span>${s.meses===0?'¡ya llegaste!':s.meses!=null?`${s.meses} ${s.meses===1?'mes':'meses'} (${esc(fmtMs(s.fechaEst))})`:'—'}</span>${isYm(mt.fecha)?`<span>Para ${esc(fmtMs(mt.fecha))} necesitas</span><span>${s.necesita?money(s.necesita)+'/mes':'—'}</span>`:''}${s.us?`<span>Usado de esta meta</span><span>${money(s.us)}</span>`:''}</div>
      <div class="row"><button type="button" class="btn sm primary" data-act="aportar" data-id="${esc(mt.id)}">Aportar</button><button type="button" class="btn sm" data-act="usarmeta" data-id="${esc(mt.id)}">Comprar con esta meta</button></div></section>`;
  }).join('');
  const dHtml=c.deudas.map(d=>{
    const s=deudaStats(d);
    if(!(+d.saldo>0)) return `<section class="panel goal"><div class="panel-h"><h2>${esc(d.n)}</h2><span class="sub">cuota ${money(cuotaDe(d))}</span></div>${emptyBox('Falta el saldo de esta deuda. Escribe el valor que muestra tu app para calcular cuándo terminas y cuánto pagas de intereses.')}
      <div class="row"><input class="in money" style="flex:1;min-width:140px" inputmode="numeric" data-money="1" id="sal_${esc(d.id)}" placeholder="Saldo real de tu app"><button type="button" class="btn sm primary" data-act="updsaldo" data-id="${esc(d.id)}">Guardar saldo</button></div></section>`;
    const meses=s.n==null?'—':!isFinite(s.n)?'la cuota no cubre los intereses':s.n===0?'pagada':`${Math.ceil(s.n)} ${Math.ceil(s.n)===1?'mes':'meses'}`;
    return `<section class="panel goal"><div class="panel-h"><h2>${esc(d.n)}</h2><span class="sub">${d.fs?`saldo base del ${esc(fmtD(d.fs))}`:''}</span></div>
      <div class="goal-fig"><b>${money(s.saldo)}</b><span class="muted">saldo estimado</span>${s.saldo<=0&&d.saldo>0?`<span class="pill good">${ic('ok','sm')}Pagada</span>`:''}</div>
      <div class="kv"><span>Cuota este mes</span><span>${cuotaDe(d)?money(cuotaDe(d)):'—'}</span><span>Tasa (E.A.)</span><span>${d.tasa?pct(d.tasa/100,2):'agrégala en Ajustes'}</span><span>Intereses aprox. este mes</span><span>${d.tasa?money(s.interesMes):'—'}</span><span>Te falta</span><span>${esc(meses)}</span><span>Libre de esta deuda</span><span>${s.fin?esc(fmtM(s.fin)):'—'}</span><span>Pagado desde el saldo base</span><span>${money(s.pag)}</span></div>
      <div class="row"><input class="in money" style="flex:1;min-width:140px" inputmode="numeric" data-money="1" id="sal_${esc(d.id)}" placeholder="Saldo real de tu app"><button type="button" class="btn sm" data-act="updsaldo" data-id="${esc(d.id)}">Actualizar saldo</button></div>
      <p class="xs muted">El saldo se estima restando tus pagos registrados (sin intereses). Actualízalo de vez en cuando con el saldo real de la app del banco.</p></section>`;
  }).join('');
  const dsel=c.deudas.find(d=>d.id===S.abono.d)||c.deudas[0];
  let sim='';
  if(dsel){
    const res=simAbono(dsel,S.abono.x||0);
    sim=`<section class="panel"><div class="panel-h"><h2>Simulador de abono extra</h2><span class="sub">por ejemplo, con la prima</span></div>
      <div class="fgrid c2"><label class="f">Deuda<select class="in" id="abD">${c.deudas.map(d=>`<option value="${esc(d.id)}" ${d.id===dsel.id?'selected':''}>${esc(d.n)}</option>`).join('')}</select></label><label class="f">Abono a capital<input class="in money" id="abX" inputmode="numeric" data-money="1" value="${esc(fmtIn(S.abono.x))}" placeholder="$0"></label></div>
      <div id="abOut" style="margin-top:12px">${simHtml(dsel,res)}</div></section>`;
  }
  return `<div class="view"><div class="view-head"><div><h1>Metas y deudas</h1><p>Primero el colchón y salir de deudas; luego las metas grandes.</p></div><a class="btn sm" href="#ajustes" data-act="opensec" data-sec="metas">Editar metas y deudas</a></div>
    <h2 class="eyebrow">Metas de ahorro</h2><div class="grid g3">${mHtml||emptyBox('Aún no tienes metas. Créalas en Ajustes.')}</div>
    <h2 class="eyebrow" style="margin-top:8px">Deudas</h2><div class="grid g3">${dHtml||emptyBox('Sin deudas registradas.')}</div>${sim}</div>`;
}
function simHtml(d,res){
  if(!d.tasa) return '<p class="small ink2">Agrega la tasa efectiva anual de esta deuda en Ajustes para calcular el ahorro en intereses.</p>';
  if(!res) return '<p class="small ink2">Necesito el saldo y la cuota de la deuda para simular.</p>';
  if(!(S.abono.x>0)) return `<p class="small ink2">Hoy te faltan unos ${Math.ceil(res.n1)} meses. Escribe un monto para ver cuánto te ahorras.</p>`;
  return `<div class="kv"><span>Meses que te ahorras</span><span>${res.mesesMenos.toLocaleString('es-CO',{maximumFractionDigits:1})}</span><span>Intereses que te ahorras (aprox.)</span><span>${money(res.intAhorro)}</span><span>Nueva fecha de salida</span><span>${esc(fmtM(res.fin2))}</span></div>`;
}

/* ---------------- Ajustes ---------------- */
function D(){ if(!S.draft) S.draft=clone(S.cfg); return S.draft; }
function sec(id,title,sub,body,open){ const o=S.openSec?S.openSec===id:open; return `<details class="sec" id="sec-${id}" ${o?'open':''}><summary><span>${title}${sub?`<br><span class="sub">${sub}</span>`:''}</span></summary><div class="body">${body}</div></details>`; }
function vAjustes(){
  const d=D();
  const kOpts=(sel,arr)=>arr.map(([v,l])=>`<option value="${esc(v)}" ${String(sel)===String(v)?'selected':''}>${esc(l)}</option>`).join('');
  const gCats=d.cats.filter(c=>c.t==='g');
  const catSel=(path,sel)=>`<select class="in" data-k="${path}">${d.bolsillos.map(b=>{const cs=gCats.filter(c=>c.b===b.id); return cs.length?`<optgroup label="${esc(b.n)}">${cs.map(c=>`<option value="${esc(c.id)}" ${c.id===sel?'selected':''}>${esc(c.n)}</option>`).join('')}</optgroup>`:'';}).join('')}</select>`;
  const pf=d.perfiles.find(p=>p.id===S.editPf)||d.perfiles[0]; S.editPf=pf.id;
  const pfIdx=d.perfiles.indexOf(pf);
  const tot=sum(d.bolsillos.map(b=>+pf.pct[b.id]||0));
  const esperado=(+d.pagos.e1||0)+(+d.pagos.e2||0);
  // 1. ingresos
  const s1=`<div class="fgrid c2">
    <label class="f">Tu nombre (para la IA)<input class="in" data-k="nombre" value="${esc(d.nombre)}" maxlength="40"></label><span></span>
    <label class="f">Primer pago: día del mes<input class="in" data-k="pagos.d1" data-type="int" inputmode="numeric" value="${esc(d.pagos.d1)}"></label>
    <label class="f">Monto que recibes ese día<input class="in money" data-k="pagos.e1" data-type="money" inputmode="numeric" value="${esc(fmtIn(d.pagos.e1))}"></label>
    <label class="f">Segundo pago: día del mes<input class="in" data-k="pagos.d2" data-type="int" inputmode="numeric" value="${esc(d.pagos.d2)}"></label>
    <label class="f">Monto que recibes ese día<input class="in money" data-k="pagos.e2" data-type="money" inputmode="numeric" value="${esc(fmtIn(d.pagos.e2))}"></label></div>
    <p class="xs muted">Si el segundo pago es el 30, en febrero se toma el último día del mes. Las comisiones y primas se registran como ingreso extra y no cambian tu presupuesto base.</p>`;
  // 2. bolsillos y perfiles
  const s2=`<div class="row between"><div class="seg" role="group" aria-label="Perfil a editar">${d.perfiles.map(p=>`<button type="button" data-act="pfsel" data-v="${esc(p.id)}" aria-pressed="${p.id===pf.id}">${esc(p.n)}</button>`).join('')}</div><button type="button" class="btn sm" data-act="pfnew">${ic('plus','sm')}Nuevo perfil</button></div>
    <label class="f">Nombre del perfil<input class="in" data-k="perfiles.${pfIdx}.n" value="${esc(pf.n)}" maxlength="40"></label>
    <div class="stack s16">${d.bolsillos.map((b,i)=>`<div class="sl"><span class="nm"><i class="dot" style="background:var(--s${i+1})"></i><input class="in" data-k="bolsillos.${i}.n" value="${esc(b.n)}" aria-label="Nombre del bolsillo ${i+1}" maxlength="30"><select class="in" style="width:auto" data-k="bolsillos.${i}.k" aria-label="Tipo de bolsillo">${kOpts(b.k,Object.entries(KINDS))}</select></span><span class="pin"><input class="in" data-k="perfiles.${pfIdx}.pct.${b.id}" data-type="pct" inputmode="decimal" value="${esc(pf.pct[b.id])}" aria-label="Porcentaje ${esc(b.n)}"><span>%</span></span>
      <input type="range" min="0" max="100" step="1" value="${esc(pf.pct[b.id])}" data-k="perfiles.${pfIdx}.pct.${b.id}" data-type="pct" aria-label="Porcentaje ${esc(b.n)}"><span class="xs muted" data-prev="${b.id}" style="grid-column:1/-1">${pctPreview(+pf.pct[b.id]||0,d)}</span></div>`).join('')}</div>
    <div class="total ${Math.abs(tot-100)<0.01?'ok':'bad'}" id="pfTotal"><span>Total</span><span>${tot.toLocaleString('es-CO')}%${Math.abs(tot-100)<0.01?'':` · ${tot>100?'sobra':'falta'} ${Math.abs(100-tot).toLocaleString('es-CO')}%`}</span></div>
    <div class="stack s8"><h3>Qué perfil aplica cada mes</h3><p class="xs muted">Cambiar los % de un perfil cambia todos los meses que lo usan. Para cambiar desde un mes en adelante, crea otro perfil y asígnalo desde ese mes.</p>
      ${d.perfilMes.map((r,i)=>`<div class="edrow" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr) 34px"><label class="f">Desde<input type="month" class="in" data-k="perfilMes.${i}.desde" value="${esc(r.desde)}"></label><label class="f">Perfil<select class="in" data-k="perfilMes.${i}.p">${kOpts(r.p,d.perfiles.map(p=>[p.id,p.n]))}</select></label><button type="button" class="xbtn" data-act="rowdel" data-list="perfilMes" data-i="${i}" aria-label="Quitar">${ic('x','sm')}</button></div>`).join('')}
      <button type="button" class="btn sm" data-act="rowadd" data-list="perfilMes">${ic('plus','sm')}Agregar cambio de perfil</button></div>`;
  // 3. fijos
  const qOpts=[[1,`Día ${d.pagos.d1}`],[2,`Día ${d.pagos.d2}`]];
  const s3=`<p class="xs muted">Pagos con monto conocido que salen de una quincena. "Hasta" vacío = sin fecha de fin.</p>
    ${d.fijos.map((f,i)=>`<div class="edrow fx6"><input class="in full" data-k="fijos.${i}.n" value="${esc(f.n)}" placeholder="Concepto" aria-label="Concepto">${catSel(`fijos.${i}.c`,f.c)}<input class="in money" data-k="fijos.${i}.m" data-type="money" inputmode="numeric" value="${esc(fmtIn(f.m))}" aria-label="Monto"><select class="in" data-k="fijos.${i}.q" data-type="int" aria-label="Quincena">${kOpts(f.q,qOpts)}</select><input type="month" class="in" data-k="fijos.${i}.desde" value="${esc(f.desde||'')}" aria-label="Desde"><input type="month" class="in" data-k="fijos.${i}.hasta" value="${esc(f.hasta||'')}" aria-label="Hasta"><button type="button" class="xbtn" data-act="rowdel" data-list="fijos" data-i="${i}" aria-label="Quitar">${ic('x','sm')}</button></div>`).join('')}
    <button type="button" class="btn sm" data-act="rowadd" data-list="fijos">${ic('plus','sm')}Agregar pago fijo</button>`;
  // 4. recurrentes
  const s4=`<p class="xs muted">Gastos que se repiten pero no son exactos (gasolina, parqueadero). Se reservan del disponible de cada quincena y se descuentan a medida que los registras.</p>
    ${d.recs.map((r,i)=>`<div class="edrow rc5"><input class="in full" data-k="recs.${i}.n" value="${esc(r.n)}" placeholder="Concepto" aria-label="Concepto">${catSel(`recs.${i}.c`,r.c)}<input class="in money" data-k="recs.${i}.m" data-type="money" inputmode="numeric" value="${esc(fmtIn(r.m))}" aria-label="Monto por quincena"><label class="chk"><input type="checkbox" data-k="recs.${i}.on" data-type="bool" ${r.on!==false?'checked':''}>Activo</label><button type="button" class="xbtn" data-act="rowdel" data-list="recs" data-i="${i}" aria-label="Quitar">${ic('x','sm')}</button></div>`).join('')}
    <button type="button" class="btn sm" data-act="rowadd" data-list="recs">${ic('plus','sm')}Agregar gasto recurrente</button>`;
  // 5. categorías
  const s5=`<p class="xs muted">Archivar oculta la categoría al registrar, pero conserva tu historial.</p>
    ${d.cats.map((c,i)=>`<div class="edrow ct5" ${c.arch?'style="opacity:.6"':''}><input class="in full" data-k="cats.${i}.n" value="${esc(c.n)}" aria-label="Nombre">${c.t==='g'?`<select class="in" data-k="cats.${i}.b" aria-label="Bolsillo">${kOpts(c.b,d.bolsillos.map(b=>[b.id,b.n]))}</select><label class="chk"><input type="checkbox" data-k="cats.${i}.fijo" data-type="bool" ${c.fijo?'checked':''}>Fijo</label>`:`<span class="pill neutral">Ingreso</span><label class="chk"><input type="checkbox" data-k="cats.${i}.base" data-type="bool" ${c.base?'checked':''}>Salario base</label>`}<label class="chk"><input type="checkbox" data-k="cats.${i}.arch" data-type="bool" ${c.arch?'checked':''}>Archivada</label><span></span></div>`).join('')}
    <div class="row"><button type="button" class="btn sm" data-act="rowadd" data-list="cats" data-v="g">${ic('plus','sm')}Categoría de gasto</button><button type="button" class="btn sm" data-act="rowadd" data-list="cats" data-v="i">${ic('plus','sm')}Categoría de ingreso</button></div>`;
  // 6. metas
  const ahoB=d.bolsillos.filter(b=>b.k==='ahorro'); const bo=(ahoB.length?ahoB:d.bolsillos).map(b=>[b.id,b.n]);
  const s6=`${d.metas.map((m,i)=>`<div class="edrow mt6" ${m.arch?'style="opacity:.6"':''}><input class="in full" data-k="metas.${i}.n" value="${esc(m.n)}" placeholder="Nombre" aria-label="Nombre"><select class="in" data-k="metas.${i}.b" aria-label="Bolsillo">${kOpts(m.b,bo)}</select><label class="f">Objetivo<input class="in money" data-k="metas.${i}.obj" data-type="money" inputmode="numeric" value="${esc(fmtIn(m.obj))}"></label><label class="f">Para (opcional)<input type="month" class="in" data-k="metas.${i}.fecha" value="${esc(m.fecha||'')}"></label><label class="f">Ya ahorrado<input class="in money" data-k="metas.${i}.ini" data-type="money" inputmode="numeric" value="${esc(fmtIn(m.ini))}"></label><label class="chk"><input type="checkbox" data-k="metas.${i}.arch" data-type="bool" ${m.arch?'checked':''}>Archivar</label></div>`).join('')}
    <button type="button" class="btn sm" data-act="rowadd" data-list="metas">${ic('plus','sm')}Agregar meta</button>`;
  // 7. deudas
  const s7=`${d.deudas.map((x,i)=>`<div class="edrow dd7"><input class="in full" data-k="deudas.${i}.n" value="${esc(x.n)}" placeholder="Nombre" aria-label="Nombre">${catSel(`deudas.${i}.c`,x.c)}<label class="f">Saldo<input class="in money" data-k="deudas.${i}.saldo" data-type="money" inputmode="numeric" value="${esc(fmtIn(x.saldo))}"></label><label class="f">Saldo a la fecha<input type="date" class="in" data-k="deudas.${i}.fs" value="${esc(x.fs||'')}"></label><label class="f">Tasa E.A. %<input class="in" data-k="deudas.${i}.tasa" data-type="num" inputmode="decimal" value="${esc(x.tasa||'')}"></label><label class="f">Cuota<input class="in money" data-k="deudas.${i}.cuota" data-type="money" inputmode="numeric" value="${esc(fmtIn(x.cuota))}"></label><button type="button" class="xbtn" data-act="rowdel" data-list="deudas" data-i="${i}" aria-label="Quitar">${ic('x','sm')}</button></div>`).join('')}
    <button type="button" class="btn sm" data-act="rowadd" data-list="deudas">${ic('plus','sm')}Agregar deuda</button><p class="xs muted">La categoría vinculada es la que usas al registrar el pago: así el saldo baja solo.</p>`;
  // 8. medios
  const s8=`${d.medios.map((m,i)=>`<div class="edrow" style="grid-template-columns:minmax(0,1fr) auto auto" ${m.arch?'style="opacity:.6"':''}><input class="in" data-k="medios.${i}.n" value="${esc(m.n)}" aria-label="Nombre"><label class="chk"><input type="checkbox" data-k="medios.${i}.cred" data-type="bool" ${m.cred?'checked':''}>Es crédito</label><label class="chk"><input type="checkbox" data-k="medios.${i}.arch" data-type="bool" ${m.arch?'checked':''}>Archivar</label></div>`).join('')}
    <button type="button" class="btn sm" data-act="rowadd" data-list="medios">${ic('plus','sm')}Agregar medio</button>`;
  // 9. arranque y parámetros
  const s9=`<div class="fgrid c2"><label class="f">Fecha de arranque<input type="date" class="in" data-k="arranque.f" value="${esc((d.arranque||{}).f||'')}"></label><label class="f">Plata disponible ese día<input class="in money" data-k="arranque.saldo" data-type="money-null" inputmode="numeric" value="${esc(d.arranque&&d.arranque.saldo!=null?fmtIn(d.arranque.saldo):'')}" placeholder="Sin definir"></label>
    <label class="f">Umbral de gasto hormiga<input class="in money" data-k="params.hormiga" data-type="money" inputmode="numeric" value="${esc(fmtIn(d.params.hormiga))}"></label><label class="f">Meta de tasa de ahorro (%)<input class="in" data-k="params.metaAhorro" data-type="num" inputmode="decimal" value="${esc(d.params.metaAhorro)}"></label>
    <label class="f">Límite sano de cuotas / ingreso (%)<input class="in" data-k="params.limDeuda" data-type="num" inputmode="decimal" value="${esc(d.params.limDeuda)}"></label></div>
    <p class="xs muted">El punto de partida solo afecta la quincena en la que empiezas a usar la app.</p>`;
  // 10. datos
  const imp=S.imp;
  const s10=`<div class="row">${S.cap.dl?`<button type="button" class="btn" data-act="exportxlsx">${ic('dl','sm')}Exportar a Excel</button><button type="button" class="btn" data-act="exportcsv">${ic('dl','sm')}Exportar CSV</button>`:'<span class="small muted">Exportar está disponible al abrir la app desde Claude.</span>'}<label class="btn">${ic('up','sm')}Importar CSV<input type="file" id="impFile" accept=".csv,text/csv" class="sr"></label></div>
    ${imp?`<div class="note">${imp.ok.length} movimientos listos para importar${imp.bad?` · ${imp.bad} filas ignoradas`:''}${imp.other?` · ${imp.other} sin categoría conocida (quedan en "Otros")`:''}.<div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-act="impcancel">Cancelar</button><button type="button" class="btn sm primary" data-act="impgo" ${imp.ok.length?'':'disabled'}>Importar ${imp.ok.length}</button></div></div>`:''}
    <p class="xs muted">El CSV usa punto y coma y las columnas fecha; tipo; categoria; monto; medio; fuente; descripcion (el mismo formato que exporta la app). Tus datos se guardan en tu cuenta de Claude y solo tú puedes verlos.</p>`;
  return `<div class="view"><div class="view-head"><div><h1>Ajustes</h1><p>Ingresos, porcentajes, pagos fijos, categorías, metas y deudas.</p></div></div>
    ${sec('ingresos','Ingresos y días de pago',`${money(esperado)} al mes`,s1,true)}
    ${sec('bolsillos','Bolsillos y porcentajes','6 bolsillos · perfiles por mes',s2,true)}
    ${sec('fijos','Pagos fijos',`${d.fijos.length} programados`,s3)}
    ${sec('recs','Gastos recurrentes reservados',`${d.recs.length} reservas por quincena`,s4)}
    ${sec('cats','Categorías',`${d.cats.filter(c=>!c.arch).length} activas`,s5)}
    ${sec('metas','Metas de ahorro',`${d.metas.filter(m=>!m.arch).length} activas`,s6)}
    ${sec('deudas','Deudas',`${d.deudas.length}`,s7)}
    ${sec('medios','Medios de pago','',s8)}
    ${sec('params','Punto de partida y parámetros','',s9)}
    ${sec('datos','Datos: exportar e importar','',s10)}
    <div style="position:sticky;bottom:calc(66px + env(safe-area-inset-bottom,0px));z-index:5" ${S.dirty?'':'hidden'} id="saveBar"><div class="panel row between" style="box-shadow:var(--shadow)"><span class="small"><b>Cambios sin guardar</b> <span id="saveErr" class="muted"></span></span><span class="row"><button type="button" class="btn sm" data-act="discard">Descartar</button><button type="button" class="btn sm primary" data-act="savecfg">Guardar cambios</button></span></div></div></div>`;
}
function pctPreview(p,d){ const e1=+d.pagos.e1||0,e2=+d.pagos.e2||0; return `${money((e1+e2)*p/100)} al mes · ${money(e1*p/100)} el ${d.pagos.d1} · ${money(e2*p/100)} el ${d.pagos.d2}`; }
function setPath(o,path,v){ const ks=path.split('.'); let t=o; for(let i=0;i<ks.length-1;i++){ const k=ks[i]; t=t[k]; if(t==null) return; } t[ks[ks.length-1]]=v; }
function getPath(o,path){ return path.split('.').reduce((t,k)=>t==null?t:t[k],o); }
function validateCfg(d){
  const e=[];
  const d1=+d.pagos.d1,d2=+d.pagos.d2;
  if(!(d1>=1&&d1<=28)) e.push('El primer día de pago debe estar entre 1 y 28.');
  if(!(d2>d1&&d2<=31)) e.push('El segundo día de pago debe ser mayor que el primero y máximo 31.');
  for(const p of d.perfiles){ const t=sum(d.bolsillos.map(b=>+p.pct[b.id]||0)); if(Math.abs(t-100)>0.01) e.push(`El perfil "${p.n}" suma ${t}%: debe sumar 100%.`); }
  for(const r of d.perfilMes) if(!isYm(r.desde)) e.push('Cada cambio de perfil necesita un mes "desde".');
  for(const f of d.fijos) if(!f.n||!(f.m>0)) e.push('Cada pago fijo necesita concepto y monto.');
  return e;
}

/* =========================================================
   Gráficas (SVG propio)
   ========================================================= */
function niceTicks(lo,hi,count){
  if(!isFinite(lo)) lo=0; if(!isFinite(hi)) hi=1; if(hi===lo) hi=lo+1;
  const raw=(hi-lo)/(count||4), mag=Math.pow(10,Math.floor(Math.log10(raw))), nr=raw/mag;
  const st=(nr<=1?1:nr<=2?2:nr<=2.5?2.5:nr<=5?5:10)*mag;
  const a=Math.floor(lo/st)*st, b=Math.ceil(hi/st)*st, out=[];
  for(let v=a;v<=b+st*0.5;v+=st) out.push(Math.round(v*100)/100);
  return out;
}
function axisFmt(ticks){
  const mx=Math.max(...ticks.map(Math.abs));
  if(mx>=1e6) return v=>v===0?'$0':'$'+(v/1e6).toLocaleString('es-CO',{maximumFractionDigits:1})+' M';
  if(mx>=1e3) return v=>v===0?'$0':'$'+Math.round(v/1e3).toLocaleString('es-CO')+' mil';
  return v=>'$'+Math.round(v);
}
function drawCharts(){
  for(const el of $$('[data-ch]')){
    const id=el.dataset.ch, o=CH[id]; if(!o) continue;
    try{ if(o.type==='line') drawLine(el,id,o); else if(o.type==='cols') drawCols(el,id,o); else if(o.type==='spark') drawSpark(el,o); }catch(e){ el.textContent=''; }
  }
}
function drawSpark(el,o){
  const W=Math.max(40,Math.floor(el.getBoundingClientRect().width)), H=26, v=o.v.map(x=>+x||0);
  const mx=Math.max(1,...v), mn=Math.min(0,...v), n=v.length;
  const X=i=>2+(n<=1?0:i*(W-6)/(n-1)), Y=x=>H-3-(x-mn)/((mx-mn)||1)*(H-6);
  const pts=v.map((x,i)=>`${X(i).toFixed(1)},${Y(x).toFixed(1)}`).join(' ');
  el.innerHTML=`<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><polyline points="${pts}" style="fill:none;stroke:var(--line-2);stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round"/><circle cx="${X(n-1).toFixed(1)}" cy="${Y(v[n-1]).toFixed(1)}" r="3" style="fill:var(--accent);stroke:var(--panel);stroke-width:1.5"/></svg>`;
}
function drawLine(el,id,o){
  const W=Math.max(260,Math.floor(el.getBoundingClientRect().width)), H=o.h||220;
  const P={l:58,r:14,t:12,b:26}, iw=W-P.l-P.r, ih=H-P.t-P.b, n=o.labels.length;
  const vals=[]; for(const s of o.series) for(const v of s.v) if(v!=null&&isFinite(v)) vals.push(v);
  const ticks=niceTicks(Math.min(0,...vals),Math.max(1,...vals),4), lo=ticks[0], hi=ticks[ticks.length-1], f=axisFmt(ticks);
  const X=i=>P.l+(n<=1?iw/2:i*iw/(n-1)), Y=v=>P.t+ih-(v-lo)/((hi-lo)||1)*ih;
  let s=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(o.aria||'')}">`;
  for(const t of ticks){ const y=Y(t).toFixed(1); s+=`<line class="${t===lo?'ax':'gl'}" x1="${P.l}" x2="${W-P.r}" y1="${y}" y2="${y}"/><text x="${P.l-8}" y="${(+y+4).toFixed(1)}" text-anchor="end">${esc(f(t))}</text>`; }
  const maxL=Math.max(1,Math.floor(iw/52)), step=Math.ceil(n/maxL);
  o.labels.forEach((l,i)=>{ if((n-1-i)%step===0) s+=`<text x="${X(i).toFixed(1)}" y="${H-6}" text-anchor="middle">${esc(l)}</text>`; });
  for(const se of o.series){
    let d='', on=false, lastI=-1;
    se.v.forEach((v,i)=>{ if(v==null||!isFinite(v)){ on=false; return; } d+=(on?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1); on=true; lastI=i; });
    if(d) s+=`<path class="ln${se.dash?' dash':''}" d="${d}" style="stroke:${se.c}"/>`;
    if(lastI>=0&&!se.dash) s+=`<circle class="ring" cx="${X(lastI).toFixed(1)}" cy="${Y(se.v[lastI]).toFixed(1)}" r="4" style="fill:${se.c}"/>`;
    if(lastI>=0&&se.dash&&se.hollow) s+=`<circle cx="${X(lastI).toFixed(1)}" cy="${Y(se.v[lastI]).toFixed(1)}" r="4" style="fill:var(--panel);stroke:${se.c};stroke-width:2"/>`;
  }
  s+=`<g class="xhg" style="display:none"></g><rect class="hov" data-line="${esc(id)}" x="${P.l}" y="${P.t}" width="${iw}" height="${ih}" tabindex="0" aria-label="Explorar valores"/></svg>`;
  el.innerHTML=s;
  o._g={X,Y,n,P,W,H,iw,ih};
}
function drawCols(el,id,o){
  const W=Math.max(240,Math.floor(el.getBoundingClientRect().width)), H=o.h||180;
  const P={l:52,r:8,t:20,b:24}, iw=W-P.l-P.r, ih=H-P.t-P.b, n=o.v.length;
  const ticks=niceTicks(0,Math.max(1,...o.v),3), hi=ticks[ticks.length-1], f=axisFmt(ticks);
  const Y=v=>P.t+ih-v/(hi||1)*ih, band=iw/n, bw=Math.min(24,band*0.6);
  let s=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Gasto por día de la semana">`;
  for(const t of ticks){ const y=Y(t).toFixed(1); s+=`<line class="${t===0?'ax':'gl'}" x1="${P.l}" x2="${W-P.r}" y1="${y}" y2="${y}"/><text x="${P.l-8}" y="${(+y+4).toFixed(1)}" text-anchor="end">${esc(f(t))}</text>`; }
  o.v.forEach((v,i)=>{
    const cx=P.l+band*(i+0.5), x0=cx-bw/2, x1=cx+bw/2, yb=Y(0), y=Y(v), r=Math.min(4,Math.max(0,yb-y));
    const col=i===o.hi?o.c:'var(--bar-mute)';
    if(v>0) s+=`<path class="bar" tabindex="0" d="M${x0.toFixed(1)},${yb.toFixed(1)}V${(y+r).toFixed(1)}Q${x0.toFixed(1)},${y.toFixed(1)} ${(x0+r).toFixed(1)},${y.toFixed(1)}H${(x1-r).toFixed(1)}Q${x1.toFixed(1)},${y.toFixed(1)} ${x1.toFixed(1)},${(y+r).toFixed(1)}V${yb.toFixed(1)}Z" style="fill:${col}" data-tt="${esc(o.long[i])}" data-tv="${esc(money(v))}" data-tl="${esc(o.unit)}" data-tk="${col}"/>`;
    s+=`<text x="${cx.toFixed(1)}" y="${H-6}" text-anchor="middle" ${i===o.hi?'class="lbl-strong"':''}>${esc(o.labels[i])}</text>`;
    if(i===o.hi&&v>0) s+=`<text x="${cx.toFixed(1)}" y="${(y-6).toFixed(1)}" text-anchor="middle" class="lbl-strong">${esc(money(v))}</text>`;
  });
  el.innerHTML=s+'</svg>';
}

/* ---------------- Tooltip ---------------- */
const tipEl=()=>$('#tip');
function showTip(x,y,title,rows){
  const t=tipEl(); t.textContent='';
  if(title){ const h=document.createElement('div'); h.className='tt'; h.textContent=title; t.appendChild(h); }
  for(const r of rows){ const row=document.createElement('div'); row.className='tr'; const k=document.createElement('i'); k.className='k'; k.style.background=r.k||'var(--ink-2)'; if(r.dash){ k.style.background='repeating-linear-gradient(90deg,'+(r.k||'var(--ink-2)')+' 0 3px,transparent 3px 5px)'; } const b=document.createElement('b'); b.textContent=r.v; const sp=document.createElement('span'); sp.textContent=r.l||''; row.append(k,b,sp); t.appendChild(row); }
  t.hidden=false;
  const w=t.offsetWidth,h=t.offsetHeight, vw=window.innerWidth, vh=window.innerHeight;
  let lx=x+14, ly=y+14; if(lx+w>vw-8) lx=x-w-14; if(lx<8) lx=8; if(ly+h>vh-8) ly=y-h-14; if(ly<8) ly=8;
  t.style.left=lx+'px'; t.style.top=ly+'px';
}
function hideTip(){ const t=tipEl(); if(t) t.hidden=true; for(const g of $$('.xhg')) g.style.display='none'; }
function lineHover(rect,cx,cy){
  const id=rect.dataset.line, o=CH[id]; if(!o||!o._g) return;
  const g=o._g, svg=rect.ownerSVGElement, br=svg.getBoundingClientRect();
  const px=(cx-br.left)*(g.W/br.width);
  const i=clamp(Math.round((px-g.P.l)/(g.n<=1?1:g.iw/(g.n-1))),0,g.n-1);
  const xg=svg.querySelector('.xhg'); const x=g.X(i).toFixed(1);
  let inner=`<line class="xh" x1="${x}" x2="${x}" y1="${g.P.t}" y2="${g.P.t+g.ih}"/>`;
  const rows=[];
  for(const se of o.series){ const v=se.v[i]; if(v==null||!isFinite(v)) continue; inner+=`<circle class="ring" cx="${x}" cy="${g.Y(v).toFixed(1)}" r="4" style="fill:${se.c}"/>`; rows.push({v:money(v),l:se.n,k:se.c,dash:se.dash}); }
  xg.innerHTML=inner; xg.style.display='';
  if(rows.length) showTip(cx,cy,(o.long||o.labels)[i],rows); else { const t=tipEl(); t.hidden=true; }
}
document.addEventListener('pointermove',e=>{
  const r=e.target.closest&&e.target.closest('rect.hov'); if(r){ lineHover(r,e.clientX,e.clientY); return; }
  const m=e.target.closest&&e.target.closest('[data-tv]');
  if(m){ showTip(e.clientX,e.clientY,m.dataset.tt,[{v:m.dataset.tv,l:m.dataset.tl,k:m.dataset.tk}]); return; }
  if(!tipEl().hidden) hideTip();
});
document.addEventListener('pointerdown',e=>{ const r=e.target.closest&&e.target.closest('rect.hov'); if(r) lineHover(r,e.clientX,e.clientY); });
document.addEventListener('focusin',e=>{
  const m=e.target.closest&&e.target.closest('[data-tv]');
  if(m){ const b=m.getBoundingClientRect(); showTip(b.left+b.width/2,b.bottom,m.dataset.tt,[{v:m.dataset.tv,l:m.dataset.tl,k:m.dataset.tk}]); }
  const r=e.target.closest&&e.target.closest('rect.hov');
  if(r){ const b=r.getBoundingClientRect(); lineHover(r,b.right-2,b.top+b.height/2); }
});
document.addEventListener('focusout',e=>{ if(e.target.closest&&(e.target.closest('[data-tv]')||e.target.closest('rect.hov'))) hideTip(); });
window.addEventListener('scroll',()=>{ if(!tipEl().hidden) hideTip(); },{passive:true});
let rzT=null; window.addEventListener('resize',()=>{ clearTimeout(rzT); rzT=setTimeout(()=>{ if(S.mode==='live'||S.mode==='demo') drawCharts(); },150); });

/* =========================================================
   Toast y hoja de edición
   ========================================================= */
let toastT=null;
function toast(msg,actLabel,actFn){
  const t=$('#toast'); t.textContent='';
  const sp=document.createElement('span'); sp.textContent=msg; t.appendChild(sp);
  if(actLabel){ const b=document.createElement('button'); b.type='button'; b.textContent=actLabel; b.onclick=()=>{ t.hidden=true; actFn(); }; t.appendChild(b); }
  t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>{ t.hidden=true; },actLabel?6500:3200);
}
function openEdit(id){
  const x=S.movs.find(m=>m.id===id); if(!x) return;
  S.edit=Object.assign({},x,{orig:x,confirm:false,err:''}); renderSheet();
}
function renderSheet(){
  const root=$('#sheetRoot'), E=S.edit;
  if(!E){ root.innerHTML=''; return; }
  const metas=S.cfg.metas;
  root.innerHTML=`<div class="sheet-wrap" data-act="sheetbg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="shT">
    <div class="sheet-h"><h2 id="shT">Editar movimiento</h2><button type="button" class="iconbtn" data-act="sheetclose" aria-label="Cerrar">${ic('x','sm')}</button></div>
    <div class="seg full" role="group" aria-label="Tipo">${Object.entries(TIPOS).map(([v,l])=>`<button type="button" data-act="edtipo" data-v="${v}" aria-pressed="${E.t===v}">${l}</button>`).join('')}</div>
    <div class="fgrid c2">
      <label class="f">Monto<input class="in money" id="edM" inputmode="numeric" data-money="1" value="${esc(fmtIn(E.m))}"></label>
      <label class="f">Fecha<input type="date" class="in" id="edF" value="${esc(E.f)}"></label>
      <label class="f">${E.t==='a'?'Meta':'Categoría'}<select class="in" id="edC">${catOptions(E.t,E.c)}</select></label>
      ${E.t!=='a'?`<label class="f">Medio<select class="in" id="edP">${medOptions(E.p)}</select></label>`:'<span></span>'}
      ${E.t==='g'?`<label class="f">Pagado con<select class="in" id="edS"><option value="q">Plata de la quincena</option>${metas.map(m=>`<option value="${esc(m.id)}" ${E.src===m.id?'selected':''}>${esc(m.n)}</option>`).join('')}</select></label>`:''}
      <label class="f" style="grid-column:1/-1">Descripción<input class="in" id="edD" maxlength="140" value="${esc(E.d||'')}"></label>
    </div>
    ${E.err?`<p class="pill crit" role="alert">${esc(E.err)}</p>`:''}
    ${E.confirm?`<div class="confirm"><span>¿Borrar este movimiento? No se puede deshacer.</span><button type="button" class="btn sm" data-act="edno">No</button><button type="button" class="btn sm danger" data-act="eddelok">Sí, borrar</button></div>`:''}
    <div class="row between"><button type="button" class="btn danger" data-act="eddel">${ic('trash','sm')}Borrar</button><span class="row"><button type="button" class="btn" data-act="sheetclose">Cancelar</button><button type="button" class="btn primary" data-act="edsave">Guardar</button></span></div>
  </div></div>`;
  const first=$('#edM'); if(first&&window.matchMedia('(pointer:fine)').matches) first.focus();
}
function readEdit(){
  const E=S.edit; if(!E) return;
  const g=id=>{const el=$('#'+id);return el?el.value:null;};
  if(g('edM')!=null) E.m=parseMoney(g('edM')); if(g('edF')!=null) E.f=g('edF'); if(g('edC')!=null) E.c=g('edC');
  if(g('edP')!=null) E.p=g('edP'); if(g('edS')!=null) E.src=g('edS'); if(g('edD')!=null) E.d=g('edD');
}

/* =========================================================
   Acciones
   ========================================================= */
function canWrite(){ return S.mode==='live'||S.mode==='demo'; }
async function saveRapido(){
  const R=S.reg;
  const amt=$('#amt'); if(amt) R.m=parseMoney(amt.value);
  const dsc=$('#regDesc'); if(dsc) R.d=dsc.value.trim();
  if(!(R.m>0)){ R.err='Escribe el monto.'; render(); return; }
  if(!R.c){ R.err=R.t==='a'?'Elige la meta.':'Elige una categoría.'; render(); return; }
  if(!isYmd(R.f)){ R.err='Revisa la fecha.'; render(); return; }
  const mov={id:uid('m'),f:R.f,t:R.t,c:R.c,m:R.m,p:R.t==='a'?null:R.p,src:R.t==='g'?R.src:'q',d:R.d,fx:R.fx,o:'r',ts:Date.now()};
  const label=`${TIPOS[R.t]} guardado · ${catName(R.c)} ${money(R.m)}`;
  S.reg=newReg({t:R.t,p:R.p}); S.focusAmt=true; render();
  try{ await putMovs([mov]); toast(label,'Deshacer',()=>delMov(mov).catch(failSave)); }
  catch(e){ failSave(e); }
}
async function payFijo(id){
  const p=pStats(todayStr()); const f=p.fx.find(x=>x.id===id); if(!f) return;
  const mov={id:uid('m'),f:todayStr(),t:'g',c:f.c,m:f.m,p:(S.reg&&S.reg.p)||null,d:f.n,fx:f.id,o:'f',ts:Date.now()};
  try{ await putMovs([mov]); toast(`Pago registrado · ${f.n} ${money(f.m)}`,'Deshacer',()=>delMov(mov).catch(failSave)); }catch(e){ failSave(e); }
}
async function saveEdit(){
  readEdit(); const E=S.edit; if(!E) return;
  if(!(E.m>0)){ E.err='Escribe el monto.'; renderSheet(); return; }
  if(!E.c){ E.err='Elige una categoría.'; renderSheet(); return; }
  if(!isYmd(E.f)){ E.err='Revisa la fecha.'; renderSheet(); return; }
  const o=E.orig, mov={id:o.id,f:E.f,t:E.t,c:E.c,m:E.m,p:E.t==='a'?null:E.p,src:E.t==='g'?E.src:'q',d:(E.d||'').trim(),fx:E.t===o.t?o.fx:null,o:o.o,ts:o.ts};
  S.edit=null; renderSheet();
  try{
    if(o.f.slice(0,7)!==mov.f.slice(0,7)){ await putMovs([mov]); await delMov(o); }
    else await putMovs([mov]);
    toast('Cambios guardados');
  }catch(e){ failSave(e); }
}
function localParse(text){
  const today=todayStr(), out=[];
  const chunks=String(text).split(/[\n;]+|,(?!\d{3}\b)|\.\s+|\sy\s(?=\D)/i).map(s=>s.trim()).filter(Boolean);
  const dayIdx={domingo:0,lunes:1,martes:2,miercoles:3,jueves:4,viernes:5,sabado:6};
  const kw={alm:['almuerzo','almorce','corrientazo','desayuno','comida'],gas:['gasolina','tanqueo','tanquee'],parqu:['parqueadero u','parqueadero de la u'],parq:['parqueadero'],pelu:['peluqueria','corte','barberia'],lav:['lavada','lavadero'],mant:['aceite','filtro','mantenimiento','taller'],comida:['mercado','supermercado','d1','ara'],antojos:['tienda','snack','gaseosa','dulce','antojo','cafe','tinto'],salidas:['salida','rumba','cine','pola','cerveza','restaurante'],subs:['spotify','netflix','suscripcion'],ropa:['ropa','camisa','pantalon','zapatos','tenis'],salud:['farmacia','drogueria','medicamento','medico'],serv:['luz','agua','gas natural','servicio'],cel:['claro','plan','celular','internet'],comp:['componente','resistencia','arduino','esp32','protoboard','sensor'],transp:['bus','transmilenio','uber','taxi']};
  const medKw={nequi:['nequi'],efe:['efectivo','cash'],tc:['tarjeta de credito','credito','tarjeta'],deb:['debito','cuenta'],trans:['transferencia'],daviplata:['daviplata']};
  for(const ch of chunks){
    const n=norm(ch);
    const mm=n.match(/(\d+(?:[.,]\d+)*)\s*(mil|lucas?|barras?|k|palos?|millon(?:es)?)?\b/);
    if(!mm) continue;
    let v=mm[1]; const unit=mm[2]||'';
    let num;
    if(/^\d{1,3}([.,]\d{3})+$/.test(v)) num=parseInt(v.replace(/[.,]/g,''),10); else num=parseFloat(v.replace(',','.'));
    if(/mil|luca|barra|^k$/.test(unit)) num*=1000; else if(/palo|millon/.test(unit)) num*=1e6;
    num=Math.round(num); if(!(num>0)) continue;
    let f=today;
    if(/\bantier\b|\bantes de ayer\b/.test(n)) f=addDays(today,-2); else if(/\bayer\b/.test(n)) f=addDays(today,-1);
    else { for(const [w,di] of Object.entries(dayIdx)) if(new RegExp('\\b'+w+'\\b').test(n)){ const td=pd(today).getDay(); f=addDays(today,-((td-di+7)%7)); break; } }
    let t='g'; if(/\bpagaron\b|\bquincena\b|\bsalario\b|\bsueldo\b|\bme consignaron\b|\bcomision/.test(n)) t='i'; if(/\bahorr|\bguarde\b|\bbolsillo\b|\bcajita\b/.test(n)) t='a';
    let c=null, duda=true;
    if(t==='i'){ c=/comision/.test(n)?'comis':/prima/.test(n)?'prima':'sal'; if(!S.catMap[c]) c=(catsFor('i')[0]||{}).id; duda=false; }
    else if(t==='a'){ const mt=S.cfg.metas.find(m=>!m.arch&&n.includes(norm(m.n).split(' ')[0])); c=(mt||S.cfg.metas.find(m=>!m.arch)||{}).id; duda=!mt; }
    else {
      for(const [cid,ws] of Object.entries(kw)) if(S.catMap[cid]&&!S.catMap[cid].arch&&ws.some(w=>n.includes(w))){ c=cid; duda=false; break; }
      if(!c){ const hit=catsFor('g').find(cc=>norm(cc.n).split(/\W+/).some(w=>w.length>3&&n.includes(w))); if(hit){ c=hit.id; duda=false; } }
      if(!c) c=S.catMap.otros?'otros':(catsFor('g')[0]||{}).id;
    }
    let p=null; for(const [mid,ws] of Object.entries(medKw)) if(S.medMap[mid]&&ws.some(w=>n.includes(w))){ p=mid; break; }
    if(!c) continue;
    out.push({f,t,c,m:num,p:p||(S.reg&&S.reg.p)||null,d:ch.slice(0,80),duda});
  }
  return out;
}
function normParsed(x){
  if(!x||typeof x!=='object') return null;
  const t=['g','i','a'].includes(x.tipo||x.t)?(x.tipo||x.t):'g';
  let f=String(x.fecha||x.f||todayStr()); if(!isYmd(f)) f=todayStr(); if(f>addDays(todayStr(),1)) f=todayStr();
  const m=Math.round(+x.monto||+x.m||0); if(!(m>0)) return null;
  let c=t==='a'?(x.meta||x.cat||x.c):(x.cat||x.c), duda=!!x.duda;
  if(t==='a'){ if(!S.metaMap[c]){ c=(S.cfg.metas.find(mm=>!mm.arch)||{}).id; duda=true; } }
  else if(!S.catMap[c]||S.catMap[c].t!==t){ c=t==='i'?(catsFor('i')[0]||{}).id:(S.catMap.otros?'otros':(catsFor('g')[0]||{}).id); duda=true; }
  if(!c) return null;
  const p=S.medMap[x.medio||x.p]?(x.medio||x.p):((S.reg&&S.reg.p)||null);
  return {f,t,c,m,p,d:String(x.desc||x.d||'').slice(0,120),duda};
}
function parsePrompt(text){
  const today=todayStr(), d=pd(today);
  const cats=catsFor('g').map(c=>`${c.id}: ${c.n}`).join('\n'), ing=catsFor('i').map(c=>`${c.id}: ${c.n}`).join('\n'), metas=S.cfg.metas.filter(m=>!m.arch).map(m=>`${m.id}: ${m.n}`).join('\n'), meds=S.cfg.medios.filter(m=>!m.arch).map(m=>`${m.id}: ${m.n}`).join('\n');
  return `Convierte el texto de un usuario colombiano en movimientos de dinero.
Hoy es ${DIA[d.getDay()]} ${today} (hora de Bogotá).

Montos (pesos colombianos): "mil", "lucas", "barras" y "k" multiplican por 1.000; "palo" o "millón" por 1.000.000. "15 mil" = 15000; "1,2 millones" o "1.2 palos" = 1200000. El punto separa miles: "35.000" = 35000.
Fechas: "hoy", "ayer", "antier" (hace 2 días). Un día de la semana es el más reciente que ya pasó (o hoy). "El 15" es el día 15 del mes actual, o del anterior si ese día aún no llega. Sin fecha: hoy.
Tipos: "g" gasto, "i" ingreso, "a" ahorro (dinero que se aparta a una meta).

Categorías de gasto (id: nombre):
${cats}
Categorías de ingreso:
${ing}
Metas de ahorro (para tipo "a"):
${metas}
Medios de pago:
${meds}

Responde SOLO con un arreglo JSON, sin texto adicional:
[{"fecha":"YYYY-MM-DD","tipo":"g","cat":"<id>","meta":null,"monto":15000,"medio":"<id o null>","desc":"nota corta","duda":false}]
Para tipo "a" usa "cat": null y "meta": "<id>". Si dudas de la categoría, usa la más cercana y pon "duda": true. Ignora lo que no sea un movimiento. Si no hay movimientos responde [].

Texto:
"""${String(text).slice(0,4000)}"""`;
}
const SAMPLE_ERR={not_granted:'No diste permiso para usar Claude en esta app.',sampling_disabled:'La IA no está disponible para tu cuenta.',rate_limited:'Muchas consultas seguidas. Intenta de nuevo en unos minutos.',session_expired:'Tu sesión de Claude expiró. Vuelve a iniciar sesión.',refused:'Claude no pudo responder esa consulta. Reformúlala.',invalid_json:'La respuesta llegó incompleta. Intenta de nuevo.',prompt_too_large:'Hay demasiados datos para analizar de una vez.',empty_completion:'No hubo respuesta. Intenta de nuevo.'};
const sampleErr=e=>SAMPLE_ERR[e&&e.code]||'No se pudo completar. Intenta de nuevo.';
function hideAIIfPermanent(e){ if(e&&['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed'].includes(e.code)) S.cap.sample=null; }
async function runParse(){
  const ta=$('#iaText'); if(ta) S.ia.text=ta.value;
  const text=S.ia.text.trim(); if(!text){ S.ia.err='Escribe o dicta al menos un movimiento.'; render(); return; }
  S.ia.parsing=true; S.ia.err=''; render();
  try{
    let items;
    if(S.cap.sample){
      const res=await S.cap.sample.json(parsePrompt(text),{modelTier:'quick'});
      const arr=Array.isArray(res)?res:(res&&Array.isArray(res.movimientos)?res.movimientos:[]);
      items=arr.map(normParsed).filter(Boolean);
    } else items=localParse(text);
    S.ia.items=(S.ia.items||[]).concat(items);
    if(!items.length) S.ia.err='No encontré movimientos con monto en ese texto.'; else S.ia.text='';
  }catch(e){ hideAIIfPermanent(e); S.ia.err=sampleErr(e); if(!S.cap.sample){ const items=localParse(text); if(items.length){ S.ia.items=(S.ia.items||[]).concat(items); S.ia.err+=' Usé el lector básico.'; S.ia.text=''; } } }
  S.ia.parsing=false; render();
}
async function saveList(list,origin){
  const movs=list.map(x=>({id:uid('m'),f:x.f,t:x.t,c:x.c,m:x.m,p:x.t==='a'?null:(x.p||null),src:'q',d:x.d||'',o:origin,ts:Date.now()}));
  await putMovs(movs);
  return movs;
}
function syncRows(listName){
  const arr=listName==='ia'?S.ia.items:S.tabla; if(!arr) return;
  for(const row of $$(`[data-list="${listName}"]`)){
    const i=+row.dataset.row, x=arr[i]; if(!x) continue;
    for(const el of $$('[data-f]',row)){ const k=el.dataset.f; x[k]=k==='m'?parseMoney(el.value):el.value; }
  }
}
function buildSummary(k){
  const c=S.cfg, r=mStats(k), cur=curMonth(), prev3=[1,2,3].map(i=>addMonthsK(k,-i)).filter(monthHasData);
  const cats=Object.entries(r.byCat).map(([id,v])=>({categoria:catName(id),bolsillo:bName((S.catMap[id]||{}).b),fijo:!!(S.catMap[id]||{}).fijo,este_mes:v,promedio_meses_previos:prev3.length?Math.round(sum(prev3.map(x=>mStats(x).byCat[id]||0))/prev3.length):null})).sort((a,b)=>b.este_mes-a.este_mes).slice(0,15);
  const q=k===cur?pStats(todayStr()):null;
  const wk=[0,0,0,0,0,0,0]; for(const x of r.movs) if(x.t==='g'&&!(S.catMap[x.c]||{}).fijo) wk[pd(x.f).getDay()]+=x.m;
  return {
    persona:c.nombre||'el usuario', fecha_hoy:todayStr(), mes:k, mes_en_curso:k===cur, perfil_porcentajes:r.perfil.n,
    ingresos:{salario_registrado:r.ingBase,extras:r.ingExtra,esperado_mensual:(+c.pagos.e1||0)+(+c.pagos.e2||0),dias_de_pago:[c.pagos.d1,c.pagos.d2]},
    gastos:{total:r.gas,desde_la_quincena:r.gasQ,pagados_con_ahorros:r.gasMeta,fijos:r.fijo,variables:r.vari,cuotas_de_deuda:r.cuotas},
    ahorro:{aportes:r.aho,tasa:r.tasaAho,meta_tasa:(+c.params.metaAhorro||10)/100},
    endeudamiento:{cuotas_sobre_ingreso:r.endeu,limite:(+c.params.limDeuda||30)/100},
    bolsillos:c.bolsillos.map(b=>({bolsillo:b.n,tipo:b.k,porcentaje:+r.perfil.pct[b.id]||0,asignado:r.asig[b.id],usado:r.byB[b.id]||0})),
    categorias:cats,
    gastos_hormiga:{compras:r.horm.n,total:r.horm.tot,umbral:+c.params.hormiga||15000},
    gasto_variable_por_dia_semana:Object.fromEntries(DIA.map((d,i)=>[d,wk[i]])),
    medios_de_pago:Object.entries(r.byMed).map(([id,v])=>({medio:(S.medMap[id]||{}).n||id,credito:!!(S.medMap[id]||{}).cred,total:v})),
    gastos_mas_grandes:r.movs.filter(x=>x.t==='g').sort((a,b)=>b.m-a.m).slice(0,8).map(x=>({fecha:x.f,categoria:catName(x.c),monto:x.m,nota:x.d||''})),
    quincena_actual:q?{inicio:q.start,proximo_pago:q.next,ingreso:q.ingreso,disponible:q.disp,por_dia:Math.round(q.porDia),dias_restantes:q.restDays,ritmo:q.estado,pagos_fijos_pendientes:q.fx.filter(f=>!f.paid).map(f=>({concepto:f.n,monto:f.m}))}:null,
    metas:c.metas.filter(m=>!m.arch).map(m=>{const s=metaStats(m);return {meta:m.n,objetivo:+m.obj||0,ahorrado:s.saldo,aporte_promedio_mensual:Math.round(s.prom),fecha_objetivo:m.fecha||null};}),
    deudas:c.deudas.map(d=>{const s=deudaStats(d);return {deuda:d.n,saldo_estimado:s.saldo,tasa_efectiva_anual:d.tasa||null,cuota:+d.cuota||0,meses_restantes:s.n!=null&&isFinite(s.n)?Math.ceil(s.n):null};}),
    cambios_programados:c.fijos.filter(f=>(f.hasta&&f.hasta>=cur)||(f.desde&&f.desde>cur)).map(f=>({concepto:f.n,monto:f.m,desde:f.desde||null,hasta:f.hasta||null})),
    historial:monthsRange(k,6).filter(monthHasData).map(x=>{const s=mStats(x);return {mes:x,ingresos:s.ing,gastos:s.gas,ahorro:s.aho};}),
    cierre_estimado_del_mes:k===cur?projMonth(k).proj:null
  };
}
function advisorRules(){ const n=S.cfg.nombre||'el usuario'; return `Eres el asesor financiero personal de ${n}, que vive en Bogotá y recibe su salario por quincenas.
Reglas:
- Usa SOLO los datos del JSON. No inventes cifras; si algo es una estimación, dilo.
- Sé directo y concreto, tutea, español de Colombia, sin motivación vacía.
- Prioriza estabilidad: colchón de emergencia y salir de deudas antes que metas grandes. No recomiendes recortes extremos ni descuidar comida, salud o descanso.
- Señala con respeto las contradicciones entre sus metas y sus gastos.
- Escribe los montos como $1.200.000.`; }
async function runAI(){
  const k=S.month; const prev=S.ai[k]||{};
  S.ai[k]=Object.assign({},prev,{state:'thinking',err:''}); render();
  try{
    const prompt=`${advisorRules()}

Analiza el mes y responde SOLO con un objeto JSON con esta forma:
{"puntaje": número de 0 a 100 (salud financiera del mes), "estado": "una frase", "hallazgos": [{"tipo": "alerta" | "oportunidad" | "logro", "titulo": "máximo 8 palabras", "detalle": "1 o 2 frases con cifras", "accion": "1 frase: qué hacer, con monto o fecha"}], "proyeccion": "1 o 2 frases sobre cómo cerrará el mes o el siguiente", "pregunta": "una pregunta corta si falta un dato clave, o cadena vacía"}
Incluye entre 3 y 6 hallazgos.

DATOS:
${JSON.stringify(buildSummary(k))}`;
    const res=await S.cap.sample.json(prompt,{modelTier:'default'});
    if(!res||typeof res!=='object'||!Array.isArray(res.hallazgos)) throw {code:'invalid_json'};
    const ts=Date.now();
    S.ai[k]={state:'done',res,ts};
    if(S.mode==='live') enqueue('ia/'+k,()=>withRetry(()=>S.cap.db.doc('ia/'+k).set({ts,res}))).catch(()=>{});
  }catch(e){ hideAIIfPermanent(e); S.ai[k]=Object.assign({},prev,{state:'error',err:sampleErr(e)}); }
  if(S.view==='analisis') render();
}
async function loadAI(k){
  try{ const snap=await S.cap.db.doc('ia/'+k).get(); const v=snap.exists?snap.data():null; S.ai[k]=v&&v.res?{state:'done',res:v.res,ts:v.ts}:{state:'idle'}; }
  catch(e){ S.ai[k]={state:'idle'}; }
  if(S.view==='analisis') scheduleRender();
}
let askCtl=null;
async function runAsk(){
  const inp=$('#askq'); if(inp) S.ask.q=inp.value;
  const q=S.ask.q.trim(); if(!q||!S.cap.sample) return;
  askCtl=new AbortController();
  S.ask.state='thinking'; S.ask.out=''; S.ask.err=''; render();
  const prompt=`${advisorRules()}
Responde su pregunta con base en los datos. Evalúa el impacto en su quincena, sus bolsillos y sus metas. Si falta información, dilo y pide el dato. Máximo 150 palabras, texto plano (puedes usar guiones).

DATOS:
${JSON.stringify(buildSummary(S.month))}

PREGUNTA: ${q.slice(0,600)}`;
  try{
    await S.cap.sample(prompt,{cache:false,signal:askCtl.signal,onText:({text})=>{ S.ask.out=text; S.ask.state='streaming'; const o=$('#askout'); if(o) o.innerHTML=askOutHtml(); }});
    S.ask.state='done';
  }catch(e){ if(e&&e.code==='cancelled'){ S.ask.state='done'; } else { hideAIIfPermanent(e); S.ask.state='error'; S.ask.err=sampleErr(e); S.ask.out=e&&e.text||S.ask.out; } }
  askCtl=null;
  if(S.view==='analisis') render();
}
function setupDictation(){
  const d=S.cap.dict; if(!d) return;
  d.onFinal(({text})=>{ const cur=S.ia.text||''; S.ia.text=cur?cur+text:String(text).replace(/^\s+/,''); const ta=$('#iaText'); if(ta) ta.value=S.ia.text; const p=$('#iaPartial'); if(p) p.textContent=''; });
  d.onPartial(({text})=>{ const p=$('#iaPartial'); if(p) p.textContent=text; });
  d.onState(({state,reason})=>{
    S.dictState=state;
    const b=$('#micBtn'); if(b){ b.dataset.on=state!=='idle'?'1':'0'; const l=b.querySelector('.lbl'); if(l) l.textContent=state!=='idle'?'Detener':'Dictar'; }
    if(state==='idle'&&reason==='unavailable'){ S.cap.dict=null; if(S.view==='registrar') render(); }
    if(state==='idle'&&reason==='not_granted') toast('Diste "no" al dictado. Puedes escribir o usar el micrófono del teclado.');
  });
}

/* ---------------- Exportar / importar ---------------- */
function movsToRows(){
  return S.movs.slice().reverse().map(x=>[x.f,TIPOS[x.t].toLowerCase(),catName(x.c),x.m,(S.medMap[x.p]||{}).n||'',x.src&&x.src!=='q'?((S.metaMap[x.src]||{}).n||''):'quincena',x.d||'',x.t==='a'?bName((S.metaMap[x.c]||{}).b):x.t==='g'?bName((S.catMap[x.c]||{}).b):'']);
}
const CSVH=['fecha','tipo','categoria','monto','medio','fuente','descripcion','bolsillo'];
function csvCell(v){ const s=String(v==null?'':v); return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
async function exportCsv(){
  if(!S.cap.dl){ toast('Exportar está disponible al abrir la app desde Claude.'); return; }
  const lines=[CSVH.join(';')].concat(movsToRows().map(r=>r.map(csvCell).join(';')));
  try{ await S.cap.dl.save({filename:`ikigai-movimientos-${todayStr()}.csv`,data:'﻿'+lines.join('\r\n')}); toast('Archivo listo'); }
  catch(e){ if(e&&e.code!=='declined') toast('No se pudo exportar el archivo.'); }
}
function loadScript(src){ return new Promise((res,rej)=>{ if(window.XLSX) return res(); const s=document.createElement('script'); s.src=src; s.onload=()=>res(); s.onerror=()=>rej(new Error('load')); document.head.appendChild(s); }); }
async function exportXlsx(){
  if(!S.cap.dl){ toast('Exportar está disponible al abrir la app desde Claude.'); return; }
  toast('Preparando el Excel…');
  try{ await loadScript('ikigai/vendor/xlsx.full.min.js'); }catch(e){ toast('No cargó el generador de Excel. Usa Exportar CSV.'); return; }
  const X=window.XLSX, wb=X.utils.book_new();
  const mv=X.utils.aoa_to_sheet([CSVH].concat(movsToRows())); mv['!cols']=[{wch:11},{wch:9},{wch:28},{wch:12},{wch:18},{wch:18},{wch:30},{wch:16}];
  X.utils.book_append_sheet(wb,mv,'Movimientos');
  const ks=[]; for(let k=firstMonth();k<=curMonth();k=addMonthsK(k,1)) ks.push(k);
  const c=S.cfg;
  const head=['mes','ingresos','gastos','ahorro','tasa de ahorro','cuotas/ingreso','saldo libre'].concat(c.bolsillos.flatMap(b=>[`${b.n} asignado`,`${b.n} usado`]));
  const rs=ks.map(k=>{const s=mStats(k);return [k,s.ing,s.gas,s.aho,s.tasaAho==null?'':+s.tasaAho.toFixed(4),s.endeu==null?'':+s.endeu.toFixed(4),s.libre].concat(c.bolsillos.flatMap(b=>[s.asig[b.id]||0,s.byB[b.id]||0]));});
  X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet([head].concat(rs)),'Resumen mensual');
  const catIds=c.cats.filter(x=>x.t==='g').map(x=>x.id);
  X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet([['categoria','bolsillo'].concat(ks)].concat(catIds.map(id=>[catName(id),bName(S.catMap[id].b)].concat(ks.map(k=>mStats(k).byCat[id]||0))))),'Categorías por mes');
  const out=X.write(wb,{bookType:'xlsx',type:'array'});
  try{ await S.cap.dl.save({filename:`ikigai-${todayStr()}.xlsx`,data:out}); toast('Excel listo'); }
  catch(e){ if(e&&e.code!=='declined') toast('No se pudo exportar el Excel.'); }
}
function parseCsv(text){
  text=String(text).replace(/^﻿/,'');
  const sep=(text.split('\n')[0].match(/;/g)||[]).length>=(text.split('\n')[0].match(/,/g)||[]).length?';':',';
  const rows=[]; let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){ const ch=text[i];
    if(q){ if(ch==='"'){ if(text[i+1]==='"'){ cell+='"'; i++; } else q=false; } else cell+=ch; }
    else if(ch==='"') q=true; else if(ch===sep){ row.push(cell); cell=''; } else if(ch==='\n'){ row.push(cell.replace(/\r$/,'')); rows.push(row); row=[]; cell=''; } else cell+=ch; }
  if(cell||row.length){ row.push(cell); rows.push(row); }
  return rows.filter(r=>r.some(x=>String(x).trim()));
}
function prepImport(text){
  const rows=parseCsv(text); if(!rows.length){ S.imp={ok:[],bad:0,other:0}; return; }
  const h=rows[0].map(x=>norm(x).trim()), idx=n=>h.indexOf(n);
  const iF=idx('fecha'),iT=idx('tipo'),iC=idx('categoria'),iM=idx('monto'),iP=idx('medio'),iS=idx('fuente'),iD=idx('descripcion');
  const ok=[]; let bad=0,other=0;
  const byName=(list,n)=>list.find(x=>norm(x.n)===norm(n));
  for(const r of rows.slice(1)){
    const f=String(r[iF]||'').trim(), tt=norm(r[iT]||'gasto'), m=parseMoney(r[iM]);
    if(!isYmd(f)||!(m>0)){ bad++; continue; }
    const t=tt.startsWith('ing')?'i':tt.startsWith('aho')?'a':'g';
    let c=null;
    if(t==='a'){ const mt=byName(S.cfg.metas,r[iC]||''); c=mt?mt.id:(S.cfg.metas[0]||{}).id; if(!mt) other++; }
    else { const ct=S.cfg.cats.find(x=>x.t===t&&norm(x.n)===norm(r[iC]||'')); if(ct) c=ct.id; else { other++; c=t==='i'?(catsFor('i')[0]||{}).id:(S.catMap.otros?'otros':(catsFor('g')[0]||{}).id); } }
    if(!c){ bad++; continue; }
    const md=byName(S.cfg.medios,r[iP]||''); const src=iS>=0?byName(S.cfg.metas,r[iS]||''):null;
    ok.push({f,t,c,m,p:md?md.id:null,src:src?src.id:'q',d:String(r[iD]||'').slice(0,140)});
  }
  S.imp={ok,bad,other};
}

/* ---------------- Delegación de eventos ---------------- */
const ACT={
  mprev(){ S.month=addMonthsK(S.month,-1); render(); },
  mnext(){ if(S.month<curMonth()){ S.month=addMonthsK(S.month,1); render(); } },
  regmode(el){ S.regMode=el.dataset.v; render(); },
  regtipo(el){ const amt=$('#amt'); if(amt) S.reg.m=parseMoney(amt.value); const dsc=$('#regDesc'); if(dsc) S.reg.d=dsc.value; S.reg.t=el.dataset.v; S.reg.c=null; S.reg.fx=null; S.reg.err=''; S.regAll=false; render(); },
  regall(){ const amt=$('#amt'); if(amt) S.reg.m=parseMoney(amt.value); S.regAll=!S.regAll; render(); },
  pick(el){ const k=el.dataset.k, v=el.dataset.v; S.reg[k]=v; S.reg.err=''; if(k==='c') S.reg.fx=null; const grp=el.closest('[data-group]'); for(const b of $$('[data-act="pick"][data-k="'+k+'"]',el.closest('form')||document)) b.setAttribute('aria-pressed',b.dataset.v===v?'true':'false'); if(k==='f'){ const di=$('#regDate'); if(di) di.value=v; } void grp; },
  k3(){ const a=$('#amt'); if(!a) return; const v=parseMoney(a.value)||0; const n=v?v*1000:1000; S.reg.m=n; a.value=fmtIn(n); a.focus(); },
  payfx(el){ if(canWrite()) payFijo(el.dataset.id); },
  edit(el){ openEdit(el.dataset.id); },
  sheetbg(el,e){ if(e.target===el){ S.edit=null; renderSheet(); } },
  sheetclose(){ S.edit=null; renderSheet(); },
  edtipo(el){ readEdit(); const E=S.edit; E.t=el.dataset.v; E.c=E.t===E.orig.t?E.orig.c:null; if(E.t==='a') E.c=(S.cfg.metas[0]||{}).id||null; else if(!E.c) E.c=(catsFor(E.t)[0]||{}).id||null; renderSheet(); },
  edsave(){ saveEdit(); },
  eddel(){ readEdit(); S.edit.confirm=true; renderSheet(); },
  edno(){ S.edit.confirm=false; renderSheet(); },
  async eddelok(){ const o=S.edit.orig; S.edit=null; renderSheet(); try{ await delMov(o); toast('Movimiento borrado'); }catch(e){ failSave(e); } },
  mic(){ const d=S.cap.dict; if(!d) return; if(S.dictState!=='idle'){ d.stop().catch(()=>{}); return; } const ta=$('#iaText'); if(ta) S.ia.text=ta.value; d.start().catch(e=>{ const c=e&&e.code; if(c==='not_granted') toast('Sin permiso para dictar. Puedes escribir o usar el micrófono del teclado.'); else if(c==='unavailable'){ S.cap.dict=null; render(); } else if(c&&c!=='stopped'&&c!=='dismissed') toast('No se pudo iniciar el dictado.'); }); },
  iaparse(){ if(!S.ia.parsing) runParse(); },
  iadel(el){ syncRows('ia'); S.ia.items.splice(+el.dataset.i,1); if(!S.ia.items.length) S.ia.items=null; render(); },
  iaclear(){ S.ia.items=null; S.ia.err=''; render(); },
  async iasave(){ syncRows('ia'); const list=(S.ia.items||[]).filter(x=>x.m>0&&x.c&&isYmd(x.f)); if(!list.length){ S.ia.err='No hay movimientos válidos para guardar.'; render(); return; } try{ const movs=await saveList(list,'ia'); S.ia.items=null; S.ia.err=''; render(); toast(`${movs.length} ${movs.length===1?'movimiento guardado':'movimientos guardados'}`,'Deshacer',()=>Promise.all(movs.map(delMov)).catch(failSave)); }catch(e){ failSave(e); } },
  tadd(){ syncRows('tabla'); for(let i=0;i<5;i++) S.tabla.push(blankRow()); render(); },
  tdel(el){ syncRows('tabla'); S.tabla.splice(+el.dataset.i,1); render(); },
  async tsave(){ syncRows('tabla'); const list=S.tabla.filter(x=>x.m>0&&x.c&&isYmd(x.f)); if(!list.length){ toast('Llena al menos una fila con categoría y monto.'); return; } try{ const movs=await saveList(list,'t'); S.tabla=[]; render(); toast(`${movs.length} ${movs.length===1?'movimiento guardado':'movimientos guardados'}`,'Deshacer',()=>Promise.all(movs.map(delMov)).catch(failSave)); }catch(e){ failSave(e); } },
  range(el){ S.anRange=+el.dataset.v; render(); },
  tbl(el){ S.tbl[el.dataset.id]=!S.tbl[el.dataset.id]; render(); },
  airun(){ if(S.cap.sample) runAI(); },
  ask(){ runAsk(); },
  askstop(){ if(askCtl) askCtl.abort(); },
  goai(){ setTimeout(()=>{ const s=$('#ia'); if(s) s.scrollIntoView({behavior:'smooth',block:'start'}); },60); },
  aportar(el){ S.reg=newReg({t:'a',c:el.dataset.id}); S.regMode='rapido'; S.focusAmt=true; location.hash='#registrar'; },
  usarmeta(el){ S.reg=newReg({t:'g',src:el.dataset.id}); S.regMode='rapido'; S.focusAmt=true; location.hash='#registrar'; },
  opensec(el){ S.openSec=el.dataset.sec; setTimeout(()=>{ S.openSec=null; const s=$('#sec-'+el.dataset.sec); if(s) s.scrollIntoView({block:'start'}); },80); },
  async updsaldo(el){ const id=el.dataset.id, inp=$('#sal_'+id); const v=parseMoney(inp&&inp.value); if(!(v>=0)||!inp||!inp.value.trim()){ toast('Escribe el saldo que muestra tu app.'); return; } const cfg=clone(S.cfg); const d=cfg.deudas.find(x=>x.id===id); if(!d) return; d.saldo=v; d.fs=todayStr(); try{ await saveCfg(cfg); render(); toast('Saldo actualizado'); }catch(e){ failSave(e); } },
  async setStart(){ const inp=$('#startAmt'); const v=parseMoney(inp&&inp.value); if(!inp||!inp.value.trim()){ toast('Escribe cuánto tienes disponible hoy.'); return; } const cfg=clone(S.cfg); cfg.arranque={f:todayStr(),saldo:v}; try{ await saveCfg(cfg); render(); toast('Punto de partida guardado'); }catch(e){ failSave(e); } },
  pfsel(el){ S.editPf=el.dataset.v; render(); },
  pfnew(){ const d=D(); const base=d.perfiles.find(p=>p.id===S.editPf)||d.perfiles[0]; const np={id:uid('f'),n:'Perfil nuevo',pct:clone(base.pct)}; d.perfiles.push(np); S.editPf=np.id; markDirty(); render(); },
  rowadd(el){ const d=D(), L=el.dataset.list, k=curMonth();
    const firstG=(d.cats.find(c=>c.t==='g'&&!c.arch)||{}).id;
    if(L==='perfilMes') d.perfilMes.push({desde:addMonthsK(k,1),p:d.perfiles[0].id});
    else if(L==='fijos') d.fijos.push({id:uid('fx'),n:'',c:firstG,m:0,q:1,desde:k,hasta:''});
    else if(L==='recs') d.recs.push({id:uid('r'),n:'',c:firstG,m:0,on:true});
    else if(L==='cats') d.cats.push(el.dataset.v==='i'?{id:uid('c'),n:'Nuevo ingreso',t:'i',base:false}:{id:uid('c'),n:'Nueva categoría',t:'g',b:d.bolsillos[0].id,fijo:false});
    else if(L==='metas') d.metas.push({id:uid('m'),n:'Nueva meta',b:(d.bolsillos.find(b=>b.k==='ahorro')||d.bolsillos[0]).id,obj:0,fecha:'',ini:0});
    else if(L==='deudas') d.deudas.push({id:uid('d'),n:'Nueva deuda',c:firstG,saldo:0,fs:todayStr(),tasa:0,cuota:0});
    else if(L==='medios') d.medios.push({id:uid('p'),n:'Nuevo medio'});
    markDirty(); render(); },
  rowdel(el){ const d=D(); const L=el.dataset.list; if(L==='perfilMes'&&d.perfilMes.length<=1){ toast('Debe quedar al menos un perfil asignado.'); return; } d[L].splice(+el.dataset.i,1); markDirty(); render(); },
  discard(){ S.draft=null; S.dirty=false; render(); },
  async savecfg(){ const d=D(); const errs=validateCfg(d); const se=$('#saveErr'); if(errs.length){ if(se) se.textContent=errs[0]; toast(errs[0]); return; } try{ S.dirty=false; const cfg=clone(d); S.draft=null; await saveCfg(cfg); render(); toast('Ajustes guardados'); }catch(e){ S.dirty=true; failSave(e); } },
  exportcsv(){ exportCsv(); },
  exportxlsx(){ exportXlsx(); },
  impcancel(){ S.imp=null; render(); },
  async impgo(){ const list=(S.imp&&S.imp.ok)||[]; if(!list.length) return; try{ const movs=list.map(x=>Object.assign({id:uid('m'),o:'imp',ts:Date.now()},x)); await putMovs(movs); S.imp=null; render(); toast(`${movs.length} movimientos importados`); }catch(e){ failSave(e); } }
};
function markDirty(){ S.dirty=true; const b=$('#saveBar'); if(b) b.hidden=false; }
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-act]'); if(!a) return;
  const fn=ACT[a.dataset.act]; if(!fn) return;
  if(a.tagName==='A'&&a.dataset.act!=='opensec'&&a.dataset.act!=='goai') e.preventDefault();
  fn(a,e);
});
document.addEventListener('submit',e=>{ if(e.target.matches('[data-form="rapido"]')){ e.preventDefault(); if(canWrite()) saveRapido(); } });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&S.edit){ S.edit=null; renderSheet(); } if(e.key==='Enter'&&e.target&&e.target.id==='askq'){ e.preventDefault(); runAsk(); } });
document.addEventListener('input',e=>{
  const el=e.target;
  if(el.dataset&&el.dataset.money){ const pos=el.value.length-el.selectionEnd; const v=parseMoney(el.value); el.value=fmtIn(v); try{ const np=Math.max(0,el.value.length-pos); el.setSelectionRange(np,np); }catch(_){} if(el.dataset.money==='reg') S.reg.m=v; }
  if(el.id==='regDesc') S.reg.d=el.value;
  if(el.id==='iaText') S.ia.text=el.value;
  if(el.id==='askq') S.ask.q=el.value;
  if(el.id==='mq'){ S.movF.q=el.value; clearTimeout(S.mqT); S.mqT=setTimeout(()=>{ const pos=el.selectionStart; render(); const n=$('#mq'); if(n){ n.focus(); try{ n.setSelectionRange(pos,pos); }catch(_){} } },250); }
  if(el.id==='abX'){ S.abono.x=parseMoney(el.value); const d=S.cfg.deudas.find(x=>x.id===S.abono.d)||S.cfg.deudas[0]; const o=$('#abOut'); if(o&&d) o.innerHTML=simHtml(d,simAbono(d,S.abono.x)); }
  if(el.dataset&&el.dataset.k&&S.view==='ajustes') bindCfg(el);
});
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.id==='regDate'){ if(isYmd(el.value)){ S.reg.f=el.value; for(const b of $$('[data-act="pick"][data-k="f"]')) b.setAttribute('aria-pressed',b.dataset.v===el.value?'true':'false'); } }
  if(el.id==='mt'){ S.movF.t=el.value; render(); }
  if(el.id==='mb'){ S.movF.b=el.value; render(); }
  if(el.id==='abD'){ S.abono.d=el.value; render(); }
  if(el.id==='impFile'&&el.files&&el.files[0]){ const fr=new FileReader(); fr.onload=()=>{ prepImport(fr.result); render(); }; fr.readAsText(el.files[0]); }
  if(el.dataset&&el.dataset.f&&el.closest('[data-list]')){ const L=el.closest('[data-list]').dataset.list; if(el.dataset.f==='t'){ syncRows(L); const arr=L==='ia'?S.ia.items:S.tabla; const x=arr[+el.closest('[data-list]').dataset.row]; if(x){ x.c=x.t==='a'?((S.cfg.metas.find(m=>!m.arch)||{}).id||''):''; } render(); } }
  if(el.dataset&&el.dataset.k&&S.view==='ajustes'){ bindCfg(el); if(el.tagName==='SELECT'||el.type==='checkbox'||el.type==='month') render(); }
});
function bindCfg(el){
  const d=D(), path=el.dataset.k, ty=el.dataset.type;
  let v=el.type==='checkbox'?el.checked:el.value;
  if(ty==='money') v=parseMoney(v); else if(ty==='money-null') v=String(el.value).trim()===''?null:parseMoney(v);
  else if(ty==='int') v=parseInt(v,10)||0; else if(ty==='num'||ty==='pct') v=parseFloat(String(v).replace(',','.'))||0;
  if(ty==='pct') v=clamp(Math.round(v*10)/10,0,100);
  setPath(d,path,v); markDirty();
  if(ty==='pct'){
    for(const o of $$(`[data-k="${path}"]`)) if(o!==el) o.value=v;
    const pf=d.perfiles.find(p=>p.id===S.editPf)||d.perfiles[0];
    const tot=sum(d.bolsillos.map(b=>+pf.pct[b.id]||0)), t=$('#pfTotal');
    if(t){ t.className='total '+(Math.abs(tot-100)<0.01?'ok':'bad'); t.lastElementChild.textContent=`${tot.toLocaleString('es-CO')}%${Math.abs(tot-100)<0.01?'':` · ${tot>100?'sobra':'falta'} ${Math.abs(100-tot).toLocaleString('es-CO',{maximumFractionDigits:1})}%`}`; }
    const bid=path.split('.').pop(), pv=$(`[data-prev="${bid}"]`); if(pv) pv.textContent=pctPreview(v,d);
  }
  if(path.startsWith('pagos.')){ const pf=d.perfiles.find(p=>p.id===S.editPf)||d.perfiles[0]; for(const b of d.bolsillos){ const pv=$(`[data-prev="${b.id}"]`); if(pv) pv.textContent=pctPreview(+pf.pct[b.id]||0,d); } }
}

window.QZ={S,EXT,render,scheduleRender,route,buildShell,setSync,enqueue,withRetry,toast:(typeof toast==='function'?toast:function(){}),ic,esc,IC,metaStats,money};
/* ---------------- Inicio de la app ---------------- */
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
