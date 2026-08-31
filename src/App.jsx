import { useEffect, useMemo, useState } from "react";
import {
  Search, MapPin, ChevronLeft, Plus, Home, User,
  Lock, Phone, AtSign, List, Check,
} from "lucide-react";
import { palette, CATEGORY_META, CATEGORIES, MIN_SCORE, MIN_COUNT, TAG_OPTIONS, average } from "./lib/constants";
import { useEstablishments, useReviews, useLists, addEstablishment, addReview, addList, establishmentsApi, listsApi, ensureSeeded } from "./lib/store";

function getDisplayName() {
  try {
    return localStorage.getItem("aprovado:displayName") || "Você";
  } catch {
    return "Você";
  }
}

function setDisplayName(name) {
  try {
    localStorage.setItem("aprovado:displayName", name);
  } catch {
    /* localStorage indisponível */
  }
}

function Stamp({ score, size = 82 }) {
  const approved = score >= 8;
  const color = approved ? palette.green : palette.amber;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${color}`, position: "relative",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", transform: "rotate(-6deg)", flexShrink: 0,
    }}>
      <div style={{ position: "absolute", inset: 5, borderRadius: "50%", border: `1px dashed ${color}`, opacity: 0.55 }} />
      <span style={{ fontFamily: "Georgia, serif", fontSize: size * 0.28, fontWeight: 700, color, lineHeight: 1 }}>
        {score.toFixed(1)}
      </span>
      <span style={{ fontFamily: "system-ui, sans-serif", fontSize: size * 0.1, letterSpacing: "0.08em", color, marginTop: 3 }}>
        {approved ? "aprovado" : "bom"}
      </span>
    </div>
  );
}

function CategoryIcon({ category, size = 22, color }) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return <Icon size={size} color={color || "#fff"} strokeWidth={1.8} />;
}

function Chip({ label, active, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
        padding: "8px 14px", borderRadius: 999,
        border: `1px solid ${active ? palette.amber : palette.border}`,
        background: active ? palette.amber : "transparent",
        color: active ? "#1C1410" : palette.textMuted,
        fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", cursor: "pointer",
      }}
    >
      {Icon && <Icon size={14} strokeWidth={2} />}
      {label}
    </button>
  );
}

function EstablishmentRow({ item, onClick, locked }) {
  const meta = CATEGORY_META[item.category];
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        padding: "12px 14px", borderRadius: 16, marginBottom: 10,
        background: palette.surface, border: `1px solid ${palette.border}`,
        textAlign: "left", cursor: "pointer", opacity: locked ? 0.7 : 1,
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 12, background: meta.color,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <CategoryIcon category={item.category} size={22} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: palette.text, fontSize: 14.5, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.name}
        </p>
        <p style={{ color: palette.textMuted, fontSize: 12.5, margin: "2px 0 0" }}>
          {item.category} · {item.bairro}
        </p>
      </div>
      {locked ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
          <Lock size={16} color={palette.textMuted} />
          <span style={{ fontSize: 10.5, color: palette.textMuted }}>faltam {item.needed}</span>
        </div>
      ) : (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ color: item.score >= 8 ? palette.green : palette.amber, fontSize: 16, fontWeight: 700, margin: 0 }}>
            {item.score.toFixed(1)}
          </p>
          <p style={{ color: palette.textMuted, fontSize: 11, margin: 0 }}>{item.count} avaliações</p>
        </div>
      )}
    </button>
  );
}

function ScreenHeader({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 16px 4px" }}>
      {onBack && (
        <button onClick={onBack} style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}>
          <ChevronLeft size={22} color={palette.text} />
        </button>
      )}
      <h1 style={{ color: palette.text, fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h1>
    </div>
  );
}

export default function App() {
  useEffect(() => { ensureSeeded(); }, []);

  const establishments = useEstablishments();
  const reviews = useReviews();
  const lists = useLists();

  const [listDetail, setListDetail] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [listAddQuery, setListAddQuery] = useState("");
  const [screen, setScreen] = useState("home");
  const [activeTab, setActiveTab] = useState("home");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [rateQuery, setRateQuery] = useState("");
  const [rateTarget, setRateTarget] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [pickedScore, setPickedScore] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [confirmInfo, setConfirmInfo] = useState(null);
  const [myName, setMyName] = useState(getDisplayName());

  const withReviewStats = (e) => ({
    ...e,
    score: average(e.scoreSum, e.scoreCount),
    count: e.scoreCount,
    reviews: reviews.filter((r) => r.establishmentId === e.id && !r.flagged),
  });

  const publicList = useMemo(
    () => establishments.filter((e) => e.status === "aprovado").map(withReviewStats),
    [establishments, reviews]
  );

  const pendingList = useMemo(
    () => establishments
      .filter((e) => e.status === "pendente")
      .map((e) => ({ ...e, needed: Math.max(0, MIN_COUNT - e.scoreCount) })),
    [establishments]
  );

  const myCount = reviews.filter((r) => r.author === myName && !r.flagged).length;

  function goHome() {
    setScreen("home"); setActiveTab("home"); setRateQuery("");
    setRateTarget(null); setPickedScore(null); setSelectedTags([]); setDetailItem(null); setDraftName("");
  }

  function openDetail(item) {
    const fresh = publicList.find((e) => e.id === item.id) || item;
    setDetailItem(fresh);
    setScreen("detail");
  }

  function openList(list) { setListDetail(list.id); setScreen("listDetail"); }

  async function toggleVisited(placeId) {
    const list = lists.find((l) => l.id === listDetail);
    if (!list) return;
    const visited = list.visited.includes(placeId)
      ? list.visited.filter((x) => x !== placeId)
      : [...list.visited, placeId];
    await listsApi.update(listDetail, { visited });
  }

  async function addPlaceToList(placeId) {
    const list = lists.find((l) => l.id === listDetail);
    if (!list) return;
    await listsApi.update(listDetail, { placeIds: [...list.placeIds, placeId] });
    setListAddQuery("");
  }

  async function createList() {
    if (newListName.trim() === "") return;
    const id = await addList({ name: newListName.trim() });
    setNewListName("");
    setListDetail(id);
    setScreen("listDetail");
  }

  function startRate(mode, data) {
    setRateTarget({ mode, data }); setPickedScore(null); setSelectedTags([]); setScreen("score"); setActiveTab("avaliar");
  }

  function pickCategory(cat) {
    const draft = { name: draftName || rateQuery, category: cat, bairro: "sua indicação" };
    startRate("new", draft);
  }

  async function submitScore(tags) {
    if (pickedScore == null) return;
    const chosenTags = tags || [];
    const author = myName || "Você";

    if (rateTarget.mode === "new") {
      const newId = await addEstablishment({
        name: rateTarget.data.name,
        category: rateTarget.data.category,
        bairro: rateTarget.data.bairro,
        address: "", phone: "", instagram: null,
        status: "pendente", scoreSum: pickedScore, scoreCount: 1, tags: chosenTags,
      });
      await addReview({ establishmentId: newId, author, score: pickedScore, tags: chosenTags });
      setConfirmInfo({ variant: "new", name: rateTarget.data.name, score: pickedScore, needed: MIN_COUNT - 1 });
    } else {
      const item = rateTarget.data;
      const newSum = item.scoreSum + pickedScore;
      const newCount = item.scoreCount + 1;
      const newAvg = Math.round(average(newSum, newCount) * 10) / 10;
      const mergedTags = Array.from(new Set([...(item.tags || []), ...chosenTags]));

      if (item.status === "pendente" && newCount >= MIN_COUNT && newAvg >= MIN_SCORE) {
        await establishmentsApi.update(item.id, {
          status: "aprovado", scoreSum: newSum, scoreCount: newCount, tags: mergedTags,
        });
        setConfirmInfo({ variant: "graduated", name: item.name, score: newAvg });
      } else if (item.status === "pendente") {
        await establishmentsApi.update(item.id, { scoreSum: newSum, scoreCount: newCount, tags: mergedTags });
        setConfirmInfo({ variant: "pending", name: item.name, score: pickedScore, needed: Math.max(0, MIN_COUNT - newCount) });
      } else {
        await establishmentsApi.update(item.id, { scoreSum: newSum, scoreCount: newCount, tags: mergedTags });
        setConfirmInfo({ variant: "public", name: item.name, score: newAvg });
      }
      await addReview({ establishmentId: item.id, author, score: pickedScore, tags: chosenTags });
    }
    setScreen("confirm");
  }

  const filteredPublic = publicList
    .filter((e) => (!activeCategory || e.category === activeCategory))
    .filter((e) => query === "" || e.name.toLowerCase().includes(query.toLowerCase()) || e.category.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.score - a.score);

  const filteredPending = pendingList.filter((e) => !activeCategory || e.category === activeCategory);

  const rateMatches = rateQuery.length > 0
    ? establishments
        .filter((e) => e.name.toLowerCase().includes(rateQuery.toLowerCase()))
        .map((e) => ({ ...e, _mode: e.status === "aprovado" ? "public" : "pending", score: average(e.scoreSum, e.scoreCount), count: e.scoreCount }))
    : [];

  function renderHome() {
    return (
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ padding: "18px 0 12px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "Georgia, serif", color: palette.text, fontSize: 26, fontWeight: 700, margin: 0 }}>Aprovado</p>
            <p style={{ color: palette.textMuted, fontSize: 12.5, margin: "2px 0 0" }}>só indico o que é bom</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: palette.textMuted, fontSize: 12 }}>
            <MapPin size={13} />
            Anápolis
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: "10px 12px", marginBottom: 14 }}>
          <Search size={16} color={palette.textMuted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou tipo de comida"
            style={{ background: "none", border: "none", outline: "none", color: palette.text, fontSize: 13.5, width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
          <Chip label="Todas" active={!activeCategory} onClick={() => setActiveCategory(null)} />
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={activeCategory === c} onClick={() => setActiveCategory(c)} icon={CATEGORY_META[c].icon} />
          ))}
        </div>

        <p style={{ color: palette.text, fontSize: 14, fontWeight: 600, margin: "0 0 10px" }}>
          {activeCategory ? `${activeCategory} bem avaliadas` : "Mais bem avaliados perto de você"}
        </p>

        {filteredPublic.length === 0 && (
          <p style={{ color: palette.textMuted, fontSize: 13, margin: "0 0 16px" }}>Nada por aqui ainda com esse filtro.</p>
        )}
        {filteredPublic.map((item) => (
          <EstablishmentRow key={item.id} item={item} onClick={() => openDetail(item)} />
        ))}

        {filteredPending.length > 0 && (
          <>
            <p style={{ color: palette.textMuted, fontSize: 13, fontWeight: 600, margin: "18px 0 10px" }}>Quase lá — em avaliação</p>
            {filteredPending.map((item) => (
              <EstablishmentRow key={item.id} item={item} locked onClick={() => startRate("pending", item)} />
            ))}
          </>
        )}
      </div>
    );
  }

  function renderDetail() {
    const item = detailItem;
    const meta = CATEGORY_META[item.category];
    return (
      <div>
        <ScreenHeader title="" onBack={() => { setScreen("home"); setActiveTab("home"); }} />
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ height: 110, borderRadius: 18, background: meta.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <CategoryIcon category={item.category} size={40} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <p style={{ color: palette.text, fontSize: 19, fontWeight: 700, margin: 0 }}>{item.name}</p>
              <p style={{ color: palette.textMuted, fontSize: 13, margin: "3px 0 0" }}>{item.category} · {item.bairro}</p>
              <p style={{ color: palette.textMuted, fontSize: 12, margin: "6px 0 0" }}>{item.count} avaliações</p>
            </div>
            <Stamp score={item.score} />
          </div>

          <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: 12, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <MapPin size={15} color={palette.textMuted} />
              <span style={{ color: palette.text, fontSize: 12.5 }}>{item.address || "endereço ainda não informado"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Phone size={15} color={palette.textMuted} />
              <span style={{ color: palette.text, fontSize: 12.5 }}>{item.phone || "—"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AtSign size={15} color={palette.textMuted} />
              {item.instagram ? (
                <span style={{ color: palette.amber, fontSize: 12.5, fontWeight: 600 }}>{item.instagram}</span>
              ) : (
                <span style={{ color: palette.textMuted, fontSize: 12.5, fontStyle: "italic" }}>ainda sem Instagram cadastrado — sugerir</span>
              )}
            </div>
          </div>

          {item.tags && item.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
              {item.tags.map((tag) => (
                <span key={tag} style={{ padding: "5px 10px", borderRadius: 999, background: palette.surfaceAlt, color: palette.textMuted, fontSize: 11.5 }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p style={{ color: palette.text, fontSize: 14, fontWeight: 600, margin: "0 0 10px" }}>O que dizem</p>
          {item.reviews.length === 0 && (
            <p style={{ color: palette.textMuted, fontSize: 12.5, margin: "0 0 10px" }}>Nenhuma avaliação com comentário ainda.</p>
          )}
          {item.reviews.map((r) => (
            <div key={r.id} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: palette.text, fontSize: 13, fontWeight: 600 }}>{r.author}</span>
                <span style={{ color: r.score >= 8 ? palette.green : palette.amber, fontSize: 13, fontWeight: 700 }}>{r.score}</span>
              </div>
              {r.comment && <p style={{ color: palette.textMuted, fontSize: 12.5, margin: 0 }}>{r.comment}</p>}
            </div>
          ))}

          <button
            onClick={() => startRate("public", item)}
            style={{ width: "100%", marginTop: 12, padding: "13px 0", borderRadius: 14, background: palette.amber, border: "none", color: "#1C1410", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            Avaliar esse lugar
          </button>
        </div>
      </div>
    );
  }

  function renderAvaliar() {
    return (
      <div style={{ padding: "0 16px 16px" }}>
        <ScreenHeader title="Avaliar um lugar" />
        <div style={{ padding: "8px 0 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: "10px 12px" }}>
            <Search size={16} color={palette.textMuted} />
            <input
              value={rateQuery}
              onChange={(e) => setRateQuery(e.target.value)}
              placeholder="Digite o nome do estabelecimento"
              style={{ background: "none", border: "none", outline: "none", color: palette.text, fontSize: 13.5, width: "100%" }}
            />
          </div>
        </div>

        {rateQuery === "" && (
          <p style={{ color: palette.textMuted, fontSize: 13, lineHeight: 1.6 }}>
            Procure o lugar que você quer avaliar. Se ele ainda não existir na base, você é quem cadastra — a nota dele nasce a partir da sua avaliação.
          </p>
        )}

        {rateQuery !== "" && rateMatches.map((item) => (
          <EstablishmentRow
            key={item.id}
            item={item._mode === "pending" ? { ...item, needed: Math.max(0, MIN_COUNT - item.scoreCount) } : item}
            locked={item._mode === "pending"}
            onClick={() => startRate(item._mode, item)}
          />
        ))}

        {rateQuery.length > 1 && rateMatches.length === 0 && (
          <div style={{ background: palette.surface, border: `1px dashed ${palette.border}`, borderRadius: 14, padding: 16, textAlign: "center" }}>
            <p style={{ color: palette.textMuted, fontSize: 13, margin: "0 0 12px" }}>
              Não encontramos "{rateQuery}" na base.
            </p>
            <button
              onClick={() => { setDraftName(rateQuery); setScreen("categoryPick"); }}
              style={{ padding: "10px 18px", borderRadius: 12, background: palette.amber, border: "none", color: "#1C1410", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Cadastrar "{rateQuery}"
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderCategoryPick() {
    return (
      <div style={{ padding: "0 16px 16px" }}>
        <ScreenHeader title="Que tipo de lugar é?" onBack={() => setScreen("avaliar")} />
        <p style={{ color: palette.textMuted, fontSize: 13, margin: "8px 0 16px" }}>{draftName || rateQuery}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c];
            return (
              <button
                key={c}
                onClick={() => pickCategory(c)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "18px 8px", borderRadius: 16, background: palette.surface, border: `1px solid ${palette.border}`, cursor: "pointer" }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: meta.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CategoryIcon category={c} size={20} />
                </div>
                <span style={{ color: palette.text, fontSize: 12.5, fontWeight: 600, textAlign: "center" }}>{c}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderScore() {
    const target = rateTarget.data;
    const meta = CATEGORY_META[target.category];
    const backTo = rateTarget.mode === "new" ? "categoryPick" : detailItem ? "detail" : "avaliar";
    return (
      <div style={{ padding: "0 16px 16px" }}>
        <ScreenHeader title="Sua nota" onBack={() => setScreen(backTo)} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 20px" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CategoryIcon category={target.category} size={18} />
          </div>
          <div>
            <p style={{ color: palette.text, fontSize: 14.5, fontWeight: 600, margin: 0 }}>{target.name}</p>
            <p style={{ color: palette.textMuted, fontSize: 12, margin: 0 }}>{target.category}</p>
          </div>
        </div>

        <p style={{ color: palette.textMuted, fontSize: 12.5, margin: "0 0 10px" }}>De 0 a 10, quanto esse lugar merece?</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 22 }}>
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              onClick={() => setPickedScore(n)}
              style={{
                padding: "14px 0", borderRadius: 12, cursor: "pointer",
                background: pickedScore === n ? palette.amber : palette.surface,
                border: `1px solid ${pickedScore === n ? palette.amber : palette.border}`,
                color: pickedScore === n ? "#1C1410" : palette.text,
                fontSize: 15, fontWeight: 700,
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          onClick={() => setScreen("tags")}
          disabled={pickedScore == null}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 14, border: "none",
            background: pickedScore == null ? palette.surfaceAlt : palette.amber,
            color: pickedScore == null ? palette.textMuted : "#1C1410",
            fontSize: 14, fontWeight: 700, cursor: pickedScore == null ? "default" : "pointer",
          }}
        >
          Continuar
        </button>
      </div>
    );
  }

  function renderTags() {
    return (
      <div style={{ padding: "0 16px 16px" }}>
        <ScreenHeader title="Quer marcar mais alguma coisa?" onBack={() => setScreen("score")} />
        <p style={{ color: palette.textMuted, fontSize: 12.5, margin: "8px 0 16px" }}>Opcional — sobre o ambiente e a experiência, não sobre a comida.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {TAG_OPTIONS.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => setSelectedTags((t) => (active ? t.filter((x) => x !== tag) : [...t, tag]))}
                style={{
                  padding: "9px 14px", borderRadius: 999, cursor: "pointer",
                  border: `1px solid ${active ? palette.amber : palette.border}`,
                  background: active ? palette.amber : "transparent",
                  color: active ? "#1C1410" : palette.text,
                  fontSize: 12.5, fontWeight: 500,
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => submitScore([])}
            style={{ flex: 1, padding: "13px 0", borderRadius: 14, background: "none", border: `1px solid ${palette.border}`, color: palette.textMuted, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
          >
            Pular
          </button>
          <button
            onClick={() => submitScore(selectedTags)}
            style={{ flex: 1, padding: "13px 0", borderRadius: 14, background: palette.amber, border: "none", color: "#1C1410", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
          >
            Concluir
          </button>
        </div>
      </div>
    );
  }

  function renderConfirm() {
    const info = confirmInfo;
    const messages = {
      new: "Você é a primeira pessoa a avaliar esse lugar. Quando mais " + info.needed + " avaliações com nota 7 ou mais chegarem, ele entra na lista pública.",
      pending: info.needed > 0
        ? "Avaliação somada. Faltam " + info.needed + " avaliações para esse lugar entrar na lista pública."
        : "Avaliação somada — esse lugar está quase entrando na lista pública.",
      graduated: "Com essa avaliação, " + info.name + " atingiu a nota mínima e acabou de entrar na lista pública.",
      public: "Sua nota foi somada à média desse lugar.",
    };
    return (
      <div style={{ padding: "40px 16px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Stamp score={info.score} size={100} />
        <p style={{ color: palette.text, fontSize: 16, fontWeight: 700, margin: "20px 0 6px", textAlign: "center" }}>
          Avaliação enviada
        </p>
        <p style={{ color: palette.textMuted, fontSize: 13, textAlign: "center", lineHeight: 1.6, margin: "0 0 28px" }}>
          {messages[info.variant]}
        </p>
        <button
          onClick={goHome}
          style={{ padding: "12px 26px", borderRadius: 14, background: palette.amber, border: "none", color: "#1C1410", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  function renderProfile() {
    return (
      <div style={{ padding: "0 16px 16px" }}>
        <ScreenHeader title="Perfil" />
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 20px" }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: palette.amber, display: "flex", alignItems: "center", justifyContent: "center", color: "#1C1410", fontWeight: 700, fontSize: 18 }}>
            {(myName || "V")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <input
              value={myName}
              onChange={(e) => { setMyName(e.target.value); setDisplayName(e.target.value || "Você"); }}
              placeholder="Seu nome"
              style={{ background: "none", border: "none", outline: "none", color: palette.text, fontSize: 15, fontWeight: 700, padding: 0, width: "100%" }}
            />
            <p style={{ color: palette.textMuted, fontSize: 12.5, margin: "2px 0 0" }}>{myCount} avaliações enviadas</p>
          </div>
        </div>
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: 14 }}>
          <p style={{ color: palette.textMuted, fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
            Cada avaliação sua ajuda a manter essa lista só com lugares que valem a pena. Nada aparece aqui sem passar pelo crivo de quem realmente foi comer.
          </p>
        </div>
      </div>
    );
  }

  function renderLists() {
    return (
      <div style={{ padding: "0 16px 16px" }}>
        <ScreenHeader title="Suas listas" />
        <p style={{ color: palette.textMuted, fontSize: 12.5, margin: "8px 0 16px" }}>
          Listas que você monta com quem quiser, pra combinar o próximo rolê.
        </p>
        {lists.map((list) => {
          const places = list.placeIds.map((id) => publicList.find((e) => e.id === id)).filter(Boolean);
          return (
            <button
              key={list.id}
              onClick={() => openList(list)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 14, borderRadius: 16, marginBottom: 10, background: palette.surface, border: `1px solid ${palette.border}`, textAlign: "left", cursor: "pointer" }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: palette.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <List size={20} color={palette.amber} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: palette.text, fontSize: 14.5, fontWeight: 600, margin: 0 }}>{list.name}</p>
                <p style={{ color: palette.textMuted, fontSize: 12, margin: "2px 0 0" }}>{list.members.join(", ")} · {places.length} lugares</p>
              </div>
            </button>
          );
        })}
        <button
          onClick={() => setScreen("listCreate")}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px 0", borderRadius: 14, background: "none", border: `1px dashed ${palette.border}`, color: palette.textMuted, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
        >
          <Plus size={16} /> Criar lista
        </button>
      </div>
    );
  }

  function renderListCreate() {
    return (
      <div style={{ padding: "0 16px 16px" }}>
        <ScreenHeader title="Nova lista" onBack={() => setScreen("lists")} />
        <p style={{ color: palette.textMuted, fontSize: 12.5, margin: "8px 0 14px" }}>
          Dá um nome pra lista — depois é só convidar quem você quiser.
        </p>
        <input
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="Ex: Rolê de sexta"
          style={{ width: "100%", background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: "12px 14px", color: palette.text, fontSize: 14, marginBottom: 16, outline: "none" }}
        />
        <button
          onClick={createList}
          disabled={newListName.trim() === ""}
          style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: "none", background: newListName.trim() === "" ? palette.surfaceAlt : palette.amber, color: newListName.trim() === "" ? palette.textMuted : "#1C1410", fontSize: 14, fontWeight: 700, cursor: newListName.trim() === "" ? "default" : "pointer" }}
        >
          Criar lista
        </button>
      </div>
    );
  }

  function renderListDetail() {
    const list = lists.find((l) => l.id === listDetail);
    if (!list) return null;
    const places = list.placeIds.map((id) => publicList.find((e) => e.id === id)).filter(Boolean);
    const toGo = places.filter((p) => !list.visited.includes(p.id));
    const visited = places.filter((p) => list.visited.includes(p.id));
    const addMatches = listAddQuery.length > 0
      ? publicList.filter((e) => !list.placeIds.includes(e.id) && e.name.toLowerCase().includes(listAddQuery.toLowerCase()))
      : [];

    return (
      <div style={{ padding: "0 16px 16px" }}>
        <ScreenHeader title={list.name} onBack={() => { setListDetail(null); setScreen("lists"); }} />
        <div style={{ display: "flex", alignItems: "center", margin: "8px 0 18px" }}>
          {list.members.map((m, i) => (
            <div key={i} style={{ width: 26, height: 26, borderRadius: "50%", background: palette.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", color: palette.textMuted, fontSize: 11, fontWeight: 700, marginLeft: i === 0 ? 0 : -8, border: `2px solid ${palette.bg}` }}>
              {m[0]}
            </div>
          ))}
          <span style={{ color: palette.textMuted, fontSize: 12, marginLeft: 8 }}>{list.members.join(", ")}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 14, padding: "10px 12px", marginBottom: 12 }}>
          <Search size={16} color={palette.textMuted} />
          <input
            value={listAddQuery}
            onChange={(e) => setListAddQuery(e.target.value)}
            placeholder="Adicionar um lugar aprovado à lista"
            style={{ background: "none", border: "none", outline: "none", color: palette.text, fontSize: 13.5, width: "100%" }}
          />
        </div>
        {addMatches.map((e) => (
          <button
            key={e.id}
            onClick={() => addPlaceToList(e.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 12, marginBottom: 8, background: palette.surfaceAlt, border: "none", textAlign: "left", cursor: "pointer" }}
          >
            <Plus size={14} color={palette.amber} />
            <span style={{ color: palette.text, fontSize: 13 }}>{e.name}</span>
          </button>
        ))}

        {toGo.length > 0 && (
          <>
            <p style={{ color: palette.text, fontSize: 13, fontWeight: 600, margin: "10px 0 8px" }}>Pra ir</p>
            {toGo.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, marginBottom: 8, background: palette.surface, border: `1px solid ${palette.border}` }}>
                <button onClick={() => openDetail(p)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: CATEGORY_META[p.category].color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CategoryIcon category={p.category} size={17} />
                  </div>
                  <span style={{ color: palette.text, fontSize: 13.5, fontWeight: 600 }}>{p.name}</span>
                </button>
                <button onClick={() => toggleVisited(p.id)} style={{ background: "none", border: `1px solid ${palette.border}`, borderRadius: 10, padding: 6, cursor: "pointer" }}>
                  <Check size={15} color={palette.textMuted} />
                </button>
              </div>
            ))}
          </>
        )}

        {visited.length > 0 && (
          <>
            <p style={{ color: palette.textMuted, fontSize: 13, fontWeight: 600, margin: "14px 0 8px" }}>Já fomos</p>
            {visited.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, marginBottom: 8, background: palette.surfaceAlt, opacity: 0.7 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: CATEGORY_META[p.category].color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CategoryIcon category={p.category} size={17} />
                </div>
                <span style={{ flex: 1, color: palette.textMuted, fontSize: 13.5, fontWeight: 600, textDecoration: "line-through" }}>{p.name}</span>
                <button onClick={() => toggleVisited(p.id)} style={{ background: palette.green, border: "none", borderRadius: 10, padding: 6, cursor: "pointer" }}>
                  <Check size={15} color="#1C1410" />
                </button>
              </div>
            ))}
          </>
        )}

        {places.length === 0 && <p style={{ color: palette.textMuted, fontSize: 13 }}>Ainda sem lugares nessa lista. Busca aí em cima pra adicionar.</p>}
      </div>
    );
  }

  const screens = {
    home: renderHome,
    detail: renderDetail,
    avaliar: renderAvaliar,
    categoryPick: renderCategoryPick,
    score: renderScore,
    tags: renderTags,
    confirm: renderConfirm,
    profile: renderProfile,
    lists: renderLists,
    listCreate: renderListCreate,
    listDetail: renderListDetail,
  };

  const showNav = ["home", "avaliar", "profile", "detail", "lists", "listDetail"].includes(screen);

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 50% 0%, #241A12 0%, #0F0B08 70%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 12px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ width: 380, height: 780, background: palette.bg, borderRadius: 44, border: "8px solid #0B0805", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 120, height: 22, background: "#0B0805", borderRadius: 12, margin: "10px auto 0", flexShrink: 0 }} />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {screens[screen]()}
        </div>
        {showNav && (
          <div style={{ display: "flex", borderTop: `1px solid ${palette.border}`, background: palette.bg, flexShrink: 0 }}>
            {[
              { key: "home", label: "Início", icon: Home },
              { key: "avaliar", label: "Avaliar", icon: Plus },
              { key: "lists", label: "Listas", icon: List },
              { key: "profile", label: "Perfil", icon: User },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === "home") goHome();
                  else if (tab.key === "avaliar") { setRateQuery(""); setScreen("avaliar"); }
                  else if (tab.key === "lists") { setListDetail(null); setScreen("lists"); }
                  else setScreen("profile");
                }}
                style={{ flex: 1, background: "none", border: "none", padding: "10px 0 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
              >
                <tab.icon size={20} color={activeTab === tab.key ? palette.amber : palette.textMuted} strokeWidth={activeTab === tab.key ? 2.2 : 1.8} />
                <span style={{ fontSize: 10.5, color: activeTab === tab.key ? palette.amber : palette.textMuted, fontWeight: activeTab === tab.key ? 700 : 500 }}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
