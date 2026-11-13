"use client";

import { LogOut } from "lucide-react";
import { removerInscricaoPush } from "@/app/actions/notificacoes";
import { limparPaginasGuardadas, listarFila, limparFila } from "@/lib/fila-offline";

/** Sair: avisa se há lançamentos não enviados, desliga os avisos e apaga as páginas guardadas no aparelho. */
export function BotaoSair({ sair, variante = "icone" }: { sair: () => Promise<void>; variante?: "icone" | "botao" | "item" | "lateral" }) {
  const aoSair = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const pendentes = (await listarFila()).length;
    if (pendentes && !confirm(`Há ${pendentes} lançamento(s) feito(s) sem internet que ainda não foram enviados. Se sair agora, eles serão perdidos. Sair mesmo assim?`)) return;
    // Aparelho compartilhado: os avisos de quem saiu não continuam chegando nele.
    // Ainda com a sessão valendo; sem internet, o unsubscribe local já corta o push.
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const inscricao = await reg?.pushManager?.getSubscription();
      if (inscricao) {
        await removerInscricaoPush(inscricao.endpoint).catch(() => {});
        await inscricao.unsubscribe().catch(() => {});
      }
    } catch {}
    await limparFila();
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
