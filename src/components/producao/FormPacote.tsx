"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Printer } from "lucide-react";
import { criarPacotes } from "@/app/actions/rastreio";
import { mensagemFalha } from "@/lib/falha-acao";
import { CLASSE_MADEIRA, LARGURAS, classeDoComprimento, fmtComprimento, fmtM3, fmtNum, m3Pecas } from "@/lib/producao";
import { codigoPacote } from "@/lib/rastreio";

type MaterialEstufa = { id: string; espessura: number; largura: string; comprimentoMm: number; grades: number; pecas: number | null; m3: number };
type MaterialVerde = { id: string; lote: string; pedidoId: string; espessura: number; largura: number; larguras: string | null; comprimentoMm: number; pecas: number };
type Ciclo = { id: string; rotulo: string; pacotesFormados: number; pedidoIds: string[]; materiais: MaterialEstufa[] };
type Dia = { id: string; rotulo: string; materiais: MaterialVerde[] };
type Pedido = { id: string; numero: string; cliente: string };

/** "100/85" → [100, 85]; "Mista" → todas as larguras da ficha. */
const larguras = (s: string) => {
  const ns = [...new Set((s.match(/\d+/g) ?? []).map(Number).filter((n) => n >= 30 && n <= 400))];
  return /mista/i.test(s) || !ns.length ? [...new Set([...LARGURAS, ...ns])] : ns;
};

/**
 * Formar pacote: escolhe a estufa (ou o dia de serraria, para pacote verde) e
 * toca na madeira que forma o pacote — bitola, peças e classe vêm preenchidas.
 */
export function FormPacote({
  ciclos,
  dias,
  pedidos,
  inicial,
}: {
  ciclos: Ciclo[];
  dias: Dia[];
  pedidos: Pedido[];
  inicial: { origem: "boletim" | "ciclo"; boletimId?: string; cicloId?: string };
}) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [criados, setCriados] = useState<number[] | null>(null);
  const [origem, setOrigem] = useState(inicial.origem);
  const [cicloId, setCicloId] = useState(inicial.cicloId ?? ciclos[0]?.id ?? "");
  const [boletimId, setBoletimId] = useState(inicial.boletimId ?? dias[0]?.id ?? "");
  const [materialId, setMaterialId] = useState("");
  const [f, setF] = useState({ espessura: 0, largura: 0, comprimento: 0, pecas: "", quantidade: "1", pedidoId: "", observacoes: "" });
  const [opcoesLargura, setOpcoesLargura] = useState<number[]>([]);

  const ciclo = ciclos.find((c) => c.id === cicloId);
  const dia = dias.find((d) => d.id === boletimId);
  const pedidosSugeridos = origem === "ciclo" ? (ciclo?.pedidoIds ?? []) : [];

  function escolherEstufa(m: MaterialEstufa) {
    const ls = larguras(m.largura);
    const largura = ls.length === 1 ? ls[0] : 0;
    // Ficha nova: peças contadas. Antiga: uma grade vira um pacote, peças estimadas pelo volume da grade
    const pecas = m.pecas ?? (largura ? Math.round(m.m3 / Math.max(1, m.grades) / ((m.espessura * largura * m.comprimentoMm) / 1e9)) : 0);
    setMaterialId(m.id);
    setOpcoesLargura(ls);
    setF((x) => ({
      ...x,
      espessura: m.espessura,
      largura,
      comprimento: m.comprimentoMm,
      pecas: pecas ? String(pecas) : "",
      quantidade: m.pecas ? "1" : String(Math.max(1, m.grades)),
      pedidoId: x.pedidoId || (ciclo?.pedidoIds.length === 1 ? ciclo.pedidoIds[0] : ""),
    }));
  }

  function escolherVerde(m: MaterialVerde) {
    setMaterialId(m.id);
    const ls = m.larguras ? larguras(m.larguras) : [m.largura];
    setOpcoesLargura(ls);
    setF((x) => ({ ...x, espessura: m.espessura, largura: ls.length === 1 ? ls[0] : 0, comprimento: m.comprimentoMm, pecas: String(m.pecas), quantidade: "1", pedidoId: m.pedidoId }));
  }

  const pecas = Number(f.pecas) || 0;
  const qtd = Math.max(1, Number(f.quantidade) || 1);
  const m3 = f.espessura && f.largura && f.comprimento && pecas ? m3Pecas(f.espessura, f.largura, f.comprimento, pecas) : 0;
  const classe = f.comprimento ? CLASSE_MADEIRA[classeDoComprimento(f.comprimento)].label : "";

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!materialId) return setErro("Toque na madeira que vai formar o pacote");
    if (!f.largura) return setErro("Escolha a largura");
    iniciar(async () => {
      let r: Awaited<ReturnType<typeof criarPacotes>>;
      try {
        r = await criarPacotes({
          origem,
          cicloId: origem === "ciclo" ? cicloId : null,
          boletimId: origem === "boletim" ? boletimId : null,
          espessura: f.espessura,
          largura: f.largura,
          comprimento: f.comprimento,
          pecas: f.pecas,
          quantidade: f.quantidade,
          classe,
          pedidoId: f.pedidoId,
          observacoes: f.observacoes,
        });
      } catch (e) {
        return setErro(mensagemFalha(e));
      }
      if (r.erro) return setErro(r.erro);
      setCriados(r.numeros ?? []);
      setMaterialId("");
      setF((x) => ({ ...x, pecas: "", quantidade: "1", observacoes: "" }));
    });
  }

  const cartao = (on: boolean) => `w-full rounded-md border px-3 py-2.5 text-left transition ${on ? "border-marca-600 bg-marca-50 ring-1 ring-marca-600" : "border-stone-200 bg-white hover:border-stone-300"}`;

  return (
    <div className="space-y-5">
      {criados && criados.length > 0 && (
        <div role="status" className="cartao border-emerald-200 bg-emerald-50">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-emerald-900">
                {criados.length === 1 ? `Pacote ${codigoPacote(criados[0])} formado` : `${criados.length} pacotes formados: ${codigoPacote(criados[0])} a ${codigoPacote(criados[criados.length - 1])}`}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/producao/pacotes/etiquetas?n=${criados.join(",")}`} className="btn-primario">
                  <Printer className="h-4 w-4" /> Imprimir etiqueta{criados.length > 1 ? "s" : ""}
                </Link>
                <Link href={`/producao/pacotes/${criados[0]}`} className="btn-secundario">
                  Ver pacote
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={enviar}>
        <fieldset disabled={pendente} className="min-w-0 space-y-5">
          <section className="cartao">
            <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-md border border-stone-300" role="radiogroup" aria-label="Origem">
              {(
                [
                  ["ciclo", "Da estufa (seco)"],
                  ["boletim", "Da serraria (verde)"],
                ] as const
              ).map(([v, t], i) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={origem === v}
                  onClick={() => (setOrigem(v), setMaterialId(""))}
                  className={`py-2.5 text-sm font-semibold ${i ? "border-l border-stone-300" : ""} ${origem === v ? "bg-marca-700 text-white" : "bg-white text-stone-700 hover:bg-stone-50"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {origem === "ciclo" ? (
              <>
                <label htmlFor="pc-ciclo">Estufa *</label>
                <select id="pc-ciclo" value={cicloId} onChange={(e) => (setCicloId(e.target.value), setMaterialId(""))} className="campo">
                  {!ciclos.length && <option value="">Nenhum ciclo concluído nos últimos 90 dias</option>}
                  {ciclos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.rotulo}
                      {c.pacotesFormados ? ` · ${c.pacotesFormados} pacote(s) já formados` : ""}
                    </option>
                  ))}
                </select>
                <h3 className="mb-2 mt-4 text-sm font-semibold text-stone-700">Madeira que estava na estufa — toque para formar o pacote</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {(ciclo?.materiais ?? []).map((m) => (
                    <li key={m.id}>
                      <button type="button" onClick={() => escolherEstufa(m)} className={cartao(materialId === m.id)} aria-pressed={materialId === m.id}>
                        <div className="font-semibold tabular-nums">
                          {m.espessura} × {m.largura} × {fmtComprimento(m.comprimentoMm)}
                        </div>
                        <div className="text-sm text-stone-500">
                          {m.pecas ? `${fmtNum(m.pecas)} peças` : `${m.grades} grade(s)`} · {fmtM3(m.m3, 2)}
                        </div>
                      </button>
                    </li>
                  ))}
                  {ciclo && !ciclo.materiais.length && <li className="text-sm text-stone-500">Esse ciclo não tem madeira lançada.</li>}
                </ul>
              </>
            ) : (
              <>
                <label htmlFor="pc-dia">Dia de serraria *</label>
                <select id="pc-dia" value={boletimId} onChange={(e) => (setBoletimId(e.target.value), setMaterialId(""))} className="campo">
                  {!dias.length && <option value="">Nenhum lote lançado nos últimos 30 dias</option>}
                  {dias.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.rotulo}
                    </option>
                  ))}
                </select>
                <h3 className="mb-2 mt-4 text-sm font-semibold text-stone-700">Peças lançadas no dia — toque para formar o pacote</h3>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(dia?.materiais ?? []).map((m) => (
                    <li key={m.id}>
                      <button type="button" onClick={() => escolherVerde(m)} className={cartao(materialId === m.id)} aria-pressed={materialId === m.id}>
                        <div className="font-semibold tabular-nums">
                          {m.espessura} × {m.larguras ?? m.largura} × {fmtComprimento(m.comprimentoMm)}
                        </div>
                        <div className="text-sm text-stone-500">
                          {fmtNum(m.pecas)} peças · {m.lote}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {materialId && (
            <section className="cartao">
              <h2 className="mb-3 font-semibold">Pacote</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <span className="block text-sm font-medium text-stone-700">Bitola</span>
                  <span className="mt-1.5 block rounded-md bg-stone-100 px-3 py-2.5 font-semibold tabular-nums">
                    {f.espessura} × {f.largura || "?"} × {f.comprimento}
                  </span>
                </div>
                {opcoesLargura.length > 1 && (
                  <div>
                    <label htmlFor="pc-l">Largura *</label>
                    <select id="pc-l" value={f.largura || ""} onChange={(e) => setF((x) => ({ ...x, largura: Number(e.target.value) }))} className="campo">
                      <option value="">Escolha…</option>
                      {opcoesLargura.map((l) => (
                        <option key={l} value={l}>
                          {l} mm
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <span className="block text-sm font-medium text-stone-700">Classe</span>
                  <span className="mt-1.5 block rounded-md bg-stone-100 px-3 py-2.5 font-semibold">{classe || "—"}</span>
                </div>
                <div>
                  <label htmlFor="pc-p">Peças por pacote *</label>
                  <input id="pc-p" inputMode="numeric" required value={f.pecas} onChange={(e) => setF((x) => ({ ...x, pecas: e.target.value.replace(/\D/g, "") }))} className="campo" />
                </div>
                <div>
                  <label htmlFor="pc-q">Quantos pacotes</label>
                  <input id="pc-q" inputMode="numeric" value={f.quantidade} onChange={(e) => setF((x) => ({ ...x, quantidade: e.target.value.replace(/\D/g, "") }))} className="campo" />
                </div>
                <div className="col-span-2">
                  <label htmlFor="pc-ped">Pedido</label>
                  <select id="pc-ped" value={f.pedidoId} onChange={(e) => setF((x) => ({ ...x, pedidoId: e.target.value }))} className="campo">
                    <option value="">— Sem pedido —</option>
                    {[...pedidos].sort((a, b) => Number(pedidosSugeridos.includes(b.id)) - Number(pedidosSugeridos.includes(a.id))).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.numero} · {p.cliente}
                        {pedidosSugeridos.includes(p.id) ? " (madeira desta estufa)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label htmlFor="pc-obs">Observações</label>
                  <input id="pc-obs" value={f.observacoes} onChange={(e) => setF((x) => ({ ...x, observacoes: e.target.value }))} className="campo" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2">
                <span className="text-sm text-stone-600">Volume {qtd > 1 ? `de cada pacote · total ${fmtM3(m3 * qtd, 3)}` : "do pacote"}</span>
                <span className="text-lg font-semibold tabular-nums">{fmtM3(m3, 4)}</span>
              </div>
            </section>
          )}

          {erro && (
            <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
              {erro}
            </p>
          )}
          <div className="flex justify-end">
            <button type="submit" className="btn-primario" disabled={!materialId}>
              {pendente ? "Salvando…" : qtd > 1 ? `Formar ${qtd} pacotes` : "Formar pacote"}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
