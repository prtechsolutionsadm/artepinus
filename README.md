# Artepinus · Site e sistema

- **Site institucional** público em `/` (`src/app/(site)`): empresa, processo, produtos, rastreabilidade
  e contato, com o botão **Acessar sistema** (`/sistema` → login → módulo do usuário).
  Contatos (telefone, WhatsApp, e-mail, endereço) ficam em `src/lib/empresa.ts` — o site só mostra o que
  estiver preenchido.
- **Sistema (PWA)** em módulos:
  - **Serraria** (rotas `/producao`) — toras, apontamento em grade com etiqueta de lote, estufas,
    pacotes com QR Code, inventário, indicadores (OEE) e pedidos, funcionando também sem internet.
  - **Manutenção** — requisições de manutenção. **Em teste** (`MODULOS_EM_TESTE` em
    `src/lib/permissoes.ts`): aparece como "Em breve" para todos e abre só para o Administrador. Para
    liberar a todos, mova para `MODULOS_ATIVOS`. Código e dados continuam.

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
estiver em teste, só o Admin a abre. Quem usa os dois troca de módulo no rodapé do menu lateral (no
celular, em *Mais*).

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
- **Horas trabalhadas** por manutentor em cada requisição.
- **Checklists** por tipo de serviço; a requisição só pode ser concluída com todos os itens marcados.
- **Preventiva automática**: planos por equipamento (a cada N dias/semanas/meses) geram a requisição
  já agendada, com responsável e checklist, alguns dias antes da data.
- **QR Code** em cada equipamento: etiquetas para imprimir; apontar a câmera abre a requisição já com a
  máquina escolhida. Ficha do equipamento com dados, preventivas e histórico.
- **Indicadores**: disponibilidade, tempo parado, MTTR, MTBF, tempo médio de atendimento, preventivas no
  prazo, horas por manutentor, requisições por mês, ranking de equipamentos e setores.
- **Sem internet**: a nova requisição (com fotos) fica guardada no aparelho e é enviada sozinha quando a
  conexão volta.
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
- **Manual do usuário** dentro do app (`/ajuda`, conteúdo em `src/lib/manual.ts`): passo a passo por
  tema, com busca, índice e impressão; cada perfil vê só as seções que usa.
- **PWA**: instalável no celular ("Adicionar à tela inicial"), com tela de "sem conexão".

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
src/lib/producao.ts         cálculos (m³, KPIs/OEE), rótulos e checklist das estufas
src/app/(app)/producao/     páginas do módulo de produção (+ /producao/excel)
src/proxy.ts                bloqueia páginas para quem não está logado
src/lib/session.ts          sessão (cookie JWT httpOnly) e guardas exigirModulo/exigirPermissao/exigirProducao
src/lib/permissoes.ts       perfis, módulos e regras (temModulo, pode, podeProducao)
src/app/actions/            Server Actions (auth, admin, requisições, planejamento, serraria, paradas, rastreio, cadastros, notificações)
src/app/(app)/              páginas autenticadas
public/sw.js                service worker do PWA
```
