import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { ListaRequisicoes, selectItemRequisicao, type ItemRequisicao } from "@/components/ListaRequisicoes";
import { Titulo, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { exigirModulo } from "@/lib/session";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage() {
  await exigirModulo("manutencao");
  const inicioHoje = new Date();
  inicioHoje.setUTCHours(3, 0, 0, 0); // 00:00 em Brasília
  if (inicioHoje > new Date()) inicioHoje.setUTCDate(inicioHoje.getUTCDate() - 1);

  const [atrasadas, futuras] = await Promise.all([
    db.requisicao.findMany({
      where: { status: "AGENDADA", dataAgendada: { lt: inicioHoje } },
      select: selectItemRequisicao,
      orderBy: { dataAgendada: "asc" },
    }),
    db.requisicao.findMany({
      where: { status: "AGENDADA", dataAgendada: { gte: inicioHoje } },
      select: selectItemRequisicao,
      orderBy: { dataAgendada: "asc" },
      take: 200,
    }),
  ]);

  // Agrupa pelo dia em Brasília; o título leva o ano só quando não é o ano corrente
  const anoAtual = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", year: "numeric" });
  const porDia = new Map<string, { titulo: string; itens: ItemRequisicao[] }>();
  for (const r of futuras) {
    const data = r.dataAgendada!;
    const chave = data.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    const ano = data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", year: "numeric" });
    const texto = data.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "long",
      day: "numeric",
      month: "long",
      ...(ano !== anoAtual ? { year: "numeric" } : {}),
    });
    // Só a primeira letra maiúscula: "Sábado, 14 de novembro" (o capitalize do CSS faria "14 De Novembro")
    const grupo = porDia.get(chave) ?? { titulo: texto.charAt(0).toUpperCase() + texto.slice(1), itens: [] };
    grupo.itens.push(r);
    porDia.set(chave, grupo);
  }

  return (
    <>
      <Titulo>Agenda de manutenção</Titulo>
      {atrasadas.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-rose-700"><TriangleAlert className="h-4 w-4" /> Agendadas com data vencida ({atrasadas.length})</h2>
          <ListaRequisicoes itens={atrasadas} />
        </section>
      )}
      {porDia.size === 0 ? (
        <Vazio>Nenhuma manutenção agendada.</Vazio>
      ) : (
        <div className="space-y-8">
          {[...porDia].map(([chave, { titulo, itens }]) => (
            <section key={chave}>
              <h2 className="mb-2 font-semibold text-stone-800">{titulo}</h2>
              <ListaRequisicoes itens={itens} />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
