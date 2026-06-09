// components/VideoCallButton.jsx
import React, { useState, useEffect } from "react";

const VideoCallButton = ({ patient, onCallStart }) => {
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [inCall, setInCall]         = useState(false);
  const [duration, setDuration]     = useState(0);

  // ── Règle métier exacte du controller checkRoomAccess ──────
  // 1. chambreId doit exister
  // 2. chambre doit exister (relation chargée)
  // 3. chambre.occupe doit être > 0 ET <= chambre.capacite
  const chambre    = patient?.chambre;           // as: "chambre" dans Sequelize
  const chambreId  = patient?.chambreId;

  const hasRoom    = !!chambreId && !!chambre;
  const isOccValid = chambre
    ? chambre.occupe > 0 && chambre.occupe <= chambre.capacite
    : false;
  const canCall    = hasRoom && isOccValid;

  // Raison d'échec (pour tooltip + message utilisateur)
  const getReason = () => {
    if (!chambreId || !chambre) return "Aucune chambre assignée";
    if (chambre.occupe <= 0)    return "Chambre non occupée";
    if (chambre.occupe > chambre.capacite) return "Capacité dépassée";
    return null;
  };

  // ── Chronomètre pendant l'appel ───────────────────────────
  useEffect(() => {
    if (!inCall) { setDuration(0); return; }
    const interval = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [inCall]);

  const formatDuration = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Appel POST /api/rooms/video/session ───────────────────
  // Correspond exactement à : router.post("/video/session", authMiddleware, checkRoomAccess, ...)
  // Réponse attendue : { success, token, numeroChambre, patientNom }
  const handleStartCall = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/rooms/video/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ patientId: patient.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Gestion des erreurs métier du controller
        // ROOM_REQUIRED (403) → pas de chambre
        // ROOM_INACTIVE (403) → occupe invalide
        setError(data.message || data.error || "Accès refusé");
        return;
      }

      // { success, token, numeroChambre, patientNom }
      setSessionInfo(data);
      setInCall(true);
      if (onCallStart) onCallStart(data);

    } catch (err) {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = () => {
    setInCall(false);
    setSessionInfo(null);
    setError(null);
  };

  // ── Styles inline (aucune dépendance externe) ─────────────
  const styles = {
    wrapper: {
      fontFamily: "'Segoe UI', sans-serif",
      maxWidth: 420,
    },

    // ── Bouton principal ──
    btnCall: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 20px",
      borderRadius: 10,
      border: "none",
      background: "linear-gradient(135deg, #0f766e, #0d9488)",
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      transition: "opacity .2s, transform .1s",
      boxShadow: "0 2px 8px rgba(13,148,136,.35)",
    },

    btnCallHover: {
      opacity: 0.88,
      transform: "scale(1.02)",
    },

    btnLoading: {
      background: "#64748b",
      cursor: "not-allowed",
    },

    // ── Bouton désactivé (chambre invalide) ──
    btnDisabled: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 20px",
      borderRadius: 10,
      border: "1.5px dashed #cbd5e1",
      background: "#f1f5f9",
      color: "#94a3b8",
      fontSize: 14,
      fontWeight: 500,
      cursor: "not-allowed",
    },

    // ── Badge chambre ──
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500,
      marginLeft: 10,
    },

    badgeActive: {
      background: "#d1fae5",
      color: "#065f46",
    },

    badgeInactive: {
      background: "#fee2e2",
      color: "#991b1b",
    },

    // ── Message d'erreur ──
    errorBox: {
      marginTop: 8,
      padding: "8px 12px",
      borderRadius: 8,
      background: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#b91c1c",
      fontSize: 13,
      display: "flex",
      alignItems: "center",
      gap: 6,
    },

    // ── Fenêtre d'appel actif ──
    callCard: {
      marginTop: 12,
      borderRadius: 14,
      border: "1px solid #ccfbf1",
      background: "#f0fdfa",
      overflow: "hidden",
    },

    callHeader: {
      background: "linear-gradient(135deg, #0f766e, #0d9488)",
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },

    callHeaderLeft: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      color: "#fff",
      fontSize: 13,
      fontWeight: 600,
    },

    liveDot: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#4ade80",
      animation: "pulse 1.5s infinite",
      display: "inline-block",
    },

    callTimer: {
      fontFamily: "monospace",
      fontSize: 13,
      color: "#ccfbf1",
      fontWeight: 600,
    },

    callBody: {
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },

    callInfoRow: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 13,
    },

    callInfoKey: {
      color: "#64748b",
    },

    callInfoVal: {
      fontWeight: 600,
      color: "#0f172a",
    },

    callInfoValGreen: {
      fontWeight: 600,
      color: "#0f766e",
      fontFamily: "monospace",
      fontSize: 12,
    },

    divider: {
      borderTop: "1px solid #ccfbf1",
      margin: "4px 0",
    },

    btnEnd: {
      width: "100%",
      padding: "9px",
      borderRadius: 8,
      border: "none",
      background: "#ef4444",
      color: "#fff",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
  };

  // ── Rendu : bouton désactivé (pas de chambre valide) ──────
  if (!canCall && !inCall) {
    return (
      <div style={styles.wrapper}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
          <button style={styles.btnDisabled} disabled title={getReason()}>
            🚫 Appel vidéo indisponible
          </button>
          <span style={{ ...styles.badge, ...styles.badgeInactive }}>
            ● {getReason()}
          </span>
        </div>
      </div>
    );
  }

  // ── Rendu : appel en cours ────────────────────────────────
  if (inCall && sessionInfo) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.callCard}>

          {/* Header */}
          <div style={styles.callHeader}>
            <div style={styles.callHeaderLeft}>
              <span style={styles.liveDot} />
              Appel en cours
            </div>
            <span style={styles.callTimer}>⏱ {formatDuration(duration)}</span>
          </div>

          {/* Infos session — alignées sur la réponse du controller */}
          <div style={styles.callBody}>
            <div style={styles.callInfoRow}>
              <span style={styles.callInfoKey}>Patient</span>
              <span style={styles.callInfoVal}>{sessionInfo.patientNom}</span>
            </div>
            <div style={styles.callInfoRow}>
              <span style={styles.callInfoKey}>Chambre n°</span>
              <span style={styles.callInfoVal}>{sessionInfo.numeroChambre}</span>
            </div>
            <div style={styles.callInfoRow}>
              <span style={styles.callInfoKey}>Occupation</span>
              <span style={styles.callInfoVal}>
                {chambre.occupe}/{chambre.capacite} lit(s)
              </span>
            </div>
            <div style={styles.callInfoRow}>
              <span style={styles.callInfoKey}>Token JWT</span>
              {/* On n'affiche que les 24 premiers caractères pour la sécurité */}
              <span style={styles.callInfoValGreen}>
                {sessionInfo.token.slice(0, 24)}…
              </span>
            </div>

            <div style={styles.divider} />

            {/* Bouton raccrocher */}
            <button style={styles.btnEnd} onClick={handleEndCall}>
              📵 Terminer l'appel
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── Rendu : bouton actif (chambre valide) ─────────────────
  return (
    <div style={styles.wrapper}>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>

        <button
          style={loading ? { ...styles.btnCall, ...styles.btnLoading } : styles.btnCall}
          onClick={handleStartCall}
          disabled={loading}
          title={`Chambre ${chambre.numero} — ${chambre.occupe}/${chambre.capacite} occupé(s)`}
        >
          {loading ? (
            <>⏳ Connexion…</>
          ) : (
            <>📹 Appel vidéo</>
          )}
        </button>

        {/* Badge chambre n° — champ "numero" de votre modèle Chambre */}
        <span style={{ ...styles.badge, ...styles.badgeActive }}>
          ● Ch. {chambre.numero} ({chambre.occupe}/{chambre.capacite})
        </span>

      </div>

      {/* Message d'erreur retourné par le controller (ROOM_REQUIRED / ROOM_INACTIVE) */}
      {error && (
        <div style={styles.errorBox}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default VideoCallButton;