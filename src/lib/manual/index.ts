// Manual do usuário: junta os grupos e traz as funções das páginas /ajuda (filtro por acesso,
// busca, links no texto e ajuda por tela). Sem dependências de servidor: o script das capturas
// (scripts/capturas-manual.ts) também lê daqui.
import { modulosDe, pode, podeProducao, temModulo, type Acao, type AcaoProducao, type Modulo, type UsuarioComPerfis } from "@/lib/permissoes";
import { GERAL } from "./geral";
import { GLOSSARIO } from "./glossario";
import { MANUTENCAO } from "./manutencao";
import { PROBLEMAS } from "./problemas";
import { SERRARIA } from "./serraria";
import type { Bloco, Grupo, Problema, Secao, Termo } from "./tipos";

export * from "./tipos";
export { GERAL, SERRARIA, MANUTENCAO, GLOSSARIO, PROBLEMAS };

/** Todas as seções: geral, serraria (na ordem do processo) e manutenção. */
export const MANUAL: Secao[] = [...GERAL, ...SERRARIA, ...MANUTENCAO];

/** Grupos do manual (abas de /ajuda), na ordem em que aparecem. */
export const GRUPOS: Record<Grupo, { nome: string; modulo?: Modulo }> = {
  serraria: { nome: "Serraria", modulo: "producao" },
  manutencao: { nome: "Manutenção", modulo: "manutencao" },
  geral: { nome: "Geral" },
};
export const ORDEM_GRUPOS: Grupo[] = ["serraria", "manutencao", "geral"];

/** Grupo do manual de cada módulo (aba aberta de início: a do módulo em uso). */
export const GRUPO_DO_MODULO: Record<Modulo, Grupo> = { producao: "serraria", manutencao: "manutencao" };

/** Páginas especiais do manual (destino → nome). */
export const PAGINAS_AJUDA = {
  "/ajuda": "Manual do usuário",
  "/ajuda/glossario": "Glossário",
  "/ajuda/problemas": "Problemas comuns",
  "/ajuda/roteiros": "Roteiros para imprimir",
} as const;

/** Sem nenhum módulo liberado, o manual mostra só o que vale para todos (entrar e cuidar da conta). */
const SECOES_SEM_MODULO = ["primeiros-passos", "meu-perfil", "avisos"];

type Restricao = { modulo?: Modulo; para?: Acao; paraProducao?: AcaoProducao };

function liberado(u: UsuarioComPerfis, r: Restricao) {
  return (!r.modulo || temModulo(u, r.modulo)) && (!r.para || pode(u.perfil, r.para)) && (!r.paraProducao || podeProducao(u, r.paraProducao));
}

/** Módulo da seção: o informado ou o do grupo (Serraria/Manutenção). */
export function moduloDaSecao(s: Secao): Modulo | undefined {
  return s.modulo ?? GRUPOS[s.grupo].modulo;
}

/**
 * Seções e tópicos que a pessoa enxerga: mesmo critério das telas (módulo por temModulo,
 * `para` por pode, `paraProducao` por podeProducao), também por tópico. Seção sem tópico some.
 */
export function secoesPara(u: UsuarioComPerfis): Secao[] {
  const semModulo = modulosDe(u).length === 0;
  return MANUAL.filter((s) => liberado(u, { ...s, modulo: moduloDaSecao(s) }) && (!semModulo || SECOES_SEM_MODULO.includes(s.id)))
    .map((s) => ({ ...s, topicos: s.topicos.filter((t) => liberado(u, t)) }))
    .filter((s) => s.topicos.length > 0);
}

const porNome = (a: string, b: string) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });

/** Termos do glossário que a pessoa enxerga, de A a Z. */
export function glossarioPara(u: UsuarioComPerfis): Termo[] {
  return GLOSSARIO.filter((t) => !t.modulo || temModulo(u, t.modulo)).sort((a, b) => porNome(a.termo, b.termo));
}

/** Problemas comuns que a pessoa enxerga. */
export function problemasPara(u: UsuarioComPerfis): Problema[] {
  return PROBLEMAS.filter((p) => !p.modulo || temModulo(u, p.modulo));
}

/** Minúsculas e sem acento (busca e comparação de títulos). */
export function normalizar(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Âncora de um termo do glossário: /ajuda/glossario#<id> ("Lote (LOT-000123)" → "lote"). */
export function idDoTermo(termo: string) {
  return normalizar(termo.replace(/\(.*?\)/g, ""))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Link no texto: "(/ajuda/...)" logo depois do nome da parte citada, ex.:
 * "veja Trabalhar sem internet (/ajuda/sem-internet)". Nas páginas vira link; na busca, some.
 */
export const LINK_AJUDA = /\s*\((\/ajuda(?:[/?#][^\s()]*)?)\)/g;

export function semLinks(texto: string) {
  return texto.replace(LINK_AJUDA, "");
}

/** Texto corrido dos blocos (busca), sem os caminhos dos links. */
export function textoDosBlocos(blocos: Bloco[]): string {
  return semLinks(
    blocos
      .map((b) => {
        switch (b.tipo) {
          case "texto":
          case "dica":
          case "atencao":
            return b.texto;
          case "passos":
          case "lista":
            return b.itens.join(" ");
          case "termos":
            return b.itens.map(([t, d]) => `${t}: ${d}`).join(" ");
          case "imagem":
            return b.imagem.legenda;
        }
      })
      .join(" "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** Destinos que a pessoa pode abrir ("/ajuda/<secao>#<topico>" → título), para os links do texto. */
export type Destinos = Map<string, string>;

/** `roteiros`: a pessoa tem alguma folha em /ajuda/roteiros (roteirosPara de @/lib/roteiros); sem nenhuma, o link vira texto. */
export function destinosDoManual(secoes: Secao[], termos: Termo[], problemas: Problema[], roteiros = true): Destinos {
  const m: Destinos = new Map(Object.entries(PAGINAS_AJUDA));
  if (!roteiros) m.delete("/ajuda/roteiros");
  for (const s of secoes) {
    m.set(`/ajuda/${s.id}`, s.titulo);
    for (const t of s.topicos) m.set(`/ajuda/${s.id}#${t.id}`, t.titulo);
  }
  if (!termos.length) m.delete("/ajuda/glossario");
  for (const t of termos) m.set(`/ajuda/glossario#${idDoTermo(t.termo)}`, t.termo);
  if (!problemas.length) m.delete("/ajuda/problemas");
  for (const p of problemas) m.set(`/ajuda/problemas#${p.id}`, p.pergunta);
  return m;
}

/**
 * Título do destino de um link do texto, ou null se a pessoa não enxerga aquela parte.
 * Âncora desconhecida numa página visível: vale o título da página.
 */
export function tituloDoDestino(caminho: string, destinos: Destinos): string | null {
  const [semBusca, ancora] = caminho.split("#");
  const base = semBusca.split("?")[0].replace(/\/+$/, "") || "/ajuda";
  return destinos.get(ancora ? `${base}#${ancora}` : base) ?? destinos.get(base) ?? null;
}

/** A parte é só para um perfil (permissão `para`/`paraProducao` na seção ou no tópico)? */
const restrita = (r: Restricao) => !!(r.para || r.paraProducao);

/**
 * Ajuda por tela: a parte do manual da tela `de` (caminho com a busca, ex.: "/producao/cadastros?aba=config").
 * Vale o prefixo de rota mais longo. Empatado, vence a parte escrita para um perfil (`para`/`paraProducao`,
 * que só está em `secoes` para quem tem a permissão) e, depois, o tópico vence a seção. Rota com "?" exige
 * os mesmos parâmetros na tela; rota terminada em "/*" vale só para as subpáginas (ex.: "/requisicoes/*" é
 * a página de uma requisição, não a lista). Sem nenhuma, volta "/ajuda".
 */
export function ajudaDaTela(de: string, secoes: Secao[]): string {
  let url: URL;
  try {
    url = new URL(de, "http://local");
  } catch {
    return "/ajuda";
  }
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const candidatos: { tamanho: number; restrita: boolean; topico: boolean; destino: string }[] = [];
  const conferir = (rota: string, destino: string, topico: boolean, restrita: boolean) => {
    const [base, consulta] = rota.split("?");
    const soSubpaginas = base.endsWith("/*");
    const r = base.replace(/\/\*$/, "").replace(/\/+$/, "") || "/";
    const prefixo = r === "/" ? "/" : `${r}/`;
    if (soSubpaginas ? !path.startsWith(prefixo) || path === r : path !== r && !path.startsWith(prefixo)) return;
    if (consulta) for (const [k, v] of new URLSearchParams(consulta)) if (url.searchParams.get(k) !== v) return;
    candidatos.push({ tamanho: rota.length, restrita, topico, destino });
  };
  for (const s of secoes) {
    for (const r of s.rotas ?? []) conferir(r, `/ajuda/${s.id}`, false, restrita(s));
    for (const t of s.topicos) for (const r of t.rotas ?? []) conferir(r, `/ajuda/${s.id}#${t.id}`, true, restrita(s) || restrita(t));
  }
  candidatos.sort((a, b) => b.tamanho - a.tamanho || Number(b.restrita) - Number(a.restrita) || Number(b.topico) - Number(a.topico));
  return candidatos[0]?.destino ?? "/ajuda";
}

/** Entrada do índice da busca: só texto, montado no servidor com o que a pessoa enxerga. */
export type EntradaBusca = {
  /** Destino: /ajuda/<secao>#<topico>, /ajuda/glossario#<termo>, /ajuda/problemas#<id>. */
  href: string;
  titulo: string;
  /** Onde fica, ex.: "Serraria · Estufas". */
  onde: string;
  grupo?: Grupo;
  /** Sinônimos e palavras da busca. */
  palavras: string;
  texto: string;
};

export function indiceBusca(secoes: Secao[], termos: Termo[], problemas: Problema[]): EntradaBusca[] {
  const indice: EntradaBusca[] = [];
  for (const s of secoes) {
    const grupo = GRUPOS[s.grupo].nome;
    indice.push({ href: `/ajuda/${s.id}`, titulo: s.titulo, onde: grupo, grupo: s.grupo, palavras: "", texto: semLinks(s.resumo) });
    for (const t of s.topicos) {
      indice.push({
        href: `/ajuda/${s.id}#${t.id}`,
        titulo: t.titulo,
        onde: `${grupo} · ${s.titulo}`,
        grupo: s.grupo,
        palavras: (t.palavras ?? []).join(" "),
        texto: textoDosBlocos(t.blocos),
      });
    }
  }
  for (const t of termos) {
    indice.push({ href: `/ajuda/glossario#${idDoTermo(t.termo)}`, titulo: t.termo, onde: PAGINAS_AJUDA["/ajuda/glossario"], palavras: "glossario", texto: semLinks(t.definicao) });
  }
  for (const p of problemas) {
    indice.push({
      href: `/ajuda/problemas#${p.id}`,
      titulo: p.pergunta,
      onde: PAGINAS_AJUDA["/ajuda/problemas"],
      palavras: ["problema", ...(p.palavras ?? [])].join(" "),
      texto: textoDosBlocos(p.blocos),
    });
  }
  return indice;
}
