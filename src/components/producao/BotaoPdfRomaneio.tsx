"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { CINZA, TEXTO, VERDE, cabecalho, novoPdf, num, rodape } from "@/lib/pdf-cliente";

export type DadosRomaneio = {
  codigo: string;
  data: string;
  motorista: string | null;
  placas: string | null;
  responsavel: string;
  observacoes: string | null;
  pedidos: { numero: string; cliente: string; destino: string | null }[];
  pacotes: { codigo: string; pedido: string; bitola: string; classe: string | null; pecas: number; m3: number }[];
};

/** Romaneio de expedição em PDF (A4 retrato), com campos de assinatura — vai com o motorista. */
export function BotaoPdfRomaneio({ dados, className = "btn-primario" }: { dados: DadosRomaneio; className?: string }) {
  const [gerando, setGerando] = useState(false);

  async function gerar() {
    setGerando(true);
    try {
      const { doc, autoTable } = await novoPdf("portrait");
      const larg = doc.internal.pageSize.getWidth();
      let y = await cabecalho(doc, "Romaneio de expedição", undefined, [dados.codigo, dados.data]);

      // Transporte
      const caixa = (x: number, w: number, rotulo: string, valor: string) => {
        doc.setDrawColor(200).setLineWidth(0.2).rect(x, y, w, 13);
        doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...CINZA).text(rotulo.toUpperCase(), x + 2, y + 4);
        doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...TEXTO).text(valor || "—", x + 2, y + 10, { maxWidth: w - 4 });
      };
      const util = larg - 24;
      caixa(12, util * 0.4, "Motorista", dados.motorista ?? "");
      caixa(12 + util * 0.4, util * 0.35, "Placas (caminhão + julieta)", dados.placas ?? "");
      caixa(12 + util * 0.75, util * 0.25, "Pacotes", `${dados.pacotes.length}`);
      y += 17;

      // Pedidos (cliente e destino)
      if (dados.pedidos.length) autoTable(doc, {
        startY: y,
        head: [["Pedido", "Cliente", "Destino", "Pacotes", "m³"]],
        body: dados.pedidos.map((p) => {
          const ps = dados.pacotes.filter((x) => x.pedido === p.numero);
          return [p.numero, p.cliente, p.destino ?? "—", String(ps.length), num(ps.reduce((t, x) => t + x.m3, 0), 3)];
        }),
        theme: "grid",
        margin: { left: 12, right: 12 },
        styles: { fontSize: 9, cellPadding: 1.8, lineColor: [200, 200, 200], lineWidth: 0.2, textColor: TEXTO },
        headStyles: { fillColor: [241, 248, 239], textColor: [20, 90, 10], fontStyle: "bold" },
        columnStyles: { 3: { halign: "right" }, 4: { halign: "right" } },
      });
      if (dados.pedidos.length) y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

      // Pacotes
      const totPecas = dados.pacotes.reduce((t, p) => t + p.pecas, 0);
      const totM3 = dados.pacotes.reduce((t, p) => t + p.m3, 0);
      autoTable(doc, {
        startY: y,
        head: [["#", "Pacote", "Pedido", "Bitola (E × L × C mm)", "Classe", "Peças", "m³", "Conf."]],
        body: dados.pacotes.map((p, i) => [String(i + 1), p.codigo, p.pedido || "—", p.bitola, p.classe ?? "—", num(p.pecas), num(p.m3, 3), ""]),
        foot: [[{ content: `Total · ${dados.pacotes.length} pacote(s)`, colSpan: 5 }, num(totPecas), num(totM3, 3), ""]],
        theme: "grid",
        margin: { left: 12, right: 12 },
        styles: { fontSize: 9, cellPadding: 1.8, lineColor: [200, 200, 200], lineWidth: 0.2, textColor: TEXTO },
        headStyles: { fillColor: [241, 248, 239], textColor: [20, 90, 10], fontStyle: "bold" },
        footStyles: { fillColor: [245, 245, 244], textColor: TEXTO, fontStyle: "bold" },
        columnStyles: { 0: { halign: "right", cellWidth: 8 }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { cellWidth: 12 } },
        didParseCell: (d) => {
          if (d.section === "foot" && d.column.index >= 5) d.cell.styles.halign = "right";
        },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

      if (dados.observacoes) {
        doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...TEXTO).text("Observações:", 12, y);
        doc.setFont("helvetica", "normal").text(dados.observacoes, 35, y, { maxWidth: larg - 47 });
        y += 8;
      }

      // Assinaturas (nova página se não couber)
      const alt = doc.internal.pageSize.getHeight();
      if (y > alt - 45) {
        doc.addPage();
        y = 30;
      }
      y += 16;
      const w = (larg - 24 - 16) / 3;
      [`Expedição (${dados.responsavel})`, "Motorista", "Recebido por / data"].forEach((r, i) => {
        const x = 12 + i * (w + 8);
        doc.setDrawColor(120).setLineWidth(0.3).line(x, y, x + w, y);
        doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...CINZA).text(r, x + w / 2, y + 4, { align: "center" });
      });
      doc.setFontSize(7).setTextColor(...VERDE).text("Cada pacote tem etiqueta com QR Code: a história completa da madeira, da floresta à expedição.", 12, y + 12);

      rodape(doc);
      doc.save(`${dados.codigo}.pdf`);
    } finally {
      setGerando(false);
    }
  }

  return (
    <button type="button" onClick={gerar} disabled={gerando} className={className}>
      <FileDown className="h-4 w-4" /> {gerando ? "Gerando…" : "Baixar PDF do romaneio"}
    </button>
  );
}
