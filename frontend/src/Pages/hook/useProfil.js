// hooks/useProfil.js
import { useState, useEffect, useCallback } from "react";

export function useProfil() {

  // ✅ Lire le rôle D'ABORD, puis récupérer le bon id
  const role = localStorage.getItem("role");

  const userId = (() => {
    if (role === "medecin")        return localStorage.getItem("medecinId");
    if (role === "receptionniste") return localStorage.getItem("receptionnisteId");
    if (role === "pharmacien")     return localStorage.getItem("pharmatieId");
    if (role === "infirmier")      return localStorage.getItem("infirmierId");
    // Fallback universel
    return localStorage.getItem("userId");
  })();

  const [profil, setProfil] = useState({
    id:          userId || "",
    nom:         localStorage.getItem("userNom")     || "",
    prenom:      localStorage.getItem("userPrenom")  || "",
    role:        role || "",
    photoProfil: localStorage.getItem("photoProfil") || null,
  });

  const [loading, setLoading] = useState(true);

  const chargerProfil = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // ✅ GET — route correcte
      const res  = await fetch(`http://localhost:5000/api/GET/profil/${userId}`);
      const data = await res.json();

      if (res.ok) {
        setProfil({
          id:          data.id,
          nom:         data.nom,
          prenom:      data.prenom,
          role:        data.role,
          photoProfil: data.photoProfil || null,
        });

        localStorage.setItem("userNom",     data.nom     || "");
        localStorage.setItem("userPrenom",  data.prenom  || "");
        localStorage.setItem("photoProfil", data.photoProfil || "");
      }
      console.log("url reçu :", data.photoProfil)
    } catch (err) {
      console.error("Erreur chargement profil :", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { chargerProfil(); }, [chargerProfil]);

  const mettreAJourPhoto = useCallback((nouvelleUrl) => {
    setProfil(prev => ({ ...prev, photoProfil: nouvelleUrl }));
    localStorage.setItem("photoProfil", nouvelleUrl || "");
  }, []);

  return { profil, loading, mettreAJourPhoto, chargerProfil };
}