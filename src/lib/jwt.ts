import { SignJWT, jwtVerify } from "jose";
import type { Perfil } from "@/generated/prisma/enums";

export const SESSION_COOKIE = "artepinus_sessao";

export type Sessao = {
  userId: string;
  nome: string;
  perfil: Perfil;
  /** versaoSessao do usuário quando entrou: se a senha mudar, a sessão deixa de valer */
  versao: number;
};

function chave() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado");
  // Recusa o valor de exemplo publicado no .env.example (qualquer um poderia assinar sessões)
  if (secret.startsWith("troque-por")) throw new Error("AUTH_SECRET ainda com o valor de exemplo do .env.example (gere com: openssl rand -base64 32)");
  return new TextEncoder().encode(secret);
}

export async function assinarSessao(sessao: Sessao, expira: Date) {
  return new SignJWT(sessao)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expira)
    .sign(chave());
}

export async function lerSessao(token: string | undefined): Promise<Sessao | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(), { algorithms: ["HS256"] });
    return {
      userId: payload.userId as string,
      nome: payload.nome as string,
      perfil: payload.perfil as Perfil,
      versao: typeof payload.versao === "number" ? payload.versao : 0,
    };
  } catch {
    return null;
  }
}
