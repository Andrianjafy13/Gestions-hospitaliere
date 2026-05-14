// pages/pharmacie/DelivranceOrdonnance.jsx
import { useState, useEffect } from "react";
import { useNotifPharmacie } from "./hooks/useNotifPharmacie";

// ✅ Modal de confirmation inline — même style que ListeMedicaments
function ModalConfirmation({ item, onConfirmer, onAnnuler }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center
      justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          Confirmer la suppression
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Voulez-vous supprimer l'ordonnance de{" "}
          <span className="font-semibold text-gray-800">
            {item.patientNom}
          </span>{" "}
          ? Cette action est irréversible.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onAnnuler}
            className="px-4 py-2 rounded-lg border border-gray-200
              text-gray-600 text-sm hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirmer}
            className="px-4 py-2 rounded-lg bg-red-500 text-white
              text-sm hover:bg-red-600 font-medium"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DelivranceOrdonnance() {
  const { marquerVus }                  = useNotifPharmacie();
  const [ordonnances,   setOrdonnances] = useState([]);
  const [loading,       setLoading]     = useState(true);
  const [filtre,        setFiltre]      = useState("toutes");
  const [itemASupprimer, setItemASupprimer] = useState(null); // ✅ même pattern que ListeMedicaments

  useEffect(() => {
    marquerVus();
    chargerOrdonnances();
  }, []);

  const chargerOrdonnances = async () => {
    try {
      setLoading(true);
      const res  = await fetch(
        "http://localhost:5000/api/GET/notifications/pharmacie/ordonnances"
      );
      const data = await res.json();
      setOrdonnances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSupprimer = async () => {
    if (!itemASupprimer) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/DELETE/notifications/pharmacie/${itemASupprimer.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(`Erreur : ${err.message}`);
        return;
      }

      setOrdonnances(prev => prev.filter(o => o.id !== itemASupprimer.id));
      setItemASupprimer(null);

    } catch (err) {
      console.error("Erreur suppression:", err);
      alert("Erreur réseau, suppression échouée.");
    }
  };

  const marquerDelivree = async (id) => {
    await fetch(
      `http://localhost:5000/api/PUT/notifications/pharmacie/${id}/delivree`,
      { method: "PUT" }
    );
    setOrdonnances(prev =>
      prev.map(o => o.id === id ? { ...o, vu: true } : o)
    );
  };

  const ordonnancesFiltrees = filtre === "nonDelivrees"
    ? ordonnances.filter(o => !o.vu)
    : ordonnances;

  if (loading) return (
    <div className="p-6">
      <p className="text-gray-400 text-sm">Chargement des ordonnances...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-blue-900 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-blue-100 font-medium">Ordonnances</p>
            <p className="text-blue-400 text-xs mt-0.5">
              Ordonnances envoyées par les médecins
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs bg-blue-700 text-blue-100 px-3 py-1 rounded-full">
              {ordonnances.filter(o => !o.vu).length} non délivrée(s)
            </span>
            <span className="text-xs bg-blue-800 text-blue-200 px-3 py-1 rounded-full">
              {ordonnances.length} total
            </span>
          </div>
        </div>

        {/* FILTRE */}
        <div className="px-5 py-3 border-b border-gray-100 flex gap-2">
          {[
            { key: "toutes",       label: "Toutes"        },
            { key: "nonDelivrees", label: "Non délivrées" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFiltre(key)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition
                ${filtre === key
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
              {label}
            </button>
          ))}
          <button onClick={chargerOrdonnances}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-gray-200
              text-gray-500 hover:bg-gray-50">
            Actualiser
          </button>
        </div>

        {/* LISTE ORDONNANCES */}
        {ordonnancesFiltrees.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">
            Aucune ordonnance {filtre === "nonDelivrees" ? "en attente" : "reçue"}.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {ordonnancesFiltrees.map((o) => (
              <div key={o.id}
                className={`px-5 py-4 hover:bg-gray-50 transition
                  ${!o.vu
                    ? "border-l-4 border-l-blue-500"
                    : "border-l-4 border-l-gray-100"}`}>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">

                    {/* En-tête */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <p className="text-sm font-medium text-gray-800">
                        Nom de patient : {o.patientNom}
                      </p>
                      {!o.vu ? (
                        <span className="text-xs bg-blue-100 text-blue-800
                          px-2 py-0.5 rounded-full">
                          En attente
                        </span>
                      ) : (
                        <span className="text-xs bg-teal-100 text-teal-700
                          px-2 py-0.5 rounded-full">
                          Délivrée
                        </span>
                      )}
                    </div>

                    {/* Médecin */}
                    <p className="text-xs text-gray-500 mb-2">
                      Consulté par {o.medecinNom}
                    </p>

                    {/* Traitement */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 font-medium">
                        Ordonnance :
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {o.traitement}
                      </p>
                    </div>

                    {/* Date */}
                    <p className="text-xs text-gray-400 mt-2">
                      Reçu le {new Date(o.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>

                  {/* Boutons droite */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {!o.vu && (
                      <button
                        onClick={() => marquerDelivree(o.id)}
                        className="px-4 py-2 bg-teal-600 text-white
                          text-xs rounded-lg hover:bg-teal-700 font-medium"
                      >
                        Marquer délivrée
                      </button>
                    )}

                    {/* ✅ Ouvre la modal — même pattern que FaTrash dans ListeMedicaments */}
                    {o.vu && (
                      <button
                        onClick={() => setItemASupprimer(o)}
                        className="text-xs bg-red-500 text-white
                          px-2 py-0.5 rounded-full hover:bg-red-600"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ Modal EN DEHORS de la liste — même position que dans ListeMedicaments */}
      <ModalConfirmation
        item={itemASupprimer}
        onConfirmer={handleSupprimer}
        onAnnuler={() => setItemASupprimer(null)}
      />
    </div>
  );
}