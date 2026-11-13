import { cookies } from "next/headers";
import Link from "next/link";
import { sair } from "@/app/actions/auth";
import { BotaoAjuda } from "@/components/ajuda/BotaoAjuda";
import { BotaoSair } from "@/components/BotaoSair";
import { BarraInferior, MenuLateral, SCRIPT_MENU, TopoApp } from "@/components/Navegacao";
import { MedidaRolagem } from "@/components/painel/MedidaRolagem";
import { SincronizadorOffline } from "@/components/SincronizadorOffline";
import { Rodape } from "@/components/Rodape";
import { SCRIPT_TEMA, TemaApp } from "@/components/Tema";
import { rotuloPerfis } from "@/lib/constantes";
import { db } from "@/lib/db";
import { COOKIE_MODULO, menusDoUsuario, moduloSalvo } from "@/lib/menu";
import { podeAdministrar } from "@/lib/permissoes";
import { exigirUsuario } from "@/lib/session";

import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const eu = await exigirUsuario();
  const menus = menusDoUsuario(eu);
  const salvo = moduloSalvo((await cookies()).get(COOKIE_MODULO)?.value);
  // "Serraria: Apontador · Manutenção: Operador" (só os módulos que a pessoa enxerga)
  const perfilLabel = rotuloPerfis(eu);
  // Sem nenhum módulo ativo (ex.: só tinha acesso à manutenção, que está desligada)
  if (Object.keys(menus).length === 0) {
    return (
      <div className="min-h-dvh">
        <header className="border-b border-stone-200 bg-white pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marca.svg" alt="" className="h-7 w-auto" />
              <span className="font-serif text-lg font-bold italic tracking-wide text-[#177009]">ARTEPINUS</span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <BotaoAjuda />
              <BotaoSair sair={sair} usuarioId={eu.id} variante="botao" />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
          <p role="status" className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            Seu usuário ainda não tem acesso ao sistema. Fale com o gerente para liberar o seu perfil.
          </p>
          {children}
          <Rodape className="mt-12 border-t border-stone-200/70 pt-6" />
        </main>
      </div>
    );
  }
  const naoLidas = await db.notificacao.count({ where: { usuarioId: eu.id, lida: false } });
  // Botão "Módulos" do topo: só para quem tem o que escolher em /sistema (outro módulo ou a administração)
  const mostrarModulos = Object.keys(menus).length > 1 || podeAdministrar(eu);

  // Largura do conteúdo: a mesma do topo (TopoApp), centralizada, sem menu lateral
  const largura = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";
  return (
    <div className="flex min-h-dvh flex-col">
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_MENU }} />
      <TemaApp />
      <MedidaRolagem />
      {/* Computador: menu lateral enxuto (só as telas do módulo); o resto fica no topo */}
      <MenuLateral menus={menus} salvo={salvo} />
      <div className="flex min-h-dvh flex-col transition-[padding] duration-200 lg:pl-[var(--largura-menu)]">
      <TopoApp
        menus={menus}
        salvo={salvo}
        usuario={{ nome: eu.nome, perfilLabel }}
        sair={sair}
        usuarioId={eu.id}
        naoLidas={naoLidas}
        mostrarModulos={mostrarModulos}
      />

      {/* overflow-x-clip: a FaixaPainel sai do container até as bordas sem criar rolagem lateral
          (clip, e não hidden, para não quebrar os elementos sticky das páginas) */}
      <div className="flex-1 overflow-x-clip">
        {/* Avisos da fila offline fora do <main>: a faixa verde das telas iniciais encosta no topo sem cobri-los */}
        <div className={`${largura} nao-imprimir pt-4 empty:hidden`}>
          <SincronizadorOffline usuarioId={eu.id} nome={eu.nome} />
        </div>
        {/* pt-5/lg:pt-7: a FaixaPainel desconta exatamente esse respiro (-mt-5/lg:-mt-7) */}
        <main className={`${largura} pb-10 pt-5 lg:pt-7`}>{children}</main>
      </div>

      {/* Créditos (celular e computador); no celular, acima da barra de baixo */}
      <div className="nao-imprimir border-t border-stone-200/70 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <Rodape className={`${largura} py-5 lg:flex lg:items-center lg:justify-between lg:gap-6 lg:text-left`} />
      </div>

      </div>
      <BarraInferior menus={menus} salvo={salvo} />
    </div>
  );
}
