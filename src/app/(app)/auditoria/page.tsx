import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Titulo, Vazio } from "@/components/ui";
import { PERFIL, PERFIL_PRODUCAO, PRIORIDADE, STATUS, dateParaDataLocal, formatarData, diaValido, inteiroPositivo } from "@/lib/constantes";
import { db } from "@/lib/db";
import { temModulo } from "@/lib/permissoes";
import { CENTRO } from "@/lib/producao";
import { exigirPermissao } from "@/lib/session";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Auditoria" };

const POR_PAGINA = 50;

/** Filtro "Área": as entidades gravadas por auditar(), por grupo (mantenha junto com as actions). */
const GRUPOS_ENTIDADES: { grupo: string; entidades: Record<string, string> }[] = [
  {
    grupo: "Geral",
    entidades: {
      Usuario: "Usuários e acessos",
      Sistema: "Sistema (zerar movimento, triagem)",
    },
  },
  {
    grupo: "Serraria",
    entidades: {
      CargaToras: "Cargas de toras",
      Lote: "Lotes",
      BoletimProducao: "Boletins da serraria",
      ParadaMaquina: "Paradas de máquina",
      CicloSecagem: "Ciclos de secagem",
      Pacote: "Pacotes e expedição",
      LevantamentoEstoque: "Inventários",
      Pedido: "Pedidos",
      Estufa: "Estufas",
      MotivoParada: "Motivos de parada",
      OrigemFlorestal: "Florestas",
      Fornecedor: "Fornecedores",
      Motorista: "Motoristas",
      ConfigSerraria: "Configuração da serraria",
    },
  },
  {
    grupo: "Manutenção",
    entidades: {
      Requisicao: "Requisições",
      Equipamento: "Equipamentos e máquinas da linha",
      Setor: "Setores",
      PlanoPreventivo: "Planos de preventiva",
      ChecklistModelo: "Checklists",
    },
  },
];
const ENTIDADES: Record<string, string> = Object.assign({}, ...GRUPOS_ENTIDADES.map((g) => g.entidades));

const CAMPOS: Record<string, string> = {
  status: "Status",
  responsavelId: "Responsável",
  dataAgendada: "Data agendada",
  solucao: "Serviço realizado",
  maquinaParada: "Máquina parada",
  paradaInicio: "Parada desde",
  paradaFim: "Voltou a operar",
  observacao: "Observação",
  nome: "Nome",
  login: "Login",
  perfil: "Perfil",
  ativo: "Ativo",
  senha: "Senha",
  codigo: "Código",
  descricao: "Descrição",
  fabricante: "Fabricante",
  modelo: "Modelo",
  numeroSerie: "Nº de série",
  setorId: "Setor",
  motivo: "Motivo",
  perfilProducao: "Perfil na Serraria",
  linhaSerraria: "Máquina da linha",
  dataConclusao: "Concluída em",
  // Manutenção: planos de preventiva
  titulo: "Título",
  intervalo: "Intervalo",
  unidade: "Unidade",
  proximaData: "Próxima data",
  diaDoMes: "Dia do mês",
  antecedenciaDias: "Antecedência (dias)",
  prioridade: "Prioridade",
  checklistId: "Checklist",
  // Serraria
  data: "Data",
  torasQtd: "Toras (quantidade)",
  torasM3: "Toras (m³)",
  observacoes: "Observações",
  numero: "Número",
  cliente: "Cliente",
  destino: "Destino",
  volumeM3: "Volume (m³)",
  prazo: "Prazo",
  documento: "Documento",
  telefone: "Telefone",
  placaCaminhao: "Placa do caminhão",
  placaJulieta: "Placa da julieta",
  municipio: "Município",
  uf: "UF",
  especie: "Espécie",
  centro: "Tipo de parada",
  equipamentoId: "Máquina",
  capacidadeM3: "Capacidade (m³)",
  metaDiariaM3: "Meta diária (m³)",
  horasDia: "Horas por dia",
  rendimentoMeta: "Meta de rendimento",
  turnoInicio: "Início do turno",
  turnoFim: "Fim do turno",
};

/** Campos guardados como dia (boletim e prazo do pedido). */
const CAMPOS_DIA = new Set(["data", "prazo"]);

type Filtros = { usuario?: string; entidade?: string; de?: string; ate?: string; q?: string; pagina?: string };

function valorLegivel(campo: string, v: unknown, nomes: Map<string, string>) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (campo === "status" && typeof v === "string" && v in STATUS) return STATUS[v as keyof typeof STATUS].label;
  if (campo === "perfil" && typeof v === "string" && v in PERFIL) return PERFIL[v as keyof typeof PERFIL];
  if (campo === "perfilProducao") return typeof v === "string" && v in PERFIL_PRODUCAO ? PERFIL_PRODUCAO[v as keyof typeof PERFIL_PRODUCAO] : "Sem acesso";
  if (campo === "prioridade" && typeof v === "string" && v in PRIORIDADE) return PRIORIDADE[v as keyof typeof PRIORIDADE].label;
  if (campo === "centro" && typeof v === "string" && v in CENTRO) return CENTRO[v as keyof typeof CENTRO].label;
  if (campo === "status" && v === "ABERTO") return "Aberto";
  if (campo === "status" && v === "CONCLUIDO") return "Concluído";
  if ((campo === "responsavelId" || campo === "setorId" || campo === "equipamentoId") && typeof v === "string") return nomes.get(v) ?? v;
  // Colunas só de data (@db.Date): o dia, sem converter fuso
  if (CAMPOS_DIA.has(campo) && typeof v === "string" && diaValido(v.slice(0, 10))) return v.slice(0, 10).split("-").reverse().join("/");
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return formatarData(new Date(v), true);
  return String(v);
}

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<Filtros> }) {
  const eu = await exigirPermissao("auditoria");
  const f = await searchParams;
  const pagina = inteiroPositivo(f.pagina) ?? 1;

  const where: Prisma.AuditoriaWhereInput = {};
  if (f.usuario) where.usuarioId = f.usuario;
  if (f.entidade && f.entidade in ENTIDADES) where.entidade = f.entidade;
  if (f.q?.trim()) where.resumo = { contains: f.q.trim(), mode: "insensitive" };
  const criado: Prisma.DateTimeFilter = {};
  if (diaValido(f.de)) criado.gte = new Date(`${f.de}T00:00:00-03:00`);
  if (diaValido(f.ate)) criado.lt = new Date(new Date(`${f.ate}T00:00:00-03:00`).getTime() + 86400000);
  if (criado.gte || criado.lt) where.criadoEm = criado;

  const [total, itens, usuarios, setores, equipamentos] = await Promise.all([
    db.auditoria.count({ where }),
    db.auditoria.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: { usuario: { select: { nome: true } } },
    }),
    db.usuario.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    db.setor.findMany({ select: { id: true, nome: true } }),
    db.equipamento.findMany({ select: { id: true, nome: true } }),
  ]);
  const nomes = new Map([...usuarios, ...setores, ...equipamentos].map((x) => [x.id, x.nome]));
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const link = (p: number) => {
    const sp = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]);
    sp.set("pagina", String(p));
    return `/auditoria?${sp}`;
  };

  // Links da Serraria: só para o que ainda existe (lote e pacote abrem pelo número; a parada, no dia em que começou)
  const idsDe = (entidade: string) => [...new Set(itens.filter((a) => a.entidade === entidade && a.entidadeId).map((a) => a.entidadeId!))];
  const existe = async (entidade: string, buscar: (ids: string[]) => Promise<{ id: string }[]>) => {
    const ids = idsDe(entidade);
    return new Set(ids.length ? (await buscar(ids)).map((x) => x.id) : []);
  };
  const emIds = (ids: string[]) => ({ where: { id: { in: ids } }, select: { id: true } });
  const idsLote = idsDe("Lote");
  const idsPacote = idsDe("Pacote");
  const idsParada = idsDe("ParadaMaquina");
  const [lotes, pacotes, paradas, boletins, cargas, ciclos, inventarios, pedidos, estufas] = await Promise.all([
    idsLote.length ? db.lote.findMany({ where: { id: { in: idsLote } }, select: { id: true, numero: true } }) : [],
    idsPacote.length ? db.pacote.findMany({ where: { id: { in: idsPacote } }, select: { id: true, numero: true } }) : [],
    idsParada.length ? db.paradaMaquina.findMany({ where: { id: { in: idsParada } }, select: { id: true, inicio: true } }) : [],
    existe("BoletimProducao", (ids) => db.boletimProducao.findMany(emIds(ids))),
    existe("CargaToras", (ids) => db.cargaToras.findMany(emIds(ids))),
    existe("CicloSecagem", (ids) => db.cicloSecagem.findMany(emIds(ids))),
    existe("LevantamentoEstoque", (ids) => db.levantamentoEstoque.findMany(emIds(ids))),
    existe("Pedido", (ids) => db.pedido.findMany(emIds(ids))),
    existe("Estufa", (ids) => db.estufa.findMany(emIds(ids))),
  ]);
  const numeroLote = new Map(lotes.map((l) => [l.id, l.numero]));
  const numeroPacote = new Map(pacotes.map((p) => [p.id, p.numero]));
  const diaParada = new Map(paradas.map((p) => [p.id, dateParaDataLocal(p.inicio).slice(0, 10)]));
  // Requisições e a ficha do equipamento são da Manutenção: só para quem enxerga o módulo
  const verManutencao = temModulo(eu, "manutencao");
  const CADASTRO: Record<string, string> = {
    OrigemFlorestal: "florestas",
    Fornecedor: "fornecedores",
    Motorista: "motoristas",
    MotivoParada: "motivos",
    ConfigSerraria: "config",
  };
  const linkEntidade = (entidade: string, id: string | null): string | null => {
    if (entidade in CADASTRO) return `/producao/cadastros?aba=${CADASTRO[entidade]}`;
    if (!id) return null;
    switch (entidade) {
      case "Requisicao":
        return verManutencao ? `/requisicoes/${id}` : null;
      case "Equipamento":
        return verManutencao ? `/equipamentos/${id}` : "/producao/cadastros?aba=maquinas";
      case "Lote":
        return numeroLote.has(id) ? `/producao/lotes/${numeroLote.get(id)}` : null;
      case "Pacote":
        return numeroPacote.has(id) ? `/producao/pacotes/${numeroPacote.get(id)}` : null;
      case "ParadaMaquina":
        return diaParada.has(id) ? `/producao/paradas?dia=${diaParada.get(id)}` : null;
      case "BoletimProducao":
        return boletins.has(id) ? `/producao/boletins/${id}` : null;
      case "CargaToras":
        return cargas.has(id) ? `/producao/toras/${id}` : null;
      case "CicloSecagem":
        return ciclos.has(id) ? `/producao/estufas/ciclos/${id}` : null;
      case "LevantamentoEstoque":
        return inventarios.has(id) ? `/producao/estoque/${id}` : null;
      case "Pedido":
        return pedidos.has(id) ? `/producao/pedidos/${id}` : null;
      case "Estufa":
        return estufas.has(id) ? `/producao/estufas/${id}` : null;
      default:
        return null;
    }
  };

  return (
    <>
      <Titulo subtitulo="Quem fez o quê no sistema, e quando">Auditoria</Titulo>

      <form method="get" className="cartao mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <div className="col-span-2">
          <label htmlFor="q">Buscar</label>
          <input id="q" name="q" defaultValue={f.q} placeholder="Ex.: #00012, senha, LIX-02…" className="campo" />
        </div>
        <div>
          <label htmlFor="usuario">Usuário</label>
          <select id="usuario" name="usuario" defaultValue={f.usuario ?? ""} className="campo">
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="entidade">Área</label>
          <select id="entidade" name="entidade" defaultValue={f.entidade ?? ""} className="campo">
            <option value="">Todas</option>
            {GRUPOS_ENTIDADES.map((g) => (
              <optgroup key={g.grupo} label={g.grupo}>
                {Object.entries(g.entidades).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="de">De</label>
          <input id="de" name="de" type="date" defaultValue={f.de} className="campo" />
        </div>
        <div>
          <label htmlFor="ate">Até</label>
          <input id="ate" name="ate" type="date" defaultValue={f.ate} className="campo" />
        </div>
        <div className="col-span-2 flex justify-end gap-2 lg:col-span-6">
          <Link href="/auditoria" className="btn-secundario">
            Limpar
          </Link>
          <button className="btn-primario">Filtrar</button>
        </div>
      </form>

      <p className="mb-2 text-sm text-stone-500">
        {total} registro{total === 1 ? "" : "s"}
      </p>
      {itens.length === 0 ? (
        <Vazio>Nenhum registro encontrado.</Vazio>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs">
          {itens.map((a) => {
            const detalhes = (a.detalhes ?? {}) as Record<string, unknown>;
            const mudancas = Object.entries(detalhes).filter(
              ([, v]) => v && typeof v === "object" && "de" in (v as object) && "para" in (v as object)
            ) as [string, { de: unknown; para: unknown }][];
            const href = linkEntidade(a.entidade, a.entidadeId);
            return (
              <li key={a.id} className="px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <div className="min-w-0 text-sm">
                    <span className="font-semibold">{a.usuario?.nome ?? "Sistema"}</span>{" "}
                    {href ? (
                      <Link href={href} className="text-stone-700 hover:text-marca-700 hover:underline">
                        {a.resumo}
                      </Link>
                    ) : (
                      <span className="text-stone-700">{a.resumo}</span>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-stone-400">{formatarData(a.criadoEm, true)}</time>
                </div>
                {mudancas.length > 0 && (
                  <dl className="mt-2 grid gap-1 rounded-xl bg-stone-50 p-2.5 text-xs sm:grid-cols-[max-content_1fr] sm:gap-x-4">
                    {mudancas.map(([campo, m]) => (
                      <div key={campo} className="contents">
                        <dt className="font-medium text-stone-500">{CAMPOS[campo] ?? campo}</dt>
                        <dd className="min-w-0 break-words text-stone-700">
                          <span className="text-stone-400 line-through">{valorLegivel(campo, m.de, nomes)}</span> →{" "}
                          <span className="font-medium">{valorLegivel(campo, m.para, nomes)}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {paginas > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-2 text-sm">
          {pagina > 1 && (
            <Link className="btn-secundario" href={link(pagina - 1)}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Link>
          )}
          <span className="px-2 text-stone-600">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas && (
            <Link className="btn-secundario" href={link(pagina + 1)}>
              Próxima <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
