import { useState, useEffect, useRef, useCallback } from "react";
import hospitalIcon from "../../assets/icons.png";

// ─── BASE URL DE L'API ──────────────────────────────────────
const API_BASE = "http://localhost:5000/api/public";

// ─── HOOK : appel API générique ─────────────────────────────
function useApi(endpoint) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}${endpoint}`)
      .then((r) => r.json())
      .then((json) => { if (!cancelled) { setData(json.data); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [endpoint]);

  return { data, loading, error };
}

// ─── DONNÉES FALLBACK (mode hors-ligne) ─────────────────────
const FALLBACK_PROFESSIONALS = [
  { id: 1,  nom: "Rakoto",   prenom: "Jean",    role: "medecin",        specialite: "Cardiologie",       disponibilite: "available", initiales: "JR", photoUrl: null },
  { id: 2,  nom: "Andria",   prenom: "Sophie",  role: "medecin",        specialite: "Pédiatrie",         disponibilite: "busy",      initiales: "SA", photoUrl: null },
  { id: 3,  nom: "Rabehi",   prenom: "Marc",    role: "medecin",        specialite: "Chirurgie",         disponibilite: "available", initiales: "MR", photoUrl: null },
  { id: 4,  nom: "Hasin",    prenom: "Fatima",  role: "medecin",        specialite: "Neurologie",        disponibilite: "off",       initiales: "FH", photoUrl: null },
  { id: 5,  nom: "Ratsim",   prenom: "Paul",    role: "medecin",        specialite: "Médecine générale", disponibilite: "available", initiales: "PR", photoUrl: null },
  { id: 6,  nom: "Nivo",     prenom: "Hanta",   role: "medecin",        specialite: "Gynécologie",       disponibilite: "available", initiales: "HN", photoUrl: null },
  { id: 7,  nom: "Rabe",     prenom: "Clara",   role: "infirmier",      specialite: "Soins intensifs",   disponibilite: "available", initiales: "CR", photoUrl: null },
  { id: 8,  nom: "Andria",   prenom: "Luc",     role: "infirmier",      specialite: "Pédiatrie",         disponibilite: "busy",      initiales: "LA", photoUrl: null },
  { id: 9,  nom: "Ravel",    prenom: "Marie",   role: "infirmier",      specialite: "Urgences",          disponibilite: "available", initiales: "MR", photoUrl: null },
  { id: 10, nom: "Solo",     prenom: "Aina",    role: "infirmier",      specialite: "Chirurgie",         disponibilite: "available", initiales: "AS", photoUrl: null },
  { id: 11, nom: "Tsara",    prenom: "Voahangy",role: "receptionniste", specialite: "Accueil principal", disponibilite: "available", initiales: "VT", photoUrl: null },
  { id: 12, nom: "Soa",      prenom: "Nirina",  role: "receptionniste", specialite: "Urgences",          disponibilite: "busy",      initiales: "NS", photoUrl: null },
];

const FALLBACK_STATS = {
  medecins:       { total: 24, disponibles: 18, tendance: "+3" },
  infirmiers:     { total: 42, disponibles: 36, tendance: "+7" },
  receptionistes: { total:  8, disponibles:  6, tendance: "-1" },
  pharmaciens:    { total: 12, disponibles: 10, tendance: "+2" },
  patientsWeek:   187,
  satisfactionRate: 98,
};

// ─── CONSTANTES ANNUAIRE ────────────────────────────────────
const AVATAR_COLORS = {
  medecin:        { bg: "#eff6ff", color: "#1d4ed8" },
  infirmier:      { bg: "#f0fdfa", color: "#0f766e" },
  receptionniste: { bg: "#fffbeb", color: "#b45309" },
};

const DISPO_BADGE = {
  available: { cls: "bg-green-50 text-green-800", dot: "bg-green-400", label: "Disponible", pulse: true  },
  busy:      { cls: "bg-amber-50 text-amber-700", dot: "bg-amber-400", label: "Occupé",     pulse: false },
  off:       { cls: "bg-gray-100 text-gray-400",  dot: "bg-gray-400",  label: "Absent",     pulse: false },
};

const ROLE_LABELS = {
  medecin:        "Médecin",
  infirmier:      "Infirmier / Infirmière",
  receptionniste: "Réceptionniste",
};
const ALLOWED_ROLES = ["medecin", "infirmier", "receptionniste"];

const ROLE_ICONS = {
  medecin:        "🩺",
  infirmier:      "💉",
  receptionniste: "💻",
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANTS ATOMIQUES
// ═══════════════════════════════════════════════════════════════

function BtnPrimary({ children, onClick, disabled = false, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-blue-800 font-semibold text-sm hover:bg-blue-50 hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function BtnOutline({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-transparent text-white font-semibold text-sm border border-white/40 hover:bg-white/10 transition-all ${className}`}
    >
      {children}
    </button>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const borderColor = type === "success" ? "border-l-green-400" : "border-l-red-400";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium shadow-xl border-l-4 ${borderColor} animate-[fadeSlideIn_0.3s_ease]`}
      role="status"
    >
      <span className={`text-base ${type === "success" ? "text-green-400" : "text-red-400"}`}>
        {type === "success" ? "✓" : "!"}
      </span>
      {message}
    </div>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function CallModal({ pro, onClose, onConfirm }) {
  if (!pro) return null;

  const colors = AVATAR_COLORS[pro.role] || AVATAR_COLORS.medecin;
  const fullName = `${pro.prenom || ""} ${pro.nom || ""}`.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/55 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-[modalIn_0.2s_ease]">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold"
            style={{ backgroundColor: colors.bg, color: colors.color }}
          >
            {pro.initiales}
          </div>
          <div>
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900">Appel en cours…</h3>
            <p className="text-sm text-gray-400">{pro.specialite}</p>
          </div>
        </div>

        <div className="text-center py-5">
          <div className="relative w-20 h-20 mx-auto mb-4">
            {[0, 400, 800].map((delay, i) => (
              <span
                key={i}
                className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center text-blue-600 text-3xl">📞</div>
          </div>
          <strong className="block text-lg font-semibold text-gray-900 mb-1">{fullName}</strong>
          <p className="text-sm text-gray-500">Connexion en cours avec le service…</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1 : HERO
// ═══════════════════════════════════════════════════════════════
function Hero({ stats, onNavigate }) {
  return (
    <section
      className="relative overflow-hidden text-white py-20 px-8"
      style={{ background: "linear-gradient(135deg, #062d56 0%, #1a6fb5 60%, #3a9fe0 100%)" }}
      aria-label="Bienvenue"
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1
            className="text-4xl lg:text-5xl leading-tight mb-5"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Votre santé,<br />
            <span className="text-blue-200 italic">notre priorité</span>
            <br />au quotidien.
          </h1>
          <p className="text-lg opacity-85 leading-relaxed mb-8 max-w-lg">
            Retrouvez en temps réel l'ensemble des professionnels disponibles, les
            informations pratiques et les ressources d'urgence de l'Hôpital.
          </p>
          <div className="flex gap-3 flex-wrap">
            <BtnPrimary onClick={() => onNavigate("annuaire")}>🔍 Trouver un médecin</BtnPrimary>
            <BtnOutline onClick={() => onNavigate("secours")}>❤️ Premiers secours</BtnOutline>
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-2 gap-3" aria-label="Statistiques rapides">
          {[
            { value: stats?.medecins?.total ?? 24, label: "Médecins actifs",  icon: "🩺" },
            { value: "98%",                         label: "Taux satisfaction", icon: "🛡️" },
            { value: "24/7",                         label: "Service urgences", icon: "⏰" },
          ].map((s, i) => (
            <div key={i} className="bg-white/12 border border-white/20 rounded-xl p-5 backdrop-blur-sm">
              <div className="text-4xl leading-none mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {s.value}
              </div>
              <div className="text-sm opacity-75 flex items-center gap-2">
                <span className="text-base opacity-80">{s.icon}</span>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// BANDEAU URGENCE
// ═══════════════════════════════════════════════════════════════
function UrgenceBanner({ addToast }) {
  const callNumber = (num) => addToast(`Appel du ${num}…`, "success");

  return (
    <div className="bg-red-400 py-5 px-8" role="alert" aria-label="Numéros d'urgence">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center bg-white/20 rounded-full">
            <span className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
            <span className="text-xl">🚨</span>
          </div>
          <p className="text-white font-semibold text-base">
            En cas d'urgence médicale{" "}
            <small className="block text-sm font-normal opacity-80">Appelez immédiatement l'urgence ou Voire les secours</small>
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {[["15", "SAMU"], ["18", "Pompiers"], ["112", "Urgences"]].map(([num, label]) => (
            <button
              key={num}
              onClick={() => callNumber(num)}
              aria-label={`Appeler le ${num}`}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/40 text-white font-bold text-sm rounded-lg hover:bg-white/25 transition-colors"
            >
              📞 {num} — {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2 : TABLEAU DE BORD
// ═══════════════════════════════════════════════════════════════
function Dashboard({ stats }) {
  const s = stats || FALLBACK_STATS;

  const cards = [
    { key: "medecins",       color: "blue",  icon: "🩺", label: "Médecins",        topColor: "#3a9fe0" },
    { key: "infirmiers",     color: "teal",  icon: "💉", label: "Infirmiers",      topColor: "#1db88e" },
    { key: "receptionniste", color: "amber", icon: "👤", label: "Réceptionnistes", topColor: "#f0a820" },
    { key: "pharmaciens",    color: "red",   icon: "💊", label: "Pharmaciens",     topColor: "#e05252" },
  ];

  const iconBg = {
    blue:  "bg-blue-50 text-blue-700",
    teal:  "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    red:   "bg-red-50 text-red-600",
  };

  return (
    <section id="dashboard" className="py-16 px-8 bg-white border-b border-gray-200" aria-labelledby="dash-title">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
            📊 Tableau de bord
          </span>
          <h2 id="dash-title" className="text-3xl lg:text-4xl text-gray-900 mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Professionnels de santé
          </h2>
          <p className="text-gray-500 text-base max-w-xl">
            Données actualisées en temps réel. Vue d'ensemble du personnel médical disponible aujourd'hui.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" role="list" aria-label="Statistiques par catégorie">
          {cards.map((c) => {
            const data = s[c.key] || {};
            const isUp = (data.tendance || "+0").startsWith("+");
            return (
              <article
                key={c.key}
                className="relative bg-gray-50 border border-gray-200 rounded-2xl p-6 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
                role="listitem"
              >
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: c.topColor }} />
                <div className={`absolute top-5 right-5 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {isUp ? "↑" : "↓"} {data.tendance || "—"}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4 ${iconBg[c.color]}`}>{c.icon}</div>
                <div className="text-5xl text-gray-900 leading-none mb-1.5" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {data.total ?? "—"}
                </div>
                <div className="text-sm font-semibold text-gray-600 mb-1">{c.label}</div>
                <div className="text-xs text-gray-400">{data.total ?? "—"} actuellement disponibles</div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3 : ANNUAIRE — hooks & sous-composants
// ═══════════════════════════════════════════════════════════════

// ─── HOOK useAnnuaire ─────────────────────────────────────────
function useAnnuaire({ role, search, dispo, page = 1, limit = 20 }) {
  const [data,       setData]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page, limit });
    if (role && role !== "all") params.set("role", role);
    if (dispo)                  params.set("dispo", dispo);
    if (search)                 params.set("search", search);

    try {
      const res  = await fetch(`${API_BASE}/annuaire?${params}`, { signal: abortRef.current.signal });
      const json = await res.json();

      if (!res.ok || !json.success) throw new Error(json.message || "Erreur serveur");

      const filtered = json.data.filter((p) => ALLOWED_ROLES.includes(p.role));
      setData(filtered);
      // setData(json.data);
      setPagination(json.pagination);
    } catch (err) {
      if (err.name !== "AbortError") {
        // Fallback sur les données locales en cas d'erreur
        const filtered = FALLBACK_PROFESSIONALS.filter((p) => {
          const matchRole   = !role || role === "all" || p.role === role;
          const matchSearch = !search || `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase());
          return matchRole && matchSearch;
        });
        setData(filtered);
        setPagination({ total: filtered.length, totalPages: 1, page: 1 });
        setError(null); // on masque l'erreur car le fallback prend le relai
      }
    } finally {
      setLoading(false);
    }
  }, [role, search, dispo, page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, pagination, loading, error, refetch: fetchData };
}

// ─── Avatar ───────────────────────────────────────────────────
function Avatar({ photoUrl, initiales, role, nom }) {
  const [imgError, setImgError] = useState(false);
  const colors = AVATAR_COLORS[role] || AVATAR_COLORS.medecin;

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={`Photo de ${nom}`}
        onError={() => setImgError(true)}
        className="w-[52px] h-[52px] rounded-full object-cover flex-shrink-0 border border-gray-100"
      />
    );
  }

  return (
    <div
      className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-base font-semibold flex-shrink-0 select-none"
      style={{ backgroundColor: colors.bg, color: colors.color }}
      aria-hidden="true"
    >
      {initiales}
    </div>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-3.5">
        <div className="w-[52px] h-[52px] rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-6 bg-gray-100 rounded-full w-28" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="flex gap-2 mt-1">
        <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
        <div className="w-10 h-9 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

// ─── ProfessionalCard ─────────────────────────────────────────
function ProfessionalCard({ pro, onCall, onMessage }) {
  const badge     = DISPO_BADGE[pro.disponibilite] || DISPO_BADGE.available;
  const canCall   = pro.disponibilite === "available";
  const roleLabel = ROLE_LABELS[pro.role] || pro.role;
  const fullName  = `${pro.prenom || ""} ${pro.nom || ""}`.trim();

  return (
    <article
      className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
      role="listitem"
      aria-label={`${fullName}, ${roleLabel}, ${badge.label}`}
    >
      {/* En-tête : photo / initiales + nom complet */}
      <div className="flex items-center gap-3.5">
        <Avatar
          photoUrl={pro.photoUrl}
          initiales={pro.initiales || `${(pro.prenom || "?")[0]}${(pro.nom || "?")[0]}`}
          role={pro.role}
          nom={fullName}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">{fullName}</div>
          <div className="text-xs text-gray-400 mt-0.5">{roleLabel}</div>
        </div>
      </div>

      {/* Badge disponibilité */}
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold self-start ${badge.cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} ${badge.pulse ? "animate-pulse" : ""}`} />
        {badge.label}
      </span>

      {/* Spécialité */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span aria-hidden="true">{ROLE_ICONS[pro.role] || "👤"}</span>
        {pro.specialite || roleLabel}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
      <button
        onClick={() => onCall(pro)}
        aria-label={`Appeler ${fullName}`}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700"
      >
        📞 Appeler le service
      </button>
        <button
          onClick={() => onMessage(pro)}
          aria-label={`Envoyer un message à ${fullName}`}
          className="flex items-center gap-1 px-3 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-xs hover:bg-gray-200 transition-colors"
        >
          💬
        </button>
      </div>
    </article>
  );
}

// ─── SECTION Annuaire (composant interne, PAS de export default) ──
function Annuaire({ addToast, onCall }) {
  const [filter,          setFilter]          = useState("all");
  const [search,          setSearch]          = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page,            setPage]            = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleFilterChange = (key) => { setFilter(key); setPage(1); };

  const { data: professionals, pagination, loading, error } = useAnnuaire({
    role:   filter,
    search: debouncedSearch,
    page,
    limit:  LIMIT,
  });

  const handleCall    = (pro) => onCall?.(pro);
  const handleMessage = (pro) => {
    const fullName = `${pro.prenom || ""} ${pro.nom || ""}`.trim();
    addToast?.(`Message envoyé à ${fullName}`, "success");
  };

  const FILTERS = [
    { key: "all",            icon: "≡",  label: "Tous"            },
    { key: "medecin",        icon: "🩺", label: "Médecins"        },
    { key: "infirmier",      icon: "❤️", label: "Infirmiers"      },
    { key: "receptionniste", icon: "💻", label: "Réceptionnistes" },
  ];

  return (
    <section id="annuaire" className="py-16 px-8 bg-gray-50" aria-labelledby="annuaire-title">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
            👥 Annuaire
          </span>
          <h2 id="annuaire-title" className="text-3xl lg:text-4xl text-gray-900 mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Personnels disponibles
          </h2>
          <p className="text-gray-500 text-base max-w-xl">
            contactez directement les professionnels disponibles.
          </p>
        </div>

        {/* Filtres + recherche */}
        <div className="flex items-center gap-2 flex-wrap mb-8" role="toolbar" aria-label="Filtres">
          <span className="text-sm text-gray-500 font-medium mr-1">Menu :</span>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              aria-pressed={filter === f.key}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                filter === f.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              <span aria-hidden="true">{f.icon}</span> {f.label}
            </button>
          ))}

          <div className="ml-auto flex items-center bg-white border border-gray-200 rounded-full px-4 py-1.5 gap-2">
            <span className="text-gray-400 text-sm" aria-hidden="true">🔍</span>
            <input
              type="search"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher un professionnel"
              className="outline-none bg-transparent text-sm text-gray-800 placeholder-gray-400 w-40"
            />
          </div>
        </div>

        {/* Compteur */}
        {!loading && !error && (
          <p className="text-sm text-gray-400 mb-4">
             professionnels trouvé
          </p>
        )}

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm mb-6" role="alert">
            ⚠️ {error}
          </div>
        )}

        {/* Grille */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          role="list"
          aria-label="Liste des professionnels"
          aria-busy={loading}
        >
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : professionals.length === 0 ? (
            <p className="col-span-full text-center text-gray-400 text-sm py-10">Aucun professionnel trouvé.</p>
          ) : (
            professionals.map((pro) => (
              <ProfessionalCard
                key={pro.id}
                pro={pro}
                onCall={handleCall}
                onMessage={handleMessage}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10" role="navigation" aria-label="Pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Page précédente"
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Précédent
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    aria-label={`Page ${item}`}
                    aria-current={page === item ? "page" : undefined}
                    className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
                      page === item
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              aria-label="Page suivante"
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4 : INFORMATIONS GÉNÉRALES
// ═══════════════════════════════════════════════════════════════
function InfoBlock({ icon, iconCls, title, children }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 flex gap-4 items-start hover:shadow-sm transition-shadow">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${iconCls}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
        {children}
      </div>
    </div>
  );
}

function Informations({ addToast }) {
  const horaires = [
    { jour: "Aujourd'hui",  heures: "08h00 – 20h00 ✓", isToday: true  },
    { jour: "Lundi – Ven.", heures: "07h30 – 20h30",   isToday: false },
    { jour: "Samedi",       heures: "08h00 – 18h00",   isToday: false },
    { jour: "Dimanche",     heures: "09h00 – 13h00",   isToday: false },
    { jour: "Urgences",     heures: "24h/24 — 7j/7",   isToday: false, bold: true },
  ];

  const urgences = [
    { num: "15",               label: "SAMU — Urgences médicales" },
    { num: "18",               label: "Pompiers — Secours"        },
    { num: "112",              label: "Numéro d'urgence"          },
    { num: "+261 20 123 4567", label: "Standard de l'hôpital"     },
  ];

  return (
    <section id="infos" className="py-16 px-8 bg-white border-t border-b border-gray-200" aria-labelledby="infos-title">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
            ℹ️ Informations pratiques
          </span>
          <h2 id="infos-title" className="text-3xl lg:text-4xl text-gray-900 mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Info - HospitalMada
          </h2>
          <p className="text-gray-500 text-base max-w-xl">Tout ce dont vous avez besoin pour préparer votre visite ou contacter nos services.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col gap-5">
            <InfoBlock icon="🕐" iconCls="bg-blue-50 text-blue-600" title="Horaires d'ouverture">
              <table className="w-full" aria-label="Horaires d'ouverture">
                <tbody>
                  {horaires.map((h) => (
                    <tr key={h.jour} className={h.isToday ? "text-blue-600 font-semibold" : ""}>
                      <td className={`py-1 w-28 text-sm ${h.isToday ? "text-blue-400" : "text-gray-500"}`}>{h.jour}</td>
                      <td className={`py-1 text-sm ${h.bold ? "font-semibold text-gray-900" : ""}`}>{h.heures}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </InfoBlock>

            <InfoBlock icon="📞" iconCls="bg-red-50 text-red-600" title="Numéros d'urgence">
              <div className="flex flex-col gap-2">
                {urgences.map((u) => (
                  <div key={u.num} className="flex items-center gap-3">
                    <span className="text-red-600 font-bold min-w-[52px]" style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.3rem" }} aria-label={`Numéro ${u.num}`}>
                      {u.num}
                    </span>
                    <span className="text-sm text-gray-500">{u.label}</span>
                  </div>
                ))}
              </div>
            </InfoBlock>

            <InfoBlock icon="🏥" iconCls="bg-teal-50 text-teal-600" title="Services proposés">
              <p className="text-sm text-gray-700 leading-relaxed">
                Médecine générale · Chirurgie · Pédiatrie · Cardiologie · Radiologie · Pharmacie ·
                Laboratoire d'analyses · Kinésithérapie · Maternité · Soins intensifs
              </p>
            </InfoBlock>

            <InfoBlock icon="🚌" iconCls="bg-amber-50 text-amber-600" title="Accès & Stationnement">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong className="text-gray-900">Bus :</strong> &quot;HospitalMada&quot;<br />
                <strong className="text-gray-900">Parking :</strong> Gratuit<br />
                <strong className="text-gray-900">PMR :</strong> Accès handicapés disponible
              </p>
            </InfoBlock>
          </div>

          {/* Carte simulée */}
          <div
            className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-4 text-blue-600"
            style={{
              height: "380px",
              background: "#e8f4fd",
              border: "1px solid #c3e0f9",
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(58,159,224,.06) 40px, rgba(58,159,224,.06) 41px),
                repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(58,159,224,.06) 40px, rgba(58,159,224,.06) 41px)
              `,
            }}
            role="img"
            aria-label="Carte de localisation de l'hôpital"
          >
            <div
              className="relative w-14 h-14 flex items-center justify-center shadow-lg z-10"
              style={{ background: "#1a6fb5", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", boxShadow: "0 4px 16px rgba(26,111,181,.35)" }}
            >
              <span style={{ transform: "rotate(45deg)", color: "#fff", fontSize: "1.4rem" }}>
                <img src={hospitalIcon} alt="Hospital" className="mt-3 w-8 h-8 mb-4" />
              </span>
            </div>
            <div className="text-center z-10">
              <p className="font-semibold text-blue-800">HospitalMada</p>
              <small className="text-blue-600 text-xs block mt-0.5">Antsirabe 110</small>
            </div>
            <button
              onClick={() => addToast("Ouverture de la carte...", "success")}
              className="z-10 flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
              aria-label="Voir sur Google Maps"
            >
              🔗 Voir sur la carte
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5 : PREMIERS SECOURS
// ═══════════════════════════════════════════════════════════════
const SECOURS = [
  {
    icon: "💔", iconCls: "bg-red-600", title: "Arrêt cardiaque (RCP)", sub: "Massage cardiaque externe", numCls: "bg-red-600",
    steps: [
      { t: "Sécurisez la scène",         d: "Vérifiez l'absence de danger avant d'approcher la victime."                     },
      { t: "Appelez le 15 immédiatement",d: "Restez en ligne et suivez les instructions du régulateur."                      },
      { t: "Vérifiez la conscience",     d: "Tapotez les épaules et appelez la victime à voix forte."                        },
      { t: "Position correcte",          d: "Allongez la victime sur une surface dure, sur le dos."                          },
      { t: "Compressions",               d: "30 compressions au centre du thorax, profondeur 5–6 cm, rythme 100–120/min."    },
      { t: "Ventilation",                d: "2 insufflations (si formé). Sinon, continuez les compressions sans ventilation." },
    ],
    warn: "Ne jamais arrêter le massage jusqu'à l'arrivée des secours ou la reprise d'une activité cardiaque.",
  },
  {
    icon: "🧑‍⚕️", iconCls: "bg-blue-600", title: "Position Latérale de Sécurité", sub: "Personne inconsciente qui respire", numCls: "bg-blue-600",
    steps: [
      { t: "Appelez le 15",      d: "Signalez la situation et restez auprès de la victime."                    },
      { t: "Retirez les objets", d: "Lunettes, ceinture, objets volumineux dans les poches."                   },
      { t: "Genou fléchi",       d: "Pliez le genou du côté où vous allez la tourner, à 90°."                 },
      { t: "Main sous la joue",  d: "Placez le bras sous la tête pour maintenir les voies aériennes."          },
      { t: "Tournez doucement",  d: "Faites basculer vers vous pour la mettre sur le côté."                    },
      { t: "Ouvrez la bouche",   d: "Libérez les voies aériennes et vérifiez la respiration régulièrement."   },
    ],
    tip: "La PLS évite l'étouffement par les vomissements. Surveiller la respiration en continu.",
  },
  {
    icon: "💧", iconCls: "bg-amber-400", title: "Hémorragie grave", sub: "Saignement abondant", numCls: "bg-amber-400",
    steps: [
      { t: "Protégez-vous",         d: "Si possible, portez des gants ou utilisez un sac plastique."            },
      { t: "Appelez le 15",         d: "Indiquez la localisation et la nature de la blessure."                  },
      { t: "Compression directe",   d: "Appuyez fort avec un linge propre sur la plaie sans relâcher."          },
      { t: "Allongez la victime",   d: "Couchez-la et surélevez les membres si possible."                       },
      { t: "Maintenez la pression", d: "Sans jamais relâcher, jusqu'à l'arrivée des secours."                   },
    ],
    warn: "Ne jamais retirer un objet planté. Compresser autour sans le mobiliser.",
  },
  {
    icon: "🔥", iconCls: "bg-teal-600", title: "Brûlure & Étouffement", sub: "Deux urgences fréquentes", numCls: "bg-teal-600",
    steps: [
      { t: "Refroidir immédiatement",    d: "Eau tiède (15–25°C) en continu pendant 15 minutes minimum."              },
      { t: "Ne pas percer les cloques",  d: "Couvrir d'un pansement propre non adhérent."                             },
      { t: "Appelez le 15",             d: "Pour toute brûlure étendue, profonde ou au visage."                      },
      { t: "5 claques dans le dos",      d: "Entre les omoplates, talons de main, penché en avant."                   },
      { t: "Heimlich si inefficace",     d: "Bras autour du ventre, poing au-dessus du nombril, 5 compressions."      },
      { t: "Alternez et appelez le 15",  d: "Jusqu'à expulsion ou perte de conscience (→ RCP)."                      },
    ],
  },
];

function PremiersSecours() {
  return (
    <section id="secours" className="py-16 px-8 bg-white" aria-labelledby="secours-title">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
            ❤️ Guide d'urgence
          </span>
          <h2 id="secours-title" className="text-3xl lg:text-4xl text-gray-900 mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Premiers secours
          </h2>
          <p className="text-gray-500 text-base max-w-xl">En cas d'accident survenu loin de l'hôpital, ces consignes peuvent sauver une vie.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SECOURS.map((card, ci) => (
            <article key={ci} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 p-5">
                <div className={`w-[46px] h-[46px] ${card.iconCls} rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{card.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                </div>
              </div>
              <div className="px-5 pb-5">
                <div className="flex flex-col gap-3">
                  {card.steps.map((step, si) => (
                    <div key={si} className="flex gap-3 items-start">
                      <div className={`w-[26px] h-[26px] ${card.numCls} text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        {si + 1}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        <strong className="text-gray-900 font-semibold">{step.t}</strong>{" "}— {step.d}
                      </p>
                    </div>
                  ))}
                </div>
                {card.warn && (
                  <div className="flex items-start gap-2 mt-4 bg-red-50 border border-red-100 rounded-lg p-3">
                    <span className="text-red-500 text-base flex-shrink-0 mt-0.5">⚠️</span>
                    <p className="text-xs text-red-600 leading-relaxed">{card.warn}</p>
                  </div>
                )}
                {card.tip && (
                  <div className="flex items-start gap-2 mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <span className="text-blue-600 text-base flex-shrink-0 mt-0.5">ℹ️</span>
                    <p className="text-xs text-blue-800 leading-relaxed">{card.tip}</p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer className="bg-gray-900 text-white/60 pt-12 pb-8 px-8" role="contentinfo">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 font-semibold text-white text-base mb-3">
              <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center text-lg">
                <img src={hospitalIcon} alt="Hospital" className="mt-3 w-8 h-8 mb-4" />
              </div>
              HospitalMada
            </div>
            <p className="text-sm leading-relaxed max-w-64">
              Un établissement de santé engagé pour l'excellence médicale et le bien-être de chaque patient, 24h/24 et 7j/7.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-4">Contact</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><a href="tel:+261201234567" className="hover:text-white transition-colors">+261 20 123 4567</a></li>
              <li><a href="mailto:contact@hopital.mg" className="hover:text-white transition-colors">contact@hopital.mg</a></li>
              <li><a href="#annuaire" className="hover:text-white transition-colors">Prendre rendez-vous</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-4">Urgences</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><a href="tel:15"  className="hover:text-white transition-colors">15 — SAMU</a></li>
              <li><a href="tel:18"  className="hover:text-white transition-colors">18 — Pompiers</a></li>
              <li><a href="tel:112" className="hover:text-white transition-colors">112 — Secours</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs">© {new Date().getFullYear()} HospitaMada. Tous droits réservés.</p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="text-white/50 hover:text-white transition-colors">Mentions légales</a>
            <a href="#" className="text-white/50 hover:text-white transition-colors">Confidentialité</a>
            <a href="#" className="text-white/50 hover:text-white transition-colors">Accessibilité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL (seul export default du fichier)
// ═══════════════════════════════════════════════════════════════
export default function HopitalPortail() {
  // ─── TOASTS ────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── MODAL APPEL ───────────────────────────────────────────
  const [callPro, setCallPro] = useState(null);

  const handleCall = (pro) => setCallPro(pro);

  const confirmCall = async () => {
    if (!callPro) return;
    const fullName = `${callPro.prenom || ""} ${callPro.nom || ""}`.trim();
    try {
      const res  = await fetch(`${API_BASE}/professionals/${callPro.id}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName: "Patient", motif: "Consultation" }),
      });
      const json = await res.json();
      addToast(json.message || `Connexion établie avec ${fullName}`, "success");
    } catch {
      addToast(`Connexion établie avec ${fullName}`, "success");
    }
    setCallPro(null);
  };

  // ─── DONNÉES API ───────────────────────────────────────────
  const { data: statsData } = useApi("/statsPublic");

  // ─── SCROLL NAV ────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showBackTop,   setShowBackTop]   = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowBackTop(window.scrollY > 400);
      const ids = ["dashboard", "annuaire", "infos", "secours"];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) { setActiveSection(id); break; }
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navigateTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const navItems = [
    { id: "dashboard", icon: "📊", label: "Tableau de bord"  },
    { id: "annuaire",  icon: "👥", label: "Annuaire"         },
    { id: "infos",     icon: "ℹ️", label: "Informations"     },
    { id: "secours",   icon: "❤️", label: "Premiers secours" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Serif+Display:ital@0;1&display=swap');
        @keyframes fadeSlideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes modalIn     { from { opacity:0; transform:scale(.95);       } to { opacity:1; transform:scale(1);    } }
        body { font-family: 'DM Sans', system-ui, sans-serif; }
        ::-webkit-scrollbar       { width:6px; height:6px; }
        ::-webkit-scrollbar-thumb { background:#e2e6ef; border-radius:3px; }
      `}</style>

      <div className="min-h-screen flex flex-col bg-gray-50">

        {/* ── NAVBAR ──────────────────────────────────────────── */}
        <nav
          className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-8"
          role="navigation"
          aria-label="Navigation principale"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
            <a
              href="#"
              className="flex items-center gap-2.5 text-base font-semibold text-blue-800 no-underline"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              aria-label="HospitalMada — Accueil"
            >
              <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center text-white text-lg">
                <img src={hospitalIcon} alt="Hospital" className="mt-3 w-8 h-8 mb-4" />
              </div>
              HospitalMada
            </a>

            <ul className="hidden lg:flex items-center gap-1 list-none" aria-label="Menu principal">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => navigateTo(item.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === item.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <button
                className="lg:hidden text-gray-500 text-xl"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menu"
                aria-expanded={menuOpen}
              >
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="lg:hidden pb-4 border-t border-gray-100 pt-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                >
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* ── CONTENU ─────────────────────────────────────────── */}
        <main className="flex-1">
          <Hero
            stats={statsData || FALLBACK_STATS}
            onNavigate={navigateTo}
          />
          <UrgenceBanner addToast={addToast} />
          <Dashboard stats={statsData || FALLBACK_STATS} />
          {/* ✅ Annuaire appelé comme composant JSX normal */}
          <Annuaire addToast={addToast} onCall={handleCall} />
          <Informations addToast={addToast} />
          <PremiersSecours />
        </main>

        <Footer />

        {/* Back to top */}
        {showBackTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 left-6 z-30 w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-800 transition-all"
            aria-label="Retour en haut de page"
          >
            ↑
          </button>
        )}

        {callPro && (
          <CallModal
            pro={callPro}
            onClose={() => setCallPro(null)}
            onConfirm={confirmCall}
          />
        )}

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </>
  );
}
