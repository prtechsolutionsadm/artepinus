"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { verificarPedidosProntos } from "@/lib/alertas-serraria";
import { z } from "zod";
import { auditar, diferencas } from "@/lib/auditoria";
import { dataLocalParaDate, formatarData, formatarDuracao } from "@/lib/constantes";
import { db } from "@/lib/db";
import { podeProducao, temModulo } from "@/lib/permissoes";
import {
  CENTRO,
  CHECKLIST_ESTUFA,
  arred,
  dateParaDia,
  diaParaDate,
  formatarDia,
  hojeSP,
  ESPESSURAS,
  LARGURAS,
  COMPRIMENTOS,
  MISTA,
  itensDaLinha,
  rotuloLarguras,
} from "@/lib/producao";
import { configSerraria } from "@/lib/producao-dados";
import { codigoLote } from "@/lib/rastreio";
import { boletimDoDia, sincronizarParadasDoDia } from "@/lib/paradas";
import { criarRequisicaoCompleta } from "@/lib/requisicoes";
import { exigirUsuario } from "@/lib/session";
import type { EstadoForm } from "./auth";

export type Resultado = { erro?: string; id?: string | number; numero?: number };

const vazioParaNull = (v: unknown) => (v === "" || v === undefined ? null : v);
const opcional = <T extends z.ZodTypeAny>(t: T) => z.preprocess(vazioParaNull, t.nullable());
const dia = z.iso.date({ message: "Data inválida" });
const positivo = (msg: string) => z.coerce.number({ message: msg }).positive(msg);

function erroUnico(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
}

/** P2025: o registro não existe (outros erros não podem virar "não encontrado"). */
function registroNaoEncontrado(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && e.code === "P2025";
}

async function exigirAcao(acao: "lancar" | "gerir") {
  const eu = await exigirUsuario();
  return { eu, ok: podeProducao(eu, acao) };
}

// ============================ Boletim da serraria ============================

const boletimSchema = z.object({
  id: opcional(z.string()),
  data: dia,
  torasQtd: opcional(z.coerce.number().int().min(0)),
  torasM3: opcional(z.coerce.number().min(0)),
  observacoes: opcional(z.string().trim().max(2000)),
  paradas: z
    .array(
      z.object({
        motivoId: opcional(z.string()),
        equipamentoId: opcional(z.string()),
        centro: z.enum(["MEC", "ELE", "OPE"]),
        ocorrencias: z.coerce.number().int().min(1).default(1),
        minutos: positivo("Informe os minutos parados"),
        descricao: opcional(z.string().trim().max(500)),
        requisicaoId: opcional(z.coerce.number().int()),
      }),
    )
    .max(200),
  /** Cargas de toras serradas no dia (rastreabilidade). */
  cargaIds: z.array(z.string()).max(60).default([]),
});

export type DadosBoletim = z.input<typeof boletimSchema>;

/**
 * Dados do dia (paradas, toras serradas, observações). A meta e as horas vêm da
 * configuração padrão; a produção entra pelos lotes (grade).
 */
export async function salvarBoletim(entrada: DadosBoletim): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("lancar");
  if (!ok) return { erro: "Sem permissão" };
  const parse = boletimSchema.safeParse(entrada);
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const { id, paradas, cargaIds, ...campos } = parse.data;
  if (campos.data > hojeSP()) return { erro: "A data do boletim não pode ser futura" };
  const cfg = await configSerraria();
  const antes = id ? await db.boletimProducao.findUnique({ where: { id } }) : null;
  if (id && !antes) return { erro: "Boletim não encontrado" };
  if (antes && dateParaDia(antes.data) !== campos.data) return { erro: "A data do boletim não pode ser alterada" };
  const horas = antes?.horasProgramadas ?? cfg.horasDia;
  // As paradas marcadas na hora (botão "Máquina parou") não passam pelo formulário
  const automaticas = id
    ? (await db.paradaProducao.aggregate({ where: { boletimId: id, paradaMaquinaId: { not: null } }, _sum: { minutos: true } }))._sum.minutos ?? 0
    : 0;
  const minutosParados = paradas.reduce((t, p) => t + p.minutos, 0);
  if (minutosParados > 0 && minutosParados + automaticas > horas * 60)
    return {
      erro: `As paradas somam ${formatarDuracao(minutosParados + automaticas)}${automaticas ? ` (${formatarDuracao(automaticas)} marcadas na hora)` : ""}, mais que as ${horas} h programadas`,
    };

  const dados = { ...campos, data: diaParaDate(campos.data), paradas: { create: paradas } };
  try {
    if (id && antes) {
      if (antes.responsavelId !== eu.id && !podeProducao(eu, "gerir")) return { erro: "Só o supervisor edita boletins de outra pessoa" };
      await db.$transaction([
        db.paradaProducao.deleteMany({ where: { boletimId: id, paradaMaquinaId: null } }),
        db.boletimProducao.update({ where: { id }, data: { ...dados, cargas: { set: cargaIds.map((c) => ({ id: c })) } } }),
      ]);
      await auditar({
        usuarioId: eu.id,
        acao: "boletim.editar",
        entidade: "BoletimProducao",
        entidadeId: id,
        resumo: `Editou o boletim de ${formatarDia(dados.data)} (${paradas.length} parada(s))`,
        detalhes: diferencas(antes, { ...campos, data: dados.data }, ["data", "torasQtd", "torasM3", "observacoes"]),
      });
      revalidatePath("/producao", "layout");
      return { id };
    }
    const novo = await db.boletimProducao.create({
      data: { ...dados, metaM3: cfg.metaDiariaM3, horasProgramadas: cfg.horasDia, responsavelId: eu.id, cargas: { connect: cargaIds.map((c) => ({ id: c })) } },
    });
    await auditar({ usuarioId: eu.id, acao: "boletim.criar", entidade: "BoletimProducao", entidadeId: novo.id, resumo: `Abriu o boletim de ${formatarDia(novo.data)} (${paradas.length} parada(s))` });
    await sincronizarParadasDoDia(campos.data);
    revalidatePath("/producao", "layout");
    return { id: novo.id };
  } catch (e) {
    if (erroUnico(e)) return { erro: "Já existe um boletim para esta data — abra-o na lista para editar" };
    throw e;
  }
}

// ============================ Ficha de madeira ============================

const OPCOES_LARGURA = [MISTA, ...LARGURAS.map(String)];

/** Uma linha da ficha: espessura, larguras marcadas e peças por comprimento (mm). */
const linhaFichaSchema = z.object({
  espessura: z.coerce.number({ message: "Escolha a espessura" }).int().refine((e) => (ESPESSURAS as readonly number[]).includes(e), "Escolha a espessura de cada linha"),
  larguras: z
    .array(z.string())
    .min(1, "Marque a largura (ou Mista) de cada linha")
    .refine((l) => l.every((x) => OPCOES_LARGURA.includes(x)), "Largura fora da ficha"),
  pecas: z
    .record(z.string(), z.coerce.number().int().min(0).max(100000))
    .refine((p) => Object.keys(p).every((k) => COMPRIMENTOS.some((c) => String(c.mm) === k)), "Comprimento fora da ficha"),
  gradesUmidas: opcional(z.coerce.number().int().min(0).max(10000)).optional(),
  /** "Madeira em" da linha (inventário): GRADE, PACOTE, VERDE ou ESTUFA:<id>. */
  local: opcional(z.string().regex(/^(GRADE|PACOTE|VERDE|ESTUFA:[\w-]+)$/, "Local inválido")).optional(),
});
const fichaSchema = z
  .array(linhaFichaSchema)
  .max(40)
  .transform((ls) => ls.filter((l) => Object.values(l.pecas).some((n) => n > 0)))
  .refine((ls) => ls.length > 0, "Preencha as peças de pelo menos um comprimento");

/** Linhas da ficha → itens gravados (um por comprimento), com a classe e o m³ calculados aqui. */
function itensDaFicha(linhas: z.output<typeof fichaSchema>) {
  return linhas.flatMap((l, n) =>
    itensDaLinha({ espessura: l.espessura, larguras: l.larguras, pecas: Object.fromEntries(Object.entries(l.pecas).map(([k, v]) => [Number(k), v])) }).map((i, j) => ({
      ...i,
      espessura: l.espessura,
      larguras: rotuloLarguras(l.larguras),
      linha: n,
      grades: j === 0 ? (l.gradesUmidas ?? 0) : 0,
      local: l.local ?? null,
    })),
  );
}

// ============================ Lotes (ficha da serraria) ============================

const loteSchema = z.object({
  chaveOffline: opcional(z.string().uuid()),
  data: dia,
  pedidoId: z.string().min(1, "Escolha o pedido"),
  linhas: fichaSchema,
});

export type DadosLote = z.input<typeof loteSchema>;

/** Lança a ficha da serraria (um pedido) no boletim do dia e gera o lote com etiqueta. */
export async function lancarLote(entrada: DadosLote): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("lancar");
  if (!ok) return { erro: "Sem permissão" };
  const parse = loteSchema.safeParse(entrada);
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const { chaveOffline, data, pedidoId } = parse.data;
  const itens = itensDaFicha(parse.data.linhas);
  const espessuras = [...new Set(itens.map((i) => i.espessura))];
  const espessura = espessuras.length === 1 ? espessuras[0] : null;
  if (data > hojeSP()) return { erro: "A data não pode ser futura" };
  if (chaveOffline) {
    const ja = await db.lote.findUnique({ where: { chaveOffline } });
    if (ja) return { id: ja.id, numero: ja.numero };
  }
  const pedido = await db.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido) return { erro: "Pedido não encontrado" };

  // Boletim do dia: usa o existente ou abre com a configuração padrão (e traz as paradas do dia)
  const { boletim, novo } = await boletimDoDia(data, eu.id);
  if (novo) await sincronizarParadasDoDia(data);
  const linhas = itens.map((i) => ({
    boletimId: boletim.id,
    espessura: i.espessura,
    largura: i.largura,
    larguras: i.larguras,
    comprimento: i.comprimento,
    pecas: i.pecas,
    classe: i.classe,
    linha: i.linha,
    m3: i.m3,
  }));
  const volume = arred(linhas.reduce((t, l) => t + l.m3, 0), 3);
  const lote = await db.lote.create({
    data: { boletimId: boletim.id, pedidoId, espessura, criadoPorId: eu.id, chaveOffline, itens: { create: linhas } },
  });
  await auditar({
    usuarioId: eu.id,
    acao: "boletim.lote",
    entidade: "Lote",
    entidadeId: lote.id,
    resumo: `Lote ${codigoLote(lote.numero)}: ${espessuras.join("/")} mm, ${linhas.reduce((t, l) => t + l.pecas, 0)} peças, ${volume} m³ — pedido ${pedido.numero}`,
  });
  revalidatePath("/producao", "layout");
  return { id: lote.id, numero: lote.numero };
}

export async function excluirLote(id: string): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("gerir");
  if (!ok) return { erro: "Sem permissão" };
  let l;
  try {
    l = await db.lote.delete({ where: { id } });
  } catch (e) {
    if (registroNaoEncontrado(e)) return { erro: "Lote não encontrado" };
    console.error("Falha ao excluir lote", e);
    return { erro: "Não foi possível excluir o lote. Tente novamente." };
  }
  await auditar({ usuarioId: eu.id, acao: "boletim.lote.excluir", entidade: "Lote", entidadeId: id, resumo: `Excluiu o lote ${codigoLote(l.numero)}` });
  revalidatePath("/producao", "layout");
  return {};
}

export async function excluirBoletim(id: string): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("gerir");
  if (!ok) return { erro: "Sem permissão" };
  const atual = await db.boletimProducao.findUnique({
    where: { id },
    select: { _count: { select: { pacotes: true, ciclos: true } }, lotes: { select: { numero: true }, orderBy: { numero: "asc" } } },
  });
  if (!atual) return { erro: "Boletim não encontrado" };
  // A origem (rastreio e declaração) dos pacotes e ciclos chega às florestas por este boletim
  const { pacotes, ciclos } = atual._count;
  if (pacotes || ciclos)
    return {
      erro: `Há ${[pacotes ? `${pacotes} pacote(s)` : "", ciclos ? `${ciclos} ciclo(s) de estufa` : ""].filter(Boolean).join(" e ")} com a madeira deste dia; o boletim não pode ser excluído porque a origem deles depende dele.`,
    };
  let b;
  try {
    b = await db.boletimProducao.delete({ where: { id } });
  } catch (e) {
    if (registroNaoEncontrado(e)) return { erro: "Boletim não encontrado" };
    console.error("Falha ao excluir boletim", e);
    return { erro: "Não foi possível excluir o boletim. Tente novamente." };
  }
  // Os lotes do dia saem junto (cascade): registra os códigos apagados
  const lotes = atual.lotes.map((l) => codigoLote(l.numero));
  await auditar({
    usuarioId: eu.id,
    acao: "boletim.excluir",
    entidade: "BoletimProducao",
    entidadeId: id,
    resumo: `Excluiu o boletim da serraria de ${formatarDia(b.data)}${lotes.length ? ` e os lotes ${lotes.join(", ")}` : ""}`,
  });
  revalidatePath("/producao", "layout");
  return {};
}

/** Parada mecânica/elétrica vira requisição de manutenção (corretiva) já ligada ao boletim. */
export async function abrirRequisicaoDaParada(paradaId: string): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("lancar");
  if (!ok || !temModulo(eu, "manutencao")) return { erro: "Sem acesso ao módulo de manutenção" };
  const p = await db.paradaProducao.findUnique({
    where: { id: paradaId },
    include: { motivo: true, boletim: { select: { id: true, data: true } }, equipamento: { select: { id: true } } },
  });
  if (!p) return { erro: "Parada não encontrada" };
  if (p.requisicaoId) return { id: p.requisicaoId };

  const titulo = (p.motivo ? `Parada: ${p.motivo.descricao}` : `Parada ${CENTRO[p.centro].label.toLowerCase()} na serraria`).slice(0, 120);
  const descricao = [
    `Parada registrada no boletim da serraria de ${formatarDia(p.boletim.data)}.`,
    `Centro: ${CENTRO[p.centro].label} · ${p.ocorrencias} ocorrência(s) · ${formatarDuracao(p.minutos)} parado.`,
    p.motivo ? `Motivo nº ${p.motivo.codigo}: ${p.motivo.descricao}.` : null,
    p.descricao ? `Observação: ${p.descricao}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const req = await criarRequisicaoCompleta(
    eu,
    {
      titulo,
      descricao,
      tipo: "CORRETIVA",
      prioridade: "ALTA",
      local: "Serraria",
      setorId: null,
      equipamentoId: p.equipamentoId ?? p.motivo?.equipamentoId ?? null,
      maquinaParada: false,
      centroParada: null,
      registradaEm: null,
      chaveOffline: null,
    },
    [],
    "online",
  );
  await db.paradaProducao.update({ where: { id: p.id }, data: { requisicaoId: req.id } });
  revalidatePath(`/producao/boletins/${p.boletim.id}`);
  return { id: req.id };
}

// ============================ Cadastros ============================

const motivoSchema = z.object({
  id: opcional(z.string()),
  codigo: z.coerce.number().int().positive("Código inválido"),
  descricao: z.string().trim().min(3, "Descreva o motivo").max(150),
  centro: z.enum(["MEC", "ELE", "OPE"]),
  equipamentoId: opcional(z.string()),
  ativo: z.preprocess((v) => v === "on", z.boolean()),
});

export async function salvarMotivo(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const { eu, ok } = await exigirAcao("gerir");
  if (!ok) return { erro: "Sem permissão" };
  const parse = motivoSchema.safeParse(Object.fromEntries(form));
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const { id, ...dados } = parse.data;
  try {
    if (id) {
      const antes = await db.motivoParada.findUniqueOrThrow({ where: { id } });
      await db.motivoParada.update({ where: { id }, data: dados });
      const mudou = diferencas(antes, dados, ["codigo", "descricao", "centro", "equipamentoId", "ativo"]);
      if (Object.keys(mudou).length) {
        await auditar({ usuarioId: eu.id, acao: "motivo.editar", entidade: "MotivoParada", entidadeId: id, resumo: `Editou o motivo de parada ${dados.codigo}`, detalhes: mudou });
      }
    } else {
      const novo = await db.motivoParada.create({ data: dados });
      await auditar({ usuarioId: eu.id, acao: "motivo.criar", entidade: "MotivoParada", entidadeId: novo.id, resumo: `Cadastrou o motivo de parada ${novo.codigo} – ${novo.descricao}` });
    }
  } catch (e) {
    if (erroUnico(e)) return { erro: "Já existe um motivo com este código" };
    throw e;
  }
  revalidatePath("/producao/cadastros");
  return { ok: id ? "Motivo atualizado" : "Motivo cadastrado" };
}

const estufaSchema = z.object({
  id: opcional(z.string()),
  numero: z.coerce.number().int().positive("Número inválido"),
  nome: z.string().trim().min(2, "Informe o nome").max(60),
  capacidadeM3: opcional(z.coerce.number().positive("Capacidade inválida")),
  equipamentoId: opcional(z.string()),
  ativo: z.preprocess((v) => v === "on", z.boolean()),
});

export async function salvarEstufa(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const { eu, ok } = await exigirAcao("gerir");
  if (!ok) return { erro: "Sem permissão" };
  const parse = estufaSchema.safeParse(Object.fromEntries(form));
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const { id, ...dados } = parse.data;
  try {
    if (id) {
      const antes = await db.estufa.findUniqueOrThrow({ where: { id } });
      await db.estufa.update({ where: { id }, data: dados });
      const mudou = diferencas(antes, dados, ["numero", "nome", "capacidadeM3", "equipamentoId", "ativo"]);
      if (Object.keys(mudou).length) {
        await auditar({ usuarioId: eu.id, acao: "estufa.editar", entidade: "Estufa", entidadeId: id, resumo: `Editou a ${dados.nome}`, detalhes: mudou });
      }
    } else {
      const nova = await db.estufa.create({ data: dados });
      await auditar({ usuarioId: eu.id, acao: "estufa.criar", entidade: "Estufa", entidadeId: nova.id, resumo: `Cadastrou a ${nova.nome}` });
    }
  } catch (e) {
    if (erroUnico(e)) return { erro: "Número de estufa ou equipamento já usado por outra estufa" };
    throw e;
  }
  revalidatePath("/producao", "layout");
  return { ok: id ? "Estufa atualizada" : "Estufa cadastrada" };
}


// ============================ Estufas: ciclos de secagem ============================

const cicloSchema = z.object({
  id: opcional(z.string()),
  estufaId: z.string().min(1, "Escolha a estufa"),
  numero: opcional(z.coerce.number().int().positive()),
  entrada: z.string().min(1, "Informe a entrada"),
  previsaoSaida: opcional(z.string()),
  /** Responsável pelo plantão (usuário do sistema). */
  plantaoId: opcional(z.string()),
  proximaCarga: opcional(z.string().trim().max(300)),
  observacoes: opcional(z.string().trim().max(2000)),
  /** Ficha da madeira carregada (mesmo formato do papel da estufa). */
  linhas: fichaSchema,
  /** Dias de serraria cuja madeira entrou no ciclo (rastreabilidade). */
  boletimIds: z.array(z.string()).max(60).default([]),
});

export type DadosCiclo = z.input<typeof cicloSchema>;

export async function salvarCiclo(entrada: DadosCiclo): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("lancar");
  if (!ok) return { erro: "Sem permissão" };
  const parse = cicloSchema.safeParse(entrada);
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const { id, linhas, boletimIds, ...c } = parse.data;
  const cargas = itensDaFicha(linhas).map((i) => ({
    espessura: i.espessura,
    largura: i.larguras,
    comprimento: i.comprimento / 1000,
    pecas: i.pecas,
    grades: i.grades,
    linha: i.linha,
    m3: i.m3,
  }));
  const dados = {
    ...c,
    entrada: dataLocalParaDate(c.entrada),
    previsaoSaida: c.previsaoSaida ? dataLocalParaDate(c.previsaoSaida) : null,
  };
  if (!dados.entrada) return { erro: "Data de entrada inválida" };
  if (dados.previsaoSaida && dados.previsaoSaida < dados.entrada) return { erro: "A previsão de saída é anterior à entrada" };
  const antes = id ? await db.cicloSecagem.findUnique({ where: { id } }) : null;
  if (id && !antes) return { erro: "Ciclo não encontrado" };
  if (antes && antes.status !== "EM_SECAGEM") return { erro: "O ciclo já foi encerrado" };
  const estufa = await db.estufa.findUnique({ where: { id: c.estufaId } });
  if (!estufa) return { erro: "Estufa não encontrada" };
  const outro = await db.cicloSecagem.findFirst({ where: { estufaId: c.estufaId, status: "EM_SECAGEM", ...(id ? { id: { not: id } } : {}) } });
  if (outro) return { erro: `A ${estufa.nome} já tem um ciclo em secagem — conclua-o antes` };

  const volume = arred(cargas.reduce((s, x) => s + x.m3, 0), 3);
  if (id && antes) {
    // Previsão mudou: o aviso de estufa atrasada pode sair de novo
    const mudouPrevisao = (antes.previsaoSaida?.getTime() ?? null) !== (dados.previsaoSaida?.getTime() ?? null);
    await db.$transaction([
      db.cargaCiclo.deleteMany({ where: { cicloId: id } }),
      db.cicloSecagem.update({
        where: { id },
        data: {
          ...dados,
          entrada: dados.entrada,
          ...(mudouPrevisao ? { alertaAtrasoEm: null } : {}),
          cargas: { create: cargas },
          boletins: { set: boletimIds.map((b) => ({ id: b })) },
        },
      }),
    ]);
    await auditar({ usuarioId: eu.id, acao: "ciclo.editar", entidade: "CicloSecagem", entidadeId: id, resumo: `Editou o ciclo da ${estufa.nome} (${volume} m³)` });
    revalidatePath("/producao", "layout");
    return { id };
  }
  let ordem = 0;
  const novo = await db.cicloSecagem.create({
    data: {
      ...dados,
      entrada: dados.entrada,
      responsavelId: eu.id,
      cargas: { create: cargas },
      boletins: { connect: boletimIds.map((b) => ({ id: b })) },
      checklist: { create: CHECKLIST_ESTUFA.flatMap((s) => s.itens.map((texto) => ({ secao: s.secao, texto, ordem: ordem++ }))) },
    },
  });
  await auditar({ usuarioId: eu.id, acao: "ciclo.criar", entidade: "CicloSecagem", entidadeId: novo.id, resumo: `Iniciou ciclo de secagem na ${estufa.nome} (${volume} m³)` });
  revalidatePath("/producao", "layout");
  return { id: novo.id };
}

const marcarItemSchema = z.object({
  itemId: z.string().min(1, "Item inválido").max(64, "Item inválido"),
  conforme: z.boolean({ message: "Marcação inválida" }).nullable(),
  observacao: z.string().max(2000, "Observação muito longa").optional(),
});

export async function marcarItemCiclo(itemId: string, conforme: boolean | null, observacao?: string): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("lancar");
  if (!ok) return { erro: "Sem permissão" };
  const parse = marcarItemSchema.safeParse({ itemId, conforme, observacao });
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const item = await db.itemChecklistCiclo.findUnique({
    where: { id: itemId },
    include: { ciclo: { select: { id: true, status: true, estufa: { select: { nome: true } } } } },
  });
  if (!item) return { erro: "Item não encontrado" };
  if (item.ciclo.status !== "EM_SECAGEM") return { erro: "O ciclo já foi encerrado" };
  const obs = observacao === undefined ? undefined : observacao.trim().slice(0, 300) || null;
  await db.itemChecklistCiclo.update({
    where: { id: itemId },
    data: {
      conforme,
      observacao: obs,
      marcadoPorId: conforme === null ? null : eu.id,
      marcadoEm: conforme === null ? null : new Date(),
    },
  });
  await auditar({
    usuarioId: eu.id,
    acao: "ciclo.checklist.item",
    entidade: "CicloSecagem",
    entidadeId: item.ciclo.id,
    resumo: `${conforme === null ? "Desmarcou" : conforme ? "Marcou OK" : "Marcou não conforme"} "${item.texto}" no ciclo da ${item.ciclo.estufa.nome}`,
    detalhes: { itemId, de: item.conforme, para: conforme, ...(obs !== undefined ? { observacao: obs } : {}) },
  });
  revalidatePath(`/producao/estufas/ciclos/${item.ciclo.id}`);
  return {};
}

const encerrarSchema = z.object({
  id: z.string(),
  saida: z.string().min(1, "Informe a data/hora de saída"),
  umidadeFinal: opcional(z.coerce.number().min(0).max(200)),
  observacoes: opcional(z.string().trim().max(2000)),
});

export async function concluirCiclo(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const { eu, ok } = await exigirAcao("lancar");
  if (!ok) return { erro: "Sem permissão" };
  const parse = encerrarSchema.safeParse(Object.fromEntries(form));
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const { id, umidadeFinal, observacoes } = parse.data;
  const saida = dataLocalParaDate(parse.data.saida);
  const ciclo = await db.cicloSecagem.findUnique({ where: { id }, include: { estufa: true } });
  if (!ciclo || ciclo.status !== "EM_SECAGEM") return { erro: "Ciclo não está em secagem" };
  if (!saida || saida < ciclo.entrada) return { erro: "A saída precisa ser depois da entrada" };
  const naEstufa = await db.pacote.findMany({ where: { cicloId: id, status: "EM_ESTUFA" }, select: { id: true } });
  await db.$transaction([
    db.cicloSecagem.update({
      where: { id },
      data: { status: "CONCLUIDO", saida, umidadeFinal, ...(observacoes ? { observacoes } : {}) },
    }),
    // Pacotes que estavam nesta estufa saem secos
    db.pacote.updateMany({ where: { id: { in: naEstufa.map((p) => p.id) } }, data: { status: "SECO", ...(umidadeFinal != null ? { umidade: umidadeFinal } : {}) } }),
    db.eventoPacote.createMany({
      data: naEstufa.map((p) => ({
        pacoteId: p.id,
        tipo: "SAIDA_ESTUFA" as const,
        descricao: `Saiu seco da ${ciclo.estufa.nome} em ${formatarData(saida, true)}${umidadeFinal != null ? ` com ${umidadeFinal}% de umidade` : ""}`,
        usuarioId: eu.id,
      })),
    }),
  ]);
  await auditar({ usuarioId: eu.id, acao: "ciclo.concluir", entidade: "CicloSecagem", entidadeId: id, resumo: `Concluiu o ciclo da ${ciclo.estufa.nome}` });
  // Os pacotes saíram secos: algum pedido pode ter ficado pronto para expedir
  const pedidos = await db.pacote.findMany({ where: { cicloId: id, pedidoId: { not: null } }, select: { pedidoId: true }, distinct: ["pedidoId"] });
  after(() => verificarPedidosProntos(pedidos.map((p) => p.pedidoId)).catch((e) => console.error(e)));
  revalidatePath("/producao", "layout");
  return { ok: "Ciclo concluído" };
}

export async function cancelarCiclo(id: string): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("gerir");
  if (!ok) return { erro: "Sem permissão" };
  const ciclo = await db.cicloSecagem.findUnique({ where: { id }, include: { estufa: true } });
  if (!ciclo || ciclo.status !== "EM_SECAGEM") return { erro: "Ciclo não está em secagem" };
  const naEstufa = await db.pacote.findMany({ where: { cicloId: id, status: "EM_ESTUFA" }, select: { id: true } });
  await db.$transaction([
    db.cicloSecagem.update({ where: { id }, data: { status: "CANCELADO" } }),
    // Pacotes voltam a verde e saem do ciclo cancelado
    db.pacote.updateMany({ where: { id: { in: naEstufa.map((p) => p.id) } }, data: { status: "VERDE", cicloId: null } }),
    db.eventoPacote.createMany({
      data: naEstufa.map((p) => ({ pacoteId: p.id, tipo: "MOVIMENTADO" as const, descricao: `Ciclo da ${ciclo.estufa.nome} cancelado: pacote voltou a verde`, usuarioId: eu.id })),
    }),
  ]);
  await auditar({ usuarioId: eu.id, acao: "ciclo.cancelar", entidade: "CicloSecagem", entidadeId: id, resumo: `Cancelou o ciclo da ${ciclo.estufa.nome}` });
  revalidatePath("/producao", "layout");
  return {};
}

// ============================ Recebimento de toras ============================

const cargaTorasSchema = z.object({
  id: opcional(z.string()),
  /** Chave gerada no aparelho (envio sem internet), para não duplicar. */
  chaveOffline: opcional(z.string().uuid()),
  data: dia,
  florestaId: z.string().min(1, "Escolha a floresta"),
  fornecedorId: z.string().min(1, "Escolha o fornecedor"),
  motoristaId: z.string().min(1, "Escolha o motorista"),
  comprimentoMedio: positivo("Informe o comprimento médio").max(20),
  classeDiametro: z.enum(["FINA", "MEDIA", "GROSSA"], { message: "Escolha o diâmetro" }),
  pesoT: positivo("Informe o peso em toneladas").max(200),
  observacoes: opcional(z.string().trim().max(1000)),
});

export type DadosCargaToras = z.input<typeof cargaTorasSchema>;

export async function salvarCargaToras(entrada: DadosCargaToras): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("lancar");
  if (!ok) return { erro: "Sem permissão" };
  const parse = cargaTorasSchema.safeParse(entrada);
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const { id, chaveOffline, ...c } = parse.data;
  if (c.data > hojeSP()) return { erro: "A data não pode ser futura" };
  if (chaveOffline) {
    const ja = await db.cargaToras.findUnique({ where: { chaveOffline } });
    if (ja) return { id: ja.id };
  }
  const [floresta, fornecedor, motorista] = await Promise.all([
    db.origemFlorestal.findUnique({ where: { id: c.florestaId } }),
    db.fornecedor.findUnique({ where: { id: c.fornecedorId } }),
    db.motorista.findUnique({ where: { id: c.motoristaId } }),
  ]);
  if (!floresta || !fornecedor || !motorista) return { erro: "Floresta, fornecedor ou motorista não encontrado" };
  // Guarda nome e placas do momento (histórico não muda se o cadastro mudar)
  const dados = {
    ...c,
    data: diaParaDate(c.data),
    origem: floresta.nome,
    motorista: motorista.nome,
    placa: motorista.placaCaminhao,
    placaJulieta: motorista.placaJulieta,
  };
  const resumo = `${floresta.nome} · ${fornecedor.nome} · ${c.pesoT} t (${c.classeDiametro.toLowerCase()})`;

  if (id) {
    const antes = await db.cargaToras.findUnique({ where: { id } });
    if (!antes) return { erro: "Carga não encontrada" };
    if (antes.responsavelId !== eu.id && !podeProducao(eu, "gerir")) return { erro: "Só o supervisor edita cargas de outra pessoa" };
    await db.cargaToras.update({ where: { id }, data: dados });
    await auditar({ usuarioId: eu.id, acao: "toras.editar", entidade: "CargaToras", entidadeId: id, resumo: `Editou a carga de toras: ${resumo}` });
    revalidatePath("/producao", "layout");
    return { id };
  }
  const nova = await db.cargaToras.create({ data: { ...dados, chaveOffline, responsavelId: eu.id } });
  await auditar({ usuarioId: eu.id, acao: "toras.criar", entidade: "CargaToras", entidadeId: nova.id, resumo: `Recebeu carga de toras: ${resumo}` });
  revalidatePath("/producao", "layout");
  return { id: nova.id };
}

export async function excluirCargaToras(id: string): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("gerir");
  if (!ok) return { erro: "Sem permissão" };
  let c;
  try {
    c = await db.cargaToras.delete({ where: { id } });
  } catch (e) {
    if (registroNaoEncontrado(e)) return { erro: "Carga não encontrada" };
    console.error("Falha ao excluir carga de toras", e);
    return { erro: "Não foi possível excluir a carga. Tente novamente." };
  }
  await auditar({ usuarioId: eu.id, acao: "toras.excluir", entidade: "CargaToras", entidadeId: id, resumo: `Excluiu a carga de toras de ${c.origem} (${formatarDia(c.data)})` });
  revalidatePath("/producao", "layout");
  return {};
}

// ============================ Estoque de madeira ============================

const levantamentoSchema = z.object({
  id: opcional(z.string()),
  chaveOffline: opcional(z.string().uuid()),
  data: dia,
  /** Antigo: um local para o lançamento todo. Agora cada linha da ficha tem o seu ("Madeira em"). */
  local: opcional(z.enum(["GRADE", "PACOTE", "ESTUFA", "VERDE"])).optional(),
  estufaId: opcional(z.string()).optional(),
  observacoes: opcional(z.string().trim().max(1000)),
  /** Ficha: linhas com espessura, larguras e peças por comprimento. */
  linhas: fichaSchema,
});

export type DadosLevantamento = z.input<typeof levantamentoSchema>;

export async function salvarLevantamento(entrada: DadosLevantamento): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("lancar");
  if (!ok) return { erro: "Sem permissão" };
  const parse = levantamentoSchema.safeParse(entrada);
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const { id, chaveOffline, linhas: ficha, observacoes } = parse.data;
  if (parse.data.data > hojeSP()) return { erro: "A data não pode ser futura" };
  if (chaveOffline) {
    const ja = await db.levantamentoEstoque.findUnique({ where: { chaveOffline } });
    if (ja) return { id: ja.id };
  }
  // "Madeira em" por linha; sem ele, vale o local do lançamento (formato anterior)
  const padrao = parse.data.local ? (parse.data.local === "ESTUFA" ? `ESTUFA:${parse.data.estufaId ?? ""}` : parse.data.local) : null;
  const estufas = new Map((await db.estufa.findMany({ select: { id: true, nome: true } })).map((e) => [e.id, e.nome]));
  const itens = itensDaFicha(ficha);
  const linhas: { espessura: number; largura: string; comprimento: number; pecas: number; linha: number; m3: number; local: "GRADE" | "PACOTE" | "ESTUFA" | "VERDE"; estufaId: string | null }[] = [];
  for (const i of itens) {
    const lugar = i.local ?? padrao;
    if (!lugar) return { erro: `Escolha onde está a madeira (Madeira em) na linha ${i.linha + 1}` };
    const [tipo, estufaId] = lugar.split(":") as ["GRADE" | "PACOTE" | "ESTUFA" | "VERDE", string | undefined];
    if (tipo === "ESTUFA" && !(estufaId && estufas.has(estufaId))) return { erro: `Escolha a estufa na linha ${i.linha + 1}` };
    linhas.push({ espessura: i.espessura, largura: i.larguras, comprimento: i.comprimento / 1000, pecas: i.pecas, linha: i.linha, m3: i.m3, local: tipo, estufaId: tipo === "ESTUFA" ? estufaId! : null });
  }
  const volume = arred(linhas.reduce((t, l) => t + l.m3, 0), 2);
  const espessuras = [...new Set(linhas.map((l) => l.espessura))];
  const lugares = [...new Set(linhas.map((l) => `${l.local}:${l.estufaId ?? ""}`))];
  // Cabeçalho: se todas as linhas estão no mesmo lugar, guarda também nele (filtros e histórico)
  const unico = lugares.length === 1 ? linhas[0] : null;
  const dados = {
    data: diaParaDate(parse.data.data),
    observacoes,
    local: unico?.local ?? null,
    estufaId: unico?.estufaId ?? null,
    espessura: espessuras.length === 1 ? espessuras[0] : null,
  };
  const nomeLugar = (l: { local: string; estufaId: string | null }) => (l.local === "ESTUFA" ? (estufas.get(l.estufaId!) ?? "estufa") : l.local.toLowerCase());
  const onde = [...new Set(linhas.map(nomeLugar))].join(", ");

  if (id) {
    const antes = await db.levantamentoEstoque.findUnique({ where: { id } });
    if (!antes) return { erro: "Levantamento não encontrado" };
    if (antes.responsavelId !== eu.id && !podeProducao(eu, "gerir")) return { erro: "Só o supervisor edita levantamentos de outra pessoa" };
    await db.$transaction([
      db.itemEstoque.deleteMany({ where: { levantamentoId: id } }),
      db.levantamentoEstoque.update({ where: { id }, data: { ...dados, itens: { create: linhas } } }),
    ]);
    await auditar({ usuarioId: eu.id, acao: "estoque.editar", entidade: "LevantamentoEstoque", entidadeId: id, resumo: `Editou o inventário de ${formatarDia(dados.data)} (${onde}, ${espessuras.join("/")} mm, ${volume} m³)` });
    revalidatePath("/producao", "layout");
    return { id };
  }
  const novo = await db.levantamentoEstoque.create({ data: { ...dados, chaveOffline, responsavelId: eu.id, itens: { create: linhas } } });
  await auditar({ usuarioId: eu.id, acao: "estoque.criar", entidade: "LevantamentoEstoque", entidadeId: novo.id, resumo: `Inventário de ${formatarDia(dados.data)}: ${onde}, ${espessuras.join("/")} mm, ${volume} m³` });
  revalidatePath("/producao", "layout");
  return { id: novo.id };
}

export async function excluirLevantamento(id: string): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("gerir");
  if (!ok) return { erro: "Sem permissão" };
  let l;
  try {
    l = await db.levantamentoEstoque.delete({ where: { id } });
  } catch (e) {
    if (registroNaoEncontrado(e)) return { erro: "Levantamento não encontrado" };
    console.error("Falha ao excluir levantamento de estoque", e);
    return { erro: "Não foi possível excluir o levantamento. Tente novamente." };
  }
  await auditar({ usuarioId: eu.id, acao: "estoque.excluir", entidade: "LevantamentoEstoque", entidadeId: id, resumo: `Excluiu o levantamento de estoque de ${formatarDia(l.data)}` });
  revalidatePath("/producao", "layout");
  return {};
}
