import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
  } from "recharts";
  import React, {useState,useEffect} from "react";
  
  // ✅ Composant réutilisable pour chaque graphe
  function GrapheBarre({ titre, dataKey, couleur, data, nomTooltip }) {
    const total = data.reduce((sum, d) => sum + (d[dataKey] || 0), 0);
  
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">{titre}</p>
            <p className="text-2xl font-medium text-gray-800">{total} total</p>
          </div>
          <span className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-3 h-3 rounded-sm" style={{ background: couleur }}></span>
            {titre}
          </span>
        </div>
  
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="mois"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              label={{ value: "Mois", position: "insideBottom", offset: -10, style: { fontSize: 11, fill: "#9ca3af" } }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              label={{ value: "Nombre", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#9ca3af" } }}
            />
            <Tooltip
              formatter={(value) => [`${value}`, nomTooltip]}
              labelFormatter={(label) => `Mois : ${label}`}
              contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
            />
            <Bar dataKey={dataKey} fill={couleur} radius={[5, 5, 0, 0]} name={nomTooltip} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  // ✅ Page principale
  export default function StatsMensuelles() {
    const rawId = localStorage.getItem("medecinId");
    const medecinId = rawId && rawId !== "null" ? rawId : "all";
    const [data, setData] = useState([]);
  
    useEffect(() => {
        fetch(`http://localhost:5000/api/GET/stats-mensuelles/${medecinId}`)
          .then(res => res.json())
          .then((response) => {
            console.log("Réponse reçue:", response); // 👈 debug
      
            // ✅ Vérifier que les données existent avant de mapper
            const mois          = response.mois          || [];
            const consultations = response.consultations  || [];
            const patients      = response.patients       || [];
            const rendezvous    = response.rendezvous     || [];
      
            if (mois.length === 0) {
              console.warn("Aucune donnée reçue du backend");
              return;
            }
      
            setData(mois.map((m, i) => ({
              mois:          m,
              Consultations: consultations[i] || 0,
              Patients:      patients[i]      || 0,
              Rendezvous:    rendezvous[i]    || 0,
            })));
          })
          .catch(err => console.error("Erreur fetch:", err));
      }, [medecinId]);
  
    return (
      <div className="flex flex-col gap-6 p-6 grid grid-cols-1 md:grid-cols-2">
  
        {/* Graphe 1 — Consultations */}
        <GrapheBarre
          titre="Consultations par mois"
          dataKey="Consultations"
          couleur="#1D9E75"
          nomTooltip="Consultations"
          data={data}
        />
  
        {/* Graphe 2 — Patients */}
        <GrapheBarre
          titre="Patients par mois"
          dataKey="Patients"
          couleur="#7F77DD"
          nomTooltip="Patients"
          data={data}
        />
  
        {/* Graphe 3 — Rendez-vous */}
        <GrapheBarre
          titre="Rendez-vous par mois"
          dataKey="Rendezvous"
          couleur="#D85A30"
          nomTooltip="Rendez-vous"
          data={data}
        />
  
      </div>
    );
  }