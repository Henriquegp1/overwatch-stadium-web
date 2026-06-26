"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const API = "https://web-production-aeb1b.up.railway.app";

interface Time {
  id: number | null;
  nome: string;
}

interface Partida {
  id: number;
  time_a: Time;
  time_b: Time;
  vencedor: Time | null;
  status: string;
  rodada: number;
  score_a: number | null;  
  score_b: number | null;
  streamer: string | null;          
  horario_agendado: string | null;   
}

interface Rodadas {
  [rodada: string]: Partida[];
}

function PlacarForm({
  partida,
  registrando,
  onRegistrar,
}: {
  partida: Partida;
  registrando: number | null;
  onRegistrar: (partidaId: number, vencedorId: number, scoreA: number, scoreB: number) => void;
}) {
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");

  const valido = scoreA !== "" && scoreB !== "" && Number(scoreA) >= 0 && Number(scoreB) >= 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Placar */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="text-[10px] text-fg-dim mb-1 truncate">{partida.time_a.nome}</p>
          <input
            type="number"
            min={0}
            max={9}
            value={scoreA}
            onChange={e => setScoreA(e.target.value)}
            className="w-full px-2 py-1.5 bg-surface-2 border border-line rounded-lg text-white text-center text-sm font-bold focus:outline-none focus:border-ow-orange"
            placeholder="0"
          />
        </div>
        <span className="text-fg-dim font-bold mt-4">×</span>
        <div className="flex-1">
          <p className="text-[10px] text-fg-dim mb-1 truncate">{partida.time_b.nome}</p>
          <input
            type="number"
            min={0}
            max={9}
            value={scoreB}
            onChange={e => setScoreB(e.target.value)}
            className="w-full px-2 py-1.5 bg-surface-2 border border-line rounded-lg text-white text-center text-sm font-bold focus:outline-none focus:border-ow-orange"
            placeholder="0"
          />
        </div>
      </div>

      {/* Botões de vencedor */}
      <button
        onClick={() => onRegistrar(partida.id, partida.time_a.id!, Number(scoreA), Number(scoreB))}
        disabled={registrando === partida.id || !valido}
        className="w-full py-1.5 px-3 rounded-lg bg-surface-2 hover:bg-ow-blue/20 hover:border-ow-blue border border-line text-fg text-xs font-semibold transition-colors disabled:opacity-40 truncate"
      >
        ✓ {partida.time_a.nome}
      </button>
      <button
        onClick={() => onRegistrar(partida.id, partida.time_b.id!, Number(scoreA), Number(scoreB))}
        disabled={registrando === partida.id || !valido}
        className="w-full py-1.5 px-3 rounded-lg bg-surface-2 hover:bg-ow-blue/20 hover:border-ow-blue border border-line text-fg text-xs font-semibold transition-colors disabled:opacity-40 truncate"
      >
        ✓ {partida.time_b.nome}
      </button>
    </div>
  );
}

const STREAMERS = [
  { value: "", label: "Nenhum" },
  { value: "akiralegacy", label: "AkiraLegacy" },
  { value: "foythtv", label: "FoythTV" },
  { value: "violetkill", label: "VioletKill" },
];

function InfoForm({ partida, token }: { partida: Partida; token: string }) {
  const [streamer, setStreamer] = useState(partida.streamer ?? "");
  const [horario, setHorario] = useState(
    partida.horario_agendado
      ? new Date(partida.horario_agendado).toISOString().slice(0, 16)
      : ""
  );
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    setOk(false);
    await fetch(`${API}/api/chaveamento/partidas/${partida.id}/info`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        streamer: streamer || "",
        horario_agendado: horario || "",
      }),
    });
    setSalvando(false);
    setOk(true);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line items-end">
      <div>
        <p className="text-[10px] text-fg-dim mb-1 uppercase tracking-wider">Streamer</p>
        <select
          value={streamer}
          onChange={e => setStreamer(e.target.value)}
          className="px-2 py-1.5 bg-surface-2 border border-line rounded-lg text-fg text-xs focus:outline-none focus:border-ow-orange"
        >
          {STREAMERS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div>
        <p className="text-[10px] text-fg-dim mb-1 uppercase tracking-wider">Data e hora</p>
        <input
          type="datetime-local"
          value={horario}
          onChange={e => setHorario(e.target.value)}
          className="px-2 py-1.5 bg-surface-2 border border-line rounded-lg text-fg text-xs focus:outline-none focus:border-ow-orange"
        />
      </div>
      <button
        onClick={salvar}
        disabled={salvando}
        className="px-4 py-1.5 bg-ow-orange/20 hover:bg-ow-orange/30 border border-ow-orange/40 text-ow-orange text-xs font-bold rounded-lg transition-colors disabled:opacity-40"
      >
        {salvando ? "..." : ok ? "✓ Salvo" : "Salvar"}
      </button>
    </div>
  );
}

export default function AdminChaveamentoPage() {
  const router = useRouter();
  const [rodadas, setRodadas] = useState<Rodadas>({});
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [registrando, setRegistrando] = useState<number | null>(null);
  const [editandoPartida, setEditandoPartida] = useState<number | null>(null);
  const [modo, setModo] = useState<"eliminatorio" | "grupos">("eliminatorio");
  

  const getToken = () => localStorage.getItem("stadium_token") ?? "";

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const res = await fetch(`${API}/api/chaveamento/rodadas`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) { router.replace("/"); return; }
      const dados = await res.json();
      setRodadas(dados);
    } catch {
      setErro("Erro ao carregar chaveamento.");
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useEffect(() => {
    const cargo = localStorage.getItem("stadium_cargo");
    if (!getToken() || cargo !== "admin") {
      router.replace("/");
      return;
    }
    buscar();
  }, [router, buscar]);

  const gerarChaveamento = async (forcar = false) => {
    setGerando(true);
    setErro("");
    setSucesso("");
    try {
      const url = `${API}/api/chaveamento/gerar${forcar ? "?forcar=true" : ""}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ modo }),
      });

      if (res.status === 409) {
        const confirmar = window.confirm(
          "Já existe um chaveamento ativo. Deseja recriar a rodada atual?"
        );
        if (confirmar) await gerarChaveamento(true);
        return;
      }

      const dados = await res.json();
      if (!res.ok) throw new Error(dados.detail || "Erro ao gerar chaveamento.");
      setSucesso(dados.mensagem);
      buscar();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar chaveamento.");
    } finally {
      setGerando(false);
    }
  };

  const registrarVencedor = async (partidaId: number, vencedorId: number, scoreA: number, scoreB: number) => {
    setRegistrando(partidaId);
    setErro("");
    setSucesso("");
    try {
      const res = await fetch(`${API}/api/chaveamento/partidas/${partidaId}/vencedor`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ vencedor_id: vencedorId, score_a: scoreA, score_b: scoreB }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.detail || "Erro ao registrar vencedor.");
      setSucesso(dados.mensagem);
      buscar();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao registrar vencedor.");
    } finally {
      setRegistrando(null);
    }
  };

  const rodasOrdenadas = Object.keys(rodadas).sort((a, b) => Number(a) - Number(b));
  const totalRodadas = rodasOrdenadas.length;
  const ultimaRodada = totalRodadas > 0 ? rodadas[rodasOrdenadas[totalRodadas - 1]] : [];
  const rodadaConcluida = ultimaRodada.length > 0 && ultimaRodada.every(p => p.status === "concluida");
  const temChaveamento = totalRodadas > 0;

  return (
    <main className="min-h-screen p-6 md:p-10 text-fg">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="relative overflow-hidden rounded-2xl border border-line-strong mb-8">
          <div className="absolute inset-0 hero-grad" />
          <div className="relative p-6 md:p-8 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Ícone de Chaveamento (Bracket e Troféu) */}
              <svg 
                viewBox="0 0 48 48" 
                fill="none" 
                className="w-14 h-14 shrink-0 drop-shadow-[0_0_15px_rgba(249,158,26,0.4)]"
              >
                {/* Linhas conectando os times */}
                <path d="M14 14H22V34H14" stroke="#E6EDF7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 24H30" stroke="#F99E1A" strokeWidth="4" strokeLinecap="round"/>
                
                {/* Caixas representando as equipes se enfrentando */}
                <rect x="6" y="10" width="8" height="8" rx="2" fill="#E6EDF7"/>
                <rect x="6" y="30" width="8" height="8" rx="2" fill="#E6EDF7"/>
                
                {/* Troféu do Vencedor */}
                <path d="M34 16H42C43.1046 16 44 16.8954 44 18V21C44 23.7614 41.7614 26 39 26H37C34.2386 26 32 23.7614 32 21V18C32 16.8954 32.8954 16 34 16Z" fill="#F99E1A"/>
                <rect x="36" y="26" width="4" height="6" fill="#F99E1A"/>
                <rect x="33" y="32" width="10" height="2" rx="1" fill="#F99E1A"/>
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
              onClick={() => router.push("/admin")}
              className="text-sm font-semibold border border-line-strong hover:border-ow-blue/60 hover:text-ow-blue text-fg-muted px-4 py-2 rounded-lg transition-colors"
            >
              ← Voltar
            </button>
          </div>
        </header>

        {erro && (
          <div className="bg-danger/10 border border-danger/40 text-danger p-4 rounded-xl mb-6 text-sm">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="bg-success/10 border border-success/40 text-success p-4 rounded-xl mb-6 text-sm">
            {sucesso}
          </div>
        )}

        {/* Ações */}
        <div className="surface-card p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-display text-xl font-bold uppercase tracking-wider text-fg">
              Chaveamento
            </h2>
            <p className="text-fg-muted text-sm mt-1">
              {!temChaveamento
                ? "Nenhuma rodada gerada ainda."
                : rodadaConcluida
                ? `Rodada ${totalRodadas} concluída — pronto para gerar a próxima.`
                : `Rodada ${totalRodadas} em andamento.`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModo("eliminatorio")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                modo === "eliminatorio"
                  ? "bg-danger/20 border border-danger/50 text-danger"
                  : "bg-surface-2 border border-line text-fg-muted hover:border-danger/30"
              }`}
            >
              Mata-mata
            </button>
            <button
              onClick={() => setModo("grupos")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                modo === "grupos"
                  ? "bg-ow-blue/20 border border-ow-blue/50 text-ow-blue"
                  : "bg-surface-2 border border-line text-fg-muted hover:border-ow-blue/30"
              }`}
            >
              Fase de Grupos
            </button>
          </div>
          <button
            onClick={() => gerarChaveamento(false)}
            disabled={gerando || (temChaveamento && !rodadaConcluida)}
            className="bg-ow-orange hover:bg-ow-orange-glow disabled:opacity-40 disabled:cursor-not-allowed text-background font-bold py-3 px-6 rounded-xl transition-colors text-sm uppercase tracking-wider text-display"
          >
            {gerando
              ? "Gerando..."
              : !temChaveamento
              ? "Gerar Chaveamento"
              : `Gerar Rodada ${totalRodadas + 1}`}
          </button>
          <button
            onClick={async () => {
                const confirmar = window.confirm(
                "⚠️ Isso vai apagar TODAS as partidas e resetar todas as equipes para 'inscrita'. Tem certeza?"
                );
                if (!confirmar) return;
                const segunda = window.confirm(
                "Última confirmação: isso não pode ser desfeito. Continuar?"
                );
                if (!segunda) return;
                try {
                const res = await fetch(`${API}/api/chaveamento/reset`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                const dados = await res.json();
                if (!res.ok) throw new Error(dados.detail);
                setSucesso(dados.mensagem);
                buscar();
                } catch (e: unknown) {
                setErro(e instanceof Error ? e.message : "Erro ao resetar.");
                }
            }}
            className="border border-danger/40 hover:bg-danger/10 text-danger font-bold py-3 px-6 rounded-xl transition-colors text-sm uppercase tracking-wider text-display"
            >
            Resetar tudo
            </button>
        </div>

        {/* Rodadas */}
        {carregando ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        ) : rodasOrdenadas.length === 0 ? (
          <div className="surface-card p-10 text-center text-fg-muted text-sm">
            Nenhuma rodada gerada ainda. Clique em "Gerar Chaveamento" para começar.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {rodasOrdenadas.map(r => (
              <div key={r}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-display text-lg font-bold uppercase tracking-widest text-ow-orange">
                    Rodada {r}
                  </span>
                  <div className="flex-1 h-px bg-line-strong" />
                  <span className="text-xs text-fg-dim uppercase tracking-wider">
                    {rodadas[r].filter(p => p.status === "concluida").length}/{rodadas[r].length} concluídas
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {rodadas[r].map(partida => (
                    <div
                      key={partida.id}
                      className={`surface-card p-5 border transition-colors ${
                        partida.status === "concluida"
                          ? "border-success/20"
                          : "border-line"
                      }`}
                    >
                      <div className="flex items-center gap-4">

                        {/* Time A */}
                        <div className={`flex-1 text-right ${
                          partida.vencedor?.id === partida.time_a.id
                            ? "text-success font-bold"
                            : partida.status === "concluida"
                            ? "text-fg-dim"
                            : "text-fg"
                        }`}>
                          <span className="text-display text-lg font-bold uppercase tracking-wide">
                            {partida.time_a.nome}
                          </span>
                        </div>

                        {/* VS */}
                        <div className="text-center w-16 shrink-0">
                          {partida.status === "concluida" ? (
                            <span className="text-xs text-fg-dim uppercase tracking-widest">fim</span>
                          ) : partida.time_b.id === null ? (
                            <span className="text-xs text-ow-orange uppercase tracking-widest font-bold">BYE</span>
                          ) : (
                            <span className="text-display text-lg font-bold text-fg-dim">VS</span>
                          )}
                        </div>

                        {/* Time B */}
                        <div className={`flex-1 ${
                          partida.vencedor?.id === partida.time_b.id
                            ? "text-success font-bold"
                            : partida.status === "concluida"
                            ? "text-fg-dim"
                            : "text-fg"
                        }`}>
                          <span className="text-display text-lg font-bold uppercase tracking-wide">
                            {partida.time_b.nome}
                          </span>
                        </div>

                        {/* Ações */}
                        <div className="shrink-0 w-56 flex flex-col gap-2">
                          {partida.status === "concluida" ? (
                            <div className="text-center">
                              <span className="text-display text-2xl font-bold text-ow-orange">
                                {partida.score_a} × {partida.score_b}
                              </span>
                              <p className="text-xs text-success font-semibold mt-1 uppercase tracking-wider">
                                ✓ {partida.vencedor?.nome}
                              </p>
                              <div className="flex justify-between text-[10px] text-fg-dim mt-2 px-1">
                                <span>saldo: {(partida.score_a ?? 0) - (partida.score_b ?? 0) > 0 ? "+" : ""}{(partida.score_a ?? 0) - (partida.score_b ?? 0)}</span>
                                <span>saldo: {(partida.score_b ?? 0) - (partida.score_a ?? 0) > 0 ? "+" : ""}{(partida.score_b ?? 0) - (partida.score_a ?? 0)}</span>
                              </div>
                              <button
                                onClick={() => setEditandoPartida(editandoPartida === partida.id ? null : partida.id)}
                                className="mt-2 text-[10px] text-fg-dim hover:text-ow-orange transition-colors uppercase tracking-wider"
                              >
                                {editandoPartida === partida.id ? "Cancelar" : "Editar"}
                              </button>
                              {editandoPartida === partida.id && (
                                <div className="mt-2">
                                  <PlacarForm
                                    partida={partida}
                                    registrando={registrando}
                                    onRegistrar={(id, vid, sa, sb) => {
                                      registrarVencedor(id, vid, sa, sb);
                                      setEditandoPartida(null);
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ) : partida.time_b.id === null ? (
                            <span className="text-xs text-ow-orange text-center font-semibold uppercase tracking-wider">
                              Avança automaticamente
                            </span>
                          ) : (
                            <PlacarForm
                              partida={partida}
                              registrando={registrando}
                              onRegistrar={registrarVencedor}
                            />
                          )}
                        </div>
                        <InfoForm partida={partida} token={getToken()} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}