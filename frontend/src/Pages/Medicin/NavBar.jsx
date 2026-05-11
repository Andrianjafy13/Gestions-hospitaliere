import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  BarChart3,
  Share,
  BookOpenCheck,
  Stethoscope,
  UserRoundPen
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import hospitalIcon from "../../assets/icons.png";
import { useState, useEffect, useCallback } from "react";
import { ChatIcon } from "../ComponentsMessage/ChatIcon";

export default function NavBarMed() {
  return (
    <>
      <Sidebar />
      <Topbar />
    </>
  );
}

/* =========================
   HOOK NOTIFICATION
========================= */
export function useNotification(medecinId) {
  const [nonVus, setNonVus] = useState(0);

  const charger = useCallback(() => {
    if (!medecinId || medecinId === "null") return;
    fetch(`http://localhost:5000/api/GET/rendez-vous/non-vus/${medecinId}`)
      .then(r => r.json())
      .then(data => {
        console.log("nonVus reçu:", data.nonVus); // 👈 debug
        setNonVus(data.nonVus || 0);
      })
      .catch(console.error);
  }, [medecinId]);

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval); // ✅ nettoyage obligatoire
  }, [charger]);

  const marquerVus = useCallback(async () => {
    if (!medecinId || medecinId === "null") return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/PUT/rendez-vous/marquer-vus/${medecinId}`,
        { method: "PUT" }
      );
      const data = await res.json();
      console.log("marquerVus réponse:", data); // 👈 debug

      if (res.ok) {
        setNonVus(0); // ✅ reset local immédiat
      }
    } catch (err) {
      console.error("Erreur marquerVus:", err);
    }
  }, [medecinId]);

  return { nonVus, marquerVus, charger };
}


/* =========================
   BADGE NOTIFICATION
========================= */
export function BadgeNotification({ count }) {
  if (!count || count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs
      font-medium rounded-full min-w-[18px] h-[18px] flex items-center
      justify-center px-1 leading-none z-10">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* =========================
   SIDEBAR
========================= */
function Sidebar() {
  const medecinId = localStorage.getItem("medecinId");
  const { nonVus, marquerVus } = useNotification(medecinId);
  const navigate = useNavigate();

  const handleClickRdv = async () => {
    await marquerVus();           // ✅ remet le badge à 0
    navigate("/medecin/rendezvous");
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-blue-900 text-gray-200 fixed inset-y-0 left-0 shadow-lg">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-700">
        <div className="w-8 h-8 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <img src={hospitalIcon} alt="Hospital Icon" className="mt-3 w-8 h-8 mb-4" />
        </div>
        <div>
          <span className="font-bold text-white text-sm">HospitalMada</span>
          <p className="text-xs text-gray-300 -mt-0.5">Espace Médecin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1 mt-4">

        <Link to="/medecin">
          <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard" />
        </Link>

        {/* ✅ Rendez-vous avec badge notification */}
        <button
          onClick={handleClickRdv}
          className="w-full text-left"
        >
          <div className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl
            cursor-pointer text-gray-300 hover:bg-slate-800 transition-all duration-200">
            <ClipboardList size={18} />
            <span className="text-sm">Rendez-vous</span>

            {/* ✅ Badge — visible seulement si nonVus > 0 */}
            {nonVus > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-medium
                rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {nonVus > 99 ? "99+" : nonVus}
              </span>
            )}
          </div>
        </button>

        <PatientsMenu />
        <ConsultationMenu />

        <Link to="/medecin/Historique medical">
          <MenuItem icon={<BookOpenCheck size={18} />} label="Dossiers médicaux" />
        </Link>

        <Link to="/medecin/statistiques">
          <MenuItem icon={<BarChart3 size={18} />} label="Statistiques" />
        </Link>

        <Link to="/medecin/settings">
          <MenuItem icon={<Settings size={18} />} label="Paramètres" />
        </Link>

        <Link to="/">
          <MenuItem icon={<Share size={18} />} label="Déconnexion" />
        </Link>

      </nav>
    </aside>
  );
}

/* =========================
   PATIENTS MENU DEROULANT
========================= */
function PatientsMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl
          cursor-pointer text-gray-300 hover:bg-slate-800 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <Users size={18} />
          <span className="text-sm">Patients</span>
        </div>
        <span className="text-gray-400">{open ? "˄" : "›"}</span>
      </div>

      {open && (
        <div className="flex flex-col ml-6 mt-1 space-y-1">
          <Link to="/medecin/patients/creer">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg
              text-gray-300 hover:bg-slate-800 text-sm transition-all duration-200">
              Ajout Patient
              <span className="text-gray-400">›</span>
            </div>
          </Link>
          <Link to="/medecin/patients/liste des patients">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg
              text-gray-300 hover:bg-slate-800 text-sm transition-all duration-200">
              Liste Patients
              <span className="text-gray-400">›</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

/* =========================
   CONSULTATION MENU DEROULANT
========================= */
function ConsultationMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl
          cursor-pointer text-gray-300 hover:bg-slate-800 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <Stethoscope size={18} />
          <span className="text-sm">Consultation</span>
        </div>
        <span className="text-gray-400">{open ? "˄" : "›"}</span>
      </div>

      {open && (
        <div className="flex flex-col ml-6 mt-1 space-y-1">
          <Link to="/medecin/consultation/Créer">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg
              text-gray-300 hover:bg-slate-800 text-sm transition-all duration-200">
              Créer Consultation
              <span className="text-gray-400">›</span>
            </div>
          </Link>
          <Link to="/medecin/consultation/Liste_Consultations">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg
              text-gray-300 hover:bg-slate-800 text-sm transition-all duration-200">
              Liste Consultations
              <span className="text-gray-400">›</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

/* =========================
   TOPBAR
========================= */
function Topbar() {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b
      border-slate-100 h-16 flex items-center justify-between px-6 ml-64 shadow-sm">

      <h1 className="text-lg font-semibold text-gray-700">
        Tableau de bord Médecin
      </h1>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Médecin</span>
        <div className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center">
          <UserRoundPen size={18} />
        </div>
        <div className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center">
          <ChatIcon route="/medecin/Message" />
        </div>
      </div>
    </header>
  );
}

/* =========================
   MENU ITEM
========================= */
function MenuItem({ icon, label, active }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
      transition-all duration-200
      ${active ? "bg-teal-600 text-white font-semibold" : "text-gray-300 hover:bg-slate-800"}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
}

/* =========================
   QUICK ACTIONS
========================= */
export function QuickActions() {
  const actions = [
    "Nouveau patient",
    "Nouvelle consultation",
    "Planifier rendez-vous",
    "Créer dossier médical",
    "Prescrire examen",
  ];

  return (
    <div className="bg-teal-500 p-4 rounded-xl flex gap-3 flex-wrap text-white">
      {actions.map((action) => (
        <button key={action}
          className="bg-white text-teal-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100">
          {action}
        </button>
      ))}
    </div>
  );
}

/* =========================
   STAT CARD
========================= */
export function StatCard({ title, value, color }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow border-l-4" style={{ borderColor: color }}>
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold text-gray-800 mt-1">{value}</h2>
    </div>
  );
}