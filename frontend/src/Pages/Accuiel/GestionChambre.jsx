import { useState } from "react";

export default function AjoutChambre() {
  const [form, setForm] = useState({
    numero: "",
    capacite: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const res = await fetch("http://localhost:5000/api/insertion/ajout-Chambre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: Number(form.numero),
          capacite: Number(form.capacite)
        })
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        alert(data.message);
        return;
      }
  
      alert("Chambre ajoutée avec succès");
  
      setForm({
        numero: "",
        capacite: ""
      });
  
    } catch (error) {
      console.error(error);
      alert("Erreur serveur");
    }
  };
  return (
    <div className="max-w-xl mx-auto mt-8">
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-5 rounded-t-xl">
        <h2 className="text-xl font-semibold">Ajouter une chambre</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 shadow rounded-b-xl space-y-4">

        <input
        type="number"
          name="numero"
          placeholder="Numéro chambre (Ex: 101)"
          value={form.numero}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
        />

        <select
          name="capacite"
          value={form.capacite}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
        >
          <option value="">Capacité</option>
          <option value="1">1 personne</option>
          <option value="2">2 personnes</option>
          <option value="3">3 personnes</option>
        </select>

        <button className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700">
          Ajouter
        </button>
      </form>
    </div>
  );
}