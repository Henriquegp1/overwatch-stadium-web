"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

const API = "https://web-production-aeb1b.up.railway.app";
const POLLING_INTERVAL = 30000; // 30 segundos

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
type OrdemEquipes = "pontuacao" | "nome" | "fase";

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
  tank: "TANK", dps: "DPS", damage: "DPS", support: "SUP", flex: "FLEX",
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
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "OS";
}

function Brasao({ nome, size = 48 }: { nome: string; size?: number }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center font-bold text-display text-background shrink-0"
      style={{
        width: size, height: size,
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
  const [subAba, setSubAba] = useState<"mata-mata" | "grupos">("mata-mata");
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [grupos, setGrupos] = useState<Grupos>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  // Equipes: busca e ordenação
  const [buscaEquipe, setBuscaEquipe] = useState("");
  const [ordemEquipes, setOrdemEquipes] = useState<OrdemEquipes>("pontuacao");

  const buscarDados = useCallback(async (inicial = false) => {
    if (inicial) setCarregando(true);
    setErro(false);
    try {
      const [e, p, g] = await Promise.all([
        fetch(`${API}/api/publico/equipes`).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch(`${API}/api/publico/partidas`).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch(`${API}/api/publico/grupos`).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
      ]);
      setEquipes(e);
      setPartidas(p);
      setGrupos(g);
      setUltimaAtualizacao(new Date());
    } catch {
      if (inicial) setErro(true);
      // silencioso no polling — não quebra a tela se já tem dados
    } finally {
      if (inicial) setCarregando(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => { buscarDados(true); }, [buscarDados]);

  // Polling a cada 30s
  useEffect(() => {
    const id = setInterval(() => buscarDados(false), POLLING_INTERVAL);
    return () => clearInterval(id);
  }, [buscarDados]);

  const haoVivo = useMemo(() => partidas.some((p) => p.status === "em_andamento"), [partidas]);

  // Equipes filtradas e ordenadas
  const equipesFiltradas = useMemo(() => {
    let lista = [...equipes];
    if (buscaEquipe.trim()) {
      const q = buscaEquipe.toLowerCase();
      lista = lista.filter((e) => e.nome.toLowerCase().includes(q) || e.nome_capitao.toLowerCase().includes(q));
    }
    if (ordemEquipes === "pontuacao") lista.sort((a, b) => b.pontuacao_rank - a.pontuacao_rank);
    if (ordemEquipes === "nome") lista.sort((a, b) => a.nome.localeCompare(b.nome));
    if (ordemEquipes === "fase") {
      const ordem: Record<string, number> = { eliminatoria: 0, inscrita: 1, eliminado: 2 };
      lista.sort((a, b) => (ordem[a.fase_atual] ?? 1) - (ordem[b.fase_atual] ?? 1));
    }
    return lista;
  }, [equipes, buscaEquipe, ordemEquipes]);

  // Stats mata-mata
  const eliminatorias = useMemo(() => partidas.filter((p) => p.fase === "eliminatoria"), [partidas]);
  const classificados = useMemo(() => eliminatorias.filter((p) => p.status === "concluida" || p.status === "bye").length, [eliminatorias]);

  const abas: { id: Aba; label: string }[] = [
    { id: "inicio", label: "Início" },
    { id: "equipes", label: "Equipes" },
    { id: "partidas", label: "Partidas" },
    { id: "grupos", label: "Classificação" },
  ];

  // Tela de erro
  if (!carregando && erro) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-fg">
        <div className="surface-card p-10 rounded-2xl text-center max-w-md border border-danger/30">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-danger">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-display text-xl font-bold uppercase mb-2 text-fg">Sem conexão</h2>
          <p className="text-fg-muted text-sm mb-6">Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.</p>
          <button
            onClick={() => buscarDados(true)}
            className="bg-ow-orange text-background font-bold uppercase tracking-wider py-2.5 px-6 rounded-lg hover:bg-ow-orange-glow transition-colors text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-fg">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 hero-grad pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 md:px-8 py-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16 shrink-0 drop-shadow-[0_0_15px_rgba(249,158,26,0.4)]">
              <path fill="#F99E1A" d="M13.9 13.901a14.284 14.284 0 0 1 20.2 0l4.043-4.042a20 20 0 0 0-28.286 0z"></path>
              <path fill="#E6EDF7" d="m39.312 11.135-4.063 4.062a14.29 14.29 0 0 1 .995 16.159L28.891 24l-4.006-9.413h-.02V27.31l7.938 7.938a14.29 14.29 0 0 1-17.606 0l7.939-7.938V14.636l-4.027 9.365-7.355 7.355a14.29 14.29 0 0 1 .997-16.159l-4.063-4.062a20.001 20.001 0 1 0 30.624 0"></path>
            </svg>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-ow-orange/90 font-semibold">Temporada 1 · Ao vivo</p>
              <h1 className="text-display text-4xl md:text-5xl font-bold uppercase leading-none mt-1">
                Overwatch <span className="text-ow-orange">Stadium</span>
              </h1>
              <p className="text-fg-muted text-sm mt-2">Acompanhamento oficial de equipes, partidas e classificação.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {ultimaAtualizacao && (
              <span className="text-[10px] text-fg-dim uppercase tracking-wider">
                Atualizado às {ultimaAtualizacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            {haoVivo && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger/15 border border-danger/30 text-danger text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-danger live-dot" />
                Partida ao vivo
              </span>
            )}
            <a href="/?login=true" className="text-sm font-semibold text-ow-blue hover:text-ow-blue-glow transition-colors border border-ow-blue/30 hover:border-ow-blue-glow/60 px-4 py-2 rounded-lg">
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
              <button key={a.id} onClick={() => setAba(a.id)}
                className={`relative px-5 py-4 text-sm font-semibold uppercase tracking-wider transition-colors ${ativo ? "text-fg" : "text-fg-muted hover:text-fg"}`}
              >
                {a.label}
                <span className={`absolute left-3 right-3 -bottom-px h-[3px] rounded-t-full transition-all ${ativo ? "bg-ow-orange shadow-[0_0_12px_var(--ow-orange-glow)]" : "bg-transparent"}`} />
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
                        target="_blank" rel="noopener noreferrer"
                        className="inline-block bg-ow-orange text-background font-bold uppercase tracking-wider py-4 px-8 rounded-xl hover:bg-ow-orange-glow hover:-translate-y-1 hover:shadow-[0_15px_40px_-15px_rgba(249,158,26,0.6)] transition-all duration-300"
                      >
                        Inscrever Minha Equipe →
                      </a>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-display text-2xl font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className="text-ow-orange">✦</span> Transmissões Oficiais
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5">
                    {[{ canal: "akiralegacy", nome: "AkiraLegacy" }, { canal: "foythtv", nome: "FoythTV" }, { canal: "violetkill", nome: "VioletKill" }].map((streamer) => (
                      <div key={streamer.canal} className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 px-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-danger live-dot" />
                          <h3 className="text-display text-lg font-bold uppercase tracking-wider text-fg">{streamer.nome}</h3>
                        </div>
                        <div className="aspect-video bg-surface-2 rounded-xl overflow-hidden border border-line-strong shadow-lg hover:border-ow-orange/50 transition-colors">
                          <iframe
                            src={`https://player.twitch.tv/?channel=${streamer.canal}&parent=localhost&parent=web-production-aeb1b.up.railway.app&parent=overwatch-stadium-web.vercel.app`}
                            height="100%" width="100%" allowFullScreen className="border-none"
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
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Barra de busca e ordenação */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Buscar equipe ou capitão..."
                    value={buscaEquipe}
                    onChange={(e) => setBuscaEquipe(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-surface border border-line-strong rounded-lg text-fg text-sm focus:outline-none focus:border-ow-orange transition-colors placeholder:text-fg-dim"
                  />
                  <div className="flex gap-2">
                    {(["pontuacao", "nome", "fase"] as OrdemEquipes[]).map((o) => (
                      <button
                        key={o}
                        onClick={() => setOrdemEquipes(o)}
                        className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-colors ${
                          ordemEquipes === o
                            ? "bg-ow-orange/15 border-ow-orange/40 text-ow-orange"
                            : "bg-surface border-line text-fg-muted hover:text-fg hover:border-line-strong"
                        }`}
                      >
                        {o === "pontuacao" ? "Pontos" : o === "nome" ? "A–Z" : "Fase"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contador */}
                <p className="text-[10px] uppercase tracking-widest text-fg-dim px-1">
                  {equipesFiltradas.length} de {equipes.length} equipes
                  {eliminatorias.length > 0 && (
                    <span className="ml-3 text-success">· {classificados}/{eliminatorias.length} classificados</span>
                  )}
                </p>

                {equipesFiltradas.length === 0 ? (
                  <div className="surface-card p-10 text-center rounded-2xl border border-line-strong">
                    <p className="text-fg-muted text-sm">Nenhuma equipe encontrada para "{buscaEquipe}".</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {equipesFiltradas.map((equipe) => (
                      <article key={equipe.id} className={`surface-card p-5 md:p-6 relative overflow-hidden ${equipe.tem_jogador_desclassificado ? "ring-1 ring-danger/40" : ""}`}>
                        <span className="absolute left-0 top-0 bottom-0 w-1" style={{
                          background: equipe.tem_jogador_desclassificado ? "var(--danger)" : equipe.grupo ? "var(--grad-blue)" : "var(--grad-orange)",
                        }} />
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-5 pl-2">
                          <div className="flex items-center gap-4">
                            <Brasao nome={equipe.nome} />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-display text-xl font-bold uppercase">{equipe.nome}</h2>
                                {equipe.grupo && (
                                  <span className="bg-ow-blue/15 text-ow-blue border border-ow-blue/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Grupo {equipe.grupo}</span>
                                )}
                                {equipe.tem_jogador_desclassificado && (
                                  <span className="bg-danger/15 text-danger border border-danger/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">⚠ Desclassificado</span>
                                )}
                                {equipe.fase_atual === "eliminado" && (
                                  <span className="bg-danger/15 text-danger border border-danger/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">✕ Eliminado</span>
                                )}
                              </div>
                              <p className="text-fg-muted text-sm mt-0.5">Capitão · <span className="text-fg">{equipe.nome_capitao}</span></p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-display text-3xl font-bold text-ow-orange leading-none">{equipe.pontuacao_rank}</p>
                            <p className="text-fg-dim text-[10px] uppercase tracking-widest mt-1">pontos</p>
                            <p className="text-xs mt-2">
                              <span className="text-success font-semibold">{equipe.vitorias}V</span>
                              <span className="text-fg-dim"> · </span>
                              <span className="text-danger font-semibold">{equipe.derrotas}D</span>
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                          {equipe.jogadores.map((j, i) => {
                            const role = j.role?.toLowerCase() ?? "flex";
                            return (
                              <div key={i} className="bg-surface-2 border border-line rounded-lg p-3 flex flex-col items-center text-center">
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider mb-2 ${ROLE_COLOR[role] ?? ROLE_COLOR.flex}`}>
                                  {ROLE_ICON[role] && <img src={ROLE_ICON[role]} alt={role} className="w-5 h-5 object-contain" />}
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
                              <span key={h} className="bg-ow-orange/10 text-ow-orange border border-ow-orange/20 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold">{LABEL_HORARIO[h] ?? h}</span>
                            ))}
                            {equipe.dias?.map((d) => (
                              <span key={d} className="bg-surface-2 text-fg-muted border border-line text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold">{LABEL_DIA[d] ?? d}</span>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PARTIDAS */}
            {aba === "partidas" && (
              <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                            concluida ? "bg-success/15 text-success border-success/30"
                            : ao_vivo ? "bg-danger/15 text-danger border-danger/30"
                            : "bg-surface-2 text-fg-muted border-line"
                          }`}>
                            {ao_vivo && <span className="w-1.5 h-1.5 rounded-full bg-danger live-dot" />}
                            {p.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                          <p className={`text-display text-lg md:text-xl font-bold uppercase text-right truncate ${p.vencedor === p.time_a ? "text-success" : "text-fg"}`}>{p.time_a}</p>
                          <div className="text-display text-3xl md:text-4xl font-bold tabular-nums flex items-center gap-3">
                            <span className={p.vencedor === p.time_a ? "text-ow-orange" : "text-fg"}>{p.score_a ?? "—"}</span>
                            <span className="text-fg-dim text-xl">×</span>
                            <span className={p.vencedor === p.time_b ? "text-ow-orange" : "text-fg"}>{p.score_b ?? "—"}</span>
                          </div>
                          <p className={`text-display text-lg md:text-xl font-bold uppercase truncate ${p.vencedor === p.time_b ? "text-success" : "text-fg"}`}>{p.time_b}</p>
                        </div>
                        {concluida && p.score_a !== null && p.score_b !== null && (
                          <div className="flex justify-between text-[10px] text-fg-dim mt-2 px-1">
                            <span>saldo: {(p.score_a - p.score_b) >= 0 ? "+" : ""}{p.score_a - p.score_b}</span>
                            <span>saldo: {(p.score_b - p.score_a) >= 0 ? "+" : ""}{p.score_b - p.score_a}</span>
                          </div>
                        )}
                        {(p.horario_agendado || p.streamer) && (
                          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-line">
                            {p.horario_agendado && (
                              <span className="text-xs text-fg-muted">
                                🕐 {new Date(p.horario_agendado).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                            {p.streamer && (
                              <a href={`https://twitch.tv/${p.streamer}`} target="_blank" rel="noopener noreferrer"
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

            {/* CLASSIFICAÇÃO */}
            {aba === "grupos" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Sub-abas */}
                <div className="flex gap-1 border-b border-line">
                  {(["mata-mata", "grupos"] as const).map((s) => (
                    <button key={s} onClick={() => setSubAba(s)}
                      className={`relative px-5 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${subAba === s ? "text-fg" : "text-fg-muted hover:text-fg"}`}
                    >
                      {s === "mata-mata" ? "Mata-mata" : "Fase de Grupos"}
                      <span className={`absolute left-3 right-3 -bottom-px h-[3px] rounded-t-full transition-all ${subAba === s ? "bg-ow-orange shadow-[0_0_12px_var(--ow-orange-glow)]" : "bg-transparent"}`} />
                    </button>
                  ))}
                </div>

                {/* MATA-MATA */}
                {subAba === "mata-mata" && (() => {
                  const encerradas = eliminatorias.filter((p) => p.status === "concluida" || p.status === "bye");
                  const pendentes = eliminatorias.filter((p) => p.status !== "concluida" && p.status !== "bye");

                  if (eliminatorias.length === 0) {
                    return (
                      <div className="surface-card rounded-2xl p-12 text-center border border-line-strong">
                        <p className="text-fg-muted uppercase tracking-wider text-sm font-semibold">Mata-mata ainda não iniciado.</p>
                      </div>
                    );
                  }

                  const CardMM = ({ p }: { p: Partida }) => {
                    const concluida = p.status === "concluida" || p.status === "bye";
                    const isBye = p.time_b === "BYE";
                    return (
                      <article className="surface-card p-0 overflow-hidden">
                        <div className="flex items-stretch">
                          <div className="flex items-center justify-center min-w-[40px] bg-surface-2 border-r border-line">
                            <span className="text-[10px] font-bold text-fg-dim">#{p.id}</span>
                          </div>
                          <div className="flex-1 flex flex-col">
                            {/* Time A */}
                            <div className={`flex items-center gap-3 px-4 py-3 ${concluida && p.vencedor === p.time_a ? "bg-success/10" : ""} ${concluida && p.vencedor !== p.time_a && !isBye ? "opacity-40" : ""}`}>
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-background shrink-0" style={{ background: "var(--grad-orange)" }}>
                                {p.time_a.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <span className={`flex-1 text-sm font-bold uppercase tracking-wide truncate ${concluida && p.vencedor === p.time_a ? "text-success" : "text-fg"}`}>{p.time_a}</span>
                              {concluida && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border shrink-0 ${p.vencedor === p.time_a ? "bg-success/15 text-success border-success/30" : "text-fg-dim border-line"}`}>
                                  {p.vencedor === p.time_a ? "Avança" : "Eliminado"}
                                </span>
                              )}
                            </div>
                            <div className="h-px bg-line mx-4" />
                            {/* Time B */}
                            {isBye ? (
                              <div className="flex items-center gap-3 px-4 py-3 opacity-30">
                                <div className="w-7 h-7 rounded-lg bg-surface-2 border border-line shrink-0" />
                                <span className="text-sm text-fg-dim italic">BYE — passa automaticamente</span>
                              </div>
                            ) : (
                              <div className={`flex items-center gap-3 px-4 py-3 ${concluida && p.vencedor === p.time_b ? "bg-success/10" : ""} ${concluida && p.vencedor !== p.time_b ? "opacity-40" : ""}`}>
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-background shrink-0" style={{ background: "var(--grad-blue)" }}>
                                  {p.time_b.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <span className={`flex-1 text-sm font-bold uppercase tracking-wide truncate ${concluida && p.vencedor === p.time_b ? "text-success" : "text-fg"}`}>{p.time_b}</span>
                                {concluida && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border shrink-0 ${p.vencedor === p.time_b ? "bg-success/15 text-success border-success/30" : "text-fg-dim border-line"}`}>
                                    {p.vencedor === p.time_b ? "Avança" : "Eliminado"}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2 bg-surface-2 border-t border-line gap-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${concluida ? "bg-success/15 text-success border-success/30" : "bg-surface-2 text-fg-muted border-line"}`}>
                            {concluida ? "Encerrado" : "Aguardando"}
                          </span>
                          <div className="flex items-center gap-3">
                            {concluida && p.vencedor && (
                              <span className="text-[10px] text-fg-dim">Classificado: <span className="text-fg font-semibold">{p.vencedor}</span></span>
                            )}
                            {!concluida && p.horario_agendado && (
                              <span className="text-[10px] text-fg-dim">
                                🕐 {new Date(p.horario_agendado).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                            {p.streamer && (
                              <a href={`https://twitch.tv/${p.streamer}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-danger/15 hover:bg-danger/25 border border-danger/30 text-danger text-[10px] font-bold rounded-lg transition-colors uppercase tracking-wider"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-danger live-dot" />
                                {p.streamer}
                              </a>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  };

                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { val: eliminatorias.length, label: "Confrontos" },
                          { val: encerradas.length, label: "Finalizados", color: "text-success" },
                          { val: pendentes.length, label: "Pendentes", color: "text-warning" },
                        ].map(({ val, label, color }) => (
                          <div key={label} className="surface-card p-4 text-center">
                            <p className={`text-display text-2xl font-bold ${color ?? "text-fg"}`}>{val}</p>
                            <p className="text-[10px] uppercase tracking-widest text-fg-dim mt-1">{label}</p>
                          </div>
                        ))}
                      </div>
                      {encerradas.length > 0 && (
                        <section className="space-y-2">
                          <h3 className="text-[10px] uppercase tracking-[0.2em] text-fg-dim font-semibold px-1">Encerrados ({encerradas.length})</h3>
                          {encerradas.map((p) => <CardMM key={p.id} p={p} />)}
                        </section>
                      )}
                      {pendentes.length > 0 && (
                        <section className="space-y-2">
                          <h3 className="text-[10px] uppercase tracking-[0.2em] text-fg-dim font-semibold px-1">Aguardando ({pendentes.length})</h3>
                          {pendentes.map((p) => <CardMM key={p.id} p={p} />)}
                        </section>
                      )}
                    </div>
                  );
                })()}

                {/* FASE DE GRUPOS */}
                {subAba === "grupos" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Object.keys(grupos).length === 0 ? (
                      <div className="surface-card rounded-2xl p-12 text-center border border-line-strong md:col-span-2">
                        <p className="text-fg-muted uppercase tracking-wider text-sm font-semibold">Fase de grupos ainda não iniciada.</p>
                      </div>
                    ) : (
                      Object.entries(grupos).map(([grupo, equipes]) => (
                        <article key={grupo} className="surface-card p-5">
                          <header className="flex items-center justify-between mb-4">
                            <h2 className="text-display text-lg font-bold uppercase tracking-wider">Grupo <span className="text-ow-orange">{grupo}</span></h2>
                            <span className="text-[10px] uppercase tracking-widest text-fg-dim">{equipes.length} equipes</span>
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
                                <tr key={i} className={`border-b border-line/60 last:border-0 ${i === 0 ? "bg-ow-orange/5" : ""}`}>
                                  <td className={`py-2.5 font-display font-bold ${i === 0 ? "text-ow-orange" : "text-fg-dim"}`}>{i + 1}</td>
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
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}