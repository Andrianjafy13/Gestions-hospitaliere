import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function PharmacieChart() {

  const [stats, setStats] = useState({
    totalMedicament: 0,
    ruptureStock: [],
    stockFaible: [],
    stockCritique: [],
    expirentBientot: [],
    ordonnances: 0
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/GET/totalMedicament")
      .then(r => r.json())
      .then(data => {
        setStats({
          totalMedicament: data.totalMedicament || 0,
          ruptureStock: data.ruptureStock || [],
          stockFaible: data.stockFaible || [],
          // ⚠️ backend n'envoie pas stockCritique → on le calcule
          stockCritique: data.stockCritique || [],
          expirentBientot: data.expirentBientot || [],
          ordonnances: data.ordonnances || 0
        });
      })
      .catch(console.error);

  }, []);

  // ✅ DATA GRAPHE
  const data = [
    {
      name: "Critique",
      value: stats.stockCritique.length
    },
    {
      name: "Stock faible",
      value: stats.stockFaible.length
    },
    {
      name: "Expire bientôt",
      value: stats.expirentBientot.length
    }
  ];

  const COLORS = ["#ef4444", "#22c55e", "#eab308"];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm font-medium text-gray-800 mb-3">
        Statistiques des alertes
      </p>

      <div className="w-full h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              label
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}