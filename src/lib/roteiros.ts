// Roteiros de uma página por função (para imprimir e deixar no posto de trabalho).
// Texto curto e direto: o manual completo fica em /ajuda.

export type Roteiro = {
  id: string;
  funcao: string;
  quem: string;
  quando: string;
  passos: { titulo: string; itens: string[] }[];
  atencao: string[];
};

export const ROTEIROS: Roteiro[] = [
  {
    id: "toras",
    funcao: "Recebimento de toras",
    quem: "Pátio / balança",
    quando: "A cada caminhão de toras que chega.",
    passos: [
      {
        titulo: "Registrar a carga",
        itens: [
          "No celular, abra o sistema e toque em Receber toras (Início) ou em Recebimento de toras → Nova carga.",
          "Escolha a Floresta, o Fornecedor e o Motorista. As placas do caminhão e da julieta aparecem sozinhas.",
          "Toque no diâmetro da carga: Fina, Média ou Grossa.",
          "Digite o comprimento médio das toras (m) e o peso (t) da balança.",
          "Toque em Registrar carga. O número da carga (CT-00001) aparece na tela.",
        ],
      },
    ],
    atencao: [
      "Motorista novo? Peça ao supervisor para cadastrar em Pedidos e cadastros → Motoristas, com as placas.",
      "Sem internet: registre normalmente. A carga fica guardada no celular e é enviada sozinha quando a conexão voltar.",
    ],
  },
  {
    id: "serraria",
    funcao: "Encarregado da serraria",
    quem: "Apontamento da produção serrada",
    quando: "A cada lote serrado (por pedido) e no fim do turno.",
    passos: [
      {
        titulo: "Apontar um lote",
        itens: [
          "Toque em Apontar serraria. Confira a data e escolha o Pedido.",
          "Em cada linha da ficha: escolha a espessura (23, 25, 32 ou 38) e marque as larguras (125, 100, 85, 50 ou Mista).",
          "Digite as peças em cada comprimento (2,50 · 2,10 · 1,65 · 1,30 · 1,00 · 0,70). Enter passa para o próximo.",
          "Outra medida? Toque em Adicionar linha (o botão de copiar repete espessura e larguras).",
          "Toque em Lançar e gerar etiqueta → Imprimir etiqueta e prenda a etiqueta no lote.",
        ],
      },
      {
        titulo: "Quando uma máquina parar",
        itens: [
          "Toque em Paradas de máquina → Máquina parou.",
          "Escolha a máquina, o motivo e se a falha é mecânica, elétrica ou operacional → Marcar parada agora.",
          "Mecânica/elétrica: a manutenção é avisada sozinha. Quando a máquina voltar, toque em Máquina liberada.",
        ],
      },
      {
        titulo: "No fim do turno",
        itens: [
          "Abra Serraria → o boletim do dia → Paradas e toras.",
          "As paradas marcadas na hora já estão lá. Lance só as outras: motivo, quantas vezes e os minutos.",
          "Marque as cargas de toras que foram serradas no dia e salve.",
        ],
      },
    ],
    atencao: [
      "A meta e as horas do dia vêm prontas (não precisa preencher).",
      "Sem internet: aponte normalmente. O lote é enviado e ganha a etiqueta quando a conexão voltar.",
      "Às 18h o sistema avisa se o dia ficou sem nenhum lote apontado.",
    ],
  },
  {
    id: "estufa",
    funcao: "Estufas",
    quem: "Operador de estufa / plantão",
    quando: "Ao carregar e ao descarregar cada estufa, e nas conferências do ciclo.",
    passos: [
      {
        titulo: "Carregar (iniciar o ciclo)",
        itens: [
          "Em Estufas, toque em Iniciar ciclo na estufa livre.",
          "Informe o nº do ciclo, a entrada, a previsão de saída e escolha o Plantão.",
          "Preencha a ficha da madeira carregada: espessura, larguras, peças em cada comprimento e grades úmidas.",
          "Marque os dias de serraria de onde veio a madeira e toque em Iniciar ciclo.",
        ],
      },
      {
        titulo: "Durante e no fim",
        itens: [
          "Confira o checklist da estufa: ✓ para OK, ✗ para não conforme (escreva o que houve).",
          "Ao descarregar, em Concluir ciclo informe a saída e a umidade final.",
          "Respeite a aclimatação: 24 h no pátio + 24 h na fábrica antes de usar a madeira.",
        ],
      },
    ],
    atencao: [
      "Se a estufa passar da previsão de saída, o sistema avisa o plantão e a supervisão.",
      "A ficha do mês de cada estufa (igual ao papel) fica no cartão da estufa → Madeira carregada no mês, com botão PDF.",
    ],
  },
  {
    id: "expedicao",
    funcao: "Pacotes e expedição",
    quem: "Formação de pacotes e carregamento",
    quando: "Ao formar pacotes e a cada caminhão carregado.",
    passos: [
      {
        titulo: "Formar pacotes",
        itens: [
          "Toque em Formar pacote. Escolha a estufa (pacote seco) ou o dia de serraria (pacote verde).",
          "Toque na madeira que vai formar o pacote: bitola, peças e classe vêm preenchidas.",
          "Confira o pedido e a quantidade de pacotes e toque em Formar.",
          "Imprima as etiquetas e prenda uma em cada pacote.",
        ],
      },
      {
        titulo: "Carregar o caminhão",
        itens: [
          "Em Pacotes, marque os pacotes que vão no caminhão e toque em Registrar saída.",
          "Escolha o motorista (as placas vêm sozinhas), informe a nota fiscal e confirme.",
          "Na tela do romaneio, toque em Baixar PDF do romaneio, imprima e entregue ao motorista para assinar.",
        ],
      },
    ],
    atencao: [
      "Para conferir um pacote, toque no botão do meio (Ler etiqueta) e aponte para o QR.",
      "Pacote na estufa não pode sair: primeiro conclua o ciclo da estufa.",
    ],
  },
  {
    id: "inventario",
    funcao: "Inventário do dia",
    quem: "Contagem da madeira em estoque",
    quando: "Uma vez por dia (ou quando o supervisor pedir).",
    passos: [
      {
        titulo: "Lançar o inventário",
        itens: [
          "Toque em Inventário do dia (Início) ou em Inventário de madeira → Inventário do dia.",
          "Em cada linha: escolha onde está a madeira (Grade, Pacote, a estufa ou Verde), a espessura e as larguras.",
          "Digite as peças em cada comprimento. Use Adicionar linha para cada local e medida.",
          "Toque em Registrar.",
        ],
      },
    ],
    atencao: ["Sem internet: lance normalmente; o inventário é enviado quando a conexão voltar.", "Errou? Abra o inventário em Inventário de madeira e corrija (supervisor corrige qualquer um)."],
  },
  {
    id: "supervisao",
    funcao: "Supervisão e gerência",
    quem: "Acompanhamento e cadastros",
    quando: "Todo dia, e no fechamento do mês.",
    passos: [
      {
        titulo: "Todo dia",
        itens: [
          "Abra o Início: resolva o que aparece em O que precisa de atenção (dia sem apontamento, estufa atrasada, pacotes por formar).",
          "Cadastre os pedidos novos em Pedidos e cadastros → Pedidos (nº, cliente e destino) antes de a serraria apontar.",
          "Ative os avisos no celular em Meu perfil (estufa atrasada, dia sem apontamento, pedido pronto).",
        ],
      },
      {
        titulo: "No mês",
        itens: [
          "Em Indicadores, escolha o mês e baixe o Relatório PDF (diretoria) ou o Excel.",
          "Confira os romaneios do mês em Romaneios.",
          "Na TV do barracão, deixe aberto o Painel para TV (Gestão → Painel para TV → Tela cheia).",
        ],
      },
    ],
    atencao: ["Meta e horas por dia: Pedidos e cadastros → Configuração.", "Conclua o pedido (Pedidos) quando for todo expedido, para ele sair da lista da serraria."],
  },
];
