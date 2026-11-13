/** Publicação no ar quando esta página foi gerada (next.config.ts → NEXT_PUBLIC_BUILD). */
export const BUILD = process.env.NEXT_PUBLIC_BUILD ?? "dev";

/** Endereço do service worker com a publicação: cada publicação instala um SW novo (atualização sem reinstalar). */
export const URL_SW = `/sw.js?v=${encodeURIComponent(BUILD)}`;
