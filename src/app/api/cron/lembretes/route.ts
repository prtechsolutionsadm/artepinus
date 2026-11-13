import { NextRequest, NextResponse } from "next/server";
import { cronAutorizado } from "@/lib/cron";
import { db } from "@/lib/db";
import { formatarData, numeroRequisicao } from "@/lib/constantes";
import { idsComModulo, idsPorPerfil, notificar } from "@/lib/notificacoes";
import { MODULOS_ATIVOS } from "@/lib/permissoes";
import { gerarPreventivas } from "@/lib/preventivas";
import { verificarAlertas } from "@/lib/alertas-serraria";
import { limparRegistrosAntigos } from "@/lib/retencao";

/**
 * Rotina diária (7h de Brasília): gera as preventivas dos planos, envia o lembrete das
 * manutenções agendadas para hoje, roda os alertas da serraria (verificarAlertas: estufa
 * atrasada, pedido pronto) e a limpeza LGPD (limparRegistrosAntigos, prazos em RETENCAO).
 * Preventivas e lembretes só rodam com a Manutenção liberada (MODULOS_ATIVOS): em teste, os
 * planos não geram requisições que ninguém vê (na liberação, cada plano agenda só a ocorrência
 * atual) e nenhum lembrete é dado como enviado sem ter chegado a alguém.
 * Cada etapa é isolada: a falha de uma não impede as outras (e a resposta sai com 500).
 * Chamado pelo Cron da Vercel (vercel.json), que envia "Authorization: Bearer $CRON_SECRET".
 */
export async function GET(req: NextRequest) {
  if (!cronAutorizado(req.headers.get("authorization"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  let houveFalha = false;
  const etapa = <T>(nome: string, fn: () => Promise<T>): Promise<T | null> =>
    fn().catch((e) => {
      houveFalha = true;
      console.error(`Cron lembretes: falha em ${nome}`, e);
      return null;
    });

  // LGPD primeiro: apaga registros que passaram do prazo de guarda, sem depender do resto
  const limpeza = await etapa("limpeza LGPD", limparRegistrosAntigos);

  const manutencaoAtiva = MODULOS_ATIVOS.includes("manutencao");

  // Preventivas antes dos lembretes: as geradas para hoje já entram neles
  const preventivas = manutencaoAtiva ? await etapa("preventivas", () => gerarPreventivas()) : null;

  let semDestinatario = 0;
  const enviarLembretes = async () => {
    const hoje = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const inicio = new Date(`${hoje}T00:00:00-03:00`);
    const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);

    const agendadas = await db.requisicao.findMany({
      where: { status: "AGENDADA", lembreteEm: null, dataAgendada: { gte: inicio, lt: fim } },
      select: { id: true, titulo: true, dataAgendada: true, solicitanteId: true, responsavelId: true },
    });

    const equipe = agendadas.some((r) => !r.responsavelId) ? await idsPorPerfil(["SUPERVISOR"]) : [];
    let enviados = 0;
    for (const r of agendadas) {
      try {
        // Só quem de fato recebe (ativo e com a Manutenção): sem ninguém, o lembrete não é marcado como enviado
        const [paraEquipe, paraSolicitante] = await Promise.all([
          idsComModulo(r.responsavelId ? [r.responsavelId] : equipe, "manutencao"),
          idsComModulo([r.solicitanteId !== r.responsavelId ? r.solicitanteId : null], "manutencao"),
        ]);
        if (!paraEquipe || !paraSolicitante) throw new Error("Falha ao conferir os destinatários");
        if (!paraEquipe.length && !paraSolicitante.length) {
          semDestinatario++;
          continue;
        }
        const hora = formatarData(r.dataAgendada, true).split(", ")[1];
        await notificar(paraEquipe, {
          titulo: `📅 Hoje às ${hora}: ${numeroRequisicao(r.id)}`,
          mensagem: r.titulo,
          link: `/requisicoes/${r.id}`,
        });
        await notificar(paraSolicitante, {
          titulo: `📅 Sua requisição ${numeroRequisicao(r.id)} está agendada para hoje às ${hora}`,
          mensagem: r.titulo,
          link: `/requisicoes/${r.id}`,
        });
        await db.requisicao.update({ where: { id: r.id }, data: { lembreteEm: new Date() } });
        enviados++;
      } catch (e) {
        houveFalha = true;
        console.error(`Cron lembretes: falha no lembrete da requisição ${r.id}`, e);
      }
    }
    return enviados;
  };
  const lembretesEnviados = manutencaoAtiva ? await etapa("lembretes", enviarLembretes) : null;

  // Serraria: estufas que passaram da previsão e pedidos prontos para expedir (já trata os próprios erros)
  const serraria = await verificarAlertas();

  return NextResponse.json(
    {
      manutencao: manutencaoAtiva ? "liberada" : "em teste: preventivas e lembretes não rodam",
      preventivasGeradas: preventivas?.length ?? null,
      lembretesEnviados,
      lembretesSemDestinatario: semDestinatario,
      serraria,
      limpeza,
    },
    { status: houveFalha ? 500 : 200 },
  );
}
