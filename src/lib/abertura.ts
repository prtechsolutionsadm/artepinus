/**
 * Animação de entrada do app instalado (PWA). O script roda no layout raiz antes da página: só no app
 * aberto pela tela inicial (display-mode standalone, ou navigator.standalone no iPhone), uma vez por
 * abertura (sessionStorage) e nunca com "reduzir movimento". Ele marca o <html> com data-abertura, o
 * que mostra a `AberturaApp` (escondida por padrão no CSS, então não pisca no navegador comum);
 * a própria animação some no fim e o atributo sai depois, liberando a tela.
 */
export const DURACAO_ABERTURA_MS = 1900;

export const SCRIPT_ABERTURA = `try{var m=function(q){return matchMedia(q).matches};if((m("(display-mode: standalone)")||navigator.standalone)&&!m("(prefers-reduced-motion: reduce)")&&!sessionStorage.getItem("artepinus:abertura")){sessionStorage.setItem("artepinus:abertura","1");var h=document.documentElement;h.setAttribute("data-abertura","");setTimeout(function(){h.removeAttribute("data-abertura")},${DURACAO_ABERTURA_MS})}}catch(e){}`;
