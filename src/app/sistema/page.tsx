import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Factory, FlaskConical, KeyRound, Lock, Wrench, type LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { sair } from "@/app/actions/auth";
import { BotaoSair } from "@/components/BotaoSair";
import { Rodape } from "@/components/Rodape";
import { SCRIPT_TEMA, TemaApp } from "@/components/Tema";
import { PERFIL, PERFIL_PRODUCAO } from "@/lib/constantes";
import { MODULOS, MODULOS_ATIVOS, MODULOS_EM_TESTE, temModulo, type Modulo } from "@/lib/permissoes";
import { exigirUsuario } from "@/lib/session";

export const metadata: Metadata = { title: "Início", robots: { index: false, follow: false } };

const CARTOES: { modulo: Modulo; Icone: LucideIcon; descricao: string; itens: string[] }[] = [
  {
    modulo: "producao",
    Icone: Factory,
    descricao: "Do recebimento das toras à expedição dos pacotes.",
    itens: ["Toras e serraria", "Estufas", "Pacotes, romaneios e pedidos", "Indicadores e inventário"],
  },
  {
    modulo: "manutencao",
    Icone: Wrench,
    descricao: "Requisições de manutenção, preventivas e equipamentos.",
    itens: ["Requisições e agenda", "Preventivas e checklists", "Equipamentos com QR Code", "Indicadores de manutenção"],
  },
];

function saudacao() {
  const h = Number(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

/** Tela de início do sistema: escolha do módulo (Serraria; Manutenção em breve — aberta só para o administrador testar). */
export default async function SistemaPage() {
  const eu = await exigirUsuario();
  const seg = await db.usuario.findUniqueOrThrow({ where: { id: eu.id }, select: { perguntaSeguranca: true, respostaHash: true } });
  const temPergunta = seg.perguntaSeguranca != null && !!seg.respostaHash;
  const perfil = eu.perfilProducao && eu.perfil !== "ADMIN" && eu.perfil !== "GERENTE" ? PERFIL_PRODUCAO[eu.perfilProducao] : PERFIL[eu.perfil];

  return (
    <div className="flex min-h-dvh flex-col">
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      <TemaApp />
      <header className="border-b border-stone-200 bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Artepinus" className="h-10 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-branco.svg" alt="Artepinus" className="hidden h-10 w-auto dark:block" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-semibold">{eu.nome}</div>
              <div className="text-xs text-stone-500">{perfil}</div>
            </div>
            <BotaoSair sair={sair} variante="icone" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <p className="text-sm text-stone-500">{saudacao()},</p>
        <h1 className="text-3xl font-semibold tracking-tight">{eu.nome.split(" ")[0]}, onde vamos trabalhar hoje?</h1>

        {!temPergunta && (
          <Link href="/perfil" className="mt-6 flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100">
            <KeyRound className="h-5 w-5 shrink-0" />
            <span className="flex-1">
              <b>Cadastre a sua pergunta de segurança</b> — assim você recupera a senha sozinho, se esquecer.
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        )}

        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {CARTOES.map(({ modulo, Icone, descricao, itens }) => {
            const liberado = temModulo(eu, modulo);
            const emTeste = !MODULOS_ATIVOS.includes(modulo) && MODULOS_EM_TESTE.includes(modulo);
            const conteudo = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid h-14 w-14 place-items-center rounded-xl ${liberado ? "bg-marca-700 text-white" : "bg-stone-100 text-stone-400"}`}>
                    <Icone className="h-7 w-7" />
                  </span>
                  {emTeste && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${liberado ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-stone-100 text-stone-600 ring-stone-200"}`}
                    >
                      {liberado ? (
                        <>
                          <FlaskConical className="h-3.5 w-3.5" /> Em teste · só administrador
                        </>
                      ) : (
                        "Em breve"
                      )}
                    </span>
                  )}
                </div>
                <h2 className={`mt-5 text-2xl font-semibold ${liberado ? "" : "text-stone-500"}`}>{MODULOS[modulo].nome}</h2>
                <p className="mt-1 text-stone-600">{descricao}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-stone-600">
                  {itens.map((i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${liberado ? "bg-marca-600" : "bg-stone-300"}`} aria-hidden />
                      {i}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {liberado ? (
                    <span className="inline-flex items-center gap-2 rounded-md bg-marca-700 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-marca-800">
                      {emTeste ? "Entrar para testar" : "Entrar"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-500">
                      <Lock className="h-4 w-4" /> {emTeste ? "Disponível em breve" : "Sem acesso — fale com o gerente"}
                    </span>
                  )}
                </div>
              </>
            );
            return (
              <li key={modulo}>
                {liberado ? (
                  <Link href={MODULOS[modulo].inicio} className="group block h-full rounded-2xl border border-stone-200 bg-white p-6 transition hover:border-marca-400 hover:shadow-lg sm:p-7">
                    {conteudo}
                  </Link>
                ) : (
                  <div aria-disabled className="h-full rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-6 sm:p-7">
                    {conteudo}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
      <Rodape className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6" />
    </div>
  );
}
