import {
  type Amenity,
  type BrewMethod,
  type OpeningHours,
  type PriceRange,
} from '@coffeeroute/shared';

/**
 * Fictional cafés and roasters for local development. Names are invented on purpose:
 * real businesses must go through the verification flow with real data.
 */
export interface SeedCafe {
  name: string;
  city: string;
  country: string;
  neighborhood: string;
  address: string;
  latitude: number;
  longitude: number;
  timezone: string;
  roasters: string[];
  brewMethods: BrewMethod[];
  amenities: Amenity[];
  priceRange: PriceRange;
  equipment: { machine: string; grinder: string };
  openingHours: OpeningHours;
  status?: 'PENDING' | 'VERIFIED';
}

const weekdays = (open: string, close: string) => ({
  monday: { open, close },
  tuesday: { open, close },
  wednesday: { open, close },
  thursday: { open, close },
  friday: { open, close },
});

const HOURS = {
  office: {
    ...weekdays('08:00', '19:00'),
    saturday: { open: '09:00', close: '15:00' },
    sunday: null,
  },
  allWeek: {
    ...weekdays('08:30', '20:00'),
    saturday: { open: '09:00', close: '20:00' },
    sunday: { open: '09:30', close: '15:00' },
  },
  late: {
    ...weekdays('10:00', '22:00'),
    friday: { open: '10:00', close: '01:00' },
    saturday: { open: '10:00', close: '01:00' },
    sunday: { open: '11:00', close: '19:00' },
  },
  brunch: {
    ...weekdays('09:00', '17:00'),
    saturday: { open: '09:30', close: '17:30' },
    sunday: { open: '09:30', close: '17:30' },
  },
} satisfies Record<string, OpeningHours>;

const MACHINES = [
  'La Marzocco Linea PB',
  'Victoria Arduino Eagle One',
  'Slayer Steam',
  'Kees van der Westen Spirit',
  'La Marzocco GS3',
];
const GRINDERS = ['Mahlkönig E80', 'Mythos 2', 'Mazzer Kold', 'EK43', 'Fiorenzato F64'];

type Base = Omit<SeedCafe, 'city' | 'country' | 'timezone' | 'equipment'>;

const malaga: Base[] = [
  {
    name: 'Brasa Lenta Café',
    neighborhood: 'Centro',
    address: 'Calle Granada 41',
    latitude: 36.7219,
    longitude: -4.4196,
    roasters: ['Brasa Lenta Tostadores'],
    brewMethods: ['espresso', 'pour-over', 'aeropress'],
    amenities: ['wifi', 'laptop-friendly'],
    priceRange: '€€',
    openingHours: HOURS.office,
  },
  {
    name: 'Origen Mediterráneo',
    neighborhood: 'Centro',
    address: 'Calle Cárcer 3',
    latitude: 36.7228,
    longitude: -4.4225,
    roasters: ['Origen Tueste', 'Faro Roasters'],
    brewMethods: ['espresso', 'pour-over', 'chemex', 'cold-brew'],
    amenities: ['wifi', 'outdoor-seating'],
    priceRange: '€€',
    openingHours: HOURS.allWeek,
  },
  {
    name: 'La Taza Lenta',
    neighborhood: 'Soho',
    address: 'Calle Tomás Heredia 18',
    latitude: 36.7161,
    longitude: -4.4241,
    roasters: ['Tostadores del Sur'],
    brewMethods: ['espresso', 'batch-brew', 'cold-brew'],
    amenities: ['wifi', 'laptop-friendly', 'power-outlets', 'vegan-options'],
    priceRange: '€',
    openingHours: HOURS.office,
  },
  {
    name: 'Grano Soho',
    neighborhood: 'Soho',
    address: 'Calle Casas de Campos 9',
    latitude: 36.7172,
    longitude: -4.4258,
    roasters: ['Faro Roasters'],
    brewMethods: ['espresso', 'pour-over', 'siphon'],
    amenities: ['pet-friendly', 'outdoor-seating'],
    priceRange: '€€€',
    openingHours: HOURS.late,
  },
  {
    name: 'Muelle Uno Coffee Lab',
    neighborhood: 'Puerto',
    address: 'Paseo del Muelle Uno 12',
    latitude: 36.7182,
    longitude: -4.4148,
    roasters: ['Norte Coffee Lab', 'Tostadores del Sur'],
    brewMethods: ['espresso', 'aeropress', 'french-press'],
    amenities: ['outdoor-seating', 'accessible'],
    priceRange: '€€',
    openingHours: HOURS.allWeek,
  },
  {
    name: 'Pedregalejo Roast',
    neighborhood: 'Pedregalejo',
    address: 'Paseo Marítimo El Pedregal 70',
    latitude: 36.7213,
    longitude: -4.3807,
    roasters: ['Brasa Lenta Tostadores'],
    brewMethods: ['espresso', 'cold-brew'],
    amenities: ['outdoor-seating', 'pet-friendly'],
    priceRange: '€',
    openingHours: HOURS.brunch,
  },
  {
    name: 'Teatinos Filter Bar',
    neighborhood: 'Teatinos',
    address: 'Calle Mesonero Romanos 5',
    latitude: 36.7177,
    longitude: -4.4772,
    roasters: ['Origen Tueste'],
    brewMethods: ['pour-over', 'chemex', 'batch-brew'],
    amenities: ['wifi', 'laptop-friendly', 'power-outlets', 'accessible'],
    priceRange: '€',
    openingHours: HOURS.office,
  },
  {
    name: 'Lagunillas Espresso',
    neighborhood: 'Lagunillas',
    address: 'Calle Lagunillas 22',
    latitude: 36.7252,
    longitude: -4.415,
    roasters: ['Tostadores del Sur'],
    brewMethods: ['espresso'],
    amenities: ['vegan-options'],
    priceRange: '€',
    openingHours: HOURS.office,
    status: 'PENDING',
  },
  {
    name: 'Café Alcazabilla',
    neighborhood: 'Centro',
    address: 'Calle Alcazabilla 7',
    latitude: 36.7224,
    longitude: -4.4171,
    roasters: ['Faro Roasters'],
    brewMethods: ['espresso', 'pour-over'],
    amenities: ['wifi'],
    priceRange: '€€',
    openingHours: HOURS.allWeek,
    status: 'PENDING',
  },
];

const madrid: Base[] = [
  {
    name: 'Norte Coffee Lab Malasaña',
    neighborhood: 'Malasaña',
    address: 'Calle del Espíritu Santo 15',
    latitude: 40.4252,
    longitude: -3.7048,
    roasters: ['Norte Coffee Lab'],
    brewMethods: ['espresso', 'pour-over', 'aeropress', 'chemex'],
    amenities: ['wifi', 'laptop-friendly', 'power-outlets'],
    priceRange: '€€',
    openingHours: HOURS.allWeek,
  },
  {
    name: 'Tueste Castizo',
    neighborhood: 'Malasaña',
    address: 'Calle de la Palma 38',
    latitude: 40.4268,
    longitude: -3.7061,
    roasters: ['Tueste Castizo'],
    brewMethods: ['espresso', 'batch-brew'],
    amenities: ['wifi', 'vegan-options'],
    priceRange: '€',
    openingHours: HOURS.office,
  },
  {
    name: 'Cafetal Lavapiés',
    neighborhood: 'Lavapiés',
    address: 'Calle del Ave María 20',
    latitude: 40.4095,
    longitude: -3.7009,
    roasters: ['Origen Tueste', 'Tueste Castizo'],
    brewMethods: ['espresso', 'cold-brew', 'french-press'],
    amenities: ['pet-friendly', 'vegan-options'],
    priceRange: '€',
    openingHours: HOURS.late,
  },
  {
    name: 'Sifón Chamberí',
    neighborhood: 'Chamberí',
    address: 'Calle de Fuencarral 120',
    latitude: 40.4318,
    longitude: -3.7017,
    roasters: ['Faro Roasters'],
    brewMethods: ['siphon', 'pour-over', 'espresso'],
    amenities: ['wifi', 'accessible'],
    priceRange: '€€€',
    openingHours: HOURS.office,
  },
  {
    name: 'Ruta Latina Coffee',
    neighborhood: 'La Latina',
    address: 'Cava Baja 24',
    latitude: 40.4116,
    longitude: -3.7093,
    roasters: ['Norte Coffee Lab'],
    brewMethods: ['espresso', 'pour-over'],
    amenities: ['outdoor-seating'],
    priceRange: '€€',
    openingHours: HOURS.brunch,
  },
  {
    name: 'Estudio Grano',
    neighborhood: 'Chamberí',
    address: 'Calle de Trafalgar 7',
    latitude: 40.4307,
    longitude: -3.7047,
    roasters: ['Brasa Lenta Tostadores'],
    brewMethods: ['espresso', 'aeropress', 'batch-brew'],
    amenities: ['wifi', 'laptop-friendly', 'power-outlets'],
    priceRange: '€€',
    openingHours: HOURS.office,
  },
  {
    name: 'Retiro Pour Over',
    neighborhood: 'Retiro',
    address: 'Calle de Ibiza 31',
    latitude: 40.4189,
    longitude: -3.6745,
    roasters: ['Origen Tueste'],
    brewMethods: ['pour-over', 'chemex', 'cold-brew'],
    amenities: ['pet-friendly', 'outdoor-seating'],
    priceRange: '€€',
    openingHours: HOURS.allWeek,
  },
  {
    name: 'Huertas Brew Bar',
    neighborhood: 'Barrio de las Letras',
    address: 'Calle de las Huertas 44',
    latitude: 40.4133,
    longitude: -3.6981,
    roasters: ['Faro Roasters', 'Norte Coffee Lab'],
    brewMethods: ['espresso', 'pour-over', 'siphon'],
    amenities: ['wifi'],
    priceRange: '€€',
    openingHours: HOURS.late,
  },
  {
    name: 'Conde Duque Tostadores',
    neighborhood: 'Conde Duque',
    address: 'Calle del Conde Duque 12',
    latitude: 40.4271,
    longitude: -3.7115,
    roasters: ['Tueste Castizo'],
    brewMethods: ['espresso'],
    amenities: ['laptop-friendly'],
    priceRange: '€',
    openingHours: HOURS.office,
    status: 'PENDING',
  },
];

const lisboa: Base[] = [
  {
    name: 'Atlântico Torrefação',
    neighborhood: 'Chiado',
    address: 'Rua Garrett 60',
    latitude: 38.7108,
    longitude: -9.1413,
    roasters: ['Atlântico Torrefação'],
    brewMethods: ['espresso', 'pour-over', 'aeropress'],
    amenities: ['wifi', 'laptop-friendly'],
    priceRange: '€€',
    openingHours: HOURS.allWeek,
  },
  {
    name: 'Miradouro Coffee',
    neighborhood: 'Príncipe Real',
    address: 'Rua Dom Pedro V 80',
    latitude: 38.7163,
    longitude: -9.1486,
    roasters: ['Faro Roasters'],
    brewMethods: ['espresso', 'cold-brew', 'chemex'],
    amenities: ['outdoor-seating', 'pet-friendly'],
    priceRange: '€€€',
    openingHours: HOURS.brunch,
  },
  {
    name: 'Grão de Alfama',
    neighborhood: 'Alfama',
    address: 'Rua de São Miguel 14',
    latitude: 38.7116,
    longitude: -9.1302,
    roasters: ['Atlântico Torrefação'],
    brewMethods: ['espresso', 'french-press'],
    amenities: ['vegan-options'],
    priceRange: '€',
    openingHours: HOURS.office,
  },
  {
    name: 'Cais Filter Club',
    neighborhood: 'Cais do Sodré',
    address: 'Rua Nova do Carvalho 31',
    latitude: 38.7069,
    longitude: -9.1444,
    roasters: ['Norte Coffee Lab', 'Atlântico Torrefação'],
    brewMethods: ['pour-over', 'batch-brew', 'siphon'],
    amenities: ['wifi', 'laptop-friendly', 'power-outlets'],
    priceRange: '€€',
    openingHours: HOURS.late,
  },
  {
    name: 'Estrela Espresso',
    neighborhood: 'Estrela',
    address: 'Calçada da Estrela 101',
    latitude: 38.7125,
    longitude: -9.1594,
    roasters: ['Origen Tueste'],
    brewMethods: ['espresso', 'aeropress'],
    amenities: ['wifi', 'accessible'],
    priceRange: '€',
    openingHours: HOURS.office,
  },
  {
    name: 'Baixa Brew',
    neighborhood: 'Baixa',
    address: 'Rua dos Correeiros 92',
    latitude: 38.711,
    longitude: -9.1376,
    roasters: ['Atlântico Torrefação'],
    brewMethods: ['espresso', 'cold-brew'],
    amenities: ['outdoor-seating'],
    priceRange: '€€',
    openingHours: HOURS.allWeek,
  },
  {
    name: 'Intendente Roastery',
    neighborhood: 'Intendente',
    address: 'Largo do Intendente 19',
    latitude: 38.7215,
    longitude: -9.1356,
    roasters: ['Atlântico Torrefação'],
    brewMethods: ['espresso', 'pour-over'],
    amenities: ['wifi', 'pet-friendly'],
    priceRange: '€',
    openingHours: HOURS.brunch,
    status: 'PENDING',
  },
];

const withCity =
  (city: string, country: string, timezone: string) =>
  (cafe: Base, i: number): SeedCafe => ({
    ...cafe,
    city,
    country,
    timezone,
    equipment: { machine: MACHINES[i % MACHINES.length]!, grinder: GRINDERS[i % GRINDERS.length]! },
  });

export const SEED_CAFES: SeedCafe[] = [
  ...malaga.map(withCity('Málaga', 'España', 'Europe/Madrid')),
  ...madrid.map(withCity('Madrid', 'España', 'Europe/Madrid')),
  ...lisboa.map(withCity('Lisboa', 'Portugal', 'Europe/Lisbon')),
];

/** Fictional regulars whose check-ins give the seeded cafés real averages. They cannot log in. */
export const SEED_TASTERS = [
  { email: 'lucia.ferrer@seed.coffeeroute.app', name: 'Lucía Ferrer' },
  { email: 'tomas.iglesias@seed.coffeeroute.app', name: 'Tomás Iglesias' },
  { email: 'ines.duarte@seed.coffeeroute.app', name: 'Inês Duarte' },
  { email: 'marta.solis@seed.coffeeroute.app', name: 'Marta Solís' },
  { email: 'rui.almeida@seed.coffeeroute.app', name: 'Rui Almeida' },
  { email: 'pablo.herrera@seed.coffeeroute.app', name: 'Pablo Herrera' },
];

export const SEED_TASTING_NOTES: (string | null)[] = [
  'Chocolate con leche, acidez media y cuerpo sedoso.',
  'Fresa madura y final largo; el filtro brilla.',
  'Espresso equilibrado, algo amargo al enfriarse.',
  'Panela y avellana, muy dulce con leche.',
  'Floral y ligero, ideal en pour-over.',
  null,
];
