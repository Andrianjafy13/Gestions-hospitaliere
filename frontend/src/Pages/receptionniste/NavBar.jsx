import {
  LayoutDashboard, ClipboardList, Settings,
  Share, Users, Menu, X, ChevronRight, ChevronDown,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";
import hospitalIcon from "../../assets/icons.png";
import { useState, useEffect } from "react";
import { ChatIcon } from "../ComponentsMessage/ChatIcon";
import { AvatarProfil } from "../profit/AvatarProfil";
import { useProfil }    from "../hook/useProfil";


export default function NavBarRecep() {
  return (
    <>
      <Sidebar />
      <Topbar />
    </>
  );
}

function Topbar() {
  const { profil, mettreAJourPhoto } = useProfil();

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md
      border-b border-slate-100 h-16 flex items-center justify-between
      px-6 lg:ml-64 shadow-sm pl-16 lg:pl-6">

      <h1 className="text-lg font-semibold text-gray-700 truncate">
        Tableau de bord Réceptionniste
      </h1>

      <div className="flex items-center gap-4 flex-shrink-0">

        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-700">
            {profil.prenom} {profil.nom}
          </span>
          <span className="text-xs text-gray-400 capitalize">
            {profil.role}
          </span>
        </div>

        {/* ✅ key={profil.photoProfil} force le re-render quand l'URL change */}
        <AvatarProfil
          key={profil.photoProfil || "avatar"}
          profil={profil}
          onPhotoMiseAJour={mettreAJourPhoto}
        />

        <ChatIcon route="/Receptionniste/Message" />
      </div>
    </header>
  );
}
function Sidebar() {
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobileOuvert(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOuvert ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOuvert]);

  const contenuSidebar = (
    <div className="flex flex-col h-full bg-blue-900 text-gray-200">

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
            <p className="text-xs text-gray-300 -mt-0.5">Espace Réceptionniste</p>
          </div>
        </div>
        <button onClick={() => setMobileOuvert(false)}
          className="lg:hidden text-gray-400 hover:text-white transition-colors p-1">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        <Link to="/Receptionniste/Dashboard"
          onClick={() => setMobileOuvert(false)}>
          <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard"
            active={location.pathname === "/Receptionniste/Dashboard"} />
        </Link>

        <RendezVousMenu
          active={location.pathname.includes("Rendezvous")}
          onNavigate={() => setMobileOuvert(false)}
        />

        <PatientMenu
          active={location.pathname.includes("Patients")}
          onNavigate={() => setMobileOuvert(false)}
        />

        <Link to="/Receptionniste/settings"
          onClick={() => setMobileOuvert(false)}>
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

function MenuItem({ icon, label, active }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
      cursor-pointer transition-all duration-200
      ${active
        ? "bg-teal-600 text-white font-semibold"
        : "text-gray-300 hover:bg-slate-800"}`}>
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

function RendezVousMenu({ active, onNavigate }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (active) setOpen(true); }, [active]);

  return (
    <div>
      <div onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-3 px-3 py-2.5
          rounded-xl cursor-pointer transition-all duration-200
          ${active ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-800"}`}>
        <div className="flex items-center gap-3">
          <ClipboardList size={18} />
          <span className="text-sm">Rendez-vous</span>
        </div>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </div>

      <div className={`overflow-hidden transition-all duration-200
        ${open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="flex flex-col ml-6 mt-1 space-y-1">
          <Link to="/Receptionniste/CréeRendezvous" onClick={onNavigate}>
            <SousMenuItem label="Ajout Rendez-vous" to="CréeRendezvous" />
          </Link>
          <Link to="/Receptionniste/ListeRendezvous" onClick={onNavigate}>
            <SousMenuItem label="Liste Rendez-vous" to="ListeRendezvous" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function PatientMenu({ active, onNavigate }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (active) setOpen(true); }, [active]);

  return (
    <div>
      <div onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-3 px-3 py-2.5
          rounded-xl cursor-pointer transition-all duration-200
          ${active ? "bg-slate-700 text-white" : "text-gray-300 hover:bg-slate-800"}`}>
        <div className="flex items-center gap-3">
          <Users size={18} />
          <span className="text-sm">Patients</span>
        </div>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </div>

      <div className={`overflow-hidden transition-all duration-200
        ${open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="flex flex-col ml-6 mt-1 space-y-1">
          <Link to="/Receptionniste/CréerPatient" onClick={onNavigate}>
            <SousMenuItem label="Ajout Patient" to="CréerPatient" />
          </Link>
          <Link to="/Receptionniste/ListePatients" onClick={onNavigate}>
            <SousMenuItem label="Liste Patients" to="ListePatients" />
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