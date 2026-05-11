import { useState, useEffect } from "react";

export default function CreerRendezVous() {
  const [patients, setPatients] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [success, setSuccess]   = useState(false);
  const [erreurDate, setErreurDate] = useState("");
  const [formData, setFormData] = useState({
    patientId:        "",
    medecinId:        "",
    dateRendezVous:   "",
    heureRendezVous:  "",
    typeConsultation: "Consultation générale",
    priorite:         "normale",
    motifRendezVous:  "",
    rappelSMS:        true,
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/GET/allPatients")
      .then(r => r.json()).then(setPatients).catch(console.error);
    fetch("http://localhost:5000/api/GET/allMedecin")
      .then(r => r.json()).then(setMedecins).catch(console.error);
  }, []);

  // ✅ Vérifie si la date est un dimanche
  const estDimanche = (dateStr) => {
    if (!dateStr) return false;
    // +1 jour pour corriger le décalage UTC des inputs HTML
    const date = new Date(dateStr + "T00:00:00");
    return date.getDay() === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // ✅ Blocage dimanche sur le champ date
    if (name === "dateRendezVous") {
      if (estDimanche(value)) {
        setErreurDate("L'établissement est fermé le dimanche. Veuillez choisir une autre date.");
        // On met quand même la valeur pour montrer le feedback visuel,
        // mais on bloque la soumission via erreurDate
        setFormData(prev => ({ ...prev, [name]: value }));
        return;
      } else {
        setErreurDate(""); // effacer l'erreur si date valide
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Double vérification avant envoi
    if (estDimanche(formData.dateRendezVous)) {
      setErreurDate("Impossible de confirmer un rendez-vous le dimanche.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/insertion/rendez-vous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  // ✅ Réinitialiser le formulaire
  const handleReset = () => {
    setFormData({
      patientId:        "",
      medecinId:        "",
      dateRendezVous:   "",
      heureRendezVous:  "",
      typeConsultation: "Consultation générale",
      priorite:         "normale",
      motifRendezVous:  "",
      rappelSMS:        true,
    });
    setSuccess(false);
    setErreurDate("");
  };

  const creneaux = [
    "08:00","08:30","09:00","09:30","10:00","10:30",
    "11:00","11:30","13:00","13:30","14:00","14:30",
    "15:00","15:30","16:00","16:30",
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-start justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow overflow-hidden">

        {/* EN-TÊTE */}
        <div className="bg-teal-800 px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-teal-100" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8"  y1="2" x2="8"  y2="6"/>
              <line x1="3"  y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <p className="text-teal-100 font-medium text-sm">Nouveau rendez-vous</p>
            <p className="text-teal-400 text-xs">Réceptionniste → Médecin</p>
          </div>
          <span className="ml-auto bg-teal-600 text-teal-100 text-xs px-3 py-1 rounded-full">
            {new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" })}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

          {/* PATIENT + MÉDECIN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Patient *</label>
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Sélectionner un patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Médecin *</label>
              <select
                name="medecinId"
                value={formData.medecinId}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Sélectionner un médecin</option>
                {medecins.map(m => (
                  <option key={m.id} value={m.id}>Dr. {m.prenom}</option>
                ))}
              </select>
            </div>
          </div>

          {/* DATE + HEURE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">

            {/* ✅ Champ date avec protection dimanche */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Date du rendez-vous *
              </label>
              <input
                type="date"
                name="dateRendezVous"
                value={formData.dateRendezVous}
                min={new Date().toISOString().slice(0, 10)}
                onChange={handleChange}
                required
                className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors
                  focus:ring-teal-500 focus:border-teal-500
                  ${erreurDate
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-gray-200"
                  }`}
              />
              {/* Message d'erreur dimanche */}
              {erreurDate ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {erreurDate}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  Ouvert du lundi au samedi
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Heure *</label>
              <select
                name="heureRendezVous"
                value={formData.heureRendezVous}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Choisir un créneau</option>
                {creneaux.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {/* TYPE + PRIORITÉ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type de consultation</label>
              <select
                name="typeConsultation"
                value={formData.typeConsultation}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500"
              >
                {["Consultation générale","Suivi médical","Urgence","Contrôle","Première visite"].map(t =>
                  <option key={t}>{t}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priorité</label>
              <select
                name="priorite"
                value={formData.priorite}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="normale">Normale</option>
                <option value="urgente">Urgente</option>
                <option value="faible">Faible</option>
              </select>
            </div>
          </div>

          {/* MOTIF */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Motif du rendez-vous</label>
            <textarea
              name="motifRendezVous"
              value={formData.motifRendezVous}
              onChange={handleChange}
              rows={3}
              placeholder="Décrivez brièvement le motif de la consultation..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* RAPPEL SMS */}
          <div className="flex items-center gap-3 bg-teal-50 rounded-lg p-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-teal-800">Rappel automatique</p>
              <p className="text-xs text-teal-600">Un SMS sera envoyé 24h avant le rendez-vous.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="rappelSMS"
                checked={formData.rappelSMS}
                onChange={handleChange}
                className="accent-teal-600 w-4 h-4"
              />
              <span className="text-xs text-teal-700">Activer</span>
            </label>
          </div>

          {/* ✅ BANNIÈRE SUCCÈS */}
          {success && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-start gap-3">
              <span className="text-teal-600 text-lg">✓</span>
              <div>
                <p className="text-sm font-medium text-teal-800">Rendez-vous confirmé</p>
                <p className="text-xs text-teal-600">
                  Prévu le{" "}
                  {new Date(formData.dateRendezVous + "T00:00:00").toLocaleDateString("fr-FR", {
                    weekday: "long", day: "2-digit", month: "long",
                  })}{" "}
                  à {formData.heureRendezVous}
                </p>
              </div>
            </div>
          )}

          {/* BOUTONS */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!!erreurDate}
              className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors
                ${erreurDate
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
            >
              Confirmer le rendez-vous
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}