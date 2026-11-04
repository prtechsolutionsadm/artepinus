"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Printer, Truck } from "lucide-react";
import { expedirPacotes } from "@/app/actions/rastreio";
import { fmtM3 } from "@/lib/producao";
import { STATUS_PACOTE, codigoPacote } from "@/lib/rastreio";
import type { StatusPacote } from "@/generated/prisma/enums";

export type LinhaPacote = {
  numero: number;
  status: StatusPacote;
  bitola: string;
  pecas: number;
  m3: number;
  classe: string | null;
  local: string | null;
  quando: string;
  origem: string;
};

/** Lista de pacotes com seleção para imprimir etiquetas ou expedir vários de uma vez. */
export function ListaPacotes({ linhas, podeExpedir }: { linhas: LinhaPacote[]; podeExpedir: boolean }) {
  const router = useRouter();
  const [sel, setSel] = useState<number[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const selecionados = linhas.filter((l) => sel.includes(l.numero));
  const expediveis = selecionados.filter((l) => l.status === "VERDE" || l.status === "SECO");
  const alternar = (n: number) => setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));

  function expedir() {
    if (!confirm(`Registrar a saída de ${expediveis.length} pacote(s)?`)) return;
    setErro(null);
    iniciar(async () => {
      const r = await expedirPacotes({ numeros: expediveis.map((l) => l.numero) });
      if (r.erro) return setErro(r.erro);
      setSel([]);
      router.refresh();
    });
  }

  return (
    <div>
      {sel.length > 0 && (
        <div className="sticky top-16 z-10 mb-3 rounded-2xl border border-marca-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {sel.length} selecionado(s) · {fmtM3(selecionados.reduce((s, l) => s + l.m3, 0), 2)}
            </span>
            <span className="ml-auto flex flex-wrap gap-2">
              <Link href={`/producao/pacotes/etiquetas?n=${sel.join(",")}`} className="btn-secundario px-3 py-1.5 text-sm">
                <Printer className="h-4 w-4" /> Etiquetas
              </Link>
              {podeExpedir && expediveis.length > 0 && (
                <button type="button" onClick={expedir} disabled={pendente} className="btn-primario px-3 py-1.5 text-sm">
                  <Truck className="h-4 w-4" /> {pendente ? "Registrando…" : `Registrar saída de ${expediveis.length}`}
                </button>
              )}
              <button type="button" onClick={() => setSel([])} className="btn-secundario px-3 py-1.5 text-sm">
                Limpar
              </button>
            </span>
          </div>
          {selecionados.length > expediveis.length && <p className="mt-2 text-xs text-stone-500">Pacotes na estufa, expedidos ou cancelados ficam de fora da saída.</p>}
          {erro && (
            <p role="alert" className="mt-2 text-sm text-rose-700">
              {erro}
            </p>
          )}
        </div>
      )}
      <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {linhas.map((l) => (
          <li key={l.numero} className={`flex items-center gap-1 ${sel.includes(l.numero) ? "bg-marca-50/60" : ""}`}>
            <label className="mb-0 grid h-14 w-12 shrink-0 cursor-pointer place-items-center">
              <input type="checkbox" checked={sel.includes(l.numero)} onChange={() => alternar(l.numero)} aria-label={`Selecionar ${codigoPacote(l.numero)}`} className="h-4 w-4" />
            </label>
            <Link href={`/producao/pacotes/${l.numero}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-4 hover:bg-stone-50">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-sm font-semibold">{codigoPacote(l.numero)}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600">
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_PACOTE[l.status].hex }} />
                    {STATUS_PACOTE[l.status].label}
                  </span>
                </div>
                <div className="truncate text-sm text-stone-600">
                  {l.bitola} · {l.pecas} pç · {fmtM3(l.m3, 3)}
                  {l.classe && ` · ${l.classe}`}
                </div>
                <div className="truncate text-xs text-stone-400">
                  {l.quando} · {l.origem}
                  {l.local && ` · ${l.local}`}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
