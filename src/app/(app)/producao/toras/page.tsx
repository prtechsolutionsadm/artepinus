import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { SeletorMes } from "@/components/SeletorMes";
import { BotaoLink, Titulo, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { podeProducao } from "@/lib/permissoes";
import { CLASSE_DIAMETRO, fmtNum, formatarDia, hojeSP, intervaloMes, mesDe, nomeMes } from "@/lib/producao";
import { mesesComCargas } from "@/lib/producao-dados";
import { codigoCarga } from "@/lib/rastreio";
import { exigirProducao } from "@/lib/session";
import type { ClasseDiametro } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Recebimento de toras" };

export default async function TorasPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const eu = await exigirProducao();
  const atual = mesDe(hojeSP());
  const { mes: q } = await searchParams;
  const mes = q && /^\d{4}-\d{2}$/.test(q) ? q : atual;
  const cargas = await db.cargaToras.findMany({
    where: { data: intervaloMes(mes) },
    orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
    include: { floresta: { select: { nome: true } }, fornecedor: { select: { nome: true } } },
  });
  const totalPeso = cargas.reduce((t, c) => t + (c.pesoT ?? 0), 0);
  const porClasse = (Object.keys(CLASSE_DIAMETRO) as ClasseDiametro[]).map((k) => ({
    k,
    cargas: cargas.filter((c) => c.classeDiametro === k).length,
    peso: cargas.filter((c) => c.classeDiametro === k).reduce((t, c) => t + (c.pesoT ?? 0), 0),
  }));
  const maior = Math.max(1, ...porClasse.map((x) => x.peso));

  return (
    <>
      <Titulo
        subtitulo="Cargas recebidas no pátio"
        acao={
          podeProducao(eu, "lancar") && (
            <BotaoLink href="/producao/toras/nova">
              <Plus className="h-4 w-4" /> Nova carga
            </BotaoLink>
          )
        }
      >
        Recebimento de toras
      </Titulo>
      <div className="mb-5">
        <SeletorMes mes={mes} atual={atual} base="/producao/toras" comDados={await mesesComCargas()} />
      </div>

      {cargas.length === 0 ? (
        <Vazio>Nenhuma carga registrada em {nomeMes(mes)}.</Vazio>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-4 lg:col-span-2">
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Cargas", fmtNum(cargas.length)],
                ["Peso recebido", `${fmtNum(totalPeso, 1)} t`],
              ].map(([r, v]) => (
                <div key={r} className="cartao min-w-0 py-3">
                  <dt className="text-xs text-stone-500">{r}</dt>
                  <dd className="text-lg font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {cargas.map((c) => (
                <li key={c.id}>
                  <Link href={`/producao/toras/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
                    <div className="w-14 shrink-0 font-semibold">{formatarDia(c.data, { day: "2-digit", month: "2-digit" })}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {c.floresta?.nome ?? c.origem ?? "—"}
                        {c.fornecedor && <span className="font-normal text-stone-500"> · {c.fornecedor.nome}</span>}
                      </div>
                      <div className="truncate text-sm text-stone-500">
                        {[c.pesoT ? `${fmtNum(c.pesoT, 1)} t` : null, c.classeDiametro ? CLASSE_DIAMETRO[c.classeDiametro] : null, c.motorista, c.placa].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <span className="hidden font-mono text-xs text-stone-400 sm:block">{codigoCarga(c.numero)}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <section className="cartao h-fit">
            <h2 className="mb-3 font-semibold">Peso por diâmetro</h2>
            <ul className="space-y-2.5">
              {porClasse.map((x) => (
                <li key={x.k}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{CLASSE_DIAMETRO[x.k]}</span>
                    <span className="tabular-nums">
                      <b>{fmtNum(x.peso, 1)} t</b> <span className="text-stone-400">· {x.cargas} carga(s)</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${(x.peso / maior) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
