"use client";

import { useEffect, useState } from "react";

const API = "https://web-production-aeb1b.up.railway.app";

interface Jogador {
  battletag: string;
  role: string;
  rank: string;
}

interface Equipe {
  id: number;
  nome: string;
  nome_capitao: string;
  grupo: string | null;
  fase_atual: string;
  pontuacao_rank: number;
  vitorias: number;
  derrotas: number;
  saldo_mapas: number;
  tem_jogador_desclassificado: boolean;
  horarios: string[];
  dias: string[];
  jogadores: Jogador[];
}

interface Partida {
  id: number;
  fase: string;
  grupo: string | null;
  status: string;
  score_a: number | null;
  score_b: number | null;
  time_a: string;
  time_b: string;
  vencedor: string | null;
}

type Grupos = Record<string, { nome: string; vitorias: number; derrotas: number; saldo_mapas: number; mapas_pro: number }[]>;

type Aba = "equipes" | "partidas" | "grupos";

const ROLE_ICON: Record<string, string> = {
  tank: "🛡️",
  dps: "⚔️",
  support: "💚",
};

export default function PublicoPage() {
  const [aba, setAba] = useState<Aba>("equipes");
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [grupos, setGrupos] = useState<Grupos>({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/publico/equipes`).then((r) => r.json()),
      fetch(`${API}/api/publico/partidas`).then((r) => r.json()),
      fetch(`${API}/api/publico/grupos`).then((r) => r.json()),
    ]).then(([e, p, g]) => {
      setEquipes(e);
      setPartidas(p);
      setGrupos(g);
      setCarregando(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700 px-8 py-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Overwatch Stadium</h1>
            <p className="text-neutral-400 text-sm">Temporada 1 — Acompanhamento ao vivo</p>
          </div>
          <a
            href="/"
            className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
          >
            Área restrita →
          </a>
        </div>
      </header>

      {/* Abas */}
      <div className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-6xl mx-auto flex">
          {(["equipes", "partidas", "grupos"] as Aba[]).map((a) => (
            <button
              key={a}
              onClick={() => setAba(a)}
              className={`px-6 py-4 text-sm font-semibold capitalize transition-colors border-b-2 ${
                aba === a
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              {a === "equipes" ? "🛡️ Equipes" : a === "partidas" ? "⚔️ Partidas" : "📊 Grupos"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {carregando ? (
          <p className="text-neutral-400">Carregando...</p>
        ) : (
          <>
            {/* ABA EQUIPES */}
            {aba === "equipes" && (
              <div className="flex flex-col gap-4">
                {equipes.length === 0 ? (
                  <p className="text-neutral-400">Nenhuma equipe inscrita ainda.</p>
                ) : (
                  equipes.map((equipe) => (
                    <div
                      key={equipe.id}
                      className={`bg-neutral-800 rounded-xl border p-6 ${
                        equipe.tem_jogador_desclassificado
                          ? "border-red-500 bg-red-950/20"
                          : "border-neutral-700"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-white">{equipe.nome}</h2>
                            {equipe.tem_jogador_desclassificado && (
                              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                ⚠️ DESCLASSIFICADO
                              </span>
                            )}
                            {equipe.grupo && (
                              <span className="bg-purple-900 text-purple-300 text-xs font-bold px-2 py-1 rounded">
                                Grupo {equipe.grupo}
                              </span>
                            )}
                          </div>
                          <p className="text-neutral-400 text-sm mt-1">
                            Capitão: {equipe.nome_capitao}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-orange-400 font-bold text-xl">{equipe.pontuacao_rank} pts</p>
                          <p className="text-neutral-400 text-sm">{equipe.vitorias}V / {equipe.derrotas}D</p>
                        </div>
                      </div>

                      {/* Jogadores */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                        {equipe.jogadores.map((j, i) => (
                          <div key={i} className="bg-neutral-900 rounded-lg p-2 text-center">
                            <p className="text-lg">{ROLE_ICON[j.role] ?? "?"}</p>
                            <p className="text-xs text-white font-semibold truncate">{j.battletag}</p>
                            <p className="text-xs text-neutral-400">{j.rank}</p>
                          </div>
                        ))}
                      </div>

                      {/* Horários */}
                      {(equipe.horarios?.length > 0 || equipe.dias?.length > 0) && (
                        <div className="flex gap-2 flex-wrap">
                          {equipe.horarios?.map((h) => (
                            <span key={h} className="bg-neutral-700 text-neutral-300 text-xs px-2 py-1 rounded">
                              {h}
                            </span>
                          ))}
                          {equipe.dias?.map((d) => (
                            <span key={d} className="bg-neutral-700 text-neutral-300 text-xs px-2 py-1 rounded">
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ABA PARTIDAS */}
            {aba === "partidas" && (
              <div className="flex flex-col gap-3">
                {partidas.length === 0 ? (
                  <p className="text-neutral-400">Nenhuma partida registrada ainda.</p>
                ) : (
                  partidas.map((p) => (
                    <div key={p.id} className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-neutral-500 uppercase">{p.fase}{p.grupo ? ` · Grupo ${p.grupo}` : ""}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          p.status === "concluida" ? "bg-green-900 text-green-300" :
                          p.status === "em_andamento" ? "bg-yellow-900 text-yellow-300 animate-pulse" :
                          "bg-neutral-700 text-neutral-400"
                        }`}>
                          {p.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-6 mt-4">
                        <p className={`text-lg font-bold ${p.vencedor === p.time_a ? "text-green-400" : "text-white"}`}>
                          {p.time_a}
                        </p>
                        <p className="text-2xl font-bold text-orange-400">
                          {p.score_a ?? "—"} x {p.score_b ?? "—"}
                        </p>
                        <p className={`text-lg font-bold ${p.vencedor === p.time_b ? "text-green-400" : "text-white"}`}>
                          {p.time_b}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ABA GRUPOS */}
            {aba === "grupos" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(grupos).length === 0 ? (
                  <p className="text-neutral-400">Fase de grupos ainda não iniciada.</p>
                ) : (
                  Object.entries(grupos).map(([grupo, equipes]) => (
                    <div key={grupo} className="bg-neutral-800 border border-neutral-700 rounded-xl p-5">
                      <h2 className="text-lg font-bold text-white mb-4">Grupo {grupo}</h2>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-neutral-400 border-b border-neutral-700">
                            <th className="text-left py-2">Equipe</th>
                            <th className="text-center py-2">V</th>
                            <th className="text-center py-2">D</th>
                            <th className="text-center py-2">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {equipes.map((e, i) => (
                            <tr key={i} className="border-b border-neutral-700/50">
                              <td className="py-2 font-semibold text-white">{e.nome}</td>
                              <td className="py-2 text-center text-green-400">{e.vitorias}</td>
                              <td className="py-2 text-center text-red-400">{e.derrotas}</td>
                              <td className="py-2 text-center text-neutral-300">{e.saldo_mapas}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}