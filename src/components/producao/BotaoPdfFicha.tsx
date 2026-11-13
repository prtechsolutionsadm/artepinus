"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { avisarFalhaPdf } from "@/lib/pdf-cliente";
import { COMPRIMENTOS, CLASSE_MADEIRA } from "@/lib/producao";

export type DadosPdfFicha = {
  /** Título no alto da folha, ex.: "Madeira carregada no mês · Estufa 01". */
  titulo: string;
  subtitulo?: string;
  /** Nome do arquivo, sem .pdf. */
  arquivo: string;
  colunasAntes?: string[];
  gradesUmidas?: boolean;
  linhas: { antes?: string[]; espessura: number; larguras: string; pecas: Record<number, number>; gradesUmidas?: number | null; m3: number }[];
};

const comp = (mm: number) => (mm / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
const num = (n: number, d = 0) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Gera o PDF da ficha no próprio aparelho (funciona sem internet), em A4 paisagem, no desenho do papel. */
export function BotaoPdfFicha({ dados, className = "btn-secundario px-3 py-2" }: { dados: DadosPdfFicha; className?: string }) {
  const [gerando, setGerando] = useState(false);

  async function gerar() {
    setGerando(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const largura = doc.internal.pageSize.getWidth();
      const verde: [number, number, number] = [23, 112, 9];

      // Cabeçalho
      doc.setFont("helvetica", "bolditalic").setFontSize(16).setTextColor(...verde).text("ARTEPINUS", 12, 15);
      doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(28, 25, 23).text(dados.titulo, largura / 2, 15, { align: "center" });
      if (dados.subtitulo) doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(87, 83, 78).text(dados.subtitulo, largura / 2, 20.5, { align: "center" });
      doc.setFontSize(8).setTextColor(120).text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, largura - 12, 15, { align: "right" });

      const antes = dados.colunasAntes ?? [];
      const totalPecas = (p: Record<number, number>) => Object.values(p).reduce((t, n) => t + n, 0);
      const cab1 = [
        ...antes.map((c) => ({ content: c, rowSpan: 2 })),
        { content: "Espessura", rowSpan: 2 },
        { content: "Larguras", rowSpan: 2 },
        { content: "Comprimentos (peças)", colSpan: COMPRIMENTOS.length },
        ...(dados.gradesUmidas ? [{ content: "Grades úmidas", rowSpan: 2 }] : []),
        { content: "Peças", rowSpan: 2 },
        { content: "m³", rowSpan: 2 },
      ];
      const cab2 = COMPRIMENTOS.map((c) => `${comp(c.mm)}\n${CLASSE_MADEIRA[c.classe].label}`);
      const corpo = dados.linhas.map((l) => [
        ...antes.map((_, i) => l.antes?.[i] ?? ""),
        `${l.espessura} mm`,
        l.larguras,
        ...COMPRIMENTOS.map((c) => (l.pecas[c.mm] ? num(l.pecas[c.mm]) : "")),
        ...(dados.gradesUmidas ? [l.gradesUmidas ? num(l.gradesUmidas) : ""] : []),
        num(totalPecas(l.pecas)),
        num(l.m3, 3),
      ]);
      const tot = (mm: number) => dados.linhas.reduce((t, l) => t + (l.pecas[mm] ?? 0), 0);
      const rodape = [
        { content: "Total", colSpan: antes.length + 2 },
        ...COMPRIMENTOS.map((c) => (tot(c.mm) ? num(tot(c.mm)) : "")),
        ...(dados.gradesUmidas ? [num(dados.linhas.reduce((t, l) => t + (l.gradesUmidas ?? 0), 0))] : []),
        num(dados.linhas.reduce((t, l) => t + totalPecas(l.pecas), 0)),
        num(dados.linhas.reduce((t, l) => t + l.m3, 0), 3),
      ];
      const inicioComp = antes.length + 2;
      const fimComp = inicioComp + COMPRIMENTOS.length;

      autoTable(doc, {
        startY: dados.subtitulo ? 25 : 21,
        head: [cab1, cab2],
        body: corpo.length ? corpo : [[{ content: "Nenhuma madeira lançada.", colSpan: fimComp + (dados.gradesUmidas ? 3 : 2) }]],
        foot: [rodape],
        theme: "grid",
        margin: { left: 12, right: 12 },
        styles: { font: "helvetica", fontSize: 9, cellPadding: 1.8, lineColor: [120, 113, 108], lineWidth: 0.2, textColor: [28, 25, 23], valign: "middle" },
        headStyles: { fillColor: [241, 248, 239], textColor: [20, 90, 10], fontStyle: "bold", halign: "center" },
        footStyles: { fillColor: [245, 245, 244], textColor: [28, 25, 23], fontStyle: "bold" },
        columnStyles: Object.fromEntries(
          Array.from({ length: fimComp + 3 }, (_, i) => [i, { halign: i >= inicioComp ? "center" : "left" }]),
        ),
        didParseCell: (d) => {
          // Números à direita nas colunas finais (peças e m³)
          const ultimas = fimComp + (dados.gradesUmidas ? 1 : 0);
          if (d.section === "head") return;
          if (d.column.index >= ultimas) d.cell.styles.halign = "right";
          else if (d.column.index >= inicioComp && d.column.index < fimComp + (dados.gradesUmidas ? 1 : 0)) d.cell.styles.halign = "center";
        },
        didDrawPage: () => {
          const h = doc.internal.pageSize.getHeight();
          doc.setFontSize(7).setTextColor(140).text("Artepinus Madeiras · Sistema Artepinus", 12, h - 6);
          doc.text(`Página ${doc.getNumberOfPages()}`, largura - 12, h - 6, { align: "right" });
        },
      });
      doc.save(`${dados.arquivo}.pdf`);
    } catch (e) {
      avisarFalhaPdf(e);
    } finally {
      setGerando(false);
    }
  }

  return (
    <button type="button" onClick={gerar} disabled={gerando} className={className}>
      <FileDown className="h-4 w-4" /> {gerando ? "Gerando…" : "PDF"}
    </button>
  );
}
