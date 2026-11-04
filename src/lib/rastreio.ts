import type { StatusPacote, TipoEvento, TipoOrigem } from "@/generated/prisma/enums";

// Códigos e rótulos da rastreabilidade (servidor e navegador).

export const codigoPacote = (n: number) => `PCT-${String(n).padStart(6, "0")}`;
/** Código aleatório do QR público do pacote (10 letras/números, sem 0/o/1/l para não confundir). */
export function novoCodigoPublico() {
  const alfabeto = "23456789abcdefghijkmnpqrstuvwxyz";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
}

/** Romaneio de expedição: ROM-000123. */
export const codigoRomaneio = (n: number) => `ROM-${String(n).padStart(6, "0")}`;
export const codigoCarga = (n: number) => `CT-${String(n).padStart(5, "0")}`;
export const codigoColheita = (n: number) => `COL-${String(n).padStart(4, "0")}`;
export const codigoLote = (n: number) => `LOT-${String(n).padStart(6, "0")}`;

export type CodigoLido = { tipo: "pacote" | "lote"; numero: number } | { tipo: "codigo"; codigo: string };

/** Código lido (código de barras, QR ou digitado) → pacote, lote ou o código aleatório do QR do pacote. */
export function lerCodigo(texto: string): CodigoLido | null {
  const t = texto.trim();
  const qr = t.match(/\/p\/([a-z0-9]{6,20})(?:[?#/]|$)/i);
  if (qr && !/^\d+$/.test(qr[1])) return { tipo: "codigo", codigo: qr[1].toLowerCase() };
  const lote = t.match(/\/l\/(\d+)/i) ?? t.match(/^LOT[-\s]?0*(\d{1,9})$/i);
  if (lote) return { tipo: "lote", numero: Number(lote[1]) };
  const n = numeroDoCodigo(t);
  return n ? { tipo: "pacote", numero: n } : null;
}

/** "PCT-000123", "pct123", "123" ou o link do QR → 123. */
export function numeroDoCodigo(texto: string): number | null {
  const t = texto.trim();
  const doLink = t.match(/\/p\/(\d+)/);
  const m = doLink ?? t.match(/^(?:PCT[-\s]?)?0*(\d{1,9})$/i);
  const n = m ? Number(m[1]) : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
}

export const STATUS_PACOTE: Record<StatusPacote, { label: string; cor: string; hex: string }> = {
  VERDE: { label: "Verde (serrado)", cor: "bg-emerald-50 text-emerald-800 ring-emerald-200", hex: "#1baf7a" },
  EM_ESTUFA: { label: "Na estufa", cor: "bg-amber-50 text-amber-800 ring-amber-200", hex: "#eb6834" },
  SECO: { label: "Seco · em estoque", cor: "bg-sky-50 text-sky-800 ring-sky-200", hex: "#2a78d6" },
  EXPEDIDO: { label: "Expedido", cor: "bg-stone-100 text-stone-700 ring-stone-200", hex: "#78716c" },
  CANCELADO: { label: "Cancelado", cor: "bg-rose-50 text-rose-700 ring-rose-200", hex: "#e11d48" },
};

/** Pacotes que ainda estão na empresa (contam no estoque). */
export const STATUS_EM_ESTOQUE: StatusPacote[] = ["VERDE", "EM_ESTUFA", "SECO"];

export const TIPO_EVENTO: Record<TipoEvento, string> = {
  CRIADO: "Pacote formado",
  ENTRADA_ESTUFA: "Entrou na estufa",
  SAIDA_ESTUFA: "Saiu da estufa",
  MOVIMENTADO: "Movimentado",
  EXPEDIDO: "Expedido",
  OBSERVACAO: "Observação",
  ALTERADO: "Dados alterados",
  CANCELADO: "Cancelado",
};

export const TIPO_ORIGEM: Record<TipoOrigem, string> = {
  PROPRIA: "Floresta própria",
  ARRENDADA: "Floresta arrendada",
  TERCEIRO: "Fornecedor (terceiro)",
};

export const bitola = (p: { espessura: number; largura: number; comprimento: number }) => `${p.espessura} × ${p.largura} × ${p.comprimento} mm`;
