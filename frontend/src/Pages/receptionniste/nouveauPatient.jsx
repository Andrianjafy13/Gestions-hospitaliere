import React, { useState, useEffect } from "react";

export default function CreatePatients() {
  const medecinId = localStorage.getItem("medecinId");

  const [formData, setFormData] = useState({
    nom: "", prenom: "", dateNaissance: "", sexe: "",
    adresse: "", telephone: "", typePatient: "",
    allergies: "", groupeSanguin: "", observation: "",
    chambreId: "",
    medecinId: medecinId || "",
  });

  const [medecins,  setMedecins]  = useState([]);
  const [chambres,  setChambres]  = useState([]);
  const [success,   setSuccess]   = useState(false);
  const [erreur,    setErreur]    = useState("");
  const [loading,   setLoading]   = useState(false);

  // ✅ Charger médecins au montage
  useEffect(() => {
    fetch("http://localhost:5000/api/GET/allMedecin")
      .then(r => r.json()).then(setMedecins).catch(console.error);
  }, []);

  // ✅ Charger les chambres disponibles quand typePatient change
  useEffect(() => {
    if (formData.typePatient === "Hospitalisé" || formData.typePatient === "Urgence") {
      fetch("http://localhost:5000/api/GET/chambres-disponibles")
        .then(r => r.json())
        .then(data => {
          // Garder uniquement les chambres non occupées
          const disponibles = data.filter(c => c.occupe === 0);
          setChambres(disponibles);
        })
        .catch(console.error);
    } else {
      // Réinitialiser la chambre si on repasse en Externe
      setChambres([]);
      setFormData(prev => ({ ...prev, chambreId: "" }));
    }
  }, [formData.typePatient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErreur("");
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    // ✅ Validation medecinId
    if (!formData.medecinId) {
      setErreur("Veuillez sélectionner un médecin.");
      return;
    }

    // ✅ Validation chambre si hospitalisé ou urgence
    if (
      (formData.typePatient === "Hospitalisé" || formData.typePatient === "Urgence")
      && !formData.chambreId
    ) {
      setErreur("Veuillez sélectionner une chambre pour ce type de patient.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/insertion/AjoutPatients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          medecinId: parseInt(formData.medecinId),
          chambreId: formData.chambreId ? parseInt(formData.chambreId) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErreur(data.message || "Erreur lors de l'enregistrement.");
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
        // Reset formulaire
        setFormData({
          nom: "", prenom: "", dateNaissance: "", sexe: "",
          adresse: "", telephone: "", typePatient: "",
          allergies: "", groupeSanguin: "", observation: "",
          chambreId: "", medecinId: medecinId || "",
        });
      }
    } catch (error) {
      setErreur("Erreur réseau. Vérifiez votre connexion.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ true si la chambre doit être affichée
  const necesiteChambre =
    formData.typePatient === "Hospitalisé" ||
    formData.typePatient === "Urgence";

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Ajouter un nouveau patient
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* MÉDECIN */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Médecin *</label>
          <select
            name="medecinId"
            value={formData.medecinId}
            onChange={handleChange}
            required
            className={`w-full border rounded-lg px-3 py-2 text-sm
              focus:ring-teal-500 focus:border-teal-500
              ${!formData.medecinId ? "border-orange-300 bg-orange-50" : "border-gray-200"}`}
          >
            <option value="">Sélectionner un médecin</option>
            {medecins.map(m => (
              <option key={m.id} value={m.id}>Dr. {m.prenom} {m.nom}</option>
            ))}
          </select>
          {!formData.medecinId && (
            <p className="text-xs text-orange-500 mt-1">
              ⚠ Un médecin doit être assigné.
            </p>
          )}
        </div>

        {/* INFORMATIONS PERSONNELLES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom *</label>
            <input type="text" name="nom" value={formData.nom}
              onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prénom *</label>
            <input type="text" name="prenom" value={formData.prenom}
              onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date de naissance *</label>
            <input type="date" name="dateNaissance" value={formData.dateNaissance}
              onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sexe *</label>
            <select name="sexe" value={formData.sexe} onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500">
              <option value="">Sélectionner</option>
              <option value="Masculin">Masculin</option>
              <option value="Féminin">Féminin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Téléphone *</label>
            <input type="tel" name="telephone" value={formData.telephone}
              onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Adresse</label>
            <input type="text" name="adresse" value={formData.adresse}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500" />
          </div>
        </div>

        {/* INFORMATIONS MÉDICALES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* TYPE PATIENT */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type de patient *
            </label>
            <select name="typePatient" value={formData.typePatient}
              onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500">
              <option value="">Sélectionner</option>
              <option value="Externe">Externe</option>
              <option value="Hospitalisé">Hospitalisé</option>
              <option value="Urgence">Urgence</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Allergies</label>
            <select name="allergies" value={formData.allergies} onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500">
              <option value="">Sélectionner</option>
              <option value="Comprimés">Comprimés</option>
              <option value="Sureau">Sureau</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Groupe sanguin</label>
            <select name="groupeSanguin" value={formData.groupeSanguin} onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500">
              <option value="">Sélectionner</option>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g =>
                <option key={g} value={g}>{g}</option>
              )}
            </select>
          </div>
        </div>

        {/* ✅ CHAMBRE — visible uniquement si Hospitalisé ou Urgence */}
        {necesiteChambre && (
          <div className="border border-teal-100 bg-teal-50 rounded-xl p-4">

            {/* En-tête section chambre */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor"
                  strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-teal-800">
                Attribution de chambre
                <span className="ml-2 text-xs font-normal text-teal-600">
                  — obligatoire pour{" "}
                  {formData.typePatient === "Urgence" ? "un patient en urgence" : "un patient hospitalisé"}
                </span>
              </p>
            </div>

            {chambres.length === 0 ? (
              // ✅ Aucune chambre disponible
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <span>⚠</span>
                  Aucune chambre disponible pour le moment.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Chambre disponible *
                </label>
                <select
                  name="chambreId"
                  value={formData.chambreId}
                  onChange={handleChange}
                  required
                  className={`w-full border rounded-lg px-3 py-2 text-sm
                    focus:ring-teal-500 focus:border-teal-500 bg-white
                    ${!formData.chambreId ? "border-red-300" : "border-teal-300"}`}
                >
                  <option value="">— Choisir une chambre —</option>
                  {chambres.map(c => (
                    <option key={c.id} value={c.id}>
                      Chambre {c.numero}
                      {c.type ? ` — ${c.type}` : ""}
                    </option>
                  ))}
                </select>

                {/* Indicateur de disponibilité */}
                <p className="text-xs text-teal-600 mt-1">
                  {chambres.length} chambre{chambres.length > 1 ? "s" : ""} disponible{chambres.length > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        )}

        {/* OBSERVATION */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Observation / notes
          </label>
          <textarea name="observation" value={formData.observation}
            onChange={handleChange} rows="3"
            className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
              focus:ring-teal-500 focus:border-teal-500" />
        </div>

        {/* ERREUR */}
        {erreur && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">⚠ {erreur}</p>
          </div>
        )}

        {/* SUCCÈS */}
        {success && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-center gap-3">
            <span className="text-teal-600 text-lg">✓</span>
            <p className="text-sm font-medium text-teal-800">
              Patient enregistré avec succès.
            </p>
          </div>
        )}

        {/* BOUTON SOUMETTRE */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setFormData({
                nom: "", prenom: "", dateNaissance: "", sexe: "",
                adresse: "", telephone: "", typePatient: "",
                allergies: "", groupeSanguin: "", observation: "",
                chambreId: "", medecinId: medecinId || "",
              });
              setErreur("");
            }}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Réinitialiser
          </button>

          <button
            type="submit"
            disabled={loading || (necesiteChambre && chambres.length === 0)}
            className={`px-6 py-2 text-sm rounded-lg font-medium transition-colors
              ${loading || (necesiteChambre && chambres.length === 0)
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-teal-500 text-white hover:bg-teal-600"
              }`}
          >
            {loading ? "Enregistrement..." : "Ajouter patient"}
          </button>
        </div>

      </form>
    </div>
  );
}