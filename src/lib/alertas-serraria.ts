import "server-only";
import { db } from "@/lib/db";
import { notificar } from "@/lib/notificacoes";
import { situacaoPedidos } from "@/lib/pedidos";
import { MODULOS_ATIVOS } from "@/lib/permissoes";
import { diaParaDate, fmtM3, formatarDia, hojeSP } from "@/lib/producao";
import type { PerfilProducao } from "@/generated/prisma/enums";

// Alertas da serraria (sininho + push no celular). Cada alerta é enviado uma vez:
// as marcações (alertaAtrasoEm, prontoAvisadoEm) evitam repetir.

/** Quem recebe: Admin/Gerente e os perfis de serraria indicados. */
export async function idsSerraria(perfis: PerfilProducao[] = ["SUPERVISOR", "APONTADOR"]) {
  if (!MODULOS_ATIVOS.includes("producao")) return [];
  const u = await db.usuario.findMany({
    where: { ativo: true, OR: [{ perfil: { in: ["ADMIN", "GERENTE"] } }, { perfilProducao: { in: perfis } }] },
    select: { id: true },
  });
  return u.map((x) => x.id);
}

/**
 * Estufas que passaram da previsão de saída (avisa uma vez por previsão; editar a previsão limpa
 * a marcação; o plantão também recebe).
 */
export async function alertarEstufasAtrasadas() {
  const ciclos = await db.cicloSecagem.findMany({
    where: { status: "EM_SECAGEM", alertaAtrasoEm: null, previsaoSaida: { lt: new Date() } },
    include: { estufa: { select: { nome: true } } },
  });
  if (!ciclos.length) return 0;
  const equipe = await idsSerraria();
  let avisados = 0;
  for (const c of ciclos) {
    // Marca antes de avisar, numa operação só: duas verificações ao mesmo tempo não repetem o aviso
    const { count } = await db.cicloSecagem.updateMany({
      where: { id: c.id, status: "EM_SECAGEM", alertaAtrasoEm: null, previsaoSaida: c.previsaoSaida },
      data: { alertaAtrasoEm: new Date() },
    });
    if (count !== 1) continue;
    const quando = c.previsaoSaida!.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    await notificar([...equipe, c.plantaoId, c.responsavelId], {
      titulo: `🔥 ${c.estufa.nome} passou da previsão de saída`,
      mensagem: `${c.numero ? `Ciclo nº ${c.numero} · ` : ""}previsto para ${quando}. Confira a madeira e conclua o ciclo.`,
      link: `/producao/estufas/ciclos/${c.id}`,
    });
    avisados++;
  }
  return avisados;
}

/** No fim do dia útil: avisa se a serraria não teve nenhum lote apontado hoje. */
async function alertarDiaSemApontamento() {
  const hoje = hojeSP();
  const dia = diaParaDate(hoje);
  const semana = dia.getUTCDay();
  if (semana === 0 || semana === 6) return false;
  const boletim = await db.boletimProducao.findUnique({ where: { data: dia }, select: { id: true, _count: { select: { lotes: true, itens: true } } } });
  if (boletim && (boletim._count.lotes > 0 || boletim._count.itens > 0)) return false;
  await notificar(await idsSerraria(), {
    titulo: "📋 Serraria sem apontamento hoje",
    mensagem: `Nenhum lote foi apontado em ${formatarDia(dia, { weekday: "long", day: "2-digit", month: "2-digit" })}. Se a serraria trabalhou, aponte os lotes do dia.`,
    link: `/producao/boletins/novo?data=${hoje}`,
  });
  return true;
}

/**
 * Pedido pronto para expedir: com volume combinado, quando há saldo e os pacotes secos o cobrem;
 * sem volume, quando tudo o que não saiu está seco. Se deixar de estar pronto, a marcação é
 * limpa para avisar de novo.
 */
export async function verificarPedidosProntos(pedidoIds?: (string | null | undefined)[]) {
  const ids = pedidoIds?.filter((x): x is string => !!x);
  if (ids && !ids.length) return 0;
  const lista = await situacaoPedidos({ status: "ABERTO", ...(ids ? { id: { in: ids } } : {}) });
  const avisado = new Map((await db.pedido.findMany({ where: { id: { in: lista.map((p) => p.id) } }, select: { id: true, prontoAvisadoEm: true } })).map((p) => [p.id, p.prontoAvisadoEm]));
  let avisados = 0;
  for (const p of lista) {
    if (p.pronto && !avisado.get(p.id)) {
      const supervisores = await idsSerraria(["SUPERVISOR"]);
      // Marca antes de avisar, numa operação só: duas verificações ao mesmo tempo não repetem o aviso
      const { count } = await db.pedido.updateMany({ where: { id: p.id, prontoAvisadoEm: null }, data: { prontoAvisadoEm: new Date() } });
      if (count !== 1) continue;
      await notificar(supervisores, {
        titulo: `✅ Pedido ${p.numero} pronto para expedir`,
        mensagem: `${p.cliente}${p.destino ? ` · ${p.destino}` : ""}: ${fmtM3(p.seco, 2)} secos${p.saldo != null ? ` para um saldo de ${fmtM3(p.saldo, 2)}` : ""}.`,
        link: `/producao/pedidos/${p.id}`,
      });
      avisados++;
    } else if (!p.pronto && avisado.get(p.id)) {
      await db.pedido.update({ where: { id: p.id }, data: { prontoAvisadoEm: null } });
    }
  }
  return avisados;
}

/** Roda as verificações sem nunca derrubar quem chamou. */
export async function verificarAlertas(opcoes: { diaSemApontamento?: boolean } = {}) {
  try {
    const estufas = await alertarEstufasAtrasadas();
    const pedidos = await verificarPedidosProntos();
    const dia = opcoes.diaSemApontamento ? await alertarDiaSemApontamento() : false;
    return { estufas, pedidos, diaSemApontamento: dia };
  } catch (e) {
    console.error("Falha nos alertas da serraria", e);
    return { erro: true };
  }
}
