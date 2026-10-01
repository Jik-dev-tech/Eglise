// src/services/decaissementService.ts
import { Knex } from "knex";

export type DecaissementType = "community" | "apostle";

export interface DecaissementResult {
  payoutId: number;
  amount: number;
  entry: any;
}

export async function decaisserTransaction(
  knex: Knex,
  entryId: number,
  type: DecaissementType,
  performedBy: number | null
): Promise<DecaissementResult> {
  return await knex.transaction(async trx => {
    // 1) Récupérer l'entrée
    const entry = await trx("entries").where({ id: entryId }).first();
    if (!entry) throw new Error("Entry not found");

    const amount =
      type === "community"
        ? Number(entry.community_share_20 ?? 0)
        : Number(entry.apostle_share_10 ?? 0);

    if (!amount || amount <= 0) {
      throw new Error("Aucun montant à décaisser pour ce type");
    }

    // 2) Créer l'enregistrement de payout (trace)
    const [payoutRow] = await trx("payouts")
      .insert({
        entry_id: entryId,
        amount,
        payout_type: type,
        paid_by: performedBy,
        paid_at: trx.fn.now()
      })
      .returning(["id"]);

    const payoutId = (payoutRow as any).id ?? payoutRow;

    // 3) Mettre la part correspondante à zéro (NE PAS toucher au solde global)
    const update: Record<string, any> = {};
    if (type === "community") update.community_share_20 = 0;
    else update.apostle_share_10 = 0;

    await trx("entries").where({ id: entryId }).update(update);

    // 4) Enregistrer la trace dans les rapports
    await trx("reports").insert({
      entry_id: entryId,
      action: "decaissement",
      payout_id: payoutId,
      payload: JSON.stringify({ amount, type, performed_by: performedBy }),
      created_at: trx.fn.now()
    });

    // IMPORTANT : on NE MODIFIE PAS la table 'caisse' ni le solde global ici.

    // retourner le résultat pour la génération du PDF hors transaction
    return { payoutId, amount, entry: { ...entry, ...update } };
  });
}
