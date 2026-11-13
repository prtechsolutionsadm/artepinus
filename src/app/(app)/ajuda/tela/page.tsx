import { redirect } from "next/navigation";
import { ajudaDaTela, secoesPara } from "@/lib/manual";
import { exigirUsuario } from "@/lib/session";

/**
 * Ajuda por tela: /ajuda/tela?de=<caminho da tela> leva à seção/tópico do manual daquela tela
 * (rotas dos tópicos e das seções em src/lib/manual; regras em ajudaDaTela: o prefixo mais longo vence e,
 * empatado, a parte do perfil da pessoa, ex.: a página de uma requisição abre Atender para a equipe da
 * manutenção e Acompanhar para os outros). Sem nenhuma, /ajuda.
 */
export default async function AjudaDaTelaPage({ searchParams }: { searchParams: Promise<{ de?: string | string[] }> }) {
  const eu = await exigirUsuario();
  const { de } = await searchParams;
  // Só caminho interno (nada de //outro-site)
  const origem = typeof de === "string" && de.startsWith("/") && !de.startsWith("//") && !de.startsWith("/\\") ? de.slice(0, 300) : null;
  if (!origem) redirect("/ajuda");
  const destino = ajudaDaTela(origem, secoesPara(eu));
  if (destino === "/ajuda") redirect("/ajuda");
  const [base, ancora] = destino.split("#");
  redirect(`${base}?de=${encodeURIComponent(origem)}${ancora ? `#${ancora}` : ""}`);
}
