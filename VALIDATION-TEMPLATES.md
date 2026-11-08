# Prüfung: kategorisierte Vorlagen und Baukasten

8. November 2026. Lokal .NET SDK 10.0.403, macOS ARM64; echte PostgreSQL-Instanz.

- Release-Build erfolgreich, 0 Warnungen/Fehler; 17 C#-Tests bestanden, keiner übersprungen.
- Integration: Kategorien und Layout-/Briefkopf-Defaults anlegen, nach neuer Anwendungsinstanz wiederfinden und ändern. Leere Kategorie abgelehnt.
- Additive Migration AddTemplateCategory auf vorhandenen lokalen Bestand angewendet. Vorlagen-Ids, Namen, Inhalte und Erstellungszeiten vorher/nachher verglichen: erhalten. Alte Vorlagen unter Allgemeines.
- DocumentService: Platzhalter in Brieftext, Betreff, Anrede, Abschlussabsatz und Grußformel; fehlende und zu lange Layoutwerte abgelehnt.
- Typecheck, 14 Vitest-Tests, Nuxt-Produktionsbuild und statischer Generate-Build für /document-generator/ bestanden.
- Alle neun Kombinationen aus drei Layouts und drei Briefköpfen unabhängig für Kündigung/Vollmacht getestet. Jede Kombination erzeugt eine A4-PDF.
- Klassisch/Standard, Minimal/Kompakt und Linie/Zentriert als PDFs gerendert und visuell geprüft. Abschlussabsatz und Unterschrift vorhanden, Text innerhalb der A4-Grenzen.
- Browser: Neue Kündigung in eigener Kategorie Verträge, Layout Linie, zentrierter Kopf und geschlechtsneutrale Anrede zusammengebaut und gespeichert. Werte ausgefüllt, auf Minimal gewechselt und fertiggestellt: Betreff und Anrede korrekt ersetzt.
- Gespeicherten Default direkt über API nachgelesen: weiterhin Linie/Zentriert; der temporäre Layoutwechsel hat ihn nicht verändert. Aus Kategorie-Filter erneut geöffnet: ursprüngliche Defaults wieder geladen.
- Kategorie-Filter zeigt nur die passenden Vorlagen. Baukasten enthält Kündigung, Vollmacht und Anfrage als frei bearbeitbare Ausgangspunkte. Abschlussabsätze sind zusätzlich zu Grußformeln wählbar.

Hosting bleibt unverändert vorbereitet, aber deaktiviert. Kein neues Cloud-Deployment, keine Konto- oder Tarifänderung. Die Vorlagenarchitektur bleibt ein einzelnes ASP.NET-Core-Anwendungsprojekt plus Tests. Kein Anspruch auf rechtliche Vollständigkeit der frei bearbeitbaren Beispieltexte.
