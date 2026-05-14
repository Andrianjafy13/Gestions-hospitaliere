// services/expirationService.js
import { Op }        from "sequelize";
import sequelize     from "../config/database.js";
import { getIO }     from "../socket.js";
import Medicaments   from "../models/Medicament.js";
import ProduitExpire from "../models/ProduitExpire.js"; // ✅ manquait
import Notification  from "../models/Notifications.js";

export async function archiverMedicamentsPerimes() {
  const aujourd_hui = new Date();
  aujourd_hui.setHours(0, 0, 0, 0);

  const t = await sequelize.transaction();

  try {
    const perimes = await Medicaments.findAll({
      where: {
        dateExpiration: { [Op.lte]: aujourd_hui },
        statut: "actif",
      },
      transaction: t,
    });

    if (perimes.length === 0) {
      await t.commit();
      console.log("✅ Aucun médicament périmé aujourd'hui.");
      return { archives: 0, liste: [] };
    }

    await ProduitExpire.bulkCreate(
      perimes.map(m => ({
        medicamentId:   m.id,
        nomMedicament:  m.nomMedicament,
        categorie:      m.categorie,
        forme:          m.forme,
        dosage:         m.dosage,
        stockAuRetrait: m.stock,
        prix:           m.prix,
        dateExpiration: m.dateExpiration,
        raisonRetrait:  "expiration",
      })),
      { transaction: t }
    );

    await Medicaments.update(
      { statut: "perime", stock: 0 },
      { where: { id: { [Op.in]: perimes.map(m => m.id) } }, transaction: t }
    );

    await t.commit();

    const listeNoms = perimes.map(m =>
      `${m.nomMedicament} (${m.dosage}) — expiré le ${m.dateExpiration}`
    );

    await Notification.create({
      type:         "expiration_medicaments",
      destinataire: "pharmacie",
      message:      `${perimes.length} médicament(s) périmé(s) retiré(s) du stock.`,
      details:      JSON.stringify(listeNoms),
      vu:           false,
    });

    try {
      getIO().to("pharmacie").emit("medicaments_perimes", {
        count: perimes.length, liste: listeNoms,
        horodatage: new Date().toISOString(),
        message: `🗑️ ${perimes.length} médicament(s) retiré(s) pour expiration.`,
      });
    } catch (e) { console.warn("Socket non disponible:", e.message); }

    return { archives: perimes.length, liste: listeNoms };

  } catch (err) {
    await t.rollback();
    console.error("❌ Erreur archivage:", err);
    throw err;
  }
}