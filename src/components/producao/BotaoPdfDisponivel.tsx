"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { cabecalho, novoPdf, num, rodape, TEXTO } from "@/lib/pdf-cliente";

export type LinhaDisponivel = { bitola: string; classe: string; secoQtd: number; secoM3: number; verdeQtd: number; verdeM3: number; estufaQtd: number; estufaM3: number };

/** Estoque disponível para venda em PDF (para o comercial mandar ao cliente ou usar na negociação). */
export function BotaoPdfDisponivel({ linhas, subtitulo }: { linhas: LinhaDisponivel[]; subtitulo: string }) {
  const [gerando, setGerando] = useState(false);
  async function gerar() {
    setGerando(true);
    try {
      const { doc, autoTable } = await novoPdf("portrait");
      const y = await cabecalho(doc, "Madeira disponível para venda", subtitulo, ["Estoque", new Date().toLocaleDateString("pt-BR")]);
      const soma = (k: keyof LinhaDisponivel) => linhas.reduce((t, l) => t + (l[k] as number), 0);
      autoTable(doc, {
        startY: y,
        head: [
          [{ content: "Bitola (E × L × C mm)", rowSpan: 2 }, { content: "Classe", rowSpan: 2 }, { content: "Seca (pronta)", colSpan: 2 }, { content: "Na estufa", colSpan: 2 }, { content: "Verde", colSpan: 2 }],
          ["Pacotes", "m³", "Pacotes", "m³", "Pacotes", "m³"],
        ],
        body: linhas.map((l) => [l.bitola, l.classe, num(l.secoQtd), num(l.secoM3, 2), num(l.estufaQtd), num(l.estufaM3, 2), num(l.verdeQtd), num(l.verdeM3, 2)]),
        foot: [["Total", "", num(soma("secoQtd")), num(soma("secoM3"), 2), num(soma("estufaQtd")), num(soma("estufaM3"), 2), num(soma("verdeQtd")), num(soma("verdeM3"), 2)]],
        theme: "grid",
        margin: { left: 12, right: 12 },
        styles: { fontSize: 9, cellPadding: 1.8, lineColor: [210, 210, 210], lineWidth: 0.2, textColor: TEXTO },
        headStyles: { fillColor: [241, 248, 239], textColor: [20, 90, 10], fontStyle: "bold", halign: "center" },
        footStyles: { fillColor: [245, 245, 244], textColor: TEXTO, fontStyle: "bold" },
        didParseCell: (d) => {
          if (d.section !== "head" && d.column.index >= 2) d.cell.styles.halign = "right";
        },
      });
      rodape(doc);
      doc.save(`disponivel-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGerando(false);
    }
  }
  return (
    <button type="button" onClick={gerar} disabled={gerando || !linhas.length} className="btn-secundario">
      <FileDown className="h-4 w-4" /> {gerando ? "Gerando…" : "PDF"}
    </button>
  );
}
