import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { CabecalhoSite } from "@/components/site/Cabecalho";
import { IconeInstagram } from "@/components/site/IconeInstagram";
import { CREDITO, EMPRESA, direitos } from "@/lib/empresa";

const TITULO = "Artepinus Madeiras · Madeira serrada de pinus desde 1983";
const DESCRICAO = "Madeira serrada de pinus, seca em estufa, para o mercado interno e externo. Rastreabilidade de cada pacote, da floresta à expedição. Caçador – SC.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRICAO,
  alternates: { canonical: "/" },
  // Preview de compartilhamento (WhatsApp, redes sociais)
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Artepinus Madeiras",
    title: TITULO,
    description: DESCRICAO,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Artepinus Madeiras · Madeira serrada de pinus, da floresta ao pacote" }],
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRICAO, images: ["/og.jpg"] },
};

const LINKS = [
  { href: "/#empresa", label: "Empresa" },
  { href: "/#produtos", label: "Produtos" },
  { href: "/#processo", label: "Processo" },
  { href: "/#qualidade", label: "Qualidade" },
  { href: "/#contato", label: "Contato" },
];

const instagram = EMPRESA.contato.instagram ? `https://www.instagram.com/${EMPRESA.contato.instagram}/` : null;

/** Site institucional da Artepinus (público). O sistema fica em /sistema. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-stone-900">
      <CabecalhoSite links={LINKS} instagram={instagram} logo={EMPRESA.logo} logoBranco={EMPRESA.logoBranco} />

      <main>{children}</main>

      <footer className="bg-[#14290f] text-white/70 [&_a:hover]:!text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={EMPRESA.logoBranco} alt="Artepinus" className="h-10 w-auto" />
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              {EMPRESA.razaoSocial}
              <br />
              CNPJ {EMPRESA.cnpj}
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Navegação</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-white/70 hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Contato</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {EMPRESA.contato.telefone && (
                <li>
                  <a href={`tel:+55${EMPRESA.contato.telefone.replace(/\D/g, "")}`} className="inline-flex items-center gap-2 text-white/70 hover:text-white">
                    <Phone className="h-4 w-4" /> {EMPRESA.contato.telefone}
                  </a>
                </li>
              )}
              {(EMPRESA.contato.endereco || EMPRESA.contato.cidade) && (
                <li>
                  <a
                    href={EMPRESA.contato.mapa || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-start gap-2 text-white/70 hover:text-white"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {EMPRESA.contato.endereco}
                      {EMPRESA.contato.endereco && EMPRESA.contato.cidade && <br />}
                      {EMPRESA.contato.cidade}
                    </span>
                  </a>
                </li>
              )}
              {instagram && (
                <li>
                  <a href={instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-white/70 hover:text-white">
                    <IconeInstagram className="h-4 w-4" /> @{EMPRESA.contato.instagram}
                  </a>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Área do colaborador</h2>
            <p className="mt-4 text-sm text-white/70">Serraria, estufas e rastreabilidade dos pacotes.</p>
            <Link href="/sistema" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#cfe8c2] hover:text-white">
              Acessar sistema <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-white/45 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
            <span>{direitos()}</span>
            <span>
              {CREDITO} ·{" "}
              <Link href="/privacidade" className="hover:text-white/70">
                Política de Privacidade
              </Link>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
