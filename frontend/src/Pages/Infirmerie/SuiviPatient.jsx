import { useState, useEffect } from "react";

export function AjoutSuivi() {

  const [patients,  setPatients]  = useState([]);
  const [suivis,    setSuivis]    = useState([]);
  const [erreur,    setErreur]    = useState("");
  const [succes,    setSucces]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [decision,  setDecision]  = useState(null); // ✅ résultat décision

  const [form, setForm] = useState({
    patientId:   "",
    temperature: "",
    tension:     "",
    symptome:    "",
  });

  // ✅ Charger patients hospitalisés et urgences
  useEffect(() => {
    fetch("http://localhost:5000/api/GET/AllHospitalise")
      .then(r => r.json())
      .then(d => setPatients(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  // ✅ Charger suivis quand patient change
  useEffect(() => {
    if (!form.patientId) { setSuivis([]); return; }
    fetch(`http://localhost:5000/api/GET/suivi/${form.patientId}`)
      .then(r => r.json())
      .then(d => setSuivis(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, [form.patientId]);

  const chargerSuivis = () => {
    if (!form.patientId) return;
    fetch(`http://localhost:5000/api/GET/suivi/${form.patientId}`)
      .then(r => r.json())
      .then(d => setSuivis(Array.isArray(d) ? d : []))
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
      const res = await fetch("http://localhost:5000/api/insertion/suivi", {
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
      console.log("Réponse suivi:", data);

      if (!res.ok) {
        setErreur(data.message || "Erreur lors de l'ajout.");
        return;
      }

      setSucces(data.messageDecision || "Suivi ajouté avec succès !");

      // ✅ Mettre à jour typePatient dans la liste locale
      if (data.ancienType !== data.typePatient) {
        setPatients(prev =>
          prev.map(p =>
            p.id === parseInt(form.patientId)
              ? { ...p, typePatient: data.typePatient }
              : p
          )
        );
      }

      // ✅ Stocker la décision pour affichage
      setDecision({
        ancien:  data.ancienType,
        nouveau: data.typePatient,
        message: data.messageDecision,
      });

      // ✅ Réinitialiser seulement les champs médicaux — garder le patient
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

  return (
    <div className="flex flex-col gap-5">

      {/* FORMULAIRE */}
      <form onSubmit={handleSubmit}
        className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col gap-4">

        <h3 className="font-medium text-gray-800">Ajouter un suivi patient</h3>

        {/* ✅ Select patient groupé */}
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

            {/* Groupe Hospitalisé */}
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

            {/* Groupe Urgence */}
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

          {/* Message si aucun patient */}
          {patients.filter(p =>
            p.typePatient === "Hospitalisé" || p.typePatient === "Urgence"
          ).length === 0 && (
            <p className="text-xs text-red-500 mt-1">
              Aucun patient hospitalisé ou en urgence.
            </p>
          )}
        </div>

        {/* ✅ Infos patient sélectionné */}
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
            <span className="text-gray-400 text-xs font-normal ml-1">
              
            </span>
          </label>
          <input
            type="text"
            name="tension"
            value={form.tension}
            onChange={handleChange}
            required
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

        {/* ✅ Affichage décision après soumission */}
        {decision && (
          <div className={`border rounded-lg p-4 flex flex-col gap-2
            ${decisionStyle[decision.nouveau]?.bg || "bg-gray-50 border-gray-200"}`}>

            <p className={`text-sm font-medium
              ${decisionStyle[decision.nouveau]?.text || "text-gray-700"}`}>
              {decision.message}
            </p>

            {/* ✅ Changement de type — afficher ancien → nouveau */}
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

        {/* Messages erreur / succès */}
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

        {/* Boutons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setForm({ patientId:"", temperature:"", tension:"", symptome:"" });
              setErreur(""); setSucces(""); setSuivis([]); setDecision(null);
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

      {/* HISTORIQUE DES SUIVIS */}
      {form.patientId && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-medium text-gray-800 text-sm">
              Historique — {patientSelectionne?.prenom} {patientSelectionne?.nom}
            </p>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {suivis.length} suivi(s)
            </span>
          </div>

          {suivis.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">
              Aucun suivi enregistré pour ce patient.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {suivis.map(s => (
                <div key={s.id} className="px-5 py-3 flex items-start gap-4">

                  {/* Date */}
                  <div className="min-w-[80px] text-center bg-gray-50
                    rounded-lg py-1.5 px-2 flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-xs font-medium text-gray-700">
                      {new Date(s.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-2 items-start">

                    {/* Température */}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium
                      ${s.temperature >= 38
                        ? "bg-red-100 text-red-800"
                        : s.temperature < 36.5
                        ? "bg-blue-100 text-blue-800"
                        : "bg-teal-100 text-teal-800"}`}>
                      {s.temperature}°C
                    </span>

                    {/* Tension */}
                    <span className="text-xs px-2 py-1 rounded-full
                      bg-purple-100 text-purple-800">
                      Tension : {s.tension}
                    </span>

                    {/* Symptômes */}
                    {s.symptome && (
                      <p className="text-xs text-gray-600 w-full mt-1">
                        {s.symptome}
                      </p>
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