"use client";

import { LogOut } from "lucide-react";
import { removerInscricaoPush } from "@/app/actions/notificacoes";
import { doUsuario, limparPaginasGuardadas, listarFila, limparFila } from "@/lib/fila-offline";

/**
 * Sair: avisa se há lançamentos de quem está saindo ainda não enviados, desliga os avisos dele neste
 * aparelho e apaga as páginas guardadas. Os lançamentos de outros usuários ficam até eles entrarem.
 */
export function BotaoSair({
  sair,
  usuarioId,
  variante = "icone",
}: {
  sair: () => Promise<void>;
  /** Quem está saindo: só os lançamentos dele (e os antigos, sem dono) são apagados. */
  usuarioId: string;
  variante?: "icone" | "botao" | "item" | "lateral";
}) {
  const aoSair = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fila = await listarFila();
    const pendentes = fila.filter((i) => doUsuario(i, usuarioId)).length;
    const outros = fila.length - pendentes;
    if (
      pendentes &&
      !confirm(
        `Há ${pendentes} lançamento(s) seu(s) feito(s) sem internet que ainda não foram enviados. Se sair agora, eles serão perdidos.` +
          (outros ? ` Os ${outros} de outro(s) usuário(s) continuam no aparelho até a pessoa entrar.` : "") +
          " Sair mesmo assim?",
      )
    )
      return;
    // Aparelho compartilhado: os avisos de quem saiu não continuam chegando nele. Só a linha do
    // servidor sai; a inscrição do navegador fica para voltar a valer quando a mesma pessoa entrar
    // (SincronizadorOffline). Sem internet o Sair não se completa (sair() é uma Server Action).
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const inscricao = await reg?.pushManager?.getSubscription();
      if (inscricao) await removerInscricaoPush(inscricao.endpoint).catch(() => {});
    } catch {}
    await limparFila(usuarioId);
    navigator.serviceWorker?.controller?.postMessage({ tipo: "limpar" });
    await limparPaginasGuardadas(); // também sem o SW controlar a aba
    await sair();
  };
  return (
    <form onSubmit={aoSair}>
      {variante === "lateral" ? (
        <button className="group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-stone-600 transition hover:bg-rose-50 hover:text-rose-700">
          <LogOut className="h-[18px] w-[18px] text-stone-400 group-hover:text-rose-600" /> Sair
        </button>
      ) : variante === "item" ? (
        <button className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      ) : variante === "icone" ? (
        <button aria-label="Sair" title="Sair" className="grid h-9 w-9 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-rose-600">
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      ) : (
        <button className="btn-secundario w-full py-3 text-rose-700">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      )}
    </form>
  );
}
