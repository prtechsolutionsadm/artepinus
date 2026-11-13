"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, CloudOff, Printer, Tag } from "lucide-react";
import { lancarLote, type Resultado } from "@/app/actions/producao";
import { FichaMadeira, linhaVazia, linhasPreenchidas, validarFicha } from "@/components/producao/FichaMadeira";
import { diaValido } from "@/lib/constantes";
import { enviarOuGuardar } from "@/lib/fila-offline";
import { fmtNum, hojeSP, rotuloLarguras, type LinhaFicha } from "@/lib/producao";
import { codigoLote } from "@/lib/rastreio";

type Pedido = { id: string; numero: string; cliente: string; destino: string | null; falta?: number | null };

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
  // "Hoje" só no aparelho: a tela pode ter sido guardada offline num dia anterior.
  // Um ?data= escolhido de propósito (ex.: boletim de um dia sem apontamento) continua valendo,
  // também offline: o SW entrega a cópia guardada sem ?data, então o dia pedido vem da própria URL.
  const [hoje, setHoje] = useState<string>();
  useEffect(() => {
    const h = hojeSP();
    setHoje(h);
    const q = new URLSearchParams(window.location.search).get("data");
    if (diaValido(q) && q <= h) setData(q);
    else if (dataInicial < h) setData(h);
  }, [dataInicial]);
  const [pedidoId, setPedidoId] = useState(pedidos.length === 1 ? pedidos[0].id : "");
  const [linhas, setLinhas] = useState<LinhaFicha[]>([linhaVazia()]);
  const [erro, setErro] = useState<string | null>(null);
  const [lancados, setLancados] = useState<{ numero?: number; guardado?: boolean; resumo: string }[]>([]);
  const pedido = pedidos.find((p) => p.id === pedidoId);
  const cheias = linhasPreenchidas(linhas);

  function lancar() {
    setErro(null);
    if (!pedidoId) return setErro("Escolha o pedido");
    const invalida = validarFicha(linhas);
    if (invalida) return setErro(invalida);
    const pecas = cheias.reduce((t, l) => t + Object.values(l.pecas).reduce((x, n) => x + n, 0), 0);
    const medidas = [...new Set(cheias.map((l) => `${l.espessura} mm ${rotuloLarguras(l.larguras)}`))].join(", ");
    const resumo = `${medidas} · ${fmtNum(pecas)} peças · pedido ${pedido?.numero}`;
    iniciar(async () => {
      try {
        const r = await enviarOuGuardar("lote", `Serraria: ${resumo}`, { data, pedidoId, linhas: cheias }, (d) => lancarLote(d as Parameters<typeof lancarLote>[0]));
        if ("guardado" in r) {
          setLancados((l) => [{ guardado: true, resumo }, ...l]);
        } else {
          const res = r as Resultado;
          if (res.erro) return setErro(res.erro);
          setLancados((l) => [{ numero: res.numero, resumo }, ...l]);
          router.refresh();
        }
        setLinhas([linhaVazia(cheias[cheias.length - 1])]);
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
          <input id="a-data" type="date" max={hoje} value={data} onChange={(e) => setData(e.target.value)} className="campo" />
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <label htmlFor="a-pedido">Pedido *</label>
          <select id="a-pedido" value={pedidoId} onChange={(e) => setPedidoId(e.target.value)} className="campo">
            <option value="">{pedidos.length ? "Escolha o pedido…" : "Nenhum pedido aberto — cadastre em Cadastros › Pedidos"}</option>
            {pedidos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.numero} · {p.cliente}
                {p.destino ? ` · ${p.destino}` : ""}
                {p.falta != null ? ` · falta serrar ${fmtNum(p.falta, 1)} m³` : ""}
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
        <h2 className="mb-1 font-semibold">Madeira serrada</h2>
        <p className="mb-4 text-sm text-stone-500">Uma linha por medida: espessura, larguras e as peças em cada comprimento.</p>
        <FichaMadeira linhas={linhas} onChange={setLinhas} />
      </section>

      {erro && (
        <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
          {erro}
        </p>
      )}
      <div className="barra-acoes">
        {cheias.length > 0 && (
          <button type="button" onClick={() => setLinhas([linhaVazia()])} className="btn-secundario">
            Limpar ficha
          </button>
        )}
        <button type="button" onClick={lancar} disabled={pendente} className="btn-primario">
          <Tag className="h-4 w-4" /> {pendente ? "Lançando…" : "Lançar e gerar etiqueta"}
        </button>
      </div>
    </div>
  );
}
