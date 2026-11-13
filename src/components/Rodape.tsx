import Link from "next/link";
import { CREDITO, direitos } from "@/lib/empresa";
import { VERSAO } from "@/lib/versao";

/**
 * Créditos: direitos da Artepinus, versão do sistema e desenvolvimento da PR Tech Solutions.
 * `novidades`: a versão vira link para as notas de atualização (só dentro do sistema; /novidades exige login).
 */
export function Rodape({ className = "", claro, novidades }: { className?: string; claro?: boolean; novidades?: boolean }) {
  return (
    <footer className={`text-center text-xs leading-relaxed ${claro ? "text-marca-100/70" : "text-stone-400"} ${className}`}>
      <p>{direitos()}</p>
      <p>
        {novidades ? (
          <Link href="/novidades" className="underline-offset-2 hover:underline" title="Notas de atualização">
            Versão {VERSAO}
          </Link>
        ) : (
          <>Versão {VERSAO}</>
        )}{" "}
        · {CREDITO} ·{" "}
        <a href="/privacidade" className="underline-offset-2 hover:underline">
          Privacidade
        </a>
      </p>
    </footer>
  );
}
