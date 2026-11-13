p='src/components/FuelManagement.tsx'
s=open(p,encoding='utf-8').read()
a=s.index("        {/* Répartition des consommations / zone de travail */}")
b=s.index("      {/* ── Répartition par énergie ── */}")
card='''        {/* Histogramme des consommations par centre (zone de travail) */}
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <MapPin className="h-5 w-5 text-emerald-500" />
            Consommations par centre (zone de travail)
          </h3>
          <p className="mb-4 text-[11px] text-slate-400">
            Dépenses carburant{(periodFrom || periodTo) ? ' de la période' : ''} de chaque centre, selon la case « Zone de travail » des véhicules qui lui sont affectés
          </p>
          {stats.total > 0 && stats.zoneData.length > 0 ? (
            <div className="h-96 w-full" data-testid="fuel-by-zone">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.zoneData} margin={{ top: 25, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#ecfdf5' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const z = payload[0].payload as (typeof stats.zoneData)[number];
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-md">
                          <p className="mb-1 font-bold text-slate-800">{z.name}</p>
                          <p>Consommation : <strong>{formatFCFA(z.value)}</strong> ({stats.total > 0 ? Math.round((z.value / stats.total) * 100) : 0}%)</p>
                          <p>{z.count} dépense(s) carburant</p>
                          <p>{z.affectes} véhicule(s) affecté(s) · {z.actifs} avec dépense</p>
                          {z.actifs > 0 && <p>Moyenne : {formatFCFA(z.moyenne)} / véhicule</p>}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" name="Consommation carburant" fill="#10b981" radius={[4, 4, 0, 0]}>
                    {stats.zoneData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    <LabelList dataKey="value" position="top" formatter={(v: any) => `${Math.round(Number(v) / 1000)}k`} style={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Aucune dépense carburant enregistrée{(periodFrom || periodTo) ? ' sur cette période' : ''} pour tracer l'histogramme par centre.</p>
          )}
          {stats.total > 0 && stats.zoneData.length > 0 && (
            <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
              <strong>Centre le plus consommateur :</strong> {stats.zoneData[0].name} — {formatFCFA(stats.zoneData[0].value)} ({Math.round((stats.zoneData[0].value / stats.total) * 100)}% du total), {stats.zoneData[0].affectes} véhicule(s) affecté(s).
              {stats.zoneData.some(z => z.name === 'Non renseigné' && z.value > 0) && <> « Non renseigné » regroupe les véhicules dont la fiche n'indique pas de zone de travail.</>}
            </div>
          )}
        </div>
      </div>

'''
s=s[:a]+card+s[b:]
open(p,'w',encoding='utf-8').write(s)
