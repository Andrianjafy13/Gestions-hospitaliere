// hooks/useSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

export function useSocket() {
  const socketRef = useRef(null);
  const [connecte, setConnecte] = useState(false);
  const [nonLus,   setNonLus]   = useState(0);

  // ✅ Clé unique "userId" — plus de fallback sur medecinId etc.
  // Le fallback causait le bug : mauvais userId → mauvaise room
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io("http://localhost:5000");
    const socket = socketRef.current;

    socket.on("connect", () => {
      setConnecte(true);
      // ✅ S'enregistrer dans SA room privée dès la connexion
      socket.emit("rejoindre", parseInt(userId));
    });

    socket.on("disconnect", () => setConnecte(false));

    // ✅ Badge — seulement si le message est bien pour moi
    socket.on("nouveauMessage", (msg) => {
      if (msg.destinataireId === parseInt(userId)) {
        setNonLus(prev => prev + 1);
      }
    });

    // ✅ Charger non lus initiaux depuis la BDD
    fetch(`http://localhost:5000/api/message/non-lus/${userId}`)
      .then(r => r.json())
      .then(d => setNonLus(d.nonLus || 0))
      .catch(console.error);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
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
    socket:        socketRef.current,
    connecte,
    nonLus,
    userId,
    envoyerMessage,
    resetNonLus,
  };
}