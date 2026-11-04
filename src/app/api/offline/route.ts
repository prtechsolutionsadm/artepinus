import { NextRequest, NextResponse } from "next/server";
import { lancarLote, salvarCargaToras, salvarLevantamento, type DadosCargaToras, type DadosLevantamento, type DadosLote } from "@/app/actions/producao";
import { pararMaquina, type DadosParada } from "@/app/actions/paradas";
import { usuarioAtual } from "@/lib/session";

/**
 * Recebe os apontamentos guardados no aparelho enquanto estava sem internet.
 * Cada envio leva a `chaveOffline`, então um reenvio não duplica o lançamento.
 */
export async function POST(req: NextRequest) {
  const eu = await usuarioAtual();
  if (!eu || eu.trocarSenha) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const corpo = (await req.json().catch(() => null)) as { tipo?: string; dados?: Record<string, unknown> } | null;
  if (!corpo?.dados || typeof corpo.dados.chaveOffline !== "string") return NextResponse.json({ erro: "Envio inválido" }, { status: 422 });

  try {
    const r =
      corpo.tipo === "carga"
        ? await salvarCargaToras(corpo.dados as DadosCargaToras)
        : corpo.tipo === "lote"
          ? await lancarLote(corpo.dados as DadosLote)
          : corpo.tipo === "estoque"
            ? await salvarLevantamento(corpo.dados as DadosLevantamento)
            : corpo.tipo === "parada"
              ? await pararMaquina(corpo.dados as DadosParada)
              : { erro: "Tipo de envio desconhecido" };
    if (r.erro) return NextResponse.json({ erro: r.erro }, { status: 422 });
    return NextResponse.json(r);
  } catch (e) {
    console.error("Falha ao sincronizar apontamento offline", e);
    return NextResponse.json({ erro: "Falha ao salvar" }, { status: 500 });
  }
}
