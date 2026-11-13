import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

/**
 * CSP sem nonce (guia do Next, "Without Nonces"): só recursos do próprio site — não há script, fonte
 * ou imagem externos. 'unsafe-inline' é obrigatório pelos scripts inline do Next e do SCRIPT_TEMA;
 * 'unsafe-eval' e ws: só no next dev. data:/blob: = logo dos PDFs e prévia das fotos.
 * upgrade-insecure-requests só na Vercel (quebraria o teste por http://localhost).
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ");

/** Cabeçalhos de segurança em todas as respostas. */
const SEGURANCA = [
  // Não deixa outro site abrir o sistema dentro de um quadro (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Câmera só para o próprio sistema (leitura de QR e fotos)
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()" },
  // Sem includeSubDomains/preload: só incluir depois de confirmar que todos os subdomínios do domínio próprio usam HTTPS
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SEGURANCA }];
  },
  serverExternalPackages: ["pg", "exceljs", "sharp"],
  // O logo é lido do disco pela exportação em Excel.
  outputFileTracingIncludes: { "/relatorios/excel": ["./public/logo.png"] },
  experimental: {
    // Fotos já chegam comprimidas pelo navegador (~300 KB cada); a Vercel aceita até 4,5 MB por requisição.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
