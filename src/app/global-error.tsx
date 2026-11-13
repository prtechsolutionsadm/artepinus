"use client";

import { useEffect, useState } from "react";
import { useSemConexao } from "@/lib/falha-acao";

// Substitui o layout raiz quando ele falha: sem globals.css, por isso os estilos são inline.
const cor = (claro: string, escuro: string) => `light-dark(${claro}, ${escuro})`;
const botao: React.CSSProperties = {
  display: "inline-block",
  borderRadius: 12,
  padding: "10px 16px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  fontFamily: "inherit",
};

export default function ErroGeral({ error, retry }: { error: unknown; retry: () => void }) {
  const semRede = useSemConexao();
  // Mesmo tema escolhido no sistema (chave de src/components/Tema.tsx); sem escolha, segue o aparelho
  const [esquema, setEsquema] = useState("light dark");
  useEffect(() => {
    console.error(error);
    try {
      const t = localStorage.getItem("artepinus-tema");
      if (t === "claro") setEsquema("light");
      else if (t === "escuro") setEsquema("dark");
    } catch {}
  }, [error]);

  return (
    <html lang="pt-BR" style={{ colorScheme: esquema }}>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          boxSizing: "border-box",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: cor("#f5f5f4", "#0f120e"),
          color: cor("#1c1917", "#e7e5e4"),
        }}
      >
        <title>{semRede ? "Sem conexão · Artepinus" : "Algo deu errado · Artepinus"}</title>
        <main
          role="alert"
          style={{
            width: "100%",
            maxWidth: 420,
            textAlign: "center",
            borderRadius: 16,
            padding: 24,
            boxSizing: "border-box",
            background: cor("#ffffff", "#171b16"),
            border: `1px solid ${cor("#e7e5e4", "#2c322a")}`,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{semRede ? "Sem conexão com a internet" : "Algo deu errado"}</h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: cor("#57534e", "#a8a29e") }}>
            {semRede ? "Confira a internet do aparelho e toque em Tentar de novo." : "Não foi possível abrir o sistema agora. Tente de novo em instantes."}
          </p>
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
            <button type="button" onClick={() => retry()} style={{ ...botao, border: "none", background: "#177009", color: "#ffffff" }}>
              Tentar de novo
            </button>
            <button type="button" onClick={() => location.reload()} style={{ ...botao, border: `1px solid ${cor("#d6d3d1", "#3a4237")}`, background: "transparent", color: "inherit" }}>
              Recarregar
            </button>
          </div>
          {/* Navegação completa (sem o roteador do Next, que pode estar com erro) */}
          <a href="/sistema" style={{ display: "inline-block", marginTop: 16, fontSize: 13, color: "inherit", opacity: 0.7 }}>
            Ir para o início
          </a>
        </main>
      </body>
    </html>
  );
}
