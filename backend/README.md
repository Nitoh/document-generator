# Backend – ein einfacher Monolith

## Warum der Ordner jetzt Api heißt

`dotnet new webapi -n DocumentGenerator.Api` verwendet den Projektnamen standardmäßig auch als Ordnernamen. Das ist eine verbreitete Konvention, aber keine technische Voraussetzung. Hier reicht `backend/Api`, weil der Repository-Kontext bereits „Document Generator“ ist. Projektdatei und Assembly heißen weiterhin `DocumentGenerator.Api`; damit bleibt ihre Identität eindeutig. Ein Namespace muss nicht den Verzeichnispfad wiederholen.

Das einzige Anwendungsprojekt enthält die technischen Schichten als Ordner. `Api.Tests` enthält Tests und wird nicht mit der Anwendung deployed. Es wurden keine Domain-/Application-/Infrastructure-Projekte eingeführt.

## Abhängigkeiten und Anfragewege

```text
DocumentsController → DocumentService → TemplateRenderer
TemplatesController → TemplateService → TemplateRepository → AppDbContext → PostgreSQL
```

`Program.cs` registriert die konkreten Services per `AddScoped`. ASP.NET Core stellt die Abhängigkeiten im Controller-Konstruktor bereit. Ein Scoped-Objekt wird pro HTTP-Anfrage erzeugt; das passt zur Lebensdauer des DbContext. Wir brauchen dafür keine Interfaces ohne konkrete alternative Implementierung.

## Dateien und Verantwortlichkeiten

- `Api/DocumentGenerator.Api.csproj`: Webprojekt, net10.0, Nullable-Prüfungen, EF Core/Npgsql, OpenAPI. Keine fachlichen Projektgrenzen.
- `Api/Program.cs`: Konfiguration, DI, Controller-Routing, JSON-Enums, ProblemDetails, gezielte CORS-Konfiguration, OpenAPI und Kestrel. `--migrate` führt die Datenbankeinrichtung aus und endet. `public partial Program` macht den Einstiegspunkt für HTTP-Tests zugänglich.
- `Api/appsettings.json`: Lokale Datenbank- und Logging-Konfiguration. Umgebungsvariablen überschreiben sie.
- `Controllers/DocumentsController.cs`: Nimmt HTTP-Daten entgegen, ruft den injizierten `DocumentService` auf und übersetzt Eingabefehler in HTTP 400. Enthält keine Ersetzungslogik.
- `Controllers/TemplatesController.cs`: CRUD mit 201/Location, 200, 204 und 404. Delegiert an TemplateService.
- `Controllers/HealthController.cs`: Erreichbarkeitstest; kein Datenbank-Readiness-Test.
- `Services/DocumentService.cs`: Klar benannter Anwendungsservice für Dokumenterstellung. Nutzt den Renderer und gibt ein Response-DTO zurück.
- `Services/TemplateRenderer.cs`: Syntax, eindeutige Felder, fehlende Werte, wörtliche Ersetzung und Größenlimits.
- `Services/TemplateService.cs`: Fachliche Validierung von Vorlagen, Entity-/DTO-Abbildung und Serialisierung der optionalen Layoutdaten.
- `Repositories/TemplateRepository.cs`: Konkrete Datenzugriffsklasse. Leseabfragen verwenden AsNoTracking, Änderungen SaveChangesAsync. Das ist die bewusst einfache Repository-Variante des ersten Monolithen.
- `Models/DocumentTemplate.cs`: Persistierte Vorlage mit Id, Name, Type, Content, CreatedAt und optionalem LayoutJson.
- `Models/DocumentType.cs`: Letter, Invoice, Reminder; die Oberfläche konzentriert sich aktuell auf Briefe.
- `DTOs/GenerateDocumentRequest.cs`, `GeneratedDocumentResponse.cs`: Separater Vertrag für Texterzeugung; keine DTO-Definition im Controller.
- `DTOs/CreateTemplateRequest.cs`, `TemplateResponse.cs`: Übertragungsmodelle für Vorlagen. Id und CreatedAt werden serverseitig gesetzt. Request-Record-Attribute stehen an den Konstruktorparametern.
- `DTOs/LetterLayout.cs`: Begrenzte strukturierte Felder für Briefkopf, Empfänger, Betreff, Anrede, Abschluss und Druckoptionen.
- `Data/AppDbContext.cs`: DbSet, Pflichtfelder, Längen und Index. EF Core übernimmt Change Tracking und Speichern; kein eigenes Unit-of-Work-Framework.
- `Migrations/*InitialCreate*`: Initiale Tabelle mit generierten Metadaten.
- `Migrations/*AddLetterLayout*`: Additive optionale Layoutspalte; vorhandene Vorlagen bleiben erhalten.
- `Migrations/AppDbContextModelSnapshot.cs`: Von EF erzeugter letzter Modellstand.
- `Api/Dockerfile`, `start.sh`: Mehrstufiger Linux-Build, nicht privilegierter Laufzeitbenutzer. Migration beim Containerstart nur bei explizitem APPLY_MIGRATIONS=true.
- `Api.Tests/DocumentServiceTests.cs`: Regeln und Grenzfälle ohne HTTP/Datenbank.
- `Api.Tests/ApiTests.cs`: In-Process-HTTP-Tests mit WebApplicationFactory für Health, Routing, JSON, DI und Eingabevalidierung.
- `Api.Tests/TemplatePersistenceTests.cs`: PostgreSQL-Migration, CRUD, gespeichertes Layout und Persistenz über eine neue Anwendungsinstanz hinweg. Ohne TEST_DATABASE_CONNECTION klar als übersprungen ausgewiesen.

## Befehle

Vom Repository-Stamm:

```sh
dotnet build backend/DocumentGenerator.sln -c Release
dotnet run --project backend/Api -c Release --no-build -- --migrate
dotnet run --project backend/Api -c Release --no-build --urls http://127.0.0.1:5080
dotnet test backend/DocumentGenerator.sln -c Release
```

Neue Migrationen: `dotnet tool restore`, danach `dotnet ef migrations add NAME --project backend/Api`. Versioniertes Toolmanifest liegt unter `.config/`.

## HTTP-Endpunkte

GET `/api/health`; GET/POST `/api/templates`; GET/PUT/DELETE `/api/templates/{id}`; POST `/api/documents/generate`; GET `/openapi/v1.json`.

```json
{"template":"Hallo {{Name}}!","values":{"Name":"Erika"}}
```

Antwort: `{"content":"Hallo Erika!","fields":["Name"]}`. Platzhalternamen beachten Groß-/Kleinschreibung. Werte werden niemals erneut als Vorlage ausgewertet.

## Kategorien und wiederverwendbare Bausteine

`DocumentTemplate.Category` ist ein eigener, auf 80 Zeichen begrenzter Wert. `AddTemplateCategory` fügt die Spalte mit dem Default „Allgemeines“ hinzu; vorhandene Inhalte bleiben erhalten. Die DTOs nehmen Kategorie separat vom Layout an.

`LetterLayout.Design` und `HeaderStyle` haben begrenzte erlaubte Ids und abwärtskompatible Defaults. `ClosingText` ergänzt einen optionalen Abschlussabsatz. Der DocumentService ersetzt Platzhalter auch in Betreff, Anschrift, Anrede und Abschluss; ersetzte Layoutwerte werden erneut gegen ihre Feldlängen geprüft. TemplateService speichert die ursprünglichen Bausteine samt Default-Auswahl, nicht die für einen Brief eingesetzten Werte.
