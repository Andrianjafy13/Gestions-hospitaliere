import React, {useEffect, useState} from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, } from "recharts";
import { useLanguage } from "../../i18n/LanguageContext";

export default function Dashboard() {
  const { t } = useLanguage();
  const rawId = localStorage.getItem("medecinId");

  // ✅ Nettoyer les valeurs invalides
  const medecinId =
    rawId && rawId !== "null" && rawId !== "undefined" ? rawId : null;

  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // ✅ medecinId dans l'URL directement
    const statsUrl = medecinId
      ? `http://localhost:5000/api/GET/stats/${medecinId}`
      : `http://localhost:5000/api/GET/stats/all`;
  
    const chartUrl = medecinId
      ? `http://localhost:5000/api/GET/chart/${medecinId}`
      : `http://localhost:5000/api/GET/chart/all`;
  
    fetch(statsUrl)
      .then((res) => res.json())
      .then((data) => {
        console.log("Stats reçues :", data);
        setStats(data);
      })
      .catch((err) => console.error("Erreur stats:", err));
  
    fetch(chartUrl)
      .then((res) => res.json())
      .then((data) => setChartData(data))
      .catch((err) => console.error("Erreur chart:", err));
  
  }, [medecinId]);
  return (
    <div className="bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {t("dashboard.medicalTitle")}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card title={t("dashboard.consultations")} value={stats.totalConsultations} />
        <Card title={t("dashboard.appointments")} value={stats.totalRendezVous} />
        <Card title={t("dashboard.uniquePatients")} value={stats.patientsUniques} />
        <Card title={t("dashboard.totalPatients")} value={stats.patientsEnregistrer} />
        <Card title={t("dashboard.todayConsultations")} value={stats.consultationsToday} />
      </div>

      {/* GRAPH CONSULTATIONS AUJOURD'HUI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
  <div className="bg-gray-50 rounded-lg p-4">
    <p className="text-sm text-gray-500 mb-1">{t("dashboard.totalToday")}</p>
    <p className="text-2xl font-medium text-gray-800">
      {chartData.reduce((sum, d) => sum + d.total, 0)}
    </p>
  </div>
  <div className="bg-gray-50 rounded-lg p-4">
    <p className="text-sm text-gray-500 mb-1">{t("dashboard.lastActiveHour")}</p>
    <p className="text-2xl font-medium text-gray-800">
      {chartData.length > 0 ? chartData[chartData.length - 1].heure : "—"}
    </p>
  </div>
</div>

{/* GRAPHE */}
<div className="bg-white p-6 rounded-xl shadow mb-8">
  <h2 className="text-lg font-semibold mb-4 text-gray-800">
    {t("dashboard.todayByHour")}
  </h2>

  {chartData.length === 0 ? (
    <p className="text-gray-400 text-sm">{t("dashboard.noConsultationToday")}</p>
  ) : (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

        {/* ✅ Axe X — heures */}
        <XAxis
          dataKey="heure"
          label={{
            value: t("dashboard.consultationHour"),
            position: "insideBottom",
            offset: -5,
            style: { fontSize: 12, fill: "#9ca3af" },
          }}
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />

        {/* ✅ Axe Y — nombre de consultations */}
        <YAxis
          allowDecimals={false}
          label={{
            value: t("dashboard.consultationCount"),
            angle: -90,
            position: "insideLeft",
            offset: 10,
            style: { fontSize: 12, fill: "#9ca3af" },
          }}
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />

        <Tooltip
          formatter={(value) => [`${value} ${t("dashboard.tooltipConsultations")}`, t("dashboard.tooltipTotal")]}
          labelFormatter={(label) => `${t("dashboard.tooltipHour")} : ${label}`}
          contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#1D9E75"
          strokeWidth={2.5}
          dot={{ r: 5, fill: "#1D9E75", strokeWidth: 2, stroke: "#fff" }}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
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
