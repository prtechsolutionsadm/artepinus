"use client";

import { useState, useTransition } from "react";
import type { EstadoForm } from "@/app/actions/auth";
import Link from "next/link";
import { CheckCircle2, KeyRound } from "lucide-react";
import { perguntaDoLogin, recuperarSenha } from "@/app/actions/auth";
import { CampoSenha } from "@/components/CampoSenha";

/** Recuperar a senha: informa o login, responde a pergunta de segurança e define a nova senha. */
export function FormRecuperar() {
  const [login, setLogin] = useState("");
  const [pergunta, setPergunta] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [buscando, iniciar] = useTransition();
  const [estado, setEstado] = useState<EstadoForm>(undefined);
  const [salvando, salvar] = useTransition();
  // Envio sem limpar o formulário: com a resposta errada, a pessoa só corrige o que precisa
  const enviar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    salvar(async () => setEstado(await recuperarSenha(undefined, dados)));
  };

  if (estado?.ok)
    return (
      <div className="cartao space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="font-medium">{estado.ok}</p>
        <Link href="/login" className="btn-primario w-full py-3">
          Ir para o login
        </Link>
      </div>
    );

  if (!pergunta)
    return (
      <form
        className="cartao space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setErro(null);
          iniciar(async () => {
            const r = await perguntaDoLogin(login);
            if (r.erro) setErro(r.erro);
            else setPergunta(r.pergunta!);
          });
        }}
      >
        <div>
          <label htmlFor="login">Seu login</label>
          <input id="login" value={login} onChange={(e) => setLogin(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="nome.sobrenome" required className="campo" />
        </div>
        {erro && (
          <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
            {erro}
          </p>
        )}
        <button disabled={buscando} className="btn-primario w-full py-3">
          {buscando ? "Buscando…" : "Continuar"}
        </button>
      </form>
    );

  return (
    <form onSubmit={enviar} className="cartao space-y-4">
      <input type="hidden" name="login" value={login} />
      <div className="rounded-md bg-stone-50 px-3 py-2.5 text-sm ring-1 ring-stone-200">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          <KeyRound className="h-3.5 w-3.5" /> Pergunta de segurança
        </div>
        <div className="mt-1 font-medium">{pergunta}</div>
      </div>
      <div>
        <label htmlFor="resposta">Sua resposta</label>
        <input id="resposta" name="resposta" autoComplete="off" required className="campo" />
      </div>
      <div>
        <label htmlFor="nova">Nova senha (mínimo 8 caracteres)</label>
        <CampoSenha id="nova" name="nova" autoComplete="new-password" minLength={8} />
      </div>
      <div>
        <label htmlFor="confirmacao">Confirme a nova senha</label>
        <CampoSenha id="confirmacao" name="confirmacao" autoComplete="new-password" />
      </div>
      {estado?.erro && (
        <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
          {estado.erro}
        </p>
      )}
      <button disabled={salvando} className="btn-primario w-full py-3">
        {salvando ? "Salvando…" : "Definir nova senha"}
      </button>
      <button type="button" onClick={() => (setPergunta(null), setErro(null))} className="w-full text-sm text-stone-500 hover:underline">
        Usar outro login
      </button>
    </form>
  );
}
