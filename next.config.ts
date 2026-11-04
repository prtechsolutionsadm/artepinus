import type { NextConfig } from "next";

/** Cabeçalhos de segurança em todas as respostas. */
const SEGURANCA = [
  // Não deixa outro site abrir o sistema dentro de um quadro (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Câmera só para o próprio sistema (leitura de QR e fotos)
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
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
