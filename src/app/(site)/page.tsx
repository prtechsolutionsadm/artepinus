import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Factory, Flame, Mail, MapPin, MessageCircle, Package, Phone, QrCode, Ship, TreePine, Truck } from "lucide-react";
import { Foto } from "@/components/site/Foto";
import { IconeInstagram } from "@/components/site/IconeInstagram";
import { db } from "@/lib/db";
import { EMPRESA, anosDeHistoria } from "@/lib/empresa";

type Icone = React.ComponentType<{ className?: string }>;

// Os números da página (estufas) são atualizados a cada hora
export const revalidate = 3600;

const PRODUTOS = [
  { titulo: "Madeira serrada de pinus", texto: "Tábuas, pranchas e sarrafos em diversas espessuras, larguras e comprimentos, conforme o pedido.", foto: "serraria" as const },
  { titulo: "Seca em estufa", texto: "Secagem controlada por ciclo, para estabilidade dimensional e melhor acabamento.", foto: "estufa" as const },
  { titulo: "Pacotes padronizados", texto: "Madeira classificada e embalada, pronta para transporte, armazenagem e exportação.", foto: "pacotes" as const },
];

const ETAPAS: { Icone: Icone; titulo: string; texto: string }[] = [
  { Icone: TreePine, titulo: "Floresta", texto: "Origem de cada carga registrada: floresta e fornecedor." },
  { Icone: Truck, titulo: "Toras", texto: "Cargas conferidas por peso, diâmetro e comprimento." },
  { Icone: Factory, titulo: "Serraria", texto: "Desdobro nas bitolas do pedido, com controle diário." },
  { Icone: Flame, titulo: "Estufa", texto: "Ciclos com checklist e umidade de entrada e saída." },
  { Icone: Package, titulo: "Embalagem", texto: "Pacotes classificados e identificados com QR Code." },
  { Icone: Ship, titulo: "Expedição", texto: "Mercado interno e externo, com nota e destino." },
];

/** Botão em pílula, no estilo do site. */
function Pilula({ href, children, tom = "escuro" }: { href: string; children: React.ReactNode; tom?: "escuro" | "claro" | "menta" }) {
  const cores = {
    escuro: "bg-[#1f3b1b] text-white hover:bg-[#14290f]",
    claro: "bg-white text-stone-900 hover:bg-stone-100",
    menta: "bg-[#cfe8c2] text-[#14290f] hover:bg-[#bfe0af]",
  }[tom];
  return (
    <a href={href} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition ${cores}`}>
      {children} <ChevronRight className="h-4 w-4" />
    </a>
  );
}

function Titulo({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-3xl font-light uppercase leading-[1.08] tracking-tight sm:text-4xl lg:text-[2.75rem] ${className}`}>{children}</h2>;
}

async function totalEstufas() {
  try {
    return await db.estufa.count({ where: { ativo: true } });
  } catch {
    return null;
  }
}

export default async function SitePage() {
  const anos = anosDeHistoria();
  const estufas = await totalEstufas();
  const { contato } = EMPRESA;
  const contatos = [
    contato.telefone && { Icone: Phone, rotulo: "Telefone", valor: contato.telefone, href: `tel:+55${contato.telefone.replace(/\D/g, "")}` },
    contato.whatsapp && { Icone: MessageCircle, rotulo: "WhatsApp", valor: "Conversar pelo WhatsApp", href: `https://wa.me/${contato.whatsapp}` },
    contato.email && { Icone: Mail, rotulo: "E-mail", valor: contato.email, href: `mailto:${contato.email}` },
    contato.instagram && { Icone: IconeInstagram, rotulo: "Instagram", valor: `@${contato.instagram}`, href: `https://www.instagram.com/${contato.instagram}/` },
    (contato.endereco || contato.cidade) && {
      Icone: MapPin,
      rotulo: "Endereço",
      valor: [contato.endereco, contato.cidade].filter(Boolean).join(" · "),
      href: contato.mapa || undefined,
    },
  ].filter(Boolean) as { Icone: Icone; rotulo: string; valor: string; href?: string }[];

  const numeros = [
    [`${anos}+`, "Anos de história"],
    ...(estufas ? [[String(estufas), "Estufas de secagem"]] : []),
    ["6", "Etapas registradas, da floresta ao pacote"],
    ["QR", "Rastreio em cada pacote"],
  ];

  return (
    <>
      {/* Abertura: foto em tela cheia */}
      <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden bg-[#1f3b1b] text-white">
        <div className="absolute inset-0 -z-10">
          <Foto nome="abertura" prioridade />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgb(10_20_8/0.85),rgb(10_20_8/0.35)_55%,rgb(10_20_8/0.55))]" aria-hidden />
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-40 sm:px-6 lg:px-8 lg:pb-24">
          <p className="max-w-sm text-sm leading-relaxed text-white/80">Indústria de madeiras desde 1983 · Caçador – SC. Madeira serrada de pinus para o mercado interno e externo.</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-light uppercase leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Madeira de pinus, da floresta ao pacote
          </h1>
          <div className="mt-10 flex flex-wrap gap-3">
            <Pilula href="#contato" tom="claro">
              Fale com a gente
            </Pilula>
            <a href="#processo" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white ring-1 ring-white/40 transition hover:bg-white/10">
              Conheça o processo
            </a>
          </div>
        </div>
      </section>

      {/* Sobre a empresa: duas fotos e o texto */}
      <section id="empresa" className="scroll-mt-20 bg-[#f2f6ee]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl">
              <Foto nome="floresta" />
            </div>
            <div className="mt-12 aspect-[3/4] overflow-hidden rounded-2xl">
              <Foto nome="toras" />
            </div>
          </div>
          <div>
            <Titulo>Tradição em madeira, com gestão moderna</Titulo>
            <p className="mt-6 text-base leading-relaxed text-stone-600">
              Fundada em 1983, a {EMPRESA.razaoSocial} transforma toras de pinus de florestas plantadas em madeira serrada e seca em estufa, para clientes do mercado
              interno e externo.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Cada etapa é registrada em sistema próprio: o recebimento das toras, a serraria, os ciclos das estufas e a formação dos pacotes. Isso dá previsibilidade ao
              cliente e transparência sobre a origem da madeira.
            </p>
            <div className="mt-8">
              <Pilula href="#processo">Como trabalhamos</Pilula>
            </div>
          </div>
        </div>

        {/* Números */}
        <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <dl className={`grid grid-cols-2 gap-y-10 border-t border-[#1f3b1b]/15 pt-12 text-center ${numeros.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {numeros.map(([v, r]) => (
              <div key={r} className="px-2">
                <dd className="text-5xl font-light tracking-tight text-[#1f3b1b] sm:text-6xl">{v}</dd>
                <dt className="mt-2 text-sm text-stone-600">{r}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Qualidade: foto + bloco verde */}
      <section id="qualidade" className="scroll-mt-20 grid bg-[#1f3b1b] text-white lg:grid-cols-2">
        <div className="relative min-h-[320px] lg:min-h-[560px]">
          <div className="absolute inset-0">
            <Foto nome="serraria" />
          </div>
        </div>
        <div className="flex items-center px-4 py-16 sm:px-10 lg:px-16 lg:py-24">
          <div className="max-w-xl">
            <Titulo className="text-white">Cada pacote com a sua história</Titulo>
            <p className="mt-6 leading-relaxed text-white/75">
              A etiqueta de cada pacote tem um QR Code. Ao ler, o cliente vê de onde vieram as toras, quando foram serradas, em qual estufa a madeira secou e quando o
              pacote foi expedido.
            </p>
            <ul className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
              {["Origem florestal", "Dia de serragem", "Ciclo de estufa e umidade", "Checklist das estufas", "Classificação e volume", "Expedição e destino"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-white/90">
                  <Check className="h-4 w-4 shrink-0 text-[#cfe8c2]" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Pilula href="#contato" tom="menta">
                Fale com a gente
              </Pilula>
            </div>
          </div>
        </div>
      </section>

      {/* Produtos: cartões com foto */}
      <section id="produtos" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Titulo className="max-w-xl">Madeira de pinus para a sua necessidade</Titulo>
            <Pilula href="#contato">Consultar bitolas e prazos</Pilula>
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {PRODUTOS.map((p) => (
              <li key={p.titulo} className="group overflow-hidden rounded-2xl bg-[#f2f6ee]">
                <div className="aspect-[4/3] overflow-hidden">
                  <Foto nome={p.foto} className="transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold">{p.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{p.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Processo */}
      <section id="processo" className="scroll-mt-20 bg-[#f2f6ee]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <Titulo className="max-w-2xl">Da floresta ao pacote, cada etapa registrada</Titulo>
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ETAPAS.map(({ Icone, titulo, texto }, i) => (
              <li key={titulo} className="rounded-2xl bg-white p-6 ring-1 ring-[#1f3b1b]/10">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#1f3b1b] text-white">
                    <Icone className="h-5 w-5" />
                  </span>
                  <span className="text-3xl font-light tabular-nums text-[#1f3b1b]/30">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{titulo}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Etiqueta do pacote */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <Titulo>Rastreio na palma da mão</Titulo>
            <p className="mt-6 leading-relaxed text-stone-600">
              Aponte a câmera do celular para o QR Code da etiqueta e veja a linha do tempo do pacote, em português ou inglês, sem precisar de cadastro.
            </p>
          </div>
          <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl shadow-[#1f3b1b]/10 ring-1 ring-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={EMPRESA.logo} alt="" className="h-8 w-auto" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Etiqueta de pacote</span>
            </div>
            <div className="flex gap-5 px-5 py-5">
              <QrCode className="h-24 w-24 shrink-0 text-stone-800" strokeWidth={1.25} />
              <div className="min-w-0">
                <div className="font-mono text-lg font-semibold">PCT-000000</div>
                <div className="mt-1 text-sm text-stone-600">25 × 100 × 3000 mm</div>
                <div className="text-sm text-stone-600">Seco em estufa · Ótimo</div>
              </div>
            </div>
            <ol className="grid grid-cols-5 border-t border-stone-200 text-center text-[11px] text-stone-500">
              {["Floresta", "Toras", "Serraria", "Estufa", "Pacote"].map((t, i) => (
                <li key={t} className={`px-1 py-3 ${i > 0 ? "border-l border-stone-200" : ""}`}>
                  <span className="mx-auto mb-1 block h-1.5 w-1.5 rounded-full bg-marca-600" />
                  {t}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="scroll-mt-20 bg-[#1f3b1b] text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-28">
          <div className="lg:col-span-5">
            <Titulo className="text-white">Vamos conversar sobre o seu pedido</Titulo>
            <p className="mt-6 leading-relaxed text-white/75">Fale com a nossa equipe comercial sobre bitolas, volumes e prazos.</p>
          </div>
          <div className="lg:col-span-7">
            <dl className="divide-y divide-white/10 rounded-2xl bg-white/5 px-5 ring-1 ring-white/10">
              {contatos.map(({ Icone, rotulo, valor, href }) => (
                <div key={rotulo} className="flex items-center gap-4 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#cfe8c2] text-[#1f3b1b]">
                    <Icone className="h-[18px] w-[18px]" />
                  </span>
                  <dt className="w-24 shrink-0 text-sm text-white/60">{rotulo}</dt>
                  <dd className="min-w-0 font-medium [overflow-wrap:anywhere]">
                    {href ? (
                      <a href={href} className="hover:text-[#cfe8c2]" target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                        {valor}
                      </a>
                    ) : (
                      valor
                    )}
                  </dd>
                </div>
              ))}
              <div className="flex items-center gap-4 py-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#cfe8c2] text-[#1f3b1b]">
                  <Factory className="h-[18px] w-[18px]" />
                </span>
                <dt className="w-24 shrink-0 text-sm text-white/60">Empresa</dt>
                <dd className="min-w-0 font-medium">
                  {EMPRESA.razaoSocial} <span className="block text-sm font-normal text-white/60">CNPJ {EMPRESA.cnpj}</span>
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 text-stone-900">
              <div>
                <div className="text-sm font-semibold">Área do colaborador</div>
                <p className="text-sm text-stone-500">Acesse o sistema com o seu login.</p>
              </div>
              <Link href="/sistema" className="inline-flex items-center gap-2 rounded-full bg-[#1f3b1b] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#14290f]">
                Acessar sistema <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
