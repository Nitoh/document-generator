# Document Generator

Lernprojekt: ein klassischer Layered Monolith mit **einem ASP.NET-Core-Projekt**, **EF Core/PostgreSQL** und einem separaten **Nuxt-Frontend**. Die technischen Schichten sind Ordner im API-Projekt. Clean Architecture und eine Aufteilung in mehrere Backend-Projekte folgen erst in einer späteren Lernphase.

## Lokal starten

Voraussetzungen: .NET-10-SDK, Node.js 22.12+ (unterstützte gerade Version), npm und Docker mit Compose. Python 3 wird nur für die API-Tests benötigt.

Vom Repository-Stamm:

```sh
docker compose up -d --wait
dotnet build backend/DocumentGenerator.sln -c Release
dotnet run --project backend/DocumentGenerator.Api -c Release --no-build -- --migrate
dotnet run --project backend/DocumentGenerator.Api -c Release --no-build --urls http://127.0.0.1:5080
```

In einem zweiten Terminal:

```sh
cd frontend
npm ci
npm run dev
```

Öffne http://127.0.0.1:3000. Vorlage speichern → gespeicherte Vorlage auswählen → Platzhalter ausfüllen → Dokument erstellen → Textdatei herunterladen. Name, Dokumenttyp und Inhalt können geändert und erneut gespeichert werden. Löschen erfordert eine Bestätigung in der Oberfläche.

Compose startet PostgreSQL mit einem persistenten Volume. `docker compose down` beendet den Container und erhält das Volume. `--migrate` ist ein expliziter Einrichtungsbefehl, der die eingecheckten EF-Core-Migrationen anwendet und danach endet. Beim normalen Serverstart werden keine Schemaänderungen ausgeführt.

Die Beispiel-Zugangsdaten in `appsettings.json` und Compose sind ausschließlich für die lokale Entwicklung. Mit `ConnectionStrings__Default` kann die vollständige Verbindung konfiguriert werden. Wenn `POSTGRES_PASSWORD` geändert wird, muss die Backend-Verbindung denselben Wert verwenden. Die Datenbank ist lokal an 127.0.0.1 gebunden. Bestehende Volumes behalten ihre ursprünglichen Zugangsdaten.

Nuxt leitet `/api/*` serverseitig an die API weiter. Für eine andere Backend-Adresse: `NUXT_BACKEND_URL=http://127.0.0.1:5080`. Es ist keine CORS-Freigabe nötig.

## Aufbau

```text
backend/
  DocumentGenerator.sln
  DocumentGenerator.Api/
    Controllers/     HTTP-Endpunkte
    Services/        Anwendungslogik und Textverarbeitung
    Repositories/    Datenzugriff mit konkreten Klassen
    Models/          Vorlagenmodell und Dokumenttyp
    DTOs/            Ein- und Ausgabedaten für Vorlagen
    Data/            EF-Core-DbContext
    Migrations/      Versioniertes Datenbankschema
frontend/            Eigenständiges Nuxt-Projekt mit Vue und TypeScript
compose.yaml         Lokales PostgreSQL mit Volume und Healthcheck
```

Erklärungen zu jeder Datei und den ASP.NET-Core-Konzepten: [Backend-Anleitung](backend/README.md). Nuxt-Aufbau: [Frontend-Anleitung](frontend/README.md). Ehrliche Prüfergebnisse: [VALIDATION.md](VALIDATION.md).

## Wiederholbare Prüfungen

Bei laufender API und PostgreSQL:

```sh
python3 backend/tests/smoke.py http://127.0.0.1:5080
python3 backend/tests/templates.py http://127.0.0.1:5080
```

Der Vorlagentest legt eine eigene Testvorlage an und entfernt nur diese wieder. Derselbe CRUD-Test funktioniert bei laufendem Nuxt auch gegen `http://127.0.0.1:3000`.

```sh
cd frontend
npm run typecheck
npm run build
```

Produktionsbuild lokal ausführen: im Frontend-Ordner `HOST=127.0.0.1 PORT=3000 node .output/server/index.mjs`. Backend separat mit `dotnet publish backend/DocumentGenerator.Api -c Release -o artifacts/backend` veröffentlichen. Die Datenbankverbindung und das Anwenden der Migrationen bleiben explizite Schritte.

Vorlagen werden dauerhaft gespeichert. Eingesetzte Werte und erzeugte Dokumente werden nicht gespeichert. Ausgabe ist zunächst Klartext (.txt), nicht PDF/Word. Keine Anmeldung oder öffentlich geprüfte Produktionsbereitstellung; der aktuelle Stand ist für die lokale Lernumgebung bestimmt.
