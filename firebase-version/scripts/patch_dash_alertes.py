p='src/components/Dashboard.tsx'
s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    assert s.count(a)==1,(a[:70],s.count(a)); s=s.replace(a,b)
rep("import KpiModal from './KpiModal';","import KpiModal from './KpiModal';\nimport CardActions from './CardActions';")
# Alertes entretiens
rep("""<div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Alertes entretiens') ? 'print:hidden' : ''}`}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800"><Wrench className="h-5 w-5 text-amber-500" />Alertes entretiens</h3>""",
"""<div data-print-card className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Alertes entretiens') ? 'print:hidden' : ''}`}>
        <h3 data-xl-name="Alertes entretiens" className="mb-4 flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-800"><Wrench className="h-5 w-5 text-amber-500" />Alertes entretiens
          {maintenanceAlerts.length > 0 && <CardActions className="ml-auto" title="Alertes entretiens" subtitle={`${maintenanceAlerts.length} véhicule(s) concerné(s) · ${maintenanceAlerts.filter(a => a.forecast.alertLevel === 'critical').length} urgent(s)`} />}
        </h3>""")
rep("""<div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Alertes échéances') ? 'print:hidden' : ''}`}>
        <h3 className="mb-4 flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-800"><Calendar className="h-5 w-5 text-amber-500" />Alertes échéances
          {echeanceRows.length > 0 && (
            <span className="ml-auto flex gap-2 text-xs font-medium">
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-red-700">{echeanceRows.filter(r => r.days < 0).length} échue(s)</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-700">{echeanceRows.filter(r => r.days >= 0).length} à venir (30 j)</span>
            </span>
          )}""",
"""<div data-print-card className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Alertes échéances') ? 'print:hidden' : ''}`}>
        <h3 data-xl-name="Alertes échéances" className="mb-4 flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-800"><Calendar className="h-5 w-5 text-amber-500" />Alertes échéances
          {echeanceRows.length > 0 && (
            <span className="ml-auto flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-red-700">{echeanceRows.filter(r => r.days < 0).length} échue(s)</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-700">{echeanceRows.filter(r => r.days >= 0).length} à venir (30 j)</span>
              <CardActions title="Alertes échéances" subtitle={`${echeanceRows.filter(r => r.days < 0).length} échue(s) · ${echeanceRows.filter(r => r.days >= 0).length} à venir (30 j)`} />
            </span>
          )}""")
open(p,'w',encoding='utf-8').write(s)
