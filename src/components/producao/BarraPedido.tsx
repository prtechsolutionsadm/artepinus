import { fmtM3 } from "@/lib/producao";
import { STATUS_PACOTE } from "@/lib/rastreio";
import type { SituacaoPedido } from "@/lib/pedidos";

// Mesmas cores da situação dos pacotes (lista de pacotes, linha do tempo)
const PARTES = [
  { chave: "expedido", rotulo: "Expedido", cor: STATUS_PACOTE.EXPEDIDO.hex },
  { chave: "seco", rotulo: "Seco", cor: STATUS_PACOTE.SECO.hex },
  { chave: "naEstufa", rotulo: "Na estufa", cor: STATUS_PACOTE.EM_ESTUFA.hex },
  { chave: "verde", rotulo: "Verde", cor: STATUS_PACOTE.VERDE.hex },
] as const;

/** Barra do pedido: quanto do volume combinado está expedido, seco, na estufa e verde. */
export function BarraPedido({ p, legenda = false }: { p: SituacaoPedido; legenda?: boolean }) {
  const base = Math.max(p.volumeM3 ?? 0, p.expedido + p.seco + p.naEstufa + p.verde, 0.0001);
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-stone-100" role="img" aria-label={`Expedido ${fmtM3(p.expedido, 1)}, seco ${fmtM3(p.seco, 1)}, na estufa ${fmtM3(p.naEstufa, 1)}, verde ${fmtM3(p.verde, 1)}`}>
        {PARTES.map((x) => (
          <div key={x.chave} style={{ width: `${(p[x.chave] / base) * 100}%`, background: x.cor }} />
        ))}
      </div>
      {legenda && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
          {PARTES.map((x) => (
            <span key={x.chave} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: x.cor }} />
              {x.rotulo} <b className="tabular-nums">{fmtM3(p[x.chave], 2)}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
