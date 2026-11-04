import "server-only";
import { headers } from "next/headers";
import QRCode from "qrcode";

/** Endereço público do sistema (para o link dentro do QR Code). */
export async function urlBase() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function linkEquipamento(codigo: string) {
  return `${await urlBase()}/q/${encodeURIComponent(codigo)}`;
}

/** SVG do QR Code (vetorial, nítido na impressão). */
export async function qrSvg(texto: string) {
  return QRCode.toString(texto, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#1c1917", light: "#ffffff" } });
}

/**
 * Link do QR da etiqueta do pacote: usa o código aleatório (não dá para adivinhar
 * outros pacotes trocando o número). Etiquetas antigas, impressas com o número, continuam valendo.
 */
export async function linkPacote(codigoPublico: string) {
  return `${await urlBase()}/p/${codigoPublico}`;
}

/** Link do QR da etiqueta do lote da serraria. */
export async function linkLote(numero: number) {
  return `${await urlBase()}/l/${numero}`;
}

/** Código de barras Code 128 em SVG (para leitor de código de barras e identificação física). */
export async function barrasSvg(texto: string) {
  const { toSVG } = await import("bwip-js/node");
  return toSVG({ bcid: "code128", text: texto, height: 12, scale: 3, includetext: false, paddingwidth: 2 });
}
