import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { useLocation, useNavigate } from "react-router-dom";
import JsBarcode from "jsbarcode";

export default function Consultation() {
  const location  = useLocation();
  const navigate  = useNavigate();

  const medecinId     = localStorage.getItem("medecinId");
  const medecinPrenom = localStorage.getItem("medecinPrenom");

  const [patients,         setPatients]        = useState([]);
  const [showPaper,        setShowPaper]        = useState(false);
  const [consultationData, setConsultationData] = useState(null);
  const [modeConfidentiel, setModeConfidentiel] = useState(true);
  const [barcodeValue,     setBarcodeValue]     = useState("");
  const [barcodeInput,     setBarcodeInput]     = useState("");
  const barcodeCanvasRef = useRef(null);

  const [formData, setFormData] = useState({
    patientId:         "",
    medecinId:         medecinId || "",
    motif:             "",
    diagnostic:        "",
    traitement:        "",
    dateConsultation:  new Date().toISOString().slice(0, 10),
    heureConsultation: new Date().toTimeString().slice(0, 5),
  });

  // ── Charger patients + traitement depuis ordonnance ──────────────────
  useEffect(() => {
    fetch("http://localhost:5000/api/GET/allPatients")
      .then(r => r.json())
      .then(setPatients)
      .catch(console.error);

    if (location.state?.traitement) {
      setFormData(prev => ({ ...prev, traitement: location.state.traitement }));
      if (location.state?.barcodeValue) {
        setBarcodeValue(location.state.barcodeValue);
      }
    }

    const interval = setInterval(() => {
      setFormData(prev => ({
        ...prev,
        heureConsultation: new Date().toTimeString().slice(0, 5),
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, [location.state]);

  // ── Générer le canvas code-barres médicament scanné ──────────────────
  useEffect(() => {
    if (barcodeValue && barcodeCanvasRef.current) {
      JsBarcode(barcodeCanvasRef.current, barcodeValue, {
        format:       "CODE128",
        lineColor:    "#000",
        width:        2,
        height:       60,
        displayValue: true,
        fontSize:     14,
      });
    }
  }, [barcodeValue]);

  // ✅ Extraire uniquement le moment de prise depuis le texte traitement
  // Exemple : "paracetamole - 500mg - 3 plaquetes - Matin, Soir" → "Matin, Soir"
  const extraireMomentPrise = (traitement) => {
    if (!traitement) return "";
    const parties = traitement.split(" - ");
    return parties[parties.length - 1].trim();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBarcodeConfirm = () => {
    if (!barcodeInput.trim()) return;
    setBarcodeValue(barcodeInput.trim());
    setBarcodeInput("");
  };

  // ── Soumission ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.medecinId) {
      alert("Médecin non connecté !");
      return;
    }

    const payload = { ...formData, codeBarreTraitement: barcodeValue };
    setConsultationData(payload);
    setShowPaper(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/insertion/CreationConsultation",
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
      } else {
        alert("Consultation enregistrée ✅");
        setFormData({
          patientId:         "",
          medecinId:         medecinId,
          motif:             "",
          diagnostic:        "",
          traitement:        "",
          dateConsultation:  new Date().toISOString().slice(0, 10),
          heureConsultation: new Date().toTimeString().slice(0, 5),
        });
        setBarcodeValue("");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  // ── Génération PDF ────────────────────────────────────────────────────
  const generatePDF = () => {
    if (!consultationData) return;

    const doc = new jsPDF();
    const selectedPatient = patients.find(
      p => p.id === parseInt(consultationData.patientId)
    );

    // En-tête
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("FICHE DE CONSULTATION", 105, 20, null, null, "center");
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);

    // Infos publiques
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Patient    : ${selectedPatient?.nom || ""} ${selectedPatient?.prenom || ""}`, 20, 38);
    doc.text(`Médecin    : Dr ${medecinPrenom}`, 20, 48);
    doc.text(`Date       : ${consultationData.dateConsultation}`, 20, 58);
    doc.text(`Heure      : ${consultationData.heureConsultation}`, 20, 68);
    doc.text(`Motif      : ${consultationData.motif}`, 20, 78);
    doc.text(`Diagnostic : ${consultationData.diagnostic}`, 20, 88);

    // Séparateur confidentiel
    doc.setDrawColor(20, 120, 100);
    doc.setLineWidth(0.4);
    doc.line(20, 95, 190, 95);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 120, 100);
    doc.text("JOURS DU TRAITEMENT ", 20, 102);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    // ✅ Code-barres traitement — encode la valeur complète,
    //    affiche uniquement le moment de prise (Matin, Soir…)
    const traitementTexte = consultationData.traitement || "AUCUN-TRAITEMENT";
    const momentPrise     = extraireMomentPrise(traitementTexte);

    const canvas = document.createElement("canvas");
    JsBarcode(canvas, traitementTexte, {
      format:       "CODE128",
      lineColor:    "#000000",
      width:        2,
      height:       70,
      displayValue: true,
      text:         momentPrise,  // ✅ seul le moment de prise s'affiche sous le code-barres
      fontSize:     13,
      margin:       10,
      background:   "#ffffff",
    });

    const traitementBarcode = canvas.toDataURL("image/png");
    doc.text(`Traitement : ${momentPrise}`, 20, 112);
    doc.addImage(traitementBarcode, "PNG", 20, 116, 170, 35);

    // Code-barres médicament scanné (si présent)
    let nextY = 158;
    if (barcodeCanvasRef.current && consultationData.codeBarreTraitement) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Code-barres médicament :", 20, nextY);
      const medicamentBarcode = barcodeCanvasRef.current.toDataURL("image/png");
      doc.addImage(medicamentBarcode, "PNG", 20, nextY + 4, 100, 28);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Réf. : ${consultationData.codeBarreTraitement}`, 20, nextY + 36);
      doc.setTextColor(0, 0, 0);
    }

    doc.save(
      `consultation_${selectedPatient?.nom || "patient"}_${consultationData.dateConsultation}.pdf`
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">

      {/* TITRE + TOGGLE MODE CONFIDENTIEL */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Créer une consultation
        </h2>
        <button
          type="button"
          onClick={() => setModeConfidentiel(prev => !prev)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
            font-medium transition-colors border ${
            modeConfidentiel
              ? "bg-gray-800 text-white border-gray-700"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          {modeConfidentiel ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor"
              strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8
                a18.45 18.45 0 015.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8
                a18.5 18.5 0 01-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor"
              strokeWidth="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
          {modeConfidentiel ? "Mode confidentiel actif" : "Masquer traitement"}
        </button>
      </div>

      {/* Bandeau mode confidentiel */}
      {modeConfidentiel && (
        <div className="flex items-center gap-3 bg-gray-800 text-gray-100
          rounded-lg px-4 py-2 mb-5 text-xs">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor"
            strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          Mode confidentiel actif — le traitement et les codes-barres sont masqués
          à l'écran. Ils apparaîtront uniquement dans le PDF exporté.
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>

        {/* PATIENT + MÉDECIN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient *</label>
            <select name="patientId" value={formData.patientId}
              onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500">
              <option value="">Sélectionner un patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Médecin</label>
            <input type="text" value={medecinPrenom ? `Dr ${medecinPrenom}` : ""} disabled
              className="mt-1 block w-full px-3 py-2 border rounded-lg
                border-gray-300 bg-gray-50" />
          </div>
        </div>

        {/* MOTIF + DIAGNOSTIC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Motif *</label>
            <input type="text" name="motif" value={formData.motif}
              onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Diagnostic *</label>
            <input type="text" name="diagnostic" value={formData.diagnostic}
              onChange={handleChange} required
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500" />
          </div>
        </div>

        {/* SECTION TRAITEMENT CONFIDENTIELLE */}
        <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${
          modeConfidentiel
            ? "border-gray-700 bg-gray-900"
            : "border-teal-200 bg-teal-50"
        }`}>

          {/* En-tête section */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            modeConfidentiel ? "border-gray-700" : "border-teal-200"
          }`}>
            <div className="flex items-center gap-2">
              <svg className={`w-4 h-4 ${
                modeConfidentiel ? "text-gray-400" : "text-teal-600"
              }`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                  a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span className={`text-sm font-medium ${
                modeConfidentiel ? "text-gray-300" : "text-teal-800"
              }`}>
                Traitement & Code-barres
              </span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              modeConfidentiel
                ? "bg-gray-700 text-gray-400"
                : "bg-teal-100 text-teal-600"
            }`}>
              {modeConfidentiel ? "🔒 Masqué" : "👁 Visible"}
            </span>
          </div>

          <div className="p-4 space-y-4">

            {/* Traitement */}
            <div>
              <label className={`block text-xs mb-1 ${
                modeConfidentiel ? "text-gray-400" : "text-gray-600"
              }`}>
                Traitement (ordonnance)
              </label>
              {modeConfidentiel ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border
                    border-gray-700 text-gray-500 text-sm select-none tracking-widest">
                    {formData.traitement ? "●●●●●●●●●●●●●●●" : "Aucun traitement saisi"}
                  </div>
                  <button type="button" onClick={() => navigate("/ordonnance")}
                    className="px-3 py-2 bg-teal-600 text-white text-xs rounded-lg
                      hover:bg-teal-700 whitespace-nowrap">
                    Ordonnance
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => navigate("/ordonnance")}
                  className="block w-full px-3 py-2 border rounded-lg border-gray-300
                    bg-white text-left text-sm focus:ring-teal-500 focus:border-teal-200">
                  {formData.traitement || "Cliquer pour créer l'ordonnance"}
                </button>
              )}
            </div>

            {/* Code-barres scan / saisie manuelle */}
            <div>
              <label className={`block text-xs mb-1 ${
                modeConfidentiel ? "text-gray-400" : "text-gray-600"
              }`}>
                Code-barres médicament (scan ou saisie)
              </label>
              <div className="flex gap-2">
                <input
                  type={modeConfidentiel ? "password" : "text"}
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e =>
                    e.key === "Enter" && (e.preventDefault(), handleBarcodeConfirm())
                  }
                  placeholder="Scanner ou saisir le code…"
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm
                    focus:ring-teal-500 focus:border-teal-500 ${
                    modeConfidentiel
                      ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                />
                <button type="button" onClick={handleBarcodeConfirm}
                  className="px-3 py-2 bg-teal-600 text-white text-xs rounded-lg
                    hover:bg-teal-700 whitespace-nowrap">
                  Lier
                </button>
              </div>

              {barcodeValue && (
                <div className={`mt-2 flex items-center gap-2 text-xs ${
                  modeConfidentiel ? "text-gray-500" : "text-teal-700"
                }`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor"
                    strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {modeConfidentiel
                    ? "Code-barres lié (masqué)"
                    : `Code-barres lié : ${barcodeValue}`
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HEURE + DATE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Heure de consultation
            </label>
            <div className="mt-1 flex items-center gap-2 px-3 py-2 border
              rounded-lg border-gray-300 bg-gray-50">
              <span className="text-gray-800 font-medium">
                🕐 {formData.heureConsultation}
              </span>
            </div>
            <input type="hidden" name="heureConsultation"
              value={formData.heureConsultation} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date de consultation *
            </label>
            <input type="date" name="dateConsultation"
              value={formData.dateConsultation}
              onChange={handleChange} required
              min={new Date().toISOString().split("T")[0]}
              className="mt-1 block w-full px-3 py-2 border rounded-lg border-gray-300
                focus:ring-teal-500 focus:border-teal-500" />
          </div>
        </div>

        <div className="text-right">
          <button type="submit"
            className="bg-teal-500 text-white px-6 py-2 rounded hover:bg-teal-600">
            Créer consultation
          </button>
        </div>
      </form>

      {/* Canvas code-barres — invisible dans le DOM */}
      <canvas
        ref={barcodeCanvasRef}
        style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
        aria-hidden="true"
      />

      {/* RÉCAPITULATIF ÉCRAN — sans traitement ni code-barres */}
      {showPaper && consultationData && (
        <div className="mt-10 p-6 border border-gray-200 bg-white shadow rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Récapitulatif consultation
            </h3>
            <span className="text-xs bg-yellow-100 text-yellow-700
              px-2 py-1 rounded-full">
              ⚠ Traitement non affiché (confidentiel)
            </span>
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium">Patient :</span>{" "}
              {patients.find(
                p => p.id === parseInt(consultationData.patientId)
              )?.nom}{" "}
              {patients.find(
                p => p.id === parseInt(consultationData.patientId)
              )?.prenom}
            </p>
            <p><span className="font-medium">Médecin :</span> Dr {medecinPrenom}</p>
            <p><span className="font-medium">Motif :</span> {consultationData.motif}</p>
            <p><span className="font-medium">Diagnostic :</span> {consultationData.diagnostic}</p>
            <p><span className="font-medium">Date :</span> {consultationData.dateConsultation}</p>
            <p><span className="font-medium">Heure :</span> {consultationData.heureConsultation}</p>
          </div>

          <button onClick={generatePDF}
            className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg
              hover:bg-blue-700 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor"
              strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6
                a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            Exporter PDF (avec traitement complet)
          </button>
        </div>
      )}
    </div>
  );
}