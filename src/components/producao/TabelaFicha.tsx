import { BotaoPdfFicha } from "@/components/producao/BotaoPdfFicha";
import { CLASSE_MADEIRA, COMPRIMENTOS, fmtNum } from "@/lib/producao";

export type LinhaTabelaFicha = {
  chave: string;
  /** Células antes da espessura (ex.: data e ciclo na ficha mensal da estufa). */
  antes?: React.ReactNode[];
  /** As mesmas células de `antes`, em texto (para o PDF). */
  antesTexto?: string[];
  espessura: number;
  larguras: string;
  pecas: Record<number, number>;
  gradesUmidas?: number | null;
  m3: number;
};

const comp = (mm: number) =>
  (mm / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

/** A ficha de madeira (só leitura), no mesmo desenho do papel usado na fábrica. */
export function TabelaFicha({
  linhas,
  colunasAntes = [],
  gradesUmidas = false,
  vazio = "Nenhuma madeira lançada.",
  titulo,
  pdf,
}: {
  linhas: LinhaTabelaFicha[];
  colunasAntes?: string[];
  gradesUmidas?: boolean;
  vazio?: string;
  /** Título do cartão (fica ao lado do botão PDF). */
  titulo?: string;
  /** Com isto, aparece o botão de baixar a ficha em PDF. */
  pdf?: { titulo: string; subtitulo?: string; arquivo: string };
}) {
  const barra =
    titulo || pdf ? (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
        {titulo ? <h2 className="font-semibold">{titulo}</h2> : <span />}
        {pdf && linhas.length > 0 && (
          <BotaoPdfFicha
            className="btn-secundario nao-imprimir px-3 py-1.5"
            dados={{
              ...pdf,
              colunasAntes,
              gradesUmidas,
              linhas: linhas.map((l) => ({
                antes:
                  l.antesTexto ??
                  (l.antes ?? []).map((a) =>
                    typeof a === "string" || typeof a === "number"
                      ? String(a)
                      : "",
                  ),
                espessura: l.espessura,
                larguras: l.larguras,
                pecas: l.pecas,
                gradesUmidas: l.gradesUmidas,
                m3: l.m3,
              })),
            }}
          />
        )}
      </div>
    ) : null;
  if (!linhas.length)
    return (
      <>
        {barra}
        <p className="px-4 py-6 text-center text-sm text-stone-500">{vazio}</p>
      </>
    );
  const total = (mm: number) =>
    linhas.reduce((t, l) => t + (l.pecas[mm] ?? 0), 0);
  const pecasLinha = (l: LinhaTabelaFicha) =>
    Object.values(l.pecas).reduce((t, n) => t + n, 0);
  const th = "px-2 py-2 font-semibold";
  return (
    <>
      {barra}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="text-xs text-stone-500">
            <tr className="border-b border-stone-200">
              {colunasAntes.map((c) => (
                <th key={c} rowSpan={2} className={`${th} text-left`}>
                  {c}
                </th>
              ))}
              <th rowSpan={2} className={`${th} text-left`}>
                Espessura
              </th>
              <th rowSpan={2} className={`${th} text-left`}>
                Larguras
              </th>
              <th
                colSpan={COMPRIMENTOS.length}
                className={`${th} border-x border-stone-200 pb-0 text-center uppercase tracking-wide`}
              >
                Comprimentos (peças)
              </th>
              {gradesUmidas && (
                <th rowSpan={2} className={`${th} text-right`}>
                  Grades úmidas
                </th>
              )}
              <th rowSpan={2} className={`${th} text-right`}>
                Peças
              </th>
              <th rowSpan={2} className={`${th} text-right`}>
                m³
              </th>
            </tr>
            <tr className="border-b border-stone-200">
              {COMPRIMENTOS.map((c, i) => (
                <th
                  key={c.mm}
                  className={`px-2 pb-2 pt-1 text-center font-semibold ${i === 0 ? "border-l border-stone-200" : ""} ${i === COMPRIMENTOS.length - 1 ? "border-r border-stone-200" : ""}`}
                >
                  <div className="text-sm tabular-nums text-stone-800">
                    {comp(c.mm)}
                  </div>
                  <span
                    className={`inline-block rounded px-1 text-[10px] ring-1 ring-inset ${CLASSE_MADEIRA[c.classe].cor}`}
                  >
                    {CLASSE_MADEIRA[c.classe].label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {linhas.map((l) => (
              <tr key={l.chave}>
                {(l.antes ?? []).map((c, i) => (
                  <td key={i} className="whitespace-nowrap px-2 py-2">
                    {c}
                  </td>
                ))}
                <td className="whitespace-nowrap px-2 py-2 font-medium tabular-nums">
                  {l.espessura} mm
                </td>
                <td className="whitespace-nowrap px-2 py-2 tabular-nums">
                  {l.larguras}
                </td>
                {COMPRIMENTOS.map((c, i) => (
                  <td
                    key={c.mm}
                    className={`px-2 py-2 text-center tabular-nums ${i === 0 ? "border-l border-stone-100" : ""} ${i === COMPRIMENTOS.length - 1 ? "border-r border-stone-100" : ""} ${l.pecas[c.mm] ? "font-semibold" : "text-stone-300"}`}
                  >
                    {l.pecas[c.mm] ? fmtNum(l.pecas[c.mm]) : "·"}
                  </td>
                ))}
                {gradesUmidas && (
                  <td className="px-2 py-2 text-right tabular-nums">
                    {l.gradesUmidas || "—"}
                  </td>
                )}
                <td className="px-2 py-2 text-right font-semibold tabular-nums">
                  {fmtNum(pecasLinha(l))}
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-stone-600">
                  {fmtNum(l.m3, 3)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-stone-200 text-xs font-semibold text-stone-600">
            <tr>
              <td colSpan={colunasAntes.length + 2} className="px-2 py-2">
                Total
              </td>
              {COMPRIMENTOS.map((c) => (
                <td key={c.mm} className="px-2 py-2 text-center tabular-nums">
                  {total(c.mm) ? fmtNum(total(c.mm)) : "—"}
                </td>
              ))}
              {gradesUmidas && (
                <td className="px-2 py-2 text-right tabular-nums">
                  {linhas.reduce((t, l) => t + (l.gradesUmidas ?? 0), 0) || "—"}
                </td>
              )}
              <td className="px-2 py-2 text-right text-sm tabular-nums text-stone-900">
                {fmtNum(linhas.reduce((t, l) => t + pecasLinha(l), 0))}
              </td>
              <td className="px-2 py-2 text-right text-sm tabular-nums text-stone-900">
                {fmtNum(
                  linhas.reduce((t, l) => t + l.m3, 0),
                  3,
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
