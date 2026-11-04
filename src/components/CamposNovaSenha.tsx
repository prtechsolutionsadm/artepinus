/** Campos de troca de senha (senha atual, nova e confirmação), usados no Meu perfil e na troca obrigatória. */
export function CamposNovaSenha({ rotuloAtual = "Senha atual" }: { rotuloAtual?: string }) {
  return (
    <>
      <div>
        <label htmlFor="atual">{rotuloAtual}</label>
        <input id="atual" name="atual" type="password" autoComplete="current-password" required className="campo" />
      </div>
      <div>
        <label htmlFor="nova">Nova senha (mínimo 8 caracteres)</label>
        <input id="nova" name="nova" type="password" autoComplete="new-password" minLength={8} required className="campo" />
      </div>
      <div>
        <label htmlFor="confirmacao">Confirme a nova senha</label>
        <input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" required className="campo" />
      </div>
    </>
  );
}
