// components/AvatarProfil.jsx
import { useState, useRef, useCallback } from "react";
import { Camera, X, Upload, Check }      from "lucide-react";

export function AvatarProfil({ profil, onPhotoMiseAJour }) {
  const [modalOuverte, setModalOuverte] = useState(false);
  const [apercu,       setApercu]       = useState(null);
  const [fichier,      setFichier]      = useState(null);
  const [chargement,   setChargement]   = useState(false);
  const [toast,        setToast]        = useState(null);
  const inputRef = useRef(null);

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
        `http://localhost:5000/api/profil/${profil.id}/photo`,
        { method: "PUT", body: formData }
      );
      const data = await res.json();

      if (!res.ok) {
        afficherToast("erreur", data.message || "Erreur upload.");
        return;
      }

      // ✅ Mise à jour immédiate dans le parent (Topbar)
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

  const initiales = `${profil?.prenom?.[0] || ""}${profil?.nom?.[0] || ""}`.toUpperCase();

  return (
    <>
      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center
          gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          border transition-all duration-300 ${
          toast.type === "succes"
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {toast.type === "succes"
            ? <Check size={16} className="text-green-500 flex-shrink-0" />
            : <X     size={16} className="text-red-500  flex-shrink-0" />
          }
          {toast.message}
        </div>
      )}

      {/* ── AVATAR — cliquer pour ouvrir la modale ── */}
      <div
        onClick={() => setModalOuverte(true)}
        className="relative w-9 h-9 rounded-full cursor-pointer
          group flex-shrink-0 overflow-hidden"
        title="Modifier la photo de profil"
      >
        {profil?.photoProfil ? (
          <img
            src={profil.photoProfil}
            alt="Photo de profil"
            className="w-full h-full object-cover rounded-full"
            // ✅ Forcer le rechargement si l'URL change
            key={profil.photoProfil}
          />
        ) : (
          <div className="w-full h-full bg-teal-500 text-white
            flex items-center justify-center rounded-full">
            <span className="text-xs font-bold">{initiales || "?"}</span>
          </div>
        )}

        {/* Overlay hover */}
        <div className="absolute inset-0 rounded-full bg-black
          bg-opacity-0 group-hover:bg-opacity-50 transition-all
          duration-200 flex items-center justify-center">
          <Camera size={12}
            className="text-white opacity-0 group-hover:opacity-100
              transition-opacity duration-200" />
        </div>
      </div>

      {/* ── MODALE ── */}
      {modalOuverte && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50
          flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full
            max-w-sm overflow-hidden">

            {/* En-tête */}
            <div className="flex items-center justify-between px-6
              py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">
                Photo de profil
              </h3>
              <button onClick={fermerModal}
                className="text-gray-400 hover:text-gray-600
                  p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-5">

              {/* Aperçu circulaire */}
              <div className="relative w-32 h-32 rounded-full
                overflow-hidden border-4 border-teal-100 shadow-md
                flex-shrink-0">
                {apercu ? (
                  <img src={apercu} alt="Aperçu"
                    className="w-full h-full object-cover" />
                ) : profil?.photoProfil ? (
                  <img src={profil.photoProfil} alt="Photo actuelle"
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-teal-500 text-white
                    flex items-center justify-center">
                    <span className="text-3xl font-bold">{initiales}</span>
                  </div>
                )}

                {/* Cliquer sur l'aperçu pour choisir */}
                <div onClick={() => inputRef.current?.click()}
                  className="absolute inset-0 bg-black bg-opacity-0
                    hover:bg-opacity-40 transition-all duration-200
                    flex items-center justify-center cursor-pointer
                    group/ap">
                  <Camera size={24}
                    className="text-white opacity-0
                      group-hover/ap:opacity-100 transition-opacity" />
                </div>
              </div>

              {apercu && (
                <p className="text-xs text-teal-600 font-medium -mt-2">
                  ✓ Aperçu prêt
                </p>
              )}

              {/* Input caché */}
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
                className="flex items-center gap-2 px-4 py-2.5
                  border-2 border-dashed border-teal-300 rounded-xl
                  text-teal-600 text-sm hover:bg-teal-50
                  transition-colors w-full justify-center"
              >
                <Upload size={15} />
                {fichier ? fichier.name : "Choisir JPG ou PNG (max 5 MB)"}
              </button>

              {/* Actions */}
              <div className="flex gap-3 w-full">
                <button onClick={fermerModal} disabled={chargement}
                  className="flex-1 py-2 border border-gray-200 rounded-xl
                    text-sm text-gray-600 hover:bg-gray-50
                    transition-colors disabled:opacity-50">
                  Annuler
                </button>

                <button
                  onClick={handleSauvegarder}
                  disabled={!fichier || chargement}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium
                    text-white transition-colors flex items-center
                    justify-center gap-2 ${
                    !fichier || chargement
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-700"
                  }`}
                >
                  {chargement ? (
                    <>
                      <svg className="animate-spin w-4 h-4"
                        fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12"
                          r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor"
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