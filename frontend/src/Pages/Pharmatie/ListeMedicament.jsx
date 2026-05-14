import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaArchive } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ModalConfirmation } from "../confirmationSup/ModalConfirmation";

export default function ListeMedicaments() {
  const navigate = useNavigate();
  const [medicaments,    setMedicaments]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [itemASupprimer, setItemASupprimer] = useState(null);

  // ✅ chargerMedicaments défini dans le composant
  const chargerMedicaments = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/GET/medicaments")
      .then(res => res.json())
      .then(data => {
        setMedicaments(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Erreur :", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { chargerMedicaments(); }, []);

  const handleModifier = (med) => {
    navigate(`/modifier/medicament/${med.id}`, { state: { data: med } });
  };

  const handleSupprimer = async () => {
    if (!itemASupprimer) return;
    try {
      await fetch(
        `http://localhost:5000/api/DELETE/medicament/${itemASupprimer.id}`,
        { method: "DELETE" }
      );
      setItemASupprimer(null);
      chargerMedicaments();
    } catch (err) { console.error(err); }
  };

  const getExpirationColor = (dateExpiration) => {
    const diffDays = (new Date(dateExpiration) - new Date()) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) return "bg-green-100 text-green-700";
    if (diffDays > 7)  return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-700">Liste des médicaments</h2>
        <button
          onClick={() => navigate("/pharmatie/archives-medicaments")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600
            rounded-lg hover:bg-gray-200 text-sm font-medium transition"
        >
          <FaArchive size={14} />
          Voir archives
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-8">Chargement...</p>
      ) : (
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3">Nom médicament</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Forme</th>
                <th className="p-3">Dosage</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Prix</th>
                <th className="p-3">Expiration</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicaments.length > 0 ? (
                medicaments.map((med) => (
                  <tr key={med.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{med.nomMedicament}</td>
                    <td className="p-3">{med.categorie}</td>
                    <td className="p-3">{med.forme}</td>
                    <td className="p-3">{med.dosage}</td>
                    <td className="p-3">{med.stock}</td>
                    <td className="p-3">{med.prix} Ar</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${getExpirationColor(med.dateExpiration)}`}>
                        {new Date(med.dateExpiration).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                    <td className="p-3 text-center space-x-2">
                      <button onClick={() => handleModifier(med)}
                        className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600">
                        <FaEdit />
                      </button>
                      <button onClick={() => setItemASupprimer(med)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-gray-400 text-sm p-5">
                    Aucun médicament enregistré
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
        nomAffiche={itemASupprimer ? itemASupprimer.nomMedicament : ""}
        onConfirmer={handleSupprimer}
        onAnnuler={() => setItemASupprimer(null)}
      />
    </div>
  );
}