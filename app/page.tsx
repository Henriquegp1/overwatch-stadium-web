"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const router = useRouter();

  // Se já tiver feito login antes, pula direto pro painel!
  useEffect(() => {
    const token = localStorage.getItem("stadium_token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const resposta = await fetch("http://localhost:8000/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        localStorage.setItem("stadium_token", dados.access_token);
        router.replace("/dashboard"); // Teletransporte suave
      } else {
        alert("Erro no login: " + dados.detail);
      }
    } catch (erro) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-neutral-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-neutral-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Overwatch Stadium</h1>
          <p className="text-neutral-400">Painel do Capitão</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">E-mail</label>
            <input type="email" required className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Senha</label>
            <input type="password" required className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-orange-500" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200">
            Acessar Sistema
          </button>
        </form>
      </div>
    </main>
  );
}