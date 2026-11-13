import { randomBytes } from "node:crypto";
// Dados iniciais. Seguro para rodar várias vezes (roda a cada deploy de produção na Vercel; no Preview
// é ignorado): só cria o que ainda não existe e nunca altera usuários ou senhas existentes.
// Uso: npm run db:seed   (SEED_DEMO=1 também cria usuários, pedidos, lotes, pacotes, paradas e
// requisições de exemplo para as capturas do manual — só em banco local; rodar de novo não duplica)
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import type { CentroParada, ClasseDiametro, LocalEstoque, StatusPacote, TipoEvento } from "../src/generated/prisma/enums";
import { criarAdaptador } from "../src/lib/adaptador";
import { STATUS, dataLocalParaDate, formatarData, formatarDuracao, numeroRequisicao } from "../src/lib/constantes";
import { MODULOS_ATIVOS } from "../src/lib/permissoes";
import {
  CENTRO,
  CHECKLIST_ESTUFA,
  CLASSE_MADEIRA,
  MISTA,
  arred,
  classeDoComprimento,
  dateParaDia,
  diaParaDate,
  fmtM3,
  formatarDia,
  hojeSP,
  itensDaLinha,
  m3Pecas,
  rotuloLarguras,
} from "../src/lib/producao";
import { codigoLote, codigoPacote, codigoRomaneio, novoCodigoPublico } from "../src/lib/rastreio";
import serraria from "./dados/serraria.json";

// Mesmo driver da aplicação: no build da Vercel isto também confirma que a conexão funciona
const db = new PrismaClient({ adapter: criarAdaptador() });

const SETORES = ["Administrativo", "Produção", "Serraria", "Acabamento", "Expedição", "Manutenção"];

// Administrador inicial (só quando não existe nenhum administrador). A senha provisória vem de
// ADMIN_SENHA_INICIAL ou é sorteada e mostrada no log — nunca uma senha fixa conhecida — e precisa ser
// trocada no primeiro acesso.
const ADMIN = {
  login: "pablo.ribas",
  nome: "Pablo Ribas",
  senha: process.env.ADMIN_SENHA_INICIAL || randomBytes(9).toString("base64url"),
};

async function main() {
  // O Preview da Vercel usa o mesmo banco da produção: nada é gravado antes da revisão
  if (process.env.VERCEL_ENV === "preview") {
    console.log("Preview: seed ignorado.");
    return;
  }
  const prismaPostgres = new URL(process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "postgres://x").hostname.endsWith("prisma.io");
  // Recusa antes de qualquer escrita (mesmo critério de banco remoto de src/lib/adaptador.ts)
  if (process.env.SEED_DEMO === "1" && (process.env.VERCEL || prismaPostgres)) {
    throw new Error("SEED_DEMO só em banco local: cria usuários de exemplo com senha conhecida (teste123)");
  }
  console.log(`Banco: conectado via ${prismaPostgres ? "Prisma Postgres (serverless)" : "TCP"}, ${await db.usuario.count()} usuário(s)`);
  if ((await db.setor.count()) === 0) {
    await db.setor.createMany({ data: SETORES.map((nome) => ({ nome })) });
    console.log("Setores iniciais criados");
  }

  // Só sem nenhum ADMIN: um admin que trocou o login não faz o deploy recriar "pablo.ribas"
  const temAdmin = (await db.usuario.count({ where: { perfil: "ADMIN" } })) > 0;
  if (!temAdmin && !(await db.usuario.findUnique({ where: { login: ADMIN.login } }))) {
    await db.usuario.create({
      data: {
        login: ADMIN.login,
        nome: ADMIN.nome,
        perfil: "ADMIN",
        senhaHash: await bcrypt.hash(ADMIN.senha, 10),
        trocarSenha: true,
      },
    });
    console.log(`Admin criado: ${ADMIN.login} · senha provisória: ${process.env.ADMIN_SENHA_INICIAL ? "(a de ADMIN_SENHA_INICIAL)" : ADMIN.senha} (troca obrigatória no primeiro acesso)`);
  }

  await catalogoProducao();
  // Configuração padrão da serraria (meta e horas do boletim); ajustável em Cadastros
  await db.configSerraria.upsert({ where: { id: "padrao" }, update: {}, create: { id: "padrao", metaDiariaM3: 60, horasDia: 8.8 } });

  if (process.env.SEED_DEMO === "1") {
    await demo();
    await demoProducao();
    await demoRastreio();
    // Fluxo completo para as capturas do manual (cada parte só cria o que ainda não existe)
    await demoPedidos();
    await demoInventario();
    await demoParadas();
    await demoManutencao();
  }
}

/** Equipamentos da linha da serraria, motivos de parada e as 6 estufas (só cria o que falta). */
async function catalogoProducao() {
  // O setor só é buscado/criado quando um equipamento novo precisa dele: renomeado em /setores, não volta
  const setores = new Map<string, string>();
  const setorId = async (nome: string) => {
    if (!setores.has(nome)) setores.set(nome, ((await db.setor.findUnique({ where: { nome } })) ?? (await db.setor.create({ data: { nome } }))).id);
    return setores.get(nome)!;
  };
  const porNome = new Map<string, string>();
  let criados = 0;
  for (const [i, nome] of serraria.equipamentosLinha.entries()) {
    const codigo = `SER-L${String(i + 1).padStart(2, "0")}`;
    const existente = await db.equipamento.findFirst({ where: { OR: [{ codigo }, { nome: { equals: nome, mode: "insensitive" } }] } });
    // Banco novo: as máquinas da linha já nascem marcadas ("Máquina parou" e boletim). Nas que já existem
    // não mexe: quem tirou uma máquina da linha em Cadastros mantém a escolha.
    const eq =
      existente ??
      (await db.equipamento.create({
        data: { codigo, nome, setorId: await setorId("Serraria"), descricao: "Linha de produção da serraria", linhaSerraria: true },
      }));
    if (!existente) criados++;
    porNome.set(nome, eq.id);
  }

  const motivosExistentes = new Set((await db.motivoParada.findMany({ select: { codigo: true } })).map((m) => m.codigo));
  const novos = serraria.motivos.filter((m) => !motivosExistentes.has(m.codigo));
  if (novos.length) {
    await db.motivoParada.createMany({
      data: novos.map((m) => ({
        codigo: m.codigo,
        descricao: m.descricao,
        centro: m.centro as "MEC" | "ELE" | "OPE",
        equipamentoId: m.equipamento ? (porNome.get(m.equipamento) ?? null) : null,
      })),
    });
  }

  let estufas = 0;
  for (let n = 1; n <= 6; n++) {
    if (await db.estufa.findUnique({ where: { numero: n } })) continue;
    const nome = `Estufa ${String(n).padStart(2, "0")}`;
    const codigo = `EST-${String(n).padStart(2, "0")}`;
    const eq = (await db.equipamento.findUnique({ where: { codigo } })) ?? (await db.equipamento.create({ data: { codigo, nome, setorId: await setorId("Estufas") } }));
    const vinculado = await db.estufa.findUnique({ where: { equipamentoId: eq.id } });
    await db.estufa.create({ data: { numero: n, nome, equipamentoId: vinculado ? null : eq.id } });
    estufas++;
  }
  if (criados || novos.length || estufas) {
    console.log(`Produção: ${criados} equipamento(s) da linha, ${novos.length} motivo(s) de parada e ${estufas} estufa(s) criados`);
  }
}

async function demo() {
  const admin = await db.usuario.findFirstOrThrow({ where: { perfil: "ADMIN" }, orderBy: { criadoEm: "asc" } });
  const producao = await db.setor.findUniqueOrThrow({ where: { nome: "Produção" } });
  // O catálogo já não garante este setor (só o cria quando precisa)
  const serraria = await db.setor.upsert({ where: { nome: "Serraria" }, update: {}, create: { nome: "Serraria" } });
  const senhaHash = await bcrypt.hash("teste123", 10);

  const tecnico = await db.usuario.upsert({
    where: { login: "joao.tecnico" },
    update: {},
    create: { login: "joao.tecnico", nome: "João Técnico", perfil: "MANUTENTOR", senhaHash },
  });
  await db.usuario.upsert({
    where: { login: "ana.gerente" },
    update: {},
    create: { login: "ana.gerente", nome: "Ana Gerente", perfil: "GERENTE", senhaHash },
  });
  await db.usuario.upsert({
    where: { login: "paulo.supervisor" },
    update: {},
    create: { login: "paulo.supervisor", nome: "Paulo Supervisor", perfil: "SUPERVISOR", senhaHash },
  });
  const operador = await db.usuario.upsert({
    where: { login: "maria.operadora" },
    update: {},
    create: { login: "maria.operadora", nome: "Maria Operadora", perfil: "OPERADOR", senhaHash },
  });

  const serra = await db.equipamento.upsert({
    where: { codigo: "SER-01" },
    update: {},
    create: { codigo: "SER-01", nome: "Serra circular múltipla", setorId: serraria.id },
  });
  await db.equipamento.upsert({
    where: { codigo: "LIX-02" },
    update: {},
    create: { codigo: "LIX-02", nome: "Lixadeira de cinta", setorId: producao.id },
  });

  if ((await db.requisicao.count()) > 0) return;
  await db.requisicao.create({
    data: {
      titulo: "Serra com vibração excessiva",
      descricao: "Desde ontem a serra está vibrando muito ao cortar peças largas.",
      prioridade: "ALTA",
      solicitanteId: operador.id,
      setorId: serraria.id,
      equipamentoId: serra.id,
      historico: { create: { statusNovo: "ABERTA", usuarioId: operador.id, observacao: "Requisição aberta" } },
    },
  });
  await db.requisicao.create({
    data: {
      titulo: "Preventiva mensal do compressor",
      descricao: "Troca de óleo e verificação de filtros.",
      tipo: "PREVENTIVA",
      status: "AGENDADA",
      dataAgendada: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      solicitanteId: admin.id,
      responsavelId: tecnico.id,
      historico: {
        create: [
          { statusNovo: "ABERTA", usuarioId: admin.id, observacao: "Requisição aberta" },
          { statusAnterior: "ABERTA", statusNovo: "AGENDADA", usuarioId: tecnico.id },
        ],
      },
    },
  });
  console.log("Dados de demonstração criados (logins ana.gerente, paulo.supervisor, joao.tecnico, maria.operadora; senha teste123)");
}

/** Um mês e meio de boletins, um ciclo de estufa em secagem e um inventário antigo (só com SEED_DEMO=1). */
async function demoProducao() {
  const senhaHash = await bcrypt.hash("teste123", 10);
  const encarregado = await db.usuario.upsert({
    where: { login: "carlos.encarregado" },
    update: {},
    create: { login: "carlos.encarregado", nome: "Carlos Encarregado", perfil: "SEM_ACESSO", perfilProducao: "APONTADOR", senhaHash },
  });
  await db.usuario.update({ where: { login: "paulo.supervisor" }, data: { perfilProducao: "SUPERVISOR" } }).catch(() => null);
  // Banco de demonstração criado antes de as máquinas nascerem marcadas: sem nenhuma máquina na linha,
  // "Máquina parou" fica vazio. Marca as da linha só nesse caso (banco local; nunca roda em produção).
  if ((await db.equipamento.count({ where: { linhaSerraria: true } })) === 0) {
    const { count } = await db.equipamento.updateMany({ where: { codigo: { startsWith: "SER-L" }, estufa: null }, data: { linhaSerraria: true } });
    if (count) console.log(`Demonstração: ${count} máquina(s) marcada(s) como linha da serraria`);
  }
  if ((await db.boletimProducao.count()) > 0) return;

  const motivos = await db.motivoParada.findMany();
  let semente = 7;
  const aleatorio = () => ((semente = (semente * 16807) % 2147483647) - 1) / 2147483646;
  const hoje = new Date(Date.now() - 3 * 3600e3);
  const mes = (d: Date) => d.toISOString().slice(0, 7);
  for (const m of new Set([mes(hoje), mes(new Date(hoje.getTime() - 45 * 864e5))])) {
    await db.metaProducao.upsert({ where: { mes: m }, update: {}, create: { mes: m, metaDiariaM3: 60, horasDia: 8.8, rendimentoMeta: 0.45 } });
  }
  const bitolas = [
    [25, 100, 3000],
    [25, 125, 3000],
    [32, 150, 2700],
    [50, 100, 2400],
    [19, 85, 2100],
  ];
  const dias: Date[] = [];
  for (let i = 45; i >= 1; i--) {
    const d = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() - i));
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) dias.push(d);
  }
  for (const [indice, d] of dias.entries()) {
    const itens = bitolas.map(([e, l, c], n) => {
      const pecas = Math.round((n < 2 ? 1500 : 700) * (0.6 + aleatorio() * 0.6));
      return { tipo: "BOM" as "BOM" | "APROVEITAMENTO" | "REFUGO", mercado: "EXTERNO" as "EXTERNO" | "INTERNO", espessura: e, largura: l, comprimento: c, pecas, m3: (e * l * c * pecas) / 1e9 };
    });
    itens.push({ tipo: "APROVEITAMENTO", mercado: "INTERNO", espessura: 19, largura: 70, comprimento: 1500, pecas: Math.round(400 * aleatorio()), m3: 0 });
    itens.push({ tipo: "REFUGO", mercado: "INTERNO", espessura: 25, largura: 100, comprimento: 1000, pecas: Math.round(250 * aleatorio()), m3: 0 });
    for (const it of itens) it.m3 = (it.espessura * it.largura * it.comprimento * it.pecas) / 1e9;
    const paradas = Array.from({ length: 1 + Math.floor(aleatorio() * 4) }, () => {
      const m = motivos[Math.floor(aleatorio() * motivos.length)];
      return { motivoId: m.id, equipamentoId: m.equipamentoId, centro: m.centro, ocorrencias: 1 + Math.floor(aleatorio() * 3), minutos: 5 + Math.round(aleatorio() * 50) };
    });
    const producao = itens.reduce((s, x) => s + x.m3, 0);
    // Os últimos dias ficam só com os lotes da ficha (demoPedidos), como a serraria lança hoje
    const soLotes = indice >= dias.length - DIAS_COM_LOTES;
    await db.boletimProducao.create({
      data: {
        data: d,
        responsavelId: encarregado.id,
        metaM3: 60,
        horasProgramadas: 8.8,
        torasQtd: Math.round(producao * 7),
        torasM3: Math.round((producao / (0.4 + aleatorio() * 0.1)) * 10) / 10,
        diametroMedio: 24 + Math.round(aleatorio() * 6),
        comprimentoMedio: 3,
        itens: soLotes ? undefined : { create: itens },
        paradas: { create: paradas },
      },
    });
  }

  const estufa = await db.estufa.findUnique({ where: { numero: 1 } });
  if (estufa) {
    const entrada = new Date(Date.now() - 50 * 3600e3);
    await db.cicloSecagem.create({
      data: {
        estufaId: estufa.id,
        numero: 412,
        entrada,
        previsaoSaida: new Date(Date.now() + 70 * 3600e3),
        umidadeInicial: 62,
        plantaoId: encarregado.id,
        responsavelId: encarregado.id,
        // Ficha da madeira carregada (mesmo formato do formulário do ciclo, com as grades úmidas)
        cargas: {
          create: cargasCiclo([
            { espessura: 25, larguras: ["125", "100"], pecas: { 2500: 2600, 2100: 800, 1650: 300 }, gradesUmidas: 18 },
            { espessura: 32, larguras: ["100"], pecas: { 2500: 1400, 2100: 380 }, gradesUmidas: 6 },
          ]),
        },
        checklist: { create: checklistCiclo(encarregado.id, new Date(entrada.getTime() - 3600e3), ["A cada novo ciclo"]) },
      },
    });
  }
  // (A carga de toras de ontem vem de demoRastreio, já ligada à floresta pela colheita)
  await db.levantamentoEstoque.create({
    data: {
      data: new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() - 2)),
      tipo: "EMPACOTADA",
      responsavelId: encarregado.id,
      itens: { create: [{ espessura: 25, largura: "100", comprimento: 3, pacotes: 14, m3: 38.4 }, { espessura: 32, largura: "150", comprimento: 2.7, pacotes: 6, m3: 21.1 }] },
    },
  });
  console.log("Produção de demonstração criada (login carlos.encarregado, senha teste123)");
}

/** Florestas, colheitas, cargas ligadas aos boletins, ciclos e pacotes (só com SEED_DEMO=1). */
async function demoRastreio() {
  if ((await db.pacote.count()) > 0) return;
  const enc = await db.usuario.findUniqueOrThrow({ where: { login: "carlos.encarregado" } });
  const DIA = 864e5;
  const diaUTC = (n: number) => {
    const h = new Date(Date.now() - 3 * 3600e3);
    return new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), h.getUTCDate() - n));
  };
  const f1 = await db.origemFlorestal.create({ data: FLORESTAS_DEMO[0] });
  const f2 = await db.origemFlorestal.create({ data: FLORESTAS_DEMO[1] });
  const col = [
    await db.colheita.create({ data: { origemId: f1.id, talhao: "12B", inicio: diaUTC(60), fim: diaUTC(25), idadeAnos: 21, equipe: "Equipe de corte 1", responsavelId: enc.id } }),
    await db.colheita.create({ data: { origemId: f2.id, talhao: "3", inicio: diaUTC(24), idadeAnos: 19, equipe: "Equipe de corte 2", responsavelId: enc.id } }),
  ];
  // Uma carga a cada 3 dias, ligada à colheita do período
  const cargas = [];
  for (let n = 46; n >= 1; n -= 3) {
    const c = n > 24 ? col[0] : col[1];
    const o = n > 24 ? f1 : f2;
    cargas.push(
      await db.cargaToras.create({
        data: {
          data: diaUTC(n),
          origem: o.nome,
          talhao: c.talhao,
          colheitaId: c.id,
          placa: n % 2 ? "ABC1D23" : "XYZ9K87",
          comprimentoMedio: 3,
          responsavelId: enc.id,
          itens: { create: [18, 22, 26, 30].map((diametro, i) => ({ diametro, quantidade: [30, 55, 40, 15][i] })) },
        },
      }),
    );
  }
  // Cada boletim serrou as cargas recebidas nos 3 dias anteriores
  const boletins = await db.boletimProducao.findMany({ orderBy: { data: "asc" } });
  for (const b of boletins) {
    const usadas = cargas.filter((c) => c.data <= b.data && c.data.getTime() > b.data.getTime() - 3 * DIA);
    if (usadas.length) await db.boletimProducao.update({ where: { id: b.id }, data: { cargas: { connect: usadas.map((c) => ({ id: c.id })) } } });
  }
  // Ciclos de estufa concluídos com a madeira de 3 dias cada, e pacotes secos
  const estufas = await db.estufa.findMany({ orderBy: { numero: "asc" } });
  let numeroCiclo = 400;
  for (let i = 0; i + 3 <= boletins.length - 4; i += 3) {
    const dias = boletins.slice(i, i + 3);
    const entrada = new Date(dias[2].data.getTime() + 20 * 3600e3);
    const saida = new Date(entrada.getTime() + 96 * 3600e3);
    if (saida > new Date()) break;
    const ciclo = await db.cicloSecagem.create({
      data: {
        estufaId: estufas[(i / 3) % estufas.length].id,
        numero: numeroCiclo++,
        status: "CONCLUIDO",
        entrada,
        previsaoSaida: saida,
        saida,
        umidadeInicial: 58,
        umidadeFinal: 12,
        responsavelId: enc.id,
        cargas: { create: [{ espessura: 25, largura: "100-125", comprimento: 3, grades: 20, m3: 48 }] },
        boletins: { connect: dias.map((d) => ({ id: d.id })) },
      },
    });
    for (let k = 0; k < 4; k++) {
      const [e, l, c, pecas] = k % 2 ? [25, 125, 3000, 448] : [25, 100, 3000, 560];
      const expedido = i < 9 && k < 3;
      const criadoEm = new Date(saida.getTime() + 2 * 3600e3);
      await db.pacote.create({
        data: {
          status: expedido ? "EXPEDIDO" : "SECO",
          cicloId: ciclo.id,
          espessura: e,
          largura: l,
          comprimento: c,
          pecas,
          m3: (e * l * c * pecas) / 1e9,
          classe: k === 3 ? "2ª" : "1ª",
          mercado: "EXTERNO",
          umidade: 12,
          localizacao: "Galpão 1",
          criadoPorId: enc.id,
          criadoEm,
          ...(expedido ? { cliente: "Cliente Exemplo Ltda", notaFiscal: `${1200 + i * 4 + k}`, destino: "Porto de Paranaguá", expedidoEm: new Date(criadoEm.getTime() + 5 * DIA) } : {}),
          eventos: {
            create: [
              { tipo: "CRIADO", descricao: `Formado com a madeira seca do ciclo nº ${ciclo.numero}`, usuarioId: enc.id, criadoEm },
              ...(expedido
                ? [{ tipo: "EXPEDIDO" as const, descricao: "Expedido para Cliente Exemplo Ltda", usuarioId: enc.id, criadoEm: new Date(criadoEm.getTime() + 5 * DIA) }]
                : []),
            ],
          },
        },
      });
    }
  }
  // Pacotes verdes dos últimos dias
  for (const b of boletins.slice(-2)) {
    await db.pacote.create({
      data: {
        status: "VERDE",
        boletimId: b.id,
        espessura: 32,
        largura: 150,
        comprimento: 2700,
        pecas: 300,
        m3: (32 * 150 * 2700 * 300) / 1e9,
        localizacao: "Pátio",
        criadoPorId: enc.id,
        eventos: { create: { tipo: "CRIADO", descricao: "Formado verde com a madeira serrada no dia", usuarioId: enc.id } },
      },
    });
  }
  console.log("Rastreabilidade de demonstração criada (florestas, colheitas, cargas, ciclos e pacotes)");
}

// ======================= Demonstração: o fluxo de hoje, para as capturas do manual =======================
// Só com SEED_DEMO=1. Cada parte confere se já existe (número do pedido, título da requisição, nome do
// checklist…) e grava numa transação: rodar de novo não duplica e uma falha no meio não deixa metade.
// Usa os mesmos helpers do app (ficha → itensDaLinha, m³, códigos, datas de Brasília) e grava a
// auditoria, a linha do tempo do pacote e o histórico de status como as actions gravariam.

const DIA_MS = 864e5;
/** Últimos boletins da demonstração lançados só pela ficha (lotes dos pedidos), sem itens no formato antigo. */
const DIAS_COM_LOTES = 6;

type Tx = Prisma.TransactionClient;
type Linha = { espessura: number; larguras: string[]; pecas: Record<number, number>; gradesUmidas?: number };
type Evento = { tipo: TipoEvento; descricao: string; criadoEm: Date };

const FLORESTAS_DEMO = [
  { nome: "Fazenda Santa Rita", tipo: "TERCEIRO" as const, proprietario: "Reflorestadora Exemplo", municipio: "Cidade Exemplo", uf: "PR", especie: "Pinus taeda", anoPlantio: 2004, areaHa: 320 },
  { nome: "Floresta Própria – Área 2", tipo: "PROPRIA" as const, especie: "Pinus elliottii", anoPlantio: 2006, areaHa: 85 },
];
const FORNECEDORES_DEMO = ["Reflorestadora Exemplo Ltda", "Toras Modelo Comércio Ltda"];
const MOTORISTAS_DEMO = [
  { nome: "Sérgio Motorista", placaCaminhao: "SRG1A23", placaJulieta: "SRG4B56" },
  { nome: "Renato Motorista", placaCaminhao: "RNT2C34", placaJulieta: null },
];
const PEDIDOS_DEMO = [
  { numero: "PED-101", cliente: "Cliente Exemplo Ltda", destino: "Porto de Paranaguá – PR", volumeM3: 150, prazoDias: 12, observacoes: "Exportação – pinus seco em estufa (12%)" },
  { numero: "PED-102", cliente: "Madeireira Horizonte Exemplo S.A.", destino: "Joinville – SC", volumeM3: 120, prazoDias: 26, observacoes: "Entregas parciais combinadas com o cliente" },
  { numero: "PED-103", cliente: "Pallets Modelo Indústria Ltda", destino: "Curitiba – PR", volumeM3: 14, prazoDias: 4, observacoes: "Madeira curta para pallets" },
];

/** Linhas da ficha usadas nos lotes (espessura, larguras marcadas e peças por comprimento). */
const FICHA = {
  exp125: { espessura: 25, larguras: ["125"], pecas: { 2500: 1700, 2100: 520, 1650: 200 } },
  exp100: { espessura: 25, larguras: ["100"], pecas: { 2500: 900, 2100: 300 } },
  hor32: { espessura: 32, larguras: ["100", "85"], pecas: { 2500: 1500, 2100: 500, 1650: 200 } },
  hor38: { espessura: 38, larguras: [MISTA], pecas: { 2500: 600, 2100: 250 } },
  pal85: { espessura: 23, larguras: ["85", "50"], pecas: { 1300: 3300, 1000: 2700, 700: 1600 } },
  pal100: { espessura: 23, larguras: ["100"], pecas: { 1300: 1300 } },
} satisfies Record<string, Linha>;
/** Lotes por boletim (`dia` 0 = o boletim mais recente antes de hoje), em ordem cronológica. */
const LOTES_DEMO: { dia: number; pedido: number; linhas: Linha[]; hora: string }[] = [
  { dia: 5, pedido: 0, linhas: [FICHA.exp125, FICHA.exp100], hora: "10:40" },
  { dia: 5, pedido: 2, linhas: [FICHA.pal85, FICHA.pal100], hora: "15:20" },
  { dia: 4, pedido: 0, linhas: [FICHA.exp125, FICHA.exp100], hora: "10:15" },
  { dia: 4, pedido: 1, linhas: [FICHA.hor32, FICHA.hor38], hora: "15:45" },
  { dia: 3, pedido: 0, linhas: [FICHA.exp125], hora: "11:00" },
  { dia: 3, pedido: 1, linhas: [FICHA.hor32, FICHA.hor38], hora: "15:30" },
  { dia: 2, pedido: 1, linhas: [FICHA.hor32, FICHA.hor38], hora: "10:30" },
  { dia: 2, pedido: 0, linhas: [FICHA.exp125, FICHA.exp100], hora: "15:10" },
  { dia: 1, pedido: 0, linhas: [FICHA.exp125, FICHA.exp100], hora: "10:50" },
  { dia: 1, pedido: 1, linhas: [FICHA.hor32], hora: "15:40" },
  { dia: 0, pedido: 1, linhas: [FICHA.hor32, FICHA.hor38], hora: "10:20" },
  { dia: 0, pedido: 0, linhas: [FICHA.exp125], hora: "15:00" },
];
/** Mais ou menos madeira em cada dia (multiplica as peças). */
const FATOR_DIA = [1, 0.94, 1.08, 0.97, 1.05, 0.91];
/** Cargas de toras no formato atual (floresta, fornecedor, motorista, diâmetro e peso), uma por dia serrado. */
const CARGAS_DEMO: { dia: number; floresta: number; fornecedor: number; motorista: number; classe: ClasseDiametro; pesoT: number }[] = [
  { dia: 5, floresta: 1, fornecedor: 1, motorista: 0, classe: "MEDIA", pesoT: 30.7 },
  { dia: 4, floresta: 0, fornecedor: 0, motorista: 0, classe: "MEDIA", pesoT: 32.4 },
  { dia: 3, floresta: 1, fornecedor: 1, motorista: 1, classe: "GROSSA", pesoT: 35.8 },
  { dia: 2, floresta: 0, fornecedor: 0, motorista: 1, classe: "FINA", pesoT: 27.6 },
  { dia: 1, floresta: 0, fornecedor: 0, motorista: 0, classe: "MEDIA", pesoT: 31.9 },
  { dia: 0, floresta: 1, fornecedor: 1, motorista: 1, classe: "GROSSA", pesoT: 36.2 },
];

/** "AAAA-MM-DD" + "HH:MM" no horário de Brasília → Date (o mesmo helper dos formulários). */
const em = (dia: string, hora: string) => dataLocalParaDate(`${dia}T${hora}`)!;
const somarDias = (dia: string, n: number) => dateParaDia(new Date(diaParaDate(dia).getTime() + n * DIA_MS));
const somarMin = (d: Date, min: number) => new Date(d.getTime() + min * 60e3);
/** Horário que ainda não chegou vira "agora menos a folga": a demonstração fica sempre no passado. */
const noPassado = (d: Date, folgaMin = 30) => new Date(Math.min(d.getTime(), Date.now() - folgaMin * 60e3));

/** n-ésimo dia útil (seg–sex) antes de `dia`. */
function diaUtilAntes(dia: string, n: number) {
  let d = dia;
  for (let i = 0; i < n; ) {
    d = somarDias(d, -1);
    const semana = diaParaDate(d).getUTCDay();
    if (semana !== 0 && semana !== 6) i++;
  }
  return d;
}

/** O mesmo dia no mês anterior (31/03 → 28/02), como o plano mensal anda. */
function mesAntes(dia: string) {
  const [a, m, d] = dia.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m - 1, 0)).getUTCDate();
  return dateParaDia(new Date(Date.UTC(a, m - 2, Math.min(d, ultimo))));
}

/** Linhas da ficha → itens gravados (um por comprimento), como itensDaFicha() das actions. */
function itensDaFicha(linhas: Linha[]) {
  return linhas.flatMap((l, n) =>
    itensDaLinha(l).map((i, j) => ({ ...i, espessura: l.espessura, larguras: rotuloLarguras(l.larguras), linha: n, grades: j === 0 ? (l.gradesUmidas ?? 0) : 0 })),
  );
}

/** A mesma linha com as peças multiplicadas. */
const escala = (l: Linha, f: number): Linha => ({ ...l, pecas: Object.fromEntries(Object.entries(l.pecas).map(([mm, n]) => [mm, Math.round(n * f)])) });

/** Madeira carregada no ciclo (CargaCiclo), como salvarCiclo() grava a ficha. */
function cargasCiclo(linhas: Linha[]) {
  return itensDaFicha(linhas).map((i) => ({ espessura: i.espessura, largura: i.larguras, comprimento: i.comprimento / 1000, pecas: i.pecas, grades: i.grades, linha: i.linha, m3: i.m3 }));
}

/** Checklist da estufa (o mesmo do app), com as seções indicadas já conferidas. */
function checklistCiclo(marcadoPorId: string, marcadoEm: Date, conferidas: string[]) {
  let ordem = 0;
  return CHECKLIST_ESTUFA.flatMap((s) =>
    s.itens.map((texto) => ({ secao: s.secao, texto, ordem: ordem++, ...(conferidas.includes(s.secao) ? { conforme: true, marcadoPorId, marcadoEm } : {}) })),
  );
}

/** Auditoria com a data do fato (a action grava o mesmo registro via auditar()). */
function auditar(
  tx: Tx,
  r: { usuarioId: string | null; acao: string; entidade: string; entidadeId?: string | number | null; resumo: string; criadoEm: Date; detalhes?: Prisma.InputJsonValue },
) {
  return tx.auditoria.create({ data: { ...r, entidadeId: r.entidadeId == null ? null : String(r.entidadeId) } });
}

/** Quem recebe os avisos da serraria para supervisores (o mesmo critério de idsSerraria(["SUPERVISOR"])). */
async function supervisoresSerraria(tx: Tx) {
  if (!MODULOS_ATIVOS.includes("producao")) return [];
  const u = await tx.usuario.findMany({ where: { ativo: true, OR: [{ perfil: { in: ["ADMIN", "GERENTE"] } }, { perfilProducao: "SUPERVISOR" }] }, select: { id: true } });
  return u.map((x) => x.id);
}

async function avisar(tx: Tx, usuarios: string[], aviso: { titulo: string; mensagem: string; link: string; criadoEm: Date }) {
  if (usuarios.length) await tx.notificacao.createMany({ data: usuarios.map((usuarioId) => ({ usuarioId, ...aviso })) });
}

const porLogin = (login: string) => db.usuario.findUnique({ where: { login } });

/** Florestas, fornecedores e motoristas (cadastros da origem das toras e da expedição); só cria os que faltam. */
async function cadastrosOrigem(supervisorId: string) {
  const quando = new Date(Date.now() - 20 * DIA_MS);
  const florestas = [];
  for (const f of FLORESTAS_DEMO) florestas.push((await db.origemFlorestal.findFirst({ where: { nome: f.nome } })) ?? (await db.origemFlorestal.create({ data: f })));
  const fornecedores = [];
  for (const nome of FORNECEDORES_DEMO) {
    const ja = await db.fornecedor.findUnique({ where: { nome } });
    if (ja) {
      fornecedores.push(ja);
      continue;
    }
    fornecedores.push(
      await db.$transaction(async (tx) => {
        const novo = await tx.fornecedor.create({ data: { nome, criadoEm: quando } });
        await auditar(tx, { usuarioId: supervisorId, acao: "fornecedor.criar", entidade: "Fornecedor", entidadeId: novo.id, resumo: `Cadastrou o fornecedor ${nome}`, criadoEm: quando });
        return novo;
      }),
    );
  }
  const motoristas = [];
  for (const m of MOTORISTAS_DEMO) {
    const ja = await db.motorista.findFirst({ where: { nome: m.nome } });
    if (ja) {
      motoristas.push(ja);
      continue;
    }
    motoristas.push(
      await db.$transaction(async (tx) => {
        const novo = await tx.motorista.create({ data: { ...m, criadoEm: quando } });
        await auditar(tx, { usuarioId: supervisorId, acao: "motorista.criar", entidade: "Motorista", entidadeId: novo.id, resumo: `Cadastrou o motorista ${m.nome} (${m.placaCaminhao})`, criadoEm: quando });
        return novo;
      }),
    );
  }
  return { florestas, fornecedores, motoristas };
}

/**
 * Pedidos de clientes fictícios com a história inteira: cargas de toras (formato atual) ligadas aos
 * boletins, lotes da ficha, um ciclo de estufa concluído e outro em secagem, pacotes em todas as
 * situações (verde, na estufa, seco, expedido) e um romaneio com motorista e placas do cadastro.
 * Um dos pedidos fica pronto para expedir (com o aviso aos supervisores).
 */
async function demoPedidos() {
  if (await db.pedido.findUnique({ where: { numero: PEDIDOS_DEMO[0].numero } })) return;
  const [enc, sup] = await Promise.all([porLogin("carlos.encarregado"), porLogin("paulo.supervisor")]);
  const hoje = hojeSP();
  // B[0] = boletim mais recente antes de hoje, B[5] = o sexto
  const B = await db.boletimProducao.findMany({ where: { data: { lt: diaParaDate(hoje) } }, orderBy: { data: "desc" }, take: DIAS_COM_LOTES });
  if (!enc || !sup || B.length < DIAS_COM_LOTES) {
    console.log("Pedidos de demonstração não criados: faltam os usuários ou os boletins de demonstração");
    return;
  }
  const dia = (k: number) => dateParaDia(B[k].data);
  const origem = await cadastrosOrigem(sup.id);

  // Estufa: um ciclo concluído com a madeira de B[5] e B[4] e outro em secagem com a de B[2] e B[1],
  // cada um numa estufa sem outro ciclo no mesmo período
  const entrada1 = em(dia(4), "17:30");
  const saida1 = noPassado(somarMin(entrada1, 70 * 60), 20 * 60);
  const entrada2 = em(dia(1), "17:30");
  const [estufa1, estufa2, maior] = await Promise.all([
    db.estufa.findFirst({
      where: { ativo: true, ciclos: { none: { status: { not: "CANCELADO" }, entrada: { lt: saida1 }, OR: [{ saida: null }, { saida: { gt: entrada1 } }] } } },
      orderBy: { numero: "asc" },
    }),
    db.estufa.findFirst({ where: { ativo: true, ciclos: { none: { status: { not: "CANCELADO" }, OR: [{ saida: null }, { saida: { gt: entrada2 } }] } } }, orderBy: { numero: "asc" } }),
    db.cicloSecagem.aggregate({ _max: { numero: true } }),
  ]);
  if (!estufa1 || !estufa2 || saida1 <= entrada1) {
    console.log("Pedidos de demonstração não criados: nenhuma estufa livre para os ciclos");
    return;
  }

  await db.$transaction(
    async (tx) => {
      // ---------- Cargas de toras recebidas e serradas em cada dia ----------
      for (const c of CARGAS_DEMO) {
        const b = B[c.dia];
        const f = origem.florestas[c.floresta];
        const forn = origem.fornecedores[c.fornecedor];
        const m = origem.motoristas[c.motorista];
        const criadoEm = em(dia(c.dia), "07:40");
        const carga = await tx.cargaToras.create({
          data: {
            data: b.data,
            florestaId: f.id,
            fornecedorId: forn.id,
            motoristaId: m.id,
            classeDiametro: c.classe,
            pesoT: c.pesoT,
            comprimentoMedio: 2.6,
            origem: f.nome,
            motorista: m.nome,
            placa: m.placaCaminhao,
            placaJulieta: m.placaJulieta,
            responsavelId: enc.id,
            criadoEm,
            boletins: { connect: { id: b.id } },
          },
        });
        await auditar(tx, {
          usuarioId: enc.id,
          acao: "toras.criar",
          entidade: "CargaToras",
          entidadeId: carga.id,
          resumo: `Recebeu carga de toras: ${f.nome} · ${forn.nome} · ${c.pesoT} t (${c.classe.toLowerCase()})`,
          criadoEm,
        });
      }

      // ---------- Pedidos ----------
      const cadastroPedidos = em(somarDias(dia(5), -2), "09:00");
      const pedidos = [];
      for (const p of PEDIDOS_DEMO) {
        const { prazoDias, ...dados } = p;
        const novo = await tx.pedido.create({ data: { ...dados, prazo: diaParaDate(somarDias(hoje, prazoDias)), criadoEm: cadastroPedidos } });
        await auditar(tx, { usuarioId: sup.id, acao: "pedido.criar", entidade: "Pedido", entidadeId: novo.id, resumo: `Cadastrou o pedido ${p.numero} (${p.cliente})`, criadoEm: cadastroPedidos });
        pedidos.push(novo);
      }

      // ---------- Lotes da ficha da serraria (lancarLote) ----------
      for (const l of LOTES_DEMO) {
        const b = B[l.dia];
        const pedido = pedidos[l.pedido];
        const criadoEm = em(dia(l.dia), l.hora);
        const itens = itensDaFicha(l.linhas.map((x) => escala(x, FATOR_DIA[l.dia])));
        const espessuras = [...new Set(itens.map((i) => i.espessura))];
        const lote = await tx.lote.create({
          data: {
            boletimId: b.id,
            pedidoId: pedido.id,
            espessura: espessuras.length === 1 ? espessuras[0] : null,
            criadoPorId: enc.id,
            criadoEm,
            itens: {
              create: itens.map((i) => ({
                boletimId: b.id,
                espessura: i.espessura,
                largura: i.largura,
                larguras: i.larguras,
                comprimento: i.comprimento,
                pecas: i.pecas,
                classe: i.classe,
                linha: i.linha,
                m3: i.m3,
              })),
            },
          },
        });
        await auditar(tx, {
          usuarioId: enc.id,
          acao: "boletim.lote",
          entidade: "Lote",
          entidadeId: lote.id,
          resumo: `Lote ${codigoLote(lote.numero)}: ${espessuras.join("/")} mm, ${itens.reduce((t, i) => t + i.pecas, 0)} peças, ${arred(
            itens.reduce((t, i) => t + i.m3, 0),
            3,
          )} m³ — pedido ${pedido.numero}`,
          criadoEm,
        });
      }

      // ---------- Ciclos de estufa ----------
      const numeroBase = maior._max.numero ?? 400;
      const ficha1 = cargasCiclo([
        { espessura: 25, larguras: ["125"], pecas: { 2500: 3400, 2100: 1000, 1650: 380 }, gradesUmidas: 30 },
        { espessura: 25, larguras: ["100"], pecas: { 2500: 1700, 2100: 560 }, gradesUmidas: 10 },
        { espessura: 23, larguras: ["85", "50"], pecas: { 1300: 3000, 1000: 2450, 700: 1450 }, gradesUmidas: 9 },
      ]);
      const c1 = await tx.cicloSecagem.create({
        data: {
          estufaId: estufa1.id,
          numero: numeroBase + 1,
          status: "CONCLUIDO",
          entrada: entrada1,
          previsaoSaida: somarMin(entrada1, 72 * 60),
          saida: saida1,
          umidadeInicial: 58,
          umidadeFinal: 12,
          plantaoId: enc.id,
          responsavelId: enc.id,
          criadoEm: entrada1,
          cargas: { create: ficha1 },
          checklist: { create: checklistCiclo(enc.id, somarMin(entrada1, -40), CHECKLIST_ESTUFA.map((s) => s.secao)) },
          boletins: { connect: [B[5], B[4]].map((b) => ({ id: b.id })) },
        },
      });
      const ficha2 = cargasCiclo([
        { espessura: 25, larguras: ["125"], pecas: { 2500: 1650, 2100: 500 }, gradesUmidas: 14 },
        { espessura: 32, larguras: ["100", "85"], pecas: { 2500: 2900, 2100: 950, 1650: 380 }, gradesUmidas: 22 },
      ]);
      const c2 = await tx.cicloSecagem.create({
        data: {
          estufaId: estufa2.id,
          numero: numeroBase + 2,
          entrada: entrada2,
          previsaoSaida: new Date(Math.max(somarMin(entrada2, 96 * 60).getTime(), Date.now() + 30 * 3600e3)),
          umidadeInicial: 61,
          plantaoId: enc.id,
          responsavelId: enc.id,
          criadoEm: entrada2,
          cargas: { create: ficha2 },
          checklist: { create: checklistCiclo(enc.id, somarMin(entrada2, -40), CHECKLIST_ESTUFA.map((s) => s.secao)) },
          boletins: { connect: [B[2], B[1]].map((b) => ({ id: b.id })) },
        },
      });
      for (const [c, estufa, ficha] of [
        [c1, estufa1, ficha1],
        [c2, estufa2, ficha2],
      ] as const) {
        const volume = arred(ficha.reduce((t, x) => t + x.m3, 0), 3);
        await auditar(tx, { usuarioId: enc.id, acao: "ciclo.criar", entidade: "CicloSecagem", entidadeId: c.id, resumo: `Iniciou ciclo de secagem na ${estufa.nome} (${volume} m³)`, criadoEm: c.entrada });
      }
      await auditar(tx, { usuarioId: enc.id, acao: "ciclo.concluir", entidade: "CicloSecagem", entidadeId: c1.id, resumo: `Concluiu o ciclo da ${estufa1.nome}`, criadoEm: saida1 });

      // ---------- Romaneio da saída do caminhão (motorista e placas copiados do cadastro) ----------
      const m = origem.motoristas[0];
      const expedicao = noPassado(somarMin(saida1, 22 * 60), 120);
      const rom = await tx.romaneio.create({
        data: {
          criadoPorId: enc.id,
          motoristaId: m.id,
          motorista: m.nome,
          placa: m.placaCaminhao,
          placaJulieta: m.placaJulieta,
          notaFiscal: "4521",
          observacoes: "Carga para exportação – container 40 pés",
          criadoEm: expedicao,
        },
      });
      const saidaRomaneio = `Saída registrada no romaneio ${codigoRomaneio(rom.numero)} · NF ${rom.notaFiscal} · ${m.nome} (${[m.placaCaminhao, m.placaJulieta].filter(Boolean).join(" + ")})`;

      // ---------- Pacotes (cada mudança com o seu evento na linha do tempo) ----------
      const formadoVerde = (b: (typeof B)[number]) => `Formado verde com a madeira serrada em ${formatarDia(b.data)}`;
      const entrou = (c: typeof c1, nome: string) => ({ tipo: "ENTRADA_ESTUFA" as const, descricao: `Entrou na ${nome} (ciclo nº ${c.numero})`, criadoEm: c.entrada });
      const saiu = { tipo: "SAIDA_ESTUFA" as const, descricao: `Saiu seco da ${estufa1.nome} em ${formatarData(saida1, true)} com 12% de umidade`, criadoEm: saida1 };
      const formar = async (
        quantidade: number,
        base: { pedidoId: string; boletimId: string | null; cicloId: string | null; espessura: number; largura: number; comprimento: number; pecas: number },
        cada: (i: number) => { status: StatusPacote; eventos: Evento[]; umidade?: number; localizacao?: string; romaneioId?: string; expedidoEm?: Date },
      ) => {
        const numeros: number[] = [];
        for (let i = 0; i < quantidade; i++) {
          const { eventos, ...resto } = cada(i);
          const p = await tx.pacote.create({
            data: {
              ...base,
              ...resto,
              m3: m3Pecas(base.espessura, base.largura, base.comprimento, base.pecas),
              classe: CLASSE_MADEIRA[classeDoComprimento(base.comprimento)].label,
              mercado: "EXTERNO",
              codigoPublico: novoCodigoPublico(),
              criadoPorId: enc.id,
              criadoEm: eventos[0].criadoEm,
              eventos: { create: eventos.map((e) => ({ ...e, usuarioId: enc.id })) },
            },
            select: { id: true, numero: true },
          });
          numeros.push(p.numero);
          for (const e of eventos.slice(1)) {
            if (e.tipo === "ENTRADA_ESTUFA" || e.tipo === "MOVIMENTADO")
              await auditar(tx, {
                usuarioId: enc.id,
                acao: e.tipo === "ENTRADA_ESTUFA" ? "pacote.estufa" : "pacote.local",
                entidade: "Pacote",
                entidadeId: p.id,
                resumo: `${codigoPacote(p.numero)}: ${e.descricao}`,
                criadoEm: e.criadoEm,
              });
          }
        }
        const primeiro = cada(0).eventos[0].criadoEm;
        await auditar(tx, {
          usuarioId: enc.id,
          acao: "pacote.criar",
          entidade: "Pacote",
          resumo: `Formou ${quantidade} pacote(s) ${base.espessura}×${base.largura}×${base.comprimento} mm: ${codigoPacote(numeros[0])}${
            quantidade > 1 ? ` a ${codigoPacote(numeros[numeros.length - 1])}` : ""
          }`,
          criadoEm: primeiro,
        });
        return numeros;
      };
      const [p101, p102, p103] = pedidos;
      const exportacao = { pedidoId: p101.id, espessura: 25, largura: 125, comprimento: 2500, pecas: 448 };
      const expedido = (b: (typeof B)[number], formado: Date) => ({
        status: "EXPEDIDO" as const,
        umidade: 12,
        romaneioId: rom.id,
        expedidoEm: expedicao,
        eventos: [{ tipo: "CRIADO" as const, descricao: formadoVerde(b), criadoEm: formado }, entrou(c1, estufa1.nome), saiu, { tipo: "EXPEDIDO" as const, descricao: saidaRomaneio, criadoEm: expedicao }],
      });
      // Verdes de B[5] e B[4] → estufa → secos: 4 saíram no romaneio, 3 seguem no galpão
      const expedidos = await formar(2, { ...exportacao, boletimId: B[5].id, cicloId: c1.id }, () => expedido(B[5], em(dia(5), "16:30")));
      const movido = { tipo: "MOVIMENTADO" as const, descricao: "Movido para Galpão 2 – baia 3", criadoEm: somarMin(saida1, 60) };
      expedidos.push(
        ...(
          await formar(5, { ...exportacao, boletimId: B[4].id, cicloId: c1.id }, (i) =>
            i < 2
              ? expedido(B[4], em(dia(4), "16:20"))
              : {
                  status: "SECO",
                  umidade: 12,
                  localizacao: "Galpão 2 – baia 3",
                  eventos: [{ tipo: "CRIADO", descricao: formadoVerde(B[4]), criadoEm: em(dia(4), "16:20") }, entrou(c1, estufa1.nome), saiu, movido],
                },
          )
        ).slice(0, 2),
      );
      await auditar(tx, {
        usuarioId: enc.id,
        acao: "pacote.expedir",
        entidade: "Pacote",
        resumo: `Registrou a saída de ${expedidos.length} pacote(s) no romaneio ${codigoRomaneio(rom.numero)}`,
        detalhes: { pacotes: expedidos.map(codigoPacote) },
        criadoEm: expedicao,
      });
      // Pallets: formados já secos com a madeira do ciclo concluído, prontos para expedir
      const pallets = { pedidoId: p103.id, boletimId: null, cicloId: c1.id, espessura: 23, largura: 85, comprimento: 1300, pecas: 1377 };
      await formar(4, pallets, () => ({
        status: "SECO",
        localizacao: "Galpão 1 – expedição",
        eventos: [
          { tipo: "CRIADO", descricao: `Formado com a madeira seca da ${estufa1.nome} (ciclo nº ${c1.numero})`, criadoEm: somarMin(saida1, 180) },
          { tipo: "MOVIMENTADO", descricao: "Movido para Galpão 1 – expedição", criadoEm: somarMin(saida1, 200) },
        ],
      }));
      // Na estufa agora (ciclo em secagem) e verdes do último dia
      const estufaAgora = (b: (typeof B)[number]) => ({
        status: "EM_ESTUFA" as const,
        eventos: [{ tipo: "CRIADO" as const, descricao: formadoVerde(b), criadoEm: em(dateParaDia(b.data), "16:30") }, entrou(c2, estufa2.nome)],
      });
      await formar(2, { ...exportacao, boletimId: B[2].id, cicloId: c2.id }, () => estufaAgora(B[2]));
      const horizonte = { pedidoId: p102.id, cicloId: null, espessura: 32, largura: 100, comprimento: 2500, pecas: 420 };
      await formar(2, { ...horizonte, boletimId: B[1].id, cicloId: c2.id }, () => estufaAgora(B[1]));
      const verde = (hora: string) => ({ status: "VERDE" as const, eventos: [{ tipo: "CRIADO" as const, descricao: formadoVerde(B[0]), criadoEm: em(dia(0), hora) }] });
      await formar(2, { ...horizonte, boletimId: B[0].id }, () => verde("16:30"));
      await formar(1, { ...horizonte, boletimId: B[0].id, espessura: 38, comprimento: 2100, pecas: 380 }, () => verde("16:40"));

      // ---------- PED-103 pronto para expedir: o aviso que verificarPedidosProntos() mandaria ----------
      const seco = arred(4 * m3Pecas(pallets.espessura, pallets.largura, pallets.comprimento, pallets.pecas), 4);
      const avisadoEm = somarMin(saida1, 180);
      await tx.pedido.update({ where: { id: p103.id }, data: { prontoAvisadoEm: avisadoEm } });
      await avisar(tx, await supervisoresSerraria(tx), {
        titulo: `✅ Pedido ${p103.numero} pronto para expedir`,
        mensagem: `${p103.cliente}${p103.destino ? ` · ${p103.destino}` : ""}: ${fmtM3(seco, 2)} secos para um saldo de ${fmtM3(p103.volumeM3, 2)}.`,
        link: `/producao/pedidos/${p103.id}`,
        criadoEm: avisadoEm,
      });
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
  console.log(`Pedidos de demonstração criados (${PEDIDOS_DEMO.map((p) => p.numero).join(", ")}): cargas, lotes, ciclos, pacotes e romaneio`);
}

/** Inventário do dia no formato atual: "Madeira em" por linha da ficha (grade, pacote, estufa, verde). */
async function demoInventario() {
  if (await db.levantamentoEstoque.findFirst({ where: { itens: { some: { local: { not: null } } } } })) return;
  const enc = await porLogin("carlos.encarregado");
  if (!enc) return;
  const estufa = await db.estufa.findFirst({ where: { ciclos: { some: { status: "EM_SECAGEM" } } }, orderBy: { numero: "desc" } });
  const linhas: (Linha & { local: LocalEstoque })[] = [
    { local: "GRADE", espessura: 25, larguras: ["125"], pecas: { 2500: 900, 2100: 260 } },
    { local: "PACOTE", espessura: 25, larguras: ["100"], pecas: { 2500: 1120, 2100: 300 } },
    ...(estufa ? [{ local: "ESTUFA" as const, espessura: 32, larguras: ["100", "85"], pecas: { 2500: 1300, 2100: 420 } }] : []),
    { local: "VERDE", espessura: 38, larguras: [MISTA], pecas: { 2500: 600, 2100: 250 } },
    { local: "PACOTE", espessura: 23, larguras: ["85", "50"], pecas: { 1300: 2800, 1000: 1500 } },
  ];
  const itens = linhas.flatMap((l, n) =>
    itensDaLinha(l).map((i) => ({
      espessura: l.espessura,
      largura: rotuloLarguras(l.larguras),
      comprimento: i.comprimento / 1000,
      pecas: i.pecas,
      linha: n,
      m3: i.m3,
      local: l.local,
      estufaId: l.local === "ESTUFA" ? estufa!.id : null,
    })),
  );
  const hoje = hojeSP();
  const criadoEm = noPassado(em(hoje, "07:30"), 10);
  const espessuras = [...new Set(itens.map((i) => i.espessura))];
  const onde = [...new Set(itens.map((i) => (i.local === "ESTUFA" ? estufa!.nome : i.local.toLowerCase())))].join(", ");
  await db.$transaction(async (tx) => {
    const lev = await tx.levantamentoEstoque.create({
      data: { data: diaParaDate(hoje), local: null, estufaId: null, espessura: null, responsavelId: enc.id, criadoEm, itens: { create: itens } },
    });
    await auditar(tx, {
      usuarioId: enc.id,
      acao: "estoque.criar",
      entidade: "LevantamentoEstoque",
      entidadeId: lev.id,
      resumo: `Inventário de ${formatarDia(lev.data)}: ${onde}, ${espessuras.join("/")} mm, ${arred(
        itens.reduce((t, i) => t + i.m3, 0),
        2,
      )} m³`,
      criadoEm,
    });
  });
  console.log("Inventário de demonstração criado (Madeira em por linha)");
}

/** Máquina da linha pelo nome (ou a primeira da linha): escolha fixa, para a conferência pelo título valer. */
async function maquinaDaLinha(nome: string) {
  return (
    (await db.equipamento.findFirst({ where: { nome: { equals: nome, mode: "insensitive" }, linhaSerraria: true, ativo: true } })) ??
    (await db.equipamento.findFirst({ where: { linhaSerraria: true, ativo: true, estufa: null }, orderBy: { codigo: "asc" } }))
  );
}

/** Requisição aberta pelo "Máquina parou" (mesmo título e descrição de pararMaquina). */
function requisicaoDaParada(maquina: string, centro: CentroParada, quem: string, motivo: { codigo: number; descricao: string } | null, observacao: string | null) {
  return {
    titulo: `Máquina parada: ${maquina}${motivo ? ` — ${motivo.descricao}` : ""}`.slice(0, 120),
    descricao: [
      `Parada marcada na serraria por ${quem}.`,
      `Falha ${CENTRO[centro].label.toLowerCase()}.`,
      motivo ? `Motivo nº ${motivo.codigo} · ${motivo.descricao}.` : null,
      observacao ? `Observação: ${observacao}` : null,
      "Ao liberar a máquina (aqui ou na serraria), o tempo parado vai para o boletim do dia.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/**
 * Paradas de máquina na hora: uma já liberada no último boletim (requisição concluída pela manutenção e
 * o tempo no boletim) e uma aberta agora (requisição esperando a manutenção: "Máquinas paradas agora").
 */
async function demoParadas() {
  const [enc, tec] = await Promise.all([porLogin("carlos.encarregado"), porLogin("joao.tecnico")]);
  if (!enc || !tec) return;
  const hoje = hojeSP();
  const motivoDa = async (codigo: number, equipamentoId: string) => {
    const m = await db.motivoParada.findUnique({ where: { codigo } });
    return m && (!m.equipamentoId || m.equipamentoId === equipamentoId) ? m : null;
  };

  // ---------- Liberada: Serra Fita 5Cab Lux, 45 min no último boletim ----------
  const b0 = await db.boletimProducao.findFirst({ where: { data: { lt: diaParaDate(hoje) } }, orderBy: { data: "desc" } });
  const serra = await maquinaDaLinha("Serra Fita 5Cab Lux");
  if (b0 && serra) {
    const motivo = await motivoDa(37, serra.id);
    const req = requisicaoDaParada(serra.nome, "MEC", enc.nome, motivo, null);
    if (!(await db.requisicao.findFirst({ where: { titulo: req.titulo } }))) {
      const dia = dateParaDia(b0.data);
      const cfg = await db.configSerraria.findUnique({ where: { id: "padrao" } });
      const inicio = em(dia, "09:20");
      const fim = em(dia, "10:05");
      // Só o tempo dentro do turno entra no boletim (lancarParadaNoBoletim)
      const turno = [em(dia, cfg?.turnoInicio ?? "07:00"), em(dia, cfg?.turnoFim ?? "17:00")];
      const minutos = arred(Math.max(0, Math.min(fim.getTime(), turno[1].getTime()) - Math.max(inicio.getTime(), turno[0].getTime())) / 60e3, 1);
      const assumiu = somarMin(inicio, 8);
      const concluiu = somarMin(fim, 20);
      await db.$transaction(async (tx) => {
        const r = await tx.requisicao.create({
          data: {
            ...req,
            tipo: "CORRETIVA",
            prioridade: "ALTA",
            status: "CONCLUIDA",
            local: "Serraria",
            solicitanteId: enc.id,
            responsavelId: tec.id,
            setorId: serra.setorId,
            equipamentoId: serra.id,
            maquinaParada: true,
            paradaInicio: inicio,
            paradaFim: fim,
            dataInicio: assumiu,
            dataConclusao: concluiu,
            solucao: "Correia do cabeçote 3 trocada e tensionada; rolamento do esticador lubrificado. Testado com a linha em carga.",
            criadoEm: inicio,
            historico: {
              create: [
                { statusNovo: "ABERTA", usuarioId: enc.id, observacao: "Requisição aberta", criadoEm: inicio },
                { statusAnterior: "ABERTA", statusNovo: "EM_ANDAMENTO", usuarioId: tec.id, criadoEm: assumiu },
                { statusAnterior: "EM_ANDAMENTO", statusNovo: "EM_ANDAMENTO", usuarioId: enc.id, observacao: `Máquina liberada por ${enc.nome}`, criadoEm: fim },
                { statusAnterior: "EM_ANDAMENTO", statusNovo: "CONCLUIDA", usuarioId: tec.id, criadoEm: concluiu },
              ],
            },
            apontamentos: { create: { usuarioId: tec.id, inicio: assumiu, minutos: 50, descricao: "Troca da correia do cabeçote 3 e ajuste do esticador", criadoEm: concluiu } },
          },
        });
        const parada = await tx.paradaMaquina.create({
          data: { equipamentoId: serra.id, motivoId: motivo?.id ?? null, centro: "MEC", inicio, fim, origem: "SERRARIA", abertaPorId: enc.id, encerradaPorId: enc.id, requisicaoId: r.id, criadoEm: inicio },
        });
        if (minutos > 0)
          await tx.paradaProducao.create({
            data: {
              boletimId: b0.id,
              paradaMaquinaId: parada.id,
              motivoId: parada.motivoId,
              equipamentoId: serra.id,
              centro: "MEC",
              ocorrencias: 1,
              minutos: Math.min(minutos, b0.horasProgramadas * 60),
              requisicaoId: r.id,
            },
          });
        const num = numeroRequisicao(r.id);
        for (const a of [
          { usuarioId: enc.id, acao: "requisicao.criar", entidade: "Requisicao", entidadeId: r.id, resumo: `Abriu a requisição ${num}: ${r.titulo}`, criadoEm: inicio },
          {
            usuarioId: enc.id,
            acao: "parada.abrir",
            entidade: "ParadaMaquina",
            entidadeId: parada.id,
            resumo: `${serra.nome} parou (mecânica)${motivo ? ` — ${motivo.codigo} · ${motivo.descricao}` : ""} · requisição ${num}`,
            criadoEm: inicio,
          },
          { usuarioId: tec.id, acao: "requisicao.status", entidade: "Requisicao", entidadeId: r.id, resumo: `${num}: ${STATUS.ABERTA.label} → ${STATUS.EM_ANDAMENTO.label}`, criadoEm: assumiu },
          { usuarioId: enc.id, acao: "parada.liberar", entidade: "ParadaMaquina", entidadeId: parada.id, resumo: `${serra.nome} liberada após ${formatarDuracao((fim.getTime() - inicio.getTime()) / 60e3)}`, criadoEm: fim },
          { usuarioId: tec.id, acao: "requisicao.status", entidade: "Requisicao", entidadeId: r.id, resumo: `${num}: ${STATUS.EM_ANDAMENTO.label} → ${STATUS.CONCLUIDA.label}`, criadoEm: concluiu },
        ])
          await auditar(tx, a);
      });
      console.log(`Parada liberada de demonstração criada (${serra.nome}, boletim de ${formatarDia(b0.data)})`);
    }
  }

  // ---------- Parada agora: Refilador 1, mecânica, requisição esperando a manutenção ----------
  const refilador = await maquinaDaLinha("Refilador 1");
  if (refilador) {
    const motivo = await motivoDa(35, refilador.id);
    const observacao = "Correia da esteira de saída rasgou";
    const req = requisicaoDaParada(refilador.nome, "MEC", enc.nome, motivo, observacao);
    const jaParada = await db.paradaMaquina.findFirst({ where: { equipamentoId: refilador.id, fim: null } });
    if (!jaParada && !(await db.requisicao.findFirst({ where: { titulo: req.titulo } }))) {
      const inicio = new Date(Date.now() - 47 * 60e3);
      await db.$transaction(async (tx) => {
        const r = await tx.requisicao.create({
          data: {
            ...req,
            tipo: "CORRETIVA",
            prioridade: "ALTA",
            local: "Serraria",
            solicitanteId: enc.id,
            setorId: refilador.setorId,
            equipamentoId: refilador.id,
            maquinaParada: true,
            paradaInicio: inicio,
            criadoEm: inicio,
            historico: { create: { statusNovo: "ABERTA", usuarioId: enc.id, observacao: "Requisição aberta", criadoEm: inicio } },
          },
        });
        const parada = await tx.paradaMaquina.create({
          data: { equipamentoId: refilador.id, motivoId: motivo?.id ?? null, centro: "MEC", descricao: observacao, inicio, origem: "SERRARIA", abertaPorId: enc.id, requisicaoId: r.id, criadoEm: inicio },
        });
        const num = numeroRequisicao(r.id);
        await auditar(tx, { usuarioId: enc.id, acao: "requisicao.criar", entidade: "Requisicao", entidadeId: r.id, resumo: `Abriu a requisição ${num}: ${r.titulo}`, criadoEm: inicio });
        await auditar(tx, {
          usuarioId: enc.id,
          acao: "parada.abrir",
          entidade: "ParadaMaquina",
          entidadeId: parada.id,
          resumo: `${refilador.nome} parou (mecânica)${motivo ? ` — ${motivo.codigo} · ${motivo.descricao}` : ""} · requisição ${num}`,
          criadoEm: inicio,
        });
        // O aviso da serraria (com a Manutenção em teste, a tela não promete que ela foi avisada)
        await avisar(
          tx,
          (await supervisoresSerraria(tx)).filter((id) => id !== enc.id),
          {
            titulo: `⛔ Máquina parada · ${refilador.nome}`,
            mensagem: `${CENTRO.MEC.label}${motivo ? ` — ${motivo.descricao}` : ""} · marcada por ${enc.nome}${
              MODULOS_ATIVOS.includes("manutencao") ? ` · manutenção avisada (${num})` : " · avise a manutenção"
            }`,
            link: "/producao/paradas",
            criadoEm: inicio,
          },
        );
      });
      console.log(`Parada aberta de demonstração criada (${refilador.nome})`);
    }
  }
}

/**
 * Manutenção: checklist e planos de preventiva (com uma preventiva já feita no mês passado) e uma
 * requisição em andamento com responsável, horas e comentários.
 */
async function demoManutencao() {
  const [sup, tec, op] = await Promise.all([porLogin("paulo.supervisor"), porLogin("joao.tecnico"), porLogin("maria.operadora")]);
  if (!sup || !tec || !op) return;
  const hoje = hojeSP();
  const criados: string[] = [];

  // ---------- Checklist ----------
  const nomeChecklist = "Inspeção mensal da serra fita";
  let checklist = await db.checklistModelo.findUnique({ where: { nome: nomeChecklist }, include: { itens: { orderBy: { ordem: "asc" } } } });
  if (!checklist) {
    const itens = [
      "Conferir a tensão da lâmina",
      "Verificar o desgaste das guias e pastilhas",
      "Inspecionar volantes e borrachas",
      "Lubrificar mancais e rolamentos",
      "Testar a parada de emergência e as proteções",
      "Limpar a serragem do cabeçote",
    ];
    const quando = new Date(Date.now() - 40 * DIA_MS);
    checklist = await db.$transaction(async (tx) => {
      const novo = await tx.checklistModelo.create({
        data: { nome: nomeChecklist, itens: { create: itens.map((texto, i) => ({ texto, ordem: i + 1 })) } },
        include: { itens: { orderBy: { ordem: "asc" } } },
      });
      await auditar(tx, { usuarioId: sup.id, acao: "checklist.criar", entidade: "ChecklistModelo", entidadeId: novo.id, resumo: `Criou o checklist "${nomeChecklist}" (${itens.length} itens)`, criadoEm: quando });
      return novo;
    });
    criados.push("checklist");
  }

  // ---------- Planos de preventiva ----------
  const serra = (await maquinaDaLinha("Serra Fita 5Cab Lux")) ?? (await db.equipamento.findUnique({ where: { codigo: "SER-01" } }));
  const picador = (await maquinaDaLinha("Picador")) ?? (await db.equipamento.findUnique({ where: { codigo: "SER-01" } }));
  const proxima = somarDias(hoje, 10);
  const planos = [
    serra && {
      equipamentoId: serra.id,
      titulo: "Inspeção mensal da serra fita",
      descricao: "Tensão da lâmina, guias, volantes e lubrificação do cabeçote.",
      intervalo: 1,
      unidade: "MESES" as const,
      proximaData: em(proxima, "08:00"),
      diaDoMes: Number(proxima.slice(8, 10)),
      antecedenciaDias: 3,
      prioridade: "MEDIA" as const,
      checklistId: checklist.id,
    },
    picador && {
      equipamentoId: picador.id,
      titulo: "Lubrificação dos mancais do picador",
      descricao: "Graxa nos mancais do rotor e conferência das facas.",
      intervalo: 2,
      unidade: "SEMANAS" as const,
      proximaData: em(somarDias(hoje, 4), "07:30"),
      diaDoMes: null,
      antecedenciaDias: 1,
      prioridade: "BAIXA" as const,
      checklistId: null,
    },
  ].filter((p) => !!p);
  for (const p of planos) {
    if (await db.planoPreventivo.findFirst({ where: { titulo: p.titulo } })) continue;
    const quando = new Date(Date.now() - 40 * DIA_MS);
    await db.$transaction(async (tx) => {
      const plano = await tx.planoPreventivo.create({ data: { ...p, responsavelId: tec.id, criadoPorId: sup.id, criadoEm: quando } });
      await auditar(tx, { usuarioId: sup.id, acao: "plano.criar", entidade: "PlanoPreventivo", entidadeId: plano.id, resumo: `Criou o plano de preventiva "${plano.titulo}"`, criadoEm: quando });
    });
    criados.push(`plano "${p.titulo}"`);
  }

  // ---------- Preventiva do mês passado, gerada pelo plano e concluída no dia (com o checklist feito) ----------
  const planoSerra = await db.planoPreventivo.findFirst({
    where: { titulo: "Inspeção mensal da serra fita" },
    include: { equipamento: true, checklist: { include: { itens: { orderBy: { ordem: "asc" } } } } },
  });
  if (planoSerra && (await db.requisicao.count({ where: { planoId: planoSerra.id } })) === 0) {
    const agendada = em(mesAntes(dateParaDia(new Date(planoSerra.proximaData.getTime() - 3 * 3600e3))), "08:00");
    const gerada = somarMin(agendada, -planoSerra.antecedenciaDias * 24 * 60);
    const inicio = somarMin(agendada, 25);
    const conclusao = somarMin(agendada, 150);
    await db.$transaction(async (tx) => {
      const r = await tx.requisicao.create({
        data: {
          titulo: `Preventiva: ${planoSerra.titulo}`,
          descricao: planoSerra.descricao || `Manutenção preventiva do equipamento ${planoSerra.equipamento.codigo} – ${planoSerra.equipamento.nome}.`,
          tipo: "PREVENTIVA",
          status: "CONCLUIDA",
          prioridade: planoSerra.prioridade,
          dataAgendada: agendada,
          dataInicio: inicio,
          dataConclusao: conclusao,
          solucao: "Lâmina tensionada, guias ajustadas e mancais lubrificados. Sem desgaste fora do normal.",
          equipamentoId: planoSerra.equipamentoId,
          setorId: planoSerra.equipamento.setorId,
          solicitanteId: planoSerra.criadoPorId,
          responsavelId: planoSerra.responsavelId,
          planoId: planoSerra.id,
          criadoEm: gerada,
          historico: {
            create: [
              { statusNovo: "AGENDADA", usuarioId: planoSerra.criadoPorId, observacao: `Gerada automaticamente pelo plano de preventiva "${planoSerra.titulo}"`, criadoEm: gerada },
              { statusAnterior: "AGENDADA", statusNovo: "EM_ANDAMENTO", usuarioId: tec.id, criadoEm: inicio },
              { statusAnterior: "EM_ANDAMENTO", statusNovo: "CONCLUIDA", usuarioId: tec.id, criadoEm: conclusao },
            ],
          },
          checklist: planoSerra.checklist
            ? { create: planoSerra.checklist.itens.map((i, n) => ({ texto: i.texto, ordem: i.ordem, feito: true, feitoPorId: tec.id, feitoEm: somarMin(inicio, 15 + n * 18) })) }
            : undefined,
          apontamentos: { create: { usuarioId: tec.id, inicio, minutos: 125, descricao: "Inspeção e lubrificação conforme o checklist", criadoEm: conclusao } },
        },
      });
      const num = numeroRequisicao(r.id);
      await auditar(tx, {
        usuarioId: null,
        acao: "preventiva.gerar",
        entidade: "Requisicao",
        entidadeId: r.id,
        resumo: `Preventiva ${num} gerada pelo plano "${planoSerra.titulo}" para ${formatarData(agendada, true)}`,
        criadoEm: gerada,
      });
      await auditar(tx, { usuarioId: tec.id, acao: "requisicao.status", entidade: "Requisicao", entidadeId: r.id, resumo: `${num}: ${STATUS.AGENDADA.label} → ${STATUS.EM_ANDAMENTO.label}`, criadoEm: inicio });
      await auditar(tx, { usuarioId: tec.id, acao: "requisicao.status", entidade: "Requisicao", entidadeId: r.id, resumo: `${num}: ${STATUS.EM_ANDAMENTO.label} → ${STATUS.CONCLUIDA.label}`, criadoEm: conclusao });
    });
    criados.push("preventiva concluída");
  }

  // ---------- Requisição em andamento: responsável, horas e comentários ----------
  const titulo = "Ruído no rolamento do picador";
  if (picador && !(await db.requisicao.findFirst({ where: { titulo } }))) {
    const aberta = em(diaUtilAntes(hoje, 2), "09:15");
    const assumida = em(diaUtilAntes(hoje, 1), "13:40");
    const comentarios = [
      { autorId: tec.id, texto: "Rolamento 6310 do lado do motor com folga. Pedi a peça ao almoxarifado; a troca fica para amanhã cedo, antes de ligar a linha.", criadoEm: somarMin(assumida, 110) },
      { autorId: op.id, texto: "Combinado. Aviso o encarregado para começar o dia pelo refilador.", criadoEm: somarMin(assumida, 145) },
    ];
    await db.$transaction(async (tx) => {
      const r = await tx.requisicao.create({
        data: {
          titulo,
          descricao: "O picador está com barulho de rolamento do lado do motor desde a semana passada. Ainda funciona, mas o ruído está aumentando.",
          tipo: "CORRETIVA",
          prioridade: "MEDIA",
          status: "EM_ANDAMENTO",
          local: "Serraria – picador",
          solicitanteId: op.id,
          responsavelId: tec.id,
          setorId: picador.setorId,
          equipamentoId: picador.id,
          dataInicio: assumida,
          criadoEm: aberta,
          historico: {
            create: [
              { statusNovo: "ABERTA", usuarioId: op.id, observacao: "Requisição aberta", criadoEm: aberta },
              { statusAnterior: "ABERTA", statusNovo: "EM_ANDAMENTO", usuarioId: tec.id, observacao: "Vou abrir a proteção para ver o rolamento.", criadoEm: assumida },
            ],
          },
          apontamentos: { create: { usuarioId: tec.id, inicio: assumida, minutos: 95, descricao: "Abertura da proteção e inspeção dos rolamentos", criadoEm: somarMin(assumida, 100) } },
          comentarios: { create: comentarios },
        },
      });
      const num = numeroRequisicao(r.id);
      await auditar(tx, { usuarioId: op.id, acao: "requisicao.criar", entidade: "Requisicao", entidadeId: r.id, resumo: `Abriu a requisição ${num}: ${titulo}`, criadoEm: aberta });
      await auditar(tx, { usuarioId: tec.id, acao: "requisicao.status", entidade: "Requisicao", entidadeId: r.id, resumo: `${num}: ${STATUS.ABERTA.label} → ${STATUS.EM_ANDAMENTO.label}`, criadoEm: assumida });
      await auditar(tx, { usuarioId: tec.id, acao: "requisicao.horas", entidade: "Requisicao", entidadeId: r.id, resumo: `Lançou ${formatarDuracao(95)} em ${num}`, criadoEm: somarMin(assumida, 100) });
      for (const c of comentarios) await auditar(tx, { usuarioId: c.autorId, acao: "requisicao.comentar", entidade: "Requisicao", entidadeId: r.id, resumo: `Comentou em ${num}`, criadoEm: c.criadoEm });
    });
    criados.push("requisição em andamento");
  }
  if (criados.length) console.log(`Manutenção de demonstração: ${criados.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
