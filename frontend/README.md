# Nuxt – Letter Studio

Die Oberfläche ist ein Nuxt-4-/Vue-/TypeScript-Projekt mit klar verteilten Verantwortlichkeiten. Es gibt keine große app.vue mit der gesamten Anwendung mehr.

## Verzeichnisstruktur

- `app/app.vue`: Nur NuxtPage, der Einstieg in das Seitenrouting.
- `app/pages/index.vue`: Orchestriert die Studio-Seite, Statusmeldungen und Exportaktionen.
- `app/components/studio/StudioSidebar.vue`: Branding, Navigation, Vorlagenzugriff und Betriebsmodus.
- `app/components/studio/LetterEditor.vue`: Vier zugängliche Tabs für Absender, Empfänger, Inhalt und Details; Tastaturwechsel mit Pfeiltasten.
- `app/components/studio/TemplateLibrary.vue`: Native modale Vorlagenverwaltung mit Laden, Auswahl und Löschen.
- `app/components/ui/FormField.vue`: Wiederverwendbares beschriftetes Eingabefeld mit Hinweisen und Längenbegrenzung.
- `app/components/brand/NitohMark.vue`: Das einzige N im runden Logo; Schwarz und Sand. SVG-Datei zusätzlich unter public/.
- `app/components/letter/LetterPage.vue`: Eine physische A4-Seite mit festem Briefaufbau.
- `app/components/letter/LetterPreview.vue`: Responsive Skalierung und Aufteilung auf Briefseiten; zusätzliche native Druckfunktion mit Vorprüfung.
- `app/composables/useLetterStudio.ts`: Reaktiver Zustand, API-Aufrufe, lokale Entwürfe und Vorlagenmodus; keine Layoutzeichnung.
- `app/composables/useLetterPdf.ts`: Lädt die mitgelieferten Schriftdateien und PDF-Logik erst beim Export; Download- und Ladezustand.
- `app/types/document.ts`: Gemeinsame TypeScript-Modelle.
- `app/utils/template.ts`: Reine Platzhaltererkennung, Validierung und Ersetzung für den lokalen Browser-Modus. API-Modus nutzt zusätzlich den C#-Service.
- `app/utils/letter.ts`: Standardentwurf, Datumsformatierung, Zeilenumbruch und Pagination. Keine Zeilen gehen zwischen Seiten verloren; der Abschluss bleibt zusammen.
- `app/utils/pdf.ts`: Direkte PDF-Erstellung mit jsPDF, eingebetteter Schrift, Vektormonogramm, A4-Maßen und Prüfung überlanger Anschriftfelder.
- `app/assets/main.css`: Oberfläche, Responsivität, Fokuszustände und reduzierte Animation.
- `app/assets/letter.css`: Druckmaße, Briefschrift und Druckmedien-Regeln. A4 bleibt von der skalierten Bildschirmansicht unabhängig.
- `app/assets/fonts/`: Carlito Regular/Bold und zugehörige OFL-Lizenz. Keine fremden Font-Dienste zur Laufzeit.
- `server/api/[...path].ts`: Nitro-Proxy für den lokalen API-Betrieb. Auf GitHub Pages existiert dieser Server nicht; dort wird ausdrücklich lokaler Modus oder eine öffentliche API-Adresse verwendet.
- `nuxt.config.ts`: Schrift-/CSS-Einbindung, Branding, Base-URL, private Backend-Adresse und öffentliche Betriebsparameter. Das interaktive Studio rendert im Browser (ssr:false), weil Entwurfsspeicher, Schriftmessung und Export browserseitig arbeiten.
- `tests/letter.test.ts`, `tests/pdf.test.ts`: Vitest-Tests für Regeln, Umbruch, Seitenfolge, A4, eingebettete Schrift und Exportvalidierung.
- `package.json`/`package-lock.json`: Befehle, Abhängigkeiten und reproduzierbare Installation. Vue Router ist auf die von Nuxt erwartete Hauptversion abgestimmt.
- `tsconfig.json`, `vitest.config.ts`: Nuxt-Typkonfiguration und Tests.

## Lokal

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

Standard-API: http://127.0.0.1:5080. Alternative mit NUXT_BACKEND_URL. Entwürfe werden auf dem aktuellen Gerät gespeichert und sind in der Oberfläche entsprechend markiert.

## Statischer Build

```sh
NUXT_APP_BASE_URL=/document-generator/ NUXT_PUBLIC_STORAGE_MODE=local npm run generate
```

Ausgabe: `.output/public`. Ein statischer Server muss diesen Inhalt unter dem angegebenen Unterpfad ausliefern. Bei gehostetem Backend NUXT_PUBLIC_API_BASE auf dessen HTTPS-Ursprung setzen und NUXT_PUBLIC_STORAGE_MODE=api wählen.

Weitere Einrichtung: [DEPLOYMENT.md](../DEPLOYMENT.md). Die aktuell vorbereitete Veröffentlichung ist noch deaktiviert.
