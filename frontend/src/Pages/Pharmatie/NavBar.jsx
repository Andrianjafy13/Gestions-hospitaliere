import {
  LayoutDashboard, Settings, BarChart3, Share,
  CalendarDays, UserRoundPen, Menu, X,
  ChevronRight, ChevronDown,
} from "lucide-react";

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import hospitalIcon from "../../assets/icons.png";
import { useNotifPharmacie } from "./hooks/useNotifPharmacie";
import { ChatIcon } from "../ComponentsMessage/ChatIcon";
import { useProfil } from "../hook/useProfil";
import { AvatarProfil } from "../profit/AvatarProfil";

export default function NavBarPharm() {
  return (
    <>
      <Sidebar />
      <Topbar />
    </>
  );
}

function Sidebar() {
  const { nonVus, marquerVus } = useNotifPharmacie();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOuvert, setMobileOuvert] = useState(false);

  useEffect(() => { setMobileOuvert(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOuvert ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOuvert]);

  const handleClickOrdonnance = async () => {
    await marquerVus();
    navigate("/Pharmatie/delivranceOrdonance");
    setMobileOuvert(false);
  };

  const contenuSidebar = (
    <div className="flex flex-col h-full bg-blue-900 text-gray-200">

      {/* Logo + fermer */}
      <div className="flex items-center justify-between px-5 h-16
        border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-500 rounded-xl flex items-center
            justify-center flex-shrink-0">
            <img src={hospitalIcon} alt="Hospital Icon"
              className="mt-3 w-8 h-8 mb-4" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">HospitalMada</span>
            <p className="text-xs text-gray-300 -mt-0.5">Espace Pharmacie</p>
          </div>
        </div>
        <button onClick={() => setMobileOuvert(false)}
          className="lg:hidden text-gray-400 hover:text-white transition-colors p-1">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">

        <Link to="/Pharmatie/Dashboard" onClick={() => setMobileOuvert(false)}>
          <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard"
            active={location.pathname === "/Pharmatie/Dashboard"} />
        </Link>

        <PharmatieMenu
          active={location.pathname.includes("medicament") ||
            location.pathname.includes("Medicament") ||
            location.pathname.includes("alertes")}
          onNavigate={() => setMobileOuvert(false)}
        />

        {/* Délivrer ordonnance avec badge */}
        <button onClick={handleClickOrdonnance} className="w-full text-left">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
            cursor-pointer transition-all duration-200
            ${location.pathname.includes("delivrance")
              ? "bg-teal-600 text-white"
              : "text-gray-300 hover:bg-slate-800"}`}>
            <CalendarDays size={18} />
            <span className="text-sm">Délivrer ordonnance</span>
            {nonVus > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-medium
                rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {nonVus > 99 ? "99+" : nonVus}
              </span>
            )}
          </div>
        </button>

        <Link to="/pharmatie/statistiques-pharmaceutique"
          onClick={() => setMobileOuvert(false)}>
          <MenuItem icon={<BarChart3 size={18} />} label="Statistiques"
            active={location.pathname.includes("statistiques")} />
        </Link>

        <Link to="/pharmatie/settings" onClick={() => setMobileOuvert(false)}>
          <MenuItem icon={<Settings size={18} />} label="Paramètres"
            active={location.pathname.includes("settings")} />
        </Link>

        <Link to="/" onClick={() => setMobileOuvert(false)}>
          <MenuItem icon={<Share size={18} />} label="Déconnexion" />
        </Link>
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0
        left-0 shadow-lg z-30">
        {contenuSidebar}
      </aside>

      {mobileOuvert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileOuvert(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 w-72 z-50 shadow-2xl
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${mobileOuvert ? "translate-x-0" : "-translate-x-full"}`}>
        {contenuSidebar}
      </aside>

      <button onClick={() => setMobileOuvert(true)}
        className="fixed top-4 left-4 z-30 lg:hidden bg-blue-900 text-white
          p-2 rounded-xl shadow-lg hover:bg-blue-800 transition-colors"
        aria-label="Ouvrir le menu">
        <Menu size={20} />
      </button>
    </>
  );
}

function Topbar() {
  const { profil, mettreAJourPhoto } = useProfil();
  return (
    <header className="relative overflow-visible sticky top-0 z-20
      bg-white/90 backdrop-blur-md border-b border-slate-100 h-16
      flex items-center justify-between px-6 lg:ml-64 shadow-sm pl-16 lg:pl-6">
      <h1 className="text-lg font-semibold text-gray-700 truncate">
        Tableau de bord Pharmacie
      </h1>
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="text-sm text-gray-600 hidden sm:block">
          {profil.prenom} {profil.nom}
        </span>
        <span className="text-xs text-gray-400 capitalize">
            {profil.role}
        </span>
        <AvatarProfil
          key={profil.photoProfil || "avatar"}
          profil={profil}
          onPhotoMiseAJour={mettreAJourPhoto}
        />
        <ChatIcon route="/pharmatie/Message" />
      </div>
    </header>
  );
}

function MenuItem({ icon, label, active }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
      cursor-pointer transition-all duration-200
      ${active ? "bg-teal-600 text-white font-semibold" : "text-gray-300 hover:bg-slate-800"}`}>
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
}

function SousMenuItem({ label, to }) {
  const location = useLocation();
  const actif = location.pathname.includes(to);
  return (
    <div className={`flex items-center justify-between px-3 py-2
      rounded-lg text-sm transition-all duration-200
      ${actif ? "bg-teal-600 text-white" : "text-gray-300 hover:bg-slate-800"}`}>
      {label}
      <ChevronRight size={13} className="opacity-60" />
    </div>
  );
}

function PharmatieMenu({ active, onNavigate }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (active) setOpen(true); }, [active]);

  return (
    <div>
      <div onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-3 px-3 py-2.5
          rounded-xl cursor-pointer transition-all duration-200
          ${active ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-800"}`}>
        <div className="flex items-center gap-3">
          <CalendarDays size={18} />
          <span className="text-sm">Médicaments</span>
        </div>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </div>

      <div className={`overflow-hidden transition-all duration-200
        ${open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="flex flex-col ml-6 mt-1 space-y-1">
          <Link to="/Pharmatie/Ajout-medicament" onClick={onNavigate}>
            <SousMenuItem label="Ajout médicaments" to="Ajout-medicament" />
          </Link>
          <Link to="/Pharmatie/ListeMedicament" onClick={onNavigate}>
            <SousMenuItem label="Liste médicaments" to="ListeMedicament" />
          </Link>
          <Link to="/pharmatie/alertes-medicaments" onClick={onNavigate}>
            <SousMenuItem label="Alertes médicaments" to="alertes" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ title, value, color }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow border-l-4"
      style={{ borderColor: color }}>
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold text-gray-800 mt-1">{value}</h2>
    </div>
  );
}