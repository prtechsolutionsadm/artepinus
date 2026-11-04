import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Rodape } from "@/components/Rodape";
import { FormRecuperar } from "./FormRecuperar";

export const metadata: Metadata = { title: "Recuperar senha", robots: { index: false, follow: false } };

/** Recuperar a senha pela pergunta de segurança (sem depender do administrador). */
export default function RecuperarPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/login" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-stone-900">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Artepinus" className="mb-6 h-16 w-auto" />
        <h1 className="text-2xl font-bold">Recuperar a senha</h1>
        <p className="mb-6 mt-1 text-sm text-stone-500">Responda a sua pergunta de segurança para criar uma nova senha.</p>
        <FormRecuperar />
        <p className="mt-6 text-center text-xs text-stone-400">Não cadastrou a pergunta? Fale com o administrador do sistema.</p>
        <Rodape className="mt-10" />
      </div>
    </main>
  );
}
