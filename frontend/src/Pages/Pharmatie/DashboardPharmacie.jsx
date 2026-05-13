import { useState, useEffect } from "react";
import { Package, AlertTriangle, Clock, FileText } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function DashboardPharmacie() {
  const pharmaNom = localStorage.getItem("pharmaNom") || "Pharmacien";

  const [stats,          setStats]          = useState({
    totalMedicament: 0,
    ordonnances: 0,
    ruptureStock:    [],
    stockFaible:     [],
    stockCritique: [],
    expirentBientot: [],
  });
  const [stockCritique, setStockCritique] = useState([]);
  const [ordonnances,   setOrdonnances]   = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/GET/totalMedicament")
      .then(r => r.json()).then(data => {
        setStats({
          totalMedicament: data.totalMedicament || 0,
          ruptureStock: data.ruptureStock || [],
          stockFaible: data.stockFaible || [],
          stockCritique: data.stockCritique || [],
          expirentBientot: data.expirentBientot || [],
          ordonnances: data.ordonnances || 0
        });
      }).catch(console.error);

    // fetch("http://localhost:5000/api/GET/medicaments/stock-critique")
    //   .then(r => r.json()).then(d => setStockCritique(Array.isArray(d) ? d : [])).catch(console.error);

    fetch("http://localhost:5000/api/GET/notifications/pharmacie/ordonnances")
      .then(r => r.json()).then(d => setOrdonnances(Array.isArray(d) ? d.slice(0,5) : [])).catch(console.error);
  }, []);

  const getExpirationStyle = (dateExpiration) => {
    const diffDays = (new Date(dateExpiration) - new Date()) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) return "bg-teal-100 text-teal-800";
    if (diffDays > 7)  return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };
  const totalAlertes =
    stats.stockFaible.length +
    stats.stockCritique.length;

  return (
    <div className="p-2 flex flex-col gap-5">
      
       {/* ✅ ALERTES MÉDICAMENTS */}
       {totalAlertes > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {/* En-tête */}
          <div className="bg-red-800 px-5 py-3 flex items-center justify-between">
            <p className="font-medium text-red-100 text-sm">
              Alertes médicaments
            </p>

            <Link
              to="/pharmatie/alertes-medicaments"
              className="bg-red-600 text-red-100 text-xs px-2 py-0.5 rounded-full hover:bg-red-700 transition"
            >
              {totalAlertes} alerte(s)
            </Link>
          </div>
        </div>
      )}
      {/* CARDS STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
                { label: "Total médicaments",  value: stats.totalMedicament, icon: <Package size={16} />, bg: "bg-green-50",  text: "text-green-700" },
                { label: "Stock faible",  value: stats.stockFaible.length, icon: <AlertTriangle size={16} />, bg: "bg-green-50",  text: "text-green-700" },

                // ✅ FIX ICI
                { label: "Expirent bientôt",   
                  value: stats.expirentBientot.length,    
                  icon: <Clock size={16} />,         
                  bg: "bg-red-50",    
                  text: "text-red-700"   
                },

                { label: "Ordonnances reçues", 
                  value: stats.ordonnances, 
                  icon: <FileText size={16} />,      
                  bg: "bg-blue-50",   
                  text: "text-blue-700"  
                },
              ].map(({ label, value, icon, bg, text }) => (
                <div key={label} className={`${bg} rounded-xl p-4`}>
                  <div className={`flex items-center gap-2 ${text} mb-1`}>
                    {icon}
                    <p className="text-xs">{label}</p>
                  </div>

                  {/* ✅ IMPORTANT */}
                  <p className="text-2xl font-medium text-gray-800">
                    {value ?? 0}
                  </p>
                </div>
              ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* STOCK CRITIQUE */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-medium text-gray-800 text-sm">Stock critique</p>
            <button onClick={() => navigate("/pharmatie/medicaments")}
              className="text-xs text-green-600 hover:underline">Voir tout</button>
          </div>
          {stats.stockCritique.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">
                Stock suffisant
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.stockCritique.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {m.nomMedicament}
                      </p>
                      <p className="text-xs text-gray-500">
                        {m.forme} · {m.dosage}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-medium ${m.stock <= 5 ? "text-red-600" : "text-amber-600"}`}>
                        {m.stock} restants
                      </p>

                      <span className={`text-xs px-2 py-0.5 rounded-full ${getExpirationStyle(m.dateExpiration)}`}>
                        {new Date(m.dateExpiration).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* ORDONNANCES REÇUES */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-medium text-gray-800 text-sm">Ordonnances reçues</p>
            <button onClick={() => navigate("/pharmatie/delivrance-ordonance")}
              className="text-xs text-blue-600 hover:underline">Gérer</button>
          </div>
          {ordonnances.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Aucune ordonnance</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {ordonnances.map(o => (
                <div key={o.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{o.patientNom}</p>
                    <p className="text-xs text-gray-500">
                      {o.medecinNom} · {new Date(o.createdAt).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full
                    ${!o.vu
                      ? "bg-blue-100 text-blue-800"
                      : "bg-teal-100 text-teal-800"}`}>
                    {!o.vu ? "Nouveau" : "Délivré"}
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
            { label: "Délivrer ordonnance", path: "/Pharmatie/delivranceOrdonance", color: "bg-blue-600 text-white hover:bg-blue-700"   },
            { label: "Ajouter médicament",  path: "/Pharmatie/Ajout-medicament",   color: "bg-green-600 text-white hover:bg-green-700" },
            { label: "Liste médicaments",   path: "/Pharmatie/ListeMedicament",           color: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
           
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