import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BotaoPdfRomaneio } from "@/components/producao/BotaoPdfRomaneio";
import {
  BotaoDeclaracaoOrigem,
  type DadosDeclaracaoOrigem,
} from "@/components/producao/BotaoDeclaracaoOrigem";
import { urlBase } from "@/lib/qr";
import { origemDosPacotes } from "@/lib/rastreio-dados";
import { formatarData, inteiroPositivo } from "@/lib/constantes";
import { db } from "@/lib/db";
import { fmtM3, fmtNum } from "@/lib/producao";
import { codigoPacote, codigoRomaneio } from "@/lib/rastreio";
import { exigirProducao } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ numero: string }>;
}): Promise<Metadata> {
  const n = inteiroPositivo((await params).numero);
  return {
    title: n ? codigoRomaneio(n) : "Romaneio",
  };
}

/** O romaneio da carga: motorista, placas, pedidos e a lista de pacotes. Baixa em PDF para ir com o motorista. */
export default async function RomaneioPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  await exigirProducao();
  const numero = inteiroPositivo((await params).numero);
  if (!numero) notFound();
  const r = await db.romaneio.findUnique({
    where: { numero },
    include: {
      criadoPor: { select: { nome: true } },
      pacotes: {
        orderBy: [{ pedidoId: "asc" }, { numero: "asc" }],
        include: {
          pedido: { select: { numero: true, cliente: true, destino: true } },
        },
      },
    },
  });
  if (!r) notFound();
  const pedidos = [
    ...new Map(
      r.pacotes
        .filter((p) => p.pedido)
        .map((p) => [p.pedido!.numero, p.pedido!]),
    ).values(),
  ];
  const placas = [r.placa, r.placaJulieta].filter(Boolean).join(" + ") || null;
  const totPecas = r.pacotes.reduce((t, p) => t + p.pecas, 0);
  const totM3 = r.pacotes.reduce((t, p) => t + p.m3, 0);
  const bit = (p: {
    espessura: number;
    largura: number;
    comprimento: number;
  }) => `${p.espessura} × ${p.largura} × ${p.comprimento}`;
  // Declaração de origem: origem florestal, serragem e secagem dos pacotes da carga
  const origem = await origemDosPacotes(r.pacotes.map((p) => p.id));
  const base = await urlBase();
  const declaracao: DadosDeclaracaoOrigem = {
    romaneio: codigoRomaneio(r.numero),
    data: r.criadoEm.toISOString(),
    notaFiscal: r.notaFiscal,
    clientes: pedidos
      .map((p) => p.cliente)
      .filter((v, i, a) => a.indexOf(v) === i),
    destinos: pedidos
      .map((p) => p.destino)
      .filter((v): v is string => !!v)
      .filter((v, i, a) => a.indexOf(v) === i),
    florestas: origem.florestas.map((f) => ({
      nome: f.nome,
      local: [f.municipio, f.uf].filter(Boolean).join("/") || null,
      especie: f.especie,
    })),
    toras: origem.toras.map((d) => d.toISOString()),
    dias: origem.dias.map((d) => d.toISOString()),
    ciclos: origem.ciclos.map((c) => ({
      estufa: c.estufa,
      numero: c.numero,
      entrada: c.entrada.toISOString(),
      saida: c.saida?.toISOString() ?? null,
      umidadeFinal: c.umidadeFinal,
    })),
    pacotes: r.pacotes.map((p) => ({
      codigo: codigoPacote(p.numero),
      bitola: bit(p),
      classe: p.classe,
      pecas: p.pecas,
      m3: p.m3,
      secagem: origem.porPacote.get(p.id)?.secagem ?? null,
      link: `${base}/p/${p.codigoPublico ?? p.numero}`,
    })),
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/producao/romaneios"
        className="mb-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
      >
        <ArrowLeft className="h-4 w-4" /> Romaneios
      </Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">
            Romaneio de expedição
          </p>
          <h1 className="font-mono text-3xl font-bold tracking-tight">
            {codigoRomaneio(r.numero)}
          </h1>
          <p className="text-sm text-stone-500">
            {formatarData(r.criadoEm, true)} · por {r.criadoPor.nome}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotaoDeclaracaoOrigem dados={declaracao} lang="pt" />
          <BotaoDeclaracaoOrigem dados={declaracao} lang="en" />
          <BotaoPdfRomaneio
            dados={{
              codigo: codigoRomaneio(r.numero),
              data: formatarData(r.criadoEm, true),
              motorista: r.motorista,
              placas,
              responsavel: r.criadoPor.nome,
              observacoes: r.observacoes,
              notaFiscal: r.notaFiscal,
              chaveNfe: r.chaveNfe,
              pedidos: pedidos.map((p) => ({
                numero: p.numero,
                cliente: p.cliente,
                destino: p.destino,
              })),
              pacotes: r.pacotes.map((p) => ({
                codigo: codigoPacote(p.numero),
                pedido: p.pedido?.numero ?? "",
                bitola: bit(p),
                classe: p.classe,
                pecas: p.pecas,
                m3: p.m3,
              })),
            }}
          />
        </div>
      </div>

      {origem.semOrigem.length > 0 && (
        // Aviso só para a equipe: a declaração cita apenas as florestas encontradas
        <div
          role="status"
          className="mb-5 space-y-1 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          <p>
            <b>
              Origem florestal não vinculada em{" "}
              {fmtNum(origem.semOrigem.length)} de {fmtNum(r.pacotes.length)}{" "}
              pacote(s).
            </b>{" "}
            A declaração de origem cita só as florestas encontradas. Antes de
            emitir:
          </p>
          {origem.semCarga.length > 0 && (
            <p>
              <span className="font-mono">
                {origem.semCarga.map((n) => codigoPacote(n)).join(", ")}
              </span>
              : ligue os boletins ao ciclo de estufa e as cargas de toras ao
              boletim.
            </p>
          )}
          {origem.cargaSemFloresta.length > 0 && (
            <p>
              <span className="font-mono">
                {origem.cargaSemFloresta.map((n) => codigoPacote(n)).join(", ")}
              </span>
              : as cargas de toras ligadas não têm floresta — informe a
              floresta em{" "}
              <Link
                href="/producao/toras"
                className="font-medium underline underline-offset-2"
              >
                Recebimento de toras
              </Link>{" "}
              (editar a carga).
            </p>
          )}
        </div>
      )}

      <dl className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-stone-200 bg-stone-200 sm:grid-cols-4">
        {[
          ["Motorista", r.motorista ?? "—"],
          ["Placas", placas ?? "—"],
          ["Nota fiscal", r.notaFiscal ?? "—"],
          ["Pacotes", `${fmtNum(r.pacotes.length)} · ${fmtM3(totM3, 2)}`],
        ].map(([a, b]) => (
          <div key={a} className="min-w-0 bg-white px-4 py-3">
            <dt className="text-xs text-stone-500">{a}</dt>
            <dd className="truncate font-semibold">{b}</dd>
          </div>
        ))}
      </dl>

      {pedidos.length > 0 && (
        <section className="cartao mb-5 p-0">
          <h2 className="border-b border-stone-100 px-4 py-3 font-semibold">
            Pedidos
          </h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {pedidos.map((p) => (
              <li key={p.numero} className="flex flex-wrap gap-x-3 px-4 py-2.5">
                <span className="font-mono font-semibold">{p.numero}</span>
                <span>{p.cliente}</span>
                <span className="text-stone-500">{p.destino ?? ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="cartao overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-stone-200 text-left text-xs text-stone-500">
            <tr>
              <th className="px-4 py-2 font-semibold">Pacote</th>
              <th className="px-3 py-2 font-semibold">Pedido</th>
              <th className="px-3 py-2 font-semibold">Bitola (mm)</th>
              <th className="px-3 py-2 font-semibold">Classe</th>
              <th className="px-3 py-2 text-right font-semibold">Peças</th>
              <th className="px-4 py-2 text-right font-semibold">m³</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {r.pacotes.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">
                  <Link
                    href={`/producao/pacotes/${p.numero}`}
                    className="font-mono font-semibold text-marca-700 hover:underline"
                  >
                    {codigoPacote(p.numero)}
                  </Link>
                </td>
                <td className="px-3 py-2">{p.pedido?.numero ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums">{bit(p)}</td>
                <td className="px-3 py-2">{p.classe ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmtNum(p.pecas)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {fmtNum(p.m3, 3)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-stone-200 font-semibold">
            <tr>
              <td colSpan={4} className="px-4 py-2">
                Total
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {fmtNum(totPecas)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {fmtNum(totM3, 3)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
      {r.chaveNfe && (
        <p className="mt-4 text-sm text-stone-600">
          Chave da NF-e:{" "}
          <span className="font-mono">
            {r.chaveNfe.replace(/(\d{4})(?=\d)/g, "$1 ")}
          </span>
        </p>
      )}
      {r.observacoes && (
        <p className="mt-2 text-sm text-stone-600">
          Observações: {r.observacoes}
        </p>
      )}
    </div>
  );
}
