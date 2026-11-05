"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu } from "lucide-react";
import { IconeInstagram } from "@/components/site/IconeInstagram";

/**
 * Topo do site: na página inicial fica transparente sobre a foto de abertura (texto branco)
 * e fica branco ao rolar; nas outras páginas é sempre branco.
 */
export function CabecalhoSite({ links, instagram, logo, logoBranco }: { links: { href: string; label: string }[]; instagram: string | null; logo: string; logoBranco: string }) {
  const sobreFoto = usePathname() === "/";
  const [rolou, setRolou] = useState(false);
  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 40);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);
  const claro = sobreFoto && !rolou;

  return (
    <header
      className={`${sobreFoto ? "fixed" : "sticky"} inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)] transition-colors duration-300 ${
        claro ? "bg-transparent text-white" : "border-b border-stone-200 bg-white/95 text-stone-900 backdrop-blur"
      }`}
    >
      <div className={`mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6 lg:h-[76px] lg:px-8 ${claro ? "border-b border-white/20" : ""}`}>
        <Link href="/" aria-label="Artepinus · início" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={claro ? logoBranco : logo} alt="Artepinus" className="h-9 w-auto lg:h-10" />
        </Link>
        <nav aria-label="Seções" className="ml-auto hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className={`text-xs font-semibold uppercase tracking-[0.12em] transition ${claro ? "text-white/85 hover:text-white" : "text-stone-600 hover:text-marca-700"}`}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram da Artepinus"
              title="Instagram"
              className={`hidden h-9 w-9 place-items-center rounded-full transition sm:grid ${claro ? "text-white/85 hover:bg-white/10" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"}`}
            >
              <IconeInstagram className="h-[18px] w-[18px]" />
            </a>
          )}
          <Link
            href="/sistema"
            className="hidden items-center gap-2 rounded-full bg-[#cfe8c2] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#14290f] transition hover:bg-[#bfe0af] sm:inline-flex"
          >
            Acessar sistema <ArrowRight className="h-4 w-4" />
          </Link>
          <details className="relative lg:hidden">
            <summary
              className={`grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border ${claro ? "border-white/40 text-white" : "border-stone-200 text-stone-700"}`}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white py-2 text-stone-700 shadow-lg">
              {links.map((l) => (
                <a key={l.href} href={l.href} className="block px-4 py-2.5 text-sm font-medium hover:bg-stone-50">
                  {l.label}
                </a>
              ))}
              {instagram && (
                <a href={instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-stone-50">
                  <IconeInstagram className="h-4 w-4" /> Instagram
                </a>
              )}
              <div className="mt-1 border-t border-stone-200 px-4 pt-3">
                <Link href="/sistema" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1f3b1b] px-4 py-2.5 text-sm font-semibold text-white">
                  Acessar sistema <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
