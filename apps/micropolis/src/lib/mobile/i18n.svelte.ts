/**
 * Reactive DE/EN/ES i18n for the mobile UI layer.
 * The active language is Svelte $state — components using t() re-render on
 * change. Simulation messages stay English (engine-side).
 */

const de = {
	// Start screen
	startNewCity: 'Neue Stadt gründen',
	loadCity: 'Stadt laden',
	loadFromFile: 'Aus Datei laden',
	selectScenario: 'Szenario wählen',
	continueGame: 'Weiterspielen',
	back: 'Zurück',
	play: 'Spielen',
	newMap: 'Neue Karte',
	cityName: 'Name der Stadt',
	difficulty: 'Schwierigkeitsgrad',
	easy: 'Leicht',
	medium: 'Mittel',
	hard: 'Schwer',
	startingFunds: 'Startkapital',
	generatingTerrain: 'Landschaft wird erzeugt …',
	manualSlots: 'Speicherstände',
	autoSlots: 'Automatische Sicherungen',
	emptySlot: 'Leer',
	slot: 'Slot',
	autoSlot: 'Auto',
	population: 'Einwohner',
	funds: 'Kasse',
	savedAt: 'Gespeichert',
	invalidSaveFile: 'Keine gültige 7CITY-Spielstand-Datei.',
	attribution: '7CITY basiert auf Micropolis (mit freundlicher Genehmigung der Micropolis Corporation) und auf SimCity von Will Wright. Open Source unter GPL v3.',

	// Menu
	menu: 'Menü',
	system: 'System',
	newCity: 'Neu',
	load: 'Laden',
	save: 'Speichern',
	saveToFile: 'In Datei speichern',
	toStartScreen: 'Zum Startbildschirm',
	options: 'Optionen',
	language: 'Sprache',
	gameSpeed: 'Spielgeschwindigkeit',
	pause: 'Pause',
	slow: 'Langsam',
	fast: 'Schnell',
	autoBulldoze: 'Auto-Bulldozer',
	autoBudget: 'Auto-Budget',
	autoGoto: 'Auto-Goto (zu Ereignissen springen)',
	disastersEnabled: 'Katastrophen zulassen',
	sound: 'Sound',
	disasters: 'Katastrophen',
	fire: 'Feuer',
	flood: 'Flut',
	earthquake: 'Erdbeben',
	tornado: 'Tornado',
	monster: 'Monster',
	meltdown: 'Reaktor-GAU',
	windows: 'Fenster',
	maps: 'Karten',
	budget: 'Budget',
	saveDone: 'Gespeichert.',
	saveToSlot: 'In Slot speichern',
	overwrite: 'Überschreiben',

	// Maps window
	mapExit: 'Schließen',
	cityMap: 'Stadtplan',
	allZones: 'Alle Zonen',
	resZones: 'Wohngebiete',
	comZones: 'Gewerbe',
	indZones: 'Industrie',
	powerGrid: 'Stromnetz',
	populationMap: 'Bevölkerungsdichte',
	rateOfGrowth: 'Wachstum',
	trafficDensity: 'Verkehrsdichte',
	pollution: 'Verschmutzung',
	crimeRate: 'Kriminalität',
	landValue: 'Bodenwert',
	policeCoverage: 'Polizei-Abdeckung',
	fireCoverage: 'Feuerwehr-Abdeckung',
	legendLow: 'niedrig',
	legendHigh: 'hoch',
	powered: 'Strom',
	unpowered: 'kein Strom',
	growthShrink: 'Schrumpfung',
	growthGrow: 'Wachstum',

	// In-game chrome
	welcome: 'Willkommen in 7CITY.',
	hudPaused: 'Pause',
	hudStopped: 'Gestoppt',
	hudSpeed: 'Tempo',
	hudTax: 'Steuern',
	close: 'Schließen',

	// Tool feedback
	toolNoMoney: 'Nicht genug Geld',
	toolNeedBulldoze: 'Erst planieren',
	toolCannotBuild: 'Hier nicht baubar',

	// Zone query panel
	zoneQuery: 'Zonen-Abfrage',
	zoneTile: 'Kachel',
	zoneCategory: 'Kategorie',
	zoneDensity: 'Dichte',

	// Budget dialog
	budgetTitle: 'Stadtbudget',
	budgetCopy: 'Jahresabschluss: Budget prüfen. Mit „Übernehmen“ gilt der aktuelle Budgetplan und die Simulation läuft weiter.',
	budgetAutoLabel: 'Auto-Budget (Engine verwaltet die Finanzierung)',
	budgetLater: 'Später',
	budgetAccept: 'Budget übernehmen',

	// Tool names (palette)
	tool_query: 'Abfrage',
	tool_bulldoze: 'Bulldozer',
	tool_wire: 'Stromleitung',
	tool_road: 'Straße',
	tool_rail: 'Schiene',
	tool_park: 'Park',
	tool_res: 'Wohngebiet',
	tool_com: 'Gewerbe',
	tool_ind: 'Industrie',
	tool_police: 'Polizei',
	tool_fire: 'Feuerwehr',
	tool_seaport: 'Hafen',
	tool_coal: 'Kohlekraftwerk',
	tool_stadium: 'Stadion',
	tool_nuclear: 'Atomkraftwerk',
	tool_airport: 'Flughafen',

	// Legal
	legal: 'Rechtliches',
	impressum: 'Impressum',
	datenschutz: 'Datenschutz',

	// Scenario problems
	sc_dullsville: 'Langeweile',
	sc_san_francisco: '8,0-Erdbeben',
	sc_hamburg: 'Feuersturm',
	sc_bern: 'Verkehrschaos',
	sc_tokyo: 'Monster-Angriff',
	sc_detroit: 'Kriminalität',
	sc_boston: 'Reaktor-GAU',
	sc_rio: 'Küsten-Überflutung',
};

const en: typeof de = {
	startNewCity: 'Start New City',
	loadCity: 'Load a City',
	loadFromFile: 'Load from File',
	selectScenario: 'Select Scenario',
	continueGame: 'Continue',
	back: 'Back',
	play: 'Play',
	newMap: 'New Map',
	cityName: 'City name',
	difficulty: 'Difficulty',
	easy: 'Easy',
	medium: 'Medium',
	hard: 'Hard',
	startingFunds: 'Starting funds',
	generatingTerrain: 'Generating terrain …',
	manualSlots: 'Save slots',
	autoSlots: 'Autosaves',
	emptySlot: 'Empty',
	slot: 'Slot',
	autoSlot: 'Auto',
	population: 'Population',
	funds: 'Funds',
	savedAt: 'Saved',
	invalidSaveFile: 'Not a valid 7CITY savegame file.',
	attribution: '7CITY is based on Micropolis (courtesy of Micropolis Corporation) and on SimCity by Will Wright. Open source under GPL v3.',

	menu: 'Menu',
	system: 'System',
	newCity: 'New',
	load: 'Load',
	save: 'Save',
	saveToFile: 'Save to file',
	toStartScreen: 'To start screen',
	options: 'Options',
	language: 'Language',
	gameSpeed: 'Game speed',
	pause: 'Pause',
	slow: 'Slow',
	fast: 'Fast',
	autoBulldoze: 'Auto-Bulldoze',
	autoBudget: 'Auto-Budget',
	autoGoto: 'Auto-Goto (jump to events)',
	disastersEnabled: 'Enable disasters',
	sound: 'Sound',
	disasters: 'Disasters',
	fire: 'Fire',
	flood: 'Flood',
	earthquake: 'Earthquake',
	tornado: 'Tornado',
	monster: 'Monster',
	meltdown: 'Nuclear Meltdown',
	windows: 'Windows',
	maps: 'Maps',
	budget: 'Budget',
	saveDone: 'Saved.',
	saveToSlot: 'Save to slot',
	overwrite: 'Overwrite',

	mapExit: 'Close',
	cityMap: 'City Map',
	allZones: 'All Zones',
	resZones: 'Residential',
	comZones: 'Commercial',
	indZones: 'Industrial',
	powerGrid: 'Power Grid',
	populationMap: 'Population Density',
	rateOfGrowth: 'Rate of Growth',
	trafficDensity: 'Traffic Density',
	pollution: 'Pollution',
	crimeRate: 'Crime Rate',
	landValue: 'Land Value',
	policeCoverage: 'Police Coverage',
	fireCoverage: 'Fire Coverage',
	legendLow: 'low',
	legendHigh: 'high',
	powered: 'powered',
	unpowered: 'unpowered',
	growthShrink: 'decline',
	growthGrow: 'growth',

	welcome: 'Welcome to 7CITY.',
	hudPaused: 'Paused',
	hudStopped: 'Stopped',
	hudSpeed: 'Speed',
	hudTax: 'Tax',
	close: 'Close',

	toolNoMoney: 'Insufficient funds',
	toolNeedBulldoze: 'Bulldoze first',
	toolCannotBuild: 'Cannot build here',

	zoneQuery: 'Zone query',
	zoneTile: 'Tile',
	zoneCategory: 'Category',
	zoneDensity: 'Density',

	budgetTitle: 'City budget',
	budgetCopy: 'End-of-year budget review. Accept to apply the current budget plan and continue the simulation.',
	budgetAutoLabel: 'Auto-budget (engine manages funding)',
	budgetLater: 'Later',
	budgetAccept: 'Accept budget',

	tool_query: 'Query',
	tool_bulldoze: 'Bulldozer',
	tool_wire: 'Wire',
	tool_road: 'Road',
	tool_rail: 'Rail',
	tool_park: 'Park',
	tool_res: 'Residential',
	tool_com: 'Commercial',
	tool_ind: 'Industrial',
	tool_police: 'Police',
	tool_fire: 'Fire Dept.',
	tool_seaport: 'Seaport',
	tool_coal: 'Coal Power',
	tool_stadium: 'Stadium',
	tool_nuclear: 'Nuclear Power',
	tool_airport: 'Airport',

	legal: 'Legal',
	impressum: 'Legal Notice',
	datenschutz: 'Privacy Policy',

	sc_dullsville: 'Boredom',
	sc_san_francisco: '8.0 Earthquake',
	sc_hamburg: 'Firebombing',
	sc_bern: 'Traffic',
	sc_tokyo: 'Monster Attack',
	sc_detroit: 'Crime',
	sc_boston: 'Nuclear Meltdown',
	sc_rio: 'Coastal Flooding',
};

const es: typeof de = {
	startNewCity: 'Fundar nueva ciudad',
	loadCity: 'Cargar ciudad',
	loadFromFile: 'Cargar desde archivo',
	selectScenario: 'Elegir escenario',
	continueGame: 'Continuar',
	back: 'Atrás',
	play: 'Jugar',
	newMap: 'Nuevo mapa',
	cityName: 'Nombre de la ciudad',
	difficulty: 'Dificultad',
	easy: 'Fácil',
	medium: 'Media',
	hard: 'Difícil',
	startingFunds: 'Fondos iniciales',
	generatingTerrain: 'Generando terreno …',
	manualSlots: 'Partidas guardadas',
	autoSlots: 'Autoguardados',
	emptySlot: 'Vacío',
	slot: 'Ranura',
	autoSlot: 'Auto',
	population: 'Población',
	funds: 'Fondos',
	savedAt: 'Guardado',
	invalidSaveFile: 'No es un archivo de partida válido de 7CITY.',
	attribution: '7CITY se basa en Micropolis (cortesía de Micropolis Corporation) y en SimCity de Will Wright. Código abierto bajo GPL v3.',

	menu: 'Menú',
	system: 'Sistema',
	newCity: 'Nueva',
	load: 'Cargar',
	save: 'Guardar',
	saveToFile: 'Guardar en archivo',
	toStartScreen: 'A la pantalla de inicio',
	options: 'Opciones',
	language: 'Idioma',
	gameSpeed: 'Velocidad',
	pause: 'Pausa',
	slow: 'Lenta',
	fast: 'Rápida',
	autoBulldoze: 'Auto-excavadora',
	autoBudget: 'Auto-presupuesto',
	autoGoto: 'Auto-ir (saltar a eventos)',
	disastersEnabled: 'Permitir desastres',
	sound: 'Sonido',
	disasters: 'Desastres',
	fire: 'Incendio',
	flood: 'Inundación',
	earthquake: 'Terremoto',
	tornado: 'Tornado',
	monster: 'Monstruo',
	meltdown: 'Fusión nuclear',
	windows: 'Ventanas',
	maps: 'Mapas',
	budget: 'Presupuesto',
	saveDone: 'Guardado.',
	saveToSlot: 'Guardar en ranura',
	overwrite: 'Sobrescribir',

	mapExit: 'Cerrar',
	cityMap: 'Plano urbano',
	allZones: 'Todas las zonas',
	resZones: 'Residencial',
	comZones: 'Comercial',
	indZones: 'Industrial',
	powerGrid: 'Red eléctrica',
	populationMap: 'Densidad de población',
	rateOfGrowth: 'Crecimiento',
	trafficDensity: 'Densidad de tráfico',
	pollution: 'Contaminación',
	crimeRate: 'Criminalidad',
	landValue: 'Valor del suelo',
	policeCoverage: 'Cobertura policial',
	fireCoverage: 'Cobertura de bomberos',
	legendLow: 'bajo',
	legendHigh: 'alto',
	powered: 'con luz',
	unpowered: 'sin luz',
	growthShrink: 'declive',
	growthGrow: 'crecimiento',

	welcome: 'Bienvenido a 7CITY.',
	hudPaused: 'Pausa',
	hudStopped: 'Detenido',
	hudSpeed: 'Velocidad',
	hudTax: 'Impuestos',
	close: 'Cerrar',

	toolNoMoney: 'Fondos insuficientes',
	toolNeedBulldoze: 'Primero excavar',
	toolCannotBuild: 'No se puede construir aquí',

	zoneQuery: 'Consulta de zona',
	zoneTile: 'Casilla',
	zoneCategory: 'Categoría',
	zoneDensity: 'Densidad',

	budgetTitle: 'Presupuesto municipal',
	budgetCopy: 'Revisión presupuestaria de fin de año. Acepta para aplicar el plan actual y continuar la simulación.',
	budgetAutoLabel: 'Auto-presupuesto (el motor gestiona la financiación)',
	budgetLater: 'Más tarde',
	budgetAccept: 'Aceptar presupuesto',

	tool_query: 'Consulta',
	tool_bulldoze: 'Excavadora',
	tool_wire: 'Cable',
	tool_road: 'Carretera',
	tool_rail: 'Ferrocarril',
	tool_park: 'Parque',
	tool_res: 'Residencial',
	tool_com: 'Comercial',
	tool_ind: 'Industrial',
	tool_police: 'Policía',
	tool_fire: 'Bomberos',
	tool_seaport: 'Puerto',
	tool_coal: 'Central de carbón',
	tool_stadium: 'Estadio',
	tool_nuclear: 'Central nuclear',
	tool_airport: 'Aeropuerto',

	legal: 'Legal',
	impressum: 'Aviso legal',
	datenschutz: 'Política de privacidad',

	sc_dullsville: 'Aburrimiento',
	sc_san_francisco: 'Terremoto 8,0',
	sc_hamburg: 'Bombardeo incendiario',
	sc_bern: 'Tráfico',
	sc_tokyo: 'Ataque de monstruo',
	sc_detroit: 'Criminalidad',
	sc_boston: 'Fusión nuclear',
	sc_rio: 'Inundación costera',
};

export type UiLang = 'de' | 'en' | 'es';
export type UiKey = keyof typeof de;

const DICTS: Record<UiLang, typeof de> = { de, en, es };
const STORAGE_KEY = '7city.lang';

export const UI_LANGS: { id: UiLang; label: string }[] = [
	{ id: 'de', label: 'Deutsch' },
	{ id: 'en', label: 'English' },
	{ id: 'es', label: 'Español' },
];

export function detectLang(): UiLang {
	try {
		const stored = localStorage.getItem(STORAGE_KEY) as UiLang | null;
		if (stored && stored in DICTS) return stored;
	} catch { /* no storage */ }
	if (typeof navigator !== 'undefined') {
		const nav = navigator.language?.toLowerCase() ?? '';
		if (nav.startsWith('de')) return 'de';
		if (nav.startsWith('es')) return 'es';
	}
	return 'en';
}

let lang = $state<UiLang>(detectLang());

export function setLang(l: UiLang) {
	lang = l;
	try { localStorage.setItem(STORAGE_KEY, l); } catch { /* no storage */ }
}

export function getLang(): UiLang {
	return lang;
}

export function t(key: UiKey): string {
	return DICTS[lang][key] ?? en[key] ?? key;
}

const MONTHS: Record<UiLang, string[]> = {
	de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
	en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
};

/** Localized month abbreviation for a 0-based month index. */
export function monthAbbrev(index: number): string {
	return MONTHS[lang][((index % 12) + 12) % 12] ?? '';
}

/** Localized palette name for a ToolId (keys tool_<id>). */
export function toolLabel(toolId: string): string {
	return t(('tool_' + toolId) as UiKey);
}

/** Localized scenario problem label (keys sc_<scenario key>). */
export function scenarioProblem(key: string): string {
	return t(('sc_' + key) as UiKey);
}
