import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ICONES } from "@/components/icones";
import type { IconeMenu } from "@/lib/menu";

/** Peças comuns às telas iniciais dos módulos (Serraria e Manutenção): painel de números, sem cartões de atalho. */

/** "Bom dia" / "Boa tarde" / "Boa noite" pelo relógio de Brasília (o servidor roda em UTC). */
export function saudacao(agora = new Date()) {
  const h = Number(agora.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

/** "Sexta-feira, 13 de novembro", em Brasília (só a primeira letra maiúscula). */
export function hojePorExtenso(agora = new Date()) {
  const t = agora.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ───────────── Painel de números (telas iniciais dos módulos, sem cartões de atalho) ─────────────

export type AcaoInicio = {
  href: string;
  texto: string;
  icone: IconeMenu;
  /** A tarefa principal da função: botão verde, o primeiro. */
  principal?: boolean;
  /** Número ou texto curto ao lado (ex.: 2 paradas). */
  selo?: ReactNode;
  /** Selo em vermelho (algo esperando). */
  alerta?: boolean;
};

/**
 * Cabeçalho da tela inicial do módulo: módulo · função, saudação, a data e os botões das tarefas do dia
 * (a principal em verde): à direita nas telas bem largas, numa linha embaixo nas médias e em grade no celular.
 */
export function CabecalhoModulo({ titulo, subtitulo, data, acoes }: { titulo: ReactNode; subtitulo: ReactNode; data?: ReactNode; acoes: AcaoInicio[] }) {
  return (
    <header className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
      <div className="min-w-0 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-marca-700">{subtitulo}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 sm:text-[1.75rem]">{titulo}</h1>
        {data && <p className="mt-0.5 text-sm text-stone-500">{data}</p>}
      </div>
      {acoes.length > 0 && (
        <nav aria-label="Tarefas do dia" className="nao-imprimir grid grid-cols-2 gap-2 sm:flex sm:flex-wrap 2xl:justify-end">
          {acoes.map(({ href, texto, icone, principal, selo, alerta }) => {
            const Icone = ICONES[icone];
            return (
              <Link
                key={href}
                href={href}
                className={`${principal ? "btn-primario col-span-2 sm:col-span-1" : "btn-secundario"} justify-start px-3.5 py-2 sm:justify-center`}
              >
                <Icone className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{texto}</span>
                {selo != null && selo !== 0 && (
                  <span
                    className={`ml-auto rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums sm:ml-0 ${
                      principal ? "bg-white/20 text-white" : alerta ? "bg-rose-600 text-white" : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {selo}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

export type Indicador = {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  href: string;
  /** perigo = vermelho (parado/atrasado), alerta = âmbar. */
  tom?: "normal" | "alerta" | "perigo";
  /** 0–1: barra de progresso embaixo (ex.: meta do mês). */
  barra?: number;
};

const TOM_INDICADOR = { normal: "text-stone-900", alerta: "text-amber-700", perigo: "text-rose-700" } as const;

/** Faixa de indicadores: os números do momento lado a lado, cada um abre a tela com o detalhe. */
export function Indicadores({ itens }: { itens: Indicador[] }) {
  const colunas = itens.length >= 6 ? "lg:grid-cols-6" : itens.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4";
  return (
    <section
      aria-label="Indicadores"
      className={`mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 shadow-[0_1px_2px_rgb(16_24_16/0.04)] [gap:1px] sm:grid-cols-3 ${colunas}`}
    >
      {itens.map(({ rotulo, valor, detalhe, href, tom = "normal", barra }) => (
        <Link key={rotulo} href={href} className="group flex min-w-0 flex-col bg-white px-4 py-3.5 transition hover:bg-marca-50/40">
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500 group-hover:text-marca-700">{rotulo}</span>
          <span className={`mt-1 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${TOM_INDICADOR[tom]}`}>{valor}</span>
          {barra != null && (
            <span className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-100" aria-hidden>
              <span className="block h-full rounded-full bg-marca-600" style={{ width: `${Math.min(1, Math.max(0, barra)) * 100}%` }} />
            </span>
          )}
          {detalhe && <span className="mt-1 truncate text-xs text-stone-500">{detalhe}</span>}
        </Link>
      ))}
    </section>
  );
}

/** Painel da tela inicial: caixa branca com título, número e link no cabeçalho; dentro, lista ou tabela. */
export function Painel({
  titulo,
  icone,
  contagem,
  link,
  className = "",
  children,
}: {
  titulo: ReactNode;
  icone?: ReactNode;
  contagem?: number;
  link?: { href: string; texto: string };
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgb(16_24_16/0.04)] ${className}`}>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-stone-100 px-4 py-2.5 sm:px-5">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-900">
          {icone}
          {titulo}
          {contagem != null && contagem > 0 && (
            <span className="rounded-full bg-stone-100 px-1.5 py-px text-[11px] font-semibold text-stone-700 tabular-nums">{contagem}</span>
          )}
        </h2>
        {link && (
          <Link href={link.href} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-marca-700 hover:underline">
            {link.texto} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

/** Linha de "tudo em dia" dentro de um Painel. */
export function NadaPendente({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 px-4 py-4 text-sm text-emerald-800 sm:px-5">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden /> {children}
    </p>
  );
}
