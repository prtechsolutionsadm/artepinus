"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff, CircleHelp, Search } from "lucide-react";
import { lerCodigo, type CodigoLido } from "@/lib/rastreio";

// O QR com código aleatório passa pela página /p/…, que leva a equipe para a tela do pacote
const destino = (c: CodigoLido) => (c.tipo === "codigo" ? `/p/${c.codigo}` : `/producao/${c.tipo === "lote" ? "lotes" : "pacotes"}/${c.numero}`);

type Detector = { detect: (fonte: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opcoes: { formats: string[] }) => Detector;

/**
 * Link para os problemas comuns do manual. <a> comum (e não o Link do Next): esta tela abre sem internet,
 * e /ajuda/problemas fica guardada no aparelho.
 */
function LinkAjuda({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={`nao-imprimir inline-flex items-center gap-1 whitespace-nowrap font-medium underline underline-offset-2 ${className}`}>
      <CircleHelp className="h-3.5 w-3.5 shrink-0" aria-hidden /> {children}
    </a>
  );
}

/**
 * Lê o QR ou o código de barras da etiqueta (pacote ou lote) pela câmera (BarcodeDetector, disponível no Chrome/Android).
 * Onde não houver, a câmera nativa do celular lê o QR e abre o link; ou digita o código.
 */
export function Escaner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [suportado, setSuportado] = useState<boolean | null>(null);
  const [ligada, setLigada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // O erro é da câmera (mostra o link de como liberar)?
  const [erroCamera, setErroCamera] = useState(false);
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    setSuportado("BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  useEffect(() => {
    if (!ligada) return;
    let parar = false;
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        // Fechou (ou saiu da tela) enquanto a câmera abria: a limpeza já rodou sem o stream
        if (parar || !video.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.current.srcObject = stream;
        await video.current.play();
        if (parar) return;
        const Ctor = (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector;
        const detector = new Ctor({ formats: ["qr_code", "code_128"] });
        while (!parar) {
          const lidos = await detector.detect(video.current).catch(() => []);
          const c = lidos.map((l) => lerCodigo(l.rawValue)).find((x) => x);
          if (c) {
            parar = true;
            navigator.vibrate?.(80);
            router.push(destino(c));
            break;
          }
          await new Promise((r) => setTimeout(r, 250));
        }
      } catch {
        if (parar) return; // o próprio usuário fechou (ex.: play() interrompido)
        setErro("Não foi possível abrir a câmera. Permita o acesso à câmera ou digite o código.");
        setErroCamera(true);
        setLigada(false);
      }
    })();
    return () => {
      parar = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [ligada, router]);

  function abrir(e: React.FormEvent) {
    e.preventDefault();
    const c = lerCodigo(codigo);
    if (!c) {
      setErroCamera(false);
      return setErro("Código inválido. Ex.: PCT-000123, LOT-000045 ou 123");
    }
    router.push(destino(c));
  }

  return (
    <div className="space-y-4">
      {suportado && (
        <section className="cartao overflow-hidden p-0">
          {ligada ? (
            <div className="relative bg-black">
              <video ref={video} playsInline muted className="aspect-square w-full object-cover sm:aspect-video" />
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-56 w-56 rounded-3xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
              <button type="button" onClick={() => setLigada(false)} className="btn-secundario absolute bottom-3 left-1/2 -translate-x-1/2">
                <CameraOff className="h-4 w-4" /> Fechar câmera
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => (setErro(null), setErroCamera(false), setLigada(true))} className="flex w-full flex-col items-center gap-2 px-6 py-10 text-marca-700">
              <Camera className="h-10 w-10" />
              <span className="text-lg font-semibold">Abrir câmera e ler a etiqueta</span>
              <span className="text-sm text-stone-500">QR Code ou código de barras do pacote ou do lote</span>
            </button>
          )}
        </section>
      )}
      {suportado === false && (
        <p className="cartao text-sm text-stone-600">
          Neste aparelho, use a <b>câmera do celular</b> direto na etiqueta: o QR abre a página do pacote ou do lote. Ou digite o código abaixo.{" "}
          <LinkAjuda href="/ajuda/problemas#leitor-iphone" className="text-marca-700">
            Como ler no iPhone?
          </LinkAjuda>
        </p>
      )}
      <form onSubmit={abrir} className="cartao">
        <label htmlFor="codigo">Código do pacote ou lote</label>
        <div className="flex gap-2">
          <input
            id="codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="PCT-000123 ou LOT-000045"
            autoCapitalize="characters"
            inputMode="text"
            className="campo font-mono"
          />
          <button className="btn-primario shrink-0">
            <Search className="h-4 w-4" /> Abrir
          </button>
        </div>
      </form>
      {erro && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
          {erro}
          {erroCamera && (
            <>
              {" "}
              <LinkAjuda href="/ajuda/problemas#camera-bloqueada">Como resolver?</LinkAjuda>
            </>
          )}
        </p>
      )}
    </div>
  );
}
