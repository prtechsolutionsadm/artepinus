// Fila de lançamentos feitos sem internet (IndexedDB, no navegador): requisições
// (manutenção) e os apontamentos da produção (carga de toras, lote da serraria, inventário).

/** Lançamentos da produção que podem ser feitos sem internet (ver /api/offline). */
export type TipoEnvio = "carga" | "lote" | "estoque" | "parada";

export type ItemFila = {
  chave: string; // uuid, também vira chaveOffline no servidor
  criadoEm: string;
  titulo: string;
  campos: Record<string, string>;
  fotos: { nome: string; tipo: string; dados: Blob }[];
  tentativas: number;
  erro?: string;
  /** Apontamento da produção (sem `tipo` é uma requisição de manutenção). */
  tipo?: TipoEnvio;
  dados?: Record<string, unknown>;
  /** Quem lançou: num aparelho compartilhado, só esse usuário envia (sem isso: itens antigos). */
  usuarioId?: string;
  usuarioNome?: string;
};

const BANCO = "artepinus-offline";
const LOJA = "fila";
export const EVENTO_FILA = "artepinus:fila";

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BANCO, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(LOJA, { keyPath: "chave" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function transacao<T>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOJA, modo);
    const req = fn(tx.objectStore(LOJA));
    tx.oncomplete = () => (db.close(), resolve(req.result));
    tx.onerror = () => (db.close(), reject(tx.error));
  });
}

const avisar = () => window.dispatchEvent(new Event(EVENTO_FILA));

/** Usuário logado neste aparelho (definido pelo SincronizadorOffline). */
let dono: { id: string; nome: string } | undefined;

export function definirDonoFila(id: string, nome: string) {
  dono = { id, nome };
}

const doDono = () => (dono ? { usuarioId: dono.id, usuarioNome: dono.nome } : {});

export async function enfileirar(form: FormData) {
  const campos: Record<string, string> = {};
  const fotos: ItemFila["fotos"] = [];
  for (const [k, v] of form.entries()) {
    if (v instanceof File) {
      if (k === "fotos" && v.size > 0) fotos.push({ nome: v.name, tipo: v.type, dados: v });
    } else campos[k] = v;
  }
  const item: ItemFila = {
    chave: crypto.randomUUID(),
    criadoEm: new Date().toISOString(),
    titulo: campos.titulo ?? "Requisição",
    campos,
    fotos,
    tentativas: 0,
    ...doDono(),
  };
  await transacao("readwrite", (s) => s.put(item));
  avisar();
  return item;
}

/** Guarda um apontamento no aparelho para enviar quando a internet voltar. */
async function guardarEnvio(tipo: TipoEnvio, titulo: string, dados: Record<string, unknown>) {
  const chave = crypto.randomUUID();
  const item: ItemFila = { chave, criadoEm: new Date().toISOString(), titulo, campos: {}, fotos: [], tentativas: 0, tipo, dados: { ...dados, chaveOffline: chave }, ...doDono() };
  await transacao("readwrite", (s) => s.put(item));
  avisar();
  return item;
}

/** Erro de rede (sem internet) ao chamar o servidor. */
export function semConexao(e: unknown) {
  return !navigator.onLine || e instanceof TypeError || (e instanceof Error && /fetch|network|Failed to/i.test(e.message));
}

/** Sem resposta nesse tempo (sinal fraco), o lançamento vai para a fila. */
const LIMITE_ENVIO_MS = 20_000;
class TempoEsgotado extends Error {}

/** Prazo para os envios da fila (onde o navegador suporta). */
const prazo = (ms: number) => (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(ms) : undefined);

/**
 * Envia agora; sem internet (ou se a conexão cair no meio ou demorar demais), guarda no aparelho.
 * Retorna o resultado do servidor ou `{ guardado: true }`.
 */
export async function enviarOuGuardar<R>(tipo: TipoEnvio, titulo: string, dados: Record<string, unknown>, enviar: (d: Record<string, unknown>) => Promise<R>): Promise<R | { guardado: true }> {
  if (!navigator.onLine) {
    await guardarEnvio(tipo, titulo, dados);
    return { guardado: true };
  }
  // A chave vai junto também no envio direto: se a resposta se perder (ou chegar depois do
  // prazo), o reenvio da fila não duplica
  const comChave = { ...dados, chaveOffline: crypto.randomUUID() };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeitar) => {
    timer = setTimeout(() => rejeitar(new TempoEsgotado()), LIMITE_ENVIO_MS);
  });
  try {
    return await Promise.race([enviar(comChave), limite]);
  } catch (e) {
    if (!(e instanceof TempoEsgotado) && !semConexao(e)) throw e;
    const item: ItemFila = { chave: comChave.chaveOffline, criadoEm: new Date().toISOString(), titulo, campos: {}, fotos: [], tentativas: 0, tipo, dados: comChave, ...doDono() };
    await transacao("readwrite", (s) => s.put(item));
    avisar();
    return { guardado: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function listarFila(): Promise<ItemFila[]> {
  try {
    const itens = await transacao<ItemFila[]>("readonly", (s) => s.getAll() as IDBRequest<ItemFila[]>);
    return itens.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  } catch {
    return [];
  }
}

async function remover(chave: string) {
  await transacao("readwrite", (s) => s.delete(chave));
}

async function salvar(item: ItemFila) {
  await transacao("readwrite", (s) => s.put(item));
}

/** Item deste usuário (ou antigo, sem dono): é o que o Sair dele apaga do aparelho. */
export function doUsuario(item: ItemFila, usuarioId: string) {
  return !item.usuarioId || item.usuarioId === usuarioId;
}

/** Ao sair: apaga só os lançamentos de quem está saindo (e os antigos sem dono); os de outros usuários esperam o login deles. */
export async function limparFila(usuarioId: string) {
  try {
    const chaves = (await listarFila()).filter((i) => doUsuario(i, usuarioId)).map((i) => i.chave);
    if (!chaves.length) return;
    const db = await abrir();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LOJA, "readwrite");
      const loja = tx.objectStore(LOJA);
      for (const chave of chaves) loja.delete(chave);
      tx.oncomplete = () => (db.close(), resolve());
      tx.onerror = () => (db.close(), reject(tx.error));
    });
    avisar();
  } catch {}
}

/** Apaga as telas guardadas pelo service worker (têm dados do usuário); não depende do SW controlar a aba. */
export async function limparPaginasGuardadas() {
  try {
    if (!("caches" in window)) return;
    const chaves = await caches.keys();
    await Promise.all(chaves.filter((k) => k.startsWith("artepinus-paginas")).map((k) => caches.delete(k)));
  } catch {}
}

/** Item que não vai: recusado pelo servidor (espera o usuário) ou lançado por outro usuário. */
function esperando(item: ItemFila) {
  return !!item.erro || (!!item.usuarioId && item.usuarioId !== dono?.id);
}

let enviando = false;

/** Envia a fila para o servidor. Retorna quantas foram enviadas. */
export async function sincronizarFila(): Promise<{ enviadas: number; restantes: number }> {
  if (enviando || !navigator.onLine) return { enviadas: 0, restantes: (await listarFila()).length };
  enviando = true;
  let enviadas = 0;
  try {
    for (const item of await listarFila()) {
      if (esperando(item)) continue;
      let r: Response;
      try {
        if (item.tipo) {
          // Apontamento da produção: JSON para /api/offline
          r = await fetch("/api/offline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipo: item.tipo, dados: item.dados }),
            credentials: "same-origin",
            signal: prazo(30_000),
          });
        } else {
          const form = new FormData();
          for (const [k, v] of Object.entries(item.campos)) form.append(k, v);
          form.set("chaveOffline", item.chave);
          form.set("registradaEm", item.criadoEm);
          item.fotos.forEach((f) => form.append("fotos", new File([f.dados], f.nome, { type: f.tipo })));
          // Com fotos o envio demora mais
          r = await fetch("/api/requisicoes/offline", { method: "POST", body: form, credentials: "same-origin", signal: prazo(120_000) });
        }
      } catch {
        break; // caiu a conexão de novo (ou o servidor não respondeu a tempo)
      }
      if (r.ok) {
        await remover(item.chave);
        enviadas++;
      } else if (r.status === 422 || r.status === 403) {
        // Recusado: não vai passar numa nova tentativa sozinho. Guarda o motivo para o usuário ver
        // e só reenvia quando ele pedir (Tentar de novo)
        const motivo = (await r.json().catch(() => ({}))).erro;
        await salvar({ ...item, tentativas: item.tentativas + 1, erro: motivo ?? (r.status === 403 ? "Sem acesso" : "Dados inválidos") });
      } else {
        await salvar({ ...item, tentativas: item.tentativas + 1 });
        if (r.status === 401) break; // sessão expirou: espera novo login
      }
    }
  } finally {
    enviando = false;
    avisar();
  }
  return { enviadas, restantes: (await listarFila()).length };
}

export async function descartarDaFila(chave: string) {
  await remover(chave);
  avisar();
}

/** Tira o motivo da recusa: o item volta a ser enviado na próxima sincronização. */
export async function tentarDeNovo(chave: string) {
  const item = await transacao<ItemFila | undefined>("readonly", (s) => s.get(chave) as IDBRequest<ItemFila | undefined>);
  if (!item) return;
  await salvar({ ...item, erro: undefined });
  avisar();
}
