// components/AvatarProfil.jsx
import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, Upload, Check } from "lucide-react";

export function AvatarProfil({ profil, onPhotoMiseAJour }) {

  const [modalOuverte,  setModalOuverte]  = useState(false);
  const [apercu,        setApercu]        = useState(null);
  const [fichier,       setFichier]       = useState(null);
  const [chargement,    setChargement]    = useState(false);
  const [toast,         setToast]         = useState(null);
  const [photoAffichee, setPhotoAffichee] = useState(null);

  const inputRef = useRef(null);

  // ✅ Synchroniser quand profil.photoProfil arrive du backend
  useEffect(() => {
    if (profil?.photoProfil !== undefined) {
      setPhotoAffichee(profil.photoProfil || null);
    }
  }, [profil?.photoProfil]);

  const afficherToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleFichier = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(f.type)) {
      afficherToast("erreur", "JPG ou PNG uniquement.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      afficherToast("erreur", "Maximum 5 MB.");
      return;
    }
    setFichier(f);
    const reader = new FileReader();
    reader.onload = (ev) => setApercu(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleSauvegarder = async () => {
    if (!fichier || !profil?.id) return;
    setChargement(true);
    try {
      const formData = new FormData();
      formData.append("photo", fichier);

      const res  = await fetch(
        `http://localhost:5000/api/PUT/profil/${profil.id}/photo`,
        { method: "PUT", body: formData }
      );
      const data = await res.json();

      if (!res.ok) {
        afficherToast("erreur", data.message || "Erreur upload.");
        return;
      }

      // ✅ Mise à jour immédiate
      setPhotoAffichee(data.photoProfil);
      onPhotoMiseAJour?.(data.photoProfil);
      afficherToast("succes", "Photo mise à jour !");
      fermerModal();

    } catch (err) {
      afficherToast("erreur", "Erreur réseau.");
    } finally {
      setChargement(false);
    }
  };

  const fermerModal = () => {
    setModalOuverte(false);
    setApercu(null);
    setFichier(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const initiales = [profil?.prenom?.[0], profil?.nom?.[0]]
    .filter(Boolean).join("").toUpperCase() || "?";

  // ── Styles inline garantis (pas de purge Tailwind) ───────
  const stylesAvatar = {
    position:   "relative",
    width:      "36px",
    height:     "36px",
    borderRadius: "50%",
    cursor:     "pointer",
    flexShrink: 0,
    isolation:  "isolate",
    // ✅ PAS de overflow hidden ici
  };

  const stylesImg = {
    width:        "36px",
    height:       "36px",
    borderRadius: "50%",
    objectFit:    "cover",
    display:      "block",
    position:     "relative",
    zIndex:       1,
  };

  const stylesInitiales = {
    width:          "36px",
    height:         "36px",
    borderRadius:   "50%",
    background:     "#14b8a6",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    color:          "white",
    fontSize:       "12px",
    fontWeight:     "bold",
    position:       "relative",
    zIndex:         1,
  };

  const stylesOverlay = {
    position:       "absolute",
    inset:          0,
    borderRadius:   "50%",
    background:     "transparent",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    zIndex:         2,
    transition:     "background 0.2s",
  };

  return (
    <>
      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position:   "fixed",
          top:        "20px",
          right:      "20px",
          zIndex:     9999,
          display:    "flex",
          alignItems: "center",
          gap:        "10px",
          padding:    "100px 50px",
          borderRadius: "12px",
          boxShadow:  "0 4px 12px rgba(0,0,0,0.15)",
          fontSize:   "14px",
          fontWeight: "500",
          border:     `1px solid ${toast.type === "succes" ? "#bbf7d0" : "#fecaca"}`,
          background: toast.type === "succes" ? "#f0fdf4" : "#fef2f2",
          color:      toast.type === "succes" ? "#15803d" : "#dc2626",
        }}>
          {toast.type === "succes"
            ? <Check size={16} color="#16a34a" />
            : <X     size={16} color="#dc2626" />
          }
          {toast.message}
        </div>
      )}

      {/* ── AVATAR ── */}
      <div
        style={stylesAvatar}
        onClick={() => setModalOuverte(true)}
        title="Modifier la photo de profil"
        onMouseEnter={e => {
          const overlay = e.currentTarget.querySelector(".overlay-avatar");
          if (overlay) overlay.style.background = "rgba(0,0,0,0.45)";
        }}
        onMouseLeave={e => {
          const overlay = e.currentTarget.querySelector(".overlay-avatar");
          if (overlay) overlay.style.background = "transparent";
        }}
      >
        {/* Photo ou initiales */}
        {photoAffichee ? (
          <img
            src={photoAffichee}
            alt="Photo de profil"
            key={photoAffichee}
            style={stylesImg}
            onError={() => {
              console.error("❌ Image non chargée :", photoAffichee);
              setPhotoAffichee(null);
            }}
            onLoad={() => console.log("✅ Photo avatar chargée")}
          />
        ) : (
          <div style={stylesInitiales}>
            {initiales}
          </div>
        )}

        {/* Overlay hover */}
        <div
          className="overlay-avatar"
          style={stylesOverlay}
        >
          <Camera size={12} color="white" />
        </div>
      </div>

      {/* ── MODALE ── */}
      {modalOuverte && (
        <div style={{
          position:       "fixed",
          inset:          0,
          background:     "rgba(0,0,0,0.5)",
          zIndex:         9998,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "16px",
        }}>
          <div style={{
            background:   "white",
            borderRadius: "16px",
            boxShadow:    "0 20px 60px rgba(0,0,0,0.3)",
            width:        "100%",
            maxWidth:     "380px",
          }}>

            {/* En-tête */}
            <div style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              padding:        "100px 50px",
              borderBottom:   "1px solid #f1f5f9",
            }}>
              <div>
                <p style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px" }}>
                  Photo de profil
                </p>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                  {profil?.prenom} {profil?.nom}
                  {profil?.role && (
                    <span style={{ color: "#14b8a6", marginLeft: "4px",
                      textTransform: "capitalize" }}>
                      — {profil.role}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={fermerModal}
                style={{
                  background:   "none",
                  border:       "none",
                  cursor:       "pointer",
                  color:        "#94a3b8",
                  padding:      "4px",
                  borderRadius: "8px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps */}
            <div style={{
              padding:        "24px",
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              gap:            "20px",
            }}>

              {/* Aperçu circulaire */}
              <div style={{
                width:        "128px",
                height:       "128px",
                borderRadius: "50%",
                overflow:     "hidden", // ✅ overflow hidden uniquement ici
                border:       "4px solid #ccfbf1",
                boxShadow:    "0 4px 12px rgba(0,0,0,0.12)",
                flexShrink:   0,
                position:     "relative",
              }}>
                {apercu ? (
                  <img src={apercu} alt="Aperçu"
                    style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                ) : photoAffichee ? (
                  <img src={photoAffichee} alt="Photo actuelle"
                    key={photoAffichee}
                    style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                ) : (
                  <div style={{
                    width:"100%", height:"100%",
                    background:"#14b8a6",
                    display:"flex", alignItems:"center",
                    justifyContent:"center",
                    color:"white", fontSize:"32px", fontWeight:"bold",
                  }}>
                    {initiales}
                  </div>
                )}

                {/* Overlay clic sur aperçu */}
                <div
                  onClick={() => inputRef.current?.click()}
                  style={{
                    position:       "absolute",
                    inset:          0,
                    background:     "transparent",
                    cursor:         "pointer",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    transition:     "background 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.35)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Camera size={24} color="white" />
                </div>
              </div>

              {apercu && (
                <p style={{ fontSize:"12px", color:"#14b8a6",
                  fontWeight:"500", marginTop:"-8px" }}>
                  ✓ Aperçu prêt
                </p>
              )}

              {/* Input fichier caché */}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFichier}
                style={{ display: "none" }}
              />

              {/* Bouton sélectionner */}
              <button
                onClick={() => inputRef.current?.click()}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  gap:            "8px",
                  width:          "100%",
                  padding:        "10px 16px",
                  border:         "2px dashed #5eead4",
                  borderRadius:   "12px",
                  background:     "white",
                  color:          "#0d9488",
                  fontSize:       "14px",
                  cursor:         "pointer",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f0fdfa"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}
              >
                <Upload size={15} />
                {fichier ? fichier.name : "Choisir JPG ou PNG (max 5 MB)"}
              </button>

              {/* Boutons action */}
              <div style={{ display:"flex", gap:"12px", width:"100%" }}>
                <button
                  onClick={fermerModal}
                  disabled={chargement}
                  style={{
                    flex:         1,
                    padding:      "8px",
                    border:       "1px solid #e2e8f0",
                    borderRadius: "12px",
                    background:   "white",
                    color:        "#475569",
                    fontSize:     "14px",
                    cursor:       "pointer",
                    opacity:      chargement ? 0.5 : 1,
                  }}
                >
                  Annuler
                </button>

                <button
                  onClick={handleSauvegarder}
                  disabled={!fichier || chargement}
                  style={{
                    flex:         1,
                    padding:      "8px",
                    border:       "none",
                    borderRadius: "12px",
                    background:   !fichier || chargement ? "#cbd5e1" : "#0d9488",
                    color:        "white",
                    fontSize:     "14px",
                    fontWeight:   "500",
                    cursor:       !fichier || chargement ? "not-allowed" : "pointer",
                    display:      "flex",
                    alignItems:   "center",
                    justifyContent: "center",
                    gap:          "6px",
                  }}
                >
                  {chargement ? (
                    <>
                      <svg style={{ animation:"spin 1s linear infinite",
                        width:"16px", height:"16px" }}
                        fill="none" viewBox="0 0 24 24">
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <circle style={{ opacity:0.25 }} cx="12" cy="12"
                          r="10" stroke="white" strokeWidth="4"/>
                        <path style={{ opacity:0.75 }} fill="white"
                          d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Envoi...
                    </>
                  ) : (
                    <><Check size={15} /> Sauvegarder</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}