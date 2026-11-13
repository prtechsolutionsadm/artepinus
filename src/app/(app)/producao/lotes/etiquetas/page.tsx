import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { Titulo, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { EMPRESA } from "@/lib/empresa";
import { CLASSE_MADEIRA, classeDoComprimento, fmtM3, fmtNum, formatarDia } from "@/lib/producao";
import { barrasSvg, linkLote, qrSvg } from "@/lib/qr";
import { codigoLote } from "@/lib/rastreio";
import { exigirProducao } from "@/lib/session";
import type { ClasseMadeira } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Etiquetas de lote" };

/** Etiqueta do lote da serraria: código de barras (leitura no chão de fábrica) e QR (sistema). */
export default async function EtiquetasLotePage({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  await exigirProducao();
  const numeros = ((await searchParams).n ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 100);
  const lotes = numeros.length
    ? await db.lote.findMany({
        where: { numero: { in: numeros } },
        orderBy: { numero: "asc" },
        include: { itens: true, pedido: { select: { numero: true, cliente: true } }, boletim: { select: { data: true } } },
      })
    : [];
  const etiquetas = await Promise.all(
    lotes.map(async (l) => ({ ...l, qr: await qrSvg(await linkLote(l.numero)), barras: await barrasSvg(codigoLote(l.numero)) })),
  );

  return (
    <div className="etiquetas">
      <div className="nao-imprimir">
        <Link href="/producao/boletins" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-stone-900">
          <ArrowLeft className="h-4 w-4" /> Serraria
        </Link>
        <Titulo
          subtitulo={
            <>
              Prenda a etiqueta no lote. O código de barras identifica o lote na leitura; o QR abre os detalhes no sistema.
              <span className="nao-imprimir mt-1 block">
                <Link href="/ajuda/problemas#etiquetas" prefetch={false} className="inline-flex items-center gap-1 font-medium text-marca-700 hover:underline">
                  <CircleHelp className="h-4 w-4 shrink-0" aria-hidden /> A etiqueta saiu cortada ou fora do tamanho?
                </Link>
              </span>
            </>
          }
          acao={etiquetas.length > 0 && <BotaoImprimir rotulo="Imprimir" />}
        >
          Etiquetas de lote
        </Titulo>
      </div>
      {etiquetas.length === 0 ? (
        <Vazio>Nenhum lote escolhido.</Vazio>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 print:grid-cols-2 print:gap-0">
          {etiquetas.map((l) => {
            const pecas = l.itens.reduce((t, i) => t + i.pecas, 0);
            const m3 = l.itens.reduce((t, i) => t + i.m3, 0);
            const porClasse = l.itens.reduce<Record<string, number>>((acc, i) => {
              const c = i.classe ?? classeDoComprimento(i.comprimento);
              acc[c] = (acc[c] ?? 0) + i.pecas;
              return acc;
            }, {});
            return (
              <li key={l.id} className="break-inside-avoid rounded-lg border-2 border-dashed border-stone-300 bg-white p-3 print:h-[68mm] print:rounded-none print:border print:p-[4mm]">
                <div className="flex items-start justify-between gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={EMPRESA.logo} alt="" className="h-7 w-auto" />
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold leading-tight">{codigoLote(l.numero)}</div>
                    <div className="text-xs text-stone-600">{formatarDia(l.boletim.data)}</div>
                  </div>
                </div>
                <div className="mt-2 flex gap-3">
                  <div className="w-[28%] shrink-0 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: l.qr }} />
                  <div className="min-w-0 flex-1 text-sm leading-snug">
                    <div className="text-base font-bold">
                      {[...new Set(l.itens.map((i) => `${i.espessura} mm · ${i.larguras ?? i.largura}`))].join(" | ")}
                    </div>
                    <div>
                      {fmtNum(pecas)} peças · {fmtM3(m3, 3)}
                    </div>
                    <div className="text-xs text-stone-600">
                      {(Object.keys(porClasse) as ClasseMadeira[]).map((c) => `${CLASSE_MADEIRA[c].label} ${porClasse[c]}`).join(" · ")}
                    </div>
                    <div className="mt-1 truncate text-xs">
                      Pedido <b>{l.pedido.numero}</b> · {l.pedido.cliente}
                    </div>
                  </div>
                </div>
                <div className="mt-2 [&_svg]:h-12 [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: l.barras }} />
                <div className="text-center font-mono text-xs tracking-widest">{codigoLote(l.numero)}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
