import type { ReactNode } from "react";

/**
 * Puxa o conteúdo para cima, por cima da parte de baixo da <FaixaPainel> (logo antes dele).
 * É só o invólucro: o conteúdo traz o próprio fundo, normalmente um cartão branco de resumo
 * (ex.: `<SobreFaixa><div className="cartao shadow-xl">…</div></SobreFaixa>`). No papel não sobe.
 */
export function SobreFaixa({ children }: { children: ReactNode }) {
  return <div className="relative mt-4">{children}</div>;
}
