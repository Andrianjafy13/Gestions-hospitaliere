import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

export default function HistoriqueMedical() {
  const [consultations, setConsultations] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  // 🔹 Charger données backend
  useEffect(() => {
    const medecinId = localStorage.getItem("medecinId");

    fetch(`http://localhost:5000/api/GET/AllConsultations/${medecinId}`)
      .then((res) => res.json())
      .then((data) => setConsultations(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* 🔷 TITLE */}
      <h1 className="text-2xl font-bold mb-6">
        Historique des dossier medicaux
      </h1>

      {/* 🔷 LISTE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {consultations.map((c) => (
          <div
            key={c.id}
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
          >
            {/* 👤 PATIENT */}
            <p className="font-semibold">
                Patient : {c.patients?.nom} {c.patients?.prenom}
            </p>

            {/* 🏥 MÉDECIN */}
            <p className="text-sm text-gray-600">
            Médecin : Dr {c.medecin?.prenom}
            </p>

            {/* 📅 DATE */}
            <p className="text-xs text-gray-400">
              {c.dateConsultation?.split("T")[0]}
            </p>

            {/* 🔘 DETAILS */}
            <button
              onClick={() => setSelectedConsultation(c)}
              className="mt-3 w-full bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600"
            >
              Détails
            </button>
          </div>
        ))}

      </div>

      {/* ================= MODAL ================= */}
      {selectedConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">

        <div className="bg-white p-6 rounded-xl w-[450px]">

          <h2 className="text-xl font-bold mb-4">
            Détails de l'historique
          </h2>

          {/* 👤 PATIENT */}
          <p><strong>Nom :</strong> {selectedConsultation.patients?.nom}</p>
          <p><strong>Prénom :</strong> {selectedConsultation.patients?.prenom}</p>
          <p><strong>Téléphone :</strong> {selectedConsultation.patients?.telephone}</p>
          <p><strong>Date naissance :</strong> {new Date(selectedConsultation.patients?.dateNaissance).toLocaleDateString("fr-FR")}</p>
          <p><strong>Sexe :</strong> {selectedConsultation.patients?.sexe}</p>
          <p><strong>Type patient :</strong> {selectedConsultation.patients?.typePatient}</p>
          <p><strong>Groupe sanguin :</strong> {selectedConsultation.patients?.groupeSanguin}</p>

          <hr className="my-3" />

          {/* 🏥 CONSULTATION */}
          <p><strong>Médecin :</strong> Dr {selectedConsultation.medecin?.prenom}</p>
          <p><strong>Motif :</strong> {selectedConsultation.motif}</p>
          <p><strong>Diagnostic :</strong> {selectedConsultation.diagnostic}</p>
          <p><strong>Traitement :</strong> {selectedConsultation.traitement}</p>
          <p><strong>Date :</strong> {selectedConsultation.dateConsultation?.split("T")[0]}</p>


            {/* 🔘 ACTIONS */}
            <div className="mt-5 flex gap-2">

              {/* PDF */}
              <button
                onClick={() => {
                  const doc = new jsPDF();

                  doc.setFontSize(16);
                  doc.text("FICHE DE CONSULTATION", 20, 20);

                  doc.setFontSize(12);
                  doc.text(
                    `Patient: ${selectedConsultation.patient?.nom} ${selectedConsultation.patient?.prenom}`,
                    20,
                    40
                  );

                  doc.text(
                    `Médecin: Dr ${selectedConsultation.medecin?.name}`,
                    20,
                    50
                  );

                  doc.text(`Motif: ${selectedConsultation.motif}`, 20, 60);
                  doc.text(`Diagnostic: ${selectedConsultation.diagnostic}`, 20, 70);
                  doc.text(`Traitement: ${selectedConsultation.traitement}`, 20, 80);

                  doc.text(
                    `Date: ${selectedConsultation.dateConsultation?.split("T")[0]}`,
                    20,
                    90
                  );

                  doc.save("consultation.pdf");
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full"
              >
                Exporter PDF
              </button>

              {/* CLOSE */}
              <button
                onClick={() => setSelectedConsultation(null)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg w-full"
              >
                Fermer
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}