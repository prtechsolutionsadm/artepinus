import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Factory, Flame, Globe, Package, Printer, TreePine, Truck, Warehouse, type LucideIcon } from "lucide-react";
import { AcoesPacote } from "@/components/producao/AcoesPacote";
import { Badge } from "@/components/ui";
import { formatarData, formatarDuracao, minutosEntre } from "@/lib/constantes";
import { podeProducao } from "@/lib/permissoes";
import { CLASSE_DIAMETRO, MERCADO, calcularKpis, fmtM3, fmtNum, formatarDia } from "@/lib/producao";
import { STATUS_PACOTE, TIPO_EVENTO, bitola, codigoCarga, codigoPacote, codigoRomaneio } from "@/lib/rastreio";
import { db } from "@/lib/db";
import { ciclosAtivos, rastrearPacote } from "@/lib/rastreio-dados";
import { exigirProducao } from "@/lib/session";

export async function generateMetadata({ params }: { params: Promise<{ numero: string }> }): Promise<Metadata> {
  const n = Number((await params).numero);
  return { title: Number.isInteger(n) && n > 0 ? codigoPacote(n) : "Pacote" };
}

function Etapa({
  Icone,
  titulo,
  cor,
  vazio,
  children,
  ultima,
}: {
  Icone: LucideIcon;
  titulo: string;
  cor: string;
  vazio?: string | false;
  children?: React.ReactNode;
  ultima?: boolean;
}) {
  return (
    <li className="relative flex gap-4 pb-6">
      {!ultima && <span className="absolute left-5 top-11 -bottom-1 w-0.5 bg-stone-200" aria-hidden />}
      <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-sm" style={{ background: vazio ? "#d6d3d1" : cor }}>
        <Icone className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 pt-1.5">
        <h3 className={`font-semibold ${vazio ? "text-stone-400" : ""}`}>{titulo}</h3>
        {vazio ? <p className="mt-0.5 text-sm text-stone-400">{vazio}</p> : <div className="mt-2 space-y-2">{children}</div>}
      </div>
    </li>
  );
}

function Dados({ itens }: { itens: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-stone-50 p-3 text-sm sm:grid-cols-3">
      {itens
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([r, v]) => (
          <div key={r} className="min-w-0 [overflow-wrap:anywhere]">
            <dt className="text-xs text-stone-500">{r}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

/** A história completa do pacote: destino do QR Code da etiqueta. */
export default async function PacotePage({ params }: { params: Promise<{ numero: string }> }) {
  const eu = await exigirProducao();
  const numero = Number((await params).numero);
  if (!Number.isInteger(numero) || numero <= 0) notFound();
  const r = await rastrearPacote(numero);
  if (!r) notFound();
  const { pacote: p, dias, cargas, florestas } = r;
  const lancar = podeProducao(eu, "lancar");
  const ciclos = lancar && p.status === "VERDE" ? await ciclosAtivos() : [];
  const motoristas =
    lancar && (p.status === "VERDE" || p.status === "SECO")
      ? await db.motorista.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true, placaCaminhao: true, placaJulieta: true } })
      : [];
  const romaneio = p.romaneioId ? await db.romaneio.findUnique({ where: { id: p.romaneioId }, select: { numero: true, motorista: true, placa: true, placaJulieta: true } }) : null;
  const st = STATUS_PACOTE[p.status];
  const conformes = p.ciclo?.checklist.filter((i) => i.conforme === true).length ?? 0;
  const naoConformes = p.ciclo?.checklist.filter((i) => i.conforme === false).length ?? 0;
  const totalPeso = cargas.reduce((t, c) => t + (c.pesoT ?? 0), 0);
  const expedido = p.eventos.find((e) => e.tipo === "EXPEDIDO");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="cartao">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-stone-500">
              <Package className="h-4 w-4" /> Pacote de madeira serrada
            </div>
            <h1 className="mt-1 font-mono text-3xl font-bold tracking-tight">{codigoPacote(p.numero)}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge cor={st.cor}>{st.label}</Badge>
            <Link href={`/producao/pacotes/etiquetas?n=${p.numero}`} className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:underline">
              <Printer className="h-4 w-4" /> Etiqueta
            </Link>
            <Link href={`/p/${p.numero}?publico=1`} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-marca-700 hover:underline">
              <Globe className="h-4 w-4" /> Como o cliente vê
            </Link>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Bitola", bitola(p)],
            ["Peças", fmtNum(p.pecas)],
            ["Volume", fmtM3(p.m3, 3)],
            ["Classe", p.classe ?? "—"],
            ["Mercado", MERCADO[p.mercado].replace("Mercado ", "")],
            ["Pedido", p.pedido ? `${p.pedido.numero} · ${p.pedido.cliente}` : "—"],
            ["Destino", p.pedido?.destino ?? "—"],
            ["Formado em", formatarData(p.criadoEm, true)],
          ].map(([rot, v]) => (
            <div key={rot} className="min-w-0">
              <dt className="text-xs text-stone-500">{rot}</dt>
              <dd className="truncate font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        {p.observacoes && <p className="mt-3 text-sm text-stone-600">{p.observacoes}</p>}
      </section>

      {lancar && <AcoesPacote numero={p.numero} status={p.status} ciclos={ciclos} podeGerir={podeProducao(eu, "gerir")} pedido={p.pedido ? `${p.pedido.numero} · ${p.pedido.cliente}` : null} motoristas={motoristas} />}

      <section className="cartao">
        <h2 className="mb-1 font-semibold">Da floresta ao pacote</h2>
        <p className="mb-5 text-sm text-stone-500">
          A madeira de vários dias e cargas se mistura no processo: a origem mostra todos os lotes que formaram este pacote.
        </p>
        <ol>
          <Etapa Icone={TreePine} titulo="Floresta" cor="#177009" vazio={florestas.length === 0 && (cargas.length ? "As cargas não têm floresta cadastrada." : "Sem cargas de toras ligadas ao dia de serraria.")}>
            {florestas.map((f) => (
              <Dados
                key={f.id}
                itens={[
                  ["Floresta", f.nome],
                  ["Local", [f.municipio, f.uf].filter(Boolean).join("/") || null],
                  ["Espécie", f.especie],
                ]}
              />
            ))}
          </Etapa>

          <Etapa Icone={Truck} titulo="Recebimento das toras" cor="#8a5a2b" vazio={cargas.length === 0 && "Nenhuma carga de toras ligada aos dias de serraria."}>
            <p className="text-sm text-stone-600">
              {cargas.length} carga(s){totalPeso ? ` · ${fmtNum(totalPeso, 1)} t` : ""}
            </p>
            <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 text-sm">
              {cargas.map((c) => (
                <li key={c.id}>
                  <Link href={`/producao/toras/${c.id}`} className="flex flex-wrap items-baseline gap-x-2 px-3 py-2 hover:bg-stone-50">
                    <span className="font-mono text-xs text-stone-500">{codigoCarga(c.numero)}</span>
                    <span className="font-medium">{formatarDia(c.data)}</span>
                    <span className="text-stone-600">
                      {[
                        c.floresta?.nome ?? c.origem,
                        c.fornecedor?.nome,
                        c.pesoT ? `${fmtNum(c.pesoT, 1)} t` : null,
                        c.classeDiametro ? CLASSE_DIAMETRO[c.classeDiametro] : null,
                        c.motorista,
                        [c.placa, c.placaJulieta].filter(Boolean).join(" + ") || null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Etapa>

          <Etapa Icone={Factory} titulo="Serraria" cor="#2a78d6" vazio={dias.length === 0 && "Pacote sem dia de serraria ligado."}>
            <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 text-sm">
              {dias.map((b) => {
                const k = calcularKpis([{ metaM3: 0, horasProgramadas: 0, itens: b.itens, paradas: b.paradas.map((x) => ({ ...x, centro: "OPE" as const })) }]);
                return (
                  <li key={b.id}>
                    <Link href={`/producao/boletins/${b.id}`} className="flex flex-wrap items-baseline gap-x-2 px-3 py-2 hover:bg-stone-50">
                      <span className="font-medium">{formatarDia(b.data, { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                      <span className="text-stone-600">
                        encarregado {b.responsavel.nome} · {fmtM3(k.producaoM3, 1)} serrados · {formatarDuracao(k.minutosParados)} parado
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Etapa>

          <Etapa
            Icone={Flame}
            titulo="Secagem em estufa"
            cor="#eb6834"
            vazio={!p.ciclo && (p.status === "VERDE" ? "Ainda não foi para a estufa." : "Pacote sem secagem registrada (venda verde).")}
          >
            {p.ciclo && (
              <Link href={`/producao/estufas/ciclos/${p.ciclo.id}`} className="block hover:opacity-90">
                <Dados
                  itens={[
                    ["Estufa", `${p.ciclo.estufa.nome}${p.ciclo.numero ? ` · ciclo nº ${p.ciclo.numero}` : ""}`],
                    ["Entrada", formatarData(p.ciclo.entrada, true)],
                    ["Saída", p.ciclo.saida ? formatarData(p.ciclo.saida, true) : "em secagem"],
                    ["Duração", formatarDuracao(minutosEntre(p.ciclo.entrada, p.ciclo.saida))],
                    ["Umidade final", p.ciclo.umidadeFinal != null ? `${fmtNum(p.ciclo.umidadeFinal, 1)}%` : null],
                    ["Checklist", p.ciclo.checklist.length ? `${conformes} OK${naoConformes ? ` · ${naoConformes} não conforme(s)` : ""} de ${p.ciclo.checklist.length}` : null],
                    ["Responsável", p.ciclo.responsavel.nome],
                  ]}
                />
              </Link>
            )}
          </Etapa>

          <Etapa Icone={Warehouse} titulo="Pacote formado" cor="#1baf7a">
            <Dados
              itens={[
                ["Formado por", p.criadoPor.nome],
                ["Quando", formatarData(p.criadoEm, true)],
                ["Bitola", bitola(p)],
                ["Volume", fmtM3(p.m3, 3)],
              ]}
            />
          </Etapa>

          <Etapa Icone={Truck} titulo="Expedição" cor="#57534e" vazio={p.status !== "EXPEDIDO" && "Ainda na empresa."} ultima>
            <Dados
              itens={[
                ["Pedido", p.pedido?.numero ?? null],
                ["Cliente", p.pedido?.cliente ?? p.cliente],
                ["Destino", p.pedido?.destino ?? p.destino],
                ["Data", formatarData(p.expedidoEm, true)],
                ["Por", expedido?.usuario?.nome],
                [
                  "Romaneio",
                  romaneio ? (
                    <Link key="r" href={`/producao/romaneios/${romaneio.numero}`} className="text-marca-700 hover:underline">
                      {codigoRomaneio(romaneio.numero)}
                    </Link>
                  ) : null,
                ],
                ["Motorista", romaneio?.motorista ?? null],
                ["Placas", romaneio ? [romaneio.placa, romaneio.placaJulieta].filter(Boolean).join(" + ") || null : null],
              ]}
            />
          </Etapa>
        </ol>
      </section>

      <section className="cartao">
        <h2 className="mb-3 font-semibold">Linha do tempo</h2>
        <ol className="space-y-3">
          {[...p.eventos].reverse().map((e) => (
            <li key={e.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-marca-500" aria-hidden />
              <div className="min-w-0">
                <div>
                  <b>{TIPO_EVENTO[e.tipo]}</b> · {e.descricao}
                </div>
                <div className="text-xs text-stone-500">
                  {formatarData(e.criadoEm, true)}
                  {e.usuario && ` · ${e.usuario.nome}`}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
