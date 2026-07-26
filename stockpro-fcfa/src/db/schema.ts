import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// =========== ENUMS ===========
export const movementTypeEnum = pgEnum("movement_type", [
  "ENTREE",
  "SORTIE",
  "INVENTAIRE",
]);

export const exitReasonEnum = pgEnum("exit_reason", [
  "VENTE",
  "PRODUCTION",
  "REBUT",
  "PERTE",
  "RETOUR_CLIENT",
  "TRANSFERT",
  "SORTIE_ATELIER",
  "AUTRE",
]);

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "USER"]);

// =========== UTILISATEURS ===========
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("USER"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =========== CATEGORIES ===========
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 120 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =========== FOURNISSEURS ===========
export const fournisseurs = pgTable("fournisseurs", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 180 }).notNull(),
  contact: varchar("contact", { length: 180 }),
  email: varchar("email", { length: 180 }),
  telephone: varchar("telephone", { length: 60 }),
  adresse: text("adresse"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =========== ARTICLES (Pièces) ===========
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  codeArticle: varchar("code_article", { length: 60 }).notNull().unique(),
  reference: varchar("reference", { length: 120 }).notNull(),
  designation: varchar("designation", { length: 255 }).notNull(),
  categorieId: integer("categorie_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  unite: varchar("unite", { length: 20 }).notNull().default("U"),
  stockActuel: integer("stock_actuel").notNull().default(0),
  stockMin: integer("stock_min").notNull().default(0),
  stockMax: integer("stock_max").notNull().default(0),
  prixAchat: numeric("prix_achat", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  prixVente: numeric("prix_vente", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  emplacement: varchar("emplacement", { length: 120 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

// =========== MOUVEMENTS DE STOCK ===========
export const mouvements = pgTable("mouvements", {
  id: serial("id").primaryKey(),
  type: movementTypeEnum("type").notNull(),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  quantite: integer("quantite").notNull(),
  dateMouvement: timestamp("date_mouvement").notNull().defaultNow(),
  // Champs pour les entrées
  fournisseurId: integer("fournisseur_id").references(() => fournisseurs.id, {
    onDelete: "set null",
  }),
  numeroBon: varchar("numero_bon", { length: 80 }),
  prixUnitaire: numeric("prix_unitaire", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  // Champs pour les sorties
  motif: exitReasonEnum("motif"),
  destination: varchar("destination", { length: 180 }),
  vehicule: varchar("vehicule", { length: 120 }),
  // Champs communs
  reference: varchar("reference", { length: 120 }),
  observations: text("observations"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =========== INVENTAIRES (Campagnes) ===========
export const inventaires = pgTable("inventaires", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 180 }).notNull(),
  dateInventaire: timestamp("date_inventaire").notNull().defaultNow(),
  observations: text("observations"),
  valide: boolean("valide").notNull().default(false),
  valideAt: timestamp("valide_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inventaireLignes = pgTable("inventaire_lignes", {
  id: serial("id").primaryKey(),
  inventaireId: integer("inventaire_id")
    .notNull()
    .references(() => inventaires.id, { onDelete: "cascade" }),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  stockTheorique: integer("stock_theorique").notNull().default(0),
  stockCompte: integer("stock_compte"),
  ecart: integer("ecart"),
  observations: text("observations"),
});

// Export types
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Mouvement = typeof mouvements.$inferSelect;
export type NewMouvement = typeof mouvements.$inferInsert;
export type Fournisseur = typeof fournisseurs.$inferSelect;
export type NewFournisseur = typeof fournisseurs.$inferInsert;
export type Categorie = typeof categories.$inferSelect;
export type NewCategorie = typeof categories.$inferInsert;
export type Inventaire = typeof inventaires.$inferSelect;
export type NewInventaire = typeof inventaires.$inferInsert;
export type InventaireLigne = typeof inventaireLignes.$inferSelect;
export type NewInventaireLigne = typeof inventaireLignes.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
