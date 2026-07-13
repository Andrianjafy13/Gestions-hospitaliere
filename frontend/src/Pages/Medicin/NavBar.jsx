import {
  LayoutDashboard, Users, ClipboardList, Settings,
  BarChart3, Share, BookOpenCheck, Stethoscope,
  UserRoundPen, Menu, X, ChevronRight, ChevronDown,
  Phone,
} from "lucide-react";

import { Link, useNavigate, useLocation } from "react-router-dom";
import hospitalIcon from "../../assets/icons.png";
import { useState, useEffect, useCallback } from "react";
import { ChatIcon } from "../ComponentsMessage/ChatIcon";
import { useProfil } from "../hook/useProfil";
import { AvatarProfil } from "../profit/AvatarProfil";
import { logout } from "../../utils/auth";
import { useLanguage } from "../../i18n/LanguageContext";
import { LanguageSelector } from "../../i18n/LanguageSelector";

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
      .then(data => setNonVus(data.nonVus || 0))
      .catch(console.error);
  }, [medecinId]);

  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, [charger]);

  const marquerVus = useCallback(async () => {
    if (!medecinId || medecinId === "null") return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/PUT/rendez-vous/marquer-vus/${medecinId}`,
        { method: "PUT" }
      );
      if (res.ok) setNonVus(0);
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
  const { t } = useLanguage();
  const medecinId           = localStorage.getItem("medecinId");
  const { nonVus, marquerVus } = useNotification(medecinId);
  const navigate            = useNavigate();
  const location            = useLocation();

  // ✅ État menu mobile — fermé par défaut
  const [mobileOuvert, setMobileOuvert] = useState(false);

  // ✅ Fermer le menu mobile à chaque changement de route
  useEffect(() => {
    setMobileOuvert(false);
  }, [location.pathname]);

  // ✅ Bloquer le scroll du body quand le menu est ouvert
  useEffect(() => {
    document.body.style.overflow = mobileOuvert ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOuvert]);

  const handleClickRdv = async () => {
    await marquerVus();
    navigate("/medecin/rendezvous");
    setMobileOuvert(false);
  };

  const contenuSidebar = (
    <div className="flex flex-col h-full bg-blue-900 text-gray-200">

      {/* Logo + bouton fermer (mobile) */}
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
            <p className="text-xs text-gray-300 -mt-0.5">{t("nav.medicalArea")}</p>
          </div>
        </div>

        {/* ✅ Bouton ✕ uniquement sur mobile */}
        <button
          onClick={() => setMobileOuvert(false)}
          className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">

        <Link to="/medecin" onClick={() => setMobileOuvert(false)}>
          <MenuItem
            icon={<LayoutDashboard size={18} />}
            label={t("common.dashboard")}
            active={location.pathname === "/medecin"}
          />
        </Link>

        {/* Rendez-vous avec badge */}
        <button onClick={handleClickRdv} className="w-full text-left">
          <div className={`relative flex items-center gap-3 px-3 py-2.5
            rounded-xl cursor-pointer transition-all duration-200
            ${location.pathname.includes("rendezvous")
              ? "bg-teal-600 text-white"
              : "text-gray-300 hover:bg-slate-800"}`}>
            <ClipboardList size={18} />
            <span className="text-sm">{t("nav.rendezvous")}</span>
            {nonVus > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-medium
                rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {nonVus > 99 ? "99+" : nonVus}
              </span>
            )}
          </div>
        </button>

        <PatientsMenu
          active={location.pathname.includes("/patients")}
          onNavigate={() => setMobileOuvert(false)}
        />

        <ConsultationMenu
          active={location.pathname.includes("/consultation")}
          onNavigate={() => setMobileOuvert(false)}
        />

        <Link to="/medecin/Historique medical"
          onClick={() => setMobileOuvert(false)}>
          <MenuItem
            icon={<BookOpenCheck size={18} />}
            label={t("nav.files")}
            active={location.pathname.includes("Historique")}
          />
        </Link>

        <Link to="/medecin/statistiques"
          onClick={() => setMobileOuvert(false)}>
          <MenuItem
            icon={<BarChart3 size={18} />}
            label={t("common.statistics")}
            active={location.pathname.includes("statistiques")}
          />
        </Link>

        <Link to="/medecin/Appel"
          onClick={() => setMobileOuvert(false)}>
          <MenuItem
            icon={<Phone size={18} />}
            label={t("nav.call")}
            active={location.pathname.includes("appel")}
          />
        </Link>

        <Link to="/medecin/settings"
          onClick={() => setMobileOuvert(false)}>
          <MenuItem
            icon={<Settings size={18} />}
            label={t("common.settings")}
            active={location.pathname.includes("settings")}
          />
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
      {/* ── SIDEBAR DESKTOP — toujours visible lg+ ── */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0
        left-0 shadow-lg z-30">
        {contenuSidebar}
      </aside>

      {/* ── OVERLAY — fond sombre derrière le menu mobile ── */}
      {mobileOuvert && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileOuvert(false)}
        />
      )}

      {/* ── SIDEBAR MOBILE — slide depuis la gauche ── */}
      <aside className={`fixed inset-y-0 left-0 w-72 z-50 shadow-2xl
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${mobileOuvert ? "translate-x-0" : "-translate-x-full"}`}>
        {contenuSidebar}
      </aside>

      {/* ✅ Bouton hamburger — visible uniquement sur mobile */}
      <button
        onClick={() => setMobileOuvert(true)}
        className="fixed top-4 left-4 z-30 lg:hidden
          bg-blue-900 text-white p-2 rounded-xl shadow-lg
          hover:bg-blue-800 transition-colors"
        aria-label={t("app.openMenu")}
      >
        <Menu size={20} />
      </button>
    </>
  );
}

/* =========================
   PATIENTS MENU DÉROULANT
========================= */
function PatientsMenu({ active, onNavigate }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  // ✅ Ouvrir automatiquement si on est sur une route patients
  useEffect(() => { if (active) setOpen(true); }, [active]);

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-3 px-3 py-2.5
          rounded-xl cursor-pointer transition-all duration-200
          ${active
            ? "bg-slate-700 text-white"
            : "text-gray-300 hover:bg-slate-800"}`}
      >
        <div className="flex items-center gap-3">
          <Users size={18} />
          <span className="text-sm">{t("nav.patients")}</span>
        </div>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </div>

      {/* ✅ Animation d'ouverture */}
      <div className={`overflow-hidden transition-all duration-200
        ${open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="flex flex-col ml-6 mt-1 space-y-1">
          <Link to="/medecin/patients/creer" onClick={onNavigate}>
            <SousMenuItem label={t("nav.patientsAdd")} />
          </Link>
          <Link to="/medecin/patients/liste des patients" onClick={onNavigate}>
            <SousMenuItem label={t("nav.patientsList")} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================
   CONSULTATION MENU DÉROULANT
========================= */
function ConsultationMenu({ active, onNavigate }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => { if (active) setOpen(true); }, [active]);

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-3 px-3 py-2.5
          rounded-xl cursor-pointer transition-all duration-200
          ${active
            ? "bg-slate-700 text-white"
            : "text-gray-300 hover:bg-slate-800"}`}
      >
        <div className="flex items-center gap-3">
          <Stethoscope size={18} />
          <span className="text-sm">{t("nav.consultation")}</span>
        </div>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </div>

      <div className={`overflow-hidden transition-all duration-200
        ${open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="flex flex-col ml-6 mt-1 space-y-1">
          <Link to="/medecin/consultation/Créer" onClick={onNavigate}>
            <SousMenuItem label={t("nav.createConsultation")} />
          </Link>
          <Link to="/medecin/consultation/Liste_Consultations" onClick={onNavigate}>
            <SousMenuItem label={t("nav.consultations")} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================
   TOPBAR
========================= */
function Topbar() {
  const { t } = useLanguage();
  // ✅ Hook qui charge le profil depuis le backend au montage
  const { profil, mettreAJourPhoto } = useProfil();

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md
      border-b border-slate-100 h-16 flex items-center justify-between
      px-6 lg:ml-64 shadow-sm pl-16 lg:pl-6">

      <h1 className="text-lg font-semibold text-gray-700 truncate">
        {t("topbar.doctorDashboard")}
      </h1>

      <div className="flex items-center gap-4 flex-shrink-0">

        {/* Nom affiché */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-700">
            {profil.prenom} {profil.nom}
          </span>
          <span className="text-xs text-gray-400 capitalize">
            {profil.role}
          </span>
          <span className="text-xs text-gray-400 capitalize">
            {profil.specialite}
          </span>
        </div>

        <LanguageSelector />

        {/* ✅ Avatar interactif — photo depuis BDD */}
        <AvatarProfil
          key={profil.photoProfil || "avatar"}
          profil={profil}
          onPhotoMiseAJour={mettreAJourPhoto}
        />

        <ChatIcon route="/medecin/Message" />
      </div>
    </header>
  );
}

/* =========================
   MENU ITEM
========================= */
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

/* =========================
   SOUS MENU ITEM
========================= */
function SousMenuItem({ label }) {
  const location = useLocation();
  const estActif = location.pathname.includes(
    label.toLowerCase().replace(/ /g, "_")
  );

  return (
    <div className={`flex items-center justify-between px-3 py-2
      rounded-lg text-sm transition-all duration-200
      ${estActif
        ? "bg-teal-600 text-white"
        : "text-gray-300 hover:bg-slate-800"}`}>
      {label}
      <ChevronRight size={13} className="opacity-60" />
    </div>
  );
}

/* =========================
   QUICK ACTIONS
========================= */
export function QuickActions() {
  const { t } = useLanguage();
  const actions = [
    t("nav.newPatient"), t("nav.newConsultation"),
    t("nav.planAppointment"), t("nav.createMedicalFile"), t("nav.prescribeExam"),
  ];
  return (
    <div className="bg-teal-500 p-4 rounded-xl flex gap-3 flex-wrap text-white">
      {actions.map(action => (
        <button key={action}
          className="bg-white text-teal-600 px-4 py-2 rounded-lg
            text-sm font-medium hover:bg-gray-100">
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
    <div className="bg-white p-5 rounded-xl shadow border-l-4"
      style={{ borderColor: color }}>
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold text-gray-800 mt-1">{value}</h2>
    </div>
  );
}
