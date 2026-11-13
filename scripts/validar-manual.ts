// Confere o manual (/ajuda): links "/ajuda/<seção>#<tópico>" no texto, no glossário, nos problemas e nos
// roteiros apontam para algo que existe; ids repetidos; e lista as capturas que ainda faltam em public/ajuda.
// Uso: npm run manual:validar
import { GERAL, SERRARIA, MANUTENCAO, GLOSSARIO, PROBLEMAS, type Bloco, type Secao } from "@/lib/manual";
import { ROTEIROS } from "@/lib/roteiros";
import { existsSync, readFileSync } from "node:fs";
import { NOTAS, VERSAO } from "@/lib/versao";
const secoes: Secao[] = [...GERAL, ...SERRARIA, ...MANUTENCAO];
const ids = new Map<string, Set<string>>();
for (const s of secoes) ids.set(s.id, new Set(s.topicos.map((t) => t.id)));
const norm = (t: string) => t.replace(/\s*\(.*\)\s*$/, "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
ids.set("glossario", new Set(GLOSSARIO.map((t) => norm(t.termo))));
ids.set("problemas", new Set(PROBLEMAS.map((p) => p.id)));
ids.set("roteiros", new Set());
ids.set("sem-internet", ids.get("sem-internet") ?? new Set());
const erros: string[] = []; let links = 0, imagens = 0; const faltaImg: string[] = [];
const dup = new Set<string>(); const vistos = new Set<string>();
for (const s of secoes) { if (vistos.has(s.id)) dup.add(s.id); vistos.add(s.id); const tv = new Set<string>(); for (const t of s.topicos) { if (tv.has(t.id)) erros.push(`tópico duplicado ${s.id}#${t.id}`); tv.add(t.id); } }
function checarTexto(txt: string, onde: string) {
  for (const m of txt.matchAll(/\/ajuda(?:\/([a-z0-9-]+))?(?:#([a-z0-9-]+))?/g)) {
    links++; const [, sec, top] = m; if (!sec) continue;
    if (!ids.has(sec)) { erros.push(`${onde}: seção inexistente /ajuda/${sec}`); continue; }
    if (top && !ids.get(sec)!.has(top)) erros.push(`${onde}: tópico inexistente /ajuda/${sec}#${top}`);
  }
}
function blocos(bs: Bloco[], onde: string) {
  for (const b of bs) {
    if (b.tipo === "texto" || b.tipo === "dica" || b.tipo === "atencao") checarTexto(b.texto, onde);
    else if (b.tipo === "passos" || b.tipo === "lista") b.itens.forEach((i) => checarTexto(i, onde));
    else if (b.tipo === "termos") b.itens.forEach(([a, c]) => checarTexto(a + " " + c, onde));
    else if (b.tipo === "imagem") { imagens++; if (!existsSync(`public/ajuda/${b.imagem.arquivo}`)) faltaImg.push(`${b.imagem.arquivo} (${b.imagem.perfil} ${b.imagem.rota})`); }
  }
}
for (const s of secoes) for (const t of s.topicos) blocos(t.blocos, `${s.id}#${t.id}`);
for (const p of PROBLEMAS) blocos(p.blocos, `problemas#${p.id}`);
for (const t of GLOSSARIO) { checarTexto(t.definicao, `glossario:${t.termo}`); if (t.veja) checarTexto(t.veja, `glossario.veja:${t.termo}`); }
checarTexto(JSON.stringify(ROTEIROS), "roteiros");
console.log(`seções ${secoes.length} (geral ${GERAL.length}, serraria ${SERRARIA.length}, manutenção ${MANUTENCAO.length}); tópicos ${secoes.reduce((n, s) => n + s.topicos.length, 0)}; glossário ${GLOSSARIO.length}; problemas ${PROBLEMAS.length}`);
console.log(`links /ajuda: ${links}; imagens: ${imagens} (faltando arquivo: ${faltaImg.length}); seções duplicadas: ${[...dup].join(",") || "nenhuma"}`);
if (faltaImg.length) console.log(`Capturas faltando (rode npm run manual:capturas):\n  ` + faltaImg.join("\n  "));
// Notas de atualização: package.json acompanha a versão atual; versões únicas e em ordem (mais nova primeiro)
const pacote = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
if (pacote.version !== VERSAO) erros.push(`package.json está na versão ${pacote.version}, mas a nota mais nova (src/lib/versao.ts) é ${VERSAO}`);
const num = (v: string) => v.split(".").map(Number).reduce((a, n) => a * 1000 + n, 0);
NOTAS.forEach((n, i) => {
  if (!/^\d+\.\d+\.\d+$/.test(n.versao) || !/^\d{4}-\d{2}-\d{2}$/.test(n.data)) erros.push(`nota ${n.versao}: versão ou data fora do formato`);
  const prox = NOTAS[i + 1];
  if (prox && (num(n.versao) <= num(prox.versao) || n.data < prox.data)) erros.push(`nota ${n.versao}: precisa vir antes de ${prox.versao} (mais nova primeiro)`);
});
console.log(`ERROS (${erros.length}):\n` + erros.join("\n"));
if (erros.length) process.exit(1);
