"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, CloudOff, Printer, Tag } from "lucide-react";
import { lancarLote, type Resultado } from "@/app/actions/producao";
import { GradeBitolas, itensDaGrade, type ValoresGrade } from "@/components/producao/GradeBitolas";
import { enviarOuGuardar } from "@/lib/fila-offline";
import { ESPESSURAS, fmtNum, hojeSP } from "@/lib/producao";
import { codigoLote } from "@/lib/rastreio";

type Pedido = { id: string; numero: string; cliente: string; destino: string | null };

/** Seletor de espessura em botões (23, 25, 32, 38). */
export function SeletorEspessura({ valor, onChange }: { valor: number | null; onChange: (e: number) => void }) {
  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-md border border-stone-300" role="radiogroup" aria-label="Espessura">
      {ESPESSURAS.map((e, i) => (
        <button
          key={e}
          type="button"
          role="radio"
          aria-checked={valor === e}
          onClick={() => onChange(e)}
          className={`py-2.5 text-sm font-semibold tabular-nums transition ${i > 0 ? "border-l border-stone-300" : ""} ${valor === e ? "bg-marca-700 text-white" : "bg-white text-stone-700 hover:bg-stone-50"}`}
        >
          {e} mm
        </button>
      ))}
    </div>
  );
}

export function ApontamentoSerraria({
  pedidos,
  dataInicial,
  meta,
  horas,
}: {
  pedidos: Pedido[];
  dataInicial: string;
  meta: number;
  horas: number;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [data, setData] = useState(dataInicial);
  const [pedidoId, setPedidoId] = useState(pedidos.length === 1 ? pedidos[0].id : "");
  const [espessura, setEspessura] = useState<number | null>(null);
  const [valores, setValores] = useState<ValoresGrade>({});
  const [erro, setErro] = useState<string | null>(null);
  const [lancados, setLancados] = useState<{ numero?: number; guardado?: boolean; resumo: string }[]>([]);
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const itens = itensDaGrade(valores);

  function lancar() {
    setErro(null);
    if (!pedidoId) return setErro("Escolha o pedido");
    if (!espessura) return setErro("Escolha a espessura");
    if (!itens.length) return setErro("Preencha a quantidade de peças em pelo menos uma medida");
    const resumo = `${espessura} mm · ${fmtNum(itens.reduce((t, i) => t + i.pecas, 0))} peças · pedido ${pedido?.numero}`;
    iniciar(async () => {
      try {
        const r = await enviarOuGuardar("lote", `Serraria: ${resumo}`, { data, pedidoId, espessura, itens }, (d) => lancarLote(d as Parameters<typeof lancarLote>[0]));
        if ("guardado" in r) {
          setLancados((l) => [{ guardado: true, resumo }, ...l]);
        } else {
          const res = r as Resultado;
          if (res.erro) return setErro(res.erro);
          setLancados((l) => [{ numero: res.numero, resumo }, ...l]);
          router.refresh();
        }
        setValores({});
      } catch {
        setErro("Não foi possível lançar. Tente de novo.");
      }
    });
  }

  return (
    <div className="space-y-5">
      {lancados.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {lancados.map((l, i) => (
            <li
              key={i}
              role="status"
              className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 ${l.guardado ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
            >
              {l.guardado ? <CloudOff className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-semibold">{l.guardado ? "Guardado no aparelho (sem internet)" : `Lote ${codigoLote(l.numero!)} lançado`}</div>
                <div className="opacity-80">
                  {l.resumo}
                  {l.guardado ? " · será enviado e ganhará a etiqueta quando a internet voltar" : ""}
                </div>
              </div>
              {l.numero && (
                <Link href={`/producao/lotes/etiquetas?n=${l.numero}`} className="btn-primario px-3 py-2">
                  <Printer className="h-4 w-4" /> Imprimir etiqueta
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      <section className="cartao grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="a-data">Data</label>
          <input id="a-data" type="date" max={hojeSP()} value={data} onChange={(e) => setData(e.target.value)} className="campo" />
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <label htmlFor="a-pedido">Pedido *</label>
          <select id="a-pedido" value={pedidoId} onChange={(e) => setPedidoId(e.target.value)} className="campo">
            <option value="">{pedidos.length ? "Escolha o pedido…" : "Nenhum pedido aberto — cadastre em Cadastros › Pedidos"}</option>
            {pedidos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.numero} · {p.cliente}
                {p.destino ? ` · ${p.destino}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="block text-sm font-medium text-stone-700">Meta</span>
            <span className="mt-1.5 block rounded-md bg-stone-100 px-3 py-2.5 font-semibold tabular-nums text-stone-600">{fmtNum(meta, 1)} m³</span>
          </div>
          <div>
            <span className="block text-sm font-medium text-stone-700">Horas</span>
            <span className="mt-1.5 block rounded-md bg-stone-100 px-3 py-2.5 font-semibold tabular-nums text-stone-600">{fmtNum(horas, 1)} h</span>
          </div>
        </div>
      </section>

      <section className="cartao">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="w-full max-w-sm">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Espessura *</span>
            <SeletorEspessura valor={espessura} onChange={setEspessura} />
          </div>
          <p className="text-xs text-stone-500">Digite as peças em cada medida. Enter passa para a próxima.</p>
        </div>
        <GradeBitolas espessura={espessura} valores={valores} onChange={setValores} />
      </section>

      {erro && (
        <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
          {erro}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {itens.length > 0 && (
          <button type="button" onClick={() => setValores({})} className="btn-secundario">
            Limpar grade
          </button>
        )}
        <button type="button" onClick={lancar} disabled={pendente} className="btn-primario">
          <Tag className="h-4 w-4" /> {pendente ? "Lançando…" : "Lançar e gerar etiqueta"}
        </button>
      </div>
    </div>
  );
}
