"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auditar, diferencas } from "@/lib/auditoria";
import { db } from "@/lib/db";
import { LOGIN_REGEX } from "@/lib/constantes";
import { PERFIS_ATRIBUIVEIS } from "@/lib/permissoes";
import { exigirPermissao } from "@/lib/session";
import type { EstadoForm } from "./auth";

const vazioParaNull = (v: unknown) => (v === "" || v === undefined ? null : v);

function erroUnico(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
}

const usuarioSchema = z.object({
  id: z.preprocess(vazioParaNull, z.string().nullable()),
  nome: z.string().trim().min(2, "Informe o nome"),
  login: z
    .string()
    .trim()
    .toLowerCase()
    .regex(LOGIN_REGEX, "Login deve ser no formato nome.sobrenome (sem acentos ou espaços)"),
  perfil: z.enum(["ADMIN", "GERENTE", "SUPERVISOR", "MANUTENTOR", "OPERADOR", "SEM_ACESSO"]),
  perfilProducao: z.preprocess(vazioParaNull, z.enum(["SUPERVISOR", "APONTADOR", "CONSULTA"]).nullable()),
  senha: z.preprocess(vazioParaNull, z.string().min(8, "Senha com no mínimo 8 caracteres").max(200).nullable()),
  ativo: z.preprocess((v) => v === "on", z.boolean()),
  trocarSenha: z.preprocess((v) => v === "on", z.boolean()),
});

export async function salvarUsuario(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const eu = await exigirPermissao("usuarios");
  const dados = usuarioSchema.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: dados.error.issues[0].message };
  const { id, senha, trocarSenha, ...resto } = dados.data;

  const existente = id
    ? await db.usuario.findUnique({ where: { id }, select: { nome: true, login: true, perfil: true, perfilProducao: true, ativo: true } })
    : null;
  if (id && !existente) return { erro: "Usuário não encontrado" };

  // O perfil Administrador é exclusivo do desenvolvedor: ninguém o atribui pela tela,
  // e só um administrador edita a conta de outro administrador.
  if (existente?.perfil === "ADMIN") {
    if (eu.perfil !== "ADMIN") return { erro: "Sem permissão para alterar este usuário" };
    if (resto.perfil !== "ADMIN" || !resto.ativo) return { erro: "O acesso de administrador não pode ser removido pela tela" };
  } else if (!PERFIS_ATRIBUIVEIS.includes(resto.perfil)) {
    return { erro: "Perfil inválido" };
  }
  if (id === eu.id && !resto.ativo) return { erro: "Você não pode desativar o próprio usuário" };
  // Precisa de algum perfil. Não usa modulosDe(): com a Manutenção em teste, quem só tem perfil nela
  // (ex.: manutentor) ficaria sem módulo e o gerente não conseguiria nem redefinir a senha dele.
  if (resto.perfil === "SEM_ACESSO" && !resto.perfilProducao) {
    return { erro: "Escolha o perfil na Serraria ou na Manutenção (ou dê acesso de Gerente)" };
  }

  try {
    if (id && existente) {
      await db.usuario.update({
        where: { id },
        data: {
          ...resto,
          ...(senha ? { senhaHash: await bcrypt.hash(senha, 10), trocarSenha } : {}),
          // Senha redefinida ou usuário desativado: as sessões abertas dele deixam de valer
          ...(senha || (existente.ativo && !resto.ativo) ? { versaoSessao: { increment: 1 } } : {}),
        },
      });
      const mudou = diferencas(existente, resto, ["nome", "login", "perfil", "perfilProducao", "ativo"]);
      if (senha) mudou.senha = { de: null, para: "redefinida" };
      if (Object.keys(mudou).length) {
        await auditar({ usuarioId: eu.id, acao: "usuario.editar", entidade: "Usuario", entidadeId: id, resumo: `Editou o usuário ${resto.login}`, detalhes: mudou });
      }
    } else {
      if (!senha) return { erro: "Defina uma senha inicial" };
      const novo = await db.usuario.create({ data: { ...resto, trocarSenha, senhaHash: await bcrypt.hash(senha, 10) } });
      await auditar({ usuarioId: eu.id, acao: "usuario.criar", entidade: "Usuario", entidadeId: novo.id, resumo: `Criou o usuário ${novo.login} (${novo.perfil})` });
    }
  } catch (e) {
    if (erroUnico(e)) return { erro: "Já existe um usuário com este login" };
    throw e;
  }
  revalidatePath("/usuarios");
  return { ok: id ? "Usuário atualizado" : "Usuário criado" };
}

export async function salvarSetor(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const eu = await exigirPermissao("setores");
  const id = String(form.get("id") ?? "");
  const nome = String(form.get("nome") ?? "").trim().replace(/\s+/g, " ");
  if (nome.length < 2) return { erro: "Informe o nome do setor" };
  if (nome.length > 80) return { erro: "Nome do setor muito longo" };
  // O @unique do banco diferencia maiúsculas: "Setor QA" e "setor qa" seriam dois setores
  const repetido = await db.setor.findFirst({ where: { nome: { equals: nome, mode: "insensitive" }, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
  if (repetido) return { erro: "Setor já cadastrado" };
  try {
    if (id) {
      const antes = await db.setor.findUnique({ where: { id } });
      if (!antes) return { erro: "Setor não encontrado" };
      await db.setor.update({ where: { id }, data: { nome } });
      if (antes.nome !== nome) {
        await auditar({ usuarioId: eu.id, acao: "setor.editar", entidade: "Setor", entidadeId: id, resumo: `Renomeou o setor ${antes.nome} para ${nome}` });
      }
    } else {
      const novo = await db.setor.create({ data: { nome } });
      await auditar({ usuarioId: eu.id, acao: "setor.criar", entidade: "Setor", entidadeId: novo.id, resumo: `Criou o setor ${nome}` });
    }
  } catch (e) {
    if (erroUnico(e)) return { erro: "Setor já cadastrado" };
    throw e;
  }
  revalidatePath("/setores");
  return { ok: id ? "Setor atualizado" : "Setor criado" };
}

const equipamentoSchema = z.object({
  id: z.preprocess(vazioParaNull, z.string().nullable()),
  codigo: z.string().trim().toUpperCase().min(1, "Informe o código/TAG"),
  nome: z.string().trim().min(2, "Informe o nome"),
  descricao: z.preprocess(vazioParaNull, z.string().trim().nullable()),
  fabricante: z.preprocess(vazioParaNull, z.string().trim().max(80).nullable()),
  modelo: z.preprocess(vazioParaNull, z.string().trim().max(80).nullable()),
  numeroSerie: z.preprocess(vazioParaNull, z.string().trim().max(80).nullable()),
  setorId: z.preprocess(vazioParaNull, z.string().nullable()),
  ativo: z.preprocess((v) => v === "on", z.boolean()),
  linhaSerraria: z.preprocess((v) => v === "on", z.boolean()),
});

export async function salvarEquipamento(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const eu = await exigirPermissao("equipamentos");
  const dados = equipamentoSchema.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: dados.error.issues[0].message };
  const { id, ...resto } = dados.data;
  // O código é guardado em maiúsculas, mas cadastros antigos podem ter minúsculas (o @unique diferencia)
  const repetido = await db.equipamento.findFirst({
    where: { codigo: { equals: resto.codigo, mode: "insensitive" }, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (repetido) return { erro: "Já existe um equipamento com este código" };
  try {
    if (id) {
      const antes = await db.equipamento.findUnique({ where: { id } });
      if (!antes) return { erro: "Equipamento não encontrado" };
      await db.equipamento.update({ where: { id }, data: resto });
      const mudou = diferencas(antes, resto, ["codigo", "nome", "descricao", "fabricante", "modelo", "numeroSerie", "setorId", "ativo", "linhaSerraria"]);
      if (Object.keys(mudou).length) {
        await auditar({ usuarioId: eu.id, acao: "equipamento.editar", entidade: "Equipamento", entidadeId: id, resumo: `Editou o equipamento ${resto.codigo}`, detalhes: mudou });
      }
    } else {
      const novo = await db.equipamento.create({ data: resto });
      await auditar({ usuarioId: eu.id, acao: "equipamento.criar", entidade: "Equipamento", entidadeId: novo.id, resumo: `Cadastrou o equipamento ${novo.codigo} – ${novo.nome}` });
    }
  } catch (e) {
    if (erroUnico(e)) return { erro: "Já existe um equipamento com este código" };
    throw e;
  }
  revalidatePath("/equipamentos");
  return { ok: id ? "Equipamento atualizado" : "Equipamento cadastrado" };
}
