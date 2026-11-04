"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize } from "lucide-react";

/** Relógio, atualização automática (1 min), tela cheia e tela sempre ligada para a TV. */
export function ControlesTv({ atualizadoEm }: { atualizadoEm: string }) {
  const router = useRouter();
  const [agora, setAgora] = useState<Date | null>(null);
  const [cheia, setCheia] = useState(false);

  useEffect(() => {
    setAgora(new Date());
    const relogio = setInterval(() => setAgora(new Date()), 1000);
    const dados = setInterval(() => router.refresh(), 60_000);
    // Mantém a tela da TV acesa (onde o navegador permitir)
    let trava: { release: () => Promise<void> } | null = null;
    const manter = async () => {
      try {
        trava = await (navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request("screen") ?? null;
      } catch {}
    };
    manter();
    const visivel = () => document.visibilityState === "visible" && manter();
    document.addEventListener("visibilitychange", visivel);
    const fs = () => setCheia(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fs);
    return () => {
      clearInterval(relogio);
      clearInterval(dados);
      document.removeEventListener("visibilitychange", visivel);
      document.removeEventListener("fullscreenchange", fs);
      trava?.release().catch(() => {});
    };
  }, [router]);

  return (
    <div className="flex items-center gap-5">
      {!cheia && (
        <a href="/producao" className="text-sm text-white/50 hover:text-white">
          Voltar ao sistema
        </a>
      )}
      {!cheia && (
        <button type="button" onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})} className="flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
          <Maximize className="h-4 w-4" /> Tela cheia
        </button>
      )}
      <div className="text-right leading-tight">
        <div className="text-4xl font-bold tabular-nums" suppressHydrationWarning>
          {agora ? agora.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }) : "--:--"}
        </div>
        <div className="text-xs text-white/50">dados de {atualizadoEm} · atualiza a cada minuto</div>
      </div>
    </div>
  );
}
