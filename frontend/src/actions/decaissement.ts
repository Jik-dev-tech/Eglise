// frontend/src/actions/decaissement.ts
export async function decaisser(entryId: number, type: "community" | "apostle") {
  const resp = await fetch("/api/decaisser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entryId, type })
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err?.error || "Erreur decaissement");
  }

  // si on reçoit PDF en réponse, traiter le téléchargement côté client
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `decaissement-${entryId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  // Mettre à jour uniquement l'entrée (ne pas toucher au solde global)
  // Exemple: dispatch({ type: "ENTRY_UPDATE", payload: { id: entryId, community_share_20: 0, apostle_share_10: 0 }});
}
