"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { verificarPedidosProntos } from "@/lib/alertas-serraria";
import { z } from "zod";
import { auditar } from "@/lib/auditoria";
import { db } from "@/lib/db";
import { podeProducao } from "@/lib/permissoes";
import { formatarDia, m3Pecas } from "@/lib/producao";
import { codigoPacote, codigoRomaneio, novoCodigoPublico } from "@/lib/rastreio";
import { exigirUsuario } from "@/lib/session";
import type { EstadoForm } from "./auth";

export type Resultado = { erro?: string; id?: string | number; numeros?: number[]; romaneio?: number };

const vazioParaNull = (v: unknown) => (v === "" || v === undefined ? null : v);
const opcional = <T extends z.ZodTypeAny>(t: T) => z.preprocess(vazioParaNull, t.nullable());
const positivo = (msg: string) => z.coerce.number({ message: msg }).positive(msg);

async function exigirAcao(acao: "lancar" | "gerir") {
  const eu = await exigirUsuario();
  return { eu, ok: podeProducao(eu, acao) };
}

// ============================ Pacotes ============================

const pacoteSchema = z
  .object({
    origem: z.enum(["boletim", "ciclo"]),
    boletimId: opcional(z.string()),
    cicloId: opcional(z.string()),
    espessura: positivo("Espessura inválida").int().max(500),
    largura: positivo("Largura inválida").int().max(1000),
    comprimento: positivo("Comprimento inválido").int().max(12000),
    pecas: positivo("Informe as peças do pacote").int().max(100000),
    quantidade: z.coerce.number().int().min(1, "Quantidade de pacotes inválida").max(50, "No máximo 50 pacotes de uma vez"),
    classe: opcional(z.string().trim().max(40)),
    mercado: z.enum(["EXTERNO", "INTERNO"]).default("EXTERNO"),
    pedidoId: opcional(z.string()),
    observacoes: opcional(z.string().trim().max(500)),
  })
  .refine((d) => (d.origem === "boletim" ? !!d.boletimId : !!d.cicloId), { message: "Escolha de onde vem a madeira do pacote" });

export type DadosPacote = z.input<typeof pacoteSchema>;

/** Forma um ou mais pacotes iguais e registra o primeiro evento da linha do tempo. */
export async function criarPacotes(entrada: DadosPacote): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("lancar");
  if (!ok) return { erro: "Sem permissão para formar pacotes" };
  const parse = pacoteSchema.safeParse(entrada);
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const { origem, boletimId, cicloId, quantidade, ...p } = parse.data;

  let descricao: string;
  if (origem === "boletim") {
    const b = await db.boletimProducao.findUnique({ where: { id: boletimId! }, select: { data: true } });
    if (!b) return { erro: "Boletim não encontrado" };
    descricao = `Formado verde com a madeira serrada em ${formatarDia(b.data)}`;
  } else {
    const c = await db.cicloSecagem.findUnique({ where: { id: cicloId! }, include: { estufa: { select: { nome: true } } } });
    if (!c) return { erro: "Ciclo de estufa não encontrado" };
    if (c.status === "CANCELADO") return { erro: "Este ciclo foi cancelado" };
    descricao = `Formado com a madeira seca da ${c.estufa.nome}${c.numero ? ` (ciclo nº ${c.numero})` : ""}`;
  }
  const m3 = m3Pecas(p.espessura, p.largura, p.comprimento, p.pecas);
  const status = origem === "boletim" ? "VERDE" : "SECO";

  const criados = await db.$transaction(
    Array.from({ length: quantidade }, () =>
      db.pacote.create({
        data: {
          ...p,
          m3,
          status,
          codigoPublico: novoCodigoPublico(),
          boletimId: origem === "boletim" ? boletimId : null,
          cicloId: origem === "ciclo" ? cicloId : null,
          criadoPorId: eu.id,
          eventos: { create: { tipo: "CRIADO", descricao, usuarioId: eu.id } },
        },
        select: { id: true, numero: true },
      }),
    ),
  );
  const numeros = criados.map((c) => c.numero);
  await auditar({
    usuarioId: eu.id,
    acao: "pacote.criar",
    entidade: "Pacote",
    entidadeId: criados[0].id,
    resumo: `Formou ${quantidade} pacote(s) ${p.espessura}×${p.largura}×${p.comprimento} mm: ${codigoPacote(numeros[0])}${quantidade > 1 ? ` a ${codigoPacote(numeros[numeros.length - 1])}` : ""}`,
  });
  revalidatePath("/producao", "layout");
  after(() => verificarPedidosProntos([p.pedidoId]).catch((e) => console.error(e)));
  return { numeros };
}

/** Cria o romaneio (documento da carga) com o motorista e as placas do cadastro. */
async function criarRomaneio(
  criadoPorId: string,
  pacoteIds: string[],
  motoristaId: string | null | undefined,
  observacoes: string | null | undefined,
  nf: { notaFiscal?: string | null; chaveNfe?: string | null } = {},
) {
  const m = motoristaId ? await db.motorista.findUnique({ where: { id: motoristaId } }) : null;
  return db.romaneio.create({
    data: {
      criadoPorId,
      motoristaId: m?.id ?? null,
      motorista: m?.nome ?? null,
      placa: m?.placaCaminhao ?? null,
      placaJulieta: m?.placaJulieta ?? null,
      observacoes: observacoes || null,
      notaFiscal: nf.notaFiscal || null,
      chaveNfe: nf.chaveNfe || null,
      pacotes: { connect: pacoteIds.map((id) => ({ id })) },
    },
  });
}

/** Nota fiscal do romaneio: nº e chave de acesso da NF-e (44 dígitos; espaços e pontos são ignorados). */
const camposNf = {
  notaFiscal: opcional(z.string().trim().max(20)).optional(),
  chaveNfe: opcional(
    z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v === "" || v.length === 44, "A chave da NF-e tem 44 dígitos"),
  ).optional(),
};

const eventoSchema = z.object({
  numero: z.coerce.number().int().positive(),
  acao: z.enum(["estufa", "expedir", "local", "observacao", "cancelar"]),
  cicloId: opcional(z.string()),
  cliente: opcional(z.string().trim().max(120)),
  destino: opcional(z.string().trim().max(120)),
  localizacao: opcional(z.string().trim().max(80)),
  texto: opcional(z.string().trim().max(500)),
  motoristaId: opcional(z.string()),
  ...camposNf,
});

/** Ações feitas na tela do pacote (depois de escanear o QR). Cada uma vira um evento. */
export async function registrarEventoPacote(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const parse = eventoSchema.safeParse(Object.fromEntries(form));
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const d = parse.data;
  const { eu, ok } = await exigirAcao(d.acao === "cancelar" ? "gerir" : "lancar");
  if (!ok) return { erro: "Sem permissão" };
  const pacote = await db.pacote.findUnique({ where: { numero: d.numero } });
  if (!pacote) return { erro: "Pacote não encontrado" };
  const codigo = codigoPacote(pacote.numero);
  const encerrado = pacote.status === "EXPEDIDO" || pacote.status === "CANCELADO";

  const evento = async (tipo: "ENTRADA_ESTUFA" | "EXPEDIDO" | "MOVIMENTADO" | "OBSERVACAO" | "CANCELADO", descricao: string, dados: object = {}) => {
    await db.pacote.update({ where: { id: pacote.id }, data: { ...dados, eventos: { create: { tipo, descricao, usuarioId: eu.id } } } });
    await auditar({ usuarioId: eu.id, acao: `pacote.${d.acao}`, entidade: "Pacote", entidadeId: pacote.id, resumo: `${codigo}: ${descricao}` });
  };

  switch (d.acao) {
    case "estufa": {
      if (pacote.status !== "VERDE") return { erro: "Só pacotes verdes entram na estufa" };
      const ciclo = d.cicloId ? await db.cicloSecagem.findUnique({ where: { id: d.cicloId }, include: { estufa: true } }) : null;
      if (!ciclo || ciclo.status !== "EM_SECAGEM") return { erro: "Escolha um ciclo em secagem" };
      await evento("ENTRADA_ESTUFA", `Entrou na ${ciclo.estufa.nome}${ciclo.numero ? ` (ciclo nº ${ciclo.numero})` : ""}`, { status: "EM_ESTUFA", cicloId: ciclo.id });
      // A madeira do dia do pacote passa a fazer parte do ciclo (rastreabilidade)
      if (pacote.boletimId) await db.cicloSecagem.update({ where: { id: ciclo.id }, data: { boletins: { connect: { id: pacote.boletimId } } } });
      break;
    }
    case "expedir": {
      // Só a baixa física: cliente e destino já vêm do pedido
      if (encerrado) return { erro: "Pacote já expedido ou cancelado" };
      if (pacote.status === "EM_ESTUFA") return { erro: "O pacote ainda está na estufa" };
      const pedido = pacote.pedidoId ? await db.pedido.findUnique({ where: { id: pacote.pedidoId } }) : null;
      const rom = await criarRomaneio(eu.id, [pacote.id], d.motoristaId, d.texto, { notaFiscal: d.notaFiscal, chaveNfe: d.chaveNfe });
      await evento(
        "EXPEDIDO",
        `Saída registrada no romaneio ${codigoRomaneio(rom.numero)}${rom.motorista ? ` · ${rom.motorista} (${[rom.placa, rom.placaJulieta].filter(Boolean).join(" + ")})` : ""}${pedido ? ` · pedido ${pedido.numero} · ${pedido.cliente}` : ""}`,
        { status: "EXPEDIDO", expedidoEm: new Date() },
      );
      break;
    }
    case "local":
      if (encerrado) return { erro: "Pacote já expedido ou cancelado" };
      if (!d.localizacao) return { erro: "Informe o novo local" };
      await evento("MOVIMENTADO", `Movido para ${d.localizacao}`, { localizacao: d.localizacao });
      break;
    case "observacao":
      if (!d.texto) return { erro: "Escreva a observação" };
      await evento("OBSERVACAO", d.texto);
      break;
    case "cancelar":
      if (encerrado) return { erro: "Pacote já expedido ou cancelado" };
      await evento("CANCELADO", d.texto ? `Cancelado: ${d.texto}` : "Cancelado", { status: "CANCELADO" });
      break;
  }
  after(() => verificarPedidosProntos([pacote.pedidoId]).catch((e) => console.error(e)));
  revalidatePath(`/producao/pacotes/${pacote.numero}`);
  revalidatePath("/producao/pacotes");
  return { ok: "Registrado" };
}

const expedicaoSchema = z.object({
  numeros: z.array(z.coerce.number().int().positive()).min(1, "Selecione os pacotes").max(200),
  motoristaId: opcional(z.string()).optional(),
  observacoes: opcional(z.string().trim().max(500)).optional(),
  ...camposNf,
});

export async function expedirPacotes(entrada: z.input<typeof expedicaoSchema>): Promise<Resultado> {
  const { eu, ok } = await exigirAcao("lancar");
  if (!ok) return { erro: "Sem permissão" };
  const parse = expedicaoSchema.safeParse(entrada);
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const { numeros, motoristaId, observacoes, notaFiscal, chaveNfe } = parse.data;
  const pacotes = await db.pacote.findMany({ where: { numero: { in: numeros } }, select: { id: true, numero: true, status: true } });
  const invalidos = pacotes.filter((p) => p.status !== "VERDE" && p.status !== "SECO");
  if (invalidos.length) return { erro: `Não dá para expedir: ${invalidos.map((p) => codigoPacote(p.numero)).join(", ")} (na estufa, expedido ou cancelado)` };
  const agora = new Date();
  const rom = await criarRomaneio(eu.id, pacotes.map((p) => p.id), motoristaId, observacoes, { notaFiscal, chaveNfe });
  const descricao = `Saída registrada no romaneio ${codigoRomaneio(rom.numero)}${rom.notaFiscal ? ` · NF ${rom.notaFiscal}` : ""}${rom.motorista ? ` · ${rom.motorista} (${[rom.placa, rom.placaJulieta].filter(Boolean).join(" + ")})` : ""}`;
  await db.$transaction([
    db.pacote.updateMany({ where: { id: { in: pacotes.map((p) => p.id) } }, data: { status: "EXPEDIDO", expedidoEm: agora } }),
    db.eventoPacote.createMany({ data: pacotes.map((p) => ({ pacoteId: p.id, tipo: "EXPEDIDO" as const, descricao, usuarioId: eu.id, criadoEm: agora })) }),
  ]);
  await auditar({
    usuarioId: eu.id,
    acao: "pacote.expedir",
    entidade: "Pacote",
    resumo: `Registrou a saída de ${pacotes.length} pacote(s) no romaneio ${codigoRomaneio(rom.numero)}`,
    detalhes: { pacotes: pacotes.map((p) => codigoPacote(p.numero)) },
  });
  revalidatePath("/producao", "layout");
  return { numeros: pacotes.map((p) => p.numero), romaneio: rom.numero };
}
