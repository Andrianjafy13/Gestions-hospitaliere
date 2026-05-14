import sequelize   from "../config/database.js";
import { Op }      from "sequelize";
import Medicaments from "../models/Medicament.js";

/**
 * Traite la déduction de stock pour chaque ligne d'ordonnance.
 * Utilise une transaction avec verrou (SELECT ... FOR UPDATE)
 * pour éviter les stocks négatifs en cas de requêtes concurrentes.
 *
 * @param {Array}    lignes    [{ nomMedicament, quantitePrescrite }]
 * @param {Function} notifier  fn({ type, nomMedicament, ... }) → Socket.io
 * @param {Object}   contexte  { patientNom, medecinNom, consultationId }
 * @returns {{ succes, alertes, introuvables }}
 */
export async function traiterStockOrdonnance(lignes, notifier, contexte) {
  const rapport = { succes: [], alertes: [], introuvables: [] };

  for (const ligne of lignes) {
    const { nomMedicament, quantitePrescrite } = ligne;

    // Transaction individuelle par médicament
    // → une erreur sur un médicament n'annule pas les autres
    const t = await sequelize.transaction();

    try {
      // 🔒 SELECT FOR UPDATE : verrou ligne pour éviter race condition
      const medicament = await Medicaments.findOne({
        where: {
          nomMedicament: { [Op.like]: nomMedicament.trim() }
        },
        lock:        t.LOCK.UPDATE,
        transaction: t,
      });

      // ── Cas 1 : Médicament introuvable ──────────────────────────
      if (!medicament) {
        await t.rollback();
        rapport.introuvables.push(nomMedicament);

        notifier({
          type:          "introuvable",
          nomMedicament,
          message:       `⚠️ Médicament "${nomMedicament}" introuvable en stock.`,
          ...contexte,
        });
        continue;
      }

      // ── Cas 2 : Stock insuffisant ────────────────────────────────
      if (medicament.stock < quantitePrescrite) {
        await t.rollback();
        rapport.alertes.push({
          nomMedicament,
          stockActuel:      medicament.stock,
          quantitePrescrite,
        });

        notifier({
          type:             "stock_insuffisant",
          nomMedicament,
          stockActuel:      medicament.stock,
          quantitePrescrite,
          message: `🚨 Stock insuffisant pour "${nomMedicament}" `
                 + `(stock: ${medicament.stock}, prescrit: ${quantitePrescrite}).`,
          ...contexte,
        });
        continue;
      }

      // ── Cas 3 : Stock suffisant → soustraction ───────────────────
      const nouveauStock = medicament.stock - quantitePrescrite;
      await medicament.update({ stock: nouveauStock }, { transaction: t });
      await t.commit();

      rapport.succes.push({ nomMedicament, nouveauStock });

      // Alerte stock faible après déduction (seuil configurable)
      const SEUIL_ALERTE = 5;
      if (nouveauStock <= SEUIL_ALERTE) {
        notifier({
          type:          "stock_faible",
          nomMedicament,
          stockActuel:   nouveauStock,
          message: `⚠️ Stock faible pour "${nomMedicament}" : ${nouveauStock} restants.`,
          ...contexte,
        });
      }

    } catch (err) {
      await t.rollback();
      console.error(`stockService - erreur sur "${nomMedicament}":`, err);
      rapport.alertes.push({ nomMedicament, erreur: err.message });
    }
  }

  return rapport;
}