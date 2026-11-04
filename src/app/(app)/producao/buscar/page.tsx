import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, ClipboardList, Package, Search, Tag, Truck } from "lucide-react";
import { Titulo, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtM3, formatarDia } from "@/lib/producao";
import { STATUS_PACOTE, codigoCarga, codigoLote, codigoPacote, lerCodigo } from "@/lib/rastreio";
import { exigirProducao } from "@/lib/session";

export const metadata: Metadata = { title: "Buscar" };

/** Busca do topo: código (PCT, LOT, CT) vai direto; texto procura pedido, cliente, motorista, placa e floresta. */
export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await exigirProducao();
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);

  const codigo = q ? lerCodigo(q) : null;
  const ct = q.match(/^CT[-\s]?0*(\d{1,9})$/i);
  // Códigos com prefixo abrem direto
  if (codigo && /^(PCT|LOT)|\/[pl]\//i.test(q)) redirect(`/producao/${codigo.tipo === "lote" ? "lotes" : "pacotes"}/${codigo.numero}`);
  if (ct) {
    const c = await db.cargaToras.findUnique({ where: { numero: Number(ct[1]) }, select: { id: true } });
    if (c) redirect(`/producao/toras/${c.id}`);
  }

  const texto = { contains: q, mode: "insensitive" as const };
  const n = /^\d{1,9}$/.test(q) ? Number(q) : null;
  const [pedidos, cargas, pacotes, lotes] = q.length < 2
    ? [[], [], [], []]
    : await Promise.all([
        db.pedido.findMany({ where: { OR: [{ numero: texto }, { cliente: texto }, { destino: texto }] }, orderBy: { criadoEm: "desc" }, take: 10, include: { _count: { select: { pacotes: true, lotes: true } } } }),
        db.cargaToras.findMany({
          where: { OR: [{ motorista: texto }, { placa: texto }, { placaJulieta: texto }, { origem: texto }, { floresta: { nome: texto } }, { fornecedor: { nome: texto } }, ...(n ? [{ numero: n }] : [])] },
          orderBy: { data: "desc" },
          take: 10,
          include: { floresta: { select: { nome: true } }, fornecedor: { select: { nome: true } } },
        }),
        db.pacote.findMany({ where: { OR: [...(n ? [{ numero: n }] : []), { pedido: { OR: [{ numero: texto }, { cliente: texto }] } }, { cliente: texto }] }, orderBy: { numero: "desc" }, take: 10 }),
        db.lote.findMany({ where: { OR: [...(n ? [{ numero: n }] : []), { pedido: { OR: [{ numero: texto }, { cliente: texto }] } }] }, orderBy: { numero: "desc" }, take: 10, include: { pedido: { select: { numero: true, cliente: true } }, boletim: { select: { data: true } } } }),
      ]);
  const total = pedidos.length + cargas.length + pacotes.length + lotes.length;

  const Grupo = ({ titulo, Icone, children }: { titulo: string; Icone: typeof Search; children: React.ReactNode }) => (
    <section className="cartao p-0">
      <h2 className="flex items-center gap-2 border-b border-stone-100 px-4 py-3 font-semibold">
        <Icone className="h-4 w-4 text-stone-400" /> {titulo}
      </h2>
      <ul className="divide-y divide-stone-100">{children}</ul>
    </section>
  );
  const Item = ({ href, a, b }: { href: string; a: React.ReactNode; b: React.ReactNode }) => (
    <li>
      <Link href={href} className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{a}</div>
          <div className="truncate text-xs text-stone-500">{b}</div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
      </Link>
    </li>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <Titulo subtitulo="Pacote (PCT-), lote (LOT-), carga (CT-), pedido, cliente, motorista, placa ou floresta">Buscar</Titulo>
      <form action="/producao/buscar" className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input name="q" type="search" defaultValue={q} autoFocus placeholder="Ex.: PCT-000123, PED-45, João, ABC1D23…" className="campo mt-0 pl-9" />
      </form>
      {q.length >= 2 && total === 0 && <Vazio>Nada encontrado para “{q}”.</Vazio>}
      <div className="grid gap-4 md:grid-cols-2">
        {pedidos.length > 0 && (
          <Grupo titulo="Pedidos" Icone={ClipboardList}>
            {pedidos.map((p) => (
              <Item key={p.id} href={`/producao/cadastros?aba=pedidos`} a={`${p.numero} · ${p.cliente}`} b={`${p.destino ?? "—"} · ${p._count.lotes} lote(s) · ${p._count.pacotes} pacote(s) · ${p.status === "ABERTO" ? "aberto" : "concluído"}`} />
            ))}
          </Grupo>
        )}
        {pacotes.length > 0 && (
          <Grupo titulo="Pacotes" Icone={Package}>
            {pacotes.map((p) => (
              <Item key={p.id} href={`/producao/pacotes/${p.numero}`} a={codigoPacote(p.numero)} b={`${STATUS_PACOTE[p.status].label} · ${p.espessura}×${p.largura}×${p.comprimento} · ${p.pecas} pç · ${fmtM3(p.m3, 3)}`} />
            ))}
          </Grupo>
        )}
        {lotes.length > 0 && (
          <Grupo titulo="Lotes da serraria" Icone={Tag}>
            {lotes.map((l) => (
              <Item key={l.id} href={`/producao/lotes/${l.numero}`} a={codigoLote(l.numero)} b={`${formatarDia(l.boletim.data)} · pedido ${l.pedido.numero} · ${l.pedido.cliente}`} />
            ))}
          </Grupo>
        )}
        {cargas.length > 0 && (
          <Grupo titulo="Cargas de toras" Icone={Truck}>
            {cargas.map((c) => (
              <Item
                key={c.id}
                href={`/producao/toras/${c.id}`}
                a={`${codigoCarga(c.numero)} · ${formatarDia(c.data)}`}
                b={[c.floresta?.nome ?? c.origem, c.fornecedor?.nome, c.motorista, [c.placa, c.placaJulieta].filter(Boolean).join(" + ")].filter(Boolean).join(" · ")}
              />
            ))}
          </Grupo>
        )}
      </div>
    </div>
  );
}
