import { redirect } from "next/navigation";

/** Link curto gravado no QR da etiqueta do lote (o login é exigido pelo proxy). */
export default async function LinkLote({ params }: { params: Promise<{ numero: string }> }) {
  const n = Number((await params).numero);
  redirect(Number.isInteger(n) && n > 0 ? `/producao/lotes/${n}` : "/producao/escanear");
}
