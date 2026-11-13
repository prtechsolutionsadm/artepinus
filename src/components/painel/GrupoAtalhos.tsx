import type { ReactNode } from "react";

const GRADE = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
} as const;

/**
 * Grupo de cartões com título em caixa alta ("OPERAÇÃO", "GESTÃO"…) e grade responsiva:
 * 1 coluna no celular, 2 no tablet e até `colunas` (padrão 3) no computador.
 * Já traz o espaço de cima (mt-7): grupos em sequência não precisam de `space-y`.
 */
export function GrupoAtalhos({ titulo, children, colunas = 3 }: { titulo: ReactNode; children: ReactNode; colunas?: 1 | 2 | 3 }) {
  return (
    <section className="mt-7">
      <h2 className="mb-2.5 px-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{titulo}</h2>
      <div className={`grid gap-3 ${GRADE[colunas]}`}>{children}</div>
    </section>
  );
}
