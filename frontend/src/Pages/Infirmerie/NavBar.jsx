import {
  LayoutDashboard, Settings, BarChart3, Share,
  CalendarDays, UserRoundPen, UserCheck,
  Menu, X, ChevronRight, ChevronDown,
} from "lucide-react";

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import hospitalIcon from "../../assets/icons.png";
import { ChatIcon } from "../ComponentsMessage/ChatIcon";
import { useProfil } from "../hook/useProfil";
import { AvatarProfil } from "../profit/AvatarProfil";
import { logout } from "../../utils/auth";
import { useLanguage } from "../../i18n/LanguageContext";
import { LanguageSelector } from "../../i18n/LanguageSelector";

export default function NavBarInf() {
  return (
    <>
      <Sidebar />
      <Topbar />
    </>
  );
}

function Sidebar() {
  const { t } = useLanguage();
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setMobileOuvert(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOuvert ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOuvert]);

  const contenuSidebar = (
    <div className="flex flex-col h-full bg-blue-900 text-gray-200">

      {/* Logo + fermer */}
      <div className="flex items-center justify-between px-5 h-16
        border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-500 rounded-xl flex items-center
            justify-center flex-shrink-0">
            <img src={hospitalIcon} alt={t("app.hospitalAlt")}
              className="mt-3 w-8 h-8 mb-4" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">HospitalMada</span>
            <p className="text-xs text-gray-300 -mt-0.5">{t("nav.nurseArea")}</p>
          </div>
        </div>
        <button onClick={() => setMobileOuvert(false)}
          className="lg:hidden text-gray-400 hover:text-white transition-colors p-1">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">

        <Link to="/infirmier" onClick={() => setMobileOuvert(false)}>
          <MenuItem icon={<LayoutDashboard size={18} />} label={t("common.dashboard")}
            active={location.pathname === "/infirmier"} />
        </Link>

        <GardeMenu
          active={location.pathname.includes("Garde") ||
            location.pathname.includes("garde")}
          onNavigate={() => setMobileOuvert(false)}
        />

        <Link to="/infirmerie/surveillencePatient"
          onClick={() => setMobileOuvert(false)}>
          <MenuItem icon={<UserCheck size={18} />} label={t("nav.patientsAssigned")}
            active={location.pathname.includes("surveillence")} />
        </Link>

        <Link to="/infirmerie/statistiques"
          onClick={() => setMobileOuvert(false)}>
          <MenuItem icon={<BarChart3 size={18} />} label={t("common.statistics")}
            active={location.pathname.includes("statistiques")} />
        </Link>

        <Link to="/infirmerie/settings" onClick={() => setMobileOuvert(false)}>
          <MenuItem icon={<Settings size={18} />} label={t("common.settings")}
            active={location.pathname.includes("settings")} />
        </Link>

        <button
          type="button"
          onClick={() => {
            setMobileOuvert(false);
            logout(navigate);
          }}
          className="w-full text-left">
          <MenuItem icon={<Share size={18} />} label={t("common.logout")} />
        </button>
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
        aria-label={t("app.openMenu")}>
        <Menu size={20} />
      </button>
    </>
  );
}

function Topbar() {
  const { t } = useLanguage();
  const { profil, mettreAJourPhoto } = useProfil();
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md
      border-b border-slate-100 h-16 flex items-center justify-between
      px-6 lg:ml-64 shadow-sm pl-16 lg:pl-6">
      <h1 className="text-lg font-semibold text-gray-700 truncate">
        {t("topbar.nurseDashboard")}
      </h1>
      <div className="flex items-center gap-4 flex-shrink-0">
      <span className="text-sm font-medium text-gray-700">
            {profil.prenom} {profil.nom}
          </span>
          <span className="text-xs text-gray-400 capitalize">
            {profil.role}
          </span>
          <LanguageSelector />
          <AvatarProfil
          key={profil.photoProfil || "avatar"}
          profil={profil}
          onPhotoMiseAJour={mettreAJourPhoto}
        />
          <ChatIcon route="/infirmier/Message" />
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

function GardeMenu({ active, onNavigate }) {
  const { t } = useLanguage();
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
          <span className="text-sm">{t("nav.guards")}</span>
        </div>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </div>

      <div className={`overflow-hidden transition-all duration-200
        ${open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="flex flex-col ml-6 mt-1 space-y-1">
          <Link to="/Infirmier/Créer-Garde" onClick={onNavigate}>
            <SousMenuItem label={t("nav.guardCreate")} to="Créer-Garde" />
          </Link>
          <Link to="/infirmier/Liste_Gardes" onClick={onNavigate}>
            <SousMenuItem label={t("nav.guardList")} to="Liste_Gardes" />
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
