"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [partidas, setPartidas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("stadium_token");
    const cargo = localStorage.getItem("stadium_cargo");

    // Guard: sem login ou sem ser admin, volta para o início
    if (!token || cargo !== "admin") {
      router.replace("/");
      return;
    }

    buscarPartidasPendentes(token);
  }, [router]);

  const buscarPartidasPendentes = async (token: string) => {
    try {
      const resposta = await fetch("https://web-production-aeb1b.up.railway.app/api/partidas/", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (resposta.status === 401) {
        // Token expirado
        localStorage.removeItem("stadium_token");
        localStorage.removeItem("stadium_cargo");
        router.replace("/");
        return;
      }

      if (resposta.ok) {
        const dados = await resposta.json();
        const pendentes = dados.filter((p: any) => p.status === "aguardando_aprovacao_admin");
        setPartidas(pendentes);
      }
    } catch {
      console.error("Erro ao carregar painel admin");
    } finally {
      setCarregando(false);
    }
  };

  const getToken = () => localStorage.getItem("stadium_token") ?? "";

  const aprovar = async (id: number) => {
    await fetch(`https://web-production-aeb1b.up.railway.app/api/partidas/${id}/aprovar`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${getToken()}` },
    });
    buscarPartidasPendentes(getToken());
  };

  const rejeitar = async (id: number) => {
    await fetch(`https://web-production-aeb1b.up.railway.app/api/partidas/${id}/rejeitar`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${getToken()}` },
    });
    buscarPartidasPendentes(getToken());
  };

  const sair = () => {
    localStorage.removeItem("stadium_token");
    localStorage.removeItem("stadium_cargo");
    router.replace("/");
  };

  return (
    <main className="min-h-screen bg-neutral-900 p-8 text-white">
      <div className="max-w-6xl mx-auto">

        <header className="bg-purple-900 p-6 rounded-xl border border-purple-500 mb-8 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Painel do Organizador</h1>
            <p className="text-purple-300">Centro de Aprovação de Resultados — Overwatch Stadium</p>
          </div>
          <button
            onClick={sair}
            className="bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-lg border border-neutral-600 transition-colors"
          >
            Sair
          </button>
        </header>

        <div className="bg-neutral-800 p-8 rounded-xl border border-neutral-700 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">Partidas aguardando validação</h2>

          {carregando ? (
            <p className="text-neutral-400">Carregando...</p>
          ) : partidas.length === 0 ? (
            <p className="text-neutral-400">Nenhuma partida para analisar no momento.</p>
          ) : (
            partidas.map((partida) => (
              <div
                key={partida.id}
                className="bg-neutral-900 p-6 rounded-lg border border-neutral-700 flex flex-col md:flex-row gap-8 items-center mb-6"
              >
                <div className="w-full md:w-1/2">
                  <img
                    src={`https://web-production-aeb1b.up.railway.app/uploads/print_partida_${partida.id}.png?t=${Date.now()}`}
                    alt="Print enviado pelo capitão"
                    className="w-full rounded-lg border-2 border-neutral-600 shadow-lg object-contain max-h-80"
                  />
                </div>

                <div className="w-full md:w-1/2 flex flex-col gap-4">
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">ID da Partida FACEIT:</p>
                    <p className="text-xl font-bold text-white">{partida.faceit_match_id ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400 mb-1">Placar registrado:</p>
                    <p className="text-lg font-bold text-orange-400">
                      {partida.score_a ?? "?"} x {partida.score_b ?? "?"}
                    </p>
                  </div>

                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => aprovar(partida.id)}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-4 rounded-lg transition-colors"
                    >
                      ✅ APROVAR
                    </button>
                    <button
                      onClick={() => rejeitar(partida.id)}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-4 rounded-lg transition-colors"
                    >
                      ❌ REJEITAR
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