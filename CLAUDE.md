# Artepinus · Site e sistema

`/` é o site institucional público (`src/app/(site)`, rotas públicas em `src/proxy.ts`); o sistema entra por `/sistema`. A manutenção está desligada em `MODULOS_ATIVOS` (`src/lib/permissoes.ts`) — não apague o código dela.

Next.js 16 (App Router) + Prisma 7 (client gerado em `src/generated/prisma`) + Prisma Postgres (`DATABASE_URL` = string TCP direta; local com `npm run db:local`). Interface e código em português.

- Driver escolhido em `src/lib/adaptador.ts`: `@prisma/adapter-ppg` (serverless) para `db.prisma.io` — na Vercel um pool TCP por instância estoura o limite de conexões; `@prisma/adapter-pg` com pool pequeno para Postgres local. Não troque de volta para TCP em produção.

- Checks: `npx tsc --noEmit` e `npm run build`.
- Mudou `prisma/schema.prisma`? Rode `npx prisma migrate dev --name <nome>` e commite a migration.
- Mutations ficam em `src/app/actions/*` (Server Actions validadas com zod; sempre checar permissão com `exigirPermissao`/`pode` de `src/lib/permissoes.ts`).
- Módulos: Manutenção (`perfil`; `SEM_ACESSO` = não usa) e Produção (`perfilProducao`; Admin/Gerente sempre têm). Páginas de manutenção usam `exigirModulo("manutencao")`/`exigirPermissao`; as de produção `exigirProducao(acao)`, e as actions `podeProducao(eu, "lancar" | "gerir")`. Menus por módulo em `src/lib/menu.ts`.
- Rastreabilidade: Pacote (`numero` → código `PCT-000123`, helpers em `src/lib/rastreio.ts`) ligado a boletim/ciclo e a um `Pedido`; boletim ⇄ cargas e ciclo ⇄ boletins são m2m; carga → floresta/fornecedor/motorista (colheita/talhão só em dados antigos). Toda mudança de pacote cria um `EventoPacote` (a linha do tempo do QR).
- Serraria: apontamento em grade (`GradeBitolas`: espessura × largura × comprimento de `ESPESSURAS`/`LARGURAS`/`COMPRIMENTOS` em `src/lib/producao.ts`) via `lancarLote()`; cada `Lote` (`LOT-000123`, etiqueta com QR + code128) tem um pedido e uma espessura; a classe (Ótimo/Bom/Regular) sai do comprimento. Meta/horas do boletim vêm de `ConfigSerraria` (id "padrao"), somente leitura.
- Offline: apontamentos (carga, lote, inventário) usam `enviarOuGuardar()` de `src/lib/fila-offline.ts` (IndexedDB, `chaveOffline` para idempotência) e sincronizam por `/api/offline`; páginas offline em `PAGINAS_OFFLINE` de `public/sw.js`.
- Textos: não use a palavra "Produção" em rótulos/títulos da interface (pedido do cliente); a pasta/rotas `/producao` continuam.
- KPIs só por `calcularKpis()` (`src/lib/producao.ts`); OEE = Disponibilidade × Produtividade (sem Qualidade); m³ das bitolas é calculado no servidor (mm → m³). Datas de boletim são `@db.Date` ("AAAA-MM-DD" via `diaParaDate`/`dateParaDia`).
- Mudanças de status sempre geram um registro em `HistoricoStatus`.
- Datas: o servidor roda em UTC; use os helpers de `src/lib/constantes.ts` (horário de Brasília).
- Toda ação que altera dados registra em `Auditoria` via `auditar()` de `src/lib/auditoria.ts`.
- Nova requisição: `criarRequisicaoCompleta()` em `src/lib/requisicoes.ts` (usada pelo formulário e pela fila offline `/api/requisicoes/offline`).
- Fotos passam por `processarFoto()` (sharp: 1600px, JPEG, sem EXIF) e são servidas por `/api/anexos/[id]` só para logados.
