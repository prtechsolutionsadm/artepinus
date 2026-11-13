// Conteúdo do manual do usuário (página /ajuda). Texto simples, organizado por tema.
// `modulo` mostra a seção (ou o tópico) só para quem usa o módulo; `para` / `paraProducao`
// limitam a quem tem a permissão. Sem esses campos, a seção vale para todos.
import { MODULOS_ATIVOS, type Acao, type AcaoProducao, type Modulo } from "@/lib/permissoes";

export type Bloco =
  | { tipo: "texto"; texto: string }
  | { tipo: "passos"; itens: string[] }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "dica"; texto: string }
  | { tipo: "atencao"; texto: string }
  | { tipo: "termos"; itens: [string, string][] };

export type Topico = { titulo: string; modulo?: Modulo; blocos: Bloco[] };
export type Secao = {
  id: string;
  titulo: string;
  resumo: string;
  modulo?: Modulo;
  para?: Acao;
  paraProducao?: AcaoProducao;
  topicos: Topico[];
};

/** Igual à tela de usuários: com a manutenção desligada, o cadastro mostra "Acesso geral". */
const MANUTENCAO_ATIVA = MODULOS_ATIVOS.includes("manutencao");

export const MANUAL: Secao[] = [
  {
    id: "primeiros-passos",
    titulo: "Primeiros passos",
    resumo: "Entrar no sistema, trocar a senha e instalar no celular",
    topicos: [
      {
        titulo: "Como entrar",
        blocos: [
          { tipo: "passos", itens: ["Abra o endereço do sistema no navegador do celular ou do computador.", "Digite seu login no formato nome.sobrenome (ex.: joao.silva).", "Digite a senha e toque em Entrar."] },
          { tipo: "texto", texto: "No primeiro acesso, ou quando o administrador redefinir sua senha, o sistema pede para você criar uma senha nova antes de continuar." },
          { tipo: "dica", texto: "Esqueceu a senha? No login, toque em Esqueci a minha senha e responda a sua pergunta de segurança (cadastre antes em Meu perfil). Se ainda não cadastrou a pergunta, fale com o gerente ou o administrador: ele define uma senha provisória e você troca ao entrar." },
        ],
      },
      {
        titulo: "Trocar a senha",
        blocos: [{ tipo: "passos", itens: ["Toque nas suas iniciais (canto superior direito) ou vá em Meu perfil.", "Em Trocar senha, informe a senha atual e a nova duas vezes.", "Toque em Salvar nova senha."] }],
      },
      {
        titulo: "Instalar como aplicativo no celular",
        blocos: [
          { tipo: "texto", texto: "O sistema funciona como um aplicativo: fica com ícone na tela inicial, abre em tela cheia e recebe notificações." },
          { tipo: "termos", itens: [
            ["Android (Chrome)", "Abra o sistema, toque no menu ⋮ e escolha Instalar app (ou Adicionar à tela inicial)."],
            ["iPhone (Safari)", "Abra o sistema no Safari, toque em Compartilhar (quadrado com seta) e depois em Adicionar à Tela de Início."],
          ] },
          { tipo: "atencao", texto: "No iPhone as notificações só funcionam com o app instalado e aberto pelo ícone da tela de início." },
        ],
      },
      {
        titulo: "Navegando pelo sistema",
        blocos: [
          { tipo: "lista", itens: [
            "O sistema fica atrás do site da empresa: no site, toque em Acessar sistema (ou abra o app instalado).",
            "Esqueceu a senha? No login, toque em Esqueci a minha senha, informe o login, responda a sua pergunta de segurança e crie uma nova senha. Para isso, cadastre antes a pergunta em Meu perfil.",
            "Depois de entrar, a tela de início mostra os módulos: toque em Serraria para trabalhar. A Manutenção aparece como Em breve. Para voltar a essa tela, use Escolher módulo no menu do seu nome (no celular, em Mais).",
            "No computador: o menu fica à esquerda — Início e os grupos Operação, Gestão e Cadastros, com a busca no alto (atalho: tecla /) e, no fim, o módulo em uso (toque para ver ou trocar de módulo). No topo ficam voltar/avançar, o caminho da tela e, à direita, o tema, o manual, o sininho e o seu nome.",
            "A tela Início mostra o que precisa de atenção (dia sem apontamento, estufa passando da previsão, pacotes por formar) e os botões para lançar cada etapa.",
            "O menu segue a ordem do processo: 1 Recebimento de toras → 2 Serraria → 3 Estufas → 4 Pacotes e expedição. Indicadores e inventário ficam em Gestão; pedidos e demais cadastros, em Cadastros.",
            "No celular: use a barra de baixo — Início, Pacotes, o botão do meio para ler a etiqueta de um pacote ou lote, Estufas e Mais. Em Mais estão as demais telas e o botão Sair.",
            "A busca (no computador, no alto do menu à esquerda; no celular, a lupa do topo) encontra pacote (PCT-), lote (LOT-) e carga (CT-) pelo código — abre direto — e também pedido, cliente, motorista, placa ou floresta.",
            "Painel para TV (Gestão → Painel para TV): abra numa TV ou monitor do barracão com um usuário do sistema, toque em Tela cheia e deixe aberto. Mostra o serrado do dia contra a meta, os últimos lotes, as paradas, as estufas e o mês; atualiza sozinho a cada minuto e mantém a tela ligada.",
            "Roteiros para imprimir: no Manual do usuário, toque em Roteiros para imprimir — uma folha por função (toras, serraria, estufas, expedição, inventário, supervisão) para deixar no posto de trabalho.",
            "O QR da etiqueta do pacote, lido por alguém de fora (o cliente), abre uma página pública em português ou inglês com a floresta de origem, as datas de recebimento das toras, serragem, secagem em estufa e expedição — sem cliente, pedido, pessoas ou placas. O QR das etiquetas leva um código aleatório, para ninguém percorrer os pacotes trocando o número; etiquetas antigas, com o número, continuam valendo. Quem está logado no sistema vê a tela completa; para ver a versão do cliente, use Como o cliente vê no pacote.",
            "A tela Início mostra também as Estufas agora: livre ou secando, há quanto tempo, o volume e o andamento até a previsão de saída.",
            "Avisos no celular: ative em Meu perfil (no iPhone, com o app instalado na tela de início). A serraria avisa quando uma estufa passa da previsão de saída, quando o dia útil termina sem nenhum lote apontado (às 18h) e quando um pedido fica pronto para expedir (todos os pacotes dele secos).",
            "Tema claro, escuro ou automático (segue o aparelho): no computador, no menu do seu nome (canto direito do topo); no celular, em Mais ou em Meu perfil.",
            "As fichas de madeira (lote, ciclo de estufa, Madeira carregada no mês e inventário) têm o botão PDF, que baixa a ficha no desenho do papel — funciona até sem internet.",
          ] },
        ],
      },
    ],
  },
  {
    id: "abrir-requisicao",
    modulo: "manutencao",
    titulo: "Abrir uma requisição",
    resumo: "Pedir manutenção com fotos, pelo QR Code ou até sem internet",
    topicos: [
      {
        titulo: "Passo a passo",
        blocos: [
          { tipo: "passos", itens: [
            "Toque em + Nova (no celular) ou Nova requisição (no computador).",
            "Escreva o que precisa ser feito e descreva o problema: quando começou, barulhos, se piorou…",
            "Se a máquina parou de funcionar, marque A máquina está parada.",
            "Escolha o equipamento, o tipo e a prioridade. O setor é preenchido automaticamente pelo equipamento.",
            "Adicione fotos do problema (Tirar foto ou Adicionar fotos, até 6).",
            "Toque em Abrir requisição. Seu nome e a data são registrados automaticamente.",
          ] },
          { tipo: "dica", texto: "Fotos ajudam muito a manutenção a entender o problema e a levar a peça certa. Fotografe de perto e de longe." },
        ],
      },
      {
        titulo: "Pelo QR Code da máquina",
        blocos: [
          { tipo: "passos", itens: [
            "Aponte a câmera do celular para a etiqueta QR colada na máquina e toque no link que aparecer.",
            "Se pedir, faça login: você volta direto para a página da máquina.",
            "Veja se já existe uma requisição em aberto para o mesmo problema. Se existir, comente nela em vez de abrir outra.",
            "Toque em Abrir requisição para esta máquina: o equipamento já vem escolhido.",
          ] },
        ],
      },
      {
        titulo: "Máquina parada",
        blocos: [
          { tipo: "texto", texto: "Marcar a máquina como parada avisa a manutenção com prioridade e começa a contar o tempo de máquina parada, usado nos indicadores. A contagem termina quando a manutenção informa que a máquina voltou a operar, ou quando a requisição é concluída." },
          { tipo: "texto", texto: "Máquina da linha da serraria: escolha também se a falha é mecânica ou elétrica. A parada aparece na hora na serraria e, quando a máquina volta a operar (ou a requisição é concluída), o tempo entra no boletim do dia. Paradas marcadas pela serraria no botão Máquina parou chegam aqui como requisição nova; o botão Máquina liberada fecha a parada nos dois módulos." },
        ],
      },
      {
        titulo: "Sem internet",
        blocos: [
          { tipo: "texto", texto: "Em locais sem sinal você ainda consegue abrir requisições (inclusive com fotos)." },
          { tipo: "passos", itens: [
            "Abra o app e toque em + Nova normalmente.",
            "Preencha e toque em Abrir requisição. Aparece o aviso: requisição guardada no aparelho.",
            "Quando a internet voltar, ela é enviada sozinha. Uma faixa amarela no topo mostra quantas estão aguardando; ao enviar, aparece uma mensagem verde.",
          ] },
          { tipo: "atencao", texto: "Para funcionar sem internet, o app precisa ter sido aberto pelo menos uma vez com internet neste aparelho. Não saia do sistema (Sair) enquanto houver requisições aguardando envio: elas seriam perdidas — o sistema avisa antes." },
        ],
      },
    ],
  },
  {
    id: "acompanhar",
    modulo: "manutencao",
    titulo: "Acompanhar requisições",
    resumo: "Status, histórico, comentários e cancelamento",
    topicos: [
      {
        titulo: "O que significa cada status",
        blocos: [
          { tipo: "termos", itens: [
            ["Aberta", "Acabou de ser registrada e aguarda a análise da manutenção."],
            ["Em análise", "A manutenção está avaliando o problema."],
            ["Planejada", "Aprovada, aguardando definir data."],
            ["Agendada", "Já tem data e hora marcadas para o serviço."],
            ["Em andamento", "O serviço está sendo executado."],
            ["Aguardando peças", "Parada esperando material ou peça."],
            ["Adiada", "Foi postergada (o motivo fica registrado)."],
            ["Concluída", "Serviço finalizado; o que foi feito fica registrado."],
            ["Cancelada", "Não será executada (o motivo fica registrado)."],
          ] },
        ],
      },
      {
        titulo: "Ver e encontrar requisições",
        blocos: [
          { tipo: "lista", itens: [
            "Requisições: lista completa com filtros por status, prioridade, tipo e setor, e as opções Abertas por mim e Atribuídas a mim.",
            "Início: resumo com pendentes, urgentes, agendadas dos próximos dias e as suas requisições.",
            "Agenda: tudo que está agendado, separado por dia, com alerta das que passaram da data.",
          ] },
          { tipo: "texto", texto: "Na página da requisição você vê todos os dados, as fotos, o checklist, as horas trabalhadas e o histórico completo de quem fez o quê." },
        ],
      },
      {
        titulo: "Comentar e enviar mais fotos",
        blocos: [
          { tipo: "texto", texto: "No fim da página da requisição use Adicionar comentário para passar informações ou tirar dúvidas. O solicitante e o responsável são avisados. Em Fotos você pode anexar novas imagens a qualquer momento." },
        ],
      },
      {
        titulo: "Cancelar a própria requisição",
        blocos: [
          { tipo: "texto", texto: "Enquanto a requisição ainda estiver Aberta, quem abriu pode cancelá-la em Cancelar requisição, informando o motivo. Depois que a manutenção começa a tratar, peça o cancelamento ao supervisor." },
        ],
      },
      {
        titulo: "Imprimir",
        blocos: [{ tipo: "texto", texto: "Na página da requisição toque em Imprimir: sai uma folha com o logo e os dados da empresa, pronta para arquivo em papel ou PDF." }],
      },
    ],
  },
  {
    id: "notificacoes",
    titulo: "Notificações",
    resumo: "Sininho, avisos no celular e lembretes",
    topicos: [
      {
        titulo: "Ativar no celular ou computador",
        blocos: [
          { tipo: "passos", itens: ["Vá em Meu perfil.", "Em Notificações neste aparelho, toque em Ativar notificações e permita quando o navegador perguntar.", "Toque em Enviar notificação de teste para conferir."] },
          { tipo: "texto", texto: "A ativação é por aparelho: faça em cada celular ou computador que você usa." },
          { tipo: "dica", texto: "Bloqueou sem querer? Libere nas configurações do site (ícone de cadeado ao lado do endereço) e recarregue a página." },
          { tipo: "texto", texto: "Tudo também aparece no sininho do topo, com o número de avisos não lidos. Toque em um aviso para abrir a tela relacionada." },
        ],
      },
      {
        titulo: "Avisos da serraria",
        modulo: "producao",
        blocos: [
          { tipo: "lista", itens: [
            "Estufa que passou da previsão de saída: supervisores, apontadores, gerente e administrador, além do plantão e do responsável pelo ciclo.",
            "Dia útil (segunda a sexta) que termina sem nenhum lote apontado, às 18h: supervisores, apontadores, gerente e administrador.",
            "Pedido pronto para expedir: supervisores, gerente e administrador.",
          ] },
        ],
      },
      {
        titulo: "Avisos da manutenção",
        modulo: "manutencao",
        blocos: [
          { tipo: "lista", itens: [
            "Quem abriu: cada mudança de status e os comentários na sua requisição.",
            "Responsável: quando uma requisição é atribuída a você e os comentários nela.",
            "Supervisores e manutentores: requisição nova (com destaque para urgente, prioridade alta e máquina parada).",
            "Gerente: requisições novas de prioridade alta, urgentes ou com máquina parada.",
            "Todos os dias às 7h: lembrete das manutenções agendadas para o dia.",
          ] },
        ],
      },
    ],
  },
  {
    id: "atender",
    modulo: "manutencao",
    titulo: "Atender requisições",
    resumo: "Para a equipe de manutenção: status, agenda, horas, checklist e conclusão",
    para: "atenderRequisicoes",
    topicos: [
      {
        titulo: "Atualizar a requisição",
        blocos: [
          { tipo: "texto", texto: "Na página da requisição, use o quadro Atualizar requisição (à direita no computador, mais abaixo no celular)." },
          { tipo: "lista", itens: [
            "Status: escolha o novo status e toque em Salvar. Quem abriu é avisado.",
            "Responsável: supervisores e gerentes escolhem qualquer manutentor; o manutentor pode assumir a requisição para si.",
            "Data agendada: obrigatória para o status Agendada.",
            "Observação / motivo: fica no histórico; obrigatória para Adiada e Cancelada.",
          ] },
        ],
      },
      {
        titulo: "Máquina parada",
        blocos: [{ tipo: "texto", texto: "No mesmo quadro você marca ou desmarca Máquina parada e ajusta Parada desde e Voltou a operar em. Se ficar vazio, ao concluir o sistema considera que a máquina voltou a operar na hora da conclusão." }],
      },
      {
        titulo: "Lançar horas trabalhadas",
        blocos: [
          { tipo: "passos", itens: ["Na seção Horas trabalhadas, informe quando começou e quanto tempo trabalhou (horas e minutos).", "Opcional: descreva o que foi feito.", "Toque em Registrar horas."] },
          { tipo: "texto", texto: "Pode lançar várias vezes (um lançamento por período trabalhado). Supervisores e gerentes podem lançar em nome de outro manutentor. Para corrigir, apague o lançamento na lixeira e lance de novo." },
        ],
      },
      {
        titulo: "Checklist",
        blocos: [
          { tipo: "texto", texto: "Se a requisição tiver checklist, toque em cada item conforme for realizando. Para incluir um, escolha em Aplicar checklist." },
          { tipo: "atencao", texto: "A requisição só pode ser concluída com todos os itens do checklist marcados." },
        ],
      },
      {
        titulo: "Concluir",
        blocos: [
          { tipo: "passos", itens: [
            "Tire fotos do serviço pronto: em Fotos escolha Do serviço realizado e envie.",
            "No quadro Atualizar requisição, mude o status para Concluída.",
            "Descreva em Serviço realizado o que foi feito (obrigatório) e toque em Salvar.",
          ] },
        ],
      },
    ],
  },
  {
    id: "equipamentos",
    modulo: "manutencao",
    titulo: "Equipamentos e etiquetas QR",
    resumo: "Cadastro, ficha da máquina e impressão das etiquetas",
    para: "equipamentos",
    topicos: [
      {
        titulo: "Cadastrar um equipamento",
        blocos: [
          { tipo: "passos", itens: ["Vá em Equipamentos e toque em Cadastrar equipamento.", "Preencha o código/TAG (ex.: SER-01), o nome e o setor. Fabricante, modelo e nº de série são opcionais, mas ajudam.", "Toque em Cadastrar."] },
          { tipo: "dica", texto: "Use códigos curtos e únicos, como os do patrimônio. O código aparece na etiqueta e serve para buscar a máquina." },
        ],
      },
      {
        titulo: "Ficha do equipamento",
        blocos: [{ tipo: "texto", texto: "Toque em um equipamento para ver a ficha: dados, quantas falhas teve, tempo parado, horas de manutenção, planos de preventiva, QR Code e o histórico completo de requisições. Para alterar os dados use Editar dados do equipamento." }],
      },
      {
        titulo: "Imprimir as etiquetas QR",
        blocos: [
          { tipo: "passos", itens: [
            "Em Equipamentos toque em Etiquetas QR (todas as máquinas, ou filtre por setor). Para uma só, use Imprimir etiqueta na ficha.",
            "Toque em Imprimir etiquetas. Sai em folha A4, 3 por linha.",
            "Recorte e cole cada etiqueta em local visível da máquina.",
          ] },
          { tipo: "dica", texto: "Papel adesivo ou etiqueta plastificada dura mais no chão de fábrica." },
        ],
      },
    ],
  },
  {
    id: "preventivas",
    modulo: "manutencao",
    titulo: "Preventivas e checklists",
    resumo: "Programar manutenções que se repetem e listas de verificação",
    para: "preventivas",
    topicos: [
      {
        titulo: "Criar um checklist",
        blocos: [
          { tipo: "passos", itens: ["Vá em Checklists e toque em Novo checklist.", "Dê um nome (ex.: Preventiva mensal – compressor).", "Escreva os itens, um por linha.", "Toque em Criar checklist."] },
          { tipo: "texto", texto: "Alterar um checklist não muda as requisições já criadas: cada requisição guarda a cópia que recebeu." },
        ],
      },
      {
        titulo: "Criar um plano de preventiva",
        blocos: [
          { tipo: "passos", itens: [
            "Vá em Preventivas e abra Novo plano de preventiva (ou, na ficha do equipamento, Novo plano).",
            "Escolha o equipamento e escreva o que será feito.",
            "Defina a frequência (ex.: a cada 1 mês) e a data e hora da próxima execução.",
            "Escolha com quantos dias de antecedência a requisição deve ser criada, a prioridade, o responsável e o checklist.",
            "Toque em Criar plano.",
          ] },
          { tipo: "texto", texto: "Todo dia às 7h o sistema cria automaticamente as requisições dos planos que estão dentro da antecedência, já agendadas, com responsável e checklist, e avisa o responsável. A próxima data avança sozinha." },
          { tipo: "dica", texto: "Precisa gerar antes? Abra o plano e toque em Gerar agora. Para suspender um plano sem apagá-lo, desmarque Ativo." },
        ],
      },
    ],
  },
  {
    id: "indicadores",
    modulo: "manutencao",
    titulo: "Indicadores e relatórios",
    resumo: "Acompanhar resultados e exportar PDF e Excel",
    para: "relatorios",
    topicos: [
      {
        titulo: "Painel de indicadores",
        blocos: [
          { tipo: "texto", texto: "Em Indicadores escolha o período (30 dias a 12 meses) e, se quiser, um setor. Passe o mouse ou toque nas colunas do gráfico para ver os números; use Ver tabela para os valores exatos." },
          { tipo: "termos", itens: [
            ["Disponibilidade", "Percentual do tempo em que as máquinas ativas não estavam paradas."],
            ["Tempo parado", "Soma de todas as paradas de máquina no período."],
            ["MTTR (tempo médio de reparo)", "Quanto dura, em média, uma parada de máquina. Quanto menor, melhor."],
            ["MTBF (tempo médio entre falhas)", "Tempo médio de funcionamento entre uma falha (corretiva) e outra. Quanto maior, melhor."],
            ["Tempo médio de atendimento", "Da abertura até a conclusão da requisição."],
            ["Preventivas no prazo", "Preventivas concluídas até o dia agendado, entre as previstas no período."],
            ["Pendentes agora", "Requisições ainda não concluídas nem canceladas."],
          ] },
          { tipo: "atencao", texto: "Os indicadores de parada dependem de marcar Máquina parada nas requisições. Sem essa marcação, a disponibilidade aparece maior do que a real." },
        ],
      },
      {
        titulo: "Relatórios em PDF e Excel",
        blocos: [
          { tipo: "passos", itens: [
            "Vá em Relatórios e escolha o período e os filtros (status, tipo, prioridade, setor).",
            "Toque em Gerar relatório para ver o resumo na tela.",
            "Exportar PDF abre a impressão: escolha Salvar como PDF. Exportar Excel baixa a planilha formatada, com uma aba de resumo.",
          ] },
        ],
      },
    ],
  },
  {
    id: "administracao",
    titulo: MANUTENCAO_ATIVA ? "Usuários, setores e auditoria" : "Usuários e auditoria",
    resumo: "Cadastros de acesso e histórico de alterações",
    para: "usuarios",
    topicos: [
      {
        titulo: "Cadastrar um usuário",
        blocos: [
          { tipo: "passos", itens: [
            "Vá em Usuários e abra Novo usuário.",
            MANUTENCAO_ATIVA
              ? "Informe nome, login (nome.sobrenome, sem acentos), o perfil na Manutenção e o perfil no sistema."
              : "Informe nome, login (nome.sobrenome, sem acentos), o Acesso geral (Usuário ou Gerente) e, para Usuário, o Perfil no sistema (Supervisor, Apontador ou Consulta).",
            "Defina uma senha inicial (mín. 8 caracteres) e deixe marcado Exigir troca da senha no primeiro acesso.",
            "Toque em Criar usuário e passe o login e a senha para a pessoa.",
          ] },
          { tipo: "texto", texto: "Para redefinir a senha de alguém, abra o usuário, digite uma nova senha e salve. Para bloquear o acesso de quem saiu da empresa, desmarque Ativo (o histórico é mantido)." },
        ],
      },
      {
        titulo: "Perfis de acesso",
        blocos: [
          ...(MANUTENCAO_ATIVA
            ? ([
                { tipo: "texto", texto: "Cada usuário tem um perfil por módulo. Quem só trabalha na serraria fica com Sem acesso na Manutenção; quem não usa a serraria fica com Sem acesso nela. Todo usuário precisa de pelo menos um módulo. O Gerente tem acesso total aos dois." },
                { tipo: "termos", itens: [
                  ["Gerente", "Acesso a tudo: requisições, cadastros, preventivas, indicadores, relatórios, usuários, setores e auditoria."],
                  ["Supervisor", "Coordena a manutenção: atribui, agenda, cancela, cadastra equipamentos, preventivas e checklists, vê indicadores e relatórios."],
                  ["Manutentor", "Executa: atualiza status, assume requisições, lança horas, marca checklist, anexa fotos do serviço e cadastra equipamentos."],
                  ["Operador", "Abre requisições, comenta, envia fotos e acompanha."],
                ] },
                { tipo: "texto", texto: "Na serraria (perfil no sistema):" },
              ] satisfies Bloco[])
            : ([
                { tipo: "texto", texto: "No Acesso geral, o Usuário trabalha conforme o Perfil no sistema (todo usuário precisa de um); o Gerente tem acesso total à Serraria, a Usuários e à Auditoria." },
                { tipo: "texto", texto: "Perfil no sistema:" },
              ] satisfies Bloco[])),
          { tipo: "termos", itens: [
            ["Supervisor", "Lança e corrige qualquer boletim, ciclo, carga ou levantamento, exclui lançamentos e cuida dos cadastros (pedidos, florestas, fornecedores, motoristas, estufas, motivos e configuração)."],
            ["Apontador", "O encarregado: aponta os lotes da serraria, ciclos de estufa, cargas de toras e o inventário, e corrige o que ele mesmo lançou."],
            ["Consulta", "Vê painéis, boletins e relatórios, sem lançar nada."],
          ] },
        ],
      },
      // A tela Setores só está no menu da manutenção
      ...(MANUTENCAO_ATIVA
        ? [{
            titulo: "Setores",
            blocos: [{ tipo: "texto", texto: "Em Setores você cria e renomeia os setores da empresa. Os equipamentos pertencem a um setor, e as requisições herdam o setor do equipamento." }],
          } satisfies Topico]
        : []),
      {
        titulo: "Auditoria",
        blocos: [{ tipo: "texto", texto: "Em Auditoria fica registrado quem fez o quê e quando: entradas no sistema (inclusive tentativas com senha errada), cadastros, mudanças de status, fotos, horas, checklists e planos. Nas alterações aparece o valor anterior e o novo. Filtre por usuário, área, período ou texto." }],
      },
    ],
  },
  {
    id: "producao-boletim",
    titulo: "Serraria: apontamento na ficha",
    resumo: "Apontar os lotes por pedido, imprimir a etiqueta e lançar paradas e toras",
    modulo: "producao",
    paraProducao: "lancar",
    topicos: [
      {
        titulo: "Apontar um lote",
        blocos: [
          { tipo: "texto", texto: "Cada lote é a madeira serrada de um pedido em uma espessura. O boletim do dia é criado sozinho no primeiro lote e junta todos os lotes do dia." },
          { tipo: "passos", itens: [
            "Toque em Apontar serraria (no Início ou em Serraria).",
            "Confira a data e escolha o Pedido. A meta e as horas do dia aparecem só para leitura (vêm da Configuração).",
            "Preencha a ficha, igual à de papel: em cada linha escolha a espessura (23, 25, 32 ou 38 mm) e marque as larguras (125, 100, 85, 50 — várias juntas — ou Mista).",
            "Digite as peças em cada comprimento (2,50 · 2,10 · 1,65 · 1,30 · 1,00 · 0,70). Enter passa para o próximo; Adicionar linha (ou o botão de repetir) abre outra medida.",
            "A classe sai sozinha pelo comprimento: 2,50 e 2,10 m Ótimo; 1,65 m Bom; 1,30, 1,00 e 0,70 m Regular. O m³ é calculado sozinho (com várias larguras ou Mista, pela média das larguras).",
            "Toque em Lançar e gerar etiqueta. Imprima a etiqueta do lote (QR Code + código de barras LOT-000123) e prenda na madeira.",
          ] },
          { tipo: "dica", texto: "Sem internet? Pode apontar normalmente: o lote fica guardado no aparelho e é enviado sozinho quando a conexão voltar. A etiqueta é gerada após o envio." },
        ],
      },
      {
        titulo: "Máquina parou (na hora)",
        blocos: [
          { tipo: "passos", itens: [
            "No celular ou tablet, toque em Paradas de máquina (ou em Máquina parou no Início).",
            "Toque no botão vermelho Máquina parou, escolha a máquina, o motivo (se souber) e o tipo da falha: mecânica, elétrica ou operacional.",
            "Toque em Marcar parada agora. O cronômetro começa a correr e a parada aparece no Início e no painel da TV.",
            "Mecânica ou elétrica: o sistema abre na hora uma requisição de manutenção (prioridade alta, máquina parada) e avisa a manutenção.",
            "Quando a máquina voltar, toque em Máquina liberada (se quiser, anote o que foi feito). A manutenção também pode liberar pela requisição.",
          ] },
          { tipo: "texto", texto: "Ao liberar, o tempo parado entra sozinho no boletim do dia e conta na disponibilidade e no OEE. Só conta o tempo dentro do turno (Cadastros → Configuração); uma parada que passa da noite entra em cada dia com a parte do turno. Uma requisição aberta pela manutenção com máquina parada numa máquina da linha também vira parada da serraria." },
          { tipo: "dica", texto: "As máquinas que aparecem no botão são as marcadas em Cadastros → Máquinas da linha. Paradas curtas que ninguém marcou na hora podem ser lançadas no fim do turno, como abaixo." },
        ],
      },
      {
        titulo: "Paradas e toras do dia",
        blocos: [
          { tipo: "passos", itens: [
            "Abra o boletim do dia em Serraria e toque em Paradas e toras.",
            "As paradas marcadas na hora já aparecem (só leitura). Em Paradas da linha, lance as outras: motivo, centro, equipamento, quantas vezes parou e os minutos.",
            "Em Toras serradas no dia, marque as cargas que foram serradas e, se souber, a quantidade e o volume de toras (para o rendimento).",
          ] },
          { tipo: "atencao", texto: "Existe um boletim por data. Meta e horas não são editadas no boletim: mudam só em Cadastros → Configuração (valem para os próximos dias)." },
        ],
      },
    ],
  },
  {
    id: "producao-rastreio",
    titulo: "Pacotes, etiquetas e expedição",
    resumo: "Formar pacotes a partir da estufa, ler etiquetas e registrar a saída",
    modulo: "producao",
    topicos: [
      {
        titulo: "Como a história do pacote é montada",
        blocos: [
          { tipo: "passos", itens: [
            "Recebimento de toras: a carga já informa a floresta, o fornecedor e o motorista.",
            "Serraria: no boletim, marque as cargas serradas no dia; cada lote fica ligado ao pedido.",
            "Estufa: em Madeira de quais dias?, marque os dias de serraria cuja madeira entrou na estufa.",
            "Pacote: ao formar, escolha a estufa (pacote seco) ou o dia de serraria (pacote verde).",
          ] },
          { tipo: "dica", texto: "A madeira de vários dias e cargas se mistura no processo. Por isso a origem do pacote mostra o conjunto de cargas e florestas que formaram ele." },
        ],
      },
      {
        titulo: "Formar pacotes",
        blocos: [
          { tipo: "passos", itens: [
            "Em Pacotes, toque em Formar pacote.",
            "Escolha a estufa: aparece a madeira que está nela. Toque no material — bitola, peças e classe vêm preenchidas.",
            "Confira o pedido (sugerido pelos lotes da serraria) e, para vários pacotes iguais, a quantidade.",
            "Toque em Formar e imprima as etiquetas.",
          ] },
        ],
      },
      {
        titulo: "Ler a etiqueta e registrar a saída",
        blocos: [
          { tipo: "lista", itens: [
            "Toque no botão do meio da barra de baixo (Ler etiqueta) e aponte para o QR Code ou para o código de barras — de pacote ou de lote. Também dá para digitar o código.",
            "No pacote: envie para a estufa, registre a saída ou anote uma observação.",
            "A expedição é só a baixa física: cliente e destino já vêm do pedido.",
            "Gestão → Pedidos mostra cada pedido com a barra do andamento (verde, na estufa, seco, expedido), o saldo a expedir e o prazo (em vermelho se atrasado). Com volume combinado, o aviso de pedido pronto sai quando os pacotes secos cobrem o saldo. No apontamento da serraria, cada pedido mostra quanto falta serrar.",
            "Gestão → Disponível para venda: pacotes em estoque por bitola e classe, só os sem pedido (ou incluindo os reservados), separando seca (pronta), na estufa e verde. O botão PDF gera a lista para o comercial.",
            "No romaneio, os botões Declaração de origem (PT) e Origin statement (EN) geram a declaração de origem da carga para o cliente: origem florestal, recebimento das toras, serragem, secagem em estufa e a lista de pacotes com o QR de cada um.",
            "É uma declaração da própria empresa, feita com os registros do sistema. Ela não substitui a nota fiscal nem os documentos oficiais ambientais ou fitossanitários de exportação.",
            "Para carregar um caminhão: em Pacotes, marque os pacotes, toque em Registrar saída, escolha o motorista (as placas vêm do cadastro) e confirme. O sistema gera o romaneio da carga (ROM-000001).",
            "Na saída, informe também a nota fiscal (nº e, se quiser, a chave de acesso de 44 dígitos): ela sai no romaneio e a busca encontra o romaneio pelo nº da nota.",
            "No romaneio, toque em Baixar PDF do romaneio e entregue ao motorista: tem pedidos, cliente, destino, placas, a lista de pacotes com bitola, peças e m³ e os campos de assinatura. Os romaneios ficam em Operação → Romaneios.",
          ] },
        ],
      },
    ],
  },
  {
    id: "producao-indicadores",
    titulo: "Indicadores",
    resumo: "OEE, disponibilidade, classes da madeira, paradas e comparativo mensal",
    modulo: "producao",
    topicos: [
      {
        titulo: "Como os índices são calculados",
        blocos: [
          { tipo: "texto", texto: "No mês, os índices são calculados sobre os totais (não é a média dos dias)." },
          { tipo: "termos", itens: [
            ["Disponibilidade", "(tempo programado − tempo parado) ÷ tempo programado."],
            ["Produtividade", "serrado (m³) ÷ meta (m³)."],
            ["OEE", "Disponibilidade × Produtividade."],
            ["Rendimento", "serrado (m³) ÷ m³ de toras consumidas (quando informado no boletim)."],
            ["Classe", "pelo comprimento: 2,50/2,10 m Ótimo; 1,65 m Bom; 1,30/1,00/0,70 m Regular."],
          ] },
        ],
      },
      {
        titulo: "O que tem no painel",
        blocos: [
          { tipo: "lista", itens: [
            "Em Gestão → Indicadores, escolha o mês no alto (as setas passam de mês em mês; tocando no nome abre um calendário).",
            "Abas: Visão geral, Paradas, Pacotes e estoque e Comparativo mensal.",
            "Serrado por dia, por classe (Ótimo, Bom, Regular), com a meta de cada dia.",
            "Paradas por centro, Pareto dos motivos e paradas por equipamento.",
            "O botão Excel baixa o mês completo: comparativo, boletins, bitolas (com lote e pedido), paradas e Pareto.",
            "O botão Relatório PDF gera o relatório do mês para a diretoria: índices com a variação do mês anterior, serrado por classe com gráfico diário, paradas e Pareto, estufas, toras, pacotes e expedição e o comparativo dos últimos meses.",
          ] },
        ],
      },
    ],
  },
  {
    id: "producao-estufas",
    titulo: "Estufas",
    resumo: "Ciclos de secagem, plantão, checklist e aclimatação",
    modulo: "producao",
    topicos: [
      {
        titulo: "Iniciar um ciclo",
        blocos: [
          { tipo: "passos", itens: [
            "Em Estufas, toque em Iniciar ciclo na estufa livre.",
            "Informe o nº do ciclo, a entrada, a previsão de saída e escolha o Plantão na lista de usuários.",
            "Em Madeira carregada, preencha a ficha da estufa: espessura, larguras (ou Mista), as peças em cada comprimento e as grades úmidas. O m³ é calculado sozinho.",
            "Marque os dias de serraria cuja madeira entrou e toque em Iniciar ciclo.",
          ] },
        ],
      },
      {
        titulo: "Checklist e conclusão",
        blocos: [
          { tipo: "lista", itens: [
            "No ciclo, marque cada item do checklist como OK (✓) ou Não conforme (✗).",
            "Ao tirar a madeira, preencha a saída e a umidade final em Concluir ciclo.",
            "O sistema mostra quando a madeira fica liberada: 24 h no pátio e mais 24 h na fábrica.",
            "Cada estufa tem a sua ficha Madeira carregada no mês (link no cartão da estufa): todos os ciclos do mês, linha por linha, como no papel — dá para imprimir.",
          ] },
        ],
      },
    ],
  },
  {
    id: "producao-toras-estoque",
    titulo: "Toras e inventário",
    resumo: "Recebimento de cargas e inventário diário da madeira",
    modulo: "producao",
    topicos: [
      {
        titulo: "Registrar uma carga de toras",
        blocos: [
          { tipo: "passos", itens: [
            "Em Recebimento de toras, toque em Nova carga.",
            "Escolha a floresta, o fornecedor e o motorista — as placas do caminhão e da julieta vêm sozinhas do cadastro.",
            "Informe o comprimento médio, o diâmetro (Fina, Média ou Grossa) e o peso em toneladas.",
            "Toque em Registrar carga. Funciona também sem internet.",
          ] },
        ],
      },
      {
        titulo: "Inventário do dia",
        blocos: [
          { tipo: "passos", itens: [
            "Em Inventário de madeira, toque em Inventário do dia.",
            "Em cada linha da ficha, escolha em Madeira em onde ela está: Grade, Pacote, a estufa (Estufa 01, 02…) ou Verde.",
            "Preencha a ficha, igual à da serraria: espessura, larguras e as peças em cada comprimento.",
            "Use Adicionar linha para cada local e medida e toque em Registrar. A tela de inventário soma o último dia por local e espessura.",
          ] },
        ],
      },
    ],
  },
  {
    id: "producao-cadastros",
    titulo: "Cadastros",
    resumo: "Pedidos, florestas, fornecedores, motoristas, paradas, máquinas da linha, estufas e configuração",
    modulo: "producao",
    paraProducao: "gerir",
    topicos: [
      {
        titulo: "O que fica em Cadastros",
        blocos: [
          { tipo: "lista", itens: [
            "Pedidos: nº, cliente, destino, volume combinado (m³) e prazo. A serraria aponta cada lote em um pedido aberto; conclua o pedido para tirá-lo da lista.",
            "Florestas, fornecedores e motoristas (com placa do caminhão e da julieta) usados no recebimento de toras.",
            "Motivos de parada e estufas. Desative em vez de excluir, para manter o histórico.",
            "Máquinas da linha: toque no botão de cada máquina para colocá-la na linha (Na linha ✓) ou tirá-la (Fora da linha); só as da linha aparecem no botão Máquina parou.",
            "Configuração: meta diária (m³), horas por dia, rendimento esperado e início/fim do turno. Meta e horas viram os valores (somente leitura) de cada boletim novo; das paradas marcadas na hora, só o tempo dentro do turno entra no boletim.",
          ] },
        ],
      },
    ],
  },
  {
    id: "duvidas",
    titulo: "Dúvidas frequentes",
    resumo: "Problemas comuns e como resolver",
    topicos: [
      {
        titulo: "Perguntas e respostas",
        blocos: [
          { tipo: "termos", itens: [
            ["Não recebo notificações no celular", "Ative em Meu perfil neste aparelho e permita no navegador. No iPhone, instale o app na tela de início e abra por ele. Confira também se o modo Não perturbe está desligado."],
            ["A tela mostra 'Sem conexão'", "Você está sem internet. As telas de apontamento (serraria, toras e inventário) abrem mesmo assim, se já foram usadas neste aparelho; os lançamentos são enviados quando a conexão voltar."],
            ["O app está com aparência antiga", "Feche e abra o app de novo (ou atualize a página) para carregar a versão mais recente."],
          ] },
          { tipo: "texto", texto: "Não encontrou a resposta? Fale com o gerente ou o administrador do sistema." },
        ],
      },
      {
        titulo: "Requisições",
        modulo: "manutencao",
        blocos: [
          { tipo: "termos", itens: [
            ["Abri a requisição errada", "Comente explicando. Se ainda estiver Aberta, cancele com o motivo; senão, peça ao supervisor."],
            ["A foto não foi enviada", "Fotos muito grandes ou em formatos incomuns podem falhar. Tente tirar a foto pelo botão Tirar foto do próprio sistema."],
            ["Não consigo concluir a requisição", "Verifique se o Serviço realizado está preenchido e se todos os itens do checklist estão marcados."],
          ] },
        ],
      },
    ],
  },
];

/** Texto pesquisável de uma seção (busca do manual). */
export function textoDaSecao(s: Secao) {
  const partes = [s.titulo, s.resumo];
  for (const t of s.topicos) {
    partes.push(t.titulo);
    for (const b of t.blocos) {
      if ("texto" in b) partes.push(b.texto);
      if (b.tipo === "passos" || b.tipo === "lista") partes.push(...b.itens);
      if (b.tipo === "termos") partes.push(...b.itens.flat());
    }
  }
  return partes.join(" ");
}
