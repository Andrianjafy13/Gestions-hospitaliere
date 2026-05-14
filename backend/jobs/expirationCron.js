import cron from "node-cron";
import { archiverMedicamentsPerimes } from "../services/expirationService.js";

/**
 * Planifie l'archivage automatique des médicaments périmés.
 * Format cron : "0 0 * * *" = chaque jour à 00h00
 */
export function demarrerCronExpiration() {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ Cron expiration — démarrage:", new Date().toLocaleString("fr-FR"));
    try {
      const rapport = await archiverMedicamentsPerimes();
      console.log(`✅ Cron terminé — ${rapport.archives} médicament(s) traité(s).`);
    } catch (err) {
      console.error("❌ Cron expiration échoué:", err.message);
    }
  }, {
    timezone: "Indian/Antananarivo", // ✅ fuseau horaire Madagascar
  });

  console.log("✅ Cron expiration médicaments planifié (chaque nuit à minuit).");
}