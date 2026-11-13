"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFecharAoClicarFora } from "@/components/useFecharAoClicarFora";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronDown, ChevronRight, ClipboardList, Flame, House, LayoutGrid, Package, PanelLeftClose, PanelLeftOpen, Plus, QrCode, Search, UserRound, type LucideIcon } from "lucide-react";
import { BotaoAjuda } from "@/components/ajuda/BotaoAjuda";
import { BotaoSair } from "@/components/BotaoSair";
import { ICONES } from "@/components/icones";
import { Sininho } from "@/components/Sininho";
import { BotaoTema } from "@/components/Tema";
import { COOKIE_MODULO, TITULO_CONTA, iniciais, itemAtivo, moduloDaRota, type GrupoNav, type ItemNav } from "@/lib/menu";
import { MODULOS, type Modulo } from "@/lib/permissoes";

type Usuario = { nome: string; perfilLabel: string };
export type Menus = Partial<Record<Modulo, GrupoNav[]>>;

/**
 * Módulo em uso: o da rota atual; nas páginas comuns (perfil, manual…) continua
 * o último módulo visitado (guardado em cookie para o servidor já renderizar certo).
 */
function useModulo(menus: Menus, salvo: Modulo | null): Modulo {
  const path = usePathname();
  const disponiveis = Object.keys(menus) as Modulo[];
  const daRota = moduloDaRota(path);
  const [ultimo, setUltimo] = useState<Modulo | null>(salvo);

  useEffect(() => {
    if (!daRota) return;
    setUltimo(daRota);
    document.cookie = `${COOKIE_MODULO}=${daRota}; path=/; max-age=31536000; samesite=lax`;
  }, [daRota]);

  const escolhido = daRota ?? ultimo;
  return escolhido && disponiveis.includes(escolhido) ? escolhido : disponiveis[0];
}




/** Pais que não são telas: sobe mais um nível (ex.: /producao/estufas/ciclos/5 → Estufas). */
const PAIS: Record<string, string> = {
  "/producao/estufas/ciclos": "/producao/estufas",
  "/producao/lotes": "/producao/boletins",
  "/ajuda/tela": "/ajuda",
  "/q": "",
};

/** Telas que voltam para a tela de início (/sistema), e não para o início do módulo. */
const VOLTAM_AO_SISTEMA = ["/administracao", "/usuarios", "/auditoria"];

/** Tela de cima da atual (detalhe → lista → início do módulo); as telas comuns voltam ao início do módulo. */
function telaDeCima(path: string, inicio: string) {
  if (VOLTAM_AO_SISTEMA.includes(path)) return path === "/administracao" ? "/sistema" : "/administracao";
  const acima = path.replace(/\/[^/]*$/, "");
  const pai = PAIS[acima] ?? acima;
  return pai && pai !== "/" ? pai : inicio;
}

/** Usuário no topo do computador (iniciais + primeiro nome ▾): só Meu perfil e Sair. */
function MenuUsuario({ usuario, sair, usuarioId }: { usuario: Usuario; sair: () => Promise<void>; usuarioId: string }) {
  const path = usePathname();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const fechar = useCallback(() => setAberto(false), []);
  useFecharAoClicarFora(aberto, caixa, fechar);
  useEffect(() => setAberto(false), [path]);
  const primeiro = usuario.nome.trim().split(/\s+/)[0];
  return (
    <div ref={caixa} className="relative ml-1 hidden lg:block">
      <button
        type="button"
        aria-label={`Menu do usuário: ${usuario.nome}`}
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-stone-100"
      >
        <span className="fundo-marca grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white">{iniciais(usuario.nome)}</span>
        <span className="max-w-[8rem] truncate text-sm font-semibold text-stone-800">{primeiro}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-stone-400 transition ${aberto ? "rotate-180" : ""}`} />
      </button>
      {aberto && (
        <div className="absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-2xl border border-stone-200 bg-white py-1 text-stone-700 shadow-xl">
          <div className="border-b border-stone-100 px-4 py-3">
            <div className="truncate text-sm font-semibold text-stone-900">{usuario.nome}</div>
            {usuario.perfilLabel && <div className="text-xs text-stone-500">{usuario.perfilLabel}</div>}
          </div>
          {/* Tema, ajuda, avisos e módulos já são os ícones ao lado */}
          <Link href="/perfil" className="flex items-center gap-3 px-4 py-2 text-sm font-medium hover:bg-stone-50">
            <UserRound className="h-4 w-4 text-stone-400" /> Meu perfil
          </Link>
          <div className="my-1 border-t border-stone-100" />
          <BotaoSair sair={sair} usuarioId={usuarioId} variante="item" />
        </div>
      )}
    </div>
  );
}

/**
 * Topo do sistema (um só, para celular e computador), no centro da tela como o conteúdo.
 * Computador: logo (início do módulo) e "← Voltar" (fora das telas iniciais) · busca no meio ·
 * módulos, tema, ajuda, avisos e o usuário (Meu perfil / Sair) à direita.
 * Celular: logo · lupa, tema, ajuda, avisos e o avatar (Meu perfil); o resto fica na barra de baixo.
 */
export function TopoApp({
  menus,
  salvo,
  usuario,
  sair,
  usuarioId,
  naoLidas,
  mostrarModulos,
  semMenuLateral = false,
}: {
  menus: Menus;
  salvo: Modulo | null;
  usuario: Usuario;
  sair: () => Promise<void>;
  usuarioId: string;
  naoLidas: number;
  /** Botão "Módulos" (/sistema): para quem usa mais de um módulo ou administra usuários/auditoria. */
  mostrarModulos: boolean;
  /** Telas sem o menu lateral (ex.: /sistema): o logo fica no topo também no computador. */
  semMenuLateral?: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const modulo = useModulo(menus, salvo);
  const inicio = MODULOS[modulo].inicio;
  const naInicio = path === "/sistema" || Object.values(MODULOS).some((m) => m.inicio === path);
  const destino = telaDeCima(path, inicio);

  // Tela anterior dentro do sistema: se for a de cima, o Voltar usa o histórico (mantém filtros e rolagem)
  const atual = useRef(path);
  const anterior = useRef<string | null>(null);
  useEffect(() => {
    if (atual.current === path) return;
    anterior.current = atual.current;
    atual.current = path;
  }, [path]);

  return (
    <header className="nao-imprimir sticky top-0 z-20 border-b border-stone-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      {/* Largura total: logo/Voltar encostados à esquerda e os ícones à direita (pedido do cliente) */}
      <div className={`flex h-14 w-full items-center gap-2 px-4 sm:px-6 lg:grid lg:h-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)_minmax(0,1fr)] lg:gap-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,21rem)_minmax(0,1fr)]`}>
        <div className="flex min-w-0 items-center gap-4">
          <Link href={inicio} aria-label={`Artepinus: início da ${MODULOS[modulo].nome}`} className={`shrink-0 rounded-md ${semMenuLateral ? "" : "lg:hidden"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="h-9 w-auto dark:hidden lg:h-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-branco.svg" alt="" className="hidden h-9 w-auto dark:block lg:h-10" />
          </Link>
          {!naInicio && (
            <>
                            <Link
                href={destino}
                onClick={(e) => {
                  if (anterior.current !== destino || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  router.back();
                }}
                className="hidden items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 lg:inline-flex"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Link>
            </>
          )}
        </div>

        <div className="hidden lg:block">
          <BuscaTopo menus={menus} salvo={salvo} />
        </div>

        <div className="ml-auto flex items-center lg:gap-1 lg:justify-self-end xl:gap-1.5">
          <BuscaTopo menus={menus} salvo={salvo} celular />
          {mostrarModulos && (
            <Link href="/sistema" aria-label="Módulos" title="Ver os módulos" className="hidden h-10 w-10 shrink-0 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 lg:grid">
              <LayoutGrid className="h-5 w-5" />
            </Link>
          )}
          <BotaoTema />
          <BotaoAjuda />
          <Sininho naoLidasInicial={naoLidas} />
          <MenuUsuario usuario={usuario} sair={sair} usuarioId={usuarioId} />
          <Link
            href="/perfil"
            aria-label="Meu perfil"
            className="ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marca-100 text-xs font-semibold text-marca-700 lg:hidden"
          >
            {iniciais(usuario.nome)}
          </Link>
        </div>
      </div>
    </header>
  );
}


const CHAVE_MENU = "artepinus:menu";

/** Antes de pintar a tela: aplica o menu lateral recolhido, se a pessoa deixou assim (sem piscar). */
export const SCRIPT_MENU = `try{if(localStorage.getItem("${CHAVE_MENU}")==="recolhido")document.documentElement.dataset.menu="recolhido"}catch(_){}`;

/** Recolhe ou abre o menu lateral (só ícones) e lembra a escolha neste aparelho. */
function BotaoRecolher() {
  const [recolhido, setRecolhido] = useState(false);
  useEffect(() => setRecolhido(document.documentElement.dataset.menu === "recolhido"), []);
  const alternar = () => {
    const novo = !recolhido;
    setRecolhido(novo);
    if (novo) document.documentElement.dataset.menu = "recolhido";
    else delete document.documentElement.dataset.menu;
    try {
      if (novo) localStorage.setItem(CHAVE_MENU, "recolhido");
      else localStorage.removeItem(CHAVE_MENU);
    } catch {}
  };
  const Icone = recolhido ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={recolhido ? "Abrir o menu" : "Recolher o menu"}
      title={recolhido ? "Abrir o menu" : "Recolher o menu"}
      className="mx-3 mb-1 flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
    >
      <Icone className="h-[18px] w-[18px] shrink-0" />
      <span className="menu-texto truncate">Recolher menu</span>
    </button>
  );
}

/**
 * Menu lateral do computador, enxuto: só as telas do módulo em uso (Início e os grupos do processo).
 * Perfil, avisos, ajuda, tema e Sair ficam no topo; a troca de módulo, no rodapé.
 */
export function MenuLateral({ menus, salvo }: { menus: Menus; salvo: Modulo | null }) {
  const path = usePathname();
  const modulo = useModulo(menus, salvo);
  const inicio = MODULOS[modulo].inicio;
  const grupos = (menus[modulo] ?? []).filter((g) => g.titulo && g.titulo !== TITULO_CONTA);
  // Item ativo: o de prefixo mais longo (ex.: /producao/boletins/novo não acende Serraria e Apontar juntos)
  const ativo = grupos
    .flatMap((g) => g.itens)
    .filter((i) => itemAtivo(path, i.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const outros = Object.keys(menus).length > 1;

  const item = (i: ItemNav, ligado: boolean) => {
    const Icone = ICONES[i.icone];
    return (
      <Link
        key={i.href}
        href={i.href}
        aria-current={ligado ? "page" : undefined}
        title={i.label}
        className={`group flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
          ligado ? "bg-marca-50 text-marca-800" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        }`}
      >
        <Icone className={`h-[18px] w-[18px] shrink-0 ${ligado ? "text-marca-700" : "text-stone-400 group-hover:text-stone-600"}`} strokeWidth={2} />
        <span className="menu-texto min-w-0 flex-1 truncate">{i.label}</span>
      </Link>
    );
  };

  return (
    <aside className="nao-imprimir fixed inset-y-0 left-0 z-30 hidden w-[var(--largura-menu)] flex-col border-r border-stone-200 bg-white transition-[width] duration-200 lg:flex">
      <Link href={inicio} className="flex h-16 shrink-0 items-center px-5" aria-label={`Artepinus: início da ${MODULOS[modulo].nome}`}>
        <span className="menu-texto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-10 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-branco.svg" alt="" className="hidden h-10 w-auto dark:block" />
        </span>
        <span className="menu-so-icone">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marca.svg" alt="" className="h-7 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marca-branca.svg" alt="" className="hidden h-7 w-auto dark:block" />
        </span>
      </Link>
      <nav aria-label="Menu principal" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <div className="mt-2">{item({ href: inicio, label: "Início", icone: "inicio" }, path === inicio)}</div>
        {grupos.map((g) => (
          <div key={g.titulo}>
            <p className="menu-texto mb-1 mt-5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-400">{g.titulo}</p>
            <hr className="menu-so-icone mx-2 my-3 border-stone-200" />
            <div className="space-y-0.5">{g.itens.map((i) => item(i, i.href === ativo))}</div>
          </div>
        ))}
      </nav>
      <BotaoRecolher />
      <Link href="/sistema" title={`${MODULOS[modulo].nome} · ${outros ? "trocar de módulo" : "tela de início"}`} className="m-3 mt-1 flex items-center gap-3 rounded-xl bg-stone-50 px-2 py-2 ring-1 ring-stone-200 transition hover:bg-stone-100">
        <span className="fundo-marca grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white">
          <LayoutGrid className="h-4 w-4" />
        </span>
        <span className="menu-texto min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-semibold text-stone-900">{MODULOS[modulo].nome}</span>
          <span className="block truncate text-[11px] text-stone-500">{outros ? "Trocar de módulo" : "Tela de início"}</span>
        </span>
        <ChevronRight className="menu-texto h-4 w-4 shrink-0 text-stone-400" />
      </Link>
    </aside>
  );
}

type Aba = { href: string; label: string; Icone: LucideIcon; destaque?: boolean };

const ABAS: Record<Modulo, Aba[]> = {
  manutencao: [
    { href: "/manutencao", label: "Início", Icone: House },
    { href: "/requisicoes", label: "Requisições", Icone: ClipboardList },
    { href: "/requisicoes/nova", label: "Nova requisição", Icone: Plus, destaque: true },
    { href: "/agenda", label: "Agenda", Icone: CalendarDays },
    { href: "/menu", label: "Mais", Icone: LayoutGrid },
  ],
  producao: [
    { href: "/producao", label: "Início", Icone: House },
    { href: "/producao/pacotes", label: "Pacotes", Icone: Package },
    { href: "/producao/escanear", label: "Ler etiqueta", Icone: QrCode, destaque: true },
    { href: "/producao/estufas", label: "Estufas", Icone: Flame },
    { href: "/menu", label: "Mais", Icone: LayoutGrid },
  ],
};

export function BarraInferior({ menus, salvo }: { menus: Menus; salvo: Modulo | null }) {
  const path = usePathname();
  const modulo = useModulo(menus, salvo);
  const abas = ABAS[modulo];
  const foraDasAbas = (menus[modulo] ?? []).flatMap((g) => g.itens).some((i) => !abas.some((a) => a.href === i.href) && itemAtivo(path, i.href));
  return (
    <nav className="nao-imprimir fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {abas.map(({ href, label, Icone, destaque }) => {
          const on = href === "/menu" ? path === "/menu" || foraDasAbas : itemAtivo(path, href);
          if (destaque) {
            return (
              <li key={href} className="flex justify-center">
                <Link
                  href={href}
                  aria-label={label}
                  className="-mt-4 grid h-13 w-13 place-items-center rounded-full bg-marca-700 text-white shadow-lg shadow-marca-900/30 ring-4 ring-white active:scale-95"
                >
                  <Icone className="h-6 w-6" strokeWidth={2.5} />
                </Link>
              </li>
            );
          }
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium ${on ? "text-marca-700" : "text-stone-500"}`}
              >
                <Icone className="h-[22px] w-[22px]" strokeWidth={on ? 2.4 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Busca no meio do topo (computador, atalho "/") e lupa do topo (celular e tablet): na Serraria vai para
 * /producao/buscar (pacote, lote, carga…); na Manutenção, para /requisicoes. */
export function BuscaTopo({ menus, salvo, celular = false }: { menus: Menus; salvo: Modulo | null; celular?: boolean }) {
  const modulo = useModulo(menus, salvo);
  const serraria = modulo === "producao";
  const destino = serraria ? "/producao/buscar" : "/requisicoes";
  const campo = useRef<HTMLInputElement>(null);
  // Tecla "/" (fora de um campo) leva direto à busca
  useEffect(() => {
    if (celular) return;
    const tecla = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (e.key !== "/" || e.ctrlKey || e.metaKey || alvo.closest("input, textarea, select, [contenteditable=true]")) return;
      // Campo oculto (a busca do topo some abaixo de lg): não engole a tecla
      const el = campo.current;
      if (!el || el.getClientRects().length === 0) return;
      e.preventDefault();
      el.focus();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [celular]);
  if (celular) {
    return (
      <Link href={destino} aria-label="Buscar" className="grid h-10 w-10 place-items-center rounded-full text-stone-600 hover:bg-stone-100 lg:hidden">
        <Search className="h-5 w-5" />
      </Link>
    );
  }
  return (
    <form action={destino} className="relative hidden w-full sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        ref={campo}
        name="q"
        type="search"
        aria-label="Buscar"
        title="Atalho: tecla /"
        placeholder={serraria ? "Buscar pacote, lote, carga…" : "Buscar requisição…"}
        className="peer h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-9 text-sm outline-none transition focus:border-marca-500 focus:bg-white focus:ring-2 focus:ring-marca-500/20"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-stone-200 bg-white px-1.5 text-[11px] font-semibold text-stone-400 peer-focus:hidden" aria-hidden>
        /
      </kbd>
    </form>
  );
}

