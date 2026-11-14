/**
 * Tela de abertura do app instalado: marca branca sobre o verde, nome e uma linha de carregamento.
 * Fica sempre no HTML, escondida; aparece só com <html data-abertura> (SCRIPT_ABERTURA). Estilo e
 * animação em globals.css (.abertura-app).
 */
export function AberturaApp() {
  return (
    <div className="abertura-app fundo-marca" aria-hidden="true">
      <div className="abertura-conteudo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marca-branca.svg" alt="" className="abertura-marca" width={176} height={88} />
        <p className="abertura-nome">Artepinus</p>
        <p className="abertura-sub">Madeiras</p>
        <span className="abertura-linha" />
      </div>
    </div>
  );
}
