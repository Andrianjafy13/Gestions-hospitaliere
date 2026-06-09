// pages/pharmacie/Caisse.jsx
import { useLocation } from "react-router-dom";
import { useRef, useEffect } from "react";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

export default function Caisse() {
  const location   = useLocation();
  const factureRef = useRef(null);

  // ── Refs pour les canvas codes-barres (un par ligne) ────────
  const barcodeRefs = useRef([]);

  const {
    facture,
    patientNom,
    medecinNom,
    consultationId,
  } = location.state || {};

  // ── Numéro de facture auto ───────────────────────────────────
  const numeroFacture = `FAC-${new Date().getFullYear()}-${String(
    Math.floor(Math.random() * 9000) + 1000
  )}`;
  const dateFacture = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  // ── Générer les codes-barres sur les canvas cachés ───────────
  useEffect(() => {
    if (!facture?.lignes) return;
    facture.lignes.forEach((l, i) => {
      const canvas = barcodeRefs.current[i];
      if (!canvas) return;
      try {
        JsBarcode(canvas, l.nomMedicament || "MEDICAMENT", {
          format:       "CODE128",
          width:        1.5,
          height:       40,
          displayValue: false,
          fontSize:     10,
          margin:       6,
          background:   "#ffffff",
          lineColor:    "#000000",
          textAlign:    "center",
          fontOptions:  "",
        });
      } catch (e) {
        console.warn("Barcode error pour", l.nomMedicament, e);
      }
    });
  }, [facture]);

  // ── Statut badge ─────────────────────────────────────────────
  const statutStyle = {
    complet:        { bg: "#dcfce7", color: "#15803d", label: "Complet"     },
    partiel:        { bg: "#fef9c3", color: "#a16207", label: "Partiel"     },
    rupture_totale: { bg: "#fee2e2", color: "#b91c1c", label: "Rupture"     },
    introuvable:    { bg: "#f3f4f6", color: "#6b7280", label: "Introuvable" },
  };

  // ── Télécharger PDF — construit manuellement avec jsPDF ──────
  const telechargerPDF = () => {
    const pdf    = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const PW     = pdf.internal.pageSize.getWidth();   // 210mm
    const PH     = pdf.internal.pageSize.getHeight();  // 297mm
    const margin = 14;
    let   y      = 0;

    // ── Helper couleur hex → rgb ─────────────────────────────
    const hex = (h) => {
      const r = parseInt(h.slice(1,3),16);
      const g = parseInt(h.slice(3,5),16);
      const b = parseInt(h.slice(5,7),16);
      return [r, g, b];
    };

    // ─────────────────────────────────────────────────────────
    // BANDEAU HEADER sombre
    // ─────────────────────────────────────────────────────────
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, PW, 44, "F");

    // Accent teal fin
    pdf.setFillColor(13, 148, 136);
    pdf.rect(0, 44, PW, 2, "F");

    // Titre FACTURE
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(255, 255, 255);
    pdf.text("FACTURE", PW - margin, 18, { align: "right" });

    // Numéro facture
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(13, 148, 136);
    pdf.text(numeroFacture, PW - margin, 25, { align: "right" });

    // Date
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(8);
    pdf.text(dateFacture, PW - margin, 31, { align: "right" });

    // Logo texte
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(255, 255, 255);
    pdf.text("💊 Pharmacie Hospitalière", margin, 18);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text("Gestion Médicale Intégrée · Antananarivo, Madagascar", margin, 25);

    y = 54;

    // ─────────────────────────────────────────────────────────
    // CARTES Patient / Médecin
    // ─────────────────────────────────────────────────────────
    const cardW = (PW - margin * 2 - 6) / 2;

    // Carte gauche — Patient
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, y, cardW, 24, 3, 3, "F");
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, y, cardW, 24, 3, 3, "S");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(13, 148, 136);
    pdf.text("FACTURÉ À", margin + 6, y + 7);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(patientNom || "—", margin + 6, y + 14);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Patient · Consultation #${consultationId ?? "—"}`, margin + 6, y + 20);

    // Carte droite — Médecin
    const cx = margin + cardW + 6;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(cx, y, cardW, 24, 3, 3, "F");
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(cx, y, cardW, 24, 3, 3, "S");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(13, 148, 136);
    pdf.text("PRESCRIT PAR", cx + 6, y + 7);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(medecinNom || "—", cx + 6, y + 14);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Médecin prescripteur", cx + 6, y + 20);

    y += 32;

    // ─────────────────────────────────────────────────────────
    // TABLEAU — en-têtes
    // ─────────────────────────────────────────────────────────
    const cols = {
      medicament: { x: margin,       w: 54 },
      demande:    { x: margin + 54,  w: 18 },
      delivre:    { x: margin + 72,  w: 18 },
      manquant:   { x: margin + 90,  w: 18 },
      prixUnit:   { x: margin + 108, w: 24 },
      montant:    { x: margin + 132, w: 28 },
      statut:     { x: margin + 160, w: 36 },
    };

    const rowH   = 22; // hauteur ligne avec code-barre
    const headH  = 9;

    // Header fond sombre
    pdf.setFillColor(15, 23, 42);
    pdf.rect(margin, y, PW - margin * 2, headH, "F");

    const headers = [
      { label: "MÉDICAMENT",  col: "medicament", align: "left"   },
      { label: "DEMANDÉ",     col: "demande",    align: "center" },
      { label: "DÉLIVRÉ",     col: "delivre",    align: "center" },
      { label: "MANQUANT",    col: "manquant",   align: "center" },
      { label: "PRIX UNIT.",  col: "prixUnit",   align: "right"  },
      { label: "MONTANT",     col: "montant",    align: "right"  },
      { label: "STATUT",      col: "statut",     align: "center" },
    ];

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);

    headers.forEach(({ label, col, align }) => {
      const c = cols[col];
      const tx = align === "right"  ? c.x + c.w - 2 :
                 align === "center" ? c.x + c.w / 2  :
                                      c.x + 2;
      pdf.text(label, tx, y + 6, { align });
    });

    y += headH;

    // ─────────────────────────────────────────────────────────
    // TABLEAU — lignes avec codes-barres
    // ─────────────────────────────────────────────────────────
    facture.lignes.forEach((l, i) => {
      // Vérifier si on dépasse la page
      if (y + rowH > PH - 40) {
        pdf.addPage();
        y = 20;
      }

      // Fond alterné
      pdf.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 251, i % 2 === 0 ? 255 : 252);
      pdf.rect(margin, y, PW - margin * 2, rowH, "F");

      // Séparateur bas
      pdf.setDrawColor(241, 245, 249);
      pdf.line(margin, y + rowH, PW - margin, y + rowH);

      // ── Colonne Médicament → CODE-BARRE ──────────────────
      const canvas = barcodeRefs.current[i];
      if (canvas && canvas.width > 0) {
        const imgData = canvas.toDataURL("image/png");
        const bW = cols.medicament.w - 4;   // largeur image mm
        const bH = rowH - 4;                // hauteur image mm
        pdf.addImage(imgData, "PNG", cols.medicament.x + 2, y + 2, bW, bH);
      } else {
        // Fallback texte si canvas non disponible
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(15, 23, 42);
        pdf.text(
          l.nomMedicament || "—",
          cols.medicament.x + 2,
          y + rowH / 2 + 2,
          { maxWidth: cols.medicament.w - 4 }
        );
      }

      // ── Autres colonnes ───────────────────────────────────
      const midY = y + rowH / 2 + 2;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);

      // Demandé
      pdf.text(String(l.quantiteDemandee), cols.demande.x + cols.demande.w / 2, midY, { align: "center" });

      // Délivré
      pdf.text(String(l.quantiteVendue), cols.delivre.x + cols.delivre.w / 2, midY, { align: "center" });

      // Manquant
      if (l.quantiteManquante > 0) {
        pdf.setTextColor(220, 38, 38);
        pdf.setFont("helvetica", "bold");
        pdf.text(`-${l.quantiteManquante}`, cols.manquant.x + cols.manquant.w / 2, midY, { align: "center" });
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(71, 85, 105);
      } else {
        pdf.setTextColor(148, 163, 184);
        pdf.text("—", cols.manquant.x + cols.manquant.w / 2, midY, { align: "center" });
        pdf.setTextColor(71, 85, 105);
      }

      // Prix unit.
      pdf.text(
        `${l.prixUnitaire.toLocaleString("fr-FR")} Ar`,
        cols.prixUnit.x + cols.prixUnit.w - 2, midY,
        { align: "right" }
      );

      // Montant
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      pdf.text(
        `${l.prixFacture.toLocaleString("fr-FR")} Ar`,
        cols.montant.x + cols.montant.w - 2, midY,
        { align: "right" }
      );

      // Statut badge
      const s    = statutStyle[l.statut] || statutStyle.introuvable;
      const bx   = cols.statut.x + 3;
      const byw  = cols.statut.w - 6;
      const byh  = 6;
      const byy  = y + rowH / 2 - byh / 2;
      const [br, bg, bb] = hex(s.bg);
      pdf.setFillColor(br, bg, bb);
      pdf.roundedRect(bx, byy, byw, byh, 2, 2, "F");
      const [cr, cg, cb] = hex(s.color);
      pdf.setTextColor(cr, cg, cb);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      pdf.text(s.label.toUpperCase(), bx + byw / 2, byy + 4.2, { align: "center" });

      y += rowH;
    });

    y += 8;

    // ─────────────────────────────────────────────────────────
    // TOTAUX
    // ─────────────────────────────────────────────────────────
    const totW = 80;
    const totX = PW - margin - totW;

    // Total à payer — fond sombre
    pdf.setFillColor(15, 23, 42);
    pdf.rect(totX, y, totW, 11, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text("TOTAL À PAYER", totX + 4, y + 7.5);
    pdf.setTextColor(20, 184, 166);
    pdf.setFontSize(11);
    pdf.text(
      `${facture.totalAPayer.toLocaleString("fr-FR")} Ar`,
      totX + totW - 4, y + 7.5,
      { align: "right" }
    );
    y += 18;

    // ─────────────────────────────────────────────────────────
    // PIED DE PAGE
    // ─────────────────────────────────────────────────────────
    const footY = PH - 16;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, footY - 4, PW - margin, footY - 4);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      "Document généré automatiquement — Pharmacie Hospitalière · Ce document fait foi de paiement.",
      margin, footY
    );
    pdf.text("Signature pharmacien", PW - margin, footY, { align: "right" });

    pdf.save(`${numeroFacture}_${(patientNom || "patient").replace(/\s/g, "_")}.pdf`);
  };

  // ── Imprimer ─────────────────────────────────────────────────
  const imprimer = () => window.print();

  if (!facture) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "60vh", flexDirection: "column", gap: "12px",
      }}>
        <span style={{ fontSize: "48px" }}>🧾</span>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          Aucune facture disponible
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Styles globaux impression ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .facture-wrapper { box-shadow: none !important; border: none !important; }
        }

        .facture-wrapper { font-family: 'DM Sans', sans-serif; }
        .row-hover:hover { background: #f8fafc; }
      `}</style>

      {/* Canvas codes-barres — INVISIBLES dans le DOM, lus par jsPDF ── */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px", visibility: "hidden" }}>
        {facture.lignes.map((_, i) => (
          <canvas
            key={i}
            ref={el => barcodeRefs.current[i] = el}
          />
        ))}
      </div>

      {/* ── Boutons action ── */}
      <div className="no-print" style={{
        maxWidth: "860px", margin: "24px auto 0", padding: "0 24px",
        display: "flex", gap: "12px", justifyContent: "flex-end",
      }}>
        <button
          onClick={imprimer}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 20px", borderRadius: "10px", fontSize: "13px",
            fontWeight: 600, cursor: "pointer", border: "1.5px solid #d1d5db",
            background: "white", color: "#374151", fontFamily: "'DM Sans', sans-serif",
          }}
        >
          🖨️ Imprimer
        </button>
        <button
          onClick={telechargerPDF}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 20px", borderRadius: "10px", fontSize: "13px",
            fontWeight: 600, cursor: "pointer", border: "none",
            background: "linear-gradient(135deg, #0d9488, #0f766e)",
            color: "white", fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 4px 14px rgba(13,148,136,0.35)",
          }}
        >
          ⬇️ Télécharger PDF
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════
          FACTURE — interface visuelle (style inchangé)
      ════════════════════════════════════════════════════════ */}
      <div
        ref={factureRef}
        className="facture-wrapper"
        style={{
          maxWidth: "860px", margin: "16px auto 48px",
          background: "white", borderRadius: "16px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
          overflow: "hidden",
        }}
      >
        {/* ── Bandeau supérieur ── */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          padding: "40px 48px 32px", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(13,148,136,0.15)" }} />
          <div style={{ position: "absolute", bottom: "-40px", right: "80px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(13,148,136,0.08)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>💊</div>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 700, color: "white", margin: 0 }}>Pharmacie Hospitalière</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0, marginTop: "2px" }}>Gestion Médicale Intégrée</p>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Antsirabe 110, Madagascar</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 700, color: "white", margin: 0, letterSpacing: "-0.5px" }}>FACTURE</p>
              <p style={{ fontSize: "13px", color: "#0d9488", fontWeight: 600, margin: "4px 0 0", letterSpacing: "0.5px" }}>{numeroFacture}</p>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "6px 0 0" }}>{dateFacture}</p>
            </div>
          </div>
        </div>

        <div style={{ height: "4px", background: "linear-gradient(90deg, #0d9488, #14b8a6, #0d9488)" }} />

        <div style={{ padding: "40px 48px" }}>
          {/* Cartes patient / médecin */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "36px" }}>
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "20px 24px", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "#0d9488", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px" }}>Facturé à</p>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: "0 0 4px" }}>{patientNom}</p>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Patient · Consultation #{consultationId ?? "—"}</p>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "20px 24px", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "#0d9488", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 10px" }}>Prescrit par</p>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: "0 0 4px" }}>{medecinNom}</p>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Médecin prescripteur</p>
            </div>
          </div>

          {/* Tableau médicaments — nom en texte dans l'interface */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "28px" }}>
            <thead>
              <tr style={{ background: "#0f172a" }}>
                {["Médicament", "Demandé", "Délivré", "Manquant", "Prix unit.", "Montant", "Statut"].map((h, i) => (
                  <th key={h} style={{
                    padding: "12px 14px", fontSize: "10px", fontWeight: 600, color: "#94a3b8",
                    textTransform: "uppercase", letterSpacing: "0.8px",
                    textAlign: i === 0 ? "left" : i >= 4 ? "right" : "center",
                    ...(i === 6 && { textAlign: "center" }),
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facture.lignes.map((l, i) => {
                const s = statutStyle[l.statut] || statutStyle.introuvable;
                return (
                  <tr key={i} className="row-hover" style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                    {/* ✅ Interface : nom en texte normal (code-barre uniquement dans le PDF) */}
                    <td style={{ padding: "14px 14px", fontSize: "13px", fontWeight: 500, color: "#0f172a" }}>
                      {l.nomMedicament}
                    </td>
                    <td style={{ padding: "14px 14px", fontSize: "13px", color: "#475569", textAlign: "center" }}>{l.quantiteDemandee}</td>
                    <td style={{ padding: "14px 14px", fontSize: "13px", color: "#475569", textAlign: "center" }}>{l.quantiteVendue}</td>
                    <td style={{ padding: "14px 14px", textAlign: "center" }}>
                      {l.quantiteManquante > 0
                        ? <span style={{ color: "#dc2626", fontWeight: 600, fontSize: "13px" }}>-{l.quantiteManquante}</span>
                        : <span style={{ color: "#94a3b8", fontSize: "13px" }}>—</span>}
                    </td>
                    <td style={{ padding: "14px 14px", fontSize: "13px", color: "#475569", textAlign: "right" }}>{l.prixUnitaire.toLocaleString("fr-FR")} Ar</td>
                    <td style={{ padding: "14px 14px", fontSize: "13px", fontWeight: 700, color: "#0f172a", textAlign: "right" }}>{l.prixFacture.toLocaleString("fr-FR")} Ar</td>
                    <td style={{ padding: "14px 14px", textAlign: "center" }}>
                      <span style={{ background: s.bg, color: s.color, fontSize: "10px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totaux */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "28px" }}>
            <div style={{ width: "300px" }}>
              <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #0f172a, #1e3a5f)" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>TOTAL À PAYER</span>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "#14b8a6" }}>{facture.totalAPayer.toLocaleString("fr-FR")} Ar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pied */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Document généré automatiquement — Pharmacie Hospitalière</p>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: "3px 0 0" }}>Ce document fait foi de paiement pour les médicaments délivrés.</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ width: "80px", height: "2px", background: "linear-gradient(90deg, #0d9488, #14b8a6)", marginLeft: "auto", marginBottom: "6px" }} />
              <p style={{ fontSize: "10px", color: "#94a3b8", margin: 0 }}>Signature pharmacien</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
