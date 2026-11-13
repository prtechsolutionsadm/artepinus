import { modulosDe, pode, podeProducao, type Modulo, type UsuarioComPerfis } from "@/lib/permissoes";

export type IconeMenu =
  | "inicio"
  | "requisicoes"
  | "nova"
  | "agenda"
  | "relatorios"
  | "indicadores"
  | "equipamentos"
  | "preventivas"
  | "checklists"
  | "usuarios"
  | "setores"
  | "auditoria"
  | "perfil"
  | "notificacoes"
  | "ajuda"
  | "painel"
  | "boletins"
  | "estufas"
  | "toras"
  | "estoque"
  | "cadastrosProducao"
  | "pacotes"
  | "escanear"
  | "florestas"
  | "paradas"
  | "romaneios"
  | "pedidos"
  | "disponivel"
  | "tv"
  | "buscar"
  | "modulos"
  | "serraria"
  | "manutencao"
  | "seguranca"
  | "novidades";

/**
 * `etapa`: posição no processo (1 = toras … 4 = pacote). `descricao`: uma linha simples, sem jargão,
 * mostrada embaixo do nome nos cartões de atalho (telas iniciais e "Mais").
 */
export type ItemNav = { href: string; label: string; icone: IconeMenu; descricao?: string; etapa?: number };
export type GrupoNav = { titulo: string; itens: ItemNav[] };

export const TITULO_CONTA = "Conta";

const CONTA: GrupoNav = {
  titulo: TITULO_CONTA,
  itens: [
    { href: "/notificacoes", label: "Notificações", icone: "notificacoes", descricao: "Os avisos do sistema para você" },
    { href: "/perfil", label: "Meu perfil", icone: "perfil", descricao: "Seus dados, senha, tema e avisos no celular" },
    { href: "/ajuda", label: "Manual do usuário", icone: "ajuda", descricao: "Como usar cada tela e roteiros para imprimir" },
  ],
};

function menuManutencao(u: UsuarioComPerfis): GrupoNav[] {
  const perfil = u.perfil;
  const se = (cond: boolean, item: ItemNav) => (cond ? [item] : []);
  return [
    // Início sem título (é o logo do topo e a aba Início do celular; não vira cartão), como na Serraria
    { titulo: "", itens: [{ href: "/manutencao", label: "Início", icone: "inicio", descricao: "O que precisa de atenção na manutenção" }] },
    {
      titulo: "Operação",
      itens: [
        { href: "/requisicoes", label: "Requisições", icone: "requisicoes", descricao: "Pedidos de conserto e o andamento de cada um" },
        { href: "/agenda", label: "Agenda", icone: "agenda", descricao: "Serviços marcados, dia a dia" },
      ],
    },
    {
      titulo: "Gestão",
      itens: [
        ...se(pode(perfil, "relatorios"), { href: "/indicadores", label: "Indicadores", icone: "indicadores", descricao: "Números e gráficos da manutenção" }),
        ...se(pode(perfil, "relatorios"), { href: "/relatorios", label: "Relatórios", icone: "relatorios", descricao: "Requisições por período, em PDF ou Excel" }),
        ...se(pode(perfil, "auditoria"), { href: "/auditoria", label: "Auditoria", icone: "auditoria", descricao: "Quem fez o quê no sistema, e quando" }),
      ],
    },
    {
      titulo: "Cadastros",
      itens: [
        ...se(pode(perfil, "equipamentos"), { href: "/equipamentos", label: "Equipamentos", icone: "equipamentos", descricao: "Máquinas da fábrica, ficha, histórico e QR" }),
        ...se(pode(perfil, "preventivas"), { href: "/preventivas", label: "Preventivas", icone: "preventivas", descricao: "Manutenções programadas de cada máquina" }),
        ...se(pode(perfil, "preventivas"), { href: "/checklists", label: "Checklists", icone: "checklists", descricao: "Listas de verificação usadas nos serviços" }),
        ...se(pode(perfil, "usuarios"), { href: "/usuarios", label: "Usuários", icone: "usuarios", descricao: "Quem usa o sistema e o que cada um pode fazer" }),
        ...se(pode(perfil, "setores"), { href: "/setores", label: "Setores", icone: "setores", descricao: "Setores da fábrica" }),
      ],
    },
    CONTA,
  ];
}

function menuProducao(u: UsuarioComPerfis): GrupoNav[] {
  const se = (cond: boolean, item: ItemNav) => (cond ? [item] : []);
  return [
    { titulo: "", itens: [{ href: "/producao", label: "Início", icone: "inicio", descricao: "O que precisa de atenção na serraria" }] },
    {
      // Na ordem do processo: da tora ao pacote
      titulo: "Operação",
      itens: [
        { href: "/producao/toras", label: "Recebimento de toras", icone: "toras", descricao: "Cargas de toras que chegam ao pátio", etapa: 1 },
        { href: "/producao/boletins", label: "Serraria", icone: "boletins", descricao: "Apontamento do dia: lotes serrados, paradas e toras", etapa: 2 },
        { href: "/producao/paradas", label: "Paradas de máquina", icone: "paradas", descricao: "Máquina parou? Marque na hora e avise a manutenção" },
        { href: "/producao/estufas", label: "Estufas", icone: "estufas", descricao: "Secagem da madeira em cada estufa", etapa: 3 },
        { href: "/producao/pacotes", label: "Pacotes e expedição", icone: "pacotes", descricao: "Montar pacotes, etiquetas QR e saída de cargas", etapa: 4 },
        { href: "/producao/romaneios", label: "Romaneios", icone: "romaneios", descricao: "O documento de cada carga que saiu" },
        { href: "/producao/escanear", label: "Ler etiqueta", icone: "escanear", descricao: "Aponte a câmera para o QR de um pacote ou lote" },
      ],
    },
    {
      titulo: "Gestão",
      itens: [
        { href: "/producao/pedidos", label: "Pedidos", icone: "pedidos", descricao: "Pedidos dos clientes e quanto falta de cada um" },
        { href: "/producao/disponivel", label: "Disponível para venda", icone: "disponivel", descricao: "Madeira em estoque que ainda não tem pedido" },
        { href: "/producao/indicadores", label: "Indicadores", icone: "indicadores", descricao: "Volume serrado, metas e gráficos do mês" },
        { href: "/tv", label: "Painel para TV", icone: "tv", descricao: "Tela grande para deixar na TV da fábrica" },
        { href: "/producao/estoque", label: "Inventário de madeira", icone: "estoque", descricao: "Contagem da madeira na grade, nas estufas e no pátio" },
      ],
    },
    {
      titulo: "Cadastros",
      itens: [
        ...se(podeProducao(u, "gerir"), { href: "/producao/cadastros", label: "Cadastros", icone: "cadastrosProducao", descricao: "Florestas, fornecedores, motoristas, estufas e metas" }),
        ...se(pode(u.perfil, "usuarios"), { href: "/usuarios", label: "Usuários", icone: "usuarios", descricao: "Quem usa o sistema e o que cada um pode fazer" }),
        ...se(pode(u.perfil, "auditoria"), { href: "/auditoria", label: "Auditoria", icone: "auditoria", descricao: "Quem fez o quê no sistema, e quando" }),
      ],
    },
    CONTA,
  ];
}

/** Menus de cada módulo a que o usuário tem acesso. */
export function menusDoUsuario(u: UsuarioComPerfis): Partial<Record<Modulo, GrupoNav[]>> {
  const menus: Partial<Record<Modulo, GrupoNav[]>> = {};
  for (const m of modulosDe(u)) {
    menus[m] = (m === "manutencao" ? menuManutencao(u) : menuProducao(u)).filter((g) => g.itens.length > 0);
  }
  return menus;
}

export const COOKIE_MODULO = "modulo";

/** Lê o módulo salvo no cookie (último módulo visitado). */
export function moduloSalvo(valor: string | undefined): Modulo | null {
  return valor === "manutencao" || valor === "producao" ? valor : null;
}

/** Módulo da página atual; null nas páginas comuns (perfil, notificações, manual, usuários…). */
export function moduloDaRota(path: string): Modulo | null {
  if (path === "/producao" || path.startsWith("/producao/")) return "producao";
  const comuns = ["/notificacoes", "/perfil", "/ajuda", "/menu", "/usuarios", "/auditoria", "/sistema", "/administracao"];
  if (comuns.some((c) => path === c || path.startsWith(c + "/"))) return null;
  return "manutencao";
}

/** Item ativo: "/" só na raiz; os demais pelo prefixo, sem confundir /requisicoes com /requisicoes/nova. */
export function itemAtivo(path: string, href: string) {
  if (href === "/manutencao" || href === "/producao") return path === href;
  if (href === "/producao/boletins" && path.startsWith("/producao/boletins/novo")) return false;
  if (href === "/requisicoes" && path.startsWith("/requisicoes/nova")) return false;
  return path === href || path.startsWith(href + "/");
}

export function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}
