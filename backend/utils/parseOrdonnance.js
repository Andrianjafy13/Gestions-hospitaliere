/**
 * Parse le texte d'ordonnance généré par Ordonnance.jsx
 * Format attendu : "Paracetamol - 500mg - 3 - Matin, Soir; Amoxicilline - 1g - 2 - Midi"
 *
 * @param {string} traitement
 * @returns {{ nomMedicament: string, quantitePrescrite: number }[]}
 */
export function parseOrdonnance(traitement) {
    if (!traitement?.trim()) return [];
  
    return traitement
      .split(";")
      .map(ligne => ligne.trim())
      .filter(Boolean)
      .map(ligne => {
        const parties = ligne.split(" - ").map(p => p.trim());
        // parties[0] = nom, parties[1] = dosage, parties[2] = nombre, parties[3] = fréquence
        const nom      = parties[0] || "";
        const quantite = parseInt(parties[2], 10);
  
        return {
          nomMedicament:     nom,
          quantitePrescrite: isNaN(quantite) ? 0 : quantite,
        };
      })
      .filter(m => m.nomMedicament && m.quantitePrescrite > 0);
  }