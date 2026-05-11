import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ModalConfirmation } from "../confirmationSup/ModalConfirmation";

export default function ListeGarde() {
  const navigate = useNavigate();
  const [gardes,         setGardes]         = useState([]);
  const [message,        setMessage]        = useState("");
  const [loading,        setLoading]        = useState(true);
  const [itemASupprimer, setItemASupprimer] = useState(null);

  // ✅ chargerGardes défini dans le composant
  const chargerGardes = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/GET/gardes")
      .then(res => res.json())
      .then(data => {
        if (data.message) setMessage(data.message);
        else { setGardes(data); setMessage(""); }
      })
      .catch(err => console.error("Erreur :", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { chargerGardes(); }, []);

  const handleModifier = (garde) => {
    navigate(`/modifier/garde/${garde.id}`, { state: { data: garde } });
  };

  const handleSupprimer = async () => {
    if (!itemASupprimer) return;
    try {
      await fetch(
        `http://localhost:5000/api/DELETE/garde/${itemASupprimer.id}`,
        { method: "DELETE" }
      );
      setItemASupprimer(null);
      chargerGardes();
    } catch (err) { console.error(err); }
  };

  // ✅ Badge statut
  const statutStyle = (statut) => {
    if (statut === "actif")  return "bg-teal-100 text-teal-700";
    if (statut === "termine") return "bg-gray-100 text-gray-500";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="max-w-full mx-auto mt-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Liste des infirmiers en garde
      </h2>

      {message && <p className="text-center text-red-500 text-sm mb-4">{message}</p>}

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-8">Chargement...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Nom infirmier</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Type de garde</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Date début</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Date fin</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Heure début</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Heure fin</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {gardes.length > 0 ? (
                gardes.map((G) => (
                  <tr key={G.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {G.infirmier?.nom} {G.infirmier?.prenom}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">{G.typeGarde}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {new Date(G.dateDebut).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {new Date(G.dateFin).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {G.heureDebut?.slice(0, 5)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {G.heureFin?.slice(0, 5)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">{G.service || "—"}</td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statutStyle(G.statut)}`}>
                        {G.statut || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-center space-x-2">
                      <button onClick={() => handleModifier(G)}
                        className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">
                        <FaEdit />
                      </button>
                      <button onClick={() => setItemASupprimer(G)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-gray-400 text-sm py-8">
                    Aucune garde trouvée
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
            ? `${itemASupprimer.infirmier?.prenom} ${itemASupprimer.infirmier?.nom}`
            : ""
        }
        onConfirmer={handleSupprimer}
        onAnnuler={() => setItemASupprimer(null)}
      />
    </div>
  );
}