p='src/components/FuelManagement.tsx'
s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    assert s.count(a)==1,(a[:70],s.count(a)); s=s.replace(a,b)

rep("import { Link } from 'react-router-dom';\n","")
rep("import { getFuelPrice, fuelPricesFromSettings } from '../utils/fuelPrices';\n","")
rep("BarChart as BarChartIcon, CheckCircle2, Calendar,","BarChart as BarChartIcon, MapPin, Calendar,")
rep("const { vehicles, expenseRecords, appSettings, importExpenseRecords } = useVehicles();\n  const fuelPrices = fuelPricesFromSettings(appSettings);\n","const { vehicles, expenseRecords, importExpenseRecords } = useVehicles();\n")

# remplace le calcul réel vs théorique par la répartition par zone
a=s.index("    // Real vs Theoretical")
b=s.index("    // ── Évolution mensuelle des dépenses carburant ──")
new='''    // ── Répartition des consommations / zone de travail ──
    // La zone d'une dépense est celle du véhicule auquel elle est affectée (case « Zone de travail » de sa fiche).
    // Les zones qui ont des véhicules affectés mais aucune dépense carburant sur la période restent affichées (0 FCFA).
    const zoneOf = (v?: (typeof vehicles)[number]) => (v ? (v.zone_travail?.trim() || 'Non renseigné') : 'Véhicule inconnu');
    const zoneMap = new Map<string, { value: number; count: number; actifs: Set<string>; affectes: number }>();
    const zoneEntry = (z: string) => {
      let e = zoneMap.get(z);
      if (!e) { e = { value: 0, count: 0, actifs: new Set(), affectes: 0 }; zoneMap.set(z, e); }
      return e;
    };
    vehicles.forEach(v => { zoneEntry(zoneOf(v)).affectes += 1; });
    fuelExpenses.forEach(e => {
      const entry = zoneEntry(zoneOf(vehicleById.get(e.vehicleId)));
      entry.value += e.montant;
      entry.count += 1;
      entry.actifs.add(e.vehicleId);
    });
    const zoneData = Array.from(zoneMap.entries())
      .map(([name, x]) => ({
        name, value: x.value, count: x.count,
        affectes: x.affectes, actifs: x.actifs.size,
        moyenne: x.actifs.size > 0 ? Math.round(x.value / x.actifs.size) : 0,
      }))
      .sort((p, q) => q.value - p.value || p.name.localeCompare(q.name, 'fr'));

'''
s=s[:a]+new+s[b:]
rep("paymentData, vehicleData, comparisonData,","paymentData, vehicleData, zoneData,")
rep("  }, [fuelExpenses, vehicles, fuelPrices]);","  }, [fuelExpenses, vehicles]);")

# carte
a=s.index("        {/* Real vs Theoretical */}")
b=s.index("      {/* ── Répartition par énergie ── */}")
card='''        {/* Répartition des consommations / zone de travail */}
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <MapPin className="h-5 w-5 text-emerald-500" />
            Répartition des conso / zone de travail
          </h3>
          <p className="mb-4 text-[11px] text-slate-400">
            Dépenses carburant{(periodFrom || periodTo) ? ' de la période' : ''}, regroupées selon la case « Zone de travail » de chaque véhicule affecté
          </p>
          {stats.zoneData.length > 0 && stats.total > 0 ? (
            <div className="space-y-2" data-testid="fuel-by-zone">
              {(() => {
                const maxV = Math.max(...stats.zoneData.map(z => z.value), 1);
                return stats.zoneData.map(z => (
                  <div key={z.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded px-1 py-1 hover:bg-emerald-50 sm:flex-nowrap" title={`${z.name} : ${formatFCFA(z.value)} — ${z.count} plein(s)/dépense(s), ${z.actifs} véhicule(s) sur ${z.affectes} affecté(s)`}>
                    <span className="w-full flex-shrink-0 truncate text-xs font-medium text-slate-700 sm:w-[150px]">{z.name}</span>
                    <div className="h-[20px] min-w-[80px] flex-1 rounded bg-slate-100">
                      <div className="h-full rounded bg-emerald-500" style={{ width: `${z.value > 0 ? Math.max(3, (z.value / maxV) * 100) : 0}%` }} />
                    </div>
                    <span className="w-[110px] flex-shrink-0 text-right text-xs font-bold text-slate-800">{formatFCFA(z.value)}</span>
                    <span className="w-10 flex-shrink-0 text-right text-[11px] text-slate-500">{Math.round((z.value / stats.total) * 100)}%</span>
                    <span className="w-full flex-shrink-0 text-right text-[11px] text-slate-400 sm:w-[210px]">
                      {z.affectes} véhicule(s) affecté(s){z.actifs > 0 ? ` · ${formatFCFA(z.moyenne)} / véhicule` : ''}
                    </span>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Aucune dépense carburant enregistrée{(periodFrom || periodTo) ? ' sur cette période' : ''} pour répartir par zone de travail.</p>
          )}
          {stats.zoneData.some(z => z.name === 'Non renseigné' && z.value > 0) && (
            <p className="mt-3 text-[11px] italic text-slate-500">« Non renseigné » : véhicules dont la fiche n'indique pas de zone de travail — à compléter dans le menu Véhicules.</p>
          )}
        </div>
      </div>

'''
s=s[:a]+card+s[b:]
open(p,'w',encoding='utf-8').write(s)
