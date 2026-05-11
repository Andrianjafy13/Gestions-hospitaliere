import { useEffect, useState } from "react";
import React from "react";
import { useNotification } from "./NavBar";

export default function RendezVous() {
  const medecinId = localStorage.getItem("medecinId");
  const { marquerVus } = useNotification(medecinId);

  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [jourSelectionne, setJourSelectionne] = useState(null); // ✅ jour cliqué

  useEffect(() => {
    marquerVus();
    chargerRendezVous();
  }, []);

  // Ajoutez cette fonction dans le composant RendezVous
  const changerStatut = async (rdvId, nouveauStatut) => {
    try {
      await fetch(`http://localhost:5000/api/PUT/rendezVous/${rdvId}/statut`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: nouveauStatut }),
      });
      chargerRendezVous();
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
    }
  };

  const chargerRendezVous = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`http://localhost:5000/api/GET/rendez-vous/${medecinId}`);
      const data = await res.json();
      setRendezVous(data);
    } catch (err) {
      console.error("Erreur chargement RDV:", err);
    } finally {
      setLoading(false);
    }
  };

  const joursOrdre = [
    "Lundi", "Mardi", "Mercredi", "Jeudi",
    "Vendredi", "Samedi", "Dimanche"
  ];

  const jours = joursOrdre.map((nom) => {
    const rdvDuJour = rendezVous.filter((rdv) => {
      const date      = new Date(rdv.dateRendezVous);
      const joursMap  = {
        1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi",
        5: "Vendredi", 6: "Samedi", 0: "Dimanche"
      };
      return joursMap[date.getDay()] === nom;
    });
    return { nom, rdv: rdvDuJour.length, details: rdvDuJour };
  });

  // ✅ Récupérer les détails du jour sélectionné
  const detailsJour = jours.find(j => j.nom === jourSelectionne);

  const handleClickJour = (jour) => {
    if (jour.rdv === 0) return; // ✅ pas de clic si aucun RDV
    // ✅ toggle : re-cliquer ferme le panneau
    setJourSelectionne(prev => prev === jour.nom ? null : jour.nom);
  };

  if (loading) {
    return (
      <div className="max-w-full mx-auto mt-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">
        <p className="text-gray-400 text-sm">Chargement des rendez-vous...</p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto mt-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">

      <h2 className="text-2xl font-semibold text-gray-800 mb-1">
        Rendez-Vous du médecin
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Planning hebdomadaire des rendez-vous
      </p>

      {/* GRILLE DES JOURS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {jours.map((jour) => (
          <div
            key={jour.nom}
            onClick={() => handleClickJour(jour)}
            className={`bg-gray-50 border p-4 rounded-lg transition
              ${jour.rdv > 0
                ? "hover:shadow-md hover:bg-white cursor-pointer border-gray-200"
                : "cursor-default border-gray-100 opacity-60"
              }
              ${jourSelectionne === jour.nom
                ? "border-teal-400 bg-teal-50 shadow-md"  // ✅ surligné si sélectionné
                : "border-gray-200"
              }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-teal-600">{jour.nom}</h3>
              <span className="text-xs bg-teal-100 text-teal-600 px-2 py-1 rounded-full">
                {jour.rdv}
              </span>
            </div>

            {jour.rdv === 0 ? (
              <p className="text-sm text-gray-400">Aucun rendez-vous</p>
            ) : (
              <p className="text-sm text-gray-600">
                {jour.rdv} rendez-vous
                <span className="block text-xs text-teal-400 mt-1">
                  Cliquer pour voir
                </span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ✅ PANNEAU DÉTAILS — visible seulement si un jour est sélectionné */}
      {jourSelectionne && detailsJour && (
        <div className="mt-6 border border-teal-100 rounded-xl overflow-hidden">

          {/* En-tête du panneau */}
          <div className="flex items-center justify-between bg-teal-50 px-5 py-3 border-b border-teal-100">
            <div>
              <h3 className="font-semibold text-teal-700 text-base">
                {jourSelectionne} — {detailsJour.rdv} rendez-vous
              </h3>
              <p className="text-xs text-teal-500 mt-0.5">
                Cliquez sur un jour pour changer
              </p>
            </div>
            {/* ✅ Bouton fermer */}
            <button
              onClick={() => setJourSelectionne(null)}
              className="text-teal-400 hover:text-teal-700 text-lg font-bold px-2"
            >
              ✕
            </button>
          </div>

          {/* Liste des RDV du jour */}
          <div className="divide-y divide-gray-100">
            {detailsJour.details.map((rdv, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition"
              >
                {/* Heure */}
                <div className="min-w-[56px] text-center bg-teal-100 rounded-lg py-2">
                  <p className="text-sm font-semibold text-teal-700">
                    {rdv.heureRendezVous
                      ? rdv.heureRendezVous.slice(0, 5)
                      : "—"
                    }
                  </p>
                </div>

                {/* Infos */}
                <div className="flex-1">
                  {/* Nom patient */}
                  <p className="text-sm font-semibold text-gray-800">
                    {rdv.patients
                      ? `${rdv.patients.prenom} ${rdv.patients.nom}`
                      : "Patient inconnu"
                    }
                  </p>

                  {/* Date */}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(rdv.dateRendezVous).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day:     "2-digit",
                      month:   "long",
                      year:    "numeric",
                    })}
                  </p>

                  {/* Type consultation */}
                  <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {rdv.typeConsultation || "Consultation générale"}
                  </span>
                </div>

                {/* Badge priorité */}
                <div>
                  {rdv.priorite === "urgente" && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                      Urgence
                    </span>
                  )}
                  {rdv.priorite === "normale" && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                      Normal
                    </span>
                  )}
                  {rdv.priorite === "faible" && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                      Faible
                    </span>
                  )}
                  {/* Bouton Valider — actif seulement si statut != Validé */}
                  <button
                    onClick={() => changerStatut(rdv.id, "Validé")}
                    disabled={rdv.statut === "Validé"}
                    className={`text-xs px-2 py-1 rounded-full transition-colors w-full text-center ${
                      rdv.statut === "Validé"
                        ? "bg-green-100 text-green-700 cursor-default"
                        : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"
                    }`}
                  >
                    {rdv.statut === "Validé" ? "✓ Validé" : "Valider"}
                  </button>

                  {/* Bouton Annuler — actif seulement si statut != Annulé */}
                  <button
                    onClick={() => changerStatut(rdv.id, "Annulé")}
                    disabled={rdv.statut === "Annulé"}
                    className={`text-xs px-2 py-1 rounded-full transition-colors w-full text-center ${
                      rdv.statut === "Annulé"
                        ? "bg-red-100 text-red-700 cursor-default"
                        : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700"
                    }`}
                  >
                    {rdv.statut === "Annulé" ? "✕ Annulé" : "Annuler"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}