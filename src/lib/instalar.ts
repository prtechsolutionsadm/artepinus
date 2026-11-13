/**
 * Script do layout raiz, antes de tudo: guarda o pedido de instalação do app (Chrome, Edge, Android) em
 * window.__pedidoInstalar, sem a barrinha automática, e avisa o CartaoInstalar ("artepinus:instalavel"):
 * o evento pode chegar antes da tela de início existir.
 */
export const SCRIPT_INSTALAR = `addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__pedidoInstalar=e;dispatchEvent(new Event("artepinus:instalavel"))});addEventListener("appinstalled",function(){window.__pedidoInstalar=null;dispatchEvent(new Event("artepinus:instalavel"))});`;
