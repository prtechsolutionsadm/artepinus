import "server-only";
import { db } from "@/lib/db";
import { mesesAntes, hojeSP, mesDe } from "@/lib/producao";

/** Opções dos formulários de boletim: motivos ativos, equipamentos e metas recentes. */
export async function opcoesBoletim() {
  const [motivos, equipamentos, metas] = await Promise.all([
    db.motivoParada.findMany({
      where: { ativo: true },
      orderBy: { codigo: "asc" },
      select: { id: true, codigo: true, descricao: true, centro: true, equipamentoId: true },
    }),
    db.equipamento.findMany({ where: { ativo: true }, orderBy: [{ setor: { nome: "asc" } }, { nome: "asc" }], select: { id: true, codigo: true, nome: true } }),
    db.metaProducao.findMany({ where: { mes: { gte: mesesAntes(mesDe(hojeSP()), 24) } } }),
  ]);
  return {
    motivos,
    equipamentos,
    metas: Object.fromEntries(metas.map((m) => [m.mes, { metaDiariaM3: m.metaDiariaM3, horasDia: m.horasDia }])),
  };
}

/** Meses ("AAAA-MM") distintos de uma lista de datas, na ordem recebida. */
const mesesDistintos = (datas: { data: Date }[]) => [...new Set(datas.map((d) => d.data.toISOString().slice(0, 7)))];
const consultaUltimos3Anos = () => ({ where: { data: { gte: new Date(Date.now() - 3 * 366 * 864e5) } }, select: { data: true }, orderBy: { data: "desc" as const } });

/** Meses com boletins lançados nos últimos 3 anos, do mais recente ao mais antigo. */
export async function mesesComBoletim() {
  return mesesDistintos(await db.boletimProducao.findMany(consultaUltimos3Anos()));
}

/** Meses com cargas de toras recebidas nos últimos 3 anos. */
export async function mesesComCargas() {
  return mesesDistintos(await db.cargaToras.findMany(consultaUltimos3Anos()));
}

/** Configuração padrão da serraria (meta e horas do boletim). */
export async function configSerraria() {
  return (await db.configSerraria.findUnique({ where: { id: "padrao" } })) ?? { id: "padrao", metaDiariaM3: 60, horasDia: 8.8, rendimentoMeta: null, turnoInicio: "07:00", turnoFim: "17:00", atualizadoEm: new Date(0) };
}

/** Florestas, fornecedores e motoristas ativos (e os já usados, ao editar). */
export async function opcoesCarga(usados: { florestaId?: string | null; fornecedorId?: string | null; motoristaId?: string | null } = {}) {
  const ou = (id?: string | null) => (id ? [{ id }] : []);
  const [florestas, fornecedores, motoristas] = await Promise.all([
    db.origemFlorestal.findMany({ where: { OR: [{ ativo: true }, ...ou(usados.florestaId)] }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.fornecedor.findMany({ where: { OR: [{ ativo: true }, ...ou(usados.fornecedorId)] }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.motorista.findMany({
      where: { OR: [{ ativo: true }, ...ou(usados.motoristaId)] },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, placaCaminhao: true, placaJulieta: true },
    }),
  ]);
  return { florestas, fornecedores, motoristas };
}

/** Usuários ativos (para escolher o responsável pelo plantão da estufa). */
export async function usuariosAtivos() {
  return db.usuario.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } });
}
