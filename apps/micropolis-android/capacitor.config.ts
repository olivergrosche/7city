import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	// Endgültig für den Play Store — nach dem ersten Upload unveränderlich!
	appId: 'io.super7.sevencity',
	appName: '7CITY',
	webDir: 'www',
	android: {
		allowMixedContent: false,
		// Statusleiste/Kamera-Cutout und Gestenleiste nicht übers Spiel legen:
		// WebView bekommt Margins, der schwarze Fensterhintergrund bildet die Balken.
		adjustMarginsForEdgeToEdge: 'force'
	},
	server: {
		androidScheme: 'https'
	}
};

export default config;
