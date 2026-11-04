import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";

// Limite de tentativas de senha (contra programas que testam senhas em sequência).
// Guardado no banco porque na Vercel cada requisição pode cair numa instância diferente.

/** Janela de contagem e tempo de bloqueio. */
const JANELA_MS = 15 * 60 * 1000;

/** Erros permitidos na janela: por login, por endereço IP e para a senha atual na troca de senha. */
export const LIMITE = { login: 5, ip: 20, senha: 5 } as const;

/** IP de quem fez a requisição (na Vercel, o primeiro de x-forwarded-for é o do cliente). */
export async function ipDaRequisicao() {
  const h = await headers();
  return (h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "").trim() || "desconhecido";
}

/** Minutos até liberar (0 = liberado). Bloqueia quando alguma chave estourou o limite na janela. */
export async function minutosBloqueado(regras: { chave: string; max: number }[]) {
  const desde = new Date(Date.now() - JANELA_MS);
  let libera = 0;
  for (const r of regras) {
    const falhas = await db.tentativaLogin.findMany({
      where: { chave: r.chave, criadoEm: { gte: desde } },
      orderBy: { criadoEm: "desc" },
      take: r.max,
      select: { criadoEm: true },
    });
    if (falhas.length >= r.max) libera = Math.max(libera, falhas[falhas.length - 1].criadoEm.getTime() + JANELA_MS);
  }
  return libera ? Math.max(1, Math.ceil((libera - Date.now()) / 60000)) : 0;
}

export async function registrarFalha(chaves: string[]) {
  await db.tentativaLogin.createMany({ data: chaves.map((chave) => ({ chave })) });
  // Limpeza: o que passou de um dia não serve para nada
  if (Math.random() < 0.05) await db.tentativaLogin.deleteMany({ where: { criadoEm: { lt: new Date(Date.now() - 864e5) } } });
}

export async function limparFalhas(chaves: string[]) {
  await db.tentativaLogin.deleteMany({ where: { chave: { in: chaves } } });
}
