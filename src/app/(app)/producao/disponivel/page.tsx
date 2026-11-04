import type { Metadata } from "next";
import Link from "next/link";
import { BotaoPdfDisponivel } from "@/components/producao/BotaoPdfDisponivel";
import { Titulo, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { ESPESSURAS, fmtM3, fmtNum } from "@/lib/producao";
import { STATUS_PACOTE } from "@/lib/rastreio";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Disponível para venda" };

type Soma = { qtd: number; m3: number };
const vazio = (): Soma => ({ qtd: 0, m3: 0 });

/**
 * Estoque disponível para venda: pacotes em estoque por bitola e classe, separando o que
 * está livre do que já tem pedido. Seca = pronta para sair; na estufa e verde = a caminho.
 */
export default async function DisponivelPage({ searchParams }: { searchParams: Promise<{ esp?: string; reservados?: string }> }) {
  await exigirProducao();
  const sp = await searchParams;
  const esp = Number(sp.esp) || null;
  const verReservados = sp.reservados === "1";
  const pacotes = await db.pacote.findMany({
    where: { status: { in: ["VERDE", "EM_ESTUFA", "SECO"] }, ...(esp ? { espessura: esp } : {}), ...(verReservados ? {} : { pedidoId: null }) },
    select: { espessura: true, largura: true, comprimento: true, classe: true, status: true, m3: true, pedidoId: true },
  });
  const reservados = verReservados
    ? null
    : await db.pacote.aggregate({ where: { status: { in: ["VERDE", "EM_ESTUFA", "SECO"] }, pedidoId: { not: null }, ...(esp ? { espessura: esp } : {}) }, _count: true, _sum: { m3: true } });

  const grupos = new Map<string, { e: number; l: number; c: number; classe: string; seco: Soma; estufa: Soma; verde: Soma }>();
  for (const p of pacotes) {
    const k = `${p.espessura}|${p.largura}|${p.comprimento}|${p.classe ?? ""}`;
    const g = grupos.get(k) ?? { e: p.espessura, l: p.largura, c: p.comprimento, classe: p.classe ?? "—", seco: vazio(), estufa: vazio(), verde: vazio() };
    const alvo = p.status === "SECO" ? g.seco : p.status === "EM_ESTUFA" ? g.estufa : g.verde;
    alvo.qtd++;
    alvo.m3 += p.m3;
    grupos.set(k, g);
  }
  const linhas = [...grupos.values()].sort((a, b) => a.e - b.e || b.l - a.l || b.c - a.c || a.classe.localeCompare(b.classe));
  const tot = (k: "seco" | "estufa" | "verde") => linhas.reduce((t, g) => ({ qtd: t.qtd + g[k].qtd, m3: t.m3 + g[k].m3 }), vazio());
  const link = (q: Record<string, string | undefined>) => `/producao/disponivel?${new URLSearchParams(Object.entries({ esp: esp ? String(esp) : undefined, reservados: verReservados ? "1" : undefined, ...q }).filter(([, v]) => v) as [string, string][]).toString()}`;
  const chip = (ativo: boolean) => `rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${ativo ? "bg-marca-700 text-white ring-marca-700" : "bg-white text-stone-700 ring-stone-300"}`;
  const cel = (s: Soma, forte = false) => (
    <td className={`px-3 py-2 text-right tabular-nums ${s.qtd ? (forte ? "font-semibold" : "") : "text-stone-300"}`}>
      {s.qtd ? (
        <>
          {fmtNum(s.qtd)} <span className="text-xs font-normal text-stone-500">· {fmtM3(s.m3, 2)}</span>
        </>
      ) : (
        "·"
      )}
    </td>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <Titulo
        subtitulo={verReservados ? "Todos os pacotes em estoque, inclusive os que já têm pedido" : "Pacotes em estoque sem pedido: o que dá para vender agora (seca) e o que vem a seguir (estufa e verde)"}
        acao={
          <BotaoPdfDisponivel
            subtitulo={`${esp ? `${esp} mm · ` : ""}${verReservados ? "inclui pacotes com pedido" : "pacotes sem pedido"}`}
            linhas={linhas.map((g) => ({ bitola: `${g.e} × ${g.l} × ${g.c}`, classe: g.classe, secoQtd: g.seco.qtd, secoM3: g.seco.m3, estufaQtd: g.estufa.qtd, estufaM3: g.estufa.m3, verdeQtd: g.verde.qtd, verdeM3: g.verde.m3 }))}
          />
        }
      >
        Disponível para venda
      </Titulo>

      <dl className="mb-5 grid grid-cols-3 gap-3">
        {[
          ["Seca, pronta para sair", tot("seco"), STATUS_PACOTE.SECO.hex],
          ["Na estufa", tot("estufa"), STATUS_PACOTE.EM_ESTUFA.hex],
          ["Verde", tot("verde"), STATUS_PACOTE.VERDE.hex],
        ].map(([r, s, cor]) => (
          <div key={r as string} className="cartao min-w-0 py-3">
            <dt className="flex items-center gap-1.5 truncate text-xs text-stone-500">
              <span className="h-2 w-2 rounded-full" style={{ background: cor as string }} />
              {r as string}
            </dt>
            <dd className="text-lg font-semibold tabular-nums sm:text-xl">{fmtM3((s as Soma).m3, 1)}</dd>
            <dd className="text-xs text-stone-500">{fmtNum((s as Soma).qtd)} pacote(s)</dd>
          </div>
        ))}
      </dl>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={link({ esp: undefined })} className={chip(!esp)}>
          Todas
        </Link>
        {ESPESSURAS.map((e) => (
          <Link key={e} href={link({ esp: String(e) })} className={chip(esp === e)}>
            {e} mm
          </Link>
        ))}
        <span className="mx-1 h-5 w-px bg-stone-300" />
        <Link href={link({ reservados: verReservados ? undefined : "1" })} className={chip(verReservados)}>
          {verReservados ? "Incluindo os com pedido" : "Só sem pedido"}
        </Link>
      </div>

      {linhas.length === 0 ? (
        <Vazio>Nenhum pacote {verReservados ? "em estoque" : "livre"}{esp ? ` de ${esp} mm` : ""}.</Vazio>
      ) : (
        <section className="cartao overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-stone-200 text-left text-xs text-stone-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Bitola (mm)</th>
                <th className="px-3 py-2 font-semibold">Classe</th>
                <th className="px-3 py-2 text-right font-semibold">Seca</th>
                <th className="px-3 py-2 text-right font-semibold">Na estufa</th>
                <th className="px-3 py-2 text-right font-semibold">Verde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {linhas.map((g) => (
                <tr key={`${g.e}-${g.l}-${g.c}-${g.classe}`} className="hover:bg-stone-50">
                  <td className="px-4 py-2">
                    <Link href={`/producao/pacotes?status=estoque&q=${g.e}x${g.l}x${g.c}`} className="font-medium tabular-nums text-marca-700 hover:underline">
                      {g.e} × {g.l} × {g.c}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{g.classe}</td>
                  {cel(g.seco, true)}
                  {cel(g.estufa)}
                  {cel(g.verde)}
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-stone-200 font-semibold">
              <tr>
                <td className="px-4 py-2" colSpan={2}>
                  Total
                </td>
                {cel(tot("seco"), true)}
                {cel(tot("estufa"))}
                {cel(tot("verde"))}
              </tr>
            </tfoot>
          </table>
        </section>
      )}
      {reservados && reservados._count > 0 && (
        <p className="mt-3 text-sm text-stone-500">
          Fora desta lista: {fmtNum(reservados._count)} pacote(s) · {fmtM3(reservados._sum.m3 ?? 0, 1)} já reservados a pedidos.{" "}
          <Link href={link({ reservados: "1" })} className="font-medium text-marca-700 hover:underline">
            Ver também
          </Link>
        </p>
      )}
    </div>
  );
}
