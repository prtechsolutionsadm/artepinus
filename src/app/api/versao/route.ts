import { NextResponse } from "next/server";
import { VERSAO } from "@/lib/versao";

export const dynamic = "force-dynamic";

/** Publicação no ar: o app aberto compara com a dele e se atualiza sozinho (AtualizacaoApp). Público, sem dados. */
export function GET() {
  return NextResponse.json({ versao: VERSAO, build: process.env.NEXT_PUBLIC_BUILD }, { headers: { "Cache-Control": "no-store" } });
}
