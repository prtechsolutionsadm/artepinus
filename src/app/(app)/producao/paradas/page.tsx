import type { Metadata } from "next";
import Link from "next/link";
import { PainelParadas } from "@/components/producao/PainelParadas";
import { Titulo } from "@/components/ui";
import { STATUS, formatarData, formatarDuracao, minutosEntre, numeroRequisicao } from "@/lib/constantes";
import { db } from "@/lib/db";
import { podeProducao, temModulo } from "@/lib/permissoes";
import { CENTRO, hojeSP } from "@/lib/producao";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Paradas de máquina" };

const DIA = /^\d{4}-\d{2}-\d{2}$/;

/** Paradas marcadas na hora: as abertas (cronômetro) e as do dia escolhido. */
export default async function ParadasPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const eu = await exigirProducao();
  const { dia: q } = await searchParams;
  const dia = q && DIA.test(q) && q <= hojeSP() ? q : hojeSP();
  const comeco = new Date(`${dia}T00:00:00-03:00`);
  const fimDia = new Date(comeco.getTime() + 864e5);

  const incluir = {
    equipamento: { select: { codigo: true, nome: true } },
    motivo: { select: { codigo: true, descricao: true } },
    abertaPor: { select: { nome: true } },
    encerradaPor: { select: { nome: true } },
    requisicao: { select: { id: true, status: true } },
  } as const;
  const [abertas, doDia, maquinas, motivos] = await Promise.all([
    db.paradaMaquina.findMany({ where: { fim: null }, orderBy: { inicio: "asc" }, include: incluir }),
    db.paradaMaquina.findMany({ where: { fim: { not: null, gt: comeco }, inicio: { lt: fimDia } }, orderBy: { inicio: "desc" }, include: incluir }),
    db.equipamento.findMany({ where: { ativo: true, linhaSerraria: true }, orderBy: { codigo: "asc" }, select: { id: true, codigo: true, nome: true } }),
    db.motivoParada.findMany({ where: { ativo: true }, orderBy: { codigo: "asc" }, select: { id: true, codigo: true, descricao: true, centro: true, equipamentoId: true } }),
  ]);
  const verManutencao = temModulo(eu, "manutencao");
  const totalDia = doDia.reduce((t, p) => t + (minutosEntre(p.inicio, p.fim) ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <Titulo subtitulo="Marque na hora em que a máquina parar. Mecânica e elétrica avisam a manutenção; ao liberar, o tempo vai para o boletim do dia.">
        Paradas de máquina
      </Titulo>

      <PainelParadas
        podeMarcar={podeProducao(eu, "lancar")}
        podeExcluir={podeProducao(eu, "gerir")}
        verManutencao={verManutencao}
        maquinas={maquinas}
        motivos={motivos}
        abertas={abertas.map((p) => ({
          id: p.id,
          equipamentoId: p.equipamentoId,
          maquina: `${p.equipamento.codigo} · ${p.equipamento.nome}`,
          centro: p.centro,
          motivo: p.motivo ? `${p.motivo.codigo} · ${p.motivo.descricao}` : null,
          descricao: p.descricao,
          inicio: p.inicio.toISOString(),
          abertaPor: p.abertaPor.nome,
          origem: p.origem,
          requisicao: p.requisicao ? { id: p.requisicao.id, numero: numeroRequisicao(p.requisicao.id), status: STATUS[p.requisicao.status].label } : null,
        }))}
      />

      <section className="cartao mt-6 p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
          <h2 className="font-semibold">
            Liberadas em {dia === hojeSP() ? "hoje" : formatarData(comeco)}
            {doDia.length > 0 && <span className="ml-2 text-sm font-normal text-stone-500">{doDia.length} · {formatarDuracao(totalDia)} parado</span>}
          </h2>
          <form className="flex items-center gap-2">
            <label htmlFor="dia" className="sr-only">
              Dia
            </label>
            <input id="dia" name="dia" type="date" max={hojeSP()} defaultValue={dia} className="campo py-1.5" />
            <button className="btn-secundario px-3 py-1.5 text-sm">Ver</button>
          </form>
        </div>
        {doDia.length === 0 ? (
          <p className="px-4 py-4 text-sm text-stone-500">Nenhuma parada liberada neste dia.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {doDia.map((p) => (
              <li key={p.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CENTRO[p.centro].hex }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {p.equipamento.nome} <span className="text-sm font-normal text-stone-500">· {CENTRO[p.centro].label}</span>
                  </div>
                  <div className="text-sm text-stone-600">
                    {p.motivo ? `${p.motivo.codigo} · ${p.motivo.descricao}` : (p.descricao ?? "Sem motivo informado")}
                  </div>
                  <div className="text-xs text-stone-500">
                    {formatarData(p.inicio, true)} → {formatarData(p.fim, true)} · parou: {p.abertaPor.nome}
                    {p.encerradaPor && ` · liberou: ${p.encerradaPor.nome}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold tabular-nums">{formatarDuracao(minutosEntre(p.inicio, p.fim))}</div>
                  {p.requisicao &&
                    (verManutencao ? (
                      <Link href={`/requisicoes/${p.requisicao.id}`} className="text-xs text-marca-700 hover:underline">
                        {numeroRequisicao(p.requisicao.id)} · {STATUS[p.requisicao.status].label}
                      </Link>
                    ) : (
                      <span className="text-xs text-stone-500">Manutenção {numeroRequisicao(p.requisicao.id)}</span>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
