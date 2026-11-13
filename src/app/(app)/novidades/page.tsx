import type { Metadata } from "next";
import { Sparkles, Wrench, Zap } from "lucide-react";
import { Titulo } from "@/components/ui";
import { NOTAS, VERSAO, type NotaAtualizacao } from "@/lib/versao";
import { exigirUsuario } from "@/lib/session";

export const metadata: Metadata = { title: "Novidades" };

/** "2026-11-13" → "13/11/2026" */
function dataBr(dia: string) {
  const [a, m, d] = dia.split("-");
  return `${d}/${m}/${a}`;
}

const GRUPOS: { chave: "novidades" | "melhorias" | "correcoes"; titulo: string; Icone: typeof Sparkles; cor: string }[] = [
  { chave: "novidades", titulo: "Novidades", Icone: Sparkles, cor: "text-marca-700" },
  { chave: "melhorias", titulo: "Melhorias", Icone: Zap, cor: "text-sky-800" },
  { chave: "correcoes", titulo: "Correções", Icone: Wrench, cor: "text-amber-700" },
];

function Versao({ nota, atual }: { nota: NotaAtualizacao; atual: boolean }) {
  return (
    <li id={`v${nota.versao}`} className="relative scroll-mt-24 pl-8">
      <span
        className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full ring-4 ${atual ? "bg-marca-600 ring-marca-100" : "bg-stone-300 ring-stone-100"}`}
        aria-hidden
      />
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold text-stone-900">Versão {nota.versao}</h2>
        <span className="text-sm text-stone-500">{dataBr(nota.data)}</span>
        {atual && <span className="rounded-full bg-marca-50 px-2 py-0.5 text-xs font-semibold text-marca-700 ring-1 ring-marca-200">Atual</span>}
      </div>
      <p className="mt-0.5 text-stone-700">{nota.titulo}</p>
      <div className="cartao mt-3 space-y-4">
        {GRUPOS.filter((g) => nota[g.chave]?.length).map(({ chave, titulo, Icone, cor }) => (
          <section key={chave}>
            <h3 className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${cor}`}>
              <Icone className="h-4 w-4" aria-hidden /> {titulo}
            </h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-stone-700 marker:text-stone-300">
              {nota[chave]!.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </li>
  );
}

export default async function NovidadesPage() {
  await exigirUsuario();
  return (
    <div className="mx-auto max-w-3xl">
      <Titulo subtitulo={`Você está usando a versão ${VERSAO}. Veja o que mudou em cada versão do sistema.`}>Novidades</Titulo>
      <ol className="relative space-y-8 before:absolute before:bottom-2 before:left-[6px] before:top-2 before:w-0.5 before:bg-stone-200">
        {NOTAS.map((n, i) => (
          <Versao key={n.versao} nota={n} atual={i === 0} />
        ))}
      </ol>
    </div>
  );
}
