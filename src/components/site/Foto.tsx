import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Fotos do site. Coloque as fotos reais da Artepinus em public/site/ com estes nomes
 * (JPG, de preferência na horizontal e com uns 2000 px de largura):
 *   abertura.jpg  floresta.jpg  toras.jpg  serraria.jpg  estufa.jpg  pacotes.jpg
 * Enquanto a foto não existir, aparece uma ilustração de floresta de pinus no lugar.
 */
export type NomeFoto = "abertura" | "floresta" | "toras" | "serraria" | "estufa" | "pacotes";

const TEXTO_ALT: Record<NomeFoto, string> = {
  abertura: "Floresta de pinus da Artepinus",
  floresta: "Floresta plantada de pinus",
  toras: "Toras de pinus no pátio",
  serraria: "Serraria da Artepinus",
  estufa: "Estufa de secagem de madeira",
  pacotes: "Pacotes de madeira serrada prontos para expedição",
};

function arquivoDa(nome: NomeFoto) {
  for (const ext of ["jpg", "jpeg", "webp"]) {
    if (existsSync(path.join(process.cwd(), "public", "site", `${nome}.${ext}`))) return `/site/${nome}.${ext}`;
  }
  return null;
}

export function Foto({ nome, className = "", prioridade = false }: { nome: NomeFoto; className?: string; prioridade?: boolean }) {
  const src = arquivoDa(nome);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={TEXTO_ALT[nome]} loading={prioridade ? "eager" : "lazy"} className={`h-full w-full object-cover ${className}`} />;
  }
  return <Ilustracao nome={nome} className={className} />;
}

/* ---------- Ilustrações (sem fotos ainda) ---------- */

// Números "aleatórios" fixos: a mesma ilustração em todo carregamento
function sorteio(semente: number) {
  let x = semente;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

/** Uma fileira de pinheiros (triângulos empilhados) ao longo da largura. */
function fileira(y: number, altura: number, cor: string, semente: number, densidade = 26) {
  const r = sorteio(semente);
  const arvores: string[] = [];
  for (let i = -1; i <= densidade; i++) {
    const x = (i / densidade) * 1600 + r() * 30;
    const h = altura * (0.75 + r() * 0.5);
    const w = h * 0.36;
    const topo = y - h;
    arvores.push(
      `M${x},${topo} L${x + w * 0.5},${topo + h * 0.45} L${x + w * 0.3},${topo + h * 0.45} L${x + w * 0.7},${y} L${x - w * 0.7},${y} L${x - w * 0.3},${topo + h * 0.45} L${x - w * 0.5},${topo + h * 0.45} Z`,
    );
  }
  return <path d={`${arvores.join(" ")} M-50,${y - 2} H1650 V1000 H-50 Z`} fill={cor} />;
}

function Floresta({ claro = false }: { claro?: boolean }) {
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={claro ? "#e9f1e2" : "#c9d9b8"} />
          <stop offset="0.55" stopColor={claro ? "#d6e5c8" : "#8fae7a"} />
          <stop offset="1" stopColor="#3f6534" />
        </linearGradient>
        <radialGradient id="sol" cx="0.62" cy="0.3" r="0.45">
          <stop offset="0" stopColor="#fff4d6" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff4d6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#ceu)" />
      <rect width="1600" height="1000" fill="url(#sol)" />
      {fileira(470, 210, "#7d9d6c", 3, 34)}
      {fileira(600, 280, "#557a48", 7, 28)}
      {fileira(760, 360, "#36592f", 11, 22)}
      {fileira(940, 460, "#1f3b1b", 17, 16)}
    </svg>
  );
}

function Toras() {
  const r = sorteio(5);
  const toras: React.ReactNode[] = [];
  const raio = 62;
  for (let linha = 0; linha < 9; linha++) {
    for (let col = 0; col < 15; col++) {
      const x = col * raio * 1.95 + (linha % 2 ? raio : 0) - 30;
      const y = 1000 - linha * raio * 1.7 - 40;
      const rr = raio * (0.82 + r() * 0.2);
      const k = `${linha}-${col}`;
      toras.push(
        <g key={k}>
          <circle cx={x} cy={y} r={rr} fill="#7a4b28" />
          <circle cx={x} cy={y} r={rr * 0.9} fill={r() > 0.5 ? "#e2b77f" : "#d9a86a"} />
          <circle cx={x} cy={y} r={rr * 0.62} fill="none" stroke="#b9824d" strokeWidth="3" opacity="0.6" />
          <circle cx={x} cy={y} r={rr * 0.34} fill="none" stroke="#b9824d" strokeWidth="2.5" opacity="0.55" />
          <circle cx={x + rr * 0.08} cy={y - rr * 0.05} r={rr * 0.07} fill="#a06a3a" />
        </g>,
      );
    }
  }
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <rect width="1600" height="1000" fill="#5b3a20" />
      {toras}
    </svg>
  );
}

function Tabuas({ seco = false }: { seco?: boolean }) {
  const r = sorteio(seco ? 13 : 9);
  const linhas: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const y = i * 40;
    const cores = seco ? ["#e8cfa2", "#dfc08c", "#ecd6ad"] : ["#d9bb83", "#cfae72", "#e1c592"];
    let x = -20;
    while (x < 1620) {
      const w = 260 + r() * 340;
      linhas.push(<rect key={`${i}-${x}`} x={x} y={y} width={w - 6} height={34} rx="3" fill={cores[Math.floor(r() * cores.length)]} />);
      linhas.push(<rect key={`${i}-${x}-v`} x={x + w * 0.3} y={y + 14} width={w * 0.25} height="2" fill="#b8925a" opacity="0.45" />);
      x += w;
    }
  }
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <rect width="1600" height="1000" fill="#6b4a2a" />
      {linhas}
      {seco && <rect width="1600" height="1000" fill="#fff6e0" opacity="0.08" />}
    </svg>
  );
}

function Ilustracao({ nome, className }: { nome: NomeFoto; className: string }) {
  return (
    <div role="img" aria-label={TEXTO_ALT[nome]} className={`h-full w-full overflow-hidden ${className}`}>
      {nome === "toras" ? <Toras /> : nome === "serraria" ? <Tabuas /> : nome === "pacotes" || nome === "estufa" ? <Tabuas seco /> : <Floresta claro={nome === "floresta"} />}
    </div>
  );
}
