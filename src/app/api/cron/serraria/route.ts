import { NextRequest, NextResponse } from "next/server";
import { verificarAlertas } from "@/lib/alertas-serraria";

/**
 * Rotina do fim do dia útil (18h de Brasília, seg–sex): avisa se a serraria ficou sem
 * apontamento hoje e repete as verificações de estufa atrasada e pedido pronto.
 * Chamado pelo Cron da Vercel (vercel.json), que envia "Authorization: Bearer $CRON_SECRET".
 */
export async function GET(req: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || req.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  return NextResponse.json(await verificarAlertas({ diaSemApontamento: true }));
}
