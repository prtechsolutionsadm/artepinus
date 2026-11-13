import type { Metadata } from "next";
import { Pencil, Plus } from "lucide-react";
import { salvarUsuario } from "@/app/actions/admin";
import { ActionForm, BotaoEnviar } from "@/components/ActionForm";
import { Badge, Titulo } from "@/components/ui";
import { PERFIL, PERFIL_PRODUCAO } from "@/lib/constantes";
import { db } from "@/lib/db";
import { exigirPermissao } from "@/lib/session";
import { MODULOS_ATIVOS, PERFIS_ATRIBUIVEIS, modulosDe } from "@/lib/permissoes";
import type { Perfil, PerfilProducao } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Usuários" };

type Usr = { id: string; nome: string; login: string; perfil: Perfil; perfilProducao: PerfilProducao | null; ativo: boolean };

const MANUTENCAO_ATIVA = MODULOS_ATIVOS.includes("manutencao");

/** O que cada perfil da Manutenção faz (Gerente vale para os dois módulos). */
const DESCRICAO_PERFIL: Record<Perfil, string> = {
  ADMIN: PERFIL.ADMIN,
  GERENTE: "Gerente · acesso total aos dois módulos e aos usuários",
  SUPERVISOR: "Supervisor · atende, distribui, planeja e vê indicadores",
  MANUTENTOR: "Manutentor · atende as requisições",
  OPERADOR: "Operador · abre e acompanha requisições",
  SEM_ACESSO: "Sem acesso · não usa a Manutenção",
};

/**
 * Perfis da Manutenção. Durante o teste também podem ser escolhidos: ficam guardados e só passam a
 * valer quando a Manutenção for liberada (assim o gerente prepara a equipe antes). Gerente vale na hora.
 */
function opcoesPerfil(atual?: Perfil): { valor: Perfil; rotulo: string }[] {
  if (atual === "ADMIN") return [{ valor: "ADMIN", rotulo: PERFIL.ADMIN }];
  return PERFIS_ATRIBUIVEIS.map((k) => ({ valor: k, rotulo: DESCRICAO_PERFIL[k] }));
}

/** Quem passa a usar a Manutenção quando ela for liberada: "2 gerentes, 1 supervisor e 3 operadores". */
function contagemPerfis(usuarios: Usr[]) {
  const partes = (["GERENTE", "SUPERVISOR", "MANUTENTOR", "OPERADOR"] as const).flatMap((k) => {
    const n = usuarios.filter((u) => u.ativo && u.perfil === k).length;
    const nome = PERFIL[k].toLowerCase();
    return n ? [`${n} ${n === 1 ? nome : nome.endsWith("r") ? `${nome}es` : `${nome}s`}`] : [];
  });
  if (partes.length === 0) return "ninguém por enquanto";
  return partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;
}

function CamposUsuario({ u }: { u?: Usr }) {
  return (
    <>
      <input type="hidden" name="id" value={u?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label>Nome *</label>
          <input name="nome" defaultValue={u?.nome} required className="campo" />
        </div>
        <div>
          <label>Login (nome.sobrenome) *</label>
          <input
            name="login"
            defaultValue={u?.login}
            required
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nome.sobrenome"
            className="campo lowercase"
          />
        </div>
        <div>
          <label>Perfil na Manutenção</label>
          <select name="perfil" defaultValue={u?.perfil ?? (MANUTENCAO_ATIVA ? "OPERADOR" : "SEM_ACESSO")} className="campo">
            {opcoesPerfil(u?.perfil).map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
          {!MANUTENCAO_ATIVA && (
            <p className="mt-1 text-xs text-stone-500">A Manutenção ainda está em teste: o perfil escolhido aqui só passa a valer quando ela for liberada. Gerente vale já.</p>
          )}
        </div>
        <div>
          <label>Perfil na Serraria</label>
          {u?.perfil === "ADMIN" || u?.perfil === "GERENTE" ? (
            <p className="campo flex items-center bg-stone-50 text-stone-500">Acesso total (Admin/Gerente)</p>
          ) : (
            <select name="perfilProducao" defaultValue={u?.perfilProducao ?? ""} className="campo">
              <option value="">Sem acesso</option>
              {(Object.keys(PERFIL_PRODUCAO) as PerfilProducao[]).map((k) => (
                <option key={k} value={k}>
                  {PERFIL_PRODUCAO[k]}
                </option>
              ))}
            </select>
          )}
          <p className="mt-1 text-xs text-stone-500">Supervisor: tudo, inclusive cadastros · Apontador: lança dados · Consulta: só vê. Gerente tem acesso total.</p>
        </div>
        <div>
          <label>{u ? "Nova senha (deixe em branco para manter)" : "Senha inicial *"}</label>
          <input name="senha" type="text" autoComplete="off" minLength={8} required={!u} className="campo" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 font-normal">
            <input type="checkbox" name="ativo" defaultChecked={u?.ativo ?? true} /> Ativo
          </label>
          <label className="flex items-center gap-2 font-normal">
            <input type="checkbox" name="trocarSenha" defaultChecked />{" "}
            {u ? "Ao redefinir a senha, exigir troca no próximo acesso" : "Exigir troca da senha no primeiro acesso"}
          </label>
        </div>
        <BotaoEnviar>{u ? "Salvar" : "Criar usuário"}</BotaoEnviar>
      </div>
    </>
  );
}

export default async function UsuariosPage() {
  const eu = await exigirPermissao("usuarios");
  // A conta de administrador (desenvolvedor) só aparece para o próprio administrador
  const usuarios = await db.usuario.findMany({
    where: eu.perfil === "ADMIN" ? {} : { perfil: { not: "ADMIN" } },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    select: { id: true, nome: true, login: true, perfil: true, perfilProducao: true, ativo: true },
  });

  return (
    <>
      <Titulo>Usuários</Titulo>
      <details className="cartao mb-6">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-marca-700"><Plus className="h-4 w-4" /> Novo usuário</summary>
        <ActionForm action={salvarUsuario} limparAoSalvar className="mt-4">
          <CamposUsuario />
        </ActionForm>
      </details>
      {!MANUTENCAO_ATIVA && (
        <p className="mb-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900 ring-1 ring-sky-200">
          A Manutenção ainda está em teste. Quando ela for liberada, passam a usá-la os gerentes e os usuários ativos com o selo &ldquo;Manutenção&rdquo;:{" "}
          <b>{contagemPerfis(usuarios)}</b>. Confira o perfil de cada um antes da liberação.
        </p>
      )}
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {usuarios.map((u) => {
          const total = u.perfil === "ADMIN" || u.perfil === "GERENTE";
          return (
            <li key={u.id} className="px-4 py-3">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2">
                  <span className="font-medium">{u.nome}</span>
                  <span className="font-mono text-sm text-stone-500">{u.login}</span>
                  {total && <Badge cor="bg-marca-50 text-marca-700 ring-marca-100">{PERFIL[u.perfil]} · acesso total</Badge>}
                  {!total && u.perfilProducao && <Badge cor="bg-amber-50 text-amber-800 ring-amber-100">Serraria · {PERFIL_PRODUCAO[u.perfilProducao]}</Badge>}
                  {!total &&
                    u.perfil !== "SEM_ACESSO" &&
                    (MANUTENCAO_ATIVA ? (
                      <Badge cor="bg-marca-50 text-marca-700 ring-marca-100">Manutenção · {PERFIL[u.perfil]}</Badge>
                    ) : (
                      <Badge cor="bg-sky-50 text-sky-800 ring-sky-200">Manutenção · {PERFIL[u.perfil]} (quando liberada)</Badge>
                    ))}
                  {u.ativo && modulosDe(u).length === 0 && <Badge cor="bg-stone-100 text-stone-600 ring-stone-300">Ainda sem acesso</Badge>}
                  {!u.ativo && <Badge cor="bg-stone-200 text-stone-700 ring-stone-300">Inativo</Badge>}
                  <Pencil className="ml-auto h-4 w-4 text-stone-400" />
                </summary>
                <ActionForm action={salvarUsuario} className="mt-3">
                  <CamposUsuario u={u} />
                </ActionForm>
              </details>
            </li>
          );
        })}
      </ul>
    </>
  );
}
