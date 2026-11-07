# Document Generator – funktionsfähiger Monolith

## Lokal starten

Voraussetzungen: .NET-10-SDK; Python 3 nur für den API-Smoke-Test.
Vom Repository-Stamm aus:

```sh
dotnet build backend/DocumentGenerator.sln -c Release
dotnet run --project backend/DocumentGenerator.Api -c Release --no-build --no-launch-profile --urls http://127.0.0.1:5080
```

Öffne http://127.0.0.1:5080 im Browser. Klicke „Beispiel laden“, dann „Dokument erstellen“. Die Vorschau enthält den fertigen Text, der als UTF-8-Textdatei heruntergeladen werden kann. Eigene Vorlagen sind direkt editierbar; Eingabefelder entstehen automatisch aus den Platzhaltern.

Ein Prozess liefert Oberfläche und API aus. Kein Node-Build, keine Datenbank und keine zusätzlichen NuGet-Pakete erforderlich. Vorlagen, Werte und Ergebnisse werden nicht dauerhaft gespeichert. Es gibt noch keine PDF-/Word-Ausgabe, Anmeldung oder Vorlagenverwaltung. Diese Version ist ein lokal ausführbarer erster Anwendungsfall, kein geprüftes öffentliches Produktionsdeployment.

## Architektur verstehen

Abhängigkeiten: API → Application → Domain. Die Solution bündelt diese drei Projekte; eine einzelne API-Anwendung startet sie gemeinsam. Das ist der Layered Monolith.

### Domain

- `DocumentGenerator.Domain.csproj`: Bibliothek für net10.0 ohne Projektabhängigkeiten.
- `DocumentTemplate.cs`: Fachliche Regeln und Texterzeugung. Platzhalter wie `{{Name}}` oder `{{ Datum }}` beginnen mit einem Buchstaben oder Unterstrich, gefolgt von Buchstaben, Ziffern oder Unterstrichen. Namen sind case-sensitive. Wiederholte Felder benötigen nur einen Wert. Ungültige Klammern, fehlende/leere Werte sowie zu große Vorlagen/Werte/Ergebnisse werden abgelehnt. Werte werden einmalig und wörtlich eingesetzt; Platzhalter innerhalb eines Werts werden nicht erneut ausgewertet.

### Application

- `DocumentGenerator.Application.csproj`: Bibliothek mit Referenz auf Domain.
- `GenerateDocument.cs`: Führt den Anwendungsfall aus: Vorlage erzeugen, Werte einsetzen, Ergebnis und Feldnamen zurückgeben. `GeneratedDocument` ist der unveränderliche Ergebnisdatensatz. Die Klasse kennt weder HTTP noch Browser.

### API

- `DocumentGenerator.Api.csproj`: Webprojekt; referenziert Application. Nullable-Prüfungen helfen bei null-Werten, implizite Usings stellen häufige Namespaces bereit.
- `Program.cs`: `CreateBuilder` bereitet Host, Logging und Konfiguration vor. `AddControllers` registriert die Controller-Dienste. `AddScoped<GenerateDocument>` stellt pro Anfrage eine Anwendungsfallinstanz durch Dependency Injection bereit. `Build` erstellt die Anwendung. `UseDefaultFiles` wählt für `/` die index.html, `UseStaticFiles` liefert HTML/CSS/JS aus. `MapControllers` bindet die Attributrouten ein. `Run` startet Kestrel. Die maximale Anfragegröße beträgt 1 MB.
- `Controllers/HealthController.cs`: `GET /api/health` bestätigt mit HTTP 200 und `{"status":"healthy"}`, dass die API antwortet. Keine Prüfung externer Dienste.
- `Controllers/DocumentsController.cs`: Enthält das HTTP-Eingabemodell und den Controller. `[ApiController]` und DataAnnotations prüfen Pflichtangaben und Vorlagenlänge. Der Konstruktor erhält den Anwendungsfall durch Dependency Injection. `[HttpPost("generate")]` ergänzt die Route zu `/api/documents/generate`. Fachliche Eingabefehler werden zu HTTP 400 im ProblemDetails-Format; der Controller enthält keine Ersetzungslogik.
- `wwwroot/index.html`: Deutsche, semantische Oberfläche mit beschrifteten Feldern, Statusbereich und Ergebnisanzeige.
- `wwwroot/styles.css`: Darstellung, sichtbare Tastaturfokusse und einspaltiges Layout für schmale Bildschirme.
- `wwwroot/app.js`: Erkennt Felder, sendet JSON mit fetch, zeigt Lade-/Fehlerzustände und erzeugt den Textdownload. `textContent` zeigt Eingaben als Text statt HTML. Änderungen verwerfen alte Ergebnisse; verspätete Antworten überschreiben keine neueren Eingaben. Anfragen haben ein Zeitlimit.

### Weitere Dateien

- `DocumentGenerator.sln`: Gemeinsamer Build der drei Projekte.
- `.gitignore`: Schließt bin/obj und lokale IDE-Dateien aus.
- `tests/smoke.py`: Wiederholbarer Integrationstest gegen die laufende API; benötigt nur die Python-Standardbibliothek.
- `README.md`: Diese Architektur-, Start- und Testanleitung.

Eine Infrastructure-Bibliothek wird erst benötigt, wenn technische Zugriffe wie Speicherung hinzukommen. Für die aktuelle reine Textverarbeitung gibt es dafür keine Implementierung.

## API-Beispiel

```http
POST /api/documents/generate
Content-Type: application/json

{"template":"Hallo {{Name}}!","values":{"Name":"Erika"}}
```

Antwort HTTP 200:

```json
{"content":"Hallo Erika!","fields":["Name"]}
```

Grenzen: Vorlage maximal 20.000 Zeichen, Wert maximal 5.000 Zeichen, Ergebnis maximal 1.000.000 Zeichen. Fehlende oder nur aus Leerraum bestehende Werte werden abgelehnt. Nicht verwendete Werte beeinflussen das Ergebnis nicht.

## Prüfung am 7. November 2026

- macOS ARM64, .NET SDK 10.0.403: Release-Build erfolgreich, 0 Warnungen, 0 Fehler.
- `node --check backend/DocumentGenerator.Api/wwwroot/app.js`: erfolgreich (Node nur zur Entwicklungsprüfung verwendet).
- Gegen die laufende API: `python3 backend/tests/smoke.py http://127.0.0.1:5080`. Erfolgreich geprüft: Health, HTML/CSS/JS, Texterzeugung, Unicode, wiederholte Felder, wörtliche Werte, Vorlagen ohne Felder, fehlende/leere Werte, Case-Sensitivity, ungültige Syntax, Vorlagen-/Werte-/Ergebnislimits, null-Werte und unbekannte Route.
- Browser: Beispiel laden → Dokument erstellen → Vorschau korrekt → Textdownload ausgelöst. Heruntergeladener UTF-8-Inhalt mit dem erwarteten Ergebnis verglichen: korrekt.
- Browser: Eingabeänderung deaktiviert alten Download und verwirft Vorschau. Script-Text wird sichtbar als Text ausgegeben. Fehler bei ungültigem Platzhalter wird angezeigt.
- Responsive-Prüfung mit 390 px: eine Spalte, Dokumentbreite 390 px ohne horizontalen Überlauf. Desktopdarstellung visuell geprüft.
- `dotnet publish` erfolgreich; derselbe API-Smoke-Test bestand auch gegen das veröffentlichte Paket einschließlich der ausgelieferten Frontend-Dateien.
- Der eingeschränkte Build blieb ohne Fortschritt; der erfolgreiche Build und die lokalen HTTP-Tests liefen außerhalb dieser Einschränkung. Kein HTTPS-/Deployment-/Lasttest. Keine Datenbanktests, da keine Datenbank verwendet wird.

## Veröffentlichen als lokales Paket

```sh
dotnet publish backend/DocumentGenerator.Api -c Release -o artifacts/document-generator
cd artifacts/document-generator
dotnet DocumentGenerator.Api.dll --urls http://127.0.0.1:5080
```

Auch dafür ist die .NET-10-/ASP.NET-Core-Laufzeit erforderlich. Der veröffentlichte Ordner enthält die Oberfläche in wwwroot.
