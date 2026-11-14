// Versão do sistema e notas de atualização (tela /novidades, cartão Novidades da tela de início e rodapé).
//
// Cada publicação com mudança que o usuário percebe ganha uma entrada NO TOPO de NOTAS, com a versão
// (MAIOR.MENOR.CORREÇÃO), a data ("AAAA-MM-DD") e o que mudou em linguagem simples, de quem usa o
// sistema (nada de nome de arquivo ou termo técnico). A versão atual é sempre a primeira da lista;
// o "version" do package.json acompanha (npm run manual:validar confere).
//   MAIOR: mudança grande no jeito de trabalhar (telas novas de ponta a ponta, módulo novo).
//   MENOR: função nova ou tela refeita.
//   CORREÇÃO: só correções e ajustes pequenos.

export type NotaAtualizacao = {
  versao: string;
  /** "AAAA-MM-DD" */
  data: string;
  titulo: string;
  novidades?: string[];
  melhorias?: string[];
  correcoes?: string[];
};

export const NOTAS: NotaAtualizacao[] = [
  {
    versao: "2.3.0",
    data: "2026-11-13",
    titulo: "Visual novo e manual do usuário",
    novidades: [
      "Notas de atualização: o cartão Novidades da tela de início e a versão no rodapé mostram o que mudou em cada versão.",
      "O app se atualiza sozinho quando sai uma versão nova, também instalado no celular: não precisa desinstalar.",
      "Cartão Instalar o app na tela de início, nos aparelhos que permitem (no iPhone, com o passo a passo do Safari).",
      "Manual do usuário refeito, com o passo a passo de cada tela; o botão ? do topo abre a ajuda da tela em que você está.",
      "Tela de início nova: saudação, resumo do momento, os módulos com o que cada um faz e cartões de Ajuda, Notificações, Novidades e Administração. Em monitores grandes, os avisos recentes ficam numa coluna à direita.",
      "Painel Administrativo: usuários, cadastros, histórico e dados do sistema em um só lugar.",
    ],
    melhorias: [
      "Menu lateral enxuto, só com as telas do módulo: cada grupo abre e fecha pela setinha e o menu pode ser recolhido para mostrar só os ícones (o computador lembra as escolhas).",
      "Telas iniciais em cartões, com o que fazer agora primeiro.",
      "No computador, todas as telas têm o tamanho da janela: o topo e o rodapé ficam sempre à vista e só o conteúdo rola.",
      "Barras de rolagem finas, na cor do sistema.",
      "Paradas de máquina e requisições de manutenção ligadas: o tempo parado entra sozinho no boletim do dia.",
    ],
    correcoes: ["Revisão geral de segurança, privacidade (LGPD) e do funcionamento sem internet."],
  },
  {
    versao: "2.2.0",
    data: "2026-11-09",
    titulo: "Tela de início em painel",
    novidades: ["Tela de início do sistema no estilo de painel, com a escolha do módulo."],
    melhorias: ["Zerar movimento de teste com opções para os cadastros de origem e a manutenção."],
    correcoes: ["Fotos das requisições visíveis só para quem usa a manutenção."],
  },
  {
    versao: "2.1.0",
    data: "2026-11-05",
    titulo: "Menu lateral e site com fotos",
    melhorias: ["Novo visual: menu lateral no sistema e site com fotos em tela cheia."],
  },
  {
    versao: "2.0.0",
    data: "2026-11-04",
    titulo: "Serraria completa, da tora ao caminhão",
    novidades: [
      "Ficha de madeira no mesmo formato do papel da fábrica, na serraria, na estufa e no inventário.",
      "Lotes com etiqueta QR, pacotes, pedidos com volume e saldo e a tela Disponível para venda.",
      "Romaneio de expedição em PDF e Declaração de origem (português e inglês).",
      "Paradas de máquina na hora, ligadas à manutenção.",
      "Painel para a TV do barracão e página pública do pacote para o cliente (QR).",
      "Alertas da serraria e relatório mensal em PDF.",
      "Recuperar a senha pela pergunta de segurança e Política de Privacidade.",
      "Tema escuro.",
    ],
    melhorias: ["Lançamentos guardados no aparelho quando falta internet e enviados depois."],
    correcoes: ["Limite de tentativas de senha e sessões derrubadas ao trocar a senha."],
  },
  {
    versao: "1.2.0",
    data: "2026-10-31",
    titulo: "Site institucional e rastreio por QR",
    novidades: [
      "Site da Artepinus com o processo, contato e mapa.",
      "Rastreabilidade dos pacotes com QR Code.",
      "Indicadores em abas e novo seletor de mês.",
    ],
  },
  {
    versao: "1.1.0",
    data: "2026-10-25",
    titulo: "Módulo Serraria",
    novidades: ["Módulo novo para a serraria, ao lado da manutenção."],
  },
  {
    versao: "1.0.0",
    data: "2026-10-21",
    titulo: "Primeira versão",
    novidades: [
      "Requisições de manutenção com fotos, preventivas, checklists, equipamentos com QR Code e indicadores.",
      "Notificações no sininho e no celular, manual do usuário e auditoria.",
    ],
  },
];

/** Versão atual do sistema (a primeira das notas). */
export const VERSAO = NOTAS[0].versao;
export const NOTA_ATUAL = NOTAS[0];

/** A versão atual saiu há poucos dias? (selo "Novo" no cartão Novidades) */
export function versaoRecente(hoje = new Date(), dias = 7) {
  const publicada = new Date(`${NOTA_ATUAL.data}T12:00:00-03:00`).getTime();
  return hoje.getTime() - publicada < dias * 86_400_000;
}
