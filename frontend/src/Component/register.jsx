import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import hospitalIcon from "../assets/icons.png"; // chemin relatif vers ton image

export default function Register() {
  const navigate = useNavigate();

  const SPECIALITES = {
    medecin: [
      "Cardiologie", "Neurologie", "Pédiatrie", "Gynécologie",
      "Chirurgie générale", "Dermatologie", "Ophtalmologie",
      "Orthopédie", "Oncologie", "Psychiatrie",
      "Médecine interne", "Urgentiste", "Anesthésiologie", "ORL"
    ],
    infirmier: [
      "Soins intensifs", "Bloc opératoire", "Pédiatrie",
      "Maternité", "Urgences", "Cardiologie",
      "Oncologie", "Gériatrie", "Psychiatrie", "Soins palliatifs"
    ],
    receptionniste: [
      "Accueil général", "Urgences", "Consultations externes",
      "Chirurgie", "Maternité"
    ],
    pharmacien: [
      "Pharmacie hospitalière", "Oncologie", "Pharmacovigilance",
      "Stérilisation", "Préparations magistrales"
    ],
    laboratoire: [
      "Biologie médicale", "Imagerie médicale", "Radiologie",
      "Anatomopathologie", "Microbiologie", "Hématologie"
    ],
    accuiel: [
      "Accueil principal", "Orientation patients", "Renseignements"
    ],
  };

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    role: "",
    password: "",
  });

  // const handleChange = (e) =>

    // setForm({ ...form, [e.target.name]: e.target.value });

    const handleChange = (e) => {
      const { name, value } = e.target;
  
      // Si on change le rôle, on remet la spécialité à vide
      if (name === "role") {
        setForm((prev) => ({ ...prev, role: value, specialite: "" }));
      } else {
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
    
      try {
    
        const response = await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });
    
        const data = await response.json();
    
        if (!response.ok) {
          console.log("Erreur:", data.message);
        } else {
          console.log("Succès:", data);
          setForm({
            nom: "",
            prenom: "",
            email: "",
            role: "",
            password: "",
          })
        }
    
      } catch (error) {
        console.log("Erreur:", error);
      }
    };

    const specialitesDuRole = SPECIALITES[form.role] || [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg relative flex flex-col items-center"
      >
        {/* Bouton retour en haut à gauche */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-2 text-gray-600 hover:text-red-600"
        >
          <FaArrowLeft />
          <span>Retour</span>
        </button>

        {/* Icon de l'hôpital au centre */}
        <img
          src={hospitalIcon}
          alt="Hospital Icon"
          className="w-24 h-24 mb-4 mx-auto"
        />

        <h2 className="text-2xl font-bold text-center mb-6 text-green-600">
          Inscription
        </h2>

        <div className="grid grid-cols-2 gap-4 w-full">
          <input
            type="text"
            name="nom"
            placeholder="Nom"
            className="p-3 border rounded-lg w-full"
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="prenom"
            placeholder="Prénom"
            className="p-3 border rounded-lg w-full"
            onChange={handleChange}
            required
          />
        </div>

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full mt-4 p-3 border rounded-lg"
          onChange={handleChange}
          required
        />

        <select
          name="role"
          className="w-full mt-4 p-3 border rounded-lg"
          onChange={handleChange}
          required
        >
          <option value="">Sélectionner un rôle</option>
          <option value="medecin">Médecin</option>
          <option value="infirmier">Infirmier / Infirmière</option>
          <option value="receptionniste">Réceptionniste</option>
          <option value="pharmacien">Pharmacien</option>
          <option value="laboratoire">Laboratoire / Imagerie</option>
          <option value="accuiel">Accuiel</option>
        </select>

        {/* Spécialité — s'affiche uniquement si le rôle est sélectionné */}
      {form.role && specialitesDuRole.length > 0 && (
        <select
          name="specialite"
          value={form.specialite}
          className="w-full mt-4 p-3 border rounded-lg"
          onChange={handleChange}
          required
        >
          <option value="">Sélectionner une spécialité</option>
          {specialitesDuRole.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

        {/* <input
          type="text"
          name="departement"
          placeholder="Département"
          className="w-full mt-4 p-3 border rounded-lg"
          onChange={handleChange}
        /> */}

        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          className="w-full mt-4 p-3 border rounded-lg"
          onChange={handleChange}
          required
        />

        <button className="w-full bg-green-600 text-white py-3 mt-6 rounded-lg hover:bg-green-700">
          S'inscrire
        </button>
      </form>
    </div>
  );
}