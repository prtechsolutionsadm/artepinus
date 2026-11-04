import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { SeletorMes } from "@/components/SeletorMes";
import { TabelaFicha, type LinhaTabelaFicha } from "@/components/producao/TabelaFicha";
import { db } from "@/lib/db";
import { podeProducao } from "@/lib/permissoes";
import { fmtM3, formatarDia, hojeSP, intervaloMes, linhasParaTabela, mesDe, nomeMesLongo } from "@/lib/producao";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Madeira carregada no mês" };

/** Mês no horário de Brasília para a entrada do ciclo (DateTime). */
function intervaloSP(mes: string) {
  const { gte, lt } = intervaloMes(mes);
  return { gte: new Date(gte.getTime() + 3 * 3600e3), lt: new Date(lt.getTime() + 3 * 3600e3) };
}

/** A ficha "Madeira carregada no mês" de uma estufa: uma linha por carga, como no papel. */
export default async function FichaEstufaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mes?: string }> }) {
  const eu = await exigirProducao();
  const { id } = await params;
  const q = (await searchParams).mes;
  const atual = mesDe(hojeSP());
  const mes = q && /^\d{4}-\d{2}$/.test(q) ? q : atual;
  const estufa = await db.estufa.findUnique({ where: { id } });
  if (!estufa) notFound();
  const [ciclos, todas] = await Promise.all([
    db.cicloSecagem.findMany({
      where: { estufaId: id, status: { not: "CANCELADO" }, entrada: intervaloSP(mes) },
      orderBy: { entrada: "asc" },
      include: { cargas: { orderBy: [{ linha: "asc" }, { espessura: "asc" }, { comprimento: "desc" }] } },
    }),
    db.cicloSecagem.findMany({ where: { estufaId: id, status: { not: "CANCELADO" } }, select: { entrada: true } }),
  ]);
  const comDados = [...new Set(todas.map((c) => new Date(c.entrada.getTime() - 3 * 3600e3).toISOString().slice(0, 7)))];

  const linhas: LinhaTabelaFicha[] = ciclos.flatMap((c) =>
    linhasParaTabela(
      c.cargas.map((x) => ({ ...x, larguras: x.largura })),
      c.id,
    ).map((l, i) => ({
      ...l,
      antesTexto: [i === 0 ? formatarDia(c.entrada, { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }) : "", i === 0 ? String(c.numero ?? "") : ""],
      antes: [
        i === 0 ? formatarDia(c.entrada, { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }) : "",
        i === 0 ? (
          <Link key="c" href={`/producao/estufas/ciclos/${c.id}`} className="font-medium text-marca-700 hover:underline">
            {c.numero ?? "ver"}
          </Link>
        ) : (
          ""
        ),
      ],
    })),
  );
  const m3 = linhas.reduce((t, l) => t + l.m3, 0);

  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/producao/estufas" className="nao-imprimir mb-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft className="h-4 w-4" /> Estufas
      </Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Madeira carregada no mês · {estufa.nome}</h1>
          <p className="text-sm text-stone-500">
            {nomeMesLongo(mes)} · {ciclos.length} ciclo(s) · {fmtM3(m3, 2)}
          </p>
        </div>
        <div className="nao-imprimir flex flex-wrap items-center gap-2">
          <SeletorMes mes={mes} atual={atual} base={`/producao/estufas/${id}`} comDados={comDados} />
          {podeProducao(eu, "lancar") && (
            <Link href={`/producao/estufas/ciclos/novo?estufa=${id}`} className="btn-primario">
              <Plus className="h-4 w-4" /> Iniciar ciclo
            </Link>
          )}
        </div>
      </div>
      <section className="cartao p-0">
        <TabelaFicha
          linhas={linhas}
          colunasAntes={["Data", "Ciclo"]}
          gradesUmidas
          vazio="Nenhum ciclo carregado nesta estufa no mês."
          titulo={`${ciclos.length} ciclo(s) · ${fmtM3(m3, 2)}`}
          pdf={{ titulo: `Madeira carregada no mês · ${estufa.nome}`, subtitulo: nomeMesLongo(mes), arquivo: `madeira-carregada-${estufa.nome.toLowerCase().replace(/\s+/g, "-")}-${mes}` }}
        />
      </section>
    </div>
  );
}
