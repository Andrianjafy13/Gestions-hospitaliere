import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AlertesMedicamentsPage() {
  const [stats, setStats] = useState({
    ruptureStock: [],
    stockFaible: [],
    stockCritique: []
  });
  const [stockCritique, setStockCritique] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/GET/totalMedicament")
    .then(res => res.json())
    .then(data => {
      setStats({
        ruptureStock: data.ruptureStock || [],
        stockFaible: data.stockFaible || [],
        stockCritique: data.stockCritique || [],
      });
    })
    .catch(console.error);

  }, []);

  const totalAlertes =
  (stats.stockFaible?.length || 0) +
  (stats.stockCritique?.length || 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-800">
          Alertes médicaments
        </h2>

        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:underline"
        >
          Retour
        </button>
      </div>

      {/* AUCUNE ALERTE */}
      {totalAlertes === 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <p className="text-sm text-teal-700 font-medium">
            Aucun problème détecté
          </p>
        </div>
      )}

      {/* LISTE ALERTES */}
      {totalAlertes > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {/* EN-TÊTE */}
          <div className="bg-red-800 px-5 py-3 flex items-center justify-between">
            <p className="font-medium text-red-100 text-sm">
              Liste des alertes
            </p>
            <span className="bg-red-600 text-red-100 text-xs px-2 py-0.5 rounded-full">
              {totalAlertes}
            </span>
          </div>

          <div className="divide-y divide-gray-100">

            {/* 🔴 Rupture */}
            {stats.ruptureStock.map(m => (
              <div key={m.id}
                className="flex items-center gap-3 px-5 py-3 border-l-4 border-l-red-500 bg-red-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    {m.nomMedicament}
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {m.forme} · {m.dosage}
                  </p>
                </div>
                <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">
                  Rupture — 0 en stock
                </span>
              </div>
            ))}

            {/* 🟡 Stock faible */}
            {stats.stockFaible.map(m => (
              <div key={m.id}
                className="flex items-center gap-3 px-5 py-3 border-l-4 border-l-amber-500 bg-amber-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    {m.nomMedicament}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {m.forme} · {m.dosage}
                  </p>
                </div>
                <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full">
                  Stock faible — {m.stock}
                </span>
              </div>
            ))}
            {stats.stockCritique.map(m => (
              <div key={m.id}
                className="flex items-center gap-3 px-5 py-3 border-l-4 border-l-amber-500 bg-amber-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    {m.nomMedicament}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {m.forme} · {m.dosage}
                  </p>
                </div>
                <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full">
                  Stock critique — {m.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}