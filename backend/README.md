# Backend – Schritt 1

Voraussetzung: .NET-10-SDK.

## Bauen und starten

Vom Repository-Stamm aus:

```sh
dotnet build backend/DocumentGenerator.sln --configuration Release
dotnet run --project backend/DocumentGenerator.Api --configuration Release --no-build --no-launch-profile --urls http://127.0.0.1:5080
```

In einem zweiten Terminal:

```sh
curl -i http://127.0.0.1:5080/api/health
```

Erwartet: HTTP 200, Content-Type `application/json` und `{"status":"healthy"}`.
Die explizite HTTP-Adresse dient dem lokalen Einstieg.

## Dateien und Konzepte

- `DocumentGenerator.sln`: Die Solution bündelt die Projekte für IDE und Build. Sie enthält zunächst nur das API-Projekt.
- `DocumentGenerator.Api/DocumentGenerator.Api.csproj`: Definiert mit `Microsoft.NET.Sdk.Web` ein Webprojekt für `net10.0`. Nullable-Prüfungen helfen beim Umgang mit möglichen null-Werten; implizite Usings stellen häufige Namespaces bereit. Es gibt keine zusätzlichen NuGet-Pakete.
- `DocumentGenerator.Api/Program.cs`: Einstiegspunkt. `CreateBuilder(args)` lädt die Standardkonfiguration und bereitet den Host vor. `Services` ist die Dienstregistrierung für Dependency Injection; `AddControllers()` registriert MVC-Controller-Dienste. `Build()` erstellt die Anwendung. `MapControllers()` bindet die Attributrouten der Controller ein. `Run()` startet den Host mit dem Webserver Kestrel und wartet auf Anfragen.
- `DocumentGenerator.Api/Controllers/HealthController.cs`: `ControllerBase` bietet API-Hilfsmethoden ohne View-Funktionen. `[ApiController]` aktiviert API-Konventionen, unter anderem automatische Validierungsantworten bei späteren Eingabemodellen. `[Route("api/health")]` bestimmt den Pfad, `[HttpGet]` die HTTP-Methode. `Ok(...)` liefert HTTP 200; ASP.NET Core serialisiert das Objekt als JSON.
- `.gitignore`: Hält generierte `bin/`- und `obj/`-Ordner sowie lokale IDE-Dateien aus Git heraus.
- `README.md`: Diese Anleitung mit Dateierklärungen und Prüfergebnissen.

Anfrageweg: Client → Kestrel → Routing → HealthController.Get() → JSON-Antwort.

Der Health-Endpunkt bestätigt nur, dass die API Anfragen beantworten kann. Er prüft keine externen Dienste. PostgreSQL, EF Core, Repository, Unit of Work, weitere Schichten und fachliche Features sind nicht Bestandteil dieses Schritts.

## Durchgeführte Prüfung am 7. November 2026

Umgebung: macOS ARM64, .NET SDK 10.0.403, Release-Konfiguration.

- `dotnet build backend/DocumentGenerator.sln --configuration Release`: erfolgreich, 0 Warnungen, 0 Fehler.
- Gebaute API mit Kestrel auf `http://127.0.0.1:5082` gestartet: erfolgreich.
- `GET /api/health`: HTTP 200, `application/json; charset=utf-8`, Antwort exakt `{"status":"healthy"}`; Status, Content-Type und JSON-Inhalt geprüft.
- `POST /api/health`: HTTP 405.
- `GET /api/missing`: HTTP 404.
- Server nach dem Test beendet.

Die ersten Startversuche in der eingeschränkten Ausführungsumgebung lieferten keine Serverausgabe; ein erster Verbindungsversuch schlug fehl. Der erfolgreiche HTTP-Test erfolgte anschließend mit demselben Release-Artefakt außerhalb dieser Einschränkung. Keine Prüfung von HTTPS, Deployment oder externen Diensten; kein separates automatisiertes Testprojekt angelegt.
