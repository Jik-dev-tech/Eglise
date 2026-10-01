// tests/decaissement.test.ts
import db from "../src/db";
import { decaisserTransaction } from "../src/services/decaissementService";

describe("decaissement", () => {
  let entryId: number;
  let initialSolde: number;

  beforeAll(async () => {
    // préparer DB : lire caisse, créer entry
    const caisse = await db("caisse").first();
    initialSolde = Number(caisse.solde);

    const [row] = await db("entries").insert({
      description: "Test",
      amount: 1000,
      community_share_20: 200,
      apostle_share_10: 100
    }).returning("id");
    entryId = (row as any).id ?? row;
  });

  afterAll(async () => {
    await db("entries").where({ id: entryId }).del();
    await db.destroy();
  });

  test("ne change pas le solde global lors du decaissement community", async () => {
    await decaisserTransaction(db, entryId, "community", 1);

    const caisse = await db("caisse").first();
    expect(Number(caisse.solde)).toBeCloseTo(initialSolde);

    const entry = await db("entries").where({ id: entryId }).first();
    expect(Number(entry.community_share_20)).toBe(0);

    const payouts = await db("payouts").where({ entry_id: entryId, payout_type: "community" });
    expect(payouts.length).toBeGreaterThan(0);

    const reports = await db("reports").where({ entry_id: entryId, action: "decaissement" });
    expect(reports.length).toBeGreaterThan(0);
  });
});
