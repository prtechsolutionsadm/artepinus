// Roda "prisma migrate deploy" no build, tentando de novo quando o banco recusa a
// conexão por limite momentâneo (ex.: instâncias antigas ainda conectadas).
import { spawnSync } from "node:child_process";

// Deploy de Preview na Vercel: neste projeto o Preview usa o mesmo DATABASE_URL da produção, e a
// migration de uma branch ainda não revisada mudaria o banco de produção. Fora da Vercel nada muda.
if (process.env.VERCEL_ENV === "preview") {
  console.log("Preview: migrations não são aplicadas (o banco é o de produção).");
  process.exit(0);
}

const TENTATIVAS = 8;
const TRANSITORIO = /too many connections|P1001|P2037|Can't reach database|ECONNRESET|timeout/i;

for (let n = 1; n <= TENTATIVAS; n++) {
  const r = spawnSync("npx", ["prisma", "migrate", "deploy"], { encoding: "utf8" });
  process.stdout.write(r.stdout ?? "");
  process.stderr.write(r.stderr ?? "");
  if (r.status === 0) process.exit(0);
  const saida = `${r.stdout}\n${r.stderr}`;
  if (!TRANSITORIO.test(saida) || n === TENTATIVAS) process.exit(r.status ?? 1);
  const espera = Math.min(30, 5 * n);
  console.log(`\nBanco ocupado (tentativa ${n}/${TENTATIVAS}); tentando de novo em ${espera}s…`);
  await new Promise((ok) => setTimeout(ok, espera * 1000));
}
