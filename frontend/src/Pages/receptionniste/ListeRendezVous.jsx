import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ModalConfirmation } from "../confirmationSup/ModalConfirmation";

export default function RendezVousTable() {
  const navigate = useNavigate();
  const [rendezvous,     setRendezvous]     = useState([]);
  const [message,        setMessage]        = useState("");
  const [loading,        setLoading]        = useState(true);
  const [itemASupprimer, setItemASupprimer] = useState(null);

  // ✅ chargerRendezVous défini dans le composant
  const chargerRendezVous = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/GET/allRendez-vous")
      .then(res => res.json())
      .then(data => {
        if (data.message) setMessage(data.message);
        else { setRendezvous(data); setMessage(""); }
      })
      .catch(err => console.error("Erreur :", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerRendezVous();
    // ✅ Rafraîchissement toutes les 30 secondes
    const interval = setInterval(chargerRendezVous, 30_000);
    return () => clearInterval(interval); // nettoyage au démontage
  }, []);

  const handleModifier = (rdv) => {
    navigate(`/modifier/rendezVous/${rdv.id}`, { state: { data: rdv } });
  };

  const handleSupprimer = async () => {
    if (!itemASupprimer) return;
    try {
      await fetch(
        `http://localhost:5000/api/DELETE/rendezVous/${itemASupprimer.id}`,
        { method: "DELETE" }
      );
      setItemASupprimer(null);
      chargerRendezVous();
    } catch (err) { console.error(err); }
  };

  const prioriteStyle = (p) => {
    if (p === "urgente") return "bg-red-100 text-red-700";
    if (p === "faible")  return "bg-gray-100 text-gray-500";
    return "bg-teal-100 text-teal-700";
  };

  return (
    <div className="max-w-full mx-auto mt-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Liste des rendez-vous
      </h2>

      {message && <p className="text-center text-red-500 text-sm mb-4">{message}</p>}

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-8">Chargement...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Heure</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type consultation</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Priorité</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rendezvous.length > 0 ? (
                rendezvous.map((rdv) => (
                  <tr key={rdv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {new Date(rdv.dateRendezVous).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {rdv.heureRendezVous?.slice(0, 5)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">{rdv.typeConsultation}</td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${prioriteStyle(rdv.priorite)}`}>
                        {rdv.priorite}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        rdv.statut === "Validé"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {rdv.statut || "En attente"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-center space-x-2">
                      <button onClick={() => handleModifier(rdv)}
                        className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">
                        <FaEdit />
                      </button>
                      <button onClick={() => setItemASupprimer(rdv)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-gray-400 text-sm py-8">
                    Aucun rendez-vous trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Modal EN DEHORS du tableau */}
      <ModalConfirmation
        item={itemASupprimer}
        nomAffiche={
          itemASupprimer
            ? `RDV du ${new Date(itemASupprimer.dateRendezVous).toLocaleDateString("fr-FR")}`
            : ""
        }
        onConfirmer={handleSupprimer}
        onAnnuler={() => setItemASupprimer(null)}
      />
    </div>
  );
}