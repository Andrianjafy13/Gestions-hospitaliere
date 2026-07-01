import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  BarChart3,
  Share,
  BookOpenCheck,
  HeartPulse,
  BedDouble,
  CalendarDays,
  Stethoscope,
  UserRoundPen
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import hospitalIcon from "../../assets/icons.png";
import { logout } from "../../utils/auth";

export default function NavBarLabo() {
  return (
    <>
      <Sidebar />
      <Topbar />
    </>
  );
}

/* =========================
   SIDEBAR
========================= */

function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-blue-900 text-gray-200 fixed inset-y-0 left-0 shadow-lg">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-700">
        <div className="w-8 h-8 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
        <img
                src={hospitalIcon}
                alt="Hospital Icon"
                className=" mt-3 w-8 h-8 mb-4"
            />
        </div>
        <div>
          <span className="font-bold text-white text-sm">HospitalMada</span>
          <p className="text-xs text-gray-300 -mt-0.5">Espace Laboratoire</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1 mt-4">

        <Link to="/medecin">
          <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard" />
        </Link>

        <Link to="/medecin/rendezvous">
          <MenuItem icon={<ClipboardList size={18} />} label="Rendez-vous" />
        </Link>

        <Link to="/medecin/agenda">
          <MenuItem icon={<CalendarDays size={18} />} label="Agenda" />
        </Link>

        <Link to="/medecin/consultation">
          <MenuItem icon={<Stethoscope size={18} />} label="Consultations" />
        </Link>

        <Link to="/medecin/patients">
          <MenuItem icon={<Users size={18} />} label="Patients" />
        </Link>

        <Link to="/medecin/dossiers">
          <MenuItem icon={<BookOpenCheck size={18} />} label="Dossiers médicaux" />
        </Link>

        <Link to="/medecin/hospitalisation">
          <MenuItem icon={<BedDouble size={18} />} label="Hospitalisation" />
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
   TOPBAR
========================= */

function Topbar() {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6 ml-64 shadow-sm">

      <h1 className="text-lg font-semibold text-gray-700">
        Tableau de bord Laboratoire
      </h1>

      <div className="flex items-center gap-4">

        <span className="text-sm text-gray-600">
          Laboratoire
        </span>

        <div className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center">
          <UserRoundPen size={18} />
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
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
      ${active
        ? "bg-teal-600 text-white font-semibold"
        : "text-gray-300 hover:bg-slate-800"
      }`}
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
    "Prescrire examen"
  ];

  return (
    <div className="bg-teal-500 p-4 rounded-xl flex gap-3 flex-wrap text-white">
      {actions.map((action) => (
        <button
          key={action}
          className="bg-white text-teal-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
        >
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
    <div
      className="bg-white p-5 rounded-xl shadow border-l-4"
      style={{ borderColor: color }}
    >
      <p className="text-sm text-gray-500">{title}</p>

      <h2 className="text-2xl font-bold text-gray-800 mt-1">
        {value}
      </h2>
    </div>
  );
}
