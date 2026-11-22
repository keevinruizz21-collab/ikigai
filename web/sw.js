/* Ikigai · service worker (solo versión web): guarda la app para abrirla sin internet. */
const CACHE='ikigai-c1b4cf57862d';
const FILES=["./entreno.js", "./fonts/fonts.css", "./fonts/ibm-plex-mono-latin-400-normal.woff2", "./fonts/ibm-plex-mono-latin-500-normal.woff2", "./fonts/ibm-plex-sans-latin-400-normal.woff2", "./fonts/ibm-plex-sans-latin-500-normal.woff2", "./fonts/ibm-plex-sans-latin-600-normal.woff2", "./fonts/ibm-plex-sans-latin-700-normal.woff2", "./icons/apple-touch-icon.png", "./icons/favicon-64.png", "./icons/icon-1024.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./ikigai/config.js", "./ikigai/core.js", "./ikigai/ikigai.css", "./ikigai/vendor/supabase.js", "./ikigai/vendor/xlsx.full.min.js", "./index.html", "./manifest.webmanifest", "./quincena.js", "./"];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==self.location.origin) return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(res=>{
    if(res.ok){ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); }
    return res;
  }).catch(()=>caches.match('./index.html'))));
});
