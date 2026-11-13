"use client";

import { Copy, Plus, Trash2 } from "lucide-react";
import { CLASSE_MADEIRA, COMPRIMENTOS, ESPESSURAS, LARGURAS, MISTA, fmtM3, fmtNum, itensDaLinha, type LinhaFicha } from "@/lib/producao";

export const linhaVazia = (base?: Partial<LinhaFicha>): LinhaFicha => ({ espessura: base?.espessura ?? null, larguras: base?.larguras ?? [], pecas: {}, gradesUmidas: null, local: base?.local ?? null });

/** Linhas com alguma peça lançada. */
export const linhasPreenchidas = (linhas: LinhaFicha[]) => linhas.filter((l) => Object.values(l.pecas).some((n) => n > 0));

/** Confere as linhas antes de enviar; devolve a mensagem de erro ou null. */
export function validarFicha(linhas: LinhaFicha[], comLocal = false) {
  const cheias = linhasPreenchidas(linhas);
  if (!cheias.length) return "Preencha as peças de pelo menos um comprimento";
  const semLocal = comLocal ? linhas.indexOf(cheias.find((l) => !l.local) ?? ({} as LinhaFicha)) : -1;
  if (semLocal >= 0) return `Escolha onde está a madeira (Madeira em) na linha ${semLocal + 1}`;
  const n = linhas.indexOf(cheias.find((l) => !l.espessura) ?? ({} as LinhaFicha));
  if (n >= 0) return `Escolha a espessura da linha ${n + 1}`;
  const m = linhas.indexOf(cheias.find((l) => !l.larguras.length) ?? ({} as LinhaFicha));
  if (m >= 0) return `Marque a largura (ou Mista) da linha ${m + 1}`;
  return null;
}

const OPCOES_LARGURA = [MISTA, ...LARGURAS.map(String)];
const rotuloOpcao = (o: string) => (o === MISTA ? "Mista" : o);
const comp = (mm: number) => (mm / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

/**
 * Ficha de madeira no formato do papel "Madeira carregada no mês": cada linha tem a
 * espessura, as larguras marcadas (ou Mista) e as peças em cada comprimento.
 */
export function FichaMadeira({
  linhas,
  onChange,
  gradesUmidas = false,
  locais,
}: {
  linhas: LinhaFicha[];
  onChange: (l: LinhaFicha[]) => void;
  /** Opções da coluna "Madeira em" (inventário). Sem ela, a coluna não aparece. */
  locais?: { valor: string; rotulo: string }[];
  /** Mostra a coluna "Grades úmidas" (ficha da estufa). */
  gradesUmidas?: boolean;
}) {
  const mudar = (i: number, l: Partial<LinhaFicha>) => onChange(linhas.map((x, j) => (j === i ? { ...x, ...l } : x)));
  const setPecas = (i: number, mm: number, v: string) => {
    const n = Number(v.replace(/\D/g, "").slice(0, 6) || 0);
    const pecas = { ...linhas[i].pecas };
    if (n > 0) pecas[mm] = n;
    else delete pecas[mm];
    mudar(i, { pecas });
  };
  const alternarLargura = (i: number, o: string) => {
    const atual = linhas[i].larguras;
    const tem = atual.includes(o);
    // Mista exclui as larguras avulsas (e vice-versa), como na ficha em papel
    const nova = tem ? atual.filter((x) => x !== o) : o === MISTA ? [MISTA] : [...atual.filter((x) => x !== MISTA), o];
    mudar(i, { larguras: nova });
  };
  const remover = (i: number) => {
    // Linha com peças contadas pede confirmação (não há desfazer)
    const n = Object.values(linhas[i].pecas).reduce((t, x) => t + x, 0);
    if (n > 0 && !window.confirm(`Remover a linha ${i + 1} (${n} peça(s))?`)) return;
    onChange(linhas.length > 1 ? linhas.filter((_, j) => j !== i) : [linhaVazia()]);
  };
  const repetir = (i: number) => onChange([...linhas.slice(0, i + 1), linhaVazia(linhas[i]), ...linhas.slice(i + 1)]);
  const adicionar = () => onChange([...linhas, linhaVazia({ espessura: linhas[linhas.length - 1]?.espessura ?? null, local: linhas[linhas.length - 1]?.local ?? null })]);

  const totalLinha = (l: LinhaFicha) => Object.values(l.pecas).reduce((t, n) => t + n, 0);
  const m3Linha = (l: LinhaFicha) => itensDaLinha(l).reduce((t, i) => t + i.m3, 0);
  const totalComp = (mm: number) => linhas.reduce((t, l) => t + (l.pecas[mm] ?? 0), 0);
  const totalPecas = linhas.reduce((t, l) => t + totalLinha(l), 0);
  const totalM3 = linhas.reduce((t, l) => t + m3Linha(l), 0);
  const totalGrades = linhas.reduce((t, l) => t + (l.gradesUmidas ?? 0), 0);

  /** Enter passa para o próximo comprimento; no fim da linha, para a próxima linha. */
  const aoTeclar = (e: React.KeyboardEvent<HTMLInputElement>, prefixo: string, i: number, ci: number) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const [li, cj] = ci + 1 < COMPRIMENTOS.length ? [i, ci + 1] : [i + 1, 0];
    (document.getElementById(`${prefixo}-${li}-${cj}`) as HTMLInputElement | null)?.focus();
  };

  const larguras = (l: LinhaFicha, i: number) => (
    <div className="flex gap-1" role="group" aria-label={`Larguras da linha ${i + 1}`}>
      {OPCOES_LARGURA.map((o) => {
        const on = l.larguras.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => alternarLargura(i, o)}
            className={`h-9 min-w-9 rounded border px-1.5 text-xs font-semibold tabular-nums transition ${on ? "border-marca-700 bg-marca-700 text-white" : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"}`}
          >
            {rotuloOpcao(o)}
          </button>
        );
      })}
    </div>
  );

  const espessura = (l: LinhaFicha, i: number, id: string) => (
    <select id={id} aria-label={`Espessura da linha ${i + 1}`} value={l.espessura ?? ""} onChange={(e) => mudar(i, { espessura: e.target.value ? Number(e.target.value) : null })} className="campo h-9 min-w-[6.5rem] py-0 pl-2.5 pr-7 text-sm">
      <option value="">mm…</option>
      {ESPESSURAS.map((e) => (
        <option key={e} value={e}>
          {e} mm
        </option>
      ))}
    </select>
  );

  const local = (l: LinhaFicha, i: number, id: string) => (
    <select id={id} aria-label={`Madeira em (linha ${i + 1})`} value={l.local ?? ""} onChange={(e) => mudar(i, { local: e.target.value || null })} className="campo h-9 min-w-[8rem] py-0 pl-2.5 pr-7 text-sm">
      <option value="">Onde…</option>
      {locais?.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </select>
  );

  const celula = (l: LinhaFicha, i: number, ci: number, mm: number, prefixo: string, classe = "") => (
    <input
      id={`${prefixo}-${i}-${ci}`}
      inputMode="numeric"
      autoComplete="off"
      aria-label={`Peças de ${comp(mm)} m na linha ${i + 1}`}
      value={l.pecas[mm] ? String(l.pecas[mm]) : ""}
      onChange={(e) => setPecas(i, mm, e.target.value)}
      onKeyDown={(e) => aoTeclar(e, prefixo, i, ci)}
      onFocus={(e) => e.target.select()}
      className={`h-9 w-full rounded border px-1 text-center text-sm font-semibold tabular-nums outline-none focus:border-marca-600 focus:ring-1 focus:ring-marca-600 ${l.pecas[mm] ? "border-marca-400 bg-marca-50" : "border-stone-200 bg-white"} ${classe}`}
    />
  );

  return (
    <div className="min-w-0">
      {/* Computador: a ficha como no papel */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-sm">
          <thead className="text-xs text-stone-500">
            <tr className="border-b border-stone-200">
              <th rowSpan={2} className="w-8 px-1 py-2 text-left font-semibold">
                #
              </th>
              {locais && (
                <th rowSpan={2} className="w-[9rem] px-1 py-2 text-left font-semibold">
                  Madeira em
                </th>
              )}
              <th rowSpan={2} className="w-[7.5rem] px-1 py-2 text-left font-semibold">
                Espessura
              </th>
              <th rowSpan={2} className="px-1 py-2 text-left font-semibold">
                Larguras
              </th>
              <th colSpan={COMPRIMENTOS.length} className="border-x border-stone-200 px-1 pt-2 text-center font-semibold uppercase tracking-wide">
                Comprimentos (peças)
              </th>
              {gradesUmidas && (
                <th rowSpan={2} className="w-20 px-1 py-2 text-center font-semibold">
                  Grades úmidas
                </th>
              )}
              <th rowSpan={2} className="w-16 px-1 py-2 text-right font-semibold">
                Peças
              </th>
              <th rowSpan={2} className="w-20 px-1 py-2 text-right font-semibold">
                m³
              </th>
              <th rowSpan={2} className="w-16" />
            </tr>
            <tr className="border-b border-stone-200">
              {COMPRIMENTOS.map((c, ci) => (
                <th key={c.mm} className={`w-16 px-1 pb-2 pt-1 text-center font-semibold ${ci === 0 ? "border-l border-stone-200" : ""} ${ci === COMPRIMENTOS.length - 1 ? "border-r border-stone-200" : ""}`}>
                  <div className="text-sm text-stone-800 tabular-nums">{comp(c.mm)}</div>
                  <span className={`inline-block rounded px-1 text-[10px] ring-1 ring-inset ${CLASSE_MADEIRA[c.classe].cor}`}>{CLASSE_MADEIRA[c.classe].label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-b border-stone-100 align-middle">
                <td className="px-1 py-1.5 text-xs text-stone-400 tabular-nums">{i + 1}</td>
                {locais && <td className="px-1 py-1.5">{local(l, i, `f-loc-${i}`)}</td>}
                <td className="px-1 py-1.5">
                  {espessura(l, i, `f-esp-${i}`)}
                </td>
                <td className="px-1 py-1.5">
                  {larguras(l, i)}
                </td>
                {COMPRIMENTOS.map((c, ci) => (
                  <td key={c.mm} className={`px-0.5 py-1.5 ${ci === 0 ? "border-l border-stone-100 pl-1.5" : ""} ${ci === COMPRIMENTOS.length - 1 ? "border-r border-stone-100 pr-1.5" : ""}`}>
                    {celula(l, i, ci, c.mm, "f")}
                  </td>
                ))}
                {gradesUmidas && (
                  <td className="px-1 py-1.5">
                    <input
                      inputMode="numeric"
                      aria-label={`Grades úmidas da linha ${i + 1}`}
                      value={l.gradesUmidas ? String(l.gradesUmidas) : ""}
                      onChange={(e) => mudar(i, { gradesUmidas: Number(e.target.value.replace(/\D/g, "")) || null })}
                      className="h-9 w-full rounded border border-stone-200 px-1 text-center text-sm tabular-nums"
                    />
                  </td>
                )}
                <td className="px-1 py-1.5 text-right font-semibold tabular-nums">{totalLinha(l) || "—"}</td>
                <td className="px-1 py-1.5 text-right tabular-nums text-stone-600">{l.espessura && totalLinha(l) ? fmtNum(m3Linha(l), 3) : "—"}</td>
                <td className="px-1 py-1.5">
                  <div className="flex justify-end gap-0.5">
                    <button type="button" onClick={() => repetir(i)} title="Repetir espessura e larguras na linha de baixo" aria-label={`Repetir linha ${i + 1}`} className="grid h-8 w-8 place-items-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => remover(i)} aria-label={`Remover linha ${i + 1}`} className="grid h-8 w-8 place-items-center rounded text-stone-400 hover:bg-rose-50 hover:text-rose-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-xs font-semibold text-stone-600">
              <td colSpan={locais ? 4 : 3} className="px-1 py-2">
                Total
              </td>
              {COMPRIMENTOS.map((c) => (
                <td key={c.mm} className="px-1 py-2 text-center tabular-nums">
                  {totalComp(c.mm) || "—"}
                </td>
              ))}
              {gradesUmidas && <td className="px-1 py-2 text-center tabular-nums">{totalGrades || "—"}</td>}
              <td className="px-1 py-2 text-right text-sm tabular-nums text-stone-900">{totalPecas || "—"}</td>
              <td className="px-1 py-2 text-right text-sm tabular-nums text-stone-900">{totalM3 ? fmtNum(totalM3, 3) : "—"}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Celular: uma linha da ficha por cartão */}
      <ol className="space-y-3 lg:hidden">
        {linhas.map((l, i) => (
          <li key={i} className="rounded-lg border border-stone-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Linha {i + 1}</span>
              <span className="flex gap-3">
                <button type="button" onClick={() => repetir(i)} aria-label={`Repetir linha ${i + 1}`} className="grid h-11 w-11 place-items-center rounded text-stone-500 hover:bg-stone-100">
                  <Copy className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => remover(i)} aria-label={`Remover linha ${i + 1}`} className="grid h-11 w-11 place-items-center rounded text-stone-500 hover:bg-rose-50 hover:text-rose-700">
                  <Trash2 className="h-5 w-5" />
                </button>
              </span>
            </div>
            <div className="grid gap-2">
              {locais && local(l, i, `fm-loc-${i}`)}
              {espessura(l, i, `fm-esp-${i}`)}
              <div className="overflow-x-auto">
                {larguras(l, i)}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {COMPRIMENTOS.map((c, ci) => (
                <label key={c.mm} className="mb-0 text-center">
                  <span className="mb-1 block text-xs font-semibold text-stone-700 tabular-nums">
                    {comp(c.mm)} <span className={`ml-0.5 rounded px-1 text-[10px] ring-1 ring-inset ${CLASSE_MADEIRA[c.classe].cor}`}>{CLASSE_MADEIRA[c.classe].label}</span>
                  </span>
                  {celula(l, i, ci, c.mm, "fm", "h-11 text-base")}
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-end justify-between gap-3 text-sm">
              {gradesUmidas ? (
                <label className="mb-0 w-28">
                  <span className="mb-1 block text-xs font-semibold text-stone-700">Grades úmidas</span>
                  <input
                    inputMode="numeric"
                    value={l.gradesUmidas ? String(l.gradesUmidas) : ""}
                    onChange={(e) => mudar(i, { gradesUmidas: Number(e.target.value.replace(/\D/g, "")) || null })}
                    className="h-10 w-full rounded border border-stone-200 px-2 text-center tabular-nums"
                  />
                </label>
              ) : (
                <span />
              )}
              <span className="text-right tabular-nums">
                <b>{totalLinha(l)}</b> peças{l.espessura && totalLinha(l) ? ` · ${fmtM3(m3Linha(l), 3)}` : ""}
              </span>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={adicionar} className="btn-secundario">
          <Plus className="h-4 w-4" /> Adicionar linha
        </button>
        <span className="text-sm tabular-nums text-stone-600">
          {fmtNum(totalPecas)} peça(s){totalM3 ? ` · ${fmtM3(totalM3, 3)}` : ""}
          {gradesUmidas && totalGrades ? ` · ${totalGrades} grade(s) úmida(s)` : ""}
        </span>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Marque as larguras da linha (várias juntas ou Mista). O m³ usa a média das larguras marcadas; Mista usa a média de todas. Enter passa para o próximo comprimento.
      </p>
    </div>
  );
}
