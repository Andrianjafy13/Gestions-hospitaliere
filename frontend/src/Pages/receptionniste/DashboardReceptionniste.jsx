import { useState, useEffect } from "react";
import { Users, Calendar, Clock, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardReceptionniste() {
  const receptNom = localStorage.getItem("receptNom") || "Réceptionniste";

  const [stats,      setStats]      = useState({ patients: 0, rdvConfirmes: 0, enAttente: 0, annules: 0 });
  const [prochainRdv, setProchainRdv] = useState([]);
  const [fileAttente, setFileAttente] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/GET/receptionniste/stats")
      .then(r => r.json()).then(setStats).catch(console.error);

    fetch("http://localhost:5000/api/GET/receptionniste/prochains-rdv")
      .then(r => r.json()).then(d => setProchainRdv(Array.isArray(d) ? d.slice(0,5) : [])).catch(console.error);

    fetch("http://localhost:5000/api/GET/file/all")
      .then(r => r.json()).then(d => setFileAttente(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  const statutStyle = {
    en_cours: "bg-teal-100 text-teal-800",
    attente:  "bg-blue-100 text-blue-800",
    termine:  "bg-gray-100 text-gray-600",
  };

  const statutLabel = {
    en_cours: "En consultation",
    attente:  "En attente",
    termine:  "Terminé",
  };

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* CARDS STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Patients aujourd'hui", value: stats.patients,     icon: <Users size={16} />,    bg: "bg-blue-50",  text: "text-blue-700"  },
          { label: "RDV confirmés",        value: stats.rdvConfirmes, icon: <Calendar size={16} />, bg: "bg-teal-50",  text: "text-teal-700"  },
          { label: "En attente",           value: stats.enAttente,    icon: <Clock size={16} />,    bg: "bg-amber-50", text: "text-amber-700" },
          { label: "Annulés",              value: stats.annules,      icon: <XCircle size={16} />,  bg: "bg-red-50",   text: "text-red-700"   },
        ].map(({ label, value, icon, bg, text }) => (
          <div key={label} className={`${bg} rounded-xl p-4`}>
            <div className={`flex items-center gap-2 ${text} mb-1`}>
              {icon}
              <p className="text-xs">{label}</p>
            </div>
            <p className="text-2xl font-medium text-gray-800">{value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* PROCHAINS RDV */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-medium text-gray-800 text-sm">Prochains rendez-vous</p>
            <button onClick={() => navigate("/receptionniste/rendez-vous")}
              className="text-xs text-blue-600 hover:underline">Voir tout</button>
          </div>
          {prochainRdv.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Aucun RDV prévu</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {prochainRdv.map(rdv => (
                <div key={rdv.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-[44px] text-center bg-blue-50 rounded-lg py-1.5">
                    <p className="text-sm font-medium text-blue-800">
                      {rdv.heureRendezVous?.slice(0,5)}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {rdv.Patient?.prenom} {rdv.Patient?.nom}
                    </p>
                    <p className="text-xs text-gray-500">Dr. {rdv.Medecin?.prenom}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full
                    ${rdv.priorite === "urgente"
                      ? "bg-red-100 text-red-700"
                      : "bg-teal-100 text-teal-700"}`}>
                    {rdv.priorite}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FILE D'ATTENTE */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-medium text-gray-800 text-sm">File d'attente</p>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {fileAttente.filter(f => f.statut === "attente").length} en attente
            </span>
          </div>
          {fileAttente.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">File vide</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {fileAttente.slice(0, 5).map(f => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${f.statut === "en_cours" ? "bg-teal-600" : "bg-gray-100"}`}>
                    <span className={`text-xs font-medium
                      ${f.statut === "en_cours" ? "text-white" : "text-gray-600"}`}>
                      {f.numero}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      {f.Patient?.prenom} {f.Patient?.nom}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statutStyle[f.statut]}`}>
                    {statutLabel[f.statut]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS RAPIDES */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="font-medium text-gray-800 text-sm mb-3">Actions rapides</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Nouveau rendez-vous", path: "/Receptionniste/CréeRendezvous", color: "bg-blue-600 text-white hover:bg-blue-700" },
            { label: "Nouveau patient",     path: "/Receptionniste/CréerPatient",     color: "bg-teal-600 text-white hover:bg-teal-700" },
            { label: "Liste patients",      path: "/receptionniste/patients",           color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
            { label: "File d'attente",      path: "/receptionniste/file-attente",       color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
          ].map(({ label, path, color }) => (
            <button key={label} onClick={() => navigate(path)}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition ${color}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}