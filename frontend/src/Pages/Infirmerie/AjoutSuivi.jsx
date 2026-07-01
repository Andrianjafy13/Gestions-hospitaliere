// components/AjoutSuivi.jsx
// Version complète — intègre l'historique des analyses Flutter
// dans la section "Symptômes" de chaque suivi

import { useState, useEffect } from "react";

const BASE_URL1 = "http://localhost:5000/api"
const BASE_URL = "http://localhost:5000/api";

export function AjoutSuivie() {

  const [patients,        setPatients]        = useState([]);
  const [suivis,          setSuivis]          = useState([]);
  const [analysesScan,    setAnalysesScan]    = useState([]); // ✅ analyses Flutter
  const [erreur,          setErreur]          = useState("");
  const [succes,          setSucces]          = useState("");
  const [loading,         setLoading]         = useState(false);
  const [decision,        setDecision]        = useState(null);

  const [form, setForm] = useState({
    patientId:   "",
    temperature: "",
    tension:     "",
    symptome:    "",
  });

  // ── Charger patients hospitalisés et urgences ─────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/GET/AllHospitalise`)
      .then(r => r.json())
      .then(d => setPatients(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  // ── Charger suivis + analyses Flutter quand patient change ────────────
  useEffect(() => {
    if (!form.patientId) {
      setSuivis([]);
      setAnalysesScan([]);
      return;
    }
    chargerSuivis();
    chargerAnalysesScan();
  }, [form.patientId]);

  const chargerSuivis = () => {
    if (!form.patientId) return;
    fetch(`${BASE_URL}/GET/suivi/${form.patientId}`)
      .then(r => r.json())
      .then(d => setSuivis(Array.isArray(d) ? d : []))
      .catch(console.error);
  };

  // ✅ Charger les analyses envoyées depuis Flutter
  const chargerAnalysesScan = () => {
    if (!form.patientId) return;
    fetch(`${BASE_URL}/analyses/patient/${form.patientId}`)
      .then(r => r.json())
      .then(d => setAnalysesScan(Array.isArray(d) ? d : []))
      .catch(console.error);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const patientSelectionne = patients.find(
    p => p.id === parseInt(form.patientId)
  );

  const decisionStyle = {
    Externe:     { bg: "bg-teal-50 border-teal-200",  text: "text-teal-700",  badge: "bg-teal-100 text-teal-800"  },
    Hospitalisé: { bg: "bg-blue-50 border-blue-200",  text: "text-blue-700",  badge: "bg-blue-100 text-blue-800"  },
    Urgence:     { bg: "bg-red-50  border-red-200",   text: "text-red-700",   badge: "bg-red-100  text-red-800"   },
  };

  const severiteStyle = {
    critique: "bg-red-100 text-red-800 border-red-200",
    eleve:    "bg-orange-100 text-orange-800 border-orange-200",
    modere:   "bg-yellow-100 text-yellow-800 border-yellow-200",
    faible:   "bg-gray-100 text-gray-600 border-gray-200",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces(""); setDecision(null);

    if (!form.patientId) {
      setErreur("Veuillez sélectionner un patient.");
      return;
    }
    if (!form.temperature || !form.tension) {
      setErreur("Température et tension sont obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/insertion/suivi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId:   parseInt(form.patientId),
          temperature: form.temperature,
          tension:     form.tension,
          symptome:    form.symptome,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErreur(data.message || "Erreur lors de l'ajout.");
        return;
      }

      setSucces(data.messageDecision || "Suivi ajouté avec succès !");

      if (data.ancienType !== data.typePatient) {
        setPatients(prev =>
          prev.map(p =>
            p.id === parseInt(form.patientId)
              ? { ...p, typePatient: data.typePatient }
              : p
          )
        );
      }

      setDecision({
        ancien:  data.ancienType,
        nouveau: data.typePatient,
        message: data.messageDecision,
      });

      setForm(prev => ({
        ...prev,
        temperature: "",
        tension:     "",
        symptome:    "",
      }));

      chargerSuivis();

    } catch (error) {
      console.error(error);
      setErreur("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  // ── Fusionner et trier suivis + analyses scan par date ────────────────
  const historiqueFusionne = [
    ...suivis.map(s => ({ ...s, _origine: "suivi" })),
    ...analysesScan.map(a => ({ ...a, _origine: "scan" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="flex flex-col gap-5">

      {/* ── FORMULAIRE ─────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}
        className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col gap-4">

        <h3 className="font-medium text-gray-800">Ajouter un suivi patient</h3>

        {/* Select patient groupé */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Patient *
          </label>
          <select
            name="patientId"
            value={form.patientId}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded-lg
              focus:ring-teal-500 focus:border-teal-500 text-sm"
          >
            <option value="">Sélectionner un patient</option>

            {patients.filter(p => p.typePatient === "Hospitalisé").length > 0 && (
              <optgroup label="🛏 Hospitalisés">
                {patients
                  .filter(p => p.typePatient === "Hospitalisé")
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.prenom} {p.nom}
                    </option>
                  ))}
              </optgroup>
            )}

            {patients.filter(p => p.typePatient === "Urgence").length > 0 && (
              <optgroup label="🚨 Urgences">
                {patients
                  .filter(p => p.typePatient === "Urgence")
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.prenom} {p.nom}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>

          {patients.filter(p =>
            p.typePatient === "Hospitalisé" || p.typePatient === "Urgence"
          ).length === 0 && (
            <p className="text-xs text-red-500 mt-1">
              Aucun patient hospitalisé ou en urgence.
            </p>
          )}
        </div>

        {/* Infos patient sélectionné */}
        {patientSelectionne && (
          <div className="bg-teal-50 border border-teal-100 rounded-lg px-4 py-3
            flex flex-wrap gap-3 text-xs text-teal-700">
            <span>
              Patient : <strong>
                {patientSelectionne.prenom} {patientSelectionne.nom}
              </strong>
            </span>
            <span>
              Type :
              <strong className={`ml-1 px-2 py-0.5 rounded-full text-xs
                ${patientSelectionne.typePatient === "Urgence"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"}`}>
                {patientSelectionne.typePatient || "—"}
              </strong>
            </span>
            <span>
              Chambre : <strong>
                {patientSelectionne.chambre?.numero || "—"}
              </strong>
            </span>
            <span>
              Groupe : <strong>
                {patientSelectionne.groupeSanguin || "—"}
              </strong>
            </span>

            {/* ✅ Badge analyses Flutter */}
            {analysesScan.length > 0 && (
              <span className="ml-auto bg-purple-100 text-purple-700
                px-2 py-0.5 rounded-full flex items-center gap-1">
                📱 {analysesScan.length} scan(s) mobile
              </span>
            )}
          </div>
        )}

        {/* Température */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Température *
          </label>
          <select
            name="temperature"
            value={form.temperature}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 px-3 py-2 rounded-lg
              focus:ring-teal-500 focus:border-teal-500 text-sm"
          >
            <option value="">Sélectionner</option>
            <option value="basse">Température basse (&lt; 36.5°C)</option>
            <option value="normale">Température normale (36.5°C – 37.5°C)</option>
            <option value="elevee">Température élevée (&gt; 37.5°C)</option>
          </select>
        </div>

        {/* Tension */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tension artérielle *
          </label>
          <input
            type="text"
            name="tension"
            value={form.tension}
            onChange={handleChange}
            required
            placeholder="ex: 120/80"
            className="w-full border border-gray-300 px-3 py-2 rounded-lg
              focus:ring-teal-500 focus:border-teal-500 text-sm"
          />
        </div>

        {/* Symptômes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Symptômes
          </label>
          <textarea
            name="symptome"
            placeholder="Décrire les symptômes observés..."
            value={form.symptome}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg
              focus:ring-teal-500 focus:border-teal-500 resize-none text-sm"
          />
        </div>

        {/* Décision */}
        {decision && (
          <div className={`border rounded-lg p-4 flex flex-col gap-2
            ${decisionStyle[decision.nouveau]?.bg || "bg-gray-50 border-gray-200"}`}>
            <p className={`text-sm font-medium
              ${decisionStyle[decision.nouveau]?.text || "text-gray-700"}`}>
              {decision.message}
            </p>
            {decision.ancien !== decision.nouveau ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {decision.ancien}
                </span>
                <span className="text-gray-400">→</span>
                <span className={`px-2 py-0.5 rounded-full font-medium
                  ${decisionStyle[decision.nouveau]?.badge || "bg-gray-100 text-gray-600"}`}>
                  {decision.nouveau}
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Type patient inchangé : <strong>{decision.nouveau}</strong>
              </p>
            )}
          </div>
        )}

        {erreur && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{erreur}</p>
          </div>
        )}
        {succes && !decision && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
            <p className="text-sm text-teal-700">{succes}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setForm({ patientId:"", temperature:"", tension:"", symptome:"" });
              setErreur(""); setSucces(""); setSuivis([]);
              setDecision(null); setAnalysesScan([]);
            }}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-teal-600 text-white px-5 py-2 rounded-lg
              hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">
            {loading ? "Enregistrement..." : "Ajouter suivi"}
          </button>
        </div>
      </form>

      {/* ── HISTORIQUE FUSIONNÉ (Suivis manuels + Scans Flutter) ─────────── */}
      {form.patientId && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-medium text-gray-800 text-sm">
              Historique — {patientSelectionne?.prenom} {patientSelectionne?.nom}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {suivis.length} suivi(s)
              </span>
              {analysesScan.length > 0 && (
                <span className="text-xs bg-purple-100 text-purple-600
                  px-2 py-0.5 rounded-full">
                  📱 {analysesScan.length} scan(s)
                </span>
              )}
            </div>
          </div>

          {historiqueFusionne.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">
              Aucun suivi enregistré pour ce patient.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {historiqueFusionne.map((item) => (
                <div key={`${item._origine}-${item.id}`}
                  className="px-5 py-3 flex items-start gap-4">

                  {/* Date */}
                  <div className="min-w-[80px] text-center bg-gray-50
                    rounded-lg py-1.5 px-2 flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-xs font-medium text-gray-700">
                      {new Date(item.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                    {/* Badge origine */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block
                      ${item._origine === "scan"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-teal-100 text-teal-600"}`}>
                      {item._origine === "scan" ? "📱 Scan" : "📋 Manuel"}
                    </span>
                  </div>

                  {/* ── Contenu selon l'origine ───────────────────────── */}
                  <div className="flex-1 flex flex-col gap-2">

                    {item._origine === "suivi" ? (
                      /* Suivi manuel infirmier */
                      <>
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium
                            ${item.temperature === "elevee"
                              ? "bg-red-100 text-red-800"
                              : item.temperature === "basse"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-teal-100 text-teal-800"}`}>
                            🌡 {item.temperature}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full
                            bg-purple-100 text-purple-800">
                            💓 {item.tension}
                          </span>
                        </div>
                        {item.symptome && (
                          <p className="text-xs text-gray-600">{item.symptome}</p>
                        )}
                      </>
                    ) : (
                      /* ✅ Scan Flutter — Section Symptômes enrichie */
                      <>
                        {/* Score de risque */}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium
                            ${item.scoreRisque >= 0.8
                              ? "bg-red-100 text-red-800"
                              : item.scoreRisque >= 0.5
                              ? "bg-orange-100 text-orange-800"
                              : "bg-teal-100 text-teal-800"}`}>
                            {item.scoreRisque >= 0.8 ? "🚨" : item.scoreRisque >= 0.5 ? "⚠️" : "✅"}
                            &nbsp;Risque : {Math.round(item.scoreRisque * 100)}%
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full
                            ${item.statut === "validee"
                              ? "bg-green-100 text-green-700"
                              : item.statut === "archivee"
                              ? "bg-gray-100 text-gray-500"
                              : "bg-yellow-100 text-yellow-700"}`}>
                            {item.statut}
                          </span>
                        </div>

                        {/* ✅ Symptômes scannés (section symptome de l'UI) */}
                        {item.symptomes?.length > 0 && (
                          <div className="border border-dashed border-gray-200
                            rounded-lg p-3 bg-gray-50">
                            <p className="text-[11px] font-medium text-gray-400
                              uppercase tracking-wide mb-2">
                              Symptômes détectés
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.symptomes.map((sym, idx) => (
                                <span
                                  key={idx}
                                  className={`text-xs px-2 py-0.5 rounded-full border
                                    ${severiteStyle[sym.severite] || "bg-gray-100 text-gray-600"}`}>
                                  <span className="font-medium">{sym.type}</span>
                                  &nbsp;—&nbsp;{sym.valeur}
                                  {sym.confiance < 1 && (
                                    <span className="ml-1 opacity-50 text-[10px]">
                                      ({Math.round(sym.confiance * 100)}%)
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
