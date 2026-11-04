import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/** Tolerância para considerar o volume atingido (diferença de medição/arredondamento). */
export const TOLERANCIA_PEDIDO = 0.98;

export type SituacaoPedido = {
  id: string;
  numero: string;
  cliente: string;
  destino: string | null;
  status: "ABERTO" | "CONCLUIDO";
  volumeM3: number | null;
  prazo: Date | null;
  /** m³ serrado nos lotes do pedido */
  serrado: number;
  /** m³ em pacotes, por situação */
  verde: number;
  naEstufa: number;
  seco: number;
  expedido: number;
  pacotes: number;
  /** volume combinado − expedido (null sem volume) */
  saldo: number | null;
  /** fração expedida do volume (0–1; null sem volume) */
  atendido: number | null;
  /** pronto para expedir: secos cobrem o que falta (ou, sem volume, tudo o que não saiu está seco) */
  pronto: boolean;
};

/** Situação de cada pedido: serrado, empacotado, seco, expedido e saldo. */
export async function situacaoPedidos(where: Prisma.PedidoWhereInput = {}): Promise<SituacaoPedido[]> {
  const pedidos = await db.pedido.findMany({
    where,
    orderBy: [{ status: "asc" }, { prazo: { sort: "asc", nulls: "last" } }, { criadoEm: "desc" }],
    include: {
      lotes: { select: { itens: { select: { m3: true } } } },
      pacotes: { where: { status: { not: "CANCELADO" } }, select: { status: true, m3: true } },
    },
  });
  return pedidos.map((p) => {
    const soma = (st: string) => p.pacotes.filter((x) => x.status === st).reduce((t, x) => t + x.m3, 0);
    const verde = soma("VERDE");
    const naEstufa = soma("EM_ESTUFA");
    const seco = soma("SECO");
    const expedido = soma("EXPEDIDO");
    const saldo = p.volumeM3 != null ? Math.max(0, p.volumeM3 - expedido) : null;
    const pronto =
      seco > 0 && (saldo != null ? seco >= saldo * TOLERANCIA_PEDIDO : verde === 0 && naEstufa === 0);
    return {
      id: p.id,
      numero: p.numero,
      cliente: p.cliente,
      destino: p.destino,
      status: p.status,
      volumeM3: p.volumeM3,
      prazo: p.prazo,
      serrado: p.lotes.reduce((t, l) => t + l.itens.reduce((x, i) => x + i.m3, 0), 0),
      verde,
      naEstufa,
      seco,
      expedido,
      pacotes: p.pacotes.length,
      saldo,
      atendido: p.volumeM3 ? Math.min(1, expedido / p.volumeM3) : null,
      pronto,
    };
  });
}
