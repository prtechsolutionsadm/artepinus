import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/jwt";

/**
 * Sessão que deixou de valer (senha trocada em outro aparelho, usuário desativado):
 * apaga o cookie e manda para o login. Sem isto, o login (que vê um cookie assinado)
 * e a página (que não acha o usuário) ficariam se redirecionando.
 */
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.nextUrl));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
