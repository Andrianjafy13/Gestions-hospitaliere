// hooks/useModifierSupprimer.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function useModifierSupprimer(entite, charger) {
  const [itemASupprimer, setItemASupprimer] = useState(null);
  const navigate = useNavigate();

  const handleModifier = (item) => {
    navigate(`/modifier/${entite}/${item.id}`, { state: { data: item } });
  };

  const handleSupprimer = async () => {
    try {
      await fetch(
        `http://localhost:5000/api/DELETE/${entite}/${itemASupprimer.id}`,
        { method: "DELETE" }
      );
      setItemASupprimer(null);
      charger(); // ✅ recharger la liste
    } catch (err) {
      console.error(err);
    }
  };

  return { itemASupprimer, setItemASupprimer, handleModifier, handleSupprimer };
}