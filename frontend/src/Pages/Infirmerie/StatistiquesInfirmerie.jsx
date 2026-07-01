import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BedDouble,
  CalendarDays,
  RefreshCw,
  TrendingUp,
  UsersRound,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/GET/infirmerie/stats-patients-jour";

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "-";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatBox({ icon, label, value, helper, className }) {
  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-32 animate-pulse rounded-lg bg-white" />
      ))}
    </div>
  );
}

export default function StatistiquesInfirmerie() {
  const [periode, setPeriode] = useState("14");
  const [data, setData] = useState({
    resume: {},
    parJour: [],
    patientsRecents: [],
  });
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  const chargerStats = async () => {
    setLoading(true);
    setErreur("");

    try {
      const response = await fetch(`${API_URL}?jours=${periode}`);
      const resultat = await response.json();

      if (!response.ok) {
        throw new Error(resultat.message || "Erreur lors du chargement.");
      }

      setData({
        resume: resultat.resume || {},
        parJour: Array.isArray(resultat.parJour) ? resultat.parJour : [],
        patientsRecents: Array.isArray(resultat.patientsRecents)
          ? resultat.patientsRecents
          : [],
      });
    } catch (error) {
      console.error(error);
      setErreur("Impossible de charger les statistiques infirmier.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerStats();
  }, [periode]);

  const totalPeriode = useMemo(
    () => data.parJour.reduce((total, jour) => total + (jour.total || 0), 0),
    [data.parJour]
  );

  const jourMax = useMemo(() => {
    if (data.parJour.length === 0) return null;
    return data.parJour.reduce(
      (max, jour) => (jour.total > max.total ? jour : max),
      data.parJour[0]
    );
  }, [data.parJour]);

  const repartition = [
    {
      name: "Hospitalises",
      value: data.resume.totalHospitalises || 0,
      color: "#0f766e",
    },
    {
      name: "Urgences",
      value: data.resume.totalUrgences || 0,
      color: "#dc2626",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          
          <h2 className="text-2xl font-semibold text-slate-900">
            Statistiques des patients assignes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
           Voici les nombres de patients hospitalises et urgences enregistres par jour.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={periode}
            onChange={(event) => setPeriode(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          >
            <option value="7">7 jours</option>
            <option value="14">14 jours</option>
            <option value="30">30 jours</option>
            <option value="60">60 jours</option>
          </select>
          <button
            type="button"
            onClick={chargerStats}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
            disabled={loading}
            title="Actualiser"
            aria-label="Actualiser les statistiques"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {erreur && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erreur}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <StatBox
            icon={<UsersRound size={20} />}
            label="Assignes"
            value={data.resume.totalAssignes || 0}
            helper="Patients actuellement suivis"
          />
          <StatBox
            icon={<CalendarDays size={20} />}
            label="Aujourd'hui"
            value={data.resume.assignesAujourdhui || 0}
            helper="Nouveaux patients du jour"
          />
          <StatBox
            icon={<BedDouble size={20} />}
            label="Hospitalises"
            value={data.resume.totalHospitalises || 0}
            helper="Patients en chambre"
          />
          <StatBox
            icon={<AlertTriangle size={20} />}
            label="Urgences"
            value={data.resume.totalUrgences || 0}
            helper="Patients sous priorite"
          />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Patients assignes par jour
              </h3>
              <p className="text-sm text-slate-500">
                Total periode : {totalPeriode} patient(s)
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">
              <TrendingUp size={16} />
              <span>
                Pic : {jourMax?.total || 0} le {jourMax ? formatDate(jourMax.date) : "-"}
              </span>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.parJour} margin={{ top: 10, right: 18, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="patientsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value) => [`${value} patient(s)`, "Assignes"]}
                  labelFormatter={(_, payload) => formatDate(payload?.[0]?.payload?.date)}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#0f766e"
                  strokeWidth={3}
                  fill="url(#patientsGradient)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-slate-900">Repartition</h3>
            <p className="text-sm text-slate-500">Etat actuel des patients assignes</p>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repartition} layout="vertical" margin={{ left: 20, right: 12 }}>
                <CartesianGrid stroke="#eef2f7" horizontal={false} />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={92}
                  tick={{ fontSize: 12, fill: "#475569" }}
                />
                <Tooltip
                  formatter={(value) => [`${value} patient(s)`, "Total"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                  {repartition.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-3">
            {repartition.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Derniers patients assignes</h3>
            <p className="text-sm text-slate-500">Patients hospitalises ou en urgence</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Activity size={19} />
          </div>
        </div>

        {data.patientsRecents.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            Aucun patient assigne pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Chambre</th>
                  <th className="px-5 py-3 font-semibold">Medecin</th>
                  <th className="px-5 py-3 font-semibold">Date assignation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.patientsRecents.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {patient.prenom} {patient.nom}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          patient.typePatient === "Urgence"
                            ? "bg-red-50 text-red-700"
                            : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        {patient.typePatient}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {patient.chambre?.numero || "-"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {patient.medecin
                        ? `${patient.medecin.prenom} ${patient.medecin.nom}`
                        : "-"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDateTime(patient.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
