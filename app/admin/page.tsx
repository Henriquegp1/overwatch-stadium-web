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
      cor: "border-purple-500 hover:bg-purple-900/30",
      icone: "🛡️",
    },
    {
      titulo: "Inscrições",
      descricao: "Visualizar, verificar e editar equipes inscritas pelo formulário",
      rota: "/admin/inscricoes",
      cor: "border-green-500 hover:bg-green-900/30",
      icone: "📝",
    },
    {
      titulo: "Aprovação de Prints",
      descricao: "Validar resultados 3x0 enviados pelos capitães",
      rota: "/admin/partidas",
      cor: "border-orange-500 hover:bg-orange-900/30",
      icone: "📋",
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-900 p-8 text-white">
      <div className="max-w-4xl mx-auto">

        <header className="bg-purple-900 p-6 rounded-xl border border-purple-500 mb-8 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Painel do Organizador</h1>
            <p className="text-purple-300">Overwatch Stadium</p>
          </div>
          <button
            onClick={sair}
            className="bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-lg border border-neutral-600 transition-colors"
          >
            Sair
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menus.map((item) => (
            <button
              key={item.rota}
              onClick={() => router.push(item.rota)}
              className={`bg-neutral-800 border-2 ${item.cor} p-8 rounded-xl text-left transition-colors`}
            >
              <span className="text-4xl mb-4 block">{item.icone}</span>
              <h2 className="text-xl font-bold text-white mb-2">{item.titulo}</h2>
              <p className="text-neutral-400 text-sm">{item.descricao}</p>
            </button>
          ))}
        </div>

      </div>
    </main>
  );
}