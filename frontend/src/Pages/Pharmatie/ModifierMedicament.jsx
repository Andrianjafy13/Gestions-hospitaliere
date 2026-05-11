// pages/modifier/ModifierMedicament.jsx
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function ModifierMedicament() {
  const { id }   = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [succes, setSucces] = useState("");
  const [erreur, setErreur] = useState("");

  const [form, setForm] = useState({
    nomMedicament:  location.state?.data?.nomMedicament  || "",
    categorie:      location.state?.data?.categorie      || "",
    forme:          location.state?.data?.forme          || "",
    dosage:         location.state?.data?.dosage         || "",
    stock:          location.state?.data?.stock          || "",
    prix:           location.state?.data?.prix           || "",
    dateExpiration: location.state?.data?.dateExpiration || "",
  });

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");
    try {
      const res = await fetch(
        `http://localhost:5000/api/PUT/medicament/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) { setErreur(data.message); return; }
      setSucces("Médicament modifié !");
      setTimeout(() => navigate(-1), 1500);
    } catch { setErreur("Erreur réseau."); }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 p-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-green-800 px-5 py-3">
          <p className="text-green-100 font-medium">Modifier le médicament</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom médicament *</label>
              <input type="text" name="nomMedicament" value={form.nomMedicament}
                onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Catégorie</label>
              <input type="text" name="categorie" value={form.categorie}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Forme</label>
              <select name="forme" value={form.forme} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Sélectionner</option>
                {["Comprimé","Gélule","Sirop","Injection","Pommade","Spray"].map(f =>
                  <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dosage</label>
              <input type="text" name="dosage" value={form.dosage}
                onChange={handleChange} placeholder="Ex: 500mg"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Stock *</label>
              <input type="number" name="stock" value={form.stock}
                onChange={handleChange} required min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prix (Ar)</label>
              <input type="number" name="prix" value={form.prix}
                onChange={handleChange} min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date d'expiration</label>
            <input type="date" name="dateExpiration" value={form.dateExpiration}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          {succes && <p className="text-sm text-teal-700 bg-teal-50 p-3 rounded-lg">{succes}</p>}
          {erreur && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{erreur}</p>}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit"
              className="px-5 py-2 text-sm bg-green-700 text-white rounded-lg hover:bg-green-800 font-medium">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}