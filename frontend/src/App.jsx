// app.jsx
import { Routes, Route } from "react-router-dom";
import { useState } from "react";

import Login              from "./Component/login";
import Register           from "./Component/register";
import NavBarInf          from "./Pages/Infirmerie/NavBar";
import NavBarMed          from "./Pages/Medicin/NavBar";
import NavBarRecep        from "./Pages/receptionniste/NavBar";
import NavBarPharm        from "./Pages/Pharmatie/NavBar";
import NavBarLabo         from "./Pages/Laboratoire/NavBar";
import RendezVous         from "./Pages/Medicin/RendezVous";
import Consultation       from "./Pages/Medicin/Consultation";
import MedecinLayout      from "./Pages/Medicin/layouts/MedecinLayout";
import CreatePatient      from "./Pages/Medicin/CreatePatient";
import PatientTable       from "./Pages/Medicin/ListePatient";
import ConsultationTable  from "./Pages/Medicin/ListeConsultation";
import Ordonnance         from "./Pages/Medicin/ordonnance";
import Dashboard          from "./Pages/Medicin/Dashboard";
import HistoriqueMedical  from "./Pages/Medicin/HistoriqueDossier";
import StatsMensuelles    from "./Pages/Medicin/Statistique";
import ReceptionLayout    from "./Pages/receptionniste/layouts/ReceptionLayouts";
import CreerRendezVous    from "./Pages/receptionniste/CréeRendez-vous";
import CreatePatients     from "./Pages/receptionniste/nouveauPatient";
import StatsRendeVous     from "./Pages/receptionniste/DashboardReceptionniste";
import RendezVousTable    from "./Pages/receptionniste/ListeRendezVous";
import InfirmeLayout      from "./Pages/Infirmerie/layouts/InfirmLayouts";
import PlanningGarde      from "./Pages/Infirmerie/PlanningGarde";
import ListeGarde         from "./Pages/Infirmerie/ListeGarde";
import PharmaLayout       from "./Pages/Pharmatie/Layouts/PharmatieLayout";
import AjoutMedicament    from "./Pages/Pharmatie/AjoutMedicament";
import ListeMedicaments   from "./Pages/Pharmatie/ListeMedicament";
import DelivranceOrdonnance from "./Pages/Pharmatie/DelivranceOrdonnance";
import ModifierRendezVous from "./Pages/receptionniste/ModifierRendezVous";
import ModifierMedicament from "./Pages/Pharmatie/ModifierMedicament";
import ModifierGarde      from "./Pages/Infirmerie/ModifierGarde";
import ModifierConsultation from "./Pages/Medicin/ModifierConsultation";
import ModifierPatient    from "./Pages/Medicin/ModifierPatient";
import { ModalConfirmation } from "./Pages/confirmationSup/ModalConfirmation";
import AjoutChambre       from "./Pages/Accuiel/GestionChambre";
import DashboardInfirmerie      from "./Pages/Infirmerie/DashboardInfirmerie";
import DashboardReceptionniste  from "./Pages/receptionniste/DashboardReceptionniste";
import DashboardPharmacie       from "./Pages/Pharmatie/DashboardPharmacie";
import { AjoutSuivi }           from "./Pages/Infirmerie/SuiviPatient";
import AlertesMedicamentsPage   from "./Pages/Pharmatie/AlertesMedicamentsPage";
import PharmacieChart           from "./Pages/Pharmatie/PharmacieChart";
import { FenetreChat }          from "./Pages/ComponentsMessage/FenetreChat";
import ListePatientRecep from "./Pages/receptionniste/ListePatientsRecep";
import ArchiveMedicaments from "./Pages/Pharmatie/ArchiveMedicaments";
import Caisse from "./Pages/Pharmatie/Caisse";


export default function App() {
  // ✅ Plus de useState ici — chaque PageChat gère son propre état local
  return (
    <Routes>

      {/* ── Connexion / Inscription ── */}
      <Route path="/"         element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/Accuiel"  element={<AjoutChambre />} />

      {/* ────────────────────────────
           MÉDECIN
      ──────────────────────────── */}
      <Route path="/Medecin" element={
        <MedecinLayout><Dashboard /></MedecinLayout>
      }/>

      <Route path="/medecin/rendezvous" element={
        <MedecinLayout><RendezVous /></MedecinLayout>
      }/>

      <Route path="/medecin/consultation/Créer" element={
        <MedecinLayout><Consultation /></MedecinLayout>
      }/>

      <Route path="/medecin/consultation/Liste_Consultations" element={
        <MedecinLayout><ConsultationTable /></MedecinLayout>
      }/>

      <Route path="/medecin/patients/creer" element={
        <MedecinLayout><CreatePatient /></MedecinLayout>
      }/>

      <Route path="/medecin/patients/Liste des patients" element={
        <MedecinLayout><PatientTable /></MedecinLayout>
      }/>

      <Route path="/medecin/Historique medical" element={
        <MedecinLayout><HistoriqueMedical /></MedecinLayout>
      }/>

      <Route path="/medecin/Statistiques" element={
        <MedecinLayout><StatsMensuelles /></MedecinLayout>
      }/>

      <Route path="/medecin/modifier/patient/:id" element={
        <MedecinLayout><ModifierPatient /></MedecinLayout>
      }/>

      <Route path="/medecin/modifier/consultation/:id" element={
        <MedecinLayout><ModifierConsultation /></MedecinLayout>
      }/>

      {/* ✅ Routes modifier sans préfixe /medecin — gardées pour compatibilité */}
      <Route path="/modifier/patient/:id" element={
        <MedecinLayout><ModifierPatient /></MedecinLayout>
      }/>

      <Route path="/modifier/consultation/:id" element={
        <MedecinLayout><ModifierConsultation /></MedecinLayout>
      }/>

      <Route path="/consultation" element={
        <MedecinLayout><Consultation /></MedecinLayout>
      }/>

      <Route path="/ordonnance" element={<Ordonnance />} />

      {/* ✅ Chat médecin */}
      <Route path="/medecin/Message" element={
        <MedecinLayout><FenetreChat /></MedecinLayout>
      }/>

      {/* ────────────────────────────
           INFIRMIER
      ──────────────────────────── */}
      <Route path="/infirmier" element={
        <InfirmeLayout><DashboardInfirmerie /></InfirmeLayout>
      }/>

      <Route path="/Infirmier/Créer-Garde" element={
        <InfirmeLayout><PlanningGarde /></InfirmeLayout>
      }/>

      <Route path="/infirmier/Liste_Gardes" element={
        <InfirmeLayout><ListeGarde /></InfirmeLayout>
      }/>

      <Route path="/infirmerie/surveillencePatient" element={
        <InfirmeLayout><AjoutSuivi /></InfirmeLayout>
      }/>

      <Route path="/infirmier/modifier/garde/:id" element={
        <InfirmeLayout><ModifierGarde /></InfirmeLayout>
      }/>

      {/* ✅ Route modifier garde sans préfixe — gardée pour compatibilité */}
      <Route path="/modifier/garde/:id" element={
        <InfirmeLayout><ModifierGarde /></InfirmeLayout>
      }/>

      {/* ✅ Chat infirmier */}
      <Route path="/infirmier/Message" element={
        <InfirmeLayout><FenetreChat /></InfirmeLayout>
      }/>

      {/* ────────────────────────────
           RÉCEPTIONNISTE
      ──────────────────────────── */}
      <Route path="/Receptionniste/Dashboard" element={
        <ReceptionLayout><DashboardReceptionniste /></ReceptionLayout>
      }/>

      <Route path="/Receptionniste/CréeRendezvous" element={
        <ReceptionLayout><CreerRendezVous /></ReceptionLayout>
      }/>

      <Route path="/Receptionniste/ListeRendezvous" element={
        <ReceptionLayout><RendezVousTable /></ReceptionLayout>
      }/>

      <Route path="/Receptionniste/CréerPatient" element={
        <ReceptionLayout><CreatePatients /></ReceptionLayout>
      }/>
      <Route path="/Receptionniste/ListePatients" element={
        <ReceptionLayout><ListePatientRecep /></ReceptionLayout>
      }/>

      <Route path="/Receptionniste/modifier/rendezVous/:id" element={
        <ReceptionLayout><ModifierRendezVous /></ReceptionLayout>
      }/>

      {/* ✅ Route modifier sans préfixe — gardée pour compatibilité */}
      <Route path="/modifier/rendezVous/:id" element={
        <ReceptionLayout><ModifierRendezVous /></ReceptionLayout>
      }/>

      {/* ✅ Chat réceptionniste */}
      <Route path="/Receptionniste/Message" element={
        <ReceptionLayout><FenetreChat /></ReceptionLayout>
      }/>

      {/* ────────────────────────────
           PHARMACIE
      ──────────────────────────── */}
      <Route path="/Pharmatie/Dashboard" element={
        <PharmaLayout><DashboardPharmacie /></PharmaLayout>
      }/>

      <Route path="/Pharmatie/Ajout-medicament" element={
        <PharmaLayout><AjoutMedicament /></PharmaLayout>
      }/>

      <Route path="/Pharmatie/ListeMedicament" element={
        <PharmaLayout><ListeMedicaments /></PharmaLayout>
      }/>

      <Route path="/Pharmatie/delivranceOrdonance" element={
        <PharmaLayout><DelivranceOrdonnance /></PharmaLayout>
      }/>

      <Route path="/pharmatie/alertes-medicaments" element={
        <PharmaLayout><AlertesMedicamentsPage /></PharmaLayout>
      }/>

      <Route path="/Pharmatie/Facture" element={
        <PharmaLayout><Caisse /></PharmaLayout>
      }/>

      <Route path="/pharmatie/statistiques-pharmaceutique" element={
        <PharmaLayout><PharmacieChart /></PharmaLayout>
      }/>

      <Route path="/Pharmatie/modifier/medicament/:id" element={
        <PharmaLayout><ModifierMedicament /></PharmaLayout>
      }/>

      <Route path="/pharmatie/archives-medicaments" element={
        <PharmaLayout><ArchiveMedicaments /></PharmaLayout>
      }/>

      {/* ✅ Route modifier sans préfixe — gardée pour compatibilité */}
      <Route path="/modifier/medicament/:id" element={
        <PharmaLayout><ModifierMedicament /></PharmaLayout>
      }/>

      {/* ✅ Chat pharmacie — PageChat remplace <FenetreChat/> sans props */}
      <Route path="/pharmatie/Message"         element={
        <PharmaLayout><FenetreChat /></PharmaLayout>} />

      {/* ────────────────────────────
           LABORATOIRE
      ──────────────────────────── */}
      <Route path="/Loboratoire" element={<NavBarLabo />} />

    </Routes>
  );
}