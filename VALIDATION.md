# Prüfung der Studio-Überarbeitung

Stand: 7./8. November 2026, macOS ARM64. Lokal geprüft; keine Cloud-Veröffentlichung.

## Backend

- Umbenennung des Quellordners zu backend/Api; Solution und Projektverweise aktualisiert.
- Genau ein Backend-Anwendungsprojekt, zusätzlich ein C#-Testprojekt. Keine Clean Architecture eingeführt.
- .NET SDK 10.0.403, Release-Build ohne Warnungen und Fehler.
- 15 C#-/xUnit-Tests bestanden, kein übersprungener Test bei gesetzter TEST_DATABASE_CONNECTION.
- Geprüft: DocumentService-Regeln, Unicode/wörtliche Werte, Syntax- und Größenfehler, HTTP-Routing, Health, falsche HTTP-Methode, JSON und Validierung.
- Echte PostgreSQL-Testdatenbank: Migration, Vorlagen-CRUD, persistierte Layoutdaten und Wiederfinden nach einer neuen Anwendungsinstanz. Testdatenbank ist vom lokalen Vorlagenbestand getrennt.
- Additive Migration AddLetterLayout auch auf die bestehende Entwicklungsdatenbank angewendet.
- Python-Tests vollständig aus dem Repository entfernt. Für Betrieb und Tests ist kein Python erforderlich.

## Frontend

- Nuxt 4.6.4, Vue 3.5.45; Vue Router an die von Nuxt benötigte Hauptversion angepasst.
- TypeScript-Prüfung erfolgreich; 10 Vitest-Tests erfolgreich.
- Produktionsbuild und statischer Generate-Build für /document-generator/ erfolgreich.
- Browser: Brief fertigstellen über C#-API, vollständige Vorlage inklusive Layout speichern, über das modale Archiv erneut laden, Inhalts-Tabs und Vorschau bedienen.
- Direkten PDF-Download im Browser ausgelöst; heruntergeladene Datei geöffnet und Empfänger, Datum und Brieftext geprüft.
- Statischer Build lokal unter /document-generator/ ausgeliefert: korrekte Navigation, Schriftdateien, Browser-Speicherung und Texterzeugung ohne Backend. Keine Konsolenfehler beobachtet.
- Visuell geprüft: Desktop- und schmale einspaltige Ansicht. Die angeforderte 390-px-Viewport-Überschreibung wurde vom eingebetteten Browser nicht zuverlässig übernommen; tatsächlich gemessen wurden 615 px ohne horizontalen Überlauf. Kein behaupteter 390-px-Test.

## PDF

- Musterbrief: 1 Seite, A4 (595,28 × 841,89 pt), eingebettete Carlito-Schrift, Vektorlogo und korrekte Briefbestandteile.
- Mehrseitentest: 5 A4-Seiten mit 150 nummerierten Zeilen; alle Zeilen einmal und in Reihenfolge vorhanden. Sonderzeichen einschließlich Łukasz und Abschluss erhalten.
- Alle Textzeichen innerhalb der PDF-Seitengrenzen; erste und Fortsetzungsseite gerendert und visuell geprüft.
- Nativer Browser-Druckdialog nicht zuverlässig verfügbar. Deshalb ist der direkte geprüfte PDF-Download der primäre Exportweg; keine Behauptung eines geprüften physischen Drucks.

## Gefundene und korrigierte Probleme

- HTTP-Testserialisierung wandelte zunächst den Platzhalterschlüssel Name in name um. Die Tests verwenden nun ein Dictionary und beachten die beabsichtigte Groß-/Kleinschreibung.
- Der Testclient benötigte denselben JSON-Enum-Konverter wie der API-Vertrag; ergänzt.
- Nuxt-Komponentennamen mit doppeltem Verzeichnispräfix wurden nicht aufgelöst; an die tatsächlichen Auto-Import-Namen angepasst.
- Ein veralteter Vue Router verursachte einen Typprüfungs-Pluginfehler; kompatible Version installiert.
- Vorlagenvalidierung gilt nun auch im Browser-Modus, nicht nur beim API-Speichern.

## Noch nicht geprüft / aktiviert

Docker-/Compose-Ausführung, Docker-Image-Build, tatsächlicher GitHub-Actions-Lauf, GitHub-Pages-Veröffentlichung, Render und Neon sind nicht lokal ausführbar bzw. noch nicht eingerichtet. Keine Konten erstellt, keine Ressourcen provisioniert und kein öffentlicher Dienst gestartet. Keine formale DIN-Zertifizierung, kein Last- oder Sicherheitstest einer öffentlichen Anwendung. Dafür bleiben separate Einrichtung und Prüfung nötig.
