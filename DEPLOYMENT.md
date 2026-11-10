# Kostenloses Hosting

GitHub Pages liefert den statischen Nuxt-Build. Render betreibt den ASP.NET-Core-Monolithen als Docker-Webdienst. Neon stellt PostgreSQL bereit. Npgsql ist der Treiber, über den EF Core die Datenbank anspricht.

## Backend

1. Auf Neon ein Free-Projekt mit PostgreSQL in einer passenden Region anlegen. Die gepoolte PostgreSQL-URI in Neon kopieren.
2. Auf Render im Hobby-Workspace einen Docker-Webdienst mit Instanztyp **Free** aus `master` anlegen. Dockerfile `./backend/Api/Dockerfile`, Kontext `.`, Health Check `/api/health`. `render.yaml` dokumentiert die Konfiguration. Kein persistenter Render-Datenträger ist erforderlich.
3. `ConnectionStrings__Default` ausschließlich im Render-Dashboard setzen. Die API akzeptiert die Neon-URI und prüft das TLS-Zertifikat. Alternativ kann eine Npgsql-Verbindungszeichenfolge verwendet werden. `APPLY_MIGRATIONS=true` startet zuerst die vorhandenen EF-Core-Migrationen.
4. `StudioAccess__Required=true` und `StudioAccess__Key` setzen. Einen zufälligen Schlüssel mit mindestens 32 Zeichen verwenden, etwa per `openssl rand -hex 32`. Den Schlüssel persönlich aufbewahren und im veröffentlichten Studio eingeben. Die API schützt Vorlagen und Dokumentgenerierung und stellt den Health-Endpunkt öffentlich bereit.
5. `Cors__AllowedOrigins__0=https://nitoh.github.io` setzen. CORS begrenzt Browserzugriffe. Der persönliche Zugriffsschlüssel schützt die API unabhängig davon.
6. Für den Git-verbundenen Dienst **After CI Checks Pass** aktivieren. So baut Render neue Commits auf `master` nach erfolgreicher GitHub-Prüfung.

## Frontend

Unter GitHub → Settings → Pages **GitHub Actions** als Quelle auswählen. `PUBLIC_API_URL` als Repository-Variable mit der HTTPS-URL von Render setzen. GitHub Actions baut nach erfolgreichen Prüfungen den Nuxt-Projektpfad `/document-generator/` und veröffentlicht ihn für das öffentliche Repo. Ohne `PUBLIC_API_URL` verwendet der Build den Browserspeicher. `PAGES_DEPLOY_ENABLED=false` pausiert automatische Veröffentlichungen.

## Prüfung und spätere Änderungen

- `GET /api/health` auf Render prüfen. Ein anschließendes authentifiziertes Lesen und Schreiben einer Testvorlage prüft die PostgreSQL-Verbindung. Unautorisierte Vorlagenaufrufe müssen HTTP 401 ergeben.
- Auf Pages das Studio öffnen, entsperren und eine Vorlage abrufen. Die Verbindung enthält ausschließlich die öffentliche API-Adresse. Der persönliche Zugriffsschlüssel bleibt in der jeweiligen Browsersitzung. Historie, Formulare, Bildbibliothek und Versionen bleiben browserlokal.
- Künftige Änderungen über einen Pull Request nach `master` mergen. GitHub Actions veröffentlicht den geprüften Build und Render übernimmt den API-Stand nach CI. Die tatsächlichen Deployments stehen im Actions- und Render-Dashboard.

Render Hobby ohne Zahlungsmittel und Neon Free verwenden. Bei überschrittenen Freikontingenten mit Pausen rechnen. [Render Free](https://render.com/docs/free) · [Neon-Tarife](https://neon.com/pricing) · [Pages-Limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
