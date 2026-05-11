// components/ChatIcon.jsx
import { useState }       from "react";
import { MessageCircle }  from "lucide-react";
import { useSocket }      from "../hook/useSocket";
import { useNavigate } from "react-router-dom";

// ✅ Le composant ne prend pas de prop "size" — l'icône est définie à l'intérieur
export function ChatIcon({ route }) {
  const [ouvert,            setOuvert]            = useState(false);
  const [conversationAvec,  setConversationAvec]  = useState(null);
  const { nonLus, resetNonLus }                   = useSocket();
  const navigate           = useNavigate(); 

  const handleOuvrir = () => {
    navigate(route);
    resetNonLus();
  };

  return (
    <>
      {/* ✅ "relative" ajouté — indispensable pour positionner le badge */}
      <button
        onClick={handleOuvrir}
        className="relative w-9 h-9 rounded-full bg-teal-500 text-white
          flex items-center justify-center hover:bg-teal-600 transition-colors"
        title="Messages"
      >
        <MessageCircle size={18} />

        {/* Badge messages non lus */}
        {nonLus > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white
            text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {nonLus > 9 ? "9+" : nonLus}
          </span>
        )}
      </button>
    </>
  );
}