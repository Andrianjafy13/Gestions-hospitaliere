import { useState } from "react";

export default function AjoutMedicament() {

  const initialState = {
    nomMedicament: "",
    categorie: "",
    forme: "",
    dosage: "",
    stock: "",
    prix: "",
    dateExpiration: "",
  };

  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/insertion/ajout-medicament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      setMessage("✅ Médicament ajouté avec succès");
      setForm(initialState);

    } catch (error) {
      console.error(error);
      alert("Erreur serveur");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-4">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-5 rounded-t-xl">
        <h2 className="text-xl font-semibold">Ajouter un médicament</h2>
        <p className="text-sm text-green-100">Medicament</p>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-b-xl shadow-md flex flex-col gap-4"
      >

        {/* NOM */}
        <div>
          <label className="text-sm text-gray-600">Nom du médicament *</label>
          <input
            type="text"
            name="nomMedicament"
            value={form.nomMedicament}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 mt-1 focus:ring-2 focus:ring-green-500"
            placeholder="Ex: Paracétamol"
          />
        </div>

        {/* CATEGORIE + FORME */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Catégorie</label>
            <select
              name="categorie"
              value={form.categorie}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 mt-1"
            >
              <option value="">Sélectionner</option>
              <option>Antibiotique</option>
              <option>Antalgique</option>
              <option>Anti-inflammatoire</option>
              <option>Vitamines</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Forme</label>
            <select
              name="forme"
              value={form.forme}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 mt-1"
            >
              <option value="">Sélectionner</option>
              <option>Comprimé</option>
              <option>Sirop</option>
              <option>Injection</option>
              <option>Capsule</option>
            </select>
          </div>
        </div>

        {/* DOSAGE + STOCK */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Dosage</label>
            <input
              type="text"
              name="dosage"
              value={form.dosage}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 mt-1"
              placeholder="Ex: 500mg"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Stock</label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 mt-1"
              placeholder="Quantité en plaquete"
            />
          </div>
        </div>

        {/* PRIX + EXPIRATION */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Prix (Ar)</label>
            <input
              type="number"
              name="prix"
              value={form.prix}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 mt-1"
              placeholder="Ex: 2000"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Date expiration</label>
            <input
              type="date"
              name="dateExpiration"
              value={form.dateExpiration}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 mt-1"
            />
          </div>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-green-700 text-sm">
            {message}
          </div>
        )}

        {/* BOUTONS */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={() => setForm({})}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Annuler
          </button>

          <button
            type="submit"
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Ajouter
          </button>
        </div>

      </form>
    </div>
  );
}