import { useState, useEffect } from "react";
import { HeartPulse, BedDouble, AlertTriangle, Clock, User } from "lucide-react";

export default function DashboardInfirmerie() {
  const infirmierId = localStorage.getItem("infirmierId");
  const infirmierNom = localStorage.getItem("infirmierNom") || "Infirmier";

  const [stats,    setStats]    = useState([]);
  const [critiques, setCritiques] = useState([]);
  const [soins,    setSoins]    = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/GET/hospitalise")
    .then(res => res.json())
    .then(data => {
      console.log("Stats reçues:", data);
      // ✅ data = { totalHospitalise: 3, totalUrgence: 1 }
      setStats(prev => ({
        ...prev,
        totalHospitalise: data.totalHospitalise || 0,
        totalUrgence:     data.totalUrgence     || 0,
        totalGarde:     data.totalGarde     || 0,
      }));
    })
    .catch(err => console.error("Erreur stats:", err));
    
    // fetch(`http://localhost:5000/api/GET/infirmerie/critiques`)
    //   .then(r => r.json()).then(d => setCritiques(Array.isArray(d) ? d : [])).catch(console.error);

    // fetch(`http://localhost:5000/api/GET/soins/today`)
    //   .then(r => r.json()).then(d => setSoins(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  const etatStyle = {
    Critique:    "bg-red-100 text-red-800",
    Observation: "bg-amber-100 text-amber-800",
    Stable:      "bg-teal-100 text-teal-800",
  };

  // const marquerFait = async (id) => {
  //   await fetch(`http://localhost:5000/api/PUT/soins/${id}/fait`, { method: "PUT" });
  //   setSoins(prev => prev.map(s => s.id === id ? { ...s, fait: true } : s));
  // };

  return (
    <div className="p-6 flex flex-col gap-5">

      {/* CARDS STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
           { label: "Patients Hospitalisé",         value: stats.totalHospitalise,        icon: <User size={16} />,    bg: "bg-amber-50", text: "text-amber-700" },
          { label: "Etat du patient",         value: stats.totalUrgence,        icon: <HeartPulse size={16} />,    bg: "bg-amber-50", text: "text-amber-700" },
          { label: "Urgences",      value: stats.totalUrgence,     icon: <AlertTriangle size={16} />, bg: "bg-red-50",   text: "text-red-700" },
          { label: "Garde actuelle",        value: stats.totalGarde,        icon: <Clock size={16} />,         bg: "bg-blue-50",  text: "text-blue-700" },
        ].map(({ label, value, icon, bg, text }) => (
          <div key={label} className={`${bg} rounded-xl p-4`}>
            <div className={`flex items-center gap-2 ${text} mb-1`}>
              {icon}
              <p className="text-xs">{label}</p>
            </div>
            <p className="text-2xl font-medium text-gray-800">{value ?? "—"}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* PATIENTS CRITIQUES */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-medium text-gray-800 text-sm">Patients à surveiller</p>
          </div>
          {critiques.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Aucun patient critique</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {critiques.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-red-800">
                      {p.prenom?.[0]}{p.nom?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-gray-500">Ch.{p.chambre?.numero} · J+{p.joursHospitalisation}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${etatStyle[p.etat] || "bg-gray-100 text-gray-600"}`}>
                    {p.etat}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SOINS DU JOUR */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-medium text-gray-800 text-sm">Soins à administrer</p>
          </div>
          {soins.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Aucun soin planifié</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {soins.map(s => (
                <div key={s.id}
                  className={`flex items-center gap-3 px-4 py-3 ${s.fait ? "opacity-50" : ""}`}>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{s.medicament}</p>
                    <p className="text-xs text-gray-500">
                      {s.Patient?.prenom} {s.Patient?.nom} · {s.heure?.slice(0,5)}
                    </p>
                  </div>
                  <button
                    onClick={() => marquerFait(s.id)}
                    disabled={s.fait}
                    className={`text-xs px-3 py-1 rounded-lg border transition
                      ${s.fait
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"}`}>
                    {s.fait ? "Fait" : "Marquer fait"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* URGENCES ACTIVES */}
      <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
        <div className="bg-red-800 px-4 py-3 flex items-center justify-between">
          <p className="font-medium text-red-100 text-sm">Urgences actives</p>
          <span className="text-xs bg-red-600 text-red-100 px-2 py-0.5 rounded-full">
            {stats.urgences} active(s)
          </span>
        </div>
        {stats.urgences === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">Aucune urgence</p>
        ) : (
          <div className="p-4 flex flex-col gap-2">
            <p className="text-sm text-gray-500">Vérifiez le module Signalement des urgences.</p>
          </div>
        )}
      </div>
    </div>
  );
}
function Card({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-gray-500 text-sm">{title}</h2>
      <p className="text-3xl font-bold text-teal-600">
        {value || 0}
      </p>
    </div>
  );
}