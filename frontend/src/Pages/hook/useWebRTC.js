// hooks/useWebRTC.js
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

// Configuration STUN (serveurs publics Google)
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

export const useWebRTC = ({ user, onIncomingCall }) => {
  const socketRef     = useRef(null);
  const pcRef         = useRef(null); // RTCPeerConnection
  const localStreamRef  = useRef(null);
  const remoteStreamRef = useRef(null);

  const [localStream,   setLocalStream]   = useState(null);
  const [remoteStream,  setRemoteStream]  = useState(null);
  const [callState,     setCallState]     = useState("idle");
  // idle | calling | incoming | in-call | ended
  const [incomingCall,  setIncomingCall]  = useState(null);
  const [callError,     setCallError]     = useState(null);
  const [isConnected,   setIsConnected]   = useState(false);

  // ── Connexion Socket.io ──────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token") ||
                  localStorage.getItem("accessToken");

    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Socket connecté :", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket déconnecté");
      setIsConnected(false);
    });

    // ── Appel entrant (patient reçoit) ──
    socket.on("call:incoming", async ({ medecinId, medecinNom, numeroChambre, offer }) => {
      console.log("📞 Appel entrant de :", medecinNom);
      setCallState("incoming");
      setIncomingCall({ medecinId, medecinNom, numeroChambre, offer });
      if (onIncomingCall) onIncomingCall({ medecinId, medecinNom, numeroChambre });
    });

    // ── Le patient a accepté (médecin reçoit) ──
    socket.on("call:accepted", async ({ patientId, answer }) => {
      console.log("✅ Appel accepté par patient :", patientId);
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
      setCallState("in-call");
    });

    // ── Le patient a refusé ──
    socket.on("call:declined", ({ message }) => {
      console.log("❌ Appel refusé :", message);
      setCallError(message);
      setCallState("idle");
      cleanupCall();
    });

    // ── ICE candidate reçu ──
    socket.on("ice:candidate", async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("ICE candidate error:", e);
        }
      }
    });

    // ── Appel terminé par l'autre côté ──
    socket.on("call:ended", ({ from }) => {
      console.log("📵 Appel terminé par :", from);
      setCallState("ended");
      cleanupCall();
      setTimeout(() => setCallState("idle"), 2000);
    });

    // ── Erreur ──
    socket.on("call:error", ({ message }) => {
      setCallError(message);
      setCallState("idle");
      cleanupCall();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // ── Créer la connexion WebRTC ────────────────────────────
  const createPeerConnection = useCallback((targetId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Ajouter les tracks locaux
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Recevoir les tracks distants
    pc.ontrack = (event) => {
      console.log("🎥 Stream distant reçu");
      const [stream] = event.streams;
      remoteStreamRef.current = stream;
      setRemoteStream(stream);
    };

    // Envoyer les ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice:candidate", {
          targetId,
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("WebRTC state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallState("in-call");
      }
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setCallState("ended");
        cleanupCall();
      }
    };

    return pc;
  }, []);

  // ── Obtenir le flux caméra/micro ─────────────────────────
  const getLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  // ── MÉDECIN : initier un appel ───────────────────────────
  const initiateCall = useCallback(async ({ patientId, numeroChambre }) => {
    try {
      setCallState("calling");
      setCallError(null);

      await getLocalStream();
      const pc = createPeerConnection(patientId);

      // Créer l'offre SDP
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Envoyer l'appel via Socket.io
      socketRef.current.emit("call:initiate", {
        patientId,
        numeroChambre,
        offer
      });

      console.log("📹 Appel envoyé au patient :", patientId);
    } catch (error) {
      console.error("Erreur initiateCall :", error);
      setCallError("Impossible d'accéder à la caméra/micro.");
      setCallState("idle");
    }
  }, [createPeerConnection]);

  // ── PATIENT : accepter un appel ──────────────────────────
  const acceptCall = useCallback(async () => {
    try {
      if (!incomingCall) return;
      const { medecinId, offer } = incomingCall;

      setCallState("in-call");

      await getLocalStream();
      const pc = createPeerConnection(medecinId);

      // Définir l'offre du médecin
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Créer la réponse SDP
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Envoyer la réponse via Socket.io
      socketRef.current.emit("call:accept", {
        medecinId,
        answer
      });

      setIncomingCall(null);
      console.log("✅ Appel accepté");
    } catch (error) {
      console.error("Erreur acceptCall :", error);
      setCallError("Impossible d'accéder à la caméra/micro.");
      setCallState("idle");
    }
  }, [incomingCall, createPeerConnection]);

  // ── PATIENT : refuser un appel ───────────────────────────
  const declineCall = useCallback(() => {
    if (!incomingCall) return;
    socketRef.current.emit("call:decline", {
      medecinId: incomingCall.medecinId
    });
    setIncomingCall(null);
    setCallState("idle");
  }, [incomingCall]);

  // ── Terminer l'appel ─────────────────────────────────────
  const endCall = useCallback((targetId) => {
    if (socketRef.current && targetId) {
      socketRef.current.emit("call:end", { targetId });
    }
    cleanupCall();
    setCallState("idle");
  }, []);

  // ── Nettoyage ────────────────────────────────────────────
  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingCall(null);
  };

  return {
    // État
    callState,
    incomingCall,
    localStream,
    remoteStream,
    callError,
    isConnected,
    // Actions
    initiateCall,
    acceptCall,
    declineCall,
    endCall
  };
};