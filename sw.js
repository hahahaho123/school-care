/* HR 현장 통합 관리 — 문서 캐시 방지용 서비스워커
   화면(HTML)은 항상 서버에서 새로 받아옵니다.
   인터넷이 끊긴 경우에만 마지막으로 받아둔 화면을 보여줍니다. */
const DOC = 'hr-doc-v1';

self.addEventListener('install', function (e) { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    const keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k !== DOC; })
      .map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('message', function (e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode !== 'navigate') return;          /* 화면 요청만 처리 */
  e.respondWith((async function () {
    try {
      const res = await fetch(req, { cache: 'no-store' });
      if (res && res.ok) {
        const c = await caches.open(DOC);
        c.put('doc', res.clone());
      }
      return res;
    } catch (err) {
      const c = await caches.open(DOC);
      const hit = await c.match('doc');
      if (hit) return hit;
      throw err;
    }
  })());
});
