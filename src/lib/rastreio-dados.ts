import "server-only";
import { db } from "@/lib/db";
import { formatarDia } from "@/lib/producao";
import { codigoCarga, codigoLote } from "@/lib/rastreio";

const selCarga = {
  id: true,
  numero: true,
  data: true,
  origem: true,
  placa: true,
  placaJulieta: true,
  motorista: true,
  comprimentoMedio: true,
  classeDiametro: true,
  pesoT: true,
  floresta: true,
  // Dados antigos: a floresta vem pela colheita
  colheita: { select: { origem: true } },
  fornecedor: { select: { nome: true } },
} as const;

const selBoletim = {
  id: true,
  data: true,
  responsavel: { select: { nome: true } },
  itens: { select: { tipo: true, m3: true } },
  paradas: { select: { minutos: true } },
  cargas: { select: selCarga },
} as const;

/**
 * Tudo o que se sabe da história de um pacote: estufa → dias de serraria →
 * cargas de toras → colheita → floresta. A madeira de vários dias e cargas se
 * mistura no processo, então a origem é o conjunto de lotes que entrou ali.
 */
export async function rastrearPacote(numero: number) {
  const pacote = await db.pacote.findUnique({
    where: { numero },
    include: {
      criadoPor: { select: { nome: true } },
      pedido: true,
      eventos: { orderBy: { criadoEm: "asc" }, include: { usuario: { select: { nome: true } } } },
      boletim: { select: selBoletim },
      ciclo: {
        include: {
          estufa: { select: { nome: true } },
          responsavel: { select: { nome: true } },
          checklist: { select: { conforme: true } },
          boletins: { select: selBoletim, orderBy: { data: "asc" } },
        },
      },
    },
  });
  if (!pacote) return null;

  // Dias de serraria: o do pacote (se veio verde) + os que abasteceram o ciclo de estufa
  const boletins = new Map<string, NonNullable<typeof pacote.boletim>>();
  if (pacote.boletim) boletins.set(pacote.boletim.id, pacote.boletim);
  for (const b of pacote.ciclo?.boletins ?? []) boletins.set(b.id, b);
  const dias = [...boletins.values()].sort((a, b) => a.data.getTime() - b.data.getTime());

  const cargas = new Map<string, (typeof dias)[number]["cargas"][number]>();
  for (const b of dias) for (const c of b.cargas) cargas.set(c.id, c);
  const listaCargas = [...cargas.values()].sort((a, b) => a.data.getTime() - b.data.getTime());

  const florestas = new Map<string, NonNullable<(typeof listaCargas)[number]["floresta"]>>();
  for (const c of listaCargas) {
    const f = c.floresta ?? c.colheita?.origem;
    if (f) florestas.set(f.id, f);
  }

  return { pacote, dias, cargas: listaCargas, florestas: [...florestas.values()] };
}

export type Rastreio = NonNullable<Awaited<ReturnType<typeof rastrearPacote>>>;

const DIA = 864e5;


/** Cargas de toras dos últimos 60 dias (e as já ligadas), para marcar no boletim. */
export async function cargasParaForm(ligadas: string[] = []) {
  const lista = await db.cargaToras.findMany({
    where: { OR: [{ data: { gte: new Date(Date.now() - 60 * DIA) } }, { id: { in: ligadas } }] },
    orderBy: { data: "desc" },
    take: 150,
    include: { itens: { select: { quantidade: true } } },
  });
  return lista.map((c) => ({
    id: c.id,
    rotulo: `${codigoCarga(c.numero)} · ${formatarDia(c.data, { day: "2-digit", month: "2-digit" })} · ${c.origem}${c.talhao ? ` (${c.talhao})` : ""} · ${c.itens.reduce((s, i) => s + i.quantidade, 0)} toras`,
  }));
}

/** Boletins dos últimos 30 dias (e os já ligados), para marcar no ciclo de estufa. */
export async function boletinsParaForm(ligados: string[] = []) {
  const lista = await db.boletimProducao.findMany({
    where: { OR: [{ data: { gte: new Date(Date.now() - 30 * DIA) } }, { id: { in: ligados } }] },
    orderBy: { data: "desc" },
    take: 60,
    include: { itens: { select: { m3: true } } },
  });
  return lista.map((b) => ({
    id: b.id,
    rotulo: `${formatarDia(b.data, { weekday: "short", day: "2-digit", month: "2-digit" })} · ${b.itens.reduce((s, i) => s + i.m3, 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} m³`,
  }));
}


/** Ciclos em secagem agora (para mandar um pacote verde para a estufa). */
export async function ciclosAtivos() {
  const lista = await db.cicloSecagem.findMany({ where: { status: "EM_SECAGEM" }, orderBy: { entrada: "desc" }, include: { estufa: { select: { nome: true } } } });
  return lista.map((c) => ({ id: c.id, rotulo: `${c.estufa.nome}${c.numero ? ` · ciclo nº ${c.numero}` : ""}` }));
}

/** Ciclos concluídos (90 dias) com a madeira que estava na estufa e os pedidos dos lotes que entraram nela. */
export async function ciclosComMaterial() {
  const lista = await db.cicloSecagem.findMany({
    where: { status: "CONCLUIDO", saida: { gte: new Date(Date.now() - 90 * DIA) } },
    orderBy: { saida: "desc" },
    take: 40,
    include: {
      estufa: { select: { nome: true } },
      cargas: { orderBy: [{ espessura: "asc" }, { comprimento: "desc" }] },
      boletins: { select: { lotes: { select: { pedidoId: true } } } },
      _count: { select: { pacotes: true } },
    },
  });
  return lista.map((c) => ({
    id: c.id,
    rotulo: `${c.estufa.nome}${c.numero ? ` · ciclo nº ${c.numero}` : ""} · saiu ${c.saida ? formatarDia(c.saida, { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }) : "—"}`,
    pacotesFormados: c._count.pacotes,
    pedidoIds: [...new Set(c.boletins.flatMap((b) => b.lotes.map((l) => l.pedidoId)))],
    materiais: c.cargas.map((m) => ({ id: m.id, espessura: m.espessura, largura: m.largura, comprimentoMm: Math.round(m.comprimento * 1000), grades: m.grades, pecas: m.pecas, m3: m.m3 })),
  }));
}

/** Dias de serraria (30 dias) com os lotes lançados, para formar pacote verde. */
export async function diasComLotes() {
  const lista = await db.boletimProducao.findMany({
    where: { data: { gte: new Date(Date.now() - 30 * DIA) }, lotes: { some: {} } },
    orderBy: { data: "desc" },
    include: { lotes: { orderBy: { numero: "asc" }, include: { itens: { orderBy: [{ linha: "asc" }, { comprimento: "desc" }] } } } },
  });
  return lista.map((b) => ({
    id: b.id,
    rotulo: formatarDia(b.data, { weekday: "short", day: "2-digit", month: "2-digit" }),
    materiais: b.lotes.flatMap((l) =>
      l.itens.map((i) => ({ id: i.id, lote: codigoLote(l.numero), pedidoId: l.pedidoId, espessura: i.espessura, largura: i.largura, larguras: i.larguras, comprimentoMm: i.comprimento, pecas: i.pecas })),
    ),
  }));
}

/**
 * Origem de um conjunto de pacotes (ex.: os de um romaneio), para a declaração de origem:
 * florestas, período de recebimento das toras e de serragem, e os ciclos de estufa.
 * `semOrigem`: números dos pacotes sem nenhuma floresta vinculada, separados em `semCarga` (boletim sem
 * cargas, ciclo sem boletins…) e `cargaSemFloresta` (as cargas ligadas não têm floresta).
 * A floresta da carga é a informada nela ou, nos dados antigos, a da colheita (como no rastreio).
 */
export async function origemDosPacotes(pacoteIds: string[]) {
  const selFloresta = { id: true, nome: true, municipio: true, uf: true, especie: true } as const;
  const selDia = {
    id: true,
    data: true,
    cargas: { select: { data: true, floresta: { select: selFloresta }, colheita: { select: { origem: { select: selFloresta } } } } },
  } as const;
  const pacotes = await db.pacote.findMany({
    where: { id: { in: pacoteIds } },
    select: {
      id: true,
      numero: true,
      boletim: { select: selDia },
      ciclo: { select: { id: true, numero: true, entrada: true, saida: true, umidadeFinal: true, estufa: { select: { nome: true } }, boletins: { select: selDia } } },
    },
  });
  const dias = new Map<string, Date>();
  const toras = new Map<string, Date>();
  const florestas = new Map<string, { nome: string; municipio: string | null; uf: string | null; especie: string | null }>();
  const ciclos = new Map<string, { estufa: string; numero: number | null; entrada: Date; saida: Date | null; umidadeFinal: number | null }>();
  const porPacote = new Map<string, { secagem: string | null }>();
  const semOrigem: number[] = [];
  const semCarga: number[] = [];
  const cargaSemFloresta: number[] = [];
  for (const p of pacotes) {
    const ds = [...(p.boletim ? [p.boletim] : []), ...(p.ciclo?.boletins ?? [])];
    let temCarga = false;
    let temFloresta = false;
    for (const d of ds) {
      dias.set(d.id, d.data);
      for (const c of d.cargas) {
        temCarga = true;
        toras.set(`${c.data.toISOString()}`, c.data);
        const f = c.floresta ?? c.colheita?.origem;
        if (f) {
          florestas.set(f.id, f);
          temFloresta = true;
        }
      }
    }
    if (!temFloresta) {
      semOrigem.push(p.numero);
      (temCarga ? cargaSemFloresta : semCarga).push(p.numero);
    }
    if (p.ciclo) ciclos.set(p.ciclo.id, { estufa: p.ciclo.estufa.nome, numero: p.ciclo.numero, entrada: p.ciclo.entrada, saida: p.ciclo.saida, umidadeFinal: p.ciclo.umidadeFinal });
    porPacote.set(p.id, { secagem: p.ciclo ? `${p.ciclo.estufa.nome}${p.ciclo.numero ? ` #${p.ciclo.numero}` : ""}` : null });
  }
  const ordenar = (m: Map<string, Date>) => [...m.values()].sort((a, b) => a.getTime() - b.getTime());
  return {
    florestas: [...florestas.values()],
    dias: ordenar(dias),
    toras: ordenar(toras),
    ciclos: [...ciclos.values()].sort((a, b) => a.entrada.getTime() - b.entrada.getTime()),
    porPacote,
    semOrigem: semOrigem.sort((a, b) => a - b),
    semCarga: semCarga.sort((a, b) => a - b),
    cargaSemFloresta: cargaSemFloresta.sort((a, b) => a - b),
  };
}
