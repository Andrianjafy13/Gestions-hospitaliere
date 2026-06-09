// components/VideoCall.jsx
import React, { useRef, useEffect } from "react";

const VideoCall = ({
  localStream,
  remoteStream,
  callState,
  incomingCall,
  callError,
  isConnected,
  onAccept,
  onDecline,
  onEnd,
  targetId,
  role           // "medecin" | "patient"
}) => {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ── Appel entrant (vue patient) ──────────────────────────
  if (callState === "incoming" && incomingCall) {
    return (
      <div style={styles.overlay}>
        <div style={styles.incomingCard}>
          <div style={styles.pulseRing} />
          <div style={styles.callerAvatar}>DR</div>
          <h2 style={styles.callerName}>{incomingCall.medecinNom}</h2>
          <p style={styles.callerSub}>
            Chambre n° {incomingCall.numeroChambre}
          </p>
          <p style={styles.callerSub2}>Appel vidéo entrant…</p>

          <div style={styles.callActions}>
            <button style={styles.btnDecline} onClick={onDecline}>
              📵 Refuser
            </button>
            <button style={styles.btnAccept} onClick={onAccept}>
              📹 Accepter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── En train d'appeler (vue médecin) ────────────────────
  if (callState === "calling") {
    return (
      <div style={styles.overlay}>
        <div style={styles.callingCard}>
          <div style={styles.spinner} />
          <p style={styles.callingText}>Appel en cours…</p>
          <p style={styles.callingText2}>En attente du patient</p>
          <button style={styles.btnEndSm} onClick={() => onEnd(targetId)}>
            📵 Annuler
          </button>
        </div>
      </div>
    );
  }

  // ── Appel terminé ────────────────────────────────────────
  if (callState === "ended") {
    return (
      <div style={styles.overlay}>
        <div style={styles.endedCard}>
          <span style={{ fontSize: 48 }}>📵</span>
          <p style={{ color: "#fff", marginTop: 12, fontSize: 16 }}>
            Appel terminé
          </p>
        </div>
      </div>
    );
  }

  // ── En appel ─────────────────────────────────────────────
  if (callState === "in-call") {
    return (
      <div style={styles.callScreen}>
        {/* Vidéo distante (grande) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={styles.remoteVideo}
        />

        {/* Vidéo locale (miniature) */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={styles.localVideo}
        />

        {/* Badge rôle */}
        <div style={styles.roleBadge}>
          {role === "medecin" ? "👨‍⚕️ Médecin" : "🛏 Patient"}
        </div>

        {/* Contrôles */}
        <div style={styles.callControls}>
          <button
            style={styles.btnEnd}
            onClick={() => onEnd(targetId)}
          >
            📵 Terminer
          </button>
        </div>

        {/* Erreur */}
        {callError && (
          <div style={styles.errorBanner}>{callError}</div>
        )}
      </div>
    );
  }

  return null;
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,.75)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000,
  },
  incomingCard: {
    background: "#1e293b",
    borderRadius: 20,
    padding: "40px 48px",
    textAlign: "center",
    position: "relative",
    boxShadow: "0 8px 40px rgba(0,0,0,.5)",
  },
  pulseRing: {
    position: "absolute", inset: -12,
    borderRadius: "50%",
    border: "3px solid #0d9488",
    animation: "pulse 1.5s ease-out infinite",
    pointerEvents: "none",
  },
  callerAvatar: {
    width: 80, height: 80, borderRadius: "50%",
    background: "linear-gradient(135deg,#0f766e,#0d9488)",
    color: "#fff", fontSize: 24, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px",
  },
  callerName: {
    color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 6px",
  },
  callerSub: {
    color: "#94a3b8", fontSize: 14, margin: "0 0 4px",
  },
  callerSub2: {
    color: "#0d9488", fontSize: 13, margin: "0 0 28px",
  },
  callActions: {
    display: "flex", gap: 16, justifyContent: "center",
  },
  btnAccept: {
    padding: "12px 28px", borderRadius: 50, border: "none",
    background: "#0d9488", color: "#fff",
    fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
  btnDecline: {
    padding: "12px 28px", borderRadius: 50, border: "none",
    background: "#ef4444", color: "#fff",
    fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
  callingCard: {
    background: "#1e293b", borderRadius: 20,
    padding: "40px 48px", textAlign: "center",
  },
  callingText: {
    color: "#fff", fontSize: 18, fontWeight: 600, margin: "16px 0 4px",
  },
  callingText2: {
    color: "#94a3b8", fontSize: 14, margin: "0 0 24px",
  },
  btnEndSm: {
    padding: "10px 24px", borderRadius: 50, border: "none",
    background: "#ef4444", color: "#fff",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  endedCard: {
    textAlign: "center", padding: 40,
  },
  callScreen: {
    position: "fixed", inset: 0,
    background: "#0f172a", zIndex: 1000,
  },
  remoteVideo: {
    width: "100%", height: "100%",
    objectFit: "cover",
  },
  localVideo: {
    position: "absolute", bottom: 100, right: 20,
    width: 160, height: 120,
    borderRadius: 12, border: "2px solid #0d9488",
    objectFit: "cover",
  },
  roleBadge: {
    position: "absolute", top: 16, left: 16,
    background: "rgba(0,0,0,.6)",
    color: "#fff", padding: "6px 14px",
    borderRadius: 20, fontSize: 13, fontWeight: 600,
  },
  callControls: {
    position: "absolute", bottom: 30,
    left: "50%", transform: "translateX(-50%)",
    display: "flex", gap: 16,
  },
  btnEnd: {
    padding: "14px 32px", borderRadius: 50, border: "none",
    background: "#ef4444", color: "#fff",
    fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
  errorBanner: {
    position: "absolute", top: 60, left: "50%",
    transform: "translateX(-50%)",
    background: "#fef2f2", color: "#b91c1c",
    padding: "8px 20px", borderRadius: 8, fontSize: 13,
  },
  spinner: {
    width: 40, height: 40, margin: "0 auto",
    border: "3px solid #334155",
    borderTop: "3px solid #0d9488",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

export default VideoCall;