// pages/modifier/ModifierGarde.jsx
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const today = new Date().toISOString().slice(0, 10);

export default function ModifierGarde() {
  const { id }   = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [succes, setSucces] = useState("");
  const [erreur, setErreur] = useState("");

  const [form, setForm] = useState({
    typeGarde:  location.state?.data?.typeGarde  || "",
    dateDebut:  location.state?.data?.dateDebut  || today,
    dateFin:    location.state?.data?.dateFin    || today,
    heureDebut: location.state?.data?.heureDebut || "",
    heureFin:   location.state?.data?.heureFin   || "",
    service:    location.state?.data?.service    || "",
  });

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");
    try {
      const res = await fetch(
        `http://localhost:5000/api/PUT/garde/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) { setErreur(data.message); return; }
      setSucces("Garde modifiée !");
      setTimeout(() => navigate(-1), 1500);
    } catch { setErreur("Erreur réseau."); }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 p-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-teal-800 px-5 py-3">
          <p className="text-teal-100 font-medium">Modifier la garde</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type de garde *</label>
            <select name="typeGarde" value={form.typeGarde} onChange={handleChange} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Sélectionner</option>
              <option value="matin">Garde du matin (06h–14h)</option>
              <option value="soir">Garde du soir (14h–22h)</option>
              <option value="nuit">Garde de nuit (22h–06h)</option>
              <option value="custom">Horaire personnalisé</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date de début *</label>
              <input type="date" name="dateDebut" value={form.dateDebut}
                onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date de fin *</label>
              <input type="date" name="dateFin" value={form.dateFin}
                min={form.dateDebut} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Heure de début *</label>
              <input type="time" name="heureDebut" value={form.heureDebut}
                onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Heure de fin *</label>
              <input type="time" name="heureFin" value={form.heureFin}
                onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Service</label>
            <select name="service" value={form.service} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Sélectionner</option>
              {["Urgences","Chirurgie","Cardiologie","Pédiatrie",
                "Maternité","Médecine générale","Réanimation"].map(s =>
                <option key={s}>{s}</option>)}
            </select>
          </div>
          {succes && <p className="text-sm text-teal-700 bg-teal-50 p-3 rounded-lg">{succes}</p>}
          {erreur && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{erreur}</p>}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit"
              className="px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}