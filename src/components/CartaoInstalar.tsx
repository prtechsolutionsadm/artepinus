"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";

/**
 * Pedido de instalação do navegador (Chrome, Edge, Android), guardado pelo SCRIPT_INSTALAR (src/lib/instalar.ts) do layout raiz:
 * o evento pode chegar antes desta tela existir.
 */
type PedidoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
declare global {
  interface Window {
    __pedidoInstalar?: PedidoInstalar | null;
  }
}


const CHAVE = "artepinus:instalar-dispensado";
const DIAS_DISPENSADO = 30;

function jaInstalado() {
  return matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** iPhone/iPad no Safari (lá não existe botão de instalar: é pelo Compartilhar). */
function iosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function dispensadoRecente() {
  try {
    const t = Number(localStorage.getItem(CHAVE));
    return t > 0 && Date.now() - t < DIAS_DISPENSADO * 86_400_000;
  } catch {
    return false;
  }
}

/**
 * Cartão "Instalar o app" da tela de início: só aparece onde dá para instalar e o app ainda não está instalado.
 * Chrome/Edge/Android: botão que abre a instalação do navegador. iPhone (Safari): o passo a passo do Compartilhar.
 * "Agora não" esconde por 30 dias neste aparelho.
 */
export function CartaoInstalar({ className = "" }: { className?: string }) {
  const [modo, setModo] = useState<"botao" | "ios" | null>(null);

  useEffect(() => {
    const atualizar = () => {
      if (jaInstalado() || dispensadoRecente()) return setModo(null);
      if (window.__pedidoInstalar) return setModo("botao");
      setModo(iosSafari() ? "ios" : null);
    };
    atualizar();
    addEventListener("artepinus:instalavel", atualizar);
    return () => removeEventListener("artepinus:instalavel", atualizar);
  }, []);

  if (!modo) return null;

  const instalar = async () => {
    const pedido = window.__pedidoInstalar;
    if (!pedido) return setModo(null);
    await pedido.prompt();
    const { outcome } = await pedido.userChoice;
    window.__pedidoInstalar = null; // o pedido só vale uma vez
    if (outcome === "accepted") setModo(null);
    else setModo(iosSafari() ? "ios" : null);
  };
  const dispensar = () => {
    try {
      localStorage.setItem(CHAVE, String(Date.now()));
    } catch {}
    setModo(null);
  };

  return (
    <section aria-label="Instalar o app" className={`relative rounded-2xl border border-marca-200 bg-marca-50/60 p-4 ${className}`}>
      <button
        type="button"
        onClick={dispensar}
        aria-label="Agora não"
        title="Agora não"
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg text-stone-400 transition hover:bg-white hover:text-stone-700"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-xl shadow-sm ring-1 ring-marca-100" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-stone-900">Instalar o app</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
            Ícone na tela, abre em tela cheia, recebe avisos e lança até sem internet.
          </p>
        </div>
      </div>
      {modo === "botao" ? (
        <button type="button" onClick={instalar} className="btn-primario mt-3 w-full">
          <Download className="h-4 w-4" aria-hidden /> Instalar neste aparelho
        </button>
      ) : (
        <ol className="mt-3 space-y-1.5 text-xs leading-5 text-stone-700">
          <li className="flex items-start gap-2">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[10px] font-bold text-marca-700 ring-1 ring-marca-200">1</span>
            <span>
              Toque em <Share className="inline h-4 w-4 align-[-3px] text-sky-800" aria-hidden /> <b>Compartilhar</b>, na barra do Safari.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[10px] font-bold text-marca-700 ring-1 ring-marca-200">2</span>
            <span>
              Escolha <SquarePlus className="inline h-4 w-4 align-[-3px]" aria-hidden /> <b>Adicionar à Tela de Início</b>.
            </span>
          </li>
        </ol>
      )}
    </section>
  );
}
