// hooks/useNotifPharmacie.js
import { useState, useEffect, useCallback } from "react";

export function useNotifPharmacie() {
  const [nonVus, setNonVus] = useState(0);

  const charger = useCallback(() => {
    fetch("http://localhost:5000/api/GET/notifications/pharmacie/non-vus")
      .then(r => r.json())
      .then(data => setNonVus(data.nonVus || 0))
      .catch(console.error);
  }, []);

  // ✅ Polling toutes les 30 secondes
  useEffect(() => {
    charger();
    const interval = setInterval(charger, 30000);
    return () => clearInterval(interval);
  }, [charger]);

  const marquerVus = useCallback(async () => {
    await fetch(
      "http://localhost:5000/api/PUT/notifications/pharmacie/marquer-vus",
      { method: "PUT" }
    );
    setNonVus(0);
  }, []);

  return { nonVus, marquerVus, charger };
}