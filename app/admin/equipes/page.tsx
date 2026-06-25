"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "https://web-production-aeb1b.up.railway.app";

interface Equipe {
  id: number;
  nome: string;
  nome_capitao: string;
  email_capitao: string | null;
  grupo: string | null;
  fase_atual: string;
  vitorias: number;
  derrotas: number;
}

export default function AdminEquipesPage() {
  const router = useRouter();
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [nome, setNome] = useState("");
  const [nomeCapitao, setNomeCapitao] = useState("");
  const [emailCapitao, setEmailCapitao] = useState("");
  const [senhaTemporaria, setSenhaTemporaria] = useState("");
  const [enviando, setEnviando] = useState(false);

  const getToken = () => localStorage.getItem("stadium_token") ?? "";

  useEffect(() => {
    const cargo = localStorage.getItem("stadium_cargo");
    if (!getToken() || cargo !== "admin") {
      router.replace("/");
      return;
    }
    buscarEquipes();
  }, [router]);

  const buscarEquipes = async () => {
    setCarregando(true);
    try {
      const res = await fetch(`${API}/api/equipes/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      const dados = await res.json();
      setEquipes(dados);
    } catch {
      setErro("Erro ao carregar equipes.");
    } finally {
      setCarregando(false);
    }
  };

  const cadastrar = async () => {
    if (!nome || !nomeCapitao || !emailCapitao || !senhaTemporaria) {
      setErro("Preencha todos os campos.");
      return;
    }
    setEnviando(true);
    setErro("");
    setSucesso("");

    try {
      const res = await fetch(`${API}/api/equipes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          nome,
          nome_capitao: nomeCapitao,
          email_capitao: emailCapitao,
          senha_temporaria: senhaTemporaria,
        }),
      });

      const dados = await res.json();

      if (res.ok) {
        setSucesso(`Equipe "${dados.nome}" cadastrada com sucesso.`);
        setNome("");
        setNomeCapitao("");
        setEmailCapitao("");
        setSenhaTemporaria("");
        buscarEquipes();
      } else {
        setErro(dados.detail || "Erro ao cadastrar equipe.");
      }
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setEnviando(false);
    }
  };

  const remover = async (id: number, nomeEquipe: string) => {
    if (!confirm(`Remover a equipe "${nomeEquipe}"? Isso não pode ser desfeito.`)) return;

    try {
      const res = await fetch(`${API}/api/equipes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setSucesso(`Equipe "${nomeEquipe}" removida.`);
        buscarEquipes();
      }
    } catch {
      setErro("Erro ao remover equipe.");
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-10 text-fg">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="relative overflow-hidden rounded-2xl border border-line-strong mb-10">
          <div className="absolute inset-0 hero-grad" />
          <div className="relative p-6 md:p-8 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-display text-2xl font-bold text-background"
                style={{ background: "var(--grad-blue, #218ffe)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
                  <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-ow-blue font-semibold">
                  Painel do Organizador
                </p>
                <h1 className="text-display text-3xl md:text-4xl font-bold uppercase">
                  Gerenciar <span className="text-ow-blue">Equipes</span>
                </h1>
              </div>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="text-sm font-semibold border border-line-strong hover:border-ow-blue hover:text-ow-blue text-fg-muted px-4 py-2 rounded-lg transition-colors"
            >
              ← Voltar ao Menu
            </button>
          </div>
        </header>

        {/* Alertas */}
        {erro && (
          <div className="surface-card border-l-4 border-danger text-danger p-5 mb-8 rounded-lg font-semibold flex items-center gap-3">
            <span>⚠</span> {erro}
          </div>
        )}
        {sucesso && (
          <div className="surface-card border-l-4 border-success text-success p-5 mb-8 rounded-lg font-semibold flex items-center gap-3">
            <span>✓</span> {sucesso}
          </div>
        )}

        {/* Formulário de cadastro */}
        <div className="surface-card p-6 md:p-8 rounded-2xl border border-line-strong mb-10">
          <h2 className="text-display text-xl font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <span className="text-ow-blue">✦</span> Cadastrar Nova Equipe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Nome da equipe</label>
              <input
                className="w-full px-4 py-3 bg-background border border-line-strong rounded-lg text-fg focus:outline-none focus:border-ow-blue transition-colors placeholder:text-fg-muted/50"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Frost Wolves"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Nome do capitão</label>
              <input
                className="w-full px-4 py-3 bg-background border border-line-strong rounded-lg text-fg focus:outline-none focus:border-ow-blue transition-colors placeholder:text-fg-muted/50"
                value={nomeCapitao}
                onChange={(e) => setNomeCapitao(e.target.value)}
                placeholder="Ex: PlayerOne"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Email do capitão</label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-background border border-line-strong rounded-lg text-fg focus:outline-none focus:border-ow-blue transition-colors placeholder:text-fg-muted/50"
                value={emailCapitao}
                onChange={(e) => setEmailCapitao(e.target.value)}
                placeholder="capitao@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Senha temporária</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-background border border-line-strong rounded-lg text-fg focus:outline-none focus:border-ow-blue transition-colors placeholder:text-fg-muted/50"
                value={senhaTemporaria}
                onChange={(e) => setSenhaTemporaria(e.target.value)}
                placeholder="Para o capitão logar"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={cadastrar}
              disabled={enviando}
              className="bg-ow-blue text-background font-bold uppercase tracking-wider py-3 px-8 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 w-full md:w-auto"
            >
              {enviando ? "Cadastrando..." : "Cadastrar Equipe"}
            </button>
          </div>
        </div>

        {/* Lista de equipes */}
        <div className="surface-card p-6 md:p-8 rounded-2xl border border-line-strong overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-display text-xl font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="text-ow-blue">✦</span> Equipes Cadastradas
            </h2>
            <span className="bg-background border border-line-strong text-fg-muted px-3 py-1 rounded-full text-xs font-bold">
              {equipes.length} TIMES
            </span>
          </div>

          {carregando ? (
            <div className="text-center py-10 text-fg-muted animate-pulse font-semibold uppercase tracking-wider">
              Carregando dados...
            </div>
          ) : equipes.length === 0 ? (
            <div className="text-center py-10 text-fg-muted border-2 border-dashed border-line-strong rounded-xl">
              Nenhuma equipe cadastrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-fg-muted border-b border-line-strong">
                    <th className="pb-3 px-3 font-semibold">ID</th>
                    <th className="pb-3 px-3 font-semibold">Equipe</th>
                    <th className="pb-3 px-3 font-semibold">Capitão</th>
                    <th className="pb-3 px-3 font-semibold">Email</th>
                    <th className="pb-3 px-3 font-semibold">Grupo</th>
                    <th className="pb-3 px-3 font-semibold">Fase</th>
                    <th className="pb-3 px-3 font-semibold">Desempenho</th>
                    <th className="pb-3 px-3 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {equipes.map((equipe) => (
                    <tr key={equipe.id} className="border-b border-line-strong/30 hover:bg-line-strong/10 transition-colors group">
                      <td className="py-4 px-3 text-fg-muted font-mono">{equipe.id}</td>
                      <td className="py-4 px-3 font-bold text-fg">{equipe.nome}</td>
                      <td className="py-4 px-3 text-fg-muted">{equipe.nome_capitao}</td>
                      <td className="py-4 px-3 text-fg-muted">{equipe.email_capitao ?? "—"}</td>
                      <td className="py-4 px-3">
                        {equipe.grupo ? (
                          <span className="bg-ow-blue/10 border border-ow-blue/30 text-ow-blue px-2 py-1 rounded text-xs font-bold uppercase">
                            {equipe.grupo}
                          </span>
                        ) : (
                          <span className="text-fg-muted/50">—</span>
                        )}
                      </td>
                      <td className="py-4 px-3 text-fg-muted">{equipe.fase_atual}</td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-1">
                          <span className="text-success font-bold">{equipe.vitorias}V</span>
                          <span className="text-fg-muted/50">/</span>
                          <span className="text-danger font-bold">{equipe.derrotas}D</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <button
                          onClick={() => remover(equipe.id, equipe.nome)}
                          className="text-xs font-bold uppercase tracking-wider text-danger/70 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}