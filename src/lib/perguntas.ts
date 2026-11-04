// Perguntas de segurança para recuperar a senha sem depender do administrador.

export const PERGUNTAS_SEGURANCA = [
  "Qual o nome do seu primeiro animal de estimação?",
  "Em que cidade a sua mãe nasceu?",
  "Qual o nome da sua primeira escola?",
  "Qual o apelido que você tinha na infância?",
  "Qual o nome do seu melhor amigo de infância?",
  "Qual o modelo do seu primeiro carro ou moto?",
] as const;

/** Resposta comparada sem diferenciar maiúsculas, acentos e espaços extras. */
export function normalizarResposta(r: string) {
  return r
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
