"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFecharAoClicarFora } from "@/components/useFecharAoClicarFora";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronDown, ChevronRight, ClipboardList, Flame, House, LayoutGrid, Package, Plus, QrCode, Search, type LucideIcon } from "lucide-react";
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

/** Ícone do item: as etapas do processo levam o número no lugar do ícone. */
function MarcaItem({ item, ativo, claro = false }: { item: ItemNav; ativo: boolean; claro?: boolean }) {
  const Icone = ICONES[item.icone];
  if (item.etapa)
    return (
      <span
        className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[10px] font-bold tabular-nums ${
          ativo ? "bg-marca-700 text-white" : claro ? "border border-stone-300 text-stone-500" : "border border-stone-300 text-stone-500"
        }`}
        aria-hidden
      >
        {item.etapa}
      </span>
    );
  return <Icone className={`h-4 w-4 shrink-0 ${ativo ? "text-marca-700" : "text-stone-400"}`} strokeWidth={2} />;
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
 * Navegação do computador: barra superior com os grupos (Operação, Gestão, Cadastros) e,
 * logo abaixo, as abas do grupo da tela atual. No celular continua a barra inferior.
 */
export function BarraSuperior({
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
  /** Busca, manual e sininho (lado direito da barra). */
  acoes: React.ReactNode;
}) {
  const path = usePathname();
  const modulo = useModulo(menus, salvo);
  const inicio = MODULOS[modulo].inicio;
  const grupos = menus[modulo] ?? [];
  const processo = grupos.filter((g) => g.titulo && g.titulo !== TITULO_CONTA);
  const conta = grupos.find((g) => g.titulo === TITULO_CONTA)?.itens ?? [];
  const { grupo: achado, href: hrefAtivo, mostrar } = itemDaTela(grupos, path, inicio);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const caixaUsuario = useRef<HTMLDivElement>(null);
  const fecharUsuario = useCallback(() => setMenuUsuario(false), []);
  useFecharAoClicarFora(menuUsuario, caixaUsuario, fecharUsuario);
  useEffect(() => setMenuUsuario(false), [path]);

  const linkTopo = (ativo: boolean) =>
    `relative flex h-16 items-center px-3 text-sm font-semibold transition ${ativo ? "text-marca-800" : "text-stone-600 hover:text-stone-900"}`;

  return (
    <header className="nao-imprimir sticky top-0 z-30 hidden border-b border-stone-200 bg-white/95 backdrop-blur lg:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-8 2xl:max-w-[1600px]">
        <Link href={inicio} className="mr-4 shrink-0" aria-label="Artepinus · início">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Artepinus" className="h-10 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-branco.svg" alt="Artepinus" className="hidden h-10 w-auto dark:block" />
        </Link>
        <nav aria-label="Menu principal" className="flex items-center">
          <Link href={inicio} aria-current={path === inicio ? "page" : undefined} className={linkTopo(path === inicio)}>
            Início
            {path === inicio && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-marca-600" aria-hidden />}
          </Link>
          {processo.map((g) => {
            const ativo = achado === g;
            return (
              <div key={g.titulo} className="group relative">
                <Link href={g.itens[0].href} aria-current={ativo ? "true" : undefined} className={`${linkTopo(ativo)} gap-1`}>
                  {g.titulo}
                  <ChevronDown className="h-3.5 w-3.5 text-stone-400 transition group-hover:rotate-180" />
                  {ativo && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-marca-600" aria-hidden />}
                </Link>
                {/* Lista suspensa ao passar o mouse */}
                <div className="invisible absolute left-0 top-full z-40 w-64 translate-y-1 rounded-lg border border-stone-200 bg-white p-1.5 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {g.itens.map((i) => {
                    const on = i.href === hrefAtivo;
                    return (
                      <Link key={i.href} href={i.href} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${on ? "bg-marca-50 font-semibold text-marca-800" : "text-stone-700 hover:bg-stone-50"}`}>
                        <MarcaItem item={i} ativo={on} />
                        {i.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {acoes}
          <div ref={caixaUsuario} className="relative ml-2">
            <button
              type="button"
              aria-label="Menu do usuário"
              onClick={() => setMenuUsuario(!menuUsuario)}
              aria-expanded={menuUsuario}
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-stone-100"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marca-700 text-xs font-semibold text-white">{iniciais(usuario.nome)}</span>
              <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-stone-800 xl:block">{usuario.nome.split(" ")[0]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
            </button>
            {menuUsuario && (
              <div className="absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 text-stone-700 shadow-xl">
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
                <p className="border-t border-stone-100 px-4 py-2 text-[10px] text-stone-400">© {new Date().getFullYear()} Artepinus · Desenvolvido por PR Tech Solutions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Abas do grupo atual */}
      {mostrar && (
        <div className="border-t border-stone-100 bg-stone-50/60">
          <nav aria-label={mostrar.titulo} className="mx-auto flex h-11 max-w-7xl items-center gap-1 overflow-x-auto px-8 2xl:max-w-[1600px] [scrollbar-width:none]">
            <span className="mr-3 shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{mostrar.titulo}</span>
            {mostrar.itens.map((i) => {
              const on = i.href === hrefAtivo;
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  aria-current={on ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${on ? "bg-white text-marca-800 shadow-sm ring-1 ring-stone-200" : "text-stone-600 hover:bg-white hover:text-stone-900"}`}
                >
                  <MarcaItem item={i} ativo={on} />
                  {i.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
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

/** Busca do topo: só faz sentido no módulo de manutenção. */
export function BuscaTopo({ menus, salvo, celular = false }: { menus: Menus; salvo: Modulo | null; celular?: boolean }) {
  const modulo = useModulo(menus, salvo);
  const serraria = modulo === "producao";
  const destino = serraria ? "/producao/buscar" : "/requisicoes";
  if (celular) {
    return (
      <Link href={destino} aria-label="Buscar" className="grid h-10 w-10 place-items-center rounded-full text-stone-600 hover:bg-stone-100 sm:hidden">
        <Search className="h-5 w-5" />
      </Link>
    );
  }
  return (
    <form action={destino} className="relative hidden w-full sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        name="q"
        type="search"
        placeholder={serraria ? "Buscar pacote, lote, carga, pedido, motorista, placa…" : "Buscar requisição, nº ou equipamento…"}
        className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm outline-none transition focus:border-marca-500 focus:bg-white focus:ring-2 focus:ring-marca-500/20"
      />
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
