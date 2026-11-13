import { MODULOS_ATIVOS } from "@/lib/permissoes";
import type { Bloco, Captura, Secao } from "./tipos";

// Parte geral do manual (vale para os dois módulos): entrar, navegar, avisos, uso sem internet, a própria
// conta e, para o gerente, usuários e auditoria. Os nomes de botões, cartões e campos são os da tela
// (src/app/login, recuperar, trocar-senha, sistema, (app)/perfil, menu, administracao, notificacoes, usuarios, auditoria,
// src/components/Navegacao.tsx, painel/*, inicio/PecasInicio.tsx, Tema.tsx, AtivarPush.tsx, SincronizadorOffline.tsx,
// BotaoSair.tsx): mudou a tela, mude aqui. No computador: menu lateral enxuto (telas do módulo) e o topo (Voltar, busca,
// Módulos, tema, ajuda, avisos e o seu nome); no celular, o topo, a barra de baixo e Mais.
// Tópicos que só valem para um módulo levam `modulo`; os textos que mudam com a liberação da Manutenção usam ATIVA.

/** A Manutenção já foi liberada a todos (sai de "Em breve"; os perfis dela passam a valer). */
const ATIVA = MODULOS_ATIVOS.includes("manutencao");

const texto = (t: string): Bloco => ({ tipo: "texto", texto: t });
const passos = (...itens: string[]): Bloco => ({ tipo: "passos", itens });
const lista = (...itens: string[]): Bloco => ({ tipo: "lista", itens });
const dica = (t: string): Bloco => ({ tipo: "dica", texto: t });
const atencao = (t: string): Bloco => ({ tipo: "atencao", texto: t });
const termos = (...itens: [string, string][]): Bloco => ({ tipo: "termos", itens });
const imagem = (c: Captura): Bloco => ({ tipo: "imagem", imagem: c });

/** Blocos que só entram quando `cond` vale. */
const se = (cond: boolean, ...blocos: Bloco[]): Bloco[] => (cond ? blocos : []);

const ABRIR_PERFIL = "No celular, toque nas suas iniciais, no canto de cima à direita. No computador, clique no seu nome, no canto direito do topo, e escolha Meu perfil.";

/** Conta, navegação, avisos, uso sem internet e administração (valem para os dois módulos). */
export const GERAL: Secao[] = [
  // ───────────────────────────── Primeiros passos ─────────────────────────────
  {
    id: "primeiros-passos",
    grupo: "geral",
    titulo: "Primeiros passos",
    resumo: "Entrar, criar a sua senha, cadastrar a pergunta de segurança, recuperar a senha, escolher o módulo e instalar o app",
    rotas: ["/sistema", "/trocar-senha"],
    topicos: [
      {
        id: "entrar",
        titulo: "Como entrar",
        palavras: ["login", "logar", "entrar", "acessar", "acesso", "senha", "usuário", "usuario", "site", "acessar sistema", "senha errada", "bloqueado", "desativado"],
        blocos: [
          passos(
            "Abra o app instalado no celular (ícone Artepinus) ou, no site da empresa, toque em Acessar sistema.",
            "Em Login, digite o seu login no formato nome.sobrenome, sem acento (ex.: joao.silva).",
            "Em Senha, digite a sua senha. O olho ao lado mostra o que você digitou.",
            "Toque em Entrar. Abre a tela de início, onde você escolhe o módulo.",
          ),
          termos(
            ["Login ou senha incorretos", "Confira o login (com o ponto entre o nome e o sobrenome) e a senha. Esqueceu a senha? Veja “Esqueci a senha” (/ajuda/primeiros-passos#esqueci-a-senha)."],
            ["Muitas tentativas sem sucesso. Aguarde…", "Depois de 5 senhas erradas em 15 minutos, o login fica bloqueado por alguns minutos. Espere o tempo indicado e tente de novo."],
            ["Usuário desativado. Procure o administrador.", "O seu acesso foi desligado. Fale com o gerente."],
          ),
          dica("Você continua conectado neste aparelho por até 30 dias. Em celular ou computador usado por várias pessoas, toque em Sair no fim do turno (veja “Aparelho usado por várias pessoas” (/ajuda/primeiros-passos#aparelho-compartilhado))."),
          dica("O sistema voltou sozinho para a tela de entrada? Veja “O sistema voltou sozinho para a tela Entrar” (/ajuda/problemas#sessao-caiu)."),
        ],
      },
      {
        id: "primeiro-acesso",
        titulo: "Primeiro acesso: crie a sua senha",
        rotas: ["/trocar-senha"],
        palavras: ["primeiro acesso", "senha provisória", "senha provisoria", "senha inicial", "nova senha", "definir senha", "trocar senha obrigatório"],
        blocos: [
          texto("No primeiro acesso, ou depois que o gerente redefinir a sua senha, aparece Antes de continuar, defina uma nova senha pessoal."),
          passos(
            "Em Senha atual (a que você recebeu), digite a senha que o gerente passou.",
            "Em Nova senha (mínimo 8 caracteres), crie a sua senha.",
            "Repita a mesma senha em Confirme a nova senha.",
            "Toque em Salvar e continuar.",
          ),
          lista(
            "A nova senha precisa ser diferente da que você recebeu.",
            "Use uma senha que só você saiba. Não anote em papel colado no posto de trabalho.",
            "Depois, cadastre a sua pergunta de segurança: veja o próximo tópico.",
          ),
        ],
      },
      {
        id: "pergunta-de-seguranca",
        titulo: "Cadastre a pergunta de segurança",
        palavras: ["pergunta de segurança", "pergunta de seguranca", "resposta", "recuperar senha", "esqueci", "faixa amarela", "trocar pergunta"],
        blocos: [
          texto("Com a pergunta de segurança, você mesmo cria uma senha nova se esquecer a sua, sem esperar o gerente. Enquanto você não cadastrar, a tela de início mostra um botão na faixa verde Cadastre a sua pergunta de segurança."),
          passos(
            `Abra Meu perfil tocando no botão Cadastre a sua pergunta de segurança, na faixa verde da tela de início. Ou: ${ABRIR_PERFIL.charAt(0).toLowerCase()}${ABRIR_PERFIL.slice(1)}`,
            "No quadro Pergunta de segurança, escolha a Pergunta.",
            "Escreva a Resposta. Maiúsculas e acentos não fazem diferença.",
            "Em Sua senha atual (para confirmar), digite a senha com que você entrou.",
            "Toque em Salvar pergunta. Se já tinha uma, o botão é Trocar pergunta.",
          ),
          dica("Escolha uma resposta que você não esquece e que os colegas não sabem. Guarde só para você."),
        ],
      },
      {
        id: "esqueci-a-senha",
        titulo: "Esqueci a senha",
        palavras: ["esqueci", "esqueci a senha", "recuperar", "recuperação", "redefinir", "perdi a senha", "não lembro", "nao lembro", "senha bloqueada"],
        blocos: [
          passos(
            "Na tela de entrada, toque em Esqueci a minha senha.",
            "Em Seu login, digite o seu login e toque em Continuar.",
            "Aparece a sua pergunta de segurança. Escreva a resposta em Sua resposta.",
            "Crie a Nova senha (mínimo 8 caracteres), repita em Confirme a nova senha e toque em Definir nova senha.",
            "Toque em Ir para o login e entre com a nova senha.",
          ),
          termos(
            ["Não é possível recuperar a senha deste login pela pergunta de segurança", "O login está errado, está desativado ou não tem pergunta cadastrada. Fale com o gerente: ele define uma senha provisória e você troca ao entrar."],
            ["Resposta incorreta", "Tente de novo com calma. Depois de 5 erros, espere alguns minutos."],
            ["Muitas respostas erradas para este login nas últimas 24 horas", "Com 10 respostas erradas em 24 horas, a recuperação fica bloqueada até o dia seguinte. Você e o administrador do sistema recebem um aviso."],
          ),
          atencao("Quando a senha é trocada pela pergunta de segurança, quem estava conectado com a senha antiga em outro aparelho sai, e você e o administrador recebem o aviso Senha redefinida pela pergunta de segurança. Se não foi você, fale com o gerente na hora."),
        ],
      },
      {
        id: "tela-de-inicio",
        titulo: "Tela de início: escolher o módulo",
        rotas: ["/sistema"],
        palavras: [
          "início",
          "inicio",
          "módulo",
          "modulo",
          "escolher módulo",
          "módulos",
          "serraria",
          "manutenção",
          "em breve",
          "em teste",
          "sistema",
          "administração",
          "painel",
          "acesso rápido",
          "números",
          "olá",
        ],
        blocos: [
          texto("Depois de entrar, abre a tela de início do sistema. O app instalado também abre sempre por ela. De cima para baixo:"),
          termos(
            ["Faixa verde", "Bom dia, Boa tarde ou Boa noite com o seu nome, a data de hoje, para que serve o sistema e três destaques: rastreio de cada pacote, lançamentos sem internet e a ajuda de cada tela no botão ?."],
            ["Resumo do momento", "Logo abaixo da faixa: máquinas paradas, estufas secando e pacotes em estoque (Serraria) e requisições abertas e de prioridade alta ou urgente (Manutenção), só dos módulos que você usa. Vermelho pede atenção. Toque num número para abrir a lista."],
            [
              "Serraria e Manutenção",
              ATIVA
                ? "Um cartão para cada módulo, dizendo o que ele faz. Toque em Abrir a Serraria ou Abrir a Manutenção. Quem não usa um módulo vê o cartão dele tracejado, com Sem acesso: fale com o gerente."
                : "Um cartão para cada módulo, dizendo o que ele faz. Toque em Abrir a Serraria. A Manutenção ainda está em teste: aparece tracejada, com Em breve (só o administrador abre, com o selo Em teste).",
            ],
            ["Ajuda, Notificações e Administração", "Os cartões gerais: o manual do sistema, os seus avisos (com o número dos novos) e, para quem cuida dos usuários, da auditoria ou dos cadastros da Serraria, o Painel Administrativo (/ajuda/navegacao#painel-administrativo)."],
            ["Cadastre a sua pergunta de segurança", "Botão dentro da faixa verde, até você cadastrar a pergunta. Toque para abrir Meu perfil."],
            ["Avisos recentes", "Só em telas largas (monitor grande): uma coluna à direita com os seus últimos avisos (o ponto vermelho marca os não lidos). Toque em um aviso para abrir a tela dele, ou em Ver todos."],
          ),
          texto("Seu usuário ainda não tem acesso a nenhum módulo? A tela avisa: fale com o gerente para ele escolher o seu perfil."),
          texto(
            "Esta tela não tem o ← Voltar: dela você vai para um módulo, para a ajuda, para os avisos ou para o Painel Administrativo. Para voltar a ela depois: no computador, toque em Módulos (o ícone de quadradinhos no topo, à direita), que aparece para quem usa mais de um módulo ou tem o Painel Administrativo; no celular, em Mais › Módulos (para quem usa os dois módulos). Os outros usam o logo do topo, que leva ao Início do módulo. Veja “Trocar de módulo” (/ajuda/navegacao#trocar-de-modulo).",
          ),
          imagem({ arquivo: "geral/sistema.webp", legenda: "Tela de início: o resumo do momento, os dois módulos e os cartões de Ajuda, Notificações e Administração.", rota: "/sistema", perfil: "supervisor" }),
        ],
      },
      {
        id: "instalar",
        titulo: "Instalar o app no celular",
        palavras: ["instalar", "aplicativo", "app", "ícone", "icone", "tela inicial", "atalho", "android", "iphone", "pwa", "adicionar à tela de início"],
        blocos: [
          texto("O sistema funciona como um aplicativo: fica com um ícone na tela do celular, abre em tela cheia, recebe avisos e abre algumas telas até sem internet."),
          termos(
            ["Android (Chrome)", "Abra o sistema no Chrome, toque no menu ⋮ e escolha Instalar app (ou Adicionar à tela inicial)."],
            ["iPhone (Safari)", "Abra o sistema no Safari, toque em Compartilhar (o quadrado com a seta) e depois em Adicionar à Tela de Início."],
            ["Computador (Chrome ou Edge)", "Se quiser, use o botão de instalar que aparece na barra de endereço."],
          ),
          atencao("No iPhone, os avisos só funcionam com o app instalado e aberto pelo ícone da tela de início."),
          dica("Depois de instalar, entre uma vez com internet: assim o app guarda as telas de lançamento para usar sem sinal. Veja “Trabalhar sem internet” (/ajuda/sem-internet)."),
        ],
      },
      {
        id: "aparelho-compartilhado",
        titulo: "Aparelho usado por várias pessoas",
        palavras: ["compartilhado", "coletivo", "celular da empresa", "tablet", "outro usuário", "outra pessoa", "trocar de usuário", "sair"],
        blocos: [
          lista(
            "Cada pessoa entra com o próprio login. Tudo o que é lançado fica com o nome de quem estava conectado.",
            "No fim do turno, toque em Sair. Se não sair, quem pegar o aparelho continua lançando com o seu nome.",
            "Antes de sair, espere os lançamentos feitos sem internet serem enviados: o sistema avisa se ainda houver algum seu na fila.",
          ),
          dica("Os detalhes estão em “Sair do sistema” (/ajuda/meu-perfil#sair) e em “Aparelho usado por várias pessoas” (/ajuda/sem-internet#aparelho-compartilhado), na parte de trabalhar sem internet."),
        ],
      },
    ],
  },

  // ───────────────────────────── Navegação ─────────────────────────────
  {
    id: "navegacao",
    grupo: "geral",
    titulo: "Navegação: topo, telas, busca e ajuda",
    resumo: "O topo, a tela inicial de cada módulo, o Painel Administrativo, a busca, o botão de ajuda, o tema e a troca de módulo, no computador e no celular",
    rotas: ["/menu"],
    topicos: [
      {
        id: "computador",
        titulo: "No computador: menu à esquerda e topo",
        palavras: [
          "computador",
          "topo",
          "barra de cima",
          "menu",
          "menu lateral",
          "esquerda",
          "voltar",
          "logo",
          "módulos",
          "modulos",
          "quadradinhos",
          "menu do usuário",
          "seu nome",
          "sair",
          "onde está o menu",
        ],
        blocos: [
          texto("No computador, o menu à esquerda tem só as telas do módulo em uso: Início e os grupos Operação, Gestão e Cadastros (cada um vê só o que pode usar). No rodapé dele, o cartão do módulo leva à tela de início, para trocar de módulo. O botão Recolher menu, logo acima do cartão, deixa só os ícones (o nome aparece ao passar o mouse); toque de novo para abrir. O sistema lembra a escolha neste aparelho. O resto fica no topo, sempre igual em todas as telas:"),
          termos(
            ["Logo ARTEPINUS", "No alto do menu à esquerda. Volta ao Início do módulo em que você está."],
            [
              "← Voltar",
              "No canto esquerdo do topo. Volta para a tela de cima: do detalhe para a lista (ex.: do ciclo para Estufas) e da lista para o Início do módulo. Usuários e Auditoria voltam ao Painel Administrativo, e o Painel volta à tela de início. Se você veio dessa tela, ela volta como estava, com os mesmos filtros. Não aparece no Início dos módulos nem na tela de início do sistema.",
            ],
            ["Busca", "No meio do topo: Buscar pacote, lote, carga… na Serraria e Buscar requisição… na Manutenção. A tecla / leva direto a ela, em qualquer tela."],
            [
              "Módulos",
              "O ícone de quadradinhos, à direita: abre a tela de início do sistema, para trocar de módulo ou abrir o Painel Administrativo. Aparece só para quem usa mais de um módulo ou tem o Painel Administrativo (quem cuida dos usuários, da auditoria ou dos cadastros da Serraria).",
            ],
            ["Tema, ajuda e avisos", "O botão do tema (sol, lua ou monitor), o botão de ajuda (?), que abre a ajuda da tela em que você está, e o sininho dos avisos, com o número dos não lidos."],
            ["Seu nome", "As suas iniciais e o seu primeiro nome, no canto direito. Toque para abrir um menu com o seu nome completo, o seu perfil, Meu perfil e Sair."],
          ),
          imagem({
            arquivo: "geral/menu-do-usuario.webp",
            legenda: "No computador: o topo (logo, busca, Módulos, tema, ajuda, avisos e o seu nome) com o menu do seu nome aberto: Meu perfil e Sair.",
            rota: "/producao",
            perfil: "supervisor",
            tela: "computador",
            acoes: [{ clicar: "role=button[name='Menu do usuário']" }],
          }),
        ],
      },
      {
        id: "tela-inicial",
        titulo: "A tela inicial de cada módulo",
        palavras: [
          "início",
          "inicio",
          "tela inicial",
          "painel",
          "faixa verde",
          "resumo",
          "atenção",
          "acesso rápido",
          "acesso rapido",
          "tarefa principal",
          "todas as telas",
          "cartões",
          "cartoes",
          "atalhos",
          "onde fica",
        ],
        blocos: [
          texto("O Início da Serraria e o da Manutenção seguem a mesma ordem: primeiro o que fazer agora, depois o caminho para todas as telas. Cada pessoa vê só o que o perfil dela permite."),
          termos(
            ["Faixa verde", "No alto: a saudação (Bom dia, Boa tarde ou Boa noite, com o seu nome), o módulo e o seu perfil (ex.: Serraria · Apontador) e a data de hoje."],
            ["Resumo", "O cartão branco sobre a faixa, com poucos números do momento. Vermelho é máquina parada ou estufa atrasada. Toque num número para abrir a lista dele."],
            ["O que precisa de atenção", "O que está faltando ou atrasado, com o botão para resolver. Sem nada pendente, aparece Tudo em dia."],
            ["Acesso rápido", "A tarefa principal da sua função num cartão grande (ex.: Apontar serraria ou Nova requisição) e as outras tarefas do dia nos cartões menores ao lado. Um número no cartão mostra quantos esperam por você (em amarelo, quando pede atenção)."],
          ),
          dica("Não acha uma tela? Veja o menu à esquerda ou use a busca do topo. No celular, as telas estão em Mais. Cada Início está explicado em “Início da Serraria” (/ajuda/serraria-inicio) e “Início da Manutenção” (/ajuda/manutencao-inicio)."),
        ],
      },
      {
        id: "painel-administrativo",
        titulo: "Painel Administrativo",
        rotas: ["/administracao"],
        palavras: [
          "administração",
          "administracao",
          "painel administrativo",
          "admin",
          "usuários",
          "entradas e acessos",
          "cadastros",
          "máquinas da linha",
          "configuração",
          "setores",
          "auditoria",
          "segurança",
          "dados",
          "privacidade",
        ],
        blocos: [
          texto(
            "Quem cuida dos usuários, da auditoria ou dos cadastros da Serraria (gerente e supervisor da Serraria) tem o Painel Administrativo, com as telas de administração do sistema todo em um só lugar. Para abrir: na tela de início (a primeira depois de entrar; no computador, volte a ela pelo botão Módulos do topo), toque no cartão Administração. No celular, também em Mais › Administração.",
          ),
          texto("No computador, o ← Voltar do topo leva de Usuários e de Auditoria de volta ao Painel Administrativo, e do Painel de volta à tela de início."),
          termos(
            ["Pessoas", "Usuários (quem usa o sistema e o que cada um pode fazer) e Entradas e acessos (a Auditoria só com as entradas, saídas, senhas e mudanças nos usuários)."],
            ["Serraria", "Cadastros (pedidos, florestas, fornecedores, motoristas e estufas), Máquinas da linha e Configuração (meta do dia, horas de trabalho e horário do turno)."],
            ["Manutenção", "Setores, Equipamentos e Preventivas, para quem usa a Manutenção com um perfil que cuida deles."],
            [
              "Segurança & dados",
              `Auditoria (quem fez o quê no sistema, e quando) e a Política de privacidade${
                ATIVA
                  ? ""
                  : " e, enquanto a Manutenção está em teste, a Triagem do período de teste (só o administrador), que abre direto o quadro da triagem em Cadastros → Configuração (veja “Triagem do período de teste” (/ajuda/serraria-cadastros#triagem-do-teste))"
              }.`,
            ],
          ),
          texto("Cada pessoa vê só os cartões das telas que pode abrir: o supervisor da Serraria vê os grupos Serraria e Segurança & dados; o gerente vê também Pessoas."),
          dica("Os detalhes estão em “Usuários e perfis de acesso” (/ajuda/usuarios), “Auditoria” (/ajuda/auditoria) e “Cadastros da Serraria” (/ajuda/serraria-cadastros)."),
          imagem({ arquivo: "geral/administracao.webp", legenda: "Painel Administrativo, visto pelo gerente: Pessoas, Serraria e Segurança & dados.", rota: "/administracao", perfil: "gerente", tela: "computador" }),
        ],
      },
      {
        id: "celular",
        titulo: "No celular: topo, barra de baixo e Mais",
        rotas: ["/menu"],
        palavras: ["celular", "barra de baixo", "barra inferior", "mais", "menu", "topo", "iniciais", "lupa", "botão do meio", "sua conta", "sair", "tema"],
        blocos: [
          termos(
            ["Topo", "O logo ARTEPINUS volta ao Início. À direita ficam a lupa (busca), o botão do tema, o botão de ajuda (?), que abre a ajuda da tela em que você está, o sininho e as suas iniciais, que abrem Meu perfil."],
            ["Barra de baixo", "Os atalhos principais do módulo em uso, com o botão redondo do meio em destaque. A tela em que você está fica verde."],
            [
              "Mais",
              "No alto, o seu nome, o seu perfil e o seu login. Depois, Sua conta: Meu perfil, Notificações, Manual do usuário, Módulos (para quem usa os dois módulos) e Administração (para quem administra). Em seguida o Tema e o botão Sair. No fim, todas as telas do módulo em uso, nos mesmos cartões do Início (ex.: Serraria · Operação, Serraria · Gestão).",
            ],
          ),
          imagem({ arquivo: "geral/mais.webp", legenda: "Mais, no celular: a sua conta, o tema, Sair e todas as telas do módulo.", rota: "/menu", perfil: "apontador" }),
        ],
      },
      {
        id: "menu-serraria",
        titulo: "Barra de baixo e telas da Serraria",
        modulo: "producao",
        palavras: ["serraria", "barra de baixo", "pacotes", "ler etiqueta", "estufas", "operação", "gestão", "cadastros", "etapas", "menu", "todas as telas"],
        blocos: [
          texto("No celular, a barra de baixo tem Início, Pacotes, o botão do meio Ler etiqueta, Estufas e Mais. As telas da Serraria ficam no menu à esquerda (no celular, em Mais), em três grupos:"),
          termos(
            ["Operação", "1 Recebimento de toras, 2 Serraria, Paradas de máquina, 3 Estufas, 4 Pacotes e expedição, Romaneios e Ler etiqueta. Os números 1 a 4 são as etapas do processo."],
            ["Gestão", "Pedidos, Disponível para venda, Indicadores, Painel para TV e Inventário de madeira."],
            ["Cadastros", "Cadastros (só o supervisor). Usuários e Auditoria aparecem só para o gerente."],
          ),
          dica("Mais detalhes em “Todas as telas da Serraria” (/ajuda/serraria-inicio#menu)."),
        ],
      },
      {
        id: "menu-manutencao",
        titulo: "Barra de baixo e telas da Manutenção",
        modulo: "manutencao",
        palavras: ["manutenção", "barra de baixo", "requisições", "nova requisição", "agenda", "botão +", "operação", "gestão", "cadastros", "menu", "todas as telas"],
        blocos: [
          texto(
            "No celular, a barra de baixo tem Início, Requisições, o botão + do meio (Nova requisição), Agenda e Mais. No computador, Nova requisição fica no Acesso rápido do Início e no botão da tela Requisições. As telas da Manutenção ficam no menu à esquerda (no celular, em Mais):",
          ),
          termos(
            ["Operação", "Requisições e Agenda."],
            ["Gestão", "Indicadores, Relatórios e Auditoria, conforme o perfil."],
            ["Cadastros", "Equipamentos, Preventivas, Checklists, Usuários e Setores, conforme o perfil."],
          ),
          dica("Mais detalhes em “Como chegar à Manutenção” (/ajuda/manutencao-inicio#entrar)."),
        ],
      },
      {
        id: "trocar-de-modulo",
        titulo: "Trocar de módulo",
        palavras: ["trocar de módulo", "trocar modulo", "escolher módulo", "mudar de módulo", "módulos", "quadradinhos", "serraria", "manutenção", "outro módulo"],
        blocos: [
          texto("Quem usa a Serraria e a Manutenção troca de módulo pela tela de início do sistema:"),
          termos(
            ["No computador", "Toque em Módulos (o ícone de quadradinhos no topo, à direita). Abre a tela de início: toque no cartão do módulo."],
            ["No celular", "Toque em Mais › Módulos e, na tela de início, no cartão do módulo."],
          ),
          texto("O sistema lembra o último módulo usado: Notificações, Meu perfil e o manual abrem com a busca e a barra de baixo do módulo em que você estava. Quem usa os dois módulos tem a Serraria como módulo principal: ela é o cartão grande da tela de início."),
          ...se(!ATIVA, atencao("Enquanto a Manutenção está em teste, só o administrador troca de módulo. Para os demais, ela aparece como Em breve.")),
        ],
      },
      {
        id: "busca",
        titulo: "Busca na Serraria",
        modulo: "producao",
        palavras: ["buscar", "busca", "procurar", "pesquisar", "lupa", "atalho", "tecla /", "código", "PCT-", "LOT-", "CT-", "ROM-", "nota fiscal", "placa"],
        blocos: [
          texto("No computador, a busca fica no meio do topo (Buscar pacote, lote, carga…). Aperte a tecla / em qualquer tela para ir direto a ela. No celular, toque na lupa do topo."),
          lista(
            "Pelo código, abre direto: pacote (PCT-000123), lote (LOT-000123), carga de toras (CT-000123) e romaneio (ROM-000123). Também aceita o link lido do QR da etiqueta.",
            "Por texto (pelo menos 2 letras), procura pedido, cliente, destino, motorista, placa, floresta, fornecedor e nº ou chave da nota fiscal. Os resultados aparecem por grupo: toque num para abrir.",
          ),
          dica("Para ler a etiqueta com a câmera, veja “Ler etiqueta e buscar” (/ajuda/serraria-ler-etiqueta)."),
        ],
      },
      {
        id: "busca-manutencao",
        titulo: "Busca na Manutenção",
        modulo: "manutencao",
        palavras: ["buscar", "busca", "procurar", "pesquisar", "lupa", "requisição", "número", "equipamento"],
        blocos: [
          texto("Na Manutenção, a mesma busca (Buscar requisição…; no celular, a lupa) abre a lista de Requisições e procura pelo número (ex.: 12 ou #00012), pelo título, pela descrição ou pelo código ou nome do equipamento."),
          dica("Filtros e outras formas de achar uma requisição em “Encontrar uma requisição” (/ajuda/manutencao-acompanhar#encontrar)."),
        ],
      },
      {
        id: "ajuda",
        titulo: "Botão de ajuda e o manual",
        palavras: ["ajuda", "manual", "?", "interrogação", "dúvida", "duvida", "glossário", "problemas comuns", "roteiros", "imprimir", "como faço"],
        blocos: [
          lista(
            "O botão ? (Ajuda desta tela), no topo, abre a parte do manual que explica a tela em que você está, do jeito do seu perfil. Por exemplo, na página de uma requisição da Manutenção, ele abre Atender requisições (/ajuda/manutencao-atender) para a equipe da manutenção e A página da requisição (/ajuda/manutencao-acompanhar#pagina) para os outros. Para voltar, toque em Voltar para…, no alto da página do manual.",
            "O Manual do usuário inteiro abre pelo botão ? do topo, em qualquer tela de ajuda pelo link Manual (no celular, também em Mais) ou, numa página do manual, pelo link Manual · …, no alto. Na entrada dele há uma busca: escreva o que você quer fazer (ex.: etiqueta, sem internet, corrigir).",
            "Cada seção do manual tem o botão Imprimir esta seção.",
            "As páginas do manual que você já abriu ficam guardadas no aparelho e abrem até sem internet. Sem internet, o ? abre a parte do manual que ele já abriu naquela tela, neste aparelho; se ainda não abriu, abre a entrada do manual.",
            "Na entrada do manual ficam também o Glossário (/ajuda/glossario), com o que quer dizer cada palavra do sistema e do pátio, e os Problemas comuns (/ajuda/problemas), com o que fazer quando algo não sai como esperado.",
          ),
          texto(
            `Os Roteiros para imprimir (/ajuda/roteiros) são uma folha por função, com o passo a passo do dia, para deixar no posto de trabalho. Cada pessoa vê só as folhas do seu módulo e do seu perfil: a Serraria tem 6 (recebimento de toras, encarregado da serraria, estufas, pacotes e expedição, inventário e supervisão) e a Manutenção tem 3 (abrir requisição, atender requisição e supervisão${
              ATIVA ? "" : "; enquanto ela está em teste, só o administrador vê essas folhas"
            }). Cada folha impressa traz um QR que abre a parte do manual com as fotos. Imprimir todas imprime as suas folhas; Só esta folha, uma.`,
          ),
        ],
      },
      {
        id: "tema",
        titulo: "Tema claro, escuro ou automático",
        palavras: ["tema", "escuro", "claro", "modo escuro", "modo noturno", "noturno", "dark", "cores", "automático", "sol", "lua", "brilho"],
        blocos: [
          texto("A tela pode ficar clara, escura ou automática (segue o claro/escuro do aparelho). A escolha fica salva neste aparelho."),
          termos(
            ["Botão do topo", "O botão do sol, da lua ou do monitor, no topo do computador e do celular. Cada toque passa para o próximo: Claro → Escuro → Automático."],
            ["Meu perfil › Tema", "Escolha Claro, Escuro ou Automático."],
            ["Mais (celular)", "Tema, com as mesmas três opções."],
          ),
          dica("Impressões, PDFs e etiquetas saem sempre claros, qualquer que seja o tema."),
        ],
      },
    ],
  },

  // ───────────────────────────── Avisos ─────────────────────────────
  {
    id: "avisos",
    grupo: "geral",
    titulo: "Avisos e notificações",
    resumo: "O sininho, a tela Notificações, ligar e desligar os avisos no aparelho e quais avisos cada um recebe",
    rotas: ["/notificacoes"],
    topicos: [
      {
        id: "sininho",
        titulo: "O sininho e a tela Notificações",
        rotas: ["/notificacoes"],
        palavras: ["sininho", "sino", "notificação", "notificacao", "notificações", "aviso", "avisos", "não lidas", "marcar como lida", "marcar todas como lidas", "ver todas"],
        blocos: [
          texto("Os avisos do sistema chegam no sininho, no alto da tela. O número em cima dele mostra quantos você ainda não leu."),
          passos(
            "Toque no sininho para ver os últimos avisos.",
            "Toque num aviso para abrir a tela do assunto. Ele passa a contar como lido.",
            "Marcar todas como lidas zera o número.",
            "Ver todas abre a tela Notificações, com os seus últimos 100 avisos. Os não lidos ficam em negrito.",
          ),
          lista(
            "A tela Notificações também abre pelo cartão Notificações da tela de início (no celular, também em Mais).",
            "Com o app instalado, o ícone do app pode mostrar o número de avisos não lidos (depende do celular).",
            "Os avisos já lidos são apagados depois de um tempo; o prazo está na Política de Privacidade.",
          ),
        ],
      },
      {
        id: "ativar",
        titulo: "Receber os avisos no celular ou no computador",
        palavras: ["ativar", "ativar notificações", "push", "permitir", "celular apitar", "avisos no celular", "notificação de teste", "bloqueado", "iphone"],
        blocos: [
          texto("Para o aviso chegar mesmo com o sistema fechado, como uma mensagem do celular, ative neste aparelho. A ativação vale só para o aparelho em que você fez: repita em cada celular ou computador que você usa."),
          passos(
            `Abra Meu perfil. ${ABRIR_PERFIL}`,
            "No quadro Notificações neste aparelho, toque em Ativar notificações.",
            "Quando o navegador perguntar, toque em Permitir.",
            "Chega uma notificação de teste. Para testar de novo, toque em Enviar notificação de teste.",
          ),
          termos(
            ["No iPhone", "Primeiro instale o app (Compartilhar → Adicionar à Tela de Início) e abra o sistema pelo ícone. Só então aparece Ativar notificações."],
            ["As notificações foram bloqueadas no navegador", "Libere nas configurações do site (o cadeado ao lado do endereço) e recarregue a página."],
            ["Este navegador não suporta notificações push", "Use outro navegador (Chrome, no Android). Os avisos continuam aparecendo no sininho."],
          ),
        ],
      },
      {
        id: "desativar",
        titulo: "Desligar os avisos no aparelho",
        palavras: ["desativar", "desligar", "parar avisos", "não quero receber", "silenciar", "sair"],
        blocos: [
          passos(`Abra Meu perfil. ${ABRIR_PERFIL}`, "No quadro Notificações neste aparelho, toque em Desativar neste aparelho."),
          lista(
            "Os avisos continuam no sininho; só deixam de chegar como notificação neste aparelho.",
            "Ao tocar em Sair, os seus avisos param de chegar neste aparelho até você entrar de novo. Quando você entra, eles voltam sozinhos.",
            "Outra pessoa que entrar no mesmo aparelho só recebe os avisos dela depois de ativar no Meu perfil dela.",
          ),
        ],
      },
      {
        id: "avisos-da-serraria",
        titulo: "Quais avisos a Serraria manda",
        modulo: "producao",
        palavras: ["avisos da serraria", "estufa atrasada", "previsão", "sem apontamento", "18h", "pedido pronto", "máquina parada", "máquina liberada", "quem recebe"],
        blocos: [
          termos(
            ["Estufa passou da previsão de saída", "Supervisor e apontador da Serraria, gerente, o plantão do ciclo e quem iniciou o ciclo."],
            ["Serraria sem apontamento hoje", "Às 18h de um dia útil (segunda a sexta) sem nenhum lote: supervisor, apontador e gerente."],
            ["Pedido pronto para expedir", "Supervisor e gerente. Com volume combinado, quando os pacotes secos cobrem o saldo a expedir; sem volume, quando tudo o que falta sair está seco."],
            ["Máquina parada", "Supervisor e gerente, quando alguém toca em Máquina parou (quem marcou não recebe)."],
            ["Máquina liberada", "Supervisor, gerente e quem marcou a parada."],
            ...(ATIVA
              ? ([["Pela manutenção", "Máquina liberada pela manutenção, parada corrigida pela manutenção ou requisição cancelada com a máquina ainda parada: supervisor e quem marcou a parada."]] as [string, string][])
              : []),
          ),
          dica("Os detalhes de cada aviso estão em “Avisos da Serraria” (/ajuda/serraria-inicio#avisos-da-serraria)."),
        ],
      },
      {
        id: "avisos-da-manutencao",
        titulo: "Quais avisos a Manutenção manda",
        modulo: "manutencao",
        palavras: ["avisos da manutenção", "requisição nova", "comentário", "status", "atribuída", "lembrete", "7h", "quem recebe"],
        blocos: [
          termos(
            ["Requisição nova", "Supervisores e manutentores. O gerente só recebe as de prioridade alta, as urgentes e as com máquina parada."],
            ["Quem abriu", "Cada mudança de status e os comentários na requisição."],
            ["Responsável", "A requisição passada para você, os comentários, a máquina liberada pela serraria (falta conferir e concluir) e, às 7h, o lembrete do que está agendado para o dia."],
          ),
          ...se(
            !ATIVA,
            atencao(
              "Enquanto a Manutenção está em teste, os avisos dela só chegam a quem enxerga o módulo, isto é, ao administrador, e só os das requisições que ele abriu. O lembrete das 7h não sai.",
            ),
          ),
          dica("A lista completa está em “Avisos da Manutenção” (/ajuda/manutencao-inicio#avisos)."),
        ],
      },
      {
        id: "avisos-de-seguranca",
        titulo: "Avisos de segurança da sua conta",
        palavras: ["segurança", "seguranca", "senha redefinida", "recuperação bloqueada", "invasão", "alguém mexeu", "conta"],
        blocos: [
          texto("Se a sua senha for trocada pela pergunta de segurança, ou se a recuperação for bloqueada por muitas respostas erradas, você e o administrador do sistema recebem um aviso: Senha redefinida pela pergunta de segurança ou Recuperação de senha bloqueada."),
          atencao("Recebeu um desses avisos e não foi você? Fale com o gerente na hora: ele redefine a sua senha em Usuários."),
        ],
      },
      {
        id: "nao-chega",
        titulo: "Não estou recebendo os avisos",
        palavras: ["não chega", "nao chega", "não recebo", "nao recebo", "não apita", "notificação não aparece", "parou de avisar"],
        blocos: [
          lista(
            "Confira em Meu perfil se o quadro Notificações neste aparelho diz Ativadas. Se não, toque em Ativar notificações.",
            "No iPhone, o app precisa estar instalado e aberto pelo ícone da tela de início.",
            "Veja se o modo Não perturbe ou a economia de bateria do celular não está segurando as notificações.",
            "Saiu do sistema e entrou com outro login? Os avisos seguem quem está conectado.",
            "Nem todo aviso é para todos: veja acima quem recebe cada um.",
          ),
          dica("Outras situações em “Não recebo os avisos no celular” (/ajuda/problemas#avisos), nos Problemas comuns."),
        ],
      },
    ],
  },

  // ───────────────────────────── Sem internet ─────────────────────────────
  {
    id: "sem-internet",
    grupo: "geral",
    titulo: "Trabalhar sem internet",
    resumo: "O que dá para lançar sem sinal, como os lançamentos esperam no aparelho e são enviados, o que fazer com um recusado e o cuidado no aparelho compartilhado",
    topicos: [
      {
        id: "como-funciona",
        titulo: "Como funciona",
        palavras: ["offline", "sem internet", "sem sinal", "sem conexão", "sem conexao", "sem rede", "guardado no aparelho", "fila", "tentar novamente"],
        blocos: [
          texto("Sem sinal no pátio? Algumas telas continuam abrindo, e o que você lança nelas fica guardado no próprio aparelho, numa fila. Quando a internet volta, o sistema envia sozinho."),
          atencao("Para isso, o aparelho precisa ter entrado no sistema com internet antes: logo depois do login, o app guarda essas telas sozinho. Se você saiu do sistema neste aparelho, as telas guardadas foram apagadas: entre de novo com internet."),
          lista(
            "Fica guardado no aparelho: as telas de lançamento e os lançamentos ainda não enviados (com as fotos, no caso de requisição). Ao sair do sistema, os seus são apagados (o sistema avisa antes).",
            "As telas guardadas mostram os dados da última vez que o aparelho teve internet (por exemplo, a lista de pedidos da ficha da serraria).",
            "As outras telas mostram Sem conexão, com atalhos para as telas que abrem sem internet e o botão Tentar novamente.",
            "Sair, trocar a senha, ativar avisos e ver as notificações precisam de internet. Sem internet, tocar em Sair só mostra um aviso: nada é apagado do aparelho.",
            "O manual também abre sem internet: a entrada do manual, esta página (Trabalhar sem internet) e os Problemas comuns ficam guardados logo depois do login; as outras páginas do manual, depois de abertas uma vez com internet.",
          ),
          ...se(
            ATIVA,
            texto("Para quem usa a Manutenção, o Início da Manutenção e Nova requisição também abrem sem sinal: veja “Na Manutenção: requisição sem internet” (/ajuda/sem-internet#na-manutencao)."),
          ),
          dica("Apareceu a tela Sem conexão? Veja “Apareceu Sem conexão ou Algo deu errado” (/ajuda/problemas#sem-conexao)."),
        ],
      },
      {
        id: "na-serraria",
        titulo: "Na Serraria: o que abre e o que fica guardado",
        modulo: "producao",
        palavras: ["serraria", "apontar sem internet", "lote guardado", "carga guardada", "inventário sem internet", "parada sem internet", "etiqueta", "offline"],
        blocos: [
          termos(
            ["Apontar serraria", "O lote fica Guardado no aparelho (sem internet). O código LOT- e a etiqueta só existem depois do envio: quando a internet voltar, abra o boletim do dia e toque em Etiquetas de todos."],
            ["Nova carga de toras", "A carga fica guardada no aparelho e você já pode lançar a próxima."],
            ["Inventário do dia", "Cada Registrar fica guardado no aparelho e é enviado depois."],
            ["Paradas de máquina", "Máquina parou fica guardada com a hora do toque e aparece em Paradas agora como guardada no aparelho. A manutenção não fica sabendo: avise pessoalmente."],
            ["Início e Ler etiqueta", "O Início abre com os números da última vez que o aparelho teve internet. Ler etiqueta abre, mas para ver o pacote ou o lote é preciso internet."],
          ),
          texto(
            "Precisa de internet: corrigir uma carga ou um inventário já enviado, Máquina liberada, excluir uma parada, iniciar e concluir ciclo de estufa, formar pacotes, enviar para a estufa, registrar a saída e o romaneio, imprimir etiquetas e abrir pedidos, indicadores e cadastros.",
          ),
          atencao("Máquina voltou e está sem sinal? Anote a hora em que ela voltou e avise o supervisor: Máquina liberada usa a hora do toque."),
          dica("Mais em “Apontar sem internet” (/ajuda/serraria-ficha#sem-internet) e “Marcar parada sem internet” (/ajuda/serraria-paradas#parada-sem-internet)."),
        ],
      },
      {
        id: "na-manutencao",
        titulo: "Na Manutenção: requisição sem internet",
        modulo: "manutencao",
        palavras: ["manutenção", "requisição sem internet", "requisição guardada", "fotos sem internet", "offline"],
        blocos: [
          lista(
            "O Início da Manutenção e Nova requisição abrem sem internet.",
            "A requisição nova, com as fotos, fica guardada no aparelho (aparece Sem internet: requisição guardada no aparelho) e só entra na lista de Requisições depois de enviada.",
            "Com a máquina parada, conta como início da parada a hora em que a requisição foi guardada.",
            "Precisa de internet: abrir uma requisição já enviada, mudar o status, assumir, comentar, mandar fotos depois, lançar horas, marcar o checklist, Máquina liberada, a agenda, os equipamentos e os indicadores.",
          ),
          dica("Passo a passo em “Sem internet” (/ajuda/manutencao-abrir#sem-internet)."),
        ],
      },
      {
        id: "fila",
        titulo: "A faixa da fila: aguardando e enviados",
        palavras: ["fila", "faixa amarela", "aguardando", "aguardando envio", "aguardando internet", "enviar agora", "sincronizar", "sincronização", "pendente", "enviado", "ver", "demorou"],
        blocos: [
          termos(
            [
              "Sem internet. Continue apontando: …",
              "Faixa cinza no alto da tela quando o aparelho está sem internet e a fila está vazia. O link O que funciona sem internet? abre esta página do manual.",
            ],
            [
              "N lançamentos aguardando internet (ou envio)",
              "Faixa amarela: quantos lançamentos seus estão guardados. Ver mostra a lista (o que é, a data e a hora e as fotos); Ocultar fecha. O link O que é isso? abre a explicação nos Problemas comuns.",
            ],
            ["Enviar agora", "Aparece quando há internet: envia na hora, sem esperar."],
            ["N lançamentos feitos sem internet foram enviados", "Faixa verde quando o envio dá certo. A tela se atualiza com os dados novos."],
          ),
          texto(
            "Com algum lançamento recusado, a faixa fica vermelha e o link vira Como resolver? (veja o tópico abaixo). Os links das faixas abrem o manual mesmo sem internet, se o aparelho já entrou no sistema com internet antes.",
          ),
          texto("O envio é automático: quando a internet volta, quando você abre o app e a cada minuto enquanto houver conexão. Não precisa fazer nada. A faixa amarela não some? Veja “Apareceu uma faixa amarela: lançamentos aguardando internet” (/ajuda/problemas#fila-offline)."),
          lista(
            "Sinal fraco: se o sistema não responder em 20 segundos, o lançamento também vai para a fila. Ele não é lançado duas vezes, mesmo que já tivesse chegado.",
            "Se a sua sessão acabou (por exemplo, a senha foi trocada em outro aparelho), os lançamentos esperam você entrar de novo neste aparelho.",
          ),
        ],
      },
      {
        id: "recusado",
        titulo: "Lançamento recusado: Tentar de novo ou Descartar",
        palavras: ["recusado", "recusados", "faixa vermelha", "erro", "motivo", "tentar de novo", "descartar", "lixeira", "não foi enviado", "nao foi enviado"],
        blocos: [
          texto(
            "Às vezes o sistema não aceita um lançamento da fila: por exemplo, a máquina já tinha uma parada aberta, o pedido não existe mais ou o seu perfil não permite. A faixa fica vermelha: N lançamentos recusados pelo servidor, com o link Como resolver?, que abre a explicação nos Problemas comuns.",
          ),
          passos(
            "Toque em Ver.",
            "Leia o motivo, em vermelho, embaixo do lançamento: Recusado: … (o motivo).",
            "Se o problema já foi resolvido (por exemplo, o supervisor reabriu o pedido), toque em Tentar de novo.",
            "Se o lançamento não vale mais, toque na lixeira (Descartar) e confirme.",
          ),
          atencao("O recusado fica parado no aparelho até você escolher: o sistema não tenta de novo sozinho. Descartar apaga o lançamento de vez; anote os dados antes, se for lançar de novo."),
          dica("Mais exemplos de motivo em “Apareceu uma faixa vermelha: lançamento recusado pelo servidor” (/ajuda/problemas#recusado)."),
        ],
      },
      {
        id: "aparelho-compartilhado",
        titulo: "Aparelho usado por várias pessoas",
        palavras: ["compartilhado", "outro usuário", "outra pessoa", "de outro usuário", "sair", "perder lançamentos", "dono", "trocar de usuário"],
        blocos: [
          lista(
            "Cada lançamento guardado tem dono: quem estava conectado quando lançou. Ele só é enviado quando essa mesma pessoa estiver conectada no aparelho.",
            "Na faixa, os lançamentos de outra pessoa aparecem como de outro usuário. Em Ver, cada um mostra o nome de quem lançou: essa pessoa precisa entrar com o login dela para enviar.",
            "Ao tocar em Sair com lançamentos seus ainda não enviados, o sistema avisa que eles serão perdidos. Toque em Cancelar, espere o envio (ou toque em Enviar agora) e só então saia.",
            "Os lançamentos de outras pessoas continuam no aparelho quando você sai, até elas entrarem.",
            "Sair também apaga deste aparelho as telas guardadas e desliga os seus avisos nele.",
          ),
          atencao(
            "Sair precisa de internet. Sem conexão, o sistema avisa (Sair precisa de internet. Ligue o Wi-Fi ou os dados móveis e toque em Sair de novo.) e não apaga nada do aparelho: você continua conectado, com os lançamentos e as telas guardadas. Quando a internet voltar, espere os seus lançamentos serem enviados e só então saia.",
          ),
          dica("Veja também “Ao tocar em Sair, o sistema avisa que lançamentos serão perdidos” (/ajuda/problemas#sair-com-pendentes)."),
        ],
      },
    ],
  },

  // ───────────────────────────── Meu perfil ─────────────────────────────
  {
    id: "meu-perfil",
    grupo: "geral",
    titulo: "Meu perfil e a sua conta",
    resumo: "Trocar a senha, a pergunta de segurança, os avisos neste aparelho, o tema, sair e a privacidade",
    rotas: ["/perfil"],
    topicos: [
      {
        id: "o-que-tem",
        titulo: "O que tem em Meu perfil",
        palavras: ["meu perfil", "perfil", "conta", "minha conta", "dados", "nome", "login", "iniciais"],
        blocos: [
          texto(`Para abrir: ${ABRIR_PERFIL} Meu perfil também fica nos cartões da tela de início e, no celular, em Mais.`),
          termos(
            [
              "Seus dados",
              "O cartão do alto: o seu nome, o login e o seu perfil em cada módulo que você usa (ex.: Serraria: Apontador · Manutenção: Operador; gerente e administrador veem Gerente · acesso total ou Administrador · acesso total). O mesmo perfil aparece na faixa verde da tela de início, no alto de Mais (celular) e no menu do seu nome (computador). Para mudar o nome, o login ou o perfil, fale com o gerente.",
            ],
            ["Notificações neste aparelho", "Ativar, testar ou desligar os avisos neste aparelho. Veja “Receber os avisos no celular ou no computador” (/ajuda/avisos#ativar)."],
            ["Tema", "Claro, Escuro ou Automático. Veja “Tema claro, escuro ou automático” (/ajuda/navegacao#tema)."],
            ["Pergunta de segurança", "Para você recuperar a senha sozinho. Veja “Cadastre a pergunta de segurança” (/ajuda/primeiros-passos#pergunta-de-seguranca)."],
            ["Trocar senha", "Veja o próximo tópico."],
          ),
          imagem({ arquivo: "geral/perfil.webp", legenda: "Meu perfil: avisos neste aparelho, tema, pergunta de segurança e troca de senha.", rota: "/perfil", perfil: "apontador" }),
        ],
      },
      {
        id: "trocar-senha",
        titulo: "Trocar a senha",
        palavras: ["trocar senha", "mudar senha", "alterar senha", "nova senha", "senha atual", "salvar nova senha"],
        blocos: [
          passos(
            `Abra Meu perfil. ${ABRIR_PERFIL}`,
            "No quadro Trocar senha, digite a Senha atual.",
            "Em Nova senha (mínimo 8 caracteres), digite a nova e repita em Confirme a nova senha.",
            "Toque em Salvar nova senha.",
          ),
          lista(
            "A nova senha precisa ser diferente da atual.",
            "Os outros aparelhos em que você estava conectado saem sozinhos; este continua.",
            "Errou a senha atual muitas vezes? Espere os minutos indicados e tente de novo.",
          ),
        ],
      },
      {
        id: "sair",
        titulo: "Sair do sistema",
        palavras: ["sair", "logout", "deslogar", "desconectar", "encerrar", "trocar de usuário", "porta"],
        blocos: [
          termos(
            ["No computador", "Toque no seu nome, no canto direito do topo, e em Sair."],
            ["No celular", "Mais › Sair (logo depois do Tema)."],
            ["Sem nenhum módulo liberado", "O ícone de sair (a porta), no canto de cima à direita."],
          ),
          lista(
            "Os seus avisos param de chegar neste aparelho até você entrar de novo.",
            "As telas guardadas para usar sem internet são apagadas deste aparelho.",
            "Se houver lançamentos seus feitos sem internet e ainda não enviados, o sistema avisa antes: se sair, eles se perdem.",
          ),
          atencao(
            "Sair precisa de internet: sem conexão, o sistema avisa e não apaga nada do aparelho (você continua conectado). Ligue o Wi-Fi ou os dados móveis e toque em Sair de novo. Em aparelho usado por várias pessoas, sempre saia no fim do turno: veja “Aparelho usado por várias pessoas” (/ajuda/sem-internet#aparelho-compartilhado).",
          ),
        ],
      },
      {
        id: "privacidade",
        titulo: "Privacidade e os seus dados",
        palavras: ["privacidade", "lgpd", "dados pessoais", "política de privacidade", "politica de privacidade", "meus dados", "por quanto tempo", "apagar dados"],
        blocos: [
          texto(
            "A Política de Privacidade explica quais dados pessoais o sistema guarda (nome, login, o que cada um lança e altera, as entradas no sistema com o endereço IP, as fotos e os avisos no aparelho), para quê, com quem são compartilhados e por quanto tempo ficam guardados.",
          ),
          lista(
            "Para ler, toque em Privacidade, no rodapé (o pé da página) da tela de entrada e de cada tela do sistema. Quem administra encontra também o cartão Política de privacidade no Painel Administrativo.",
            "Os registros que passam do prazo são apagados sozinhos, todos os dias.",
            "Para pedir acesso, correção ou exclusão dos seus dados, use os contatos que estão no fim da Política de Privacidade.",
          ),
        ],
      },
    ],
  },

  // ───────────────────────────── Usuários (gerente) ─────────────────────────────
  {
    id: "usuarios",
    grupo: "geral",
    para: "usuarios",
    titulo: "Usuários e perfis de acesso",
    resumo: "Cadastrar quem usa o sistema, escolher o perfil em cada módulo, redefinir a senha e desativar quem saiu",
    rotas: ["/usuarios"],
    topicos: [
      {
        id: "novo-usuario",
        titulo: "Cadastrar um usuário",
        palavras: ["novo usuário", "novo usuario", "cadastrar usuário", "criar usuário", "criar login", "funcionário novo", "senha inicial"],
        blocos: [
          passos(
            "Abra Usuários: no Painel Administrativo (cartão Administração da tela de início) ou, no menu à esquerda (no celular, em Mais), grupo Cadastros.",
            "Toque em Novo usuário.",
            "Preencha o Nome e o Login no formato nome.sobrenome, sem acento (ex.: joao.silva).",
            `Escolha o Perfil na Serraria e o Perfil na Manutenção (este vem com ${ATIVA ? "Operador" : "Sem acesso"}). Quem não usa um módulo fica com Sem acesso nele. Para acesso total, escolha Gerente no Perfil na Manutenção.`,
            "Em Senha inicial, digite uma senha provisória (mínimo 8 caracteres).",
            "Deixe marcados Ativo e Exigir troca da senha no primeiro acesso.",
            "Toque em Criar usuário e passe o login e a senha para a pessoa. No primeiro acesso, ela cria a senha dela.",
          ),
          termos(
            ["Já existe um usuário com este login", "Escolha outro login (por exemplo, com o segundo sobrenome)."],
            ["Escolha o perfil na Serraria ou na Manutenção (ou dê acesso de Gerente)", "Todo usuário precisa de perfil em pelo menos um módulo."],
          ),
          imagem({
            arquivo: "geral/usuarios.webp",
            legenda: "Usuários: o quadro Novo usuário aberto e a lista com o perfil de cada um.",
            rota: "/usuarios",
            perfil: "gerente",
            tela: "computador",
            acoes: [{ clicar: "text=Novo usuário" }],
          }),
        ],
      },
      {
        id: "perfis",
        titulo: "Perfis de acesso por módulo",
        palavras: ["perfil", "perfis", "permissão", "permissao", "acesso", "gerente", "supervisor", "apontador", "consulta", "manutentor", "operador", "sem acesso", "administrador", "selo"],
        blocos: [
          texto("Cada usuário tem um perfil em cada módulo: o Perfil na Serraria e o Perfil na Manutenção. O que a pessoa não pode usar nem aparece na tela."),
          termos(
            ["Perfil na Serraria", "Sem acesso, Supervisor (tudo, inclusive exclusões e cadastros), Apontador (lança o dia a dia) ou Consulta (só vê). Detalhes em “Quem faz o quê na Serraria” (/ajuda/serraria-inicio#perfis)."],
            [
              "Perfil na Manutenção",
              "As opções da tela: Gerente · acesso total aos dois módulos e aos usuários; Supervisor · atende, distribui, planeja e vê indicadores; Manutentor · atende as requisições; Operador · abre e acompanha requisições; Sem acesso · não usa a Manutenção. Detalhes em “O que cada perfil faz na Manutenção” (/ajuda/manutencao-inicio#perfis).",
            ],
            ["Gerente", "Acesso total aos dois módulos, a Usuários e à Auditoria. É escolhido no Perfil na Manutenção; depois de salvar, o Perfil na Serraria mostra Acesso total (Admin/Gerente)."],
            ["Sem acesso", "A pessoa não usa aquele módulo. Quem fica com Sem acesso nos dois (e não é Gerente) não pode ser salvo."],
            ["Administrador", "A conta de quem desenvolveu o sistema. Não pode ser dada pela tela e só aparece para o próprio administrador."],
          ),
          texto("Na lista, os selos mostram o acesso de cada um: Gerente · acesso total, Serraria · (perfil na Serraria), Manutenção · (perfil na Manutenção), Ainda sem acesso (ativo, mas sem nenhum módulo liberado) e Inativo."),
          ...se(
            !ATIVA,
            atencao(
              "A Manutenção ainda está em teste. O Perfil na Manutenção já pode ser escolhido, mas só passa a valer quando ela for liberada (o Gerente vale já); a tela avisa embaixo do campo. Esses usuários aparecem com o selo Manutenção · (perfil) (quando liberada), e a faixa azul do alto conta quem passa a usar o módulo na liberação (ex.: 2 gerentes, 1 supervisor e 3 operadores). Confira o perfil de cada um antes da liberação: quem não está como Sem acesso passa a entrar na Manutenção e a receber os avisos dela.",
            ),
          ),
        ],
      },
      {
        id: "alterar",
        titulo: "Mudar nome, login ou perfil",
        palavras: ["editar usuário", "alterar usuário", "mudar perfil", "trocar perfil", "promover", "mudar login", "corrigir nome"],
        blocos: [
          passos("Em Usuários, toque no nome da pessoa: abre o cadastro dela.", "Mude o que precisar (nome, login ou perfis).", "Toque em Salvar."),
          texto("A mudança de perfil vale na hora: na próxima tela que a pessoa abrir, os menus e os botões já mudam. Mudou o login? Avise a pessoa: ela passa a entrar com o login novo."),
        ],
      },
      {
        id: "redefinir-senha",
        titulo: "Redefinir a senha de alguém",
        palavras: ["redefinir senha", "resetar senha", "esqueceu a senha", "senha provisória", "nova senha", "desbloquear"],
        blocos: [
          passos(
            "Em Usuários, toque no nome da pessoa.",
            "Em Nova senha (deixe em branco para manter), digite uma senha provisória (mínimo 8 caracteres).",
            "Deixe marcado Ao redefinir a senha, exigir troca no próximo acesso.",
            "Toque em Salvar e passe a senha provisória para a pessoa.",
          ),
          lista(
            "A pessoa sai de todos os aparelhos em que estava conectada e, ao entrar, cria uma senha nova.",
            "Quem cadastrou a pergunta de segurança pode fazer isso sozinho, em Esqueci a minha senha.",
            "A Auditoria registra que a senha foi redefinida e por quem (a senha em si nunca aparece).",
          ),
        ],
      },
      {
        id: "desativar",
        titulo: "Desativar quem saiu da empresa",
        palavras: ["desativar", "bloquear", "inativo", "saiu da empresa", "demitido", "excluir usuário", "apagar usuário", "reativar"],
        blocos: [
          passos("Em Usuários, toque no nome da pessoa.", "Desmarque Ativo.", "Toque em Salvar."),
          lista(
            "A pessoa não entra mais (aparece Usuário desativado. Procure o administrador.) e sai dos aparelhos em que estava conectada. Ela também deixa de receber avisos.",
            "Tudo o que ela lançou continua no sistema, com o nome dela. Por isso não há como apagar um usuário: desative.",
            "Na lista, ela vai para o fim, com o selo Inativo. Para voltar, marque Ativo e salve.",
            "Você não pode desativar o seu próprio usuário.",
          ),
        ],
      },
    ],
  },

  // ───────────────────────────── Auditoria (gerente) ─────────────────────────────
  {
    id: "auditoria",
    grupo: "geral",
    para: "auditoria",
    titulo: "Auditoria",
    resumo: "Quem fez o quê no sistema, e quando: o que fica registrado e como encontrar um registro",
    rotas: ["/auditoria"],
    topicos: [
      {
        id: "o-que-fica",
        titulo: "O que fica registrado",
        palavras: ["auditoria", "histórico", "historico", "quem fez", "quem alterou", "log", "registro", "rastrear alteração", "senha errada", "ip"],
        blocos: [
          texto(
            "Em Auditoria fica registrado quem fez o quê e quando: entradas e saídas do sistema (inclusive senha errada, bloqueio e recuperação de senha, com o endereço IP), lotes, boletins, paradas, ciclos de estufa, pacotes e romaneios, cargas de toras, inventários, cadastros e usuários e, na Manutenção, requisições, fotos, horas, checklists, equipamentos e planos.",
          ),
          texto(
            "Para abrir: no Painel Administrativo, toque em Auditoria (tudo) ou em Entradas e acessos (só as entradas, as saídas, as senhas e as mudanças nos usuários). Também fica no menu à esquerda (grupo Cadastros na Serraria; Gestão na Manutenção).",
          ),
          lista(
            "Cada linha mostra quem fez, o que foi feito e a data e a hora. Sistema aparece quando não há usuário (por exemplo, a tentativa de entrar com um login que não existe).",
            "Nas alterações, aparece o valor anterior, riscado, e o novo (ex.: Status: Aberta → Em análise).",
            "Toque no item de uma linha para abrir a tela dele: lote, pacote, boletim, carga de toras, ciclo de estufa, inventário, pedido, estufa, o dia da parada de máquina e, para quem usa a Manutenção, a requisição e o equipamento. Florestas, fornecedores, motoristas, motivos de parada e a configuração abrem a aba deles em Cadastros.",
            "Os registros de entrada e saída ficam guardados por alguns meses e os demais por alguns anos; os prazos estão na Política de Privacidade.",
          ),
        ],
      },
      {
        id: "encontrar",
        titulo: "Encontrar um registro",
        palavras: ["filtrar", "buscar", "procurar", "período", "usuário", "área", "de", "até", "limpar"],
        blocos: [
          passos(
            "Em Buscar, escreva um pedaço do que procura (ex.: #00012, senha, LIX-02, um código PCT- ou LOT-, o nome de uma máquina).",
            "Se quiser, escolha o Usuário, a Área (separada em Geral, Serraria e Manutenção) e o período em De e Até.",
            "Toque em Filtrar. Limpar volta a mostrar tudo.",
          ),
          texto("A lista mostra 50 registros por página, do mais novo para o mais antigo; use Anterior e Próxima para ver os outros."),
        ],
      },
    ],
  },
];
