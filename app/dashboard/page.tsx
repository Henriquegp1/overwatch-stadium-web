"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [partidas, setPartidas] = useState<any[]>([]);
  const [mensagem, setMensagem] = useState("Carregando partidas...");

  useEffect(() => {
    const token = localStorage.getItem("stadium_token");
    const cargo = localStorage.getItem("stadium_cargo");

    // Guard: sem login volta para o início; admin não deve estar aqui
    if (!token) {
      router.replace("/");
      return;
    }

    if (cargo === "admin") {
      router.replace("/admin");
      return;
    }

    buscarPartidas(token);
  }, [router]);

  const buscarPartidas = async (token: string) => {
    try {
      const resposta = await fetch("https://web-production-aeb1b.up.railway.app/api/partidas/", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (resposta.status === 401) {
        localStorage.removeItem("stadium_token");
        localStorage.removeItem("stadium_cargo");
        router.replace("/");
        return;
      }

      if (resposta.ok) {
        const dados = await resposta.json();
        setPartidas(dados);
        setMensagem("Partidas sincronizadas.");
      }
    } catch {
      setMensagem("Erro: não foi possível conectar ao servidor.");
    }
  };

  const handleEnviarPrint = async (event: React.ChangeEvent<HTMLInputElement>, partidaId: number) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    setMensagem(`Enviando "${arquivo.name}"...`);

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    try {
      const token = localStorage.getItem("stadium_token") ?? "";

      const resposta = await fetch(`https://web-production-aeb1b.up.railway.app/api/partidas/${partidaId}/upload-print`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
        // Não coloque Content-Type aqui — o navegador define automaticamente com o boundary do FormData
      });

      if (resposta.ok) {
        const dados = await resposta.json();
        setMensagem(dados.mensagem);
        buscarPartidas(token);
      } else {
        const erro = await resposta.json();
        setMensagem(`Erro: ${erro.detail}`);
      }
    } catch {
      setMensagem("Erro ao enviar o print.");
    }
  };

  const sair = () => {
    localStorage.removeItem("stadium_token");
    localStorage.removeItem("stadium_cargo");
    router.replace("/");
  };

  const corStatus = (status: string) => {
    if (status === "aguardando_validacao_stadium") return "text-orange-400 font-bold";
    if (status === "aguardando_aprovacao_admin") return "text-yellow-400 font-bold animate-pulse";
    if (status === "validacao_concluida" || status === "concluida") return "text-green-400 font-bold";
    return "text-neutral-400";
  };

  return (
    <main className="min-h-screen bg-neutral-900 p-8 text-white">
      <div className="max-w-6xl mx-auto">

        <header className="flex justify-between items-center bg-neutral-800 p-6 rounded-xl border border-neutral-700 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Quartel General</h1>
            <p className="text-orange-500">Overwatch Stadium</p>
          </div>
          <button
            onClick={sair}
            className="bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-lg border border-neutral-600 transition-colors"
          >
            Sair
          </button>
        </header>

        <div className="bg-blue-900 border border-blue-500 p-4 rounded-lg mb-8 font-mono text-sm text-blue-100">
          Status: <strong className="text-white">{mensagem}</strong>
        </div>

        <div className="bg-neutral-800 p-8 rounded-xl border border-neutral-700 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Partidas</h2>

          {partidas.length === 0 ? (
            <p className="text-neutral-400">Nenhuma partida encontrada.</p>
          ) : (
            partidas.map((partida) => (
              <div
                key={partida.id}
                className="bg-neutral-900 p-6 rounded-lg border border-neutral-700 flex justify-between items-center mb-4"
              >
                <div>
                  <p className="text-sm text-neutral-400 mb-1">
                    Status:{" "}
                    <span className={corStatus(partida.status)}>
                      {partida.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </p>
                  <p className="text-lg font-bold text-white">
                    ID FACEIT: {partida.faceit_match_id ?? "Aguardando vinculação"}
                  </p>
                  {partida.score_a !== null && (
                    <p className="text-orange-400 font-bold mt-1">
                      Placar: {partida.score_a} x {partida.score_b}
                    </p>
                  )}
                </div>

                {partida.status === "aguardando_validacao_stadium" && (
                  <label className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer inline-block">
                    Enviar Print do 3x0
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      className="hidden"
                      onChange={(e) => handleEnviarPrint(e, partida.id)}
                    />
                  </label>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}