// Pages/ComponentsMessage/FenetreChat.jsx
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Pencil, Trash2, Check, X } from "lucide-react";
import { useNavigate }                 from "react-router-dom";
import { useSocket }                   from "../hook/useSocket";

function labelContact(u) {
  if (!u) return "";
  if (u.role === "medecin")        return `Dr. ${u.prenom} ${u.nom}`;
  if (u.role === "infirmier")      return `Inf. ${u.prenom} ${u.nom}`;
  if (u.role === "pharmacien")     return `Pharma. ${u.prenom} ${u.nom}`;
  if (u.role === "receptionniste") return `Recep. ${u.prenom} ${u.nom}`;
  return `${u.prenom} ${u.nom}`;
}

export function FenetreChat() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("medecinId");
  const moi    = parseInt(userId);

  const [contacts,         setContacts]         = useState([]);
  const [conversationAvec, setConversationAvec] = useState(null);
  const [messages,         setMessages]         = useState([]);
  const [texte,            setTexte]            = useState("");
  const [ecrit,            setEcrit]            = useState(false);
  const [recherche,        setRecherche]        = useState("");

  // ✅ États pour modification et suppression
  const [enEdition,    setEnEdition]    = useState(null); // { id, contenu }
  const [messageHover, setMessageHover] = useState(null); // id du message survolé

  const { socket, envoyerMessage } = useSocket();
  const finMessages                = useRef(null);

  // ── Charger contacts ────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    fetch(`http://localhost:5000/api/message/utilisateurs/${userId}`)
      .then(r => r.json())
      .then(d => setContacts(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, [userId]);

  // ── Charger historique ──────────────────────────────────────────────
  useEffect(() => {
    if (!conversationAvec || !userId) return;
    setMessages([]);

    fetch(`http://localhost:5000/api/message/conversation/${userId}/${conversationAvec.id}`)
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) return;
        const filtres = d.filter(m =>
          (m.expediteurId === moi   && m.destinataireId === conversationAvec.id) ||
          (m.expediteurId === conversationAvec.id && m.destinataireId === moi)
        );
        setMessages(filtres);
      })
      .catch(console.error);
  }, [conversationAvec?.id, userId]);

  // ── Socket ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNouveauMessage = (msg) => {
      if (msg.destinataireId !== moi) return;
      if (conversationAvec && msg.expediteurId === conversationAvec.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleMessageEnvoye = (msg) => {
      if (msg.expediteurId !== moi) return;
      if (conversationAvec && msg.destinataireId === conversationAvec.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleEcrit = ({ expediteurId }) => {
      if (conversationAvec && expediteurId === conversationAvec.id) {
        setEcrit(true);
        setTimeout(() => setEcrit(false), 2000);
      }
    };

    // ✅ Réception modification en temps réel
    const handleMessageModifie = ({ messageId, contenu, modifie }) => {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, contenu, modifie } : m
      ));
    };

    // ✅ Réception suppression en temps réel
    const handleMessageSupprime = ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, contenu: "Ce message a été supprimé.", supprime: true }
          : m
      ));
    };

    socket.on("nouveauMessage",    handleNouveauMessage);
    socket.on("messageEnvoye",     handleMessageEnvoye);
    socket.on("utilisateurEcrit",  handleEcrit);
    socket.on("message_modifie",   handleMessageModifie);   // ✅
    socket.on("message_supprime",  handleMessageSupprime);  // ✅

    return () => {
      socket.off("nouveauMessage",    handleNouveauMessage);
      socket.off("messageEnvoye",     handleMessageEnvoye);
      socket.off("utilisateurEcrit",  handleEcrit);
      socket.off("message_modifie",   handleMessageModifie);
      socket.off("message_supprime",  handleMessageSupprime);
    };
  }, [socket, conversationAvec?.id, moi]);

  // Scroll automatique
  useEffect(() => {
    finMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEnvoyer = () => {
    if (!texte.trim() || !conversationAvec) return;
    envoyerMessage(conversationAvec.id, texte.trim());
    setTexte("");
  };

  const handleEcrire = (e) => {
    setTexte(e.target.value);
    if (!conversationAvec || !socket) return;
    socket.emit("enTrainDEcrire", {
      expediteurId:   moi,
      destinataireId: conversationAvec.id,
    });
  };

  // ✅ Confirmer la modification
  const confirmerModification = () => {
    if (!enEdition || !enEdition.contenu.trim()) return;

    socket.emit("modifier_message", {
      messageId:      enEdition.id,
      contenu:        enEdition.contenu.trim(),
      expediteurId:   moi,
      conversationId: `${moi}_${conversationAvec.id}`,
    });

    // ✅ Mise à jour optimiste locale immédiate
    setMessages(prev => prev.map(m =>
      m.id === enEdition.id
        ? { ...m, contenu: enEdition.contenu.trim(), modifie: true }
        : m
    ));
    setEnEdition(null);
  };

  // ✅ Supprimer un message
  const supprimerMessage = (messageId) => {
    socket.emit("supprimer_message", {
      messageId,
      expediteurId:   moi,
      conversationId: `${moi}_${conversationAvec.id}`,
    });

    // ✅ Mise à jour optimiste locale immédiate
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, contenu: "Ce message a été supprimé.", supprime: true }
        : m
    ));
    setMessageHover(null);
  };

  const contactsFiltres = contacts.filter(u =>
    `${u.prenom} ${u.nom}`.toLowerCase()
      .includes(recherche.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">

      {/* ── PANEL GAUCHE — contacts (inchangé) ── */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">

        <div className="bg-teal-700 px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-teal-200 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <p className="text-white font-semibold">Messages</p>
        </div>

        <div className="p-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Rechercher un contact..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <p className="text-xs text-gray-400 px-4 py-2 font-medium uppercase tracking-wide">
            Contacts ({contactsFiltres.length})
          </p>

          {contactsFiltres.length === 0 && (
            <p className="text-center text-gray-400 text-xs py-8">
              Aucun contact trouvé
            </p>
          )}

          {contactsFiltres.map(u => (
            <button
              key={`${u.role}-${u.id}`}
              onClick={() => setConversationAvec(u)}
              className={`w-full flex items-center gap-3 px-4 py-3
                border-b border-gray-100 text-left transition-colors
                ${conversationAvec?.id === u.id
                  ? "bg-teal-50 border-l-4 border-l-teal-500"
                  : "hover:bg-gray-50"}`}>
              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center
                justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-teal-700">
                  {u.prenom?.[0]?.toUpperCase()}{u.nom?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {labelContact(u)}
                </p>
                <p className="text-xs text-gray-500 capitalize">{u.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── PANEL DROIT — messages ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* En-tête conversation (inchangé) */}
        <div className="bg-white border-b border-gray-200 px-6 py-4
          flex items-center gap-3 shadow-sm">
          {conversationAvec ? (
            <>
              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center
                justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-teal-700">
                  {conversationAvec.prenom?.[0]?.toUpperCase()}
                  {conversationAvec.nom?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {labelContact(conversationAvec)}
                </p>
                {ecrit ? (
                  <p className="text-xs text-teal-500">en train d'écrire...</p>
                ) : (
                  <p className="text-xs text-gray-400 capitalize">
                    {conversationAvec.role}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">
              Sélectionnez un contact pour commencer
            </p>
          )}
        </div>

        {/* Zone messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">

          {!conversationAvec && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-300 text-sm">Choisissez un contact à gauche</p>
            </div>
          )}

          {conversationAvec && messages.length === 0 && (
            <p className="text-center text-gray-400 text-xs py-8">
              Commencez la conversation
            </p>
          )}

          {messages.map((m, i) => {
            const estMoi   = m.expediteurId === moi;
            const supprime = m.supprime;
            const enCours  = enEdition?.id === m.id;

            return (
              <div
                key={m.id || i}
                className={`flex w-full ${estMoi ? "justify-end" : "justify-start"}`}
                onMouseEnter={() => estMoi && !supprime && setMessageHover(m.id)}
                onMouseLeave={() => setMessageHover(null)}
              >
                {/* Avatar contact (inchangé) */}
                {!estMoi && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center
                    justify-center flex-shrink-0 mr-2 self-end mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      {conversationAvec?.prenom?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* ✅ Icônes modifier/supprimer — au survol, uniquement mes messages */}
                {estMoi && !supprime && !enCours && messageHover === m.id && (
                  <div className="flex items-center gap-1 mr-2 self-center">
                    <button
                      onClick={() => setEnEdition({ id: m.id, contenu: m.contenu })}
                      className="p-1 rounded-full bg-white border border-gray-200
                        hover:bg-teal-50 hover:border-teal-300
                        text-gray-400 hover:text-teal-600 transition-colors shadow-sm"
                      title="Modifier"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => supprimerMessage(m.id)}
                      className="p-1 rounded-full bg-white border border-gray-200
                        hover:bg-red-50 hover:border-red-300
                        text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                      title="Supprimer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}

                {/* Bulle message — style original conservé */}
                <div className={`max-w-[60%] px-4 py-2.5 rounded-2xl text-sm
                  break-words shadow-sm
                  ${supprime
                    ? "bg-gray-100 text-gray-400 italic border border-gray-200 rounded-br-none"
                    : estMoi
                      ? "bg-teal-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                  }`}>

                  {/* ✅ Mode édition — input inline dans la bulle */}
                  {enCours ? (
                    <div className="flex flex-col gap-2">
                      <input
                        autoFocus
                        value={enEdition.contenu}
                        onChange={e =>
                          setEnEdition(prev => ({ ...prev, contenu: e.target.value }))
                        }
                        onKeyDown={e => {
                          if (e.key === "Enter")  confirmerModification();
                          if (e.key === "Escape") setEnEdition(null);
                        }}
                        className="bg-teal-500 text-white placeholder-teal-200
                          border-b border-teal-300 outline-none text-sm w-full"
                      />
                      {/* Boutons confirmer / annuler */}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEnEdition(null)}
                          className="text-teal-200 hover:text-white transition-colors"
                          title="Annuler"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={confirmerModification}
                          className="text-teal-200 hover:text-white transition-colors"
                          title="Enregistrer"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>{m.contenu}</p>
                  )}

                  {/* Timestamp + mention Modifié (inchangé sauf ajout "· Modifié") */}
                  {!enCours && (
                    <p className={`text-xs mt-1 text-right flex items-center
                      justify-end gap-1
                      ${estMoi ? "text-teal-200" : "text-gray-400"}`}>
                      {new Date(m.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                      {/* ✅ Mention modifié */}
                      {m.modifie && !supprime && (
                        <span className="italic">· Modifié</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Avatar moi (inchangé) */}
                {estMoi && (
                  <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center
                    justify-center flex-shrink-0 ml-2 self-end mb-1">
                    <span className="text-xs font-medium text-white">Moi</span>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={finMessages} />
        </div>

        {/* Zone saisie (inchangée) */}
        {conversationAvec && (
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
            <input
              type="text"
              value={texte}
              onChange={handleEcrire}
              onKeyDown={e => e.key === "Enter" && handleEnvoyer()}
              placeholder={`Message à ${labelContact(conversationAvec)}...`}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5
                text-sm focus:outline-none focus:ring-2 focus:ring-teal-500
                focus:border-transparent"
            />
            <button
              onClick={handleEnvoyer}
              disabled={!texte.trim()}
              className="bg-teal-600 text-white px-4 py-2.5 rounded-xl
                hover:bg-teal-700 disabled:opacity-40 transition-colors
                flex items-center gap-2">
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}