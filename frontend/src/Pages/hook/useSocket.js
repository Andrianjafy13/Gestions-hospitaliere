// hooks/useSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

export function useSocket() {
  const socketRef = useRef(null);
  const [connecte, setConnecte] = useState(false);
  const [nonLus,   setNonLus]   = useState(0);

  // ✅ Récupérer userId universel — fonctionne pour tous les rôles
  const userId =
    localStorage.getItem("userId")       ||
    localStorage.getItem("medecinId")    ||
    localStorage.getItem("infirmierId")  ||
    localStorage.getItem("pharmId")      ||
    localStorage.getItem("receptId");

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      setConnecte(true);
      // ✅ Rejoindre la room privée
      socketRef.current.emit("rejoindre", parseInt(userId));
    });

    socketRef.current.on("disconnect", () => setConnecte(false));

    // ✅ Incrémenter badge uniquement pour CE destinataire
    socketRef.current.on("nouveauMessage", (msg) => {
      // Vérifier que le message est bien pour nous
      if (msg.destinataireId === parseInt(userId)) {
        setNonLus(prev => prev + 1);
      }
    });

    // ✅ Charger non lus initiaux
    fetch(`http://localhost:5000/api/message/non-lus/${userId}`)
      .then(r => r.json())
      .then(d => setNonLus(d.nonLus || 0))
      .catch(console.error);

    return () => { socketRef.current?.disconnect(); };
  }, [userId]);

  const envoyerMessage = useCallback((destinataireId, contenu) => {
    if (!socketRef.current || !userId) return;
    socketRef.current.emit("envoyerMessage", {
      expediteurId:   parseInt(userId),
      destinataireId: parseInt(destinataireId),
      contenu,
    });
  }, [userId]);

  const resetNonLus = useCallback(() => setNonLus(0), []);

  return {
    socket:         socketRef.current,
    connecte,
    nonLus,
    userId,         // ✅ exposer userId pour FenetreChat
    envoyerMessage,
    resetNonLus,
  };
}