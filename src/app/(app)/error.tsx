"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, TriangleAlert, WifiOff } from "lucide-react";
import { useSemConexao } from "@/lib/falha-acao";

/** Erro numa tela do sistema: o menu continua (o layout do grupo segue montado). */
export default function ErroSistema({ error, retry }: { error: unknown; retry: () => void }) {
  const semRede = useSemConexao();
  useEffect(() => console.error(error), [error]);
  const Icone = semRede ? WifiOff : TriangleAlert;

  return (
    <div role="alert" className="cartao mx-auto mt-6 max-w-md text-center">
      <Icone className="mx-auto h-10 w-10 text-amber-500" />
      <h1 className="mt-3 text-xl font-semibold text-stone-900">{semRede ? "Sem conexão com a internet" : "Algo deu errado"}</h1>
      <p className="mt-2 text-sm text-stone-500">
        {semRede ? "Confira a internet do aparelho e toque em Tentar de novo." : "Não foi possível abrir esta tela agora. Tente de novo em instantes."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => retry()} className="btn-primario">
          <RotateCw className="h-4 w-4" /> Tentar de novo
        </button>
        <Link href="/sistema" className="btn-secundario">
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
