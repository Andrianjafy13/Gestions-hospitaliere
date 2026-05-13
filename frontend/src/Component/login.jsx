import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import hospitalIcon from "../assets/icons.png";

export default function Login() {

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const navigation = useNavigate();

const handleSubmit = async (e) => {

e.preventDefault();

        try {

            const response = await fetch("http://localhost:5000/api/auth/Connexion", {
                method: "POST",
                headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify({
            email,
            password
            })
        });

        const data = await response.json();

        if (response.ok) {
          const user = data.user;
        
          // ✅ Nettoyer anciennes clés
          localStorage.removeItem("medecinId");
          localStorage.removeItem("medecinPrenom");
          localStorage.removeItem("infirmierId");
          localStorage.removeItem("pharmatieId");
          localStorage.removeItem("receptionnisteId");
        
          // ✅ Clés universelles
          localStorage.setItem("token",      data.token);
          localStorage.setItem("role",       user.role);
          localStorage.setItem("userId",     user.id);
          localStorage.setItem("userNom",    user.nom);
          localStorage.setItem("userPrenom", user.prenom);
        
          // ✅ Clés spécifiques — compatibilité avec les pages existantes
          if (user.role === "medecin") {
            localStorage.setItem("medecinId",     user.id);
            localStorage.setItem("medecinPrenom", user.prenom);
          }
          if (user.role === "infirmier") {
            localStorage.setItem("infirmierId", user.id);
          }
          if (user.role === "pharmacien") {
            localStorage.setItem("pharmatieId", user.id);
          }
          if (user.role === "receptionniste") {
            localStorage.setItem("receptionnisteId", user.id);
          }
        
          if (user.role === "medecin")        navigation("/Medecin");
          if (user.role === "infirmier")      navigation("/infirmier");
          if (user.role === "receptionniste") navigation("/Receptionniste/Dashboard");
          if (user.role === "pharmacien")     navigation("/Pharmatie/Dashboard");
          if (user.role === "laboratoire")    navigation("/Loboratoire");
          if (user.role === "accuiel")        navigation("/Accuiel");
        
        } else {
          alert(data.message);
        }

            } catch (error) {

            console.log("Erreur :", error);

            }

            };

        return (

            <div className="min-h-screen flex items-center justify-center bg-gray-100">

        <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md flex flex-col items-center"
        >

            <img
                src={hospitalIcon}
                alt="Hospital Icon"
                className="w-20 h-20 mb-4"
            />

            <h2 className="text-2xl font-bold text-center mb-6 text-green-600">
            Connexion
            </h2>

            <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 p-3 border rounded-lg"
            />

            <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-6 p-3 border rounded-lg"
            />

            <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
            >
            Se connecter
            </button>

            <p className="text-center mt-4 text-sm text-gray-600">
            Pas de compte ?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
            S'inscrire
            </Link>
            </p>

        </form>

</div>

);

}