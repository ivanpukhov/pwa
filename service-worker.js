const CACHE_NAME = 'ai-news-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/index.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
    'https://ix-web.site'
];

// Установка Service Worker и кеширование ресурсов
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Открыт кеш:', cache);
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Активация Service Worker и очистка старого кеша
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Перехват сетевых запросов
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращает кешированный ответ, если он есть, или выполняет запрос к сети
        return response || fetch(event.request).then(fetchResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
  );
});

// Обработка сообщений от основного потока
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'get-cached-news') {
    serveCachedNews(event);
  }
});

// Функция для предоставления кешированных новостей
function serveCachedNews(event) {
  const newsApiUrl = '/api/news'; // URL  API для новостей
  caches.match(newsApiUrl)
    .then(response => {
      if (response) {
        return response.json();
      }
      return null;
    })
    .then(data => {
      if (data) {
        event.source.postMessage({ type: 'cached-news', articles: data.items });
      } else {
        event.source.postMessage({ type: 'cached-news', articles: [] });
      }
    })
    .catch(error => console.error('Ошибка при получении кешированных новостей:', error));
}
