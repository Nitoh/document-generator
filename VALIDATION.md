# Durchgeführte Prüfungen

Stand: 7. November 2026, macOS ARM64.

## Erfolgreich

- .NET SDK 10.0.403; genau ein Backend-Projekt in der Solution.
- `dotnet build backend/DocumentGenerator.sln -c Release`: 0 Warnungen, 0 Fehler.
- Initiale EF-Core-Migration erzeugt, auf echter PostgreSQL-18.6-Testinstanz angewendet; anschließend keine ausstehenden Modelländerungen (`migrations has-pending-model-changes`). Die erste Datenbankabfrage nach der noch fehlenden Migrationshistorie wurde von EF geloggt, die Migration wurde danach erfolgreich angewendet.
- `backend/tests/smoke.py`: API-Erreichbarkeit, Texterzeugung, Unicode, wiederholte Felder, wörtliche Werte, fehlende/leere Werte, Groß-/Kleinschreibung, Syntax, Größenlimits, null und unbekannte Route.
- `backend/tests/templates.py`: Erstellen, Auflisten, Abrufen, Ändern, Löschen, Location, Zeitstempel, Validierung und unbekannte Ids. Erfolgreich direkt gegen die API und über Nuxts API-Proxy.
- `/openapi/v1.json` direkt am Backend liefert die API-Beschreibung. Diese Route ist kein Teil des Nuxt-Proxys für `/api/*`.
- Nuxt 4.6.4, Vue 3.5.45, Node 26.11.1: `npm run typecheck` und `npm run build` erfolgreich.
- Browser mit gebautem Nuxt/Nitro-Server: Vorlage speichern, nach Backend-Neustart wiederfinden, auswählen, Name ändern und speichern, Werte einsetzen, Ergebnis anzeigen.
- Download über Nuxt ausgelöst; heruntergeladenen UTF-8-Inhalt exakt verglichen.
- Browser: Eine Eingabeänderung verwirft das alte Ergebnis und deaktiviert den Download. Script-Text erscheint wörtlich im Ergebnis.
- Nach Backend-Neustart vollständige Vorlagenliste exakt mit dem vorher gelesenen Stand verglichen: unverändert.
- Nuxt bei 390 px: eine Spalte, Dokumentbreite 390 px ohne horizontalen Überlauf; Desktopansicht visuell geprüft.

## Im Test gefundene und behobene Fehler

- Alte Build-Webasset-Ausgaben der verworfenen statischen Oberfläche störten zunächst die Migrationserzeugung. Nach Clean/Build war die Migrationserzeugung erfolgreich.
- Ein Vue-Template-Beispiel mit wörtlichen Doppelklammern verursachte einen Buildfehler; durch `v-pre` korrigiert, Build danach erfolgreich.
- Validierungsattribute des Request-Records standen zunächst an den Properties statt den Konstruktorparametern; der erste CRUD-Test lieferte 500. Attribute korrigiert, direkter und über Nuxt ausgeführter CRUD-Test danach erfolgreich.
- Der erste kombinierte Proxy-Test versuchte zusätzlich die nur im Backend bereitgestellte OpenAPI-Route abzurufen. OpenAPI wird nun getrennt direkt geprüft; der CRUD-Proxy-Test besteht.

## Grenzen

Docker und Compose sind in dieser Umgebung nicht installiert. Deshalb wurde die versionierte Compose-Datei nicht mit Docker gestartet. Für die echten Datenbanktests lief stattdessen eine isolierte PostgreSQL-Instanz im Arbeitsordner, auf lokalem Port 55432. Dieses Testhilfsmittel ist keine Projektabhängigkeit. Keine Behauptung eines getesteten Compose-Starts.

Getestete Ports: API 5085, Nuxt 3000. Die Anleitungen verwenden den vorgesehenen Standardport 5080; `NUXT_BACKEND_URL` wurde im Test entsprechend gesetzt. Builds und lokale Servertests liefen außerhalb der eingeschränkten Ausführungsumgebung.

Kein öffentliches Deployment, HTTPS-, Authentifizierungs- oder Lasttest. Browser-Löschen wurde nicht ausgeführt; der API-Test prüft Löschen ausschließlich mit einer selbst erzeugten Testvorlage. Keine automatisierte Browser-Testsuite; die wiederholbaren API-Tests sind versioniert.
