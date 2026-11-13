// Service worker do PWA.
// - Arquivos estáticos: cache-first. Capturas do manual (public/ajuda): cache, atualizando por trás.
// - Páginas: rede primeiro. As telas de apontamento (PAGINAS_OFFLINE) e as páginas do manual
//   já abertas (também pelos links dentro do app) ficam guardadas para abrir sem internet; as demais
//   mostram a tela "sem conexão" (public/offline.html). Sem internet, o "?" de uma tela (/ajuda/tela)
//   abre a seção que ele já abriu neste aparelho ou, na falta dela, a entrada do manual.
// - Push: mostra a notificação e abre a página ao tocar.
// - Atualização: o app registra /sw.js?v=<publicação> (RegistrarSW). Cada publicação instala este SW de
//   novo, que assume na hora; o cache dos arquivos leva a publicação no nome, então o da anterior é
//   apagado e as telas guardadas (offline e manual) são guardadas de novo com os arquivos novos.
// Mudou o que fica guardado (inclusive o offline.html, que fica no cache ESTATICO)? Suba a versão do cache.
const PUBLICACAO = new URL(self.location.href).searchParams.get("v") || "dev";
const ESTATICO = `artepinus-estatico-v8-${PUBLICACAO}`;
const PAGINAS = "artepinus-paginas-v6";
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
  // Manutenção: quem não usa o módulo recebe um redirect, e a tela não é guardada
  "/manutencao",
  "/requisicoes/nova",
  // Manual: a ajuda de sem internet e os problemas comuns abrem justamente quando falta sinal
  "/ajuda",
  "/ajuda/sem-internet",
  "/ajuda/problemas",
];

/** Página do manual (/ajuda/...): as que a pessoa abre também ficam guardadas (o conteúdo não é sensível). */
function doManual(caminho) {
  return caminho === "/ajuda" || caminho.startsWith("/ajuda/");
}

/** Ajuda da tela: /ajuda/tela?de=<tela> só redireciona para a seção do manual daquela tela. */
const AJUDA_DA_TELA = "/ajuda/tela";

/** Chave, no cache das páginas, do caminho da seção que o "?" da tela `de` abriu. */
function chaveAjudaDaTela(de) {
  return `${AJUDA_DA_TELA}?de=${encodeURIComponent(de || "")}`;
}

/** Captura de tela do manual (public/ajuda), direto ou pelo otimizador de imagens do Next. */
function imagemDoManual(url) {
  if (url.pathname === "/_next/image") return (url.searchParams.get("url") || "").startsWith("/ajuda/");
  return url.pathname.startsWith("/ajuda/") && /\.(webp|png|jpe?g)$/.test(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(ESTATICO).then((c) => c.addAll([OFFLINE, ...LOGOS, "/icons/icon-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const usado = await temPaginasGuardadas(keys);
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
  if (!PAGINAS_OFFLINE.includes(caminho) && !doManual(caminho)) return;
  // Redirect (ex.: perdeu o acesso ao módulo): a cópia antiga não deve continuar abrindo sem internet
  if (res.redirected || res.type === "opaqueredirect") {
    await (await caches.open(PAGINAS)).delete(caminho);
    return;
  }
  if (!res.ok || !(res.headers.get("Content-Type") || "").includes("text/html")) return;
  const html = await res.clone().text();
  await (await caches.open(PAGINAS)).put(caminho, new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } }));
  const arquivos = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) || [])];
  // Capturas de tela usadas nas páginas do manual
  if (doManual(caminho)) arquivos.push(...new Set(html.match(/\/ajuda\/[\w/.-]+\.webp/g) || []));
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

/**
 * Página do manual aberta por um link dentro do app (o Next busca só os dados, sem a página inteira):
 * guarda a página completa por trás. No "?" de uma tela, lembra também para qual seção ele levou.
 */
async function guardarDoManual(url) {
  let caminho = url.pathname;
  if (caminho === AJUDA_DA_TELA) {
    const de = url.searchParams.get("de");
    if (!de) return;
    const res = await fetch(chaveAjudaDaTela(de), { credentials: "same-origin" });
    res.body?.cancel().catch(() => {}); // só interessa para onde foi; a seção é guardada sem o "Voltar para a tela"
    const destino = new URL(res.url);
    if (!res.ok || !res.redirected || destino.origin !== self.location.origin || !doManual(destino.pathname) || destino.pathname === AJUDA_DA_TELA) return;
    caminho = destino.pathname;
    await (await caches.open(PAGINAS)).put(chaveAjudaDaTela(de), new Response(caminho, { headers: { "Content-Type": "text/plain; charset=utf-8" } }));
  }
  await guardarPagina(caminho, await fetch(caminho, { credentials: "same-origin", redirect: "manual" }));
}

/** Sem internet: a cópia guardada da tela; na falta dela, a tela "sem conexão". */
async function semInternet(url) {
  const paginas = await caches.open(PAGINAS);
  // "?" de uma tela: a seção que ele já abriu neste aparelho; senão, a entrada do manual
  if (url.pathname === AJUDA_DA_TELA) {
    const lembrada = await paginas.match(chaveAjudaDaTela(url.searchParams.get("de")));
    const secao = lembrada ? await lembrada.text() : null;
    for (const destino of [secao, "/ajuda"]) {
      if (destino && doManual(destino) && (await paginas.match(destino))) return Response.redirect(new URL(destino, self.location.origin).href, 302);
    }
  }
  return (await paginas.match(url.pathname)) || (await caches.match(OFFLINE));
}

/** Atualiza todas as telas offline e as páginas do manual já guardadas (com a sessão do usuário). */
async function aquecer() {
  let manual = [];
  try {
    manual = (await (await caches.open(PAGINAS)).keys()).map((r) => new URL(r.url).pathname).filter((p) => doManual(p) && p !== AJUDA_DA_TELA);
  } catch {}
  return Promise.all(
    [...new Set([...PAGINAS_OFFLINE, ...manual])].map((p) =>
      // redirect "manual": tela que o usuário não abre volta como redirect, sem carregar a página de destino
      fetch(p, { credentials: "same-origin", redirect: "manual" })
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

  // Capturas do manual: abre a cópia guardada na hora e atualiza por trás (o script pode gerar de novo com o mesmo nome)
  if (imagemDoManual(url)) {
    event.respondWith(
      caches.open(ESTATICO).then(async (cache) => {
        const guardada = await cache.match(request);
        const daRede = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        });
        if (!guardada) return daRede;
        event.waitUntil(daRede.catch(() => {}));
        return guardada;
      })
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || LOGOS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => guardarEstatico(request, res))));
    return;
  }

  // Link do app para o manual (dados do Next, sem a página inteira; a pré-busca dos links não conta):
  // a rede atende normalmente e a página completa é guardada por trás
  if (
    request.mode !== "navigate" &&
    doManual(url.pathname) &&
    request.headers.get("RSC") === "1" &&
    !request.headers.has("Next-Router-Prefetch") &&
    !request.headers.has("Next-Router-Segment-Prefetch")
  ) {
    event.waitUntil(guardarDoManual(url).catch(() => {}));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // "?" de uma tela: volta como redirect; descobre a seção e a guarda por trás
          if (url.pathname === AJUDA_DA_TELA) event.waitUntil(guardarDoManual(url).catch(() => {}));
          // Com ?data= etc. não substitui a cópia padrão da tela
          else if (!url.search) event.waitUntil(guardarPagina(url.pathname, res.clone()));
          return res;
        })
        .catch(() => semInternet(url))
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
