// Fila de lançamentos feitos sem internet (IndexedDB, no navegador): requisições
// (manutenção) e os apontamentos da produção (carga de toras, lote da serraria, inventário).

/** Lançamentos da produção que podem ser feitos sem internet (ver /api/offline). */
export type TipoEnvio = "carga" | "lote" | "estoque";

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
  };
  await transacao("readwrite", (s) => s.put(item));
  avisar();
  return item;
}

/** Guarda um apontamento no aparelho para enviar quando a internet voltar. */
export async function guardarEnvio(tipo: TipoEnvio, titulo: string, dados: Record<string, unknown>) {
  const chave = crypto.randomUUID();
  const item: ItemFila = { chave, criadoEm: new Date().toISOString(), titulo, campos: {}, fotos: [], tentativas: 0, tipo, dados: { ...dados, chaveOffline: chave } };
  await transacao("readwrite", (s) => s.put(item));
  avisar();
  return item;
}

/** Erro de rede (sem internet) ao chamar o servidor. */
export function semConexao(e: unknown) {
  return !navigator.onLine || e instanceof TypeError || (e instanceof Error && /fetch|network|Failed to/i.test(e.message));
}

/**
 * Envia agora; sem internet (ou se a conexão cair no meio), guarda no aparelho.
 * Retorna o resultado do servidor ou `{ guardado: true }`.
 */
export async function enviarOuGuardar<R>(tipo: TipoEnvio, titulo: string, dados: Record<string, unknown>, enviar: (d: Record<string, unknown>) => Promise<R>): Promise<R | { guardado: true }> {
  if (!navigator.onLine) {
    await guardarEnvio(tipo, titulo, dados);
    return { guardado: true };
  }
  // A chave vai junto também no envio direto: se a resposta se perder, o reenvio não duplica
  const comChave = { ...dados, chaveOffline: crypto.randomUUID() };
  try {
    return await enviar(comChave);
  } catch (e) {
    if (!semConexao(e)) throw e;
    const item: ItemFila = { chave: comChave.chaveOffline as string, criadoEm: new Date().toISOString(), titulo, campos: {}, fotos: [], tentativas: 0, tipo, dados: comChave };
    await transacao("readwrite", (s) => s.put(item));
    avisar();
    return { guardado: true };
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

export async function limparFila() {
  try {
    await transacao("readwrite", (s) => s.clear());
    avisar();
  } catch {}
}

let enviando = false;

/** Envia a fila para o servidor. Retorna quantas foram enviadas. */
export async function sincronizarFila(): Promise<{ enviadas: number; restantes: number }> {
  if (enviando || !navigator.onLine) return { enviadas: 0, restantes: (await listarFila()).length };
  enviando = true;
  let enviadas = 0;
  try {
    for (const item of await listarFila()) {
      if (item.tipo) {
        // Apontamento da produção: JSON para /api/offline
        try {
          const r = await fetch("/api/offline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipo: item.tipo, dados: item.dados }),
            credentials: "same-origin",
          });
          if (r.ok) {
            await remover(item.chave);
            enviadas++;
          } else if (r.status === 422) {
            await salvar({ ...item, tentativas: item.tentativas + 1, erro: (await r.json().catch(() => ({}))).erro ?? "Dados inválidos" });
          } else {
            await salvar({ ...item, tentativas: item.tentativas + 1 });
            if (r.status === 401) break;
          }
        } catch {
          break;
        }
        continue;
      }
      const form = new FormData();
      for (const [k, v] of Object.entries(item.campos)) form.append(k, v);
      form.set("chaveOffline", item.chave);
      form.set("registradaEm", item.criadoEm);
      item.fotos.forEach((f) => form.append("fotos", new File([f.dados], f.nome, { type: f.tipo })));
      try {
        const r = await fetch("/api/requisicoes/offline", { method: "POST", body: form, credentials: "same-origin" });
        if (r.ok) {
          await remover(item.chave);
          enviadas++;
        } else if (r.status === 422) {
          // Dados inválidos não vão passar numa nova tentativa: guarda o motivo para o usuário ver
          await salvar({ ...item, tentativas: item.tentativas + 1, erro: (await r.json().catch(() => ({}))).erro ?? "Dados inválidos" });
        } else {
          await salvar({ ...item, tentativas: item.tentativas + 1 });
          if (r.status === 401) break; // sessão expirou: espera novo login
        }
      } catch {
        break; // caiu a conexão de novo
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
