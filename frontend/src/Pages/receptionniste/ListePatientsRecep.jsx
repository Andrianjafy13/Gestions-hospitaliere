import { Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function ListePatientRecep() {
  const [patients,  setPatients]  = useState([]);
  const [recherche, setRecherche] = useState("");
  const [loading,   setLoading]   = useState(true);
  const [erreur,    setErreur]    = useState("");

  // ✅ Lecture avec fallback sur userId
  const receptionnisteId = localStorage.getItem("receptionnisteId")
                        || localStorage.getItem("userId");

  useEffect(() => {
    // ✅ Vérification AVANT le fetch — évite l'URL /null
    if (!receptionnisteId || receptionnisteId === "null") {
      setErreur("Session expirée. Veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErreur("");

    fetch(`http://localhost:5000/api/GET/receptionniste/patients/${receptionnisteId}`)
      .then(r => {
        if (!r.ok) throw new Error(`Erreur HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        setPatients(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Erreur fetch patients :", err);
        setErreur("Impossible de charger les patients.");
      })
      .finally(() => setLoading(false));

  }, [receptionnisteId]); // ✅ dépendance correcte

  const patientsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(p =>
      (p.nom    || "").toLowerCase().includes(q) ||
      (p.prenom || "").toLowerCase().includes(q)
    );
  }, [patients, recherche]);

  // ── États de chargement et erreur ───────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">Chargement des patients...</p>
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-500 text-sm font-medium">{erreur}</p>
          <p className="text-gray-400 text-xs mt-1">
            receptionnisteId = {receptionnisteId || "introuvable"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl border border-gray-200
        overflow-hidden shadow-sm">

        {/* En-tête */}
        <div className="px-4 py-3 border-b border-gray-100
          flex flex-col sm:flex-row sm:items-center
          justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-teal-500" />
            <p className="font-medium text-gray-800 text-sm">
              Liste des patients enregistrés
            </p>
            <span className="text-xs bg-gray-100 text-gray-500
              px-2 py-0.5 rounded-full">
              {patientsFiltres.length}
            </span>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2
              -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher un patient..."
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200
                rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400
                w-full sm:w-56"
            />
          </div>
        </div>

        {/* Tableau */}
        {patientsFiltres.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">
              {recherche
                ? `Aucun patient trouvé pour "${recherche}"`
                : "Aucun patient enregistré"
              }
            </p>
            {recherche && (
              <button onClick={() => setRecherche("")}
                className="text-teal-600 text-xs mt-2 hover:underline">
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {["Nom", "Prénom", "Type", "Groupe sg.",
                    "Nom d'ajout", "Date d'ajout"].map(h => (
                    <th key={h}
                      className="px-4 py-3 text-left text-xs font-semibold
                        text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {patientsFiltres.map(p => (
                  <tr key={p.id}
                    className="hover:bg-gray-50 transition-colors">

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100
                          flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-teal-700">
                            {p.prenom?.[0]?.toUpperCase()}
                            {p.nom?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {p.nom}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {p.prenom}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        font-medium ${
                        p.typePatient === "Urgence"
                          ? "bg-red-100 text-red-700"
                          : p.typePatient === "Hospitalisé"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                      }`}>
                        {p.typePatient || "Externe"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-500">
                      {p.groupeSanguin || "—"}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-700">
                      {p.medecin
                        ? ` ${p.medecin.prenom} ${p.medecin.nom}`
                        : <span className="text-gray-400 italic">Non assigné</span>
                      }
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-500">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "short", year: "numeric",
                          })
                        : "—"
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}