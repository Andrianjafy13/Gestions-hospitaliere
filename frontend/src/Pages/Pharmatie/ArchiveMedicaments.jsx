// pages/pharmacie/ArchiveMedicaments.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

export default function ArchiveMedicaments() {
  const navigate = useNavigate();
  const [expires, setExpires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/GET/medicaments/expires")
      .then(r => r.json())
      .then(d => setExpires(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600">
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-700">Archives Médicaments </h2>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-8">Chargement...</p>
      ) : expires.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">Aucun médicament archivé.</p>
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
                      day: "2-digit", month: "short", year: "numeric"
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}