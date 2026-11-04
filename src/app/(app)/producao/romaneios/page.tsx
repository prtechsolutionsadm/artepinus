import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Titulo, Vazio } from "@/components/ui";
import { formatarData } from "@/lib/constantes";
import { db } from "@/lib/db";
import { fmtM3 } from "@/lib/producao";
import { codigoRomaneio } from "@/lib/rastreio";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Romaneios" };

/** Romaneios de expedição: um por saída de caminhão. */
export default async function RomaneiosPage() {
  await exigirProducao();
  const romaneios = await db.romaneio.findMany({
    orderBy: { numero: "desc" },
    take: 200,
    include: { pacotes: { select: { m3: true, pedido: { select: { numero: true, cliente: true } } } } },
  });
  return (
    <div className="mx-auto max-w-4xl">
      <Titulo subtitulo="O documento de cada carga expedida, com motorista, placas e pacotes. Gerado ao registrar a saída em Pacotes.">Romaneios</Titulo>
      {romaneios.length === 0 ? (
        <Vazio>Nenhum romaneio ainda. Em Pacotes, marque os pacotes e toque em Registrar saída.</Vazio>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200 bg-white">
          {romaneios.map((r) => {
            const clientes = [...new Set(r.pacotes.map((p) => p.pedido?.cliente).filter(Boolean))];
            return (
              <li key={r.id}>
                <Link href={`/producao/romaneios/${r.numero}`} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-mono font-semibold">{codigoRomaneio(r.numero)}</span>
                      <span className="text-sm text-stone-500">{formatarData(r.criadoEm, true)}</span>
                    </div>
                    <div className="truncate text-sm text-stone-600">
                      {[r.motorista, [r.placa, r.placaJulieta].filter(Boolean).join(" + "), clientes.join(", ")].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <div className="font-semibold">{r.pacotes.length} pacote(s)</div>
                    <div className="text-stone-500">{fmtM3(r.pacotes.reduce((t, p) => t + p.m3, 0), 2)}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
