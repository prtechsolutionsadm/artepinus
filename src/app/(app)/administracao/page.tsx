import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CartaoAtalho, FaixaPainel, GrupoAtalhos } from "@/components/painel";
import { MODULOS_ATIVOS, MODULOS_EM_TESTE, pode, podeProducao, temModulo } from "@/lib/permissoes";
import { exigirUsuario, inicioDe } from "@/lib/session";

export const metadata: Metadata = { title: "Administração" };

/**
 * Painel de administração: usuários, cadastros da Serraria e da Manutenção, histórico e dados do
 * sistema. Cada cartão só aparece para quem pode abrir a tela (as mesmas regras de cada página).
 * Entra quem tem pelo menos uma: usuários, auditoria ou gerir a Serraria (a mesma regra do cartão
 * "Administração" de /sistema).
 */
export default async function AdministracaoPage() {
  const eu = await exigirUsuario();
  const usuarios = pode(eu.perfil, "usuarios");
  const auditoria = pode(eu.perfil, "auditoria");
  const serraria = podeProducao(eu, "gerir");
  if (!usuarios && !auditoria && !serraria) redirect(inicioDe(eu));

  // Telas da Manutenção: só com o módulo liberado para a pessoa (em teste: só o administrador)
  const manutencao = temModulo(eu, "manutencao");
  const setores = manutencao && pode(eu.perfil, "setores");
  const equipamentos = manutencao && pode(eu.perfil, "equipamentos");
  const preventivas = manutencao && pode(eu.perfil, "preventivas");
  // Triagem do período de teste (aba Configuração dos cadastros): só o administrador, enquanto a Manutenção está em teste
  // "Usuários, cadastros, histórico e dados do sistema": só o que a pessoa vai encontrar aqui
  const partes = [usuarios && "usuários", serraria && "cadastros", auditoria && "histórico", "dados do sistema"].filter(Boolean) as string[];
  const subtitulo = `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}`.replace(/^./, (c) => c.toUpperCase());
  const triagem = eu.perfil === "ADMIN" && serraria && !MODULOS_ATIVOS.includes("manutencao") && MODULOS_EM_TESTE.includes("manutencao");

  return (
    <>
      <FaixaPainel rotulo="Módulo · Administração" titulo="Painel Administrativo" subtitulo={subtitulo} />

      <div className="nao-imprimir">
        {(usuarios || auditoria) && (
          <GrupoAtalhos titulo="Pessoas">
            {usuarios && <CartaoAtalho href="/usuarios" icone="usuarios" titulo="Usuários" descricao="Quem usa o sistema e o que cada um pode fazer" />}
            {auditoria && (
              <CartaoAtalho href="/auditoria?entidade=Usuario" icone="perfil" titulo="Entradas e acessos" descricao="Entradas, saídas, senhas e mudanças nos usuários" />
            )}
          </GrupoAtalhos>
        )}

        {serraria && (
          <GrupoAtalhos titulo="Serraria">
            <CartaoAtalho href="/producao/cadastros" icone="cadastrosProducao" titulo="Cadastros" descricao="Pedidos, florestas, fornecedores, motoristas e estufas" />
            <CartaoAtalho href="/producao/cadastros?aba=maquinas" icone="serraria" titulo="Máquinas da linha" descricao="As máquinas que param a serraria quando quebram" />
            <CartaoAtalho href="/producao/cadastros?aba=config" icone="indicadores" titulo="Configuração" descricao="Meta do dia, horas de trabalho e horário do turno" />
          </GrupoAtalhos>
        )}

        {(setores || equipamentos || preventivas) && (
          <GrupoAtalhos titulo="Manutenção">
            {setores && <CartaoAtalho href="/setores" icone="setores" titulo="Setores" descricao="Setores da fábrica" />}
            {equipamentos && <CartaoAtalho href="/equipamentos" icone="equipamentos" titulo="Equipamentos" descricao="Máquinas da fábrica, ficha, histórico e QR" />}
            {preventivas && <CartaoAtalho href="/preventivas" icone="preventivas" titulo="Preventivas" descricao="Manutenções programadas de cada máquina" />}
          </GrupoAtalhos>
        )}

        <GrupoAtalhos titulo="Segurança & dados">
          {auditoria && <CartaoAtalho href="/auditoria" icone="auditoria" titulo="Auditoria" descricao="Quem fez o quê no sistema, e quando" />}
          {triagem && (
            <CartaoAtalho
              href="/producao/cadastros?aba=config#triagem"
              icone="checklists"
              titulo="Triagem do período de teste"
              descricao="Encerrar as requisições que sobraram do teste da Manutenção"
            />
          )}
          <CartaoAtalho href="/privacidade" icone="seguranca" titulo="Política de privacidade" descricao="Que dados o sistema guarda e por quanto tempo" />
        </GrupoAtalhos>
      </div>
    </>
  );
}
