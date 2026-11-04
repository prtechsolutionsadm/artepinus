import "server-only";
import { db } from "@/lib/db";
import { calcularKpis, diaParaDate, hojeSP, intervaloMes, mesDe } from "@/lib/producao";
import { configSerraria } from "@/lib/producao-dados";
import { codigoLote } from "@/lib/rastreio";

/** Tudo o que o painel da TV mostra: o dia na serraria, as estufas e o mês. */
export async function dadosTv() {
  const hoje = hojeSP();
  const agora = new Date();
  const inicioDia = new Date(`${hoje}T00:00:00-03:00`);
  const [cfg, boletim, boletinsMes, estufas, formados, expedidos] = await Promise.all([
    configSerraria(),
    db.boletimProducao.findUnique({
      where: { data: diaParaDate(hoje) },
      include: {
        itens: { select: { m3: true, comprimento: true, pecas: true } },
        paradas: { select: { centro: true, minutos: true, descricao: true, motivo: { select: { descricao: true } } } },
        lotes: { orderBy: { numero: "desc" }, take: 6, include: { pedido: { select: { numero: true, cliente: true } }, itens: { select: { m3: true, pecas: true } } } },
        _count: { select: { lotes: true } },
      },
    }),
    db.boletimProducao.findMany({
      where: { data: intervaloMes(mesDe(hoje)) },
      select: { metaM3: true, horasProgramadas: true, torasM3: true, itens: { select: { m3: true, comprimento: true } }, paradas: { select: { centro: true, minutos: true } } },
    }),
    db.estufa.findMany({
      where: { ativo: true },
      orderBy: { numero: "asc" },
      select: { id: true, nome: true, ciclos: { where: { status: "EM_SECAGEM" }, take: 1, select: { numero: true, entrada: true, previsaoSaida: true, cargas: { select: { m3: true } } } } },
    }),
    db.pacote.count({ where: { criadoEm: { gte: inicioDia }, status: { not: "CANCELADO" } } }),
    db.pacote.count({ where: { expedidoEm: { gte: inicioDia }, status: "EXPEDIDO" } }),
  ]);

  const dia = calcularKpis(boletim ? [{ ...boletim, torasM3: null }] : []);
  const metaDia = boletim?.metaM3 ?? cfg.metaDiariaM3;
  const mes = calcularKpis(boletinsMes);
  const motivos = new Map<string, number>();
  for (const p of boletim?.paradas ?? []) {
    const k = p.motivo?.descricao ?? p.descricao ?? "Sem motivo";
    motivos.set(k, (motivos.get(k) ?? 0) + p.minutos);
  }

  return {
    hoje,
    dia: {
      serradoM3: dia.producaoM3,
      metaM3: metaDia,
      pecas: (boletim?.itens ?? []).reduce((t, i) => t + i.pecas, 0),
      porClasse: dia.porClasse,
      lotes: boletim?._count.lotes ?? 0,
      minutosParados: dia.minutosParados,
      paradoPorCentro: dia.paradoPorCentro,
      motivos: [...motivos].map(([rotulo, minutos]) => ({ rotulo, minutos })).sort((a, b) => b.minutos - a.minutos).slice(0, 4),
      ultimosLotes: (boletim?.lotes ?? []).map((l) => ({
        codigo: codigoLote(l.numero),
        pedido: `${l.pedido.numero} · ${l.pedido.cliente}`,
        m3: l.itens.reduce((t, i) => t + i.m3, 0),
        pecas: l.itens.reduce((t, i) => t + i.pecas, 0),
        hora: l.criadoEm.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }),
      })),
      formados,
      expedidos,
    },
    mes: { serradoM3: mes.producaoM3, metaM3: mes.metaM3, oee: mes.oee, disponibilidade: mes.disponibilidade, dias: boletinsMes.length },
    estufas: estufas.map((e) => {
      const c = e.ciclos[0];
      return {
        id: e.id,
        nome: e.nome,
        ciclo: c
          ? {
              numero: c.numero,
              horas: (agora.getTime() - c.entrada.getTime()) / 3.6e6,
              restante: c.previsaoSaida ? (c.previsaoSaida.getTime() - agora.getTime()) / 3.6e6 : null,
              progresso: c.previsaoSaida ? Math.min(1, (agora.getTime() - c.entrada.getTime()) / Math.max(1, c.previsaoSaida.getTime() - c.entrada.getTime())) : null,
              m3: c.cargas.reduce((t, x) => t + x.m3, 0),
            }
          : null,
      };
    }),
  };
}
