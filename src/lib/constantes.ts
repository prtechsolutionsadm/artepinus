import type { Perfil, PerfilProducao, Prioridade, StatusRequisicao, TipoManutencao } from "@/generated/prisma/enums";
import { MODULOS, temModulo, type UsuarioComPerfis } from "@/lib/permissoes";

export const STATUS: Record<StatusRequisicao, { label: string; cor: string }> = {
  ABERTA: { label: "Aberta", cor: "bg-blue-50 text-blue-700 ring-blue-200" },
  EM_ANALISE: { label: "Em análise", cor: "bg-indigo-100 text-indigo-800 ring-indigo-300" },
  PLANEJADA: { label: "Planejada", cor: "bg-violet-100 text-violet-800 ring-violet-300" },
  AGENDADA: { label: "Agendada", cor: "bg-teal-50 text-teal-700 ring-teal-200" },
  EM_ANDAMENTO: { label: "Em andamento", cor: "bg-amber-100 text-amber-800 ring-amber-300" },
  AGUARDANDO_PECAS: { label: "Aguardando peças", cor: "bg-orange-100 text-orange-800 ring-orange-300" },
  ADIADA: { label: "Adiada", cor: "bg-stone-200 text-stone-800 ring-stone-400" },
  CONCLUIDA: { label: "Concluída", cor: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
  CANCELADA: { label: "Cancelada", cor: "bg-rose-100 text-rose-800 ring-rose-300" },
};

export const STATUS_ORDEM = Object.keys(STATUS) as StatusRequisicao[];
export const STATUS_FINAIS: StatusRequisicao[] = ["CONCLUIDA", "CANCELADA"];
export const STATUS_PENDENTES = STATUS_ORDEM.filter((s) => !STATUS_FINAIS.includes(s));

export const PRIORIDADE: Record<Prioridade, { label: string; cor: string }> = {
  BAIXA: { label: "Baixa", cor: "bg-slate-100 text-slate-700 ring-slate-300" },
  MEDIA: { label: "Média", cor: "bg-blue-100 text-blue-800 ring-blue-300" },
  ALTA: { label: "Alta", cor: "bg-orange-100 text-orange-800 ring-orange-300" },
  URGENTE: { label: "Urgente", cor: "bg-red-600 text-white ring-red-700" },
};

export const TIPO: Record<TipoManutencao, string> = {
  CORRETIVA: "Corretiva",
  PREVENTIVA: "Preventiva",
  PREDITIVA: "Preditiva",
  MELHORIA: "Melhoria",
};

/** Formato do login: nome.sobrenome (letras minúsculas sem acento, números, ponto, hífen ou _). */
export const LOGIN_REGEX = /^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/;

export const PERFIL: Record<Perfil, string> = {
  ADMIN: "Administrador",
  GERENTE: "Gerente",
  SUPERVISOR: "Supervisor",
  MANUTENTOR: "Manutentor",
  OPERADOR: "Operador",
  SEM_ACESSO: "Sem acesso",
};

export const PERFIL_PRODUCAO: Record<PerfilProducao, string> = {
  SUPERVISOR: "Supervisor",
  APONTADOR: "Apontador",
  CONSULTA: "Consulta",
};

/**
 * Perfis da pessoa nos módulos que ela usa hoje, com o nome do módulo:
 * ["Serraria: Apontador", "Manutenção: Operador"]. Admin/Gerente: ["Gerente · acesso total"].
 * A Manutenção só entra quando a pessoa enxerga o módulo (em teste: só o administrador).
 */
export function perfisPorModulo(u: UsuarioComPerfis): string[] {
  if (u.perfil === "ADMIN" || u.perfil === "GERENTE") return [`${PERFIL[u.perfil]} · acesso total`];
  const itens: string[] = [];
  if (u.perfilProducao && temModulo(u, "producao")) itens.push(`${MODULOS.producao.nome}: ${PERFIL_PRODUCAO[u.perfilProducao]}`);
  if (temModulo(u, "manutencao")) itens.push(`${MODULOS.manutencao.nome}: ${PERFIL[u.perfil]}`);
  return itens.length ? itens : [PERFIL.SEM_ACESSO];
}

/** Os perfis da pessoa numa linha: "Serraria: Supervisor · Manutenção: Supervisor". */
export function rotuloPerfis(u: UsuarioComPerfis) {
  return perfisPorModulo(u).join(" · ");
}

export function formatarData(d: Date | null | undefined, comHora = false) {
  if (!d) return "—";
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(comHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function numeroRequisicao(id: number) {
  return `#${String(id).padStart(5, "0")}`;
}

/** Inteiro positivo de URL/formulário que cabe no INT4 do Postgres (até 9 dígitos); senão null. */
export function inteiroPositivo(s: string | null | undefined) {
  return s && /^[1-9]\d{0,8}$/.test(s) ? Number(s) : null;
}

/** "AAAA-MM-DD" que existe no calendário (recusa 2026-13-01 e 2026-02-31). */
export function diaValido(s: string | null | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Brasil (São Paulo) não tem horário de verão desde 2019: UTC-3 fixo.
const OFFSET_SP = "-03:00";

/** Converte o valor de um <input type="datetime-local"> (horário de Brasília) em Date. */
export function dataLocalParaDate(valor: string | null | undefined) {
  if (!valor) return null;
  const d = new Date(`${valor}${valor.length === 16 ? ":00" : ""}${OFFSET_SP}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Formata uma Date para o valor de um <input type="datetime-local"> no horário de Brasília. */
export function dateParaDataLocal(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

/** Cores sólidas dos status (gráficos e Excel). */
export const STATUS_HEX: Record<StatusRequisicao, string> = {
  ABERTA: "#2563eb",
  EM_ANALISE: "#4f46e5",
  PLANEJADA: "#7c3aed",
  AGENDADA: "#0d9488",
  EM_ANDAMENTO: "#d97706",
  AGUARDANDO_PECAS: "#ea580c",
  ADIADA: "#78716c",
  CONCLUIDA: "#059669",
  CANCELADA: "#e11d48",
};

/** 135 → "2h15"; 45 → "45 min". */
export function formatarDuracao(minutos: number | null | undefined) {
  if (minutos == null) return "—";
  const m = Math.round(minutos);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h >= 48) return h % 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${Math.floor(h / 24)}d`;
  return r ? `${h}h${String(r).padStart(2, "0")}` : `${h}h`;
}

/** Minutos entre duas datas (fim padrão = agora). */
export function minutosEntre(inicio: Date | null | undefined, fim?: Date | null) {
  if (!inicio) return null;
  return Math.max(0, Math.round(((fim ?? new Date()).getTime() - inicio.getTime()) / 60000));
}
