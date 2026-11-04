"use client";

import { useState } from "react";
import { FileCheck } from "lucide-react";
import { CINZA, TEXTO, VERDE, cabecalho, novoPdf, rodape } from "@/lib/pdf-cliente";

export type DadosDeclaracaoOrigem = {
  romaneio: string;
  data: string; // ISO
  notaFiscal: string | null;
  clientes: string[];
  destinos: string[];
  florestas: { nome: string; local: string | null; especie: string | null }[];
  toras: string[]; // ISO (datas de recebimento)
  dias: string[]; // ISO "AAAA-MM-DD…" (datas de serragem)
  ciclos: { estufa: string; numero: number | null; entrada: string; saida: string | null; umidadeFinal: number | null }[];
  pacotes: { codigo: string; bitola: string; classe: string | null; pecas: number; m3: number; secagem: string | null; link: string }[];
};

const TXT = {
  pt: {
    arquivo: "declaracao-origem",
    botao: "Declaração de origem (PT)",
    titulo: "Declaração de origem e rastreabilidade",
    intro: (n: number, m3: string) =>
      `Declaramos que os ${n} pacote(s) de madeira serrada de pinus desta carga (${m3} m³) foram produzidos pela Artepinus a partir de toras de florestas plantadas, com a origem, a serragem e a secagem registradas a seguir. Cada pacote tem etiqueta com QR Code para consulta da sua rastreabilidade.`,
    embarque: "Embarque",
    cliente: "Cliente",
    destino: "Destino",
    nf: "Nota fiscal",
    dataEmb: "Data",
    origem: "Origem florestal",
    floresta: "Floresta",
    local: "Município/UF",
    especie: "Espécie",
    semOrigem: "Origem registrada nos controles internos da empresa.",
    recebimento: "Recebimento das toras",
    industria: "Industrialização",
    serragem: "Serragem",
    secagem: "Secagem em estufa (kiln dried)",
    estufa: "Estufa",
    ciclo: "Ciclo",
    entrada: "Entrada",
    saida: "Saída",
    duracao: "Duração",
    umidade: "Umidade final",
    semSecagem: "Madeira verde (sem secagem em estufa).",
    pacotes: "Pacotes",
    pacote: "Pacote",
    bitola: "Bitola (E × L × C mm)",
    classe: "Classe",
    pecas: "Peças",
    seco: "Secagem",
    verde: "verde",
    total: "Total",
    assinatura: "Responsável pela expedição",
    qr: "Aponte a câmera para o QR de cada pacote para ver a sua história completa.",
    ate: "a",
    h: "h",
    pend: "em secagem",
    aviso: "Declaração emitida pela Artepinus com base nos seus registros internos de produção. Não substitui documentos oficiais fiscais, ambientais ou fitossanitários.",
  },
  en: {
    arquivo: "origin-statement",
    botao: "Origin statement (EN)",
    titulo: "Statement of origin and traceability",
    intro: (n: number, m3: string) =>
      `We declare that the ${n} package(s) of sawn pine timber in this shipment (${m3} m³) were produced by Artepinus from logs of planted forests, with the origin, sawing and drying recorded below. Each package carries a QR Code label for traceability lookup.`,
    embarque: "Shipment",
    cliente: "Customer",
    destino: "Destination",
    nf: "Invoice",
    dataEmb: "Date",
    origem: "Forest of origin",
    floresta: "Forest",
    local: "Location",
    especie: "Species",
    semOrigem: "Origin recorded in the company's internal records.",
    recebimento: "Logs received",
    industria: "Processing",
    serragem: "Sawing",
    secagem: "Kiln drying",
    estufa: "Kiln",
    ciclo: "Cycle",
    entrada: "In",
    saida: "Out",
    duracao: "Duration",
    umidade: "Final moisture",
    semSecagem: "Green timber (not kiln dried).",
    pacotes: "Packages",
    pacote: "Package",
    bitola: "Size (T × W × L mm)",
    classe: "Grade",
    pecas: "Pieces",
    seco: "Drying",
    verde: "green",
    total: "Total",
    assinatura: "Shipping supervisor",
    qr: "Scan each package's QR Code to see its full history.",
    ate: "to",
    h: "h",
    pend: "drying",
    aviso: "Statement issued by Artepinus based on its internal production records. It does not replace official tax, environmental or phytosanitary documents.",
  },
} as const;

/** Declaração de origem da carga (romaneio) em PDF, em português ou inglês, com o QR de cada pacote. */
export function BotaoDeclaracaoOrigem({ dados, lang }: { dados: DadosDeclaracaoOrigem; lang: "pt" | "en" }) {
  const [gerando, setGerando] = useState(false);
  const t = TXT[lang];
  const local = lang === "en" ? "en-GB" : "pt-BR";

  async function gerar() {
    setGerando(true);
    try {
      const [{ doc, autoTable }, QR] = await Promise.all([novoPdf("portrait"), import("qrcode")]);
      const larg = doc.internal.pageSize.getWidth();
      const alt = doc.internal.pageSize.getHeight();
      const n = (v: number, d = 0) => v.toLocaleString(local, { minimumFractionDigits: d, maximumFractionDigits: d });
      const dataHora = (iso: string) => new Date(iso).toLocaleString(local, { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
      const dia = (iso: string, utc = false) => new Date(iso).toLocaleDateString(local, { timeZone: utc ? "UTC" : "America/Sao_Paulo", day: "2-digit", month: "short", year: "numeric" });
      const faixa = (lista: string[], utc = false) => (!lista.length ? "—" : lista.length === 1 ? dia(lista[0], utc) : `${dia(lista[0], utc)} ${t.ate} ${dia(lista[lista.length - 1], utc)}`);
      const totalM3 = dados.pacotes.reduce((s, p) => s + p.m3, 0);
      const fim = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
      const base = { theme: "grid" as const, margin: { left: 12, right: 12 }, styles: { fontSize: 8.5, cellPadding: 1.6, lineColor: [210, 210, 210] as [number, number, number], lineWidth: 0.2, textColor: TEXTO }, headStyles: { fillColor: [241, 248, 239] as [number, number, number], textColor: [20, 90, 10] as [number, number, number], fontStyle: "bold" as const } };
      const titulo = (s: string, y: number) => {
        doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(...VERDE).text(s.toUpperCase(), 12, y);
        return y + 2.5;
      };

      let y = await cabecalho(doc, t.titulo, undefined, [dados.romaneio, dia(dados.data)]);
      doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...TEXTO);
      const intro = doc.splitTextToSize(t.intro(dados.pacotes.length, n(totalM3, 2)), larg - 24);
      doc.text(intro, 12, y);
      y += intro.length * 4.6 + 4;

      y = titulo(t.embarque, y);
      autoTable(doc, { ...base, startY: y, body: [[t.cliente, dados.clientes.join(", ") || "—", t.nf, dados.notaFiscal ?? "—"], [t.destino, dados.destinos.join(", ") || "—", t.dataEmb, dataHora(dados.data)]], columnStyles: { 0: { fontStyle: "bold", textColor: CINZA }, 2: { fontStyle: "bold", textColor: CINZA } } });
      y = fim() + 7;

      y = titulo(t.origem, y);
      if (dados.florestas.length) {
        autoTable(doc, { ...base, startY: y, head: [[t.floresta, t.local, t.especie]], body: dados.florestas.map((f) => [f.nome, f.local ?? "—", f.especie ?? "Pinus"]) });
        y = fim() + 3;
      } else {
        doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...CINZA).text(t.semOrigem, 12, y + 4);
        y += 7;
      }
      doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...TEXTO).text(`${t.recebimento}: ${faixa(dados.toras)}`, 12, y + 3);
      y += 10;

      y = titulo(t.industria, y);
      doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...TEXTO).text(`${t.serragem}: ${faixa(dados.dias, true)}`, 12, y + 3.5);
      y += 7;
      if (dados.ciclos.length) {
        autoTable(doc, {
          ...base,
          startY: y,
          head: [[t.secagem, t.ciclo, t.entrada, t.saida, t.duracao, t.umidade]],
          body: dados.ciclos.map((c) => [
            c.estufa,
            c.numero ? String(c.numero) : "—",
            dataHora(c.entrada),
            c.saida ? dataHora(c.saida) : t.pend,
            c.saida ? `${n((new Date(c.saida).getTime() - new Date(c.entrada).getTime()) / 3.6e6)} ${t.h}` : "—",
            c.umidadeFinal != null ? `${n(c.umidadeFinal, 1)}%` : "—",
          ]),
        });
        y = fim() + 7;
      } else {
        doc.setFontSize(9).setTextColor(...CINZA).text(t.semSecagem, 12, y + 3);
        y += 9;
      }

      // Pacotes com o QR de cada um
      const qrs = await Promise.all(dados.pacotes.map((p) => QR.toDataURL(p.link, { margin: 0, width: 160, errorCorrectionLevel: "M" })));
      if (y > alt - 60) {
        doc.addPage();
        y = 18;
      }
      y = titulo(t.pacotes, y);
      const lado = 13;
      autoTable(doc, {
        ...base,
        startY: y,
        head: [["QR", t.pacote, t.bitola, t.classe, t.pecas, "m³", t.seco]],
        body: dados.pacotes.map((p) => ["", p.codigo, p.bitola, p.classe ?? "—", n(p.pecas), n(p.m3, 3), p.secagem ?? t.verde]),
        foot: [[{ content: `${t.total} · ${dados.pacotes.length}`, colSpan: 4 }, n(dados.pacotes.reduce((s, p) => s + p.pecas, 0)), n(totalM3, 3), ""]],
        footStyles: { fillColor: [245, 245, 244], textColor: TEXTO, fontStyle: "bold" },
        bodyStyles: { minCellHeight: lado + 2, valign: "middle" },
        columnStyles: { 0: { cellWidth: lado + 3 }, 4: { halign: "right" }, 5: { halign: "right" } },
        didDrawCell: (d) => {
          if (d.section === "body" && d.column.index === 0) doc.addImage(qrs[d.row.index], "PNG", d.cell.x + 1.5, d.cell.y + 1, lado, lado);
        },
      });
      y = fim() + 5;
      doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(...CINZA).text(t.qr, 12, y);
      // Deixa claro que é uma declaração da empresa, não um documento oficial
      const aviso = doc.splitTextToSize(t.aviso, larg - 24);
      y += 5;
      doc.setFont("helvetica", "normal").setFontSize(7.5).text(aviso, 12, y);
      y += aviso.length * 3.5;

      // Assinatura
      y += 22;
      if (y > alt - 20) {
        doc.addPage();
        y = 40;
      }
      doc.setDrawColor(120).setLineWidth(0.3).line(larg - 92, y, larg - 12, y);
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...CINZA).text(t.assinatura, larg - 52, y + 4, { align: "center" });
      doc.text("Artepinus Indústria e Comércio de Madeiras LTDA", larg - 52, y + 8, { align: "center" });

      rodape(doc);
      doc.save(`${t.arquivo}-${dados.romaneio}.pdf`);
    } finally {
      setGerando(false);
    }
  }

  return (
    <button type="button" onClick={gerar} disabled={gerando} className="btn-secundario">
      <FileCheck className="h-4 w-4" /> {gerando ? "Gerando…" : t.botao}
    </button>
  );
}
