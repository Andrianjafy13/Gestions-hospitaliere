import sequelize   from "../config/database.js";
import { Op }      from "sequelize";
import Medicaments from "../models/Medicament.js";

/**
 * Calcule la facture pour chaque ligne d'ordonnance.
 * S'appuie sur le même modèle Medicaments que traiterStockOrdonnance.
 *
 * @param {Array} lignes [{ nomMedicament, quantitePrescrite }]
 * @returns {Object} facture complète
 */
export async function calculerFacture(lignes) {
  const lignesFacture       = [];
  let   totalAPayer         = 0;
  let   totalTheoriqueTotal = 0;
  const alertes             = [];

  for (const ligne of lignes) {
    const { nomMedicament, quantitePrescrite } = ligne;

    // ── Verrou lecture cohérente ─────────────────────────────────
    const t = await sequelize.transaction();

    try {
      const medicament = await Medicaments.findOne({
        where: {
          nomMedicament: { [Op.like]: nomMedicament.trim() },
          // ✅ Compatibilité anciens enregistrements sans statut
          [Op.or]: [
            { statut: "actif" },
            { statut: null    },
          ],
        },
        lock:        t.LOCK.UPDATE,
        transaction: t,
      });

      await t.commit(); // lecture seule — pas de modification ici

      // ── Cas 0 : Médicament introuvable ───────────────────────────
      if (!medicament) {
        lignesFacture.push({
          nomMedicament,
          quantiteDemandee:   quantitePrescrite,
          quantiteVendue:     0,
          quantiteManquante:  quantitePrescrite,
          prixUnitaire:       0,
          prixFacture:        0,
          prixTotalTheorique: 0,
          statut:             "introuvable",
          message:            `"${nomMedicament}" introuvable en stock.`,
        });
        alertes.push({
          type:    "introuvable",
          nomMedicament,
          message: `⚠️ "${nomMedicament}" introuvable en stock.`,
        });
        continue;
      }

      const prix  = parseFloat(medicament.prix);
      const stock = medicament.stock;
      const qte   = quantitePrescrite;

      const prixTotalTheorique = parseFloat((qte * prix).toFixed(2));
      totalTheoriqueTotal     += prixTotalTheorique;

      // ── Cas 1 : Rupture totale (stock = 0) ───────────────────────
      if (stock === 0) {
        lignesFacture.push({
          nomMedicament,
          quantiteDemandee:   qte,
          quantiteVendue:     0,
          quantiteManquante:  qte,
          prixUnitaire:       prix,
          prixFacture:        0,
          prixTotalTheorique,
          statut:             "rupture_totale",
          message:            `Rupture totale : "${nomMedicament}" — 0 unité disponible.`,
        });
        alertes.push({
          type:              "rupture_totale",
          nomMedicament,
          quantiteManquante: qte,
          prixTotalTheorique,
          message: `🚨 Rupture totale "${nomMedicament}" — `
                 + `${qte} unité(s) manquante(s) `
                 + `(valeur : ${prixTotalTheorique} Ar).`,
        });
        continue;
      }

      // ── Cas 2 : Rupture partielle (0 < stock < qte) ──────────────
      if (stock < qte) {
        const prixFacture       = parseFloat((stock * prix).toFixed(2));
        const quantiteManquante = qte - stock;
        totalAPayer            += prixFacture;

        lignesFacture.push({
          nomMedicament,
          quantiteDemandee:   qte,
          quantiteVendue:     stock,
          quantiteManquante,
          prixUnitaire:       prix,
          prixFacture,
          prixTotalTheorique,
          statut:             "partiel",
          message: `Stock insuffisant : ${stock}/${qte} unité(s) disponible(s).`,
        });
        alertes.push({
          type:              "stock_insuffisant",
          nomMedicament,
          stockDisponible:   stock,
          quantiteManquante,
          prixFacture,
          prixTotalTheorique,
          message: `⚠️ Stock partiel "${nomMedicament}" : `
                 + `${quantiteManquante} unité(s) manquante(s) — `
                 + `facturé ${prixFacture} Ar sur ${prixTotalTheorique} Ar.`,
        });
        continue;
      }

      // ── Cas 3 : Stock suffisant ───────────────────────────────────
      const prixFacture = parseFloat((qte * prix).toFixed(2));
      totalAPayer      += prixFacture;

      lignesFacture.push({
        nomMedicament,
        quantiteDemandee:   qte,
        quantiteVendue:     qte,
        quantiteManquante:  0,
        prixUnitaire:       prix,
        prixFacture,
        prixTotalTheorique,
        statut:             "complet",
        message:            null,
      });

    } catch (err) {
      await t.rollback();
      console.error(`factureService - erreur sur "${nomMedicament}":`, err);
      lignesFacture.push({
        nomMedicament,
        statut:  "erreur",
        message: err.message,
      });
    }
  }

  return {
    lignes:         lignesFacture,
    totalAPayer:    parseFloat(totalAPayer.toFixed(2)),
    totalTheorique: parseFloat(totalTheoriqueTotal.toFixed(2)),
    difference:     parseFloat((totalTheoriqueTotal - totalAPayer).toFixed(2)),
    alertes,
    // Statut global de la facture
    statutGlobal:
      lignesFacture.every(l => l.statut === "complet")         ? "complet"       :
      lignesFacture.every(l => l.statut === "rupture_totale")  ? "rupture_totale":
                                                                  "partiel",
  };
}