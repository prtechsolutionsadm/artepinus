// Manual do usuário: módulo Manutenção (páginas /ajuda/manutencao-*). Conferido com as telas de
// src/app/(app)/{manutencao,requisicoes,agenda,preventivas,checklists,equipamentos,indicadores,relatorios,setores}.
// Enquanto a Manutenção está em teste (MODULOS_EM_TESTE), só o administrador vê estas páginas; os textos
// que mudam com a liberação usam ATIVA.
import { MODULOS_ATIVOS } from "@/lib/permissoes";
import type { Bloco, Secao, Topico } from "./tipos";

/** A Manutenção já foi liberada a todos (avisos chegam à equipe; a serraria diz "manutenção avisada"). */
const ATIVA = MODULOS_ATIVOS.includes("manutencao");

/** Blocos que só entram quando `cond` vale. */
function se(cond: boolean, ...blocos: Bloco[]): Bloco[] {
  return cond ? blocos : [];
}

/** Tópicos que só entram quando `cond` vale. */
function seTopico(cond: boolean, ...topicos: Topico[]): Topico[] {
  return cond ? topicos : [];
}

/** Módulo Manutenção. */
export const MANUTENCAO: Secao[] = [
  // ============================ Início ============================
  {
    id: "manutencao-inicio",
    grupo: "manutencao",
    modulo: "manutencao",
    titulo: "Início da Manutenção",
    resumo: "Como chegar ao módulo, o que a tela inicial mostra, o que cada perfil faz e quem recebe cada aviso",
    rotas: ["/manutencao"],
    topicos: [
      {
        id: "entrar",
        titulo: "Como chegar à Manutenção",
        palavras: ["modulo", "trocar de modulo", "escolher modulo", "menu", "barra de baixo", "serraria"],
        blocos: [
          {
            tipo: "texto",
            texto: "Quem usa só a Manutenção entra direto nela. Quem usa a Serraria e a Manutenção entra primeiro na Serraria e troca de módulo quando precisar.",
          },
          {
            tipo: "termos",
            itens: [
              ["No computador", "Toque em Módulo Serraria, no rodapé do menu à esquerda (Trocar de módulo), e escolha Manutenção. Também dá pelo menu do seu nome, no canto direito do topo: Escolher módulo."],
              ["No celular", "Toque em Mais, na barra de baixo, e depois em Escolher módulo (Serraria / Manutenção)."],
            ],
          },
          {
            tipo: "texto",
            texto:
              "Na Manutenção, a barra de baixo do celular tem Início, Requisições, o botão + do meio (Nova requisição), Agenda e Mais. No computador, o menu à esquerda tem Início, Operação (Requisições e Agenda), Gestão (Indicadores, Relatórios e Auditoria) e Cadastros (Equipamentos, Preventivas, Checklists, Usuários e Setores). Cada pessoa vê só o que o perfil dela permite.",
          },
          { tipo: "dica", texto: "No computador, a busca do alto do menu (atalho: tecla /) procura requisições enquanto você está na Manutenção. No celular, use a lupa do topo." },
          ...se(
            !ATIVA,
            {
              tipo: "atencao",
              texto: "A Manutenção está em teste: só o administrador abre o módulo. Para os outros usuários, ela aparece como Em breve na tela de escolha do módulo.",
            },
          ),
        ],
      },
      {
        id: "tela-inicial",
        titulo: "O que aparece no Início",
        palavras: [
          "inicio",
          "painel",
          "resumo",
          "pendentes",
          "aguardando analise",
          "agendadas",
          "concluidas no mes",
          "maquinas paradas agora",
          "sem responsavel",
          "ver todas",
          "maquina liberada",
          "conferir e concluir",
        ],
        blocos: [
          { tipo: "texto", texto: "A tela Início mostra como está a manutenção agora. Toque num número ou numa requisição para abrir a lista ou a página dela." },
          {
            tipo: "termos",
            itens: [
              [
                "Máquinas paradas agora",
                "Quadro vermelho que só aparece quando alguma máquina está parada: o equipamento, o número da requisição, há quanto tempo está parada e o responsável. Parada que veio da serraria mostra “serraria (mecânica)” ou “serraria (elétrica)”.",
              ],
              ["Pendentes", "Todas as requisições que ainda não foram concluídas nem canceladas."],
              ["Aguardando análise", "Requisições com status Aberta: ninguém da manutenção mexeu nelas ainda."],
              ["Agendadas", "Requisições com data marcada. Abre a Agenda."],
              ["Concluídas no mês", "Requisições concluídas desde o dia 1º do mês."],
              ["Pendentes por status", "Barra colorida com quantas pendentes há em cada status. Toque num status para ver a lista dele."],
              ["Prioridade alta e urgente", "As 5 pendentes mais urgentes. Ver todas abre a lista com todas as pendentes de prioridade Alta e Urgente."],
              ["Agendadas nos próximos 7 dias", "O que já tem data marcada para a semana. Ver todas abre a Agenda."],
              [
                "Minhas requisições, Atribuídas a mim ou Sem responsável",
                "Este quadro muda com o perfil. Operador: Minhas requisições, as que você abriu. Supervisor e manutentor: Atribuídas a mim, as pendentes em que você é o responsável. Gerente: Sem responsável, as pendentes que ainda não têm responsável, as mais urgentes primeiro (para distribuir). Ver todas abre a lista com o mesmo filtro.",
              ],
              [
                "Máquina liberada: conferir e concluir",
                "Só para a equipe da manutenção, e só quando há alguma: requisições pendentes cuja máquina já voltou a funcionar (liberada na serraria ou na manutenção). Abra, confira o serviço e conclua.",
              ],
            ],
          },
          {
            tipo: "dica",
            texto:
              "Manutentor, supervisor e gerente têm o botão Máquina liberada no quadro Máquinas paradas agora, nas paradas que vieram da serraria. Veja “Máquina parada: Serraria e Manutenção” (/ajuda/manutencao-maquina-parada).",
          },
          { tipo: "texto", texto: "Para quem usa a Manutenção, o Início também abre sem internet, com os números da última vez que o aparelho teve conexão." },
          {
            tipo: "imagem",
            imagem: { arquivo: "manutencao/inicio.webp", legenda: "Início da Manutenção no celular, visto por um manutentor", rota: "/manutencao", perfil: "manutentor" },
          },
        ],
      },
      {
        id: "perfis",
        titulo: "O que cada perfil faz na Manutenção",
        palavras: ["perfil", "permissao", "acesso", "operador", "manutentor", "supervisor", "gerente", "sem acesso", "quem pode"],
        blocos: [
          {
            tipo: "texto",
            texto: "O perfil na Manutenção é escolhido pelo gerente na tela “Usuários” (/ajuda/usuarios). Ele vale só para este módulo: a Serraria tem um perfil próprio.",
          },
          {
            tipo: "termos",
            itens: [
              ["Operador", "Abre requisições (com fotos e pelo QR da máquina), acompanha todas, comenta e cancela as que abriu enquanto ainda estão Abertas."],
              [
                "Manutentor",
                "Abre e acompanha requisições como o operador e mais: assume requisições para si, muda o status, agenda, lança horas, marca o checklist, anexa fotos do serviço, conclui, toca em Máquina liberada e cadastra equipamentos. Não cancela requisições, nem as que ele abriu: pede a um supervisor.",
              ],
              [
                "Supervisor",
                "Tudo do manutentor e mais: escolhe o responsável de cada requisição, cancela qualquer uma, cria planos de preventiva e checklists e vê indicadores e relatórios.",
              ],
              ["Gerente", "Tudo do supervisor e mais: usuários, setores e auditoria. Na Serraria, o gerente também tem acesso total."],
              ["Sem acesso", "Não usa a Manutenção. Quem trabalha na serraria e está como Sem acesso chama a manutenção pelo botão Máquina parou, na tela de paradas."],
            ],
          },
          { tipo: "texto", texto: "Só supervisores e manutentores podem ser responsáveis por uma requisição." },
        ],
      },
      {
        id: "avisos",
        titulo: "Avisos da Manutenção",
        palavras: ["aviso", "notificacao", "sininho", "push", "lembrete", "alerta", "celular"],
        blocos: [
          { tipo: "texto", texto: "Os avisos aparecem no sininho do topo e, se você ativou no aparelho, também no celular. Toque no aviso para abrir a requisição. Veja “Avisos” (/ajuda/avisos)." },
          {
            tipo: "lista",
            itens: [
              "Quem abriu a requisição: cada mudança de status (com a data, quando ela é agendada) e os comentários.",
              "Responsável: quando a requisição é passada para você (… atribuída a você) e os comentários nela.",
              "Supervisores e manutentores: toda requisição nova, com destaque para urgente, prioridade alta e máquina parada (ex.: ⚠️ Prioridade alta · ⛔ Máquina parada · Nova requisição #00012). Se a requisição ainda não tem responsável, também o comentário de quem abriu.",
              "Gerente: requisições novas de prioridade alta, urgentes ou com máquina parada.",
              "Responsável (sem responsável, os supervisores): ✅ Máquina liberada · #… quando a serraria libera a máquina e falta conferir e concluir; 🗓️ Preventiva agendada quando um plano gera a requisição; … cancelada pelo solicitante quando quem abriu cancela.",
              "Parada excluída na serraria (marcada por engano): se a requisição foi cancelada sozinha, quem recebeu o aviso dela recebe … cancelada · parada marcada por engano; se ela continua com a manutenção, o responsável (sem responsável, os supervisores) recebe … parada excluída na serraria.",
              "Todo dia às 7h: lembrete das manutenções agendadas para o dia (📅 Hoje às …), para o responsável (sem responsável, para os supervisores) e para quem abriu.",
              "Quem marcou a parada na serraria e não usa a Manutenção recebe os avisos de status e de comentário da requisição aberta pelo Máquina parou; tocar no aviso abre a tela de paradas.",
            ],
          },
          ...se(
            !ATIVA,
            {
              tipo: "atencao",
              texto:
                "Enquanto a Manutenção está em teste, os avisos dela só chegam ao administrador, e só os das requisições que ele abriu: supervisores, manutentores e gerentes não recebem nenhum. Os planos de preventiva também não geram requisições sozinhos e o lembrete das 7h não sai.",
            },
          ),
        ],
      },
      ...seTopico(!ATIVA, {
        id: "em-teste",
        titulo: "Período de teste (só o administrador)",
        palavras: ["teste", "em breve", "liberar", "triagem", "periodo de teste"],
        blocos: [
          {
            tipo: "lista",
            itens: [
              "Só o administrador abre o módulo e vê estas páginas do manual. Para os outros, a Manutenção aparece como Em breve.",
              "Os avisos da manutenção só chegam ao administrador, e só os das requisições que ele abriu.",
              "Na serraria, o Máquina parou continua abrindo requisição para falha mecânica ou elétrica, mas a tela de paradas não promete aviso: mostra Parada marcada. O cronômetro está correndo. Avise a manutenção.",
              "Os planos de preventiva não geram requisições sozinhos (só pelo Gerar agora) e o lembrete das 7h não sai. Depois da liberação, cada plano gera só a requisição da vez, sem criar as atrasadas.",
              "Os textos do manual, dos roteiros e das telas que dependem da liberação (avisos, Em breve) mudam sozinhos quando o módulo for liberado.",
            ],
          },
          {
            tipo: "texto",
            texto:
              "Antes de liberar, use a Triagem do período de teste, em Serraria → Cadastros → Configuração: em Criadas até, ponha o último dia do teste e toque em Atualizar prévia. Ela separa as requisições que ficaram para trás em três grupos: Máquina parou: máquina já liberada, Preventivas geradas no teste e vencidas e Paradas excluídas na serraria (Ver as requisições mostra a lista). Para cada grupo, escolha Deixar como está, Concluir ou Cancelar, digite ENCERRAR e toque em Aplicar triagem. Nada é feito sozinho, os avisos não são enviados e fica de fora o que alguém da manutenção já assumiu, comentou ou em que lançou horas. Passo a passo em “Triagem do período de teste” (/ajuda/serraria-cadastros#triagem-do-teste).",
          },
          {
            tipo: "dica",
            texto: "Confira também o perfil na Manutenção de cada usuário em “Usuários” (/ajuda/usuarios): na liberação, quem não está como Sem acesso passa a entrar no módulo e a receber os avisos.",
          },
        ],
      }),
    ],
  },

  // ============================ Abrir requisição ============================
  {
    id: "manutencao-abrir",
    grupo: "manutencao",
    modulo: "manutencao",
    titulo: "Abrir uma requisição",
    resumo: "Pedir manutenção pelo celular ou pelo computador, com fotos, pelo QR da máquina e até sem internet",
    rotas: ["/requisicoes/nova"],
    topicos: [
      {
        id: "passo-a-passo",
        titulo: "Passo a passo",
        palavras: ["nova requisicao", "abrir chamado", "chamado", "ordem de servico", "os", "pedido de manutencao", "conserto", "defeito", "quebrou", "estragou"],
        blocos: [
          {
            tipo: "passos",
            itens: [
              "No celular, toque no botão + do meio da barra de baixo. No computador, toque em Nova requisição, no alto do Início ou da tela Requisições.",
              "Em O que precisa ser feito?, escreva um título curto (ex.: Lixadeira 02 fazendo barulho no rolamento).",
              "Em Descrição detalhada, conte o problema: quando começou, barulho, cheiro, se piorou…",
              "Se a máquina parou de funcionar, marque A máquina está parada (veja o tópico abaixo).",
              "Escolha o Equipamento. Se não for uma máquina ou você não souber qual é, deixe — Não se aplica / não sei —.",
              "Confira o Tipo (Corretiva, Preventiva, Preditiva ou Melhoria) e a Prioridade (Baixa, Média, Alta ou Urgente). O Setor vem do equipamento (Mesmo do equipamento): troque só se precisar. Em Local, diga onde fica (ex.: Galpão 2, perto da expedição).",
              "Em Fotos do problema, toque em Tirar foto (no celular) ou em Adicionar fotos. Cabem até 6.",
              "Toque em Abrir requisição. Ela ganha um número (ex.: #00012) e a página dela abre. Seu nome e a hora ficam registrados.",
            ],
          },
          { tipo: "dica", texto: "Fotos ajudam a manutenção a entender o problema e a levar a peça certa. Fotografe de perto e de longe." },
          ATIVA
            ? { tipo: "texto", texto: "Supervisores e manutentores recebem o aviso da requisição nova. O gerente recebe só as de prioridade alta, as urgentes e as com máquina parada." }
            : { tipo: "atencao", texto: "Enquanto a Manutenção está em teste, ninguém recebe o aviso da requisição nova." },
          {
            tipo: "imagem",
            imagem: { arquivo: "manutencao/nova-requisicao.webp", legenda: "Formulário Nova requisição no celular", rota: "/requisicoes/nova", perfil: "operador" },
          },
        ],
      },
      {
        id: "maquina-parada",
        titulo: "Quando a máquina parou",
        palavras: ["maquina parada", "parada", "parou", "quebrou", "tipo da falha", "mecanica", "eletrica", "tempo parado"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "Marque A máquina está parada quando a máquina não está funcionando. A requisição fica marcada como parada (com o selo vermelho Parada), a manutenção vê a máquina no quadro Máquinas paradas agora e começa a contar o tempo parado, que entra nos indicadores.",
          },
          {
            tipo: "texto",
            texto:
              "Se o Equipamento escolhido é uma máquina da linha da serraria, aparece também Tipo da falha: Mecânica ou Elétrica. A parada aparece na hora na tela de paradas da serraria e, quando a máquina voltar, o tempo parado entra no boletim do dia. Nas outras máquinas (ou sem equipamento), o Tipo da falha não aparece.",
          },
          {
            tipo: "texto",
            texto: "A contagem termina quando alguém toca em Máquina liberada, quando a manutenção informa a hora em que a máquina voltou a operar ou quando a requisição é concluída.",
          },
          { tipo: "dica", texto: "Veja o caminho completo em “Máquina parada: Serraria e Manutenção” (/ajuda/manutencao-maquina-parada)." },
        ],
      },
      {
        id: "qr",
        titulo: "Pelo QR Code da máquina",
        rotas: ["/q"],
        palavras: ["qr", "qr code", "etiqueta da maquina", "camera", "codigo da maquina"],
        blocos: [
          {
            tipo: "passos",
            itens: [
              "Aponte a câmera do celular para a etiqueta QR colada na máquina e toque no link que aparecer.",
              "Se pedir, entre com seu login: você volta direto para a página da máquina.",
              "Veja a lista Requisições em aberto para esta máquina. Se o problema já foi registrado, abra essa requisição e comente nela, em vez de abrir outra.",
              "Se não, toque em Abrir requisição para esta máquina: o formulário abre com o equipamento já escolhido.",
            ],
          },
          {
            tipo: "texto",
            texto: "Se a máquina já está registrada como parada, a página mostra Já registrada como parada. Manutentor, supervisor e gerente têm também o botão Ficha e histórico completo.",
          },
          {
            tipo: "imagem",
            imagem: { arquivo: "manutencao/qr-maquina.webp", legenda: "Página aberta pelo QR da máquina", rota: "/q/SER-01", perfil: "operador" },
          },
        ],
      },
      {
        id: "sem-internet",
        titulo: "Sem internet",
        palavras: ["offline", "sem sinal", "sem conexao", "guardada no aparelho", "fila", "enviar depois"],
        blocos: [
          { tipo: "texto", texto: "Em lugar sem sinal você ainda abre requisições, inclusive com fotos. Nova requisição e o Início da Manutenção abrem sem internet." },
          {
            tipo: "passos",
            itens: [
              "Abra o app e toque no botão + (Nova requisição) normalmente.",
              "Preencha e toque em Abrir requisição. Aparece o aviso Sem internet: requisição guardada no aparelho. Ela será enviada automaticamente quando a conexão voltar. Você pode abrir outra se precisar.",
              "Quando a internet voltar, ela é enviada sozinha. Enquanto isso, a faixa do topo mostra quantos lançamentos estão aguardando; quando eles saem, aparece o aviso de que foram enviados.",
            ],
          },
          {
            tipo: "texto",
            texto: "Se a conexão cair no meio do envio, acontece o mesmo: a requisição fica guardada no aparelho e nada do que você digitou se perde.",
          },
          {
            tipo: "texto",
            texto:
              "A requisição só aparece na lista depois de enviada. Com a máquina parada, conta como início da parada a hora em que você guardou a requisição no aparelho. Se o servidor recusar o envio, a faixa mostra o motivo e os botões Tentar de novo e Descartar: veja “Trabalhar sem internet” (/ajuda/sem-internet).",
          },
          {
            tipo: "atencao",
            texto:
              "Para abrir sem internet, você precisa ter entrado no sistema com internet neste aparelho (logo depois do login, o app guarda a tela sozinho). Não toque em Sair enquanto houver requisições aguardando envio: elas seriam perdidas (o sistema pergunta antes). Até ser enviada, ninguém da manutenção sabe dela: se for urgente, avise pessoalmente.",
          },
        ],
      },
    ],
  },

  // ============================ Acompanhar ============================
  {
    id: "manutencao-acompanhar",
    grupo: "manutencao",
    modulo: "manutencao",
    titulo: "Acompanhar requisições",
    resumo: "Status, busca e filtros, a página da requisição, comentários, fotos, cancelar e imprimir",
    rotas: ["/requisicoes"],
    topicos: [
      {
        id: "status",
        titulo: "O que significa cada status",
        palavras: ["status", "situacao", "aberta", "em analise", "planejada", "agendada", "em andamento", "aguardando pecas", "adiada", "concluida", "cancelada", "selo"],
        blocos: [
          {
            tipo: "termos",
            itens: [
              ["Aberta", "Acabou de ser registrada e espera a análise da manutenção."],
              ["Em análise", "A manutenção está avaliando o problema."],
              ["Planejada", "Aprovada, esperando a data."],
              ["Agendada", "Já tem dia e hora marcados para o serviço."],
              ["Em andamento", "O serviço está sendo feito."],
              ["Aguardando peças", "Parada esperando material ou peça."],
              ["Adiada", "Ficou para depois (o motivo fica no histórico)."],
              ["Concluída", "Serviço terminado; o que foi feito fica registrado."],
              ["Cancelada", "Não vai ser feita (o motivo fica no histórico)."],
            ],
          },
          { tipo: "texto", texto: "Na lista, cada requisição pode ter também estes selos:" },
          {
            tipo: "termos",
            itens: [
              ["Parada (vermelho)", "A máquina está parada agora."],
              ["Máquina liberada (verde)", "A máquina já voltou a funcionar, mas a requisição ainda não foi concluída: falta a manutenção conferir e concluir."],
              ["Alta ou Urgente", "A prioridade da requisição (Baixa e Média não aparecem na lista)."],
              ["Câmera com número", "Quantas fotos a requisição tem."],
            ],
          },
        ],
      },
      {
        id: "encontrar",
        titulo: "Encontrar uma requisição",
        palavras: [
          "buscar",
          "busca",
          "pesquisar",
          "procurar",
          "filtro",
          "filtrar",
          "numero",
          "minhas requisicoes",
          "atribuidas a mim",
          "abertas por mim",
          "sem responsavel",
          "alta e urgente",
          "parada agora",
          "ja liberada",
          "ver todas",
        ],
        blocos: [
          {
            tipo: "texto",
            texto: "Requisições (barra de baixo do celular, ou menu Operação no computador) mostra todas as requisições, das mais novas para as mais antigas, 30 por página (Anterior e Próxima no fim).",
          },
          {
            tipo: "passos",
            itens: [
              "Em Buscar, digite o número (ex.: 12 ou #00012), parte do título ou da descrição, ou o código ou o nome do equipamento.",
              "Se quiser, escolha os filtros: Status (Pendentes = todas as que não foram concluídas nem canceladas), Prioridade (uma só, ou Alta e urgente), Tipo, Setor, Responsável (Atribuídas a mim ou Sem responsável) e Máquina (Parada agora ou Já liberada, quando a máquina voltou e falta concluir). Marque Abertas por mim para ver só as suas.",
              "Toque em Filtrar. Limpar volta à lista completa.",
            ],
          },
          { tipo: "texto", texto: "Os links Ver todas do Início abrem esta lista já com o filtro do quadro (por exemplo, Prioridade: Alta e urgente ou Responsável: Sem responsável)." },
          { tipo: "dica", texto: "A Agenda (/ajuda/manutencao-agenda) mostra só as requisições com data marcada, separadas por dia." },
          {
            tipo: "imagem",
            imagem: { arquivo: "manutencao/requisicoes.webp", legenda: "Lista de requisições com a busca e os filtros", rota: "/requisicoes", perfil: "operador" },
          },
        ],
      },
      {
        id: "pagina",
        titulo: "A página da requisição",
        rotas: ["/requisicoes/*"],
        palavras: ["detalhe", "historico", "linha do tempo", "ver requisicao", "dados da requisicao", "faixa vermelha", "parada"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "Toque numa requisição para abrir a página dela: número, status, prioridade e tipo, o que foi pedido, quem abriu e quando, setor, local, equipamento, responsável, data agendada, início da execução, conclusão e horas trabalhadas. Depois de concluída, mostra também o Serviço realizado.",
          },
          {
            tipo: "texto",
            texto:
              "Com a máquina parada, uma faixa vermelha mostra há quanto tempo. Quando a máquina volta, a faixa fica cinza, com o tempo total parado. Nas máquinas da linha da serraria, a faixa diz também se a parada foi marcada na serraria ou aqui, na requisição, e que o tempo entra no boletim do dia.",
          },
          {
            tipo: "texto",
            texto:
              "Requisição encerrada com a parada da serraria ainda aberta mostra Requisição encerrada: a parada continua aberta na serraria até a serraria liberar a máquina.",
          },
          {
            tipo: "texto",
            texto: "Mais abaixo ficam Fotos, Checklist, Horas trabalhadas e o Histórico: cada mudança de status (com quem fez e a observação) e os comentários, em ordem.",
          },
          { tipo: "dica", texto: "Equipe da manutenção: o que fazer nesta página está em Atender requisições (/ajuda/manutencao-atender)." },
        ],
      },
      {
        id: "comentar",
        titulo: "Comentar e enviar mais fotos",
        palavras: ["comentario", "comentar", "mensagem", "foto", "fotos", "anexo", "imagem", "remover foto"],
        blocos: [
          {
            tipo: "passos",
            itens: ["No fim da página da requisição, escreva em Adicionar comentário.", "Toque em Comentar."],
          },
          {
            tipo: "texto",
            texto: "Quem abriu e o responsável são avisados. Se a requisição ainda não tem responsável e quem comenta é quem abriu, supervisores e manutentores ficam sabendo.",
          },
          {
            tipo: "texto",
            texto:
              "Para mandar mais fotos, use o quadro Fotos: Tirar foto (no celular) ou Adicionar fotos, e depois Enviar fotos. Podem enviar quem abriu, o responsável e a equipe da manutenção. Toque numa foto para ampliar; a lixeira (Remover foto) aparece nas fotos que você enviou (supervisor e gerente removem qualquer uma).",
          },
          {
            tipo: "atencao",
            texto:
              "Requisição Concluída ou Cancelada não aceita mais comentários nem fotos de quem abriu: os campos somem da tela. Só a equipe da manutenção ainda comenta e anexa a foto do serviço feito. Se o problema voltou, abra uma requisição nova.",
          },
        ],
      },
      {
        id: "cancelar",
        titulo: "Cancelar a requisição que você abriu",
        palavras: ["cancelar", "desistir", "abri errado", "engano", "repetida", "duplicada"],
        blocos: [
          { tipo: "texto", texto: "Enquanto a requisição ainda está Aberta (ninguém da manutenção mexeu nela), quem abriu pode cancelar:" },
          {
            tipo: "passos",
            itens: ["Na página da requisição, toque em Cancelar requisição.", "Escreva o Motivo.", "Toque em Confirmar cancelamento."],
          },
          {
            tipo: "texto",
            texto:
              "O responsável é avisado (sem responsável, os supervisores). Depois que a manutenção começa a tratar, o botão some: comente explicando e peça o cancelamento a um supervisor.",
          },
          {
            tipo: "texto",
            texto:
              "Quem é da equipe da manutenção não vê o botão Cancelar requisição, nem nas que abriu. Supervisor e gerente cancelam pelo quadro Atualizar requisição: veja “Cancelar uma requisição” (/ajuda/manutencao-atender#cancelar). O manutentor não cancela (a opção Cancelada nem aparece para ele): pede a um supervisor.",
          },
          {
            tipo: "texto",
            texto:
              "Com a máquina ainda parada: se a parada foi aberta pela própria requisição, ela é desfeita junto. Se foi marcada na serraria pelo botão Máquina parou, continua aberta lá até a serraria tocar em Máquina liberada, e a serraria é avisada do cancelamento.",
          },
        ],
      },
      {
        id: "imprimir",
        titulo: "Imprimir",
        palavras: ["imprimir", "impressao", "pdf", "papel", "folha", "arquivo"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "Na página da requisição, toque em Imprimir, no alto. Sai uma folha com o logo e os dados da empresa, pronta para arquivar em papel. Para guardar em arquivo, escolha Salvar como PDF na janela de impressão.",
          },
        ],
      },
    ],
  },

  // ============================ Atender ============================
  {
    id: "manutencao-atender",
    grupo: "manutencao",
    modulo: "manutencao",
    para: "atenderRequisicoes",
    titulo: "Atender requisições",
    resumo: "Para a equipe da manutenção: assumir, mudar o status, agendar, lançar horas, checklist, fotos do serviço e concluir",
    // A página de uma requisição: para quem atende, o "?" abre esta seção (os outros vão para Acompanhar)
    rotas: ["/requisicoes/*"],
    topicos: [
      {
        id: "caminho",
        titulo: "O caminho de uma requisição",
        palavras: ["fluxo", "etapas", "rotina", "como atender", "passo a passo"],
        blocos: [
          {
            tipo: "passos",
            itens: [
              "A requisição chega com status Aberta: aviso no celular e o número em Aguardando análise, no Início.",
              "Quem vai atender assume: em Responsável, escolha o seu nome e mude o status para Em análise (ou direto para Em andamento).",
              "Precisa de data? Escolha Agendada e preencha a Data agendada. Falta peça? Aguardando peças.",
              "Durante o serviço: Em andamento. Lance as horas, marque o checklist e tire fotos do serviço.",
              "Terminou: mude para Concluída e descreva o Serviço realizado.",
            ],
          },
          { tipo: "dica", texto: "Mantenha o status em dia: a cada mudança, quem abriu é avisado e sabe onde está o pedido." },
          {
            tipo: "imagem",
            imagem: {
              arquivo: "manutencao/requisicao-atender.webp",
              legenda: "Página da requisição no computador, com o quadro Atualizar requisição à direita",
              rota: "/requisicoes",
              perfil: "manutentor",
              tela: "computador",
              acoes: [{ clicar: "text=Serra com vibração excessiva" }],
            },
          },
        ],
      },
      {
        id: "atualizar",
        titulo: "Atualizar a requisição",
        palavras: ["status", "mudar status", "responsavel", "assumir", "atribuir", "passar para", "agendar", "data agendada", "adiar", "observacao", "salvar"],
        blocos: [
          {
            tipo: "texto",
            texto: "Na página da requisição, use o quadro Atualizar requisição: à direita no computador, no fim da página no celular. Mude o que precisar e toque em Salvar.",
          },
          {
            tipo: "termos",
            itens: [
              ["Status", "O novo status. Quem abriu é avisado de cada mudança. Ao passar para Em andamento pela primeira vez, a hora fica como Início da execução. Cancelada só aparece para supervisor e gerente."],
              [
                "Responsável",
                "Supervisor e gerente escolhem qualquer supervisor ou manutentor, e a pessoa é avisada (… atribuída a você). O manutentor só assume para si (o nome dele aparece com “(eu)”) ou larga a requisição, voltando para — Não atribuído —.",
              ],
              ["Data agendada", "Obrigatória para Agendada. No dia, às 7h, o responsável recebe o lembrete."],
              ["Serviço realizado", "O que foi feito. Obrigatório para Concluída."],
              ["Máquina parada", "Marque se a máquina está parada e ajuste os horários (veja o tópico abaixo)."],
              ["Observação / motivo", "Fica no histórico. Obrigatório para Adiada e Cancelada."],
            ],
          },
          { tipo: "texto", texto: "Se faltar algo, a requisição não é salva e aparece o motivo no quadro:" },
          {
            tipo: "termos",
            itens: [
              ["Informe a data agendada", "Escolheu Agendada sem preencher a Data agendada."],
              ["Informe o motivo do adiamento / Informe o motivo do cancelamento", "Escreva o motivo em Observação / motivo."],
              ["Descreva o serviço realizado para concluir", "Preencha Serviço realizado antes de escolher Concluída."],
              ["Conclua o checklist antes de finalizar (… pendentes)", "Ainda há item do checklist sem marcar."],
              ["Você só pode assumir a requisição para você", "O manutentor tentou passar a requisição para outra pessoa. Peça a um supervisor."],
              ["O fim da parada não pode ser antes do início / O início da parada não pode ser no futuro", "Confira Parada desde e Voltou a operar em."],
            ],
          },
        ],
      },
      {
        id: "maquina-parada",
        titulo: "Máquina parada e Máquina liberada",
        palavras: ["parada", "maquina parada", "maquina liberada", "voltou a operar", "tempo parado", "liberar", "serraria", "boletim"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "No quadro Atualizar requisição, marque ou desmarque Máquina parada e ajuste Parada desde e Voltou a operar em. Se Voltou a operar em ficar vazio, ao concluir o sistema usa a hora da conclusão.",
          },
          {
            tipo: "texto",
            texto:
              "Máquina da linha da serraria: aparece também Falha (boletim da serraria), com Mecânica ou Elétrica. Escolha antes de salvar a parada pela primeira vez; depois, o tipo fica fixo. Corrigir Parada desde ou Voltou a operar em corrige também o boletim da serraria, e a serraria é avisada.",
          },
          {
            tipo: "texto",
            texto:
              "Nas máquinas da linha, enquanto a máquina está parada, a faixa vermelha no alto da página tem o botão Máquina liberada (o mesmo do quadro Máquinas paradas agora, no Início). Toque nele quando a máquina voltar a funcionar e confirme em OK: o tempo parado vai para o boletim da serraria. Ele não aparece em requisição concluída ou cancelada, nem nas máquinas fora da linha: nelas, preencha Voltou a operar em ou conclua.",
          },
          {
            tipo: "texto",
            texto:
              "Se foi a serraria que liberou a máquina, a requisição continua com você: o responsável (sem responsável, os supervisores) recebe o aviso ✅ Máquina liberada · #…, a lista mostra o selo verde Máquina liberada, o Início mostra a requisição em Máquina liberada: conferir e concluir e a página diz A máquina já voltou a operar: confira o serviço e conclua a requisição.",
          },
          {
            tipo: "texto",
            texto:
              "A serraria também fica sabendo: os supervisores da serraria e quem marcou a parada recebem ✅ Máquina liberada · (máquina) quando alguém toca em Máquina liberada, e ✅ Máquina liberada pela manutenção · (máquina) quando a parada é fechada pelo quadro Atualizar requisição (Voltou a operar em ou a conclusão). Se você corrigir os horários de uma parada já fechada, eles recebem ⏱ Parada corrigida pela manutenção, e o boletim é refeito.",
          },
          { tipo: "dica", texto: "O caminho completo entre os dois módulos está em “Máquina parada: Serraria e Manutenção” (/ajuda/manutencao-maquina-parada)." },
        ],
      },
      {
        id: "horas",
        titulo: "Lançar horas trabalhadas",
        palavras: ["horas", "apontar horas", "hora trabalhada", "tempo de servico", "mao de obra", "apagar horas"],
        blocos: [
          {
            tipo: "passos",
            itens: [
              "Na seção Horas trabalhadas, informe Quando começou e o tempo em Horas e Minutos.",
              "Se quiser, descreva o trabalho em O que foi feito (opcional).",
              "Toque em Registrar horas.",
            ],
          },
          {
            tipo: "texto",
            texto:
              "Lance uma vez para cada período trabalhado: o total aparece no alto da seção, na ficha do equipamento e nos indicadores. Supervisor e gerente escolhem em Quem trabalhou para lançar no nome de outra pessoa.",
          },
          {
            tipo: "texto",
            texto: "Para corrigir, apague o lançamento na lixeira e lance de novo. Cada um apaga os seus; supervisor e gerente apagam qualquer um.",
          },
          { tipo: "atencao", texto: "No máximo 24 horas por lançamento, e a data não pode estar no futuro." },
        ],
      },
      {
        id: "checklist",
        titulo: "Checklist",
        palavras: ["checklist", "lista de verificacao", "itens", "marcar item", "aplicar checklist"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "Se a requisição tem checklist (as preventivas dos planos podem vir com um), toque em cada item quando fizer: ele fica riscado, com o seu nome e a hora. Toque de novo para desmarcar. A contagem (ex.: 3 de 5) aparece no alto.",
          },
          {
            tipo: "passos",
            itens: [
              "Para incluir um checklist, escolha o modelo em Aplicar checklist (ou Adicionar outro checklist, se já houver um).",
              "Toque em Aplicar.",
            ],
          },
          { tipo: "atencao", texto: "A requisição só pode ser concluída com todos os itens marcados. Depois de concluída ou cancelada, o checklist não muda mais." },
        ],
      },
      {
        id: "concluir",
        titulo: "Concluir",
        palavras: ["concluir", "finalizar", "encerrar", "fechar", "terminar", "servico realizado", "foto do servico"],
        blocos: [
          {
            tipo: "passos",
            itens: [
              "Tire fotos do serviço pronto: no quadro Fotos, escolha Do serviço realizado, adicione as fotos e toque em Enviar fotos.",
              "Confira se todos os itens do checklist estão marcados e se as horas foram lançadas.",
              "No quadro Atualizar requisição, mude o Status para Concluída.",
              "Descreva em Serviço realizado o que foi feito e toque em Salvar.",
            ],
          },
          {
            tipo: "texto",
            texto:
              "Quem abriu é avisado. Se a máquina ainda estava parada, a parada termina na hora da conclusão (ou na que você informar em Voltou a operar em). Numa máquina da linha, o tempo vai para o boletim, e os supervisores da serraria e quem marcou a parada recebem o aviso Máquina liberada pela manutenção.",
          },
          {
            tipo: "texto",
            texto:
              "Não salvou? Descreva o serviço realizado para concluir pede o Serviço realizado; Conclua o checklist antes de finalizar (… pendentes) pede os itens que faltam no checklist.",
          },
          {
            tipo: "dica",
            texto:
              "Depois de concluída, a equipe ainda pode anexar fotos (por exemplo, a do serviço pronto) e comentar. Quem abriu e não é da equipe já não comenta nem envia fotos: os campos somem para ele.",
          },
        ],
      },
      {
        id: "cancelar",
        titulo: "Cancelar uma requisição",
        para: "cancelarRequisicoes",
        palavras: ["cancelar", "cancelada", "repetida", "duplicada", "engano"],
        blocos: [
          {
            tipo: "passos",
            itens: [
              "No quadro Atualizar requisição, escolha o Status Cancelada.",
              "Escreva o motivo em Observação / motivo (obrigatório).",
              "Toque em Salvar. Quem abriu é avisado.",
            ],
          },
          {
            tipo: "texto",
            texto:
              "Com a máquina ainda parada: se a parada foi aberta pela própria requisição, ela é desfeita junto, e o histórico registra Máquina parada desfeita: a requisição foi cancelada antes de a máquina voltar a operar. Se foi marcada na serraria pelo Máquina parou, ela continua aberta lá até a serraria tocar em Máquina liberada: os supervisores da serraria e quem marcou a parada recebem o aviso … cancelada · (máquina).",
          },
          { tipo: "dica", texto: "Requisição cancelada fica fora dos indicadores da manutenção. Para desfazer, mude o status de novo." },
        ],
      },
    ],
  },

  // ============================ Máquina parada (os dois módulos) ============================
  {
    id: "manutencao-maquina-parada",
    grupo: "manutencao",
    modulo: "manutencao",
    titulo: "Máquina parada: Serraria e Manutenção",
    resumo: "Do botão Máquina parou na serraria até o tempo parado no boletim, passando pela requisição",
    topicos: [
      {
        id: "caminho",
        titulo: "O caminho completo",
        palavras: ["maquina parou", "maquina parada", "parada", "serraria", "boletim", "integracao", "fluxo", "maquina liberada"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "Quando uma máquina da linha da serraria para por falha mecânica ou elétrica, a serraria e a manutenção trabalham na mesma parada: a serraria marca, a manutenção conserta e o tempo parado vai sozinho para o boletim do dia.",
          },
          {
            tipo: "passos",
            itens: [
              "Serraria: em Paradas de máquina, alguém toca em Máquina parou, escolhe a máquina, o motivo e o Tipo da falha e toca em Marcar parada agora. O cronômetro começa.",
              ATIVA
                ? "Falha mecânica ou elétrica: na mesma hora o sistema abre uma requisição Corretiva, de prioridade Alta, com máquina parada, local Serraria e o título Máquina parada: (nome da máquina). Supervisores, manutentores e o gerente recebem o aviso, e a tela de paradas mostra Parada marcada. A manutenção foi avisada. Falha operacional não abre requisição."
                : "Falha mecânica ou elétrica: na mesma hora o sistema abre uma requisição Corretiva, de prioridade Alta, com máquina parada, local Serraria e o título Máquina parada: (nome da máquina). Falha operacional não abre requisição. Enquanto a Manutenção está em teste, ninguém da manutenção recebe o aviso, e a tela de paradas mostra Parada marcada. O cronômetro está correndo. Avise a manutenção: chame a manutenção pessoalmente.",
              "Manutenção: a máquina aparece em Máquinas paradas agora, no Início, e a requisição tem o selo vermelho Parada na lista. Quem vai atender assume a requisição e trabalha nela normalmente.",
              "A máquina voltou a funcionar: qualquer um dos dois lados toca em Máquina liberada. Na serraria, em Paradas de máquina; na manutenção, no Início ou na faixa vermelha da requisição. Também vale a manutenção concluir a requisição ou preencher Voltou a operar em.",
              "O tempo parado vai para o boletim, só a parte dentro do turno da serraria. Se a parada passou de um dia para outro, cada dia recebe a sua parte; dia útil sem boletim ganha um, aberto sozinho.",
              "Se a serraria liberou, a requisição continua com a manutenção: o responsável (sem responsável, os supervisores da manutenção) recebe o aviso ✅ Máquina liberada · #… para conferir e concluir, a lista mostra o selo verde Máquina liberada e o Início mostra a requisição em Máquina liberada: conferir e concluir.",
              "Se a manutenção concluiu a requisição (ou informou a hora em que a máquina voltou), os supervisores da serraria e quem marcou a parada recebem o aviso ✅ Máquina liberada pela manutenção · (máquina).",
            ],
          },
          {
            tipo: "dica",
            texto: "Na serraria, o passo a passo do botão está em “Paradas de máquina” (/ajuda/serraria-paradas). Na manutenção, em “Atender requisições” (/ajuda/manutencao-atender#maquina-parada).",
          },
          {
            tipo: "imagem",
            imagem: {
              arquivo: "manutencao/maquina-parou.webp",
              legenda: "Na serraria: o quadro do botão Máquina parou",
              rota: "/producao/paradas",
              perfil: "supervisor",
              acoes: [{ clicar: "role=button[name='Máquina parou']" }],
            },
          },
        ],
      },
      {
        id: "pela-manutencao",
        titulo: "Parada aberta pela manutenção",
        palavras: ["a maquina esta parada", "requisicao com maquina parada", "linha da serraria", "parada pela requisicao"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "O caminho também vale ao contrário. Ao abrir uma requisição com A máquina está parada numa máquina da linha da serraria (com o Tipo da falha Mecânica ou Elétrica), a parada aparece na hora na tela Paradas de máquina da serraria, como aberta numa requisição de manutenção. Quando a máquina voltar, o tempo vai para o boletim do mesmo jeito.",
          },
          {
            tipo: "texto",
            texto:
              "No cartão da serraria, essa parada aparece com Marcada na requisição #… por (nome de quem marcou). A serraria pode liberar a máquina por lá, como qualquer outra parada.",
          },
          {
            tipo: "texto",
            texto:
              "No quadro Atualizar requisição, marcar Máquina parada cria essa parada e desmarcar a desfaz; a parada marcada pela serraria continua, porque quem parou foi a linha. Corrigir Parada desde ou Voltou a operar em corrige o boletim, e a serraria recebe ⏱ Parada corrigida pela manutenção.",
          },
        ],
      },
      {
        id: "engano",
        titulo: "Parada marcada por engano e requisição cancelada",
        palavras: ["engano", "excluir parada", "lixeira", "cancelar", "cancelada", "marcou errado"],
        blocos: [
          {
            tipo: "termos",
            itens: [
              [
                "Parada marcada por engano",
                "O supervisor da serraria exclui a parada na lixeira, em Paradas agora, e confirma. A requisição é cancelada sozinha só quando a parada foi marcada no Máquina parou e a requisição ainda está Aberta, sem responsável e sem horas lançadas: o histórico registra requisição cancelada automaticamente, e quem recebeu o aviso da requisição nova recebe … cancelada · parada marcada por engano.",
              ],
              [
                "Alguém da manutenção já assumiu",
                "Se a requisição já tem responsável, horas ou outro status (ou se a parada foi aberta na própria requisição), ela continua com a manutenção, só sem a marcação de máquina parada. O responsável (sem responsável, os supervisores) recebe … parada excluída na serraria.",
              ],
              [
                "Requisição cancelada com a máquina parada",
                "A parada aberta pela própria requisição é desfeita. A parada marcada na serraria continua correndo: os supervisores da serraria e quem marcou recebem … cancelada · (máquina) e tocam em Máquina liberada quando a máquina voltar. A página da requisição avisa: Requisição encerrada: a parada continua aberta na serraria até a serraria liberar a máquina.",
              ],
            ],
          },
          {
            tipo: "dica",
            texto: "Antes de excluir, a serraria vê a pergunta “Excluir a parada de (máquina)? Use só se foi marcada por engano.”, que diz também o que vai acontecer com a requisição.",
          },
        ],
      },
      {
        id: "boletim",
        titulo: "No boletim da serraria",
        modulo: "producao",
        palavras: ["boletim", "parada no boletim", "abrir requisicao", "tempo parado no boletim"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "Cada parada liberada vira uma linha no boletim do dia, com Marcada na hora: início → fim (só o tempo dentro do turno conta) e o selo Requisição #000…, quando houver. O formulário do boletim não edita nem apaga essas linhas: corrija na tela de paradas ou na requisição.",
          },
          {
            tipo: "texto",
            texto:
              "Parada mecânica ou elétrica lançada à mão no boletim, sem requisição, tem o botão Abrir requisição (para quem lança na serraria e usa a Manutenção). Ele abre uma requisição Corretiva de prioridade Alta já ligada à parada, sem marcar máquina parada, porque o tempo já está no boletim.",
          },
          { tipo: "dica", texto: "Veja também “Boletim do dia” (/ajuda/serraria-boletins)." },
        ],
      },
      {
        id: "maquinas-da-linha",
        titulo: "Quais máquinas entram",
        palavras: ["maquina da linha", "linha da serraria", "equipamento", "cadastro", "na linha", "fora da linha", "motivo de parada", "estufa"],
        blocos: [
          { tipo: "texto", texto: "Só as máquinas marcadas como da linha da serraria aparecem no botão Máquina parou e levam a parada ao boletim. Dá para marcar nos dois módulos:" },
          {
            tipo: "termos",
            itens: [
              [
                "Na Manutenção",
                "Equipamentos → abra a máquina → Editar dados do equipamento → marque Máquina da linha da serraria → Salvar (manutentor, supervisor e gerente).",
              ],
              [
                "Na Serraria",
                "Cadastros → Máquinas da linha → toque em Fora da linha para pôr a máquina na linha (o botão vira Na linha ✓); toque de novo para tirar (supervisor da serraria e gerente).",
              ],
            ],
          },
          {
            tipo: "texto",
            texto:
              "Nos Cadastros da Serraria, cada motivo de parada pode ser ligado a uma máquina (o motivo aparece primeiro quando ela para), e cada estufa tem o campo Equipamento (manutenção), que diz qual equipamento da manutenção é aquela estufa.",
          },
        ],
      },
      {
        id: "quem-ve",
        titulo: "Quem vê e quem faz o quê",
        palavras: ["acesso", "permissao", "sem acesso", "apontador", "quem pode liberar", "quem pode excluir"],
        blocos: [
          {
            tipo: "lista",
            itens: [
              "Marcar e liberar paradas na serraria: quem lança na serraria (apontador e supervisor) e o gerente.",
              "Excluir uma parada marcada por engano: só o supervisor da serraria e o gerente.",
              "Máquina liberada na Manutenção: manutentor, supervisor e gerente. O operador acompanha a requisição.",
              ATIVA
                ? "Quem não usa a Manutenção vê na tela de paradas só o número da requisição (ex.: Manutenção avisada · #00012), sem abrir."
                : "Quem não usa a Manutenção vê na tela de paradas só o número da requisição (ex.: Requisição #00012), sem abrir.",
            ],
          },
        ],
      },
    ],
  },

  // ============================ Agenda ============================
  {
    id: "manutencao-agenda",
    grupo: "manutencao",
    modulo: "manutencao",
    titulo: "Agenda",
    resumo: "As manutenções com data marcada, dia a dia, e as que passaram da data",
    rotas: ["/agenda"],
    topicos: [
      {
        id: "ver",
        titulo: "Ver a agenda",
        palavras: ["agenda", "calendario", "programacao", "agendadas", "atrasadas", "vencidas", "hoje", "semana"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "Agenda (barra de baixo do celular, ou menu Operação no computador) abre a Agenda de manutenção: as requisições com status Agendada, separadas por dia, a partir de hoje. Cada dia tem um título como Sábado, 14 de novembro (com o ano, quando não é o ano atual). Toque numa requisição para abrir.",
          },
          {
            tipo: "texto",
            texto:
              "No alto, em vermelho, ficam as Agendadas com data vencida: passaram da data e ainda estão como Agendada. Atualize cada uma: Em andamento, Concluída ou uma nova data. Sem nada marcado, aparece Nenhuma manutenção agendada.",
          },
          { tipo: "texto", texto: "Só entram requisições com status Agendada: quando ela passa para Em andamento, sai da agenda." },
          {
            tipo: "imagem",
            imagem: { arquivo: "manutencao/agenda.webp", legenda: "Agenda de manutenção no celular", rota: "/agenda", perfil: "manutentor" },
          },
        ],
      },
      {
        id: "agendar",
        titulo: "Agendar uma requisição",
        para: "atenderRequisicoes",
        palavras: ["agendar", "marcar data", "data agendada", "lembrete"],
        blocos: [
          {
            tipo: "passos",
            itens: [
              "Abra a requisição.",
              "No quadro Atualizar requisição, escolha o Status Agendada e preencha a Data agendada (dia e hora).",
              "Toque em Salvar.",
            ],
          },
          {
            tipo: "texto",
            texto:
              "Quem abriu é avisado com a data. No dia, às 7h, o responsável (sem responsável, os supervisores) e quem abriu recebem o lembrete. Mudou a data? O lembrete vale para o dia novo. As preventivas geradas pelos planos já chegam agendadas.",
          },
          ...se(!ATIVA, { tipo: "atencao", texto: "Enquanto a Manutenção está em teste, o lembrete das 7h não é enviado." }),
        ],
      },
    ],
  },

  // ============================ Preventivas e checklists ============================
  {
    id: "manutencao-preventivas",
    grupo: "manutencao",
    modulo: "manutencao",
    para: "preventivas",
    titulo: "Preventivas e checklists",
    resumo: "Planos que criam sozinhos as manutenções que se repetem, e as listas de verificação",
    rotas: ["/preventivas", "/checklists"],
    topicos: [
      {
        id: "como-funciona",
        titulo: "Como funcionam as preventivas",
        palavras: ["preventiva", "plano", "plano de preventiva", "programada", "periodica", "recorrente", "automatica"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "Um plano de preventiva diz o que fazer, em qual equipamento e de quanto em quanto tempo. Todo dia às 7h o sistema cria as requisições dos planos que estão dentro da antecedência: tipo Preventiva, já Agendada para a data, com o responsável e o checklist do plano. O responsável (sem responsável, os supervisores) é avisado, e a próxima execução do plano avança sozinha.",
          },
          { tipo: "texto", texto: "Se um plano ficou muito tempo sem gerar, o sistema não cria várias atrasadas: cria só a da vez e segue." },
          ...se(
            !ATIVA,
            {
              tipo: "atencao",
              texto: "Enquanto a Manutenção está em teste, os planos não geram as requisições sozinhos: só pelo Gerar agora. Depois da liberação, cada plano gera só a da vez.",
            },
          ),
          {
            tipo: "imagem",
            imagem: { arquivo: "manutencao/preventivas.webp", legenda: "Preventivas: o quadro Novo plano de preventiva e a lista de planos", rota: "/preventivas", perfil: "supervisor" },
          },
        ],
      },
      {
        id: "novo-plano",
        titulo: "Criar um plano de preventiva",
        palavras: ["novo plano", "criar plano", "frequencia", "repetir", "antecedencia", "proxima execucao"],
        blocos: [
          {
            tipo: "passos",
            itens: [
              "Em Preventivas (menu Cadastros), toque em Novo plano de preventiva. Pela ficha do equipamento, + Novo plano já abre com a máquina escolhida.",
              "Escolha o Equipamento e escreva O que será feito (ex.: Troca de óleo e filtros). Em Instruções, detalhes para o manutentor.",
              "Em Repetir a cada, informe o número e escolha dias, semanas ou meses.",
              "Em Próxima execução, a data e a hora da próxima vez.",
              "Em Gerar a requisição com antecedência de, quantos dias antes a requisição deve aparecer (o padrão é 3).",
              "Escolha a Prioridade, o Responsável (ou — Supervisores decidem —) e o Checklist.",
              "Toque em Criar plano.",
            ],
          },
        ],
      },
      {
        id: "alterar-plano",
        titulo: "Alterar, gerar agora ou pausar",
        palavras: ["editar plano", "alterar plano", "gerar agora", "pausar", "pausado", "desativar plano", "ultima gerada"],
        blocos: [
          { tipo: "texto", texto: "Toque num plano da lista para abrir. Altere os campos e toque em Salvar." },
          {
            tipo: "termos",
            itens: [
              ["Gerar agora", "Cria já a requisição da próxima execução, sem esperar a antecedência. Aparece o número da requisição gerada (ex.: Gerada #00012)."],
              ["Última gerada", "Abre a última requisição criada pelo plano."],
              ["Ativo", "Desmarque e salve para suspender o plano sem apagar: ele fica Pausado e não gera mais nada."],
              ["Próxima em vermelho", "A data da próxima execução já passou."],
            ],
          },
        ],
      },
      {
        id: "checklists",
        titulo: "Checklists",
        rotas: ["/checklists"],
        palavras: ["checklist", "lista de verificacao", "modelo de checklist", "itens", "novo checklist"],
        blocos: [
          {
            tipo: "passos",
            itens: [
              "Em Checklists (menu Cadastros), toque em Novo checklist.",
              "Dê um Nome (ex.: Preventiva mensal – serra circular).",
              "Em Itens (um por linha), escreva um item em cada linha.",
              "Toque em Criar checklist.",
            ],
          },
          {
            tipo: "texto",
            texto:
              "Para mudar, toque no checklist, altere e toque em Salvar. Desmarque Ativo para ele não aparecer mais nas escolhas. Mudar um checklist não altera as requisições que já o receberam: cada requisição guarda a sua cópia.",
          },
          {
            tipo: "texto",
            texto: "O checklist entra na requisição pelo plano de preventiva ou pelo Aplicar checklist da página da requisição: veja “Atender requisições” (/ajuda/manutencao-atender#checklist).",
          },
        ],
      },
    ],
  },

  // ============================ Equipamentos ============================
  {
    id: "manutencao-equipamentos",
    grupo: "manutencao",
    modulo: "manutencao",
    para: "equipamentos",
    titulo: "Equipamentos e etiquetas QR",
    resumo: "Cadastrar as máquinas, a ficha com o histórico e as etiquetas QR para colar nelas",
    rotas: ["/equipamentos"],
    topicos: [
      {
        id: "cadastrar",
        titulo: "Cadastrar um equipamento",
        palavras: ["maquina", "cadastro", "novo equipamento", "cadastrar maquina", "tag", "codigo", "patrimonio"],
        blocos: [
          {
            tipo: "passos",
            itens: [
              "Em Equipamentos (menu Cadastros), toque em Cadastrar equipamento.",
              "Preencha o Código / TAG (ex.: LIX-02) e o Nome, e escolha o Setor. Fabricante, Modelo, Nº de série e Observações são opcionais, mas ajudam.",
              "Se a máquina é da linha da serraria, marque Máquina da linha da serraria: ela passa a aparecer no botão Máquina parou e as paradas dela entram no boletim.",
              "Toque em Cadastrar.",
            ],
          },
          {
            tipo: "dica",
            texto:
              "Use códigos curtos e únicos, como os do patrimônio. O código é guardado em letras maiúsculas, sai na etiqueta e serve para buscar a máquina. Código repetido é recusado, mesmo com maiúsculas e minúsculas diferentes: aparece Já existe um equipamento com este código.",
          },
        ],
      },
      {
        id: "lista",
        titulo: "Lista e busca",
        palavras: ["buscar equipamento", "procurar maquina", "lista de maquinas", "parada", "inativo"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "A lista mostra cada equipamento com o setor, quantas requisições teve, quantas estão pendentes e quantos planos de preventiva tem. Máquina parada agora aparece com o selo vermelho Parada. Para achar uma máquina, digite em Buscar por código ou nome….",
          },
          {
            tipo: "imagem",
            imagem: { arquivo: "manutencao/equipamentos.webp", legenda: "Lista de equipamentos no celular", rota: "/equipamentos", perfil: "supervisor" },
          },
        ],
      },
      {
        id: "ficha",
        titulo: "Ficha do equipamento",
        // A página de um equipamento (as etiquetas têm rota própria, mais longa)
        rotas: ["/equipamentos/*"],
        palavras: ["ficha", "historico da maquina", "falhas", "tempo parado", "horas de manutencao", "editar equipamento", "desativar"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "Toque num equipamento para ver a ficha: os dados, os números (Requisições, Falhas (corretivas), Tempo parado e Horas de manutenção), quantas estão pendentes, a data da última falha, os planos de preventiva, o QR Code e o Histórico de manutenção. Requisições canceladas não contam como falha nem como tempo parado.",
          },
          {
            tipo: "termos",
            itens: [
              ["Requisição", "Abre uma requisição nova já com este equipamento."],
              ["Imprimir etiqueta", "A etiqueta QR só desta máquina."],
              ["+ Novo plano", "Plano de preventiva já com esta máquina (supervisor e gerente)."],
              ["Editar dados do equipamento", "Altera o cadastro. Desmarque Ativo para tirar a máquina de uso: ela some das escolhas, e o histórico continua."],
            ],
          },
        ],
      },
      {
        id: "etiquetas",
        titulo: "Imprimir as etiquetas QR",
        rotas: ["/equipamentos/etiquetas"],
        palavras: ["etiqueta", "etiquetas", "qr", "qr code", "imprimir etiqueta", "adesivo", "colar na maquina"],
        blocos: [
          {
            tipo: "passos",
            itens: [
              "Em Equipamentos, toque em Etiquetas QR. Para um setor só, escolha o Setor e toque em Filtrar. Para uma máquina só, use Imprimir etiqueta na ficha dela.",
              "Toque em Imprimir etiquetas. Sai em folha A4, 3 etiquetas por linha, só das máquinas ativas.",
              "Recorte e cole cada etiqueta num lugar visível da máquina.",
            ],
          },
          { tipo: "texto", texto: "Lido com a câmera do celular, o QR abre a página da máquina para abrir uma requisição: veja Pelo QR Code da máquina (/ajuda/manutencao-abrir#qr)." },
          { tipo: "dica", texto: "Papel adesivo ou etiqueta plastificada dura mais no chão de fábrica." },
        ],
      },
    ],
  },

  // ============================ Indicadores e relatórios ============================
  {
    id: "manutencao-indicadores",
    grupo: "manutencao",
    modulo: "manutencao",
    para: "relatorios",
    titulo: "Indicadores e relatórios da manutenção",
    resumo: "Disponibilidade, MTTR, MTBF e outros números do período, e relatórios em PDF e Excel",
    rotas: ["/indicadores", "/relatorios"],
    topicos: [
      {
        id: "painel",
        titulo: "Painel de indicadores",
        rotas: ["/indicadores"],
        palavras: ["indicadores", "kpi", "disponibilidade", "mttr", "mtbf", "tempo parado", "grafico", "desempenho", "resultado"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "Em Indicadores (menu Gestão), escolha o período (30 dias, 90 dias, 6 meses ou 12 meses; o padrão é 90 dias) e, se quiser, um setor, e toque em Aplicar. Toque nas colunas do gráfico para ver os números, ou em Ver tabela para os valores exatos.",
          },
          {
            tipo: "termos",
            itens: [
              ["Disponibilidade", "Parte do tempo em que as máquinas ativas não estavam paradas."],
              ["Tempo parado", "Soma das paradas de máquina no período, incluindo as que ainda estão abertas."],
              ["MTTR · tempo médio de reparo", "Quanto dura, em média, uma parada de máquina. Quanto menor, melhor."],
              ["MTBF · tempo entre falhas", "Tempo médio de funcionamento entre uma falha (corretiva) e outra. Quanto maior, melhor."],
              ["Tempo médio de atendimento", "Da abertura até a conclusão da requisição."],
              ["Preventivas no prazo", "Preventivas concluídas até o dia agendado, entre as previstas no período."],
              ["Horas de manutenção", "Horas lançadas nas requisições no período."],
              ["Pendentes agora", "Requisições que ainda não foram concluídas nem canceladas."],
            ],
          },
          {
            tipo: "lista",
            itens: [
              "Requisições abertas por mês, por tipo (corretiva, preventiva, preditiva ou melhoria).",
              "Equipamentos com mais falhas e com mais tempo parado: toque num equipamento para abrir a ficha.",
              "Horas por manutentor e requisições por setor.",
            ],
          },
          {
            tipo: "texto",
            texto:
              "Requisições canceladas ficam fora de todas as contas: não contam como falha, tempo parado, MTBF, tempo de atendimento nem nos gráficos. A nota de Pendentes agora mostra quantas foram abertas no período e quantas canceladas ficaram fora da conta.",
          },
          {
            tipo: "atencao",
            texto:
              "Os números de parada dependem de marcar a máquina parada nas requisições (ou do botão Máquina parou da serraria). Sem essa marcação, a disponibilidade aparece maior do que a real.",
          },
          {
            tipo: "imagem",
            imagem: { arquivo: "manutencao/indicadores.webp", legenda: "Indicadores da manutenção no computador", rota: "/indicadores", perfil: "gerente", tela: "computador" },
          },
        ],
      },
      {
        id: "relatorios",
        titulo: "Relatórios em PDF e Excel",
        rotas: ["/relatorios"],
        palavras: ["relatorio", "pdf", "excel", "planilha", "exportar", "imprimir relatorio", "periodo"],
        blocos: [
          {
            tipo: "passos",
            itens: [
              "Em Relatórios (menu Gestão), escolha o período em De e Até (conta a data de abertura; o padrão é do dia 1º do mês até hoje) e, se quiser, Status, Tipo, Prioridade e Setor.",
              "Toque em Gerar relatório para ver na tela os totais, os gráficos por status, tipo e setor e a lista das requisições.",
              "Exportar PDF abre a impressão: escolha Salvar como PDF. Exportar Excel baixa a planilha, com as abas Requisições e Resumo.",
            ],
          },
          { tipo: "dica", texto: "Limpar volta aos filtros padrão." },
        ],
      },
    ],
  },

  // ============================ Setores ============================
  {
    id: "manutencao-setores",
    grupo: "manutencao",
    modulo: "manutencao",
    para: "setores",
    titulo: "Setores",
    resumo: "Criar e renomear os setores da empresa",
    rotas: ["/setores"],
    topicos: [
      {
        id: "setores",
        titulo: "Criar e renomear setores",
        palavras: ["setor", "setores", "area", "departamento", "galpao", "renomear"],
        blocos: [
          {
            tipo: "texto",
            texto:
              "Cada equipamento pertence a um setor, e a requisição recebe o setor do equipamento (quem abre pode trocar). O setor filtra a lista de requisições, as etiquetas QR, os indicadores e os relatórios.",
          },
          {
            tipo: "passos",
            itens: [
              "Em Setores (menu Cadastros), escreva o nome em Novo setor e toque em Adicionar.",
              "Para renomear, toque no setor, mude o nome e toque em Salvar.",
            ],
          },
          {
            tipo: "texto",
            texto:
              "Nome repetido é recusado, mesmo com maiúsculas e minúsculas diferentes (Setor e setor são o mesmo): aparece Setor já cadastrado. Cada setor mostra quantos equipamentos e requisições tem. Setores não são apagados: se precisar, renomeie.",
          },
        ],
      },
    ],
  },
];
