import {
  Bell,
  BookOpen,
  Boxes,
  Building2,
  CalendarClock,
  CalendarDays,
  ChartColumn,
  CirclePlus,
  ClipboardList,
  ClipboardPen,
  Compass,
  FlaskConical,
  Flame,
  Gauge,
  Hammer,
  History,
  House,
  OctagonAlert,
  Package,
  QrCode,
  Rocket,
  Settings2,
  ShoppingCart,
  TreePine,
  Truck,
  UserRound,
  Users,
  WifiOff,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { EMPRESA } from "@/lib/empresa";
import { MODULOS_ATIVOS, MODULOS_EM_TESTE } from "@/lib/permissoes";

/** Ícone de cada seção do manual (ids fixos); seção nova sem ícone usa o livro. */
const ICONES: Record<string, LucideIcon> = {
  "primeiros-passos": Rocket,
  navegacao: Compass,
  avisos: Bell,
  "sem-internet": WifiOff,
  "meu-perfil": UserRound,
  usuarios: Users,
  auditoria: History,
  "serraria-inicio": House,
  "serraria-toras": TreePine,
  "serraria-ficha": ClipboardPen,
  "serraria-boletins": CalendarDays,
  "serraria-paradas": OctagonAlert,
  "serraria-estufas": Flame,
  "serraria-pacotes": Package,
  "serraria-expedicao": Truck,
  "serraria-ler-etiqueta": QrCode,
  "serraria-pedidos": ShoppingCart,
  "serraria-inventario": Boxes,
  "serraria-indicadores": Gauge,
  "serraria-cadastros": Settings2,
  "manutencao-inicio": House,
  "manutencao-abrir": CirclePlus,
  "manutencao-acompanhar": ClipboardList,
  "manutencao-atender": Hammer,
  "manutencao-maquina-parada": OctagonAlert,
  "manutencao-agenda": CalendarDays,
  "manutencao-preventivas": CalendarClock,
  "manutencao-equipamentos": Wrench,
  "manutencao-indicadores": ChartColumn,
  "manutencao-setores": Building2,
};

export function iconeDaSecao(id: string): LucideIcon {
  return ICONES[id] ?? BookOpen;
}

/** A Manutenção ainda em teste (só o administrador enxerga as partes dela no manual). */
export const MANUTENCAO_EM_TESTE = !MODULOS_ATIVOS.includes("manutencao") && MODULOS_EM_TESTE.includes("manutencao");

/** Selo das partes da Manutenção enquanto o módulo está em teste. */
export function SeloEmTeste() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
      <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Em teste: só você vê
    </span>
  );
}

/** Cabeçalho que só aparece no papel (logo, empresa e o nome da parte impressa). */
export function CabecalhoImpressao({ titulo }: { titulo: string }) {
  return (
    <div className="mb-4 hidden items-center gap-3 border-b-2 border-marca-600 pb-3 print:flex">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={EMPRESA.logo} alt="" className="h-12 w-auto" />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-marca-600">{EMPRESA.razaoSocial}</div>
        <div className="text-lg font-bold">
          Manual do usuário · {EMPRESA.sistema} · {titulo}
        </div>
      </div>
    </div>
  );
}
