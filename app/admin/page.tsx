"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminMenuPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("stadium_token");
    const cargo = localStorage.getItem("stadium_cargo");
    if (!token || cargo !== "admin") {
      router.replace("/");
    }
  }, [router]);

  const sair = () => {
    localStorage.removeItem("stadium_token");
    localStorage.removeItem("stadium_cargo");
    router.replace("/");
  };

  const menus = [
    {
      titulo: "Equipes",
      descricao: "Cadastrar, listar e remover equipes do campeonato",
      rota: "/admin/equipes",
      cor: "border-purple-500 hover:bg-purple-900/30", // mantido para compat
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" strokeLinejoin="round" />
        </svg>
      ),
      accent: "ow-blue" as const,
    },
    {
      titulo: "Inscrições",
      descricao: "Visualizar, verificar e editar equipes inscritas pelo formulário",
      rota: "/admin/inscricoes",
      cor: "border-green-500 hover:bg-green-900/30",
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" strokeLinejoin="round" />
          <path d="M14 3v6h6M9 14h6M9 18h4" strokeLinecap="round" />
        </svg>
      ),
      accent: "ow-orange" as const,
    },
    {
      titulo: "Área Pública",
      descricao: "Ver a página pública do torneio como os participantes veem",
      rota: "/publico",
      cor: "border-blue-500 hover:bg-blue-900/30",
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      ),
      accent: "success" as const,
    },

    {
      titulo: "Chaveamento",
      descricao: "Gerar rodadas, registrar vencedores e acompanhar o bracket",
      rota: "/admin/chaveamento",
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
          <path d="M8 21h8M12 17v4M7 4h10l-1 5c-.5 2.5-2 4.5-4 5.5-2-1-3.5-3-4-5.5L7 4z" strokeLinejoin="round" />
          <path d="M7 4H3v3c0 2 1.5 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 4h4v3c0 2-1.5 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      accent: "ow-orange" as const,
    },
  ];

  const accentMap = {
    "ow-blue": {
      border: "border-ow-blue/30 hover:border-ow-blue",
      text: "text-ow-blue",
      glow: "hover:shadow-[0_20px_50px_-20px_rgba(33,143,254,0.45)]",
    },
    "ow-orange": {
      border: "border-ow-orange/30 hover:border-ow-orange",
      text: "text-ow-orange",
      glow: "hover:shadow-[0_20px_50px_-20px_rgba(249,158,26,0.5)]",
    },
    success: {
      border: "border-success/30 hover:border-success",
      text: "text-success",
      glow: "hover:shadow-[0_20px_50px_-20px_rgba(34,197,94,0.45)]",
    },
  };

  return (
    <main className="min-h-screen p-6 md:p-10 text-fg">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="relative overflow-hidden rounded-2xl border border-line-strong mb-10">
          <div className="absolute inset-0 hero-grad" />
          <div className="relative p-6 md:p-8 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Logo Oficial Overwatch */}
              <svg 
                viewBox="0 0 48 48" 
                fill="none" 
                className="w-14 h-14 shrink-0 drop-shadow-[0_0_15px_rgba(249,158,26,0.4)]"
              >
                <path fill="#F99E1A" d="M13.9 13.901a14.284 14.284 0 0 1 20.2 0l4.043-4.042a20 20 0 0 0-28.286 0z"></path>
                <path fill="#E6EDF7" d="m39.312 11.135-4.063 4.062a14.29 14.29 0 0 1 .995 16.159L28.891 24l-4.006-9.413h-.02V27.31l7.938 7.938a14.29 14.29 0 0 1-17.606 0l7.939-7.938V14.636l-4.027 9.365-7.355 7.355a14.29 14.29 0 0 1 .997-16.159l-4.063-4.062a20.001 20.001 0 1 0 30.624 0"></path>
              </svg>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-ow-orange font-semibold">
                  Painel do Organizador
                </p>
                <h1 className="text-display text-3xl md:text-4xl font-bold uppercase">
                  Overwatch <span className="text-ow-orange">Stadium</span>
                </h1>
              </div>
            </div>
            <button
              onClick={sair}
              className="text-sm font-semibold border border-line-strong hover:border-danger/60 hover:text-danger text-fg-muted px-4 py-2 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </header>

        {/* Menu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {menus.map((item) => {
            const a = accentMap[item.accent];
            return (
              <button
                key={item.rota}
                onClick={() => router.push(item.rota)}
                className={`group surface-card p-6 text-left border-2 transition-all duration-200 hover:-translate-y-1 ${a.border} ${a.glow}`}
              >
                <div className={`${a.text} mb-4 transition-transform group-hover:scale-110 origin-left`}>
                  {item.icone}
                </div>
                <h2 className="text-display text-xl font-bold uppercase tracking-wider mb-2">
                  {item.titulo}
                </h2>
                <p className="text-fg-muted text-sm leading-relaxed">{item.descricao}</p>
                <span className={`mt-4 inline-block text-xs font-semibold uppercase tracking-widest ${a.text}`}>
                  Acessar →
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
