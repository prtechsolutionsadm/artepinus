// Versão do sistema e notas de atualização (tela /novidades, cartão Novidades da tela de início e rodapé).
//
// TODA publicação com mudança que o usuário percebe sobe a versão e ganha uma entrada NOVA no topo de NOTAS
// (nunca acrescente itens a uma versão já publicada), com a versão
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
    versao: "2.7.1",
    data: "2026-11-14",
    titulo: "Abertura do aplicativo",
    melhorias: [
      "Ao abrir o aplicativo instalado no celular ou no computador, aparece uma abertura rápida com a marca da Artepinus enquanto a tela carrega.",
    ],
  },
  {
    versao: "2.7.0",
    data: "2026-11-14",
    titulo: "Início dos módulos em painel",
    melhorias: [
      "O Início da Serraria e o da Manutenção deixam os cartões: as tarefas do dia viram botões no alto, ao lado da saudação, com o número das que esperam.",
      "Os números do momento ficam numa faixa só, lado a lado (na Serraria: serrado hoje e no mês, OEE, máquinas paradas, estufas e pacotes).",
      "O que precisa de atenção, as estufas (em tabela) e as listas da Manutenção ficam em quadros, um ao lado do outro no computador.",
    ],
  },
  {
    versao: "2.6.0",
    data: "2026-11-14",
    titulo: "Telas do tamanho da janela",
    melhorias: [
      "No computador, todas as telas têm o tamanho da janela: o topo e o rodapé (com a versão) ficam sempre à vista e só o conteúdo rola.",
      "Ao voltar para uma lista, ela reabre no ponto em que você estava.",
    ],
  },
  {
    versao: "2.5.0",
    data: "2026-11-13",
    titulo: "App que se atualiza sozinho",
    novidades: [
      "O app se atualiza sozinho quando sai uma versão nova, também instalado no celular: não precisa desinstalar. Aparece o aviso Nova versão do sistema, com o botão Atualizar.",
      "Cartão Instalar o app na tela de início, nos aparelhos que permitem (no iPhone, com o passo a passo do Safari).",
    ],
  },
  {
    versao: "2.4.1",
    data: "2026-11-13",
    titulo: "Cartões dos módulos",
    melhorias: ["Na tela de início, tocar em qualquer parte do cartão do módulo já abre o módulo."],
  },
  {
    versao: "2.4.0",
    data: "2026-11-13",
    titulo: "Menu lateral com grupos",
    melhorias: [
      "No alto do menu lateral, Artepinus e o nome do módulo em uso.",
      "Cada grupo do menu (Operação, Gestão, Cadastros) abre e fecha pela setinha; o computador lembra a escolha.",
      "Recolher menu fica sozinho no rodapé do menu; o cartão de troca de módulo saiu (use Artepinus, no alto, ou Módulos, no topo).",
    ],
  },
  {
    versao: "2.3.1",
    data: "2026-11-13",
    titulo: "Logo leva à tela de início",
    melhorias: ["Tocar no logo leva sempre à tela de início do sistema, a dos módulos."],
  },
  {
    versao: "2.3.0",
    data: "2026-11-13",
    titulo: "Visual novo e manual do usuário",
    novidades: [
      "Notas de atualização: o cartão Novidades da tela de início e a versão no rodapé mostram o que mudou em cada versão.",
      "Manual do usuário refeito, com o passo a passo de cada tela; o botão ? do topo abre a ajuda da tela em que você está.",
      "Tela de início nova: saudação, resumo do momento, os módulos com o que cada um faz e cartões de Ajuda, Notificações, Novidades e Administração. Em monitores grandes, os avisos recentes ficam numa coluna à direita.",
      "Painel Administrativo: usuários, cadastros, histórico e dados do sistema em um só lugar.",
    ],
    melhorias: [
      "Menu lateral enxuto, só com as telas do módulo, que pode ser recolhido para mostrar só os ícones.",
      "Telas iniciais em cartões, com o que fazer agora primeiro.",
      "Topo e rodapé ocupam a largura toda da tela.",
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
