import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Settings as SettingsIcon, Lock, Church, Calendar, RefreshCw, CheckCircle2, Trash2 } from 'lucide-react';
import type { Config } from '@/types';
import { useConfig } from '@/hooks/useConfig';
import { useFinance } from '@/hooks/useFinance';
import { execute } from '@/lib/database';

interface SettingsPageProps { config: Config; onBack: () => void; onConfigChange: () => void; }

export function SettingsPage({ config, onBack, onConfigChange }: SettingsPageProps) {
  const { updateConfig } = useConfig();
  const { getAllEntrees, getAllSorties, getAllReversements, deleteAllEntrees, deleteAllSorties, deleteAllReversements, deleteAllExercices, archiveExercice } = useFinance();
  const [nomCommunaute, setNomCommunaute] = useState(config.nom_communaute);
  const [paroisse, setParoisse] = useState(config.paroisse);
  const [mdpAcces, setMdpAcces] = useState(config.mdp_acces);
  const [mdpSortie, setMdpSortie] = useState(config.mdp_sortie);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newYear, setNewYear] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); setError(null); const { error: err } = await updateConfig({ nom_communaute: nomCommunaute, paroisse, mdp_acces: mdpAcces, mdp_sortie: mdpSortie }); setSaving(false); if (err) { setError(err); return; } setSaved(true); setTimeout(() => setSaved(false), 3000); onConfigChange(); };

  const handleNewExercice = async () => {
    const today = new Date();
    if (today.getMonth() !== 11 || (today.getDate() !== 30 && today.getDate() !== 31)) {
      setError('Vous n’avez pas encore fini l’année. Veuillez réessayer fin décembre.');
      return;
    }
    setSaving(true); setError(null);
    const year = config.exercice_en_cours;
    const [entrees, sorties, reversements] = await Promise.all([getAllEntrees(), getAllSorties(), getAllReversements()]);
    const totalEntrees = entrees.reduce((s, e) => s + e.montant_cdf + e.montant_usd, 0);
    const totalSorties = sorties.reduce((s, x) => s + x.montant_cdf + x.montant_usd, 0);
    const totalRev = reversements.reduce((s, r) => s + r.montant_cdf + r.montant_usd, 0);
    await archiveExercice(year, totalEntrees, totalSorties, totalRev, JSON.stringify({ entrees, sorties, reversements }));
    await Promise.all([deleteAllEntrees(), deleteAllSorties(), deleteAllReversements()]);
    await updateConfig({ exercice_en_cours: year + 1 });
    setSaving(false); setNewYear(true); onConfigChange(); setTimeout(() => setNewYear(false), 3000);
  };

  // actual reset implementation (called after confirmation)
  const performResetAll = async () => {
    setShowResetConfirm(false);
    setSaving(true);
    setError(null);
    try {
      await Promise.all([deleteAllEntrees(), deleteAllSorties(), deleteAllReversements(), deleteAllExercices()]);
      await updateConfig({
        nom_communaute: 'ÉGLISE GLOIRE DE DIEU',
        paroisse: 'PAROISSE DE KYESHERO',
        mdp_acces: 'admin123',
        mdp_sortie: 'sortie123',
        exercice_en_cours: 2026,
        taux_usd_cdf: 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onConfigChange();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6"><button onClick={onBack} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600" /></button><h1 className="text-2xl font-bold text-gray-800">Paramètres</h1></div>
      {saved && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 mb-4 animate-[fadeIn_0.3s_ease]"><CheckCircle2 className="w-5 h-5" /> Réinitialisation effectuée avec succès.</div>}
      {newYear && <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center gap-2 mb-4 animate-[fadeIn_0.3s_ease]"><CheckCircle2 className="w-5 h-5" /> Nouvel exercice démarré.</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100"><SettingsIcon className="w-5 h-5 text-gray-600" /><h2 className="font-bold text-gray-800">Configuration générale</h2></div>
        <div><label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Church className="w-4 h-4 text-gray-500" /> Nom de la communauté</label><input type="text" value={nomCommunaute} onChange={(e) => setNomCommunaute(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
        <div><label className="text-sm font-medium text-gray-700 mb-2 block">Paroisse locale</label><input type="text" value={paroisse} onChange={(e) => setParoisse(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">CDF et USD sont deux caisses indépendantes. Aucun taux de change ni conversion n'est utilisé.</div>
        <div><label className="text-sm font-medium text-gray-700 mb-2 block">Exercice en cours</label><div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50"><Calendar className="w-4 h-4 text-gray-500" /><span>{config.exercice_en_cours}</span></div></div>
        <div className="pt-3 border-t border-gray-100"><div className="flex items-center gap-2 mb-4"><Lock className="w-5 h-5 text-gray-600" /><h2 className="font-bold text-gray-800">Sécurité</h2></div><div className="grid gap-4">
          <div><label className="text-sm font-medium text-gray-700 mb-2 block">Mot de passe d'accès</label><input type="text" value={mdpAcces} onChange={(e) => setMdpAcces(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
          <div><label className="text-sm font-medium text-gray-700 mb-2 block">Mot de passe des sorties</label><input type="text" value={mdpSortie} onChange={(e) => setMdpSortie(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
        </div></div>
        <button type="submit" disabled={saving} className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
      </form>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-4"><div className="flex items-center gap-2 mb-3"><RefreshCw className="w-5 h-5 text-amber-600" /><h2 className="font-bold text-amber-800">Nouvel exercice</h2></div><p className="text-sm text-amber-800 mb-4">Archive l’exercice actuel et démarre un nouveau cycle financier.</p><button onClick={handleNewExercice} disabled={saving} className="w-full py-3 px-6 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-xl">Démarrer un nouvel exercice</button></div>
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mt-4"><div className="flex items-center gap-2 mb-3"><Trash2 className="w-5 h-5 text-red-600" /><h2 className="font-bold text-red-800">Réinitialisation complète</h2></div><p className="text-sm text-red-700 mb-4">Cette action supprime toutes les entrées, sorties, reversements et archives, puis remet les paramètres par défaut.</p><button onClick={() => setShowResetConfirm(true)} disabled={saving} className="w-full py-3 px-6 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl">Tout remettre à 0</button></div>

      {/* Confirmation modal (custom) */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-lg max-w-md w-full p-6 z-10">
            <h3 className="text-lg font-semibold mb-3">Confirmer la réinitialisation</h3>
            <p className="text-sm text-gray-700 mb-6">Voulez-vous réellement tout remettre à 0 ? Cette action est irréversible.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 rounded-xl border border-gray-200">Non</button>
              <button onClick={performResetAll} className="px-4 py-2 rounded-xl bg-red-600 text-white">Oui, tout remettre à 0</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
