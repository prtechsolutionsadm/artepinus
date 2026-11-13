"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { LogOut } from "lucide-react";
import { removerInscricaoPush } from "@/app/actions/notificacoes";
import { reativarPush } from "@/components/AtivarPush";
import { doUsuario, limparPaginasGuardadas, listarFila, limparFila, semConexao } from "@/lib/fila-offline";

const SAIR_SEM_INTERNET =
  "Sair precisa de internet. Ligue o Wi-Fi ou os dados móveis e toque em Sair de novo.\n\nNada foi apagado: os seus lançamentos guardados e as telas para usar sem internet continuam no aparelho.";

/** O Sair deu certo: a Server Action terminou no redirect para o login (o Next já está levando para lá). */
function saiu(e: unknown) {
  try {
    unstable_rethrow(e);
    return false;
  } catch {
    return true;
  }
}

/**
 * Sair: avisa se há lançamentos de quem está saindo ainda não enviados, desliga os avisos dele neste
 * aparelho e, só depois que a sessão foi encerrada, apaga os lançamentos dele e as páginas guardadas.
 * Sem internet o Sair não se completa (sair() é uma Server Action): avisa e não apaga nada.
 * Os lançamentos de outros usuários ficam até eles entrarem.
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
  const [saindo, setSaindo] = useState(false);

  const aoSair = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saindo) return;
    if (!navigator.onLine) {
      alert(SAIR_SEM_INTERNET);
      return;
    }
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
    setSaindo(true);
    try {
      // Aparelho compartilhado: os avisos de quem saiu não continuam chegando nele. Só a linha do
      // servidor sai; a inscrição do navegador fica para voltar a valer quando a mesma pessoa entrar
      // (SincronizadorOffline).
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        const inscricao = await reg?.pushManager?.getSubscription();
        if (inscricao) await removerInscricaoPush(inscricao.endpoint).catch(() => {});
      } catch {}
      await sair();
    } catch (erro) {
      if (!saiu(erro)) {
        // Não saiu (a conexão caiu no caminho, servidor fora…): continua conectado e com tudo no aparelho
        console.error(erro);
        setSaindo(false);
        reativarPush(usuarioId);
        alert(semConexao(erro) ? SAIR_SEM_INTERNET : "Não foi possível sair agora. Tente de novo.\n\nNada foi apagado do aparelho.");
        return;
      }
    }
    // Sessão encerrada: só agora apaga deste aparelho os lançamentos de quem saiu e as telas guardadas
    await limparFila(usuarioId);
    navigator.serviceWorker?.controller?.postMessage({ tipo: "limpar" });
    await limparPaginasGuardadas(); // também sem o SW controlar a aba
  };

  return (
    <form onSubmit={aoSair} aria-busy={saindo || undefined}>
      {variante === "lateral" ? (
        <button
          disabled={saindo}
          className="group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-stone-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
        >
          <LogOut className="h-[18px] w-[18px] text-stone-400 group-hover:text-rose-600" /> {saindo ? "Saindo…" : "Sair"}
        </button>
      ) : variante === "item" ? (
        <button disabled={saindo} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60">
          <LogOut className="h-4 w-4" /> {saindo ? "Saindo…" : "Sair"}
        </button>
      ) : variante === "icone" ? (
        <button
          disabled={saindo}
          aria-label="Sair"
          title="Sair"
          className="grid h-9 w-9 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-rose-600 disabled:opacity-60"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      ) : (
        <button disabled={saindo} className="btn-secundario w-full py-3 text-rose-700">
          <LogOut className="h-4 w-4" /> {saindo ? "Saindo…" : "Sair"}
        </button>
      )}
    </form>
  );
}
