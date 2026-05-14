import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Ordonnance() {
  const navigate = useNavigate();

  const [medicaments, setMedicaments] = useState([
    { nom: "", dosage: "", nombre:"", frequence: [] },
  ]);

  // Ajouter un médicament
  const addMedicament = () => {
    setMedicaments([...medicaments, { nom: "", dosage: "", nombre:"", frequence: [] }]);
  };

  // Supprimer un médicament
  const removeMedicament = (index) => {
    const list = [...medicaments];
    list.splice(index, 1);
    setMedicaments(list);
  };

  // Mettre à jour nom ou dosage
  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const list = [...medicaments];
    list[index][name] = value;
    setMedicaments(list);
  };

  // Gérer les checkboxes pour la fréquence
  const handleFrequenceChange = (index, jour) => {
    const list = [...medicaments];
    const frequence = list[index].frequence;

    if (frequence.includes(jour)) {
      list[index].frequence = frequence.filter((f) => f !== jour);
    } else {
      list[index].frequence = [...frequence, jour];
    }

    setMedicaments(list);
  };

  // Retour vers consultation
  const handleReturnToConsultation = () => {
    const traitementTexte = medicaments
      .map((m) => `${m.nom} - ${m.dosage} - ${m.nombre} - ${m.frequence.join(", ")}`)
      .join("; ");

    navigate("/consultation", {
      state: { traitement: traitementTexte },
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4">Créer une ordonnance</h2>

      {medicaments.map((med, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
          <input
            type="text"
            name="nom"
            placeholder="Nom médicament"
            value={med.nom}
            onChange={(e) => handleChange(e, index)}
            className="border rounded-lg px-3 py-2"
            required
          />
          <input
            type="text"
            name="dosage"
            placeholder="Dosage (ex: 500mg)"
            value={med.dosage}
            onChange={(e) => handleChange(e, index)}
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="number"
            name="nombre"
            placeholder="Nombre plaquete"
            value={med.nombre}
            onChange={(e) => handleChange(e, index)}
            className="border rounded-lg px-3 py-2"
            required
          />

          <div className="flex flex-col">
            <label className="text-sm font-medium">Fréquence :</label>
            <div className="flex gap-2 mt-1">
              {["Matin", "Midi", "Soir"].map((jour) => (
                <label key={jour} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={med.frequence.includes(jour)}
                    onChange={() => handleFrequenceChange(index, jour)}
                  />
                  {jour}
                </label>
              ))}
            </div>
          </div>

          {index > 0 && (
            <button
              type="button"
              onClick={() => removeMedicament(index)}
              className="px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Supprimer
            </button>
          )}
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={addMedicament}
          className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
        >
          Ajouter médicament
        </button>

        <button
          type="button"
          onClick={handleReturnToConsultation}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Enregistrer et retourner à la consultation
        </button>
      </div>
    </div>
  );
}