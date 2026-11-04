import { CampoSenha } from "@/components/CampoSenha";

/** Campos de troca de senha (senha atual, nova e confirmação), usados no Meu perfil e na troca obrigatória. */
export function CamposNovaSenha({ rotuloAtual = "Senha atual" }: { rotuloAtual?: string }) {
  return (
    <>
      <div>
        <label htmlFor="atual">{rotuloAtual}</label>
        <CampoSenha id="atual" name="atual" autoComplete="current-password" />
      </div>
      <div>
        <label htmlFor="nova">Nova senha (mínimo 8 caracteres)</label>
        <CampoSenha id="nova" name="nova" autoComplete="new-password" minLength={8} />
      </div>
      <div>
        <label htmlFor="confirmacao">Confirme a nova senha</label>
        <CampoSenha id="confirmacao" name="confirmacao" autoComplete="new-password" />
      </div>
    </>
  );
}
