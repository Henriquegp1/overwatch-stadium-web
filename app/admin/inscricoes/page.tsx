"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API = "https://web-production-aeb1b.up.railway.app";

interface Jogador {
  battletag: string;
  role: string;
  rank: string;
  pontos_rank: number;
  reserva: boolean;
  desclassificado: boolean;
  discord: string | null;
}

interface Inscricao {
  id: number;
  nome: string;
  nome_capitao: string;
  pontuacao_rank: number;
  tem_jogador_desclassificado: boolean;
  verificado: boolean;
  horarios: string[];
  dias: string[];
  jogadores: Jogador[];
  fase_atual: string;
}

const RANKS = [
  "Bronze 5","Bronze 4","Bronze 3","Bronze 2","Bronze 1",
  "Prata 5","Prata 4","Prata 3","Prata 2","Prata 1",
  "Ouro 5","Ouro 4","Ouro 3","Ouro 2","Ouro 1",
  "Platina 5","Platina 4","Platina 3","Platina 2","Platina 1",
  "Diamante 5","Diamante 4","Diamante 3","Diamante 2","Diamante 1",
  "Mestre 5","Mestre 4","Mestre 3","Mestre 2","Mestre 1",
];

const HORARIOS = ["manha","tarde","noite"];
const DIAS = ["segunda","terca","quarta","quinta","sexta","sabado","domingo"];
const LABEL_HORARIO: Record<string, string> = { manha:"Manhã", tarde:"Tarde", noite:"Noite" };
const LABEL_DIA: Record<string, string> = {
  segunda:"Seg", terca:"Ter", quarta:"Qua",
  quinta:"Qui", sexta:"Sex", sabado:"Sáb", domingo:"Dom"
};

const ROLE_COLOR: Record<string, string> = {
  tank: "bg-role-tank/15 text-role-tank border-role-tank/30",
  dps: "bg-role-dps/15 text-role-dps border-role-dps/30",
  damage: "bg-role-dps/15 text-role-dps border-role-dps/30",
  support: "bg-role-support/15 text-role-support border-role-support/30",
  flex: "bg-fg-muted/15 text-fg-muted border-fg-muted/30",
};

function rankColor(rank: string): string {
  const r = rank.toLowerCase();
  if (r.startsWith("bronze")) return "text-[#cd7f32]";
  if (r.startsWith("prata")) return "text-[#c0c0c0]";
  if (r.startsWith("ouro")) return "text-[#facc15]";
  if (r.startsWith("platina")) return "text-ow-blue";
  if (r.startsWith("diamante")) return "text-ow-blue-glow";
  if (r.startsWith("mestre")) return "text-ow-orange";
  return "text-fg-muted";
}

export default function AdminInscricoesPage() {
  const router = useRouter();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [editando, setEditando] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<"todos"|"verificados"|"pendentes"|"desclassificados">("todos");

  // Estado de edição
  const [editNome, setEditNome] = useState("");
  const [editCapitao, setEditCapitao] = useState("");
  const [editHorarios, setEditHorarios] = useState<string[]>([]);
  const [editDias, setEditDias] = useState<string[]>([]);
  const [editJogadores, setEditJogadores] = useState<Jogador[]>([]);
  const [salvando, setSalvando] = useState(false);

  const getToken = () => localStorage.getItem("stadium_token") ?? "";

  useEffect(() => {
    const cargo = localStorage.getItem("stadium_cargo");
    if (!getToken() || cargo !== "admin") {
      router.replace("/");
      return;
    }
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const buscar = async () => {
    setCarregando(true);
    setErro("");
    try {
      const res = await fetch(`${API}/api/inscricoes/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) { router.replace("/"); return; }
      const dados = await res.json();
      setInscricoes(dados);
    } catch {
      setErro("Erro ao carregar inscrições.");
    } finally {
      setCarregando(false);
    }
  };

  const toggleVerificado = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/inscricoes/${id}/verificar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const dados = await res.json();
      setInscricoes(prev =>
        prev.map(i => i.id === id ? { ...i, verificado: dados.verificado } : i)
      );
    } catch {
      setErro("Erro ao atualizar verificação.");
    }
  };

  const abrirEdicao = (insc: Inscricao) => {
    setEditando(insc.id);
    setEditNome(insc.nome);
    setEditCapitao(insc.nome_capitao);
    setEditHorarios([...insc.horarios]);
    setEditDias([...insc.dias]);
    setEditJogadores(insc.jogadores.map(j => ({ ...j })));
    setExpandido(insc.id);
  };

  const toggleHorario = (h: string) => {
    setEditHorarios(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
  };

  const toggleDia = (d: string) => {
    setEditDias(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const atualizarJogador = (index: number, campo: keyof Jogador, valor: string) => {
    setEditJogadores(prev => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch(`${API}/api/inscricoes/${editando}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          nome_equipe: editNome,
          battletag_capitao: editCapitao,
          horarios: editHorarios,
          dias: editDias,
          jogadores: editJogadores.filter(j => !j.reserva),
          reservas: editJogadores.filter(j => j.reserva),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Erro ao salvar.");
      }
      setSucesso("Equipe atualizada com sucesso.");
      setEditando(null);
      buscar();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const inscricoesFiltradas = useMemo(() => inscricoes.filter(i => {
    if (filtro === "verificados") return i.verificado;
    if (filtro === "pendentes") return !i.verificado;
    if (filtro === "desclassificados") return i.tem_jogador_desclassificado;
    return true;
  }), [inscricoes, filtro]);

  const stats = useMemo(() => ({
    total: inscricoes.length,
    pendentes: inscricoes.filter(i => !i.verificado).length,
    verificados: inscricoes.filter(i => i.verificado).length,
    desclassificados: inscricoes.filter(i => i.tem_jogador_desclassificado).length,
  }), [inscricoes]);

  const filtros: { id: typeof filtro; label: string; count: number; cor: string }[] = [
    { id: "todos", label: "Todos", count: stats.total, cor: "ow-orange" },
    { id: "pendentes", label: "Pendentes", count: stats.pendentes, cor: "warning" },
    { id: "verificados", label: "Verificados", count: stats.verificados, cor: "success" },
    { id: "desclassificados", label: "Desclass.", count: stats.desclassificados, cor: "danger" },
  ];

  return (
    <main className="min-h-screen p-6 md:p-10 text-fg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {/* Header */}
        <header className="relative overflow-hidden rounded-2xl border border-line-strong mb-8">
          <div className="absolute inset-0 hero-grad" />
          <div className="relative p-6 md:p-8 flex flex-wrap justify-between items-center gap-4">
            
            <div className="flex items-center gap-4">
              {/* Ícone de Inscrições (Card de Perfil Moderno) */}
              <svg 
                viewBox="0 0 48 48" 
                fill="none" 
                className="w-14 h-14 shrink-0 drop-shadow-[0_0_15px_rgba(249,158,26,0.4)]"
              >
                {/* Borda do Documento com dobra sci-fi */}
                <path 
                  d="M14 12C14 10.8954 14.8954 10 16 10H28L36 18V36C36 37.1046 35.1046 38 34 38H16C14.8954 38 14 37.1046 14 36V12Z" 
                  stroke="#E6EDF7" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                {/* Detalhe da dobra superior direita */}
                <path 
                  d="M28 10V18H36" 
                  stroke="#E6EDF7" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                
                {/* Ícone de Usuário / Avatar em Laranja (Overwatch) */}
                <circle cx="25" cy="22" r="4" stroke="#F99E1A" strokeWidth="3"/>
                <path 
                  d="M19 32C19 29.5 22 28 25 28C28 28 31 29.5 31 32" 
                  stroke="#F99E1A" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
              </svg>
              
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-ow-orange font-semibold">
                  Painel admin
                </p>
                <h1 className="text-display text-3xl font-bold uppercase">Inscrições</h1>
              </div>
            </div>

            <button
              onClick={() => router.push("/admin")}
              className="text-sm font-semibold border border-line-strong hover:border-ow-orange/60 hover:text-ow-orange text-fg-muted px-4 py-2 rounded-lg transition-colors"
            >
              ← Voltar
            </button>
          </div>
        </header>

        {/* Mensagens */}
        {erro && (
          <div className="bg-danger/10 border border-danger/40 text-danger px-4 py-3 rounded-lg mb-4 text-sm">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="bg-success/10 border border-success/40 text-success px-4 py-3 rounded-lg mb-4 text-sm">
            {sucesso}
          </div>
        )}

        {/* Filtros / métricas combinados */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {filtros.map(f => {
            const ativo = filtro === f.id;
            const corClasse =
              f.cor === "ow-orange" ? "text-ow-orange border-ow-orange" :
              f.cor === "warning" ? "text-warning border-warning" :
              f.cor === "success" ? "text-success border-success" :
              "text-danger border-danger";
            return (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`surface-card p-4 text-left transition-all border-2 ${
                  ativo ? `${corClasse} bg-surface-2` : "border-transparent hover:border-line-strong"
                }`}
              >
                <p className="text-[10px] uppercase tracking-widest text-fg-dim font-semibold">
                  {f.label}
                </p>
                <p className={`text-display text-3xl font-bold mt-1 ${ativo ? corClasse.split(" ")[0] : "text-fg"}`}>
                  {f.count}
                </p>
              </button>
            );
          })}
        </div>

        {/* Lista */}
        {carregando ? (
          <div className="grid gap-3">
            <div className="skeleton h-24" />
            <div className="skeleton h-24" />
            <div className="skeleton h-24" />
          </div>
        ) : inscricoesFiltradas.length === 0 ? (
          <div className="surface-card p-10 text-center text-fg-muted">
            Nenhuma inscrição encontrada.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {inscricoesFiltradas.map(insc => {
              const aberto = expandido === insc.id;
              const emEdicao = editando === insc.id;
              const corBorda = insc.tem_jogador_desclassificado
                ? "var(--danger)"
                : insc.verificado
                ? "var(--success)"
                : "var(--ow-orange)";

              return (
                <article
                  key={insc.id}
                  className="surface-card relative overflow-hidden"
                >
                  <span
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ background: corBorda }}
                  />

                  {/* Cabeçalho */}
                  <div className="p-5 pl-6 flex flex-wrap items-center gap-4 justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-display text-lg font-bold uppercase">{insc.nome}</h2>
                        {insc.verificado && (
                          <span className="bg-success/15 text-success border border-success/30 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                            ✓ Verificado
                          </span>
                        )}
                        {insc.tem_jogador_desclassificado && (
                          <span className="bg-danger/15 text-danger border border-danger/30 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                            ⚠ Desclassificado
                          </span>
                        )}
                        {insc.fase_atual === "eliminado" && (
                          <span className="bg-danger/15 text-danger border border-danger/30 text-xs px-2 py-0.5 rounded-full font-semibold">
                            ✕ Eliminado
                          </span>
                        )}
                      </div>
                      <p className="text-fg-muted text-sm mt-1">
                        Capitão · <span className="text-fg">{insc.nome_capitao}</span>
                        <span className="text-fg-dim mx-2">·</span>
                        <span className="text-ow-orange font-display font-bold">{insc.pontuacao_rank}</span>
                        <span className="text-fg-dim text-xs ml-1">pts</span>
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => toggleVerificado(insc.id)}
                        className={`px-3 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors border ${
                          insc.verificado
                            ? "bg-success/15 hover:bg-success/25 text-success border-success/40"
                            : "bg-surface-2 hover:bg-success/10 text-fg-muted hover:text-success border-line"
                        }`}
                      >
                        {insc.verificado ? "Verificado" : "Verificar"}
                      </button>
                      <button
                        onClick={async () => {
                          const acao = insc.fase_atual === "eliminado" ? "reativar" : "eliminar";
                          const msg = acao === "eliminar"
                            ? `Eliminar a equipe "${insc.nome}"?`
                            : `Reativar a equipe "${insc.nome}"?`;
                          if (!confirm(msg)) return;
                          try {
                            const res = await fetch(`${API}/api/chaveamento/equipes/${insc.id}/${acao}`, {
                              method: "PATCH",
                              headers: { Authorization: `Bearer ${getToken()}` },
                            });
                            if (!res.ok) throw new Error();
                            setSucesso(`Equipe "${insc.nome}" ${acao === "eliminar" ? "eliminada" : "reativada"}.`);
                            buscar();
                          } catch {
                            setErro(`Erro ao ${acao} equipe.`);
                          }
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border ${
                          insc.fase_atual === "eliminado"
                            ? "bg-success/10 hover:bg-success/20 text-success border-success/30"
                            : "bg-surface-2 hover:bg-danger/10 text-fg-muted hover:text-danger border-line hover:border-danger/30"
                        }`}
                      >
                        {insc.fase_atual === "eliminado" ? "Reativar" : "Eliminar"}
                      </button>
                      <button
                        onClick={() => setExpandido(aberto ? null : insc.id)}
                        className="bg-surface-2 hover:bg-surface-2/70 text-fg px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border border-line"
                      >
                        {aberto ? "Fechar" : "Detalhes"}
                      </button>
                      <button
                        onClick={() => emEdicao ? setEditando(null) : abrirEdicao(insc)}
                        className="bg-ow-orange/15 hover:bg-ow-orange/25 text-ow-orange border border-ow-orange/40 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        {emEdicao ? "Cancelar" : "Editar"}
                      </button>
                    </div>
                  </div>

                  {/* Detalhes (somente leitura) */}
                  {aberto && !emEdicao && (
                    <div className="border-t border-line p-5 pl-6">
                      <div className="mb-4 flex gap-6 flex-wrap">
                        <div>
                          <p className="text-[10px] text-fg-dim mb-1.5 uppercase tracking-widest font-semibold">Horários</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {insc.horarios.length > 0
                              ? insc.horarios.map(h => (
                                  <span key={h} className="bg-ow-orange/10 text-ow-orange border border-ow-orange/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                    {LABEL_HORARIO[h] ?? h}
                                  </span>
                                ))
                              : <span className="text-fg-dim text-xs">—</span>
                            }
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-fg-dim mb-1.5 uppercase tracking-widest font-semibold">Dias</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {insc.dias.length > 0
                              ? insc.dias.map(d => (
                                  <span key={d} className="bg-surface-2 text-fg-muted border border-line px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                    {LABEL_DIA[d] ?? d}
                                  </span>
                                ))
                              : <span className="text-fg-dim text-xs">—</span>
                            }
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-fg-dim border-b border-line text-[10px] uppercase tracking-widest">
                              <th className="text-left py-2 px-2 font-semibold">BattleTag</th>
                              <th className="text-left py-2 px-2 font-semibold">Role</th>
                              <th className="text-left py-2 px-2 font-semibold">Rank</th>
                              <th className="text-left py-2 px-2 font-semibold">Pts</th>
                              <th className="text-left py-2 px-2 font-semibold">Discord</th>
                              <th className="text-left py-2 px-2 font-semibold">Tipo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {insc.jogadores.map((j, idx) => {
                              const roleK = j.role?.toLowerCase() ?? "flex";
                              return (
                                <tr
                                  key={idx}
                                  className={`border-b border-line/60 ${j.desclassificado ? "bg-danger/5" : ""}`}
                                >
                                  <td className="py-2.5 px-2 font-mono text-fg">
                                    {j.battletag}
                                    {j.desclassificado && <span className="ml-2 text-danger text-xs">⚠</span>}
                                  </td>
                                  <td className="py-2.5 px-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${ROLE_COLOR[roleK] ?? ROLE_COLOR.flex}`}>
                                      {roleK}
                                    </span>
                                  </td>
                                  <td className={`py-2.5 px-2 font-semibold ${rankColor(j.rank)}`}>{j.rank}</td>
                                  <td className="py-2.5 px-2 text-ow-orange font-display font-bold tabular-nums">{j.pontos_rank}</td>
                                  <td className="py-2.5 px-2 text-fg-muted font-mono text-xs">{j.discord ?? "—"}</td>
                                  <td className="py-2.5 px-2">
                                    {j.reserva
                                      ? <span className="text-fg-dim text-[10px] uppercase tracking-wider">Reserva</span>
                                      : <span className="text-ow-blue text-[10px] uppercase tracking-wider font-semibold">Titular</span>
                                    }
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Edição */}
                  {emEdicao && (
                    <div className="border-t border-line p-5 pl-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-[10px] text-fg-dim mb-1.5 uppercase tracking-widest font-semibold">Nome da equipe</label>
                          <input
                            className="w-full px-3 py-2 bg-surface-2 border border-line rounded-lg text-fg text-sm focus:outline-none focus:border-ow-orange transition-colors"
                            value={editNome}
                            onChange={e => setEditNome(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-fg-dim mb-1.5 uppercase tracking-widest font-semibold">BattleTag do capitão</label>
                          <input
                            className="w-full px-3 py-2 bg-surface-2 border border-line rounded-lg text-fg text-sm font-mono focus:outline-none focus:border-ow-orange transition-colors"
                            value={editCapitao}
                            onChange={e => setEditCapitao(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mb-5">
                        <p className="text-[10px] text-fg-dim mb-2 uppercase tracking-widest font-semibold">Horários</p>
                        <div className="flex gap-2 flex-wrap">
                          {HORARIOS.map(h => {
                            const sel = editHorarios.includes(h);
                            return (
                              <button
                                key={h}
                                onClick={() => toggleHorario(h)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                                  sel
                                    ? "bg-ow-orange/20 text-ow-orange border-ow-orange/50"
                                    : "bg-surface-2 text-fg-muted border-line hover:border-line-strong"
                                }`}
                              >
                                {LABEL_HORARIO[h]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-[10px] text-fg-dim mb-2 uppercase tracking-widest font-semibold">Dias</p>
                        <div className="flex gap-2 flex-wrap">
                          {DIAS.map(d => {
                            const sel = editDias.includes(d);
                            return (
                              <button
                                key={d}
                                onClick={() => toggleDia(d)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                                  sel
                                    ? "bg-ow-blue/20 text-ow-blue border-ow-blue/50"
                                    : "bg-surface-2 text-fg-muted border-line hover:border-line-strong"
                                }`}
                              >
                                {LABEL_DIA[d]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <p className="text-[10px] text-fg-dim mb-3 uppercase tracking-widest font-semibold">Jogadores</p>
                      <div className="flex flex-col gap-3 mb-6">
                        {editJogadores.map((j, idx) => (
                          <div key={idx} className="surface-elevated p-3">
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                j.reserva
                                  ? "bg-fg-muted/15 text-fg-muted border-fg-muted/30"
                                  : "bg-ow-blue/15 text-ow-blue border-ow-blue/30"
                              }`}>
                                {j.reserva ? "Reserva" : `Titular ${idx + 1}`}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>
                                <label className="block text-[10px] text-fg-dim mb-1 uppercase tracking-wider">BattleTag</label>
                                <input
                                  className="w-full px-2 py-1.5 bg-surface border border-line rounded text-fg text-sm font-mono focus:outline-none focus:border-ow-orange"
                                  value={j.battletag}
                                  onChange={e => atualizarJogador(idx, "battletag", e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-fg-dim mb-1 uppercase tracking-wider">Role</label>
                                <select
                                  className="w-full px-2 py-1.5 bg-surface border border-line rounded text-fg text-sm focus:outline-none focus:border-ow-orange"
                                  value={j.role}
                                  onChange={e => atualizarJogador(idx, "role", e.target.value)}
                                >
                                  {["tank","damage","support","flex"].map(r => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-fg-dim mb-1 uppercase tracking-wider">Rank</label>
                                <select
                                  className="w-full px-2 py-1.5 bg-surface border border-line rounded text-fg text-sm focus:outline-none focus:border-ow-orange"
                                  value={j.rank}
                                  onChange={e => atualizarJogador(idx, "rank", e.target.value)}
                                >
                                  {RANKS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] text-fg-dim mb-1 uppercase tracking-wider">Discord</label>
                                <input
                                  className="w-full px-2 py-1.5 bg-surface border border-line rounded text-fg text-sm focus:outline-none focus:border-ow-orange"
                                  value={j.discord ?? ""}
                                  onChange={e => atualizarJogador(idx, "discord", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditando(null)}
                          className="px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-2/70 text-fg-muted border border-line text-sm font-semibold uppercase tracking-wider transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={salvarEdicao}
                          disabled={salvando}
                          className="px-5 py-2 rounded-lg text-background border border-ow-orange text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-orange"
                          style={{ background: "var(--grad-orange)" }}
                        >
                          {salvando ? "Salvando..." : "Salvar alterações"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
