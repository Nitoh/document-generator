# Backend: klassischer Layered Monolith

Es gibt genau ein Projekt: `DocumentGenerator.Api`. Controller, Service, Repository und Datenmodell liegen als technische Schichten im selben Projekt. Wir verwenden konkrete Klassen, keine separaten Domain-/Application-/Infrastructure-Projekte und kein eigenes Unit-of-Work-Interface. EF Core übernimmt die Änderungsverfolgung und das Speichern.

## Start und Anfrageweg

Die Befehle für PostgreSQL, Migration und Start stehen in der [Hauptanleitung](../README.md).

Eine gespeicherte Vorlage durchläuft:

**Nuxt → TemplatesController → TemplateService → TemplateRepository → AppDbContext → PostgreSQL**

Bei der Texterzeugung genügt:

**Nuxt → DocumentsController → GenerateDocument → TemplateRenderer → JSON-Antwort**

## Dateien und zentrale Konzepte

- `DocumentGenerator.sln`: Bündelt das eine API-Projekt für IDE und gemeinsamen Build.
- `.gitignore`: Schließt lokale Build- und IDE-Dateien aus.
- `DocumentGenerator.Api.csproj`: `Microsoft.NET.Sdk.Web` definiert das Webprojekt für net10.0. Nullable-Prüfungen helfen bei null-Werten, implizite Usings stellen häufige Namespaces bereit. Npgsql verbindet EF Core mit PostgreSQL; EF Design stellt die Migrationserzeugung bereit; OpenAPI beschreibt die HTTP-Schnittstelle.
- `Program.cs`: `CreateBuilder` bereitet Konfiguration, Logging und Host vor. `AddControllers` registriert die MVC-Dienste, `MapControllers` ordnet eingehende Anfragen den Attributrouten zu. `AddDbContext` und `AddScoped` stellen pro HTTP-Anfrage die zusammengehörigen Abhängigkeiten bereit. Der Container baut Controller → Service → Repository → DbContext automatisch auf. `Run` startet Kestrel. `UseExceptionHandler` liefert bei unerwarteten Fehlern generische ProblemDetails statt interner Details. `--migrate` wendet ausdrücklich die Migrationen an und beendet den Prozess.
- `appsettings.json`: Enthält lokale PostgreSQL-Verbindung, Logging und Hostkonfiguration. Umgebungsvariablen können diese Werte überschreiben; für Verbindungen heißt die Variable `ConnectionStrings__Default`.

### Models

- `Models/DocumentTemplate.cs`: Einfaches Entity-Modell mit öffentlichen Settern: Id, Name, Type, Content und CreatedAt. Id und UTC-Zeitstempel erzeugt das Backend. Diese unkomplizierte Form ist für den ersten Monolithen beabsichtigt.
- `Models/DocumentType.cs`: Enum für Letter, Invoice und Reminder. In JSON werden lesbare Namen verwendet.

### DTOs

- `DTOs/CreateTemplateRequest.cs`: Transportiert Name, Type und Content. Der Client kann keine Id oder Erstellungszeit setzen. DataAnnotations prüfen Pflichtfelder und Längen; bei diesem Record stehen die Attribute an den Konstruktorparametern.
- `DTOs/TemplateResponse.cs`: Beschreibt die zurückgegebenen Vorlagendaten, unabhängig von der internen EF-Verfolgung.

### Data und Repository

- `Data/AppDbContext.cs`: EF-Core-Kontext mit `DbSet<DocumentTemplate>`. Das Modell legt Pflichtfelder, Längen und einen Index auf CreatedAt fest. Ein DbContext verfolgt Änderungen und ist nicht thread-sicher.
- `Repositories/TemplateRepository.cs`: Konkrete Datenzugriffsklasse. Leseabfragen verwenden `AsNoTracking`; Änderungen werden mit `SaveChangesAsync` gespeichert. Diese einfache Repository-Variante entspricht dem ersten Lernschritt. Später können mehrere Operationen unter einer gemeinsamen Arbeitseinheit zusammengefasst werden.
- `Migrations/*_InitialCreate.cs`: `Up` legt die Vorlagentabelle und den Index an; `Down` beschreibt deren Rücknahme.
- `Migrations/*_InitialCreate.Designer.cs`: Von EF erzeugte Metadaten und Zielmodell der initialen Migration.
- `Migrations/AppDbContextModelSnapshot.cs`: Von EF erzeugter letzter Modellstand als Basis zukünftiger Migrationen.

### Services

- `Services/TemplateService.cs`: Prüft fachliche Vorlageneingaben, erstellt Entities und gibt DTOs zurück. Er delegiert die Speicherung an das Repository.
- `Services/TemplateRenderer.cs`: Erkennt Platzhalter wie `{{Name}}`, prüft Syntax und fehlende Werte und ersetzt sie einmalig wörtlich. Groß-/Kleinschreibung ist relevant. Grenzen: Vorlage 20.000, einzelner Wert 5.000, Ergebnis 1.000.000 Zeichen. Ein eingesetzter Wert wird nicht erneut als Vorlage ausgewertet.
- `Services/GenerateDocument.cs`: Verbindet Vorlage und Werte zur Texterzeugung und liefert einen Ergebnisdatensatz mit Content und Fields.

### Controllers

- `Controllers/HealthController.cs`: `GET /api/health` bestätigt lediglich die Erreichbarkeit der API, nicht die Datenbankverbindung.
- `Controllers/TemplatesController.cs`: CRUD-Endpunkte. `[ApiController]` aktiviert automatische Eingabevalidierung; Attributrouten bestimmen URL und HTTP-Methode. `CreatedAtAction` liefert bei Erstellung 201 und eine aufrufbare Location. Fehlende Ids liefern 404, fachliche Eingabefehler 400.
- `Controllers/DocumentsController.cs`: Enthält das Eingabemodell für Texterzeugung und ruft den Generator auf. `Ok` erzeugt 200 mit JSON; die Ersetzungslogik liegt im Service.

### Tests

- `tests/smoke.py`: Prüft Erreichbarkeit, Erzeugung, Unicode, Syntax, fehlende Werte und Grenzen gegen die laufende API.
- `tests/templates.py`: Prüft Create/List/Get/Update/Delete mit echter Datenbank, Location, Zeitstempel, Validierung und unbekannten Ids. Entfernt nur seine selbst angelegte Vorlage.
- `README.md`: Diese Unterrichts- und Dateierklärung.

## Endpunkte

| Methode | Pfad | Zweck |
|---|---|---|
| GET | /api/health | API-Erreichbarkeit |
| GET | /api/templates | Vorlagen auflisten |
| GET | /api/templates/{id} | Vorlage abrufen |
| POST | /api/templates | Vorlage erstellen |
| PUT | /api/templates/{id} | Vorlage ändern |
| DELETE | /api/templates/{id} | Vorlage löschen |
| POST | /api/documents/generate | Text erzeugen |
| GET | /openapi/v1.json | API-Beschreibung |

Beispiel für POST /api/templates:

```json
{"name":"Terminbestätigung","type":"Letter","content":"Hallo {{Name}}!"}
```

Beispiel für POST /api/documents/generate:

```json
{"template":"Hallo {{Name}}!","values":{"Name":"Erika"}}
```

Antwort: `{"content":"Hallo Erika!","fields":["Name"]}`.

Für zukünftige Schemaänderungen EF-Werkzeug 10.0.14 bereitstellen und `dotnet ef migrations add NAME --project backend/DocumentGenerator.Api` verwenden. Generierte Migrationen prüfen und versionieren; `--migrate` wendet sie anschließend an.
