import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Store, Flag, Search, Pencil, X, Plus,
  ArrowLeft, MapPin, Phone, AtSign, Tag, Download, Trash2,
} from "lucide-react";
import { palette, CATEGORIES, average } from "./lib/constants";
import { useEstablishments, useReviews, establishmentsApi, reviewsApi, addEstablishment, ensureSeeded } from "./lib/store";
import { fetchAnapolisPlaces } from "./lib/osm";

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

export default function AdminApp() {
  useEffect(() => { ensureSeeded(); }, []);

  const establishments = useEstablishments();
  const reviews = useReviews();

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
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const withScore = (e) => ({ ...e, score: average(e.scoreSum, e.scoreCount), count: e.scoreCount });
  const list = useMemo(() => establishments.map(withScore), [establishments]);
  const moderationList = useMemo(() => {
    const flagged = reviews.filter((r) => r.flagged);
    return flagged.map((r) => ({
      ...r,
      place: establishments.find((e) => e.id === r.establishmentId)?.name || "Estabelecimento removido",
    }));
  }, [reviews, establishments]);

  function openEdit(item) {
    setEditingId(item.id);
    setForm({ ...item });
    setSaved(false);
    setShowPromoForm(false);
    setScreen("edit");
  }

  async function saveEdit() {
    await establishmentsApi.update(editingId, {
      name: form.name, category: form.category, address: form.address, phone: form.phone, instagram: form.instagram,
    });
    setSaved(true);
  }

  async function addPromo() {
    if (promoTitle.trim() === "" || promoUntil.trim() === "") return;
    const newPromo = { id: `promo-${Date.now()}`, title: promoTitle.trim(), desc: promoDesc.trim(), until: promoUntil.trim() };
    const updatedPromos = [...(form.promos || []), newPromo];
    setForm((f) => ({ ...f, promos: updatedPromos }));
    await establishmentsApi.update(editingId, { promos: updatedPromos });
    setPromoTitle(""); setPromoDesc(""); setPromoUntil(""); setShowPromoForm(false);
  }

  async function removePromo(promoId) {
    const updatedPromos = form.promos.filter((p) => p.id !== promoId);
    setForm((f) => ({ ...f, promos: updatedPromos }));
    await establishmentsApi.update(editingId, { promos: updatedPromos });
  }

  async function removeEstablishment(id) {
    await establishmentsApi.remove(id);
    setScreen("establishments");
  }

  async function importFromOSM() {
    setImporting(true);
    setImportMessage("");
    try {
      const places = await fetchAnapolisPlaces();
      const existingNames = new Set(establishments.map((e) => e.name.trim().toLowerCase()));
      let added = 0;
      for (const place of places) {
        if (existingNames.has(place.name.trim().toLowerCase())) continue;
        existingNames.add(place.name.trim().toLowerCase());
        await addEstablishment({
          name: place.name,
          category: place.category,
          bairro: place.bairro,
          address: place.address,
          phone: place.phone,
          instagram: place.instagram,
          status: "pendente",
          scoreSum: 0,
          scoreCount: 0,
        });
        added += 1;
      }
      setImportMessage(`${added} lugar(es) novo(s) importado(s) do OpenStreetMap. ${places.length - added} já existiam na base.`);
    } catch (err) {
      setImportMessage(err.message);
    } finally {
      setImporting(false);
    }
  }

  async function removeReview(id) {
    await reviewsApi.remove(id);
  }

  async function keepReview(id) {
    await reviewsApi.update(id, { flagged: false });
  }

  const filtered = list
    .filter((e) => !categoryFilter || e.category === categoryFilter)
    .filter((e) => query === "" || e.name.toLowerCase().includes(query.toLowerCase()));

  const metrics = [
    { label: "Estabelecimentos cadastrados", value: establishments.length },
    { label: "Avaliações registradas", value: reviews.filter((r) => !r.flagged).length },
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
        {moderationList.length > 0 && (
          <p style={{ color: palette.amber, fontSize: 13, fontWeight: 600 }}>
            {moderationList.length} avaliação(ões) aguardando moderação.
          </p>
        )}
      </div>
    );
  }

  function renderEstablishments() {
    return (
      <div>
        <h1 style={{ color: palette.text, fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>Estabelecimentos</h1>
        <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
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
          <button
            onClick={importFromOSM}
            disabled={importing}
            style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", padding: "9px 16px", borderRadius: 12, background: importing ? palette.surfaceAlt : palette.amber, border: "none", color: importing ? palette.textMuted : "#1C1410", fontSize: 12.5, fontWeight: 700, cursor: importing ? "default" : "pointer", whiteSpace: "nowrap" }}
          >
            <Download size={14} /> {importing ? "Importando..." : "Importar do OpenStreetMap"}
          </button>
        </div>
        {importMessage && (
          <p style={{ color: palette.textMuted, fontSize: 12.5, margin: "0 0 14px" }}>{importMessage}</p>
        )}

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
          {filtered.length === 0 && (
            <p style={{ color: palette.textMuted, fontSize: 13, padding: 16 }}>Nenhum estabelecimento encontrado.</p>
          )}
        </div>
      </div>
    );
  }

  function renderEdit() {
    if (!form) return null;
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => setScreen("establishments")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: palette.textMuted, fontSize: 13, cursor: "pointer", padding: 0 }}>
            <ArrowLeft size={15} /> Voltar
          </button>
          <button
            onClick={() => { if (confirm(`Excluir "${form.name}" definitivamente?`)) removeEstablishment(editingId); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${palette.border}`, borderRadius: 10, padding: "6px 12px", color: palette.red, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            <Trash2 size={13} /> Excluir estabelecimento
          </button>
        </div>
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
              <input value={form.address || ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "9px 11px", color: palette.text, fontSize: 13, outline: "none" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ color: palette.textMuted, fontSize: 11.5 }}><Phone size={11} style={{ verticalAlign: -1, marginRight: 3 }} />Telefone</span>
              <input value={form.phone || ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "9px 11px", color: palette.text, fontSize: 13, outline: "none" }} />
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

          {(form.promos || []).length === 0 && !showPromoForm && (
            <p style={{ color: palette.textMuted, fontSize: 12.5, margin: 0 }}>Nenhuma promoção ativa nesse estabelecimento.</p>
          )}

          {(form.promos || []).map((p) => (
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
            <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 14, marginTop: (form.promos || []).length > 0 ? 4 : 0 }}>
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
                {m.flagReason}
              </span>
            </div>
            <p style={{ color: palette.textMuted, fontSize: 12.5, margin: "0 0 14px" }}>{m.comment}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => removeReview(m.id)} style={{ padding: "8px 16px", borderRadius: 10, background: palette.red, border: "none", color: "#1C1410", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                Remover avaliação
              </button>
              <button onClick={() => keepReview(m.id)} style={{ padding: "8px 16px", borderRadius: 10, background: "none", border: `1px solid ${palette.border}`, color: palette.textMuted, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
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
