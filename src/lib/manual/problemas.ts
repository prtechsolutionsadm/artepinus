import { MODULOS_ATIVOS } from "@/lib/permissoes";
import type { Bloco, Problema } from "./tipos";

// Problemas comuns (/ajuda/problemas): cada um escrito como o que a pessoa vê na tela, com as mensagens
// e os botões exatos (conferidos no código: SincronizadorOffline, BotaoSair, Escaner, AtivarPush, auth,
// FormRecuperar, error.tsx, pdf-cliente, PainelParadas, ApontamentoSerraria, actions de requisições).
// Mudou a mensagem na tela? Mude aqui. Ids são âncoras (/ajuda/problemas#<id>) usadas pelas telas
// (SincronizadorOffline, Escaner, páginas de etiquetas) e pelo resto do manual: fila-offline, recusado,
// camera-bloqueada, leitor-iphone, etiquetas, sem-conexao, maquina-nao-aparece e outros. Não troque um id.

/** Com a Manutenção ainda em teste, ela aparece como "Em breve" e ninguém recebe os avisos dela. */
const MANUTENCAO_ATIVA = MODULOS_ATIVOS.includes("manutencao");

const texto = (t: string): Bloco => ({ tipo: "texto", texto: t });
const passos = (...itens: string[]): Bloco => ({ tipo: "passos", itens });
const lista = (...itens: string[]): Bloco => ({ tipo: "lista", itens });
const dica = (t: string): Bloco => ({ tipo: "dica", texto: t });
const atencao = (t: string): Bloco => ({ tipo: "atencao", texto: t });
const termos = (...itens: [string, string][]): Bloco => ({ tipo: "termos", itens });

const SEM_INTERNET = "Veja “Trabalhar sem internet” (/ajuda/sem-internet).";

/** Vale para todos (os dois módulos). */
const GERAIS: Problema[] = [
  {
    id: "fila-offline",
    pergunta: "Apareceu uma faixa amarela: lançamentos aguardando internet",
    palavras: [
      "faixa",
      "amarela",
      "aguardando",
      "fila",
      "offline",
      "sem internet",
      "pendente",
      "nao enviado",
      "nao sobe",
      "nao envia",
      "enviar agora",
      "guardado no aparelho",
      "sincronizar",
      "sincronizacao",
    ],
    blocos: [
      texto(
        "A faixa no alto da tela mostra o que foi lançado sem internet e ainda está guardado só no aparelho. Nada se perdeu: o sistema envia sozinho quando a conexão volta e tenta de novo a cada minuto.",
      ),
      termos(
        ["… aguardando internet", "O aparelho está sem conexão. Continue trabalhando: o envio é automático."],
        ["… aguardando envio", "A internet voltou e o envio ainda não saiu. Toque em Enviar agora para mandar já."],
        ["… de outro usuário", "Foi lançado por outra pessoa neste aparelho e só vai quando ela entrar com o login dela (veja “Celular usado por várias pessoas” (/ajuda/problemas#aparelho-compartilhado))."],
        ["Ver e Ocultar", "Mostram e escondem a lista do que está guardado, com a data e a hora de cada lançamento."],
      ),
      texto("Quando tudo é enviado, a faixa fica verde por alguns segundos (“… feito sem internet foi enviado”) e some. Se ela ficar vermelha, veja “Faixa vermelha: lançamento recusado” (/ajuda/problemas#recusado)."),
      lista(
        "Sem internet e sem nada guardado, aparece a faixa cinza Sem internet. Continue apontando: os lançamentos ficam guardados e são enviados quando a conexão voltar.",
        "Se o sistema pediu para entrar de novo, o envio espera você entrar com o mesmo login.",
      ),
      atencao("Não toque em Sair enquanto a faixa amarela estiver aparecendo: os seus lançamentos ainda não enviados são apagados do aparelho ao sair."),
      dica(SEM_INTERNET),
    ],
  },
  {
    id: "recusado",
    pergunta: "Apareceu uma faixa vermelha: lançamento recusado pelo servidor",
    palavras: ["vermelha", "recusado", "recusada", "erro ao enviar", "nao enviou", "tentar de novo", "descartar", "lixeira", "motivo", "sem permissao", "dados invalidos"],
    blocos: [
      texto(
        "O lançamento guardado no aparelho chegou ao sistema, mas foi recusado: algum dado não vale (por exemplo, A data não pode ser futura, quando a data do celular está errada, ou Sem permissão, quando o seu perfil mudou). Ele fica parado no aparelho, com o motivo, até você decidir.",
      ),
      passos(
        "Na faixa, toque em Ver. Embaixo de cada item aparece Recusado: e o motivo.",
        "Se a causa já foi resolvida (a data do celular foi acertada, o gerente devolveu a sua permissão…), toque em Tentar de novo.",
        "Se o lançamento não vale mais, toque na lixeira (Descartar) e confirme. Ele é apagado do aparelho e não será enviado.",
        "Precisa dele? Anote os dados antes de descartar e lance de novo, com internet.",
      ),
      atencao("Tentar de novo sem resolver a causa faz o lançamento voltar recusado. Na dúvida, mostre a faixa ao supervisor."),
    ],
  },
  {
    id: "sem-conexao",
    pergunta: "Apareceu “Sem conexão” ou “Algo deu errado”",
    palavras: ["sem conexao", "sem internet", "algo deu errado", "erro", "tela de erro", "nao abre", "tentar de novo", "tentar novamente", "nao foi possivel concluir", "caiu a internet", "sinal fraco"],
    blocos: [
      termos(
        [
          "Sem conexão (tela inteira)",
          "O aparelho está sem internet e esta tela não fica guardada no aparelho (por exemplo, a página de um pacote, de um lote ou de uma requisição). A própria tela mostra os atalhos para as que abrem sem internet. Toque em Tentar novamente quando a conexão voltar.",
        ],
        ["Sem conexão com a internet", "A conexão caiu ao abrir a tela. Confira o Wi-Fi ou os dados móveis e toque em Tentar de novo."],
        [
          "Sem conexão com a internet. Tente de novo quando a conexão voltar.",
          "Aparece ao salvar algo que precisa de internet (corrigir, excluir, formar pacote, liberar a máquina…). O que você digitou continua na tela: toque de novo quando a conexão voltar.",
        ],
        ["Algo deu errado", "O sistema não conseguiu abrir a tela agora. Toque em Tentar de novo. Se continuar, anote a tela e a hora e avise o administrador."],
      ),
      texto("Estas telas abrem sem internet se o app já foi aberto com internet neste aparelho depois de entrar (e você não tocou em Sair depois):"),
      lista(
        "Serraria: Início, Apontar serraria, Nova carga de toras, Inventário do dia, Paradas de máquina e Ler etiqueta (para ver o pacote ou o lote lido, é preciso internet).",
        MANUTENCAO_ATIVA
          ? "Manutenção, para quem usa o módulo: Início e Nova requisição."
          : "Manutenção, para quem usa o módulo (por enquanto, só o administrador): Início e Nova requisição.",
        "Manual: a entrada do manual, Trabalhar sem internet e Problemas comuns; as outras páginas do manual, depois de abertas uma vez com internet neste aparelho.",
      ),
      dica("Sinal fraco: se o envio de uma carga, lote, inventário, parada ou requisição demorar mais de 20 segundos, ele vai para a fila do aparelho e é enviado depois, sem duplicar."),
      dica("Veja Trabalhar sem internet (/ajuda/sem-internet)."),
    ],
  },
  {
    id: "manual-sem-internet",
    pergunta: "O manual (ou uma página dele) não abre sem internet",
    palavras: ["manual", "ajuda", "sem internet", "offline", "nao abre", "sem conexao", "pagina do manual", "interrogacao"],
    blocos: [
      lista(
        "A entrada do manual, Trabalhar sem internet e Problemas comuns ficam guardados no aparelho logo depois de você entrar no sistema com internet.",
        "As outras páginas do manual (seções, Glossário, Roteiros para imprimir) ficam guardadas depois que você as abre uma vez com internet neste aparelho. As imagens das telas também.",
        "Sem internet, o botão ? abre a parte do manual que ele já abriu antes neste aparelho; se ainda não abriu, abre a entrada do manual.",
        "Ao tocar em Sair, as páginas guardadas são apagadas: entre de novo com internet e abra as páginas que vai precisar.",
      ),
      dica("Vai trabalhar num lugar sem sinal? Antes, com internet, abra as partes do manual que costuma usar."),
    ],
  },
  {
    id: "aparelho-compartilhado",
    pergunta: "Celular usado por várias pessoas: a faixa diz “de outro usuário”",
    palavras: ["compartilhado", "celular da empresa", "outro usuario", "trocar de usuario", "varias pessoas", "turno", "login de outro", "aparelho"],
    blocos: [
      texto("Cada lançamento guardado sem internet fica no nome de quem estava logado. Num celular usado por várias pessoas:"),
      lista(
        "O lançamento de outra pessoa só é enviado quando ela entrar no sistema neste aparelho. Em Ver, ele aparece com de (nome): entre com esse login para enviar.",
        "Antes de passar o celular, espere a faixa amarela sumir (tudo enviado) e só então toque em Sair.",
        "Ao sair, o sistema apaga do aparelho as telas guardadas e os lançamentos não enviados de quem saiu. Os das outras pessoas ficam até elas entrarem.",
        "Os avisos (notificações) de quem saiu param de chegar neste aparelho. Quem entrar ativa os dele em Meu perfil.",
      ),
      dica("Cada pessoa usa o próprio login, nunca o de outra: o nome de quem lançou fica registrado em cada lançamento."),
    ],
  },
  {
    id: "sair-com-pendentes",
    pergunta: "Ao tocar em Sair, o sistema avisa que lançamentos serão perdidos",
    palavras: ["sair", "logout", "perdidos", "nao enviados", "sair mesmo assim", "apagar fila"],
    blocos: [
      texto(
        "A mensagem “Há … lançamento(s) seu(s) feito(s) sem internet que ainda não foram enviados. Se sair agora, eles serão perdidos.” quer dizer que ainda há coisa sua guardada só no aparelho.",
      ),
      passos(
        "Toque em Cancelar.",
        "Ligue a internet (Wi-Fi ou dados) e espere a faixa amarela sumir. Se quiser, toque em Enviar agora.",
        "Se a faixa ficou vermelha, resolva antes o recusado (veja “Faixa vermelha: lançamento recusado” (/ajuda/problemas#recusado)).",
        "Com a faixa sumida, toque em Sair.",
      ),
      atencao("Saia sempre com internet: sem conexão, o Sair não se completa."),
    ],
  },
  {
    id: "etiquetas",
    pergunta: "A etiqueta não imprime, sai cortada ou fora do tamanho",
    palavras: ["etiqueta", "imprimir", "impressora", "cortada", "pequena", "grande", "escala", "papel adesivo", "a4", "qr nao le", "margem", "folha"],
    blocos: [
      texto("As etiquetas saem numa folha A4 em pé: 8 por folha nos pacotes (2 × 4), 2 por linha nos lotes e 3 por linha nas máquinas."),
      passos(
        "Na tela das etiquetas, espere aparecerem todos os QR e toque no botão de imprimir (Imprimir, Imprimir … etiqueta(s) ou Imprimir etiquetas).",
        "Na janela de impressão, escolha a impressora (ou Salvar como PDF, para conferir antes).",
        "Em Papel, escolha A4. Em Orientação (ou Layout), Retrato (em pé).",
        "Em Escala, use 100% (no Chrome, Padrão). Não use Ajustar à página.",
        "Desmarque Cabeçalhos e rodapés e deixe as margens no padrão.",
        "Imprima uma folha comum para conferir e só depois use o papel adesivo.",
      ),
      lista(
        "Pelo celular, ele precisa estar ligado a uma impressora (Wi-Fi). Se não estiver, imprima pelo computador do escritório.",
        "O QR não lê: a etiqueta pode ter saído borrada ou pequena. Reimprima com escala 100%. Enquanto isso, digite o código da etiqueta em Ler etiqueta.",
        "A tela mostra Nenhum lote escolhido ou Nenhum pacote escolhido: volte e escolha de novo.",
      ),
      dica(
        "Para reimprimir: “etiqueta do lote” (/ajuda/serraria-ficha#etiqueta-do-lote), “etiquetas dos pacotes” (/ajuda/serraria-pacotes#etiquetas) e “etiquetas QR das máquinas” (/ajuda/manutencao-equipamentos#etiquetas).",
      ),
    ],
  },
  {
    id: "pdf-nao-baixa",
    pergunta: "O PDF não baixa ou não abre",
    palavras: ["pdf", "baixar", "download", "nao baixa", "nao abre", "arquivo", "gerando", "romaneio", "relatorio", "ficha", "declaracao", "salvar como pdf"],
    blocos: [
      texto(
        "Os PDFs (romaneio, ficha da madeira, relatório mensal, declaração de origem, disponível para venda) são montados no próprio aparelho: o botão mostra Gerando… e depois o arquivo é baixado.",
      ),
      lista(
        "Apareceu “Não foi possível gerar o PDF. Verifique a conexão e tente de novo.”: na primeira vez, o aparelho precisa de internet para preparar o PDF. Conecte e toque de novo.",
        "Não achou o arquivo? Procure em Downloads (no celular, na notificação de download ou no app de arquivos).",
        "No iPhone, o arquivo vai para o app Arquivos. Se abrir uma visualização, toque em Compartilhar para salvar, imprimir ou mandar.",
        "O botão ficou em Gerando…: o relatório do mês é grande. Espere alguns segundos antes de tocar de novo.",
        "Nas telas com o botão Imprimir ou Exportar PDF, o PDF sai pela janela de impressão: escolha Salvar como PDF no lugar da impressora.",
      ),
    ],
  },
  {
    id: "avisos",
    pergunta: "Não recebo os avisos no celular",
    palavras: ["aviso", "avisos", "notificacao", "notificacoes", "push", "nao chega", "nao recebo", "iphone", "android", "sininho", "teste", "bloqueadas"],
    blocos: [
      passos(
        "Abra Meu perfil neste aparelho. Em Notificações neste aparelho, toque em Ativar notificações e permita quando o celular perguntar.",
        "Toque em Enviar notificação de teste. Se o teste chegar, está tudo certo.",
        "Não chegou? Confira se o modo Não perturbe (e a economia de bateria) está desligado e se as notificações do app ou do navegador estão permitidas nos ajustes do celular.",
      ),
      termos(
        [
          "As notificações foram bloqueadas no navegador",
          "Você negou a permissão antes. Libere nas configurações do site (ícone de cadeado ao lado do endereço) e recarregue a página. Com o app instalado no Android, libere também em Ajustes do celular → Apps → o app (ou o Chrome) → Notificações.",
        ],
        [
          "No iPhone",
          "Primeiro instale o app: no Safari, toque em Compartilhar → Adicionar à Tela de Início e abra o sistema pelo ícone. Só então dá para ativar em Meu perfil.",
        ],
        ["Este navegador não suporta notificações push", "Use o Chrome (no Android) ou o app instalado (no iPhone). Os avisos continuam no sininho do topo."],
        ["Celular compartilhado", "Ao sair do sistema, os avisos param de chegar neste aparelho até você entrar de novo."],
      ),
      texto("Cada aparelho é ativado separado: o celular e o computador têm de ser ativados um por um."),
      dica("Quais avisos cada um recebe: veja “Avisos” (/ajuda/avisos)."),
    ],
  },
  {
    id: "esqueci-a-senha",
    pergunta: "Esqueci a senha",
    palavras: ["senha", "esqueci", "recuperar", "nova senha", "pergunta de seguranca", "resposta", "redefinir", "trocar senha"],
    blocos: [
      passos(
        "Na tela Entrar, toque em Esqueci a minha senha.",
        "Em Seu login, digite o login (nome.sobrenome) e toque em Continuar.",
        "Responda a Pergunta de segurança em Sua resposta.",
        "Digite a Nova senha (mínimo 8 caracteres), repita em Confirme a nova senha e toque em Definir nova senha.",
        "Toque em Ir para o login e entre com a senha nova.",
      ),
      texto(
        "Apareceu “Não é possível recuperar a senha deste login pela pergunta de segurança”? A pergunta não foi cadastrada (ou o login está errado). Peça ao gerente para redefinir a sua senha na tela Usuários.",
      ),
      atencao("A senha nova desconecta os outros aparelhos onde você estava logado: entre de novo neles com a senha nova."),
      dica("Cadastre a pergunta para a próxima vez: Meu perfil → Pergunta de segurança (veja “Meu perfil” (/ajuda/meu-perfil))."),
    ],
  },
  {
    id: "login-bloqueado",
    pergunta: "“Login ou senha incorretos” ou “Muitas tentativas sem sucesso”",
    palavras: ["login", "senha errada", "incorretos", "bloqueado", "bloqueio", "muitas tentativas", "aguarde", "minutos", "nao consigo entrar", "desativado"],
    blocos: [
      termos(
        ["Login ou senha incorretos", "Confira o login no formato nome.sobrenome e a senha (maiúsculas e minúsculas contam). O olho ao lado da senha (Mostrar a senha) mostra o que foi digitado."],
        [
          "Muitas tentativas sem sucesso. Aguarde … minuto(s) e tente de novo.",
          "Depois de 5 senhas erradas para o mesmo login em 15 minutos, ou de muitas tentativas erradas na mesma rede, a entrada fica bloqueada por um tempo. Espere os minutos indicados.",
        ],
        ["Usuário desativado. Procure o administrador.", "O seu acesso foi desligado. Fale com o gerente."],
        [
          "Muitas respostas erradas para este login nas últimas 24 horas",
          "Na recuperação pela pergunta de segurança, depois de 10 respostas erradas em 24 horas, ela fica bloqueada, e você e o administrador são avisados. Peça ao gerente para redefinir a senha ou tente no dia seguinte.",
        ],
      ),
      dica("Não lembra a senha? Use Esqueci a minha senha (veja “Esqueci a senha” (/ajuda/problemas#esqueci-a-senha))."),
    ],
  },
  {
    id: "sessao-caiu",
    pergunta: "O sistema voltou sozinho para a tela Entrar",
    palavras: ["sessao", "deslogou", "saiu sozinho", "pediu login", "entrar de novo", "expirou", "trocar senha", "desconectado"],
    blocos: [
      texto("O sistema pede para entrar de novo quando:"),
      lista(
        "A sua senha foi trocada (por você em outro aparelho, pela recuperação ou pelo gerente): todos os aparelhos saem e é preciso entrar com a senha nova.",
        "O seu usuário foi desativado.",
        "Passaram 30 dias desde que você entrou neste aparelho.",
      ),
      texto("Ao entrar, abriu a tela Trocar senha? O gerente redefiniu a sua senha: escolha uma senha nova para continuar."),
      dica("Os lançamentos guardados sem internet não se perdem: eles esperam você entrar de novo com o mesmo login e são enviados."),
    ],
  },
  {
    id: "app-desatualizado",
    pergunta: "O app parece desatualizado (falta um botão ou uma tela nova)",
    palavras: ["atualizar", "desatualizado", "versao", "aparencia antiga", "botao sumiu", "recarregar", "f5", "fechar o app"],
    blocos: [
      passos(
        "Feche o app por completo (tire da lista de apps abertos) e abra de novo.",
        "No computador, recarregue a página (tecla F5).",
      ),
      texto("Com internet, as telas se atualizam sozinhas. As telas usadas sem internet são atualizadas quando a conexão volta."),
      dica("Ainda falta o botão? Ele pode não ser do seu perfil: veja “Não encontro um botão ou uma tela” (/ajuda/problemas#nao-acho-tela)."),
    ],
  },
  {
    id: "nao-acho-tela",
    pergunta: "Não encontro um botão, um menu ou uma tela",
    palavras: ["nao aparece", "sumiu", "onde fica", "menu", "botao", "perfil", "permissao", "sem permissao", "mais", "busca", "modulo"],
    blocos: [
      lista(
        "Cada perfil vê só o que pode usar: o botão que você não pode usar não aparece. Se precisa dele no seu trabalho, peça ao gerente para mudar o seu perfil.",
        "No computador, use a busca do alto do menu (tecla /). No celular, as telas que não estão na barra de baixo ficam em Mais.",
        "Usa a Serraria e a Manutenção? Troque de módulo: no celular, em Mais → Escolher módulo; no computador, no rodapé do menu à esquerda.",
      ),
      dica(
        "O que cada perfil faz: “Quem faz o quê na Serraria” (/ajuda/serraria-inicio#perfis) e “O que cada perfil faz na Manutenção” (/ajuda/manutencao-inicio#perfis). O menu está em “Navegação” (/ajuda/navegacao).",
      ),
    ],
  },
  ...(MANUTENCAO_ATIVA
    ? []
    : [
        {
          id: "manutencao-em-breve",
          pergunta: "A Manutenção aparece como “Em breve”",
          palavras: ["manutencao", "em breve", "modulo", "requisicao", "chamar manutencao"],
          blocos: [
            texto("O módulo Manutenção está em teste e ainda não foi liberado. Por enquanto, só o administrador abre o módulo."),
            texto(
              "Para chamar a manutenção numa máquina da serraria, use Máquina parou em Paradas de máquina (falha mecânica ou elétrica já abre a requisição) e avise a manutenção pessoalmente.",
            ),
          ],
        },
      ]),
];

/** Serraria. */
const DA_SERRARIA: Problema[] = [
  {
    id: "pedido-nao-aparece",
    pergunta: "O pedido não aparece no Apontar serraria (ou em Formar pacote)",
    palavras: ["pedido", "nenhum pedido aberto", "nao aparece", "lista de pedidos", "apontamento", "formar pacote", "pedido concluido"],
    blocos: [
      lista(
        "Só aparecem os pedidos Abertos. Sem nenhum, a lista mostra Nenhum pedido aberto — cadastre em Cadastros › Pedidos.",
        "Pedido novo: o supervisor cadastra em Cadastros → Pedidos → Novo pedido (veja “Cadastrar, editar e concluir um pedido” (/ajuda/serraria-pedidos#cadastrar-pedido)).",
        "Pedido concluído antes da hora: o supervisor toca no lápis do pedido em Cadastros → Pedidos, troca Situação para Aberto e toca em Salvar.",
        "Sem internet, a tela guardada mostra os pedidos de quando ela foi guardada. Um pedido cadastrado agora só aparece depois de abrir a tela com internet.",
      ),
    ],
  },
  {
    id: "etiqueta-lote-sem-internet",
    pergunta: "Lancei o lote sem internet e a etiqueta não saiu",
    palavras: ["etiqueta", "lote", "sem internet", "offline", "guardado no aparelho", "LOT-", "imprimir depois", "etiquetas de todos"],
    blocos: [
      texto("Sem internet o lote fica Guardado no aparelho (sem internet) e ainda não tem código: o LOT- é dado pelo sistema quando o lote é enviado."),
      passos(
        "Quando a internet voltar, espere a faixa amarela sumir (aparece a faixa verde de enviados).",
        "Abra Serraria, toque no boletim do dia e toque em Etiquetas de todos (ou abra o lote e toque em Etiqueta).",
        "Imprima e prenda cada etiqueta no lote certo: confira as medidas e o pedido escritos nela.",
      ),
      dica("Enquanto a etiqueta não sai, marque o lote (giz ou papel) para não misturar com outro."),
    ],
  },
  {
    id: "corrigir-lancamento",
    pergunta: "Lancei errado: como corrigir",
    palavras: ["errei", "errado", "corrigir", "editar", "excluir", "apagar", "desfazer", "lote errado", "carga errada", "inventario errado", "parada errada", "cancelar"],
    blocos: [
      texto("Quem lança corrige o que ele mesmo lançou; o supervisor corrige e exclui qualquer lançamento. Corrigir e excluir precisam de internet."),
      termos(
        ["Lote da serraria", "Não se edita. Avise o supervisor com o código LOT-: ele abre o lote e toca em Excluir. Depois, aponte de novo e imprima a etiqueta nova (veja “Lancei um lote errado” (/ajuda/serraria-ficha#lote-errado))."],
        ["Carga de toras", "Em Recebimento de toras, toque na carga, corrija e toque em Salvar carga. Só o supervisor exclui."],
        ["Inventário", "Em Inventário de madeira, toque no inventário em Histórico, corrija e toque em Salvar. Só o supervisor exclui."],
        ["Paradas e toras do dia", "O responsável pelo boletim ou o supervisor abre o boletim → Paradas e toras, corrige e toca em Salvar o dia."],
        ["Parada marcada por engano", "Só o supervisor apaga, na lixeira do cartão em Paradas agora, enquanto a parada está aberta."],
        ["Ciclo de estufa", "Em secagem: abra o ciclo, toque em Editar, corrija e toque em Salvar ciclo. Depois de concluído, não muda mais."],
        ["Pacote", "Não se edita: o supervisor cancela (Registrar → Cancelar pacote) e o pacote é formado de novo. Pacote expedido não pode ser cancelado."],
        ["Saída do caminhão", "Não se desfaz pelo sistema. Fale com o supervisor."],
      ),
      lista(
        "Não aparece o botão Excluir? Ele só aparece para o supervisor (e o gerente). Avise o supervisor com o código do lançamento.",
        "Sem internet, aparece “Sem conexão com a internet. Tente de novo quando a conexão voltar.”: espere o sinal e toque de novo.",
      ),
    ],
  },
  {
    id: "carga-so-leitura",
    pergunta: "A carga de toras abre só para leitura (sem o botão Salvar carga)",
    palavras: ["carga", "toras", "so leitura", "nao edita", "formato antigo", "sem floresta", "outra pessoa", "salvar carga"],
    blocos: [
      lista(
        "Carga registrada por outra pessoa: quem lança só corrige as cargas que ele mesmo registrou. Peça a quem registrou ou ao supervisor.",
        "Aparece “Carga registrada no formato antigo (sem floresta cadastrada): só leitura.”: a carga é de antes do cadastro de florestas e fica só como histórico, até para o supervisor.",
      ),
      dica("Veja “Corrigir ou excluir uma carga” (/ajuda/serraria-toras#corrigir-carga)."),
    ],
  },
  {
    id: "excluir-boletim",
    pergunta: "Não consigo excluir o boletim",
    palavras: ["boletim", "excluir", "apagar", "nao exclui", "pacotes", "ciclos", "origem", "boletim errado"],
    blocos: [
      texto(
        "Aparece “Há … pacote(s) e … ciclo(s) de estufa com a madeira deste dia; o boletim não pode ser excluído porque a origem deles depende dele.”: a madeira daquele dia já foi para a estufa ou virou pacote, e o boletim é o que liga esses pacotes às toras.",
      ),
      lista(
        "Para corrigir um lote só, exclua o lote em vez do boletim (veja “Lancei um lote errado” (/ajuda/serraria-ficha#lote-errado)).",
        "Para corrigir paradas ou cargas do dia, use Paradas e toras no boletim.",
        "Só o supervisor (e o gerente) vê o botão Excluir do boletim.",
      ),
    ],
  },
  {
    id: "estufa-em-secagem",
    pergunta: "Não consigo escolher a estufa para iniciar o ciclo",
    palavras: ["estufa", "em secagem", "iniciar ciclo", "nao aparece", "ocupada", "ja tem um ciclo"],
    blocos: [
      texto(
        "A estufa aparece como (em secagem) e não pode ser escolhida: ela já tem um ciclo em secagem. Se tentar, aparece “A (estufa) já tem um ciclo em secagem — conclua-o antes”.",
      ),
      passos("Abra Estufas e toque no ciclo daquela estufa.", "Se a madeira já saiu, faça o checklist e toque em Concluir ciclo.", "Volte e inicie o ciclo novo."),
      dica("Veja “Iniciar um ciclo” (/ajuda/serraria-estufas#iniciar-ciclo)."),
    ],
  },
  {
    id: "ciclo-nao-aparece",
    pergunta: "O ciclo da estufa não aparece em Formar pacote",
    palavras: ["ciclo", "estufa", "formar pacote", "nao aparece", "da estufa", "seco", "90 dias", "nenhum ciclo concluido"],
    blocos: [
      lista(
        "Em Da estufa (seco) só aparecem os ciclos concluídos nos últimos 90 dias. Ciclo ainda em secagem não aparece: conclua o ciclo antes (Estufas → o ciclo → Concluir ciclo).",
        "Ciclo cancelado não aparece.",
        "Sem nenhum, a lista mostra Nenhum ciclo concluído nos últimos 90 dias.",
        "Madeira que não passou pela estufa: escolha Da serraria (verde).",
      ),
      dica("Veja “Formar pacotes” (/ajuda/serraria-pacotes#formar-pacotes)."),
    ],
  },
  {
    id: "qr-pacote-cliente",
    pergunta: "Li o QR do pacote e abriu a página do cliente (sem os dados internos)",
    palavras: ["qr", "pacote", "pagina do cliente", "pagina publica", "safari", "iphone", "sem login", "ingles", "dados internos", "camera do celular"],
    blocos: [
      texto(
        "Quem lê o QR sem estar logado naquele navegador vê a página pública do pacote, a mesma do cliente: sem cliente, pedido, pessoas, fornecedor nem placas. Isso acontece muito no iPhone, porque a câmera abre o QR no Safari, que tem login separado do app.",
      ),
      passos(
        "Abra o endereço do sistema nesse mesmo navegador (no iPhone, no Safari) e entre com o seu login.",
        "Leia o QR de novo: agora abre a página completa do pacote.",
      ),
      dica("Ou use Ler etiqueta, dentro do app, e digite o código do pacote (PCT-…). Veja “O QR visto por quem é de fora (cliente)” (/ajuda/serraria-pacotes#qr-publico)."),
    ],
  },
  {
    id: "camera-bloqueada",
    pergunta: "Ler etiqueta: “Não foi possível abrir a câmera”",
    palavras: ["camera", "nao abre", "permissao", "bloqueada", "permitir camera", "ler etiqueta", "qr", "android", "chrome"],
    blocos: [
      texto("O celular não deixou o sistema usar a câmera (a permissão foi negada) ou outro app está usando a câmera agora."),
      passos(
        "Feche os outros apps que usam a câmera.",
        "No Android (Chrome): toque no ícone à esquerda do endereço (cadeado) → Permissões → Câmera → Permitir. Com o app instalado: no Chrome, toque em ⋮ → Configurações → Configurações do site → Câmera e libere o endereço do sistema.",
        "Volte em Ler etiqueta e toque em Abrir câmera e ler a etiqueta.",
      ),
      dica("Enquanto isso, digite o código da etiqueta (PCT-000123 ou LOT-000045) em Código do pacote ou lote e toque em Abrir."),
      texto("No iPhone, veja “No iPhone, o Ler etiqueta não mostra a câmera” (/ajuda/problemas#leitor-iphone)."),
    ],
  },
  {
    id: "leitor-iphone",
    pergunta: "No iPhone, o Ler etiqueta não mostra a câmera",
    palavras: ["iphone", "ios", "safari", "camera", "leitor", "ler etiqueta", "codigo de barras", "qr"],
    blocos: [
      texto("O leitor dentro do sistema só funciona no Android (Chrome). No iPhone, a tela mostra: Neste aparelho, use a câmera do celular direto na etiqueta."),
      passos(
        "Abra o app Câmera do iPhone e aponte para o QR da etiqueta.",
        "Toque no link que aparece. A página abre no Safari: na primeira vez, entre com o seu login nele (o Safari tem login separado do app).",
      ),
      lista(
        "A câmera do iPhone não lê o código de barras do lote: digite o código LOT- em Código do pacote ou lote e toque em Abrir.",
        "Veja também “Ler a etiqueta com a câmera” (/ajuda/serraria-ler-etiqueta#ler-com-a-camera).",
      ),
    ],
  },
  {
    id: "maquina-nao-aparece",
    pergunta: "A máquina não aparece em Máquina parou",
    palavras: ["maquina", "nao aparece", "maquina parou", "lista de maquinas", "linha", "ja parada", "equipamento"],
    blocos: [
      lista(
        "Só aparecem as máquinas da linha da serraria. O supervisor coloca a máquina na linha em Cadastros → Máquinas da linha (veja “Máquinas da linha” (/ajuda/serraria-cadastros#maquinas-da-linha)).",
        MANUTENCAO_ATIVA
          ? "Máquina que ainda não existe no sistema: o cadastro é feito em Equipamentos, na Manutenção."
          : "Máquina que ainda não existe no sistema: o cadastro é feito em Equipamentos, na Manutenção (enquanto ela está em teste, só o administrador cadastra).",
        "A máquina aparece com (já parada): ela já tem uma parada aberta em Paradas agora. Não marque de novo.",
        "Aparece com (guardada no aparelho): a parada foi marcada sem internet e ainda vai ser enviada.",
      ),
    ],
  },
  {
    id: "parada-correndo",
    pergunta: "A parada continua correndo (o cronômetro não para)",
    palavras: ["parada", "cronometro", "nao para", "continua parada", "liberar", "maquina liberada", "esqueci de liberar", "tempo parado errado"],
    blocos: [
      texto("A parada só termina quando alguém toca em Máquina liberada (ou quando a manutenção conclui a requisição informando a hora em que a máquina voltou)."),
      passos(
        "Abra Paradas de máquina (ou, no Início, toque em Liberar na pendência “… parada há …”).",
        "No cartão da máquina, toque em Máquina liberada e confirme em OK.",
      ),
      lista(
        "Liberar precisa de internet. Sem sinal, anote a hora em que a máquina voltou e avise o supervisor.",
        "Requisição cancelada não fecha a parada marcada na serraria: ela continua até a serraria tocar em Máquina liberada.",
        "Esqueceram de liberar? Só o tempo dentro do turno entra no boletim. Se a parada tem requisição, a manutenção acerta Voltou a operar em na requisição e o boletim acompanha. Sem requisição e ainda aberta, o supervisor apaga a parada na lixeira e lança o tempo certo no boletim, em Paradas e toras.",
      ),
      dica("Veja “Máquina liberada” (/ajuda/serraria-paradas#maquina-liberada)."),
    ],
  },
  {
    id: "boletim-nao-aparece",
    pergunta: "O boletim do dia não aparece (ou falta o botão Paradas e toras)",
    palavras: ["boletim", "nao aparece", "boletim do dia", "paradas e toras", "responsavel", "mes", "data errada"],
    blocos: [
      lista(
        "O boletim do dia é aberto sozinho no primeiro lote lançado naquela data. Sem nenhum lote, ainda não há boletim: toque em Apontar serraria.",
        "Num dia útil, uma parada de máquina liberada também abre o boletim (com o tempo parado e sem lotes).",
        "Lançou e não achou? Confira a Data usada no lançamento e o mês da lista Boletins da serraria (troque pelas setas ao lado do nome do mês).",
        "Paradas e toras só aparece para o responsável pelo boletim (quem lançou o primeiro lote do dia) e para o supervisor. Peça a um deles. Pelo mesmo motivo, a pendência Marcar cargas, no Início, abre o boletim em vez de Paradas e toras para quem não pode editar.",
      ),
      dica("Veja “O que tem no boletim do dia” (/ajuda/serraria-boletins#o-boletim)."),
    ],
  },
  {
    id: "pacote-fora-do-pedido",
    pergunta: "O pacote não aparece no pedido",
    palavras: ["pacote", "pedido", "nao aparece", "sem pedido", "pedido errado", "trocar pedido", "saldo"],
    blocos: [
      texto("O pedido do pacote é escolhido ao formar o pacote (campo Pedido) e não muda depois."),
      lista(
        "Abra o pacote (pelo QR ou pela lista) e veja o pedido no alto. Se está vazio ou errado, ele foi formado com — Sem pedido — ou com outro pedido.",
        "Para acertar, o supervisor cancela o pacote (Registrar → Cancelar pacote, com o motivo) e o pacote é formado de novo com o pedido certo e etiqueta nova.",
        "Pacote cancelado não conta no pedido.",
      ),
      atencao("Pacote já expedido não pode ser cancelado: fale com o supervisor."),
    ],
  },
  {
    id: "pacote-nao-sai",
    pergunta: "O pacote não aparece para registrar a saída",
    palavras: ["pacote", "saida", "expedir", "nao aparece", "na estufa", "caminhao", "registrar saida"],
    blocos: [
      lista(
        "Só saem pacotes verdes ou secos. Pacote Na estufa sai seco quando o ciclo é concluído: abra Estufas → o ciclo → Concluir ciclo.",
        "Expedir pacotes, no Início, abre a lista só com os secos. Para um pacote verde, troque o filtro para Verdes ou Em estoque.",
        "Pacote Expedido ou Cancelado não sai de novo. Veja a situação dele no filtro Todos da lista de Pacotes.",
      ),
      dica("Veja “Carregar o caminhão e gerar o romaneio” (/ajuda/serraria-expedicao#carregar-caminhao)."),
    ],
  },
].map((p) => ({ ...p, modulo: "producao" as const }));

/** Manutenção. */
const DA_MANUTENCAO: Problema[] = [
  {
    id: "requisicao-sem-internet",
    pergunta: "Abri a requisição sem internet e ela não aparece na lista",
    palavras: ["requisicao", "sem internet", "offline", "guardada no aparelho", "nao aparece", "numero"],
    blocos: [
      texto("Apareceu Sem internet: requisição guardada no aparelho. Ela fica no celular e só entra na lista (e ganha número) depois de enviada."),
      lista(
        "Ela é enviada sozinha quando a conexão volta. A faixa do alto mostra que está aguardando.",
        "Até ser enviada, ninguém da manutenção sabe dela. Se for urgente ou a máquina parou, avise pessoalmente.",
        "Faixa vermelha? Veja “Faixa vermelha: lançamento recusado” (/ajuda/problemas#recusado).",
        "Não toque em Sair antes do envio: a requisição seria perdida.",
      ),
      dica("Veja “Sem internet” (/ajuda/manutencao-abrir#sem-internet)."),
    ],
  },
  {
    id: "requisicao-errada",
    pergunta: "Abri uma requisição errada ou repetida",
    palavras: ["requisicao errada", "repetida", "duplicada", "engano", "cancelar", "desistir"],
    blocos: [
      lista(
        "Ainda Aberta (ninguém da manutenção mexeu): na página dela, toque em Cancelar requisição, escreva o Motivo e toque em Confirmar cancelamento.",
        "Já em atendimento: comente explicando o engano e peça a um supervisor da manutenção para cancelar.",
        "É manutentor? O botão Cancelar requisição não aparece para a equipe, nem nas que você abriu: peça a um supervisor, que cancela pelo quadro Atualizar requisição (Status Cancelada, com o motivo).",
        "Faltou informação? Não abra outra: comente na mesma requisição ou mande mais fotos.",
      ),
      dica("Veja “Cancelar a requisição que você abriu” (/ajuda/manutencao-acompanhar#cancelar)."),
    ],
  },
  {
    id: "nao-consigo-concluir",
    pergunta: "Não consigo concluir a requisição",
    palavras: ["concluir", "finalizar", "encerrar", "servico realizado", "checklist", "itens pendentes"],
    blocos: [
      termos(
        ["Descreva o serviço realizado para concluir", "Preencha Serviço realizado no quadro Atualizar requisição e toque em Salvar."],
        ["Conclua o checklist antes de finalizar (… pendentes)", "Marque todos os itens do checklist (toque em cada um quando fizer) e salve de novo."],
        ["Não aparece o quadro Atualizar requisição", "Só a equipe da manutenção (manutentor, supervisor e gerente) atende requisições. O operador acompanha e comenta."],
      ),
      dica("Veja “Concluir” (/ajuda/manutencao-atender#concluir)."),
    ],
  },
  {
    id: "comentario-sumiu",
    pergunta: "Sumiu o campo de comentário e de fotos",
    palavras: ["comentario", "comentar", "fotos", "sumiu", "encerrada", "concluida", "cancelada", "requisicao encerrada"],
    blocos: [
      texto(
        "A requisição foi Concluída ou Cancelada. Encerrada, ela não aceita mais comentários nem fotos de quem não é da equipe da manutenção: os campos somem da tela (e, se a tela estava aberta, aparece Requisição encerrada ao enviar). A equipe ainda comenta e anexa a foto do serviço feito.",
      ),
      lista(
        "Se o problema voltou, abra uma requisição nova e conte que é o mesmo defeito.",
        "O quadro Fotos só deixa enviar quem abriu a requisição, o responsável e a equipe da manutenção.",
      ),
    ],
  },
  {
    id: "foto-nao-foi",
    pergunta: "A foto não foi enviada",
    palavras: ["foto", "fotos", "anexo", "imagem", "nao enviou", "galeria", "tirar foto", "foto muito grande", "formato", "8 mb"],
    blocos: [
      termos(
        ["Foto muito grande", "A foto passou de 8 MB. Tire a foto pelo botão Tirar foto do sistema (ela é reduzida no aparelho antes de enviar) ou escolha outra."],
        ["Formato de imagem não suportado", "Só valem fotos JPEG, PNG, WebP ou HEIC. Use Tirar foto ou escolha outra imagem."],
        ["Não foi possível ler a foto. Tente outra.", "O arquivo está corrompido ou incompleto. Tire a foto de novo."],
        ["Escolha ao menos uma foto", "Toque em Tirar foto ou Adicionar fotos antes de Enviar fotos."],
      ),
      lista(
        "Cabem até 6 fotos por vez (aparece até 6 ao lado do botão). Para mandar mais, envie em outra vez pelo quadro Fotos da requisição (Enviar fotos).",
        "Com sinal fraco, o envio com fotos demora: espere terminar antes de sair da tela.",
        "Sem internet, as fotos de uma requisição nova vão junto com ela, guardadas no aparelho, e são enviadas quando a conexão voltar. Fotos de uma requisição que já existe precisam de internet.",
      ),
    ],
  },
  {
    id: "nova-requisicao-sem-internet",
    pergunta: "Nova requisição não abre sem internet",
    palavras: ["nova requisicao", "sem internet", "offline", "sem conexao", "nao abre", "botao +", "sem sinal"],
    blocos: [
      lista(
        "Para abrir sem internet, o aparelho precisa ter entrado no sistema com internet antes: logo depois do login, o app guarda a tela Nova requisição (e o Início da Manutenção).",
        "Depois de tocar em Sair, as telas guardadas são apagadas. Entre de novo com internet e abra o app uma vez antes de ir para o lugar sem sinal.",
        "Abrir pelo QR da máquina precisa de internet: sem sinal, toque no + (Nova requisição) e escolha o Equipamento na lista.",
      ),
      dica("Veja “Sem internet” (/ajuda/manutencao-abrir#sem-internet)."),
    ],
  },
  {
    id: "aviso-requisicao-nova",
    pergunta: "Não recebo o aviso de requisição nova",
    palavras: ["aviso", "notificacao", "requisicao nova", "nao chega", "nao recebo", "push", "maquina parada"],
    blocos: [
      lista(
        "O aviso de requisição nova vai para supervisores e manutentores. O gerente recebe só as de prioridade alta, as urgentes e as com máquina parada. O operador não recebe esse aviso: ele recebe os avisos das requisições que abriu.",
        "Quem abriu a requisição não recebe o aviso dela mesma.",
        "Ative os avisos em cada aparelho: Meu perfil → Notificações neste aparelho → Ativar notificações, e faça o teste.",
        MANUTENCAO_ATIVA
          ? "Usuário com perfil Sem acesso na Manutenção não recebe nenhum aviso dela."
          : "Enquanto a Manutenção está em teste, ninguém da equipe recebe os avisos dela: só o administrador, nas requisições que ele abriu.",
      ),
      dica("Outras causas em “Não recebo os avisos no celular” (/ajuda/problemas#avisos). A lista completa está em “Avisos da Manutenção” (/ajuda/manutencao-inicio#avisos)."),
    ],
  },
  {
    id: "cancelei-maquina-parada",
    pergunta: "Cancelei a requisição e a máquina continua parada na serraria",
    palavras: ["cancelei", "cancelada", "maquina parada", "parada continua", "serraria", "cronometro", "maquina liberada"],
    blocos: [
      texto(
        "Se a parada foi marcada na serraria pelo botão Máquina parou, cancelar a requisição não fecha essa parada: quem parou foi a linha. A página da requisição mostra Requisição encerrada: a parada continua aberta na serraria até a serraria liberar a máquina.",
      ),
      lista(
        "A serraria recebe o aviso do cancelamento e toca em Máquina liberada, em Paradas de máquina, quando a máquina voltar.",
        "Se a parada foi aberta pela própria requisição (A máquina está parada), ela é desfeita junto com o cancelamento.",
        "A parada foi marcada por engano? O supervisor da serraria a exclui na lixeira, em Paradas agora.",
      ),
      dica("Veja “Parada marcada por engano e requisição cancelada” (/ajuda/manutencao-maquina-parada#engano)."),
    ],
  },
  {
    id: "sem-botao-maquina-liberada",
    pergunta: "Não aparece o botão Máquina liberada na requisição",
    palavras: ["maquina liberada", "botao", "nao aparece", "liberar", "voltou a operar", "parada"],
    blocos: [
      lista(
        "Ele é só da equipe da manutenção (manutentor, supervisor e gerente). O operador acompanha a requisição e avisa a equipe.",
        "Só aparece nas máquinas da linha da serraria, com a parada ainda aberta. Nas outras máquinas, preencha Voltou a operar em no quadro Atualizar requisição e toque em Salvar (ou conclua a requisição).",
        "Não aparece em requisição Concluída ou Cancelada. Se a parada da serraria ficou aberta, a serraria libera em Paradas de máquina.",
        "A máquina já foi liberada (a faixa ficou cinza, com o tempo total parado): falta só conferir e concluir.",
      ),
      dica("Veja “Máquina parada e Máquina liberada” (/ajuda/manutencao-atender#maquina-parada)."),
    ],
  },
  {
    id: "maquina-fora-da-linha",
    pergunta: "A máquina não aparece no Máquina parou da serraria (ou a parada não vai para o boletim)",
    palavras: ["maquina parou", "linha da serraria", "maquina da linha", "boletim", "tipo da falha", "nao aparece", "equipamento"],
    blocos: [
      texto("Só as máquinas marcadas como da linha da serraria aparecem no Máquina parou e levam o tempo parado para o boletim. Nas outras, a requisição nem mostra o Tipo da falha."),
      passos(
        "Em Equipamentos, abra a máquina.",
        "Toque em Editar dados do equipamento, marque Máquina da linha da serraria e toque em Salvar.",
      ),
      dica("A serraria também marca em Cadastros → Máquinas da linha. Veja “Quais máquinas entram” (/ajuda/manutencao-maquina-parada#maquinas-da-linha)."),
    ],
  },
  {
    id: "mensagem-ao-salvar",
    pergunta: "Ao salvar a requisição, apareceu uma mensagem e nada mudou",
    palavras: ["erro", "nao salva", "mensagem", "assumir", "cancelar", "data agendada", "adiamento", "responsavel", "sem permissao"],
    blocos: [
      texto("A mensagem aparece no quadro Atualizar requisição e diz o que falta:"),
      termos(
        ["Informe a data agendada", "Para Agendada, preencha a Data agendada (dia e hora)."],
        ["Informe o motivo do adiamento", "Para Adiada, escreva o motivo em Observação / motivo."],
        ["Informe o motivo do cancelamento", "Para Cancelada, escreva o motivo em Observação / motivo."],
        ["Você só pode assumir a requisição para você", "O manutentor assume para si ou deixa — Não atribuído —. Para passar a outra pessoa, peça a um supervisor."],
        ["Só gerente ou supervisor pode cancelar requisições", "O manutentor não cancela. Comente o motivo e peça a um supervisor."],
        ["O fim da parada não pode ser antes do início", "Confira Parada desde e Voltou a operar em."],
        ["O início da parada não pode ser no futuro", "Parada desde não pode passar da hora de agora."],
        ["Sem conexão com a internet. Tente de novo quando a conexão voltar.", "Atualizar a requisição precisa de internet. O que você preencheu continua na tela: toque em Salvar quando a conexão voltar."],
      ),
      dica("Para concluir, veja “Não consigo concluir a requisição” (/ajuda/problemas#nao-consigo-concluir)."),
    ],
  },
  {
    id: "qr-maquina",
    pergunta: "O QR da máquina não abre a página ou pede login",
    palavras: ["qr", "qr code", "etiqueta da maquina", "nao abre", "pede login", "camera"],
    blocos: [
      lista(
        "Aponte a câmera do celular para a etiqueta e toque no link que aparece.",
        "Na primeira vez, o navegador pede o seu login: entre e você volta direto para a página da máquina.",
        "Etiqueta gasta ou ilegível: peça uma nova à equipe da manutenção (Imprimir etiqueta, na ficha da máquina).",
        "Sem internet, a página da máquina não abre: toque no + (Nova requisição) e escolha o Equipamento na lista.",
      ),
      dica("Veja “Pelo QR Code da máquina” (/ajuda/manutencao-abrir#qr)."),
    ],
  },
].map((p) => ({ ...p, modulo: "manutencao" as const }));

/** Problemas comuns: os gerais primeiro, depois os de cada módulo (a página agrupa pelo módulo). */
export const PROBLEMAS: Problema[] = [...GERAIS, ...DA_SERRARIA, ...DA_MANUTENCAO];
