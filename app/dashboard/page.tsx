"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [partidas, setPartidas] = useState<any[]>([]);
  const [mensagem, setMensagem] = useState("1. Iniciando painel...");

  useEffect(() => {
    const token = localStorage.getItem("stadium_token");
    if (!token) {
      router.replace("/"); // Teletransporte de volta se não tiver chave
    } else {
      setMensagem("2. Sistema Operacional. Partidas sincronizadas.");
      buscarPartidas(token);
    }
  }, [router]);

  const buscarPartidas = async (token: string) => {
    try {
      const resposta = await fetch("http://localhost:8000/api/partidas", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (resposta.ok) {
        const dados = await resposta.json();
        setPartidas(dados);
      }
    } catch (erro) {
      setMensagem("Erro: Não consegui conectar no Python.");
    }
  };

  const sair = () => {
    localStorage.removeItem("stadium_token");
    router.replace("/"); // Apaga a chave e volta suavemente
  };

  const handleEscolherPrint = async (event: React.ChangeEvent<HTMLInputElement>, partidaId: number) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    setMensagem(`A enviar a imagem "${arquivo.name}" para o Python... aguarde.`);

    // O FormData é o "envelope" próprio para enviar ficheiros na web
    const formData = new FormData();
    formData.append("arquivo", arquivo);

    try {
      const token = localStorage.getItem("stadium_token");
      
      const resposta = await fetch(`http://localhost:8000/api/partidas/${partidaId}/upload-print`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}` 
          // Importante: Nunca coloque "Content-Type" quando usar FormData, o navegador faz isso sozinho!
        },
        body: formData
      });
      
      if (resposta.ok) {
        const dados = await resposta.json();
        setMensagem(`SUCESSO: ${dados.mensagem}`);
        // Pede ao Python a lista atualizada para a tela mudar de cor
        buscarPartidas(token as string); 
      } else {
        setMensagem("Erro: O Python recusou o envio da imagem.");
      }
    } catch (erro) {
      setMensagem("Erro fatal: A ligação com o Python caiu durante o envio.");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-900 p-8 text-white">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-center bg-neutral-800 p-6 rounded-xl border border-neutral-700 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Quartel General</h1>
            <p className="text-orange-500">Overwatch Stadium</p>
          </div>
          <button onClick={sair} className="bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-lg border border-neutral-600 transition-colors">
            Sair da conta
          </button>
        </header>

        <div className="bg-blue-900 border border-blue-500 p-4 rounded-lg mb-8 font-mono text-sm text-blue-100 shadow-lg">
          Status do Sistema: <strong className="text-white">{mensagem}</strong>
        </div>

        <div className="bg-neutral-800 p-8 rounded-xl border border-neutral-700 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Minhas Partidas</h2>
          
          {partidas.length === 0 ? (
             <p className="text-neutral-400">Nenhuma partida na lista.</p>
          ) : (
            partidas.map((partida) => (
              <div key={partida.id} className="bg-neutral-900 p-6 rounded-lg border border-neutral-700 flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-neutral-400">
                    Status:{" "}
                    <span
                      className={
                        partida.status === "aguardando_validacao_stadium"
                          ? "text-orange-400 font-bold"
                          : partida.status === "aguardando_aprovacao_admin"
                          ? "text-yellow-500 font-bold animate-pulse" // Pisca levemente em análise
                          : "text-green-500 font-bold"
                      }
                    >
                      {partida.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </p>
                  <p className="text-lg font-bold text-white mt-1">ID FACEIT: {partida.faceit_match_id}</p>
                </div>
                
                {/* O Botão SÓ aparece se estiver no primeiro estágio aguardando o print */}
                {partida.status === "aguardando_validacao_stadium" && (
                  <div>
                    <label className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer inline-block">
                      Enviar Print do 3x0
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg" 
                        className="hidden" 
                        onChange={(e) => handleEscolherPrint(e, partida.id)}
                      />
                    </label>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}