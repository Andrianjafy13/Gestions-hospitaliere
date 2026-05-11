// pages/modifier/ModifierRendezVous.jsx
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function ModifierRendezVous() {
  const { id }   = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [succes, setSucces] = useState("");
  const [erreur, setErreur] = useState("");

  const [form, setForm] = useState({
    dateRendezVous:   location.state?.data?.dateRendezVous   || "",
    heureRendezVous:  location.state?.data?.heureRendezVous  || "",
    typeConsultation: location.state?.data?.typeConsultation || "",
    priorite:         location.state?.data?.priorite         || "normale",
    motifRendezVous:  location.state?.data?.motifRendezVous  || "",
  });

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");
    try {
      const res = await fetch(
        `http://localhost:5000/api/PUT/rendezVous/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) { setErreur(data.message); return; }
      setSucces("Rendez-vous modifié !");
      setTimeout(() => navigate(-1), 1500);
    } catch { setErreur("Erreur réseau."); }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 p-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-blue-800 px-5 py-3">
          <p className="text-blue-100 font-medium">Modifier le rendez-vous</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date *</label>
              <input type="date" name="dateRendezVous" value={form.dateRendezVous}
                onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Heure *</label>
              <input type="time" name="heureRendezVous" value={form.heureRendezVous}
                onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type de consultation</label>
              <select name="typeConsultation" value={form.typeConsultation} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {["Consultation générale","Suivi médical","Urgence","Contrôle","Première visite"]
                  .map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priorité</label>
              <select name="priorite" value={form.priorite} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="normale">Normale</option>
                <option value="urgente">Urgente</option>
                <option value="faible">Faible</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Motif</label>
            <textarea name="motifRendezVous" value={form.motifRendezVous}
              onChange={handleChange} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          {succes && <p className="text-sm text-teal-700 bg-teal-50 p-3 rounded-lg">{succes}</p>}
          {erreur && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{erreur}</p>}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit"
              className="px-5 py-2 text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}