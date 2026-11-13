import "server-only";
import { db } from "@/lib/db";
import type { LocalEstoque, TipoProduto } from "@/generated/prisma/enums";
import { arred, calcularKpis, dateParaDia, intervaloMes, intervaloMesSP, m3Toras, mesesAntes, type Kpis } from "@/lib/producao";

const incluirBoletim = {
  paradas: { select: { centro: true, minutos: true, ocorrencias: true, motivoId: true, descricao: true, equipamentoId: true } },
} as const;

export type MesComparativo = { mes: string; dias: number; kpis: Kpis };

/** Dados do painel de indicadores: o mês escolhido e a comparação com os meses anteriores. */
export async function painelProducao(mes: string, mesesComparar = 6) {
  const inicioComparacao = mesesAntes(mes, mesesComparar - 1);
  const periodo = { gte: intervaloMes(inicioComparacao).gte, lt: intervaloMes(mes).lt };
  const [boletinsDb, somasItens, motivos, equipamentos, ciclosAtivos, ciclosMes, cargasToras, ultimos] = await Promise.all([
    db.boletimProducao.findMany({ where: { data: periodo }, orderBy: { data: "asc" }, include: incluirBoletim }),
    // Os KPIs só precisam do m³ por tipo e comprimento de cada boletim: soma no banco em vez de trazer todas as peças
    db.itemProducao.groupBy({ by: ["boletimId", "tipo", "comprimento"], where: { boletim: { data: periodo } }, _sum: { m3: true } }),
    db.motivoParada.findMany({ select: { id: true, codigo: true, descricao: true } }),
    db.equipamento.findMany({ select: { id: true, nome: true } }),
    db.cicloSecagem.findMany({ where: { status: "EM_SECAGEM" }, include: { cargas: { select: { m3: true } } } }),
    db.cicloSecagem.findMany({
      where: { status: "CONCLUIDO", saida: intervaloMesSP(mes) },
      select: { entrada: true, saida: true, cargas: { select: { m3: true } } },
    }),
    db.cargaToras.findMany({ where: { data: intervaloMes(mes) }, include: { itens: true } }),
    db.levantamentoEstoque.findFirst({ where: { OR: [{ local: { not: null } }, { itens: { some: { local: { not: null } } } }] }, orderBy: { data: "desc" }, select: { data: true } }),
  ]);

  const itensPorBoletim = new Map<string, { tipo: TipoProduto; comprimento: number; m3: number }[]>();
  for (const g of somasItens) {
    const lista = itensPorBoletim.get(g.boletimId) ?? [];
    lista.push({ tipo: g.tipo, comprimento: g.comprimento, m3: g._sum.m3 ?? 0 });
    itensPorBoletim.set(g.boletimId, lista);
  }
  const boletins = boletinsDb.map((b) => ({ ...b, itens: itensPorBoletim.get(b.id) ?? [] }));

  const doMes = boletins.filter((b) => dateParaDia(b.data).startsWith(mes));
  const kpis = calcularKpis(doMes);

  // Comparativo mês a mês (índices calculados sobre os totais de cada mês)
  const comparativo: MesComparativo[] = [];
  for (let i = mesesComparar - 1; i >= 0; i--) {
    const m = mesesAntes(mes, i);
    const lista = boletins.filter((b) => dateParaDia(b.data).startsWith(m));
    comparativo.push({ mes: m, dias: lista.length, kpis: calcularKpis(lista) });
  }

  // Serrado por dia no mês, por classe (Ótimo/Bom/Regular)
  const diario = doMes.map((b) => {
    const k = calcularKpis([b]);
    return {
      dia: dateParaDia(b.data),
      id: b.id,
      otimo: arred(k.porClasse.OTIMO, 2),
      bom: arred(k.porClasse.BOM, 2),
      regular: arred(k.porClasse.REGULAR, 2),
      metaM3: b.metaM3,
      kpis: k,
    };
  });

  // Pareto de paradas do mês (por motivo; sem motivo, pela descrição)
  const nomeMotivo = new Map(motivos.map((m) => [m.id, `${m.codigo} · ${m.descricao}`]));
  const nomeEquip = new Map(equipamentos.map((e) => [e.id, e.nome]));
  const porMotivo = new Map<string, { minutos: number; ocorrencias: number; centro: string }>();
  const porEquipamento = new Map<string, number>();
  for (const b of doMes) {
    for (const p of b.paradas) {
      const chave = (p.motivoId && nomeMotivo.get(p.motivoId)) || p.descricao?.trim() || "Sem motivo";
      const atual = porMotivo.get(chave) ?? { minutos: 0, ocorrencias: 0, centro: p.centro };
      atual.minutos += p.minutos;
      atual.ocorrencias += p.ocorrencias;
      porMotivo.set(chave, atual);
      if (p.equipamentoId) {
        const nome = nomeEquip.get(p.equipamentoId) ?? "—";
        porEquipamento.set(nome, (porEquipamento.get(nome) ?? 0) + p.minutos);
      }
    }
  }
  const pareto = [...porMotivo].map(([rotulo, v]) => ({ rotulo, ...v })).sort((a, b) => b.minutos - a.minutos);
  const paradasPorEquipamento = [...porEquipamento].map(([rotulo, valor]) => ({ rotulo, valor: Math.round(valor) })).sort((a, b) => b.valor - a.valor);

  // Estufas
  const m3Ativo = ciclosAtivos.reduce((s, c) => s + c.cargas.reduce((x, k) => x + k.m3, 0), 0);
  const m3Seco = ciclosMes.reduce((s, c) => s + c.cargas.reduce((x, k) => x + k.m3, 0), 0);
  const horasCiclo = ciclosMes.filter((c) => c.saida).map((c) => (c.saida!.getTime() - c.entrada.getTime()) / 3.6e6);
  const estufas = {
    emSecagem: ciclosAtivos.length,
    m3EmSecagem: m3Ativo,
    ciclosConcluidos: ciclosMes.length,
    m3Seco,
    horasMediaCiclo: horasCiclo.length ? horasCiclo.reduce((a, b) => a + b, 0) / horasCiclo.length : null,
  };

  // Toras recebidas no mês (volume estimado pelo diâmetro e comprimento médio da carga)
  const toras = cargasToras.reduce(
    (acc, c) => {
      const qtd = c.itens.reduce((s, i) => s + i.quantidade, 0);
      acc.cargas++;
      acc.quantidade += qtd;
      if (c.comprimentoMedio) acc.m3 += c.itens.reduce((s, i) => s + m3Toras(i.diametro, c.comprimentoMedio!, i.quantidade), 0);
      acc.somaDiametro += c.itens.reduce((s, i) => s + i.diametro * i.quantidade, 0);
      acc.pesoT += c.pesoT ?? 0;
      if (c.classeDiametro) acc.porClasse[c.classeDiametro] += c.pesoT ?? 0;
      return acc;
    },
    { cargas: 0, quantidade: 0, m3: 0, somaDiametro: 0, pesoT: 0, porClasse: { FINA: 0, MEDIA: 0, GROSSA: 0 } },
  );

  // Pacotes (rastreabilidade): formados e expedidos no mês, estoque atual
  type ComCargas = { cargas: { colheitaId: string | null; florestaId: string | null }[] } | null | undefined;
  const temColheita = (b: ComCargas) => !!b?.cargas.some((c) => c.florestaId || c.colheitaId);
  const selCargas = { select: { cargas: { select: { colheitaId: true, florestaId: true } } } } as const;
  const [formados, expedidos, emEstoque, romaneiosMes] = await Promise.all([
    db.pacote.findMany({
      where: { criadoEm: intervaloMesSP(mes), status: { not: "CANCELADO" } },
      select: {
        m3: true,
        boletim: selCargas,
        ciclo: { select: { boletins: selCargas } },
      },
    }),
    db.pacote.findMany({ where: { status: "EXPEDIDO", expedidoEm: intervaloMesSP(mes) }, select: { m3: true, criadoEm: true, expedidoEm: true, cliente: true, pedido: { select: { cliente: true } } } }),
    db.pacote.groupBy({ by: ["status"], where: { status: { in: ["VERDE", "EM_ESTUFA", "SECO"] } }, _count: true, _sum: { m3: true } }),
    db.romaneio.count({ where: { criadoEm: intervaloMesSP(mes) } }),
  ]);
  const rastreados = formados.filter((p) => temColheita(p.boletim) || !!p.ciclo?.boletins.some(temColheita)).length;
  const diasEmEstoque = expedidos.map((p) => (p.expedidoEm!.getTime() - p.criadoEm.getTime()) / 864e5);
  const porCliente = new Map<string, number>();
  for (const p of expedidos) {
    const cli = p.pedido?.cliente ?? p.cliente ?? "—";
    porCliente.set(cli, (porCliente.get(cli) ?? 0) + p.m3);
  }
  const pacotes = {
    formados: formados.length,
    m3Formado: formados.reduce((s, p) => s + p.m3, 0),
    expedidos: expedidos.length,
    m3Expedido: expedidos.reduce((s, p) => s + p.m3, 0),
    rastreados,
    diasMedioEmEstoque: diasEmEstoque.length ? diasEmEstoque.reduce((a, b) => a + b, 0) / diasEmEstoque.length : null,
    estoque: Object.fromEntries(emEstoque.map((e) => [e.status, { qtd: e._count, m3: e._sum.m3 ?? 0 }])) as Partial<Record<"VERDE" | "EM_ESTUFA" | "SECO", { qtd: number; m3: number }>>,
    porCliente: [...porCliente].map(([rotulo, m3]) => ({ rotulo, m3 })).sort((a, b) => b.m3 - a.m3),
    romaneios: romaneiosMes,
  };

  // Último inventário diário: m³ por local ("Madeira em")
  const doDia = ultimos
    ? await db.levantamentoEstoque.findMany({ where: { data: ultimos.data }, select: { local: true, itens: { select: { m3: true, local: true } } } })
    : [];
  const porLocal: Partial<Record<LocalEstoque, number>> = {};
  for (const l of doDia)
    for (const i of l.itens) {
      const lugar = i.local ?? l.local;
      if (lugar) porLocal[lugar] = (porLocal[lugar] ?? 0) + i.m3;
    }
  const estoque = ultimos ? { data: ultimos.data, porLocal } : null;

  return {
    kpis,
    diasLancados: doMes.length,
    comparativo,
    diario,
    pareto,
    paradasPorEquipamento,
    estufas,
    toras: { ...toras, diametroMedio: toras.quantidade ? toras.somaDiametro / toras.quantidade : null },
    estoque,
    pacotes,
  };
}
