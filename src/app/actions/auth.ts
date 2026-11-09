"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auditar } from "@/lib/auditoria";
import { db } from "@/lib/db";
import { LIMITE, ipDaRequisicao, limparFalhas, minutosBloqueado, registrarFalha } from "@/lib/limite-tentativas";
import { PERGUNTAS_SEGURANCA, normalizarResposta } from "@/lib/perguntas";
import { criarSessao, encerrarSessao, usuarioAtual } from "@/lib/session";

/** Hash qualquer, para o login inexistente gastar o mesmo tempo que um existente (não revela quais logins existem). */
let hashFalso: string | null = null;
const HASH_FALSO = () => (hashFalso ??= bcrypt.hashSync("senha-que-nao-existe", 10));

export type EstadoForm = { erro?: string; ok?: string } | undefined;

const loginSchema = z.object({
  login: z.string().trim().toLowerCase().min(1, "Informe o login"),
  senha: z.string().min(1, "Informe a senha"),
  next: z.string().optional(),
});

/** Só aceita caminhos internos (evita redirecionar para outro site, inclusive com "//" ou "/\\"). */
function destinoSeguro(next?: string) {
  return next && /^\/(?![\/\\])/.test(next) && !/[\\\s]/.test(next) && !next.startsWith("/login") ? next : "/sistema";
}

export async function entrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const dados = loginSchema.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: dados.error.issues[0].message };

  // Limite de tentativas: por login e por endereço IP
  const ip = await ipDaRequisicao();
  const chaves = [`login:${dados.data.login}`, `ip:${ip}`];
  const espera = await minutosBloqueado([
    { chave: chaves[0], max: LIMITE.login },
    { chave: chaves[1], max: LIMITE.ip },
  ]);
  if (espera) {
    await auditar({ acao: "login.bloqueado", entidade: "Usuario", resumo: `Login bloqueado por excesso de tentativas (${dados.data.login}, IP ${ip})` });
    return { erro: `Muitas tentativas sem sucesso. Aguarde ${espera} minuto(s) e tente de novo.` };
  }

  const usuario = await db.usuario.findUnique({ where: { login: dados.data.login } });
  const senhaOk = await bcrypt.compare(dados.data.senha, usuario?.senhaHash ?? HASH_FALSO());
  if (!usuario || !senhaOk) {
    await registrarFalha(chaves);
    await auditar({
      usuarioId: usuario?.id,
      acao: "login.falha",
      entidade: "Usuario",
      entidadeId: usuario?.id,
      resumo: `Tentativa de login sem sucesso (${dados.data.login}, IP ${ip})`,
    });
    return { erro: "Login ou senha incorretos" };
  }
  if (!usuario.ativo) return { erro: "Usuário desativado. Procure o administrador." };

  await limparFalhas([chaves[0]]);
  await criarSessao({ userId: usuario.id, nome: usuario.nome, perfil: usuario.perfil, versao: usuario.versaoSessao });
  await auditar({ usuarioId: usuario.id, acao: "login", entidade: "Usuario", entidadeId: usuario.id, resumo: "Entrou no sistema" });
  const destino = destinoSeguro(dados.data.next);
  redirect(usuario.trocarSenha ? `/trocar-senha?next=${encodeURIComponent(destino)}` : destino);
}

export async function sair() {
  const eu = await usuarioAtual();
  if (eu) await auditar({ usuarioId: eu.id, acao: "logout", entidade: "Usuario", entidadeId: eu.id, resumo: "Saiu do sistema" });
  await encerrarSessao();
  redirect("/login");
}

const senhaSchema = z
  .object({
    atual: z.string().min(1, "Informe a senha atual"),
    nova: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres").max(200),
    confirmacao: z.string(),
  })
  .refine((d) => d.nova === d.confirmacao, { message: "A confirmação não confere" })
  .refine((d) => d.nova !== d.atual, { message: "A nova senha deve ser diferente da atual" });

export async function trocarSenha(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  // usuarioAtual (e não exigirUsuario) para funcionar também na troca obrigatória
  const eu = await usuarioAtual();
  if (!eu) redirect("/sair");
  const dados = senhaSchema.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: dados.error.issues[0].message };

  const chave = `senha:${eu.id}`;
  const espera = await minutosBloqueado([{ chave, max: LIMITE.senha }]);
  if (espera) return { erro: `Muitas tentativas com a senha atual errada. Aguarde ${espera} minuto(s).` };
  const usuario = await db.usuario.findUniqueOrThrow({ where: { id: eu.id } });
  if (!(await bcrypt.compare(dados.data.atual, usuario.senhaHash))) {
    await registrarFalha([chave]);
    return { erro: "Senha atual incorreta" };
  }
  await limparFalhas([chave]);
  // Nova versão de sessão: os outros aparelhos com a senha antiga saem; este continua
  const atualizado = await db.usuario.update({
    where: { id: eu.id },
    data: { senhaHash: await bcrypt.hash(dados.data.nova, 10), trocarSenha: false, versaoSessao: { increment: 1 } },
  });
  await criarSessao({ userId: atualizado.id, nome: atualizado.nome, perfil: atualizado.perfil, versao: atualizado.versaoSessao });
  await auditar({ usuarioId: eu.id, acao: "senha.trocar", entidade: "Usuario", entidadeId: eu.id, resumo: "Trocou a própria senha" });
  if (eu.trocarSenha) redirect(destinoSeguro(String(form.get("next") ?? "")));
  return { ok: "Senha alterada com sucesso" };
}

// ============================ Pergunta de segurança ============================

const perguntaSchema = z.object({
  pergunta: z.coerce.number().int().min(0).max(PERGUNTAS_SEGURANCA.length - 1),
  resposta: z.string().transform(normalizarResposta).pipe(z.string().min(3, "A resposta precisa de pelo menos 3 letras").max(100)),
  senha: z.string().min(1, "Confirme com a sua senha atual"),
});

/** Cadastra/troca a pergunta de segurança (confirmando com a senha atual). */
export async function salvarPerguntaSeguranca(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const eu = await usuarioAtual();
  if (!eu) redirect("/sair");
  const d = perguntaSchema.safeParse(Object.fromEntries(form));
  if (!d.success) return { erro: d.error.issues[0].message };
  const chave = `senha:${eu.id}`;
  const espera = await minutosBloqueado([{ chave, max: LIMITE.senha }]);
  if (espera) return { erro: `Muitas tentativas com a senha errada. Aguarde ${espera} minuto(s).` };
  const usuario = await db.usuario.findUniqueOrThrow({ where: { id: eu.id } });
  if (!(await bcrypt.compare(d.data.senha, usuario.senhaHash))) {
    await registrarFalha([chave]);
    return { erro: "Senha atual incorreta" };
  }
  await db.usuario.update({ where: { id: eu.id }, data: { perguntaSeguranca: d.data.pergunta, respostaHash: await bcrypt.hash(d.data.resposta, 10) } });
  await auditar({ usuarioId: eu.id, acao: "senha.pergunta", entidade: "Usuario", entidadeId: eu.id, resumo: "Cadastrou a pergunta de segurança" });
  return { ok: "Pergunta de segurança salva" };
}

/** Mesma resposta para login inexistente ou sem pergunta (não revela quais logins existem). */
const SEM_RECUPERACAO = "Não é possível recuperar a senha deste login pela pergunta de segurança. Fale com o administrador do sistema.";

/** Passo 1 da recuperação: mostra a pergunta do login (rota pública, com limite por IP). */
export async function perguntaDoLogin(login: string): Promise<{ pergunta?: string; erro?: string }> {
  const ip = await ipDaRequisicao();
  const espera = await minutosBloqueado([{ chave: `ip:${ip}`, max: LIMITE.ip }]);
  if (espera) return { erro: `Muitas tentativas. Aguarde ${espera} minuto(s).` };
  // Toda consulta conta no limite do IP (com acerto ou não): assim ninguém testa logins sem parar
  // para descobrir quais existem
  await registrarFalha([`ip:${ip}`]);
  const l = String(login ?? "").trim().toLowerCase().slice(0, 80);
  const u = l ? await db.usuario.findUnique({ where: { login: l }, select: { ativo: true, perguntaSeguranca: true, respostaHash: true } }) : null;
  if (!u?.ativo || u.perguntaSeguranca == null || !u.respostaHash) return { erro: SEM_RECUPERACAO };
  return { pergunta: PERGUNTAS_SEGURANCA[u.perguntaSeguranca] };
}

const recuperarSchema = z
  .object({
    login: z.string().trim().toLowerCase().min(1),
    resposta: z.string().transform(normalizarResposta),
    nova: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres").max(200),
    confirmacao: z.string(),
  })
  .refine((d) => d.nova === d.confirmacao, { message: "A confirmação não confere" });

/** Passo 2: confere a resposta e define a nova senha (5 erros por login ou 20 por IP em 15 min bloqueiam). */
export async function recuperarSenha(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const d = recuperarSchema.safeParse(Object.fromEntries(form));
  if (!d.success) return { erro: d.error.issues[0].message };
  const ip = await ipDaRequisicao();
  const chaves = [`recuperar:${d.data.login}`, `ip:${ip}`];
  const espera = await minutosBloqueado([
    { chave: chaves[0], max: LIMITE.login },
    { chave: chaves[1], max: LIMITE.ip },
  ]);
  if (espera) return { erro: `Muitas tentativas sem sucesso. Aguarde ${espera} minuto(s).` };
  const u = await db.usuario.findUnique({ where: { login: d.data.login } });
  const ok = await bcrypt.compare(d.data.resposta, u?.respostaHash ?? HASH_FALSO());
  if (!u?.ativo || !u.respostaHash || !ok) {
    await registrarFalha(chaves);
    await auditar({ usuarioId: u?.id, acao: "senha.recuperar.falha", entidade: "Usuario", entidadeId: u?.id, resumo: `Resposta de segurança errada (${d.data.login}, IP ${ip})` });
    return { erro: "Resposta incorreta" };
  }
  await limparFalhas([chaves[0]]);
  // Nova senha e nova versão de sessão: quem estiver logado com a senha antiga sai
  await db.usuario.update({ where: { id: u.id }, data: { senhaHash: await bcrypt.hash(d.data.nova, 10), trocarSenha: false, versaoSessao: { increment: 1 } } });
  await auditar({ usuarioId: u.id, acao: "senha.recuperar", entidade: "Usuario", entidadeId: u.id, resumo: `Recuperou a senha pela pergunta de segurança (IP ${ip})` });
  return { ok: "Senha alterada. Entre com a nova senha." };
}
