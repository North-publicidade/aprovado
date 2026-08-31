import { useState } from "react";
import {
  LayoutDashboard, Store, Flag, Search, Pencil, X, Plus,
  ArrowLeft, MapPin, Phone, AtSign, Tag,
} from "lucide-react";

const palette = {
  bg: "#15100C",
  sidebar: "#1B1510",
  surface: "#221A13",
  surfaceAlt: "#2B2118",
  border: "#3A2E22",
  text: "#F3E9DA",
  textMuted: "#B9A88E",
  amber: "#E0A83E",
  green: "#7A9B6E",
  red: "#C4685A",
};

const CATEGORIES = ["Pizzaria", "Hamburgueria", "Japonês", "Cafeteria", "Comida brasileira", "Doceria"];

const initialEstablishments = [
  { id: 1, name: "Hambúrgueria do Beto", category: "Hamburgueria", status: "aprovado", score: 9.2, count: 143,
    address: "Rua dos Andradas, 540 - Centro", phone: "(51) 3225-4410", instagram: "@hamburgueriadobeto",
    promos: [{ id: 1, title: "Terça é dia de dobro", desc: "Compre 1 lanche e leve 2 na terça-feira", until: "30/09/2026" }] },
  { id: 2, name: "Sushi Kaito", category: "Japonês", status: "aprovado", score: 8.7, count: 89,
    address: "Rua Padre Chagas, 88 - Moinhos de Vento", phone: "(51) 3346-2290", instagram: "@sushikaito", promos: [] },
  { id: 3, name: "Pizzaria Napoli", category: "Pizzaria", status: "aprovado", score: 9.5, count: 210,
    address: "Av. Cristóvão Colombo, 1200 - Floresta", phone: "(51) 3311-7788", instagram: "@pizzarianapoli.poa", promos: [] },
  { id: 4, name: "Café da Vó", category: "Cafeteria", status: "aprovado", score: 8.9, count: 67,
    address: "Rua João Alfredo, 320 - Bom Fim", phone: "(51) 3222-1156", instagram: "@cafedavopoa", promos: [] },
  { id: 5, name: "Boteco do Zé", category: "Comida brasileira", status: "aprovado", score: 8.4, count: 156,
    address: "Rua João Alfredo, 720 - Cidade Baixa", phone: "(51) 3212-9034", instagram: null, promos: [] },
  { id: 6, name: "Doceria Flor de Mel", category: "Doceria", status: "aprovado", score: 9.1, count: 52,
    address: "Av. Cel. Lucas de Oliveira, 95 - Petrópolis", phone: "(51) 3339-4471", instagram: "@flordemeldoceria", promos: [] },
  { id: 101, name: "Espaço Verde Vegano", category: "Comida brasileira", status: "pendente", score: 9, count: 1,
    address: "endereço ainda não informado", phone: "—", instagram: null, promos: [] },
  { id: 102, name: "Hot Dog do Marcão", category: "Hamburgueria", status: "pendente", score: 8.5, count: 2,
    address: "endereço ainda não informado", phone: "—", instagram: null, promos: [] },
];

const initialModeration = [
  { id: 1, place: "Boteco do Zé", author: "usuário anônimo", score: 0, comment: "Comentário removido pelo filtro automático por linguagem inadequada.", reason: "Linguagem inadequada" },
  { id: 2, place: "Sushi Kaito", author: "conta_nova_123", score: 10, comment: "Mesma conta avaliou 8 lugares em 2 minutos — padrão típico de avaliação em massa.", reason: "Possível avaliação falsa" },
];

const activity = [
  { text: "Ana avaliou Pizzaria Napoli com nota 10", time: "há 12 min" },
  { text: "Novo lugar cadastrado: Espaço Verde Vegano", time: "há 48 min" },
  { text: "Hot Dog do Marcão recebeu a 2ª avaliação", time: "há 1h" },
  { text: "Avaliação de Sushi Kaito sinalizada para revisão", time: "há 3h" },
];

function StatusPill({ status }) {
  const isAprovado = status === "aprovado";
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
      background: isAprovado ? "rgba(122,155,110,0.15)" : "rgba(224,168,62,0.15)",
      color: isAprovado ? palette.green : palette.amber,
    }}>
      {isAprovado ? "aprovado" : "quase lá"}
    </span>
  );
}

function NavItem({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer",
        background: active ? palette.surfaceAlt : "transparent",
        color: active ? palette.amber : palette.textMuted,
        fontSize: 13.5, fontWeight: 600, textAlign: "left",
      }}
    >
      <Icon size={17} strokeWidth={1.9} />
      {label}
    </button>
  );
}

export default function AdminPanel() {
  const [establishments, setEstablishments] = useState(initialEstablishments);
  const [moderationList, setModerationList] = useState(initialModeration);
  const [screen, setScreen] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDesc, setPromoDesc] = useState("");
  const [promoUntil, setPromoUntil] = useState("");

  function openEdit(item) {
    setEditingId(item.id);
    setForm({ ...item });
    setSaved(false);
    setShowPromoForm(false);
    setScreen("edit");
  }

  function saveEdit() {
    setEstablishments((prev) => prev.map((e) => (e.id === editingId ? { ...e, ...form } : e)));
    setSaved(true);
  }

  function addPromo() {
    if (promoTitle.trim() === "" || promoUntil.trim() === "") return;
    const newPromo = { id: Date.now(), title: promoTitle.trim(), desc: promoDesc.trim(), until: promoUntil.trim() };
    const updatedPromos = [...form.promos, newPromo];
    setForm((f) => ({ ...f, promos: updatedPromos }));
    setEstablishments((prev) => prev.map((e) => (e.id === editingId ? { ...e, promos: updatedPromos } : e)));
    setPromoTitle(""); setPromoDesc(""); setPromoUntil(""); setShowPromoForm(false);
  }

  function removePromo(promoId) {
    const updatedPromos = form.promos.filter((p) => p.id !== promoId);
    setForm((f) => ({ ...f, promos: updatedPromos }));
    setEstablishments((prev) => prev.map((e) => (e.id === editingId ? { ...e, promos: updatedPromos } : e)));
  }

  function resolveModeration(id) {
    setModerationList((prev) => prev.filter((m) => m.id !== id));
  }

  const filtered = establishments
    .filter((e) => !categoryFilter || e.category === categoryFilter)
    .filter((e) => query === "" || e.name.toLowerCase().includes(query.toLowerCase()));

  const metrics = [
    { label: "Usuários ativos (30 dias)", value: "1.482" },
    { label: "Avaliações essa semana", value: "96" },
    { label: "Estabelecimentos aprovados", value: establishments.filter((e) => e.status === "aprovado").length },
    { label: "Quase lá", value: establishments.filter((e) => e.status === "pendente").length },
  ];

  function renderDashboard() {
    return (
      <div>
        <h1 style={{ color: palette.text, fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>Visão geral</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {metrics.map((m) => (
            <div key={m.label} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: 16 }}>
              <p style={{ color: palette.textMuted, fontSize: 12, margin: "0 0 8px" }}>{m.label}</p>
              <p style={{ color: palette.text, fontSize: 26, fontWeight: 700, margin: 0 }}>{m.value}</p>
            </div>
          ))}
        </div>
        <p style={{ color: palette.text, fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Atividade recente</p>
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14 }}>
          {activity.map((a, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "13px 16px", borderBottom: i < activity.length - 1 ? `1px solid ${palette.border}` : "none" }}>
              <span style={{ color: palette.text, fontSize: 13 }}>{a.text}</span>
              <span style={{ color: palette.textMuted, fontSize: 12 }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderEstablishments() {
    return (
      <div>
        <h1 style={{ color: palette.text, fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>Estabelecimentos</h1>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 12, padding: "9px 12px", flex: 1, maxWidth: 320 }}>
            <Search size={15} color={palette.textMuted} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome"
              style={{ background: "none", border: "none", outline: "none", color: palette.text, fontSize: 13, width: "100%" }}
            />
          </div>
          <select
            value={categoryFilter || ""}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
            style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 12, padding: "9px 12px", color: palette.text, fontSize: 13 }}
          >
            <option value="">Todas as categorias</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", padding: "10px 16px", borderBottom: `1px solid ${palette.border}` }}>
            {["Nome", "Categoria", "Status", "Nota", "Avaliações", ""].map((h) => (
              <span key={h} style={{ color: palette.textMuted, fontSize: 11.5, fontWeight: 600 }}>{h}</span>
            ))}
          </div>
          {filtered.map((e) => (
            <div key={e.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", padding: "13px 16px", alignItems: "center", borderBottom: `1px solid ${palette.border}` }}>
              <span style={{ color: palette.text, fontSize: 13.5, fontWeight: 600 }}>{e.name}</span>
              <span style={{ color: palette.textMuted, fontSize: 12.5 }}>{e.category}</span>
              <span><StatusPill status={e.status} /></span>
              <span style={{ color: e.score >= 8 ? palette.green : palette.amber, fontSize: 13, fontWeight: 700 }}>{e.score.toFixed(1)}</span>
              <span style={{ color: palette.textMuted, fontSize: 12.5 }}>{e.count}</span>
              <button
                onClick={() => openEdit(e)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${palette.border}`, borderRadius: 10, padding: "6px 12px", color: palette.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                <Pencil size={13} /> Editar
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderEdit() {
    if (!form) return null;
    return (
      <div>
        <button onClick={() => setScreen("establishments")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: palette.textMuted, fontSize: 13, marginBottom: 16, cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={15} /> Voltar
        </button>
        <h1 style={{ color: palette.text, fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>{form.name}</h1>

        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
          <p style={{ color: palette.text, fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Dados do estabelecimento</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ color: palette.textMuted, fontSize: 11.5 }}>Nome</span>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "9px 11px", color: palette.text, fontSize: 13, outline: "none" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ color: palette.textMuted, fontSize: 11.5 }}>Categoria</span>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "9px 11px", color: palette.text, fontSize: 13 }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: "1 / span 2" }}>
              <span style={{ color: palette.textMuted, fontSize: 11.5 }}><MapPin size={11} style={{ verticalAlign: -1, marginRight: 3 }} />Endereço</span>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "9px 11px", color: palette.text, fontSize: 13, outline: "none" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ color: palette.textMuted, fontSize: 11.5 }}><Phone size={11} style={{ verticalAlign: -1, marginRight: 3 }} />Telefone</span>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "9px 11px", color: palette.text, fontSize: 13, outline: "none" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ color: palette.textMuted, fontSize: 11.5 }}><AtSign size={11} style={{ verticalAlign: -1, marginRight: 3 }} />Instagram</span>
              <input value={form.instagram || ""} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="@usuario" style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "9px 11px", color: palette.text, fontSize: 13, outline: "none" }} />
            </label>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <button onClick={saveEdit} style={{ padding: "10px 20px", borderRadius: 12, background: palette.amber, border: "none", color: "#1C1410", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Salvar alterações
            </button>
            {saved && <span style={{ color: palette.green, fontSize: 12.5 }}>Alterações salvas.</span>}
          </div>
        </div>

        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ color: palette.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Promoções</p>
            <button onClick={() => setShowPromoForm((s) => !s)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${palette.border}`, borderRadius: 10, padding: "6px 12px", color: palette.amber, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={13} /> Nova promoção
            </button>
          </div>

          {form.promos.length === 0 && !showPromoForm && (
            <p style={{ color: palette.textMuted, fontSize: 12.5, margin: 0 }}>Nenhuma promoção ativa nesse estabelecimento.</p>
          )}

          {form.promos.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: palette.surfaceAlt, borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <Tag size={15} color={palette.amber} style={{ marginTop: 2 }} />
                <div>
                  <p style={{ color: palette.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{p.title}</p>
                  {p.desc && <p style={{ color: palette.textMuted, fontSize: 12, margin: "3px 0 0" }}>{p.desc}</p>}
                  <p style={{ color: palette.textMuted, fontSize: 11, margin: "3px 0 0" }}>válida até {p.until}</p>
                </div>
              </div>
              <button onClick={() => removePromo(p.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={15} color={palette.textMuted} />
              </button>
            </div>
          ))}

          {showPromoForm && (
            <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 14, marginTop: form.promos.length > 0 ? 4 : 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} placeholder="Título (ex: Terça em dobro)" style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "9px 11px", color: palette.text, fontSize: 13, outline: "none" }} />
                <input value={promoUntil} onChange={(e) => setPromoUntil(e.target.value)} placeholder="Válida até (ex: 30/09/2026)" style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "9px 11px", color: palette.text, fontSize: 13, outline: "none" }} />
              </div>
              <input value={promoDesc} onChange={(e) => setPromoDesc(e.target.value)} placeholder="Descrição (opcional)" style={{ width: "100%", background: palette.surfaceAlt, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "9px 11px", color: palette.text, fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
              <button onClick={addPromo} style={{ padding: "9px 18px", borderRadius: 10, background: palette.amber, border: "none", color: "#1C1410", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                Adicionar promoção
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderModeration() {
    return (
      <div>
        <h1 style={{ color: palette.text, fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>Moderação</h1>
        {moderationList.length === 0 && (
          <p style={{ color: palette.textMuted, fontSize: 13 }}>Nenhuma avaliação sinalizada no momento.</p>
        )}
        {moderationList.map((m) => (
          <div key={m.id} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <p style={{ color: palette.text, fontSize: 13.5, fontWeight: 600, margin: 0 }}>{m.place}</p>
                <p style={{ color: palette.textMuted, fontSize: 12, margin: "2px 0 0" }}>por {m.author} · nota {m.score}</p>
              </div>
              <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "rgba(196,104,90,0.15)", color: palette.red, height: "fit-content" }}>
                {m.reason}
              </span>
            </div>
            <p style={{ color: palette.textMuted, fontSize: 12.5, margin: "0 0 14px" }}>{m.comment}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => resolveModeration(m.id)} style={{ padding: "8px 16px", borderRadius: 10, background: palette.red, border: "none", color: "#1C1410", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                Remover avaliação
              </button>
              <button onClick={() => resolveModeration(m.id)} style={{ padding: "8px 16px", borderRadius: 10, background: "none", border: `1px solid ${palette.border}`, color: palette.textMuted, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                Manter
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const screens = { dashboard: renderDashboard, establishments: renderEstablishments, edit: renderEdit, moderation: renderModeration };

  return (
    <div style={{ minHeight: "100vh", background: palette.bg, display: "flex", fontFamily: "system-ui, -apple-system, sans-serif", minWidth: 900 }}>
      <div style={{ width: 220, background: palette.sidebar, borderRight: `1px solid ${palette.border}`, padding: "22px 14px", flexShrink: 0 }}>
        <p style={{ fontFamily: "Georgia, serif", color: palette.text, fontSize: 20, fontWeight: 700, margin: "0 0 2px" }}>Aprovado</p>
        <p style={{ color: palette.textMuted, fontSize: 11.5, margin: "0 0 24px" }}>painel administrativo</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <NavItem label="Visão geral" icon={LayoutDashboard} active={screen === "dashboard"} onClick={() => setScreen("dashboard")} />
          <NavItem label="Estabelecimentos" icon={Store} active={screen === "establishments" || screen === "edit"} onClick={() => setScreen("establishments")} />
          <NavItem label="Moderação" icon={Flag} active={screen === "moderation"} onClick={() => setScreen("moderation")} />
        </div>
      </div>
      <div style={{ flex: 1, padding: "28px 32px" }}>
        {screens[screen]()}
      </div>
    </div>
  );
}
