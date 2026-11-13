import Link from "next/link";
import { CircleAlert, Lightbulb } from "lucide-react";
import { ImagemManual } from "@/components/ajuda/ImagemManual";
import { LINK_AJUDA, normalizar, tituloDoDestino, type Bloco, type Destinos } from "@/lib/manual";

const PONTUACAO = /[.,;:!?()—–]/;
/** Aspas de fechamento → abertura (o texto entre aspas vira o link). */
const ASPAS: Record<string, string> = { "”": "“", "»": "«", '"': '"', "'": "'" };
/** Palavras do começo que não entram no link ("veja a ficha" → "a ficha"). */
const DE_FORA = new Set(["veja", "ver", "consulte", "leia", "abra", "tambem", "e", "em"]);

/**
 * Texto do manual com os links "(/ajuda/...)" ligados. O que vem logo antes do parêntese vira o link:
 * o título do destino, se for ele; o texto entre aspas; ou as últimas palavras (tantas quanto as do
 * título, sem passar de uma pontuação). Destino que a pessoa não enxerga: o caminho some e fica o texto.
 */
export function TextoAjuda({ texto, destinos }: { texto: string; destinos: Destinos }) {
  const partes: React.ReactNode[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(LINK_AJUDA)) {
    const caminho = m[1];
    const inicio = m.index ?? 0;
    const antes = texto.slice(ultimo, inicio);
    ultimo = inicio + m[0].length;
    const titulo = tituloDoDestino(caminho, destinos);
    if (!titulo) {
      partes.push(antes);
      continue;
    }
    const link = (rotulo: string) => (
      <Link key={inicio} href={caminho} title={titulo} className="font-medium text-marca-700 underline decoration-marca-300 underline-offset-2 hover:decoration-marca-700">
        {rotulo}
      </Link>
    );
    // Aspas de fechamento ficam fora do link; com a abertura achada, o link é o texto entre elas
    const fecha = antes.at(-1) ?? "";
    const abre = ASPAS[fecha];
    const corpo = abre ? antes.slice(0, -1) : antes;
    const aspas = abre ? fecha : "";
    if (abre) {
      const pos = corpo.lastIndexOf(abre);
      if (pos >= 0 && pos < corpo.length - 1) {
        partes.push(corpo.slice(0, pos + 1), link(corpo.slice(pos + 1)), aspas);
        continue;
      }
    }
    // 1) O texto antes já termina com o título do destino
    const final = corpo.slice(-titulo.length);
    if (final && normalizar(final) === normalizar(titulo)) {
      partes.push(corpo.slice(0, -titulo.length), link(final), aspas);
      continue;
    }
    // 2) As últimas palavras antes do parêntese (tantas quanto as do título)
    const palavras = (corpo.split(PONTUACAO).pop() ?? "").trim().split(/\s+/).filter(Boolean);
    const n = Math.min(palavras.length, titulo.replace(/\(.*?\)/g, "").trim().split(/\s+/).length);
    let escolhidas = palavras.slice(palavras.length - n);
    while (escolhidas.length > 1 && DE_FORA.has(normalizar(escolhidas[0]))) escolhidas = escolhidas.slice(1);
    const rotulo = escolhidas.join(" ");
    const pos = rotulo ? corpo.lastIndexOf(rotulo) : -1;
    if (pos >= 0) {
      partes.push(corpo.slice(0, pos), link(rotulo), corpo.slice(pos + rotulo.length), aspas);
      continue;
    }
    // 3) Sem nome antes: o link leva o título do destino
    partes.push(antes, antes.trim() ? " (" : "(", link(titulo), ")");
  }
  partes.push(texto.slice(ultimo));
  return <>{partes}</>;
}

/** Blocos de um tópico ou problema (texto, passos, listas, dicas, termos e capturas de tela). */
export function Blocos({ blocos, destinos }: { blocos: Bloco[]; destinos: Destinos }) {
  const t = (texto: string) => <TextoAjuda texto={texto} destinos={destinos} />;
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-stone-700 print:text-[11pt]">
      {blocos.map((b, i) => {
        switch (b.tipo) {
          case "texto":
            return (
              <p key={i}>
                {t(b.texto)}
              </p>
            );
          case "passos":
            return (
              <ol key={i} className="space-y-2">
                {b.itens.map((item, n) => (
                  <li key={n} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-marca-600 text-xs font-bold text-white" aria-hidden>
                      {n + 1}
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span className="sr-only">{n + 1}. </span>
                      {t(item)}
                    </span>
                  </li>
                ))}
              </ol>
            );
          case "lista":
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-marca-600">
                {b.itens.map((item, n) => (
                  <li key={n}>
                    {t(item)}
                  </li>
                ))}
              </ul>
            );
          case "termos":
            return (
              <dl key={i} className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                {b.itens.map(([termo, def]) => (
                  <div key={termo} className="grid gap-0.5 px-3 py-2.5 sm:grid-cols-[minmax(8rem,12rem)_1fr] sm:gap-4">
                    <dt className="font-semibold text-stone-900">{termo}</dt>
                    <dd>
                      {t(def)}
                    </dd>
                  </div>
                ))}
              </dl>
            );
          case "dica":
            return (
              <p key={i} className="sem-quebra flex gap-2.5 rounded-xl bg-marca-50 px-3 py-2.5 text-marca-900 ring-1 ring-marca-100">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-marca-600" aria-hidden />
                <span className="min-w-0">
                  <span className="sr-only">Dica: </span>
                  {t(b.texto)}
                </span>
              </p>
            );
          case "atencao":
            return (
              <p key={i} className="sem-quebra flex gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5 text-amber-900 ring-1 ring-amber-200">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
                <span className="min-w-0">
                  <span className="sr-only">Atenção: </span>
                  {t(b.texto)}
                </span>
              </p>
            );
          case "imagem":
            return <ImagemManual key={i} imagem={b.imagem} />;
        }
      })}
    </div>
  );
}
