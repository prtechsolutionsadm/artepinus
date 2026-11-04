"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Campo de senha com o "olhinho" para mostrar/esconder o que foi digitado. */
export function CampoSenha({ id, name, autoComplete, minLength }: { id: string; name: string; autoComplete: "current-password" | "new-password"; minLength?: number }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="relative">
      <input id={id} name={name} type={visivel ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} required className="campo pr-11" />
      <button
        type="button"
        onClick={() => setVisivel(!visivel)}
        aria-label={visivel ? "Esconder a senha" : "Mostrar a senha"}
        aria-pressed={visivel}
        title={visivel ? "Esconder a senha" : "Mostrar a senha"}
        className="absolute inset-y-0 right-0 mt-1.5 grid w-11 place-items-center rounded-r-xl text-stone-400 hover:text-stone-700"
      >
        {visivel ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
