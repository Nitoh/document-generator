# Frontend: Nuxt

Ein echtes Nuxt-4-Projekt mit Vue, TypeScript und Nitro-Server. Kein statisches Ersatzfrontend im Backend.

## Dateien verstehen

- `package.json`: Nuxt/Vue-Abhängigkeiten und Befehle für Entwicklung, Typprüfung und Build.
- `package-lock.json`: Fixiert die tatsächlich installierten Versionen für reproduzierbares `npm ci`.
- `nuxt.config.ts`: Konfiguration, globale CSS-Datei, deutscher Seitentitel und private Backend-Adresse. Über `NUXT_BACKEND_URL` zur Laufzeit überschreibbar.
- `tsconfig.json`: Verweist auf die von Nuxt erzeugten TypeScript-Konfigurationen.
- `app/app.vue`: Oberfläche mit Composition API. `ref` hält reaktive Werte, `computed` ermittelt eindeutige Platzhalter, `watch` verwirft veraltete Ergebnisse. `v-model` verbindet Eingabefelder mit Zustand, `v-for` erzeugt die Felder und Vorlagenliste. `$fetch` sendet HTTP-Anfragen. Es gibt Lade-, Fehler- und Leerzustände. Gespeicherte Vorlagen lassen sich auswählen, ändern und löschen. Die Ergebnisausgabe verwendet Vue-Textinterpolation; Vorlagen werden niemals als Vue-Code oder HTML ausgeführt.
- `app/assets/main.css`: Layout und Farben, Tastaturfokusse und einspaltiges Layout für schmale Ansichten.
- `server/api/[...path].ts`: Nitro-Proxy leitet nur den API-Pfad an die konfigurierte Backend-Adresse weiter. Browser und Nuxt verwenden denselben Ursprung; dadurch brauchen wir keine großzügige CORS-Freigabe im Backend. Fachliche Logik bleibt in ASP.NET Core.
- `README.md`: Diese Anleitung.

Nuxt/Nitro läuft als Frontend-Server, ASP.NET Core als einzelner Backend-Monolith. Das ist keine Aufteilung des Backends in Microservices.

## Befehle

```sh
npm ci
npm run dev
npm run typecheck
npm run build
```

Die API wird standardmäßig unter http://127.0.0.1:5080 erwartet. Browser: http://127.0.0.1:3000.

Produktionsbuild lokal starten:

```sh
HOST=127.0.0.1 PORT=3000 node .output/server/index.mjs
```

Bei abweichendem Backend-Port `NUXT_BACKEND_URL` setzen. Voraussetzungen und Datenbankstart stehen in der [Hauptanleitung](../README.md).
