// pages/pharmacie/ArchiveMedicaments.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSync, FaTrash } from "react-icons/fa";
import { ModalConfirmation } from "../confirmationSup/ModalConfirmation";

export default function ArchiveMedicaments() {
  const navigate = useNavigate();
  const [expires,    setExpires]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [archivage,  setArchivage]  = useState(false); // état bouton
  const [itemASupprimerArch, setItemASupprimerArach] = useState(null);

  const chargerExpires = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/GET/medicaments/expires")
      .then(r => r.json())
      .then(d => setExpires(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { chargerExpires()
   }, []);

   const handleSupprimer = async () => {
    if (!itemASupprimerArch) return;
    try {
      await fetch(
        `http://localhost:5000/api/DELETE/archive/${itemASupprimerArch.id}`,
        { method: "DELETE" }
      );
      setItemASupprimerArach(null);
      chargerExpires();
    } catch (err) { console.error(err); }
  };

  // ✅ Déclenche l'archivage immédiatement sans attendre minuit
  const lancerArchivage = async () => {
    setArchivage(true);
    try {
      const res  = await fetch(
        "http://localhost:5000/api/insertion/medicaments/archiver-perimes",
        { method: "POST" }
      );
      const data = await res.json();
      alert(`✅ ${data.archives} médicament(s) archivé(s).`);
      chargerExpires(); // recharger la liste
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'archivage.");
    } finally {
      setArchivage(false);
    }
  };


  return (
    <div className="p-6">

      {/* EN-TÊTE */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-700">
              Archives  Médicaments expirés
            </h2>
          </div>
        </div>

        {/* ✅ Bouton archivage manuel */}
        <button
          onClick={lancerArchivage}
          disabled={archivage}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white
            rounded-lg hover:bg-red-600 text-sm font-medium transition
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaSync className={archivage ? "animate-spin" : ""} size={13} />
          {archivage ? "Archivage..." : "Archiver périmés"}
        </button>
      </div>

      {/* CONTENU */}
      {loading ? (
        <p className="text-center text-gray-400 text-sm py-8">Chargement...</p>
      ) : expires.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">Aucun médicament archivé.</p>
          <p className="text-gray-300 text-xs mt-1">
            Cliquez sur "Archiver périmés" pour lancer la vérification.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-red-50 text-gray-600">
              <tr>
                <th className="p-3">Nom médicament</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Forme</th>
                <th className="p-3">Dosage</th>
                <th className="p-3">Stock au retrait</th>
                <th className="p-3">Prix</th>
                <th className="p-3">Date expiration</th>
                <th className="p-3">Date archivage</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {expires.map((m, i) => (
                <tr key={m.id ?? i} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-700">{m.nomMedicament}</td>
                  <td className="p-3">{m.categorie}</td>
                  <td className="p-3">{m.forme}</td>
                  <td className="p-3">{m.dosage}</td>
                  <td className="p-3">{m.stockAuRetrait}</td>
                  <td className="p-3">{m.prix} Ar</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold
                      bg-red-100 text-red-700">
                      {new Date(m.dateExpiration).toLocaleDateString("fr-FR")}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400 text-xs">
                    {new Date(m.dateArchivage).toLocaleDateString("fr-FR", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>
                  <button onClick={() => setItemASupprimerArach(m)}
                        className="p-1 mt-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                        <FaTrash />
                      </button>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
       {/* ✅ Modal EN DEHORS du tableau */}
       <ModalConfirmation
        item={itemASupprimerArch}
        nomAffiche={itemASupprimerArch ? itemASupprimerArch.nomMedicament : ""}
        onConfirmer={handleSupprimer}
        onAnnuler={() => setItemASupprimerArach(null)}
      />
    </div>
  );
}