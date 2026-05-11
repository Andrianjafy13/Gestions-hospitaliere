import React, { useState, useEffect } from "react";

export default function CreatePatient() {
  const medecinId = localStorage.getItem("medecinId");

  const [chambres, setChambres] = useState([]);
  const [erreur,   setErreur]   = useState("");
  const [succes,   setSucces]   = useState("");

  const [formData, setFormData] = useState({
    nom: "", prenom: "", dateNaissance: "", sexe: "",
    adresse: "", telephone: "", typePatient: "",
    allergies: "", groupeSanguin: "", observation: "",
    chambreId: "", medecinId: medecinId || "",
  });

  // ✅ Charger chambres disponibles
  const chargerChambres = () => {
    fetch("http://localhost:5000/api/GET/chambres-disponibles")
      .then(res => res.json())
      .then(data => setChambres(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  useEffect(() => { chargerChambres(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Capacité restante calculée depuis les données chargées
  const chambreSelectionnee = chambres.find(
    c => c.id === parseInt(formData.chambreId)
  );

  const capaciteRestante = chambreSelectionnee
    ? chambreSelectionnee.capacite - chambreSelectionnee.occupe
    : 0;

  const showChambre =
    formData.typePatient === "Hospitalisé" ||
    formData.typePatient === "Urgence";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");

    if (!formData.medecinId) {
      setErreur("Médecin non connecté !");
      return;
    }

    // ✅ Vérification chambre obligatoire si hospitalisé/urgence
    if (showChambre && !formData.chambreId) {
      setErreur("Veuillez sélectionner une chambre pour ce type de patient.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/insertion/AjoutPatients",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            medecinId: parseInt(formData.medecinId),
            chambreId: formData.chambreId ? parseInt(formData.chambreId) : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // ✅ Afficher l'erreur du backend (chambre pleine, etc.)
        setErreur(data.message || "Erreur lors de l'enregistrement.");
        return;
      }

      setSucces(`Patient enregistré${
        data.chambre
          ? ` — Chambre ${data.chambre.numero} : ${data.chambre.placesRestantes} place(s) restante(s)`
          : ""
      }`);

      // ✅ Recharger les chambres pour mettre à jour les places
      chargerChambres();

      // ✅ Réinitialiser le formulaire
      setFormData({
        nom: "", prenom: "", dateNaissance: "", sexe: "",
        adresse: "", telephone: "", typePatient: "",
        allergies: "", groupeSanguin: "", observation: "",
        chambreId: "", medecinId: medecinId,
      });

    } catch (error) {
      console.error("Erreur:", error);
      setErreur("Erreur réseau.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Ajouter un nouveau patient
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Informations personnelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom *</label>
            <input type="text" name="nom" value={formData.nom}
              onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Prénom *</label>
            <input type="text" name="prenom" value={formData.prenom}
              onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date de naissance *</label>
            <input type="date" name="dateNaissance" value={formData.dateNaissance}
              onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sexe *</label>
            <select name="sexe" value={formData.sexe} onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500">
              <option value="">Sélectionner</option>
              <option value="Masculin">Masculin</option>
              <option value="Féminin">Féminin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Téléphone</label>
            <input type="tel" name="telephone" value={formData.telephone}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Adresse</label>
            <input type="text" name="adresse" value={formData.adresse}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500" />
          </div>
        </div>

        {/* Informations médicales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type de patient</label>
            <select name="typePatient" value={formData.typePatient} onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500">
              <option value="">Sélectionner</option>
              <option value="Externe">Externe</option>
              <option value="Hospitalisé">Hospitalisé</option>
              <option value="Urgence">Urgence</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Allergies</label>
            <select name="allergies" value={formData.allergies} onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300 focus:ring-teal-500 focus:border-teal-500">
              <option value="">Sélectionner</option>
              <option value="Comprimés">Comprimés</option>
              <option value="Sureau">Sureau</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Groupe sanguin</label>
            <select name="groupeSanguin" value={formData.groupeSanguin} onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300">
              <option value="">Sélectionner</option>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g =>
                <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* ✅ Chambre — visible seulement si Hospitalisé ou Urgence */}
        {showChambre && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Chambre *
              </label>
              <select name="chambreId" value={formData.chambreId}
                onChange={handleChange} required={showChambre}
                className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300">
                <option value="">Sélectionner une chambre</option>
                {chambres.map(c => (
                  <option key={c.id} value={c.id}>
                    Chambre {c.numero} — {c.capacite - c.occupe} place(s) dispo
                  </option>
                ))}
              </select>
              {chambres.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  Aucune chambre disponible.
                </p>
              )}
            </div>

            {/* ✅ Capacité restante calculée automatiquement */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Capacité restante
              </label>
              <div className={`mt-1 px-3 py-2 border rounded-lg text-sm font-medium
                ${capaciteRestante === 0
                  ? "bg-green-50 border-red-200 text-red-600"
                  : capaciteRestante <= 2
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-teal-50 border-teal-200 text-teal-700"}`}>
                {formData.chambreId
                  ? `${capaciteRestante} place(s) disponible(s)`
                  : "Sélectionnez une chambre"}
              </div>
            </div>
          </div>
        )}

        {/* Observation */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Observation</label>
          <textarea name="observation" value={formData.observation}
            onChange={handleChange} rows={3}
            className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300 resize-none" />
        </div>

        {/* Messages */}
        {erreur && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{erreur}</p>
          </div>
        )}
        {succes && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
            <p className="text-sm text-teal-700">{succes}</p>
          </div>
        )}

        {/* Bouton */}
        <div className="text-right">
          <button type="submit"
            className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600">
            Ajouter patient
          </button>
        </div>

      </form>
    </div>
  );
}