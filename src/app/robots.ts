import type { MetadataRoute } from "next";
import { EMPRESA } from "@/lib/empresa";

/** Buscadores indexam só o site institucional; o sistema e as páginas de pacote ficam de fora. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/sistema", "/login", "/producao", "/manutencao", "/p/", "/l/", "/q/", "/tv", "/api/", "/ajuda", "/perfil", "/menu", "/usuarios", "/auditoria", "/notificacoes", "/trocar-senha"] }],
    host: process.env.NEXT_PUBLIC_SITE_URL ?? EMPRESA.site,
  };
}
