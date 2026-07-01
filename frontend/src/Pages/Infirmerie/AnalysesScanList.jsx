// components/AnalysesScanList.jsx
// Tableau de bord React pour visualiser toutes les analyses Flutter
// À intégrer dans votre dashboard infirmier ou médecin

import { useState, useEffect } from "react";

const BASE_URL = "http://localhost:5000/api";

const SEVERITE_STYLE = {
  critique: "bg-red-100 text-red-800 border-red-200",
  eleve:    "bg-orange-100 text-orange-800 border-orange-200",
  modere:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  faible:   "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUT_STYLE = {
  en_attente: "bg-yellow-100 text-yellow-700",
  validee:    "bg-green-100 text-green-700",
  archivee:   "bg-gray-100 text-gray-500",
};

export function AnalysesScanList() {
  const [analyses, setAnalyses]   = useState([]);
  const [total,    setTotal]      = useState(0);
  const [page,     setPage]       = useState(1);
  const [loading,  setLoading]    = useState(true);
  const [filtre,   setFiltre]     = useState(""); // statut filter
  const [detail,   setDetail]     = useState(null); // analyse ouverte

  const charger = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filtre) params.set("statut", filtre);

      const res  = await fetch(`${BASE_URL}/analyses?${params}`);
      const data = await res.json();
      setAnalyses(data.analyses || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, [page, filtre]);

  const valider = async (id, statut) => {
    try {
      await fetch(`${BASE_URL}/analyses/${id}/valider`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      charger();
      if (detail?.id === id) setDetail(null);
    } catch (err) {
      console.error(err);
    }
  };

  const scoreColor = (score) => {
    if (score >= 0.8) return "text-red-600";
    if (score >= 0.5) return "text-orange-500";
    return "text-teal-600";
  };

  return (
    <div className="flex flex-col gap-4">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">
            📱 Analyses mobiles
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {total} analyse(s) reçues depuis l'application Flutter
          </p>
        </div>

        {/* Filtre statut */}
        <select
          value={filtre}
          onChange={e => { setFiltre(e.target.value); setPage(1); }}
          className="border border-gray-200 px-3 py-1.5 rounded-lg text-sm
            text-gray-600 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="validee">Validées</option>
          <option value="archivee">Archivées</option>
        </select>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent
              rounded-full animate-spin" />
          </div>
        ) : analyses.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">
            Aucune analyse reçue.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {analyses.map(a => (
              <div
                key={a.id}
                className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50
                  cursor-pointer transition-colors"
                onClick={() => setDetail(detail?.id === a.id ? null : a)}
              >
                {/* Score */}
                <div className="min-w-[48px] text-center">
                  <p className={`text-lg font-bold ${scoreColor(a.scoreRisque)}`}>
                    {Math.round(a.scoreRisque * 100)}%
                  </p>
                  <p className="text-[10px] text-gray-400">risque</p>
                </div>

                {/* Patient + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {a.patient?.prenom} {a.patient?.nom}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(a.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit", month: "short",
                      hour: "2-digit", minute: "2-digit"
                    })}
                    &nbsp;·&nbsp;{a.symptomes?.length || 0} symptôme(s)
                  </p>
                </div>

                {/* Statut */}
                <span className={`text-xs px-2 py-1 rounded-full
                  ${STATUT_STYLE[a.statut] || "bg-gray-100 text-gray-500"}`}>
                  {a.statut}
                </span>

                {/* Flèche */}
                <span className={`text-gray-300 text-xs transition-transform
                  ${detail?.id === a.id ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Détail déroulant d'une analyse ─────────────────────────────── */}
      {detail && (
        <div className="bg-white rounded-xl border border-gray-200 p-5
          flex flex-col gap-4 animate-in">

          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-800">
                {detail.patient?.prenom} {detail.patient?.nom}
              </p>
              <p className="text-xs text-gray-400">
                Analyse #{detail.id} · {detail.source} · Score {Math.round(detail.scoreRisque * 100)}%
              </p>
            </div>
            <button
              onClick={() => setDetail(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none">
              ✕
            </button>
          </div>

          {/* ✅ Section Symptômes scannés — affiché dans le champ symptome */}
          {detail.symptomes?.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase
                tracking-wide mb-2">
                Symptômes détectés
              </p>
              <div className="flex flex-wrap gap-2">
                {detail.symptomes.map((s, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      border text-xs ${SEVERITE_STYLE[s.severite] || "bg-gray-100 text-gray-600"}`}
                  >
                    <span className="font-semibold capitalize">{s.type}</span>
                    <span className="opacity-60">—</span>
                    <span>{s.valeur}</span>
                    {s.confiance < 1 && (
                      <span className="opacity-40 text-[10px]">
                        {Math.round(s.confiance * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun symptôme enregistré.</p>
          )}

          {/* Actions */}
          {detail.statut === "en_attente" && (
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => valider(detail.id, "validee")}
                className="flex-1 bg-teal-600 text-white py-2 rounded-lg
                  hover:bg-teal-700 text-sm font-medium">
                ✓ Valider
              </button>
              <button
                onClick={() => valider(detail.id, "archivee")}
                className="flex-1 border border-gray-200 text-gray-600 py-2
                  rounded-lg hover:bg-gray-50 text-sm">
                Archiver
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg
              disabled:opacity-40 hover:bg-gray-50">
            ← Précédent
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500">
            Page {page} / {Math.ceil(total / 15)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 15)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg
              disabled:opacity-40 hover:bg-gray-50">
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
