// src/handlers/decaissementHandler.ts
import { Request, Response } from "express";
import { decaisserTransaction } from "../services/decaissementService";
import db from "../db"; // adapt to your db export
import { generateDecaissementPdf } from "../services/pdfService";

export async function postDecaisser(req: Request, res: Response) {
  const userId = (req.user && (req.user as any).id) ?? null;
  const { entryId, type } = req.body as { entryId?: number; type?: string };

  if (!entryId || !["community", "apostle"].includes(String(type))) {
    return res.status(400).json({ error: "Paramètres invalides" });
  }

  try {
    const result = await decaisserTransaction(db, Number(entryId), type as any, userId);

    // Générer le PDF hors transaction (longop possible -> job si nécessaire)
    const pdfBuffer = await generateDecaissementPdf(result.payoutId, {
      entry: result.entry,
      amount: result.amount,
      type
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=decaissement-${result.payoutId}.pdf`);
    return res.status(200).send(pdfBuffer);
  } catch (err: any) {
    console.error("Erreur decaisser:", err);
    return res.status(400).json({ error: err.message || "Erreur lors du décaissement" });
  }
}
