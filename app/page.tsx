"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  // Adicione este useEffect logo abaixo dos seus useState
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("login") === "true") {
        setMostrarLogin(true);
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("stadium_token");
    const cargo = localStorage.getItem("stadium_cargo");
    if (token && cargo) {
      router.replace(cargo === "admin" ? "/admin" : "/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("https://web-production-aeb1b.up.railway.app/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        const payload = JSON.parse(atob(dados.access_token.split(".")[1]));

        localStorage.setItem("stadium_token", dados.access_token);
        localStorage.setItem("stadium_cargo", payload.cargo);

        router.replace(payload.cargo === "admin" ? "/admin" : "/dashboard");
      } else {
        setErro(dados.detail || "Email ou senha incorretos.");
      }
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 text-fg relative overflow-hidden">
      
      {/* 1. Imagem de Fundo Desfocada */}
      <div 
        className="absolute inset-0 z-0 opacity-60"
        style={{
          backgroundImage: "url('https://s2-techtudo.glbimg.com/039cbJsKXKx3TNa9w3cpnSZEJO4=/0x0:1920x1200/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_08fbf48bc0524877943fe86e43087e7a/internal_photos/bs/2018/k/3/xU17l4RC6iAUE0PRtB2w/2-.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px)",
          transform: "scale(1.05)" // Faz a imagem passar um pouco da tela para o blur não deixar bordas brancas
        }}
      />

      {/* 2. Overlay Escuro (Vignette Radial) */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          background: "radial-gradient(circle at center, rgba(11,15,20,0.3) 0%, rgba(11,15,20,0.95) 100%)"
        }}
      />

      {/* 3. Brilho Laranja central sutil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ow-orange/10 rounded-full blur-[100px] pointer-events-none z-0" />


      {/* Conteúdo da Página (Formulário e Textos) */}
      <div className="w-full max-w-md relative z-10 flex flex-col gap-8">
        
        {/* Header / Branding */}
        <div className="text-center space-y-4">
          
          {/* Logo Oficial Overwatch */}
          <svg 
            viewBox="0 0 48 48" 
            fill="none" 
            className="w-24 h-24 mx-auto drop-shadow-[0_0_15px_rgba(249,158,26,0.5)]"
          >
            <path fill="#F99E1A" d="M13.9 13.901a14.284 14.284 0 0 1 20.2 0l4.043-4.042a20 20 0 0 0-28.286 0z"></path>
            <path fill="#E6EDF7" d="m39.312 11.135-4.063 4.062a14.29 14.29 0 0 1 .995 16.159L28.891 24l-4.006-9.413h-.02V27.31l7.938 7.938a14.29 14.29 0 0 1-17.606 0l7.939-7.938V14.636l-4.027 9.365-7.355 7.355a14.29 14.29 0 0 1 .997-16.159l-4.063-4.062a20.001 20.001 0 1 0 30.624 0"></path>
          </svg>

          <div>
            <h1 className="text-display text-4xl font-bold uppercase tracking-wide drop-shadow-md">
              Overwatch <span className="text-ow-orange">Stadium</span>
            </h1>
            <p className="text-fg-muted font-semibold uppercase tracking-widest text-sm mt-2 drop-shadow-md">
              Plataforma de Torneios
            </p>
          </div>
        </div>

        {/* Área Principal (Público) */}
        {!mostrarLogin && (
          <button
            onClick={() => router.push("/publico")}
            className="group surface-card border-2 border-ow-orange/30 hover:border-ow-orange p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(249,158,26,0.5)]"
          >
            <div className="text-ow-orange mb-4 flex justify-center transition-transform group-hover:scale-110">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
              </svg>
            </div>
            <h2 className="text-display text-2xl font-bold uppercase text-fg mb-2">
              Explorar Torneio
            </h2>
            <p className="text-fg-muted text-sm mb-6">
              Acompanhe as chaves, times inscritos e resultados das partidas ao vivo.
            </p>
            <span className="inline-block bg-ow-orange text-background font-bold uppercase tracking-wider py-2 px-6 rounded-lg text-sm group-hover:bg-ow-orange-glow transition-colors">
              Acessar Área Pública →
            </span>
          </button>
        )}

        {/* Formulário de Login (Admin) */}
        {mostrarLogin && (
          <div className="surface-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-display text-xl font-bold uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-line-strong pb-4">
              <span className="text-ow-orange">✦</span> Acesso Restrito
            </h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">E-mail</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-background border border-line-strong rounded-lg text-fg focus:outline-none focus:border-ow-orange transition-colors placeholder:text-fg-muted/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@stadium.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Senha</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-background border border-line-strong rounded-lg text-fg focus:outline-none focus:border-ow-orange transition-colors placeholder:text-fg-muted/50"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {erro && (
                <div className="bg-danger/10 border-l-4 border-danger text-danger p-3 text-sm font-semibold rounded">
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-ow-orange text-background font-bold uppercase tracking-wider py-3 px-4 rounded-lg hover:bg-ow-orange-glow transition-colors disabled:opacity-50 mt-2"
              >
                {carregando ? "Autenticando..." : "Entrar no Sistema"}
              </button>
            </form>
          </div>
        )}

        {/* Toggle Footer */}
        <div className="text-center mt-2">
          <button
            onClick={() => {
              setMostrarLogin(!mostrarLogin);
              setErro(""); // Limpa os erros se o usuário fechar/abrir
            }}
            className="text-xs font-semibold text-fg-muted hover:text-ow-orange transition-colors uppercase tracking-widest"
          >
            {mostrarLogin ? "← Voltar ao Início" : "Sou Administrador / Equipe"}
          </button>
        </div>

      </div>
    </main>
  );
}