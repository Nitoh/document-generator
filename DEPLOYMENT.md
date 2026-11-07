# Hosting – vorbereitet, derzeit lokal

Es wurden weder Render-/Neon-Konten noch Cloud-Ressourcen angelegt. GitHub Pages wurde nicht aktiviert. Die öffentliche Veröffentlichung ist bewusst auf später verschoben.

## Lokale Entwicklung

PostgreSQL über compose.yaml, Backend mit `dotnet run --project backend/Api`, Nuxt mit `npm run dev`. Die ausführlichen Befehle stehen in README.md. Docker ist in der aktuellen Testumgebung nicht installiert; dort wurde echte PostgreSQL-Persistenz mit einer isolierten lokalen PostgreSQL-Instanz geprüft.

## GitHub Pages

GitHub Pages hostet statische Dateien, kein ASP.NET Core und keine PostgreSQL-Datenbank. Der Nuxt-Build unterstützt den Projektpfad `/document-generator/`.

Der Workflow `.github/workflows/verify-and-pages.yml` prüft Backend und Frontend und erstellt das statische Artefakt. Der Deployment-Job läuft erst, wenn `PAGES_DEPLOY_ENABLED=true` als Repository-Variable gesetzt wird oder der manuelle Workflow mit deploy=true auf master gestartet wird. Standardmäßig bleibt er aus.

Spätere Einrichtung:

1. GitHub → Repository → Settings → Pages → Source: GitHub Actions.
2. Für das private Repository einen Pages-fähigen GitHub-Tarif sicherstellen. Das Repository bleibt privat; wir ändern seine Sichtbarkeit nicht.
3. Optional PUBLIC_API_URL auf die öffentliche HTTPS-API-Adresse setzen, ohne abschließenden Slash. Ohne diese Variable entsteht ausdrücklich ein Browser-Modus mit Speicherung auf dem jeweiligen Gerät.
4. PAGES_DEPLOY_ENABLED=true setzen. Danach veröffentlichen erfolgreich geprüfte Änderungen an master automatisch.

Bei privatem Repository ist GitHub Pages nicht in jedem kostenlosen GitHub-Tarif enthalten. [GitHub-Dokumentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Späteres kostenloses Backend: Render + Neon

Vorbereitete Dateien: `backend/Api/Dockerfile`, `start.sh` und `render.yaml`. Der Blueprint beschreibt einen Free-Web-Service und enthält keine Datenbank-Zugangsdaten. Automatisches Render-Deployment ist zunächst aus.

Nach eigener Kontoanmeldung können wir gemeinsam:

- Eine Neon-PostgreSQL-Datenbank anlegen und ihre Verbindung ausschließlich als geheime Backend-Umgebungsvariable ConnectionStrings__Default setzen.
- Den Render-Free-Service aus dem privaten Repository bauen und die initialen Migrationen kontrolliert anwenden (APPLY_MIGRATIONS=true).
- CORS auf https://nitoh.github.io beschränken. CORS ist keine Anmeldung und schützt keine öffentlichen CRUD-Endpunkte vor direkten API-Aufrufen. Vor dem Speichern persönlicher produktiver Briefe in einer öffentlichen API gehört Zugriffsschutz als eigener Umsetzungsschritt dazu.
- Die Render-URL als PUBLIC_API_URL in GitHub setzen und Pages neu bauen.

Gratisbedingungen sind keine Verfügbarkeitsgarantie: Render-Free schläft nach 15 Minuten ohne Anfragen; der erste neue Aufruf kann ungefähr eine Minute benötigen. Render-Free-PostgreSQL läuft nach 30 Tagen ab und ist deshalb hier nicht als dauerhafte Datenbank vorgesehen. Neon hat einen kostenlosen Tarif mit begrenztem Speicher und Compute sowie Ruhemodus. Bei der tatsächlichen Einrichtung prüfen wir die dann geltenden Tarife erneut; es wird kein kostenpflichtiger Plan automatisch ausgewählt.

Primärquellen: [Render Free](https://render.com/docs/free), [Render Docker](https://render.com/docs/docker), [Neon Free Limits](https://github.com/neondatabase/website/blob/main/content/faqs/free-plan-limits-and-quotas.md).
