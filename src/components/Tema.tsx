"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

export type Tema = "claro" | "escuro" | "auto";
const CHAVE = "artepinus-tema";
const EVENTO = "artepinus-tema";

function ler(): Tema {
  try {
    const t = localStorage.getItem(CHAVE);
    return t === "claro" || t === "escuro" ? t : "auto";
  } catch {
    return "auto";
  }
}

function aplicar(t: Tema) {
  const escuro = t === "escuro" || (t === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", escuro);
}

/**
 * Script que roda antes de pintar a tela (sem "piscar" claro → escuro).
 * Repete a lógica de `aplicar` porque executa fora do React.
 */
export const SCRIPT_TEMA = `try{var t=localStorage.getItem("${CHAVE}");var e=t==="escuro"||(t!=="claro"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",e)}catch(_){}`;

/** Aplica o tema no sistema e acompanha o tema do aparelho (modo Automático). Sai do sistema → volta ao claro. */
export function TemaApp() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const atualizar = () => aplicar(ler());
    atualizar();
    mq.addEventListener("change", atualizar);
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      mq.removeEventListener("change", atualizar);
      window.removeEventListener(EVENTO, atualizar);
      window.removeEventListener("storage", atualizar);
      // O site institucional é sempre claro
      document.documentElement.classList.remove("dark");
    };
  }, []);
  return null;
}

const OPCOES: { valor: Tema; rotulo: string; Icone: typeof Sun }[] = [
  { valor: "claro", rotulo: "Claro", Icone: Sun },
  { valor: "escuro", rotulo: "Escuro", Icone: Moon },
  { valor: "auto", rotulo: "Automático", Icone: Monitor },
];

/** Claro / Escuro / Automático (segue o aparelho). Fica salvo neste aparelho. */
export function SeletorTema({ grande = false }: { grande?: boolean }) {
  const [tema, setTema] = useState<Tema>("auto");
  useEffect(() => setTema(ler()), []);
  const escolher = (t: Tema) => {
    try {
      localStorage.setItem(CHAVE, t);
    } catch {}
    setTema(t);
    window.dispatchEvent(new Event(EVENTO));
  };
  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-1 rounded-md bg-stone-100 p-1">
      {OPCOES.map(({ valor, rotulo, Icone }) => (
        <button
          key={valor}
          type="button"
          role="radio"
          aria-checked={tema === valor}
          onClick={() => escolher(valor)}
          title={rotulo}
          className={`flex items-center justify-center gap-1.5 rounded px-2 font-medium transition ${grande ? "py-2.5 text-sm" : "py-2"} ${tema === valor ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
        >
          <Icone className={grande ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4 shrink-0"} />
          <span className={grande ? "" : "sr-only"}>{rotulo}</span>
        </button>
      ))}
    </div>
  );
}

/** Botão redondo da barra do topo: alterna Claro → Escuro → Automático (o ícone mostra o atual). */
export function BotaoTema({ className = "" }: { className?: string }) {
  const [tema, setTema] = useState<Tema>("auto");
  useEffect(() => {
    setTema(ler());
    const atualizar = () => setTema(ler());
    window.addEventListener(EVENTO, atualizar);
    return () => window.removeEventListener(EVENTO, atualizar);
  }, []);
  const i = OPCOES.findIndex((o) => o.valor === tema);
  const { Icone, rotulo } = OPCOES[i];
  const proximo = OPCOES[(i + 1) % OPCOES.length];
  return (
    <button
      type="button"
      onClick={() => {
        try {
          localStorage.setItem(CHAVE, proximo.valor);
        } catch {}
        setTema(proximo.valor);
        window.dispatchEvent(new Event(EVENTO));
      }}
      aria-label={`Tema: ${rotulo}. Tocar muda para ${proximo.rotulo}`}
      title={`Tema: ${rotulo} (tocar muda para ${proximo.rotulo})`}
      className={`h-10 w-10 place-items-center rounded-full text-stone-600 hover:bg-stone-100 ${className || "grid"}`}
    >
      <Icone className="h-5 w-5" />
    </button>
  );
}
