const CACHE_NAME = 'audibio-transcriptor-v1';
const urlsToCache = [
  '/',
  '/transcriptor.html',
  // NOTA: No podemos cachear recursos externos como google fonts o font-awesome
  // directamente aquí de forma sencilla, pero el navegador los cacheará por su cuenta.
];

// Instalación del Service Worker: Abre el caché y guarda nuestros archivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caché abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento Fetch: Responde desde el caché si es posible
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si encontramos una respuesta en el caché, la devolvemos
        if (response) {
          return response;
        }
        // Si no, vamos a la red a buscarlo
        return fetch(event.request);
      }
    )
  );
});
