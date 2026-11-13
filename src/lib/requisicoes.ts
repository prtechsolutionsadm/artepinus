import "server-only";
import { after } from "next/server";
import { z } from "zod";
import { auditar } from "@/lib/auditoria";
import { numeroRequisicao } from "@/lib/constantes";
import { db } from "@/lib/db";
import { processarFoto } from "@/lib/fotos";
import { idsComModulo, idsPorPerfil, notificar } from "@/lib/notificacoes";
import { refletirRequisicaoNaParada } from "@/lib/paradas";
import { AVISO_NOVA } from "@/lib/permissoes";
import type { UsuarioAtual } from "@/lib/session";
import type { Requisicao } from "@/generated/prisma/client";

const vazioParaNull = (v: unknown) => (v === "" || v === undefined ? null : v);

export const novaRequisicaoSchema = z.object({
  titulo: z.string().trim().min(3, "Informe um título (mín. 3 caracteres)").max(120),
  descricao: z.string().trim().min(5, "Descreva o problema ou serviço"),
  tipo: z.enum(["CORRETIVA", "PREVENTIVA", "PREDITIVA", "MELHORIA"]),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]),
  local: z.preprocess(vazioParaNull, z.string().trim().max(120).nullable()),
  setorId: z.preprocess(vazioParaNull, z.string().nullable()),
  equipamentoId: z.preprocess(vazioParaNull, z.string().nullable()),
  maquinaParada: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  /** Máquina da linha da serraria parada: tipo da falha (vai para o boletim como MEC ou ELE). */
  centroParada: z.preprocess(vazioParaNull, z.enum(["MEC", "ELE"]).nullable()).default(null),
  /** Quando foi registrada no aparelho (fila offline); usada como início da parada. */
  registradaEm: z.preprocess(vazioParaNull, z.coerce.date().nullable()),
  /** Chave única gerada no aparelho (fila offline), para não duplicar em reenvios. */
  chaveOffline: z.preprocess(vazioParaNull, z.string().uuid().nullable()),
});

export type DadosNovaRequisicao = z.infer<typeof novaRequisicaoSchema>;

/**
 * Quem recebe o aviso de requisição nova (supervisores e manutentores; o gerente só nas de prioridade
 * alta/urgente ou com máquina parada), já sem quem não enxerga a manutenção — enquanto ela está em
 * teste, ninguém. O "Máquina parou" usa a mesma lista para não avisar duas vezes quem usa os dois módulos.
 */
export async function destinatariosNovaRequisicao(urgente: boolean, exceto?: string) {
  const ids = await idsPorPerfil([...AVISO_NOVA.todas, ...(urgente ? AVISO_NOVA.urgentes : [])], exceto);
  return (await idsComModulo(ids, "manutencao")) ?? ids;
}

function erroUnico(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
}

/**
 * Cria a requisição (com fotos), registra histórico/auditoria e avisa a equipe.
 * Com máquina parada numa máquina da linha da serraria, abre também a parada no boletim
 * (`semParada`: quem chama já tem a parada — o botão "Máquina parou").
 */
export async function criarRequisicaoCompleta(
  eu: UsuarioAtual,
  dados: DadosNovaRequisicao,
  fotos: File[],
  origem: "online" | "offline",
  opcoes: { semParada?: boolean; inicioParada?: Date } = {},
) {
  // Reenvio da fila offline (a resposta anterior se perdeu): devolve a que já existe
  if (dados.chaveOffline) {
    const existente = await db.requisicao.findUnique({ where: { chaveOffline: dados.chaveOffline } });
    if (existente) return existente;
  }

  // Fotos primeiro: se alguma for inválida, nada é gravado
  const processadas = await Promise.all(fotos.map(processarFoto));

  // Sem setor informado, a requisição herda o setor do equipamento
  const equipamento = dados.equipamentoId
    ? await db.equipamento.findUnique({ where: { id: dados.equipamentoId }, select: { setorId: true, codigo: true } })
    : null;

  const agora = new Date();
  const registradaEm = dados.registradaEm && dados.registradaEm < agora ? dados.registradaEm : agora;
  const { registradaEm: _ignorar, centroParada, ...campos } = dados;

  let req: Requisicao;
  try {
    req = await db.requisicao.create({
      data: {
        ...campos,
        equipamentoId: equipamento ? dados.equipamentoId : null,
        setorId: dados.setorId ?? equipamento?.setorId ?? null,
        solicitanteId: eu.id,
        paradaInicio: dados.maquinaParada ? (opcoes.inicioParada ?? registradaEm) : null,
        historico: {
          create: {
            statusNovo: "ABERTA",
            usuarioId: eu.id,
            observacao: origem === "offline" ? "Requisição aberta sem internet e enviada ao reconectar" : "Requisição aberta",
          },
        },
        anexos: processadas.length
          ? { create: processadas.map((f) => ({ ...f, dados: new Uint8Array(f.dados), miniatura: new Uint8Array(f.miniatura), autorId: eu.id, tipo: "PROBLEMA" as const })) }
          : undefined,
      },
    });
  } catch (e) {
    // Dois reenvios da mesma chave ao mesmo tempo: o outro gravou primeiro, devolve a dele
    if (!erroUnico(e) || !dados.chaveOffline) throw e;
    const existente = await db.requisicao.findUnique({ where: { chaveOffline: dados.chaveOffline } });
    if (!existente) throw e;
    return existente;
  }

  if (req.maquinaParada && !opcoes.semParada) await refletirRequisicaoNaParada(req.id, eu.id, centroParada ?? "MEC");

  await auditar({
    usuarioId: eu.id,
    acao: "requisicao.criar",
    entidade: "Requisicao",
    entidadeId: req.id,
    resumo: `Abriu a requisição ${numeroRequisicao(req.id)}: ${req.titulo}${processadas.length ? ` (${processadas.length} foto${processadas.length > 1 ? "s" : ""})` : ""}`,
    detalhes: { origem, maquinaParada: req.maquinaParada, prioridade: req.prioridade, equipamento: equipamento?.codigo ?? null },
  });

  const urgente = req.prioridade === "URGENTE" || req.prioridade === "ALTA" || req.maquinaParada;
  after(async () =>
    notificar(await destinatariosNovaRequisicao(urgente, eu.id), {
      titulo: `${req.prioridade === "URGENTE" ? "🚨 URGENTE · " : req.prioridade === "ALTA" ? "⚠️ Prioridade alta · " : ""}${req.maquinaParada ? "⛔ Máquina parada · " : ""}Nova requisição ${numeroRequisicao(req.id)}`,
      mensagem: `${req.titulo} — aberta por ${eu.nome}`,
      link: `/requisicoes/${req.id}`,
    })
  );

  return req;
}
