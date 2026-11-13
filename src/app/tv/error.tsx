"use client";

import { useEffect } from "react";
import { EMPRESA } from "@/lib/empresa";

/**
 * Falha ao atualizar o painel (banco lento, sem internet): a TV tenta de novo sozinha
 * a cada 30 s e quando a conexão volta. Ao dar certo, o painel volta com o próprio
 * intervalo de 1 min e o Wake Lock.
 */
export default function ErroTv({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => console.error(error), [error]);
  useEffect(() => {
    const t = setInterval(() => retry(), 30_000);
    const online = () => retry();
    window.addEventListener("online", online);
    return () => {
      clearInterval(t);
      window.removeEventListener("online", online);
    };
  }, [retry]);

  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-[2vw] bg-[#0b100a] p-[1.6vw] text-center text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={EMPRESA.logoBranco} alt="Artepinus" className="h-[3.6vw] w-auto" />
      <p className="text-[2.4vw] font-semibold">Sem conexão com o sistema, tentando de novo…</p>
      <div className="flex items-center gap-5">
        <a href="/producao" className="text-sm text-white/50 hover:text-white">
          Voltar ao sistema
        </a>
        <button type="button" onClick={() => retry()} className="rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
          Tentar agora
        </button>
      </div>
    </main>
  );
}
