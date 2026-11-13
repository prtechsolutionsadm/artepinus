import "server-only";
import { db } from "@/lib/db";
import { arred, dateParaDia, diaParaDate, hojeSP } from "@/lib/producao";
import { configSerraria } from "@/lib/producao-dados";

/**
 * Paradas de máquina marcadas na hora (botão "Máquina parou" ou requisição com máquina parada).
 * Enquanto a máquina está parada o cronômetro corre; ao liberar, o tempo parado dentro do
 * turno de cada dia entra no boletim daquele dia como uma ParadaProducao automática
 * (dia útil sem boletim ganha um; sábado e domingo só se o boletim for aberto).
 */

const MIN = 60_000;

/** "AAAA-MM-DD" + "HH:MM" no horário de Brasília → Date. */
function instanteSP(dia: string, hora: string) {
  return new Date(`${dia}T${hora}:00-03:00`);
}

/** Dia (Brasília) de um instante, como "AAAA-MM-DD". */
export function diaSP(d: Date) {
  return new Date(d.getTime() - 3 * 60 * MIN).toISOString().slice(0, 10);
}

function proximoDia(dia: string) {
  return dateParaDia(new Date(diaParaDate(dia).getTime() + 24 * 60 * MIN));
}

/** Segunda a sexta (o mesmo critério do alerta de dia sem apontamento; feriados não entram). */
function diaUtil(dia: string) {
  const semana = diaParaDate(dia).getUTCDay();
  return semana !== 0 && semana !== 6;
}

/** Minutos parados dentro do turno, por dia (só os dias com algum minuto). */
export function minutosPorDia(inicio: Date, fim: Date, turno: { turnoInicio: string; turnoFim: string }) {
  const dias = new Map<string, number>();
  if (fim <= inicio) return dias;
  const ultimo = diaSP(fim);
  // Uma parada esquecida aberta não percorre anos de dias
  for (let dia = diaSP(inicio), n = 0; dia <= ultimo && n < 120; dia = proximoDia(dia), n++) {
    const a = Math.max(inicio.getTime(), instanteSP(dia, turno.turnoInicio).getTime());
    const b = Math.min(fim.getTime(), instanteSP(dia, turno.turnoFim).getTime());
    if (b > a) dias.set(dia, arred((b - a) / MIN, 1));
  }
  return dias;
}

/** Boletim do dia: o existente ou um novo com a configuração padrão. */
export async function boletimDoDia(dia: string, responsavelId: string) {
  const data = diaParaDate(dia);
  const existente = await db.boletimProducao.findUnique({ where: { data } });
  if (existente) return { boletim: existente, novo: false };
  const cfg = await configSerraria();
  try {
    const boletim = await db.boletimProducao.create({ data: { data, metaM3: cfg.metaDiariaM3, horasProgramadas: cfg.horasDia, responsavelId } });
    return { boletim, novo: true };
  } catch (e) {
    if (!(typeof e === "object" && e !== null && "code" in e && e.code === "P2002")) throw e;
    return { boletim: await db.boletimProducao.findUniqueOrThrow({ where: { data } }), novo: false };
  }
}

/**
 * Leva uma parada encerrada aos boletins: uma linha por dia com tempo no turno. Todo dia útil
 * (seg–sex, até hoje) com tempo no turno ganha boletim se ainda não tiver; sábado e domingo só
 * entram se o boletim já existir ou quando for aberto. Refaz as linhas a cada chamada (corrigir
 * início/fim na requisição atualiza o boletim).
 */
export async function lancarParadaNoBoletim(paradaId: string) {
  const p = await db.paradaMaquina.findUnique({ where: { id: paradaId } });
  if (!p) return;
  if (!p.fim) {
    await db.paradaProducao.deleteMany({ where: { paradaMaquinaId: p.id } });
    return;
  }
  const cfg = await configSerraria();
  const dias = minutosPorDia(p.inicio, p.fim, cfg);
  const hoje = hojeSP();
  const usados: string[] = [];
  const abertos: string[] = [];
  for (const [dia, minutos] of dias) {
    let boletim = await db.boletimProducao.findUnique({ where: { data: diaParaDate(dia) } });
    // O fim da requisição pode estar no futuro: não abre boletim de dia que ainda não chegou
    if (!boletim && diaUtil(dia) && dia <= hoje) {
      const r = await boletimDoDia(dia, p.encerradaPorId ?? p.abertaPorId);
      boletim = r.boletim;
      if (r.novo) abertos.push(dia);
    }
    if (!boletim) continue;
    const dados = {
      motivoId: p.motivoId,
      equipamentoId: p.equipamentoId,
      centro: p.centro,
      ocorrencias: 1,
      minutos: Math.min(minutos, boletim.horasProgramadas * 60),
      descricao: p.descricao,
      requisicaoId: p.requisicaoId,
    };
    await db.paradaProducao.upsert({
      where: { paradaMaquinaId_boletimId: { paradaMaquinaId: p.id, boletimId: boletim.id } },
      update: dados,
      create: { ...dados, paradaMaquinaId: p.id, boletimId: boletim.id },
    });
    usados.push(boletim.id);
  }
  await db.paradaProducao.deleteMany({ where: { paradaMaquinaId: p.id, boletimId: { notIn: usados } } });
  // Boletim aberto agora: traz as outras paradas daquele dia (cada boletim só abre uma vez, então a recursão termina)
  for (const dia of abertos) await sincronizarParadasDoDia(dia, p.id);
}

/** Ao abrir um boletim: traz as paradas já encerradas que tiveram tempo no turno daquele dia. */
export async function sincronizarParadasDoDia(dia: string, exceto?: string) {
  const comeco = instanteSP(dia, "00:00");
  const fimDoDia = new Date(comeco.getTime() + 24 * 60 * MIN);
  const paradas = await db.paradaMaquina.findMany({
    where: { inicio: { lt: fimDoDia }, fim: { gt: comeco }, ...(exceto ? { id: { not: exceto } } : {}) },
    select: { id: true },
  });
  for (const p of paradas) await lancarParadaNoBoletim(p.id);
}

/**
 * Requisição de manutenção com máquina parada → parada da serraria (caminho inverso).
 * Só para máquinas da linha; MEC é o padrão quando a requisição não diz o centro.
 * O início/fim acompanham os da requisição; desmarcar "máquina parada" desfaz a parada
 * aberta pela manutenção (a marcada na serraria continua: quem parou foi a linha).
 */
export async function refletirRequisicaoNaParada(
  requisicaoId: number,
  usuarioId: string,
  centro: "MEC" | "ELE" = "MEC",
) {
  const r = await db.requisicao.findUnique({
    where: { id: requisicaoId },
    select: { id: true, titulo: true, maquinaParada: true, paradaInicio: true, paradaFim: true, equipamento: { select: { id: true, linhaSerraria: true } }, paradaMaquina: true },
  });
  if (!r) return null;
  const p = r.paradaMaquina;
  if (!r.maquinaParada || !r.paradaInicio) {
    if (p && p.origem === "MANUTENCAO") {
      await db.paradaMaquina.delete({ where: { id: p.id } });
      return null;
    }
    return p;
  }
  if (!p) {
    if (!r.equipamento?.linhaSerraria) return null;
    const nova = await db.paradaMaquina.create({
      data: {
        equipamentoId: r.equipamento.id,
        centro,
        descricao: r.titulo.slice(0, 500),
        inicio: r.paradaInicio,
        fim: r.paradaFim,
        origem: "MANUTENCAO",
        abertaPorId: usuarioId,
        encerradaPorId: r.paradaFim ? usuarioId : null,
        requisicaoId: r.id,
      },
    });
    if (nova.fim) await lancarParadaNoBoletim(nova.id);
    return nova;
  }
  const mudouFim = (p.fim?.getTime() ?? null) !== (r.paradaFim?.getTime() ?? null);
  if (p.inicio.getTime() === r.paradaInicio.getTime() && !mudouFim) return p;
  const atualizada = await db.paradaMaquina.update({
    where: { id: p.id },
    data: {
      inicio: r.paradaInicio,
      fim: r.paradaFim,
      encerradaPorId: r.paradaFim ? (mudouFim ? usuarioId : p.encerradaPorId) : null,
    },
  });
  await lancarParadaNoBoletim(p.id);
  return atualizada;
}
