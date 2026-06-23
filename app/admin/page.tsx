"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [partidas, setPartidas] = useState<any[]>([]);

  useEffect(() => {
    buscarPartidasPendentes();
  }, []);

  const buscarPartidasPendentes = async () => {
    try {
      const resposta = await fetch("http://localhost:8000/api/partidas");
      if (resposta.ok) {
        const dados = await resposta.json();
        // O Admin só quer ver o que precisa ser aprovado
        const pendentes = dados.filter((p: any) => p.status === "aguardando_aprovacao_admin");
        setPartidas(pendentes);
      }
    } catch (erro) {
      console.error("Erro ao carregar painel admin", erro);
    }
  };

  const aprovar = async (id: number) => {
    await fetch(`http://localhost:8000/api/partidas/${id}/aprovar`, { method: "POST" });
    buscarPartidasPendentes(); // Limpa a partida da tela
  };

  const rejeitar = async (id: number) => {
    await fetch(`http://localhost:8000/api/partidas/${id}/rejeitar`, { method: "POST" });
    buscarPartidasPendentes(); // Limpa a partida da tela
  };

  return (
    <main className="min-h-screen bg-neutral-900 p-8 text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho do Admin com cor diferente para não confundir com o jogador */}
        <header className="bg-purple-900 p-6 rounded-xl border border-purple-500 mb-8 shadow-lg">
          <h1 className="text-2xl font-bold text-white">Painel do Organizador</h1>
          <p className="text-purple-300">Centro de Aprovação de Resultados - Overwatch Stadium</p>
        </header>

        <div className="bg-neutral-800 p-8 rounded-xl border border-neutral-700 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">Partidas aguardando validação</h2>

          {partidas.length === 0 ? (
             <p className="text-neutral-400">Nenhuma partida para analisar no momento. Área limpa! 🎮</p>
          ) : (
            partidas.map((partida) => (
              <div key={partida.id} className="bg-neutral-900 p-6 rounded-lg border border-neutral-700 flex flex-col md:flex-row gap-8 items-center mb-6">
                
                {/* O site puxa a imagem dinamicamente usando a regra de nome que criamos no Python */}
                <div className="w-full md:w-1/2">
                  <img 
                    src={`http://localhost:8000/uploads/print_partida_${partida.id}.png?t=${Date.now()}`} 
                    alt="Prova do 3x0 enviada pelo jogador" 
                    className="w-full rounded-lg border-2 border-neutral-600 shadow-lg object-contain max-h-80"
                  />
                </div>
                
                <div className="w-full md:w-1/2 flex flex-col gap-4">
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">ID da Partida FACEIT:</p>
                    <p className="text-2xl font-bold text-white">{partida.faceit_match_id}</p>
                  </div>
                  
                  <div className="flex gap-4 mt-6">
                    <button 
                      onClick={() => aprovar(partida.id)} 
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-4 rounded-lg transition-colors shadow-lg"
                    >
                      ✅ APROVAR 3x0
                    </button>
                    <button 
                      onClick={() => rejeitar(partida.id)} 
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-4 rounded-lg transition-colors shadow-lg"
                    >
                      ❌ REJEITAR PRINT
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}