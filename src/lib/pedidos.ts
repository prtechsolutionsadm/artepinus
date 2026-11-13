import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

/** Tolerância para considerar o volume atingido (diferença de medição/arredondamento). */
const TOLERANCIA_PEDIDO = 0.98;

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
  /** pronto para expedir: com volume, enquanto houver saldo e os secos o cobrirem; sem volume, tudo o que não saiu está seco */
  pronto: boolean;
};

/** Situação de cada pedido: serrado, empacotado, seco, expedido e saldo. */
export async function situacaoPedidos(where: Prisma.PedidoWhereInput = {}): Promise<SituacaoPedido[]> {
  const pedidos = await db.pedido.findMany({
    where,
    orderBy: [{ status: "asc" }, { prazo: { sort: "asc", nulls: "last" } }, { criadoEm: "desc" }],
    select: { id: true, numero: true, cliente: true, destino: true, status: true, volumeM3: true, prazo: true },
  });
  if (!pedidos.length) return [];
  const ids = pedidos.map((p) => p.id);
  // Somas no banco: m³ dos pacotes por situação e m³ serrado nos lotes (sem trazer cada item)
  const [porStatus, serrados] = await Promise.all([
    db.pacote.groupBy({
      by: ["pedidoId", "status"],
      where: { pedidoId: { in: ids }, status: { not: "CANCELADO" } },
      _sum: { m3: true },
      _count: true,
    }),
    db.$queryRaw<{ pedidoId: string; m3: number }[]>`
      SELECT l."pedidoId", SUM(i."m3")::float8 AS m3
      FROM "ItemProducao" i JOIN "Lote" l ON l."id" = i."loteId"
      WHERE l."pedidoId" IN (${Prisma.join(ids)})
      GROUP BY l."pedidoId"`,
  ]);
  const serrado = new Map(serrados.map((s) => [s.pedidoId, Number(s.m3) || 0]));
  const pacotes = new Map<string, { m3: Map<string, number>; n: number }>();
  for (const g of porStatus) {
    if (!g.pedidoId) continue;
    const t = pacotes.get(g.pedidoId) ?? { m3: new Map<string, number>(), n: 0 };
    t.m3.set(g.status, g._sum.m3 ?? 0);
    t.n += g._count;
    pacotes.set(g.pedidoId, t);
  }

  return pedidos.map((p) => {
    const pac = pacotes.get(p.id);
    const soma = (st: string) => pac?.m3.get(st) ?? 0;
    const verde = soma("VERDE");
    const naEstufa = soma("EM_ESTUFA");
    const seco = soma("SECO");
    const expedido = soma("EXPEDIDO");
    const saldo = p.volumeM3 != null ? Math.max(0, p.volumeM3 - expedido) : null;
    const pronto =
      seco > 0 &&
      (saldo != null ? saldo > 0 && seco >= saldo * TOLERANCIA_PEDIDO : verde === 0 && naEstufa === 0);
    return {
      id: p.id,
      numero: p.numero,
      cliente: p.cliente,
      destino: p.destino,
      status: p.status,
      volumeM3: p.volumeM3,
      prazo: p.prazo,
      serrado: serrado.get(p.id) ?? 0,
      verde,
      naEstufa,
      seco,
      expedido,
      pacotes: pac?.n ?? 0,
      saldo,
      atendido: p.volumeM3 ? Math.min(1, expedido / p.volumeM3) : null,
      pronto,
    };
  });
}
