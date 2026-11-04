import { redirect } from "next/navigation";

/** Florestas viraram um cadastro simples (sem colheitas/talhão). */
export default function FlorestasPage() {
  redirect("/producao/cadastros?aba=florestas");
}
