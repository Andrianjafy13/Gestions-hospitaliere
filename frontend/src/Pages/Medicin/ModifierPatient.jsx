// pages/modifier/ModifierPatient.jsx
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function ModifierPatient() {
  const { id }     = useParams();
  const location   = useLocation();
  const navigate   = useNavigate();
  const [succes, setSucces] = useState("");
  const [erreur, setErreur] = useState("");

  const [form, setForm] = useState({
    nom:           location.state?.data?.nom           || "",
    prenom:        location.state?.data?.prenom        || "",
    dateNaissance: location.state?.data?.dateNaissance || "",
    sexe:          location.state?.data?.sexe          || "",
    adresse:       location.state?.data?.adresse       || "",
    telephone:     location.state?.data?.telephone     || "",
    typePatient:   location.state?.data?.typePatient   || "",
    allergies:     location.state?.data?.allergies     || "",
    groupeSanguin: location.state?.data?.groupeSanguin || "",
    observation:   location.state?.data?.observation   || "",
  });

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");
    try {
      const res = await fetch(
        `http://localhost:5000/api/PUT/patient/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) { setErreur(data.message); return; }
      setSucces("Patient modifié avec succès !");
      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      setErreur("Erreur réseau.", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 p-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-teal-700 px-5 py-3">
          <p className="text-teal-100 font-medium">Modifier le patient</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Nom *",    name: "nom",    type: "text" },
              { label: "Prénom *", name: "prenom", type: "text" },
            ].map(({ label, name, type }) => (
              <div key={name}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input type={type} name={name} value={form[name]}
                  onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date de naissance</label>
              <input type="date" name="dateNaissance" value={form.dateNaissance}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sexe</label>
              <select name="sexe" value={form.sexe} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Sélectionner</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
              <input type="text" name="telephone" value={form.telephone}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Groupe sanguin</label>
              <select name="groupeSanguin" value={form.groupeSanguin} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Sélectionner</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g =>
                  <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Adresse</label>
            <input type="text" name="adresse" value={form.adresse}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Allergies</label>
            <input type="text" name="allergies" value={form.allergies}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Observation</label>
            <textarea name="observation" value={form.observation} onChange={handleChange}
              rows={2}
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
              className="px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}