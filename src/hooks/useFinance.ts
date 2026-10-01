import { useState, useCallback } from 'react';
import { query, queryOne, execute } from '@/lib/database';
import type { Entree, EntreeWithCategorie, Exercice, Reversement, Sortie } from '@/types';

export function useFinance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async <T,>(action: () => Promise<T>, message: string): Promise<T | null> => {
    setLoading(true); setError(null);
    try { return await action(); } catch { setError(message); return null; } finally { setLoading(false); }
  }, []);

  const addEntree = useCallback((data: Omit<Entree, 'id' | 'created_at'>) => run(async () => {
    const id = await execute(
      'INSERT INTO entrees (date, culte, categorie_id, beneficiaire, numero_beneficiaire, devise, montant, montant_cdf, montant_usd, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.date, data.culte, data.categorie_id ?? null, data.beneficiaire ?? null, data.numero_beneficiaire ?? null, data.devise, data.montant, data.montant_cdf ?? 0, data.montant_usd ?? 0, data.note ?? null]
    );
    return queryOne<EntreeWithCategorie>('SELECT e.*, c.nom AS categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id WHERE e.id = ?', [id]);
  }, 'Erreur lors de l’ajout de l’entrée'), [run]);

  const addSortie = useCallback((data: Omit<Sortie, 'id' | 'created_at'>) => run(async () => {
    const id = await execute(
      'INSERT INTO sorties (date, nature, devise, montant, montant_cdf, montant_usd, description, nom_operateur, numero_operateur, telephone_operateur, beneficiaire, numero_beneficiaire) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.date, data.nature, data.devise, data.montant, data.montant_cdf ?? 0, data.montant_usd ?? 0, data.description ?? null, data.nom_operateur ?? null, data.numero_operateur ?? null, data.telephone_operateur ?? null, data.beneficiaire ?? null, data.numero_beneficiaire ?? null]
    );
    return queryOne<Sortie>('SELECT * FROM sorties WHERE id = ?', [id]);
  }, 'Erreur lors de l’ajout de la sortie'), [run]);

  const addReversement = useCallback((data: Omit<Reversement, 'id' | 'created_at'>) => run(async () => {
    const id = await execute(
      'INSERT INTO reversements (type, montant_cdf, montant_usd, date_reversement, periode_debut, periode_fin) VALUES (?, ?, ?, ?, ?, ?)',
      [data.type, data.montant_cdf ?? 0, data.montant_usd ?? 0, data.date_reversement, data.periode_debut ?? null, data.periode_fin ?? null]
    );
    return queryOne<Reversement>('SELECT * FROM reversements WHERE id = ?', [id]);
  }, 'Erreur lors de l’ajout du reversement'), [run]);

  const updateEntree = useCallback((id: number, data: Omit<Entree, 'id' | 'created_at'>) => run(async () => {
    await execute('DELETE FROM entrees WHERE id = ?', [id]);
    const newId = await execute(
      'INSERT INTO entrees (date, culte, categorie_id, beneficiaire, numero_beneficiaire, devise, montant, montant_cdf, montant_usd, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.date, data.culte, data.categorie_id ?? null, data.beneficiaire ?? null, data.numero_beneficiaire ?? null, data.devise, data.montant, data.montant_cdf ?? 0, data.montant_usd ?? 0, data.note ?? null]
    );
    return queryOne<EntreeWithCategorie>('SELECT e.*, c.nom AS categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id WHERE e.id = ?', [newId]);
  }, 'Erreur lors de la mise à jour de l’entrée'), [run]);

  const updateSortie = useCallback((id: number, data: Omit<Sortie, 'id' | 'created_at'>) => run(async () => {
    await execute('DELETE FROM sorties WHERE id = ?', [id]);
    const newId = await execute(
      'INSERT INTO sorties (date, nature, devise, montant, montant_cdf, montant_usd, description, nom_operateur, numero_operateur, telephone_operateur, beneficiaire, numero_beneficiaire) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.date, data.nature, data.devise, data.montant, data.montant_cdf ?? 0, data.montant_usd ?? 0, data.description ?? null, data.nom_operateur ?? null, data.numero_operateur ?? null, data.telephone_operateur ?? null, data.beneficiaire ?? null, data.numero_beneficiaire ?? null]
    );
    return queryOne<Sortie>('SELECT * FROM sorties WHERE id = ?', [newId]);
  }, 'Erreur lors de la mise à jour de la sortie'), [run]);

  const getEntrees = useCallback((start: string, end: string) => query<EntreeWithCategorie>(
    'SELECT e.*, c.nom AS categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id WHERE e.date >= ? AND e.date <= ? ORDER BY e.date DESC, e.id DESC',
    [start, end]
  ), []);

  const getSorties = useCallback((start: string, end: string) => query<Sortie>(
    'SELECT * FROM sorties WHERE date >= ? AND date <= ? ORDER BY date DESC, id DESC',
    [start, end]
  ), []);

  const getReversements = useCallback((start: string, end: string) => query<Reversement>(
    'SELECT * FROM reversements WHERE date_reversement >= ? AND date_reversement <= ? ORDER BY date_reversement DESC, id DESC',
    [start, end]
  ), []);

  const getAllEntrees = useCallback(() => query<EntreeWithCategorie>('SELECT e.*, c.nom AS categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id ORDER BY e.date DESC, e.id DESC'), []);
  const getAllSorties = useCallback(() => query<Sortie>('SELECT * FROM sorties ORDER BY date DESC, id DESC'), []);
  const getAllReversements = useCallback(() => query<Reversement>('SELECT * FROM reversements ORDER BY date_reversement DESC, id DESC'), []);
  const getExercice = useCallback((year: number) => queryOne<Exercice>('SELECT * FROM exercices WHERE annee = ?', [year]), []);

  const getBalance = useCallback(async (devise: 'CDF' | 'USD') => {
    const key = devise === 'CDF' ? 'montant_cdf' : 'montant_usd';

    // Totaux globaux depuis la base
    const totalEntreesRow = await queryOne<{ total: number }>(`SELECT COALESCE(SUM(${key}), 0) AS total FROM entrees`);
    const totalSortiesRow = await queryOne<{ total: number }>(`SELECT COALESCE(SUM(${key}), 0) AS total FROM sorties`);
    const totalAllEntrees = Number(totalEntreesRow?.total ?? 0);
    const totalAllSorties = Number(totalSortiesRow?.total ?? 0);

    // Base utilisée pour le calcul Communauté (catégories identiques au Dashboard)
    const revCats = ['Dîmes', 'Offrandes Ordinaires', 'Actions de Grâce', 'Évangélisation'];
    const revCatsSql = revCats.map((c) => `'${c.replace("'", "''")}'`).join(', ');
    const baseCommRow = await queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(e.${key}), 0) AS total FROM entrees e JOIN categories c ON e.categorie_id = c.id WHERE c.nom IN (${revCatsSql})`
    );
    const baseComm = Number(baseCommRow?.total ?? 0);
    const communauteDue = baseComm * 0.2;

    // Dîmes pour le calcul de l'Apôtre
    const dimesRow = await queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(e.${key}), 0) AS total FROM entrees e JOIN categories c ON e.categorie_id = c.id WHERE c.nom = 'Dîmes'`
    );
    const dimes = Number(dimesRow?.total ?? 0);

    // Calcul Apôtre (même logique que le Dashboard)
    let apotreDue = 0;
    if (baseComm > 0) {
      const communauteShareFromDimes = communauteDue * (dimes / baseComm);
      const dimesNet = dimes - communauteShareFromDimes;
      apotreDue = dimesNet * 0.1;
    }

    // Solde net = entrées - sorties - montants dus (communaute + apotre)
    const solde = totalAllEntrees - totalAllSorties - communauteDue - apotreDue;
    return solde;
  }, []);

  const getMonthlyTotals = useCallback(async (year: number) => {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const [entrees, sorties, reversements] = await Promise.all([getEntrees(start, end), getSorties(start, end), getReversements(start, end)]);

    // monthly arrays (12 entries) for charts
    const monthlyEntreesCdf = new Array(12).fill(0);
    const monthlyEntreesUsd = new Array(12).fill(0);
    const monthlySortiesCdf = new Array(12).fill(0);
    const monthlySortiesUsd = new Array(12).fill(0);
    const monthlyReversementsCdf = new Array(12).fill(0);
    const monthlyReversementsUsd = new Array(12).fill(0);

    for (const e of entrees) {
      const m = new Date(`${e.date}T00:00:00`).getMonth();
      monthlyEntreesCdf[m] = (monthlyEntreesCdf[m] || 0) + Number(e.montant_cdf || 0);
      monthlyEntreesUsd[m] = (monthlyEntreesUsd[m] || 0) + Number(e.montant_usd || 0);
    }

    for (const s of sorties) {
      const m = new Date(`${s.date}T00:00:00`).getMonth();
      monthlySortiesCdf[m] = (monthlySortiesCdf[m] || 0) + Number(s.montant_cdf || 0);
      monthlySortiesUsd[m] = (monthlySortiesUsd[m] || 0) + Number(s.montant_usd || 0);
    }

    for (const r of reversements) {
      const m = new Date(`${r.date_reversement}T00:00:00`).getMonth();
      monthlyReversementsCdf[m] = (monthlyReversementsCdf[m] || 0) + Number(r.montant_cdf || 0);
      monthlyReversementsUsd[m] = (monthlyReversementsUsd[m] || 0) + Number(r.montant_usd || 0);
    }

    return { monthlyEntreesCdf, monthlyEntreesUsd, monthlySortiesCdf, monthlySortiesUsd, monthlyReversementsCdf, monthlyReversementsUsd, entrees, reversements };
  }, [getEntrees, getSorties, getReversements]);

  const deleteAllEntrees = useCallback(() => execute('DELETE FROM entrees WHERE id > 0'), []);
  const deleteAllSorties = useCallback(() => execute('DELETE FROM sorties WHERE id > 0'), []);
  const deleteAllReversements = useCallback(() => execute('DELETE FROM reversements WHERE id > 0'), []);
  const deleteAllExercices = useCallback(() => execute('DELETE FROM exercices WHERE annee > 0'), []);
  const archiveExercice = useCallback((annee: number, totalEntrees: number, totalSorties: number, totalReversements: number, payload: string) =>
    execute('INSERT INTO exercices (annee, total_entrees, total_sorties, total_reversements, payload) VALUES (?, ?, ?, ?, ?)', [annee, totalEntrees, totalSorties, totalReversements, payload])
  , []);

  return { loading, error, addEntree, addSortie, addReversement, updateEntree, updateSortie, getEntrees, getSorties, getReversements, getAllEntrees, getAllSorties, getAllReversements, getExercice, getBalance, getMonthlyTotals, deleteAllEntrees, deleteAllSorties, deleteAllReversements, deleteAllExercices, archiveExercice };
}
