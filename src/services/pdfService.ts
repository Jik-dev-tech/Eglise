// src/services/pdfService.ts
// Wrapper/service pour la génération de PDF de décaissement.
// Si vous avez déjà une implémentation, adaptez l'export ci-dessous pour réutiliser la vôtre.

export async function generateDecaissementPdf(payoutId: number, ctx: { entry: any; amount: number; type: string }): Promise<Buffer> {
  // Implémentation minimale : créez un PDF simple si vous n'avez pas de service.
  // Recommandé : réutilisez votre utilitaire existant.
  const pdfMake = await import('pdfmake/build/pdfmake');
  const vfsFonts = await import('pdfmake/build/vfs_fonts');
  (pdfMake as any).vfs = (vfsFonts as any).pdfMake.vfs;

  const docDefinition: any = {
    content: [
      { text: 'Décaissement', style: 'header' },
      `Payout ID: ${payoutId}`,
      `Type: ${ctx.type}`,
      `Montant: ${ctx.amount}`,
      { text: 'Entry:', style: 'subheader' },
      JSON.stringify(ctx.entry, null, 2)
    ],
    styles: {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 14, bold: true }
    }
  };

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const printer = (pdfMake as any).createPdf(docDefinition);
      printer.getBuffer((buffer: any) => resolve(Buffer.from(buffer)));
    } catch (e) {
      reject(e);
    }
  });
}
