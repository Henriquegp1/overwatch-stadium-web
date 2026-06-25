"use client";

import { useEffect, useState } from "react";
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
    setEditHorarios(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]
    );
  };

  const toggleDia = (d: string) => {
    setEditDias(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
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

  const inscricoesFiltradas = inscricoes.filter(i => {
    if (filtro === "verificados") return i.verificado;
    if (filtro === "pendentes") return !i.verificado;
    if (filtro === "desclassificados") return i.tem_jogador_desclassificado;
    return true;
  });

  return (
    <main className="min-h-screen bg-neutral-900 p-8 text-white">
      <div className="max-w-6xl mx-auto">

        <header className="bg-purple-900 p-6 rounded-xl border border-purple-500 mb-8 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Inscrições</h1>
            <p className="text-purple-300">Overwatch Stadium — Painel Admin</p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-lg border border-neutral-600 transition-colors"
          >
            ← Voltar
          </button>
        </header>

        {erro && (
          <div className="bg-red-900 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="bg-green-900 border border-green-500 text-green-200 p-4 rounded-lg mb-6">
            {sucesso}
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["todos","pendentes","verificados","desclassificados"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors capitalize ${
                filtro === f
                  ? "bg-purple-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {f === "todos" && `Todos (${inscricoes.length})`}
              {f === "pendentes" && `Pendentes (${inscricoes.filter(i => !i.verificado).length})`}
              {f === "verificados" && `Verificados (${inscricoes.filter(i => i.verificado).length})`}
              {f === "desclassificados" && `Desclassificados (${inscricoes.filter(i => i.tem_jogador_desclassificado).length})`}
            </button>
          ))}
        </div>

        {carregando ? (
          <p className="text-neutral-400">Carregando...</p>
        ) : inscricoesFiltradas.length === 0 ? (
          <p className="text-neutral-400">Nenhuma inscrição encontrada.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {inscricoesFiltradas.map(insc => (
              <div
                key={insc.id}
                className={`bg-neutral-800 rounded-xl border transition-colors ${
                  insc.tem_jogador_desclassificado
                    ? "border-red-500"
                    : insc.verificado
                    ? "border-green-600"
                    : "border-neutral-700"
                }`}
              >
                {/* Cabeçalho da equipe */}
                <div className="p-5 flex flex-wrap items-center gap-4 justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-lg">{insc.nome}</span>
                        {insc.verificado && (
                          <span className="bg-green-800 text-green-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                            ✓ Verificado
                          </span>
                        )}
                        {insc.tem_jogador_desclassificado && (
                          <span className="bg-red-900 text-red-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                            ⚠ Desclassificado
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-400 text-sm">
                        Capitão: {insc.nome_capitao} · Pontuação: <span className="text-purple-400 font-bold">{insc.pontuacao_rank} pts</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => toggleVerificado(insc.id)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                        insc.verificado
                          ? "bg-green-800 hover:bg-green-700 text-green-200"
                          : "bg-neutral-700 hover:bg-green-800 text-neutral-300 hover:text-green-200"
                      }`}
                    >
                      {insc.verificado ? "✓ Verificado" : "Marcar como verificado"}
                    </button>
                    <button
                      onClick={() => setExpandido(expandido === insc.id ? null : insc.id)}
                      className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      {expandido === insc.id ? "▲ Fechar" : "▼ Ver jogadores"}
                    </button>
                    <button
                      onClick={() => editando === insc.id ? setEditando(null) : abrirEdicao(insc)}
                      className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      {editando === insc.id ? "Cancelar" : "Editar"}
                    </button>
                  </div>
                </div>

                {/* Expandido: visualização */}
                {expandido === insc.id && editando !== insc.id && (
                  <div className="border-t border-neutral-700 p-5">
                    {/* Disponibilidade */}
                    <div className="mb-4 flex gap-6 flex-wrap">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">Horários</p>
                        <div className="flex gap-1">
                          {insc.horarios.length > 0
                            ? insc.horarios.map(h => (
                                <span key={h} className="bg-purple-900 text-purple-300 px-2 py-0.5 rounded text-xs font-semibold">
                                  {LABEL_HORARIO[h] ?? h}
                                </span>
                              ))
                            : <span className="text-neutral-500 text-xs">—</span>
                          }
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">Dias</p>
                        <div className="flex gap-1 flex-wrap">
                          {insc.dias.length > 0
                            ? insc.dias.map(d => (
                                <span key={d} className="bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded text-xs font-semibold">
                                  {LABEL_DIA[d] ?? d}
                                </span>
                              ))
                            : <span className="text-neutral-500 text-xs">—</span>
                          }
                        </div>
                      </div>
                    </div>

                    {/* Jogadores */}
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-neutral-500 border-b border-neutral-700 text-xs uppercase tracking-wide">
                          <th className="text-left py-2 px-2">BattleTag</th>
                          <th className="text-left py-2 px-2">Role</th>
                          <th className="text-left py-2 px-2">Rank</th>
                          <th className="text-left py-2 px-2">Pts</th>
                          <th className="text-left py-2 px-2">Discord</th>
                          <th className="text-left py-2 px-2">Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insc.jogadores.map((j, idx) => (
                          <tr
                            key={idx}
                            className={`border-b border-neutral-700 ${j.desclassificado ? "bg-red-950/30" : ""}`}
                          >
                            <td className="py-2 px-2 font-semibold text-white">
                              {j.battletag}
                              {j.desclassificado && <span className="ml-2 text-red-400 text-xs">⚠</span>}
                            </td>
                            <td className="py-2 px-2 text-neutral-300">{j.role}</td>
                            <td className="py-2 px-2 text-neutral-300">{j.rank}</td>
                            <td className="py-2 px-2 text-purple-400 font-bold">{j.pontos_rank}</td>
                            <td className="py-2 px-2 text-neutral-400">{j.discord ?? "—"}</td>
                            <td className="py-2 px-2">
                              {j.reserva
                                ? <span className="text-neutral-500 text-xs">Reserva</span>
                                : <span className="text-blue-400 text-xs">Titular</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Expandido: edição */}
                {editando === insc.id && (
                  <div className="border-t border-neutral-700 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">Nome da equipe</label>
                        <input
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                          value={editNome}
                          onChange={e => setEditNome(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">BattleTag do capitão</label>
                        <input
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                          value={editCapitao}
                          onChange={e => setEditCapitao(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Horários */}
                    <div className="mb-4">
                      <p className="text-xs text-neutral-400 mb-2">Horários</p>
                      <div className="flex gap-2">
                        {HORARIOS.map(h => (
                          <button
                            key={h}
                            onClick={() => toggleHorario(h)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                              editHorarios.includes(h)
                                ? "bg-purple-600 text-white"
                                : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"
                            }`}
                          >
                            {LABEL_HORARIO[h]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dias */}
                    <div className="mb-6">
                      <p className="text-xs text-neutral-400 mb-2">Dias</p>
                      <div className="flex gap-2 flex-wrap">
                        {DIAS.map(d => (
                          <button
                            key={d}
                            onClick={() => toggleDia(d)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                              editDias.includes(d)
                                ? "bg-purple-600 text-white"
                                : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"
                            }`}
                          >
                            {LABEL_DIA[d]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Jogadores */}
                    <p className="text-xs text-neutral-400 mb-3 uppercase tracking-wide">Jogadores</p>
                    <div className="flex flex-col gap-3 mb-6">
                      {editJogadores.map((j, idx) => (
                        <div key={idx} className="bg-neutral-900 rounded-lg p-3 border border-neutral-700">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${j.reserva ? "bg-neutral-700 text-neutral-400" : "bg-blue-900 text-blue-300"}`}>
                              {j.reserva ? "Reserva" : `Titular ${idx + 1}`}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">BattleTag</label>
                              <input
                                className="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                                value={j.battletag}
                                onChange={e => atualizarJogador(idx, "battletag", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">Role</label>
                              <select
                                className="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                                value={j.role}
                                onChange={e => atualizarJogador(idx, "role", e.target.value)}
                              >
                                {["tank","damage","support","flex"].map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">Rank</label>
                              <select
                                className="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                                value={j.rank}
                                onChange={e => atualizarJogador(idx, "rank", e.target.value)}
                              >
                                {RANKS.map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">Discord</label>
                              <input
                                className="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                                value={j.discord ?? ""}
                                onChange={e => atualizarJogador(idx, "discord", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={salvarEdicao}
                      disabled={salvando}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                      {salvando ? "Salvando..." : "Salvar alterações"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}