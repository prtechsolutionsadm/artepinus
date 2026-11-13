// Capturas de tela do manual do usuário (/ajuda). Para cada bloco { tipo: "imagem" } do manual
// (seções, tópicos e problemas comuns), entra com o usuário de demonstração da persona, abre a tela,
// faz as ações e grava public/ajuda/<arquivo> em WebP. Rode de novo quando uma tela mudar e commite as imagens.
//
// Uso (servidor local no ar, banco com os dados de demonstração: SEED_DEMO=1 npm run db:seed):
//   npm run build && npm start                     (em outro terminal)
//   npm run manual:capturas                        todas
//   npm run manual:capturas -- --so serraria/      só os arquivos que contêm o texto (vale repetir ou separar por vírgula)
//   npm run manual:capturas -- --listar            só lista o que seria fotografado (não abre o navegador)
//   --base http://localhost:3000 (ou MANUAL_BASE)  endereço do servidor
//   --forcar                                       aceita servidor fora deste computador (cuidado: dados reais)
//
// As imagens ficam públicas (arquivo com extensão não passa pelo login, src/proxy.ts): só podem mostrar
// dados de demonstração. Por isso o script recusa servidor que não seja local, a não ser com --forcar.
// Senhas: MANUAL_SENHA_<PERSONA> (ex.: MANUAL_SENHA_ADMIN, obrigatória para "admin"); sem ela, a do seed
// de demonstração (teste123). MANUAL_LOGIN_<PERSONA> troca o usuário. Podem ficar no .env.local.
// Navegador: Playwright (devDependency ou instalado com npm i -g) com o Chrome do computador
// (CHROME_PATH ou os caminhos comuns) ou o Chromium do Playwright.
// Na tela: tema claro, sem animações e sem cursor piscando; elementos com data-captura-ocultar somem da foto.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, relative, sep } from "node:path";
import { parseArgs, parseEnv } from "node:util";
import sharp from "sharp";
import { MANUAL, PROBLEMAS, type AcaoCaptura, type Bloco, type Captura, type PersonaCaptura, type Problema, type Secao } from "@/lib/manual";
import { MODULOS, MODULOS_EM_TESTE } from "@/lib/permissoes";

/** Raiz do projeto (os scripts do npm rodam nela). */
const RAIZ = process.cwd();
/** Onde as imagens ficam: servidas em /ajuda/<arquivo>. */
export const PASTA_IMAGENS = join(RAIZ, "public", "ajuda");
/** Largura máxima da imagem gravada (o celular sai 780×1688; o computador, 780×488). */
const LARGURA_MAX = 780;
const QUALIDADE_WEBP = 80;

/** Usuários de demonstração (prisma/seed.ts com SEED_DEMO=1). */
const PERSONAS = {
  apontador: { login: "carlos.encarregado", senhaPadrao: "teste123" },
  supervisor: { login: "paulo.supervisor", senhaPadrao: "teste123" },
  gerente: { login: "ana.gerente", senhaPadrao: "teste123" },
  manutentor: { login: "joao.tecnico", senhaPadrao: "teste123" },
  operador: { login: "maria.operadora", senhaPadrao: "teste123" },
  // O admin do seed tem senha sorteada: só com MANUAL_SENHA_ADMIN
  admin: { login: "pablo.ribas", senhaPadrao: undefined },
} satisfies Record<PersonaCaptura, { login: string; senhaPadrao: string | undefined }>;

const UA_CELULAR =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

/** Tamanho da tela (o mesmo de src/components/ajuda/ImagemManual.tsx). */
const TELAS = {
  celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA_CELULAR },
  computador: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
} as const;
type Tela = keyof typeof TELAS;

/** Opções de todo contexto do navegador: claro, horário de Brasília, sem service worker (nada de cache do app). */
const CONTEXTO_BASE = {
  colorScheme: "light",
  reducedMotion: "reduce",
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
  serviceWorkers: "block",
} as const;

/** Tema claro salvo antes de a página rodar (o mesmo localStorage de src/components/Tema.tsx). */
const SCRIPT_TEMA_CLARO = `try{localStorage.setItem("artepinus-tema","claro")}catch(e){}`;

/** Deixa a foto estável: sem animação/transição, sem cursor piscando, sem o que a tela marcar para ocultar. */
const CSS_CAPTURA = `
*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important;scroll-behavior:auto!important}
[data-captura-ocultar],nextjs-portal{display:none!important}
`;

/** Telas para onde o sistema manda quem não tem acesso (ou perdeu a sessão). */
const DESVIOS = ["/login", "/sair", "/trocar-senha", "/sistema", "/producao", "/manutencao", "/perfil"];

const TEMPO = { navegar: 45_000, acao: 15_000, quieto: 15_000, login: 30_000 };

// ---------------------------------------------------------------------------------------------
// Tipos mínimos do Playwright (carregado em tempo de execução; pode não estar nas dependências)

type Espera = { timeout?: number };
type EstadoCarga = "load" | "domcontentloaded" | "networkidle";
interface Localizador {
  first(): Localizador;
  click(o?: Espera): Promise<void>;
  fill(valor: string, o?: Espera): Promise<void>;
  scrollIntoViewIfNeeded(o?: Espera): Promise<void>;
  waitFor(o?: Espera & { state?: "attached" | "visible" }): Promise<void>;
  count(): Promise<number>;
  innerText(o?: Espera): Promise<string>;
}
interface Pagina {
  goto(url: string, o?: Espera & { waitUntil?: EstadoCarga }): Promise<{ status(): number } | null>;
  waitForLoadState(estado: EstadoCarga, o?: Espera): Promise<void>;
  waitForURL(teste: (url: URL) => boolean, o?: Espera): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
  locator(seletor: string, o?: { hasText?: string | RegExp }): Localizador;
  url(): string;
  addStyleTag(o: { content: string }): Promise<unknown>;
  evaluate<R>(fn: () => R | Promise<R>): Promise<R>;
  screenshot(o?: { type?: "png"; fullPage?: boolean }): Promise<Buffer>;
  close(): Promise<void>;
}
type EstadoSessao = { cookies: unknown[]; origins: unknown[] };
interface Contexto {
  newPage(): Promise<Pagina>;
  addInitScript(script: string): Promise<void>;
  storageState(): Promise<EstadoSessao>;
  close(): Promise<void>;
}
interface Navegador {
  newContext(opcoes: Record<string, unknown>): Promise<Contexto>;
  version(): string;
  close(): Promise<void>;
}
type OpcoesNavegador = { headless?: boolean; executablePath?: string; channel?: string; args?: string[]; env?: Record<string, string> };
type Playwright = { chromium: { launch(o: OpcoesNavegador): Promise<Navegador> } };

// ---------------------------------------------------------------------------------------------
// Lista de capturas

/** Uma captura e onde ela aparece no manual. */
export type ItemCaptura = { captura: Captura; onde: string };

/** Todos os blocos { tipo: "imagem" } do manual, na ordem em que aparecem. */
export function capturasDoManual(secoes: Secao[] = MANUAL, problemas: Problema[] = PROBLEMAS): ItemCaptura[] {
  const itens: ItemCaptura[] = [];
  const dosBlocos = (blocos: Bloco[], onde: string) => {
    for (const b of blocos) if (b.tipo === "imagem") itens.push({ captura: b.imagem, onde });
  };
  for (const s of secoes) for (const t of s.topicos) dosBlocos(t.blocos, `/ajuda/${s.id}#${t.id}`);
  for (const p of problemas) dosBlocos(p.blocos, `/ajuda/problemas#${p.id}`);
  return itens;
}

export type Resultado = { arquivo: string; onde: string; perfil: string; tela: Tela; ok: boolean; detalhe: string };

/** Caminho relativo seguro dentro de public/ajuda: "grupo/nome.webp", minúsculas, números, - e _. */
const ARQUIVO_VALIDO = /^[a-z0-9][a-z0-9_-]*(\/[a-z0-9][a-z0-9_-]*)*\.webp$/;

function telaDe(c: Captura): Tela {
  return c.tela ?? "celular";
}

function assinatura(c: Captura) {
  return JSON.stringify([c.rota, c.perfil, telaDe(c), c.acoes ?? []]);
}

/**
 * Confere a lista: arquivo e rota válidos, persona e tela conhecidas, e o mesmo arquivo citado duas vezes
 * só se for a mesma tela (aí é fotografado uma vez). Volta o que dá para fotografar e as falhas.
 */
export function conferirCapturas(itens: ItemCaptura[]): { validas: ItemCaptura[]; falhas: Resultado[] } {
  const falhas: Resultado[] = [];
  const porArquivo = new Map<string, ItemCaptura[]>();
  for (const it of itens) porArquivo.set(it.captura.arquivo, [...(porArquivo.get(it.captura.arquivo) ?? []), it]);
  const validas: ItemCaptura[] = [];
  for (const [arquivo, lista] of porArquivo) {
    const { captura: c, onde } = lista[0];
    const falha = (detalhe: string) =>
      falhas.push({ arquivo, onde: lista.map((l) => l.onde).join(", "), perfil: String(c.perfil), tela: telaDe(c), ok: false, detalhe });
    if (new Set(lista.map((l) => assinatura(l.captura))).size > 1) falha("o mesmo arquivo aparece com telas diferentes: use nomes diferentes");
    else if (!ARQUIVO_VALIDO.test(arquivo)) falha('arquivo inválido: use "grupo/nome.webp" (minúsculas, números e hífens)');
    else if (!c.rota.startsWith("/") || c.rota.startsWith("//")) falha(`rota inválida "${c.rota}": use o caminho da tela, ex.: /producao/paradas`);
    else if (!Object.hasOwn(PERSONAS, c.perfil)) falha(`persona desconhecida "${c.perfil}"`);
    else if (!Object.hasOwn(TELAS, telaDe(c))) falha(`tela desconhecida "${c.tela}": use celular ou computador`);
    else validas.push({ captura: c, onde: lista.length > 1 ? `${onde} (+${lista.length - 1})` : onde });
  }
  return { validas, falhas };
}

// ---------------------------------------------------------------------------------------------
// Navegador

function primeiraLinha(e: unknown) {
  return String(e instanceof Error ? e.message : e)
    .replace(/\x1b\[[0-9;]*m/g, "")
    .split("\n")[0]
    .trim();
}

/** Playwright do projeto (playwright ou playwright-core) ou o instalado com npm i -g. */
function carregarPlaywright(): Playwright {
  const tentar = (origem: string) => {
    const req = createRequire(origem);
    for (const nome of ["playwright", "playwright-core"]) {
      try {
        return req(nome) as Playwright;
      } catch {}
    }
    return null;
  };
  const doProjeto = tentar(join(RAIZ, "package.json"));
  if (doProjeto) return doProjeto;
  try {
    const global = execFileSync("npm", ["root", "-g"], { encoding: "utf8", shell: process.platform === "win32", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const doGlobal = global ? tentar(join(global, "_.js")) : null;
    if (doGlobal) return doGlobal;
  } catch {}
  throw new Error(
    "Playwright não encontrado. Instale com: npm i -D playwright-core (usa o Chrome do computador) " +
      "ou npm i -D playwright && npx playwright install chromium",
  );
}

const CHROMES = [
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

async function abrirNavegador(pw: Playwright): Promise<Navegador> {
  const caminho = process.env.CHROME_PATH || CHROMES.find((c) => existsSync(c));
  const tentativas: OpcoesNavegador[] = [...(caminho ? [{ executablePath: caminho }] : []), {}, { channel: "chrome" }];
  // Campos de data e números no formato brasileiro (no Linux o Chrome segue o LANG, não o locale do contexto)
  const env: Record<string, string> = { LANG: "pt_BR.UTF-8", LANGUAGE: "pt_BR:pt" };
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined && !(k in env)) env[k] = v;
  const erros: string[] = [];
  for (const t of tentativas) {
    try {
      return await pw.chromium.launch({ headless: true, args: ["--lang=pt-BR"], env, ...t });
    } catch (e) {
      erros.push(primeiraLinha(e));
    }
  }
  throw new Error(`O Chrome não abriu (${erros.join(" | ")}). Informe CHROME_PATH ou rode: npx playwright install chromium`);
}

/** Espera a rede ficar quieta (sem travar se a tela tiver uma conexão sempre aberta). */
async function quieta(p: Pagina) {
  await p.waitForLoadState("networkidle", { timeout: TEMPO.quieto }).catch(() => {});
}

function credenciais(persona: PersonaCaptura) {
  const chave = persona.toUpperCase();
  const login = process.env[`MANUAL_LOGIN_${chave}`] || PERSONAS[persona].login;
  const senha = process.env[`MANUAL_SENHA_${chave}`] || PERSONAS[persona].senhaPadrao;
  return { login, senha, chave };
}

/** Entra uma vez com a persona e volta a sessão (cookies) para os contextos das capturas. */
async function entrar(nav: Navegador, base: URL, persona: PersonaCaptura): Promise<EstadoSessao> {
  const { login, senha, chave } = credenciais(persona);
  if (!senha) throw new Error(`sem senha para ${login}: defina MANUAL_SENHA_${chave}`);
  const ctx = await nav.newContext({ ...CONTEXTO_BASE, ...TELAS.computador });
  try {
    const p = await ctx.newPage();
    await p.goto(new URL("/login", base).href, { waitUntil: "load", timeout: TEMPO.navegar });
    await p.locator("#login").fill(login, { timeout: TEMPO.acao });
    await p.locator("#senha").fill(senha, { timeout: TEMPO.acao });
    await p.locator("form button[type=submit]").first().click({ timeout: TEMPO.acao });
    // Sai do /login (deu certo) ou aparece a mensagem de erro do formulário
    const alerta = p.locator("form [role=alert]").first();
    const fim = await Promise.race([
      p.waitForURL((u) => u.pathname !== "/login", { timeout: TEMPO.login }).then(
        () => "entrou" as const,
        () => "tempo" as const,
      ),
      alerta.waitFor({ state: "visible", timeout: TEMPO.login }).then(
        () => "erro" as const,
        () => "tempo" as const,
      ),
    ]);
    if (fim === "erro") throw new Error(`não entrou como ${login}: ${(await alerta.innerText().catch(() => "")).trim() || "erro no login"}`);
    if (fim === "tempo") throw new Error(`o login de ${login} não respondeu`);
    if (new URL(p.url()).pathname === "/trocar-senha") throw new Error(`${login} precisa trocar a senha: entre uma vez no sistema com esse usuário`);
    return await ctx.storageState();
  } finally {
    await ctx.close().catch(() => {});
  }
}

function descreverAcao(a: AcaoCaptura) {
  if ("clicar" in a) return `clicar ${a.clicar}`;
  if ("preencher" in a) return `preencher ${a.preencher}`;
  if ("esperar" in a) return `esperar ${a.esperar} ms`;
  return `rolar até ${a.rolarAte}`;
}

/** O primeiro elemento VISÍVEL do seletor (a mesma tela costuma ter versões escondidas para celular/computador). */
function visivel(p: Pagina, seletor: string) {
  return p.locator(`${seletor} >> visible=true`).first();
}

async function executarAcao(p: Pagina, a: AcaoCaptura) {
  if ("clicar" in a) {
    await visivel(p, a.clicar).click({ timeout: TEMPO.acao });
    // O clique pode navegar: dá tempo de a próxima tela começar a carregar
    await p.waitForTimeout(300);
    await quieta(p);
  } else if ("preencher" in a) {
    await visivel(p, a.preencher).fill(a.valor, { timeout: TEMPO.acao });
  } else if ("esperar" in a) {
    await p.waitForTimeout(a.esperar);
  } else {
    await visivel(p, a.rolarAte).scrollIntoViewIfNeeded({ timeout: TEMPO.acao });
  }
}

const TITULOS_ERRO = /^\s*(Algo deu errado|Página não encontrada|Sem conexão com a internet)\s*$/;

async function conferirTelaDeErro(p: Pagina) {
  const h1 = p.locator("h1", { hasText: TITULOS_ERRO });
  if (await h1.count()) throw new Error(`a tela mostrou "${(await h1.first().innerText()).trim()}"`);
}

/** Abre a tela, faz as ações e volta a foto (PNG) do que aparece na tela. */
async function fotografar(p: Pagina, base: URL, c: Captura): Promise<Buffer> {
  const destino = new URL(c.rota, base);
  const resp = await p.goto(destino.href, { waitUntil: "load", timeout: TEMPO.navegar });
  await quieta(p);
  if (resp && resp.status() >= 400) throw new Error(`a tela respondeu ${resp.status()}`);
  const final = new URL(p.url()).pathname;
  if (final !== destino.pathname && DESVIOS.includes(final)) {
    // Módulo em teste só abre para o ADMIN: as telas dele só saem com "admin" ou depois de liberar
    const emTeste =
      c.perfil !== "admin" && MODULOS_EM_TESTE.length && !destino.pathname.startsWith(MODULOS.producao.inicio)
        ? ` (lembrete: em teste, só o admin abre ${MODULOS_EM_TESTE.map((m) => MODULOS[m].nome).join(", ")})`
        : "";
    throw new Error(`o sistema mandou para ${final}: a persona "${c.perfil}" enxerga ${c.rota}?${emTeste}`);
  }
  await conferirTelaDeErro(p);
  for (const [i, a] of (c.acoes ?? []).entries()) {
    try {
      await executarAcao(p, a);
    } catch (e) {
      const msg = primeiraLinha(e);
      throw new Error(`ação ${i + 1} (${descreverAcao(a)}): ${/Timeout/i.test(msg) ? "tempo esgotado: nenhum elemento visível (e livre para usar) com esse seletor" : msg}`);
    }
  }
  await conferirTelaDeErro(p);
  await p.addStyleTag({ content: CSS_CAPTURA });
  await p.evaluate(async () => {
    document.documentElement.classList.remove("dark");
    (document.activeElement as HTMLElement | null)?.blur?.();
    await document.fonts.ready;
  });
  await p.waitForTimeout(300);
  return p.screenshot({ type: "png" });
}

async function gravarWebp(png: Buffer, arquivo: string, pasta: string) {
  const caminho = join(pasta, ...arquivo.split("/"));
  await mkdir(dirname(caminho), { recursive: true });
  const info = await sharp(png).resize({ width: LARGURA_MAX, withoutEnlargement: true }).webp({ quality: QUALIDADE_WEBP }).toFile(caminho);
  return `${info.width}×${info.height} · ${Math.max(1, Math.round(info.size / 1024))} KB`;
}

export type OpcoesCaptura = {
  base: URL;
  /** Pasta onde gravar (padrão: public/ajuda). */
  pasta?: string;
  /** Chamado a cada captura pronta (progresso). */
  aoTerminar?: (r: Resultado) => void;
};

/** Fotografa as capturas (já conferidas): entra uma vez por persona e abre um contexto por tamanho de tela. */
export async function gerarCapturas(itens: ItemCaptura[], { base, pasta = PASTA_IMAGENS, aoTerminar }: OpcoesCaptura): Promise<Resultado[]> {
  const resultados: Resultado[] = [];
  const anotar = (it: ItemCaptura, ok: boolean, detalhe: string) => {
    const r: Resultado = { arquivo: it.captura.arquivo, onde: it.onde, perfil: it.captura.perfil, tela: telaDe(it.captura), ok, detalhe };
    resultados.push(r);
    aoTerminar?.(r);
  };
  if (!itens.length) return resultados;

  const nav = await abrirNavegador(carregarPlaywright());
  try {
    for (const persona of Object.keys(PERSONAS) as PersonaCaptura[]) {
      const daPersona = itens.filter((it) => it.captura.perfil === persona);
      if (!daPersona.length) continue;
      let sessao: EstadoSessao;
      try {
        sessao = await entrar(nav, base, persona);
      } catch (e) {
        for (const it of daPersona) anotar(it, false, primeiraLinha(e));
        continue;
      }
      for (const tela of Object.keys(TELAS) as Tela[]) {
        const daTela = daPersona.filter((it) => telaDe(it.captura) === tela);
        if (!daTela.length) continue;
        const ctx = await nav.newContext({ ...CONTEXTO_BASE, ...TELAS[tela], storageState: sessao });
        try {
          await ctx.addInitScript(SCRIPT_TEMA_CLARO);
          for (const it of daTela) {
            const p = await ctx.newPage();
            try {
              const png = await fotografar(p, base, it.captura);
              anotar(it, true, await gravarWebp(png, it.captura.arquivo, pasta));
            } catch (e) {
              anotar(it, false, primeiraLinha(e));
            } finally {
              await p.close().catch(() => {});
            }
          }
        } finally {
          await ctx.close().catch(() => {});
        }
      }
    }
  } finally {
    await nav.close().catch(() => {});
  }
  return resultados;
}

// ---------------------------------------------------------------------------------------------
// Linha de comando

const USO = `Capturas de tela do manual (public/ajuda).
Uso: npm run manual:capturas -- [--base http://localhost:3000] [--so serraria/] [--listar] [--forcar]
  --base     servidor (padrão: MANUAL_BASE ou http://localhost:3000)
  --so       só os arquivos que contêm o texto (pode repetir ou separar por vírgula)
  --listar   só lista as capturas do manual, sem abrir o navegador
  --forcar   aceita servidor fora deste computador (as imagens ficam públicas: só dados de demonstração)
Senhas: MANUAL_SENHA_<PERSONA> (MANUAL_SENHA_ADMIN para "admin"); logins: MANUAL_LOGIN_<PERSONA>.`;

/** MANUAL_* do .env.local/.env, sem passar por cima do que já está no ambiente. */
function lerVariaveisDoManual() {
  for (const nome of [".env.local", ".env"]) {
    const caminho = join(RAIZ, nome);
    if (!existsSync(caminho)) continue;
    try {
      for (const [k, v] of Object.entries(parseEnv(readFileSync(caminho, "utf8")))) {
        if (k.startsWith("MANUAL_") && v !== undefined && process.env[k] === undefined) process.env[k] = v;
      }
    } catch {}
  }
}

function servidorLocal(u: URL) {
  const h = u.hostname.replace(/^\[|\]$/g, "");
  return h === "localhost" || h.endsWith(".localhost") || h === "::1" || /^127(\.\d{1,3}){3}$/.test(h);
}

/** Imagens em public/ajuda que nenhuma captura do manual cita mais. */
function imagensSemUso(itens: ItemCaptura[]) {
  const citadas = new Set(itens.map((i) => i.captura.arquivo));
  const sobras: string[] = [];
  const andar = (pasta: string) => {
    for (const nome of readdirSync(pasta)) {
      const caminho = join(pasta, nome);
      if (statSync(caminho).isDirectory()) andar(caminho);
      else if (nome.endsWith(".webp")) {
        const arquivo = relative(PASTA_IMAGENS, caminho).split(sep).join("/");
        if (!citadas.has(arquivo)) sobras.push(arquivo);
      }
    }
  };
  if (existsSync(PASTA_IMAGENS)) andar(PASTA_IMAGENS);
  return sobras.sort();
}

function linha(r: Resultado) {
  const quem = `${r.perfil} · ${r.tela}`;
  return r.ok ? `  ok      ${r.arquivo.padEnd(40)} ${quem} · ${r.detalhe}` : `  FALHOU  ${r.arquivo.padEnd(40)} ${quem} — ${r.detalhe}\n          em ${r.onde}`;
}

async function principal(): Promise<number> {
  let valores: { base?: string; so?: string[]; forcar?: boolean; listar?: boolean; ajuda?: boolean };
  try {
    valores = parseArgs({
      options: {
        base: { type: "string" },
        so: { type: "string", multiple: true },
        forcar: { type: "boolean" },
        listar: { type: "boolean" },
        ajuda: { type: "boolean", short: "h" },
      },
      strict: true,
      allowPositionals: false,
    }).values;
  } catch (e) {
    console.error(`${primeiraLinha(e)}\n\n${USO}`);
    return 2;
  }
  if (valores.ajuda) {
    console.log(USO);
    return 0;
  }
  lerVariaveisDoManual();

  let base: URL;
  try {
    base = new URL(valores.base ?? process.env.MANUAL_BASE ?? "http://localhost:3000");
    if (base.protocol !== "http:" && base.protocol !== "https:") throw new Error();
  } catch {
    console.error(`Endereço inválido: ${valores.base ?? process.env.MANUAL_BASE}`);
    return 2;
  }

  const todas = capturasDoManual();
  const filtros = (valores.so ?? []).flatMap((s) => s.split(",")).map((s) => s.trim()).filter(Boolean);
  const escolhidas = filtros.length ? todas.filter((it) => filtros.some((f) => it.captura.arquivo.includes(f))) : todas;
  if (!todas.length) {
    console.log('O manual ainda não tem capturas (blocos { tipo: "imagem" } em src/lib/manual).');
    return 0;
  }
  if (!escolhidas.length) {
    console.error(`Nenhuma captura com "${filtros.join('", "')}". Arquivos do manual:\n  ${[...new Set(todas.map((i) => i.captura.arquivo))].join("\n  ")}`);
    return 1;
  }
  const { validas, falhas } = conferirCapturas(escolhidas);

  if (valores.listar) {
    for (const it of validas) {
      const c = it.captura;
      const acoes = c.acoes?.length ? ` · ${c.acoes.map(descreverAcao).join(" → ")}` : "";
      console.log(`  ${c.arquivo.padEnd(40)} ${c.perfil} · ${telaDe(c)} · ${c.rota}${acoes}\n  ${"".padEnd(40)} em ${it.onde}`);
    }
    for (const f of falhas) console.log(linha(f));
    console.log(`\n${validas.length} captura(s)${falhas.length ? `, ${falhas.length} com erro` : ""}.`);
    return falhas.length ? 1 : 0;
  }

  if (!servidorLocal(base) && !valores.forcar) {
    console.error(
      `Recusado: ${base.origin} não é um servidor local. As capturas viram arquivos públicos e só podem mostrar ` +
        "os dados de demonstração (SEED_DEMO=1). Use um servidor local ou, se tiver certeza, --forcar.",
    );
    return 2;
  }
  if (!servidorLocal(base)) console.warn(`Atenção: fotografando ${base.origin} (--forcar). Confira se são só dados de demonstração.`);

  try {
    const r = await fetch(new URL("/login", base), { redirect: "manual", signal: AbortSignal.timeout(15_000) });
    await r.body?.cancel();
  } catch (e) {
    console.error(`O servidor não respondeu em ${base.origin} (${primeiraLinha(e)}). Suba com: npm run build && npm start`);
    return 1;
  }

  console.log(`Capturas do manual: ${validas.length} tela(s) de ${base.origin} → ${relative(RAIZ, PASTA_IMAGENS) || "."}`);
  for (const f of falhas) console.log(linha(f));
  let resultados: Resultado[];
  try {
    resultados = [...falhas, ...(await gerarCapturas(validas, { base, aoTerminar: (r) => console.log(linha(r)) }))];
  } catch (e) {
    console.error(`\n${primeiraLinha(e)}`);
    return 1;
  }

  const ok = resultados.filter((r) => r.ok).length;
  const ruins = resultados.filter((r) => !r.ok);
  console.log(`\n${ok} ok${ruins.length ? `, ${ruins.length} com falha` : ""}.`);
  if (ruins.length) console.log(`Com falha:\n${ruins.map(linha).join("\n")}\nRefaça só essas com --so <arquivo>.`);
  if (!filtros.length) {
    const sobras = imagensSemUso(todas);
    if (sobras.length) console.log(`\nImagens em public/ajuda que o manual não usa mais (apague se não precisar):\n  ${sobras.join("\n  ")}`);
  }
  return ruins.length ? 1 : 0;
}

// Só roda quando chamado direto (o arquivo também pode ser importado, ex.: por um teste)
if (/capturas-manual\.[cm]?[jt]s$/.test(process.argv[1] ?? "")) {
  principal().then(
    (codigo) => process.exit(codigo),
    (e) => {
      console.error(e);
      process.exit(1);
    },
  );
}
