import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";

// Limite de tentativas de senha (contra programas que testam senhas em sequência).
// Guardado no banco porque na Vercel cada requisição pode cair numa instância diferente.

/** Janela de contagem e tempo de bloqueio. */
const JANELA_MS = 15 * 60 * 1000;
/** Janela do limite acumulado da recuperação de senha (bate com a limpeza de 1 dia). */
export const JANELA_DIA_MS = 864e5;

/**
 * Erros permitidos na janela: por login, por endereço IP e para a senha atual na troca de senha;
 * `recuperarDia` = respostas erradas por login em 24 h na recuperação pela pergunta de segurança.
 */
export const LIMITE = { login: 5, ip: 20, senha: 5, recuperarDia: 10 } as const;

export type RegraLimite = { chave: string; max: number; janelaMs?: number };

/** IP de quem fez a requisição (na Vercel, o primeiro de x-forwarded-for é o do cliente). */
export async function ipDaRequisicao() {
  const h = await headers();
  return (h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "").trim() || "desconhecido";
}

/**
 * Grava a tentativa ANTES de conferir o limite: assim uma rajada em paralelo não passa inteira pela
 * checagem (no máximo `max` passam). Bloqueada: apaga a própria linha (tentativa recusada não prolonga
 * o bloqueio) e devolve os minutos de espera e a regra que estourou. Liberada: devolve os ids — na falha
 * eles ficam como o registro do erro; no sucesso, chame `descartarTentativa(ids)`.
 */
export async function reservarTentativa(regras: RegraLimite[]): Promise<{ espera: number; ids: string[]; regra?: RegraLimite }> {
  const chaves = [...new Set(regras.map((r) => r.chave))];
  const criadas = await db.tentativaLogin.createManyAndReturn({ data: chaves.map((chave) => ({ chave })), select: { id: true } });
  const ids = criadas.map((c) => c.id);
  const agora = Date.now();
  let libera = 0;
  let regra: RegraLimite | undefined;
  for (const r of regras) {
    const janela = r.janelaMs ?? JANELA_MS;
    // Já inclui a linha recém-criada: passou de `max` = bloqueada
    const linhas = await db.tentativaLogin.findMany({
      where: { chave: r.chave, criadoEm: { gte: new Date(agora - janela) } },
      orderBy: { criadoEm: "desc" },
      take: r.max + 1,
      select: { criadoEm: true },
    });
    if (linhas.length > r.max) {
      // Libera quando a mais antiga das `max` anteriores sair da janela
      const ate = linhas[r.max].criadoEm.getTime() + janela;
      if (ate > libera) {
        libera = ate;
        regra = r;
      }
    }
  }
  // Limpeza: o que passou de um dia não serve para nada
  if (Math.random() < 0.05) await db.tentativaLogin.deleteMany({ where: { criadoEm: { lt: new Date(agora - JANELA_DIA_MS) } } });
  if (!regra) return { espera: 0, ids };
  await descartarTentativa(ids);
  return { espera: Math.max(1, Math.ceil((libera - Date.now()) / 60000)), ids: [], regra };
}

/** Apaga as tentativas reservadas (no sucesso: login certo não conta no limite, nem no do IP). */
export async function descartarTentativa(ids: string[]) {
  if (ids.length) await db.tentativaLogin.deleteMany({ where: { id: { in: ids } } });
}

/** Tentativas da chave dentro da janela (padrão: 15 min). */
export async function contarTentativas(chave: string, janelaMs = JANELA_MS) {
  return db.tentativaLogin.count({ where: { chave, criadoEm: { gte: new Date(Date.now() - janelaMs) } } });
}

export async function limparFalhas(chaves: string[]) {
  await db.tentativaLogin.deleteMany({ where: { chave: { in: chaves } } });
}
