// pages/TeleconsultationPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoCallButton from "./VideoCallButton.jsx";

// ── Utilitaire : trouve le token peu importe la clé utilisée ──
const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("jwt") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("token");

const TeleconsultationPage = () => {
  const { numero }            = useParams();
  const navigate              = useNavigate();
  const [chambre, setChambre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetchChambre = async () => {
      const token = getToken();

      // ── Debug console ──
      console.log("🔑 Token trouvé :", token ? `${token.slice(0, 20)}…` : "NULL");
      console.log("🏥 Chambre demandée :", numero);

      if (!token) {
        setError("Session expirée — veuillez vous reconnecter.");
        setLoading(false);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:5000/api/rooms/numero/${numero}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("📡 HTTP status :", res.status);
        const data = await res.json();
        console.log("📦 Réponse :", data);

        if (!res.ok) throw new Error(data.error || `Erreur HTTP ${res.status}`);

        setChambre(data.data);
      } catch (err) {
        console.error("❌", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChambre();
  }, [numero]);

  const handleCallStart = (sessionData) => {
    console.log("📹 Session démarrée :", sessionData);
    // → brancher WebRTC ici avec sessionData.token
  };

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen message={error} />;
  if (!chambre) return <ErrorScreen message="Chambre introuvable" />;

  const patients = chambre.patients || [];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 40 }}>🏥</span>
          <div>
            <h1 style={styles.roomTitle}>Chambre n° {chambre.numero}</h1>
            <p style={styles.roomSub}>
              {chambre.occupe}/{chambre.capacite} lit(s) occupé(s)
            </p>
          </div>
        </div>
        <OccupationBadge chambre={chambre} />
      </div>

      <ProgressBar occupe={chambre.occupe} capacite={chambre.capacite} />

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Patients assignés ({patients.length})
        </h2>

        {patients.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={styles.patientGrid}>
            {patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={{
                  ...patient,
                  chambreId: chambre.id,
                  chambre: {
                    id:       chambre.id,
                    numero:   chambre.numero,
                    occupe:   chambre.occupe,
                    capacite: chambre.capacite,
                  },
                }}
                onCallStart={handleCallStart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Sous-composants
// ─────────────────────────────────────────────

const PatientCard = ({ patient, onCallStart }) => (
  <div style={styles.card}>
    <div style={styles.cardHeader}>
      <div style={styles.avatar}>
        {patient.prenom?.[0]}{patient.nom?.[0]}
      </div>
      <div>
        <div style={styles.patientName}>{patient.prenom} {patient.nom}</div>
        <div style={styles.patientMeta}>
          {patient.typePatient} · {patient.groupeSanguin || "—"}
        </div>
      </div>
    </div>

    <div style={styles.divider} />

    <div style={styles.infoRow}>
      <span style={styles.infoKey}>🛏 Chambre</span>
      <span style={styles.infoVal}>N° {patient.chambre.numero}</span>
    </div>
    <div style={styles.infoRow}>
      <span style={styles.infoKey}>📊 Occupation</span>
      <span style={styles.infoVal}>
        {patient.chambre.occupe}/{patient.chambre.capacite}
      </span>
    </div>
    {patient.medecin && (
      <div style={styles.infoRow}>
        <span style={styles.infoKey}>👨‍⚕️ Médecin</span>
        <span style={styles.infoVal}>
          Dr. {patient.medecin.prenom} {patient.medecin.nom}
        </span>
      </div>
    )}

    <div style={styles.divider} />

    {/* 🔥 VideoCallButton — visible seulement si chambre valide */}
    <VideoCallButton patient={patient} onCallStart={onCallStart} />
  </div>
);

const OccupationBadge = ({ chambre }) => {
  const pleine = chambre.occupe >= chambre.capacite;
  const vide   = chambre.occupe <= 0;
  const label  = pleine ? "Complète" : vide ? "Vide" : "Disponible";
  const color  = pleine ? "#dc2626" : vide ? "#64748b" : "#059669";
  const bg     = pleine ? "#fef2f2" : vide ? "#f1f5f9" : "#ecfdf5";
  return (
    <span style={{
      padding: "5px 14px", borderRadius: 20,
      fontSize: 13, fontWeight: 600,
      color, background: bg, border: `1px solid ${color}33`
    }}>
      ● {label}
    </span>
  );
};

const ProgressBar = ({ occupe, capacite }) => {
  const pct   = capacite > 0 ? Math.round((occupe / capacite) * 100) : 0;
  const color = pct >= 100 ? "#dc2626" : pct >= 60 ? "#d97706" : "#059669";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
      <div style={{ flex: 1, height: 8, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`,
          background: color, transition: "width .4s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, minWidth: 36, color }}>{pct}%</span>
    </div>
  );
};

const EmptyState = () => (
  <div style={{ textAlign: "center", padding: "40px 0" }}>
    <span style={{ fontSize: 40 }}>🛏</span>
    <p style={{ color: "#64748b", marginTop: 8 }}>Aucun patient assigné</p>
  </div>
);

const LoadingScreen = () => (
  <div style={{ display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
    <div style={{
      width: 36, height: 36,
      border: "3px solid #e2e8f0",
      borderTop: "3px solid #0d9488",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    }} />
    <p style={{ color: "#64748b", marginTop: 12 }}>Chargement…</p>
  </div>
);

const ErrorScreen = ({ message }) => (
  <div style={{ display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
    <span style={{ fontSize: 40 }}>⚠️</span>
    <p style={{ color: "#dc2626", marginTop: 8, textAlign: "center" }}>{message}</p>
  </div>
);

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh", background: "#f8fafc",
    padding: "28px 24px", maxWidth: 900,
    margin: "0 auto", fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16, flexWrap: "wrap", gap: 12,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  roomTitle:  { fontSize: 26, fontWeight: 700, color: "#0f172a", margin: 0 },
  roomSub:    { fontSize: 14, color: "#64748b", margin: "2px 0 0" },
  section:    { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16, fontWeight: 600, color: "#475569",
    marginBottom: 14, textTransform: "uppercase", letterSpacing: ".04em",
  },
  patientGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#fff", borderRadius: 14,
    border: "1px solid #e2e8f0", padding: "18px 20px",
    display: "flex", flexDirection: "column", gap: 10,
    boxShadow: "0 1px 4px rgba(0,0,0,.05)",
  },
  cardHeader:  { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: "50%",
    background: "linear-gradient(135deg, #0f766e, #0d9488)",
    color: "#fff", fontSize: 16, fontWeight: 700,
    display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  patientName: { fontSize: 15, fontWeight: 700, color: "#0f172a" },
  patientMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  divider:     { borderTop: "1px solid #f1f5f9", margin: "2px 0" },
  infoRow:     { display: "flex", justifyContent: "space-between", fontSize: 13 },
  infoKey:     { color: "#64748b" },
  infoVal:     { fontWeight: 600, color: "#0f172a" },
};

export default TeleconsultationPage;