"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CloudOff, CloudUpload, RotateCcw, Trash2, X } from "lucide-react";
import { EVENTO_FILA, definirDonoFila, descartarDaFila, limparPaginasGuardadas, listarFila, sincronizarFila, tentarDeNovo, type ItemFila } from "@/lib/fila-offline";

const ULTIMO_USUARIO = "artepinus:usuario-offline";

/**
 * Envia a fila de lançamentos feitos sem internet assim que a conexão volta,
 * mantém as páginas offline atualizadas e mostra o que ainda está pendente.
 */
export function SincronizadorOffline({ usuarioId, nome }: { usuarioId: string; nome: string }) {
  const router = useRouter();
  const [fila, setFila] = useState<ItemFila[]>([]);
  const [online, setOnline] = useState(true);
  const [enviadas, setEnviadas] = useState(0);
  const [aberto, setAberto] = useState(false);

  const atualizar = useCallback(() => {
    listarFila().then(setFila);
  }, []);

  const sincronizar = useCallback(async () => {
    const r = await sincronizarFila();
    if (r.enviadas) {
      setEnviadas(r.enviadas);
      router.refresh();
    }
    atualizar();
  }, [atualizar, router]);

  useEffect(() => {
    // Lançamentos ficam no nome de quem está logado; os de outro usuário só ele envia
    definirDonoFila(usuarioId, nome);
    setOnline(navigator.onLine);
    atualizar();
    sincronizar();
    const aquecer = () => navigator.serviceWorker?.controller?.postMessage({ tipo: "aquecer" });
    // Outro usuário neste aparelho: apaga as telas guardadas do anterior antes de guardar as novas
    let anterior: string | null = null;
    try {
      anterior = localStorage.getItem(ULTIMO_USUARIO);
    } catch {}
    if (anterior && anterior !== usuarioId) limparPaginasGuardadas().then(aquecer);
    else aquecer();
    try {
      localStorage.setItem(ULTIMO_USUARIO, usuarioId);
    } catch {}
    navigator.serviceWorker?.addEventListener("controllerchange", aquecer);
    const aoOnline = () => (setOnline(true), sincronizar(), aquecer());
    const aoOffline = () => setOnline(false);
    window.addEventListener("online", aoOnline);
    window.addEventListener("offline", aoOffline);
    window.addEventListener(EVENTO_FILA, atualizar);
    const t = setInterval(() => navigator.onLine && sincronizar(), 60_000);
    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", aquecer);
      window.removeEventListener("online", aoOnline);
      window.removeEventListener("offline", aoOffline);
      window.removeEventListener(EVENTO_FILA, atualizar);
      clearInterval(t);
    };
  }, [atualizar, sincronizar, usuarioId, nome]);

  useEffect(() => {
    if (!enviadas) return;
    const t = setTimeout(() => setEnviadas(0), 6000);
    return () => clearTimeout(t);
  }, [enviadas]);

  if (enviadas) {
    return (
      <div role="status" className="nao-imprimir mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
        <CloudUpload className="h-4 w-4" /> {enviadas} lançamento{enviadas > 1 ? "s feitos" : " feito"} sem internet {enviadas > 1 ? "foram enviados" : "foi enviado"}.
        <button onClick={() => setEnviadas(0)} className="ml-auto" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
  if (!online && fila.length === 0) {
    return (
      <div className="nao-imprimir mb-4 flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-700 ring-1 ring-stone-200">
        <CloudOff className="h-4 w-4" /> Sem internet. Continue apontando: os lançamentos ficam guardados e são enviados quando a conexão voltar.
      </div>
    );
  }
  if (fila.length === 0) return null;

  const deOutro = (i: ItemFila) => !!i.usuarioId && i.usuarioId !== usuarioId;
  const recusados = fila.filter((i) => i.erro).length;
  const outros = fila.filter((i) => !i.erro && deOutro(i)).length;
  const aguardando = fila.length - recusados - outros;
  const resumo = [
    aguardando > 0 && `${aguardando} lançamento${aguardando > 1 ? "s aguardando" : " aguardando"} ${online ? "envio" : "internet"}`,
    outros > 0 && `${outros} de outro usuário`,
  ].filter(Boolean);

  return (
    <div className={`nao-imprimir mb-4 rounded-xl px-3 py-2 text-sm ring-1 ${recusados ? "bg-rose-50 text-rose-800 ring-rose-200" : "bg-amber-50 text-amber-900 ring-amber-200"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <CloudOff className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1">
          {resumo.join(" · ")}
          {recusados > 0 && (
            <b className="block">
              {recusados} lançamento{recusados > 1 ? "s recusados" : " recusado"} pelo servidor. {aberto ? "Veja o motivo abaixo." : "Toque em Ver para saber o motivo."}
            </b>
          )}
        </span>
        <button onClick={() => setAberto(!aberto)} className="font-medium underline">
          {aberto ? "Ocultar" : "Ver"}
        </button>
        {online && aguardando > 0 && (
          <button onClick={sincronizar} className="font-medium underline">
            Enviar agora
          </button>
        )}
      </div>
      {aberto && (
        <ul className={`mt-2 divide-y border-t ${recusados ? "divide-rose-200 border-rose-200" : "divide-amber-200 border-amber-200"}`}>
          {fila.map((i) => (
            <li key={i.chave} className="flex items-center gap-2 py-1.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{i.titulo}</span>
                <span className="block text-xs opacity-80">
                  {new Date(i.criadoEm).toLocaleString("pt-BR")}
                  {i.fotos.length ? ` · ${i.fotos.length} foto(s)` : ""}
                  {!i.erro && deOutro(i) ? ` · de ${i.usuarioNome ?? "outro usuário"}: entre com esse login para enviar` : ""}
                </span>
                {i.erro && <span className="block text-xs font-semibold text-rose-700">Recusado: {i.erro}</span>}
              </span>
              {i.erro && (
                <button
                  onClick={async () => {
                    await tentarDeNovo(i.chave);
                    sincronizar();
                  }}
                  className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold hover:bg-rose-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Tentar de novo
                </button>
              )}
              <button
                onClick={() => confirm("Descartar este lançamento? Ele não será enviado.") && descartarDaFila(i.chave)}
                aria-label="Descartar"
                title="Descartar"
                className={`grid h-8 w-8 place-items-center rounded-full ${recusados ? "hover:bg-rose-100" : "hover:bg-amber-100"}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
