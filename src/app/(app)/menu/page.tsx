import type { Metadata } from "next";
import { cookies } from "next/headers";
import { sair } from "@/app/actions/auth";
import { BotaoSair } from "@/components/BotaoSair";
import { CartaoAtalho, FaixaPainel, GrupoAtalhos, TodasAsTelas } from "@/components/painel";
import { SeletorTema } from "@/components/Tema";
import { rotuloPerfis } from "@/lib/constantes";
import { db } from "@/lib/db";
import { COOKIE_MODULO, TITULO_CONTA, iniciais, menusDoUsuario, moduloSalvo } from "@/lib/menu";
import { MODULOS, podeAdministrar, type Modulo } from "@/lib/permissoes";
import { exigirUsuario } from "@/lib/session";

export const metadata: Metadata = { title: "Menu" };

/**
 * "Mais" do celular (a barra de baixo só tem os atalhos principais): primeiro a conta (perfil, avisos,
 * manual, módulos, tema e Sair) e depois todas as telas do módulo em uso, nos mesmos cartões das
 * telas iniciais.
 */
export default async function MenuPage() {
  const eu = await exigirUsuario();
  const menus = menusDoUsuario(eu);
  const disponiveis = Object.keys(menus) as Modulo[];
  // Módulo em uso: o último visitado (cookie, o mesmo do topo e da barra de baixo); senão o primeiro
  const salvo = moduloSalvo((await cookies()).get(COOKIE_MODULO)?.value);
  const modulo: Modulo | undefined = salvo && disponiveis.includes(salvo) ? salvo : disponiveis[0];
  const naoLidas = await db.notificacao.count({ where: { usuarioId: eu.id, lida: false } });
  const administra = podeAdministrar(eu);
  // "Serraria · Operação": com mais de um módulo, deixa claro de qual são as telas
  const grupos = modulo
    ? (menus[modulo] ?? []).map((g) => (g.titulo && g.titulo !== TITULO_CONTA ? { ...g, titulo: `${MODULOS[modulo].nome} · ${g.titulo}` } : g))
    : [];

  return (
    <>
      {modulo ? (
        <FaixaPainel
          rotulo={rotuloPerfis(eu)}
          titulo={eu.nome}
          subtitulo={
            <>
              Login <span className="font-mono">{eu.login}</span>
            </>
          }
        />
      ) : (
        // Sem módulo, o layout é o simples (aviso de sem acesso no alto), sem a faixa de largura total
        <div className="flex items-center gap-3">
          <span className="fundo-marca grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-semibold text-white">{iniciais(eu.nome)}</span>
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold leading-tight text-stone-900">{eu.nome}</div>
            <div className="text-sm text-stone-500">
              <span className="font-mono">{eu.login}</span> · {rotuloPerfis(eu)}
            </div>
          </div>
        </div>
      )}

      <GrupoAtalhos titulo="Sua conta">
        <CartaoAtalho href="/perfil" icone="perfil" titulo="Meu perfil" descricao="Seus dados, senha, tema e avisos no celular" />
        <CartaoAtalho
          href="/notificacoes"
          icone="notificacoes"
          titulo="Notificações"
          descricao="Os avisos do sistema para você"
          selo={naoLidas > 0 ? (naoLidas > 99 ? "99+" : naoLidas) : undefined}
          alerta={naoLidas > 0}
        />
        <CartaoAtalho href="/ajuda" icone="ajuda" titulo="Manual do usuário" descricao="Como usar cada tela e roteiros para imprimir" />
        {disponiveis.length > 1 && (
          <CartaoAtalho
            href="/sistema"
            icone="modulos"
            titulo="Módulos"
            descricao={`Trocar de módulo: ${disponiveis.map((m) => MODULOS[m].nome).join(" ou ")}`}
          />
        )}
        {administra && <CartaoAtalho href="/administracao" icone="seguranca" titulo="Administração" descricao="Usuários, cadastros, histórico e dados do sistema" />}
      </GrupoAtalhos>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <section className="cartao" aria-labelledby="menu-tema">
          <h2 id="menu-tema" className="mb-2 text-sm font-semibold text-stone-900">
            Tema
          </h2>
          <SeletorTema grande />
        </section>
        <section className="cartao flex flex-col justify-between gap-2">
          <p className="text-sm text-stone-500">Aparelho de outra pessoa ou da fábrica? Saia ao terminar.</p>
          <BotaoSair sair={sair} usuarioId={eu.id} variante="botao" />
        </section>
      </div>

      <TodasAsTelas grupos={grupos} />
    </>
  );
}
