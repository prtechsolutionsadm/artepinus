"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, SearchX, X } from "lucide-react";
import type { EntradaBusca, Grupo } from "@/lib/manual";

const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Palavras que não ajudam a achar nada. */
const VAZIAS = new Set("a o as os e de da do das dos em no na nos nas um uma uns umas para pra por com como que eu meu minha se ao aos the faco fazer onde qual quando".split(" "));

/** Expressões de mais de uma palavra (procuradas antes) e o que mais elas querem dizer. */
const FRASES: [string, string[]][] = [
  ["sem internet", ["offline", "sem conexao", "sem sinal", "fila"]],
  ["sem conexao", ["sem internet", "offline"]],
  ["sem sinal", ["sem internet", "offline"]],
  ["sem rede", ["sem internet", "offline"]],
  ["codigo de barras", ["etiqueta", "ler etiqueta", "camera"]],
  ["tentar de novo", ["recusad", "tentar de novo"]],
  ["maquina parada", ["maquina parou", "parada"]],
  ["maquina parou", ["maquina parada", "parada"]],
  ["esqueci a senha", ["recuperar", "senha"]],
];

/** Sinônimos: o que a pessoa digita → como o manual chama. */
const SINONIMOS: Record<string, string[]> = {
  offline: ["sem internet", "sem conexao"],
  internet: ["conexao", "offline"],
  camera: ["ler etiqueta", "qr", "escanear"],
  qr: ["etiqueta", "camera"],
  scanner: ["ler etiqueta", "camera"],
  leitor: ["ler etiqueta", "camera"],
  escanear: ["ler etiqueta", "camera"],
  impressora: ["imprim", "etiqueta", "pdf"],
  imprimir: ["imprim", "etiqueta", "pdf"],
  impressao: ["imprim", "etiqueta", "pdf"],
  apagar: ["exclu", "apag", "corrig"],
  excluir: ["exclu", "apag", "corrig"],
  deletar: ["exclu", "apag"],
  remover: ["exclu", "remov"],
  corrigir: ["corrig", "edit", "exclu"],
  editar: ["edit", "corrig"],
  errado: ["corrig", "edit", "exclu"],
  erro: ["corrig", "recusad", "problema"],
  fila: ["fila", "sincroniz", "aguardando"],
  aguardando: ["fila", "aguardando"],
  sincronizar: ["sincroniz", "fila"],
  pendente: ["pendent", "fila"],
  ficha: ["ficha", "apontamento"],
  apontar: ["apont", "lanc"],
  lancar: ["lanc", "apont"],
  aviso: ["aviso", "notifica", "sininho"],
  notificacao: ["notifica", "aviso", "sininho"],
  sininho: ["sininho", "aviso", "notifica"],
  instalar: ["instal", "aplicativo", "tela inicial"],
  aplicativo: ["aplicativo", "instal", "app"],
  app: ["aplicativo", "instal", "app"],
  chamado: ["requisic", "chamado"],
  ordem: ["requisic", "ordem"],
  caminhao: ["carga", "caminhao", "tora"],
  secagem: ["secag", "estufa", "ciclo"],
  secar: ["secag", "estufa", "ciclo"],
  vender: ["pedido", "disponivel", "venda"],
  venda: ["pedido", "disponivel", "venda"],
  cliente: ["pedido", "cliente"],
  saida: ["saida", "expedi", "romaneio"],
  expedir: ["expedi", "romaneio", "saida"],
  embarque: ["expedi", "romaneio", "carregamento"],
  tema: ["tema", "escuro", "claro"],
  escuro: ["escuro", "tema"],
  glossario: ["glossario", "termo"],
};

/** Raiz da palavra (plural simples): "estufas" → "estufa", "requisicoes" → "requisic". */
const raiz = (p: string) => (p.length > 3 ? p.replace(/(oes|aes|ns|eis|s)$/, "") : p);

/** Cada termo da busca é uma lista de alternativas (a palavra e os sinônimos). */
function termosDaBusca(busca: string): string[][] {
  let resto = ` ${normalizar(busca).replace(/[^\p{L}\p{N}-]+/gu, " ")} `;
  const termos: string[][] = [];
  for (const [frase, outras] of FRASES) {
    if (resto.includes(` ${frase} `)) {
      termos.push([frase, ...outras]);
      resto = resto.replace(` ${frase} `, " ");
    }
  }
  // Só palavras de 2+ letras que ajudam ("de", "como"… sozinhas não buscam nada)
  for (const p of resto.split(/\s+/)) {
    if (p.length > 1 && !VAZIAS.has(p)) termos.push([raiz(p), ...(SINONIMOS[p] ?? SINONIMOS[raiz(p)] ?? [])]);
  }
  return termos;
}

/** Texto normalizado com o índice de cada letra no original (para destacar no texto com acento). */
function mapear(texto: string) {
  let norm = "";
  const pos: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    const n = normalizar(texto[i]);
    for (let k = 0; k < n.length; k++) {
      norm += n[k];
      pos.push(i);
    }
  }
  pos.push(texto.length);
  return { norm, pos };
}

type Faixa = [number, number];

/** Trechos do texto original que batem com algum termo, já unidos e em ordem. */
function faixas(texto: string, termos: string[][]): Faixa[] {
  const { norm, pos } = mapear(texto);
  const achadas: Faixa[] = [];
  for (const alt of termos.flat()) {
    if (!alt) continue;
    for (let i = norm.indexOf(alt); i >= 0; i = norm.indexOf(alt, i + alt.length)) achadas.push([pos[i], pos[i + alt.length - 1] + 1]);
  }
  achadas.sort((a, b) => a[0] - b[0]);
  const unidas: Faixa[] = [];
  for (const f of achadas) {
    const u = unidas[unidas.length - 1];
    if (u && f[0] <= u[1]) u[1] = Math.max(u[1], f[1]);
    else unidas.push([...f]);
  }
  return unidas;
}

/** Texto com as faixas destacadas; `deslocamento` = início do trecho no texto original. */
function Marcado({ texto, faixas: fx, deslocamento = 0 }: { texto: string; faixas: Faixa[]; deslocamento?: number }) {
  const partes: React.ReactNode[] = [];
  let ultimo = 0;
  for (const [a0, b0] of fx) {
    const a = Math.max(0, a0 - deslocamento);
    const b = Math.min(texto.length, b0 - deslocamento);
    if (b <= a || a < ultimo) continue;
    partes.push(texto.slice(ultimo, a));
    partes.push(
      <mark key={a} className="rounded bg-amber-100 px-0.5 text-stone-900">
        {texto.slice(a, b)}
      </mark>,
    );
    ultimo = b;
  }
  partes.push(texto.slice(ultimo));
  return <>{partes}</>;
}

/** Trecho de cerca de 160 letras em volta da primeira palavra encontrada. */
function trecho(texto: string, fx: Faixa[]) {
  let ini = 0;
  if (texto.length > 170 && fx.length && fx[0][0] > 60) {
    ini = texto.indexOf(" ", fx[0][0] - 50) + 1 || fx[0][0];
  }
  let fim = Math.min(texto.length, ini + 160);
  if (texto.length - ini <= 170) fim = texto.length;
  else if (texto.lastIndexOf(" ", fim) > ini) fim = texto.lastIndexOf(" ", fim);
  return { corpo: texto.slice(ini, fim), inicio: ini, antes: ini > 0 ? "…" : "", depois: fim < texto.length ? "…" : "" };
}

/** Âncoras do manual antigo (uma página só) → páginas novas. */
const ANTIGAS: Record<string, string> = {
  "primeiros-passos": "/ajuda/primeiros-passos",
  "abrir-requisicao": "/ajuda/manutencao-abrir",
  acompanhar: "/ajuda/manutencao-acompanhar",
  notificacoes: "/ajuda/avisos",
  atender: "/ajuda/manutencao-atender",
  equipamentos: "/ajuda/manutencao-equipamentos",
  preventivas: "/ajuda/manutencao-preventivas",
  indicadores: "/ajuda/manutencao-indicadores",
  administracao: "/ajuda/usuarios",
  "producao-boletim": "/ajuda/serraria-ficha",
  "producao-rastreio": "/ajuda/serraria-pacotes",
  "producao-indicadores": "/ajuda/serraria-indicadores",
  "producao-estufas": "/ajuda/serraria-estufas",
  "producao-toras-estoque": "/ajuda/serraria-toras",
  "producao-cadastros": "/ajuda/serraria-cadastros",
  duvidas: "/ajuda/problemas",
};

const MAXIMO = 12;

/**
 * Busca do manual, no navegador: sem acento, com sinônimos, um resultado por tópico com o trecho e a
 * palavra destacada. Sem busca, mostra o conteúdo da página (children). Lê ?q= ao abrir.
 */
export function BuscaManual({
  indice,
  grupoEmUso,
  inicial = "",
  glossario,
  problemas,
  children,
}: {
  indice: EntradaBusca[];
  grupoEmUso?: Grupo;
  inicial?: string;
  glossario: boolean;
  problemas: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState(inicial);
  const adiada = useDeferredValue(busca);
  const campo = useRef<HTMLInputElement>(null);

  // Ao abrir: links antigos (/ajuda#producao-estufas) levam à página nova; ao voltar de um tópico,
  // a busca guardada no endereço volta (o histórico do Next guarda a página como foi aberta)
  useEffect(() => {
    const destino = ANTIGAS[window.location.hash.slice(1)];
    if (destino) {
      router.replace(destino);
      return;
    }
    const daUrl = new URLSearchParams(window.location.search).get("q");
    if (daUrl) setBusca(daUrl.slice(0, 100));
  }, [router]);

  // Guarda a busca no endereço (sem recarregar a página)
  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current) {
      montado.current = true;
      return;
    }
    const url = new URL(window.location.href);
    if (adiada.trim()) url.searchParams.set("q", adiada.trim());
    else url.searchParams.delete("q");
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [adiada]);

  const normalizado = useMemo(
    () => indice.map((e) => ({ e, titulo: normalizar(e.titulo), palavras: normalizar(e.palavras), onde: normalizar(e.onde), texto: normalizar(e.texto) })),
    [indice],
  );

  const termos = useMemo(() => termosDaBusca(adiada), [adiada]);

  const resultados = useMemo(() => {
    if (!termos.length) return null;
    const avaliados = normalizado.map((n) => {
      let pontos = 0;
      let batidos = 0;
      for (const alts of termos) {
        let melhor = 0;
        alts.forEach((a, k) => {
          const peso = k === 0 ? 1 : 0.6;
          if (n.titulo.includes(a)) melhor = Math.max(melhor, 10 * peso);
          else if (n.palavras.includes(a)) melhor = Math.max(melhor, 7 * peso);
          else if (n.onde.includes(a)) melhor = Math.max(melhor, 3 * peso);
          else if (n.texto.includes(a)) melhor = Math.max(melhor, 2 * peso);
        });
        if (melhor > 0) batidos++;
        pontos += melhor;
      }
      if (n.e.grupo && n.e.grupo === grupoEmUso) pontos += 2;
      // Tópico vale mais que a seção inteira (que só tem o resumo)
      if (n.e.href.includes("#")) pontos += 1;
      return { e: n.e, pontos, batidos };
    });
    // Todas as palavras; se nada, as que tiverem mais palavras em comum
    let lista = avaliados.filter((a) => a.batidos === termos.length);
    let parcial = false;
    if (!lista.length && termos.length > 1) {
      lista = avaliados.filter((a) => a.batidos >= Math.ceil(termos.length / 2));
      parcial = lista.length > 0;
    }
    lista.sort((a, b) => b.batidos - a.batidos || b.pontos - a.pontos);
    return { total: lista.length, parcial, itens: lista.slice(0, MAXIMO).map((a) => a.e) };
  }, [normalizado, termos, grupoEmUso]);

  const limpar = () => {
    setBusca("");
    campo.current?.focus();
  };

  return (
    <>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="nao-imprimir relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" aria-hidden />
        <input
          ref={campo}
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && busca) {
              e.preventDefault();
              limpar();
            }
          }}
          placeholder="O que você quer fazer? Ex.: etiqueta, sem internet, corrigir"
          aria-label="Buscar no manual"
          enterKeyHint="search"
          autoComplete="off"
          className="campo mt-0 h-12 pl-11 pr-11 text-base"
        />
        {busca && (
          <button
            type="button"
            onClick={limpar}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>
      <p className="sr-only" aria-live="polite">
        {!resultados ? "" : resultados.total === 1 ? "1 resultado" : resultados.total ? `${resultados.total} resultados` : "Nada encontrado"}
      </p>

      {!resultados ? (
        children
      ) : (
        <section aria-label="Resultados da busca">
          {resultados.itens.length > 0 ? (
            <>
              <p className="mb-3 text-sm text-stone-500" aria-hidden>
                {resultados.parcial
                  ? "Nada com todas as palavras. Veja o que chega mais perto:"
                  : resultados.total === 1
                    ? "1 resultado"
                    : resultados.total > MAXIMO
                      ? `${resultados.total} resultados. Mostrando os ${MAXIMO} mais próximos: escreva mais uma palavra para achar mais rápido.`
                      : `${resultados.total} resultados`}
              </p>
              <ul className="space-y-2">
                {resultados.itens.map((e) => {
                  const fx = faixas(e.texto, termos);
                  const t = trecho(e.texto, fx);
                  return (
                    <li key={e.href}>
                      <Link href={e.href} className="group block rounded-2xl border border-stone-200 bg-white px-4 py-3 transition hover:border-marca-300 hover:shadow-sm">
                        <span className="block text-xs font-medium text-stone-500">{e.onde}</span>
                        <span className="mt-0.5 flex items-start justify-between gap-3">
                          <span className="font-semibold text-stone-900">
                            <Marcado texto={e.titulo} faixas={faixas(e.titulo, termos)} />
                          </span>
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-marca-700" aria-hidden />
                        </span>
                        {t.corpo && (
                          <span className="mt-1 block text-sm leading-relaxed text-stone-600">
                            {t.antes}
                            <Marcado texto={t.corpo} faixas={fx} deslocamento={t.inicio} />
                            {t.depois}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-8 text-center">
              <SearchX className="mx-auto h-8 w-8 text-stone-400" aria-hidden />
              <p className="mt-2 font-medium text-stone-800">Nada encontrado para “{busca.trim()}”.</p>
              <p className="mt-1 text-sm text-stone-500">Tente outra palavra, como o nome do botão ou da tela.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {problemas && (
                  <Link href="/ajuda/problemas" className="btn-secundario">
                    Problemas comuns
                  </Link>
                )}
                {glossario && (
                  <Link href="/ajuda/glossario" className="btn-secundario">
                    Glossário
                  </Link>
                )}
                <button type="button" onClick={limpar} className="btn-secundario">
                  Ver o manual
                </button>
              </div>
              <p className="mt-4 text-sm text-stone-500">Ainda com dúvida? Fale com o seu supervisor.</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}
