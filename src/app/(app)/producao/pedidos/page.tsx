import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, ChevronRight, Plus } from "lucide-react";
import { BarraPedido } from "@/components/producao/BarraPedido";
import { Badge, Titulo, Vazio } from "@/components/ui";
import { podeProducao } from "@/lib/permissoes";
import { situacaoPedidos } from "@/lib/pedidos";
import { dateParaDia, fmtM3, fmtPct, formatarDia, hojeSP } from "@/lib/producao";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Pedidos" };

/** Acompanhamento dos pedidos: volume combinado, o que já foi serrado, secado e expedido, e o saldo. */
export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ todos?: string }> }) {
  const eu = await exigirProducao();
  const todos = (await searchParams).todos === "1";
  const pedidos = await situacaoPedidos(todos ? {} : { status: "ABERTO" });
  const hoje = hojeSP();

  return (
    <div className="mx-auto max-w-5xl">
      <Titulo
        subtitulo="Volume combinado, o que já foi serrado, secado e expedido, e o saldo de cada pedido"
        acao={
          podeProducao(eu, "gerir") && (
            <Link href="/producao/cadastros?aba=pedidos" className="btn-primario">
              <Plus className="h-4 w-4" /> Novo pedido
            </Link>
          )
        }
      >
        Pedidos
      </Titulo>
      <div className="mb-4 flex gap-2 text-sm">
        <Link href="/producao/pedidos" className={`rounded-full px-3 py-1.5 font-medium ring-1 ${!todos ? "bg-marca-700 text-white ring-marca-700" : "bg-white text-stone-700 ring-stone-300"}`}>
          Abertos
        </Link>
        <Link href="/producao/pedidos?todos=1" className={`rounded-full px-3 py-1.5 font-medium ring-1 ${todos ? "bg-marca-700 text-white ring-marca-700" : "bg-white text-stone-700 ring-stone-300"}`}>
          Todos
        </Link>
      </div>
      {pedidos.length === 0 ? (
        <Vazio>Nenhum pedido {todos ? "cadastrado" : "aberto"}.</Vazio>
      ) : (
        <ul className="space-y-3">
          {pedidos.map((p) => {
            const atrasado = p.status === "ABERTO" && p.prazo && dateParaDia(p.prazo) < hoje && (p.saldo ?? 1) > 0;
            return (
              <li key={p.id}>
                <Link href={`/producao/pedidos/${p.id}`} className="cartao block hover:border-marca-300">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono font-semibold">{p.numero}</span>
                    <span className="font-medium">{p.cliente}</span>
                    {p.destino && <span className="text-sm text-stone-500">{p.destino}</span>}
                    {p.status === "CONCLUIDO" && <Badge cor="bg-stone-100 text-stone-600 ring-stone-200">Concluído</Badge>}
                    {p.pronto && p.status === "ABERTO" && (
                      <Badge cor="bg-emerald-50 text-emerald-800 ring-emerald-200">
                        <CheckCircle2 className="mr-1 inline h-3 w-3" /> Pronto para expedir
                      </Badge>
                    )}
                    {p.prazo && (
                      <span className={`inline-flex items-center gap-1 text-xs ${atrasado ? "font-semibold text-rose-700" : "text-stone-500"}`}>
                        <CalendarClock className="h-3.5 w-3.5" /> {atrasado ? "Atrasado · " : ""}prazo {formatarDia(p.prazo, { day: "2-digit", month: "2-digit" })}
                      </span>
                    )}
                    <ChevronRight className="ml-auto h-4 w-4 text-stone-300" />
                  </div>
                  <div className="mt-3">
                    <BarraPedido p={p} />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-stone-600">
                    <span>
                      {p.volumeM3 != null ? (
                        <>
                          Expedido <b className="tabular-nums">{fmtM3(p.expedido, 1)}</b> de {fmtM3(p.volumeM3, 1)} ({fmtPct(p.atendido)})
                        </>
                      ) : (
                        <>Sem volume combinado · expedido {fmtM3(p.expedido, 1)}</>
                      )}
                    </span>
                    <span>
                      Serrado {fmtM3(p.serrado, 1)} · seco {fmtM3(p.seco, 1)}
                      {p.saldo != null && (
                        <>
                          {" "}
                          · <b className={p.saldo > 0 ? "text-stone-900" : "text-emerald-700"}>saldo {fmtM3(p.saldo, 1)}</b>
                        </>
                      )}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
