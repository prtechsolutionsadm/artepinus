"use client";

import { Minus, Plus } from "lucide-react";
import { CLASSE_MADEIRA, COMPRIMENTOS, LARGURAS, fmtComprimento, fmtM3, m3Pecas } from "@/lib/producao";

export type ValoresGrade = Record<string, string>;

export const chaveCelula = (largura: number, comprimento: number) => `${largura}x${comprimento}`;

/** Células preenchidas → itens { largura, comprimento, pecas }. */
export function itensDaGrade(valores: ValoresGrade) {
  const itens: { largura: number; comprimento: number; pecas: number }[] = [];
  for (const c of COMPRIMENTOS) {
    for (const l of LARGURAS) {
      const n = Number(valores[chaveCelula(l, c.mm)] || 0);
      if (n > 0) itens.push({ largura: l, comprimento: c.mm, pecas: n });
    }
  }
  return itens;
}

/**
 * Grade de apontamento: larguras nas colunas, comprimentos nas linhas (cada
 * comprimento já define a classe Ótimo/Bom/Regular). Digita-se só as peças.
 */
export function GradeBitolas({ espessura, valores, onChange }: { espessura: number | null; valores: ValoresGrade; onChange: (v: ValoresGrade) => void }) {
  const set = (k: string, v: string) => onChange({ ...valores, [k]: v.replace(/\D/g, "").slice(0, 6) });
  const somar = (k: string, d: number) => {
    const n = Math.max(0, Number(valores[k] || 0) + d);
    onChange({ ...valores, [k]: n ? String(n) : "" });
  };
  const pecas = (l: number, c: number) => Number(valores[chaveCelula(l, c)] || 0);
  const totalLinha = (c: number) => LARGURAS.reduce((t, l) => t + pecas(l, c), 0);
  const totalColuna = (l: number) => COMPRIMENTOS.reduce((t, c) => t + pecas(l, c.mm), 0);
  const totalPecas = COMPRIMENTOS.reduce((t, c) => t + totalLinha(c.mm), 0);
  const totalM3 = espessura ? COMPRIMENTOS.reduce((t, c) => t + LARGURAS.reduce((x, l) => x + m3Pecas(espessura, l, c.mm, pecas(l, c.mm)), 0), 0) : 0;

  /** Enter desce para a próxima linha da mesma coluna (agiliza a digitação). */
  const aoTeclar = (e: React.KeyboardEvent<HTMLInputElement>, li: number, ci: number) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const proxima = document.getElementById(`g-${ci + 1 < COMPRIMENTOS.length ? li : li + 1}-${ci + 1 < COMPRIMENTOS.length ? ci + 1 : 0}`);
    (proxima as HTMLInputElement | null)?.focus();
  };

  return (
    <div className="min-w-0">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="text-xs text-stone-500">
              <th className="sticky left-0 z-[1] w-20 bg-white px-2 py-2 text-left font-semibold sm:w-28">Compr.</th>
              {LARGURAS.map((l) => (
                <th key={l} className="px-1 py-2 text-center font-semibold">
                  {l} mm
                </th>
              ))}
              <th className="w-16 px-2 py-2 text-right font-semibold">Peças</th>
            </tr>
          </thead>
          <tbody>
            {COMPRIMENTOS.map((c, ci) => {
              const cls = CLASSE_MADEIRA[c.classe];
              return (
                <tr key={c.mm} className="border-t border-stone-100">
                  <th scope="row" className="sticky left-0 z-[1] bg-white px-2 py-1.5 text-left">
                    <div className="font-semibold tabular-nums">{fmtComprimento(c.mm)}</div>
                    <span className={`inline-block rounded px-1.5 py-px text-[10px] font-semibold ring-1 ring-inset ${cls.cor}`}>{cls.label}</span>
                  </th>
                  {LARGURAS.map((l, li) => {
                    const k = chaveCelula(l, c.mm);
                    const v = valores[k] ?? "";
                    return (
                      <td key={l} className="px-1 py-1.5">
                        <div className={`flex items-stretch overflow-hidden rounded-md border ${v ? "border-marca-500 bg-marca-50" : "border-stone-200 bg-white"}`}>
                          <button type="button" tabIndex={-1} onClick={() => somar(k, -1)} aria-label={`Menos uma peça ${l}×${c.mm}`} className="hidden w-6 place-items-center text-stone-400 hover:text-stone-700 sm:grid">
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            id={`g-${li}-${ci}`}
                            inputMode="numeric"
                            value={v}
                            onChange={(e) => set(k, e.target.value)}
                            onKeyDown={(e) => aoTeclar(e, li, ci)}
                            onFocus={(e) => e.target.select()}
                            aria-label={`Peças ${l} mm × ${fmtComprimento(c.mm)}`}
                            placeholder="0"
                            className="w-full min-w-0 bg-transparent px-1 py-2 text-center text-base font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-stone-300 sm:text-sm"
                          />
                          <button type="button" tabIndex={-1} onClick={() => somar(k, 1)} aria-label={`Mais uma peça ${l}×${c.mm}`} className="hidden w-6 place-items-center text-stone-400 hover:text-stone-700 sm:grid">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-right font-semibold tabular-nums text-stone-700">{totalLinha(c.mm) || "—"}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-stone-200 text-xs text-stone-500">
              <th className="sticky left-0 z-[1] bg-white px-2 py-2 text-left font-semibold">Total</th>
              {LARGURAS.map((l) => (
                <td key={l} className="px-1 py-2 text-center font-semibold tabular-nums">
                  {totalColuna(l) || "—"}
                </td>
              ))}
              <td className="px-2 py-2 text-right text-sm font-bold tabular-nums text-stone-900">{totalPecas || "—"}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-stone-50 px-3 py-2 text-sm">
        <span className="text-stone-600">
          {totalPecas.toLocaleString("pt-BR")} peça(s){espessura ? ` de ${espessura} mm` : ""}
        </span>
        <span className="font-semibold tabular-nums">{espessura ? fmtM3(totalM3, 3) : "escolha a espessura para ver o volume"}</span>
      </div>
    </div>
  );
}
