import React, { useEffect, useState, useMemo, useCallback } from "react";
import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";

// ══════════════════════════════════════════════
//  CONSTANTE
// ══════════════════════════════════════════════
const PAR_PAGE = 6; 

// ══════════════════════════════════════════════
//  SOUS-COMPOSANT — Contrôles pagination
// ══════════════════════════════════════════════
function ControlePagination({ page, totalPages, onPrev, onNext, onChange }) {
  if (totalPages <= 1) return null; // ✅ Caché si une seule page

  return (
    <div className="flex items-center justify-between bg-white
      rounded-xl px-5 py-3 shadow-sm border border-gray-100">

      {/* Bouton Précédent */}
      <button
        onClick={onPrev}
        disabled={page === 1}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
          font-medium transition-colors ${
          page === 1
            ? "text-gray-300 cursor-not-allowed"
            : "text-teal-700 hover:bg-teal-50 border border-teal-200"
        }`}
      >
        ← Précédent
      </button>

      {/* Numéros de pages */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              n === page
                ? "bg-teal-600 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Bouton Suivant */}
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
          font-medium transition-colors ${
          page === totalPages
            ? "text-gray-300 cursor-not-allowed"
            : "text-teal-700 hover:bg-teal-50 border border-teal-200"
        }`}
      >
        Suivant →
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════
//  SOUS-COMPOSANT — Card consultation
// ══════════════════════════════════════════════
function CardConsultation({ c, onDetails }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition
      border border-gray-100 flex flex-col justify-between">

      {/* Badge type patient */}
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          c.patients?.typePatient === "Urgence"
            ? "bg-red-100 text-red-600"
            : c.patients?.typePatient === "Hospitalisé"
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-500"
        }`}>
          {c.patients?.typePatient || "Externe"}
        </span>
        <span className="text-xs text-gray-400">
          {c.dateConsultation?.split("T")[0]}
        </span>
      </div>

      {/* Patient */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center
          justify-center flex-shrink-0">
          <span className="text-sm font-bold text-teal-700">
            {c.patients?.prenom?.[0]?.toUpperCase()}
            {c.patients?.nom?.[0]?.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">
            {c.patients?.nom} {c.patients?.prenom}
          </p>
          <p className="text-xs text-gray-500">
            Dr {c.medecin?.prenom}
          </p>
        </div>
      </div>

      {/* Motif */}
      <p className="text-xs text-gray-500 mb-1">
        <span className="font-medium text-gray-700">Motif :</span>{" "}
        {c.motif || "—"}
      </p>
      <p className="text-xs text-gray-500 mb-3">
        <span className="font-medium text-gray-700">Diagnostic :</span>{" "}
        {c.diagnostic || "—"}
      </p>

      {/* Bouton détails */}
      <button
        onClick={() => onDetails(c)}
        className="mt-auto w-full bg-teal-500 text-white py-2 rounded-lg
          hover:bg-teal-600 text-sm font-medium transition-colors"
      >
        Détails
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════
export default function HistoriqueMedical() {
  const [consultations,        setConsultations]        = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [recherche,            setRecherche]            = useState("");
  const [page,                 setPage]                 = useState(1);
  const [loading,              setLoading]              = useState(true);

  // ── Chargement données ─────────────────────────────────────────────
  useEffect(() => {
    const medecinId = localStorage.getItem("medecinId") || localStorage.getItem("userId");
    setLoading(true);

    fetch(`http://localhost:5000/api/GET/AllConsultations/${medecinId}`)
      .then(r => r.json())
      .then(data => {
        setConsultations(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Filtrage par nom + prénom (mémoïsé) ────────────────────────────
  const consultationsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return consultations;
    return consultations.filter(c => {
      const nom    = (c.patients?.nom    || "").toLowerCase();
      const prenom = (c.patients?.prenom || "").toLowerCase();
      return nom.includes(q) || prenom.includes(q) || `${nom} ${prenom}`.includes(q);
    });
  }, [consultations, recherche]);

  // ── Remise à page 1 quand la recherche change ──────────────────────
  useEffect(() => { setPage(1); }, [recherche]);

  // ── Pagination (mémoïsée) ──────────────────────────────────────────
  const totalPages = Math.ceil(consultationsFiltrees.length / PAR_PAGE);

  const consultationsPage = useMemo(() => {
    const debut = (page - 1) * PAR_PAGE;
    return consultationsFiltrees.slice(debut, debut + PAR_PAGE);
  }, [consultationsFiltrees, page]);

  // ── Handlers pagination (stables) ─────────────────────────────────
  const allerPage    = useCallback((n) => setPage(n), []);
  const pagePrecedente = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  const pageSuivante   = useCallback(() => setPage(p => Math.min(totalPages, p + 1)), [totalPages]);

  // ── Export PDF corrigé ─────────────────────────────────────────────
  const exporterPDF = useCallback((c) => {
    const doc = new jsPDF();

    // En-tête
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("FICHE DE CONSULTATION", 105, 20, null, null, "center");
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);

    // Infos patient
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Patient    : ${c.patients?.nom || ""} ${c.patients?.prenom || ""}`, 20, 38);
    doc.text(`Téléphone  : ${c.patients?.telephone || "—"}`, 20, 47);
    doc.text(`Naissance  : ${c.patients?.dateNaissance
      ? new Date(c.patients.dateNaissance).toLocaleDateString("fr-FR") : "—"}`, 20, 56);
    doc.text(`Sexe       : ${c.patients?.sexe || "—"}`, 20, 65);
    doc.text(`Groupe sg  : ${c.patients?.groupeSanguin || "—"}`, 20, 74);

    // Séparateur
    doc.setDrawColor(20, 120, 100);
    doc.line(20, 80, 190, 80);

    // Infos consultation
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 120, 100);
    doc.text("CONSULTATION", 20, 88);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(`Médecin    : Dr ${c.medecin?.prenom || ""} ${c.medecin?.nom || ""}`, 20, 97);
    doc.text(`Date       : ${c.dateConsultation?.split("T")[0] || "—"}`, 20, 106);
    doc.text(`Motif      : ${c.motif || "—"}`, 20, 115);
    doc.text(`Diagnostic : ${c.diagnostic || "—"}`, 20, 124);

    // ✅ Traitement en code-barres
    if (c.traitement) {
      doc.setDrawColor(20, 120, 100);
      doc.line(20, 130, 190, 130);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 120, 100);
      doc.text("TRAITEMENT", 20, 138);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      // Extraire moment de prise
      const parties     = c.traitement.split(" - ");
      const momentPrise = parties[parties.length - 1].trim();

      const canvas = document.createElement("canvas");
      JsBarcode(canvas, c.traitement, {
        format:       "CODE128",
        lineColor:    "#000000",
        width:        2,
        height:       60,
        displayValue: true,
        text:         momentPrise,  // ✅ seul le moment de prise sous le code-barres
        fontSize:     12,
        margin:       8,
        background:   "#ffffff",
      });

      doc.text("Traitement :", 20, 146);
      doc.addImage(canvas.toDataURL("image/png"), "PNG", 20, 149, 170, 32);
    }

    doc.save(`consultation_${c.patients?.nom || "patient"}_${c.dateConsultation?.split("T")[0]}.pdf`);
  }, []);

  const propsControle = { page, totalPages, onPrev: pagePrecedente, onNext: pageSuivante, onChange: allerPage };

  // ── Rendu ──────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* TITRE */}
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Historique des dossiers médicaux
      </h1>

      {/* ✅ BARRE DE RECHERCHE */}
      <div className="relative mb-5">
        <input
          type="text"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="Rechercher par nom ou prénom du patient..."
          className="w-full bg-white border border-gray-200 rounded-xl
            pl-10 pr-4 py-3 text-sm shadow-sm
            focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        {recherche && (
          <button onClick={() => setRecherche("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
              hover:text-gray-600">
            ✕
          </button>
        )}
      </div>

      {/* Compteur résultats */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500">
          {consultationsFiltrees.length} dossier{consultationsFiltrees.length !== 1 ? "s" : ""}
          {recherche && ` pour "${recherche}"`}
        </p>
        {totalPages > 1 && (
          <p className="text-xs text-gray-500">
            Page {page} / {totalPages}
          </p>
        )}
      </div>

      {/* LISTE */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400 text-sm">Chargement des dossiers...</p>
        </div>
      ) : consultationsFiltrees.length === 0 ? (
        // ✅ Message si aucun résultat
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor"
            strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p className="text-gray-500 font-medium">
            Aucun patient trouvé pour cette recherche
          </p>
          <p className="text-gray-400 text-sm">
            Essayez avec un autre nom ou prénom.
          </p>
          <button onClick={() => setRecherche("")}
            className="text-teal-600 text-sm hover:underline">
            Effacer la recherche
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {consultationsPage.map(c => (
            <CardConsultation
              key={c.id}
              c={c}
              onDetails={setSelectedConsultation}
            />
          ))}
        </div>
      )}

      {/* ✅ PAGINATION BAS */}
      <div className="mt-6">
        <ControlePagination {...propsControle} />
      </div>

      {/* ══════ MODAL ══════ */}
      {selectedConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center
          items-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl
            max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Détails du dossier
              </h2>
              <button onClick={() => setSelectedConsultation(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                ✕
              </button>
            </div>

            {/* Infos patient */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-1">
              <p className="text-xs font-semibold text-teal-600 uppercase mb-2">
                Patient
              </p>
              <p className="text-sm"><span className="font-medium">Nom :</span>{" "}
                {selectedConsultation.patients?.nom}</p>
              <p className="text-sm"><span className="font-medium">Prénom :</span>{" "}
                {selectedConsultation.patients?.prenom}</p>
              <p className="text-sm"><span className="font-medium">Téléphone :</span>{" "}
                {selectedConsultation.patients?.telephone}</p>
              <p className="text-sm"><span className="font-medium">Naissance :</span>{" "}
                {new Date(selectedConsultation.patients?.dateNaissance)
                  .toLocaleDateString("fr-FR")}</p>
              <p className="text-sm"><span className="font-medium">Sexe :</span>{" "}
                {selectedConsultation.patients?.sexe}</p>
              <p className="text-sm"><span className="font-medium">Type :</span>{" "}
                {selectedConsultation.patients?.typePatient}</p>
              <p className="text-sm"><span className="font-medium">Groupe sg :</span>{" "}
                {selectedConsultation.patients?.groupeSanguin}</p>
            </div>

            {/* Infos consultation */}
            <div className="bg-teal-50 rounded-lg p-4 space-y-1">
              <p className="text-xs font-semibold text-teal-600 uppercase mb-2">
                Consultation
              </p>
              <p className="text-sm"><span className="font-medium">Médecin :</span>{" "}
                Dr {selectedConsultation.medecin?.prenom}</p>
              <p className="text-sm"><span className="font-medium">Motif :</span>{" "}
                {selectedConsultation.motif}</p>
              <p className="text-sm"><span className="font-medium">Diagnostic :</span>{" "}
                {selectedConsultation.diagnostic}</p>
              <p className="text-sm"><span className="font-medium">Traitement :</span>{" "}
                {selectedConsultation.traitement}</p>
              <p className="text-sm"><span className="font-medium">Date :</span>{" "}
                {selectedConsultation.dateConsultation?.split("T")[0]}</p>
            </div>

            {/* Boutons */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => exporterPDF(selectedConsultation)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg
                  hover:bg-blue-700 text-sm font-medium transition-colors
                  flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor"
                  strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6
                    a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                </svg>
                Exporter PDF
              </button>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg
                  hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}