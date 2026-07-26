CREATE TYPE "public"."exit_reason" AS ENUM('VENTE', 'PRODUCTION', 'REBUT', 'PERTE', 'RETOUR_CLIENT', 'TRANSFERT', 'AUTRE');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('ENTREE', 'SORTIE', 'INVENTAIRE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'USER');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_article" varchar(60) NOT NULL,
	"reference" varchar(120) NOT NULL,
	"designation" varchar(255) NOT NULL,
	"categorie_id" integer,
	"unite" varchar(20) DEFAULT 'U' NOT NULL,
	"stock_actuel" integer DEFAULT 0 NOT NULL,
	"stock_min" integer DEFAULT 0 NOT NULL,
	"stock_max" integer DEFAULT 0 NOT NULL,
	"prix_achat" numeric(12, 2) DEFAULT '0' NOT NULL,
	"prix_vente" numeric(12, 2) DEFAULT '0' NOT NULL,
	"emplacement" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "articles_code_article_unique" UNIQUE("code_article")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(120) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "fournisseurs" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(180) NOT NULL,
	"contact" varchar(180),
	"email" varchar(180),
	"telephone" varchar(60),
	"adresse" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventaire_lignes" (
	"id" serial PRIMARY KEY NOT NULL,
	"inventaire_id" integer NOT NULL,
	"article_id" integer NOT NULL,
	"stock_theorique" integer DEFAULT 0 NOT NULL,
	"stock_compte" integer,
	"ecart" integer,
	"observations" text
);
--> statement-breakpoint
CREATE TABLE "inventaires" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(180) NOT NULL,
	"date_inventaire" timestamp DEFAULT now() NOT NULL,
	"observations" text,
	"valide" boolean DEFAULT false NOT NULL,
	"valide_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mouvements" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "movement_type" NOT NULL,
	"article_id" integer NOT NULL,
	"quantite" integer NOT NULL,
	"date_mouvement" timestamp DEFAULT now() NOT NULL,
	"fournisseur_id" integer,
	"numero_bon" varchar(80),
	"prix_unitaire" numeric(12, 2) DEFAULT '0' NOT NULL,
	"motif" "exit_reason",
	"destination" varchar(180),
	"reference" varchar(120),
	"observations" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(180) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_categorie_id_categories_id_fk" FOREIGN KEY ("categorie_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventaire_lignes" ADD CONSTRAINT "inventaire_lignes_inventaire_id_inventaires_id_fk" FOREIGN KEY ("inventaire_id") REFERENCES "public"."inventaires"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventaire_lignes" ADD CONSTRAINT "inventaire_lignes_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mouvements" ADD CONSTRAINT "mouvements_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mouvements" ADD CONSTRAINT "mouvements_fournisseur_id_fournisseurs_id_fk" FOREIGN KEY ("fournisseur_id") REFERENCES "public"."fournisseurs"("id") ON DELETE set null ON UPDATE no action;