import { readFile } from "node:fs/promises";
import path from "node:path";
import { codigoLote } from "@/lib/rastreio";
import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CREDITO, EMPRESA, direitos } from "@/lib/empresa";
import { painelProducao } from "@/lib/indicadores-producao";
import { podeProducao } from "@/lib/permissoes";
import { CENTRO, CLASSE_MADEIRA, MERCADO, calcularKpis, classeDoComprimento, hojeSP, intervaloMes, mesDe, nomeMes } from "@/lib/producao";
import { usuarioAtual } from "@/lib/session";

const VERDE = "FF177009";
const borda: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD6D3D1" } },
  bottom: { style: "thin", color: { argb: "FFD6D3D1" } },
  left: { style: "thin", color: { argb: "FFD6D3D1" } },
  right: { style: "thin", color: { argb: "FFD6D3D1" } },
};
const PCT = "0.0%";
const M3 = "#,##0.000";

/** Exporta o mês da serraria: resumo/comparativo, boletins, bitolas e paradas. */
export async function GET(req: NextRequest) {
  const eu = await usuarioAtual();
  if (!eu || eu.trocarSenha) return NextResponse.redirect(new URL("/login", req.url));
  if (!podeProducao(eu, "ver")) return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });

  const q = req.nextUrl.searchParams.get("mes");
  const mes = q && /^\d{4}-\d{2}$/.test(q) ? q : mesDe(hojeSP());
  const [painel, boletins] = await Promise.all([
    painelProducao(mes, 12),
    db.boletimProducao.findMany({
      where: { data: intervaloMes(mes) },
      orderBy: { data: "asc" },
      include: {
        responsavel: { select: { nome: true } },
        itens: { orderBy: [{ espessura: "asc" }, { largura: "asc" }, { comprimento: "desc" }], include: { lote: { select: { numero: true, pedido: { select: { numero: true } } } } } },
        paradas: { include: { motivo: true, equipamento: { select: { nome: true } } }, orderBy: { minutos: "desc" } },
      },
    }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = `${EMPRESA.razaoSocial} - ${EMPRESA.sistema}`;
  wb.company = EMPRESA.razaoSocial;
  wb.description = `${direitos()} ${CREDITO}`;
  wb.created = new Date();
  let logoId: number | null = null;
  try {
    const logo = await readFile(path.join(process.cwd(), "public", EMPRESA.logoPng));
    logoId = wb.addImage({ buffer: logo as unknown as ExcelJS.Buffer, extension: "png" });
  } catch {
    // sem logo: segue sem imagem
  }

  const aba = (nome: string, colunas: { header: string; key: string; width: number; fmt?: string }[], titulo: string) => {
    const ws = wb.addWorksheet(nome, {
      views: [{ state: "frozen", ySplit: 5 }],
      pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      headerFooter: { oddFooter: `&L&8${direitos()}&R&8${CREDITO} · página &P de &N` },
    });
    ws.columns = colunas.map((c) => ({ key: c.key, width: c.width, style: c.fmt ? { numFmt: c.fmt } : undefined }));
    if (logoId !== null) ws.addImage(logoId, { tl: { col: 0.1, row: 0.15 }, ext: { width: 80, height: 54 } });
    const ultima = String.fromCharCode(64 + Math.max(colunas.length, 3));
    ws.getRow(1).height = 24;
    ws.getRow(2).height = 18;
    ws.getRow(3).height = 16;
    ws.mergeCells(`B1:${ultima}1`);
    ws.mergeCells(`B2:${ultima}2`);
    ws.mergeCells(`B3:${ultima}3`);
    ws.getCell("B1").value = `${titulo} · ${EMPRESA.razaoSocial}`;
    ws.getCell("B1").font = { bold: true, size: 15, color: { argb: VERDE } };
    ws.getCell("B2").value = `Serraria · ${nomeMes(mes)} · ${boletins.length} boletim(ns)`;
    ws.getCell("B2").font = { size: 11, color: { argb: "FF57534E" } };
    ws.getCell("B3").value = `CNPJ ${EMPRESA.cnpj} · Gerado por ${eu.nome} em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`;
    ws.getCell("B3").font = { size: 9, color: { argb: "FF78716C" } };
    const cab = ws.getRow(5);
    cab.values = colunas.map((c) => c.header);
    cab.height = 20;
    cab.eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE } };
      c.alignment = { vertical: "middle" };
      c.border = borda;
    });
    return ws;
  };
  const linha = (ws: ExcelJS.Worksheet, valores: Record<string, unknown>, i: number) => {
    const r = ws.addRow(valores);
    r.eachCell({ includeEmpty: true }, (c) => {
      c.border = borda;
      if (i % 2) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F4" } };
    });
    return r;
  };
  const rodape = (ws: ExcelJS.Worksheet) => {
    ws.addRow([]);
    ws.addRow([`${direitos()} ${CREDITO}`]).font = { size: 9, italic: true, color: { argb: "FF78716C" } };
  };

  // Comparativo mensal (12 meses)
  const colKpi = [
    { header: "Mês", key: "mes", width: 12 },
    { header: "Dias", key: "dias", width: 7 },
    { header: "Serrado (m³)", key: "producao", width: 14, fmt: M3 },
    { header: "Meta (m³)", key: "meta", width: 12, fmt: M3 },
    { header: "Ótimo (m³)", key: "otimo", width: 11, fmt: M3 },
    { header: "Bom (m³)", key: "bom", width: 10, fmt: M3 },
    { header: "Regular (m³)", key: "regular", width: 12, fmt: M3 },
    { header: "Parado (min)", key: "parado", width: 12, fmt: "#,##0" },
    { header: "MEC (min)", key: "mec", width: 10, fmt: "#,##0" },
    { header: "ELE (min)", key: "ele", width: 10, fmt: "#,##0" },
    { header: "OPE (min)", key: "ope", width: 10, fmt: "#,##0" },
    { header: "Disponibilidade", key: "disp", width: 14, fmt: PCT },
    { header: "Produtividade", key: "prod", width: 13, fmt: PCT },
    { header: "OEE", key: "oee", width: 9, fmt: PCT },
    { header: "Rendimento", key: "rend", width: 11, fmt: PCT },
  ];
  const kpiLinha = (k: ReturnType<typeof calcularKpis>) => ({
    producao: k.producaoM3,
    meta: k.metaM3,
    otimo: k.porClasse.OTIMO,
    bom: k.porClasse.BOM,
    regular: k.porClasse.REGULAR,
    parado: Math.round(k.minutosParados),
    mec: Math.round(k.paradoPorCentro.MEC),
    ele: Math.round(k.paradoPorCentro.ELE),
    ope: Math.round(k.paradoPorCentro.OPE),
    disp: k.disponibilidade,
    prod: k.produtividade,
    oee: k.oee,
    rend: k.rendimento,
  });
  const comp = aba("Comparativo", colKpi, "Indicadores da serraria");
  [...painel.comparativo].reverse().filter((c) => c.dias > 0 || c.mes === mes).forEach((c, i) => {
    const r = linha(comp, { mes: nomeMes(c.mes), dias: c.dias, ...kpiLinha(c.kpis) }, i);
    if (c.mes === mes) r.font = { bold: true };
  });
  comp.addRow([]);
  comp.addRow(["Fórmulas: Disponibilidade = (tempo programado − paradas) ÷ tempo programado · Produtividade = serrado ÷ meta · OEE = D × P · Rendimento = serrado ÷ m³ de toras · Classe: 2,50/2,10 m Ótimo, 1,65 m Bom, 1,30/1,00/0,70 m Regular"]).font = {
    size: 9,
    color: { argb: "FF57534E" },
  };
  rodape(comp);

  // Um boletim por linha
  const bol = aba("Boletins", [{ header: "Data", key: "data", width: 12 }, ...colKpi.slice(2), { header: "Responsável", key: "resp", width: 20 }, { header: "Observações", key: "obs", width: 40 }], "Boletins diários");
  boletins.forEach((b, i) => {
    const r = linha(bol, { data: b.data, ...kpiLinha(calcularKpis([b])), resp: b.responsavel.nome, obs: b.observacoes ?? "" }, i);
    r.getCell("data").numFmt = "dd/mm/yyyy";
  });
  rodape(bol);

  // Serrado por bitola
  const prod = aba(
    "Bitolas",
    [
      { header: "Data", key: "data", width: 12 },
      { header: "Lote", key: "lote", width: 12 },
      { header: "Pedido", key: "pedido", width: 14 },
      { header: "Classe", key: "tipo", width: 12 },
      { header: "Mercado", key: "mercado", width: 16 },
      { header: "Espessura (mm)", key: "e", width: 14 },
      { header: "Larguras (mm)", key: "l", width: 14 },
      { header: "Comprimento (mm)", key: "c", width: 16 },
      { header: "Peças", key: "pecas", width: 9, fmt: "#,##0" },
      { header: "m³", key: "m3", width: 11, fmt: "#,##0.0000" },
    ],
    "Serrado por bitola",
  );
  let n = 0;
  for (const b of boletins) {
    for (const it of b.itens) {
      const r = linha(prod, { data: b.data, lote: it.lote ? codigoLote(it.lote.numero) : "", pedido: it.lote?.pedido.numero ?? "", tipo: CLASSE_MADEIRA[it.classe ?? classeDoComprimento(it.comprimento)].label, mercado: MERCADO[it.mercado], e: it.espessura, l: it.larguras ?? it.largura, c: it.comprimento, pecas: it.pecas, m3: it.m3 }, n++);
      r.getCell("data").numFmt = "dd/mm/yyyy";
    }
  }
  if (n) prod.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 10 } };
  rodape(prod);

  // Paradas
  const par = aba(
    "Paradas",
    [
      { header: "Data", key: "data", width: 12 },
      { header: "Cód.", key: "cod", width: 7 },
      { header: "Motivo", key: "motivo", width: 40 },
      { header: "Centro", key: "centro", width: 13 },
      { header: "Equipamento", key: "equip", width: 24 },
      { header: "Ocorrências", key: "oc", width: 11 },
      { header: "Minutos", key: "min", width: 10, fmt: "#,##0" },
      { header: "Observação", key: "obs", width: 40 },
    ],
    "Paradas da linha",
  );
  n = 0;
  for (const b of boletins) {
    for (const p of b.paradas) {
      const r = linha(
        par,
        { data: b.data, cod: p.motivo?.codigo ?? "", motivo: p.motivo?.descricao ?? "", centro: CENTRO[p.centro].label, equip: p.equipamento?.nome ?? "", oc: p.ocorrencias, min: p.minutos, obs: p.descricao ?? "" },
        n++,
      );
      r.getCell("data").numFmt = "dd/mm/yyyy";
    }
  }
  if (n) par.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 10 } };
  rodape(par);

  // Pareto
  const pa = aba(
    "Pareto",
    [
      { header: "Motivo", key: "motivo", width: 46 },
      { header: "Centro", key: "centro", width: 13 },
      { header: "Ocorrências", key: "oc", width: 11 },
      { header: "Minutos", key: "min", width: 10, fmt: "#,##0" },
      { header: "% do tempo", key: "pct", width: 11, fmt: PCT },
      { header: "% acumulado", key: "acum", width: 12, fmt: PCT },
    ],
    "Pareto das paradas",
  );
  const total = painel.pareto.reduce((s, p) => s + p.minutos, 0) || 1;
  let acum = 0;
  painel.pareto.forEach((p, i) => {
    acum += p.minutos;
    linha(pa, { motivo: p.rotulo, centro: CENTRO[p.centro as keyof typeof CENTRO]?.label ?? "", oc: p.ocorrencias, min: p.minutos, pct: p.minutos / total, acum: acum / total }, i);
  });
  rodape(pa);

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="producao-serraria-${mes}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
