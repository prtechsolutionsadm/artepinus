"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { idsSerraria } from "@/lib/alertas-serraria";
import { auditar } from "@/lib/auditoria";
import { formatarDuracao, minutosEntre, numeroRequisicao } from "@/lib/constantes";
import { db } from "@/lib/db";
import { notificar } from "@/lib/notificacoes";
import { lancarParadaNoBoletim } from "@/lib/paradas";
import { pode, podeProducao, temModulo } from "@/lib/permissoes";
import { CENTRO } from "@/lib/producao";
import { criarRequisicaoCompleta } from "@/lib/requisicoes";
import { exigirUsuario } from "@/lib/session";

export type Resultado = { erro?: string; id?: string; requisicaoId?: number | null };

const vazioParaNull = (v: unknown) => (v === "" || v === undefined ? null : v);

const pararSchema = z.object({
  equipamentoId: z.string().min(1, "Escolha a máquina"),
  motivoId: z.preprocess(vazioParaNull, z.string().nullable()),
  centro: z.enum(["MEC", "ELE", "OPE"], { message: "Diga se a falha é mecânica, elétrica ou operacional" }),
  descricao: z.preprocess(vazioParaNull, z.string().trim().max(500).nullable()),
  /** Quando a máquina parou no aparelho (marcada sem internet). */
  registradaEm: z.preprocess(vazioParaNull, z.coerce.date().nullable()),
  chaveOffline: z.preprocess(vazioParaNull, z.string().uuid().nullable()),
});

export type DadosParada = z.input<typeof pararSchema>;

function erroUnico(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
}

function atualizarTelas(requisicaoId?: number | null) {
  revalidatePath("/producao", "layout");
  revalidatePath("/manutencao");
  revalidatePath("/tv");
  if (requisicaoId) revalidatePath(`/requisicoes/${requisicaoId}`);
}

/**
 * "Máquina parou": abre a parada com o cronômetro correndo. Mecânica/elétrica abre na hora
 * uma requisição de manutenção (prioridade alta, máquina parada) e avisa a equipe.
 */
export async function pararMaquina(entrada: DadosParada): Promise<Resultado> {
  const eu = await exigirUsuario();
  if (!podeProducao(eu, "lancar")) return { erro: "Sem permissão" };
  const parse = pararSchema.safeParse(entrada);
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const d = parse.data;

  if (d.chaveOffline) {
    const ja = await db.paradaMaquina.findUnique({ where: { chaveOffline: d.chaveOffline } });
    if (ja) return { id: ja.id, requisicaoId: ja.requisicaoId };
  }
  const equip = await db.equipamento.findUnique({ where: { id: d.equipamentoId }, select: { id: true, codigo: true, nome: true, ativo: true, linhaSerraria: true } });
  if (!equip || !equip.ativo || !equip.linhaSerraria) return { erro: "Máquina não encontrada na linha da serraria" };
  const motivo = d.motivoId ? await db.motivoParada.findUnique({ where: { id: d.motivoId } }) : null;
  if (d.motivoId && !motivo) return { erro: "Motivo não encontrado" };
  const centro = motivo?.centro ?? d.centro;

  const aberta = await db.paradaMaquina.findFirst({ where: { equipamentoId: equip.id, fim: null }, select: { id: true } });
  if (aberta) return { erro: `${equip.nome} já está parada — libere a parada aberta antes de marcar outra` };

  const agora = new Date();
  // Marcada sem internet: vale a hora do aparelho (até 12 h para trás)
  const inicio = d.registradaEm && d.registradaEm < agora && agora.getTime() - d.registradaEm.getTime() < 12 * 3600_000 ? d.registradaEm : agora;
  const descricaoMotivo = motivo ? `${motivo.codigo} · ${motivo.descricao}` : null;

  // Mecânica/elétrica: requisição de manutenção já com a máquina parada
  let requisicaoId: number | null = null;
  if (centro !== "OPE") {
    const req = await criarRequisicaoCompleta(
      eu,
      {
        titulo: `Máquina parada: ${equip.nome}${motivo ? ` — ${motivo.descricao}` : ""}`.slice(0, 120),
        descricao: [
          `Parada marcada na serraria por ${eu.nome}.`,
          `Falha ${CENTRO[centro].label.toLowerCase()}.`,
          descricaoMotivo ? `Motivo nº ${descricaoMotivo}.` : null,
          d.descricao ? `Observação: ${d.descricao}` : null,
          "Ao liberar a máquina (aqui ou na serraria), o tempo parado vai para o boletim do dia.",
        ]
          .filter(Boolean)
          .join("\n"),
        tipo: "CORRETIVA",
        prioridade: "ALTA",
        local: "Serraria",
        setorId: null,
        equipamentoId: equip.id,
        maquinaParada: true,
        centroParada: centro,
        registradaEm: null,
        // Mesma chave do aparelho: reenvio simultâneo reaproveita a requisição em vez de duplicar
        chaveOffline: d.chaveOffline,
      },
      [],
      "online",
      { semParada: true, inicioParada: inicio },
    );
    requisicaoId = req.id;
  }

  let parada;
  try {
    parada = await db.paradaMaquina.create({
      data: {
        equipamentoId: equip.id,
        motivoId: motivo?.id ?? null,
        centro,
        descricao: d.descricao,
        inicio,
        origem: "SERRARIA",
        abertaPorId: eu.id,
        requisicaoId,
        chaveOffline: d.chaveOffline,
      },
    });
  } catch (e) {
    // Reenvio da fila em outra aba chegou primeiro: devolve a parada que ele gravou
    if (!erroUnico(e) || !d.chaveOffline) throw e;
    const ja = await db.paradaMaquina.findUnique({ where: { chaveOffline: d.chaveOffline } });
    if (!ja) throw e;
    return { id: ja.id, requisicaoId: ja.requisicaoId };
  }

  await auditar({
    usuarioId: eu.id,
    acao: "parada.abrir",
    entidade: "ParadaMaquina",
    entidadeId: parada.id,
    resumo: `${equip.nome} parou (${CENTRO[centro].label.toLowerCase()})${descricaoMotivo ? ` — ${descricaoMotivo}` : ""}${requisicaoId ? ` · requisição ${numeroRequisicao(requisicaoId)}` : ""}`,
  });

  after(async () =>
    notificar(
      (await idsSerraria(["SUPERVISOR"])).filter((id) => id !== eu.id),
      {
        titulo: `⛔ Máquina parada · ${equip.nome}`,
        mensagem: `${CENTRO[centro].label}${motivo ? ` — ${motivo.descricao}` : ""} · marcada por ${eu.nome}${requisicaoId ? ` · manutenção avisada (${numeroRequisicao(requisicaoId)})` : ""}`,
        link: "/producao/paradas",
      },
    ),
  );

  atualizarTelas(requisicaoId);
  return { id: parada.id, requisicaoId };
}

/** Quem pode liberar: quem lança na serraria ou quem atende requisições na manutenção. */
function podeLiberar(eu: Awaited<ReturnType<typeof exigirUsuario>>) {
  return podeProducao(eu, "lancar") || (temModulo(eu, "manutencao") && pode(eu.perfil, "atenderRequisicoes"));
}

/**
 * "Máquina liberada": fecha o cronômetro, leva o tempo ao boletim e anota o fim da parada na
 * requisição (o status dela segue com a manutenção).
 */
export async function liberarMaquina(paradaId: string, observacao?: string): Promise<Resultado> {
  const eu = await exigirUsuario();
  if (!podeLiberar(eu)) return { erro: "Sem permissão" };
  const obs = z.string().trim().max(500).optional().safeParse(observacao || undefined);
  if (!obs.success) return { erro: "Observação muito longa" };
  const p = await db.paradaMaquina.findUnique({ where: { id: paradaId }, include: { equipamento: { select: { nome: true } } } });
  if (!p) return { erro: "Parada não encontrada" };
  if (p.fim) return { id: p.id };

  const fim = new Date();
  const descricao = obs.data ? [p.descricao, `Liberação: ${obs.data}`].filter(Boolean).join(" · ").slice(0, 500) : p.descricao;
  await db.paradaMaquina.update({ where: { id: p.id }, data: { fim, encerradaPorId: eu.id, descricao } });
  if (p.requisicaoId) {
    const r = await db.requisicao.findUnique({ where: { id: p.requisicaoId }, select: { paradaFim: true, status: true } });
    if (r && !r.paradaFim) {
      await db.requisicao.update({
        where: { id: p.requisicaoId },
        data: {
          paradaFim: fim,
          historico: { create: { statusAnterior: r.status, statusNovo: r.status, usuarioId: eu.id, observacao: `Máquina liberada por ${eu.nome}${obs.data ? ` — ${obs.data}` : ""}` } },
        },
      });
    }
  }
  await lancarParadaNoBoletim(p.id);

  const duracao = formatarDuracao(minutosEntre(p.inicio, fim));
  await auditar({
    usuarioId: eu.id,
    acao: "parada.liberar",
    entidade: "ParadaMaquina",
    entidadeId: p.id,
    resumo: `${p.equipamento.nome} liberada após ${duracao}${obs.data ? ` — ${obs.data}` : ""}`,
  });
  after(async () =>
    notificar(
      [...(await idsSerraria(["SUPERVISOR"])), p.abertaPorId].filter((id) => id !== eu.id),
      { titulo: `✅ Máquina liberada · ${p.equipamento.nome}`, mensagem: `Ficou parada ${duracao} · liberada por ${eu.nome}`, link: "/producao/paradas" },
    ),
  );
  atualizarTelas(p.requisicaoId);
  return { id: p.id, requisicaoId: p.requisicaoId };
}

/**
 * Desfaz uma parada marcada por engano (só o supervisor). A requisição, se houver, continua aberta,
 * mas sem a marcação de máquina parada — senão a próxima atualização dela recriaria a parada.
 */
export async function excluirParadaMaquina(paradaId: string): Promise<Resultado> {
  const eu = await exigirUsuario();
  if (!podeProducao(eu, "gerir")) return { erro: "Sem permissão" };
  const p = await db.paradaMaquina.findUnique({ where: { id: paradaId }, include: { equipamento: { select: { nome: true } } } });
  if (!p) return { erro: "Parada não encontrada" };
  const r = p.requisicaoId
    ? await db.requisicao.findUnique({ where: { id: p.requisicaoId }, select: { id: true, status: true, maquinaParada: true, paradaInicio: true, paradaFim: true } })
    : null;
  if (r?.maquinaParada) {
    await db.$transaction([
      db.paradaMaquina.delete({ where: { id: p.id } }),
      db.requisicao.update({
        where: { id: r.id },
        data: {
          maquinaParada: false,
          paradaInicio: null,
          paradaFim: null,
          historico: { create: { statusAnterior: r.status, statusNovo: r.status, usuarioId: eu.id, observacao: `Parada excluída na serraria por ${eu.nome} (marcada por engano)` } },
        },
      }),
    ]);
  } else {
    await db.paradaMaquina.delete({ where: { id: p.id } });
  }
  await auditar({
    usuarioId: eu.id,
    acao: "parada.excluir",
    entidade: "ParadaMaquina",
    entidadeId: p.id,
    resumo: `Excluiu a parada de ${p.equipamento.nome} iniciada em ${p.inicio.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}${r?.maquinaParada ? ` · requisição ${numeroRequisicao(r.id)} sem máquina parada` : ""}`,
    detalhes: r?.maquinaParada
      ? {
          requisicao: numeroRequisicao(r.id),
          maquinaParada: { de: true, para: false },
          paradaInicio: { de: r.paradaInicio?.toISOString() ?? null, para: null },
          paradaFim: { de: r.paradaFim?.toISOString() ?? null, para: null },
        }
      : undefined,
  });
  atualizarTelas(p.requisicaoId);
  return {};
}
