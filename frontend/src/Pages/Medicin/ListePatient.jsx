import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { ModalConfirmation } from "../confirmationSup/ModalConfirmation";
import { useNavigate } from "react-router-dom";

export default function PatientTable() {
  const navigate = useNavigate();
  const [patients,       setPatients]       = useState([]);
  const [message,        setMessage]        = useState("");
  const [loading,        setLoading]        = useState(true);
  const [itemASupprimer, setItemASupprimer] = useState(null);

  const chargerPatients = () => {
    // ✅ Fallback userId si medecinId absent
    const medecinId = localStorage.getItem("medecinId") || localStorage.getItem("userId");
    if (!medecinId) {
      setMessage("Veuillez vous reconnecter !");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`http://localhost:5000/api/GET/Liste_patients/${medecinId}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) setMessage(data.message);
        else { setPatients(data); setMessage(""); }
      })
      .catch(err => console.error("Erreur :", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { chargerPatients(); }, []);

  const handleModifier = (patient) => {
    navigate(`/modifier/patient/${patient.id}`, { state: { data: patient } });
  };

  const handleSupprimer = async () => {
    if (!itemASupprimer) return;
    try {
      await fetch(
        `http://localhost:5000/api/DELETE/patient/${itemASupprimer.id}`,
        { method: "DELETE" }
      );
      setItemASupprimer(null);
      chargerPatients();
    } catch (err) { console.error("Erreur suppression:", err); }
  };

  return (
    <div className="max-w-full mx-auto mt-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Liste des patients
      </h2>

      {message && (
        <p className="text-center text-red-500 text-sm mb-4">{message}</p>
      )}

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-8">Chargement...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Date de naissance</th>
                <th className="py-2 text-center text-xs font-medium text-gray-500 uppercase">Sexe</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Type patient</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Groupe sanguin</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Chambre</th>
                <th className="py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-sm text-gray-700">{patient.nom}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{patient.prenom}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {patient.dateNaissance
                        ? new Date(patient.dateNaissance).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">{patient.sexe || "—"}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{patient.telephone || "—"}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{patient.typePatient || "—"}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{patient.groupeSanguin || "—"}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{patient.chambre?.numero || "—"}</td>
                    <td className="px-3 py-2 text-sm text-center space-x-2">
                      <button
                        onClick={() => handleModifier(patient)}
                        className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                        title="Modifier">
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => setItemASupprimer(patient)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        title="Supprimer">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-gray-400 text-sm py-8">
                    Aucun patient trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ModalConfirmation
        item={itemASupprimer}
        nomAffiche={itemASupprimer ? `${itemASupprimer.prenom} ${itemASupprimer.nom}` : ""}
        onConfirmer={handleSupprimer}
        onAnnuler={() => setItemASupprimer(null)}
      />
    </div>
  );
}