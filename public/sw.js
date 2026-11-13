// Service worker do PWA.
// - Arquivos estáticos: cache-first.
// - Páginas: rede primeiro. As telas de apontamento (PAGINAS_OFFLINE) ficam guardadas
//   para abrir sem internet; as demais mostram a tela "sem conexão".
// - Push: mostra a notificação e abre a página ao tocar.
const ESTATICO = "artepinus-estatico-v7";
const PAGINAS = "artepinus-paginas-v5";
const OFFLINE = "/offline.html";
// Logos claros e brancos (tema escuro): também ficam guardados para abrir sem internet
const LOGOS = ["/logo.svg", "/logo-branco.svg", "/marca.svg", "/marca-branca.svg"];
const PAGINAS_OFFLINE = [
  "/producao",
  "/producao/toras/nova",
  "/producao/boletins/novo",
  "/producao/estoque/novo",
  "/producao/escanear",
  "/producao/paradas",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(ESTATICO).then((c) => c.addAll([OFFLINE, ...LOGOS, "/icons/icon-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const usado = await temPaginasGuardadas(keys.filter((k) => k !== PAGINAS));
      await Promise.all(keys.filter((k) => k !== ESTATICO && k !== PAGINAS).map((k) => caches.delete(k)));
      // Nova versão: guarda de novo as telas offline com os arquivos desta versão.
      // Sem esperar, para não segurar as requisições da página.
      if (usado) aquecer().catch(() => {});
    })()
  );
  self.clients.claim();
});

/** O aparelho já tinha telas guardadas (alguém entrou no sistema nele)? */
async function temPaginasGuardadas(keys) {
  for (const k of keys) if (k.startsWith("artepinus-paginas-") && (await (await caches.open(k)).keys()).length) return true;
  return false;
}

async function guardarEstatico(request, res) {
  if (res.ok) (await caches.open(ESTATICO)).put(request, res.clone());
  return res;
}

/** Guarda a página e os arquivos que ela usa, para abrir sem internet. */
async function guardarPagina(caminho, res) {
  if (!res.ok || res.redirected || !PAGINAS_OFFLINE.includes(caminho)) return;
  const html = await res.clone().text();
  await (await caches.open(PAGINAS)).put(caminho, new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } }));
  const arquivos = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) || [])];
  const cache = await caches.open(ESTATICO);
  await Promise.all(
    arquivos.map(async (url) => {
      if (await cache.match(url)) return;
      try {
        const r = await fetch(url);
        if (r.ok) await cache.put(url, r);
      } catch {}
    })
  );
}

/** Atualiza todas as telas offline (com a sessão do usuário). */
function aquecer() {
  return Promise.all(
    PAGINAS_OFFLINE.map((p) =>
      fetch(p, { credentials: "same-origin" })
        .then((res) => guardarPagina(p, res))
        .catch(() => {})
    )
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || LOGOS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => guardarEstatico(request, res))));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Com ?data= etc. não substitui a cópia padrão da tela
          if (!url.search) event.waitUntil(guardarPagina(url.pathname, res.clone()));
          return res;
        })
        .catch(async () => (await caches.open(PAGINAS)).match(url.pathname).then((hit) => hit || caches.match(OFFLINE)))
    );
  }
});

self.addEventListener("message", (event) => {
  // O app pede para atualizar as páginas offline (logo após o login e quando volta a conexão)
  if (event.data?.tipo === "aquecer") event.waitUntil(aquecer());
  // Ao sair: apaga as páginas guardadas (elas têm dados do usuário)
  if (event.data?.tipo === "limpar") event.waitUntil(caches.delete(PAGINAS));
});

// ---- Notificações push ----
self.addEventListener("push", (event) => {
  let dados = { titulo: "Artepinus", mensagem: "", link: "/" };
  try {
    dados = { ...dados, ...event.data.json() };
  } catch {
    if (event.data) dados.mensagem = event.data.text();
  }
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(dados.titulo, {
        body: dados.mensagem,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-96.png",
        data: { link: dados.link },
        tag: dados.link,
        renotify: true,
      }),
      // Avisa as abas abertas para atualizarem o sininho
      self.clients.matchAll({ type: "window" }).then((abas) => abas.forEach((a) => a.postMessage({ tipo: "notificacao" }))),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.link || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((abas) => {
      const aba = abas.find((a) => a.url.startsWith(self.location.origin));
      // navigate() falha em aba que este SW não controla (ex.: aberta com recarga forçada)
      if (aba) return aba.navigate(destino).then((a) => (a || aba).focus(), () => self.clients.openWindow(destino));
      return self.clients.openWindow(destino);
    })
  );
});
