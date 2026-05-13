import React, { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ModalConfirmation } from "../confirmationSup/ModalConfirmation";

export default function ConsultationTable() {
  const navigate = useNavigate();
  const [consultation,   setConsultation]   = useState([]);
  const [message,        setMessage]        = useState("");
  const [loading,        setLoading]        = useState(true);
  const [itemASupprimer, setItemASupprimer] = useState(null);

  const chargerConsultations = () => {
    setLoading(true);

    // ✅ Fallback userId si medecinId absent
    const medecinId = localStorage.getItem("medecinId") || localStorage.getItem("userId");
    if (!medecinId) {
      setMessage("Veuillez vous reconnecter !");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5000/api/GET/AllConsultations/${medecinId}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) setMessage(data.message);
        else { setConsultation(data); setMessage(""); }
      })
      .catch(err => console.error("Erreur :", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { chargerConsultations(); }, []);

  const handleSupprimer = async () => {
    if (!itemASupprimer) return;
    try {
      await fetch(
        `http://localhost:5000/api/DELETE/consultation/${itemASupprimer.id}`,
        { method: "DELETE" }
      );
      setItemASupprimer(null);
      chargerConsultations();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-full mx-auto mt-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Liste des consultations
      </h2>

      {message && <p className="text-center text-red-500 text-sm mb-4">{message}</p>}

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-8">Chargement...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom et Prénom</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Médecin</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motif</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Diagnostic</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Traitement</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consultation.length > 0 ? (
                consultation.map((consult) => (
                  <tr key={consult.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {consult.patients?.nom} {consult.patients?.prenom}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      Dr {consult.medecin?.prenom}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">{consult.motif}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{consult.diagnostic}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{consult.traitement}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {new Date(consult.dateConsultation).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-3 py-2 text-sm text-center">
                      <button
                        onClick={() => setItemASupprimer(consult)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-gray-400 text-sm py-8">
                    Aucune consultation trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ModalConfirmation
        item={itemASupprimer}
        nomAffiche={
          itemASupprimer
            ? `${itemASupprimer.patients?.prenom} ${itemASupprimer.patients?.nom}`
            : ""
        }
        onConfirmer={handleSupprimer}
        onAnnuler={() => setItemASupprimer(null)}
      />
    </div>
  );
}