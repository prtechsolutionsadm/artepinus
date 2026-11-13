"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { CINZA, TEXTO, VERDE, avisarFalhaPdf, cabecalho, novoPdf, num, rodape } from "@/lib/pdf-cliente";

type K = {
  oee: number | null;
  disponibilidade: number | null;
  produtividade: number | null;
  rendimento: number | null;
  producaoM3: number;
  metaM3: number;
  minutosParados: number;
  minutosProgramados: number;
  porClasse: { OTIMO: number; BOM: number; REGULAR: number };
  paradoPorCentro: { MEC: number; ELE: number; OPE: number };
};

export type DadosRelatorio = {
  mes: string;
  mesAnterior: string;
  dias: number;
  kpis: K;
  anterior: K | null;
  diario: { dia: string; otimo: number; bom: number; regular: number; meta: number }[];
  pareto: { rotulo: string; minutos: number; ocorrencias: number; centro: string }[];
  equipamentos: { rotulo: string; valor: number }[];
  estufas: { emSecagem: number; m3EmSecagem: number; ciclosConcluidos: number; m3Seco: number; horasMediaCiclo: number | null };
  toras: { cargas: number; pesoT: number; porClasse: { FINA: number; MEDIA: number; GROSSA: number } };
  pacotes: { formados: number; m3Formado: number; expedidos: number; m3Expedido: number; romaneios: number; rastreados: number; diasMedioEmEstoque: number | null; porCliente: { rotulo: string; m3: number }[] };
  comparativo: { mes: string; dias: number; producaoM3: number; metaM3: number; oee: number | null; disponibilidade: number | null; produtividade: number | null }[];
};

const pct = (v: number | null) => (v == null ? "—" : `${num(v * 100, 1)}%`);
const horas = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${String(Math.round(min % 60)).padStart(2, "0")}` : `${Math.round(min)} min`);
const CORES: Record<string, [number, number, number]> = { otimo: [27, 175, 122], bom: [42, 120, 214], regular: [235, 104, 52] };

/** Relatório do mês para a diretoria: índices, serrado por classe, paradas, estufas, toras e expedição. */
export function BotaoRelatorioMensal({ dados }: { dados: DadosRelatorio }) {
  const [gerando, setGerando] = useState(false);

  async function gerar() {
    setGerando(true);
    try {
      const { doc, autoTable } = await novoPdf("portrait");
      const larg = doc.internal.pageSize.getWidth();
      const alt = doc.internal.pageSize.getHeight();
      const util = larg - 24;
      let y = await cabecalho(doc, "Relatório mensal da serraria", dados.mes, ["Indicadores", `${dados.dias} dia(s) com apontamento`]);
      const fim = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
      const titulo = (t: string) => {
        if (y > alt - 40) {
          doc.addPage();
          y = 18;
        }
        doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...VERDE).text(t, 12, y);
        y += 3;
      };
      const tabela = (opts: Parameters<typeof autoTable>[1]) => {
        autoTable(doc, {
          startY: y,
          theme: "grid",
          margin: { left: 12, right: 12 },
          styles: { fontSize: 8.5, cellPadding: 1.6, lineColor: [210, 210, 210], lineWidth: 0.2, textColor: TEXTO },
          headStyles: { fillColor: [241, 248, 239], textColor: [20, 90, 10], fontStyle: "bold" },
          footStyles: { fillColor: [245, 245, 244], textColor: TEXTO, fontStyle: "bold" },
          ...opts,
        });
        y = fim() + 7;
      };
      const k = dados.kpis;
      const a = dados.anterior;
      const variacao = (v: number | null, ant: number | null | undefined) => (v == null || ant == null ? "" : `${v - ant >= 0 ? "+" : ""}${num((v - ant) * 100, 1)} p.p.`);

      // 1. Índices (caixas)
      const caixas: [string, string, string][] = [
        ["OEE", pct(k.oee), variacao(k.oee, a?.oee)],
        ["Disponibilidade", pct(k.disponibilidade), variacao(k.disponibilidade, a?.disponibilidade)],
        ["Produtividade", pct(k.produtividade), variacao(k.produtividade, a?.produtividade)],
        ["Serrado", `${num(k.producaoM3, 1)} m³`, k.metaM3 ? `meta ${num(k.metaM3, 0)} m³` : ""],
      ];
      const w = (util - 3 * 4) / 4;
      caixas.forEach(([r, v, d], i) => {
        const x = 12 + i * (w + 4);
        doc.setDrawColor(210).setLineWidth(0.2).setFillColor(i === 0 ? 241 : 255, i === 0 ? 248 : 255, i === 0 ? 239 : 255).rect(x, y, w, 20, "FD");
        doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...CINZA).text(r, x + 3, y + 5);
        doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(...(i === 0 ? VERDE : TEXTO)).text(v, x + 3, y + 13);
        if (d) doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...CINZA).text(`${d}${i < 3 ? ` vs. ${dados.mesAnterior}` : ""}`, x + 3, y + 17.5);
      });
      y += 24;
      doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...CINZA);
      doc.text(
        `OEE = Disponibilidade × Produtividade · Disponibilidade = (tempo programado − paradas) ÷ tempo programado · Produtividade = serrado ÷ meta · Rendimento ${pct(k.rendimento)}`,
        12,
        y,
        { maxWidth: util },
      );
      y += 8;

      // 2. Serrado por classe + gráfico diário
      titulo("Serrado por classe");
      const tot = k.producaoM3 || 1;
      tabela({
        head: [["Classe", "Comprimentos", "m³", "% do serrado"]],
        body: [
          ["Ótimo", "2,50 e 2,10 m", num(k.porClasse.OTIMO, 2), pct(k.porClasse.OTIMO / tot)],
          ["Bom", "1,65 m", num(k.porClasse.BOM, 2), pct(k.porClasse.BOM / tot)],
          ["Regular", "1,30, 1,00 e 0,70 m", num(k.porClasse.REGULAR, 2), pct(k.porClasse.REGULAR / tot)],
        ],
        foot: [["Total", "", num(k.producaoM3, 2), "100%"]],
        columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
      });
      if (dados.diario.length) {
        titulo("Serrado por dia (m³) e meta");
        const gh = 45;
        const gx = 22;
        const gw = util - 10;
        const max = Math.max(1, ...dados.diario.map((d) => Math.max(d.otimo + d.bom + d.regular, d.meta))) * 1.1;
        const bw = Math.min(10, (gw / dados.diario.length) * 0.65);
        doc.setDrawColor(225).setLineWidth(0.15);
        for (let t = 0; t <= 4; t++) {
          const yy = y + gh - (gh * t) / 4;
          doc.line(gx, yy, gx + gw, yy);
          doc.setFontSize(6.5).setTextColor(...CINZA).text(num((max * t) / 4, 0), gx - 2, yy + 1, { align: "right" });
        }
        dados.diario.forEach((d, i) => {
          const cx = gx + (gw / dados.diario.length) * (i + 0.5);
          let base = y + gh;
          (["otimo", "bom", "regular"] as const).forEach((c) => {
            const h = (d[c] / max) * gh;
            if (h > 0) {
              doc.setFillColor(...CORES[c]).rect(cx - bw / 2, base - h, bw, h, "F");
              base -= h;
            }
          });
          if (d.meta) {
            const my = y + gh - (d.meta / max) * gh;
            doc.setDrawColor(...TEXTO).setLineWidth(0.4).line(cx - bw / 2 - 1, my, cx + bw / 2 + 1, my);
          }
          doc.setFontSize(6).setTextColor(...CINZA).text(d.dia.slice(8), cx, y + gh + 3.5, { align: "center" });
        });
        y += gh + 7;
        (["otimo", "bom", "regular"] as const).forEach((c, i) => {
          doc.setFillColor(...CORES[c]).rect(12 + i * 25, y - 2.5, 3, 3, "F");
          doc.setFontSize(7.5).setTextColor(...TEXTO).text(["Ótimo", "Bom", "Regular"][i], 16.5 + i * 25, y);
        });
        doc.setDrawColor(...TEXTO).setLineWidth(0.4).line(87, y - 1, 92, y - 1);
        doc.text("Meta do dia", 94, y);
        y += 8;
      }

      // 3. Paradas
      titulo(`Paradas · ${horas(k.minutosParados)} no mês`);
      tabela({
        head: [["Centro", "Tempo", "% do programado"]],
        body: (
          [
            ["Mecânica", k.paradoPorCentro.MEC],
            ["Elétrica", k.paradoPorCentro.ELE],
            ["Operacional", k.paradoPorCentro.OPE],
          ] as [string, number][]
        ).map(([r, m]) => [r, horas(m), pct(k.minutosProgramados ? m / k.minutosProgramados : null)]),
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
      });
      if (dados.pareto.length) {
        let acumulado = 0;
        const totalParado = dados.pareto.reduce((t, p) => t + p.minutos, 0) || 1;
        titulo("Pareto dos motivos de parada (10 maiores)");
        tabela({
          head: [["Motivo", "Centro", "Ocorrências", "Tempo", "% acumulado"]],
          body: dados.pareto.slice(0, 10).map((p) => {
            acumulado += p.minutos;
            return [p.rotulo, p.centro, num(p.ocorrencias), horas(p.minutos), pct(acumulado / totalParado)];
          }),
          columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
        });
      }

      // 4. Estufas e toras
      titulo("Estufas e recebimento de toras");
      const e = dados.estufas;
      const t = dados.toras;
      tabela({
        head: [["Estufas", "", "Toras", ""]],
        body: [
          ["Ciclos concluídos no mês", num(e.ciclosConcluidos), "Cargas recebidas", num(t.cargas)],
          ["Madeira seca", `${num(e.m3Seco, 1)} m³`, "Peso total", `${num(t.pesoT, 1)} t`],
          ["Duração média do ciclo", e.horasMediaCiclo != null ? horas(e.horasMediaCiclo * 60) : "—", "Diâmetro (peso)", `Fina ${num(t.porClasse.FINA, 1)} t · Média ${num(t.porClasse.MEDIA, 1)} t · Grossa ${num(t.porClasse.GROSSA, 1)} t`],
          ["Em secagem agora", `${num(e.emSecagem)} · ${num(e.m3EmSecagem, 1)} m³`, "", ""],
        ],
        columnStyles: { 1: { halign: "right" }, 3: { halign: "right" } },
      });

      // 5. Expedição
      const pc = dados.pacotes;
      titulo("Pacotes e expedição");
      tabela({
        head: [["Pacotes formados", "Expedidos", "Romaneios", "Rastreados até a floresta", "Tempo médio até a saída"]],
        body: [
          [
            `${num(pc.formados)} · ${num(pc.m3Formado, 1)} m³`,
            `${num(pc.expedidos)} · ${num(pc.m3Expedido, 1)} m³`,
            num(pc.romaneios),
            pc.formados ? pct(pc.rastreados / pc.formados) : "—",
            pc.diasMedioEmEstoque != null ? `${num(pc.diasMedioEmEstoque, 1)} dia(s)` : "—",
          ],
        ],
      });
      if (pc.porCliente.length) {
        tabela({
          head: [["Expedido por cliente", "m³"]],
          body: pc.porCliente.slice(0, 10).map((c) => [c.rotulo, num(c.m3, 2)]),
          columnStyles: { 1: { halign: "right" } },
        });
      }

      // 6. Comparativo
      if (dados.comparativo.some((c) => c.dias)) {
        titulo("Comparativo dos últimos meses");
        tabela({
          head: [["Mês", "Dias", "Serrado (m³)", "Meta (m³)", "Disp.", "Prod.", "OEE"]],
          body: dados.comparativo.filter((c) => c.dias).map((c) => [c.mes, num(c.dias), num(c.producaoM3, 1), num(c.metaM3, 0), pct(c.disponibilidade), pct(c.produtividade), pct(c.oee)]),
          columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
        });
      }

      rodape(doc);
      doc.save(`relatorio-serraria-${dados.mes.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    } catch (e) {
      avisarFalhaPdf(e);
    } finally {
      setGerando(false);
    }
  }

  return (
    <button type="button" onClick={gerar} disabled={gerando} className="btn-secundario px-3 py-2">
      <FileDown className="h-4 w-4" /> {gerando ? "Gerando…" : "Relatório PDF"}
    </button>
  );
}
