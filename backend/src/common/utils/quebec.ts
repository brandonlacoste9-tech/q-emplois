import { BadRequestException } from '@nestjs/common';

/** CIRA postal FSAs: G (east QC), H (Montréal), J (west QC / Outaouais / Rive-Sud). */
const QC_FSA_PREFIX = new Set(['G', 'H', 'J']);

const QC_CITIES = new Set(
  [
    'montréal',
    'montreal',
    'québec',
    'quebec',
    'ville de québec',
    'laval',
    'gatineau',
    'longueuil',
    'sherbrooke',
    'lévis',
    'levis',
    'saguenay',
    'trois-rivières',
    'trois-rivieres',
    'terrebonne',
    'saint-jean-sur-richelieu',
    'brossard',
    'repentigny',
    'drummondville',
    'saint-jérôme',
    'saint-jerome',
    'granby',
    'blainville',
    'saint-hyacinthe',
    'shawinigan',
    'dollard-des-ormeaux',
    'châteauguay',
    'chateauguay',
    'rimouski',
    'saint-eustache',
    'mascouche',
    'victoriaville',
    'rouyn-noranda',
    'boucherville',
    'salaberry-de-valleyfield',
    'saint-georges',
    'val-d\'or',
    'alma',
    'sainte-julie',
    'saint-bruno-de-montarville',
    'sainte-thérèse',
    'sainte-therese',
    'mirabel',
    'pointe-claire',
    'dorval',
    'kirkland',
    'beaconsfield',
    'westmount',
    'outremont',
    'verdun',
    'westmount',
    'côte-saint-luc',
    'cote-saint-luc',
    'anjou',
    'lasalle',
    'lachine',
    'saint-laurent',
    'saint-léonard',
    'saint-leonard',
    'montréal-nord',
    'montreal-nord',
    'rivière-des-prairies',
    'riviere-des-prairies',
    'poirier',
    'brossard',
    'saint-lambert',
    'greenfield park',
    'brossard',
    'candiac',
    'la prairie',
    'sainte-catherine',
    'varennes',
    'beloeil',
    'chambly',
    'saint-constant',
    'vaudreuil-dorion',
    'hudson',
    'pincourt',
    'deux-montagnes',
    'boisbriand',
    'sainte-marthe-sur-le-lac',
    'lorraine',
    'rosemère',
    'rosemere',
    'bois-des-filion',
    'repentigny',
    'charlemagne',
    'l\'assomption',
    'joliette',
    'sorel-tracy',
    'thedford mines',
    'rivière-du-loup',
    'riviere-du-loup',
    'baie-comeau',
    'sept-îles',
    'sept-iles',
    'gaspé',
    'gaspe',
    'matane',
    'amqui',
    'mont-joli',
    'chicoutimi',
    'jonquière',
    'jonquiere',
    'la tuque',
    'shawinigan',
    'cap-de-la-madeleine',
    'bécancour',
    'becancour',
    'magog',
    'cowansville',
    'bromont',
    'granby',
    'saint-jean',
    'iberville',
    'farnham',
    'acton vale',
    'drummondville',
    'victoriaville',
    'plessisville',
    'thetford mines',
    'saint-georges',
    'beauceville',
    'sainte-marie',
    'montmagny',
    'la malbaie',
    'baie-saint-paul',
    'sainte-anne-de-beaupré',
    'sainte-foy',
    'sillery',
    'beauport',
    'charlesbourg',
    'loretteville',
    'val-bélaire',
    'l\'ancienne-lorette',
    'saint-augustin-de-desmaures',
    'wendake',
    'aylmer',
    'hull',
    'gatineau',
    'buckingham',
    'masson-angers',
    'chelsea',
    'wakefield',
    'plateau',
    'plateau-mont-royal',
    'rosemont',
    'villeray',
    'hochelaga',
    'petite-patrie',
    'mile-end',
    'griffintown',
    'old montreal',
    'vieux-montréal',
    'vieux-montreal',
  ].map((c) => normalizeCity(c)),
);

export function normalizeCity(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/['’]/g, "'");
}

export function quebecPostalPrefix(postalCode?: string | null): string | null {
  const compact = (postalCode ?? '').replace(/\s/g, '').toUpperCase();
  if (compact.length < 1) return null;
  return compact[0];
}

export function isQuebecPostal(postalCode?: string | null): boolean {
  const prefix = quebecPostalPrefix(postalCode);
  return !!prefix && QC_FSA_PREFIX.has(prefix);
}

export function isQuebecCity(city?: string | null): boolean {
  if (!city?.trim()) return false;
  const n = normalizeCity(city);
  if (QC_CITIES.has(n)) return true;
  for (const known of QC_CITIES) {
    if (n.includes(known) || known.includes(n)) return true;
  }
  return false;
}

export function assertQuebecJobLocation(city?: string, postalCode?: string): void {
  const postalOk = isQuebecPostal(postalCode);
  const cityOk = isQuebecCity(city);
  if (postalOk || cityOk) return;
  throw new BadRequestException(
    'Q-Emplois est réservé au Québec. Utilisez une ville du Québec et un code postal G, H ou J.',
  );
}
