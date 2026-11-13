// Peças comuns dos PDFs gerados no navegador (jsPDF): cabeçalho com o logo e rodapé numerado.
import type { jsPDF } from "jspdf";
import { EMPRESA } from "@/lib/empresa";

export const VERDE: [number, number, number] = [23, 112, 9];
export const TEXTO: [number, number, number] = [28, 25, 23];
export const CINZA: [number, number, number] = [87, 83, 78];

let logo: Promise<{ url: string; w: number; h: number } | null> | null = null;

/** Logo PNG em data URL (uma vez por sessão; sem internet, segue sem logo). */
function carregarLogo() {
  logo ??= fetch(EMPRESA.logoPng)
    .then((r) => (r.ok ? r.blob() : Promise.reject()))
    .then(
      (b) =>
        new Promise<{ url: string; w: number; h: number }>((ok, falha) => {
          const leitor = new FileReader();
          leitor.onload = () => {
            const img = new Image();
            img.onload = () => ok({ url: String(leitor.result), w: img.width, h: img.height });
            img.onerror = falha;
            img.src = String(leitor.result);
          };
          leitor.onerror = falha;
          leitor.readAsDataURL(b);
        }),
    )
    .catch(() => null);
  return logo;
}

/** Falha ao gerar o PDF (ex.: sem internet para baixar o jsPDF): avisa em vez de falhar calado. */
export function avisarFalhaPdf(e: unknown) {
  console.error(e);
  window.alert("Não foi possível gerar o PDF. Verifique a conexão e tente de novo.");
}

/** Abre um documento A4 já com jsPDF e o autoTable carregados sob demanda. */
export async function novoPdf(orientacao: "portrait" | "landscape" = "portrait") {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: orientacao, unit: "mm", format: "a4" });
  return { doc, autoTable };
}

/** Cabeçalho: logo à esquerda, título e subtítulo, e a direita (nº do documento, data…). Devolve o Y livre. */
export async function cabecalho(doc: jsPDF, titulo: string, subtitulo?: string, direita?: string[]) {
  const larg = doc.internal.pageSize.getWidth();
  const l = await carregarLogo();
  if (l) {
    const h = 13;
    doc.addImage(l.url, "PNG", 12, 9, (l.w / l.h) * h, h);
  } else {
    doc.setFont("helvetica", "bolditalic").setFontSize(16).setTextColor(...VERDE).text("ARTEPINUS", 12, 17);
  }
  doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(...TEXTO).text(titulo, larg / 2, 15, { align: "center" });
  if (subtitulo) doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...CINZA).text(subtitulo, larg / 2, 20.5, { align: "center" });
  (direita ?? []).forEach((t, i) => doc.setFont("helvetica", i === 0 ? "bold" : "normal").setFontSize(i === 0 ? 11 : 8).setTextColor(...(i === 0 ? TEXTO : CINZA)).text(t, larg - 12, 14 + i * 5, { align: "right" }));
  doc.setDrawColor(...VERDE).setLineWidth(0.6).line(12, 25, larg - 12, 25);
  return 30;
}

/** Rodapé em todas as páginas: empresa e "Página x de y". Chamar no fim. */
export function rodape(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  const larg = doc.internal.pageSize.getWidth();
  const alt = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(140);
    doc.text(`${EMPRESA.razaoSocial} · CNPJ ${EMPRESA.cnpj} · ${EMPRESA.contato.telefone}`, 12, alt - 6);
    doc.text(`Página ${i} de ${total} · gerado em ${new Date().toLocaleString("pt-BR")}`, larg - 12, alt - 6, { align: "right" });
  }
}

export const num = (n: number, d = 0) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
