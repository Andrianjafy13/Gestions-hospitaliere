// pages/modifier/ModifierConsultation.jsx
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function ModifierConsultation() {
  const { id }   = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [succes, setSucces] = useState("");
  const [erreur, setErreur] = useState("");

  const [form, setForm] = useState({
    motif:             location.state?.data?.motif             || "",
    diagnostic:        location.state?.data?.diagnostic        || "",
    traitement:        location.state?.data?.traitement        || "",
    dateConsultation:  location.state?.data?.dateConsultation  || "",
    heureConsultation: location.state?.data?.heureConsultation || "",
  });

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");
    try {
      const res = await fetch(
        `http://localhost:5000/api/PUT/consultation/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) { setErreur(data.message); return; }
      setSucces("Consultation modifiée !");
      setTimeout(() => navigate(-1), 1500);
    } catch { setErreur("Erreur réseau."); }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 p-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-teal-700 px-5 py-3">
          <p className="text-teal-100 font-medium">Modifier la consultation</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Motif *</label>
              <input type="text" name="motif" value={form.motif}
                onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Diagnostic *</label>
              <input type="text" name="diagnostic" value={form.diagnostic}
                onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Traitement</label>
            <textarea name="traitement" value={form.traitement}
              onChange={handleChange} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date *</label>
              <input type="date" name="dateConsultation" value={form.dateConsultation}
                onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Heure</label>
              <input type="time" name="heureConsultation" value={form.heureConsultation}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
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