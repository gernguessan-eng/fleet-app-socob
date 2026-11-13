p='src/components/DriverManagement.tsx'
s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    assert s.count(a)==1,(a[:70],s.count(a)); s=s.replace(a,b)

rep("""  const tabs = [
    { id: 'chauffeurs' as const,""","""  // Recherche : porte sur toutes les rubriques de la fiche (identité, fonction, contacts, permis,
  // dates, véhicule affecté, statut, notes). Insensible aux accents et à la casse ; plusieurs mots =
  // tous doivent être trouvés (dans n'importe quelle rubrique). Dates cherchables en 25/03/2027 ou 2027-03-25.
  const driversFiltered = useMemo(() => {
    const fold = (t: string) => t.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
    const words = fold(search).split(/\\s+/).filter(Boolean);
    if (words.length === 0) return drivers;
    const frDate = (iso?: string) => { const m = /^(\\d{4})-(\\d{2})-(\\d{2})/.exec(iso || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };
    return drivers.filter(d => {
      const v = vehicleById.get(d.vehicule_affecte_id);
      const hay = fold([
        d.nom, d.prenom, d.prenom + ' ' + d.nom, d.fonction, d.telephone, (d.telephone || '').replace(/[\\s.\\-()]/g, ''), d.email,
        d.numero_permis, d.categorie_permis, d.date_expiration_permis, frDate(d.date_expiration_permis), d.date_embauche, frDate(d.date_embauche),
        d.statut, d.notes,
        v ? `${v.numero_immatriculation} ${v.marque} ${v.type_commercial}` : 'aucun vehicule',
      ].filter(Boolean).join(' | '));
      return words.every(w => hay.includes(w));
    });
  }, [drivers, search, vehicleById]);

  const tabs = [
    { id: 'chauffeurs' as const,""")

rep("""placeholder="Rechercher un chauffeur…" className""","""placeholder="Rechercher : nom, fonction, téléphone, e-mail, n° permis, véhicule, statut, notes…" className""")
rep("""            {drivers.filter(d => { const q = search.toLowerCase(); return !q || `${d.nom} ${d.prenom} ${d.telephone} ${d.email}`.toLowerCase().includes(q); }).map(d => {""","""            {search.trim() && (
              <p className="col-span-full text-xs text-slate-500 print:hidden">
                {driversFiltered.length === 0 ? 'Aucun chauffeur ne correspond à cette recherche.' : `${driversFiltered.length} chauffeur(s) trouvé(s) sur ${drivers.length}`}
              </p>
            )}
            {driversFiltered.map(d => {""")
open(p,'w',encoding='utf-8').write(s)
