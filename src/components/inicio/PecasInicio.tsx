import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowRight, CheckCircle2, type LucideIcon } from "lucide-react";
import { CartaoAtalho } from "@/components/painel/CartaoAtalho";
import { CartaoPrincipal } from "@/components/painel/CartaoPrincipal";
import { GrupoAtalhos } from "@/components/painel/GrupoAtalhos";
import { SobreFaixa } from "@/components/painel/SobreFaixa";
import { TodasAsTelas } from "@/components/painel/TodasAsTelas";
import type { GrupoNav } from "@/lib/menu";

/** Peças comuns às telas iniciais dos módulos (Serraria e Manutenção). */

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

export type ChipResumo = {
  href: string;
  icone: LucideIcon;
  texto: ReactNode;
  /** alerta = âmbar (falta algo), perigo = vermelho (parado/atrasado), ok = verde. */
  tom?: "normal" | "alerta" | "perigo" | "ok";
};

const TOM: Record<NonNullable<ChipResumo["tom"]>, { chip: string; icone: string }> = {
  normal: { chip: "border-stone-200 bg-stone-50 text-stone-700 hover:border-marca-300 hover:bg-marca-50", icone: "text-marca-700" },
  alerta: { chip: "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300", icone: "text-amber-600" },
  perigo: { chip: "border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-300", icone: "text-rose-600" },
  ok: { chip: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300", icone: "text-emerald-600" },
};

/**
 * Cartão branco de resumo que "sobe" sobre a faixa verde: poucos números em chips (cada um abre a
 * tela com o detalhe) e, embaixo, uma linha opcional de complemento.
 */
export function ResumoInicio({ chips, rodape }: { chips: ChipResumo[]; rodape?: ReactNode }) {
  return (
    <SobreFaixa>
      <div className="cartao px-3 py-3 shadow-xl shadow-stone-900/[0.06] sm:px-5 sm:py-4">
        {/* Celular: 2 por linha (o último sozinho ocupa a linha toda); tablet e computador: em fila, no centro */}
        <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center [&>li:last-child:nth-child(odd)]:col-span-2">
          {chips.map(({ href, icone: Icone, texto, tom = "normal" }) => (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                className={`flex h-full items-center gap-2 rounded-xl border px-3 py-2 text-[13px] leading-tight transition sm:rounded-full sm:py-1.5 sm:text-sm ${TOM[tom].chip}`}
              >
                <Icone className={`h-4 w-4 shrink-0 ${TOM[tom].icone}`} aria-hidden />
                <span className="min-w-0">{texto}</span>
              </Link>
            </li>
          ))}
        </ul>
        {rodape && <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-stone-500">{rodape}</div>}
      </div>
    </SobreFaixa>
  );
}

/**
 * Seção da tela inicial com título em caixa alta (o mesmo estilo dos grupos de atalhos), número ao
 * lado do título e um link opcional à direita ("Ver todas →").
 */
export function SecaoInicio({
  titulo,
  contagem,
  link,
  className = "",
  children,
}: {
  titulo: ReactNode;
  contagem?: number;
  link?: { href: string; texto: string };
  className?: string;
  children: ReactNode;
}) {
  return (
    // flex-col: numa grade, o conteúdo pode crescer (flex-1) até a altura da seção vizinha
    <section className={`mt-7 flex min-w-0 flex-col ${className}`}>
      <div className="mb-2.5 flex min-h-5 items-center justify-between gap-3 px-0.5">
        <h2 className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          {titulo}
          {contagem != null && contagem > 0 && (
            <span className="rounded-full bg-stone-200/70 px-1.5 py-px text-[11px] font-semibold tracking-normal text-stone-700 tabular-nums">{contagem}</span>
          )}
        </h2>
        {link && (
          <Link href={link.href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-marca-700 hover:underline">
            {link.texto} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Altura do cartão principal ao lado de 1–3 atalhos empilhados (2 colunas a partir do tablet). */
const ALTURA_PRINCIPAL = ["", "", "sm:row-span-2", "sm:row-span-3"];

/**
 * "Acesso rápido": a tarefa principal da função num cartão grande e as outras tarefas do dia ao lado.
 * Com 4 atalhos: 3 colunas no computador (o principal à esquerda, os atalhos em 2×2); com até 3,
 * 2 colunas (o principal à esquerda e os atalhos empilhados à direita). No celular, um embaixo do outro.
 */
export function AcessoRapido({
  principal,
  atalhos,
}: {
  principal: ComponentProps<typeof CartaoPrincipal>;
  atalhos: ComponentProps<typeof CartaoAtalho>[];
}) {
  const grade = atalhos.length >= 4;
  return (
    <div className="nao-imprimir">
      <GrupoAtalhos titulo="Acesso rápido" colunas={grade ? 3 : 2}>
        <div className={grade ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ALTURA_PRINCIPAL[atalhos.length]}>
          <CartaoPrincipal {...principal} />
        </div>
        {atalhos.map((a) => (
          <CartaoAtalho key={a.href} {...a} />
        ))}
      </GrupoAtalhos>
    </div>
  );
}

/** Linha "Tudo em dia" (nenhuma pendência). */
export function TudoEmDia({ children = "Tudo em dia. Nenhuma pendência." }: { children?: ReactNode }) {
  return (
    <p className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden /> {children}
    </p>
  );
}

/** "Todas as telas" do módulo no fim da tela inicial: os grupos do menu da pessoa, em cartões. */
export function TodasAsTelasInicio({ grupos }: { grupos: GrupoNav[] | undefined }) {
  if (!grupos?.length) return null;
  return (
    <div className="nao-imprimir mt-12">
      <div className="flex items-center gap-3">
        <h2 className="shrink-0 text-base font-semibold text-stone-800">Todas as telas</h2>
        <span aria-hidden className="h-px flex-1 bg-stone-200" />
      </div>
      {/* O primeiro grupo encosta no título acima */}
      <div className="[&_section:first-child]:mt-4">
        <TodasAsTelas grupos={grupos} />
      </div>
    </div>
  );
}
