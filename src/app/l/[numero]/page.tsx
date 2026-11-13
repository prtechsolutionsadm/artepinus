import { redirect } from "next/navigation";
import { inteiroPositivo } from "@/lib/constantes";

/** Link curto gravado no QR da etiqueta do lote (o login é exigido pelo proxy). */
export default async function LinkLote({ params }: { params: Promise<{ numero: string }> }) {
  const n = inteiroPositivo((await params).numero);
  redirect(n ? `/producao/lotes/${n}` : "/producao/escanear");
}
