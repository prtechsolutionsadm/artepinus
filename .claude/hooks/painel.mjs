#!/usr/bin/env node
// Hook do Painel de Agentes: manda um resumo de cada evento do Claude Code para o painel.
// Roda no PC e nas sessões da nuvem. Nunca trava nem atrapalha o Claude: sem configuração,
// sem rede ou com erro, sai em silêncio (código 0) e não escreve nada na saída.
//
// Configuração (a primeira que existir):
//   1. variáveis PAINEL_URL e PAINEL_TOKEN (na nuvem: nas variáveis do ambiente)
//   2. arquivo ~/.painel-agentes.json  {"url": "...", "token": "..."}  (nos PCs)
import { readFileSync } from 'node:fs';
import { homedir, hostname } from 'node:os';
import { basename, isAbsolute, join, relative } from 'node:path';

function config() {
  if (process.env.PAINEL_URL) return { url: process.env.PAINEL_URL, token: process.env.PAINEL_TOKEN };
  try {
    const c = JSON.parse(readFileSync(join(homedir(), '.painel-agentes.json'), 'utf8'));
    if (c && c.url) return { url: c.url, token: c.token };
  } catch {}
  return null;
}

function lerEntrada() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
}

function git(dir) {
  const out = {};
  try {
    const head = readFileSync(join(dir, '.git', 'HEAD'), 'utf8').trim();
    const m = head.match(/^ref: refs\/heads\/(.+)$/);
    out.branch = m ? m[1] : head.slice(0, 8);
  } catch {}
  try {
    const cfg = readFileSync(join(dir, '.git', 'config'), 'utf8');
    const bloco = cfg.split(/\n(?=\[)/).find((b) => b.startsWith('[remote "origin"]'));
    const url = bloco && bloco.match(/^\s*url\s*=\s*(.+)$/m);
    if (url) out.repo = url[1].trim().replace(/\.git$/, '').split(/[/:]/).filter(Boolean).pop();
  } catch {}
  return out;
}

const curto = (s, n = 160) => {
  if (typeof s !== 'string') return '';
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

function resumo(ferramenta, input, dir) {
  const i = input || {};
  const arq = (p) => {
    if (typeof p !== 'string') return '';
    const r = isAbsolute(p) && dir ? relative(dir, p) : p;
    return r && !r.startsWith('..') ? r.replace(/\\/g, '/') : basename(p);
  };
  switch (ferramenta) {
    case 'Read':
      return `Lendo ${arq(i.file_path)}`;
    case 'Edit':
    case 'MultiEdit':
      return `Editando ${arq(i.file_path)}`;
    case 'Write':
      return `Escrevendo ${arq(i.file_path)}`;
    case 'NotebookEdit':
      return `Editando ${arq(i.notebook_path)}`;
    case 'Bash':
      return `Rodando: ${curto(i.description || i.command, 120)}`;
    case 'Grep':
      return `Procurando "${curto(i.pattern, 60)}"`;
    case 'Glob':
      return `Procurando arquivos ${curto(i.pattern, 60)}`;
    case 'WebFetch':
      try {
        return `Abrindo ${new URL(i.url).host}`;
      } catch {
        return 'Abrindo página';
      }
    case 'WebSearch':
      return `Pesquisando "${curto(i.query, 80)}"`;
    case 'Task':
    case 'Agent':
      return `Subagente: ${curto(i.description || i.subagent_type || 'tarefa', 100)}`;
    case 'TodoWrite':
      return 'Atualizando a lista de tarefas';
    case 'AskUserQuestion':
      return 'Fazendo uma pergunta';
    default:
      if (ferramenta && ferramenta.startsWith('mcp__')) {
        const [, srv, tool] = ferramenta.split('__');
        return `Usando ${srv}: ${tool || ''}`.trim();
      }
      return `Usando ${ferramenta || 'ferramenta'}`;
  }
}

async function main() {
  const cfg = config();
  if (!cfg) return;
  const h = lerEntrada();
  if (!h || !h.hook_event_name || !h.session_id) return;

  const dir = process.env.CLAUDE_PROJECT_DIR || h.cwd || process.cwd();
  const g = git(dir);
  const nuvem = process.env.CLAUDE_CODE_REMOTE === 'true';
  const idNuvem = process.env.CLAUDE_CODE_REMOTE_SESSION_ID;

  const ev = {
    v: 1,
    evento: h.hook_event_name,
    sessao: h.session_id,
    projeto: g.repo || basename(dir),
    pasta: dir,
    origem: nuvem ? 'nuvem' : 'pc',
    maquina: nuvem ? 'nuvem' : hostname(),
    branch: g.branch,
    link: nuvem && idNuvem ? `https://claude.ai/code/${idNuvem.replace(/^cse_/, 'session_')}` : undefined,
    em: new Date().toISOString(),
  };
  if (h.tool_name) {
    ev.ferramenta = h.tool_name;
    ev.detalhe = resumo(h.tool_name, h.tool_input, dir);
  }
  if (h.hook_event_name === 'UserPromptSubmit') ev.prompt = curto(h.prompt, 300);
  if (h.hook_event_name === 'Notification') ev.mensagem = curto(h.message, 200);

  const headers = { 'Content-Type': 'application/json' };
  if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;
  await fetch(`${cfg.url.replace(/\/$/, '')}/api/eventos`, {
    method: 'POST',
    headers,
    body: JSON.stringify(ev),
    signal: AbortSignal.timeout(4000),
  });
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
