import type { Termo } from "./tipos";

// Glossário (/ajuda/glossario): as palavras usadas nas telas e no pátio, de A a Z (a página ordena).
// `modulo` mostra o termo só para quem usa o módulo; `veja` leva ao "como fazer" no manual
// (/ajuda/<seção>#<tópico>: confira a âncora em geral.ts, serraria.ts e manutencao.ts).
// A âncora do termo sai do nome sem o que está entre parênteses ("Lote (LOT-000123)" → #lote): não repita nomes.

export const GLOSSARIO: Termo[] = [
  // ───────────── Geral (os dois módulos) ─────────────
  {
    termo: "Aviso (notificação)",
    definicao: "Mensagem do sistema. Aparece no sininho do topo e, se você ativou neste aparelho, também como notificação no celular ou no computador. Tocar no aviso abre a tela do assunto.",
    veja: "/ajuda/avisos#sininho",
  },
  {
    termo: "Fila sem internet",
    definicao: "O lugar, no próprio aparelho, onde ficam os lançamentos feitos sem internet esperando a conexão. A faixa amarela no alto da tela mostra quantos estão aguardando.",
    veja: "/ajuda/sem-internet#fila",
  },
  {
    termo: "Sincronizar",
    definicao: "Enviar ao sistema o que ficou guardado na fila do aparelho. Acontece sozinho quando a internet volta e a cada minuto; o botão Enviar agora envia na hora.",
    veja: "/ajuda/sem-internet#fila",
  },
  {
    termo: "Lançamento recusado",
    definicao: "Lançamento da fila sem internet que o sistema não aceitou (por exemplo, a máquina já estava parada). Fica parado no aparelho, em vermelho, com o motivo, até você tocar em Tentar de novo ou Descartar.",
    veja: "/ajuda/sem-internet#recusado",
  },
  {
    termo: "Login",
    definicao: "O seu nome de usuário para entrar no sistema, no formato nome.sobrenome, sem acento (ex.: joao.silva).",
    veja: "/ajuda/primeiros-passos#entrar",
  },
  {
    termo: "Senha provisória",
    definicao: "A senha que o gerente define ao cadastrar você ou ao redefinir a sua senha. No primeiro acesso, o sistema pede para trocar por uma senha só sua.",
    veja: "/ajuda/primeiros-passos#primeiro-acesso",
  },
  {
    termo: "Pergunta de segurança",
    definicao: "Uma pergunta com resposta que só você sabe, cadastrada em Meu perfil. Com ela, você cria uma senha nova sozinho em Esqueci a minha senha.",
    veja: "/ajuda/primeiros-passos#pergunta-de-seguranca",
  },
  {
    termo: "Módulo",
    definicao: "Cada parte do sistema: a Serraria (toras, serraria, estufas, pacotes, expedição e indicadores) e a Manutenção (requisições, preventivas, checklists e equipamentos). A troca de módulo é feita na tela de início.",
    veja: "/ajuda/primeiros-passos#tela-de-inicio",
  },
  {
    termo: "Perfil",
    definicao:
      "O que a pessoa pode fazer em cada módulo. Na Serraria: Supervisor, Apontador ou Consulta. Na Manutenção: Supervisor, Manutentor ou Operador. O Gerente tem acesso total aos dois. Quem escolhe é o gerente, na tela Usuários. Veja “Quem faz o quê na Serraria” (/ajuda/serraria-inicio#perfis) e “O que cada perfil faz na Manutenção” (/ajuda/manutencao-inicio#perfis).",
    veja: "/ajuda/usuarios#perfis",
  },
  {
    termo: "Sem acesso",
    definicao: "O perfil de quem não usa aquele módulo. Por exemplo, quem só trabalha na serraria fica com Sem acesso na Manutenção.",
    veja: "/ajuda/usuarios#perfis",
  },
  {
    termo: "Auditoria",
    definicao: "O registro de quem fez o quê no sistema e quando, com o valor anterior e o novo de cada alteração. Quem consulta é o gerente.",
    veja: "/ajuda/auditoria#o-que-fica",
  },
  {
    termo: "QR Code",
    definicao:
      "O código quadrado das etiquetas, lido com a câmera do celular. O do pacote abre a página do pacote (quem é de fora vê só a origem da madeira); o do lote abre o lote; o da máquina abre a página dela, para pedir manutenção.",
    veja: "/ajuda/serraria-ler-etiqueta#ler-com-a-camera",
  },
  {
    termo: "Máquina liberada",
    definicao:
      "O botão que fecha uma parada quando a máquina volta a funcionar (na Serraria, em Paradas de máquina; na Manutenção, na faixa vermelha da requisição). O cronômetro para, a parada fecha nos dois módulos e o tempo parado vai para o boletim do dia. Na lista de requisições, o selo verde Máquina liberada mostra que a máquina já voltou e ainda falta conferir e concluir a requisição. Na Serraria, veja “Máquina liberada” (/ajuda/serraria-paradas#maquina-liberada).",
    veja: "/ajuda/manutencao-maquina-parada",
  },
  {
    termo: "Tipo da falha",
    definicao:
      "Mecânica, Elétrica ou Operacional: o tipo de uma parada de máquina, escolhido no Máquina parou da serraria (“Máquina parou: marcar na hora” (/ajuda/serraria-paradas#maquina-parou)) ou na requisição com A máquina está parada. Nas máquinas da linha da serraria, vira o centro da parada no boletim do dia; nas outras máquinas, não faz diferença.",
    veja: "/ajuda/manutencao-maquina-parada#pela-manutencao",
  },
  {
    termo: "Máquinas da linha",
    definicao:
      "As máquinas da linha da serraria, marcadas em Cadastros → Máquinas da linha (na Serraria) ou no cadastro do equipamento (na Manutenção). Só elas aparecem no botão Máquina parou, e só a parada delas (também a aberta numa requisição com A máquina está parada) entra no boletim do dia. Veja “Quais máquinas entram” (/ajuda/manutencao-maquina-parada#maquinas-da-linha).",
    veja: "/ajuda/serraria-cadastros#maquinas-da-linha",
  },

  // ───────────── Serraria ─────────────
  {
    termo: "Boletim do dia",
    modulo: "producao",
    definicao: "O registro de um dia da serraria: junta os lotes apontados, as paradas e as toras serradas, com o volume, a meta e os índices do dia. É aberto sozinho no primeiro lote do dia.",
    veja: "/ajuda/serraria-boletins#o-boletim",
  },
  {
    termo: "Responsável pelo boletim",
    modulo: "producao",
    definicao: "Quem lançou o primeiro lote do dia. Só essa pessoa e o supervisor editam o boletim (Paradas e toras). Se o boletim foi aberto sozinho por uma parada, o primeiro lote lançado passa o boletim para quem lançou.",
    veja: "/ajuda/serraria-boletins#o-boletim",
  },
  {
    termo: "Ficha de madeira",
    modulo: "producao",
    definicao:
      "A tabela no mesmo desenho da ficha de papel da fábrica, usada na serraria, no ciclo da estufa e no inventário. Cada linha tem a espessura, as larguras marcadas e as peças em cada comprimento (2,50, 2,10, 1,65, 1,30, 1,00 e 0,70 m).",
    veja: "/ajuda/serraria-ficha#como-preencher-a-ficha",
  },
  {
    termo: "Linha da ficha",
    modulo: "producao",
    definicao: "Uma linha da ficha de madeira: uma espessura, as larguras marcadas (125, 100, 85, 50 ou Mista) e quantas peças há em cada comprimento. Cada comprimento preenchido vira uma medida no sistema.",
    veja: "/ajuda/serraria-ficha#como-preencher-a-ficha",
  },
  {
    termo: "Espessura",
    modulo: "producao",
    definicao: "A grossura da peça, em milímetros: 23, 25, 32 ou 38 mm. É o primeiro campo de cada linha da ficha de madeira.",
    veja: "/ajuda/serraria-ficha#como-preencher-a-ficha",
  },
  {
    termo: "Larguras",
    modulo: "producao",
    definicao: "125, 100, 85 e 50 mm, marcadas em cada linha da ficha (pode marcar várias juntas) ou Mista. Com várias marcadas, o m³ usa a média delas.",
    veja: "/ajuda/serraria-ficha#como-preencher-a-ficha",
  },
  {
    termo: "Mista",
    modulo: "producao",
    definicao: "Marcação de largura para madeira de larguras variadas. Para calcular o m³, o sistema usa a média de todas as larguras (125, 100, 85 e 50).",
    veja: "/ajuda/serraria-ficha#como-preencher-a-ficha",
  },
  {
    termo: "Bitola",
    modulo: "producao",
    definicao: "A medida da peça: espessura × largura × comprimento, em milímetros (ex.: 25 × 100 × 2500).",
    veja: "/ajuda/serraria-pacotes#lista-de-pacotes",
  },
  {
    termo: "Lote (LOT-000123)",
    modulo: "producao",
    definicao: "Cada lançamento da ficha da serraria: a madeira serrada para um pedido, lançada de uma vez, com etiqueta de QR Code e código de barras. Os lotes do dia formam o boletim do dia.",
    veja: "/ajuda/serraria-ficha#apontar-lote",
  },
  {
    termo: "Código de barras",
    modulo: "producao",
    definicao: "As barras da etiqueta do lote, com o código LOT-. Servem para a leitura rápida no chão de fábrica; o QR Code da mesma etiqueta abre o lote no sistema.",
    veja: "/ajuda/serraria-ficha#etiqueta-do-lote",
  },
  {
    termo: "Pedido",
    modulo: "producao",
    definicao: "A encomenda de um cliente: número, cliente, destino, volume combinado (m³) e prazo. Lotes e pacotes ficam ligados ao pedido, e o sistema mostra quanto já foi serrado, secado e expedido.",
    veja: "/ajuda/serraria-pedidos#acompanhar-pedidos",
  },
  {
    termo: "Saldo a expedir",
    modulo: "producao",
    definicao: "O que ainda falta sair de um pedido: o volume combinado menos o que já foi expedido. Pedido sem volume combinado não tem saldo.",
    veja: "/ajuda/serraria-pedidos#pedido-pronto",
  },
  {
    termo: "Pronto para expedir",
    modulo: "producao",
    definicao:
      "Selo do pedido cujos pacotes secos já cobrem o saldo a expedir (sem volume combinado: quando tudo o que falta sair está seco). O supervisor e o gerente recebem o aviso Pedido pronto para expedir.",
    veja: "/ajuda/serraria-pedidos#pedido-pronto",
  },
  {
    termo: "Disponível para venda",
    modulo: "producao",
    definicao: "Os pacotes em estoque (secos, na estufa e verdes), por bitola e classe. Os sem pedido estão livres para vender; os com pedido já estão reservados.",
    veja: "/ajuda/serraria-pedidos#disponivel",
  },
  {
    termo: "Pacote (PCT-000123)",
    modulo: "producao",
    definicao:
      "A madeira empacotada, com etiqueta de QR Code. Passa por Verde (serrado), Na estufa e Seco · em estoque até Expedido, e guarda a sua origem: estufa, dias de serraria, cargas de toras e floresta. Para formar, veja “Formar pacotes” (/ajuda/serraria-pacotes#formar-pacotes).",
    veja: "/ajuda/serraria-pacotes#lista-de-pacotes",
  },
  {
    termo: "Verde e seco",
    modulo: "producao",
    definicao: "Madeira verde é a recém-serrada, ainda úmida, que não passou pela estufa. Madeira seca é a que saiu de um ciclo de estufa. Um pacote verde pode ir para a estufa e sair seco.",
    veja: "/ajuda/serraria-pacotes#verde-na-estufa",
  },
  {
    termo: "Situação do pacote",
    modulo: "producao",
    definicao:
      "Verde (serrado): formado com a madeira da serraria, sem estufa. Na estufa: pacote verde enviado para um ciclo de secagem. Seco · em estoque: formado com a madeira da estufa, ou verde que saiu seco do ciclo. Expedido: saiu no caminhão, com romaneio. Cancelado: cancelado pelo supervisor.",
    veja: "/ajuda/serraria-pacotes#lista-de-pacotes",
  },
  {
    termo: "Ciclo de secagem",
    modulo: "producao",
    definicao:
      "O ciclo de estufa: uma secagem numa estufa, da entrada da madeira à saída: nº do ciclo, entrada, previsão de saída, plantão, a ficha da madeira carregada, o checklist e, no fim, a umidade final. Se passar da previsão de saída, a estufa fica vermelha e a equipe é avisada.",
    veja: "/ajuda/serraria-estufas#iniciar-ciclo",
  },
  {
    termo: "Plantão",
    modulo: "producao",
    definicao: "Quem acompanha o ciclo da estufa. Também recebe o aviso quando o ciclo passa da previsão de saída.",
    veja: "/ajuda/serraria-estufas#iniciar-ciclo",
  },
  {
    termo: "Grades úmidas",
    modulo: "producao",
    definicao: "Na ficha da estufa, quantas grades de madeira úmida entraram em cada linha. Grade é a pilha de madeira serrada montada em camadas, com separadores, como sai do gradeador.",
    veja: "/ajuda/serraria-estufas#iniciar-ciclo",
  },
  {
    termo: "Aclimatação",
    modulo: "producao",
    definicao: "O descanso da madeira depois da estufa, antes do uso: 24 horas no pátio e mais 24 horas na fábrica. A página do ciclo mostra quando a madeira fica liberada.",
    veja: "/ajuda/serraria-estufas#checklist-e-conclusao",
  },
  {
    termo: "Checklist da estufa",
    modulo: "producao",
    definicao: "A lista de conferência de cada ciclo, com os itens de A cada novo ciclo e Antes de iniciar novo ciclo. Cada item é marcado OK ou Não conforme, com o nome de quem marcou.",
    veja: "/ajuda/serraria-estufas#checklist-e-conclusao",
  },
  {
    termo: "Romaneio (ROM-000123)",
    modulo: "producao",
    definicao: "O documento de cada saída de caminhão: os pacotes carregados, o motorista, as placas e a nota fiscal. Toda saída gera um romaneio, que pode ser baixado em PDF.",
    veja: "/ajuda/serraria-expedicao#romaneio",
  },
  {
    termo: "Declaração de origem",
    modulo: "producao",
    definicao:
      "Documento da própria empresa, em português e inglês, com a origem da madeira dos pacotes de um romaneio (florestas e datas de cada etapa), feito com os registros do sistema. Não substitui a nota fiscal nem os documentos oficiais fiscais, ambientais ou fitossanitários.",
    veja: "/ajuda/serraria-expedicao#declaracao-de-origem",
  },
  {
    termo: "QR público (página do cliente)",
    modulo: "producao",
    definicao:
      "A página que abre quando alguém de fora, sem login, lê o QR do pacote: em português ou inglês, com a floresta de origem e as datas de cada etapa, sem cliente, pedido, pessoas, fornecedor nem placas. Na página do pacote, Como o cliente vê mostra essa página.",
    veja: "/ajuda/serraria-pacotes#qr-publico",
  },
  {
    termo: "Inventário",
    modulo: "producao",
    definicao: "A contagem da madeira que está na empresa, na mesma ficha da serraria. Cada linha diz onde a madeira está (Madeira em): Grade, Pacote, uma das estufas ou Verde.",
    veja: "/ajuda/serraria-inventario#inventario-do-dia",
  },
  {
    termo: "Madeira em (inventário)",
    modulo: "producao",
    definicao: "O campo de cada linha da ficha do inventário que diz onde a madeira está: Grade, Pacote, uma das estufas ou Verde. O Último inventário soma por esse local.",
    veja: "/ajuda/serraria-inventario#inventario-do-dia",
  },
  {
    termo: "Carga de toras (CT-000123)",
    modulo: "producao",
    definicao: "Cada caminhão de toras que chega ao pátio: data, floresta, fornecedor, motorista, placas, diâmetro e peso. É o começo da origem da madeira.",
    veja: "/ajuda/serraria-toras#registrar-carga",
  },
  {
    termo: "Floresta",
    modulo: "producao",
    definicao: "O lugar de onde vieram as toras (cadastro de origem). É a origem que aparece no QR do pacote e na declaração de origem.",
    veja: "/ajuda/serraria-cadastros#origem",
  },
  {
    termo: "Julieta",
    modulo: "producao",
    definicao: "O reboque do caminhão. A placa da julieta é a segunda placa, que vem do cadastro do motorista.",
    veja: "/ajuda/serraria-cadastros#origem",
  },
  {
    termo: "Classe de diâmetro",
    modulo: "producao",
    definicao: "A grossura das toras de uma carga: Fina, Média ou Grossa.",
    veja: "/ajuda/serraria-toras#registrar-carga",
  },
  {
    termo: "Classe (Ótimo, Bom, Regular)",
    modulo: "producao",
    definicao: "A classe da madeira sai do comprimento da peça: 2,50 e 2,10 m são Ótimo; 1,65 m é Bom; 1,30, 1,00 e 0,70 m são Regular. Ninguém escolhe: a ficha calcula sozinha.",
    veja: "/ajuda/serraria-ficha#como-preencher-a-ficha",
  },
  {
    termo: "Metro cúbico (m³)",
    modulo: "producao",
    definicao: "A medida do volume da madeira. O sistema calcula sozinho: espessura × largura × comprimento × peças. Com várias larguras marcadas na linha, usa a média delas; com Mista, a média de todas.",
    veja: "/ajuda/serraria-ficha#como-preencher-a-ficha",
  },
  {
    termo: "Meta",
    modulo: "producao",
    definicao: "O volume (m³) que a serraria deve serrar no dia. Vem de Cadastros → Configuração quando o boletim é aberto e não muda depois. É a base da produtividade e do OEE.",
    veja: "/ajuda/serraria-cadastros#configuracao",
  },
  {
    termo: "Turno",
    modulo: "producao",
    definicao: "O horário de trabalho da serraria (Turno começa e Turno termina, em Cadastros → Configuração). Só o tempo parado dentro do turno entra no boletim.",
    veja: "/ajuda/serraria-paradas#tempo-no-boletim",
  },
  {
    termo: "Disponibilidade",
    modulo: "producao",
    definicao: "Quanto do tempo programado a serraria trabalhou sem parada: (tempo programado − tempo parado) ÷ tempo programado.",
    veja: "/ajuda/serraria-indicadores#como-calcula",
  },
  {
    termo: "Produtividade",
    modulo: "producao",
    definicao: "Quanto da meta foi serrado: serrado (m³) ÷ meta (m³).",
    veja: "/ajuda/serraria-indicadores#como-calcula",
  },
  {
    termo: "OEE",
    modulo: "producao",
    definicao: "O índice geral da serraria: Disponibilidade × Produtividade. Aqui a qualidade não entra na conta.",
    veja: "/ajuda/serraria-indicadores#como-calcula",
  },
  {
    termo: "Rendimento",
    modulo: "producao",
    definicao: "Quanto das toras virou madeira serrada: serrado (m³) ÷ toras consumidas (m³). Só conta nos dias em que as toras consumidas foram informadas no boletim.",
    veja: "/ajuda/serraria-indicadores#como-calcula",
  },
  {
    termo: "Parada de máquina",
    modulo: "producao",
    definicao:
      "O tempo em que uma máquina da linha ficou parada. É marcada na hora (Máquina parou) e fechada quando a máquina volta (Máquina liberada); o tempo dentro do turno vai sozinho para o boletim do dia.",
    veja: "/ajuda/serraria-paradas#maquina-parou",
  },
  {
    termo: "Centro de parada (MEC, ELE, OPE)",
    modulo: "producao",
    definicao:
      "O tipo da falha de uma parada: Mecânica (MEC), Elétrica (ELE) ou Operacional (OPE: troca de serra, falta de toras, madeira atravessada e outras causas da operação). Mecânica e elétrica abrem uma requisição para a manutenção. O boletim do dia mostra o tempo parado de cada centro (“Como o tempo parado entra no boletim” (/ajuda/serraria-paradas#tempo-no-boletim)).",
    veja: "/ajuda/serraria-paradas#maquina-parou",
  },
  {
    termo: "Pareto",
    modulo: "producao",
    definicao: "O gráfico dos motivos de parada em ordem, do que mais parou a linha ao que menos parou. Mostra onde agir primeiro.",
    veja: "/ajuda/serraria-indicadores#painel-de-indicadores",
  },
  {
    termo: "Rastreabilidade",
    modulo: "producao",
    definicao: "A ligação de cada pacote com as etapas por onde a madeira passou: estufa, dias de serraria e cargas de toras, até a floresta. É o que o QR do pacote mostra.",
    veja: "/ajuda/serraria-inicio#o-caminho-da-madeira",
  },

  // ───────────── Manutenção ─────────────
  {
    termo: "Requisição (#00012)",
    modulo: "manutencao",
    definicao: "Um pedido de manutenção: o que precisa ser feito, em qual equipamento, com tipo, prioridade e fotos. Tem número (ex.: #00012) e passa pelos status até Concluída ou Cancelada.",
    veja: "/ajuda/manutencao-abrir",
  },
  {
    termo: "Solicitante",
    modulo: "manutencao",
    definicao: "Quem abriu a requisição. Recebe o aviso de cada mudança de status e dos comentários, e pode cancelar a própria requisição enquanto ela está Aberta.",
    veja: "/ajuda/manutencao-acompanhar#pagina",
  },
  {
    termo: "Status da requisição",
    modulo: "manutencao",
    definicao: "A situação da requisição: Aberta, Em análise, Planejada, Agendada, Em andamento, Aguardando peças, Adiada, Concluída ou Cancelada. Cada mudança fica no histórico, com quem mudou.",
    veja: "/ajuda/manutencao-acompanhar#status",
  },
  {
    termo: "Pendente",
    modulo: "manutencao",
    definicao: "Requisição que ainda não foi concluída nem cancelada.",
    veja: "/ajuda/manutencao-acompanhar#encontrar",
  },
  {
    termo: "Prioridade",
    modulo: "manutencao",
    definicao: "A urgência da requisição: Baixa, Média, Alta ou Urgente. As de prioridade alta, as urgentes e as com máquina parada também avisam o gerente.",
    veja: "/ajuda/manutencao-abrir#passo-a-passo",
  },
  {
    termo: "Tipo de manutenção",
    modulo: "manutencao",
    definicao:
      "O campo Tipo da requisição: Corretiva conserta o que quebrou; Preventiva é feita antes de quebrar, em data marcada; Preditiva acompanha sinais da máquina, como vibração e temperatura; Melhoria muda algo para funcionar melhor.",
    veja: "/ajuda/manutencao-abrir#passo-a-passo",
  },
  {
    termo: "Corretiva",
    modulo: "manutencao",
    definicao: "Manutenção para consertar o que quebrou ou está falhando. É o tipo das requisições abertas pelo Máquina parou da serraria.",
    veja: "/ajuda/manutencao-abrir#passo-a-passo",
  },
  {
    termo: "Preventiva",
    modulo: "manutencao",
    definicao: "Manutenção feita antes de quebrar, em datas planejadas. Os planos de preventiva criam essas requisições sozinhos.",
    veja: "/ajuda/manutencao-preventivas#como-funciona",
  },
  {
    termo: "Preditiva",
    modulo: "manutencao",
    definicao: "Acompanhamento de sinais da máquina, como vibração e temperatura (medições e inspeções), para perceber a falha antes de ela acontecer.",
    veja: "/ajuda/manutencao-abrir#passo-a-passo",
  },
  {
    termo: "Melhoria",
    modulo: "manutencao",
    definicao: "Mudança para a máquina ou o local funcionar melhor, sem que esteja quebrado.",
    veja: "/ajuda/manutencao-abrir#passo-a-passo",
  },
  {
    termo: "Plano de preventiva",
    modulo: "manutencao",
    definicao: "O cadastro que diz o que fazer, em qual equipamento e de quanto em quanto tempo. O sistema cria a requisição sozinho, já agendada, com o responsável e o checklist do plano.",
    veja: "/ajuda/manutencao-preventivas#como-funciona",
  },
  {
    termo: "Checklist",
    modulo: "manutencao",
    definicao:
      "A lista de itens para conferir durante o serviço. Os modelos ficam em Checklists e entram na requisição pelo plano de preventiva ou por Aplicar checklist. A requisição só é concluída com todos os itens marcados (“Checklist” (/ajuda/manutencao-atender#checklist)).",
    veja: "/ajuda/manutencao-preventivas#checklists",
  },
  {
    termo: "Responsável",
    modulo: "manutencao",
    definicao: "A pessoa da manutenção (supervisor ou manutentor) que cuida da requisição. Recebe os avisos dela e o lembrete do dia agendado.",
    veja: "/ajuda/manutencao-atender#atualizar",
  },
  {
    termo: "Máquina parada",
    modulo: "manutencao",
    definicao: "A marcação da requisição quando o equipamento parou de funcionar. Conta o tempo parado, usado nos indicadores; numa máquina da linha da serraria, o tempo também entra no boletim do dia.",
    veja: "/ajuda/manutencao-abrir#maquina-parada",
  },
  {
    termo: "Equipamento",
    modulo: "manutencao",
    definicao: "Cada máquina ou instalação cadastrada, com código (TAG), nome e setor. Tem uma ficha com o histórico de requisições e uma etiqueta com QR Code.",
    veja: "/ajuda/manutencao-equipamentos#cadastrar",
  },
  {
    termo: "Etiqueta QR do equipamento",
    modulo: "manutencao",
    definicao: "A etiqueta colada na máquina, com o QR Code e o código (TAG). Lida com a câmera do celular, abre a página da máquina, com as requisições em aberto e o botão para abrir uma requisição já com a máquina escolhida.",
    veja: "/ajuda/manutencao-equipamentos#etiquetas",
  },
  {
    termo: "TAG",
    modulo: "manutencao",
    definicao: "O código curto e único da máquina (ex.: LIX-02). Sai na etiqueta e serve para buscar a máquina.",
    veja: "/ajuda/manutencao-equipamentos#cadastrar",
  },
  {
    termo: "Setor",
    modulo: "manutencao",
    definicao: "A área da empresa onde fica o equipamento. A requisição herda o setor do equipamento.",
    veja: "/ajuda/manutencao-setores#setores",
  },
  {
    termo: "Horas trabalhadas",
    modulo: "manutencao",
    definicao: "O tempo de serviço que cada pessoa da manutenção lança na requisição. Somam nos indicadores e nos relatórios.",
    veja: "/ajuda/manutencao-atender#horas",
  },
  {
    termo: "Serviço realizado",
    modulo: "manutencao",
    definicao: "O que foi feito na requisição, escrito por quem atende. É obrigatório para concluir: sem ele aparece Descreva o serviço realizado para concluir.",
    veja: "/ajuda/manutencao-atender#concluir",
  },
  {
    termo: "MTTR",
    modulo: "manutencao",
    definicao: "Tempo médio de reparo: quanto dura, em média, uma parada de máquina. Quanto menor, melhor.",
    veja: "/ajuda/manutencao-indicadores#painel",
  },
  {
    termo: "MTBF",
    modulo: "manutencao",
    definicao: "Tempo médio entre falhas: quanto tempo, em média, a máquina funciona entre uma falha (corretiva) e a próxima. Quanto maior, melhor.",
    veja: "/ajuda/manutencao-indicadores#painel",
  },
  {
    termo: "Disponibilidade das máquinas",
    modulo: "manutencao",
    definicao: "Nos indicadores da Manutenção, a parte do tempo em que as máquinas ativas não estavam paradas. Depende de marcar a máquina parada nas requisições.",
    veja: "/ajuda/manutencao-indicadores#painel",
  },
  {
    termo: "Tempo médio de atendimento",
    modulo: "manutencao",
    definicao: "Nos indicadores da Manutenção, quanto tempo leva, em média, da abertura até a conclusão de uma requisição. As canceladas ficam fora da conta.",
    veja: "/ajuda/manutencao-indicadores#painel",
  },
  {
    termo: "Preventivas no prazo",
    modulo: "manutencao",
    definicao: "Nos indicadores da Manutenção, quantas preventivas previstas no período foram concluídas até o dia agendado.",
    veja: "/ajuda/manutencao-indicadores#painel",
  },
];
