// ============================================
// SERVICE WORKER - PWA OFFLINE
// ============================================

const CACHE_NAME = 'territorio-v1';
const CACHE_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/sync.js',
    '/logo.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
    console.log('🚀 Service Worker instalado');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cache criado');
                return cache.addAll(CACHE_URLS);
            })
            .catch((err) => {
                console.error('❌ Erro ao criar cache:', err);
            })
    );
    self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker ativado');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Interceptar requisições (Network First, depois Cache)
self.addEventListener('fetch', (event) => {
    // Ignorar requisições do Apps Script (sempre buscar da rede)
    if (event.request.url.includes('script.google.com')) {
        return event.respondWith(fetch(event.request));
    }

    // Network First com fallback para cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Se conseguiu da rede, atualiza o cache
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Se falhou, tenta buscar do cache
                return caches.match(event.request).then((response) => {
                    if (response) {
                        console.log('📦 Servindo do cache:', event.request.url);
                        return response;
                    }
                    // Se não tem no cache e não tem rede, retorna erro
                    return new Response('Offline - Conteúdo não disponível', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});

// Mensagens do app
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

console.log('✅ Service Worker carregado');
