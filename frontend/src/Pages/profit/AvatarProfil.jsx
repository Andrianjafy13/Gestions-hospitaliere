// components/AvatarProfil.jsx
import { useState, useRef, useCallback } from "react";
import { Camera, X, Upload, Check } from "lucide-react";

export function AvatarProfil({ userId, photoInitiale, prenom, onPhotoMiseAJour }) {
  const [modalOuverte,  setModalOuverte]  = useState(false);
  const [apercu,        setApercu]        = useState(null);   // base64 preview
  const [fichier,       setFichier]       = useState(null);   // File object
  const [chargement,    setChargement]    = useState(false);
  const [toast,         setToast]         = useState(null);   // { type, message }
  const [photoCourante, setPhotoCourante] = useState(photoInitiale);

  const inputRef = useRef(null);

  // ── Afficher un toast ────────────────────────────────────
  const afficherToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Sélection du fichier ─────────────────────────────────
  const handleFichier = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Vérification format
    if (!["image/jpeg", "image/jpg", "image/png"].includes(f.type)) {
      afficherToast("erreur", "Format non supporté. JPG ou PNG uniquement.");
      return;
    }

    // Vérification taille
    if (f.size > 5 * 1024 * 1024) {
      afficherToast("erreur", "Image trop lourde. Maximum 5 MB.");
      return;
    }

    setFichier(f);

    // ✅ Aperçu base64
    const reader = new FileReader();
    reader.onload = (ev) => setApercu(ev.target.result);
    reader.readAsDataURL(f);
  };

  // ── Sauvegarde ───────────────────────────────────────────
  const handleSauvegarder = async () => {
    if (!fichier) return;

    setChargement(true);
    try {
      const formData = new FormData();
      formData.append("photo", fichier); // ← doit correspondre à upload.single("photo")

      const res = await fetch(
        `http://localhost:5000/api/PUT/profil/${userId}/photo`,
        { method: "PUT", body: formData }
        // ⚠️ Ne pas mettre Content-Type — le navigateur le gère automatiquement
      );

      const data = await res.json();

      if (!res.ok) {
        afficherToast("erreur", data.message || "Erreur lors de l'upload.");
        return;
      }

      // ✅ Mise à jour immédiate de l'avatar dans l'interface
      const nouvelleUrl = `http://localhost:5000${data.photoProfil}`;
      setPhotoCourante(nouvelleUrl);
      localStorage.setItem("photoProfil", nouvelleUrl); // persist

      onPhotoMiseAJour?.(nouvelleUrl); // notifier le parent

      afficherToast("succes", "Photo de profil mise à jour !");
      fermerModal();

    } catch (err) {
      console.error("Upload photo :", err);
      afficherToast("erreur", "Erreur réseau. Réessayez.");
    } finally {
      setChargement(false);
    }
  };

  // ── Fermer la modale ─────────────────────────────────────
  const fermerModal = () => {
    setModalOuverte(false);
    setApercu(null);
    setFichier(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // ── Initiales fallback ───────────────────────────────────
  const initiales = prenom?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3
          px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          transition-all duration-300 ${
          toast.type === "succes"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {toast.type === "succes"
            ? <Check size={16} className="text-green-500" />
            : <X size={16} className="text-red-500" />
          }
          {toast.message}
        </div>
      )}

      {/* ── AVATAR INTERACTIF ── */}
      <div
        className="relative w-9 h-9 rounded-full cursor-pointer group
          flex-shrink-0 overflow-hidden"
        onClick={() => setModalOuverte(true)}
        title="Modifier la photo de profil"
      >
        {/* Photo ou initiales */}
        {photoCourante ? (
          <img
            src={photoCourante}
            alt="Photo de profil"
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full bg-teal-500 text-white
            flex items-center justify-center rounded-full">
            <span className="text-sm font-semibold">{initiales}</span>
          </div>
        )}

        {/* ✅ Overlay au survol */}
        <div className="absolute inset-0 bg-black bg-opacity-0
          group-hover:bg-opacity-50 rounded-full transition-all duration-200
          flex flex-col items-center justify-center gap-0.5">
          <Camera size={12}
            className="text-white opacity-0 group-hover:opacity-100
              transition-opacity duration-200" />
        </div>
      </div>

      {/* ── MODALE ── */}
      {modalOuverte && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50
          flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm
            overflow-hidden">

            {/* En-tête modale */}
            <div className="flex items-center justify-between px-6 py-4
              border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                Modifier la photo de profil
              </h3>
              <button
                onClick={fermerModal}
                className="text-gray-400 hover:text-gray-600
                  transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-5">

              {/* ✅ Aperçu circulaire */}
              <div className="relative mt-100 w-28 h-28 rounded-full overflow-hidden
                border-4 border-teal-100 shadow-md">
                {apercu ? (
                  <img src={apercu} alt="Aperçu"
                    className="w-full h-full object-cover" />
                ) : photoCourante ? (
                  <img src={photoCourante} alt="Photo actuelle"
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-teal-500 text-white
                    flex items-center justify-center">
                    <span className="text-3xl font-bold">{initiales}</span>
                  </div>
                )}

                {/* Overlay appareil photo sur l'aperçu */}
                <div
                  onClick={() => inputRef.current?.click()}
                  className="absolute inset-0 bg-black bg-opacity-0
                    hover:bg-opacity-40 transition-all duration-200
                    flex items-center justify-center cursor-pointer group/inner"
                >
                  <Camera size={24}
                    className="text-white opacity-0 group-hover/inner:opacity-100
                      transition-opacity" />
                </div>
              </div>

              {apercu && (
                <p className="text-xs text-teal-600 font-medium">
                  ✓ Aperçu de la nouvelle photo
                </p>
              )}

              {/* ✅ Input fichier caché */}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFichier}
                className="hidden"
              />

              {/* Bouton sélectionner */}
              <button
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border-2
                  border-dashed border-teal-300 rounded-xl text-teal-600
                  text-sm font-medium hover:bg-teal-50 transition-colors
                  w-full justify-center"
              >
                <Upload size={16} />
                {fichier ? `${fichier.name}` : "Choisir une image (JPG, PNG)"}
              </button>

              {/* Info taille */}
              <p className="text-xs text-gray-400 -mt-3">
                Taille maximale : 5 MB
              </p>

              {/* Boutons action */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={fermerModal}
                  disabled={chargement}
                  className="flex-1 px-4 py-2 border border-gray-200
                    rounded-xl text-sm text-gray-600 hover:bg-gray-50
                    transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  onClick={handleSauvegarder}
                  disabled={!fichier || chargement}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium
                    text-white transition-colors flex items-center
                    justify-center gap-2 ${
                    !fichier || chargement
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-700"
                  }`}
                >
                  {chargement ? (
                    <>
                      {/* ✅ Spinner */}
                      <svg className="animate-spin w-4 h-4 text-white"
                        fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12"
                          r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      Sauvegarder
                    </>
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