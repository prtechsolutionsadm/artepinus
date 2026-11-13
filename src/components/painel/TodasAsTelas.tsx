import { CartaoAtalho } from "@/components/painel/CartaoAtalho";
import { GrupoAtalhos } from "@/components/painel/GrupoAtalhos";
import { TITULO_CONTA, type GrupoNav } from "@/lib/menu";

/**
 * Todas as telas do módulo em cartões, nos grupos do menu (Operação, Gestão, Cadastros…).
 * Recebe `menusDoUsuario(eu)[modulo]`: já vem só com o que a pessoa pode usar. Pula o grupo da
 * conta (perfil, avisos e manual ficam no topo) e o grupo sem título (o Início do módulo).
 */
export function TodasAsTelas({ grupos }: { grupos: GrupoNav[] }) {
  const visiveis = grupos.filter((g) => g.titulo && g.titulo !== TITULO_CONTA && g.itens.length > 0);
  if (visiveis.length === 0) return null;
  return (
    <div className="nao-imprimir">
      {visiveis.map((g) => (
        <GrupoAtalhos key={g.titulo} titulo={g.titulo}>
          {g.itens.map((i) => (
            <CartaoAtalho key={i.href} href={i.href} titulo={i.label} descricao={i.descricao} icone={i.icone} />
          ))}
        </GrupoAtalhos>
      ))}
    </div>
  );
}
