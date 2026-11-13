import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Factory, Flame, Package, TreePine, Truck, type LucideIcon } from "lucide-react";
import { EMPRESA } from "@/lib/empresa";
import { podeProducao } from "@/lib/permissoes";
import { codigoPacote } from "@/lib/rastreio";
import { db } from "@/lib/db";
import { rastrearPacote } from "@/lib/rastreio-dados";
import { usuarioAtual } from "@/lib/session";

// Página pública do QR da etiqueta: o cliente (ou qualquer pessoa) vê a história resumida
// do pacote, sem dados internos (cliente, pedido, pessoas, fornecedor, motorista, placas).

type Idioma = "pt" | "en";
const T = {
  pt: {
    titulo: "Rastreabilidade da madeira",
    produto: "Madeira serrada de pinus",
    medidas: "Medidas (E × L × C)",
    pecas: "Peças",
    volume: "Volume",
    classe: "Classe",
    origem: "Origem florestal",
    origemVazio: "Origem registrada internamente.",
    plantada: "Floresta plantada",
    recebimento: "Toras recebidas na serraria",
    serragem: "Serrado em",
    secagem: "Secagem em estufa",
    secagemVerde: "Madeira vendida verde (sem secagem em estufa).",
    secagemAndamento: "Em secagem.",
    entrada: "Entrada",
    saida: "Saída",
    duracao: "Duração",
    umidade: "Umidade final",
    formado: "Pacote formado",
    expedicao: "Expedição",
    expedido: "Expedido em",
    naEmpresa: "Ainda na empresa.",
    cancelado: "Este pacote foi cancelado.",
    rodape: "Cada pacote da Artepinus tem uma etiqueta com QR Code que liga a madeira à floresta de origem e a cada etapa da produção.",
    site: "Conheça a Artepinus",
    privacidade: "Política de Privacidade",
    horas: "h",
  },
  en: {
    titulo: "Timber traceability",
    produto: "Sawn pine timber",
    medidas: "Size (T × W × L)",
    pecas: "Pieces",
    volume: "Volume",
    classe: "Grade",
    origem: "Forest of origin",
    origemVazio: "Origin recorded internally.",
    plantada: "Planted forest",
    recebimento: "Logs received at the sawmill",
    serragem: "Sawn on",
    secagem: "Kiln drying",
    secagemVerde: "Sold green (not kiln dried).",
    secagemAndamento: "Drying in progress.",
    entrada: "In",
    saida: "Out",
    duracao: "Duration",
    umidade: "Final moisture",
    formado: "Package assembled",
    expedicao: "Shipping",
    expedido: "Shipped on",
    naEmpresa: "Not shipped yet.",
    cancelado: "This package was cancelled.",
    rodape: "Every Artepinus package carries a QR Code label linking the timber to its forest of origin and to each production step.",
    site: "About Artepinus",
    privacidade: "Privacy Policy (in Portuguese)",
    horas: "h",
  },
} as const;

export const metadata: Metadata = { title: "Rastreabilidade", robots: { index: false, follow: false } };

/**
 * O QR das etiquetas novas leva o código aleatório (/p/k7m2…); o das antigas, o número (/p/123).
 * O número só vale para pacotes de etiqueta antiga — assim ninguém percorre os pacotes trocando o número.
 */
async function acharNumero(param: string) {
  if (/^\d{1,9}$/.test(param)) {
    const p = await db.pacote.findUnique({ where: { numero: Number(param) }, select: { numero: true, qrLegado: true } });
    return p ? { numero: p.numero, legado: p.qrLegado } : null;
  }
  if (!/^[a-z0-9]{6,20}$/i.test(param)) return null;
  const p = await db.pacote.findUnique({ where: { codigoPublico: param.toLowerCase() }, select: { numero: true } });
  return p ? { numero: p.numero, legado: true } : null;
}

function Etapa({ Icone, titulo, cor, ativo, children, ultima }: { Icone: LucideIcon; titulo: string; cor: string; ativo: boolean; children: React.ReactNode; ultima?: boolean }) {
  return (
    <li className="relative flex gap-4 pb-7">
      {!ultima && <span className="absolute -bottom-1 left-5 top-11 w-0.5 bg-stone-200" aria-hidden />}
      <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-white" style={{ background: ativo ? cor : "#d6d3d1" }}>
        <Icone className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 pt-1.5">
        <h2 className={`font-semibold ${ativo ? "text-stone-900" : "text-stone-400"}`}>{titulo}</h2>
        <div className="mt-1 text-sm text-stone-600">{children}</div>
      </div>
    </li>
  );
}

export default async function PacotePublico({ params, searchParams }: { params: Promise<{ numero: string }>; searchParams: Promise<{ lang?: string; publico?: string }> }) {
  const param = (await params).numero;
  const sp = await searchParams;
  const achado = await acharNumero(param);
  const eu = await usuarioAtual();
  const equipe = !!eu && !eu.trocarSenha && podeProducao(eu, "ver");
  if (!achado) notFound();
  const { numero } = achado;
  // Equipe logada vai para a tela completa (a menos que peça a versão pública)
  if (equipe && !sp.publico) redirect(`/producao/pacotes/${numero}`);
  // Visitante com número de pacote de etiqueta nova: não mostra (evita percorrer os pacotes)
  if (!achado.legado && !equipe) notFound();

  const r = await rastrearPacote(numero);
  if (!r) notFound();
  const { pacote: p, dias, cargas, florestas } = r;
  const lang: Idioma = sp.lang === "en" ? "en" : "pt";
  const t = T[lang];
  const local = lang === "en" ? "en-GB" : "pt-BR";
  const data = (d: Date | null | undefined, comHora = false) =>
    d ? d.toLocaleDateString(local, { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short", year: "numeric", ...(comHora ? { hour: "2-digit", minute: "2-digit" } : {}) }) : "—";
  const dia = (d: Date) => d.toLocaleDateString(local, { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" });
  const faixa = (ds: Date[], f: (d: Date) => string) => (ds.length === 0 ? "—" : ds.length === 1 ? f(ds[0]) : `${f(ds[0])} – ${f(ds[ds.length - 1])}`);
  const num = (n: number, d = 0) => n.toLocaleString(local, { minimumFractionDigits: d, maximumFractionDigits: d });
  const ciclo = p.ciclo;
  const horasSecagem = ciclo?.saida ? (ciclo.saida.getTime() - ciclo.entrada.getTime()) / 3.6e6 : null;
  const especie = florestas.find((f) => f.especie)?.especie;
  const outro = (l: Idioma) => `?${new URLSearchParams({ ...(l === "en" ? { lang: "en" } : {}), ...(sp.publico ? { publico: "1" } : {}) }).toString()}`;

  return (
    <main className="min-h-dvh bg-[#f6f7f4] text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={EMPRESA.marca} alt="" className="h-8 w-auto" />
            <span className="font-serif text-lg font-bold italic tracking-wide text-[#177009]">ARTEPINUS</span>
          </Link>
          <nav className="flex overflow-hidden rounded-md border border-stone-300 text-xs font-semibold" aria-label="Idioma / Language">
            {(["pt", "en"] as const).map((l) => (
              <Link key={l} href={outro(l)} className={`px-2.5 py-1.5 ${lang === l ? "bg-[#177009] text-white" : "bg-white text-stone-600"}`} aria-current={lang === l ? "true" : undefined}>
                {l.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-stone-500">
            <Package className="h-4 w-4" /> {t.titulo}
          </p>
          <h1 className="mt-1 font-mono text-3xl font-bold tracking-tight">{codigoPacote(p.numero)}</h1>
          <p className="mt-1 text-stone-600">
            {t.produto}
            {especie ? ` · ${especie}` : ""}
          </p>
          {p.status === "CANCELADO" ? (
            <p className="mt-4 rounded-md bg-stone-100 px-3 py-2 text-sm text-stone-600">{t.cancelado}</p>
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [t.medidas, `${p.espessura} × ${p.largura} × ${p.comprimento} mm`],
                [t.pecas, num(p.pecas)],
                [t.volume, `${num(p.m3, 2)} m³`],
                [t.classe, p.classe ?? "—"],
              ].map(([a, b]) => (
                <div key={a} className="min-w-0">
                  <dt className="text-xs text-stone-500">{a}</dt>
                  <dd className="font-semibold">{b}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {p.status !== "CANCELADO" && (
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <ol>
              <Etapa Icone={TreePine} titulo={t.origem} cor="#177009" ativo={florestas.length > 0}>
                {florestas.length ? (
                  <ul className="space-y-0.5">
                    {florestas.map((f) => (
                      <li key={f.id}>
                        <b className="text-stone-800">{f.nome}</b>
                        {[f.municipio, f.uf].filter(Boolean).length ? ` · ${[f.municipio, f.uf].filter(Boolean).join("/")}` : ""}
                        {` · ${t.plantada}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  t.origemVazio
                )}
              </Etapa>
              <Etapa Icone={Truck} titulo={t.recebimento} cor="#8a5a2b" ativo={cargas.length > 0}>
                {faixa(cargas.map((c) => c.data), dia)}
              </Etapa>
              <Etapa Icone={Factory} titulo={t.serragem} cor="#2a78d6" ativo={dias.length > 0}>
                {faixa(dias.map((d) => d.data), dia)}
              </Etapa>
              <Etapa Icone={Flame} titulo={t.secagem} cor="#eb6834" ativo={!!ciclo}>
                {ciclo ? (
                  <>
                    {t.entrada} {data(ciclo.entrada)} · {ciclo.saida ? `${t.saida} ${data(ciclo.saida)}` : t.secagemAndamento}
                    {horasSecagem ? ` · ${t.duracao} ${num(horasSecagem, 0)} ${t.horas}` : ""}
                    {ciclo.umidadeFinal != null ? ` · ${t.umidade} ${num(ciclo.umidadeFinal, 1)}%` : ""}
                  </>
                ) : (
                  t.secagemVerde
                )}
              </Etapa>
              <Etapa Icone={CheckCircle2} titulo={t.formado} cor="#1baf7a" ativo>
                {data(p.criadoEm)}
              </Etapa>
              <Etapa Icone={Truck} titulo={t.expedicao} cor="#57534e" ativo={p.status === "EXPEDIDO"} ultima>
                {p.status === "EXPEDIDO" ? `${t.expedido} ${data(p.expedidoEm)}` : t.naEmpresa}
              </Etapa>
            </ol>
          </section>
        )}

        <footer className="space-y-2 px-1 pb-8 text-center text-xs text-stone-500">
          <p>{t.rodape}</p>
          <p>
            {EMPRESA.razaoSocial} · Caçador – SC, Brasil ·{" "}
            <Link href="/" className="font-medium text-[#177009] hover:underline">
              {t.site}
            </Link>
            {" · "}
            <Link href="/privacidade" className="font-medium text-[#177009] hover:underline">
              {t.privacidade}
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
