"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const router = useRouter();

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

    try {
      const resposta = await fetch("https://web-production-aeb1b.up.railway.app/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        // Decodifica o payload do JWT para pegar o cargo
        // O token é base64: header.payload.signature
        const payload = JSON.parse(atob(dados.access_token.split(".")[1]));

        localStorage.setItem("stadium_token", dados.access_token);
        localStorage.setItem("stadium_cargo", payload.cargo);

        // Redireciona para o painel correto baseado no cargo
        router.replace(payload.cargo === "admin" ? "/admin" : "/dashboard");
      } else {
        setErro(dados.detail || "Email ou senha incorretos.");
      }
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-neutral-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Overwatch Stadium</h1>
          <p className="text-neutral-400">Acesse sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">E-mail</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Senha</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro && (
            <p className="text-red-400 text-sm text-center">{erro}</p>
          )}

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Acessar Sistema
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/publico")}
            className="text-neutral-400 hover:text-white text-sm transition-colors"
          >
            Ver área pública →
          </button>
        </div>
      </div>
    </main>
  );
}