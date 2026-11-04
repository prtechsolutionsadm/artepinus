"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auditar, diferencas } from "@/lib/auditoria";
import { db } from "@/lib/db";
import { podeProducao } from "@/lib/permissoes";
import { exigirUsuario } from "@/lib/session";
import type { EstadoForm } from "./auth";

const vazioParaNull = (v: unknown) => (v === "" || v === undefined ? null : v);
const opcional = <T extends z.ZodTypeAny>(t: T) => z.preprocess(vazioParaNull, t.nullable());
const ativo = z.preprocess((v) => v === "on", z.boolean());
const placa = z
  .string()
  .trim()
  .toUpperCase()
  .transform((v) => v.replace(/[^A-Z0-9]/g, ""))
  .refine((v) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(v), "Placa inválida (ex.: ABC1D23)");

function erroUnico(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
}

async function exigirGestao() {
  const eu = await exigirUsuario();
  return { eu, ok: podeProducao(eu, "gerir") };
}

/** Salva (cria ou edita) um cadastro simples com auditoria. */
async function salvarCadastro<T extends { id: string | null }>(opcoes: {
  form: FormData;
  schema: z.ZodType<T>;
  entidade: string;
  rotulo: (d: Omit<T, "id">) => string;
  campos: string[];
  buscar: (id: string) => Promise<object | null>;
  criar: (d: Omit<T, "id">) => Promise<{ id: string }>;
  atualizar: (id: string, d: Omit<T, "id">) => Promise<unknown>;
  duplicado: string;
}): Promise<EstadoForm> {
  const { eu, ok } = await exigirGestao();
  if (!ok) return { erro: "Sem permissão" };
  const parse = opcoes.schema.safeParse(Object.fromEntries(opcoes.form));
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const { id, ...dados } = parse.data;
  const chave = opcoes.entidade.toLowerCase();
  try {
    if (id) {
      const antes = await opcoes.buscar(id);
      if (!antes) return { erro: "Cadastro não encontrado" };
      await opcoes.atualizar(id, dados);
      const mudou = diferencas(antes as Record<string, unknown>, dados as Record<string, unknown>, opcoes.campos);
      if (Object.keys(mudou).length) {
        await auditar({ usuarioId: eu.id, acao: `${chave}.editar`, entidade: opcoes.entidade, entidadeId: id, resumo: `Editou ${opcoes.rotulo(dados)}`, detalhes: mudou });
      }
    } else {
      const novo = await opcoes.criar(dados);
      await auditar({ usuarioId: eu.id, acao: `${chave}.criar`, entidade: opcoes.entidade, entidadeId: novo.id, resumo: `Cadastrou ${opcoes.rotulo(dados)}` });
    }
  } catch (e) {
    if (erroUnico(e)) return { erro: opcoes.duplicado };
    throw e;
  }
  revalidatePath("/producao", "layout");
  return { ok: id ? "Salvo" : "Cadastrado" };
}

// ---------- Pedidos ----------

const pedidoSchema = z.object({
  id: opcional(z.string()),
  numero: z.string().trim().min(1, "Informe o número do pedido").max(40),
  cliente: z.string().trim().min(2, "Informe o cliente").max(120),
  destino: opcional(z.string().trim().max(120)),
  observacoes: opcional(z.string().trim().max(500)),
  status: z.enum(["ABERTO", "CONCLUIDO"]).default("ABERTO"),
});

export async function salvarPedido(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  return salvarCadastro({
    form,
    schema: pedidoSchema,
    entidade: "Pedido",
    rotulo: (d) => `o pedido ${d.numero} (${d.cliente})`,
    campos: ["numero", "cliente", "destino", "observacoes", "status"],
    buscar: (id) => db.pedido.findUnique({ where: { id } }),
    criar: (d) => db.pedido.create({ data: d }),
    atualizar: (id, d) => db.pedido.update({ where: { id }, data: d }),
    duplicado: "Já existe um pedido com este número",
  });
}

// ---------- Fornecedores ----------

const fornecedorSchema = z.object({
  id: opcional(z.string()),
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  documento: opcional(z.string().trim().max(20)),
  telefone: opcional(z.string().trim().max(20)),
  ativo,
});

export async function salvarFornecedor(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  return salvarCadastro({
    form,
    schema: fornecedorSchema,
    entidade: "Fornecedor",
    rotulo: (d) => `o fornecedor ${d.nome}`,
    campos: ["nome", "documento", "telefone", "ativo"],
    buscar: (id) => db.fornecedor.findUnique({ where: { id } }),
    criar: (d) => db.fornecedor.create({ data: d }),
    atualizar: (id, d) => db.fornecedor.update({ where: { id }, data: d }),
    duplicado: "Já existe um fornecedor com este nome",
  });
}

// ---------- Motoristas ----------

const motoristaSchema = z.object({
  id: opcional(z.string()),
  nome: z.string().trim().min(2, "Informe o nome").max(80),
  placaCaminhao: placa,
  placaJulieta: z.preprocess(vazioParaNull, placa.nullable()),
  telefone: opcional(z.string().trim().max(20)),
  ativo,
});

export async function salvarMotorista(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  return salvarCadastro({
    form,
    schema: motoristaSchema,
    entidade: "Motorista",
    rotulo: (d) => `o motorista ${d.nome} (${d.placaCaminhao})`,
    campos: ["nome", "placaCaminhao", "placaJulieta", "telefone", "ativo"],
    buscar: (id) => db.motorista.findUnique({ where: { id } }),
    criar: (d) => db.motorista.create({ data: d }),
    atualizar: (id, d) => db.motorista.update({ where: { id }, data: d }),
    duplicado: "Motorista já cadastrado",
  });
}

// ---------- Florestas ----------

const florestaSchema = z.object({
  id: opcional(z.string()),
  nome: z.string().trim().min(2, "Informe o nome da floresta").max(120),
  municipio: opcional(z.string().trim().max(80)),
  uf: opcional(z.string().trim().toUpperCase().length(2, "UF com 2 letras")),
  especie: opcional(z.string().trim().max(80)),
  ativo,
});

export async function salvarFloresta(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  return salvarCadastro({
    form,
    schema: florestaSchema,
    entidade: "OrigemFlorestal",
    rotulo: (d) => `a floresta ${d.nome}`,
    campos: ["nome", "municipio", "uf", "especie", "ativo"],
    buscar: (id) => db.origemFlorestal.findUnique({ where: { id } }),
    criar: (d) => db.origemFlorestal.create({ data: d }),
    atualizar: (id, d) => db.origemFlorestal.update({ where: { id }, data: d }),
    duplicado: "Floresta já cadastrada",
  });
}

// ---------- Configuração padrão da serraria ----------

const configSchema = z.object({
  metaDiariaM3: z.coerce.number().positive("Informe a meta diária em m³"),
  horasDia: z.coerce.number().positive("Informe as horas por dia").max(24),
  rendimentoMeta: opcional(z.coerce.number().min(1, "Rendimento em %, ex.: 45").max(100, "Rendimento em %, ex.: 45")),
});

export async function salvarConfig(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const { eu, ok } = await exigirGestao();
  if (!ok) return { erro: "Sem permissão" };
  const parse = configSchema.safeParse(Object.fromEntries(form));
  if (!parse.success) return { erro: parse.error.issues[0].message };
  const dados = { ...parse.data, rendimentoMeta: parse.data.rendimentoMeta == null ? null : parse.data.rendimentoMeta / 100 };
  const antes = await db.configSerraria.findUnique({ where: { id: "padrao" } });
  await db.configSerraria.upsert({ where: { id: "padrao" }, update: dados, create: { id: "padrao", ...dados } });
  await auditar({
    usuarioId: eu.id,
    acao: "config.editar",
    entidade: "ConfigSerraria",
    entidadeId: "padrao",
    resumo: `Alterou a configuração da serraria: ${dados.metaDiariaM3} m³/dia em ${dados.horasDia} h`,
    detalhes: antes ? diferencas(antes, dados, ["metaDiariaM3", "horasDia", "rendimentoMeta"]) : undefined,
  });
  revalidatePath("/producao", "layout");
  return { ok: "Configuração salva" };
}

// ============================ Zerar movimento (só administrador) ============================

/** Tabelas de movimento da serraria, na ordem segura (nenhum cadastro aponta para elas). */
const MOVIMENTO = [
  "EventoPacote",
  "Pacote",
  "Romaneio",
  "ItemProducao",
  "Lote",
  "ParadaProducao",
  "_ConsumoToras",
  "_MadeiraCiclo",
  "BoletimProducao",
  "ItemChecklistCiclo",
  "CargaCiclo",
  "CicloSecagem",
  "ItemCargaToras",
  "CargaToras",
  "Colheita",
  "ItemEstoque",
  "LevantamentoEstoque",
];

/**
 * Apaga todo o movimento lançado em teste (cargas, boletins/lotes, ciclos, pacotes,
 * romaneios, inventários) e reinicia a numeração. Mantém usuários e cadastros
 * (florestas, fornecedores, motoristas, estufas, motivos, configuração) e a auditoria.
 */
export async function zerarMovimento(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const eu = await exigirUsuario();
  if (eu.perfil !== "ADMIN") return { erro: "Só o administrador pode zerar o movimento" };
  if (String(form.get("confirmacao") ?? "").trim().toUpperCase() !== "APAGAR") return { erro: "Digite APAGAR para confirmar" };
  const pedidos = form.get("pedidos") === "on";
  const tabelas = [...MOVIMENTO, ...(pedidos ? ["Pedido"] : [])].map((t) => `"${t}"`).join(", ");
  const antes = await Promise.all([db.pacote.count(), db.lote.count(), db.cargaToras.count(), db.cicloSecagem.count(), db.romaneio.count(), db.levantamentoEstoque.count()]);
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${tabelas} RESTART IDENTITY`);
  if (!pedidos) await db.pedido.updateMany({ data: { prontoAvisadoEm: null } });
  await db.notificacao.deleteMany({ where: { OR: [{ link: { startsWith: "/producao" } }, { link: { startsWith: "/p/" } }] } });
  await auditar({
    usuarioId: eu.id,
    acao: "sistema.zerar",
    entidade: "Sistema",
    resumo: `Zerou o movimento da serraria${pedidos ? " e os pedidos" : ""}: ${antes[0]} pacote(s), ${antes[1]} lote(s), ${antes[2]} carga(s), ${antes[3]} ciclo(s), ${antes[4]} romaneio(s), ${antes[5]} inventário(s)`,
  });
  revalidatePath("/", "layout");
  return { ok: "Movimento apagado. A numeração recomeça do 1." };
}
