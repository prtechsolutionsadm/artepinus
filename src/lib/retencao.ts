import "server-only";
import { db } from "@/lib/db";

/**
 * Prazos de guarda dos registros com dados pessoais (LGPD: guardar só o necessário).
 * Mostrados na Política de Privacidade (/privacidade) — mude os dois juntos.
 */
export const RETENCAO = {
  /** Tentativas de login sem sucesso (login e IP) — só servem ao limite de tentativas. */
  tentativasDias: 1,
  /** Registros de acesso na auditoria (entradas, saídas, tentativas, com IP). */
  acessosDias: 180,
  /** Notificações já lidas. */
  notificacoesLidasDias: 90,
  /** Demais registros da auditoria (quem alterou o quê). */
  auditoriaAnos: 5,
};

const DIA = 864e5;

/** Apaga o que passou do prazo. Roda na rotina diária (/api/cron/lembretes). */
export async function limparRegistrosAntigos() {
  const agora = Date.now();
  const [tentativas, acessos, notificacoes, auditoria] = await Promise.all([
    db.tentativaLogin.deleteMany({ where: { criadoEm: { lt: new Date(agora - RETENCAO.tentativasDias * DIA) } } }),
    db.auditoria.deleteMany({
      where: { criadoEm: { lt: new Date(agora - RETENCAO.acessosDias * DIA) }, OR: [{ acao: { startsWith: "login" } }, { acao: "logout" }, { acao: { startsWith: "senha.recuperar" } }] },
    }),
    db.notificacao.deleteMany({ where: { lida: true, criadoEm: { lt: new Date(agora - RETENCAO.notificacoesLidasDias * DIA) } } }),
    db.auditoria.deleteMany({ where: { criadoEm: { lt: new Date(agora - RETENCAO.auditoriaAnos * 365 * DIA) } } }),
  ]);
  return { tentativas: tentativas.count, acessos: acessos.count, notificacoes: notificacoes.count, auditoria: auditoria.count };
}
