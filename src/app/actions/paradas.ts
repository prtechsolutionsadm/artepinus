"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { idsSerraria } from "@/lib/alertas-serraria";
import { auditar } from "@/lib/auditoria";
import { STATUS_FINAIS, formatarDuracao, minutosEntre, numeroRequisicao } from "@/lib/constantes";
import { db } from "@/lib/db";
import { idsComModulo, idsPorPerfil, notificar } from "@/lib/notificacoes";
import { lancarParadaNoBoletim } from "@/lib/paradas";
import { MODULOS_ATIVOS, pode, podeProducao, temModulo } from "@/lib/permissoes";
import { CENTRO } from "@/lib/producao";
import { criarRequisicaoCompleta, destinatariosNovaRequisicao } from "@/lib/requisicoes";
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
 * uma requisição de manutenção (prioridade alta, máquina parada) e avisa a equipe (com o módulo
 * liberado; em teste o aviso não chega a ninguém da manutenção).
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

  const aberta = await db.paradaMaquina.findFirst({
    where: { equipamentoId: equip.id, fim: null },
    select: { id: true, requisicaoId: true, chaveOffline: true },
  });
  if (aberta) {
    // Reenvio do mesmo apontamento (fila/outra aba) que chegou enquanto o primeiro gravava
    if (d.chaveOffline && aberta.chaveOffline === d.chaveOffline) return { id: aberta.id, requisicaoId: aberta.requisicaoId };
    return { erro: `${equip.nome} já está parada — libere a parada aberta antes de marcar outra` };
  }

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

  after(async () => {
    // Quem já recebe o aviso da requisição nova (gerente, supervisor dos dois módulos) não ganha um segundo
    const daManutencao = new Set(requisicaoId ? await destinatariosNovaRequisicao(true, eu.id) : []);
    const manutencaoAvisada = requisicaoId && MODULOS_ATIVOS.includes("manutencao");
    await notificar(
      (await idsSerraria(["SUPERVISOR"])).filter((id) => id !== eu.id && !daManutencao.has(id)),
      {
        titulo: `⛔ Máquina parada · ${equip.nome}`,
        mensagem: `${CENTRO[centro].label}${motivo ? ` — ${motivo.descricao}` : ""} · marcada por ${eu.nome}${
          requisicaoId ? (manutencaoAvisada ? ` · manutenção avisada (${numeroRequisicao(requisicaoId)})` : " · avise a manutenção") : ""
        }`,
        link: "/producao/paradas",
      },
    );
  });

  atualizarTelas(requisicaoId);
  return { id: parada.id, requisicaoId };
}

/** Quem pode liberar: quem lança na serraria ou quem atende requisições na manutenção. */
function podeLiberar(eu: Awaited<ReturnType<typeof exigirUsuario>>) {
  return podeProducao(eu, "lancar") || (temModulo(eu, "manutencao") && pode(eu.perfil, "atenderRequisicoes"));
}

/**
 * "Máquina liberada": fecha o cronômetro, leva o tempo ao boletim e anota o fim da parada na
 * requisição. O status dela segue com a manutenção: o responsável (sem responsável, os supervisores
 * da manutenção) é avisado para conferir e concluir, e a lista mostra o selo "Máquina liberada".
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
  const r = p.requisicaoId
    ? await db.requisicao.findUnique({ where: { id: p.requisicaoId }, select: { id: true, paradaFim: true, status: true, responsavelId: true } })
    : null;
  const fecharParada = db.paradaMaquina.update({ where: { id: p.id }, data: { fim, encerradaPorId: eu.id, descricao } });
  if (r && !r.paradaFim) {
    await db.$transaction([
      fecharParada,
      db.requisicao.update({
        where: { id: r.id },
        data: {
          paradaFim: fim,
          historico: { create: { statusAnterior: r.status, statusNovo: r.status, usuarioId: eu.id, observacao: `Máquina liberada por ${eu.nome}${obs.data ? ` — ${obs.data}` : ""}` } },
        },
      }),
    ]);
  } else {
    await fecharParada;
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
  after(async () => {
    // Manutenção: a requisição continua com ela — o responsável (ou, sem responsável, os supervisores) confere e conclui
    let daManutencao: string[] = [];
    if (r && !STATUS_FINAIS.includes(r.status)) {
      const quem = (r.responsavelId ? [r.responsavelId] : await idsPorPerfil(["SUPERVISOR"])).filter((id) => id !== eu.id);
      daManutencao = (await idsComModulo(quem, "manutencao")) ?? quem;
      await notificar(daManutencao, {
        titulo: `✅ Máquina liberada · ${numeroRequisicao(r.id)}`,
        mensagem: `${p.equipamento.nome} liberada na serraria por ${eu.nome} após ${duracao} — confira e conclua a requisição`,
        link: `/requisicoes/${r.id}`,
      });
    }
    // Serraria: supervisores e quem marcou (sem repetir o aviso para quem já recebeu o da manutenção)
    await notificar(
      [...(await idsSerraria(["SUPERVISOR"])), p.abertaPorId].filter((id) => id !== eu.id && !daManutencao.includes(id)),
      { titulo: `✅ Máquina liberada · ${p.equipamento.nome}`, mensagem: `Ficou parada ${duracao} · liberada por ${eu.nome}`, link: "/producao/paradas" },
    );
  });
  atualizarTelas(p.requisicaoId);
  return { id: p.id, requisicaoId: p.requisicaoId };
}

/**
 * Desfaz uma parada marcada por engano (só o supervisor). A requisição aberta junto pelo "Máquina parou"
 * é cancelada sozinha se ninguém da manutenção a assumiu (ainda Aberta, sem responsável e sem horas) e a
 * equipe que recebeu o aviso fica sabendo. Assumida, ela continua com a manutenção (o responsável é
 * avisado), mas sem a marcação de máquina parada — senão a próxima atualização dela recriaria a parada.
 */
export async function excluirParadaMaquina(paradaId: string): Promise<Resultado> {
  const eu = await exigirUsuario();
  if (!podeProducao(eu, "gerir")) return { erro: "Sem permissão" };
  const p = await db.paradaMaquina.findUnique({ where: { id: paradaId }, include: { equipamento: { select: { nome: true } } } });
  if (!p) return { erro: "Parada não encontrada" };
  const r = p.requisicaoId
    ? await db.requisicao.findUnique({
        where: { id: p.requisicaoId },
        select: {
          id: true,
          titulo: true,
          status: true,
          responsavelId: true,
          maquinaParada: true,
          paradaInicio: true,
          paradaFim: true,
          _count: { select: { apontamentos: true } },
        },
      })
    : null;
  // Aberta pelo "Máquina parou" e ninguém da manutenção pegou: foi só o engano, cancela junto
  const cancelar = !!r && p.origem === "SERRARIA" && r.status === "ABERTA" && !r.responsavelId && r._count.apontamentos === 0;
  const desmarcar = !!r && (cancelar || r.maquinaParada);
  const apagar = db.paradaMaquina.delete({ where: { id: p.id } });
  if (r && desmarcar) {
    try {
      await db.$transaction([
        apagar,
        db.requisicao.update({
          // Confere de novo dentro da transação: se alguém assumiu agora, nada é gravado
          where: cancelar ? { id: r.id, status: "ABERTA", responsavelId: null, apontamentos: { none: {} } } : { id: r.id },
          data: {
            ...(cancelar ? { status: "CANCELADA" as const } : {}),
            maquinaParada: false,
            paradaInicio: null,
            paradaFim: null,
            historico: {
              create: {
                statusAnterior: r.status,
                statusNovo: cancelar ? "CANCELADA" : r.status,
                usuarioId: eu.id,
                observacao: cancelar
                  ? `Parada marcada por engano na serraria — excluída por ${eu.nome}; requisição cancelada automaticamente`
                  : `Parada excluída na serraria por ${eu.nome} (marcada por engano)`,
              },
            },
          },
        }),
      ]);
    } catch (e) {
      // P2025: algo mudou entre a leitura e a gravação (ex.: alguém da manutenção assumiu agora)
      if (typeof e === "object" && e !== null && "code" in e && e.code === "P2025") return { erro: "A parada ou a requisição acabou de mudar. Atualize a tela e tente de novo." };
      throw e;
    }
  } else {
    await apagar;
  }
  const num = r ? numeroRequisicao(r.id) : null;
  await auditar({
    usuarioId: eu.id,
    acao: "parada.excluir",
    entidade: "ParadaMaquina",
    entidadeId: p.id,
    resumo: `Excluiu a parada de ${p.equipamento.nome} iniciada em ${p.inicio.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}${
      cancelar ? ` · requisição ${num} cancelada` : desmarcar ? ` · requisição ${num} sem máquina parada` : ""
    }`,
    detalhes:
      r && desmarcar
        ? {
            requisicao: num,
            ...(cancelar ? { status: { de: r.status, para: "CANCELADA" } } : {}),
            maquinaParada: { de: r.maquinaParada, para: false },
            paradaInicio: { de: r.paradaInicio?.toISOString() ?? null, para: null },
            paradaFim: { de: r.paradaFim?.toISOString() ?? null, para: null },
          }
        : undefined,
  });
  if (r && cancelar) {
    await auditar({
      usuarioId: eu.id,
      acao: "requisicao.status",
      entidade: "Requisicao",
      entidadeId: r.id,
      resumo: `${num}: Aberta → Cancelada (parada de ${p.equipamento.nome} marcada por engano na serraria)`,
      detalhes: { status: { de: r.status, para: "CANCELADA" }, paradaMaquinaId: p.id },
    });
  }
  if (r && desmarcar && !STATUS_FINAIS.includes(r.status)) {
    after(async () => {
      if (cancelar) {
        // A mesma equipe que recebeu o aviso da requisição nova
        await notificar(await destinatariosNovaRequisicao(true, eu.id), {
          titulo: `${num} cancelada · parada marcada por engano`,
          mensagem: `${r.titulo} — ${eu.nome} excluiu a parada na serraria`,
          link: `/requisicoes/${r.id}`,
        });
      } else {
        await notificar(r.responsavelId ? [r.responsavelId] : await idsPorPerfil(["SUPERVISOR"], eu.id), {
          titulo: `${num}: parada excluída na serraria`,
          mensagem: `${eu.nome} excluiu a parada de ${p.equipamento.nome} (marcada por engano). A requisição continua com a manutenção.`,
          link: `/requisicoes/${r.id}`,
        });
      }
    });
  }
  atualizarTelas(p.requisicaoId);
  if (p.requisicaoId) revalidatePath("/requisicoes");
  return {};
}
