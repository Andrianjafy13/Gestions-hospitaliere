// hooks/useProfil.js
import { useState, useEffect, useCallback } from "react";

export function useProfil() {
  const userId = localStorage.getItem("receptionnisteId")
              || localStorage.getItem("medecinId")
              || localStorage.getItem("userId");

  const [profil,    setProfil]    = useState({
    id:          userId,
    nom:         localStorage.getItem("userNom")    || "",
    prenom:      localStorage.getItem("userPrenom") || "",
    role:        localStorage.getItem("role")       || "",
    photoProfil: localStorage.getItem("photoProfil") || null,
  });
  const [loading, setLoading] = useState(true);

  // ✅ Charger le profil depuis le backend au montage
  const chargerProfil = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    try {
      const res  = await fetch(`http://localhost:5000/api/PUT/profil/${userId}`);
      const data = await res.json();

      if (res.ok) {
        setProfil(data);
        // ✅ Synchroniser localStorage
        localStorage.setItem("userNom",     data.nom);
        localStorage.setItem("userPrenom",  data.prenom);
        localStorage.setItem("photoProfil", data.photoProfil || "");
      }
      
    } catch (err) {
      console.error("Erreur chargement profil :", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { chargerProfil(); }, [chargerProfil]);

  // ✅ Mise à jour locale immédiate après upload
  const mettreAJourPhoto = useCallback((nouvelleUrl) => {
    setProfil(prev => ({ ...prev, photoProfil: nouvelleUrl }));
    localStorage.setItem("photoProfil", nouvelleUrl);
  }, []);

  return { profil, loading, mettreAJourPhoto, chargerProfil };
}