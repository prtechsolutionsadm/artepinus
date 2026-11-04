import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import {
  salvarConfig,
  salvarFloresta,
  salvarFornecedor,
  salvarMotorista,
  salvarPedido,
  zerarMovimento,
} from "@/app/actions/cadastros";
import { salvarEstufa, salvarMotivo } from "@/app/actions/producao";
import { ActionForm, BotaoEnviar } from "@/components/ActionForm";
import { Badge, Titulo, Vazio } from "@/components/ui";
import { db } from "@/lib/db";
import { CENTRO, fmtM3, fmtNum } from "@/lib/producao";
import { configSerraria } from "@/lib/producao-dados";
import { exigirProducao } from "@/lib/session";
import type { CentroParada } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Cadastros" };

const ABAS = [
  { id: "pedidos", rotulo: "Pedidos" },
  { id: "florestas", rotulo: "Florestas" },
  { id: "fornecedores", rotulo: "Fornecedores" },
  { id: "motoristas", rotulo: "Motoristas" },
  { id: "motivos", rotulo: "Motivos de parada" },
  { id: "estufas", rotulo: "Estufas" },
  { id: "config", rotulo: "Configuração" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

type Equip = { id: string; codigo: string; nome: string };
type Motivo = {
  id: string;
  codigo: number;
  descricao: string;
  centro: CentroParada;
  equipamentoId: string | null;
  ativo: boolean;
};
type Estufa = {
  id: string;
  numero: number;
  nome: string;
  capacidadeM3: number | null;
  equipamentoId: string | null;
  ativo: boolean;
};

function SelectEquipamento({
  equipamentos,
  valor,
}: {
  equipamentos: Equip[];
  valor?: string | null;
}) {
  return (
    <select name="equipamentoId" defaultValue={valor ?? ""} className="campo">
      <option value="">—</option>
      {equipamentos.map((e) => (
        <option key={e.id} value={e.id}>
          {e.codigo} · {e.nome}
        </option>
      ))}
    </select>
  );
}

function CamposMotivo({
  m,
  equipamentos,
}: {
  m?: Motivo;
  equipamentos: Equip[];
}) {
  return (
    <>
      <input type="hidden" name="id" value={m?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-6">
        <div>
          <label>Código *</label>
          <input
            name="codigo"
            inputMode="numeric"
            required
            defaultValue={m?.codigo}
            className="campo"
          />
        </div>
        <div className="sm:col-span-3">
          <label>Descrição *</label>
          <input
            name="descricao"
            required
            defaultValue={m?.descricao}
            className="campo"
          />
        </div>
        <div className="sm:col-span-2">
          <label>Centro</label>
          <select
            name="centro"
            defaultValue={m?.centro ?? "OPE"}
            className="campo"
          >
            {(Object.keys(CENTRO) as CentroParada[]).map((c) => (
              <option key={c} value={c}>
                {CENTRO[c].label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-4">
          <label>Equipamento</label>
          <SelectEquipamento
            equipamentos={equipamentos}
            valor={m?.equipamentoId}
          />
        </div>
        <div className="flex items-end justify-between gap-3 sm:col-span-2">
          <label className="mb-2.5 flex items-center gap-2 font-normal">
            <input
              type="checkbox"
              name="ativo"
              defaultChecked={m?.ativo ?? true}
            />{" "}
            Ativo
          </label>
          <BotaoEnviar>{m ? "Salvar" : "Cadastrar"}</BotaoEnviar>
        </div>
      </div>
    </>
  );
}

function CamposEstufa({
  e,
  equipamentos,
}: {
  e?: Estufa;
  equipamentos: Equip[];
}) {
  return (
    <>
      <input type="hidden" name="id" value={e?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-6">
        <div>
          <label>Número *</label>
          <input
            name="numero"
            inputMode="numeric"
            required
            defaultValue={e?.numero}
            className="campo"
          />
        </div>
        <div className="sm:col-span-2">
          <label>Nome *</label>
          <input
            name="nome"
            required
            defaultValue={e?.nome}
            className="campo"
          />
        </div>
        <div>
          <label>Capacidade (m³)</label>
          <input
            name="capacidadeM3"
            inputMode="decimal"
            defaultValue={e?.capacidadeM3 ?? ""}
            className="campo"
          />
        </div>
        <div className="sm:col-span-2">
          <label>Equipamento (manutenção)</label>
          <SelectEquipamento
            equipamentos={equipamentos}
            valor={e?.equipamentoId}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 font-normal">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={e?.ativo ?? true}
          />{" "}
          Ativa
        </label>
        <BotaoEnviar>{e ? "Salvar" : "Cadastrar"}</BotaoEnviar>
      </div>
    </>
  );
}

/** Bloco "Novo …" + lista com edição em cada linha. */
function Lista<T extends { id: string }>({
  novo,
  itens,
  vazio,
  resumo,
  form,
}: {
  novo: string;
  itens: T[];
  vazio: string;
  resumo: (i: T) => React.ReactNode;
  form: (i?: T) => React.ReactNode;
}) {
  return (
    <>
      <details className="cartao mb-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-marca-700">
          <Plus className="h-4 w-4" /> {novo}
        </summary>
        <div className="mt-4">{form()}</div>
      </details>
      {itens.length === 0 ? (
        <Vazio>{vazio}</Vazio>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {itens.map((i) => (
            <li key={i.id} className="px-4 py-2.5">
              <details>
                <summary className="flex cursor-pointer list-none items-center gap-2">
                  <div className="min-w-0 flex-1">{resumo(i)}</div>
                  <Pencil className="h-4 w-4 shrink-0 text-stone-400" />
                </summary>
                <div className="mt-3">{form(i)}</div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const Ativo = ({ v }: { v?: boolean }) => (
  <label className="mb-2.5 flex items-center gap-2 font-normal">
    <input type="checkbox" name="ativo" defaultChecked={v ?? true} /> Ativo
  </label>
);

export default async function CadastrosPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const eu = await exigirProducao("gerir");
  const q = (await searchParams).aba;
  const aba: Aba = ABAS.some((a) => a.id === q) ? (q as Aba) : "pedidos";

  return (
    <>
      <Titulo subtitulo="Pedidos, florestas, fornecedores, motoristas, paradas, estufas e a configuração da serraria">
        Cadastros
      </Titulo>
      <nav
        aria-label="Cadastros"
        className="-mx-4 mb-5 overflow-x-auto border-b border-stone-200 px-4 sm:mx-0 sm:px-0"
      >
        <ul className="flex gap-5">
          {ABAS.map((a) => (
            <li key={a.id}>
              <Link
                href={`/producao/cadastros?aba=${a.id}`}
                aria-current={aba === a.id ? "page" : undefined}
                className={`-mb-px block whitespace-nowrap border-b-2 py-2.5 text-sm font-semibold ${aba === a.id ? "border-marca-700 text-marca-800" : "border-transparent text-stone-500 hover:text-stone-800"}`}
              >
                {a.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {aba === "pedidos" && <Pedidos />}
      {aba === "florestas" && <Florestas />}
      {aba === "fornecedores" && <Fornecedores />}
      {aba === "motoristas" && <Motoristas />}
      {aba === "motivos" && <Motivos />}
      {aba === "estufas" && <Estufas />}
      {aba === "config" && <Config admin={eu.perfil === "ADMIN"} />}
    </>
  );
}

async function Pedidos() {
  const pedidos = await db.pedido.findMany({
    orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
    include: {
      lotes: { select: { itens: { select: { m3: true } } } },
      _count: { select: { pacotes: true } },
    },
  });
  return (
    <Lista
      novo="Novo pedido"
      itens={pedidos}
      vazio="Nenhum pedido cadastrado. Cada lote da serraria é apontado já ligado a um pedido."
      resumo={(p) => (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="font-mono text-sm font-semibold">{p.numero}</span>
          <span className="font-medium">{p.cliente}</span>
          {p.destino && (
            <span className="text-sm text-stone-500">{p.destino}</span>
          )}
          <Badge
            cor={
              p.status === "ABERTO"
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-stone-100 text-stone-600 ring-stone-200"
            }
          >
            {p.status === "ABERTO" ? "Aberto" : "Concluído"}
          </Badge>
          <span className="text-xs text-stone-500">
            {fmtM3(
              p.lotes.reduce(
                (t, l) => t + l.itens.reduce((x, i) => x + i.m3, 0),
                0,
              ),
              1,
            )}{" "}
            serrados
            {p.volumeM3 ? ` de ${fmtM3(p.volumeM3, 1)}` : ""} ·{" "}
            {p._count.pacotes} pacote(s)
            {p.prazo
              ? ` · prazo ${p.prazo.toLocaleDateString("pt-BR", { timeZone: "UTC" })}`
              : ""}
          </span>
          <Link
            href={`/producao/pedidos/${p.id}`}
            className="text-xs font-semibold text-marca-700 hover:underline"
          >
            Acompanhar
          </Link>
        </div>
      )}
      form={(p) => (
        <ActionForm
          action={salvarPedido}
          limparAoSalvar={!p}
          className="grid gap-3 sm:grid-cols-4"
        >
          <input type="hidden" name="id" value={p?.id ?? ""} />
          <div>
            <label>Nº do pedido *</label>
            <input
              name="numero"
              required
              defaultValue={p?.numero}
              className="campo"
            />
          </div>
          <div className="sm:col-span-2">
            <label>Cliente *</label>
            <input
              name="cliente"
              required
              defaultValue={p?.cliente}
              className="campo"
            />
          </div>
          <div>
            <label>Situação</label>
            <select
              name="status"
              defaultValue={p?.status ?? "ABERTO"}
              className="campo"
            >
              <option value="ABERTO">Aberto</option>
              <option value="CONCLUIDO">Concluído</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label>Destino</label>
            <input
              name="destino"
              defaultValue={p?.destino ?? ""}
              placeholder="Cidade, porto…"
              className="campo"
            />
          </div>
          <div>
            <label>Volume combinado (m³)</label>
            <input
              name="volumeM3"
              inputMode="decimal"
              defaultValue={p?.volumeM3 ?? ""}
              placeholder="Ex.: 120"
              className="campo"
            />
          </div>
          <div>
            <label>Prazo de entrega</label>
            <input
              name="prazo"
              type="date"
              defaultValue={p?.prazo ? p.prazo.toISOString().slice(0, 10) : ""}
              className="campo"
            />
          </div>
          <div className="sm:col-span-2">
            <label>Observações</label>
            <input
              name="observacoes"
              defaultValue={p?.observacoes ?? ""}
              className="campo"
            />
          </div>
          <div className="flex justify-end sm:col-span-4">
            <BotaoEnviar>{p ? "Salvar" : "Cadastrar pedido"}</BotaoEnviar>
          </div>
        </ActionForm>
      )}
    />
  );
}

async function Florestas() {
  const florestas = await db.origemFlorestal.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { _count: { select: { cargas: true } } },
  });
  return (
    <Lista
      novo="Nova floresta"
      itens={florestas}
      vazio="Nenhuma floresta cadastrada."
      resumo={(f) => (
        <div className="flex flex-wrap items-center gap-x-3">
          <span className="font-medium">{f.nome}</span>
          <span className="text-sm text-stone-500">
            {[f.municipio, f.uf].filter(Boolean).join("/")}
          </span>
          <span className="text-xs text-stone-400">
            {f._count.cargas} carga(s)
          </span>
          {!f.ativo && (
            <Badge cor="bg-stone-200 text-stone-700 ring-stone-300">
              Inativa
            </Badge>
          )}
        </div>
      )}
      form={(f) => (
        <ActionForm
          action={salvarFloresta}
          limparAoSalvar={!f}
          className="grid gap-3 sm:grid-cols-6"
        >
          <input type="hidden" name="id" value={f?.id ?? ""} />
          <div className="sm:col-span-2">
            <label>Nome *</label>
            <input
              name="nome"
              required
              defaultValue={f?.nome}
              className="campo"
            />
          </div>
          <div className="sm:col-span-2">
            <label>Município</label>
            <input
              name="municipio"
              defaultValue={f?.municipio ?? ""}
              className="campo"
            />
          </div>
          <div>
            <label>UF</label>
            <input
              name="uf"
              maxLength={2}
              defaultValue={f?.uf ?? ""}
              className="campo uppercase"
            />
          </div>
          <div>
            <label>Espécie</label>
            <input
              name="especie"
              defaultValue={f?.especie ?? ""}
              placeholder="Pinus"
              className="campo"
            />
          </div>
          <div className="flex items-end justify-between gap-3 sm:col-span-6">
            <Ativo v={f?.ativo} />
            <BotaoEnviar>{f ? "Salvar" : "Cadastrar floresta"}</BotaoEnviar>
          </div>
        </ActionForm>
      )}
    />
  );
}

async function Fornecedores() {
  const fornecedores = await db.fornecedor.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { _count: { select: { cargas: true } } },
  });
  return (
    <Lista
      novo="Novo fornecedor"
      itens={fornecedores}
      vazio="Nenhum fornecedor cadastrado."
      resumo={(f) => (
        <div className="flex flex-wrap items-center gap-x-3">
          <span className="font-medium">{f.nome}</span>
          {f.documento && (
            <span className="text-sm text-stone-500">{f.documento}</span>
          )}
          <span className="text-xs text-stone-400">
            {f._count.cargas} carga(s)
          </span>
          {!f.ativo && (
            <Badge cor="bg-stone-200 text-stone-700 ring-stone-300">
              Inativo
            </Badge>
          )}
        </div>
      )}
      form={(f) => (
        <ActionForm
          action={salvarFornecedor}
          limparAoSalvar={!f}
          className="grid gap-3 sm:grid-cols-4"
        >
          <input type="hidden" name="id" value={f?.id ?? ""} />
          <div className="sm:col-span-2">
            <label>Nome *</label>
            <input
              name="nome"
              required
              defaultValue={f?.nome}
              className="campo"
            />
          </div>
          <div>
            <label>CNPJ / CPF</label>
            <input
              name="documento"
              defaultValue={f?.documento ?? ""}
              className="campo"
            />
          </div>
          <div>
            <label>Telefone</label>
            <input
              name="telefone"
              defaultValue={f?.telefone ?? ""}
              className="campo"
            />
          </div>
          <div className="flex items-end justify-between gap-3 sm:col-span-4">
            <Ativo v={f?.ativo} />
            <BotaoEnviar>{f ? "Salvar" : "Cadastrar fornecedor"}</BotaoEnviar>
          </div>
        </ActionForm>
      )}
    />
  );
}

async function Motoristas() {
  const motoristas = await db.motorista.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { _count: { select: { cargas: true } } },
  });
  return (
    <Lista
      novo="Novo motorista"
      itens={motoristas}
      vazio="Nenhum motorista cadastrado."
      resumo={(m) => (
        <div className="flex flex-wrap items-center gap-x-3">
          <span className="font-medium">{m.nome}</span>
          <span className="font-mono text-sm text-stone-600">
            {m.placaCaminhao}
            {m.placaJulieta ? ` + ${m.placaJulieta}` : ""}
          </span>
          <span className="text-xs text-stone-400">
            {m._count.cargas} carga(s)
          </span>
          {!m.ativo && (
            <Badge cor="bg-stone-200 text-stone-700 ring-stone-300">
              Inativo
            </Badge>
          )}
        </div>
      )}
      form={(m) => (
        <ActionForm
          action={salvarMotorista}
          limparAoSalvar={!m}
          className="grid gap-3 sm:grid-cols-4"
        >
          <input type="hidden" name="id" value={m?.id ?? ""} />
          <div className="sm:col-span-2">
            <label>Nome *</label>
            <input
              name="nome"
              required
              defaultValue={m?.nome}
              className="campo"
            />
          </div>
          <div>
            <label>Placa do caminhão *</label>
            <input
              name="placaCaminhao"
              required
              defaultValue={m?.placaCaminhao}
              placeholder="ABC1D23"
              className="campo font-mono uppercase"
            />
          </div>
          <div>
            <label>Placa da julieta</label>
            <input
              name="placaJulieta"
              defaultValue={m?.placaJulieta ?? ""}
              placeholder="ABC1D23"
              className="campo font-mono uppercase"
            />
          </div>
          <div>
            <label>Telefone</label>
            <input
              name="telefone"
              defaultValue={m?.telefone ?? ""}
              className="campo"
            />
          </div>
          <div className="flex items-end justify-between gap-3 sm:col-span-3">
            <Ativo v={m?.ativo} />
            <BotaoEnviar>{m ? "Salvar" : "Cadastrar motorista"}</BotaoEnviar>
          </div>
        </ActionForm>
      )}
    />
  );
}

async function equipamentosAtivos() {
  return db.equipamento.findMany({
    where: { ativo: true },
    orderBy: { codigo: "asc" },
    select: { id: true, codigo: true, nome: true },
  });
}

async function Motivos() {
  const [motivos, equipamentos] = await Promise.all([
    db.motivoParada.findMany({
      orderBy: { codigo: "asc" },
      include: { equipamento: { select: { nome: true } } },
    }),
    equipamentosAtivos(),
  ]);
  return (
    <Lista
      novo="Novo motivo de parada"
      itens={motivos}
      vazio="Nenhum motivo cadastrado."
      resumo={(m) => (
        <div className="flex items-center gap-2">
          <span className="w-8 shrink-0 font-mono text-sm text-stone-500">
            {m.codigo}
          </span>
          <span className="min-w-0 flex-1 truncate">{m.descricao}</span>
          <span className="hidden truncate text-xs text-stone-400 sm:inline">
            {m.equipamento?.nome}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-stone-600">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: CENTRO[m.centro].hex }}
            />
            {CENTRO[m.centro].curto}
          </span>
          {!m.ativo && (
            <Badge cor="bg-stone-200 text-stone-700 ring-stone-300">
              Inativo
            </Badge>
          )}
        </div>
      )}
      form={(m) => (
        <ActionForm action={salvarMotivo} limparAoSalvar={!m}>
          <CamposMotivo m={m} equipamentos={equipamentos} />
        </ActionForm>
      )}
    />
  );
}

async function Estufas() {
  const [estufas, equipamentos] = await Promise.all([
    db.estufa.findMany({
      orderBy: { numero: "asc" },
      include: { equipamento: { select: { codigo: true } } },
    }),
    equipamentosAtivos(),
  ]);
  return (
    <Lista
      novo="Nova estufa"
      itens={estufas}
      vazio="Nenhuma estufa cadastrada."
      resumo={(e) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{e.nome}</span>
          {e.capacidadeM3 && (
            <span className="text-sm text-stone-500">
              {fmtNum(e.capacidadeM3, 1)} m³
            </span>
          )}
          {!e.ativo && (
            <Badge cor="bg-stone-200 text-stone-700 ring-stone-300">
              Inativa
            </Badge>
          )}
        </div>
      )}
      form={(e) => (
        <ActionForm action={salvarEstufa} limparAoSalvar={!e}>
          <CamposEstufa e={e} equipamentos={equipamentos} />
        </ActionForm>
      )}
    />
  );
}

async function Config({ admin }: { admin: boolean }) {
  const c = await configSerraria();
  return (
    <>
      <section className="cartao max-w-2xl">
        <h2 className="mb-1 font-semibold">Configuração padrão da serraria</h2>
        <p className="mb-4 text-sm text-stone-500">
          A meta e as horas vêm preenchidas (somente leitura) em cada boletim
          novo e são a base da produtividade e do OEE.
        </p>
        <ActionForm
          action={salvarConfig}
          className="grid gap-3 sm:grid-cols-3 sm:items-end"
        >
          <div>
            <label htmlFor="metaDiariaM3">Meta diária (m³) *</label>
            <input
              id="metaDiariaM3"
              name="metaDiariaM3"
              inputMode="decimal"
              required
              defaultValue={c.metaDiariaM3}
              className="campo"
            />
          </div>
          <div>
            <label htmlFor="horasDia">Horas por dia *</label>
            <input
              id="horasDia"
              name="horasDia"
              inputMode="decimal"
              required
              defaultValue={c.horasDia}
              className="campo"
            />
          </div>
          <div>
            <label htmlFor="rendimentoMeta">Rendimento meta (%)</label>
            <input
              id="rendimentoMeta"
              name="rendimentoMeta"
              inputMode="decimal"
              defaultValue={c.rendimentoMeta ? c.rendimentoMeta * 100 : ""}
              className="campo"
            />
          </div>
          <div className="flex justify-end sm:col-span-3">
            <BotaoEnviar>Salvar configuração</BotaoEnviar>
          </div>
        </ActionForm>
      </section>
      {admin && (
        <section className="cartao mt-6 max-w-2xl border-rose-200">
          <h2 className="mb-1 font-semibold text-rose-700">
            Zerar o movimento de teste
          </h2>
          <p className="mb-3 text-sm text-stone-600">
            Apaga <b>todos</b> os lançamentos — cargas de toras, apontamentos e
            boletins, lotes, ciclos de estufa, pacotes, romaneios e inventários
            — e a numeração (PCT, LOT, ROM, CT) recomeça do 1. Mantém usuários,
            cadastros (florestas, fornecedores, motoristas, estufas, motivos), a
            configuração e a auditoria. Use antes de começar a usar de verdade.
            <b> Não dá para desfazer.</b>
          </p>
          <ActionForm
            action={zerarMovimento}
            className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
          >
            <div>
              <label htmlFor="confirmacao">Digite APAGAR para confirmar</label>
              <input
                id="confirmacao"
                name="confirmacao"
                autoComplete="off"
                required
                className="campo"
              />
            </div>
            <BotaoEnviar className="btn-perigo">Zerar movimento</BotaoEnviar>
            <label className="flex items-center gap-2 font-normal sm:col-span-2">
              <input type="checkbox" name="pedidos" /> Apagar também os pedidos
            </label>
          </ActionForm>
        </section>
      )}
    </>
  );
}
