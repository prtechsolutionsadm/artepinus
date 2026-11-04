import { SeletorTema } from "@/components/Tema";
import type { Metadata } from "next";
import { salvarPerguntaSeguranca, trocarSenha } from "@/app/actions/auth";
import { CampoSenha } from "@/components/CampoSenha";
import { db } from "@/lib/db";
import { PERGUNTAS_SEGURANCA } from "@/lib/perguntas";
import { ActionForm, BotaoEnviar } from "@/components/ActionForm";
import { CamposNovaSenha } from "@/components/CamposNovaSenha";
import { AtivarPush } from "@/components/AtivarPush";
import { iniciais } from "@/lib/menu";
import { Titulo } from "@/components/ui";
import { PERFIL } from "@/lib/constantes";
import { exigirUsuario } from "@/lib/session";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const eu = await exigirUsuario();
  const { perguntaSeguranca: pergunta, respostaHash } = await db.usuario.findUniqueOrThrow({ where: { id: eu.id }, select: { perguntaSeguranca: true, respostaHash: true } });
  const temPergunta = pergunta != null && !!respostaHash;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Titulo>Meu perfil</Titulo>
      <div className="cartao flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-marca-100 text-xl font-semibold text-marca-700">
          {iniciais(eu.nome)}
        </span>
        <div className="min-w-0 text-sm">
          <div className="text-lg font-semibold">{eu.nome}</div>
          <div className="font-mono text-stone-600">{eu.login}</div>
          <div className="text-stone-500">{PERFIL[eu.perfil]}</div>
        </div>
      </div>
      <AtivarPush />
      <section className="cartao">
        <h2 className="mb-1 font-semibold">Tema</h2>
        <p className="mb-3 text-sm text-stone-500">Automático segue o claro/escuro do aparelho. Fica salvo neste aparelho.</p>
        <SeletorTema grande />
      </section>
      <ActionForm action={salvarPerguntaSeguranca} limparAoSalvar className="cartao space-y-3">
        <div>
          <h2 className="font-semibold">Pergunta de segurança</h2>
          <p className="text-sm text-stone-500">
            {temPergunta ? "Cadastrada. Se esquecer a senha, use Esqueci a minha senha no login." : "Cadastre para recuperar a senha sozinho, sem depender do administrador."}
          </p>
        </div>
        <div>
          <label htmlFor="pergunta">Pergunta</label>
          <select id="pergunta" name="pergunta" defaultValue={pergunta ?? 0} className="campo">
            {PERGUNTAS_SEGURANCA.map((p, i) => (
              <option key={i} value={i}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="resposta">Resposta</label>
          <input id="resposta" name="resposta" autoComplete="off" required className="campo" />
          <p className="mt-1 text-xs text-stone-500">Maiúsculas e acentos não fazem diferença. Guarde só para você.</p>
        </div>
        <div>
          <label htmlFor="senha-pergunta">Sua senha atual (para confirmar)</label>
          <CampoSenha id="senha-pergunta" name="senha" autoComplete="current-password" />
        </div>
        <BotaoEnviar>{temPergunta ? "Trocar pergunta" : "Salvar pergunta"}</BotaoEnviar>
      </ActionForm>
      <ActionForm action={trocarSenha} limparAoSalvar className="cartao space-y-3">
        <h2 className="font-semibold">Trocar senha</h2>
        <CamposNovaSenha />
        <BotaoEnviar>Salvar nova senha</BotaoEnviar>
      </ActionForm>
    </div>
  );
}
