import { useState, useEffect } from "react";

const TYPE_HEURES = {
  matin:  { debut: "06:00", fin: "14:00" },
  soir:   { debut: "14:00", fin: "22:00" },
  nuit:   { debut: "22:00", fin: "06:00" },
  custom: { debut: "",      fin: ""      },
};

const TYPE_LABEL = {
  matin: "Garde du matin", soir: "Garde du soir",
  nuit:  "Garde de nuit",  custom: "Personnalisé",
};

const today = new Date().toISOString().slice(0, 10);

export default function PlanningGarde() {
  const [infirmiers, setInfirmiers] = useState([]);
  const [erreur,     setErreur]     = useState("");
  const [succes,     setSucces]     = useState("");

  // ✅ form utilise infirmierId — cohérent avec le select et le backend
  const [form, setForm] = useState({
    infirmierId: "", // ✅ corrigé — était "nomInfirmier" dans certaines versions
    typeGarde:   "",
    dateDebut:   today,
    dateFin:     today,
    heureDebut:  "",
    heureFin:    "",
    service:     "",
  });

  const chargerGardes = () => {
    fetch("http://localhost:5000/api/GET/gardes")
      .then(r => r.json())
      .then(data => {
        console.log("Gardes reçues:", data); // 👈 debug
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/GET/allInfirmier")
      .then(r => r.json())
      .then(data => {
        console.log("Infirmiers reçus:", data); // 👈 debug
        setInfirmiers(Array.isArray(data) ? data : []);
      })
      .catch(console.error);

    chargerGardes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "typeGarde" && value !== "custom") {
      setForm(prev => ({
        ...prev,
        typeGarde:  value,
        heureDebut: TYPE_HEURES[value].debut,
        heureFin:   TYPE_HEURES[value].fin,
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");

    try {
      const res = await fetch("http://localhost:5000/api/insertion/Ajouter-Garde", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form), // ✅ infirmierId envoyé
      });

      const data = await res.json();

      if (!res.ok) {
        setErreur(data.message || "Erreur lors de l'ajout.");
        return;
      }

      // ✅ Trouver le nom de l'infirmier sélectionné pour le message
      const inf = infirmiers.find(i => String(i.id) === String(form.infirmierId));
      const nomInf = inf ? `${inf.prenom} ${inf.nom}` : "Infirmier";

      setSucces(
        `Garde ajoutée — ${nomInf} · ${TYPE_LABEL[form.typeGarde]} · ${form.heureDebut} → ${form.heureFin}`
      );

      setForm({
        infirmierId: "", typeGarde: "", dateDebut: today,
        dateFin: today,  heureDebut: "", heureFin: "",
        service: "",
      });

      chargerGardes();
    } catch (err) {
      console.error(err);
      setErreur("Erreur réseau.");
    }
  };

  // const supprimer = async (id) => {
  //   try {
  //     await fetch(`http://localhost:5000/api/DELETE/gardes/${id}`, { method: "DELETE" });
  //     setGardes(prev => prev.filter(g => g.id !== id));
  //   } catch (err) {
  //     console.error("Erreur suppression:", err);
  //   }
  // };

  return (
    <div className="max-w-2xl mx-auto mt-6 flex flex-col gap-5 p-4">

      {/* FORMULAIRE */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-teal-800 px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-teal-100 font-medium text-sm">Ajouter une garde</p>
            <p className="text-teal-400 text-xs">Planning infirmerie</p>
          </div>
          <span className="text-xs bg-teal-700 text-teal-100 px-3 py-1 rounded-full">
            {new Date().toLocaleDateString("fr-FR", {
              day: "2-digit", month: "long", year: "numeric"
            })}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ✅ Select infirmier avec name="infirmierId" */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Infirmier(ère) *</label>
              <select
                name="infirmierId"
                value={form.infirmierId}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Sélectionner</option>
                {infirmiers.map(i => (
                  // ✅ value = i.id (clé étrangère envoyée au backend)
                  <option key={i.id} value={i.id}>
                    {i.prenom} {i.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Type de garde *</label>
              <select
                name="typeGarde"
                value={form.typeGarde}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Sélectionner</option>
                <option value="matin">Garde du matin (06h–14h)</option>
                <option value="soir">Garde du soir (14h–22h)</option>
                <option value="nuit">Garde de nuit (22h–06h)</option>
                <option value="custom">Horaire personnalisé</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date de début *</label>
              <input type="date" name="dateDebut" value={form.dateDebut}
                min={today} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date de fin *</label>
              <input type="date" name="dateFin" value={form.dateFin}
                min={form.dateDebut} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Heures */}
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

          {/* Service */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Service / Unité</label>
            <select name="service" value={form.service} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Sélectionner un service</option>
              {["Urgences","Chirurgie","Cardiologie","Pédiatrie",
                "Maternité","Médecine générale","Réanimation"].map(s =>
                <option key={s}>{s}</option>
              )}
            </select>
          </div>

          {/* Messages retour */}
          {succes && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
              <p className="text-sm font-medium text-teal-800">Garde ajoutée</p>
              <p className="text-xs text-teal-600">{succes}</p>
            </div>
          )}
          {erreur && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{erreur}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button"
              onClick={() => {
                setForm({ infirmierId:"", typeGarde:"", dateDebut:today,
                  dateFin:today, heureDebut:"", heureFin:"", service:""});
                setErreur(""); setSucces("");
              }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit"
              className="px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
              Ajouter la garde
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}