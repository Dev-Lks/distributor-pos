// public/sw.js
const CACHE_NAME = 'distribuidora-pos-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/dashboard/sales',
  '/dashboard/inventory',
  '/dashboard/inventory-by-point',
  '/dashboard/products',
  '/dashboard/points',
  '/inventory',
  '/products',
  '/manifest.json',
  '/file.svg'
];

// Install SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Receber mensagens do cliente para enviar notificações
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SEND_NOTIFICATION') {
    const { payload } = event.data;
    
    const options = {
      icon: payload.icon || '/file.svg',
      badge: payload.badge || '/file.svg',
      tag: payload.tag || 'default',
      vibrate: payload.vibrate || [200, 100, 200],
      requireInteraction: payload.requireInteraction ?? false,
      data: payload.data || {},
      actions: payload.actions || [],
    };

    if (payload.body) {
      options.body = payload.body;
    }

    self.registration.showNotification(payload.title, options);
  }
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, data } = event.notification;

  // Se clicou em uma ação específica
  if (action === 'view' && data?.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Procura por uma aba já aberta
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].url.includes(data.url)) {
            return clientList[i].focus();
          }
        }
        // Abre nova aba com a URL
        if (clients.openWindow) {
          return clients.openWindow(data.url);
        }
      })
    );
    return;
  }

  // Se clicou no corpo da notificação, vai para dashboard ou URL padrão
  const defaultUrl = data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url.includes('/')) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(defaultUrl);
      }
    })
  );
});

// Fechar notificação (opcional - para ações de "descartar")
self.addEventListener('notificationclose', (event) => {
  console.log('Notificação fechada:', event.notification.tag);
});