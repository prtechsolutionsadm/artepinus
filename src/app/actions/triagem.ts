"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auditar } from "@/lib/auditoria";
import { STATUS, dataLocalParaDate, diaValido, formatarData, inteiroPositivo, numeroRequisicao } from "@/lib/constantes";
import { db } from "@/lib/db";
import { hojeSP } from "@/lib/producao";
import { exigirUsuario } from "@/lib/session";
import type { Prisma } from "@/generated/prisma/client";
import type { StatusRequisicao } from "@/generated/prisma/enums";
import type { EstadoForm } from "./auth";

// ============================ Triagem do período de teste (só administrador) ============================
//
// Enquanto a Manutenção estava em teste, cada "Máquina parou" mecânica/elétrica abriu uma requisição que
// ficou Aberta depois de a serraria liberar a máquina, e os planos de preventiva seguiram gerando
// requisições que ninguém viu. Aqui o administrador vê a prévia e decide, grupo a grupo, concluir ou
// cancelar. Nada é automático e fica de fora o que alguém da manutenção já tocou (assumiu, comentou,
// lançou horas ou marcou checklist).
//
// Cancelar segue a mesma regra de atualizarStatus/cancelarPropria: a máquina parada aberta pela
// manutenção que ainda corre é desfeita na mesma transação (a parada marcada na serraria continua: a
// serraria libera). Concluir não fecha parada que ainda corre: essa requisição é tratada uma a uma.

/** Máximo de requisições por grupo numa aplicação (a prévia avisa quando há mais). */
const MAX_POR_GRUPO = 300;

export type GrupoTriagem = "paradas" | "preventivas" | "excluidas";

/** Fim do dia escolhido (Brasília): entram as requisições criadas antes deste instante. */
function limiteDoDia(ate: string) {
  const inicio = dataLocalParaDate(`${ate}T00:00`)!;
  return new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
}

/** Ninguém da manutenção mexeu: sem comentários e sem horas lançadas. */
const intocada = { comentarios: { none: {} }, apontamentos: { none: {} } } satisfies Prisma.RequisicaoWhereInput;

/** Critério de cada grupo. Repetido na gravação: se algo mudou depois da prévia, nada é gravado. */
function criterio(grupo: GrupoTriagem, limite: Date, agora: Date): Prisma.RequisicaoWhereInput {
  const criada = { criadoEm: { lt: limite } };
  if (grupo === "paradas") {
    // Abertas pelo "Máquina parou" e já liberadas na serraria, ainda Abertas e sem responsável
    return {
      ...criada,
      ...intocada,
      status: "ABERTA",
      responsavelId: null,
      maquinaParada: true,
      paradaFim: { not: null },
      paradaMaquina: { is: { origem: "SERRARIA", fim: { not: null } } },
    };
  }
  if (grupo === "preventivas") {
    // Geradas pelos planos, ainda Agendadas como nasceram, com a data já passada e sem checklist marcado
    return {
      ...criada,
      ...intocada,
      tipo: "PREVENTIVA",
      planoId: { not: null },
      status: "AGENDADA",
      dataAgendada: { lt: limite.getTime() < agora.getTime() ? limite : agora },
      checklist: { none: { feito: true } },
    };
  }
  // Parada excluída na serraria (marcada por engano) antes de a exclusão cancelar a requisição sozinha
  return {
    ...criada,
    ...intocada,
    status: "ABERTA",
    responsavelId: null,
    maquinaParada: false,
    paradaMaquina: { is: null },
    titulo: { startsWith: "Máquina parada:" },
    historico: { some: { observacao: { startsWith: "Parada excluída na serraria" } } },
  };
}

const SELECT = {
  id: true,
  titulo: true,
  status: true,
  criadoEm: true,
  paradaFim: true,
  dataAgendada: true,
  maquinaParada: true,
  paradaInicio: true,
  paradaMaquina: { select: { id: true, origem: true, fim: true } },
  equipamento: { select: { codigo: true, nome: true } },
} satisfies Prisma.RequisicaoSelect;

async function listar(grupo: GrupoTriagem, limite: Date, agora: Date, ids?: number[]) {
  return db.requisicao.findMany({
    where: { ...criterio(grupo, limite, agora), ...(ids ? { id: { in: ids } } : {}) },
    select: SELECT,
    orderBy: { criadoEm: "asc" },
    take: MAX_POR_GRUPO + 1,
  });
}

/**
 * Prévia da triagem: o que cada grupo encerraria, com as requisições criadas até `ate` (AAAA-MM-DD).
 * Só o administrador (é chamada pela página de Cadastros → Configuração).
 */
export async function previaTriagem(ate: string) {
  const eu = await exigirUsuario();
  if (eu.perfil !== "ADMIN") return null;
  const dia = diaValido(ate) ? ate : hojeSP();
  const limite = limiteDoDia(dia);
  const agora = new Date();
  const [paradas, preventivas, excluidas] = await Promise.all([
    listar("paradas", limite, agora),
    listar("preventivas", limite, agora),
    listar("excluidas", limite, agora),
  ]);
  const corta = <T>(l: T[]) => ({ itens: l.slice(0, MAX_POR_GRUPO), mais: l.length > MAX_POR_GRUPO });
  return { ate: dia, max: MAX_POR_GRUPO, paradas: corta(paradas), preventivas: corta(preventivas), excluidas: corta(excluidas) };
}

export type PreviaTriagem = NonNullable<Awaited<ReturnType<typeof previaTriagem>>>;

/** "12,15,40" (ids da prévia) → números. */
const listaIds = z
  .string()
  .trim()
  .max(20_000)
  .regex(/^(\d{1,9}(,\d{1,9})*)?$/, "Lista de requisições inválida. Atualize a prévia.")
  .transform((s) => [...new Set((s ? s.split(",") : []).map(inteiroPositivo).filter((n): n is number => n !== null))])
  .refine((l) => l.length <= MAX_POR_GRUPO, "Requisições demais de uma vez. Atualize a prévia.");

const triagemSchema = z.object({
  ate: z.iso.date("Data inválida"),
  paradas: z.enum(["manter", "concluir", "cancelar"]).default("manter"),
  preventivas: z.enum(["manter", "concluir", "cancelar"]).default("manter"),
  excluidas: z.enum(["manter", "cancelar"]).default("manter"),
  idsParadas: listaIds.default([]),
  idsPreventivas: listaIds.default([]),
  idsExcluidas: listaIds.default([]),
  confirmacao: z.string().default(""),
});

type Item = Awaited<ReturnType<typeof listar>>[number];
type Mudanca = {
  item: Item;
  grupo: GrupoTriagem;
  para: StatusRequisicao;
  dataConclusao: Date | null;
  solucao?: string;
  observacao: string;
  /** Cancelada com a máquina ainda parada (parada que não é da serraria): a marcação é desfeita. */
  paradaDesfeita?: boolean;
  /** Parada da linha aberta pela manutenção, ainda correndo: sai junto, na mesma transação. */
  paradaExcluida?: string;
};

/** A máquina ainda consta parada na requisição (o cronômetro corre). */
const paradaCorrendo = (item: Item) => item.maquinaParada && !item.paradaFim;

/**
 * Cancelamento: a mesma regra de atualizarStatus/cancelarPropria. Com a máquina ainda parada, a parada
 * aberta pela manutenção é desfeita (e a da linha, apagada); a marcada na serraria fica (a serraria libera).
 */
function comParadaDesfeita(m: Mudanca): Mudanca {
  const p = m.item.paradaMaquina;
  if (m.para !== "CANCELADA" || !paradaCorrendo(m.item) || p?.origem === "SERRARIA") return m;
  return {
    ...m,
    paradaDesfeita: true,
    paradaExcluida: p && p.origem === "MANUTENCAO" && !p.fim ? p.id : undefined,
    observacao: `${m.observacao}\nMáquina parada desfeita: a requisição foi cancelada antes de a máquina voltar a operar.`,
  };
}

const maisTarde = (a: Date, b: Date) => (a.getTime() >= b.getTime() ? a : b);

/** O que gravar em cada requisição (textos claros na requisição e no histórico). */
function mudanca(item: Item, grupo: GrupoTriagem, acao: "concluir" | "cancelar"): Mudanca {
  if (grupo === "paradas") {
    const liberada = formatarData(item.paradaFim, true);
    return acao === "concluir"
      ? {
          item,
          grupo,
          para: "CONCLUIDA",
          // A conclusão fica na hora em que a serraria liberou a máquina, não no dia da triagem
          dataConclusao: maisTarde(item.paradaFim!, item.criadoEm),
          solucao: `Máquina liberada na serraria em ${liberada} (período de teste). Encerrada pelo administrador na triagem, sem registro do serviço no sistema.`,
          observacao: `Triagem do período de teste: concluída com a data em que a serraria liberou a máquina (${liberada}).`,
        }
      : {
          item,
          grupo,
          para: "CANCELADA",
          dataConclusao: null,
          observacao: `Triagem do período de teste: cancelada pelo administrador. A máquina foi liberada na serraria em ${liberada} e não houve atendimento registrado.`,
        };
  }
  if (grupo === "preventivas") {
    const agendada = formatarData(item.dataAgendada, true);
    return acao === "concluir"
      ? {
          item,
          grupo,
          para: "CONCLUIDA",
          dataConclusao: maisTarde(item.dataAgendada!, item.criadoEm),
          solucao: `Preventiva do período de teste encerrada pelo administrador na triagem, sem registro do serviço no sistema. Conclusão registrada na data agendada (${agendada}).`,
          observacao: `Triagem do período de teste: preventiva concluída com a data agendada (${agendada}).`,
        }
      : {
          item,
          grupo,
          para: "CANCELADA",
          dataConclusao: null,
          observacao: `Triagem do período de teste: preventiva gerada durante o teste, vencida em ${agendada} e sem atendimento registrado. Cancelada pelo administrador.`,
        };
  }
  return {
    item,
    grupo,
    para: "CANCELADA",
    dataConclusao: null,
    observacao: "Triagem do período de teste: a parada foi excluída na serraria (marcada por engano). Requisição cancelada pelo administrador.",
  };
}

/**
 * Aplica a triagem escolhida na prévia: conclui ou cancela, de uma vez e numa transação, as requisições
 * que a prévia mostrou e que ainda se encaixam no critério. Cada uma ganha um registro no histórico de
 * status e na auditoria. Só o administrador.
 */
export async function triarRequisicoesTeste(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const eu = await exigirUsuario();
  if (eu.perfil !== "ADMIN") return { erro: "Só o administrador pode fazer a triagem" };
  const dados = triagemSchema.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: dados.error.issues[0].message };
  const d = dados.data;
  if (d.confirmacao.trim().toUpperCase() !== "ENCERRAR") return { erro: "Digite ENCERRAR para confirmar" };

  const escolhas = [
    { grupo: "paradas" as const, acao: d.paradas, ids: d.idsParadas },
    { grupo: "preventivas" as const, acao: d.preventivas, ids: d.idsPreventivas },
    { grupo: "excluidas" as const, acao: d.excluidas, ids: d.idsExcluidas },
  ].filter((e): e is typeof e & { acao: "concluir" | "cancelar" } => e.acao !== "manter" && e.ids.length > 0);
  if (!escolhas.length) return { erro: "Escolha Concluir ou Cancelar em pelo menos um grupo com requisições" };

  const limite = limiteDoDia(d.ate);
  const agora = new Date();
  const mudancas: Mudanca[] = [];
  for (const e of escolhas) {
    const itens = await listar(e.grupo, limite, agora, e.ids);
    // Alguém assumiu, comentou ou mudou uma requisição depois da prévia: não grava nada
    if (itens.length !== e.ids.length) return { erro: "A lista mudou desde a prévia. Toque em Atualizar prévia, confira e tente de novo." };
    // Concluir não fecha a parada que ainda corre (iria para o boletim até agora): essas, uma a uma
    const correndo = e.acao === "concluir" ? itens.filter(paradaCorrendo) : [];
    if (correndo.length) {
      const nums = correndo.map((i) => numeroRequisicao(i.id)).join(", ");
      return {
        erro: `Com a máquina ainda parada: ${nums}. Abra ${correndo.length > 1 ? "cada uma" : "a requisição"} e conclua informando o fim da parada, ou escolha Cancelar neste grupo.`,
      };
    }
    mudancas.push(...itens.map((i) => comParadaDesfeita(mudanca(i, e.grupo, e.acao))));
  }

  try {
    await db.$transaction(
      mudancas.flatMap((m) => [
        db.requisicao.update({
          // O mesmo critério da prévia: se a requisição mudou neste meio-tempo, a transação inteira é desfeita
          // (com a parada a desfazer, ela também precisa continuar correndo)
          where: { id: m.item.id, AND: [criterio(m.grupo, limite, agora), ...(m.paradaDesfeita ? [{ maquinaParada: true, paradaFim: null }] : [])] },
          data: {
            status: m.para,
            dataConclusao: m.dataConclusao,
            ...(m.solucao ? { solucao: m.solucao } : {}),
            ...(m.paradaDesfeita ? { maquinaParada: false, paradaInicio: null, paradaFim: null } : {}),
            historico: { create: { statusAnterior: m.item.status, statusNovo: m.para, usuarioId: eu.id, observacao: m.observacao } },
          },
        }),
        // Parada ainda aberta (sem linhas no boletim): se já foi liberada, não acha e desfaz tudo
        ...(m.paradaExcluida ? [db.paradaMaquina.delete({ where: { id: m.paradaExcluida, origem: "MANUTENCAO", fim: null } })] : []),
      ]),
    );
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2025") {
      return { erro: "A lista mudou desde a prévia. Toque em Atualizar prévia, confira e tente de novo." };
    }
    console.error("Falha na triagem do período de teste", e);
    return { erro: "Não foi possível aplicar a triagem. Nada foi alterado. Tente de novo." };
  }

  const concluidas = mudancas.filter((m) => m.para === "CONCLUIDA").length;
  const canceladas = mudancas.length - concluidas;
  await Promise.all(
    mudancas.map((m) =>
      auditar({
        usuarioId: eu.id,
        acao: "requisicao.status",
        entidade: "Requisicao",
        entidadeId: m.item.id,
        resumo: `${numeroRequisicao(m.item.id)}: ${STATUS[m.item.status].label} → ${STATUS[m.para].label} (triagem do período de teste)${m.paradaDesfeita ? " · máquina parada desfeita" : ""}`,
        detalhes: {
          triagem: m.grupo,
          status: { de: m.item.status, para: m.para },
          ...(m.dataConclusao ? { dataConclusao: { de: null, para: m.dataConclusao.toISOString() } } : {}),
          ...(m.solucao ? { solucao: { de: null, para: m.solucao } } : {}),
          ...(m.paradaDesfeita
            ? {
                maquinaParada: { de: true, para: false },
                paradaInicio: { de: m.item.paradaInicio?.toISOString() ?? null, para: null },
                ...(m.paradaExcluida ? { paradaMaquinaExcluida: m.paradaExcluida } : {}),
              }
            : {}),
        },
      }),
    ),
  );
  const porGrupo = (g: GrupoTriagem) => mudancas.filter((m) => m.grupo === g).length;
  await auditar({
    usuarioId: eu.id,
    acao: "sistema.triagem",
    entidade: "Sistema",
    resumo: `Triagem do período de teste (criadas até ${d.ate.split("-").reverse().join("/")}): ${concluidas} requisição(ões) concluída(s) e ${canceladas} cancelada(s)`,
    detalhes: {
      ate: d.ate,
      paradasLiberadas: { acao: d.paradas, quantidade: porGrupo("paradas") },
      preventivas: { acao: d.preventivas, quantidade: porGrupo("preventivas") },
      paradasExcluidas: { acao: d.excluidas, quantidade: porGrupo("excluidas") },
      requisicoes: mudancas.map((m) => m.item.id),
      ...(mudancas.some((m) => m.paradaDesfeita) ? { paradasDesfeitas: mudancas.filter((m) => m.paradaDesfeita).map((m) => m.item.id) } : {}),
    },
  });
  // Tudo: requisições, Início da Manutenção e, com parada desfeita, as telas da serraria e a TV
  revalidatePath("/", "layout");
  const partes = [concluidas && `${concluidas} concluída${concluidas > 1 ? "s" : ""}`, canceladas && `${canceladas} cancelada${canceladas > 1 ? "s" : ""}`].filter(Boolean);
  return { ok: `Triagem aplicada: ${partes.join(" e ")}. Cada requisição ganhou o registro no histórico.` };
}
