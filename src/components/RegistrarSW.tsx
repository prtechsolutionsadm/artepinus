"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { BUILD, URL_SW } from "@/lib/sw";

const INTERVALO = 30 * 60_000; // confere a cada 30 minutos com o app aberto

/**
 * Service worker + atualização automática do app (inclusive instalado como PWA, sem reinstalar):
 * - O SW é registrado como /sw.js?v=<publicação>: cada publicação instala um SW novo, que assume na hora
 *   (skipWaiting/claim), troca os arquivos guardados e guarda de novo as telas offline.
 * - O app pergunta ao servidor qual publicação está no ar (/api/versao) ao abrir, ao voltar para ele,
 *   ao voltar a internet e a cada 30 min. Se mudou: recarrega sozinho quando é seguro (voltando ao app
 *   ou trocando de tela) e, enquanto isso, mostra o aviso "Nova versão" com o botão Atualizar.
 */
export function RegistrarSW() {
  const [nova, setNova] = useState(false);
  const desatualizado = useRef(false);
  const path = usePathname();
  const primeiro = useRef(true);

  const conferir = useCallback(async () => {
    if (process.env.NODE_ENV !== "production" || !navigator.onLine) return false;
    try {
      navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {});
      const res = await fetch("/api/versao", { cache: "no-store" });
      if (!res.ok) return false;
      const { build } = (await res.json()) as { build?: string };
      if (build && build !== BUILD) {
        desatualizado.current = true;
        setNova(true);
        return true;
      }
    } catch {}
    return false;
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register(URL_SW, { scope: "/" }).catch(() => {});
    }
    conferir();
    // Voltando ao app (estava em segundo plano): ninguém está no meio de um formulário, então recarrega direto
    const aoVoltar = async () => {
      if (document.visibilityState !== "visible") return;
      if (desatualizado.current || (await conferir())) location.reload();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    addEventListener("online", conferir);
    const timer = setInterval(conferir, INTERVALO);
    return () => {
      document.removeEventListener("visibilitychange", aoVoltar);
      removeEventListener("online", conferir);
      clearInterval(timer);
    };
  }, [conferir]);

  // Trocou de tela com uma versão nova no ar: abre a tela já na versão nova
  useEffect(() => {
    if (primeiro.current) {
      primeiro.current = false;
      return;
    }
    if (desatualizado.current) location.reload();
  }, [path]);

  if (!nova) return null;
  return (
    <div
      role="status"
      className="nao-imprimir fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-marca-200 bg-white p-3 pl-4 text-sm shadow-lg lg:bottom-4 lg:left-auto lg:right-4 lg:mx-0"
    >
      <RefreshCw className="h-5 w-5 shrink-0 text-marca-700" aria-hidden />
      <span className="min-w-0 flex-1 leading-snug text-stone-700">
        <b className="block text-stone-900">Nova versão do sistema</b>
        Atualiza sozinho ao trocar de tela.
      </span>
      <button type="button" onClick={() => location.reload()} className="btn-primario shrink-0 px-3 py-2">
        Atualizar
      </button>
    </div>
  );
}
