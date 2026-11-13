"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditar, diferencas } from "@/lib/auditoria";
import { ErroFoto, fotosDoForm, processarFoto } from "@/lib/fotos";
import { criarRequisicaoCompleta, novaRequisicaoSchema } from "@/lib/requisicoes";
import { exigirModulo } from "@/lib/session";
import { MODULOS_ATIVOS, PERFIS_RESPONSAVEIS, pode } from "@/lib/permissoes";
import { PRIORIDADE, STATUS, STATUS_FINAIS, dataLocalParaDate, dateParaDataLocal, formatarData, formatarDuracao, minutosEntre, numeroRequisicao } from "@/lib/constantes";
import { idsSerraria } from "@/lib/alertas-serraria";
import { idsComModulo, idsPorPerfil, notificar, type Aviso } from "@/lib/notificacoes";
import { refletirRequisicaoNaParada } from "@/lib/paradas";
import type { EstadoForm } from "./auth";

const vazioParaNull = (v: unknown) => (v === "" || v === undefined ? null : v);

/**
 * Valor de um campo datetime-local (precisão de minuto). O mesmo minuto do que está gravado mantém a
 * data gravada, com os segundos: salvar sem mexer no campo não muda a parada nem o boletim.
 */
function dataDoCampo(valor: string | null, gravada: Date | null) {
  if (valor && gravada && valor === dateParaDataLocal(gravada)) return gravada;
  return dataLocalParaDate(valor);
}

/**
 * Avisa envolvidos numa requisição. Se ela está ligada a uma parada da serraria e o solicitante não usa
 * a manutenção (ex.: o apontador que tocou "Máquina parou"), ele recebe o aviso com o link das paradas —
 * o link da requisição seria descartado para ele. Só com a manutenção liberada: em teste, o que o
 * administrador faz nas requisições não vira aviso para a serraria.
 */
async function avisarEnvolvidos(ids: (string | null | undefined)[], aviso: Aviso, solicitanteDaParada: string | null) {
  const desviar = solicitanteDaParada && ids.includes(solicitanteDaParada) && MODULOS_ATIVOS.includes("manutencao");
  if (!desviar) return notificar(ids, aviso);
  const comManutencao = await idsComModulo([solicitanteDaParada], "manutencao");
  if (!comManutencao || comManutencao.includes(solicitanteDaParada)) return notificar(ids, aviso);
  await notificar(ids.filter((id) => id !== solicitanteDaParada), aviso);
  await notificar([solicitanteDaParada], { ...aviso, link: "/producao/paradas" });
}

export type ResultadoNova = { erro?: string; id?: number };

/** Chamada pelo formulário de nova requisição (que também cuida da fila sem internet). */
export async function criarRequisicao(form: FormData): Promise<ResultadoNova> {
  const eu = await exigirModulo("manutencao");
  const dados = novaRequisicaoSchema.safeParse(Object.fromEntries([...form.entries()].filter(([k]) => k !== "fotos")));
  if (!dados.success) return { erro: dados.error.issues[0].message };

  try {
    const req = await criarRequisicaoCompleta(eu, dados.data, fotosDoForm(form), "online");
    revalidatePath("/requisicoes");
    revalidatePath("/manutencao");
    return { id: req.id };
  } catch (e) {
    console.error("Falha ao criar requisição", e);
    return { erro: e instanceof ErroFoto ? e.message : "Não foi possível salvar a requisição. Tente novamente." };
  }
}

const statusSchema = z.object({
  id: z.coerce.number().int(),
  status: z.enum(Object.keys(STATUS) as [keyof typeof STATUS, ...(keyof typeof STATUS)[]]),
  observacao: z.preprocess(vazioParaNull, z.string().trim().max(2000).nullable()),
  dataAgendada: z.preprocess(vazioParaNull, z.string().nullable()),
  responsavelId: z.preprocess(vazioParaNull, z.string().nullable()),
  solucao: z.preprocess(vazioParaNull, z.string().trim().nullable()),
  maquinaParada: z.preprocess((v) => v === "on", z.boolean()),
  paradaInicio: z.preprocess(vazioParaNull, z.string().nullable()),
  paradaFim: z.preprocess(vazioParaNull, z.string().nullable()),
  centroParada: z.preprocess(vazioParaNull, z.enum(["MEC", "ELE"]).nullable()).default(null),
});

/** Atualiza status / agendamento / responsável. Gerente, supervisor e manutentor (e admin). */
export async function atualizarStatus(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const eu = await exigirModulo("manutencao");
  if (!pode(eu.perfil, "atenderRequisicoes")) return { erro: "Sem permissão" };

  const dados = statusSchema.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: dados.error.issues[0].message };
  const { id, status, observacao, responsavelId, solucao } = dados.data;

  const atual = await db.requisicao.findUnique({
    where: { id },
    include: {
      checklist: { select: { feito: true } },
      paradaMaquina: { select: { id: true, origem: true, inicio: true, fim: true, abertaPorId: true, equipamento: { select: { nome: true } } } },
    },
  });
  if (!atual) return { erro: "Requisição não encontrada" };
  const dataAgendada = dataDoCampo(dados.data.dataAgendada, atual.dataAgendada);

  if (status === "CANCELADA" && atual.status !== "CANCELADA" && !pode(eu.perfil, "cancelarRequisicoes")) {
    return { erro: "Só gerente ou supervisor pode cancelar requisições" };
  }
  // Manutentor: pode assumir para si ou deixar como está, mas não atribuir a outra pessoa
  const soAssumeOuLarga = responsavelId === eu.id || (responsavelId === null && atual.responsavelId === eu.id);
  if (responsavelId !== atual.responsavelId && !pode(eu.perfil, "atribuirResponsavel") && !soAssumeOuLarga) {
    return { erro: "Você só pode assumir a requisição para você" };
  }
  if (responsavelId && responsavelId !== atual.responsavelId) {
    const resp = await db.usuario.findUnique({ where: { id: responsavelId }, select: { perfil: true, ativo: true } });
    if (!resp?.ativo || !PERFIS_RESPONSAVEIS.includes(resp.perfil)) return { erro: "Responsável inválido" };
  }

  if (status === "AGENDADA" && !dataAgendada) return { erro: "Informe a data agendada" };
  if (status === "ADIADA" && !observacao) return { erro: "Informe o motivo do adiamento" };
  if (status === "CANCELADA" && !observacao) return { erro: "Informe o motivo do cancelamento" };
  if (status === "CONCLUIDA" && !(solucao ?? atual.solucao)) {
    return { erro: "Descreva o serviço realizado para concluir" };
  }
  const pendentes = atual.checklist.filter((i) => !i.feito).length;
  if (status === "CONCLUIDA" && atual.status !== "CONCLUIDA" && pendentes > 0) {
    return { erro: `Conclua o checklist antes de finalizar (${pendentes} ite${pendentes > 1 ? "ns pendentes" : "m pendente"})` };
  }

  const mudouStatus = status !== atual.status;
  const mudouData = (dataAgendada?.getTime() ?? null) !== (atual.dataAgendada?.getTime() ?? null);
  const agora = new Date();
  const p0 = atual.paradaMaquina;

  // Máquina parada: início padrão = agora; ao concluir, considera que voltou a operar
  let maquinaParada = dados.data.maquinaParada;
  let paradaInicio = maquinaParada ? (dataDoCampo(dados.data.paradaInicio, atual.paradaInicio) ?? atual.paradaInicio ?? agora) : null;
  // Campo vazio não reabre uma parada já liberada (ex.: liberada na serraria com esta tela aberta)
  let paradaFim = maquinaParada ? (dataDoCampo(dados.data.paradaFim, atual.paradaFim) ?? atual.paradaFim) : null;
  if (maquinaParada && !paradaFim && status === "CONCLUIDA") paradaFim = atual.paradaFim ?? agora;
  // Cancelada: os dados da parada ficam como estavam (a marcada na serraria, a serraria libera)...
  let paradaDesfeita = false;
  if (status === "CANCELADA") {
    maquinaParada = atual.maquinaParada;
    paradaInicio = atual.paradaInicio;
    paradaFim = atual.paradaFim;
    // ...e a máquina parada aberta pela manutenção, que ainda corria, é desfeita junto (também numa
    // cancelada antes desta regra que ainda tem a parada correndo na serraria)
    if (maquinaParada && !paradaFim && p0?.origem !== "SERRARIA" && (mudouStatus || (p0 && !p0.fim))) {
      maquinaParada = false;
      paradaInicio = null;
      paradaFim = null;
      paradaDesfeita = true;
    }
  }
  if (paradaInicio && paradaFim && paradaFim < paradaInicio) return { erro: "O fim da parada não pode ser antes do início" };
  if (paradaInicio && paradaInicio > agora) return { erro: "O início da parada não pode ser no futuro" };

  const atualizar = db.requisicao.update({
    where: { id },
    data: {
      status,
      responsavelId,
      dataAgendada: dataAgendada ?? (status === "ADIADA" ? null : atual.dataAgendada),
      solucao: solucao ?? atual.solucao,
      // reagendou: o lembrete do novo dia ainda precisa ser enviado
      lembreteEm: mudouData ? null : undefined,
      dataInicio: status === "EM_ANDAMENTO" && !atual.dataInicio ? agora : atual.dataInicio,
      dataConclusao: status === "CONCLUIDA" ? (atual.dataConclusao ?? agora) : null,
      maquinaParada,
      paradaInicio,
      paradaFim,
      historico:
        mudouStatus || observacao || paradaDesfeita
          ? {
              create: {
                statusAnterior: atual.status,
                statusNovo: status,
                observacao: paradaDesfeita
                  ? [observacao, "Máquina parada desfeita: a requisição foi cancelada antes de a máquina voltar a operar."].filter(Boolean).join("\n")
                  : observacao,
                usuarioId: eu.id,
              },
            }
          : undefined,
    },
  });
  // Cancelamento que desfaz a parada aberta pela manutenção: a parada sai junto, na mesma transação
  if (paradaDesfeita && p0?.origem === "MANUTENCAO" && !p0.fim) await db.$transaction([atualizar, db.paradaMaquina.delete({ where: { id: p0.id } })]);
  else await atualizar;

  // Máquina da linha da serraria: a parada (e o boletim) acompanha a requisição
  const parada = await refletirRequisicaoNaParada(id, eu.id, dados.data.centroParada ?? "MEC");
  if (parada || p0) {
    revalidatePath("/producao", "layout");
    revalidatePath("/tv");
  }

  const num = numeroRequisicao(id);
  const link = `/requisicoes/${id}`;
  const mudou = diferencas(atual, { status, responsavelId, dataAgendada: dataAgendada ?? atual.dataAgendada, solucao: solucao ?? atual.solucao, maquinaParada, paradaInicio, paradaFim }, [
    "status",
    "responsavelId",
    "dataAgendada",
    "solucao",
    "maquinaParada",
    "paradaInicio",
    "paradaFim",
  ]);
  if (Object.keys(mudou).length || observacao) {
    await auditar({
      usuarioId: eu.id,
      acao: mudouStatus ? "requisicao.status" : "requisicao.editar",
      entidade: "Requisicao",
      entidadeId: id,
      resumo: `${mudouStatus ? `${num}: ${STATUS[atual.status].label} → ${STATUS[status].label}` : `Atualizou a requisição ${num}`}${paradaDesfeita ? " · máquina parada desfeita" : ""}`,
      detalhes: { ...mudou, ...(observacao ? { observacao: { de: null, para: observacao } } : {}), ...(paradaDesfeita && p0 ? { paradaMaquinaExcluida: p0.id } : {}) },
    });
  }

  // Serraria: a manutenção liberou a máquina, corrigiu os horários da parada (o boletim muda) ou cancelou
  // com a parada marcada na serraria ainda aberta
  let avisoSerraria: Aviso | null = null;
  if (p0 && parada) {
    const maquina = p0.equipamento.nome;
    if (!p0.fim && parada.fim) {
      avisoSerraria = {
        titulo: `✅ Máquina liberada pela manutenção · ${maquina}`,
        mensagem: `Ficou parada ${formatarDuracao(minutosEntre(parada.inicio, parada.fim))} · ${eu.nome}${status === "CONCLUIDA" ? ` concluiu a ${num}` : ` · ${num}`}`,
        link: "/producao/paradas",
      };
    } else if (p0.fim && parada.fim && (p0.inicio.getTime() !== parada.inicio.getTime() || p0.fim.getTime() !== parada.fim.getTime())) {
      avisoSerraria = {
        titulo: `⏱ Parada corrigida pela manutenção · ${maquina}`,
        mensagem: `Agora de ${formatarData(parada.inicio, true)} a ${formatarData(parada.fim, true)} (${formatarDuracao(minutosEntre(parada.inicio, parada.fim))}) · ${eu.nome} na ${num} · o boletim foi atualizado`,
        link: "/producao/paradas",
      };
    } else if (status === "CANCELADA" && mudouStatus && !parada.fim) {
      avisoSerraria = {
        titulo: `${num} cancelada · ${maquina}`,
        mensagem: `${eu.nome} cancelou a requisição — a parada continua aberta: toque em "Máquina liberada" quando a máquina voltar${observacao ? ` · ${observacao}` : ""}`,
        link: "/producao/paradas",
      };
    }
  }
  const solicitanteDaParada = parada || p0 ? atual.solicitanteId : null;
  after(async () => {
    const avisadosSerraria: string[] = [];
    if (avisoSerraria && p0) {
      avisadosSerraria.push(...[...(await idsSerraria(["SUPERVISOR"])), p0.abertaPorId].filter((u) => u !== eu.id));
      await notificar(avisadosSerraria, avisoSerraria);
    }
    if (mudouStatus || (status === "AGENDADA" && mudouData)) {
      const detalhe =
        status === "AGENDADA" && dataAgendada
          ? ` para ${formatarData(dataAgendada, true)}`
          : observacao
            ? ` — ${observacao}`
            : "";
      // Quem já recebeu o aviso da serraria sobre a mesma mudança não ganha um segundo
      const solicitante = atual.solicitanteId === eu.id || avisadosSerraria.includes(atual.solicitanteId) ? null : atual.solicitanteId;
      await avisarEnvolvidos([solicitante], { titulo: `${num}: ${STATUS[status].label}`, mensagem: `${atual.titulo}${detalhe}`, link }, solicitanteDaParada);
    }
    if (responsavelId && responsavelId !== atual.responsavelId && responsavelId !== eu.id) {
      await notificar([responsavelId], {
        titulo: `${num} atribuída a você`,
        mensagem: `${atual.titulo} · Prioridade ${PRIORIDADE[atual.prioridade].label}`,
        link,
      });
    }
  });

  revalidatePath(`/requisicoes/${id}`);
  revalidatePath("/requisicoes");
  revalidatePath("/manutencao");
  return { ok: mudouStatus ? `Status alterado para "${STATUS[status].label}"` : "Requisição atualizada" };
}

/**
 * O solicitante pode cancelar a própria requisição enquanto ainda não foi tratada. Com a máquina ainda
 * parada, a parada aberta pela manutenção é desfeita junto; a marcada na serraria continua (a serraria libera).
 */
export async function cancelarPropria(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const eu = await exigirModulo("manutencao");
  const id = Number(form.get("id"));
  const motivo = String(form.get("motivo") ?? "").trim();
  if (!motivo) return { erro: "Informe o motivo do cancelamento" };
  if (motivo.length > 2000) return { erro: "Motivo muito longo" };

  const req = await db.requisicao.findUnique({
    where: { id },
    include: { paradaMaquina: { select: { id: true, origem: true, fim: true, abertaPorId: true, equipamento: { select: { nome: true } } } } },
  });
  if (!req || req.solicitanteId !== eu.id) return { erro: "Sem permissão" };
  if (req.status !== "ABERTA") return { erro: "Só é possível cancelar requisições ainda abertas" };

  const p0 = req.paradaMaquina;
  const paradaDesfeita = req.maquinaParada && !req.paradaFim && p0?.origem !== "SERRARIA";
  const cancelar = db.requisicao.update({
    where: { id },
    data: {
      status: "CANCELADA",
      ...(paradaDesfeita ? { maquinaParada: false, paradaInicio: null, paradaFim: null } : {}),
      historico: {
        create: {
          statusAnterior: req.status,
          statusNovo: "CANCELADA",
          observacao: paradaDesfeita ? `${motivo}\nMáquina parada desfeita: a requisição foi cancelada antes de a máquina voltar a operar.` : motivo,
          usuarioId: eu.id,
        },
      },
    },
  });
  if (paradaDesfeita && p0 && !p0.fim) await db.$transaction([cancelar, db.paradaMaquina.delete({ where: { id: p0.id } })]);
  else await cancelar;

  await auditar({
    usuarioId: eu.id,
    acao: "requisicao.cancelar",
    entidade: "Requisicao",
    entidadeId: id,
    resumo: `Cancelou a própria requisição ${numeroRequisicao(id)}${paradaDesfeita ? " · máquina parada desfeita" : ""}`,
    detalhes: {
      motivo,
      ...(paradaDesfeita
        ? {
            maquinaParada: { de: true, para: false },
            paradaInicio: { de: req.paradaInicio?.toISOString() ?? null, para: null },
            ...(p0 ? { paradaMaquinaExcluida: p0.id } : {}),
          }
        : {}),
    },
  });
  // Parada marcada na serraria ainda aberta: a serraria fica sabendo que a requisição saiu (ela libera a máquina)
  const paradaSerraria = p0 && p0.origem === "SERRARIA" && !p0.fim ? p0 : null;
  after(async () => {
    await notificar(req.responsavelId ? [req.responsavelId] : await idsPorPerfil(["SUPERVISOR"], eu.id), {
      titulo: `${numeroRequisicao(id)} cancelada pelo solicitante`,
      mensagem: `${req.titulo} — ${motivo}`,
      link: `/requisicoes/${id}`,
    });
    if (paradaSerraria) {
      await notificar([...(await idsSerraria(["SUPERVISOR"])), paradaSerraria.abertaPorId].filter((u) => u !== eu.id), {
        titulo: `${numeroRequisicao(id)} cancelada · ${paradaSerraria.equipamento.nome}`,
        mensagem: `${eu.nome} cancelou a requisição — a parada continua aberta: toque em "Máquina liberada" quando a máquina voltar · ${motivo}`,
        link: "/producao/paradas",
      });
    }
  });
  revalidatePath(`/requisicoes/${id}`);
  revalidatePath("/requisicoes");
  revalidatePath("/manutencao");
  if (p0) {
    revalidatePath("/producao", "layout");
    revalidatePath("/tv");
  }
  return { ok: "Requisição cancelada" };
}

export async function comentar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const eu = await exigirModulo("manutencao");
  const id = Number(form.get("id"));
  const texto = String(form.get("texto") ?? "").trim();
  if (!texto) return { erro: "Escreva um comentário" };

  const req = await db.requisicao.findUnique({
    where: { id },
    select: { status: true, titulo: true, solicitanteId: true, responsavelId: true, paradaMaquina: { select: { id: true } } },
  });
  if (!req) return { erro: "Requisição não encontrada" };
  if (STATUS_FINAIS.includes(req.status) && !pode(eu.perfil, "atenderRequisicoes")) {
    return { erro: "Requisição encerrada" };
  }

  const comentario = await db.comentario.create({ data: { requisicaoId: id, autorId: eu.id, texto } });
  await auditar({ usuarioId: eu.id, acao: "requisicao.comentar", entidade: "Requisicao", entidadeId: id, resumo: `Comentou em ${numeroRequisicao(id)}`, detalhes: { comentarioId: comentario.id } });
  after(async () => {
    // Avisa solicitante e responsável; sem responsável, a equipe fica sabendo do comentário do solicitante.
    const destinos = [req.solicitanteId, req.responsavelId];
    if (!req.responsavelId && eu.id === req.solicitanteId) destinos.push(...(await idsPorPerfil(PERFIS_RESPONSAVEIS)));
    await avisarEnvolvidos(
      destinos.filter((d) => d !== eu.id),
      {
        titulo: `💬 ${eu.nome} comentou em ${numeroRequisicao(id)}`,
        mensagem: texto.length > 140 ? `${texto.slice(0, 137)}…` : texto,
        link: `/requisicoes/${id}`,
      },
      req.paradaMaquina ? req.solicitanteId : null,
    );
  });
  revalidatePath(`/requisicoes/${id}`);
  return { ok: "Comentário adicionado" };
}

/** Quem pode mexer em fotos de uma requisição: solicitante, responsável e equipe. */
async function podeAnexar(eu: { id: string; perfil: Parameters<typeof pode>[0] }, requisicaoId: number) {
  const req = await db.requisicao.findUnique({ where: { id: requisicaoId }, select: { solicitanteId: true, responsavelId: true, status: true } });
  if (!req) return null;
  const ok = pode(eu.perfil, "atenderRequisicoes") || req.solicitanteId === eu.id || req.responsavelId === eu.id;
  return ok ? req : null;
}

export async function enviarFotos(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const eu = await exigirModulo("manutencao");
  const id = Number(form.get("id"));
  const equipe = pode(eu.perfil, "atenderRequisicoes");
  const tipo = form.get("tipo") === "SERVICO" && equipe ? "SERVICO" : "PROBLEMA";
  const req = await podeAnexar(eu, id);
  if (!req) return { erro: "Sem permissão" };
  // Encerrada: só a equipe ainda anexa (ex.: a foto do serviço feito depois de concluir)
  if (STATUS_FINAIS.includes(req.status) && !equipe) return { erro: "Requisição encerrada" };
  const fotos = fotosDoForm(form);
  if (fotos.length === 0) return { erro: "Escolha ao menos uma foto" };

  try {
    const processadas = await Promise.all(fotos.map(processarFoto));
    await db.anexo.createMany({
      data: processadas.map((f) => ({ ...f, dados: new Uint8Array(f.dados), miniatura: new Uint8Array(f.miniatura), requisicaoId: id, autorId: eu.id, tipo })),
    });
  } catch (e) {
    console.error("Falha ao anexar fotos", e);
    return { erro: e instanceof ErroFoto ? e.message : "Não foi possível salvar as fotos" };
  }
  await auditar({
    usuarioId: eu.id,
    acao: "requisicao.foto",
    entidade: "Requisicao",
    entidadeId: id,
    resumo: `Anexou ${fotos.length} foto${fotos.length > 1 ? "s" : ""} ${tipo === "SERVICO" ? "do serviço" : "do problema"} em ${numeroRequisicao(id)}`,
  });
  revalidatePath(`/requisicoes/${id}`);
  return { ok: fotos.length > 1 ? `${fotos.length} fotos anexadas` : "Foto anexada" };
}

export async function removerFoto(anexoId: string) {
  const eu = await exigirModulo("manutencao");
  const anexo = await db.anexo.findUnique({ where: { id: anexoId }, select: { requisicaoId: true, autorId: true } });
  if (!anexo) return;
  if (anexo.autorId !== eu.id && !pode(eu.perfil, "cancelarRequisicoes")) throw new Error("Sem permissão");
  await db.anexo.delete({ where: { id: anexoId } });
  await auditar({ usuarioId: eu.id, acao: "requisicao.foto.remover", entidade: "Requisicao", entidadeId: anexo.requisicaoId, resumo: `Removeu uma foto de ${numeroRequisicao(anexo.requisicaoId)}` });
  revalidatePath(`/requisicoes/${anexo.requisicaoId}`);
}

const horasSchema = z.object({
  id: z.coerce.number().int(),
  inicio: z.string().min(1, "Informe quando começou"),
  horas: z.coerce.number().min(0).max(24),
  minutos: z.coerce.number().min(0).max(59),
  descricao: z.preprocess(vazioParaNull, z.string().trim().max(500).nullable()),
  usuarioId: z.preprocess(vazioParaNull, z.string().nullable()),
});

/** Registra horas trabalhadas. Supervisor/gerente podem lançar em nome de outro manutentor. */
export async function registrarHoras(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const eu = await exigirModulo("manutencao");
  if (!pode(eu.perfil, "apontarHoras")) return { erro: "Sem permissão" };
  const dados = horasSchema.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: dados.error.issues[0].message };
  const { id, horas, minutos, descricao } = dados.data;
  const total = Math.round(horas * 60 + minutos);
  if (total <= 0) return { erro: "Informe o tempo trabalhado" };
  if (total > 24 * 60) return { erro: "Máximo de 24 horas por lançamento" };
  const inicio = dataLocalParaDate(dados.data.inicio);
  if (!inicio) return { erro: "Data inválida" };
  if (inicio > new Date()) return { erro: "A data não pode ser no futuro" };

  let usuarioId = eu.id;
  if (dados.data.usuarioId && dados.data.usuarioId !== eu.id) {
    if (!pode(eu.perfil, "atribuirResponsavel")) return { erro: "Você só pode lançar as suas horas" };
    const outro = await db.usuario.findUnique({ where: { id: dados.data.usuarioId }, select: { perfil: true, ativo: true } });
    if (!outro?.ativo || !PERFIS_RESPONSAVEIS.includes(outro.perfil)) return { erro: "Manutentor inválido" };
    usuarioId = dados.data.usuarioId;
  }
  if (!(await db.requisicao.count({ where: { id } }))) return { erro: "Requisição não encontrada" };

  const ap = await db.apontamento.create({ data: { requisicaoId: id, usuarioId, inicio, minutos: total, descricao } });
  await auditar({
    usuarioId: eu.id,
    acao: "requisicao.horas",
    entidade: "Requisicao",
    entidadeId: id,
    resumo: `Lançou ${formatarDuracao(total)} em ${numeroRequisicao(id)}`,
    detalhes: { apontamentoId: ap.id, minutos: total, para: usuarioId },
  });
  revalidatePath(`/requisicoes/${id}`);
  return { ok: `${formatarDuracao(total)} registradas` };
}

export async function removerHoras(apontamentoId: string) {
  const eu = await exigirModulo("manutencao");
  const ap = await db.apontamento.findUnique({ where: { id: apontamentoId } });
  if (!ap) return { erro: "Lançamento não encontrado" };
  if (ap.usuarioId !== eu.id && !pode(eu.perfil, "atribuirResponsavel")) return { erro: "Sem permissão" };
  await db.apontamento.delete({ where: { id: apontamentoId } });
  await auditar({ usuarioId: eu.id, acao: "requisicao.horas.remover", entidade: "Requisicao", entidadeId: ap.requisicaoId, resumo: `Removeu lançamento de ${formatarDuracao(ap.minutos)} de ${numeroRequisicao(ap.requisicaoId)}` });
  revalidatePath(`/requisicoes/${ap.requisicaoId}`);
}

export async function aplicarChecklist(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const eu = await exigirModulo("manutencao");
  if (!pode(eu.perfil, "apontarHoras")) return { erro: "Sem permissão" };
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return { erro: "Requisição inválida" };
  const req = await db.requisicao.findUnique({ where: { id }, select: { status: true } });
  if (!req) return { erro: "Requisição não encontrada" };
  if (STATUS_FINAIS.includes(req.status)) return { erro: "Requisição encerrada: o checklist não pode mais ser alterado" };
  const modeloId = String(form.get("modeloId") ?? "");
  const modelo = await db.checklistModelo.findUnique({ where: { id: modeloId }, include: { itens: { orderBy: { ordem: "asc" } } } });
  if (!modelo) return { erro: "Escolha um checklist" };
  const ultimo = await db.checklistItem.aggregate({ where: { requisicaoId: id }, _max: { ordem: true } });
  const base = (ultimo._max.ordem ?? 0) + 1;
  await db.checklistItem.createMany({ data: modelo.itens.map((i, n) => ({ requisicaoId: id, texto: i.texto, ordem: base + n })) });
  await auditar({ usuarioId: eu.id, acao: "requisicao.checklist", entidade: "Requisicao", entidadeId: id, resumo: `Aplicou o checklist "${modelo.nome}" em ${numeroRequisicao(id)}` });
  revalidatePath(`/requisicoes/${id}`);
  return { ok: `Checklist "${modelo.nome}" adicionado` };
}

export async function marcarItemChecklist(itemId: string, feito: boolean) {
  const eu = await exigirModulo("manutencao");
  if (!pode(eu.perfil, "apontarHoras")) return { erro: "Sem permissão" };
  // Requisição encerrada: o checklist fica como foi concluído
  const atual = await db.checklistItem.findUnique({ where: { id: itemId }, select: { requisicao: { select: { status: true } } } });
  if (!atual || STATUS_FINAIS.includes(atual.requisicao.status)) return;
  const item = await db.checklistItem.update({
    where: { id: itemId },
    data: { feito, feitoPorId: feito ? eu.id : null, feitoEm: feito ? new Date() : null },
  });
  await auditar({
    usuarioId: eu.id,
    acao: "requisicao.checklist.item",
    entidade: "Requisicao",
    entidadeId: item.requisicaoId,
    resumo: `${feito ? "Marcou" : "Desmarcou"} "${item.texto}" em ${numeroRequisicao(item.requisicaoId)}`,
  });
  revalidatePath(`/requisicoes/${item.requisicaoId}`);
}
