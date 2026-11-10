# Nitoh · Letter Studio

Ein klassischer ASP.NET-Core-Monolith mit Nuxt-Frontend: professionelle Briefe gestalten, Vorlagen verwalten und A4-PDFs herunterladen. Schwarz, Sand und ein reduziertes N-Monogramm prägen die Oberfläche.

## Wiederverwendbare Briefvorlagen

„Neue Briefvorlage“ öffnet den Baukasten. Wähle einen Text-Ausgangspunkt (eigener Text, Kündigung, Vollmacht oder Anfrage), Namen und Kategorie, Layout, Briefkopf, Anrede, Abschlussabsatz und Grußformel. Danach bearbeitest du den Text und speicherst die Vorlage.

„Meine Vorlagen“ enthält Suche, Kategorie-Filter sowie eigene und bearbeitbare Startvorlagen. Eigene Kategorien können frei eingegeben werden. Bestehende Vorlagen bleiben unter „Allgemeines“ erhalten.

Die drei schlichten Layouts Klassisch, Minimal und Linie lassen sich mit allen drei Briefköpfen kombinieren. Die gespeicherte Auswahl ist nur der Default: beim Verwenden kannst du die Gestaltung unabhängig vom Text ändern. Erst erneutes Speichern ändert die Vorlage. Platzhalter funktionieren auch in Betreff, Anrede und Abschlussabsätzen. Die Werte werden bei jeder Verwendung neu eingegeben.

[Prüfung dieser Erweiterung](VALIDATION-TEMPLATES.md).

## Lokal starten

Voraussetzungen: .NET-10-SDK, Node.js 24 LTS und npm; PostgreSQL 18 lokal oder Docker Compose. Kein Python erforderlich.

```sh
docker compose up -d --wait
dotnet build backend/DocumentGenerator.sln -c Release
dotnet run --project backend/Api -c Release --no-build -- --migrate
dotnet run --project backend/Api -c Release --no-build --urls http://127.0.0.1:5080
```

In einem zweiten Terminal:

```sh
cd frontend
npm ci
npm run dev
```

Öffne http://127.0.0.1:3000. Absender → Empfänger → Inhalt → Details. Mit „Brief fertigstellen“ werden Platzhalter über den per DI eingebundenen C#-DocumentService ersetzt. „PDF herunterladen“ erstellt eine A4-Datei mit eingebetteter Schrift. „Drucken“ verwendet zusätzlich die Druckfunktion des Browsers.

## Aufbau

```text
backend/
  DocumentGenerator.sln
  Api/                         Ein ASP.NET-Core-Anwendungsprojekt
    Controllers/               HTTP-Endpunkte
    Services/                  DocumentService, TemplateService, TemplateRenderer
    Repositories/              Konkreter EF-Core-Datenzugriff
    Models/                    Gespeicherte Vorlage und Dokumenttyp
    DTOs/                      HTTP-Ein-/Ausgaben und Brief-Layout
    Data/                      AppDbContext
    Migrations/                Versioniertes PostgreSQL-Schema
  Api.Tests/                   C#-/xUnit- und HTTP-Integrationstests
frontend/
  app/pages/                   Studio-Seite
  app/components/               UI, Editor, Archiv, Briefseiten, Branding
  app/composables/              Zustand, API, Entwurf, PDF-Download
  app/types/                   TypeScript-Datenmodelle
  app/utils/                   Reine Text-, Pagination- und PDF-Funktionen
  app/assets/                  Styles, Drucklayout, eingebettete Schriften
  tests/                       TypeScript-/Vitest-Tests
compose.yaml                   PostgreSQL für lokale Entwicklung
.github/workflows/             Tests und vorbereitete Pages-Veröffentlichung
```

**Ein Backend-Anwendungsprojekt**, technische Schichten als Ordner. `Api.Tests` ist nur ein Testprojekt. Clean Architecture und separate Domain-/Application-Projekte bleiben einer späteren Lernphase vorbehalten.

## Speicherung und Betriebsarten

- **API-Modus (Standard lokal):** Vorlagen mit Brieftext und Layout werden in PostgreSQL gespeichert. Nuxts Nitro-Proxy verbindet Browser und API. Entwürfe einschließlich eingesetzter Werte werden zusätzlich auf dem aktuellen Gerät zwischengespeichert.
- **Lokaler Browser-Modus:** `NUXT_PUBLIC_STORAGE_MODE=local` speichert Vorlagen auf dem jeweiligen Gerät und ersetzt Platzhalter im Browser. Kein Serverkonto erforderlich, kein geräteübergreifender Abgleich. Das ist der vorbereitete Pages-Modus, solange kein öffentliches Backend existiert.
- **Pages mit späterem Backend:** `NUXT_PUBLIC_API_BASE=https://DEINE-API` und `NUXT_PUBLIC_STORAGE_MODE=api`. Die API muss den Frontend-Ursprung gezielt per CORS erlauben. Keine Zugangsdaten oder Datenbankverbindungen gehören in öffentliche Nuxt-Konfiguration.

Die Datenbankverbindung wird über `ConnectionStrings__Default` gesetzt. Die Beispielwerte in appsettings/Compose gelten nur lokal. `--migrate` wendet die Migrationen explizit an; normaler Serverstart verändert kein Schema.

## Tests

```sh
dotnet test backend/DocumentGenerator.sln -c Release
cd frontend
npm run typecheck
npm test
npm run build
```

Ohne Datenbankvariable werden 16 Backend-Tests ausgeführt und der PostgreSQL-Test ausdrücklich übersprungen. Für alle 17 Tests `TEST_DATABASE_CONNECTION` auf eine eigene PostgreSQL-Testdatenbank setzen. Die Integration wendet Migrationen an, erzeugt eine eigene Testvorlage, startet die Anwendung neu, prüft CRUD und entfernt ihre Vorlage wieder. In CI läuft PostgreSQL als Service.

## Brief- und Drucklayout

A4 mit Briefkopf, Rücksendeangabe, Empfängeranschrift, Informationsblock, Datum, Betreff, Anrede, Text, Grußformel, Unterschriftsraum, optionaler Fußzeile und Falz-/Lochmarken. Mehrseitige Briefe erhalten Fortsetzungsseiten und Seitenzahlen. Vorschau und PDF verwenden die mitgelieferte Carlito-Schrift; OFL-Lizenz liegt bei.

Die Maße orientieren sich an **DIN 5008, Form B**. Das ist keine behauptete Zertifizierung gegen den vollständigen Normtext. Layoutquellen, Maße und Prüfgrenzen stehen in [PRINT-LAYOUT.md](PRINT-LAYOUT.md).

## Veröffentlichung

Die Veröffentlichung verwendet GitHub Pages, einen Render-Free-Webdienst und Neon PostgreSQL. Details und kostenlose Tarifgrenzen: [DEPLOYMENT.md](DEPLOYMENT.md).

[Backend-Erklärung](backend/README.md) · [Nuxt-Erklärung](frontend/README.md) · [Prüfergebnisse](VALIDATION.md)

### E-Mail aus dem lokalen Briefstudio

Ohne SMTP kann das Briefstudio einen E-Mail-Entwurf mit PDF-Anhang als `.eml` speichern. Auf Geräten mit Unterstützung für das Teilen von Dateien steht auch der Systemdialog zur Verfügung.

Für direkten Versand im lokalen Nuxt-Server setze dort `NUXT_LETTER_MAIL_KEY` auf einen zufälligen geheimen Wert. Gib dem API-Prozess denselben Wert als `LetterMail__Key` sowie `LetterMail__Host`, `LetterMail__From` und bei Bedarf `LetterMail__Username` und `LetterMail__Password`. Die Vorgaben für Port und STARTTLS sind 587 und aktiviert. Sie lassen sich über `LetterMail__Port` und `LetterMail__StartTls` ändern. Verwende einen für SMTP zugelassenen Absender deines Mailanbieters. Die Versandoberfläche ist auf den Zugriff über Loopback beschränkt und auf statischem GitHub Pages steht der E-Mail-Entwurf zur Verfügung.

Briefhistorie und Versionsverlauf liegen im Browserprofil. Die aktuelle Briefvorlage verwendet wie bisher je nach Betriebsart die API oder den Browserspeicher.
