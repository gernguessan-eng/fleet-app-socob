p='src/components/Pneumatique.tsx'
s=open(p,encoding='utf-8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a)); s=s.replace(a,b)

rep("""const POSITION_LABEL: Record<string, string> = {
  AVG: 'Avant Gauche', AVD: 'Avant Droit', ARG: 'Arrière Gauche', ARD: 'Arrière Droit', Secours: 'Secours',
};
""","""const POSITION_LABEL: Record<string, string> = {
  AVG: 'Avant Gauche', AVD: 'Avant Droit', ARG: 'Arrière Gauche', ARD: 'Arrière Droit', Secours: 'Secours',
};
const ETATS: PneumatiqueRecord['etat'][] = ['Bon', 'Usure modérée', 'À remplacer', 'Remplacé'];
const filterSelCls = 'mt-1 block w-full min-w-[110px] rounded border border-slate-300 bg-white px-1.5 py-1 text-[11px] font-normal normal-case tracking-normal text-slate-700 focus:border-emerald-500 focus:outline-none';
""")

rep("""  const [kmEnabled, setKmEnabled] = usePersistedState('fleetgest_filter_pneus_km_on', false);
""","""  const [kmEnabled, setKmEnabled] = usePersistedState('fleetgest_filter_pneus_km_on', false);
  // Filtres des colonnes « Position » et « État » du tableau ('' = toutes les valeurs)
  const [positionFilter, setPositionFilter] = usePersistedState('fleetgest_filter_pneus_position', '');
  const [etatFilter, setEtatFilter] = usePersistedState('fleetgest_filter_pneus_etat', '');
""")

rep("""      return matchSearch && matchFrom && matchTo && matchUsure && matchKm;
    }).sort(""","""      const matchPosition = !positionFilter || p.position === positionFilter;
      const matchEtat = !etatFilter || p.etat === etatFilter;
      return matchSearch && matchFrom && matchTo && matchUsure && matchKm && matchPosition && matchEtat;
    }).sort(""")
rep("usureEnabled, kmEnabled, seuil, sortOrder]);","usureEnabled, kmEnabled, seuil, sortOrder, positionFilter, etatFilter]);")

rep("  const noCriteria = !usureEnabled && !kmEnabled;\n","""  const noCriteria = !usureEnabled && !kmEnabled;
  const colFilterActive = !!positionFilter || !!etatFilter;
  const listeFiltree = !noCriteria || colFilterActive; // la liste affichée est restreinte (graphiques compris)
  // Effectifs par valeur (sur l'ensemble des pneus), affichés dans les listes de filtre
  const countByPosition = (pos: string) => pneusWithEtat.filter(x => x.position === pos).length;
  const countByEtat = (et: string) => pneusWithEtat.filter(x => x.etat === et).length;
""")

rep("""Répartition par état {!noCriteria && <span""","""Répartition par état {listeFiltree && <span""")
rep("""Coût par marque {!noCriteria && <span""","""Coût par marque {listeFiltree && <span""")
rep("{noCriteria ? 'Aucun pneu trouvé' :","{!listeFiltree ? 'Aucun pneu trouvé' :")

rep("""          <SortDateButton order={sortOrder} onToggle={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} label="Date de montage" />
        </div>""","""          <SortDateButton order={sortOrder} onToggle={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} label="Date de montage" />
          {colFilterActive && (
            <>
              <span className="text-xs text-slate-500">{filtered.length} pneu(s) affiché(s)</span>
              <button onClick={() => { setPositionFilter(''); setEtatFilter(''); }} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 print:hidden"><X className="h-3 w-3" /> Effacer les filtres Position / État</button>
            </>
          )}
        </div>""")

old="""                {['Véhicule', 'Position', 'Marque/Modèle', 'Dimension', 'Usure', 'Km parcourus', 'Coût', 'État', 'Action'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}"""
new="""                {['Véhicule', 'Position', 'Marque/Modèle', 'Dimension', 'Usure', 'Km parcourus', 'Coût', 'État', 'Action'].map(h => (
                  <th key={h} className="px-3 py-3 text-left align-top text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {h}
                    {h === 'Position' && (
                      <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)} onClick={e => e.stopPropagation()} title="Filtrer par position du pneu" aria-label="Filtrer par position" className={`${filterSelCls} print:hidden ${positionFilter ? 'border-emerald-500 bg-emerald-50' : ''}`}>
                        <option value="">Toutes</option>
                        {Object.entries(POSITION_LABEL).map(([k, label]) => <option key={k} value={k}>{label} ({countByPosition(k)})</option>)}
                      </select>
                    )}
                    {h === 'État' && (
                      <select value={etatFilter} onChange={e => setEtatFilter(e.target.value)} onClick={e => e.stopPropagation()} title="Filtrer par état du pneu" aria-label="Filtrer par état" className={`${filterSelCls} print:hidden ${etatFilter ? 'border-emerald-500 bg-emerald-50' : ''}`}>
                        <option value="">Tous</option>
                        {ETATS.map(et => <option key={et} value={et}>{et} ({countByEtat(et)})</option>)}
                      </select>
                    )}
                  </th>
                ))}"""
rep(old,new)
open(p,'w',encoding='utf-8').write(s)
