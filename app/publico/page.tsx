"use client";

import { useEffect, useMemo, useState } from "react";

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
  streamer: string | null;
  horario_agendado: string | null;
}

type Grupos = Record<string, { nome: string; vitorias: number; derrotas: number; saldo_mapas: number; mapas_pro: number }[]>;

type Aba = "inicio" | "equipes" | "partidas" | "grupos";

const STREAMERS = [
  { value: "akiralegacy", label: "AkiraLegacy" },
  { value: "foythtv", label: "FoythTV" },
  { value: "violetkill", label: "VioletKill" },
];

const ROLE_COLOR: Record<string, string> = {
  tank: "bg-role-tank/15 text-role-tank border-role-tank/30",
  dps: "bg-role-dps/15 text-role-dps border-role-dps/30",
  damage: "bg-role-dps/15 text-role-dps border-role-dps/30",
  support: "bg-role-support/15 text-role-support border-role-support/30",
  flex: "bg-fg-muted/15 text-fg-muted border-fg-muted/30",
};

const ROLE_LABEL: Record<string, string> = {
  tank: "TANK",
  dps: "DPS",
  damage: "DPS",
  support: "SUP",
  flex: "FLEX",
};

const ROLE_ICON: Record<string, string> = {
  tank: "https://static.wikia.nocookie.net/overwatch_gamepedia/images/c/c8/Role_Tank_Circle.svg/revision/latest/scale-to-width-down/120?cb=20250727105320",
  dps: "https://static.wikia.nocookie.net/overwatch_gamepedia/images/8/80/Role_Damage_Circle.svg/revision/latest/scale-to-width-down/120?cb=20250727105011",
  damage: "https://static.wikia.nocookie.net/overwatch_gamepedia/images/8/80/Role_Damage_Circle.svg/revision/latest/scale-to-width-down/120?cb=20250727105011",
  support: "https://static.wikia.nocookie.net/overwatch_gamepedia/images/9/93/Role_Support_Circle.svg/revision/latest/scale-to-width-down/120?cb=20250727105200",
};

const LABEL_HORARIO: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };
const LABEL_DIA: Record<string, string> = {
  segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui",
  sexta: "Sex", sabado: "Sáb", domingo: "Dom",
};

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "OS";
}

function Brasao({ nome, size = 48 }: { nome: string; size?: number }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center font-bold text-display text-background shrink-0"
      style={{
        width: size,
        height: size,
        background: "var(--grad-orange)",
        boxShadow: "0 6px 20px -8px rgba(249,158,26,0.5)",
        fontSize: size * 0.42,
      }}
    >
      {iniciais(nome)}
    </div>
  );
}

export default function PublicoPage() {
  const [aba, setAba] = useState<Aba>("inicio");
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [grupos, setGrupos] = useState<Grupos>({});
  const [carregando, setCarregando] = useState(true);
  const [streamAtivo, setStreamAtivo] = useState("akiralegacy");

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

  const haoVivo = useMemo(() => partidas.some((p) => p.status === "em_andamento"), [partidas]);

  const abas: { id: Aba; label: string }[] = [
    { id: "inicio", label: "Início" },
    { id: "equipes", label: "Equipes" },
    { id: "partidas", label: "Partidas" },
    { id: "grupos", label: "Classificação" },
  ];

  return (
    <main className="min-h-screen text-fg">
      {/* Hero / Header */}
      <header className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 hero-grad pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 md:px-8 py-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
            
            {/* Logo Oficial Overwatch (Substituindo o Brasao antigo) */}
            <svg 
              viewBox="0 0 48 48" 
              fill="none" 
              className="w-16 h-16 shrink-0 drop-shadow-[0_0_15px_rgba(249,158,26,0.4)]"
            >
              <path fill="#F99E1A" d="M13.9 13.901a14.284 14.284 0 0 1 20.2 0l4.043-4.042a20 20 0 0 0-28.286 0z"></path>
              <path fill="#E6EDF7" d="m39.312 11.135-4.063 4.062a14.29 14.29 0 0 1 .995 16.159L28.891 24l-4.006-9.413h-.02V27.31l7.938 7.938a14.29 14.29 0 0 1-17.606 0l7.939-7.938V14.636l-4.027 9.365-7.355 7.355a14.29 14.29 0 0 1 .997-16.159l-4.063-4.062a20.001 20.001 0 1 0 30.624 0"></path>
            </svg>

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-ow-orange/90 font-semibold">
                Temporada 1 · Ao vivo
              </p>
              <h1 className="text-display text-4xl md:text-5xl font-bold uppercase leading-none mt-1">
                Overwatch <span className="text-ow-orange">Stadium</span>
              </h1>
              <p className="text-fg-muted text-sm mt-2">
                Acompanhamento oficial de equipes, partidas e classificação.
              </p>
            </div>
          </div>
          </div>

          <div className="flex items-center gap-3">
            {haoVivo && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger/15 border border-danger/30 text-danger text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-danger live-dot" />
                Partida ao vivo
              </span>
            )}
            <a
              href="/?login=true"
              className="text-sm font-semibold text-ow-blue hover:text-ow-blue-glow transition-colors border border-ow-blue/30 hover:border-ow-blue-glow/60 px-4 py-2 rounded-lg"
            >
              Área restrita →
            </a>
          </div>
        </div>
      </header>

      {/* Abas */}
      <nav className="border-b border-line bg-surface/40 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 md:px-8 flex gap-1">
          {abas.map((a) => {
            const ativo = aba === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className={`relative px-5 py-4 text-sm font-semibold uppercase tracking-wider transition-colors ${
                  ativo ? "text-fg" : "text-fg-muted hover:text-fg"
                }`}
              >
                {a.label}
                <span
                  className={`absolute left-3 right-3 -bottom-px h-[3px] rounded-t-full transition-all ${
                    ativo ? "bg-ow-orange shadow-[0_0_12px_var(--ow-orange-glow)]" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-8">
        {carregando ? (
          <div className="grid gap-4">
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
          </div>
        ) : (
          <>
            {/* INÍCIO */}
            {aba === "inicio" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Seção Sobre o Torneio & Inscrição (AGORA NO TOPO) */}
                <section className="surface-card rounded-2xl p-8 md:p-12 text-center relative overflow-hidden border border-line-strong">
                  <div className="absolute inset-0 hero-grad opacity-30 pointer-events-none" />
                  
                  <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                    <div className="w-16 h-16 mx-auto bg-ow-orange/10 rounded-full flex items-center justify-center mb-2">
                      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                        <path fill="#F99E1A" d="M13.9 13.901a14.284 14.284 0 0 1 20.2 0l4.043-4.042a20 20 0 0 0-28.286 0z"></path>
                        <path fill="#E6EDF7" d="m39.312 11.135-4.063 4.062a14.29 14.29 0 0 1 .995 16.159L28.891 24l-4.006-9.413h-.02V27.31l7.938 7.938a14.29 14.29 0 0 1-17.606 0l7.939-7.938V14.636l-4.027 9.365-7.355 7.355a14.29 14.29 0 0 1 .997-16.159l-4.063-4.062a20.001 20.001 0 1 0 30.624 0"></path>
                      </svg>
                    </div>

                    <h2 className="text-display text-3xl md:text-4xl font-bold uppercase">
                      Bem-vindo ao Overwatch <span className="text-ow-orange">Stadium</span>
                    </h2>
                    
                    <p className="text-fg-muted md:text-lg leading-relaxed">
                      O Overwatch Stadium é o campeonato perfeito para você testar suas habilidades e subir de nível no cenário competitivo. Focado em promover o equilíbrio e a diversão, o torneio tem um limite máximo de rank estabelecido em <strong className="text-ow-orange font-bold px-1">Mestre 1</strong>.
                    </p>
                    
                    <p className="text-fg md:text-xl font-display font-semibold uppercase tracking-wider pt-2">
                      Reúna seus amigos, treine suas composições e venha disputar a glória!
                    </p>

                    <div className="pt-6">
                      <a
                        href="https://docs.google.com/forms/d/e/1FAIpQLSfWb3zc0hUqFKfRqheGgRT1waY3QP1aako2LHAQcrlbUTNTVg/viewform?usp=header"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-ow-orange text-background font-bold uppercase tracking-wider py-4 px-8 rounded-xl hover:bg-ow-orange-glow hover:-translate-y-1 hover:shadow-[0_15px_40px_-15px_rgba(249,158,26,0.6)] transition-all duration-300"
                      >
                        Inscrever Minha Equipe →
                      </a>
                    </div>
                  </div>
                </section>

                {/* Seção de Streamers (AGORA EMBAIXO) */}
                <section>
                  <h2 className="text-display text-2xl font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className="text-ow-orange">✦</span> Transmissões Oficiais
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5">
                    {[
                      { canal: "akiralegacy", nome: "AkiraLegacy" },
                      { canal: "foythtv", nome: "FoythTV" },
                      { canal: "violetkill", nome: "VioletKill" }
                    ].map((streamer) => (
                      <div key={streamer.canal} className="flex flex-col gap-3">
                        {/* Nome do Streamer e Indicador de Live */}
                        <div className="flex items-center gap-2 px-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-danger live-dot" />
                          <h3 className="text-display text-lg font-bold uppercase tracking-wider text-fg">
                            {streamer.nome}
                          </h3>
                        </div>

                        {/* Player de Vídeo */}
                        <div className="aspect-video bg-surface-2 rounded-xl overflow-hidden border border-line-strong shadow-lg hover:border-ow-orange/50 transition-colors">
                          <iframe
                            src={`https://player.twitch.tv/?channel=${streamer.canal}&parent=localhost&parent=web-production-aeb1b.up.railway.app&parent=overwatch-stadium-web.vercel.app`}
                            height="100%"
                            width="100%"
                            allowFullScreen
                            className="border-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            )}
            
            {/* EQUIPES */}
            {aba === "equipes" && (
              <div className="grid gap-4">
                {equipes.length === 0 ? (
                  <p className="text-fg-muted">Nenhuma equipe inscrita ainda.</p>
                ) : (
                  equipes.map((equipe) => (
                    <article
                      key={equipe.id}
                      className={`surface-card p-5 md:p-6 relative overflow-hidden ${
                        equipe.tem_jogador_desclassificado ? "ring-1 ring-danger/40" : ""
                      }`}
                    >
                      {/* Faixa lateral */}
                      <span
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{
                          background: equipe.tem_jogador_desclassificado
                            ? "var(--danger)"
                            : equipe.grupo
                            ? "var(--grad-blue)"
                            : "var(--grad-orange)",
                        }}
                      />

                      <div className="flex flex-wrap justify-between items-start gap-4 mb-5 pl-2">
                        <div className="flex items-center gap-4">
                          <Brasao nome={equipe.nome} />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-display text-xl font-bold uppercase">{equipe.nome}</h2>
                              {equipe.grupo && (
                                <span className="bg-ow-blue/15 text-ow-blue border border-ow-blue/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                  Grupo {equipe.grupo}
                                </span>
                              )}
                              {equipe.tem_jogador_desclassificado && (
                                <span className="bg-danger/15 text-danger border border-danger/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                  ⚠ Desclassificado
                                </span>
                              )}
                              {equipe.fase_atual === "eliminado" && (
                                <span className="bg-danger/15 text-danger border border-danger/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                  ✕ Eliminado
                                </span>
                              )}
                            </div>
                            <p className="text-fg-muted text-sm mt-0.5">
                              Capitão · <span className="text-fg">{equipe.nome_capitao}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-display text-3xl font-bold text-ow-orange leading-none">
                            {equipe.pontuacao_rank}
                          </p>
                          <p className="text-fg-dim text-[10px] uppercase tracking-widest mt-1">pontos</p>
                          <p className="text-xs mt-2">
                            <span className="text-success font-semibold">{equipe.vitorias}V</span>
                            <span className="text-fg-dim"> · </span>
                            <span className="text-danger font-semibold">{equipe.derrotas}D</span>
                          </p>
                        </div>
                      </div>

                      {/* Jogadores */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                        {equipe.jogadores.map((j, i) => {
                          const role = j.role?.toLowerCase() ?? "flex";
                          return (
                            <div
                              key={i}
                              className="bg-surface-2 border border-line rounded-lg p-3 flex flex-col items-center text-center"
                            >
                              <span
                                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider mb-2 ${
                                  ROLE_COLOR[role] ?? ROLE_COLOR.flex
                                }`}
                              >
                                {ROLE_ICON[role] && (
                                  <img 
                                    src={ROLE_ICON[role]} 
                                    alt={role} 
                                    className="w-5 h-5 object-contain" 
                                  />
                                )}
                                {ROLE_LABEL[role] ?? role.toUpperCase()}
                              </span>
                              <p className="text-xs font-semibold truncate w-full font-mono">{j.battletag}</p>
                              <p className="text-[11px] text-fg-dim mt-0.5">{j.rank}</p>
                            </div>
                          );
                        })}
                      </div>

                      {(equipe.horarios?.length > 0 || equipe.dias?.length > 0) && (
                        <div className="flex gap-1.5 flex-wrap pt-3 border-t border-line">
                          {equipe.horarios?.map((h) => (
                            <span
                              key={h}
                              className="bg-ow-orange/10 text-ow-orange border border-ow-orange/20 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold"
                            >
                              {LABEL_HORARIO[h] ?? h}
                            </span>
                          ))}
                          {equipe.dias?.map((d) => (
                            <span
                              key={d}
                              className="bg-surface-2 text-fg-muted border border-line text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold"
                            >
                              {LABEL_DIA[d] ?? d}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            )}

            {/* PARTIDAS */}
            {aba === "partidas" && (
              <div className="grid gap-3">
                {partidas.length === 0 ? (
                  <p className="text-fg-muted">Nenhuma partida registrada ainda.</p>
                ) : (
                  partidas.map((p) => {
                    const ao_vivo = p.status === "em_andamento";
                    const concluida = p.status === "concluida";
                    return (
                      <article key={p.id} className="surface-card p-5">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-fg-dim font-semibold">
                            {p.fase}{p.grupo ? ` · Grupo ${p.grupo}` : ""}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                              concluida
                                ? "bg-success/15 text-success border-success/30"
                                : ao_vivo
                                ? "bg-danger/15 text-danger border-danger/30"
                                : "bg-surface-2 text-fg-muted border-line"
                            }`}
                          >
                            {ao_vivo && <span className="w-1.5 h-1.5 rounded-full bg-danger live-dot" />}
                            {p.status.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                          <p className={`text-display text-lg md:text-xl font-bold uppercase text-right truncate ${
                            p.vencedor === p.time_a ? "text-success" : "text-fg"
                          }`}>
                            {p.time_a}
                          </p>
                          <div className="text-display text-3xl md:text-4xl font-bold tabular-nums flex items-center gap-3">
                            <span className={p.vencedor === p.time_a ? "text-ow-orange" : "text-fg"}>
                              {p.score_a ?? "—"}
                            </span>
                            <span className="text-fg-dim text-xl">×</span>
                            <span className={p.vencedor === p.time_b ? "text-ow-orange" : "text-fg"}>
                              {p.score_b ?? "—"}
                            </span>
                          </div>
                          <p className={`text-display text-lg md:text-xl font-bold uppercase truncate ${
                            p.vencedor === p.time_b ? "text-success" : "text-fg"
                          }`}>
                            {p.time_b}
                          </p>
                        </div>
                        {p.status === "concluida" && p.score_a !== null && p.score_b !== null && (
                          <div className="flex justify-between text-[10px] text-fg-dim mt-2 px-1">
                            <span>saldo: {(p.score_a - p.score_b) >= 0 ? "+" : ""}{p.score_a - p.score_b}</span>
                            <span>saldo: {(p.score_b - p.score_a) >= 0 ? "+" : ""}{p.score_b - p.score_a}</span>
                          </div>
                        )}
                        {(p.horario_agendado || p.streamer) && (
                          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-line">
                            {p.horario_agendado && (
                              <span className="text-xs text-fg-muted">
                                🕐 {new Date(p.horario_agendado).toLocaleString("pt-BR", {
                                  day: "2-digit", month: "2-digit", year: "numeric",
                                  hour: "2-digit", minute: "2-digit"
                                })}
                              </span>
                            )}
                            {p.streamer && (
                              <a
                                href={`https://twitch.tv/${p.streamer}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-1.5 bg-danger/15 hover:bg-danger/25 border border-danger/30 text-danger text-xs font-bold rounded-lg transition-colors uppercase tracking-wider"
                              >
                                <span className="w-2 h-2 rounded-full bg-danger live-dot" />
                                Assistir — {STREAMERS.find(s => s.value === p.streamer)?.label ?? p.streamer}
                              </a>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {/* GRUPOS */}
            {aba === "grupos" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.keys(grupos).length === 0 ? (
                  <p className="text-fg-muted">Fase de grupos ainda não iniciada.</p>
                ) : (
                  Object.entries(grupos).map(([grupo, equipes]) => (
                    <article key={grupo} className="surface-card p-5">
                      <header className="flex items-center justify-between mb-4">
                        <h2 className="text-display text-lg font-bold uppercase tracking-wider">
                          Grupo <span className="text-ow-orange">{grupo}</span>
                        </h2>
                        <span className="text-[10px] uppercase tracking-widest text-fg-dim">
                          {equipes.length} equipes
                        </span>
                      </header>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-fg-dim text-[10px] uppercase tracking-widest border-b border-line">
                            <th className="text-left py-2 font-semibold">#</th>
                            <th className="text-left py-2 font-semibold">Equipe</th>
                            <th className="text-center py-2 font-semibold">V</th>
                            <th className="text-center py-2 font-semibold">D</th>
                            <th className="text-center py-2 font-semibold">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {equipes.map((e, i) => (
                            <tr
                              key={i}
                              className={`border-b border-line/60 last:border-0 ${
                                i === 0 ? "bg-ow-orange/5" : ""
                              }`}
                            >
                              <td className={`py-2.5 font-display font-bold ${i === 0 ? "text-ow-orange" : "text-fg-dim"}`}>
                                {i + 1}
                              </td>
                              <td className="py-2.5 font-semibold text-fg">{e.nome}</td>
                              <td className="py-2.5 text-center text-success font-semibold tabular-nums">{e.vitorias}</td>
                              <td className="py-2.5 text-center text-danger font-semibold tabular-nums">{e.derrotas}</td>
                              <td className="py-2.5 text-center text-fg-muted tabular-nums">{e.saldo_mapas}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </article>
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
