import { useState, useEffect, useMemo } from "react";
import { Users, Calendar, Clock, XCircle, CheckCircle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ══════════════════════════════════════════
//  SOUS-COMPOSANT — Carte KPI
// ══════════════════════════════════════════
function CarteKPI({ label, value, icon, bg, text, bordure }) {
  return (
    <div className={`${bg} rounded-xl p-4 border-l-4 ${bordure} shadow-sm`}>
      <div className={`flex items-center gap-2 ${text} mb-2`}>
        {icon}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value ?? 0}</p>
    </div>
  );
}

// ══════════════════════════════════════════
//  SOUS-COMPOSANT — Badge statut RDV
// ══════════════════════════════════════════
function BadgeStatut({ statut }) {
  const styles = {
    "Validé":     "bg-green-100 text-green-700",
    "En attente": "bg-amber-100 text-amber-700",
    "Annulé":     "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
      ${styles[statut] || "bg-gray-100 text-gray-500"}`}>
      {statut || "—"}
    </span>
  );
}

// ══════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════
export default function DashboardReceptionniste() {
  const receptNom = localStorage.getItem("receptNom") || "Réceptionniste";
  const navigate  = useNavigate();

  const [stats,       setStats]       = useState({ patients: 0, valides: 0, enAttente: 0, annules: 0 });
  const [prochainRdv, setProchainRdv] = useState([]);
  const [patients,    setPatients]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  // ── Chargement ──────────────────────────────────────────
  useEffect(() => {
    const receptionnisteId = localStorage.getItem("receptionnisteId")
                        || localStorage.getItem("userId");
    setLoading(true);
    Promise.all([
      fetch(`http://localhost:5000/api/GET/receptionniste/stats/${receptionnisteId}`)
        .then(r => r.json()),
      fetch("http://localhost:5000/api/GET/receptionniste/prochains-rdv")
        .then(r => r.json()),
      fetch(`http://localhost:5000/api/GET/receptionniste/patients/${receptionnisteId}`)
        .then(r => r.json()),
    ])
      .then(([statsData, rdvData, patientsData]) => {
        setStats(statsData);
        setProchainRdv(Array.isArray(rdvData)     ? rdvData.slice(0, 5) : []);
        setPatients(Array.isArray(patientsData)   ? patientsData        : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 bg-gray-50 min-h-screen">

      {/* EN-TÊTE */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">
          Bonjour, {receptNom}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long", day: "2-digit",
            month: "long", year: "numeric",
          })}
        </p>
      </div>

      {/* ── CARTES KPI ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CarteKPI
          label="Total Patients"
          value={stats.patients}
          icon={<Users size={16} />}
          bg="bg-blue-50"
          text="text-blue-700"
          bordure="border-blue-400"
        />
        <CarteKPI
          label="RDV Validés"
          value={stats.valides}
          icon={<CheckCircle size={16} />}
          bg="bg-green-50"
          text="text-green-700"
          bordure="border-green-400"
        />
        <CarteKPI
          label="RDV En attente"
          value={stats.enAttente}
          icon={<Clock size={16} />}
          bg="bg-amber-50"
          text="text-amber-700"
          bordure="border-amber-400"
        />
        <CarteKPI
          label="RDV Annulés"
          value={stats.annules}
          icon={<XCircle size={16} />}
          bg="bg-red-50"
          text="text-red-700"
          bordure="border-red-400"
        />
      </div>

      {/* ── SECTION CENTRALE ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* PROCHAINS RDV */}
        <div className="bg-white rounded-xl border border-gray-200
          overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100
            flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-blue-500" />
              <p className="font-medium text-gray-800 text-sm">
                Prochains rendez-vous
              </p>
            </div>
            <button
              onClick={() => navigate("/Receptionniste/ListeRendezvous")}
              className="text-xs text-blue-600 hover:underline">
              Voir tout
            </button>
          </div>

          {prochainRdv.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              Aucun RDV prévu
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {prochainRdv.map(rdv => (
                <div key={rdv.id}
                  className="flex items-center gap-3 px-4 py-3
                    hover:bg-gray-50 transition-colors">

                  {/* Heure */}
                  <div className="min-w-[48px] text-center bg-blue-50
                    rounded-lg py-1.5 flex-shrink-0">
                    <p className="text-sm font-semibold text-blue-700">
                      {rdv.heureRendezVous?.slice(0, 5)}
                    </p>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {rdv.patients?.prenom} {rdv.patients?.nom}
                    </p>
                    <p className="text-xs text-gray-500">
                      Dr. {rdv.medecin?.prenom} {rdv.medecin?.nom}
                    </p>
                  </div>

                  {/* Statut + Priorité */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <BadgeStatut statut={rdv.statut} />
                    {rdv.priorite === "urgente" && (
                      <span className="text-xs bg-red-100 text-red-600
                        px-2 py-0.5 rounded-full">
                        Urgence
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RÉPARTITION STATUTS — graphique simple */}
        <div className="bg-white rounded-xl border border-gray-200
          overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-medium text-gray-800 text-sm">
              Répartition des rendez-vous
            </p>
          </div>
          <div className="p-4 space-y-4">
            {[
              { label: "Validés",     value: stats.valides,    total: stats.valides + stats.enAttente + stats.annules, color: "bg-green-400" },
              { label: "En attente",  value: stats.enAttente,  total: stats.valides + stats.enAttente + stats.annules, color: "bg-amber-400" },
              { label: "Annulés",     value: stats.annules,    total: stats.valides + stats.enAttente + stats.annules, color: "bg-red-400"   },
            ].map(({ label, value, total, color }) => {
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs
                    text-gray-600 mb-1">
                    <span>{label}</span>
                    <span className="font-medium">{value} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`${color} h-2 rounded-full transition-all
                        duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div className="pt-3 border-t border-gray-100 flex
              justify-between text-sm">
              <span className="text-gray-500">Total RDV</span>
              <span className="font-bold text-gray-800">
                {stats.valides + stats.enAttente + stats.annules}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIONS RAPIDES ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="font-medium text-gray-800 text-sm mb-3">Actions rapides</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Nouveau rendez-vous", path: "/Receptionniste/CréeRendezvous",   color: "bg-blue-600 text-white hover:bg-blue-700"   },
            { label: "Nouveau patient",     path: "/Receptionniste/CréerPatient",      color: "bg-teal-600 text-white hover:bg-teal-700"   },
            { label: "Liste rendez-vous",   path: "/Receptionniste/ListeRendezvous",   color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
          ].map(({ label, path, color }) => (
            <button key={label} onClick={() => navigate(path)}
              className={`text-sm px-4 py-2 rounded-lg font-medium
                transition-colors ${color}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}