/* Entreno: módulo de rutina dentro de Quincena.
   Se registra en window.QZ.EXT (vistas + navegación) y guarda en la misma base de datos:
   fit/main (fecha de inicio, tests, medidas) y fitlog/<AAAA-MM-DD> (registro de cada día). */
(function(){
'use strict';
const QZ=window.QZ;
if(!QZ||!QZ.EXT||!QZ.S) return;
const S=QZ.S, EXT=QZ.EXT, IC=QZ.IC||{};
const esc=QZ.esc||(s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

/* ---------------- fechas ---------------- */
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pd=s=>{const a=String(s).split('-').map(Number);return new Date(a[0],(a[1]||1)-1,a[2]||1);};
const today=()=>ymd(new Date());
const addDays=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return ymd(d);};
const diffDays=(a,b)=>Math.round((pd(b)-pd(a))/864e5);
const isYmd=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))&&!isNaN(pd(s));
const MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESC=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DIA=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const DIAC=['dom','lun','mar','mié','jue','vie','sáb'];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const fmtLong=s=>{const d=pd(s);return `${DIA[d.getDay()]} ${d.getDate()} de ${MES[d.getMonth()]}`;};
const fmtShort=s=>{const d=pd(s);return `${DIAC[d.getDay()]} ${d.getDate()} ${MESC[d.getMonth()]}`;};
const num=v=>{if(v==null||String(v).trim()==='') return null;const n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:null;};
const fmtN=(n,d)=>n==null?'—':n.toLocaleString('es-CO',{maximumFractionDigits:d==null?1:d});
const DEF_START='2026-11-23';
const DAYS=56;

/* ---------------- íconos ---------------- */
const FIC={
  fit:'<svg viewBox="0 0 24 24"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/></svg>',
  fin:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10.5h18M15.5 15h2.5"/></svg>',
  hoy:'<svg viewBox="0 0 24 24"><path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/></svg>',
  cal:'<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  plan:'<svg viewBox="0 0 24 24"><rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7M8.5 18h4"/></svg>',
  prog:'<svg viewBox="0 0 24 24"><path d="M3 20h18M6 16v-5M11 16V6M16 16v-8M21 16v-3"/></svg>',
  food:'<svg viewBox="0 0 24 24"><path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0zM8 21h8M9.5 7.5c0-1.5 1-2 1-3.5M13.5 7.5c0-1.5 1-2 1-3.5"/></svg>',
  gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>',
  ok:'<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
  l:'<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',
  r:'<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>'
};
const fic=(n,cls)=>`<span class="ic${cls?' '+cls:''}" aria-hidden="true">${FIC[n]||IC[n]||''}</span>`;

/* =========================================================
   El programa: 8 semanas
   ========================================================= */
const TAG={barra:'BARRA',paral:'PARALELAS',manc:'MANCUERNA',ext:'BARRA + DISCOS',suelo:'SUELO',cuerpo:'CUERPO'};

const SES={
  A:{n:'Empuje + pierna',hora:'5:05 am',dur:'40–45 min',c:'var(--s2)',wu:'am',cd:'A',blocks:[
    {t:'Isométricos de tendón',note:'Superserie: uno y luego el otro, 30 s de pausa entre ellos. Esfuerzo 7/10, sin llegar a temblar.',items:[
      {id:'a1',n:'Sentadilla isométrica en pared',tag:'cuerpo',f1:{s:3,r:'30 s'},f2:{s:3,r:'45 s'},tip:'Muslos paralelos al suelo, espalda pegada a la pared, peso en los talones.'},
      {id:'a2',n:'Soporte arriba en paralelas',tag:'paral',f1:{s:3,r:'20 s'},f2:{s:3,r:'30 s'},tip:'Brazos bloqueados, hombros lejos de las orejas, cuerpo quieto.'}]},
    {t:'Bloque 1 · fuerza',note:'Superserie: fondos, búlgaras y 75 s de pausa.',items:[
      {id:'a3',n:'Fondos en paralelas',tag:'paral',main:1,f1:{s:3,r:'6–8',v:'Tempo 3-1-1: bajas en 3 s'},f2:{s:4,r:'5–6',v:'Con lastre de 4–6 kg en la mochila'},tip:'Bajas hasta que el codo quede a 90°, pecho un poco adelante, hombros abajo.'},
      {id:'a4',n:'Sentadilla búlgara',tag:'manc',main:1,f1:{s:3,r:'8–10 c/pierna',v:'2 mancuernas de 5,5–7 kg'},f2:{s:3,r:'6–8 c/pierna',v:'2 mancuernas de 10 kg, tempo 3-1-1'},tip:'Pie de atrás sobre la cama o una silla. La rodilla de adelante sigue la punta del pie.'}]},
    {t:'Bloque 2 · fuerza',note:'Superserie: flexiones, peso muerto y 60 s de pausa.',items:[
      {id:'a5',n:'Flexiones',tag:'cuerpo',f1:{s:3,r:'7–9',v:'Pausa de 1 s abajo'},f2:{s:3,r:'8–10',v:'Declinadas: pies sobre una silla'},tip:'Cuerpo recto de talón a cabeza, codos a 45° del tronco.'},
      {id:'a6',n:'Peso muerto rumano a una pierna',tag:'manc',f1:{s:3,r:'8 c/pierna',v:'1 mancuerna de ~7 kg en la mano contraria'},f2:{s:3,r:'10 c/pierna',v:'1 mancuerna de 10 kg, bajas en 3 s'},tip:'Cadera hacia atrás y espalda neutra. Trabaja isquios y equilibrio.'}]},
    {t:'Hombro y tendón de Aquiles',note:'60 s de pausa.',items:[
      {id:'a7',n:'Flexiones en V (pike)',tag:'cuerpo',f1:{s:3,r:'6–8'},f2:{s:3,r:'6–8',v:'Pies elevados en una silla'},tip:'Cadera arriba; la cabeza baja entre las manos formando un triángulo. Es la base de la parada de manos.'},
      {id:'a8',n:'Elevación de talón a una pierna',tag:'cuerpo',f1:{s:2,r:'12–15 c/lado',v:'Tempo 2-2-2'},f2:{s:3,r:'15 c/lado',v:'Con 1 mancuerna'},tip:'En el borde de un escalón si puedes: sube en 2 s, sostén 2 s, baja en 2 s.'}]}
  ]},
  B:{n:'Tracción + core',hora:'5:05 am',dur:'40–45 min',c:'var(--s1)',wu:'am',cd:'B',blocks:[
    {t:'Isométricos de tendón',note:'Superserie, 30 s de pausa entre ejercicios.',items:[
      {id:'b1',n:'Colgado activo de la barra',tag:'barra',f1:{s:3,r:'30 s'},f2:{s:3,r:'45 s'},tip:'Agarre prono, escápulas hacia abajo, como sacando pecho.'},
      {id:'b2',n:'Sostén arriba en dominada supina',tag:'barra',f1:{s:3,r:'10 s'},f2:{s:3,r:'15–20 s'},tip:'Barbilla sobre la barra y codos pegados. Sube con un salto si hace falta.'}]},
    {t:'Bloque 1 · meta: dominada prona',note:'Superserie: dominada prona, hollow y 90 s de pausa.',items:[
      {id:'b3',n:'Dominada prona (palmas al frente)',tag:'barra',main:1,f1:{s:4,r:'3 negativas de 5 s',v:'Subes con salto o desde una silla y bajas lento'},f2:{s:4,r:'1–3 reps + 2 negativas'},tip:'Agarre al ancho de los hombros, no abierto. Es la meta del bloque.'},
      {id:'b4',n:'Hollow body',tag:'suelo',f1:{s:3,r:'20–30 s'},f2:{s:3,r:'40 s',v:'Brazos estirados sobre la cabeza'},tip:'Lumbar pegada al suelo. Exhala y activa suave el suelo pélvico.'}]},
    {t:'Bloque 2 · fuerza',note:'Superserie: dominadas, remo y 75 s de pausa.',items:[
      {id:'b5',n:'Dominadas supinas',tag:'barra',main:1,f1:{s:3,r:'8–10',v:'Tempo 3-1-1 con pausa de 1 s arriba'},f2:{s:4,r:'5–7',v:'Con lastre de 4–6 kg'},tip:'Desde brazos totalmente estirados, sin balanceo.'},
      {id:'b6',n:'Remo con barra',tag:'ext',f1:{s:3,r:'10–12',v:'Barra con extensor (~20 kg), pausa de 1 s arriba'},f2:{s:3,r:'8–10',v:'Bajas en 3 s'},tip:'Torso a 45°, espalda neutra; lleva la barra al ombligo.'}]},
    {t:'Bloque 3 · postura y core',note:'Superserie, 45 s de pausa.',items:[
      {id:'b7',n:'Pájaros (aperturas invertidas)',tag:'manc',f1:{s:2,r:'12–15',v:'Mancuernas livianas (~3 kg)'},f2:{s:3,r:'12–15',v:'~4,5 kg'},tip:'Torso inclinado y codos suaves; aprieta entre las escápulas. Hombros sanos y buena postura.'},
      {id:'b8',n:'Dead bug con exhalación',tag:'suelo',f1:{s:2,r:'8 c/lado'},f2:{s:3,r:'10 c/lado'},tip:'Exhala largo mientras estiras brazo y pierna contrarios; contrae suave el suelo pélvico.'}]},
    {t:'Cierre',note:'',items:[
      {id:'b9',n:'Puente de glúteo con suelo pélvico',tag:'suelo',f1:{s:2,r:'12',v:'Sostén 3 s arriba'},f2:{s:2,r:'8 c/pierna',v:'A una pierna'},tip:'Subes exhalando y contrayendo el suelo pélvico; bajas soltándolo por completo.'}]}
  ]},
  C:{n:'Potencia + intervalos',hora:'5:05 am',dur:'40–45 min',c:'var(--s4)',ci:'#231800',wu:'amj',cd:'C',blocks:[
    {t:'Isométricos de tendón',note:'Superserie, 30 s de pausa.',items:[
      {id:'c1',n:'Talón elevado sostenido a una pierna',tag:'cuerpo',f1:{s:3,r:'30 s c/lado'},f2:{s:3,r:'45 s c/lado'},tip:'Talón arriba a media altura. Protege el tendón de Aquiles para trotar.'},
      {id:'c2',n:'Plancha lateral',tag:'suelo',f1:{s:2,r:'25 s c/lado'},f2:{s:2,r:'40 s c/lado'},tip:'Cadera alta y cuerpo en línea recta.'}]},
    {t:'Potencia · empuje y salto',note:'Cada rep a máxima velocidad y sin fatiga. Superserie, 75 s de pausa.',items:[
      {id:'c3',n:'Flexiones explosivas',tag:'cuerpo',main:1,f1:{s:4,r:'4–5',v:'Las manos despegan del suelo'},f2:{s:4,r:'5',v:'Con palmada'},tip:'Bajas controlado y subes lo más rápido posible. Si se vuelven lentas, para.'},
      {id:'c4',n:'Sentadilla con salto',tag:'cuerpo',main:1,f1:{s:4,r:'5'},f2:{s:4,r:'5',v:'Con 2 mancuernas de ~3 kg'},tip:'Aterriza suave y en silencio, rodillas hacia afuera.'}]},
    {t:'Potencia · tracción y cadera',note:'Superserie, 75 s de pausa.',items:[
      {id:'c5',n:'Dominada supina explosiva',tag:'barra',f1:{s:3,r:'4'},f2:{s:4,r:'4'},tip:'Intenta llevar el pecho a la barra en cada rep; bajas controlado.'},
      {id:'c6',n:'Swing con mancuerna',tag:'manc',f1:{s:3,r:'15',v:'1 mancuerna de ~10 kg'},f2:{s:3,r:'20'},tip:'El impulso sale del glúteo, no de los brazos. Revisa que los seguros estén apretados.'}]},
    {t:'Intervalos sin cuerda',note:'Circuito en bucle: rodillas altas, escaladores, saltos laterales (skaters) y burpee sin flexión. Cabe en 2 × 2 m.',items:[
      {id:'c7',n:'Intervalos en el sitio',tag:'cuerpo',unit:'rondas',f1:{s:6,r:'30 s de trabajo, 30 s de pausa'},f2:{s:8,r:'40 s de trabajo, 20 s de pausa'},tip:'Intensidad 8/10: hablar cuesta. Cambia de ejercicio en cada ronda.'}]}
  ]},
  D:{n:'Habilidades + fuerza',hora:'En la mañana',dur:'~60 min',c:'var(--s5)',wu:'we',cd:'D',blocks:[
    {t:'Habilidades',note:'Calidad antes que tiempo. 60 s de pausa.',items:[
      {id:'d1',n:'Parada de manos contra la pared',tag:'cuerpo',f1:{s:5,r:'15–20 s',v:'Pecho a la pared, subiendo con los pies'},f2:{s:5,r:'30–40 s',v:'Más vertical, con toques de hombro asistidos'},tip:'Abdomen y glúteo apretados, empuja el suelo. Bajas caminando con las manos.'},
      {id:'d2',n:'L-sit en paralelas',tag:'paral',f1:{s:5,r:'10 s',v:'Recogido: rodillas al pecho'},f2:{s:5,r:'10–15 s',v:'Una pierna estirada, alternando'},tip:'Brazos bloqueados, hombros abajo. Exhala.'}]},
    {t:'Fuerza A',note:'Superserie, 90 s de pausa.',items:[
      {id:'d3',n:'Dominada prona',tag:'barra',main:1,f1:{s:5,r:'1–2',v:'Si aún no sale: negativa de 5 s'},f2:{s:5,r:'2–3'},tip:'Agarre al ancho de los hombros. Rep perfecta o negativa, nunca a medias.'},
      {id:'d4',n:'Sentadilla a una pierna a la silla',tag:'cuerpo',main:1,f1:{s:3,r:'5–6 c/pierna',v:'Silla alta, bajas en 3 s'},f2:{s:3,r:'5 c/pierna',v:'Superficie más baja o 1 mancuerna al frente'},tip:'Progresión a pistol: te sientas controlado y te levantas sin impulso.'}]},
    {t:'Fuerza B',note:'Superserie, 75 s de pausa.',items:[
      {id:'d5',n:'Fondos en paralelas',tag:'paral',f1:{s:3,r:'8–10'},f2:{s:4,r:'6–8',v:'Con lastre de 4–6 kg'},tip:'Rango completo, sin rebotar abajo.'},
      {id:'d6',n:'Remo unilateral con mancuerna',tag:'manc',f1:{s:3,r:'10–12 c/lado',v:'Mancuerna cargada (~10 kg)'},f2:{s:3,r:'12–15 c/lado',v:'Pausa de 1 s arriba'},tip:'Mano y rodilla sobre la cama; lleva el codo hacia la cadera.'}]},
    {t:'Fuerza C',note:'Superserie, 60 s de pausa.',items:[
      {id:'d7',n:'Flexiones arqueras',tag:'cuerpo',f1:{s:3,r:'4–5 c/lado',v:'Brazo de apoyo semiflexionado'},f2:{s:3,r:'5–6 c/lado'},tip:'El peso va a un brazo; el otro solo ayuda.'},
      {id:'d8',n:'Plancha Copenhague',tag:'suelo',f1:{s:3,r:'15 s c/lado',v:'Rodilla apoyada en la cama o una silla'},f2:{s:3,r:'20–25 s c/lado',v:'Pie apoyado'},tip:'Aductores fuertes protegen la ingle y las rodillas al correr.'}]},
    {t:'Acondicionamiento',note:'Anota las rondas en la nota del día.',items:[
      {id:'d9',n:'AMRAP: 5 dominadas supinas + 10 flexiones + 15 sentadillas',tag:'cuerpo',unit:'min',f1:{s:6,r:'máximo de rondas'},f2:{s:8,r:'máximo de rondas'},tip:'Ritmo constante de principio a fin.'}]}
  ]},
  E:{n:'Trote + movilidad',hora:'En la mañana',dur:'45–75 min',c:'var(--s3)',run:true,cd:'E'},
  T:{n:'Test',hora:'',dur:'~40 min',c:'var(--accent)',ci:'var(--accent-ink)',wu:'we',test:true,cd:'T'},
  R:{n:'Descanso activo',hora:'Cuando quieras',dur:'10–15 min',c:'var(--muted)',rest:true},
  X:{n:'Descanso total',hora:'',dur:'Duermes hasta las 5:40',c:'var(--muted)',rest:true}
};
const LT={A:'A',B:'B',C:'C',D:'D',E:'E',T:'T',R:'m',X:'·'};
const DOW={1:'A',2:'B',3:'R',4:'C',5:'X',6:'D',0:'E'};
const TRAIN={A:1,B:1,C:1,D:1,E:1,T:1};

const RUN={1:{min:30,str:0,test:'t1'},2:{min:35,str:4},3:{min:40,str:4},4:{min:30,str:0},5:{min:45,str:6},6:{min:50,str:6},7:{min:55,str:6},8:{min:30,str:0,test:'t8'}};

const TESTS=[
  {k:'pull',n:'Dominada prona',u:'reps',how:'Palmas al frente, agarre al ancho de hombros. 0 también es un dato.'},
  {k:'chin',n:'Dominadas supinas',u:'reps',how:'Desde brazos totalmente estirados hasta barbilla sobre la barra, sin balanceo.'},
  {k:'dips',n:'Fondos en paralelas',u:'reps',how:'Codo a 90° abajo, brazos bloqueados arriba.'},
  {k:'push',n:'Flexiones',u:'reps',how:'Pecho a un puño del suelo, cuerpo recto.'},
  {k:'lsit',n:'L-sit recogido',u:'s',how:'En paralelas, rodillas al pecho, brazos bloqueados.'},
  {k:'hollow',n:'Hollow body',u:'s',how:'Se acaba cuando la lumbar se despega del suelo.'},
  {k:'wall',n:'Sentadilla en pared',u:'s',how:'Muslos paralelos al suelo.'},
  {k:'hang',n:'Colgado de la barra',u:'s',how:'Agarre prono, brazos estirados.'},
  {k:'run30',n:'Trote de 30 min (domingo)',u:'km',how:'Al ritmo más rápido que puedas sostener parejo.'}
];

const WU_AM=[['Círculos de cuello, hombros, muñecas y cadera','1 min'],['Gato-camello','8 lentos'],['Sentadilla profunda sostenida, rodillas hacia afuera','30 s'],['Estocada con rotación de tronco','4 por lado'],['Retracciones de escápula colgado de la barra','8'],['Flexiones escapulares','8'],['Jumping jacks o skips en el sitio','45 s']];
const WU_LAST=['Una serie fácil del primer ejercicio','al 50 %'];
const WU_EXTRA={am:[],amj:[['Saltos suaves en el sitio','2 × 5']],we:[['Muñecas: balanceo en cuadrupedia y círculos','10 + 10'],['Saltos suaves en el sitio','2 × 5']]};
const WU_MIN={am:'7 min',amj:'8 min',we:'10 min'};
const wuList=k=>WU_AM.concat(WU_EXTRA[k]||[],[WU_LAST]);

const STRETCH={pecho:['Pecho en la pared','30 s c/lado'],tri:['Tríceps sobre la cabeza','30 s c/lado'],dorsal:['Colgado relajado de la barra','30 s'],bic:['Bíceps con el brazo estirado en la pared','30 s c/lado'],cuadri:['Cuádriceps de pie','30 s c/lado'],flexor:['Flexor de cadera en estocada baja','30 s c/lado'],isquio:['Isquiotibiales sentado','40 s c/lado'],gemelo:['Gemelo en la pared','30 s c/lado'],mariposa:['Mariposa (aductores)','45 s'],cobra:['Cobra','3 × 20 s'],child:['Postura del niño','60 s']};
const CD={A:['pecho','tri','cuadri','flexor','child'],B:['dorsal','bic','cobra','child'],C:['cuadri','isquio','gemelo','child'],D:['pecho','dorsal','isquio','mariposa','cobra','child'],E:['cuadri','flexor','isquio','gemelo','mariposa','cobra','child'],T:['pecho','dorsal','cuadri','isquio','child']};
const MOB=[['Rotaciones de cadera de pie','10 c/lado'],['Círculos de hombros','10 + 10'],['Estocada profunda con rotación','5 c/lado'],['Cadera 90/90, cambiando de lado','8 cambios'],['Gato-camello','10'],['Colgado relajado de la barra','30 s'],['Caminata (opcional)','20–30 min']];

function phase(w){
  if(w<=3) return {k:'f1',name:'Base',rpe:'Esfuerzo 7/10: terminas cada serie con 2–3 reps de reserva.',down:false};
  if(w===4) return {k:'f1',name:'Descarga',rpe:'Esfuerzo 6/10.',down:true};
  if(w<=7) return {k:'f2',name:'Intensificación',rpe:'Esfuerzo 8/10: terminas con 1–2 reps de reserva.',down:false};
  return {k:'f2',name:'Cierre',rpe:'Esfuerzo 7/10, sin llegar al fallo.',down:true};
}
const WNOTE={
  1:'Semana de técnica. El lunes es el test inicial: anota todo y queda guardado en Progreso. El domingo, test de trote.',
  2:'Misma rutina. Busca el tope de cada rango con técnica limpia.',
  3:'Suma 1 serie en los ejercicios marcados con ★.',
  4:'Descarga: 1 serie menos en todo y esfuerzo 6/10. Aquí se consolidan los tendones.',
  5:'Fase 2: variantes más difíciles y lastre.',
  6:'Si la semana pasada completaste el rango, sube reps o lastre.',
  7:'La semana más exigente del bloque.',
  8:'Cierre: 1 serie menos de lunes a jueves. Sábado, test final; domingo, test de trote.'
};
function rx(ex,w){
  const ph=phase(w), p=ex[ph.k]||ex.f1;
  let s=p.s;
  if(w===3&&ex.main) s+=1;
  if(ph.down) s=Math.max(2,s-1);
  return {s,r:p.r,v:p.v||''};
}
function kegelFor(w){
  if(w<=2) return {pos:'Acostado boca arriba, rodillas dobladas',lento:'2 × 10 contracciones de 3 s, soltando 3 s',rap:'10 rápidas (1 s apretar, 1 s soltar)'};
  if(w<=4) return {pos:'Sentado, espalda recta',lento:'2 × 10 contracciones de 5 s, soltando 5 s',rap:'10 rápidas'};
  return {pos:'De pie, y también durante el puente y el dead bug',lento:'2 × 10 contracciones de 8 s, soltando 8 s',rap:'15 rápidas'};
}
const KEGEL_HOW=[
  'Identifica el músculo: es el que usas para retener un gas o cortar la orina. Corta la orina una sola vez para reconocerlo; no lo uses como ejercicio.',
  'Respira normal. No aprietes glúteos, abdomen ni muslos.',
  'Suelta por completo entre repeticiones: relajar importa tanto como contraer.',
  'Al final, 5 respiraciones profundas dejando que el suelo pélvico se relaje.',
  'Si sientes dolor o molestia, para y consulta a un fisioterapeuta de suelo pélvico.'
];

/* =========================================================
   Estado y datos
   ========================================================= */
const F={ready:false,started:false,demo:false,err:null,slow:false,hasCfg:false,
  cfg:{inicio:DEF_START,tests:{t1:{},t8:{}},med:{}}, logs:{},
  day:null, keepDay:false, calM:null, calSel:null, plW:null, lastFit:'entreno', lastFin:'inicio'};
let dbRef=null;

function normCfg(c){
  c=c&&typeof c==='object'?JSON.parse(JSON.stringify(c)):{};
  if(!isYmd(c.inicio)) c.inicio=DEF_START;
  if(!c.tests||typeof c.tests!=='object') c.tests={};
  c.tests.t1=c.tests.t1||{}; c.tests.t8=c.tests.t8||{};
  if(!c.med||typeof c.med!=='object') c.med={};
  return c;
}
const entry=d=>F.logs[d]||null;

function ensureData(){
  if(F.started) return;
  if(S.mode==='demo'){ F.started=true; F.demo=true; seedDemo(); F.ready=true; return; }
  if(S.mode!=='live'||!S.cap||!S.cap.db) return;
  F.started=true; dbRef=S.cap.db;
  const got={cfg:false,log:false};
  const timer=setTimeout(()=>{ if(!F.ready){ F.slow=true; QZ.scheduleRender(); } },10000);
  const done=()=>{ if(got.cfg&&got.log&&!F.ready){ clearTimeout(timer); F.ready=true; F.slow=false; } QZ.scheduleRender(); };
  const onErr=e=>{ F.err=(e&&e.code)||'unavailable'; QZ.scheduleRender(); };
  try{
    dbRef.doc('fit/main').onSnapshot(snap=>{ got.cfg=true; if(snap.exists){ F.cfg=normCfg(snap.data()); F.hasCfg=true; } done(); },onErr);
    dbRef.collection('fitlog').onSnapshot(snap=>{ got.log=true; const L={}; for(const d of snap.docs){ const v=d.data(); if(v&&isYmd(d.id)) L[d.id]=v; } F.logs=L; done(); },onErr);
  }catch(e){ onErr(e); }
}
function fail(e){
  const code=e&&e.code;
  QZ.toast(code==='quota_exceeded'?'Se llenó el espacio de datos de la app.':'No se pudo guardar el entreno. Revisa tu conexión e intenta de nuevo.');
}
function saveDay(d,patch){
  const cur=Object.assign({},F.logs[d]||{},patch);
  for(const k of Object.keys(cur)) if(cur[k]===undefined||cur[k]===null||cur[k]==='') delete cur[k];
  const p=planFor(d); if(p) cur.s=p.s;
  cur.ts=Date.now();
  F.logs[d]=cur;
  QZ.scheduleRender();
  if(F.demo||!dbRef) return;
  const path='fitlog/'+d, snap=JSON.parse(JSON.stringify(cur));
  QZ.enqueue(path,()=>QZ.withRetry(()=>dbRef.doc(path).set(snap))).catch(fail);
}
function saveCfg(){
  QZ.scheduleRender();
  if(F.demo||!dbRef) return;
  const snap=JSON.parse(JSON.stringify(F.cfg));
  QZ.enqueue('fit/main',()=>QZ.withRetry(()=>dbRef.doc('fit/main').set(snap))).catch(fail);
}
function setTest(key,metric,v){
  const t=Object.assign({},F.cfg.tests[key]||{});
  if(v==null) delete t[metric]; else t[metric]=v;
  F.cfg.tests=Object.assign({},F.cfg.tests,{[key]:t});
  saveCfg();
}
function seedDemo(){
  const t=today(), dow=pd(t).getDay();
  F.cfg.inicio=addDays(t,-((dow+6)%7)-14);
  F.cfg.tests.t1={pull:0,chin:15,dips:10,push:12,lsit:8,hollow:30,wall:60,hang:50,run30:4.2};
  F.cfg.med={1:{kg:65,cm:78},2:{kg:64.8,cm:77.5}};
  let k=0;
  for(let i=0;i<DAYS;i++){
    const d=addDays(F.cfg.inicio,i); if(d>=t) break;
    const p=planFor(d); if(!p) continue; k++;
    const e={s:p.s,kg:k%5!==0};
    if(TRAIN[p.s]&&k%7!==3) e.st='ok';
    if(p.s==='E'&&e.st) Object.assign(e,{min:RUN[p.w].min,km:+(RUN[p.w].min/7.2).toFixed(2)});
    F.logs[d]=e;
  }
}

/* ---------------- cálculos ---------------- */
function startD(){ return F.cfg.inicio||DEF_START; }
function endD(){ return addDays(startD(),DAYS-1); }
function planFor(d){
  if(!isYmd(d)) return null;
  const n=diffDays(startD(),d); if(n<0||n>=DAYS) return null;
  const w=Math.floor(n/7)+1, dow=pd(d).getDay();
  let s=DOW[dow];
  if(n===0) s='T'; else if(w===8&&dow===6) s='T';
  return {s,w,n,ph:phase(w)};
}
function exIds(s){ const X=SES[s]; return X&&X.blocks?X.blocks.flatMap(b=>b.items.map(x=>x.id)):[]; }
function status(d,p,e){
  if(e===undefined) e=entry(d);
  if(e&&e.st==='ok') return 'ok';
  if(e&&(e.st==='part'||(e.ex&&Object.values(e.ex).some(Boolean)))) return 'part';
  if(p&&TRAIN[p.s]&&d<today()) return 'miss';
  return 'none';
}
function stats(){
  const t=today(), r={plan:0,score:0,ok:0,part:0,miss:0,weeks:{},km:0,runs:[],kg7:0,streak:0,cur:planFor(t)};
  for(let w=1;w<=8;w++) r.weeks[w]={p:0,s:0};
  const seq=[];
  for(let i=0;i<DAYS;i++){
    const d=addDays(startD(),i), p=planFor(d); if(!p) continue;
    const e=entry(d), st=status(d,p,e);
    if(e&&(num(e.km)!=null||num(e.min)!=null)&&p.s==='E') r.runs.push({d,km:num(e.km),min:num(e.min),w:p.w});
    if(e&&num(e.km)!=null) r.km+=num(e.km);
    if(!TRAIN[p.s]) continue;
    if(d>t||(d===t&&st!=='ok'&&st!=='part')) continue;
    r.plan++; r.weeks[p.w].p++;
    const sc=st==='ok'?1:st==='part'?0.5:0;
    r.score+=sc; r.weeks[p.w].s+=sc;
    if(st==='ok') r.ok++; else if(st==='part') r.part++; else r.miss++;
    seq.push(st);
  }
  for(let i=seq.length-1;i>=0;i--){ if(seq[i]==='ok'||seq[i]==='part') r.streak++; else break; }
  for(let i=0;i<7;i++){ const e=entry(addDays(t,-i)); if(e&&e.kg) r.kg7++; }
  r.pct=r.plan?r.score/r.plan:null;
  return r;
}
function pace(min,km){
  if(!(min>0)||!(km>0)) return '—';
  const m=min/km, mm=Math.floor(m), ss=Math.round((m-mm)*60);
  return ss===60?`${mm+1}:00 /km`:`${mm}:${pad(ss)} /km`;
}
function progMonths(){
  const out=[]; let k=startD().slice(0,7); const e=endD().slice(0,7);
  for(let i=0;i<6&&k<=e;i++){ out.push(k); const a=k.split('-').map(Number); const d=new Date(a[0],a[1],1); k=`${d.getFullYear()}-${pad(d.getMonth()+1)}`; }
  return out;
}

/* =========================================================
   Piezas de interfaz
   ========================================================= */
const pillFor=st=>st==='ok'?'<span class="pill good">Hecha</span>':st==='part'?'<span class="pill warn">En progreso</span>':st==='miss'?'<span class="pill crit">Sin registrar</span>':'<span class="pill neutral">Pendiente</span>';
const ltStyle=s=>`--c:${SES[s].c};--ci:${SES[s].ci||'#fff'}`;

function exRow(ex,w,ctx){
  const p=rx(ex,w), on=!!(ctx.e&&ctx.e.ex&&ctx.e.ex[ex.id]);
  const big=ex.unit==='rondas'?`${p.s} rondas`:ex.unit==='min'?`${p.s} min`:`${p.s} × ${esc(p.r)}`;
  const small=ex.unit?esc(p.r):'series';
  const chk=ctx.live?`<button type="button" class="en-chk" role="checkbox" aria-checked="${on}" aria-label="Hecho: ${esc(ex.n)}" data-fa="ex" data-d="${ctx.d}" data-id="${ex.id}">${FIC.ok}</button>`:'';
  return `<div class="en-ex${ctx.live?'':' ro'}${on?' done':''}">${chk}<div class="b"><div class="n">${ex.main?'<span class="en-star" title="Ejercicio principal">★</span> ':''}${esc(ex.n)}<span class="en-tag">${TAG[ex.tag]||''}</span></div>${p.v?`<div class="v">${esc(p.v)}</div>`:''}<div class="tip">${esc(ex.tip)}</div></div><div class="rx">${big}<small>${small}</small></div></div>`;
}
function listRows(list){ return list.map(([a,b])=>`<div class="en-li"><span>${esc(a)}</span><span>${esc(b)}</span></div>`).join(''); }
function wuBlock(k,open){
  return `<details class="en-blk en-fold"${open?' open':''}><summary><span>Calentamiento · ${WU_MIN[k]}</span><span class="muted small">Nada de estiramientos largos antes</span></summary><div class="en-fold-b">${listRows(wuList(k))}</div></details>`;
}
function cdBlock(s){
  const ids=CD[s]; if(!ids) return '';
  return `<details class="en-blk en-fold"><summary><span>Vuelta a la calma · ${s==='E'?'10–12':s==='D'?'5':'3'} min</span><span class="muted small">Estiramientos</span></summary><div class="en-fold-b">${listRows(ids.map(i=>STRETCH[i]))}</div></details>`;
}
function kegelBlock(w,ctx){
  const k=kegelFor(w), on=!!(ctx.e&&ctx.e.kg);
  const chk=ctx.live?`<button type="button" class="en-chk" role="checkbox" aria-checked="${on}" aria-label="Kegel hechos" data-fa="kg" data-d="${ctx.d}">${FIC.ok}</button>`:'';
  return `<div class="en-blk"><h3>Suelo pélvico · todos los días</h3><div class="en-ex${ctx.live?'':' ro'}${on?' done':''}">${chk}<div class="b"><div class="n">Kegel</div><div class="v">${esc(k.pos)}</div><div class="tip">${esc(k.lento)} + ${esc(k.rap)}. Suelta por completo entre repeticiones y termina con 5 respiraciones relajando.</div></div><div class="rx">4 min<small>cualquier hora</small></div></div></div>`;
}
function runBlock(w,ctx){
  const r=RUN[w], e=ctx.e||{};
  const rows=[['Calentamiento','5 min caminando rápido + skips, talones al glúteo y rodillas altas (2 × 20 m)']];
  if(r.test) rows.push(['Test',`30 min al ritmo más rápido que puedas sostener parejo. Anota los km${ctx.live?' abajo':''}: quedan en Progreso.${w===8?' Luego 10 min suaves.':''}`]);
  else rows.push(['Trote suave',`${r.min} min en zona 2: puedes hablar en frases completas.${w===4?' Semana de descarga.':''}`]);
  if(r.str) rows.push(['Progresivos',`${r.str} × 15–20 s acelerando hasta el 80 %, caminando 45 s entre cada uno.`]);
  rows.push(['Dónde','El domingo en la mañana, la Ciclovía o un parque.']);
  let h=`<div class="en-blk"><h3>${r.test?'Test de trote':'Trote'}</h3>${rows.map(([a,b])=>`<div class="en-ex ro"><div class="b"><div class="n">${esc(a)}</div><div class="tip">${esc(b)}</div></div><div class="rx">${a==='Trote suave'?`${r.min} min`:a==='Test'?'30 min':a==='Progresivos'?`${r.str} ×`:''}</div></div>`).join('')}`;
  if(ctx.live){
    const mn=num(e.min), km=num(e.km);
    h+=`<div class="en-inputs"><label class="f" for="en-min-${ctx.d}">Minutos<input class="in" id="en-min-${ctx.d}" type="number" inputmode="decimal" min="0" step="1" data-fi="min" data-d="${ctx.d}" value="${mn==null?'':mn}"></label><label class="f" for="en-km-${ctx.d}">Kilómetros<input class="in" id="en-km-${ctx.d}" type="number" inputmode="decimal" min="0" step="0.01" data-fi="km" data-d="${ctx.d}" value="${km==null?'':km}"></label><div class="en-pace"><span>Ritmo</span><b>${pace(mn,km)}</b></div></div>`;
  }
  return h+'</div>';
}
function testBlock(w,ctx){
  const key=w>=8?'t8':'t1', vals=F.cfg.tests[key]||{};
  const rows=TESTS.filter(t=>t.k!=='run30').map(t=>{
    const v=vals[t.k];
    const inp=ctx.live?`<input class="in en-num" id="en-t-${key}-${t.k}" aria-label="${esc(t.n)} (${t.u})" type="number" inputmode="decimal" min="0" step="1" data-ft="${key}.${t.k}" value="${v==null?'':v}">`:'';
    return `<div class="en-ex ro"><div class="b"><div class="n">${esc(t.n)}</div><div class="tip">${esc(t.how)}</div></div><div class="rx en-trx">${inp}<small>${t.u}</small></div></div>`;
  }).join('');
  return `<div class="en-blk"><h3>${key==='t1'?'Test inicial':'Test final'}</h3><p class="en-note">Máximo con técnica limpia en cada prueba y 3 min de pausa entre ellas. ${ctx.live?'Lo que anotes queda en Progreso.':''}</p>${rows}</div>`;
}
function restBlock(s,ctx){
  if(s==='X') return `<div class="en-blk"><p class="en-note">Hoy no entrenas: duermes hasta las 5:40 y el cuerpo se recupera. Solo los Kegel.</p></div>`;
  const on=!!(ctx.e&&ctx.e.mob);
  const chk=ctx.live?`<button type="button" class="en-chk" role="checkbox" aria-checked="${on}" aria-label="Movilidad hecha" data-fa="mob" data-d="${ctx.d}">${FIC.ok}</button>`:'';
  return `<div class="en-blk"><h3>Movilidad</h3><div class="en-ex${ctx.live?'':' ro'}${on?' done':''}">${chk}<div class="b"><div class="n">Rutina de movilidad</div><div class="tip">Suave, sin forzar. Ayuda a recuperar para el jueves.</div></div><div class="rx">10 min</div></div>${listRows(MOB)}</div>`;
}
function sesBody(s,w,ctx){
  const X=SES[s]; let h='';
  if(X.blocks){
    h+=wuBlock(X.wu,false);
    for(const b of X.blocks) h+=`<div class="en-blk"><h3>${esc(b.t)}</h3>${b.note?`<p class="en-note">${esc(b.note)}</p>`:''}${b.items.map(ex=>exRow(ex,w,ctx)).join('')}</div>`;
    h+=cdBlock(s);
  } else if(X.run){ h+=runBlock(w,ctx)+cdBlock('E'); }
  else if(X.test){ h+=wuBlock('we',false)+testBlock(w,ctx)+cdBlock('T'); }
  else if(X.rest){ h+=restBlock(s,ctx); }
  if(!ctx.plan) h+=kegelBlock(w,ctx);
  return h;
}
function sesHead(s,d,right){
  const X=SES[s]; let hora=X.hora;
  if(s==='T'&&d) hora=pd(d).getDay()===6?'En la mañana':'5:05 am';
  return `<div class="en-head" style="${ltStyle(s)}"><span class="en-badge">${LT[s]}</span><div class="t"><h2>${esc(X.n)}</h2><p class="small muted">${hora?esc(hora)+' · ':''}${esc(X.dur)}</p></div>${right||''}</div>`;
}
function sessionCard(d,p,e){
  const s=p.s, ctx={d,e,live:true,w:p.w}, st=status(d,p,e);
  const ids=exIds(s), nd=ids.filter(id=>e&&e.ex&&e.ex[id]).length;
  let pill='';
  if(TRAIN[s]) pill=st==='part'&&ids.length?`<span class="pill warn">En progreso · ${nd}/${ids.length}</span>`:pillFor(st);
  let h=`<section class="en-card" style="${ltStyle(s)}">${sesHead(s,d,pill)}${sesBody(s,p.w,ctx)}`;
  h+=`<div class="en-blk"><label class="f" for="en-nota-${d}">Nota del día<textarea class="in" id="en-nota-${d}" rows="2" maxlength="400" data-fi="nota" data-d="${d}" placeholder="Cómo te sentiste, rondas del AMRAP, molestias…">${esc((e&&e.nota)||'')}</textarea></label></div>`;
  if(TRAIN[s]) h+=`<div class="en-foot">${st==='ok'?`<button type="button" class="btn block" data-fa="st" data-d="${d}">Quitar la marca de hecha</button>`:`<button type="button" class="btn primary lg block" data-fa="st" data-d="${d}">${fic('ok')}Marcar sesión hecha</button>`}</div>`;
  return h+'</section>';
}
function weekStrip(d){
  const t=today(), mon=addDays(d,-((pd(d).getDay()+6)%7));
  let h='<div class="en-week" role="group" aria-label="Días de esta semana">';
  for(let i=0;i<7;i++){
    const x=addDays(mon,i), p=planFor(x), st=p?status(x,p):'none';
    const cls=['en-wd','st-'+st]; if(!p) cls.push('out'); else if(!TRAIN[p.s]) cls.push('rest'); if(x===t) cls.push('is-today');
    h+=`<button type="button" class="${cls.join(' ')}" aria-pressed="${x===d}" data-fa="day" data-d="${x}" aria-label="${esc(fmtLong(x))}${p?': '+esc(SES[p.s].n):''}"${p?` style="${ltStyle(p.s)}"`:''}><span class="dn">${DIAC[pd(x).getDay()]}</span><span class="dd">${pd(x).getDate()}</span><span class="en-lt">${p?LT[p.s]:'·'}</span></button>`;
  }
  return h+'</div>';
}
function gateHtml(){
  if(F.err) return `<div class="view"><div class="loading"><h2>No se pudo cargar el entreno</h2><p class="small">Error: ${esc(F.err)}. Recarga la página para intentar de nuevo.</p></div></div>`;
  if(!F.ready) return `<div class="view"><div class="loading"><span class="thinking"><i></i>Cargando tu entreno…</span>${F.slow?'<p class="small">El almacenamiento todavía no responde. Revisa tu conexión.</p>':''}</div></div>`;
  return '';
}
function tilesHtml(st){
  const pctTxt=st.pct==null?'—':Math.round(st.pct*100)+' %';
  return `<div class="tiles t4">
    <div class="tile"><span class="l">Cumplimiento</span><span class="v num">${pctTxt}</span><span class="d">${st.ok} hechas${st.part?` · ${st.part} a medias`:''} de ${st.plan}</span></div>
    <div class="tile"><span class="l">Racha</span><span class="v num">${st.streak}</span><span class="d">sesiones seguidas</span></div>
    <div class="tile"><span class="l">Kilómetros</span><span class="v num">${fmtN(st.km,1)}</span><span class="d">trotados en el bloque</span></div>
    <div class="tile"><span class="l">Kegel</span><span class="v num">${st.kg7}/7</span><span class="d">días de la última semana</span></div>
  </div>`;
}

/* =========================================================
   Vistas
   ========================================================= */
function vHoy(){
  const g=gateHtml(); if(g) return g;
  const t=today(), d=F.day||t, p=planFor(d), e=entry(d);
  const sub=p?`Semana ${p.w} de 8 · ${p.ph.name}`:(d<startD()?`El bloque arranca el ${fmtLong(startD())}`:'Terminaste las 8 semanas del bloque');
  let h=`<div class="view en en-narrow"><div class="view-head"><div><span class="eyebrow">${d===t?'Hoy · ':''}${esc(fmtShort(d))}</span><h1>${p?esc(SES[p.s].n):'Fuera del bloque'}</h1><p>${esc(sub)}</p></div>
    <div class="row"><button type="button" class="iconbtn" data-fa="dmove" data-n="-1" aria-label="Día anterior">${fic('l','sm')}</button>${d!==t?'<button type="button" class="btn sm" data-fa="dtoday">Ir a hoy</button>':''}<button type="button" class="iconbtn" data-fa="dmove" data-n="1" aria-label="Día siguiente">${fic('r','sm')}</button></div></div>`;
  h+=weekStrip(d);
  if(p){
    if(p.n%7===0||d===t) h+=`<div class="banner"><span class="ic sm" aria-hidden="true">${IC.info||''}</span><div><b>Semana ${p.w} · ${esc(p.ph.name)}.</b> ${esc(WNOTE[p.w])}</div></div>`;
    h+=sessionCard(d,p,e);
  } else if(d<startD()){
    h+=`<div class="panel stack"><h2>Arrancas el ${esc(fmtLong(startD()))}</h2><p class="ink2">El primer día es el test inicial. Mientras tanto puedes empezar con los Kegel y dormir temprano: en días de entreno te levantas a las 5:00.</p><div class="row"><button type="button" class="btn primary" data-fa="day" data-d="${startD()}">Ver el día 1</button><a class="btn" href="#e-plan">Ver el plan</a></div></div>`;
  } else {
    h+=`<div class="panel stack"><h2>Bloque terminado</h2><p class="ink2">Compara tu test inicial con el final en Progreso. Para cuando vuelvas a clases tienes el modo universidad de 3 días en el Plan.</p><div class="row"><a class="btn primary" href="#e-progreso">Ver progreso</a><a class="btn" href="#e-plan">Modo universidad</a></div></div>`;
  }
  return h+'</div>';
}

function vCal(){
  const g=gateHtml(); if(g) return g;
  const t=today(), months=progMonths();
  if(!F.calM||!months.includes(F.calM)) F.calM=months.includes(t.slice(0,7))?t.slice(0,7):months[0];
  if(!F.calSel) F.calSel=planFor(t)?t:startD();
  const st=stats(), k=F.calM, a=k.split('-').map(Number), D=new Date(a[0],a[1],0).getDate();
  const off=(pd(k+'-01').getDay()+6)%7, mi=months.indexOf(k);
  let grid=['L','M','X','J','V','S','D'].map(x=>`<span class="h" aria-hidden="true">${x}</span>`).join('');
  for(let i=0;i<off;i++) grid+='<span class="en-blank"></span>';
  for(let i=1;i<=D;i++){
    const d=`${k}-${pad(i)}`, p=planFor(d), e=entry(d), s=p?status(d,p,e):'none';
    const cls=['en-day','st-'+s]; if(!p) cls.push('out'); else if(!TRAIN[p.s]) cls.push('rest'); if(d===t) cls.push('today'); if(d===F.calSel) cls.push('sel');
    const lbl=`${fmtLong(d)}: ${p?SES[p.s].n+', '+({ok:'hecha',part:'a medias',miss:'sin registrar',none:TRAIN[p.s]?'pendiente':'descanso'}[s]):'fuera del bloque'}${e&&e.kg?', Kegel hechos':''}`;
    grid+=`<button type="button" class="${cls.join(' ')}" data-fa="cal" data-d="${d}" aria-pressed="${d===F.calSel}" aria-label="${esc(lbl)}"${p?` style="${ltStyle(p.s)}"`:''}><span class="dn">${i}</span><span class="en-lt">${p?LT[p.s]:''}</span>${e&&e.kg?'<i class="kg" aria-hidden="true"></i>':''}</button>`;
  }
  const legend=['A','B','C','D','E','T'].map(s=>`<span><span class="en-lt st-ok" style="${ltStyle(s)}">${LT[s]}</span>${esc(SES[s].n)}</span>`).join('')+`<span><span class="en-lt rest">m</span>Movilidad</span><span><i class="en-kgdot"></i>Kegel</span>`;
  return `<div class="view en"><div class="view-head"><div><span class="eyebrow">${esc(fmtShort(startD()))} – ${esc(fmtShort(endD()))}</span><h1>Calendario</h1><p>Toca un día para chulearlo o abrir la sesión.</p></div></div>
    ${tilesHtml(st)}
    <div class="en-calwrap">
      <section class="panel"><div class="panel-h"><h2 class="en-cap">${esc(MES[a[1]-1])} ${a[0]}</h2><div class="month"><button type="button" data-fa="calm" data-n="-1" aria-label="Mes anterior" ${mi<=0?'disabled':''}>${fic('l','sm')}</button><button type="button" data-fa="calm" data-n="1" aria-label="Mes siguiente" ${mi>=months.length-1?'disabled':''}>${fic('r','sm')}</button></div></div>
        <div class="en-cal">${grid}</div>
        <div class="en-legend">${legend}</div>
      </section>
      ${calDetail(F.calSel)}
    </div></div>`;
}
function calDetail(d){
  const p=planFor(d), e=entry(d);
  if(!p) return `<section class="panel stack"><span class="eyebrow">${esc(fmtLong(d))}</span><h2>Fuera del bloque</h2><p class="ink2">Este día no hace parte de las 8 semanas.</p></section>`;
  const s=p.s, st=status(d,p,e), on=!!(e&&e.kg), X=SES[s];
  let h=`<section class="panel en-det" style="${ltStyle(s)}"><div class="en-det-h"><span class="en-badge">${LT[s]}</span><div><span class="eyebrow">${esc(cap(fmtLong(d)))} · semana ${p.w}</span><h2>${esc(X.n)}</h2></div>${TRAIN[s]?pillFor(st):''}</div><div class="stack s8">`;
  if(TRAIN[s]) h+=`<button type="button" class="btn ${st==='ok'?'':'primary'} block" data-fa="st" data-d="${d}">${st==='ok'?'Quitar la marca de hecha':fic('ok')+'Marcar sesión hecha'}</button>`;
  else if(s==='R') h+=`<button type="button" class="btn block" data-fa="mob" data-d="${d}" aria-pressed="${!!(e&&e.mob)}">${e&&e.mob?'Movilidad hecha ✓':'Marcar movilidad hecha'}</button>`;
  h+=`<button type="button" class="en-toggle" role="checkbox" aria-checked="${on}" data-fa="kg" data-d="${d}"><span class="en-chk" aria-hidden="true">${FIC.ok}</span><span>Kegel del día</span></button>`;
  if(s==='E'){ const mn=num(e&&e.min), km=num(e&&e.km); h+=`<div class="en-inputs"><label class="f" for="en-cmin-${d}">Minutos<input class="in" id="en-cmin-${d}" type="number" inputmode="decimal" min="0" step="1" data-fi="min" data-d="${d}" value="${mn==null?'':mn}"></label><label class="f" for="en-ckm-${d}">Km<input class="in" id="en-ckm-${d}" type="number" inputmode="decimal" min="0" step="0.01" data-fi="km" data-d="${d}" value="${km==null?'':km}"></label><div class="en-pace"><span>Ritmo</span><b>${pace(mn,km)}</b></div></div>`; }
  h+=`<label class="f" for="en-cnota-${d}">Nota<textarea class="in" id="en-cnota-${d}" rows="2" maxlength="400" data-fi="nota" data-d="${d}">${esc((e&&e.nota)||'')}</textarea></label>`;
  h+=`<button type="button" class="btn ghost" data-fa="open" data-d="${d}">Abrir la sesión completa ${fic('r','sm')}</button></div></section>`;
  return h;
}

function vPlan(){
  const g=gateHtml(); if(g) return g;
  const cur=planFor(today());
  const w=F.plW||(cur?cur.w:1), ph=phase(w);
  const seg=Array.from({length:8},(_,i)=>`<button type="button" data-fa="plw" data-w="${i+1}" aria-pressed="${i+1===w}">${i+1}</button>`).join('');
  const days=Array.from({length:7},(_,i)=>addDays(startD(),(w-1)*7+i));
  const agenda=days.map(d=>{ const p=planFor(d); if(!p) return ''; const X=SES[p.s]; const hora=p.s==='T'?(pd(d).getDay()===6?'En la mañana':'5:05 am'):X.hora; return `<tr><td>${esc(fmtShort(d))}</td><td><span class="en-lt st-ok${TRAIN[p.s]?'':' rest'}" style="${ltStyle(p.s)}">${LT[p.s]}</span> ${esc(X.n)}</td><td>${esc(hora||'—')}</td><td class="r">${esc(X.dur)}</td></tr>`; }).join('');
  const uniq=[]; for(const d of days){ const p=planFor(d); if(p&&TRAIN[p.s]&&!uniq.includes(p.s)) uniq.push(p.s); }
  const secs=uniq.map(s=>`<details class="sec en-sec"><summary><span class="en-sum"><span class="en-lt st-ok" style="${ltStyle(s)}">${LT[s]}</span>${esc(SES[s].n)} <span class="sub">${esc(SES[s].dur)}</span></span></summary><div class="en-card en-flat" style="${ltStyle(s)}">${sesBody(s,w,{live:false,plan:true})}</div></details>`).join('');
  const k=kegelFor(w);
  return `<div class="view en en-narrow"><div class="view-head"><div><span class="eyebrow">8 semanas · ${esc(fmtShort(startD()))} – ${esc(fmtShort(endD()))}</span><h1>Plan</h1><p>Fuerza calisténica, tendones, potencia y resistencia.</p></div></div>
    <div class="seg en-wsel" role="group" aria-label="Semana">${seg}</div>
    <section class="panel en-phase"><div class="panel-h"><h2>Semana ${w} · ${esc(ph.name)}</h2><span class="sub">${esc(ph.rpe)}</span></div><p class="ink2">${esc(WNOTE[w])}</p></section>
    <section class="panel"><div class="panel-h"><h2>Agenda de la semana</h2></div><div class="tscroll"><table class="t en-agenda"><thead><tr><th>Día</th><th>Sesión</th><th>Hora</th><th class="r">Duración</th></tr></thead><tbody>${agenda}</tbody></table></div></section>
    <div class="stack">${secs}</div>
    <details class="sec"><summary>Suelo pélvico (Kegel) <span class="sub">Semana ${w}: ${esc(k.pos.toLowerCase())}</span></summary><div class="body"><div class="kv"><span>Posición</span><span>${esc(k.pos)}</span><span>Lentas</span><span>${esc(k.lento)}</span><span>Rápidas</span><span>${esc(k.rap)}</span></div><ul class="en-ul">${KEGEL_HOW.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></details>
    <details class="sec"><summary>Calentamientos <span class="sub">Entre semana y fin de semana</span></summary><div class="body"><h3>Entre semana · 7 min</h3>${listRows(wuList('am'))}<h3>Fin de semana · 10 min</h3>${listRows(wuList('we'))}</div></details>
    <details class="sec"><summary>Reglas de progresión <span class="sub">Cómo subir sin lesionarte</span></summary><div class="body"><ul class="en-ul">
      <li><b>Doble progresión:</b> si completas todas las series en el tope del rango con técnica limpia, la próxima vez pasas a la variante difícil o agregas lastre y vuelves al mínimo del rango.</li>
      <li><b>Esfuerzo:</b> fase 1 deja 2–3 reps en reserva; fase 2, 1–2. Al fallo solo en los tests.</li>
      <li><b>Tempo 3-1-1:</b> 3 s bajando, 1 s de pausa, 1 s subiendo.</li>
      <li><b>Lastre:</b> discos de tus mancuernas en una mochila, envueltos en una toalla. Empieza con 2,5–4 kg.</li>
      <li><b>★</b> marca los ejercicios principales: en la semana 3 suman 1 serie.</li>
      <li>Si fallas un día entre semana, muévelo al miércoles. Nunca hagas dos sesiones el mismo día.</li>
      <li>Si un tendón o articulación molesta más de 3/10 al día siguiente, baja la carga de ese ejercicio esa semana. Dolor agudo: para.</li>
      <li>Días de entreno: a la cama a las 9:30 y en pie a las 5:00 (7,5 h).</li></ul></div></details>
    <details class="sec"><summary>Tus mancuernas <span class="sub">Hasta ~10 kg por mano o ~20 kg en barra</span></summary><div class="body"><p class="ink2">Tienes 4 discos de 1,25 kg, 4 de 1,5 kg y 4 de 2 kg. Por mancuerna, en pares de discos, puedes armar 2,5 · 3 · 4 · 5,5 · 6,5 · 7 · 9,5 kg más el peso del maneral. Con el extensor armas una barra de ~20 kg para el remo y el lastre.</p><p class="ink2">La pierna progresa con trabajo a una pierna, tempo lento e isométricos, porque 10 kg por mano se quedan cortos rápido.</p></div></details>
    <details class="sec"><summary>Modo universidad <span class="sub">3 días, para cuando vuelvas a clases</span></summary><div class="body">${listRows([['Martes 5:20 am · full body (40 min)','Dominadas supinas 3×8 · fondos 3×8 · búlgaras 3×8 c/pierna · remo 3×10 · hollow 3×30 s'],['Sábado','Sesión D: habilidades + fuerza'],['Domingo','Trote 30–40 min + movilidad'],['Todos los días','Kegel 4 min']])}</div></details>
  </div>`;
}

function vProg(){
  const g=gateHtml(); if(g) return g;
  const st=stats(), cw=st.cur?st.cur.w:(today()<startD()?0:8);
  let bars='';
  for(let w=1;w<=Math.max(1,cw);w++){ const x=st.weeks[w]; const p=x.p?x.s/x.p:0; bars+=`<div class="hb"><span class="l">Semana ${w}</span><div class="tr"><div class="b" style="width:${(p*100).toFixed(0)}%;background:var(--accent)"></div></div><span class="v num">${x.p?fmtN(x.s,1)+'/'+x.p:'—'}</span></div>`; }
  const t1=F.cfg.tests.t1||{}, t8=F.cfg.tests.t8||{};
  const trows=TESTS.map(t=>{
    const a=t1[t.k], b=t8[t.k], dlt=(a!=null&&b!=null)?b-a:null;
    const dTxt=dlt==null?'—':`<span class="${dlt>0?'en-up':dlt<0?'en-down':''}">${dlt>0?'+':''}${fmtN(dlt,2)}</span>`;
    return `<tr><td>${esc(t.n)} <span class="muted xs">${t.u}</span></td><td class="r"><input class="in en-num" type="number" inputmode="decimal" min="0" step="any" id="en-p-t1-${t.k}" aria-label="${esc(t.n)} inicial" data-ft="t1.${t.k}" value="${a==null?'':a}"></td><td class="r"><input class="in en-num" type="number" inputmode="decimal" min="0" step="any" id="en-p-t8-${t.k}" aria-label="${esc(t.n)} final" data-ft="t8.${t.k}" value="${b==null?'':b}"></td><td class="r">${dTxt}</td></tr>`;
  }).join('');
  let mrows='';
  for(let w=1;w<=8;w++){ const m=F.cfg.med[w]||{}; mrows+=`<tr><td>Semana ${w}</td><td class="r"><input class="in en-num" type="number" inputmode="decimal" min="0" step="0.1" id="en-m-${w}-kg" aria-label="Peso semana ${w}" data-fm="${w}.kg" value="${m.kg==null?'':m.kg}"></td><td class="r"><input class="in en-num" type="number" inputmode="decimal" min="0" step="0.5" id="en-m-${w}-cm" aria-label="Cintura semana ${w}" data-fm="${w}.cm" value="${m.cm==null?'':m.cm}"></td></tr>`; }
  const runs=st.runs.length?st.runs.map(r=>`<tr><td>${esc(fmtShort(r.d))}</td><td class="r">${r.min==null?'—':fmtN(r.min,0)+' min'}</td><td class="r">${r.km==null?'—':fmtN(r.km,2)+' km'}</td><td class="r">${pace(r.min,r.km)}</td></tr>`).join(''):`<tr><td colspan="4" class="muted">Todavía no hay trotes registrados. Anótalos el domingo en Hoy o en el Calendario.</td></tr>`;
  return `<div class="view en"><div class="view-head"><div><span class="eyebrow">${cw?`Semana ${cw} de 8`:'Antes del bloque'}</span><h1>Progreso</h1><p>Constancia, tests y medidas.</p></div></div>
    ${tilesHtml(st)}
    <div class="grid g2">
      <section class="panel"><div class="panel-h"><h2>Cumplimiento por semana</h2><span class="sub">hechas / planificadas</span></div><div class="hbars">${bars}</div></section>
      <section class="panel"><div class="panel-h"><h2>Trotes</h2><span class="sub">domingos</span></div><div class="tscroll"><table class="t"><thead><tr><th>Día</th><th class="r">Tiempo</th><th class="r">Distancia</th><th class="r">Ritmo</th></tr></thead><tbody>${runs}</tbody></table></div></section>
      <section class="panel"><div class="panel-h"><h2>Test inicial vs final</h2><span class="sub">semana 1 y semana 8</span></div><div class="tscroll"><table class="t en-tt"><thead><tr><th>Prueba</th><th class="r">Inicial</th><th class="r">Final</th><th class="r">Cambio</th></tr></thead><tbody>${trows}</tbody></table></div></section>
      <section class="panel"><div class="panel-h"><h2>Peso y cintura</h2><span class="sub">1 vez por semana, en ayunas</span></div><p class="small ink2" style="margin-bottom:8px">Peso estable y cintura igual o menor: la recomposición va bien. La cintura se mide a la altura del ombligo.</p><div class="tscroll"><table class="t en-tt"><thead><tr><th>Semana</th><th class="r">Peso (kg)</th><th class="r">Cintura (cm)</th></tr></thead><tbody>${mrows}</tbody></table></div></section>
    </div></div>`;
}

function vComida(){
  const card=(t,items,note)=>`<section class="panel"><h2>${esc(t)}</h2><p class="small ink2" style="margin:6px 0 8px">${esc(note)}</p><div class="chips">${items.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></section>`;
  const day=[['5:00','Despertar','Agua y, si quieres, un tinto. Entrenas en ayunas; si te sientes flojo, medio banano antes.'],['5:50','Puente post-entreno','Lácteo + fruta: yogur o kumis con banano, o un vaso de leche con pan.'],['9:00','Desayuno (el que llevas)','Proteína + carbohidrato + fruta. Ej.: huevos con arepa, o avena con leche y banano.'],['10:15','Media mañana','Fruta, y maní o yogur si hay hambre.'],['12:30','Almuerzo','Plato completo: mira la regla del plato.'],['4:30','Onces antes de salir','Proteína + fruta. Así no llegas con hambre voraz a la cena.'],['8:00','Cena','Proteína + verduras + carbohidrato moderado. Poca fritura y poco volumen: no te acuestas pesado.'],['9:30','Dormir','La ventana sin comer queda de unas 9–10 h: suficiente.']];
  return `<div class="view en en-narrow"><div class="view-head"><div><span class="eyebrow">Recomposición · 65 kg</span><h1>Comida</h1><p>Guía por grupos: tú decides qué compras y qué cocinas.</p></div></div>
    <div class="tiles t4">
      <div class="tile"><span class="l">Proteína</span><span class="v num">105–130 g</span><span class="d">al día · 1,6–2 g por kg</span></div>
      <div class="tile"><span class="l">Calorías</span><span class="v">Mantenimiento</span><span class="d">ni déficit fuerte ni volumen</span></div>
      <div class="tile"><span class="l">Agua</span><span class="v num">2–2,5 L</span><span class="d">más los días de trote</span></div>
      <div class="tile"><span class="l">Comidas</span><span class="v num">5</span><span class="d">con onces a las 4:30</span></div>
    </div>
    <section class="panel"><div class="panel-h"><h2>Tu día de entreno</h2><span class="sub">en descanso, igual pero sin el puente</span></div><div class="en-tl">${day.map(([h,t,d])=>`<div class="en-tli"><span class="h num">${h}</span><div><b>${esc(t)}</b><p class="small ink2">${esc(d)}</p></div></div>`).join('')}</div></section>
    <section class="panel"><div class="panel-h"><h2>La regla del plato</h2></div><div class="en-plate"><div class="en-plate-v" style="flex:2">Verduras ½</div><div class="en-plate-p" style="flex:1">Proteína ¼</div><div class="en-plate-c" style="flex:1">Carbohidrato ¼</div></div><p class="small ink2" style="margin-top:10px">Más una porción de grasa del tamaño de un pulgar. En días de entreno el carbohidrato puede subir a ⅓ en el desayuno y el almuerzo.</p></section>
    <div class="grid g2">
      ${card('Proteína · en cada comida',['Huevos','Pollo','Carne magra','Pescado y atún','Leche','Yogur','Kumis','Queso campesino','Cuajada','Fríjol','Lenteja','Garbanzo'],'Construye y repara músculo. Repártela en 4 tomas de 25–35 g.')}
      ${card('Carbohidratos · energía',['Arroz','Papa','Yuca','Plátano','Arepa','Avena','Pan integral','Pasta'],'Más en días de entreno; porción moderada en la noche.')}
      ${card('Verduras y fibra · medio plato',['Brócoli','Zanahoria','Ahuyama','Espinaca','Habichuela','Tomate','Lechuga','Pepino','Cebolla'],'Dan volumen y saciedad con pocas calorías.')}
      ${card('Frutas · 2–3 al día',['Banano','Mango','Papaya','Piña','Guayaba','Mandarina','Manzana'],'Van muy bien antes o después de entrenar.')}
      ${card('Grasas buenas · con medida',['Aguacate','Aceite de oliva','Maní','Frutos secos','Huevo entero'],'Son muy densas en calorías: una porción es un pulgar.')}
      ${card('Limitar',['Ultraprocesados','Embutidos','Frituras','Gaseosas','Alcohol'],'Además de calorías, la sal en exceso y el alcohol hinchan la cara.')}
    </div>
    <section class="panel"><div class="panel-h"><h2>Referencias de proteína</h2><span class="sub">valores aproximados</span></div><div class="kv">
      <span>1 huevo</span><span>≈ 6 g</span><span>100 g de pollo cocido</span><span>≈ 30 g</span><span>1 lata de atún</span><span>≈ 20–25 g</span><span>1 vaso de leche</span><span>≈ 8 g</span><span>1 taza de fríjol o lenteja cocida</span><span>≈ 15 g</span><span>50 g de queso campesino</span><span>≈ 9 g</span><span>150 g de yogur griego</span><span>≈ 13 g</span></div></section>
    <div class="grid g2">
      <section class="panel stack s8"><h2>Cuándo ajustar</h2><p class="small ink2">Pésate una vez por semana, el mismo día y en ayunas, y mide la cintura (en Progreso). Si bajas más de 0,5 kg por semana o rindes menos, come un poco más de carbohidrato. Si la cintura sube, reduce la porción de la noche.</p></section>
      <section class="panel stack s8"><h2>La cara</h2><p class="small ink2">No existe quemar grasa solo de la cara: baja con la grasa total. Lo que cambia rápido es la hinchazón: sal, alcohol y dormir poco.</p></section>
      <section class="panel stack s8 span2"><h2>Suplementos (opcionales)</h2><p class="small ink2"><b>Creatina monohidrato, 3–5 g al día:</b> el suplemento con más evidencia para fuerza; no necesita fase de carga. Si tienes algún problema renal, consulta antes. <b>Proteína en polvo:</b> solo si con comida no llegas a la meta. Ninguno es obligatorio.</p></section>
    </div>
  </div>`;
}

function prefetchCode(){
  if(!F.codeP){
    const get=async f=>{ const r=await fetch(new URL(f,location.href).href,{cache:'no-store'}); if(!r.ok) throw new Error(f+' respondió '+r.status); return r.text(); };
    F.codeP=Promise.all([get('index.html'),get('entreno.js')]).then(([a,b])=>({'index.html':a,'entreno.js':b}));
    F.codeP.catch(()=>{ F.codeP=null; });
  }
  return F.codeP;
}
function vAjustes(){
  const g=gateHtml(); if(g) return g;
  
  const dow=pd(startD()).getDay();
  return `<div class="view en en-narrow"><div class="view-head"><div><span class="eyebrow">Entreno</span><h1>Ajustes</h1><p>El calendario completo se calcula desde la fecha de inicio.</p></div></div>
    <section class="panel stack"><label class="f" for="en-inicio">Fecha de inicio (día 1: test inicial)<input class="in" type="date" id="en-inicio" data-fc="inicio" value="${startD()}"></label>
      <p class="small ink2">Termina el ${esc(fmtLong(endD()))}. ${dow!==1?'<b>Te recomiendo un lunes</b> para que los días coincidan con el plan.':'Arranca un lunes, como debe ser.'}</p></section>
    <section class="panel stack s8"><h2>Tus datos</h2><p class="small ink2">Lo que chuleas se guarda en la base de datos privada de esta app, la misma de tus finanzas: lo ves igual en el celular y en el PC. Solo tú tienes acceso.</p></section>
  </div>`;
}

const VIEWS={'entreno':vHoy,'e-calendario':vCal,'e-plan':vPlan,'e-progreso':vProg,'e-comida':vComida,'e-ajustes':vAjustes};
for(const [k,fn] of Object.entries(VIEWS)) EXT.views[k]=()=>{ try{ return fn(); }catch(e){ console.error(e); return `<div class="view"><div class="banner crit">Algo falló al mostrar esta sección (${esc(e&&e.message)}). Recarga la página.</div></div>`; } };

/* =========================================================
   Navegación y selector de módulo
   ========================================================= */
const NAV=[['entreno','hoy','Hoy'],['e-calendario','cal','Calendario'],['e-plan','plan','Plan'],['e-progreso','prog','Progreso'],['e-comida','food','Comida']];
const switchHtml=()=>`<div class="modsw" role="group" aria-label="Módulo"><a href="#inicio" data-mod="fin" aria-label="Finanzas">${fic('fin')}<span class="ml">Finanzas</span></a><a href="#entreno" data-mod="fit" aria-label="Entreno">${fic('fit')}<span class="ml">Entreno</span></a></div>`;
function buildFitNav(){
  const rail=$('#rail'), tab=$('#tabbar'); if(!rail||!tab) return;
  rail.innerHTML=`<div class="brand"><span class="brand-mark">生</span><span class="brand-name">Ikigai</span></div>${switchHtml()}${NAV.map(([v,i,l])=>`<a href="#${v}" data-nav="${v}">${fic(i)}${l}</a>`).join('')}<a href="#e-ajustes" data-nav="e-ajustes">${fic('gear')}Ajustes</a><div class="rail-foot">Se sincroniza entre tu celular y tu PC.</div>`;
  tab.innerHTML=NAV.map(([v,i,l])=>`<a href="#${v}" data-nav="${v}">${fic(i)}<span>${l}</span></a>`).join('');
}
let navMode=null, lastView=null;
EXT.nav=function(view){
  const fit=!!VIEWS[view], mode=fit?'fit':'fin';
  if(fit){ F.lastFit=view; if(view==='entreno'&&lastView!=='entreno'&&!F.keepDay) F.day=null; }
  else F.lastFin=view;
  F.keepDay=false; lastView=view;
  const top=$('.top-in');
  if(top&&!top.querySelector('.modsw')){ const sp=top.querySelector('.spacer'); if(sp) sp.insertAdjacentHTML('beforebegin',switchHtml()); }
  if(mode!==navMode){
    navMode=mode;
    if(fit) buildFitNav();
    else { if(QZ.buildShell) QZ.buildShell(); const b=$('#rail .brand'); if(b) b.insertAdjacentHTML('afterend',switchHtml()); }
  }
  for(const a of $$('.modsw a')){ const m=a.dataset.mod; a.setAttribute('aria-current',m===mode?'page':'false'); a.setAttribute('href',m==='fit'?'#'+F.lastFit:'#'+F.lastFin); }
  const gear=$('.top a.iconbtn[aria-label="Ajustes"]'); if(gear) gear.setAttribute('href',fit?'#e-ajustes':'#ajustes');
  if(fit) ensureData();
};

/* =========================================================
   Eventos
   ========================================================= */
const ACT={
  ex(a){
    const d=a.dataset.d, id=a.dataset.id, e=entry(d)||{}, ex=Object.assign({},e.ex||{});
    ex[id]=!ex[id];
    const p=planFor(d), ids=p?exIds(p.s):[], all=ids.length>0&&ids.every(i=>ex[i]);
    let st=e.st||'';
    if(all&&st!=='ok'){ st='ok'; QZ.toast('Sesión completa. ¡Bien hecho!'); }
    else if(!all&&st==='ok'&&!ex[id]) st='part';
    saveDay(d,{ex,st});
  },
  kg(a){ const d=a.dataset.d, e=entry(d)||{}; saveDay(d,{kg:!e.kg}); },
  mob(a){ const d=a.dataset.d, e=entry(d)||{}; saveDay(d,{mob:!e.mob}); },
  st(a){ const d=a.dataset.d, e=entry(d)||{}; const ok=e.st==='ok'; saveDay(d,{st:ok?'':'ok'}); if(!ok) QZ.toast('Sesión marcada como hecha'); },
  dmove(a){ F.day=addDays(F.day||today(),+a.dataset.n||0); if(F.day===today()) F.day=null; QZ.scheduleRender(); },
  dtoday(){ F.day=null; QZ.scheduleRender(); },
  day(a){ const d=a.dataset.d; F.day=d===today()?null:d; F.keepDay=true; if(location.hash!=='#entreno') location.hash='#entreno'; else QZ.scheduleRender(); },
  open(a){ F.day=a.dataset.d===today()?null:a.dataset.d; F.keepDay=true; location.hash='#entreno'; },
  calm(a){ const ms=progMonths(), i=ms.indexOf(F.calM)+(+a.dataset.n||0); if(i>=0&&i<ms.length) F.calM=ms[i]; QZ.scheduleRender(); },
  cal(a){ F.calSel=a.dataset.d; QZ.scheduleRender(); },
  plw(a){ F.plW=+a.dataset.w; QZ.scheduleRender(); },
  async expcode(){
    const dl=S.cap&&S.cap.dl; if(!dl){ QZ.toast('Las descargas no están disponibles en esta vista.'); return; }
    try{
      const files=await prefetchCode();
      await dl.save({filename:'organizador-codigo.json',data:JSON.stringify({v:1,app:'Quincena',exported:new Date().toISOString(),files})});
      QZ.toast('Código descargado. Súbelo al chat con Claude.');
    }catch(e){ QZ.toast('No se pudo descargar el código: '+((e&&e.message)||e)); }
  },
  async expdata(){
    const dl=S.cap&&S.cap.dl; if(!dl){ QZ.toast('Las descargas no están disponibles en esta vista.'); return; }
    try{
      const docs={};
      if(S.cfg&&!S.noCfg) docs['config/main']=S.cfg;
      for(const [k,v] of Object.entries(S.movsDocs||{})) docs['movs/'+k]=v;
      if(F.hasCfg) docs['fit/main']=F.cfg;
      for(const [d,v] of Object.entries(F.logs||{})) docs['fitlog/'+d]=v;
      await dl.save({filename:`organizador-datos-${today()}.json`,data:JSON.stringify({v:1,app:'Quincena',exported:new Date().toISOString(),docs})});
      QZ.toast('Datos descargados. Guárdalos en un lugar seguro.');
    }catch(e){ QZ.toast('No se pudo descargar: '+((e&&e.message)||e)); }
  }
};
document.addEventListener('click',ev=>{
  const a=ev.target.closest('[data-fa]'); if(!a) return;
  const fn=ACT[a.dataset.fa]; if(!fn) return;
  if(a.tagName==='A') ev.preventDefault();
  fn(a,ev);
});
document.addEventListener('change',ev=>{
  const el=ev.target; if(!el||!el.dataset) return;
  if(el.dataset.fi){
    const d=el.dataset.d, f=el.dataset.fi;
    let v=f==='nota'?String(el.value).slice(0,400).trim():num(el.value);
    if(f!=='nota'&&v!=null&&v<0) v=null;
    saveDay(d,{[f]:v});
    const p=planFor(d);
    if(f==='km'&&p&&p.s==='E'&&RUN[p.w].test) setTest(RUN[p.w].test,'run30',v);
  } else if(el.dataset.ft){
    const [k,m]=el.dataset.ft.split('.'); let v=num(el.value); if(v!=null&&v<0) v=null; setTest(k,m,v);
  } else if(el.dataset.fm){
    const [w,m]=el.dataset.fm.split('.'); let v=num(el.value); if(v!=null&&v<=0) v=null;
    const row=Object.assign({},F.cfg.med[w]||{}); if(v==null) delete row[m]; else row[m]=v;
    F.cfg.med=Object.assign({},F.cfg.med,{[w]:row}); saveCfg();
  } else if(el.dataset.fc==='inicio'){
    if(isYmd(el.value)){ F.cfg.inicio=el.value; F.calM=null; F.calSel=null; F.plW=null; saveCfg(); QZ.toast('Fecha de inicio guardada'); }
  }
});

/* =========================================================
   Estilos del módulo (usa los tokens de Quincena)
   ========================================================= */
const CSS=`
.modsw{display:inline-flex;background:var(--panel-2);border-radius:10px;padding:3px;gap:2px;flex:none}
.modsw a{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;color:var(--ink-2);text-decoration:none;font-weight:500;font-size:.86rem;min-height:34px}
.modsw a:hover{color:var(--ink)}
.modsw a[aria-current="page"]{background:var(--panel);color:var(--ink);box-shadow:var(--shadow)}
.modsw .ic svg{width:17px;height:17px}
.top-in .brand{display:none}
@media (max-width:460px){ .top-in:has(#monthSw:not([hidden])) .modsw .ml{display:none} .top-in:has(#monthSw:not([hidden])) .modsw a{padding:6px 9px} }
.en .chip{cursor:default}
.en .chip:hover{border-color:var(--line-2)}
@media (min-width:980px){ .top .modsw{display:none} }
.rail .modsw{display:grid;grid-template-columns:1fr 1fr;margin:0 0 14px}
.rail .modsw a{justify-content:center;padding:7px 6px;font-size:.84rem;color:var(--ink-2)}
.rail .modsw a:hover{background:transparent;color:var(--ink)}
.rail .modsw a[aria-current="page"]{background:var(--panel);color:var(--ink)}
.en-narrow{max-width:900px!important}
@media (min-width:760px){ .en .tiles.t4{grid-template-columns:repeat(4,minmax(0,1fr))} }
.en .view-head .row{flex-wrap:nowrap}
.en-cap{text-transform:capitalize}
.en-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
.en-wd{border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:8px 2px 9px;display:grid;gap:3px;justify-items:center;color:var(--muted);font-size:.7rem;min-width:0}
.en-wd .dd{font-size:.95rem;font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums;line-height:1.2}
.en-wd[aria-pressed="true"]{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
.en-wd.is-today .dn{color:var(--accent);font-weight:700}
.en-wd.out{opacity:.45}
.en-lt{min-width:24px;height:22px;padding:0 5px;border-radius:6px;display:inline-grid;place-items:center;font:600 .74rem/1 var(--font-mono);border:1.5px solid var(--c,var(--muted));color:var(--c,var(--muted));background:transparent;box-sizing:border-box}
.st-ok .en-lt,.en-lt.st-ok{background:var(--c);color:var(--ci,#fff)}
.st-part .en-lt{border-style:dashed;background:color-mix(in srgb,var(--c) 20%,transparent)}
.st-miss .en-lt{border-color:var(--crit);color:var(--crit-ink);text-decoration:line-through}
.rest .en-lt,.en-lt.rest{border-color:transparent!important;background:transparent!important;color:var(--muted)!important}
.out .en-lt{visibility:hidden}
.en-card{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.en-flat{border:0;border-radius:0;border-top:1px solid var(--line)}
.en-head{display:flex;gap:12px;align-items:center;padding:14px 16px;border-left:5px solid var(--c);flex-wrap:wrap}
.en-head .t{flex:1;min-width:0}
.en-head h2{font-size:1.1rem}
.en-badge{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;font:600 1rem var(--font-mono);background:var(--c);color:var(--ci,#fff);flex:none}
.en-blk{border-top:1px solid var(--line);padding:12px 16px;display:grid;gap:2px}
.en-blk > h3{font:500 .72rem var(--font-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:2px}
.en-note{font-size:.82rem;color:var(--ink-2);margin:0 0 4px}
.en-ex{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:start;padding:9px 0;border-bottom:1px dashed var(--line)}
.en-ex:last-child{border-bottom:0}
.en-ex.ro{grid-template-columns:minmax(0,1fr) auto}
.en-ex .n{font-weight:600;font-size:.93rem;line-height:1.3}
.en-ex .v{font-size:.8rem;color:var(--accent);font-weight:500;margin-top:2px}
.en-ex .tip{font-size:.78rem;color:var(--muted);margin-top:2px;line-height:1.4}
.en-ex .rx{text-align:right;font-weight:600;font-size:.92rem;white-space:nowrap;font-variant-numeric:tabular-nums}
.en-ex .rx small{display:block;font-weight:400;font-size:.72rem;color:var(--muted);white-space:normal;max-width:118px;margin-left:auto}
.en-ex.done .n{color:var(--ink-2);text-decoration:line-through;text-decoration-thickness:1px}
.en-chk{width:28px;height:28px;border-radius:8px;border:2px solid var(--line-2);background:var(--panel);display:grid;place-items:center;color:transparent;padding:0;flex:none}
.en-chk svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.en-chk[aria-checked="true"],[aria-checked="true"] > .en-chk{background:var(--good);border-color:var(--good);color:#fff}
button.en-chk:hover{border-color:var(--ink-2)}
.en-tag{display:inline-block;font:500 .6rem/1.5 var(--font-mono);letter-spacing:.04em;border:1px solid var(--line-2);border-radius:4px;padding:0 5px;color:var(--muted);margin-left:6px;vertical-align:2px;white-space:nowrap}
.en-star{color:var(--warn-ink)}
.en-li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;font-size:.86rem;padding:6px 0;border-bottom:1px dashed var(--line)}
.en-li:last-child{border-bottom:0}
.en-li span:last-child{color:var(--ink-2);text-align:right;font-variant-numeric:tabular-nums}
.en-fold > summary{list-style:none;cursor:pointer;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:2px 10px;font-weight:600;font-size:.9rem}
.en-fold > summary > span:last-child{margin-left:auto;font-weight:400}
.en-fold > summary::-webkit-details-marker{display:none}
.en-fold > summary > span:first-child::before{content:"+ ";font-family:var(--font-mono);color:var(--muted)}
.en-fold[open] > summary > span:first-child::before{content:"− "}
.en-fold-b{padding-top:6px}
.en-inputs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:end;margin-top:8px}
.en-pace{display:grid;gap:4px;font-size:.82rem;color:var(--ink-2);padding-bottom:6px}
.en-pace b{font-size:1.05rem;color:var(--ink);font-variant-numeric:tabular-nums}
.en-num{width:84px!important;min-height:36px!important;padding:5px 8px!important;text-align:right;font-variant-numeric:tabular-nums}
.en-trx{display:grid;justify-items:end;gap:2px}
.en-foot{border-top:1px solid var(--line);padding:14px 16px}
.en-calwrap{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}
@media (min-width:980px){ .en-calwrap{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);align-items:start} }
.en-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}
.en-cal .h{font:500 .7rem var(--font-mono);color:var(--muted);text-align:center;padding-bottom:2px}
.en-day{border:1px solid var(--line);background:var(--panel);border-radius:8px;min-height:56px;padding:5px 2px;display:grid;justify-items:center;align-content:space-between;gap:4px;position:relative;min-width:0;color:var(--ink-2)}
.en-day .dn{font-size:.74rem;font-variant-numeric:tabular-nums}
.en-day:hover{border-color:var(--line-2)}
.en-day.out{background:transparent;border-color:transparent;color:var(--muted);opacity:.55}
.en-day.today .dn{color:var(--accent);font-weight:700}
.en-day.today{box-shadow:inset 0 0 0 2px var(--accent)}
.en-day.sel{border-color:var(--ink);background:var(--panel-2)}
.en-day .kg,.en-kgdot{width:7px;height:7px;border-radius:50%;background:var(--s5);display:inline-block}
.en-day .kg{position:absolute;right:4px;top:5px}
.en-blank{min-height:56px}
@media (min-width:760px){ .en-day,.en-blank{min-height:70px} }
.en-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:12px;font-size:.78rem;color:var(--ink-2)}
.en-legend > span{display:inline-flex;align-items:center;gap:6px}
.en-det{display:grid;gap:14px;border-top:4px solid var(--c)}
.en-det-h{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.en-det-h > div{flex:1;min-width:0}
.en-toggle{display:flex;align-items:center;gap:10px;border:1px solid var(--line);background:var(--panel);border-radius:8px;padding:8px 10px;font-weight:500;text-align:left}
.en-toggle:hover{border-color:var(--line-2)}
.en-wsel button{min-width:40px}
.en-sec > summary{font-weight:600}
.en-sum{display:inline-flex;align-items:center;gap:10px}
.en-sum .sub{margin-left:4px}
.en-agenda td{white-space:nowrap}
.en-agenda .en-lt{margin-right:6px}
.en-ul{margin:0;padding-left:18px;display:grid;gap:8px;font-size:.88rem;color:var(--ink-2)}
.en-ul b{color:var(--ink)}
details.sec .body h3{font-size:.85rem;margin-top:6px}
.en-up{color:var(--good-ink);font-weight:600}
.en-down{color:var(--crit-ink);font-weight:600}
.en-tt td{vertical-align:middle}
.en-tl{display:grid;gap:0}
.en-tli{display:grid;grid-template-columns:52px minmax(0,1fr);gap:12px;padding:9px 0;border-bottom:1px dashed var(--line)}
.en-tli:last-child{border-bottom:0}
.en-tli .h{font-family:var(--font-mono);font-size:.82rem;color:var(--accent);padding-top:1px}
.en-plate{display:flex;gap:3px;height:44px;border-radius:10px;overflow:hidden;font-size:.8rem;font-weight:600}
.en-plate > div{display:grid;place-items:center;padding:0 6px;text-align:center;line-height:1.15}
.en-plate-v{background:var(--good-soft);color:var(--good-ink)}
.en-plate-p{background:var(--info-soft);color:var(--ink)}
.en-plate-c{background:var(--warn-soft);color:var(--warn-ink)}
@media (max-width:420px){ .en-inputs{grid-template-columns:1fr 1fr} .en-pace{grid-column:1/-1} .en-ex .rx small{max-width:92px} }
`;
const st=document.createElement('style'); st.id='en-css'; st.textContent=CSS; document.head.appendChild(st);

if(document.readyState!=='loading'&&QZ.route&&QZ.render){ try{ QZ.route(); QZ.render(); }catch(e){} }
})();
