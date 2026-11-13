import { MODULOS_ATIVOS } from "@/lib/permissoes";
import type { Bloco, Captura, Secao } from "./tipos";

// Módulo Serraria, na ordem do processo (da tora ao caminhão). Os nomes de botões, menus e campos
// são os da tela: mudou a tela, mude aqui. Tópicos de lançamento têm paraProducao "lancar";
// os de exclusão e cadastro, "gerir"; o resto vale para todos do módulo (inclusive o perfil Consulta).

/** Com a Manutenção em teste, a tela das paradas não promete que a manutenção foi avisada. */
const MANUTENCAO_ATIVA = MODULOS_ATIVOS.includes("manutencao");

const texto = (t: string): Bloco => ({ tipo: "texto", texto: t });
const passos = (...itens: string[]): Bloco => ({ tipo: "passos", itens });
const lista = (...itens: string[]): Bloco => ({ tipo: "lista", itens });
const dica = (t: string): Bloco => ({ tipo: "dica", texto: t });
const atencao = (t: string): Bloco => ({ tipo: "atencao", texto: t });
const termos = (...itens: [string, string][]): Bloco => ({ tipo: "termos", itens });
const imagem = (c: Captura): Bloco => ({ tipo: "imagem", imagem: c });

const SEM_INTERNET = "Veja “Trabalhar sem internet” (/ajuda/sem-internet).";

/** Módulo Serraria, na ordem do processo. */
export const SERRARIA: Secao[] = [
  // ───────────────────────────── Início ─────────────────────────────
  {
    id: "serraria-inicio",
    grupo: "serraria",
    titulo: "Início da Serraria",
    resumo: "O resumo de hoje, o que precisa de atenção, o Acesso rápido, as estufas e o mês, todas as telas e quem faz o quê",
    rotas: ["/producao"],
    topicos: [
      {
        id: "o-caminho-da-madeira",
        titulo: "Da tora ao caminhão: o caminho da madeira",
        palavras: ["processo", "etapas", "rastreabilidade", "rastreio", "origem", "como funciona", "fluxo"],
        blocos: [
          texto("O sistema acompanha a madeira em quatro etapas, na mesma ordem das telas do grupo Operação (os números 1 a 4 nos cartões). Cada etapa liga a madeira à anterior: é isso que permite mostrar, no QR do pacote, de qual floresta ela veio."),
          passos(
            "Recebimento de toras: cada carga que chega no pátio é registrada com a floresta, o fornecedor e o motorista (código CT-000123).",
            "Serraria: a madeira serrada é apontada na ficha, por pedido. Cada lançamento vira um lote com etiqueta (LOT-000123). Todos os lotes do dia formam o boletim do dia, onde também entram as paradas e as cargas de toras serradas.",
            "Estufas: no ciclo de secagem, marque de quais dias de serraria veio a madeira que entrou na estufa.",
            "Pacotes e expedição: o pacote é formado com a madeira seca da estufa (ou verde, direto da serraria), ganha a etiqueta com QR (PCT-000123) e sai no caminhão com o romaneio (ROM-000123).",
          ),
          dica("A madeira de vários dias e de várias cargas se mistura no processo. Por isso a origem de um pacote mostra o conjunto de cargas e florestas que formaram ele. Para a origem chegar até a floresta, não esqueça de marcar as cargas serradas no boletim do dia e os dias de serraria no ciclo da estufa."),
        ],
      },
      {
        id: "situacao-agora",
        titulo: "Resumo de hoje, Estufas agora e Serrado no mês",
        palavras: ["painel", "resumo", "faixa verde", "hoje", "situação agora", "estoque", "meta", "oee", "estufas", "ultimos lancamentos", "quem lançou"],
        blocos: [
          termos(
            ["Faixa verde", "No alto do Início: a saudação com o seu nome, Serraria · (o seu perfil) e a data de hoje."],
            [
              "Resumo de hoje",
              "O cartão branco sobre a faixa. Hoje: … serrados abre o boletim de hoje (sem lote, aparece Hoje: ainda sem apontamento). Depois: as máquinas paradas (em vermelho, só quando há), quantas estufas estão secando (em vermelho se alguma passou da previsão) e os pacotes em estoque, com o m³ e, embaixo, quantos estão verdes, na estufa e secos. Toque num deles para ver a lista.",
            ],
            ["Estufas agora", "Um quadrinho por estufa. Cinza: livre (quem lança toca para iniciar um ciclo). Laranja: secando, com o tempo desde a entrada, o volume e a barra até a previsão de saída. Vermelho: passou da previsão. Toque para abrir o ciclo; Ver estufas abre a tela das estufas."],
            ["Serrado no mês", "O volume serrado no mês (m³), quantos dias tiveram apontamento, quanto isso é da meta (com a barra) e a Meta e o OEE do mês. Toque no cartão para abrir os Indicadores."],
            ["Últimos lançamentos", "Só para o supervisor e o gerente: o que foi lançado por último na Serraria, com o nome de quem lançou e a hora."],
          ),
        ],
      },
      {
        id: "o-que-precisa-de-atencao",
        titulo: "O que precisa de atenção",
        palavras: ["pendência", "pendencias", "avisos", "alerta", "atrasado", "atrasada", "tudo em dia"],
        blocos: [
          texto(
            "O quadro O que precisa de atenção, logo abaixo do resumo de hoje, lista o que está faltando ou atrasado, com quantos são ao lado do título. Cada linha tem um botão que leva direto à tela de resolver. Aparecem até 6; as outras ficam em Ver mais … pendências. Quando não há nada, aparece Tudo em dia. Nenhuma pendência.",
          ),
          termos(
            [
              "Máquina parada há…",
              `Uma máquina da linha está parada agora. Embaixo aparecem o motivo e a requisição de manutenção, se houver (${
                MANUTENCAO_ATIVA ? "manutenção avisada" : "requisição #00012"
              }, ou marcada na requisição #00012 quando a parada veio da Manutenção). Liberar abre Paradas de máquina, onde se toca em Máquina liberada quando ela voltar.`,
            ],
            ["Boletim da serraria de … sem apontamento", "Um dia útil (segunda a sexta) dos últimos cinco ficou sem nenhum lote. Apontar abre a ficha já com aquela data."],
            ["Estufa passou da previsão de saída", "O ciclo passou da hora prevista para sair. Ver ciclo abre o ciclo para concluir ou corrigir a previsão."],
            ["Estufa concluída sem pacotes formados", "Um ciclo dos últimos 30 dias terminou e a madeira ainda não virou pacote. Formar pacotes abre a tela de pacotes já com esse ciclo."],
            [
              "Carga CT-… sem floresta informada",
              "Carga no formato antigo, de antes do cadastro de florestas: os pacotes feitos com ela não chegam até a floresta. Ver carga abre a carga, só para leitura (ela não pode ser corrigida). A pendência sai desta lista depois de 30 dias.",
            ],
            ["Boletim de … sem as cargas de toras serradas", "O dia foi apontado, mas não diz quais cargas foram serradas. Marcar cargas abre Paradas e toras do boletim."],
          ),
          dica("Os botões das pendências só aparecem para quem lança na Serraria (supervisor e apontador). Quem tem o perfil Consulta vê a lista, sem os botões."),
          imagem({ arquivo: "serraria/inicio.webp", legenda: "Início da Serraria no celular: a faixa verde, o resumo de hoje e o que precisa de atenção.", rota: "/producao", perfil: "apontador" }),
        ],
      },
      {
        id: "lancar",
        titulo: "Acesso rápido: as tarefas do dia",
        palavras: ["atalhos", "acesso rápido", "acesso rapido", "tarefa principal", "lançar", "começar", "novo", "nova", "apontamento", "botões", "onde lanço"],
        blocos: [
          texto("Logo abaixo do quadro O que precisa de atenção, o Acesso rápido traz a tarefa principal da sua função num cartão grande e as outras tarefas do dia nos cartões ao lado. Para quem lança (supervisor e apontador):"),
          termos(
            ["Apontar serraria", "A tarefa principal: a ficha da serraria, onde cada lançamento vira um lote com etiqueta. O cartão diz quantos lotes já foram apontados hoje."],
            ["Receber toras", "Nova carga de toras no pátio."],
            ["Marcar parada", "Abre Paradas de máquina para marcar a parada na hora. Com máquina parada, o cartão mostra quantas."],
            ["Ler etiqueta", "Abre um pacote ou um lote pelo QR."],
            ["Formar pacotes", "Forma pacotes e imprime as etiquetas com QR. Quando um ciclo de estufa terminou e a madeira ainda não virou pacote, o cartão diz quantos."],
          ),
          texto("Quem tem o perfil Consulta vê Indicadores como tarefa principal e, ao lado, Pedidos, Estufas (com as atrasadas), Pacotes e Ler etiqueta."),
          dica(
            "Iniciar um ciclo, o Inventário do dia e Expedir pacotes ficam nas próprias telas: Estufas, Inventário de madeira e Pacotes e expedição (no fim do Início, em Todas as telas; no celular, Estufas e Pacotes estão também na barra de baixo).",
          ),
        ],
      },
      {
        id: "menu",
        titulo: "Todas as telas da Serraria",
        palavras: ["menu", "todas as telas", "onde fica", "navegar", "cartões", "barra de baixo", "mais", "grupos", "operação", "gestão", "cadastros", "lupa"],
        blocos: [
          texto(
            "No fim do Início, Todas as telas tem um cartão para cada tela da Serraria que o seu perfil pode abrir, com uma linha dizendo para que serve. Os grupos seguem a ordem do processo. No celular, as mesmas telas ficam em Mais.",
          ),
          termos(
            ["Operação", "1 Recebimento de toras → 2 Serraria → Paradas de máquina → 3 Estufas → 4 Pacotes e expedição, Romaneios e Ler etiqueta."],
            ["Gestão", "Pedidos, Disponível para venda, Indicadores, Painel para TV e Inventário de madeira."],
            ["Cadastros", "Cadastros da Serraria (só o supervisor). Usuários e Auditoria aparecem só para o gerente."],
            ["Início", "O logo do topo volta a esta tela, de qualquer lugar (no celular, também a aba Início da barra de baixo)."],
            ["Sua conta", "Notificações, Meu perfil, Manual do usuário e Sair não são cartões: no computador, use o sininho, o botão de ajuda (?) e o seu nome, no topo; no celular, Mais › Sua conta."],
          ),
          texto("No celular, a barra de baixo tem Início, Pacotes, o botão do meio Ler etiqueta, Estufas e Mais. A lupa no topo abre a busca (pacote, lote, carga, romaneio, pedido, cliente, motorista, placa); no computador, a busca fica no meio do topo."),
          dica("Mais sobre o topo, a busca e o botão de ajuda em “Navegação” (/ajuda/navegacao)."),
          imagem({
            arquivo: "serraria/inicio-computador.webp",
            legenda: "No computador, Todas as telas, no fim do Início: os grupos Operação, Gestão e Cadastros em cartões.",
            rota: "/producao",
            perfil: "supervisor",
            tela: "computador",
            acoes: [{ rolarAte: "text=Todas as telas" }],
          }),
        ],
      },
      {
        id: "perfis",
        titulo: "Quem faz o quê na Serraria",
        palavras: ["perfil", "permissão", "permissao", "acesso", "supervisor", "apontador", "encarregado", "consulta", "gerente", "não aparece o botão", "sem permissão"],
        blocos: [
          texto("Cada pessoa tem um perfil na Serraria. Os botões que a pessoa não pode usar não aparecem na tela."),
          termos(
            ["Apontador", "O encarregado. Aponta os lotes, marca e libera paradas, inicia e conclui ciclos de estufa e marca o checklist, registra cargas de toras e o inventário, forma pacotes, envia pacotes à estufa e registra a saída do caminhão. Corrige as cargas, os inventários e o boletim que ele mesmo lançou. Lote lançado errado, só o supervisor exclui."],
            ["Supervisor", "Tudo o que o apontador faz e mais: corrige qualquer boletim, carga ou inventário; exclui lotes, boletins, cargas e inventários; cancela pacotes e ciclos; apaga paradas marcadas por engano; cuida dos Cadastros (pedidos, florestas, fornecedores, motoristas, motivos de parada, máquinas da linha, estufas e configuração)."],
            ["Consulta", "Vê o Início, os boletins, as estufas, os pacotes, os pedidos, os indicadores e o inventário, sem lançar nada."],
            ["Gerente", "Acesso total à Serraria, mais Usuários e Auditoria."],
          ),
          dica("O perfil de cada pessoa é definido pelo gerente, em “Usuários” (/ajuda/usuarios)."),
        ],
      },
      {
        id: "avisos-da-serraria",
        titulo: "Avisos da Serraria",
        palavras: ["notificação", "notificacoes", "sininho", "aviso", "alerta", "push", "celular apitou"],
        blocos: [
          texto("Além do sininho, os avisos chegam no celular de quem ativou as notificações neste aparelho. A Serraria avisa:"),
          termos(
            ["Estufa passou da previsão de saída", "Para o supervisor, o apontador, o plantão do ciclo e quem iniciou o ciclo. Sai uma vez por previsão; mudar a previsão pode gerar o aviso de novo."],
            ["Serraria sem apontamento hoje", "Às 18h de um dia útil sem nenhum lote, para o supervisor e o apontador. Tocar abre a ficha daquele dia."],
            ["Pedido pronto para expedir", "Para o supervisor, quando os pacotes secos do pedido cobrem o que falta sair."],
            ["Máquina parada", "Para o supervisor, quando alguém toca em Máquina parou."],
            ["Máquina liberada", "Para o supervisor e para quem marcou a parada, quando a máquina é liberada na serraria (quem liberou não recebe)."],
            ...(MANUTENCAO_ATIVA
              ? ([
                  ["Máquina liberada pela manutenção", "Para o supervisor e para quem marcou a parada, quando a manutenção conclui a requisição informando o fim da parada (ou toca em Máquina liberada na requisição)."],
                  ["Parada corrigida pela manutenção", "Para o supervisor e para quem marcou a parada, quando a manutenção acerta o início ou o fim de uma parada já liberada; o boletim já foi atualizado."],
                  ["#00012 cancelada · (máquina)", "Para o supervisor e para quem marcou a parada, quando a manutenção cancela a requisição com a parada da serraria ainda aberta: toque em Máquina liberada quando a máquina voltar."],
                ] as [string, string][])
              : []),
          ),
          texto("O gerente recebe os mesmos avisos do supervisor."),
          dica("Para ligar ou desligar os avisos no celular, veja “Avisos” (/ajuda/avisos)."),
        ],
      },
    ],
  },

  // ───────────────────────────── 1 Toras ─────────────────────────────
  {
    id: "serraria-toras",
    grupo: "serraria",
    titulo: "Recebimento de toras",
    resumo: "Registrar a carga que chega no pátio, consultar as cargas do mês e corrigir uma carga",
    rotas: ["/producao/toras"],
    topicos: [
      {
        id: "registrar-carga",
        titulo: "Registrar uma carga de toras",
        paraProducao: "lancar",
        rotas: ["/producao/toras/nova"],
        palavras: ["nova carga", "caminhão", "caminhao", "toras", "chegou", "pátio", "patio", "receber", "peso", "diâmetro", "lançar carga"],
        blocos: [
          passos(
            "Em Recebimento de toras, toque em Nova carga (ou, no Início, em Receber toras).",
            "Confira a Data (vem a de hoje; não aceita data futura).",
            "Escolha a Floresta, o Fornecedor e o Motorista. A Placa do caminhão e a Placa da julieta aparecem sozinhas, do cadastro do motorista.",
            "Toque no Diâmetro: Fina, Média ou Grossa.",
            "Preencha o Comprimento médio (m) e o Peso (toneladas). Se precisar, escreva em Observações.",
            "Toque em Registrar carga. A carga ganha o código CT-000123 e aparece na lista do mês.",
          ),
          dica("A floresta, o fornecedor ou o motorista não está na lista? Peça ao supervisor para cadastrar em Cadastros. A floresta é o que liga os pacotes à origem: escolha sempre a certa."),
          dica(`Funciona sem internet: a carga fica guardada no aparelho (aparece Carga guardada no aparelho) e é enviada sozinha quando a conexão voltar. Já dá para lançar a próxima. ${SEM_INTERNET}`),
          imagem({ arquivo: "serraria/toras-nova.webp", legenda: "Nova carga de toras: floresta, fornecedor e motorista (as placas vêm do cadastro), diâmetro e peso.", rota: "/producao/toras/nova", perfil: "apontador" }),
        ],
      },
      {
        id: "cargas-do-mes",
        titulo: "Cargas do mês e peso por diâmetro",
        palavras: ["lista de cargas", "mês", "mes", "peso recebido", "toneladas", "consultar carga", "CT-"],
        blocos: [
          texto("A tela Recebimento de toras mostra as cargas do mês, da mais nova para a mais antiga: data, floresta, fornecedor, peso, diâmetro, motorista, placa e o código CT-."),
          lista(
            "Para mudar o mês, use as setas ao lado do nome do mês (ou toque no nome para escolher outro mês).",
            "No alto: o total de Cargas e o Peso recebido no mês.",
            "Peso por diâmetro: quantas toneladas e cargas de toras finas, médias e grossas chegaram no mês.",
            "Toque numa carga para ver os detalhes.",
          ),
          imagem({ arquivo: "serraria/toras.webp", legenda: "Recebimento de toras: as cargas do mês e o peso por diâmetro.", rota: "/producao/toras", perfil: "apontador" }),
        ],
      },
      {
        id: "corrigir-carga",
        titulo: "Corrigir ou excluir uma carga",
        paraProducao: "lancar",
        palavras: ["corrigir", "editar", "alterar", "errei", "errado", "apagar", "excluir", "deletar", "carga errada"],
        blocos: [
          passos(
            "Em Recebimento de toras, toque na carga (se for de outro mês, troque o mês antes).",
            "Corrija os campos e toque em Salvar carga.",
          ),
          lista(
            "Quem registrou a carga corrige a própria carga; o supervisor corrige qualquer uma. Para os outros, a carga abre só para leitura.",
            "Corrigir precisa de internet (só uma carga nova fica guardada no aparelho).",
            "Carga antiga, registrada antes do cadastro de florestas, abre só para leitura (aparece Carga registrada no formato antigo).",
          ),
          atencao("Excluir: só o supervisor vê o botão Excluir na carga. Use só para carga lançada em dobro ou por engano."),
        ],
      },
    ],
  },

  // ───────────────────────────── 2 Serraria: ficha e lote ─────────────────────────────
  {
    id: "serraria-ficha",
    grupo: "serraria",
    titulo: "Apontar a serraria: ficha, lote e etiqueta",
    resumo: "Preencher a ficha da serraria por pedido, gerar o lote, imprimir e reimprimir a etiqueta",
    rotas: ["/producao/boletins/novo", "/producao/lotes", "/l"],
    topicos: [
      {
        id: "apontar-lote",
        titulo: "Apontar um lote",
        paraProducao: "lancar",
        rotas: ["/producao/boletins/novo"],
        palavras: ["apontar", "apontamento", "lançar", "lancar", "serrar", "serrado", "ficha", "lote", "boletim", "madeira serrada", "pedido"],
        blocos: [
          texto("Cada lançamento na ficha é a madeira serrada de um pedido e vira um lote com etiqueta (LOT-000123). O boletim do dia é aberto sozinho no primeiro lote e junta todos os lotes do dia."),
          passos(
            "No Início, toque em Apontar serraria, o cartão grande do Acesso rápido (ou abra a tela Serraria e toque em Apontar serraria).",
            "Confira a Data (vem a de hoje) e escolha o Pedido. Cada pedido mostra o cliente, o destino e quanto ainda falta serrar. Meta e Horas aparecem só para leitura.",
            "Em Madeira serrada, preencha a ficha igual à de papel: em cada linha, a espessura, as larguras e as peças em cada comprimento (veja “Como preencher a ficha” (/ajuda/serraria-ficha#como-preencher-a-ficha)).",
            "Confira o total de peças e o m³ embaixo da ficha.",
            "Toque em Lançar e gerar etiqueta. Aparece Lote LOT-000123 lançado com o botão Imprimir etiqueta.",
            "Imprima a etiqueta e prenda na madeira do lote.",
            "Para o próximo lote, a ficha volta limpa, com a espessura e as larguras da última linha. Troque o pedido se for outro.",
          ),
          lista(
            "Já existe o boletim daquela data? O botão Boletim do dia, no alto, abre o boletim.",
            "Limpar ficha apaga o que foi digitado e ainda não foi lançado.",
            "Nenhum pedido aparece? É preciso ter um pedido aberto: peça ao supervisor (Cadastros → Pedidos).",
          ),
          imagem({ arquivo: "serraria/ficha.webp", legenda: "Apontar serraria no celular: data, pedido e a ficha, uma linha por medida.", rota: "/producao/boletins/novo", perfil: "apontador" }),
          imagem({
            arquivo: "serraria/ficha-computador.webp",
            legenda: "No computador, a ficha fica igual à de papel: espessura, larguras e as peças em cada comprimento.",
            rota: "/producao/boletins/novo",
            perfil: "apontador",
            tela: "computador",
          }),
        ],
      },
      {
        id: "como-preencher-a-ficha",
        titulo: "Como preencher a ficha",
        palavras: ["ficha", "espessura", "largura", "mista", "comprimento", "peças", "pecas", "classe", "m3", "metro cúbico", "linha", "repetir", "copiar", "enter"],
        blocos: [
          texto("A mesma ficha é usada na serraria, no ciclo da estufa e no inventário. Cada linha é uma medida: espessura + larguras + as peças em cada comprimento."),
          termos(
            ["Espessura", "23, 25, 32 ou 38 mm."],
            ["Larguras", "Marque 125, 100, 85 e 50 (pode marcar várias juntas) ou Mista. Mista desmarca as outras, e vice-versa."],
            ["Comprimentos", "Digite as peças em cada um: 2,50 · 2,10 · 1,65 · 1,30 · 1,00 · 0,70 m. Enter passa para o próximo comprimento; no último, para a linha de baixo."],
            ["Classe", "Sai sozinha pelo comprimento: 2,50 e 2,10 m Ótimo; 1,65 m Bom; 1,30, 1,00 e 0,70 m Regular."],
            ["m³", "Calculado sozinho. Com várias larguras marcadas, usa a média delas; Mista usa a média de todas."],
            ["Repetir linha", "O botão de copiar cria uma linha embaixo com a mesma espessura e larguras, para digitar só as peças."],
            ["Remover linha", "A lixeira apaga a linha (com peças digitadas, pede confirmação)."],
            ["Adicionar linha", "Abre uma linha nova no fim, com a mesma espessura da última."],
          ),
          dica("No celular, cada linha é um cartão (Linha 1, Linha 2…); no computador, a ficha é uma tabela igual à do papel, com os totais por comprimento embaixo."),
          atencao("A ficha não deixa lançar linha com peças sem a espessura ou sem a largura: a mensagem diz qual linha falta."),
        ],
      },
      {
        id: "etiqueta-do-lote",
        titulo: "Imprimir e reimprimir a etiqueta do lote",
        rotas: ["/producao/lotes/etiquetas"],
        palavras: ["etiqueta", "imprimir", "impressora", "reimprimir", "segunda via", "código de barras", "codigo de barras", "QR", "LOT-"],
        blocos: [
          texto("A etiqueta do lote tem o código LOT-000123, a data, as medidas, as peças, o m³, as peças por classe, o pedido e o cliente, com um QR Code e um código de barras."),
          passos(
            "Depois de lançar, toque em Imprimir etiqueta (na mensagem verde do lote).",
            "Na tela Etiquetas de lote, toque em Imprimir e escolha a impressora.",
            "Prenda a etiqueta na madeira do lote.",
          ),
          lista(
            "Reimprimir uma etiqueta: abra o lote e toque em Etiqueta.",
            "Etiquetas de todos os lotes do dia: abra o boletim do dia e toque em Etiquetas de todos.",
          ),
          dica("O QR leva à página do lote no sistema (pede login). O código de barras serve para a leitura rápida no chão de fábrica."),
        ],
      },
      {
        id: "pagina-do-lote",
        titulo: "A página do lote",
        rotas: ["/producao/lotes", "/l"],
        palavras: ["lote", "LOT-", "ver lote", "qr do lote", "pdf", "ficha do lote"],
        blocos: [
          texto("O QR da etiqueta (ou a busca por LOT-000123) abre a página do lote. Ela mostra o Pedido, o Destino, o Dia, a Espessura, as Peças e o Volume, com o link Ver o dia na serraria para o boletim."),
          lista(
            "Em Madeira serrada fica a ficha lançada, linha por linha.",
            "O botão PDF baixa a ficha do lote no desenho do papel (é gerado no próprio aparelho).",
            "O botão Etiqueta abre a etiqueta para imprimir de novo.",
          ),
        ],
      },
      {
        id: "apontar-dia-anterior",
        titulo: "Apontar um dia anterior",
        paraProducao: "lancar",
        palavras: ["ontem", "dia anterior", "esqueci", "atrasado", "outro dia", "data", "retroativo"],
        blocos: [
          passos(
            "Em Apontar serraria, troque a Data para o dia certo (não aceita data futura).",
            "Escolha o pedido, preencha a ficha e toque em Lançar e gerar etiqueta.",
          ),
          lista(
            "Pela pendência Boletim da serraria de … sem apontamento, no Início, o botão Apontar já abre a ficha com aquela data.",
            "Pelo boletim de um dia, o botão Apontar lote também abre a ficha com a data do boletim.",
          ),
        ],
      },
      {
        id: "lote-errado",
        titulo: "Lancei um lote errado",
        paraProducao: "lancar",
        palavras: ["errei", "errado", "corrigir", "editar lote", "apagar lote", "excluir lote", "desfazer", "cancelar lote"],
        blocos: [
          texto("O lote não se edita. Para corrigir, o supervisor exclui o lote errado e o apontador lança de novo."),
          passos(
            "Avise o supervisor com o código do lote (LOT-000123).",
            "O supervisor abre o lote (pela busca, pelo QR ou pelo boletim do dia) e toca em Excluir. As peças saem do boletim do dia.",
            "Aponte o lote certo de novo na ficha e imprima a etiqueta nova.",
            "Jogue fora a etiqueta antiga.",
          ),
        ],
      },
      {
        id: "sem-internet",
        titulo: "Apontar sem internet",
        paraProducao: "lancar",
        palavras: ["offline", "sem internet", "sem sinal", "guardado no aparelho", "fila", "etiqueta não saiu"],
        blocos: [
          texto("A tela Apontar serraria abre sem internet, desde que o aparelho já tenha entrado no sistema com internet antes."),
          lista(
            "Ao lançar sem internet, aparece Guardado no aparelho (sem internet): o lote é enviado sozinho quando a conexão voltar.",
            "A etiqueta só é gerada depois do envio, porque o código LOT- vem do sistema. Quando a internet voltar, abra o boletim do dia e toque em Etiquetas de todos.",
            "O lote guardado pertence a quem lançou: só é enviado com essa mesma pessoa logada no aparelho.",
          ),
          dica(SEM_INTERNET),
        ],
      },
    ],
  },

  // ───────────────────────────── Boletim do dia ─────────────────────────────
  {
    id: "serraria-boletins",
    grupo: "serraria",
    titulo: "Boletim do dia",
    resumo: "Os boletins do mês, o que tem no boletim, paradas e toras do dia e como corrigir",
    rotas: ["/producao/boletins"],
    topicos: [
      {
        id: "boletins-do-mes",
        titulo: "Boletins do mês",
        palavras: ["boletins", "lista", "mês", "mes", "dias", "serrado no mês", "meta acumulada", "tempo parado", "oee do mês", "serraria"],
        blocos: [
          texto("Em Serraria (no Início, em Todas as telas → Operação), a tela Boletins da serraria mostra um boletim por dia do mês, do mais novo para o mais antigo."),
          lista(
            "Para mudar o mês, use as setas ao lado do nome do mês (ou toque no nome para escolher).",
            "No alto, os totais do mês: Serrado no mês, Meta acumulada, Tempo parado e OEE do mês.",
            "Em cada dia: o volume serrado, quanto da meta foi atingido, o tempo parado, o OEE e quem é o responsável pelo boletim.",
            "Toque num dia para abrir o boletim. O botão Apontar serraria abre a ficha.",
          ),
          imagem({ arquivo: "serraria/boletins.webp", legenda: "Boletins da serraria: os totais do mês e um boletim por dia.", rota: "/producao/boletins", perfil: "apontador" }),
        ],
      },
      {
        id: "o-boletim",
        titulo: "O que tem no boletim do dia",
        palavras: ["boletim", "indices", "índices", "disponibilidade", "produtividade", "rendimento", "lotes do dia", "rastreabilidade", "responsável"],
        blocos: [
          texto("Existe um boletim por data. Ele é aberto sozinho no primeiro lote do dia (ou por uma parada de máquina liberada) e o responsável é quem lançou o primeiro lote."),
          termos(
            ["Cartões do alto", "Serrado (e a meta), Disponibilidade, Produtividade, OEE, os m³ de cada classe (Ótimo, Bom, Regular) e o Rendimento (só com as toras do dia informadas)."],
            ["Lotes do dia", "Cada lote com o código, as medidas, as peças, o m³ e o pedido. Toque para abrir o lote. Etiquetas de todos imprime as etiquetas de todos os lotes do dia."],
            ["Paradas", "As paradas do dia, com o total de cada tipo (MEC, ELE, OPE). As marcadas na hora mostram o início e o fim; só o tempo dentro do turno conta."],
            ["Rastreabilidade", "As cargas de toras serradas no dia, as estufas que receberam a madeira do dia e os pacotes verdes formados com ela."],
            ["Observações", "O que foi escrito em Observações do dia."],
          ),
          lista(
            "Apontar lote abre a ficha com a data do boletim (para quem lança).",
            "Paradas e toras abre o formulário do dia (só para o responsável e o supervisor).",
            "Formar pacote verde deste dia abre a tela de pacotes com a madeira deste dia (para quem lança; veja “Formar pacotes” (/ajuda/serraria-pacotes#formar-pacotes)).",
            "Excluir aparece só para o supervisor.",
          ),
          imagem({
            arquivo: "serraria/boletim.webp",
            legenda: "O boletim do dia: índices, lotes, paradas e rastreabilidade.",
            rota: "/producao/boletins",
            perfil: "supervisor",
            tela: "computador",
            acoes: [{ clicar: "main li a[href^='/producao/boletins/']" }],
          }),
        ],
      },
      {
        id: "paradas-e-toras",
        titulo: "Paradas e toras do dia",
        paraProducao: "lancar",
        palavras: ["paradas", "toras", "cargas serradas", "marcar cargas", "toras consumidas", "rendimento", "observações", "salvar o dia", "editar boletim", "corrigir boletim"],
        blocos: [
          passos(
            "Em Serraria, abra o boletim do dia (ou toque em Boletim do dia na tela Apontar serraria) e toque em Paradas e toras.",
            "Em Paradas da linha, as marcadas na hora já aparecem (só leitura). Para as outras, toque em Adicionar parada e preencha Motivo, Centro, Equipamento, Vezes e Min. Sem motivo da lista, escolha — Outro (descrever) — e escreva a Observação.",
            "Em Toras consumidas no dia, informe a Quantidade e o Volume (m³). O volume é o que permite calcular o rendimento.",
            "Em Toras serradas no dia, marque as cargas que foram serradas (use Filtrar… para achar pelo código ou pela floresta).",
            "Se precisar, escreva em Observações do dia e confira o Resumo.",
            "Toque em Salvar o dia.",
          ),
          atencao("Só o responsável pelo boletim (quem lançou o primeiro lote do dia) ou o supervisor edita o boletim. Se o botão Paradas e toras não aparece (ou a pendência Marcar cargas volta para o boletim), peça a essa pessoa ou ao supervisor."),
          lista(
            "Meta e horas não mudam no boletim: vêm de Cadastros → Configuração e valem para os boletins novos.",
            "As paradas marcadas na hora não se editam aqui: elas vêm de Paradas de máquina (e da requisição de manutenção). Veja “Máquina parada: Serraria e Manutenção” (/ajuda/manutencao-maquina-parada).",
            "Marcar as cargas serradas é o que liga os pacotes deste dia à floresta de origem.",
          ),
        ],
      },
      {
        id: "abrir-requisicao",
        titulo: "Pedir manutenção a partir de uma parada do boletim",
        modulo: "manutencao",
        paraProducao: "lancar",
        palavras: ["requisição", "requisicao", "manutenção", "chamar manutenção", "abrir requisição", "corretiva"],
        blocos: [
          passos(
            "No boletim, em Paradas, ache a parada mecânica ou elétrica.",
            "Toque em Abrir requisição e confirme.",
            "O sistema abre uma requisição corretiva, de prioridade alta, com os dados da parada, e mostra a requisição.",
          ),
          dica("Depois disso a parada mostra o selo Requisição com o número; tocando nele, abre a requisição. Paradas operacionais não têm esse botão."),
        ],
      },
      {
        id: "excluir-boletim",
        titulo: "Excluir um boletim",
        paraProducao: "gerir",
        palavras: ["excluir", "apagar", "deletar", "boletim errado", "boletim em dobro"],
        blocos: [
          passos("Abra o boletim e toque em Excluir.", "Confirme. O boletim sai junto com os lotes do dia (e as etiquetas deles)."),
          atencao("Não dá para desfazer. O boletim não pode ser excluído se já houver pacotes ou ciclos de estufa com a madeira daquele dia: a origem deles depende do boletim. Para corrigir só um lote, exclua o lote (veja “Lancei um lote errado” (/ajuda/serraria-ficha#lote-errado))."),
        ],
      },
    ],
  },

  // ───────────────────────────── Paradas de máquina ─────────────────────────────
  {
    id: "serraria-paradas",
    grupo: "serraria",
    titulo: "Paradas de máquina",
    resumo: "Marcar a parada na hora, liberar a máquina e como o tempo parado entra no boletim",
    rotas: ["/producao/paradas"],
    topicos: [
      {
        id: "maquina-parou",
        titulo: "Máquina parou: marcar na hora",
        paraProducao: "lancar",
        palavras: ["parou", "parada", "quebrou", "máquina parada", "maquina parada", "cronômetro", "marcar parada", "falha", "mecânica", "elétrica", "operacional"],
        blocos: [
          passos(
            "Abra Paradas de máquina: no Início, toque em Marcar parada, no Acesso rápido (ou no cartão Paradas de máquina, em Todas as telas).",
            "Toque no botão vermelho Máquina parou.",
            "Em Máquina, escolha a máquina que parou (a que já está parada aparece como já parada e não pode ser escolhida).",
            "Em Motivo, escolha o motivo, se souber (os da máquina vêm primeiro). Não sabe? Deixe — Outro / não sei —.",
            "Em Tipo da falha, toque em Mecânica, Elétrica ou Operacional (com um motivo escolhido, o tipo vem do motivo).",
            "Se quiser, conte em O que aconteceu? (opcional), por exemplo: correia arrebentou.",
            "Toque em Marcar parada agora. O cronômetro começa a correr e a parada aparece no Início e no painel da TV.",
          ),
          MANUTENCAO_ATIVA
            ? texto(
                "Mecânica ou elétrica: o sistema abre na hora uma requisição de prioridade alta para a manutenção, e os supervisores e manutentores dela recebem o aviso (aparece Parada marcada. A manutenção foi avisada.). O supervisor da serraria também é avisado. Operacional não abre requisição.",
              )
            : texto(
                "Mecânica ou elétrica: o sistema abre junto uma requisição de manutenção (o número aparece no cartão da parada), mas a manutenção ainda não recebe o aviso: a tela mostra Avise a manutenção. Avise pessoalmente. O supervisor da serraria recebe o aviso da parada. Operacional não abre requisição.",
              ),
          dica(
            "Só aparecem as máquinas marcadas como da linha da serraria, em Cadastros → Máquinas da linha (/ajuda/serraria-cadastros#maquinas-da-linha). Antes de começar a usar, peça ao supervisor para conferir essa lista. Falta uma máquina? Veja “A máquina não aparece em Máquina parou” (/ajuda/problemas#maquina-nao-aparece).",
          ),
          imagem({
            arquivo: "serraria/paradas-marcar.webp",
            legenda: "Máquina parou: escolha a máquina, o motivo e o tipo da falha e toque em Marcar parada agora.",
            rota: "/producao/paradas",
            perfil: "apontador",
            acoes: [{ clicar: "role=button[name='Máquina parou']" }],
          }),
        ],
      },
      {
        id: "paradas-agora",
        titulo: "Paradas agora: o que aparece no cartão",
        palavras: ["paradas agora", "cronômetro", "cronometro", "selo", "requisição", "quem marcou", "manutenção avisada"],
        blocos: [
          texto("Em Paradas agora fica um cartão por máquina parada. A tela se atualiza sozinha a cada minuto."),
          termos(
            ["Cronômetro", "Há quanto tempo a máquina está parada, com a hora em que parou (desde…)."],
            ["Tipo e motivo", "Mecânica, Elétrica ou Operacional e o motivo escolhido (a cor da borda segue o tipo)."],
            ["Marcada por…", "Quem marcou na serraria. Se a parada veio da Manutenção (requisição com a máquina parada), aparece Marcada na requisição … por …"],
            [
              "Selo da requisição",
              `${
                MANUTENCAO_ATIVA ? "Manutenção avisada · #00012" : "Requisição #00012"
              }: a requisição aberta junto. Depois de concluída ou cancelada, o selo mostra a situação (ex.: Requisição #00012 · Cancelada). Quem também usa a Manutenção vê o número e a situação e toca para abrir.`,
            ],
            ["Máquina liberada", "Botão para fechar a parada quando a máquina voltar."],
          ),
          imagem({ arquivo: "serraria/paradas.webp", legenda: "Paradas de máquina: o botão Máquina parou, as paradas agora e as liberadas no dia.", rota: "/producao/paradas", perfil: "apontador" }),
        ],
      },
      {
        id: "maquina-liberada",
        titulo: "Máquina liberada",
        paraProducao: "lancar",
        palavras: ["liberar", "liberada", "voltou", "voltou a funcionar", "fim da parada", "fechar parada", "encerrar parada"],
        blocos: [
          passos(
            "Quando a máquina voltar a operar, abra Paradas de máquina (ou toque em Liberar na pendência do Início).",
            "No cartão da máquina, toque em Máquina liberada.",
            "Se quiser, anote o que foi feito e toque em OK.",
          ),
          texto(
            `O cronômetro para e o tempo parado vai sozinho para o boletim do dia. O supervisor e quem marcou a parada são avisados.${
              MANUTENCAO_ATIVA
                ? " Se houver requisição ainda aberta, ela continua com a manutenção: o responsável (sem responsável, os supervisores da manutenção) é avisado para conferir e concluir, e a lista de requisições mostra o selo Máquina liberada."
                : ""
            }`,
          ),
          dica("A manutenção também pode liberar a máquina pela requisição. Quando ela toca em Máquina liberada ou conclui a requisição informando o fim da parada, a serraria recebe o aviso Máquina liberada pela manutenção e a parada sai de Paradas agora."),
          atencao("Liberar precisa de internet, e o fim da parada é a hora do toque. Sem sinal, anote a hora em que a máquina voltou e avise o supervisor."),
        ],
      },
      {
        id: "tempo-no-boletim",
        titulo: "Como o tempo parado entra no boletim",
        palavras: ["boletim", "turno", "tempo parado", "disponibilidade", "oee", "fim de semana", "sábado", "domingo", "noite", "corrigir parada", "horário errado"],
        blocos: [
          lista(
            "Ao liberar, o tempo parado vira uma linha de parada no boletim de cada dia em que a máquina ficou parada.",
            "Só conta o tempo dentro do turno (Turno começa e Turno termina, em Cadastros → Configuração). Uma parada que passa a noite entra em cada dia só com a parte do turno.",
            "Num dia útil (segunda a sexta) sem boletim, o sistema abre o boletim sozinho para guardar a parada. O primeiro lote lançado nesse dia passa o boletim para quem lançou.",
            "Sábado e domingo só recebem a parada se o boletim daquele dia existir (ou for aberto depois, com um lote).",
            "O tempo conta na Disponibilidade e no OEE do dia e do mês.",
          ),
          atencao(
            "A linha que veio de uma parada marcada na hora não se edita no boletim. Uma parada já liberada também não se edita em Paradas de máquina: se ela tem requisição, a manutenção pode acertar o início e o fim lá, e o boletim acompanha (a serraria recebe o aviso Parada corrigida pela manutenção).",
          ),
          dica("Como as duas equipes trabalham na mesma parada: “Máquina parada: Serraria e Manutenção” (/ajuda/manutencao-maquina-parada)."),
        ],
      },
      {
        id: "liberadas-no-dia",
        titulo: "Paradas liberadas no dia",
        palavras: ["histórico", "historico", "liberadas", "paradas de ontem", "dia anterior", "quem liberou"],
        blocos: [
          lista(
            "Embaixo, Liberadas em hoje mostra as paradas já fechadas no dia, com o total parado.",
            "Para ver outro dia, escolha a data e toque em Ver.",
            "Cada linha mostra a máquina, o tipo, o motivo, o início e o fim, quem parou, quem liberou, a duração e o número da requisição, se houver.",
          ),
        ],
      },
      {
        id: "parada-por-engano",
        titulo: "Parada marcada por engano",
        paraProducao: "gerir",
        palavras: ["engano", "errado", "excluir parada", "apagar parada", "lixeira", "desfazer"],
        blocos: [
          passos(
            "Em Paradas agora, no cartão da parada errada, toque na lixeira (Marcada por engano).",
            "Leia o aviso e confirme.",
          ),
          lista(
            "Parada marcada no Máquina parou: a requisição aberta junto é cancelada sozinha se ainda está Aberta, sem responsável e sem horas lançadas. A equipe da manutenção que recebeu o aviso da requisição nova fica sabendo (#00012 cancelada · parada marcada por engano).",
            "Se alguém da manutenção já assumiu (tem responsável ou horas lançadas, ou mudou o status), a requisição continua aberta, só sem a marcação de máquina parada, e o responsável (sem responsável, os supervisores da manutenção) é avisado.",
            "Parada que veio de uma requisição aberta na Manutenção (Marcada na requisição): a requisição também continua aberta, sem a marcação de máquina parada, e o responsável é avisado.",
            "O aviso de confirmação diz o que vai acontecer com a requisição antes de você confirmar.",
            "A lixeira só aparece para o supervisor e só nas paradas ainda abertas.",
          ),
        ],
      },
      {
        id: "parada-sem-internet",
        titulo: "Marcar parada sem internet",
        paraProducao: "lancar",
        palavras: ["offline", "sem internet", "sem sinal", "guardada no aparelho"],
        blocos: [
          lista(
            "A tela Paradas de máquina abre sem internet, se o aparelho já entrou no sistema antes.",
            "Ao marcar sem internet, a parada fica guardada no aparelho com a hora de agora e aparece em Paradas agora como Guardada no aparelho, aguardando internet. Quando a conexão voltar, ela é enviada com a hora em que foi marcada.",
            "Sem internet, a manutenção não fica sabendo: avise pessoalmente.",
            "A parada guardada por outra pessoa no mesmo aparelho só é enviada quando ela entrar de novo.",
          ),
          dica(SEM_INTERNET),
        ],
      },
      {
        id: "com-a-manutencao",
        titulo: "Junto com a Manutenção",
        modulo: "manutencao",
        palavras: ["manutenção", "requisição", "integração", "máquina parada", "liberada pela manutenção", "cancelada"],
        blocos: [
          lista(
            "Máquina parou (mecânica ou elétrica) abre uma requisição corretiva de prioridade alta, com a máquina parada.",
            "Uma requisição aberta na Manutenção com A máquina está parada, numa máquina da linha, também aparece em Paradas agora, com Marcada na requisição #00012 por (nome).",
            "Máquina liberada na serraria avisa o responsável pela requisição (sem responsável, os supervisores da manutenção) para conferir e concluir; a lista de requisições mostra o selo Máquina liberada.",
            "Se a requisição for cancelada com a parada marcada na serraria ainda aberta, a parada continua e a serraria é avisada: toque em Máquina liberada quando a máquina voltar. A parada que veio da própria requisição (Marcada na requisição) é desfeita junto.",
          ),
          dica("O passo a passo das duas equipes está em “Máquina parada: Serraria e Manutenção” (/ajuda/manutencao-maquina-parada)."),
        ],
      },
    ],
  },

  // ───────────────────────────── 3 Estufas ─────────────────────────────
  {
    id: "serraria-estufas",
    grupo: "serraria",
    titulo: "Estufas e ciclos de secagem",
    resumo: "Iniciar, acompanhar, conferir o checklist, concluir, corrigir e cancelar um ciclo; a ficha do mês",
    rotas: ["/producao/estufas"],
    topicos: [
      {
        id: "painel-das-estufas",
        titulo: "O painel das estufas",
        palavras: ["estufas", "secagem", "livre", "em secagem", "passou da previsão", "atrasada", "capacidade", "histórico de ciclos"],
        blocos: [
          texto("A tela Estufas mostra um cartão por estufa e, embaixo, o Histórico de ciclos já encerrados."),
          termos(
            ["Livre", "Sem ciclo em andamento. Quem lança vê o botão Iniciar ciclo no cartão."],
            ["Em secagem", "O tempo desde a entrada, a barra até a previsão, o Volume (e a capacidade), a Previsão de saída e o Checklist (quantos itens já foram conferidos e os não conformes). Toque no cartão para abrir o ciclo."],
            ["Passou da previsão", "Selo vermelho: o ciclo passou da hora prevista para sair."],
            ["Madeira carregada no mês", "Link embaixo de cada cartão: a ficha mensal daquela estufa."],
            ["Histórico de ciclos", "Os últimos ciclos concluídos e cancelados, com entrada, saída, duração, volume e umidade final."],
          ),
          imagem({ arquivo: "serraria/estufas.webp", legenda: "Estufas: livre, em secagem ou passou da previsão, com o checklist de cada ciclo.", rota: "/producao/estufas", perfil: "apontador" }),
        ],
      },
      {
        id: "iniciar-ciclo",
        titulo: "Iniciar um ciclo",
        paraProducao: "lancar",
        rotas: ["/producao/estufas/ciclos/novo"],
        palavras: ["iniciar", "carregar estufa", "novo ciclo", "entrada", "previsão", "plantão", "grades úmidas", "madeira carregada", "dias de serraria"],
        blocos: [
          passos(
            "Em Estufas, toque em Iniciar ciclo (no alto ou no cartão da estufa livre). No Início, dá para tocar direto na estufa livre, em Estufas agora.",
            "Escolha a Estufa (as que estão secando aparecem como em secagem e não podem ser escolhidas). Preencha o Nº do ciclo, a Entrada e a Previsão de saída.",
            "Em Plantão (responsável), escolha quem acompanha o ciclo: ele também recebe o aviso de atraso.",
            "Em Madeira carregada, preencha a ficha da estufa: espessura, larguras, as peças em cada comprimento e as Grades úmidas. O m³ é calculado sozinho.",
            "Em Madeira de quais dias?, marque os dias de serraria cuja madeira entrou nesta estufa (aparecem os boletins dos últimos 30 dias).",
            "Se quiser, preencha Próxima carga e Observações.",
            "Toque em Iniciar ciclo. O checklist da estufa é criado junto.",
          ),
          atencao("Iniciar e concluir um ciclo precisa de internet."),
          dica("Marcar os dias de serraria é o que liga os pacotes secos ao dia em que foram serrados e às toras. Esqueceu? Use Editar enquanto o ciclo estiver em secagem."),
        ],
      },
      {
        id: "checklist-e-conclusao",
        titulo: "Checklist e conclusão do ciclo",
        paraProducao: "lancar",
        rotas: ["/producao/estufas/ciclos"],
        palavras: ["checklist", "conferir", "ok", "não conforme", "nao conforme", "concluir", "tirar madeira", "saída", "umidade", "aclimatação", "terminar ciclo"],
        blocos: [
          passos(
            "Abra o ciclo (toque no cartão da estufa).",
            "Em Checklist da estufa, marque cada item como OK (✓) ou Não conforme (✗). Tocar de novo desmarca.",
            "Item não conforme: escreva em Observação (o que está errado).",
            "Ao tirar a madeira, vá em Concluir ciclo: confira a Saída (vem a hora de agora), informe a Umidade final (%) e, se quiser, as Observações.",
            "Toque em Concluir ciclo.",
          ),
          lista(
            "Os pacotes que estavam Na estufa neste ciclo saem secos, com a umidade final.",
            "O ciclo mostra quando a madeira fica liberada para uso: aclimatação de 24 h no pátio e mais 24 h na fábrica.",
            "Depois de concluir, toque em Formar pacotes secos deste ciclo (veja “Formar pacotes” (/ajuda/serraria-pacotes#formar-pacotes)).",
          ),
        ],
      },
      {
        id: "o-ciclo",
        titulo: "O que tem na página do ciclo",
        rotas: ["/producao/estufas/ciclos"],
        palavras: ["ciclo", "detalhe", "rastreabilidade", "pdf", "ficha do ciclo", "plantão", "próxima carga"],
        blocos: [
          termos(
            ["Dados do ciclo", "Entrada, Previsão de saída (ou Saída), Tempo decorrido (ou Duração), Volume, Umidade final, Plantão e Próxima carga."],
            ["Rastreabilidade", "Madeira serrada em: os dias de serraria ligados ao ciclo (toque para abrir o boletim). Pacotes: os pacotes formados com este ciclo."],
            ["Madeira carregada", "A ficha da estufa, linha por linha. O botão PDF baixa a ficha no desenho do papel."],
            ["Checklist da estufa", "Os itens de A cada novo ciclo e Antes de iniciar novo ciclo, com quem marcou."],
          ),
          imagem({
            arquivo: "serraria/ciclo.webp",
            legenda: "O ciclo de secagem: dados, rastreabilidade, a ficha da madeira carregada e o checklist.",
            rota: "/producao/estufas",
            perfil: "supervisor",
            tela: "computador",
            acoes: [{ clicar: "main a[href^='/producao/estufas/ciclos/']:not([href*='novo'])" }],
          }),
        ],
      },
      {
        id: "corrigir-ciclo",
        titulo: "Corrigir um ciclo em secagem",
        paraProducao: "lancar",
        palavras: ["editar", "corrigir", "alterar", "previsão errada", "errei", "mudar previsão"],
        blocos: [
          passos("Abra o ciclo e toque em Editar.", "Corrija o que precisar (inclusive a ficha e os dias de serraria).", "Toque em Salvar ciclo."),
          lista(
            "Só dá para editar enquanto o ciclo está em secagem. Depois de concluído, ele não muda mais.",
            "Mudou a previsão de saída? O aviso de estufa atrasada pode sair de novo na nova previsão.",
          ),
        ],
      },
      {
        id: "cancelar-ciclo",
        titulo: "Cancelar um ciclo",
        paraProducao: "gerir",
        palavras: ["cancelar", "excluir ciclo", "apagar ciclo", "ciclo errado", "engano"],
        blocos: [
          passos("Abra o ciclo em secagem e toque em Cancelar.", "Confirme. O ciclo sai do painel das estufas e vai para o histórico como cancelado."),
          texto("Os pacotes que estavam Na estufa neste ciclo voltam a ser verdes, sem ciclo."),
        ],
      },
      {
        id: "ficha-do-mes",
        titulo: "Madeira carregada no mês (ficha da estufa)",
        palavras: ["ficha mensal", "madeira carregada no mês", "imprimir", "pdf", "papel", "mês"],
        blocos: [
          passos(
            "Em Estufas, toque em Madeira carregada no mês, embaixo do cartão da estufa.",
            "Escolha o mês com as setas (ou tocando no nome do mês).",
            "Para imprimir ou mandar, toque em PDF: sai a ficha no desenho do papel, com todos os ciclos do mês, linha por linha.",
          ),
          dica("Na coluna Ciclo, toque no número do ciclo para abrir o ciclo."),
        ],
      },
    ],
  },

  // ───────────────────────────── 4 Pacotes ─────────────────────────────
  {
    id: "serraria-pacotes",
    grupo: "serraria",
    titulo: "Pacotes e etiquetas",
    resumo: "Formar pacotes, imprimir etiquetas, pacote verde na estufa, a página do pacote e o QR visto pelo cliente",
    rotas: ["/producao/pacotes", "/p"],
    topicos: [
      {
        id: "lista-de-pacotes",
        titulo: "A lista de pacotes",
        palavras: ["pacotes", "estoque", "verde", "seco", "na estufa", "expedido", "cancelado", "filtro", "buscar pacote", "bitola", "PCT-"],
        blocos: [
          texto("Em Pacotes e expedição (no celular, Pacotes na barra de baixo) ficam os pacotes, do mais novo para o mais antigo, com o total de verdes, na estufa e secos no alto."),
          lista(
            "Filtros: Em estoque, Verdes, Na estufa, Secos, Expedidos e Todos.",
            "Busca: digite o código, a bitola (ex.: 25x100), o pedido ou o cliente.",
            "Cada linha mostra o código, a situação, a bitola, as peças, o m³, a classe, a data e a origem (a estufa ou o dia serrado).",
            "Marque a caixinha dos pacotes para imprimir Etiquetas ou para Registrar saída (veja “Carregar o caminhão e gerar o romaneio” (/ajuda/serraria-expedicao#carregar-caminhao)). Limpar desmarca todos.",
          ),
          termos(
            ["Verde (serrado)", "Formado com a madeira da serraria, sem passar pela estufa."],
            ["Na estufa", "Pacote verde enviado para um ciclo de secagem."],
            ["Seco · em estoque", "Formado com a madeira da estufa, ou verde que saiu seco do ciclo."],
            ["Expedido", "Saiu no caminhão (tem romaneio)."],
            ["Cancelado", "Cancelado pelo supervisor."],
          ),
          imagem({ arquivo: "serraria/pacotes.webp", legenda: "Pacotes: o estoque por situação, os filtros, a busca e a lista.", rota: "/producao/pacotes", perfil: "apontador" }),
        ],
      },
      {
        id: "formar-pacotes",
        titulo: "Formar pacotes",
        paraProducao: "lancar",
        rotas: ["/producao/pacotes/novo"],
        palavras: ["formar", "novo pacote", "empacotar", "montar pacote", "pacote seco", "pacote verde", "quantos pacotes", "peças por pacote"],
        blocos: [
          passos(
            "Em Pacotes, toque em Formar pacote (no Início, o cartão Formar pacotes, no Acesso rápido).",
            "Escolha de onde vem a madeira: Da estufa (seco) ou Da serraria (verde).",
            "Da estufa: em Estufa, escolha o ciclo (aparecem os ciclos concluídos nos últimos 90 dias). Da serraria: em Dia de serraria, escolha o dia (dias com lotes nos últimos 30 dias).",
            "Toque na madeira que vai formar o pacote. A bitola e a classe vêm prontas; com várias larguras, escolha a Largura.",
            "Confira Peças por pacote: vem com o total daquela linha da ficha; troque pelo número de peças de cada pacote. Em Quantos pacotes, informe quantos pacotes iguais vai formar.",
            "Confira o Pedido (os pedidos da madeira desta estufa vêm primeiro) e, se quiser, escreva em Observações. O volume de cada pacote aparece embaixo.",
            "Toque em Formar pacote (ou Formar N pacotes).",
            "Toque em Imprimir etiqueta (ou Imprimir etiquetas) e prenda cada etiqueta no seu pacote.",
          ),
          lista(
            "No máximo 50 pacotes de uma vez.",
            "A pendência Estufa concluída sem pacotes formados e o botão Formar pacotes secos deste ciclo já abrem esta tela com o ciclo escolhido; Formar pacote verde deste dia, no boletim, já abre com o dia.",
          ),
          atencao("Formar pacotes precisa de internet."),
        ],
      },
      {
        id: "etiquetas",
        titulo: "Imprimir etiquetas dos pacotes",
        rotas: ["/producao/pacotes/etiquetas"],
        palavras: ["etiqueta", "imprimir", "impressora", "reimprimir", "segunda via", "QR", "papel adesivo", "plástica", "A4"],
        blocos: [
          lista(
            "Logo depois de formar: Imprimir etiqueta (ou Imprimir etiquetas).",
            "De vários pacotes: na lista de Pacotes, marque os pacotes e toque em Etiquetas.",
            "De um pacote: abra o pacote e toque em Etiqueta.",
          ),
          texto("A tela das etiquetas tem o botão Imprimir N etiqueta(s). A folha é A4, com 8 etiquetas (2 × 4). Cada etiqueta tem o QR, o código PCT-, a bitola, as peças, o m³, a classe, se é seco (e de qual estufa) ou verde e a data."),
          dica("Use papel adesivo resistente ou etiqueta plástica: a etiqueta precisa durar até o cliente."),
        ],
      },
      {
        id: "pagina-do-pacote",
        titulo: "A página do pacote",
        palavras: ["pacote", "história", "historia", "linha do tempo", "origem", "da floresta ao pacote", "rastreio", "qr do pacote"],
        blocos: [
          texto("O QR da etiqueta (ou um toque na lista) abre a página do pacote:"),
          termos(
            ["Cabeçalho", "O código, a situação, os links Etiqueta e Como o cliente vê e os dados: bitola, peças, volume, classe, mercado, pedido, destino e quando foi formado."],
            ["Registrar", "As ações de quem lança (veja “Registrar no pacote” (/ajuda/serraria-pacotes#registrar-no-pacote))."],
            ["Da floresta ao pacote", "A origem: Floresta, Recebimento das toras, Serraria, Secagem em estufa, Pacote formado e Expedição. Toque numa carga, num dia ou no ciclo para abrir."],
            ["Linha do tempo", "Tudo o que aconteceu com o pacote, com data e quem fez."],
          ),
          imagem({
            arquivo: "serraria/pacote.webp",
            legenda: "A página do pacote: dados, ações e a origem, da floresta ao pacote.",
            rota: "/producao/pacotes",
            perfil: "apontador",
            acoes: [{ clicar: "main li a[href^='/producao/pacotes/']" }],
          }),
        ],
      },
      {
        id: "registrar-no-pacote",
        titulo: "Registrar no pacote",
        paraProducao: "lancar",
        palavras: ["registrar", "enviar para estufa", "observação", "anotar", "saída de um pacote", "evento"],
        blocos: [
          texto("Em Registrar, escolha a ação. Cada uma vira uma linha na Linha do tempo."),
          termos(
            ["Enviar para estufa", "Só para pacote verde. Escolha o Ciclo em secagem e toque em Enviar para estufa. Sem estufa secando, inicie o ciclo antes em Estufas."],
            ["Registrar saída", "Para pacote verde ou seco: Motorista, Nota fiscal, Chave da NF-e e Observações do romaneio. Gera o romaneio só deste pacote. Para vários pacotes no mesmo caminhão, use a lista de Pacotes."],
            ["Observação", "Escreva e toque em Observação."],
          ),
        ],
      },
      {
        id: "verde-na-estufa",
        titulo: "Pacote verde que vai para a estufa",
        paraProducao: "lancar",
        palavras: ["verde", "secar pacote", "pacote na estufa", "enviar para estufa", "virou seco"],
        blocos: [
          passos(
            "Forme o pacote Da serraria (verde) e imprima a etiqueta.",
            "Com o ciclo da estufa já iniciado, abra o pacote (pelo QR ou pela lista).",
            "Em Registrar, toque em Enviar para estufa, escolha o ciclo e confirme em Enviar para estufa. O pacote fica Na estufa.",
            "Ao concluir o ciclo, o pacote sai seco sozinho, com a umidade final do ciclo.",
          ),
          dica("Se o ciclo for cancelado, o pacote volta a ser verde."),
        ],
      },
      {
        id: "cancelar-pacote",
        titulo: "Cancelar um pacote",
        paraProducao: "gerir",
        palavras: ["cancelar", "excluir pacote", "apagar pacote", "pacote errado", "desmanchar"],
        blocos: [
          passos("Abra o pacote.", "Em Registrar, toque em Cancelar pacote, escreva o Motivo e toque em Cancelar pacote."),
          texto("O pacote fica Cancelado (continua na lista Todos, com a linha do tempo). Pacote expedido não pode ser cancelado."),
        ],
      },
      {
        id: "qr-publico",
        titulo: "O QR visto por quem é de fora (cliente)",
        rotas: ["/p"],
        palavras: ["cliente", "qr público", "publico", "inglês", "english", "como o cliente vê", "rastreabilidade", "comprador"],
        blocos: [
          texto("Quem lê o QR do pacote sem estar logado (o cliente, por exemplo) vê uma página pública, em português ou inglês, com a floresta de origem e as datas de recebimento das toras, serragem, secagem e expedição."),
          lista(
            "A página pública não mostra cliente, pedido, pessoas, fornecedor nem placas.",
            "Quem está logado no sistema vê a página completa do pacote. Para ver o que o cliente vê, toque em Como o cliente vê, na página do pacote.",
            "O QR das etiquetas leva um código sorteado, para ninguém ver outros pacotes trocando o número. Etiquetas antigas, com o número, continuam valendo.",
          ),
        ],
      },
    ],
  },

  // ───────────────────────────── Expedição ─────────────────────────────
  {
    id: "serraria-expedicao",
    grupo: "serraria",
    titulo: "Expedição e romaneio",
    resumo: "Carregar o caminhão, gerar e entregar o romaneio e a declaração de origem",
    rotas: ["/producao/romaneios"],
    topicos: [
      {
        id: "carregar-caminhao",
        titulo: "Carregar o caminhão e gerar o romaneio",
        paraProducao: "lancar",
        palavras: ["expedir", "expedição", "expedicao", "saída", "saida", "carregar", "caminhão", "caminhao", "nota fiscal", "NF", "chave", "romaneio", "motorista"],
        blocos: [
          passos(
            "Abra Pacotes e expedição (no celular, Pacotes, na barra de baixo) e, se quiser, filtre os Secos.",
            "Marque a caixinha de cada pacote que vai no caminhão. Confira o total de pacotes e m³ que aparece no alto.",
            "Toque em Registrar saída de N.",
            "Escolha o Motorista (as placas vêm do cadastro e aparecem embaixo).",
            "Informe a Nota fiscal e, se quiser, a Chave da NF-e (44 dígitos) e as Observações.",
            "Toque em Confirmar e gerar romaneio. O sistema abre o romaneio (ROM-000123).",
            "Toque em Baixar PDF do romaneio e entregue ao motorista.",
          ),
          lista(
            "Só saem pacotes verdes ou secos: os que estão na estufa, já expedidos ou cancelados ficam de fora.",
            "A saída é só a baixa física: o cliente e o destino vêm do pedido de cada pacote.",
            "Para um pacote só, dá para registrar a saída na página do pacote (Registrar → Registrar saída).",
          ),
          atencao("Registrar a saída precisa de internet e não se desfaz pelo sistema. Confira os pacotes marcados antes de confirmar."),
          imagem({
            arquivo: "serraria/expedicao.webp",
            legenda: "Pacotes marcados para a saída: motorista, nota fiscal e Confirmar e gerar romaneio.",
            rota: "/producao/pacotes?status=SECO",
            perfil: "apontador",
            acoes: [{ clicar: "main li input[type=checkbox]" }, { clicar: "button:has-text('Registrar saída de')" }],
          }),
        ],
      },
      {
        id: "romaneio",
        titulo: "O romaneio",
        palavras: ["romaneio", "ROM-", "pdf", "motorista", "placas", "assinatura", "documento da carga", "romaneios"],
        blocos: [
          texto("O romaneio é o documento de cada carga expedida. A lista fica em Romaneios (no Início, em Todas as telas → Operação, ou no botão Romaneios da tela de Pacotes), do mais novo para o mais antigo, com a nota fiscal, o motorista, as placas, os clientes, os pacotes e o m³."),
          lista(
            "Abra o romaneio para ver o Motorista, as Placas, a Nota fiscal, os Pacotes e a tabela com pacote, pedido, bitola, classe, peças e m³.",
            "Baixar PDF do romaneio gera o documento para o motorista: pedidos, cliente, destino, placas, a lista de pacotes e os campos de assinatura.",
            "A busca encontra o romaneio pelo código ROM- ou pelo número da nota fiscal.",
          ),
        ],
      },
      {
        id: "declaracao-de-origem",
        titulo: "Declaração de origem (PT e EN)",
        palavras: ["declaração", "declaracao", "origem", "origin statement", "inglês", "exportação", "cliente", "documento", "rastreabilidade"],
        blocos: [
          texto("No romaneio, os botões Declaração de origem (PT) e Origin statement (EN) geram, para o cliente, a declaração de origem da carga: origem florestal, recebimento das toras, serragem, secagem em estufa e a lista de pacotes com o QR de cada um."),
          atencao("É uma declaração da própria empresa, feita com os registros do sistema. Ela não substitui a nota fiscal nem os documentos oficiais fiscais, ambientais ou fitossanitários de exportação."),
        ],
      },
    ],
  },

  // ───────────────────────────── Ler etiqueta e busca ─────────────────────────────
  {
    id: "serraria-ler-etiqueta",
    grupo: "serraria",
    titulo: "Ler etiqueta e buscar",
    resumo: "Ler o QR ou o código de barras pela câmera, digitar o código e buscar no sistema",
    rotas: ["/producao/escanear", "/producao/buscar"],
    topicos: [
      {
        id: "ler-com-a-camera",
        titulo: "Ler a etiqueta com a câmera",
        rotas: ["/producao/escanear"],
        palavras: ["ler", "escanear", "câmera", "camera", "QR", "código de barras", "codigo de barras", "leitor", "android", "iphone", "safari"],
        blocos: [
          passos(
            "Toque em Ler etiqueta (no celular, o botão do meio da barra de baixo; no computador, o cartão Ler etiqueta do Início).",
            "Toque em Abrir câmera e ler a etiqueta e permita o uso da câmera, se o celular pedir.",
            "Aponte para o QR do pacote ou do lote (o lote também tem código de barras). A página abre sozinha.",
            "Para desligar sem ler, toque em Fechar câmera.",
          ),
          atencao(
            "O leitor dentro do sistema funciona no Android (Chrome). No iPhone ele não aparece: aponte a câmera do próprio celular para o QR (abre no Safari, que pede login separado do app) ou digite o código e toque em Abrir, como no tópico abaixo. Veja “No iPhone, o Ler etiqueta não mostra a câmera” (/ajuda/problemas#leitor-iphone).",
          ),
          dica("Apareceu Não foi possível abrir a câmera? Veja “Ler etiqueta: Não foi possível abrir a câmera” (/ajuda/problemas#camera-bloqueada)."),
          imagem({ arquivo: "serraria/ler-etiqueta.webp", legenda: "Ler etiqueta: abrir a câmera ou digitar o código do pacote ou do lote.", rota: "/producao/escanear", perfil: "apontador" }),
        ],
      },
      {
        id: "digitar-codigo",
        titulo: "Digitar o código",
        palavras: ["digitar", "código", "codigo", "PCT-", "LOT-", "sem câmera", "abrir pacote"],
        blocos: [
          passos(
            "Abra Ler etiqueta.",
            "No campo Código do pacote ou lote, digite o código da etiqueta, por exemplo PCT-000123 ou LOT-000045.",
            "Toque em Abrir.",
          ),
          dica("A tela Ler etiqueta abre sem internet, mas a página do pacote ou do lote precisa de conexão."),
        ],
      },
      {
        id: "buscar",
        titulo: "Buscar no sistema",
        rotas: ["/producao/buscar"],
        palavras: ["buscar", "busca", "procurar", "pesquisar", "achar", "lupa", "nota fiscal", "placa", "cliente", "pedido", "CT-", "ROM-"],
        blocos: [
          texto("No computador, a busca fica no meio do topo (atalho: tecla /). No celular, toque na lupa do topo."),
          termos(
            ["Códigos", "PCT- (pacote), LOT- (lote), CT- (carga de toras) e ROM- (romaneio) abrem direto a página."],
            ["Texto", "Pedido, cliente, destino, motorista, placa, floresta, fornecedor ou o número da nota fiscal (ou parte da chave da NF-e)."],
            ["Resultados", "Separados em Pedidos, Pacotes, Lotes da serraria, Romaneios e Cargas de toras. Toque para abrir."],
          ),
          imagem({ arquivo: "serraria/buscar.webp", legenda: "Busca: os resultados aparecem separados por pacotes, lotes, romaneios e cargas.", rota: "/producao/buscar?q=Cliente", perfil: "apontador" }),
        ],
      },
    ],
  },

  // ───────────────────────────── Pedidos e venda ─────────────────────────────
  {
    id: "serraria-pedidos",
    grupo: "serraria",
    titulo: "Pedidos e disponível para venda",
    resumo: "Acompanhar os pedidos, quando ficam prontos para expedir, cadastrar e concluir, e o que há para vender",
    rotas: ["/producao/pedidos", "/producao/disponivel"],
    topicos: [
      {
        id: "acompanhar-pedidos",
        titulo: "Acompanhar os pedidos",
        rotas: ["/producao/pedidos"],
        palavras: ["pedido", "pedidos", "cliente", "prazo", "saldo", "atrasado", "andamento", "quanto falta"],
        blocos: [
          texto("Em Pedidos (grupo Gestão) aparece um cartão por pedido. Abertos mostra só os abertos; Todos inclui os concluídos."),
          lista(
            "No cartão: o nº, o cliente, o destino e o prazo (em vermelho, com Atrasado, se passou do prazo e ainda há saldo).",
            "Os selos Pronto para expedir e Concluído.",
            "A barra mostra quanto já foi expedido, quanto está seco, na estufa e verde.",
            "Embaixo: expedido de quanto foi combinado, o serrado, o seco e o saldo a expedir.",
            "No Apontar serraria, cada pedido também mostra quanto falta serrar.",
          ),
        ],
      },
      {
        id: "pagina-do-pedido",
        titulo: "A página do pedido",
        palavras: ["pedido", "detalhe", "volume combinado", "saldo a expedir", "pacotes do pedido", "lotes do pedido", "romaneios do pedido"],
        blocos: [
          texto("Toque num pedido para ver Volume combinado, Prazo, Serrado, Expedido e Saldo a expedir, e as listas de Pacotes, Lotes serrados e Romaneios do pedido. Toque num item para abrir."),
          dica("Quando o pedido está pronto, aparece o aviso Pronto para expedir com o link Ver pacotes secos, que abre a lista já filtrada para carregar o caminhão."),
        ],
      },
      {
        id: "pedido-pronto",
        titulo: "Quando o pedido fica pronto para expedir",
        palavras: ["pronto", "pronto para expedir", "aviso", "pedido pronto", "liberado"],
        blocos: [
          lista(
            "Com volume combinado: quando ainda há saldo a expedir e os pacotes secos do pedido cobrem esse saldo.",
            "Sem volume combinado: quando tudo o que ainda não saiu está seco (nada verde e nada na estufa).",
          ),
          texto("O pedido ganha o selo Pronto para expedir e o supervisor recebe um aviso. O sistema confere sempre que um ciclo é concluído, um pacote é formado ou sai um caminhão."),
        ],
      },
      {
        id: "cadastrar-pedido",
        titulo: "Cadastrar, editar e concluir um pedido",
        paraProducao: "gerir",
        rotas: ["/producao/cadastros?aba=pedidos"],
        palavras: ["novo pedido", "cadastrar pedido", "concluir pedido", "fechar pedido", "editar pedido", "situação", "volume", "prazo"],
        blocos: [
          passos(
            "Em Pedidos, toque em Novo pedido (abre Cadastros → Pedidos).",
            "Toque em Novo pedido e preencha Nº do pedido, Cliente, Destino, Volume combinado (m³), Prazo de entrega e, se quiser, Observações.",
            "Toque em Cadastrar pedido. O pedido já aparece no Apontar serraria e no Formar pacote.",
          ),
          lista(
            "Editar: em Cadastros → Pedidos, toque na linha do pedido (ícone de lápis), corrija e toque em Salvar. Na página do pedido, o link Editar leva até lá.",
            "Concluir: na mesma edição, troque Situação para Concluído e toque em Salvar. O pedido sai da lista do apontamento e de Abertos.",
            "Acompanhar, na linha do pedido em Cadastros, abre a página do pedido.",
          ),
        ],
      },
      {
        id: "disponivel",
        titulo: "Disponível para venda",
        rotas: ["/producao/disponivel"],
        palavras: ["disponível", "disponivel", "venda", "vender", "estoque livre", "sem pedido", "reservado", "comercial", "pdf"],
        blocos: [
          texto("Em Disponível para venda (grupo Gestão) ficam os pacotes em estoque, por bitola e classe, separados em Seca (pronta para sair), Na estufa e Verde."),
          lista(
            "No alto, os totais de cada situação, em m³ e pacotes.",
            "Filtre por espessura: Todas, 23, 25, 32 ou 38 mm.",
            "Só sem pedido mostra só o que está livre para vender; tocando, muda para Incluindo os com pedido.",
            "Toque numa bitola para ver os pacotes dela.",
            "O botão PDF gera a lista para o comercial.",
          ),
          imagem({ arquivo: "serraria/disponivel.webp", legenda: "Disponível para venda: o estoque livre por bitola e classe, seca, na estufa e verde.", rota: "/producao/disponivel", perfil: "supervisor" }),
        ],
      },
    ],
  },

  // ───────────────────────────── Inventário ─────────────────────────────
  {
    id: "serraria-inventario",
    grupo: "serraria",
    titulo: "Inventário de madeira",
    resumo: "Contar a madeira por local na ficha, ver o último inventário e corrigir uma contagem",
    rotas: ["/producao/estoque"],
    topicos: [
      {
        id: "inventario-do-dia",
        titulo: "Inventário do dia",
        paraProducao: "lancar",
        rotas: ["/producao/estoque/novo"],
        palavras: ["inventário", "inventario", "contagem", "contar", "estoque", "levantamento", "grade", "madeira em", "local"],
        blocos: [
          passos(
            "Em Inventário de madeira (no Início, em Todas as telas → Gestão; no celular, em Mais), toque em Inventário do dia.",
            "Confira a Data.",
            "Em cada linha da ficha, escolha em Madeira em onde a madeira está: Grade, Pacote, uma das estufas ou Verde.",
            "Preencha a ficha como na serraria: espessura, larguras e as peças em cada comprimento. Use Adicionar linha para cada local e medida.",
            "Se quiser, escreva em Observações e toque em Registrar.",
            "Pode registrar por partes: depois de cada Registrar, a ficha volta limpa para o próximo local. No fim, toque em Concluir.",
          ),
          dica(`Funciona sem internet: a contagem fica guardada no aparelho e é enviada quando a conexão voltar. ${SEM_INTERNET}`),
          imagem({ arquivo: "serraria/inventario-novo.webp", legenda: "Inventário do dia: em cada linha, onde está a madeira, a medida e as peças.", rota: "/producao/estoque/novo", perfil: "apontador" }),
        ],
      },
      {
        id: "ultimo-inventario",
        titulo: "Último inventário e histórico",
        palavras: ["último", "ultimo", "histórico", "historico", "total", "por local", "por espessura", "pdf"],
        blocos: [
          lista(
            "Último inventário soma tudo o que foi contado no dia mais recente, em m³, por local (Madeira em) e por espessura.",
            "Em Histórico ficam todos os inventários, do mais novo para o mais antigo. Toque num para ver a ficha.",
            "Na ficha de um inventário, o botão PDF baixa a contagem no desenho do papel.",
          ),
          imagem({ arquivo: "serraria/inventario.webp", legenda: "Inventário de madeira: o último inventário por local e espessura e o histórico.", rota: "/producao/estoque", perfil: "apontador" }),
        ],
      },
      {
        id: "corrigir-inventario",
        titulo: "Corrigir ou excluir um inventário",
        paraProducao: "lancar",
        palavras: ["corrigir", "editar", "errei", "excluir", "apagar", "deletar", "contagem errada"],
        blocos: [
          passos("Em Inventário de madeira, toque no inventário em Histórico.", "Corrija a ficha e toque em Salvar."),
          lista(
            "Quem registrou corrige o próprio inventário; o supervisor corrige qualquer um. Para os outros, abre só para leitura.",
            "Corrigir precisa de internet.",
            "Inventários muito antigos, de antes da coluna Madeira em, abrem só para leitura.",
          ),
          atencao("Excluir: só o supervisor vê o botão Excluir no inventário."),
        ],
      },
    ],
  },

  // ───────────────────────────── Indicadores e TV ─────────────────────────────
  {
    id: "serraria-indicadores",
    grupo: "serraria",
    titulo: "Indicadores e painel da TV",
    resumo: "OEE, paradas, pacotes e comparativo do mês, Excel, relatório mensal em PDF e o painel da TV",
    rotas: ["/producao/indicadores", "/tv"],
    topicos: [
      {
        id: "painel-de-indicadores",
        titulo: "O painel de indicadores",
        rotas: ["/producao/indicadores"],
        palavras: ["indicadores", "gráfico", "grafico", "oee", "pareto", "comparativo", "mês", "relatório", "resultado"],
        blocos: [
          texto("Em Indicadores (grupo Gestão), escolha o mês no alto: as setas passam de mês em mês e, tocando no nome, abre a escolha do mês."),
          termos(
            ["Visão geral", "OEE, Disponibilidade e Produtividade com a fórmula de cada um; Serrado, Tempo parado, Classe Ótimo e Rendimento; Serrado por dia (m³), por classe e com a meta de cada dia; e Paradas por centro."],
            ["Paradas", "Por centro (mecânica, elétrica, operacional), Pareto dos motivos (o que mais parou a linha) e Por equipamento."],
            ["Pacotes e estoque", "Pacotes formados e expedidos, quantos foram rastreados até a floresta, o tempo médio até a expedição, os pacotes no estoque agora e o expedido por cliente."],
            ["Comparativo mensal", "Serrado por mês (até 12 meses) com a meta acumulada e a tabela dos índices de cada mês."],
          ),
          dica("Mês sem boletim mostra Nenhum boletim e um botão para ver o último mês com dados."),
          imagem({ arquivo: "serraria/indicadores.webp", legenda: "Indicadores da serraria no computador: índices do mês, serrado por dia e paradas.", rota: "/producao/indicadores", perfil: "supervisor", tela: "computador" }),
        ],
      },
      {
        id: "como-calcula",
        titulo: "Como os índices são calculados",
        palavras: ["fórmula", "formula", "cálculo", "calculo", "oee", "disponibilidade", "produtividade", "rendimento", "classe", "meta"],
        blocos: [
          texto("No mês, os índices são calculados sobre os totais do mês (não é a média dos dias)."),
          termos(
            ["Disponibilidade", "(tempo programado − tempo parado) ÷ tempo programado."],
            ["Produtividade", "serrado (m³) ÷ meta (m³)."],
            ["OEE", "Disponibilidade × Produtividade."],
            ["Rendimento", "serrado (m³) ÷ m³ de toras consumidas (só nos dias com as toras informadas em Paradas e toras)."],
            ["Classe", "Pelo comprimento: 2,50 e 2,10 m Ótimo; 1,65 m Bom; 1,30, 1,00 e 0,70 m Regular."],
          ),
          dica("A meta e as horas programadas de cada dia vêm da Configuração da Serraria no dia em que o boletim foi aberto."),
        ],
      },
      {
        id: "excel-e-pdf",
        titulo: "Excel e relatório mensal em PDF",
        palavras: ["excel", "planilha", "exportar", "baixar", "pdf", "relatório mensal", "diretoria", "imprimir"],
        blocos: [
          termos(
            ["Excel", "Baixa o mês completo, em abas: Comparativo, Boletins, Bitolas (com lote e pedido), Paradas e Pareto."],
            ["Relatório PDF", "Gera o relatório do mês para a diretoria: índices com a variação do mês anterior, serrado por classe com o gráfico diário, paradas e Pareto, estufas, toras, pacotes e expedição e o comparativo dos últimos meses."],
          ),
          dica("Os dois botões ficam no alto da tela Indicadores, ao lado do mês."),
        ],
      },
      {
        id: "painel-da-tv",
        titulo: "Painel para TV",
        rotas: ["/tv"],
        palavras: ["tv", "televisão", "monitor", "barracão", "tela cheia", "painel", "telão"],
        blocos: [
          passos(
            "Na TV ou no monitor do barracão, abra o sistema e entre com um usuário (de preferência um só para a TV, com o perfil Consulta).",
            "No Início, em Todas as telas → Gestão, toque em Painel para TV.",
            "Toque em Tela cheia e deixe aberto.",
          ),
          texto("O painel mostra o Serrado hoje contra a meta, as Paradas hoje (com as máquinas paradas agora), as Estufas e o mês. Ele se atualiza sozinho a cada minuto e mantém a tela ligada. Para sair, Voltar ao sistema."),
          imagem({ arquivo: "serraria/tv.webp", legenda: "Painel para TV: serrado hoje, paradas, estufas e o mês, atualizado a cada minuto.", rota: "/tv", perfil: "supervisor", tela: "computador" }),
        ],
      },
    ],
  },

  // ───────────────────────────── Cadastros ─────────────────────────────
  {
    id: "serraria-cadastros",
    grupo: "serraria",
    titulo: "Cadastros da Serraria",
    resumo: "Florestas, fornecedores, motoristas, motivos de parada, máquinas da linha, estufas e a configuração",
    paraProducao: "gerir",
    rotas: ["/producao/cadastros", "/producao/florestas"],
    topicos: [
      {
        id: "incluir-editar-desativar",
        titulo: "Incluir, editar e desativar",
        palavras: ["cadastrar", "novo", "nova", "incluir", "editar", "alterar", "desativar", "inativo", "excluir cadastro", "apagar cadastro"],
        blocos: [
          texto("Em Cadastros (no Início, em Todas as telas → Cadastros, ou no Painel Administrativo), cada aba é uma lista: Pedidos, Florestas, Fornecedores, Motoristas, Motivos de parada, Máquinas da linha, Estufas e Configuração."),
          passos(
            "Para incluir: toque em Novo … (por exemplo, Nova floresta) no alto da aba, preencha e toque em Cadastrar.",
            "Para editar: toque na linha (ícone de lápis), corrija e toque em Salvar.",
            "Para tirar de uso: na edição, desmarque Ativo e toque em Salvar. O item some das listas de escolha, mas o histórico continua.",
          ),
          dica("Desative em vez de apagar: as cargas, paradas e ciclos antigos continuam mostrando o nome certo."),
          imagem({ arquivo: "serraria/cadastros.webp", legenda: "Cadastros da Serraria: uma aba para cada cadastro, com Novo … no alto e o lápis em cada linha.", rota: "/producao/cadastros?aba=florestas", perfil: "supervisor", tela: "computador" }),
        ],
      },
      {
        id: "origem",
        titulo: "Florestas, fornecedores e motoristas",
        rotas: ["/producao/cadastros?aba=florestas", "/producao/cadastros?aba=fornecedores", "/producao/cadastros?aba=motoristas"],
        palavras: ["floresta", "fornecedor", "motorista", "placa", "julieta", "cnpj", "município", "espécie"],
        blocos: [
          termos(
            ["Florestas", "Nome, Município, UF e Espécie. A floresta aparece na carga de toras e na origem dos pacotes (também na página pública do QR)."],
            ["Fornecedores", "Nome, CNPJ / CPF e Telefone."],
            ["Motoristas", "Nome, Placa do caminhão (obrigatória), Placa da julieta e Telefone. As placas vão sozinhas para a carga de toras e para o romaneio."],
          ),
        ],
      },
      {
        id: "motivos-de-parada",
        titulo: "Motivos de parada",
        rotas: ["/producao/cadastros?aba=motivos"],
        palavras: ["motivo", "parada", "código", "centro", "mecânica", "elétrica", "operacional"],
        blocos: [
          termos(
            ["Código e Descrição", "O número e o nome do motivo, como na lista da fábrica."],
            ["Centro", "Mecânica, Elétrica ou Operacional: define o tipo da falha quando o motivo é escolhido."],
            ["Equipamento", "A máquina do motivo (opcional). No Máquina parou, os motivos da máquina escolhida aparecem primeiro."],
            ["Ativo", "Desmarque para tirar o motivo das listas."],
          ),
        ],
      },
      {
        id: "maquinas-da-linha",
        titulo: "Máquinas da linha",
        rotas: ["/producao/cadastros?aba=maquinas"],
        palavras: ["máquina", "maquina", "linha", "equipamento", "na linha", "fora da linha", "máquina parou não aparece"],
        blocos: [
          texto("A aba lista os equipamentos ativos do cadastro de Equipamentos da Manutenção. Toque no botão de cada máquina para colocá-la na linha (Na linha ✓) ou tirá-la (Fora da linha)."),
          lista(
            "Só as máquinas da linha aparecem no botão Máquina parou. Confira esta lista antes de a equipe começar a usar o Máquina parou.",
            "Quando a manutenção abre uma requisição com máquina parada numa máquina da linha, a parada entra sozinha no boletim do dia.",
            MANUTENCAO_ATIVA
              ? "Máquina nova: o cadastro é feito em Equipamentos, na Manutenção. Depois ela aparece aqui para pôr na linha."
              : "Máquina nova: o cadastro é feito em Equipamentos, na Manutenção (enquanto ela está em teste, só o administrador cadastra). Depois ela aparece aqui para pôr na linha.",
          ),
          dica("Na Manutenção, a mesma marcação fica no cadastro do equipamento: veja “Quais máquinas entram” (/ajuda/manutencao-maquina-parada#maquinas-da-linha)."),
        ],
      },
      {
        id: "estufas",
        titulo: "Estufas",
        rotas: ["/producao/cadastros?aba=estufas"],
        palavras: ["estufa", "capacidade", "nova estufa", "número"],
        blocos: [
          termos(
            ["Número e Nome", "A ordem e o nome que aparecem no painel das estufas."],
            ["Capacidade (m³)", "Aparece no cartão da estufa ao lado do volume carregado."],
            ["Equipamento (manutenção)", "Diz qual equipamento do cadastro da Manutenção é aquela estufa (veja “Quais máquinas entram” (/ajuda/manutencao-maquina-parada#maquinas-da-linha))."],
            ["Ativo", "Estufa inativa sai do painel e das listas."],
          ),
        ],
      },
      {
        id: "configuracao",
        titulo: "Configuração da serraria",
        rotas: ["/producao/cadastros?aba=config"],
        palavras: ["configuração", "configuracao", "meta", "meta diária", "horas", "turno", "rendimento meta", "horário"],
        blocos: [
          termos(
            ["Meta diária (m³)", "A meta de cada boletim novo (base da produtividade e do OEE)."],
            ["Horas por dia", "As horas programadas de cada boletim novo (base da disponibilidade)."],
            ["Rendimento meta (%)", "O rendimento esperado das toras."],
            ["Turno começa e Turno termina", "Das paradas marcadas na hora, só o tempo dentro do turno entra no boletim."],
          ),
          passos("Altere os valores e toque em Salvar configuração."),
          atencao("A mudança vale para os boletins abertos dali em diante: os boletins que já existem continuam com a meta e as horas de quando foram abertos."),
          dica(
            "O administrador do sistema vê também, nesta aba, a Triagem do período de teste (veja “Triagem do período de teste” (/ajuda/serraria-cadastros#triagem-do-teste)) e Zerar o movimento de teste (apaga os lançamentos de teste; não dá para desfazer).",
          ),
        ],
      },
      {
        id: "triagem-do-teste",
        titulo: "Triagem do período de teste (só o administrador)",
        palavras: ["triagem", "período de teste", "periodo de teste", "encerrar requisições", "requisições antigas", "liberar manutenção", "ENCERRAR"],
        blocos: [
          texto(
            "Enquanto a Manutenção esteve em teste, cada Máquina parou mecânica ou elétrica abriu uma requisição que ficou Aberta, e os planos de preventiva continuaram gerando requisições que ninguém via. A Triagem do período de teste encerra essas requisições de uma vez. Ela aparece só para o administrador do sistema, em Cadastros → Configuração, e deve ser usada antes de liberar a Manutenção.",
          ),
          passos(
            "Em Criadas até, escolha o último dia do teste e toque em Atualizar prévia.",
            "Confira os grupos: Máquina parou: máquina já liberada; Preventivas geradas no teste e vencidas; Paradas excluídas na serraria. Em cada um, Ver as requisições mostra a lista.",
            "Em cada grupo, escolha Deixar como está, Concluir ou Cancelar (as paradas excluídas só podem ser canceladas). Embaixo de cada opção, a tela explica o efeito nos indicadores.",
            "Digite ENCERRAR em Digite ENCERRAR para confirmar e toque em Aplicar triagem.",
          ),
          lista(
            "Nada é feito sozinho. Fica de fora o que alguém da manutenção já assumiu, comentou ou em que lançou horas: resolva na própria requisição.",
            "Concluir uma preventiva põe a conclusão na data agendada: conclua só as que foram feitas de fato.",
            "Cada requisição ganha o motivo no histórico de status e o registro na Auditoria. Os avisos não são enviados. Para desfazer, mude o status na própria requisição.",
          ),
          ...(MANUTENCAO_ATIVA ? [atencao("A Manutenção já está liberada: em Criadas até, use o último dia do teste, para não encerrar requisições de verdade.")] : []),
        ],
      },
    ],
  },
];
