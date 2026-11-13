"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFecharAoClicarFora } from "@/components/useFecharAoClicarFora";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Flame, House, LayoutGrid, Package, Plus, QrCode, Search, type LucideIcon } from "lucide-react";
import { BotaoSair } from "@/components/BotaoSair";
import { SeletorTema } from "@/components/Tema";
import { ICONES } from "@/components/icones";
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


function TrocaModulo({ menus, modulo }: { menus: Menus; modulo: Modulo }) {
  const disponiveis = Object.keys(menus) as Modulo[];
  if (disponiveis.length < 2) return null;
  return (
    <div className="grid grid-cols-2 gap-1 rounded-md bg-black/20 p-1" role="tablist" aria-label="Módulo">
      {disponiveis.map((m) => (
        <Link
          key={m}
          href={MODULOS[m].inicio}
          role="tab"
          aria-selected={m === modulo}
          className={`rounded-lg px-2 py-1.5 text-center text-sm font-semibold transition ${
            m === modulo ? "bg-white text-marca-800" : "text-white/70 hover:text-white"
          }`}
        >
          {MODULOS[m].nome}
        </Link>
      ))}
    </div>
  );
}

/**
 * Item do menu da tela atual: o que bate exatamente ou, nas telas internas (ex.: /producao/boletins/novo),
 * o de caminho mais longo que é prefixo. Daí sai o grupo destacado no topo e as abas mostradas.
 */
function itemDaTela(grupos: GrupoNav[], path: string, inicio: string) {
  const comTitulo = grupos.filter((g) => g.titulo && g.titulo !== TITULO_CONTA);
  const itens = comTitulo.flatMap((g) => g.itens.map((i) => ({ g, i })));
  const exato = itens.find(({ i }) => itemAtivo(path, i.href));
  const prefixo = itens.filter(({ i }) => i.href !== inicio && path.startsWith(i.href + "/")).sort((a, b) => b.i.href.length - a.i.href.length)[0];
  const achado = exato ?? prefixo;
  return { grupo: achado?.g, href: achado?.i.href, mostrar: achado?.g ?? comTitulo[0] };
}

/**
 * Navegação do computador: menu lateral fixo com a busca, os grupos do processo
 * (Operação, Gestão, Cadastros), a conta e a troca de módulo. No celular continua a barra inferior.
 */
export function MenuLateral({
  menus,
  salvo,
  sair,
}: {
  menus: Menus;
  salvo: Modulo | null;
  sair: () => Promise<void>;
}) {
  const path = usePathname();
  const modulo = useModulo(menus, salvo);
  const inicio = MODULOS[modulo].inicio;
  const grupos = menus[modulo] ?? [];
  const processo = grupos.filter((g) => g.titulo && g.titulo !== TITULO_CONTA);
  const conta = grupos.find((g) => g.titulo === TITULO_CONTA)?.itens ?? [];
  const { href: hrefAtivo } = itemDaTela(grupos, path, inicio);
  const disponiveis = Object.keys(menus) as Modulo[];

  const item = (i: ItemNav, ativo: boolean) => (
    <Link
      key={i.href}
      href={i.href}
      aria-current={ativo ? "page" : undefined}
      className={`group flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
        ativo ? "fundo-marca text-white shadow-md shadow-marca-900/20" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
      }`}
    >
      {(() => {
        const Icone = ICONES[i.icone];
        return <Icone className={`h-[18px] w-[18px] shrink-0 ${ativo ? "text-white" : "text-stone-400 group-hover:text-stone-600"}`} strokeWidth={2} />;
      })()}
      <span className="min-w-0 flex-1 truncate">{i.label}</span>
      {i.etapa && (
        <span
          className={`grid h-5 min-w-5 place-items-center rounded-md px-1 text-[10px] font-bold tabular-nums ${ativo ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"}`}
          title={`Etapa ${i.etapa} do processo`}
        >
          {i.etapa}
        </span>
      )}
    </Link>
  );

  const titulo = (t: string) => <p className="mb-1.5 mt-5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-stone-400">{t}</p>;

  return (
    <aside className="nao-imprimir fixed inset-y-0 left-0 z-30 hidden w-[17rem] flex-col border-r border-stone-200 bg-white lg:flex">
      <Link href={inicio} className="flex h-16 shrink-0 items-center px-5" aria-label="Artepinus · início">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Artepinus" className="h-10 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-branco.svg" alt="Artepinus" className="hidden h-10 w-auto dark:block" />
      </Link>
      <div className="shrink-0 px-4 pb-1">
        <BuscaTopo menus={menus} salvo={salvo} />
      </div>

      <nav aria-label="Menu principal" className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        {titulo(MODULOS[modulo].nome)}
        <div className="space-y-0.5">{item({ href: inicio, label: "Início", icone: "inicio" }, path === inicio)}</div>
        {processo.map((g) => (
          <div key={g.titulo}>
            {titulo(g.titulo)}
            <div className="space-y-0.5">{g.itens.map((i) => item(i, i.href === hrefAtivo))}</div>
          </div>
        ))}
        {titulo("Geral")}
        <div className="space-y-0.5">
          {conta.map((i) => item(i, itemAtivo(path, i.href)))}
          <BotaoSair sair={sair} variante="lateral" />
        </div>
      </nav>

      {/* Módulo em uso e troca de módulo */}
      <div className="shrink-0 border-t border-stone-100 p-3">
        <Link href="/sistema" className="flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-2.5 ring-1 ring-stone-200 transition hover:bg-stone-100">
          <span className="fundo-marca grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white">
            <LayoutGrid className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-semibold text-stone-900">Módulo {MODULOS[modulo].nome}</span>
            <span className="block truncate text-[11px] text-stone-500">{disponiveis.length > 1 ? "Trocar de módulo" : "Ver os módulos"}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
        </Link>
        <p className="mt-2 px-1 text-[10px] text-stone-400">© {new Date().getFullYear()} Artepinus · PR Tech Solutions</p>
      </div>
    </aside>
  );
}

/**
 * Topo da área de conteúdo no computador: voltar/avançar, o caminho da tela atual
 * (módulo › grupo › tela) e, à direita, tema, manual, avisos e o usuário.
 */
export function TopoComputador({
  menus,
  salvo,
  usuario,
  sair,
  acoes,
}: {
  menus: Menus;
  salvo: Modulo | null;
  usuario: Usuario;
  sair: () => Promise<void>;
  /** Tema, manual e sininho (lado direito). */
  acoes: React.ReactNode;
}) {
  const path = usePathname();
  const modulo = useModulo(menus, salvo);
  const inicio = MODULOS[modulo].inicio;
  const grupos = menus[modulo] ?? [];
  const conta = grupos.find((g) => g.titulo === TITULO_CONTA)?.itens ?? [];
  const { grupo, href } = itemDaTela(grupos, path, inicio);
  const atual = grupo?.itens.find((i) => i.href === href) ?? conta.find((i) => itemAtivo(path, i.href));
  const [menuUsuario, setMenuUsuario] = useState(false);
  const caixaUsuario = useRef<HTMLDivElement>(null);
  const fecharUsuario = useCallback(() => setMenuUsuario(false), []);
  useFecharAoClicarFora(menuUsuario, caixaUsuario, fecharUsuario);
  useEffect(() => setMenuUsuario(false), [path]);

  const seta = "grid h-8 w-8 place-items-center rounded-lg text-stone-500 ring-1 ring-stone-200 transition hover:bg-stone-50 hover:text-stone-800";
  return (
    <header className="nao-imprimir sticky top-0 z-20 hidden border-b border-stone-200 bg-white/90 backdrop-blur lg:block">
      <div className="flex h-16 items-center gap-3 px-8">
        <div className="flex gap-1.5">
          <button type="button" onClick={() => history.back()} className={seta} aria-label="Voltar" title="Voltar">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => history.forward()} className={seta} aria-label="Avançar" title="Avançar">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <nav aria-label="Você está em" className="ml-2 flex min-w-0 items-center gap-1.5 text-sm">
          <Link href={inicio} className="shrink-0 text-stone-500 hover:text-stone-900">
            {MODULOS[modulo].nome}
          </Link>
          {grupo && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-stone-300" />
              <span className="shrink-0 text-stone-500">{grupo.titulo}</span>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-stone-300" />
          <span className="truncate font-semibold text-stone-900">{path === inicio ? "Início" : (atual?.label ?? "Página")}</span>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {acoes}
          <div ref={caixaUsuario} className="relative ml-1.5">
            <button
              type="button"
              aria-label="Menu do usuário"
              onClick={() => setMenuUsuario(!menuUsuario)}
              aria-expanded={menuUsuario}
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition hover:bg-stone-100"
            >
              <span className="fundo-marca grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white">{iniciais(usuario.nome)}</span>
              <span className="hidden max-w-[11rem] text-left leading-tight xl:block">
                <span className="block truncate text-sm font-semibold text-stone-800">{usuario.nome.split(" ").slice(0, 2).join(" ")}</span>
                {usuario.perfilLabel && <span className="block truncate text-[11px] text-stone-500">{usuario.perfilLabel}</span>}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
            </button>
            {menuUsuario && (
              <div className="absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-2xl border border-stone-200 bg-white py-1 text-stone-700 shadow-xl">
                <div className="border-b border-stone-100 px-4 py-3">
                  <div className="truncate text-sm font-semibold text-stone-900">{usuario.nome}</div>
                  <div className="truncate text-xs text-stone-500">{usuario.perfilLabel}</div>
                </div>
                <Link href="/sistema" className="flex items-center gap-3 px-4 py-2 text-sm font-medium hover:bg-stone-50">
                  <LayoutGrid className="h-4 w-4 text-stone-400" /> Escolher módulo
                </Link>
                {conta.map((i) => {
                  const Icone = ICONES[i.icone];
                  return (
                    <Link key={i.href} href={i.href} className="flex items-center gap-3 px-4 py-2 text-sm font-medium hover:bg-stone-50">
                      <Icone className="h-4 w-4 text-stone-400" /> {i.label}
                    </Link>
                  );
                })}
                <div className="my-1 border-t border-stone-100" />
                <div className="flex items-center gap-3 px-4 py-2">
                  <span className="text-sm font-medium text-stone-600">Tema</span>
                  <div className="flex-1">
                    <SeletorTema />
                  </div>
                </div>
                <div className="my-1 border-t border-stone-100" />
                <BotaoSair sair={sair} variante="item" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
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

/** Busca do menu lateral (computador, atalho "/") e lupa do topo (celular e tablet): na Serraria vai para
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
      // Campo oculto (menu lateral escondido abaixo de lg): não engole a tecla
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

/** Menu completo no celular, do módulo em uso, com a troca de módulo no topo. */
export function MenuCelular({ menus, salvo }: { menus: Menus; salvo: Modulo | null }) {
  const modulo = useModulo(menus, salvo);
  return (
    <>
      <TrocaModulo menus={menus} modulo={modulo} />
      {(menus[modulo] ?? []).map((g, n) => (
        <section key={g.titulo || n}>
          {g.titulo && <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{g.titulo}</h2>}
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {g.itens.map((i) => {
              const Icone = ICONES[i.icone];
              return (
                <li key={i.href}>
                  <Link href={i.href} className="flex items-center gap-3 px-4 py-3.5 active:bg-stone-50">
                    <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-stone-100 text-stone-600">
                      <Icone className="h-[18px] w-[18px]" />
                      {i.etapa && (
                        <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-marca-700 text-[9px] font-bold text-white ring-2 ring-white">
                          {i.etapa}
                        </span>
                      )}
                    </span>
                    <span className="flex-1 font-medium">{i.label}</span>
                    <ChevronRight className="h-4 w-4 text-stone-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
