export const DEMO_CLIENT_EMAILS = [
  'demo.client1@qemplois.ca',
  'demo.client2@qemplois.ca',
] as const;

export type DemoJobTemplate = {
  title: string;
  description: string;
  serviceType: string;
  address: string;
  city: string;
  postalCode: string;
  price: number;
  estimatedDuration?: number;
};

/** Rotating marketplace listings — one set shown every rotation period. */
export const DEMO_JOB_ROTATIONS: DemoJobTemplate[][] = [
  // Set A — spring / general home services
  [
    { title: 'Ménage printemps 3½', description: 'Nettoyage complet d\'un 3½ à Rosemont.', serviceType: 'menage', address: '1230 Rue Beaubien E', city: 'Montréal', postalCode: 'H2S 1T7', price: 120 },
    { title: 'Déménagement studio', description: 'Aide pour déménager un studio (2e étage sans ascenseur).', serviceType: 'demenagement', address: '4500 Rue Saint-Denis', city: 'Montréal', postalCode: 'H2J 2L3', price: 180 },
    { title: 'Montage IKEA', description: 'Montage d\'un lit et d\'une commode IKEA.', serviceType: 'montage_meubles', address: '7890 Boul. Décarie', city: 'Montréal', postalCode: 'H4P 1H5', price: 95 },
    { title: 'Nettoyage après rénovation', description: 'Poussière et débris après petite rénovation de cuisine.', serviceType: 'nettoyage', address: '2100 Rue Ontario E', city: 'Montréal', postalCode: 'H2K 1V2', price: 150 },
    { title: 'Tonte de pelouse', description: 'Pelouse moyenne, équipement sur place.', serviceType: 'jardinage', address: '5600 Av. du Parc', city: 'Montréal', postalCode: 'H2V 4H1', price: 60 },
    { title: 'Livraison meubles Kijiji', description: 'Ramasser un canapé et livrer à Verdun.', serviceType: 'livraison', address: '3900 Rue Wellington', city: 'Verdun', postalCode: 'H4G 1V3', price: 75 },
    { title: 'Aide ménage hebdo', description: '2h de ménage régulier.', serviceType: 'menage', address: '1200 Rue Sherbrooke O', city: 'Montréal', postalCode: 'H3A 1H6', price: 70 },
    { title: 'Courses et livraison', description: 'Faire l\'épicerie et livrer chez une personne âgée.', serviceType: 'coursier', address: '1500 Boul. René-Lévesque', city: 'Montréal', postalCode: 'H3G 1T7', price: 35 },
  ],
  // Set B — summer outdoor & moving
  [
    { title: 'Nettoyage de galerie', description: 'Laver plancher et rampes d\'une galerie arrière à Plateau.', serviceType: 'nettoyage', address: '4518 Rue Saint-André', city: 'Montréal', postalCode: 'H2J 3A9', price: 85 },
    { title: 'Transport frigo', description: 'Descendre un frigo au sous-sol (2 personnes).', serviceType: 'demenagement', address: '2200 Rue Fullum', city: 'Montréal', postalCode: 'H2K 3P7', price: 110 },
    { title: 'Montage bureau télétravail', description: 'Bureau assis-debout + étagère murale.', serviceType: 'montage_meubles', address: '5050 Boul. des Galeries', city: 'Québec', postalCode: 'G2K 0H5', price: 130 },
    { title: 'Taille de haie', description: 'Haie de cèdres, environ 12 mètres.', serviceType: 'jardinage', address: '1800 Rue Provost', city: 'Laval', postalCode: 'H7S 1X8', price: 90 },
    { title: 'Ménage avant location', description: '4½ à préparer pour nouveaux locataires.', serviceType: 'menage', address: '3500 Rue Jeanne-Mance', city: 'Montréal', postalCode: 'H2X 2J5', price: 160 },
    { title: 'Livraison matériel jardin', description: 'Sacs de terre du centre-jardin → cour arrière.', serviceType: 'livraison', address: '890 Rue Saint-Jean', city: 'Longueuil', postalCode: 'J4H 2Y8', price: 55 },
    { title: 'Aide préparation garage sale', description: 'Trier, étiqueter et installer tables dans garage.', serviceType: 'manutention', address: '6400 Boul. Gouin O', city: 'Montréal', postalCode: 'H4K 2E2', price: 80 },
    { title: 'Installation rideaux', description: 'Perçage et installation de 6 rideaux.', serviceType: 'montage_meubles', address: '1455 Rue Peel', city: 'Montréal', postalCode: 'H3A 1T5', price: 65 },
  ],
  // Set C — Rive-Sud & errands
  [
    { title: 'Déménagement 4½ Brossard', description: 'Camion 20 pi, 2e étage avec ascenseur.', serviceType: 'demenagement', address: '1000 Av. du Quartier', city: 'Brossard', postalCode: 'J4Z 0A5', price: 220 },
    { title: 'Ménage condo', description: 'Condo 2 chambres, surfaces et salle de bain.', serviceType: 'menage', address: '300 Rue de la Commune O', city: 'Montréal', postalCode: 'H2Y 2E1', price: 100 },
    { title: 'Ramassage branches', description: 'Branches coupées à emporter au écocentre.', serviceType: 'jardinage', address: '4200 Rue Ontario E', city: 'Montréal', postalCode: 'H1V 1K7', price: 70 },
    { title: 'Livraison colis IKEA', description: '2 colis lourds du centre-ville à Pointe-Claire.', serviceType: 'livraison', address: '50 Av. Donegani', city: 'Pointe-Claire', postalCode: 'H9R 2W3', price: 95 },
    { title: 'Nettoyage fenêtres', description: 'Fenêtres intérieur/extérieur, rez-de-chaussée.', serviceType: 'nettoyage', address: '7800 Boul. Lacordaire', city: 'Montréal', postalCode: 'H1K 2X8', price: 75 },
    { title: 'Montage BBQ et patio', description: 'Assembler BBQ et table patio (déjà livrés).', serviceType: 'montage_meubles', address: '1100 Rue Notre-Dame', city: 'Repentigny', postalCode: 'J6A 5K1', price: 85 },
    { title: 'Courses pharmacie', description: 'Ramasser ordonnance et quelques articles.', serviceType: 'coursier', address: '2000 Rue Parthenais', city: 'Montréal', postalCode: 'H2K 3T3', price: 25 },
    { title: 'Aide rangement sous-sol', description: 'Boîtes et étagères, environ 3 heures.', serviceType: 'manutention', address: '3300 Boul. Rosemont', city: 'Montréal', postalCode: 'H1X 1K1', price: 105 },
  ],
  // Set D — back-to-school & fall prep
  [
    { title: 'Ménage fin de bail', description: 'Grand ménage 5½ avant état des lieux.', serviceType: 'menage', address: '1600 Boul. de Maisonneuve O', city: 'Montréal', postalCode: 'H3H 1J5', price: 190 },
    { title: 'Transport divan', description: 'Divan 3 places, 2 escaliers.', serviceType: 'demenagement', address: '900 Rue Saint-Paul O', city: 'Montréal', postalCode: 'H3C 0M4', price: 140 },
    { title: 'Montage bureau étudiant', description: 'Bureau, chaise et lampe pour chambre.', serviceType: 'montage_meubles', address: '2500 Chemin de Polytechnique', city: 'Montréal', postalCode: 'H3T 1J4', price: 55 },
    { title: 'Nettoyage gouttières', description: 'Maison unifamiliale, échelle fournie.', serviceType: 'jardinage', address: '450 Rue Principale', city: 'Saint-Lambert', postalCode: 'J4P 1Y8', price: 120 },
    { title: 'Livraison électroménager', description: 'Laveuse du magasin à domicile.', serviceType: 'livraison', address: '700 Boul. Curé-Poirier E', city: 'Longueuil', postalCode: 'J4J 2G8', price: 85 },
    { title: 'Peinture mur accent', description: 'Un mur de salon, peinture fournie.', serviceType: 'autre', address: '2800 Rue Masson', city: 'Montréal', postalCode: 'H1Y 1W8', price: 150 },
    { title: 'Aide préparation fête', description: 'Installation tables, chaises et déco cour.', serviceType: 'manutention', address: '5200 Boul. Saint-Laurent', city: 'Montréal', postalCode: 'H2T 1S5', price: 90 },
    { title: 'Courses semaine famille', description: 'Épicerie pour 4 personnes, livraison.', serviceType: 'coursier', address: '1900 Rue Atateken', city: 'Montréal', postalCode: 'H2L 3L8', price: 40 },
  ],
].map((set) =>
  set.filter((t) => !/déneigement|deneigement|snow removal/i.test(t.title)),
);

export const DEMO_ROTATION_EPOCH = new Date('2026-01-01T05:00:00-05:00');

export function getDemoRotationIndex(
  rotationDays: number,
  at: Date = new Date(),
): number {
  const periodMs = rotationDays * 24 * 60 * 60 * 1000;
  const elapsed = Math.max(0, at.getTime() - DEMO_ROTATION_EPOCH.getTime());
  return Math.floor(elapsed / periodMs) % DEMO_JOB_ROTATIONS.length;
}

export function getActiveDemoJobSet(
  rotationDays: number,
  at: Date = new Date(),
): DemoJobTemplate[] {
  return DEMO_JOB_ROTATIONS[getDemoRotationIndex(rotationDays, at)];
}