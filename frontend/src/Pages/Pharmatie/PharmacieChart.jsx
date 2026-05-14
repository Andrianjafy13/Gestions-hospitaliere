// Pages/Pharmatie/PharmacieChart.jsx
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Package, CheckCircle, Clock, TrendingUp, AlertTriangle } from "lucide-react";

// ── Constantes ────────────────────────────────────────────
const MOIS_OPTIONS = [
  { value: "",   label: "Tous les mois" },
  { value: "1",  label: "Janvier"    }, { value: "2",  label: "Février"    },
  { value: "3",  label: "Mars"       }, { value: "4",  label: "Avril"      },
  { value: "5",  label: "Mai"        }, { value: "6",  label: "Juin"       },
  { value: "7",  label: "Juillet"    }, { value: "8",  label: "Août"       },
  { value: "9",  label: "Septembre"  }, { value: "10", label: "Octobre"    },
  { value: "11", label: "Novembre"   }, { value: "12", label: "Décembre"   },
];

const COULEURS_PIE = ["#ef4444", "#22c55e", "#eab308"];

// ── Sous-composants ───────────────────────────────────────

function TooltipPerso({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name} : <span className="font-bold ml-1">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, couleur, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl ${couleur} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────
export default function PharmacieChart() {
  const anneeActuelle = new Date().getFullYear();

  // ── États ordonnances ─────────────────────────────────
  const [chartData,   setChartData]   = useState([]);
  const [commandes,   setCommandes]   = useState([]);
  const [statsOrdo,   setStatsOrdo]   = useState({
    totalOrdonnances: 0,
    totalDelivrees:   0,
    totalEnAttente:   0,
  });
  const [moisFiltre,  setMoisFiltre]  = useState("");
  const [anneeFiltre, setAnneeFiltre] = useState(String(anneeActuelle));
  const [loadingOrdo, setLoadingOrdo] = useState(true);
  const [loadingCmd,  setLoadingCmd]  = useState(true);

  // ── États stock/alertes ───────────────────────────────
  const [statsStock, setStatsStock] = useState({
    totalMedicament:  0,
    ruptureStock:     [],
    stockFaible:      [],
    stockCritique:    [],
    expirentBientot:  [],
  });
  const [loadingStock, setLoadingStock] = useState(true);
  const [ordonnances,   setOrdonnances]   = useState([]);

  // ── Fetch stats ordonnances ───────────────────────────
  useEffect(() => {
    setLoadingOrdo(true);
    fetch("http://localhost:5000/api/GET/pharmacie/stats-ordonnances")
      .then(r => r.json())
      .then(d => {
        const data = d.labels.map((label, i) => ({
          mois:      label,
          total:     d.ordonnances[i],
          delivrees: d.delivrees[i],
          enAttente: d.ordonnances[i] - d.delivrees[i],
        }));
        setChartData(data);
        setStatsOrdo(d.stats);
      })
      .catch(console.error)
      .finally(() => setLoadingOrdo(false));
  }, []);

  // ── Fetch commandes récentes ──────────────────────────
  useEffect(() => {
    setLoadingCmd(true);
    const params = new URLSearchParams({ limit: 20 });
    if (moisFiltre && anneeFiltre) {
      params.append("mois",  moisFiltre);
      params.append("annee", anneeFiltre);
    }
    fetch(`http://localhost:5000/api/GET/pharmacie/commandes-recentes?${params}`)
      .then(r => r.json())
      .then(d => setCommandes(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoadingCmd(false));
  }, [moisFiltre, anneeFiltre]);

  // ── Fetch stats stock/alertes ─────────────────────────
  useEffect(() => {
    setLoadingStock(true);
    fetch("http://localhost:5000/api/GET/totalMedicament")
      .then(r => r.json())
      .then(data => setStatsStock({
        totalMedicament: data.totalMedicament  || 0,
        ruptureStock:    data.ruptureStock     || [],
        stockFaible:     data.stockFaible      || [],
        stockCritique:   data.stockCritique    || [],
        expirentBientot: data.expirentBientot  || [],
      }))
      .catch(console.error)
      .finally(() => setLoadingStock(false));

    fetch("http://localhost:5000/api/GET/notifications/pharmacie/ordonnances")
      .then(r => r.json()).then(d => setOrdonnances(Array.isArray(d) ? d.slice(0,5) : [])).catch(console.error);
  }, []);

  // ── Données PieChart ──────────────────────────────────
  const dataPie = [
    { value: statsStock.stockCritique.length },
    {  value: statsStock.stockFaible.length   },
    {  value: statsStock.expirentBientot.length },
  ].filter(d => d.value > 0); 

  // ── Filtre graphique barres ───────────────────────────
  const chartDataFiltre = moisFiltre
    ? chartData.filter(d => {
        const label = MOIS_OPTIONS.find(m => m.value === moisFiltre)?.label.slice(0, 3);
        return d.mois.startsWith(label);
      })
    : chartData;

  const anneesDisponibles = Array.from({ length: 3 }, (_, i) => String(anneeActuelle - i));

  // ── Filtres partagés ──────────────────────────────────
  const Filtres = () => (
    <div className="flex gap-2">
      <select
        value={moisFiltre}
        onChange={e => setMoisFiltre(e.target.value)}
        className="border border-gray-200 rounded-xl px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
        {MOIS_OPTIONS.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <select
        value={anneeFiltre}
        onChange={e => setAnneeFiltre(e.target.value)}
        className="border border-gray-200 rounded-xl px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
        {anneesDisponibles.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* ── TITRE ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Statistiques Pharmacie</h1>
        <p className="text-sm text-gray-500 mt-1">Suivi des ordonnances et gestion des stocks</p>
      </div>

      {/* ── KPI ORDONNANCES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard icon={Package}     label="Total ordonnances" value={statsOrdo.totalOrdonnances} couleur="bg-teal-500"  bg="bg-teal-50"  />
        <KpiCard icon={CheckCircle} label="Délivrées"         value={statsOrdo.totalDelivrees}   couleur="bg-green-500" bg="bg-green-50" />
        <KpiCard icon={Clock}       label="En attente"        value={statsOrdo.totalEnAttente}   couleur="bg-amber-500" bg="bg-amber-50" />
      </div>

      {/* ── GRAPHIQUE BARRES + PIE CHART côte à côte ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Graphique barres — 2/3 de la largeur */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-teal-600" />
              <h2 className="text-base font-semibold text-gray-800">
                Évolution des ordonnances
              </h2>
            </div>
            <Filtres />
          </div>

          {loadingOrdo ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400 text-sm">Chargement...</p>
            </div>
          ) : chartDataFiltre.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400 text-sm">Aucune donnée pour cette période</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartDataFiltre} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<TooltipPerso />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                <Bar dataKey="total"     name="Total reçues" fill="#0d9488" radius={[6,6,0,0]} maxBarSize={36} />
                <Bar dataKey="delivrees" name="Délivrées"    fill="#10b981" radius={[6,6,0,0]} maxBarSize={36} />
                <Bar dataKey="enAttente" name="En attente"   fill="#f59e0b" radius={[6,6,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── PIE CHART alertes stock — 1/3 de la largeur ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-amber-500" />
            <h2 className="text-base font-semibold text-gray-800">
              Alertes stock
            </h2>
          </div>

          {/* KPI stock total */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4 text-center">
            <p className="text-xs text-gray-500">Total médicaments</p>
            <p className="text-3xl font-bold text-gray-800">
              {statsStock.totalMedicament}
            </p>
          </div>

          {loadingStock ? (
            <div className="flex items-center justify-center h-40 ">
              <p className="text-gray-400 text-sm">Chargement...</p>
            </div>
          ) : dataPie.every(d => d.value === 0) ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <CheckCircle size={32} className="text-green-400" />
              <p className="text-green-600 text-sm font-medium">Aucune alerte</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={dataPie}
                    // dataKey="value"
                    // nameKey="name"
                    outerRadius={70}
                    innerRadius={35}   
                    paddingAngle={3}
                    // label={({ name, value }) => `${value}`}
                    labelLine={false}
                  >
                    {dataPie.map((_, i) => (
                      <Cell key={i} fill={COULEURS_PIE[i % COULEURS_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} médicaments`, name]} />
                  {/* <Legend wrapperStyle={{ fontSize: "11px" }} /> */}
                </PieChart>
              </ResponsiveContainer>

              {/* ✅ Détail texte sous le graphique */}
              <div className="mt-3 space-y-2">
                {[
                  { label: "Critique",       count: statsStock.stockCritique.length,   color: "bg-red-500"    },
                  { label: "Stock faible",   count: statsStock.stockFaible.length,     color: "bg-green-500"  },
                  { label: "Expire bientôt", count: statsStock.expirentBientot.length, color: "bg-yellow-400" },
                  { label: "Rupture",        count: statsStock.ruptureStock.length,    color: "bg-gray-400"   },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-gray-600">{item.label}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TABLEAU COMMANDES RÉCENTES ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h2 className="text-base font-semibold text-gray-800">
            Ordonnances récentes
          </h2>
          <Filtres />
        </div>

        {loadingCmd ? (
          <p className="text-center text-gray-400 text-sm py-8">Chargement...</p>
        ) : commandes.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            Aucune ordonnance pour cette période
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Médicament</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {commandes.map((cmd, i) => {
                  let details = {};
                  try { details = JSON.parse(cmd.message || "{}"); } catch {}
                  return (
                    <tr key={cmd.id || i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 text-sm text-gray-600">
                        {new Date(cmd.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="py-3 text-sm font-medium text-gray-800">
                        {details.patientNom || details.patientNom || "—"}
                      </td>
                      <td className="py-3 text-sm text-gray-600 max-w-xs truncate">
                        {details.medicament || details.traitement || cmd.message?.slice(0, 40) || "—"}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1
                          rounded-full text-xs font-medium
                          ${cmd.vu
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cmd.vu ? "bg-green-500" : "bg-amber-500"}`} />
                          {cmd.vu ? "Délivrée" : "En attente"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loadingCmd && commandes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center
            justify-between text-xs text-gray-500">
            <span>{commandes.length} ordonnance{commandes.length > 1 ? "s" : ""}</span>
            <span>
              {commandes.filter(c => c.vu).length} délivrée{commandes.filter(c => c.vu).length > 1 ? "s" : ""} ·{" "}
              {commandes.filter(c => !c.vu).length} en attente
            </span>
          </div>
        )}
      </div>
    </div>
  );
}