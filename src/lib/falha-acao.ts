import { useSyncExternalStore } from "react";
import { unstable_rethrow } from "next/navigation";
import { semConexao } from "@/lib/fila-offline";


/**
 * Mensagem para quando uma Server Action falha no navegador (sem internet, servidor fora…):
 * o componente mostra o aviso e mantém o que foi digitado, em vez de cair na tela de erro.
 * Redirect/notFound vindos da action são relançados para o Next tratar.
 */
export function mensagemFalha(e: unknown): string {
  unstable_rethrow(e);
  console.error(e);
  return semConexao(e) ? "Sem conexão com a internet. Tente de novo quando a conexão voltar." : "Não foi possível concluir agora. Tente de novo.";
}

function ouvirConexao(avisar: () => void) {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}

/** true quando o aparelho está sem internet (para as telas de erro). */
export function useSemConexao() {
  return useSyncExternalStore(
    ouvirConexao,
    () => !navigator.onLine,
    () => false,
  );
}
