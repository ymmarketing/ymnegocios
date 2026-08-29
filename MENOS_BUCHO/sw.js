const CACHE='menos-bucho-v2';
const ASSETS=[
  './','./index.html','./acesso.html','./jornada.html','./prototype.html',
  './assets/styles.css','./assets/product.css','./assets/challenges.js','./assets/app.js',
  './assets/purchase.js','./assets/access.js','./assets/journey.js','./assets/cancel-renewal.js',
  './manifest.webmanifest'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.endsWith('/config.js')){
    event.respondWith(fetch(event.request));
    return;
  }
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    if(response.ok){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,clone));}
    return response;
  })));
});
