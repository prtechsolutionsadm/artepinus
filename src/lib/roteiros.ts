// Roteiros de uma página por função (para imprimir e deixar no posto de trabalho).
// Texto curto e direto, com os nomes dos botões como estão na tela; o passo a passo com fotos fica
// no manual (/ajuda/<secao>), para onde aponta o QR de cada folha impressa.
// Cada folha aparece só para quem usa o módulo e tem a permissão (mesmo critério do manual):
// as da Manutenção entram sozinhas quando o módulo for liberado.
import { MODULOS_ATIVOS, pode, podeProducao, temModulo, type Acao, type AcaoProducao, type Modulo, type UsuarioComPerfis } from "@/lib/permissoes";

/** Com a Manutenção em teste, ninguém recebe os avisos dela: as folhas não prometem aviso. */
const MANUTENCAO_ATIVA = MODULOS_ATIVOS.includes("manutencao");

/** O essencial da fila sem internet, nas folhas de quem lança na Serraria (detalhes em /ajuda/sem-internet). */
const FILA_SEM_INTERNET =
  "Faixa amarela no alto: lançamentos aguardando internet (Enviar agora envia na hora). Faixa vermelha: Ver → leia o motivo → Tentar de novo ou Descartar.";
const SAIR_COM_FILA =
  "Não toque em Sair com lançamentos aguardando, nem sem internet. Celular de várias pessoas: cada um entra com o próprio login para enviar os seus.";

export type Roteiro = {
  id: string;
  funcao: string;
  quem: string;
  quando: string;
  /** Módulo da função: a folha só aparece para quem usa o módulo. */
  modulo: Modulo;
  /** Permissão da Manutenção exigida (como em pode()). */
  para?: Acao;
  /** Permissão da Serraria exigida (como em podeProducao()). */
  paraProducao?: AcaoProducao;
  /** Seção do manual com o passo a passo e as fotos (/ajuda/<secao>): destino do QR da folha impressa. */
  secao: string;
  passos: { titulo: string; itens: string[] }[];
  atencao: string[];
};

export const ROTEIROS: Roteiro[] = [
  // ───────────────────────────── Serraria ─────────────────────────────
  {
    id: "toras",
    funcao: "Recebimento de toras",
    quem: "Pátio / balança",
    quando: "A cada caminhão de toras que chega.",
    modulo: "producao",
    paraProducao: "lancar",
    secao: "serraria-toras",
    passos: [
      {
        titulo: "Registrar a carga",
        itens: [
          "No Início, toque em Receber toras (Acesso rápido) ou abra Recebimento de toras → Nova carga.",
          "Confira a Data e escolha a Floresta, o Fornecedor e o Motorista. As placas do caminhão e da julieta aparecem sozinhas.",
          "Toque no Diâmetro da carga: Fina, Média ou Grossa.",
          "Digite o Comprimento médio (m) e o Peso (toneladas) da balança.",
          "Toque em Registrar carga. A carga aparece no alto da lista de Recebimento de toras (toque nela para ver o código CT-).",
        ],
      },
    ],
    atencao: [
      "Floresta, fornecedor ou motorista novo? Peça ao supervisor para cadastrar em Cadastros (o motorista com as placas).",
      "Sem internet: registre normalmente. Aparece Carga guardada no aparelho, e ela é enviada sozinha quando a conexão voltar.",
      FILA_SEM_INTERNET,
      SAIR_COM_FILA,
      "Errou? Toque na carga na lista, corrija e toque em Salvar carga (precisa de internet).",
    ],
  },
  {
    id: "serraria",
    funcao: "Encarregado da serraria",
    quem: "Apontamento da madeira serrada",
    quando: "A cada lote serrado (por pedido) e no fim do turno.",
    modulo: "producao",
    paraProducao: "lancar",
    secao: "serraria-ficha",
    passos: [
      {
        titulo: "Apontar um lote",
        itens: [
          "No Início, toque em Apontar serraria (o cartão grande). Confira a Data e escolha o Pedido.",
          "Em cada linha da ficha: escolha a espessura (23, 25, 32 ou 38) e marque as larguras (125, 100, 85, 50 ou Mista).",
          "Digite as peças em cada comprimento (2,50 · 2,10 · 1,65 · 1,30 · 1,00 · 0,70). Enter passa para o próximo.",
          "Outra medida? Toque em Adicionar linha. O botão de repetir (duas folhas) copia a espessura e as larguras na linha de baixo.",
          "Toque em Lançar e gerar etiqueta → Imprimir etiqueta → Imprimir, e prenda a etiqueta no lote.",
        ],
      },
      {
        titulo: "Quando uma máquina parar",
        itens: [
          "No Início, toque em Marcar parada (ou abra Paradas de máquina) → Máquina parou.",
          "Escolha a máquina (só aparecem as máquinas da linha), o motivo e o Tipo da falha (Mecânica, Elétrica ou Operacional) → Marcar parada agora.",
          MANUTENCAO_ATIVA
            ? "Mecânica ou elétrica: a manutenção é avisada sozinha. Quando a máquina voltar, toque em Máquina liberada."
            : "Mecânica ou elétrica: avise a manutenção pessoalmente. Quando a máquina voltar, toque em Máquina liberada.",
        ],
      },
      {
        titulo: "No fim do turno",
        itens: [
          "Abra Serraria → o boletim do dia → Paradas e toras (só o responsável pelo boletim, quem lançou o primeiro lote, ou o supervisor).",
          "As paradas marcadas na hora já estão lá. Para as outras, toque em Adicionar parada: motivo, vezes e minutos.",
          "Em Toras consumidas no dia, informe a Quantidade e o Volume (m³). Em Toras serradas no dia (outro quadro), marque as cargas que foram serradas.",
          "Toque em Salvar o dia.",
        ],
      },
    ],
    atencao: [
      "Sem internet: aponte e marque paradas normalmente (aparece Guardado no aparelho). A etiqueta do lote sai depois do envio (boletim do dia → Etiquetas de todos), e a parada guardada não avisa a manutenção: avise pessoalmente.",
      FILA_SEM_INTERNET,
      SAIR_COM_FILA,
      "Lote lançado errado? Avise o supervisor com o código LOT-: ele exclui o lote e você aponta de novo.",
      "Às 18h o sistema avisa se o dia útil ficou sem nenhum lote apontado.",
    ],
  },
  {
    id: "estufa",
    funcao: "Estufas",
    quem: "Operador de estufa / plantão",
    quando: "Ao carregar e ao descarregar cada estufa, e nas conferências do ciclo.",
    modulo: "producao",
    paraProducao: "lancar",
    secao: "serraria-estufas",
    passos: [
      {
        titulo: "Carregar (iniciar o ciclo)",
        itens: [
          "Em Estufas, toque em Iniciar ciclo na estufa livre.",
          "Informe o Nº do ciclo, a Entrada e a Previsão de saída, e escolha o Plantão (responsável).",
          "Em Madeira carregada, preencha a ficha: espessura, larguras, peças em cada comprimento e grades úmidas.",
          "Em Madeira de quais dias?, marque os dias de serraria de onde veio a madeira e toque em Iniciar ciclo.",
        ],
      },
      {
        titulo: "Durante e no fim",
        itens: [
          "Abra o ciclo e confira o Checklist da estufa: ✓ para OK, ✗ para não conforme (escreva o que houve em Observação).",
          "Ao tirar a madeira, em Concluir ciclo confira a Saída, informe a Umidade final (%) e toque em Concluir ciclo.",
          "Respeite a aclimatação: 24 h no pátio + 24 h na fábrica antes de usar a madeira.",
        ],
      },
    ],
    atencao: [
      "Se a estufa passar da previsão de saída, o sistema avisa o plantão e o supervisor.",
      "Previsão errada? Abra o ciclo, toque em Editar e em Salvar ciclo (só enquanto ele está em secagem).",
      "Iniciar e concluir o ciclo precisam de internet.",
      "A ficha do mês de cada estufa fica em Madeira carregada no mês, embaixo do cartão da estufa, com o botão PDF.",
    ],
  },
  {
    id: "expedicao",
    funcao: "Pacotes e expedição",
    quem: "Formação de pacotes e carregamento",
    quando: "Ao formar pacotes e a cada caminhão carregado.",
    modulo: "producao",
    paraProducao: "lancar",
    secao: "serraria-pacotes",
    passos: [
      {
        titulo: "Formar pacotes",
        itens: [
          "No Início, toque em Formar pacotes (ou em Pacotes → Formar pacote). Escolha Da estufa (seco) e, em Estufa, o ciclo; ou Da serraria (verde) e, em Dia de serraria, o dia.",
          "Toque na madeira do pacote: a bitola e a classe vêm prontas (com várias larguras, escolha a Largura).",
          "Peças por pacote vem com o total daquela linha: troque pelas peças de cada pacote. Em Quantos pacotes, quantos pacotes iguais.",
          "Confira o Pedido e toque em Formar pacote (ou Formar … pacotes).",
          "Toque em Imprimir etiqueta (ou Imprimir etiquetas) e prenda uma etiqueta em cada pacote.",
        ],
      },
      {
        titulo: "Carregar o caminhão",
        itens: [
          "Em Pacotes, marque os pacotes que vão no caminhão e toque em Registrar saída de ….",
          "Escolha o Motorista (as placas vêm sozinhas), informe a Nota fiscal e toque em Confirmar e gerar romaneio.",
          "No romaneio, toque em Baixar PDF do romaneio, imprima e entregue ao motorista para assinar.",
        ],
      },
    ],
    atencao: [
      "Para conferir um pacote, toque em Ler etiqueta (botão do meio) → Abrir câmera e ler a etiqueta e aponte para o QR. No iPhone, use a câmera do próprio celular ou digite o código (ex.: PCT-000123) e toque em Abrir.",
      "Pacote na estufa não pode sair: primeiro conclua o ciclo da estufa.",
      "A saída não se desfaz pelo sistema: confira os pacotes marcados antes de confirmar.",
      "Formar pacotes e registrar a saída precisam de internet.",
    ],
  },
  {
    id: "inventario",
    funcao: "Inventário do dia",
    quem: "Contagem da madeira em estoque",
    quando: "Uma vez por dia (ou quando o supervisor pedir).",
    modulo: "producao",
    paraProducao: "lancar",
    secao: "serraria-inventario",
    passos: [
      {
        titulo: "Lançar o inventário",
        itens: [
          "Abra Inventário de madeira (no menu à esquerda (no celular, em Mais), grupo Gestão; no celular, em Mais) e toque em Inventário do dia.",
          "Em cada linha, escolha em Madeira em onde está a madeira (Grade, Pacote, a estufa ou Verde), a espessura e as larguras.",
          "Digite as peças em cada comprimento. Use Adicionar linha para cada local e medida.",
          "Toque em Registrar. A ficha volta limpa para o próximo local; no fim, toque em Concluir.",
        ],
      },
    ],
    atencao: [
      "Sem internet: lance normalmente; o inventário é enviado quando a conexão voltar.",
      FILA_SEM_INTERNET,
      SAIR_COM_FILA,
      "Errou? Em Inventário de madeira → Histórico, abra o inventário, corrija e toque em Salvar (o supervisor corrige qualquer um).",
    ],
  },
  {
    id: "supervisao",
    funcao: "Supervisão da serraria",
    quem: "Supervisor e gerente",
    quando: "Todo dia, e no fechamento do mês.",
    modulo: "producao",
    paraProducao: "gerir",
    secao: "serraria-inicio",
    passos: [
      {
        titulo: "Todo dia",
        itens: [
          "Abra o Início e resolva o que aparece em O que precisa de atenção (dia sem apontamento, estufa atrasada, pacotes por formar). Em Últimos lançamentos, confira o que a equipe lançou.",
          "Cadastre os pedidos novos em Cadastros → Pedidos → Novo pedido (nº, cliente, destino, volume combinado e prazo) antes de a serraria apontar.",
          "Corrija o que foi lançado errado: lote (abra o lote → Excluir) e parada marcada por engano (lixeira em Paradas agora; a requisição aberta junto é cancelada se ninguém da manutenção a assumiu).",
          "Ative os avisos no celular em Meu perfil (estufa atrasada, dia sem apontamento, pedido pronto, máquina parada).",
        ],
      },
      {
        titulo: "No mês",
        itens: [
          "Em Indicadores, escolha o mês e baixe o Relatório PDF (diretoria) ou o Excel.",
          "Acompanhe os pedidos em Pedidos e os romaneios do mês em Romaneios.",
          "Na TV do barracão, deixe aberto o Painel para TV (Início → menu à esquerda (no celular, Mais) → Gestão → Painel para TV → Tela cheia).",
        ],
      },
    ],
    atencao: [
      "O Máquina parou só lista as máquinas marcadas em Cadastros → Máquinas da linha (Na linha ✓). Confira essa lista antes de a equipe começar a usar e quando entrar uma máquina nova.",
      "Meta, horas por dia e turno: Cadastros → Configuração (valem para os boletins novos). Cadastros, Máquinas da linha e Configuração também ficam no Painel Administrativo (tela de início → Administração).",
      "Pedido todo expedido? Conclua em Cadastros → Pedidos → lápis do pedido → Situação: Concluído → Salvar, para ele sair da lista da serraria.",
    ],
  },

  // ───────────────────────────── Manutenção ─────────────────────────────
  {
    id: "abrir-requisicao",
    funcao: "Abrir requisição",
    quem: "Operador / quem achar o defeito",
    quando: "Sempre que uma máquina ou instalação precisar de manutenção.",
    modulo: "manutencao",
    secao: "manutencao-abrir",
    passos: [
      {
        titulo: "Abrir pelo celular",
        itens: [
          "Toque no botão + do meio da barra de baixo (no computador, em Nova requisição, no Início).",
          "Em O que precisa ser feito?, escreva um título curto. Em Descrição detalhada, conte o problema.",
          "Escolha o Equipamento (não sabe? — Não se aplica / não sei —), a Prioridade e, em Local, onde fica.",
          "A máquina parou de funcionar? Marque A máquina está parada.",
          "Em Fotos do problema, toque em Tirar foto (até 6) e depois em Abrir requisição. Anote o número (ex.: #00012).",
        ],
      },
      {
        titulo: "Pelo QR da máquina",
        itens: [
          "Aponte a câmera do celular para a etiqueta QR da máquina e toque no link.",
          "Veja Requisições em aberto para esta máquina: se o problema já está lá, abra e comente nela.",
          "Se não, toque em Abrir requisição para esta máquina: o equipamento já vem escolhido.",
        ],
      },
      {
        titulo: "Acompanhar",
        itens: [
          "No Início, em Minhas requisições, toque na sua para ver o status e o histórico (ou, em Requisições, marque Abertas por mim → Filtrar).",
          "Quer acrescentar algo? Escreva em Adicionar comentário e toque em Comentar.",
        ],
      },
    ],
    atencao: [
      "Sem internet: abra normalmente. A requisição fica guardada no aparelho e é enviada quando a conexão voltar. Se for urgente, avise pessoalmente.",
      "Abriu errado? Enquanto ela está Aberta, toque em Cancelar requisição e escreva o motivo.",
      ...(MANUTENCAO_ATIVA ? ["Ative os avisos em Meu perfil: você é avisado a cada mudança de status da sua requisição."] : []),
    ],
  },
  {
    id: "atender-requisicao",
    funcao: "Atender requisição",
    quem: "Manutentor",
    quando: "A cada requisição que chega ou que é passada para você.",
    modulo: "manutencao",
    para: "atenderRequisicoes",
    secao: "manutencao-atender",
    passos: [
      {
        titulo: "Assumir",
        itens: [
          "Abra a requisição pelo aviso, pelo Início (Atribuídas a mim ou Sem responsável) ou pela lista Requisições.",
          "No quadro Atualizar requisição (no celular, no fim da página), escolha o seu nome em Responsável e o Status Em análise ou Em andamento → Salvar.",
          "Vai fazer depois? Status Agendada, com a Data agendada. Falta peça? Aguardando peças.",
        ],
      },
      {
        titulo: "Durante o serviço",
        itens: [
          "Em Horas trabalhadas, informe Quando começou, as Horas e os Minutos → Registrar horas (uma vez por período).",
          "Checklist: toque em cada item quando fizer.",
          "Fotos do serviço: no quadro Fotos, escolha Do serviço realizado, adicione as fotos e toque em Enviar fotos.",
          "Máquina da linha da serraria voltou a funcionar? Toque em Máquina liberada, na faixa vermelha do alto.",
        ],
      },
      {
        titulo: "Concluir",
        itens: ["Mude o Status para Concluída, descreva o Serviço realizado e toque em Salvar."],
      },
    ],
    atencao: [
      "Só conclui com o Serviço realizado preenchido e todos os itens do checklist marcados.",
      "Selo verde Máquina liberada na lista: a serraria já liberou a máquina. Confira o serviço e conclua.",
      "A máquina voltou antes de concluir? Preencha Voltou a operar em antes de salvar.",
    ],
  },
  {
    id: "supervisao-manutencao",
    funcao: "Supervisão da manutenção",
    quem: "Supervisor e gerente",
    quando: "Todo dia (triagem) e no planejamento da semana e do mês.",
    modulo: "manutencao",
    para: "preventivas",
    secao: "manutencao-preventivas",
    passos: [
      {
        titulo: "Todo dia: triagem",
        itens: [
          "No Início, veja Máquinas paradas agora e Prioridade alta e urgente.",
          "Toque em Sem responsável (Acesso rápido do Início) para ver as que ninguém assumiu; para as ainda Abertas, filtre o Status Aberta em Requisições.",
          "Em cada uma, no quadro Atualizar requisição, escolha o Responsável e o Status (Em análise, Planejada ou Agendada, com a Data agendada) → Salvar.",
          "Repetida ou sem motivo? Status Cancelada, com o motivo em Observação / motivo.",
        ],
      },
      {
        titulo: "Planejamento",
        itens: [
          "Agenda: atualize as Agendadas com data vencida (em vermelho).",
          "Preventivas → Novo plano de preventiva: equipamento, o que será feito, Repetir a cada e Próxima execução → Criar plano.",
          "Checklists → Novo checklist: um item por linha → Criar checklist.",
          "Máquina nova: Equipamentos → Cadastrar equipamento; depois, Etiquetas QR para colar na máquina.",
        ],
      },
      {
        titulo: "No mês",
        itens: [
          "Indicadores: escolha o período e toque em Aplicar (disponibilidade, MTTR, MTBF).",
          "Relatórios: escolha De e Até, toque em Gerar relatório e depois em Exportar PDF ou Exportar Excel.",
        ],
      },
    ],
    atencao: [
      "Selo verde Máquina liberada na lista: a máquina já voltou; falta o responsável conferir e concluir.",
      "Os números de parada dependem de marcar A máquina está parada nas requisições.",
      MANUTENCAO_ATIVA
        ? "Ative os avisos no celular em Meu perfil: requisição nova, máquina parada e máquina liberada."
        : "Enquanto a Manutenção está em teste, ninguém recebe os avisos dela: acompanhe pelo Início.",
    ],
  },
];

/** Folhas que a pessoa enxerga: o módulo (temModulo) e a permissão (pode/podeProducao), como no manual. */
export function roteirosPara(u: UsuarioComPerfis): Roteiro[] {
  return ROTEIROS.filter(
    (r) => temModulo(u, r.modulo) && (!r.para || pode(u.perfil, r.para)) && (!r.paraProducao || podeProducao(u, r.paraProducao)),
  );
}
