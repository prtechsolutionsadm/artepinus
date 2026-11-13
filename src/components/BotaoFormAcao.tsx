"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { mensagemFalha } from "@/lib/falha-acao";

/**
 * Botão que chama uma Server Action já com os argumentos (ex.: `acao.bind(null, id)`), no lugar de
 * um `<form action>`: sem internet ou com o servidor fora, mostra o aviso em vez de derrubar a tela.
 * Se a action devolver `{ erro }`, a mensagem aparece num alerta; no sucesso, a tela é recarregada.
 */
export function BotaoFormAcao({
  acao,
  confirmar,
  className,
  disabled,
  rotulo,
  children,
}: {
  acao: () => Promise<unknown>;
  confirmar?: string;
  className?: string;
  disabled?: boolean;
  /** aria-label (botões só com ícone). */
  rotulo?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={disabled || pendente}
      aria-busy={pendente}
      aria-label={rotulo}
      className={className}
      onClick={() => {
        if (confirmar && !window.confirm(confirmar)) return;
        iniciar(async () => {
          try {
            const r = await acao();
            if (r && typeof r === "object" && "erro" in r && r.erro) return window.alert(String(r.erro));
          } catch (e) {
            return window.alert(mensagemFalha(e));
          }
          router.refresh();
        });
      }}
    >
      {children}
    </button>
  );
}
