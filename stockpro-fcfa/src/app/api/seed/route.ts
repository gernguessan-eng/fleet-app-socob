import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  articles,
  categories,
  fournisseurs,
  mouvements,
  inventaires,
  inventaireLignes,
} from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Clean
    await db.delete(inventaireLignes);
    await db.delete(inventaires);
    await db.delete(mouvements);
    await db.delete(articles);
    await db.delete(fournisseurs);
    await db.delete(categories);

    // Categories
    const [catMecanique] = await db
      .insert(categories)
      .values({ nom: "Pièces mécaniques", description: "Pièces de mécanique générale" })
      .returning();
    const [catElectrique] = await db
      .insert(categories)
      .values({ nom: "Composants électriques", description: "Moteurs, variateurs, capteurs" })
      .returning();
    const [catHydraulique] = await db
      .insert(categories)
      .values({ nom: "Hydraulique", description: "Vérins, flexibles, raccords" })
      .returning();
    const [catConsommable] = await db
      .insert(categories)
      .values({ nom: "Consommables", description: "Lubrifiants, joints, filtres" })
      .returning();

    // Fournisseurs
    const [f1] = await db
      .insert(fournisseurs)
      .values({
        nom: "TechniParts Industrie",
        contact: "M. Dupont",
        email: "contact@techniparts.fr",
        telephone: "+33 1 23 45 67 89",
        adresse: "12 rue de l'Industrie, 75019 Paris",
      })
      .returning();
    const [f2] = await db
      .insert(fournisseurs)
      .values({
        nom: "HydrauPro",
        contact: "Mme Martin",
        email: "info@hydraupro.fr",
        telephone: "+33 4 78 90 12 34",
        adresse: "5 avenue Lyon, 69003 Lyon",
      })
      .returning();
    const [f3] = await db
      .insert(fournisseurs)
      .values({
        nom: "ElectroSupply",
        contact: "M. Bernard",
        email: "sales@electrosupply.fr",
        telephone: "+33 5 56 78 90 12",
        adresse: "8 zone industrielle, 33000 Bordeaux",
      })
      .returning();

    // Articles
    const articlesData = [
      { code: "ART-001", ref: "RBR-6204", des: "Roulement à billes 6204", cat: catMecanique.id, stock: 48, min: 20, max: 200, prixAchat: "8.50", prixVente: "15.00", emp: "A1-03" },
      { code: "ART-002", ref: "RBR-6206", des: "Roulement à billes 6206", cat: catMecanique.id, stock: 12, min: 15, max: 150, prixAchat: "12.30", prixVente: "22.00", emp: "A1-04" },
      { code: "ART-003", ref: "ENR-M8-20", des: "Engrenage droit M8 20 dents", cat: catMecanique.id, stock: 35, min: 10, max: 80, prixAchat: "24.00", prixVente: "45.00", emp: "A2-01" },
      { code: "ART-004", ref: "CRA-10x40", des: "Courroie trapézoïdale 10x40", cat: catMecanique.id, stock: 75, min: 30, max: 200, prixAchat: "5.20", prixVente: "10.00", emp: "A2-05" },
      { code: "ART-005", ref: "MOT-1.5KW", des: "Moteur électrique 1.5 kW", cat: catElectrique.id, stock: 6, min: 5, max: 30, prixAchat: "180.00", prixVente: "320.00", emp: "B1-01" },
      { code: "ART-006", ref: "CAP-IND", des: "Capteur inductif M18", cat: catElectrique.id, stock: 22, min: 10, max: 100, prixAchat: "32.00", prixVente: "58.00", emp: "B1-08" },
      { code: "ART-007", ref: "VAR-0.75", des: "Variateur de fréquence 0.75 kW", cat: catElectrique.id, stock: 4, min: 5, max: 25, prixAchat: "220.00", prixVente: "380.00", emp: "B2-02" },
      { code: "ART-008", ref: "VER-50x100", des: "Vérin hydraulique 50x100", cat: catHydraulique.id, stock: 9, min: 5, max: 40, prixAchat: "145.00", prixVente: "260.00", emp: "C1-01" },
      { code: "ART-009", ref: "FLEX-1/4", des: "Flexible hydraulique 1/4 pouce", cat: catHydraulique.id, stock: 120, min: 50, max: 300, prixAchat: "6.50", prixVente: "12.50", emp: "C1-10" },
      { code: "ART-010", ref: "RAC-JIC-08", des: "Raccord JIC 08", cat: catHydraulique.id, stock: 200, min: 100, max: 500, prixAchat: "3.20", prixVente: "6.50", emp: "C2-03" },
      { code: "ART-011", ref: "HUI-ISO46", des: "Huile hydraulique ISO 46 (5L)", cat: catConsommable.id, stock: 18, min: 10, max: 60, prixAchat: "28.00", prixVente: "48.00", emp: "D1-01" },
      { code: "ART-012", ref: "JNT-TOR-30", des: "Joint torique 30 mm", cat: catConsommable.id, stock: 350, min: 200, max: 1000, prixAchat: "0.40", prixVente: "1.20", emp: "D2-02" },
      { code: "ART-013", ref: "FIL-AIR", des: "Filtre à air", cat: catConsommable.id, stock: 8, min: 15, max: 80, prixAchat: "18.00", prixVente: "32.00", emp: "D2-05" },
      { code: "ART-014", ref: "GRA-LIT-1", des: "Graisse au lithium 1 kg", cat: catConsommable.id, stock: 25, min: 12, max: 60, prixAchat: "9.50", prixVente: "17.00", emp: "D1-04" },
    ];

    const insertedArticles = await db
      .insert(articles)
      .values(
        articlesData.map((a) => ({
          codeArticle: a.code,
          reference: a.ref,
          designation: a.des,
          categorieId: a.cat,
          unite: "U",
          stockActuel: a.stock,
          stockMin: a.min,
          stockMax: a.max,
          prixAchat: a.prixAchat,
          prixVente: a.prixVente,
          emplacement: a.emp,
        })),
      )
      .returning();

    // Mouvements - sample data over last 60 days
    const now = new Date();
    const movements: Array<{
      type: "ENTREE" | "SORTIE" | "INVENTAIRE";
      articleId: number;
      quantite: number;
      daysAgo: number;
      fournisseurId?: number;
      motif?: "VENTE" | "PRODUCTION" | "REBUT" | "PERTE" | "RETOUR_CLIENT" | "TRANSFERT" | "AUTRE";
      destination?: string;
      numeroBon?: string;
      prixUnitaire?: string;
      reference?: string;
      observations?: string;
    }> = [
      // Entrees
      { type: "ENTREE", articleId: insertedArticles[0].id, quantite: 50, daysAgo: 45, fournisseurId: f1.id, numeroBon: "BL-2024-001", prixUnitaire: "8.50" },
      { type: "ENTREE", articleId: insertedArticles[0].id, quantite: 30, daysAgo: 10, fournisseurId: f1.id, numeroBon: "BL-2024-018", prixUnitaire: "8.50" },
      { type: "ENTREE", articleId: insertedArticles[1].id, quantite: 20, daysAgo: 30, fournisseurId: f1.id, numeroBon: "BL-2024-005", prixUnitaire: "12.30" },
      { type: "ENTREE", articleId: insertedArticles[4].id, quantite: 5, daysAgo: 25, fournisseurId: f3.id, numeroBon: "BL-2024-008", prixUnitaire: "180.00" },
      { type: "ENTREE", articleId: insertedArticles[5].id, quantite: 30, daysAgo: 50, fournisseurId: f3.id, numeroBon: "BL-2024-002", prixUnitaire: "32.00" },
      { type: "ENTREE", articleId: insertedArticles[7].id, quantite: 10, daysAgo: 20, fournisseurId: f2.id, numeroBon: "BL-2024-012", prixUnitaire: "145.00" },
      { type: "ENTREE", articleId: insertedArticles[8].id, quantite: 100, daysAgo: 15, fournisseurId: f2.id, numeroBon: "BL-2024-015", prixUnitaire: "6.50" },
      { type: "ENTREE", articleId: insertedArticles[9].id, quantite: 200, daysAgo: 8, fournisseurId: f2.id, numeroBon: "BL-2024-020", prixUnitaire: "3.20" },
      { type: "ENTREE", articleId: insertedArticles[10].id, quantite: 20, daysAgo: 5, fournisseurId: f1.id, numeroBon: "BL-2024-022", prixUnitaire: "28.00" },
      { type: "ENTREE", articleId: insertedArticles[12].id, quantite: 15, daysAgo: 35, fournisseurId: f1.id, numeroBon: "BL-2024-006", prixUnitaire: "18.00" },

      // Sorties
      { type: "SORTIE", articleId: insertedArticles[0].id, quantite: 8, daysAgo: 38, motif: "PRODUCTION", destination: "Atelier A", reference: "OF-2024-101" },
      { type: "SORTIE", articleId: insertedArticles[0].id, quantite: 12, daysAgo: 18, motif: "PRODUCTION", destination: "Atelier A", reference: "OF-2024-115" },
      { type: "SORTIE", articleId: insertedArticles[0].id, quantite: 5, daysAgo: 3, motif: "VENTE", destination: "Client Durand", reference: "BL-CLT-552" },
      { type: "SORTIE", articleId: insertedArticles[1].id, quantite: 4, daysAgo: 22, motif: "PRODUCTION", destination: "Atelier B", reference: "OF-2024-108" },
      { type: "SORTIE", articleId: insertedArticles[1].id, quantite: 3, daysAgo: 6, motif: "REBUT", observations: "Pièces endommagées" },
      { type: "SORTIE", articleId: insertedArticles[2].id, quantite: 5, daysAgo: 28, motif: "VENTE", destination: "Client Martin", reference: "BL-CLT-540" },
      { type: "SORTIE", articleId: insertedArticles[2].id, quantite: 2, daysAgo: 7, motif: "PRODUCTION", destination: "Atelier A", reference: "OF-2024-120" },
      { type: "SORTIE", articleId: insertedArticles[3].id, quantite: 25, daysAgo: 12, motif: "PRODUCTION", destination: "Atelier C", reference: "OF-2024-118" },
      { type: "SORTIE", articleId: insertedArticles[4].id, quantite: 1, daysAgo: 9, motif: "VENTE", destination: "Client Petit", reference: "BL-CLT-548" },
      { type: "SORTIE", articleId: insertedArticles[4].id, quantite: 1, daysAgo: 2, motif: "PRODUCTION", destination: "Atelier A", reference: "OF-2024-125" },
      { type: "SORTIE", articleId: insertedArticles[5].id, quantite: 4, daysAgo: 14, motif: "PRODUCTION", destination: "Atelier B", reference: "OF-2024-119" },
      { type: "SORTIE", articleId: insertedArticles[5].id, quantite: 2, daysAgo: 1, motif: "REBUT" },
      { type: "SORTIE", articleId: insertedArticles[6].id, quantite: 1, daysAgo: 4, motif: "VENTE", destination: "Client Robert", reference: "BL-CLT-553" },
      { type: "SORTIE", articleId: insertedArticles[7].id, quantite: 1, daysAgo: 11, motif: "VENTE", destination: "Client Lopez", reference: "BL-CLT-550" },
      { type: "SORTIE", articleId: insertedArticles[8].id, quantite: 20, daysAgo: 13, motif: "PRODUCTION", destination: "Atelier A", reference: "OF-2024-118" },
      { type: "SORTIE", articleId: insertedArticles[8].id, quantite: 15, daysAgo: 5, motif: "TRANSFERT", destination: "Site Lyon" },
      { type: "SORTIE", articleId: insertedArticles[9].id, quantite: 50, daysAgo: 4, motif: "PRODUCTION", destination: "Atelier C", reference: "OF-2024-124" },
      { type: "SORTIE", articleId: insertedArticles[10].id, quantite: 2, daysAgo: 16, motif: "PRODUCTION", destination: "Atelier A" },
      { type: "SORTIE", articleId: insertedArticles[11].id, quantite: 80, daysAgo: 8, motif: "PRODUCTION", destination: "Atelier B" },
      { type: "SORTIE", articleId: insertedArticles[12].id, quantite: 4, daysAgo: 19, motif: "REBUT", observations: "Filtres périmés" },
      { type: "SORTIE", articleId: insertedArticles[12].id, quantite: 3, daysAgo: 2, motif: "PRODUCTION", destination: "Atelier C" },
      { type: "SORTIE", articleId: insertedArticles[13].id, quantite: 5, daysAgo: 21, motif: "PRODUCTION", destination: "Atelier A" },
      { type: "SORTIE", articleId: insertedArticles[13].id, quantite: 2, daysAgo: 9, motif: "PERTE", observations: "Vol signalé" },
    ];

    for (const m of movements) {
      const date = new Date(now);
      date.setDate(date.getDate() - m.daysAgo);
      await db.insert(mouvements).values({
        type: m.type,
        articleId: m.articleId,
        quantite: m.quantite,
        dateMouvement: date,
        fournisseurId: m.fournisseurId,
        motif: m.motif,
        destination: m.destination,
        numeroBon: m.numeroBon,
        prixUnitaire: m.prixUnitaire ?? "0",
        reference: m.reference,
        observations: m.observations,
      });
    }

    // Inventaire campaign
    const [inv] = await db
      .insert(inventaires)
      .values({
        nom: "Inventaire annuel 2024",
        dateInventaire: new Date(now.getFullYear(), 11, 31),
        observations: "Inventaire de fin d'année",
      })
      .returning();

    await db.insert(inventaireLignes).values(
      insertedArticles.slice(0, 6).map((a, i) => ({
        inventaireId: inv.id,
        articleId: a.id,
        stockTheorique: a.stockActuel,
        stockCompte: a.stockActuel - (i % 3 === 0 ? 2 : 0),
        ecart: i % 3 === 0 ? -2 : 0,
        observations: i % 3 === 0 ? "Écart constaté" : null,
      })),
    );

    return NextResponse.json({ ok: true, message: "Base de données initialisée" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
