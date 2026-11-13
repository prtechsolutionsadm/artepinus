// Formato do manual do usuário (/ajuda). O conteúdo fica em arquivos por grupo
// (geral.ts, serraria.ts, manutencao.ts, glossario.ts, problemas.ts) e é juntado em index.ts.
// Sem dependências de servidor: o script das capturas (scripts/capturas-manual.ts) também lê estes dados.
import type { Acao, AcaoProducao, Modulo } from "@/lib/permissoes";

/** Quem está logado na captura de tela (usuários de demonstração do seed). */
export type PersonaCaptura = "apontador" | "supervisor" | "gerente" | "manutentor" | "operador" | "admin";

/** Passo antes da foto: seletor do Playwright (ex.: "text=Paradas", "role=tab[name='Pedidos']", "#busca"). */
export type AcaoCaptura = { clicar: string } | { preencher: string; valor: string } | { esperar: number } | { rolarAte: string };

/**
 * Captura de tela real, gerada por `npx tsx scripts/capturas-manual.ts` com os dados de demonstração
 * e gravada em public/ajuda/<arquivo>. Rode de novo quando a tela mudar.
 */
export type Captura = {
  /** Caminho em public/ajuda, ex.: "serraria/ficha.webp" (sempre .webp). */
  arquivo: string;
  /** Texto abaixo da imagem (e texto alternativo). */
  legenda: string;
  /** Tela a abrir, ex.: "/producao/boletins/novo". */
  rota: string;
  perfil: PersonaCaptura;
  /** Padrão: celular (390×844). */
  tela?: "celular" | "computador";
  acoes?: AcaoCaptura[];
};

export type Bloco =
  | { tipo: "texto"; texto: string }
  | { tipo: "passos"; itens: string[] }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "dica"; texto: string }
  | { tipo: "atencao"; texto: string }
  | { tipo: "termos"; itens: [string, string][] }
  | { tipo: "imagem"; imagem: Captura };

export type Topico = {
  /** Âncora do tópico (#id), única na seção; minúsculas e hífens. */
  id: string;
  titulo: string;
  /** Mostra o tópico só para quem usa o módulo / tem a permissão. */
  modulo?: Modulo;
  para?: Acao;
  paraProducao?: AcaoProducao;
  /** Telas (prefixos de rota) cuja ajuda abre direto neste tópico. */
  rotas?: string[];
  /** Sinônimos e palavras que o usuário digitaria na busca (sem acento não é preciso). */
  palavras?: string[];
  blocos: Bloco[];
};

export type Grupo = "geral" | "serraria" | "manutencao";

export type Secao = {
  /** Endereço da seção: /ajuda/<id>. */
  id: string;
  grupo: Grupo;
  titulo: string;
  /** Uma linha: o que a pessoa aprende aqui. */
  resumo: string;
  modulo?: Modulo;
  para?: Acao;
  paraProducao?: AcaoProducao;
  /** Telas (prefixos de rota) cuja ajuda "?" abre esta seção; o prefixo mais longo vence. */
  rotas?: string[];
  topicos: Topico[];
};

/** Termo do glossário (/ajuda/glossario). */
export type Termo = { termo: string; definicao: string; modulo?: Modulo; /** Link para saber mais, ex.: "/ajuda/serraria-ficha#lote". */ veja?: string };

/** Problema comum e como resolver (/ajuda/problemas). */
export type Problema = { id: string; pergunta: string; modulo?: Modulo; palavras?: string[]; blocos: Bloco[] };
