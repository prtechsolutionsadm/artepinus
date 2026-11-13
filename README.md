# Artepinus · Site e sistema

- **Site institucional** público em `/` (`src/app/(site)`): empresa, processo, produtos, rastreabilidade
  e contato, com o botão **Acessar sistema** (`/sistema` → login → módulo do usuário).
  Contatos (telefone, WhatsApp, e-mail, endereço) ficam em `src/lib/empresa.ts` — o site só mostra o que
  estiver preenchido.
- **Sistema (PWA)** em módulos:
  - **Serraria** (rotas `/producao`) — toras, apontamento em grade com etiqueta de lote, estufas,
    pacotes com QR Code, inventário, indicadores (OEE) e pedidos, funcionando também sem internet.
  - **Manutenção** (rotas `/manutencao`, `/requisicoes`, `/agenda`, `/equipamentos`…) — requisições,
    máquina parada ligada à serraria, preventivas, equipamentos com QR e indicadores. **Em teste**
    (`MODULOS_EM_TESTE` em `src/lib/permissoes.ts`): aparece como "Em breve" para todos e abre só para o
    Administrador. Para liberar a todos, siga o [Checklist para liberar a Manutenção](#checklist-para-liberar-a-manutenção);
    a virada em si é mover `"manutencao"` para `MODULOS_ATIVOS`. Código e dados continuam.
  - **Manual do usuário** em `/ajuda`, para os dois módulos (veja [Manual do usuário](#manual-do-usuário)).

## Rastreabilidade (da floresta ao pacote)

```
Carga de toras (CT-00001: floresta, fornecedor, motorista) → Boletim do dia (lotes LOT-000001 por pedido) ⇄ Ciclo de estufa → Pacote (PCT-000001) → Saída
```

- Cada ligação é registrada onde a coisa acontece: a carga escolhe floresta, fornecedor e motorista
  (placas do caminhão e da julieta vêm do cadastro); o boletim marca as cargas serradas no dia; cada lote
  da serraria pertence a um **pedido** (nº, cliente, destino); o ciclo marca os dias de serraria cuja
  madeira entrou na estufa; o pacote nasce da madeira de um ciclo (seco) ou de um lote (verde).
  Colheita/talhão ficam só nos dados antigos.
- Etiquetas: lote com **QR + código de barras (Code 128)** e pacote com QR para `/p/<código aleatório>`
  (`Pacote.codigoPublico`; etiquetas antigas com o número continuam valendo). Toda saída (expedição) gera
  um **romaneio** (ROM-000123, motorista/placas do cadastro, nº da NF opcional, PDF); cliente e destino
  vêm do pedido. Cada ação vira um `EventoPacote`.
- `/producao/escanear` lê QR ou código de barras (pacote ou lote) pela câmera ou pelo código digitado.

**Stack:** Next.js 16 (Node.js) · Prisma ORM 7 · Prisma Postgres · Tailwind CSS 4 · hospedagem na Vercel.

## Módulos e acesso

Cada usuário tem um perfil por módulo (`perfil` na Manutenção, `perfilProducao` na Produção;
regras em `src/lib/permissoes.ts`: `temModulo`, `pode`, `podeProducao`). Quem só usa a produção fica
com *Sem acesso* na Manutenção. Admin e Gerente têm acesso total à Serraria; enquanto a Manutenção
estiver em teste, só o Admin a abre (os perfis da Manutenção já escolhidos ficam guardados e passam a valer
na liberação). Quem usa os dois entra primeiro na Serraria e troca de módulo no rodapé do menu lateral
ou em *Escolher módulo* (no celular, em *Mais*).

| Serraria | Supervisor | Apontador | Consulta |
|---|:-:|:-:|:-:|
| Painel, boletins, estufas, toras, inventário e Excel | ✓ | ✓ | ✓ |
| Apontar lotes, ciclo de estufa, carga de toras e inventário | ✓ | ✓ | |
| Corrigir lançamentos de outra pessoa e excluir | ✓ | | |
| Cadastros: pedidos, florestas, fornecedores, motoristas, estufas, motivos e configuração | ✓ | | |

## Serraria

- **Ficha de madeira** (igual ao papel da fábrica): escolhe o pedido e preenche uma linha por medida —
  espessura (23/25/32/38), larguras marcadas (125/100/85/50 ou Mista) e as peças em cada comprimento
  (2,50/2,10 Ótimo · 1,65 Bom · 1,30/1,00/0,70 Regular). O mesmo formato vale no ciclo da estufa (com
  grades úmidas) e no inventário; cada estufa tem a ficha "Madeira carregada no mês".
  Cada lançamento vira um **lote** com etiqueta. Meta e horas do boletim vêm da **Configuração**
  (somente leitura). No boletim do dia ficam ainda paradas (motivo pelo código da planilha, centro
  MEC/ELE/OPE, equipamento, minutos) e toras consumidas.
- **Indicadores**: Disponibilidade = (tempo programado − paradas) ÷ tempo programado · Produtividade =
  serrado ÷ meta · **OEE** = D × P (a Qualidade saiu) · Rendimento = serrado ÷ m³ de toras. Serrado por
  classe × meta, paradas por centro, Pareto, comparativo mensal e **Excel**.
- **Estufas**: ciclos de secagem com plantão escolhido entre os usuários, checklist e aviso de
  aclimatação de 48 h.
- **Toras**: carga com floresta, fornecedor, motorista, comprimento médio, diâmetro (Fina/Média/Grossa)
  e peso (t). **Inventário diário**: madeira em Grade / Pacote / Estufa / Verde, na mesma ficha da serraria.
- **Sem internet**: carga, lote e inventário ficam guardados no aparelho (IndexedDB) e são enviados
  sozinhos quando a conexão volta (`src/lib/fila-offline.ts` → `/api/offline`).

## Manutenção

- **Login** no formato `nome.sobrenome` + senha — o solicitante fica registrado automaticamente na requisição.
  Senha provisória definida pelo admin precisa ser trocada no primeiro acesso.
- **Perfis** (regras em `src/lib/permissoes.ts`):

  | | Admin | Gerente | Supervisor | Manutentor | Operador |
  |---|:-:|:-:|:-:|:-:|:-:|
  | Abrir e comentar requisições, anexar fotos | ✓ | ✓ | ✓ | ✓ | ✓ |
  | Atualizar status, agendar, registrar serviço, lançar horas, checklist | ✓ | ✓ | ✓ | ✓ | |
  | Atribuir responsável a outra pessoa | ✓ | ✓ | ✓ | só a si | |
  | Cancelar qualquer requisição | ✓ | ✓ | ✓ | | só as próprias abertas |
  | Equipamentos, ficha e etiquetas QR | ✓ | ✓ | ✓ | ✓ | |
  | Preventivas e checklists (cadastro) | ✓ | ✓ | ✓ | | |
  | Indicadores e relatórios | ✓ | ✓ | ✓ | | |
  | Usuários, setores e auditoria | ✓ | ✓ | | | |

  *Sem acesso*: a pessoa não usa o módulo de manutenção (só a produção).
  *Administrador* é exclusivo do desenvolvedor: não pode ser atribuído pela tela, e o gerente não vê nem edita essa conta.
- **Status:** Aberta · Em análise · Planejada · Agendada · Em andamento · Aguardando peças · Adiada · Concluída · Cancelada.
  - Agendada exige data; Adiada e Cancelada exigem motivo; Concluída exige descrição do serviço.
- **Histórico completo**: toda mudança de status e todo comentário ficam registrados com autor e data/hora.
- **Fotos** do problema e do serviço (câmera ou galeria), comprimidas no celular e sem dados de GPS;
  guardadas no banco e servidas só para quem está logado e usa o módulo de manutenção (`/api/anexos/[id]`).
- **Máquina parada**: marcada na abertura; o tempo parado é calculado até a máquina voltar a operar.
  Junto com a serraria (máquinas marcadas em Cadastros → *Máquinas da linha*):
  - *Máquina parou* mecânica ou elétrica na tela de paradas abre na hora uma requisição de prioridade alta
    (com o módulo liberado, supervisores e manutentores são avisados);
  - *Máquina liberada* na serraria avisa o responsável da requisição (sem responsável, os supervisores da
    manutenção) para conferir e concluir, e a lista mostra o selo "Máquina liberada";
  - concluir a requisição informando o fim da parada avisa os supervisores da serraria e quem marcou a parada;
  - parada excluída na serraria (marcada por engano) cancela sozinha a requisição que ninguém assumiu;
    cancelar uma requisição desfaz a parada aberta pela manutenção (a marcada na serraria, a serraria libera).
- Requisição concluída ou cancelada não aceita mais comentários nem fotos.
- **Horas trabalhadas** por manutentor em cada requisição.
- **Checklists** por tipo de serviço; a requisição só pode ser concluída com todos os itens marcados.
- **Preventiva automática**: planos por equipamento (a cada N dias/semanas/meses) geram a requisição
  já agendada, com responsável e checklist, alguns dias antes da data.
- **QR Code** em cada equipamento: etiquetas para imprimir; apontar a câmera abre a requisição já com a
  máquina escolhida. Ficha do equipamento com dados, preventivas e histórico.
- **Indicadores**: disponibilidade, tempo parado, MTTR, MTBF, tempo médio de atendimento, preventivas no
  prazo, horas por manutentor, requisições por mês, ranking de equipamentos e setores.
- **Sem internet**: a tela *Nova requisição* abre sem sinal (fica guardada pelo service worker, como as telas
  de apontamento da serraria) e a requisição, com fotos, fica no aparelho e é enviada sozinha quando a
  conexão volta (`/api/requisicoes/offline`).
- **Auditoria**: quem alterou o quê e quando (logins, usuários, equipamentos, requisições, planos…).
- Tipo (corretiva, preventiva, preditiva, melhoria) e prioridade (baixa → urgente).
- Painel inicial com indicadores, urgentes, agenda dos próximos 7 dias e "minhas requisições".
- Listagem com busca (nº, título, equipamento) e filtros; histórico por equipamento.
- Agenda com as manutenções agendadas por dia (e alerta das vencidas).
- **Relatórios** por período, status, tipo, prioridade e setor, com resumo e gráficos;
  exportação em **PDF** (A4 com logo) e **Excel** (.xlsx formatado, com logo e aba de resumo).
- Impressão da requisição com logo (para quem ainda precisa do papel).
- **Responsivo**: menu lateral à esquerda no computador (com busca, atalho "/"), barra inferior + menu
  "Mais" no celular/tablet.
- **Notificações** no sininho e por **push** no celular/computador (ativar em *Perfil*):
  - supervisores e manutentores: requisição nova (o gerente recebe só as de prioridade alta/urgente ou
    com máquina parada);
  - solicitante: mudança de status e comentários; responsável: quando a requisição é atribuída a ele;
  - lembrete às 7h (Brasília) das manutenções agendadas para o dia, logo depois de gerar as preventivas
    (Cron da Vercel, `vercel.json` → `/api/cron/lembretes`). A mesma rotina roda os alertas da serraria
    (estufa atrasada, pedido pronto) e a limpeza LGPD (prazos em `src/lib/retencao.ts`); às 18h dos dias
    úteis, `/api/cron/serraria` avisa quando o dia ficou sem apontamento.
  - No iPhone o push só funciona com o app instalado na tela de início (iOS 16.4+).
- **Triagem do período de teste** (só o Admin, em Cadastros → Configuração): encerra de uma vez, com
  prévia e confirmação, as requisições que o teste deixou abertas (veja o checklist abaixo).
- **PWA**: instalável no celular ("Adicionar à tela inicial"), com tela de "sem conexão".

## Manual do usuário

Dentro do app, em `/ajuda`, para os dois módulos. Cada pessoa vê só o que usa (por módulo e permissão).

- **`/ajuda`**: entrada, com a busca e as seções organizadas em Geral, Serraria (na ordem do processo) e
  Manutenção.
- **`/ajuda/<seção>`**: uma seção por página (ex.: `/ajuda/serraria-ficha`); cada tópico tem âncora
  própria (`/ajuda/serraria-ficha#lote`).
- **`/ajuda/glossario`**, **`/ajuda/problemas`** (problemas comuns e como resolver) e **`/ajuda/roteiros`**
  (roteiros por função para imprimir, de `src/lib/roteiros.ts`).
- **Ajuda por tela**: o botão "?" abre a seção da tela atual — vale a seção (ou o tópico) cujo `rotas`
  tem o prefixo mais longo do endereço.
- **Sem internet**: `/ajuda`, `/ajuda/sem-internet` e `/ajuda/problemas` ficam guardadas no aparelho
  depois do login, e toda página do manual que a pessoa abrir também (`public/sw.js`).

**Conteúdo** em `src/lib/manual/`: `tipos.ts` (o formato: seções, tópicos e blocos), `geral.ts`,
`serraria.ts`, `manutencao.ts`, `glossario.ts` e `problemas.ts`, juntados em `index.ts`. Os ids das seções
viram o endereço (`/ajuda/<id>`) e não devem mudar, porque a ajuda das telas e os links apontam para eles.
Link para outra parte do manual: escreva o caminho completo entre parênteses, ex.: "veja Trabalhar sem
internet (/ajuda/sem-internet)". Texto que depende de a Manutenção estar liberada usa `MODULOS_ATIVOS`.
Mudou uma tela (nome de botão, menu, campo)? Atualize o tópico dela no mesmo commit.

**Capturas de tela**: blocos `{ tipo: "imagem", imagem: { arquivo, legenda, rota, perfil, tela?, acoes? } }`.
O script `scripts/capturas-manual.ts` entra com o usuário de demonstração da `perfil` escolhida, abre a
`rota`, faz as `acoes` e grava `public/ajuda/<arquivo>` (.webp; celular 390×844 se `tela` não for
"computador"). Perfis: `apontador` (carlos.encarregado), `supervisor` (paulo.supervisor), `gerente`
(ana.gerente), `manutentor` (joao.tecnico), `operador` (maria.operadora) e `admin` (pablo.ribas). Para gerar
de novo, no banco **local** com os dados de demonstração (`SEED_DEMO=1 npm run db:seed`) e o app rodando:

```bash
npm run manual:capturas       # o mesmo que: npx tsx scripts/capturas-manual.ts
```

Rode de novo sempre que uma tela com captura mudar e commite as imagens de `public/ajuda/`. O service
worker atualiza a cópia guardada das capturas sozinho (mesmo nome de arquivo).

## Checklist para liberar a Manutenção

A virada é uma linha de código (passo 7), mas o que trava são os dados e a configuração acumulados no teste.
Faça na ordem; as consultas são **só de leitura** (rode num cliente SQL, ex.: `psql` com a `DATABASE_URL`
de produção, e não altere nada por SQL: use as telas, que registram na auditoria).

1. **Esta versão em produção** (avisos de máquina parada/liberada, nova requisição sem internet, triagem e
   manual) — deploy normal antes de começar.
2. **Levantamento dos dados**:

   ```sql
   -- Quem passa a usar a Manutenção na virada (perfil diferente de Sem acesso)
   SELECT login, nome, perfil, "perfilProducao", ativo, "criadoEm" FROM "Usuario"
   WHERE perfil NOT IN ('SEM_ACESSO','ADMIN') ORDER BY perfil, login;

   -- Requisições ainda abertas (as do "Máquina parou" do teste aparecem com origem SERRARIA)
   SELECT r.id, r.titulo, r.status, r.prioridade, r."responsavelId", r."paradaInicio", r."paradaFim", pm.origem
   FROM "Requisicao" r LEFT JOIN "ParadaMaquina" pm ON pm."requisicaoId" = r.id
   WHERE r.status NOT IN ('CONCLUIDA','CANCELADA') ORDER BY r."criadoEm";

   -- Planos de preventiva e requisições pendentes de cada um
   SELECT p.titulo, p.ativo, p."proximaData", count(r.id) FILTER (WHERE r.status NOT IN ('CONCLUIDA','CANCELADA')) AS pendentes
   FROM "PlanoPreventivo" p LEFT JOIN "Requisicao" r ON r."planoId" = p.id GROUP BY p.id ORDER BY p.titulo;

   -- Máquinas da linha (aparecem no "Máquina parou") e equipamentos ativos sem setor
   SELECT codigo, nome, "linhaSerraria", ativo FROM "Equipamento" ORDER BY "linhaSerraria" DESC, codigo;
   SELECT codigo, nome FROM "Equipamento" WHERE ativo AND "setorId" IS NULL ORDER BY codigo;

   -- Quem recebe os avisos da manutenção e em quantos aparelhos ativou o push
   SELECT u.login, u.perfil, count(i.id) AS aparelhos FROM "Usuario" u
   LEFT JOIN "InscricaoPush" i ON i."usuarioId" = u.id
   WHERE u.ativo AND u.perfil IN ('GERENTE','SUPERVISOR','MANUTENTOR') GROUP BY u.id ORDER BY u.perfil, u.login;
   ```

3. **Perfis** (a empresa decide quem usa o módulo e com qual perfil): na tela *Usuários*, deixe cada pessoa
   com o perfil da Manutenção certo — *Sem acesso* para quem não deve entrar, *Operador* para quem só pede
   manutenção, *Manutentor* e *Supervisor* para a equipe. Precisa haver pelo menos um Supervisor e um
   Manutentor reais e ativos: sem eles, ninguém recebe as requisições novas. Lembre que o Gerente recebe os
   avisos de prioridade alta, urgente e máquina parada.
4. **Cadastros da manutenção**: equipamentos ativos com setor (a requisição herda o setor do equipamento),
   setores, modelos de checklist e planos de preventiva (responsável e próxima data); em Cadastros →
   *Máquinas da linha*, as máquinas da linha marcadas. Imprima e cole as etiquetas QR dos equipamentos
   (`/equipamentos/etiquetas`).
5. **Triagem do período de teste**: Cadastros → Configuração (entrando como Admin). Em *Criadas até*, o
   último dia do teste; confira a prévia e escolha, em cada grupo, *Concluir* ou *Cancelar*:
   - requisições do *Máquina parou* com a máquina já liberada, ainda Abertas e sem atendimento — concluídas
     ficam com a data em que a serraria liberou a máquina (entram no MTTR e no tempo de atendimento);
     canceladas ficam fora dos indicadores;
   - preventivas geradas no teste, já vencidas e sem atendimento — conclua só as que foram feitas de fato;
   - requisições de paradas excluídas na serraria antes desta versão — só cancelar.

   Digite ENCERRAR e aplique. Fica de fora o que alguém assumiu, comentou ou em que lançou horas: resolva
   na própria requisição. Rode as consultas do passo 2 de novo para conferir.
6. **Avisos (push) e rotinas**: na Vercel (Production) confira `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY` (e `VAPID_SUBJECT`, se usar) e `CRON_SECRET` (lembrete das 7h e preventivas). Peça a
   supervisores e manutentores para ativar os avisos em *Meu perfil* no celular (no iPhone, com o app
   instalado na tela de início).
7. **Teste de ponta a ponta antes da virada**, no banco local com os dados de demonstração e a linha do
   passo 8 trocada só na sua cópia: *Máquina parou* (mecânica) → aviso para supervisor e manutentor → o
   manutentor assume → *Máquina liberada* na serraria → aviso para o responsável → concluir com o fim da
   parada → serraria avisada; nova requisição em modo avião (abre, guarda e envia quando a conexão volta);
   QR de uma máquina; comentário e foto; requisição concluída sem campo de comentário; manual da
   Manutenção (`/ajuda`) para operador e manutentor.
8. **A virada** — em `src/lib/permissoes.ts`:

   ```ts
   export const MODULOS_ATIVOS: Modulo[] = ["producao", "manutencao"];
   export const MODULOS_EM_TESTE: Modulo[] = [];
   ```

   Mantenha o mecanismo de teste e o código. No mesmo commit, tire do `CLAUDE.md` e deste README as frases
   de "em teste" e atualize os comentários de `src/lib/permissoes.ts`. Depois do deploy, repita o teste do
   passo 7 em produção com um manutentor real e imprima os roteiros novos (`/ajuda/roteiros`) para os postos.

## Rodando localmente

Pré-requisito: Node.js 22.12+ ou 24 (mínimo exigido pelo Prisma 7: 20.19, 22.12 ou 24+). O banco local
é um Prisma Postgres rodando na sua máquina (`prisma dev`).

```bash
npm install
npm run db:local            # em outro terminal: sobe o Prisma Postgres local e mostra a URL postgres://
cp .env.example .env        # cole a URL postgres:// em DATABASE_URL e defina AUTH_SECRET
npx prisma migrate dev      # cria as tabelas
npm run db:seed             # cria o admin e os setores
npm run dev                 # http://localhost:3000
```

Login inicial: `pablo.ribas` com a senha de `ADMIN_SENHA_INICIAL` (se definida no .env) ou com a senha
provisória sorteada que o `npm run db:seed` mostra no terminal. O sistema pede a troca no primeiro acesso.

Para dados de exemplo: `SEED_DEMO=1 npm run db:seed` (cria `ana.gerente`, `paulo.supervisor`, `joao.tecnico`, `maria.operadora` e
`carlos.encarregado` — só produção, apontador —, senha `teste123`, além de um mês e meio de boletins, um ciclo de estufa, cargas e estoque).
`joao.tecnico` e `maria.operadora` são usuários da manutenção: não têm perfil na Serraria e só entram quando
a Manutenção for liberada. **Só no banco local**: nunca defina `SEED_DEMO` na Vercel nem rode com o .env de
produção (cria um Gerente e outros usuários com a senha conhecida `teste123`; o seed recusa em banco
db.prisma.io ou na Vercel).

## Deploy (Prisma Postgres + Vercel)

1. **Banco** – crie um Prisma Postgres de uma das duas formas:
   - pela Vercel: no projeto, *Storage → Create Database → Prisma Postgres* (Marketplace). As variáveis
     são adicionadas ao projeto automaticamente; ou
   - em [console.prisma.io](https://console.prisma.io): crie o banco e copie a string de conexão.

   Use a string **TCP direta**, que começa com `postgres://…@db.prisma.io:5432/…`, como `DATABASE_URL`.
   (A string `prisma+postgres://` do Accelerate **não** é usada por este projeto.) Em produção o app fala com
   o Prisma Postgres pelo driver serverless (`@prisma/adapter-ppg`), que não segura conexões abertas.
2. **Vercel** – importe este repositório do GitHub. Em *Settings → Environment Variables* confira/adicione:
   - `DATABASE_URL` (a `postgres://` direta)
   - `AUTH_SECRET` (gere com `openssl rand -base64 32`)
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` (gere com `npx web-push generate-vapid-keys`)
   - `CRON_SECRET` (qualquer texto aleatório longo): protege as rotinas `/api/cron/lembretes` e
     `/api/cron/serraria`; sem ele as duas respondem 401 (sem lembretes, alertas nem limpeza LGPD)
   - `NEXT_PUBLIC_SITE_URL` (opcional): o endereço definitivo gravado nos QR das etiquetas impressas e no
     preview de links; sem ela, vale `EMPRESA.site` (`src/lib/empresa.ts`) na Vercel e, fora dela, os QR
     usam o host da requisição. Ao trocar para um domínio
     próprio, atualize a variável (ou `EMPRESA.site`) e mantenha o domínio antigo apontando para o app:
     as etiquetas já impressas continuam com ele
   - `ADMIN_SENHA_INICIAL` (opcional): senha provisória do admin criado no banco novo; sem ela, a senha é
     sorteada e aparece no log de build
   - `VAPID_SUBJECT` (opcional): `mailto:` de contato enviado ao serviço de push
3. **Migrations e usuário admin** – automáticos só no deploy de produção (`VERCEL_ENV=production`): a
   Vercel usa o script `vercel-build`, que roda `prisma migrate deploy` e o seed (cria setores e catálogo
   que faltam e o admin só se não houver nenhum administrador) antes do build. Defina
   `ADMIN_SENHA_INICIAL` antes do primeiro deploy; sem ela, a senha sorteada sai no log de build (troque-a
   no primeiro acesso).
   - Deploys de Preview (`VERCEL_ENV=preview`) **não** migram nem rodam o seed: neste projeto o Preview
     usa o mesmo banco da produção, e a migration de uma branch ainda não revisada mudaria o banco de
     produção (um Preview com migration nova pode falhar no build, sem afetar a produção). Por isso hoje
     um Preview também lê e grava dados de produção.
   - Para isolar o Preview, desligue o ambiente Preview na ligação do banco com o projeto (Storage → o
     banco Prisma Postgres → Projects → ambientes). `DATABASE_URL`, `POSTGRES_URL` e `PRISMA_DATABASE_URL`
     vêm da integração e o app usa a `POSTGRES_URL` quando não há `DATABASE_URL`: tirar o Preview só do
     `DATABASE_URL` não adianta. Depois crie um `DATABASE_URL` só para o Preview, apontando para outro
     banco — o Preview precisa de algum banco (sem nenhum, o seed e o `next build` falham com
     "DATABASE_URL não configurada"). Como `scripts/migrar.mjs` e o seed não rodam no Preview, prepare
     esse banco à mão uma vez e depois de cada migration nova:
     `DATABASE_URL=<url do banco do preview> npx prisma migrate deploy && DATABASE_URL=<url do banco do preview> npm run db:seed`.
   - As migrations rodam antes do `next build` (a página inicial do site já consulta o banco no build),
     então precisam ser compatíveis com a versão anterior do código: coluna nova opcional ou com default,
     e remoção ou renomeação só num deploy seguinte.

**Logo e dados da empresa:** os logos ficam em `public/` (`logo.svg` completo, `logo-branco.svg`, `marca.svg` só com as
árvores e `logo.png` transparente para o Excel); razão social e CNPJ ficam em `src/lib/empresa.ts`.

## Estrutura

```
prisma/schema.prisma        modelos (manutenção + produção: BoletimProducao, ParadaProducao, CicloSecagem…)
prisma/seed.ts              admin inicial, setores e catálogo da serraria (+ demo)
prisma/dados/serraria.json  motivos de parada e equipamentos da linha (da planilha da serraria)
scripts/capturas-manual.ts  gera as capturas de tela do manual (npm run manual:capturas → public/ajuda/)
src/lib/producao.ts         cálculos (m³, KPIs/OEE), rótulos e checklist das estufas
src/app/(app)/producao/     páginas do módulo de produção (+ /producao/excel)
src/proxy.ts                bloqueia páginas para quem não está logado
src/lib/session.ts          sessão (cookie JWT httpOnly) e guardas exigirModulo/exigirPermissao/exigirProducao
src/lib/permissoes.ts       perfis, módulos e regras (temModulo, pode, podeProducao)
src/app/actions/            Server Actions (auth, admin, requisições, planejamento, serraria, paradas, rastreio, cadastros, triagem, notificações)
src/app/(app)/              páginas autenticadas (manual em src/app/(app)/ajuda)
src/lib/manual/             conteúdo do manual do usuário (/ajuda), por grupo: geral, serraria, manutenção
src/lib/roteiros.ts         roteiros por função para imprimir (/ajuda/roteiros)
public/sw.js                service worker do PWA (telas offline em PAGINAS_OFFLINE; mudou? suba a versão do cache)
public/ajuda/               capturas de tela do manual (geradas pelo script)
```
