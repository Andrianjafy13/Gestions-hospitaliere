// components/ModalConfirmation.jsx
export function ModalConfirmation({ item, nomAffiche, onConfirmer, onAnnuler }) {
    if (!item) return null;
  
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Confirmer la suppression
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Voulez-vous vraiment supprimer{" "}
            <span className="font-medium text-gray-800">{nomAffiche}</span> ?
            Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={onAnnuler}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button onClick={onConfirmer}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  }