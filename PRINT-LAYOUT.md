# Brief- und PDF-Layout

## Gestaltungsziel

Professionelle, druckbare deutsche Briefe im A4-Hochformat, orientiert an DIN 5008 Form B. Die Anwendung beansprucht keine Zertifizierung gegen den vollständigen, kostenpflichtigen Normtext.

Als öffentlich zugängliche Primärquelle wurde das [Themenheft Geschäftsbriefe der Deutschen Post](https://www.deutschepost.de/dam/jcr:df2156f4-6bef-4ab8-b8a1-6354b8057b4a/dp-post-und-schule-themenheft-geschaeftsbriefe-022021.pdf) herangezogen. Die Norm selbst ist bei [DIN Media](https://www.dinmedia.de/de/norm/din-5008/318422674) beschrieben.

## Umgesetzte Maße und Elemente

- Physische PDF-Seite: 210 × 297 mm.
- Schreibbereich: links 25 mm, rechts 20 mm, Breite 165 mm.
- Anschriftfeld: links 20 mm, oben 45 mm, 85 × 45 mm; Text innerhalb des Feldes ab 25 mm.
- Empfängerzone: 17,7 mm unter Beginn des Anschriftfelds; Rücksendeangabe darüber.
- Briefkopf und optionales Vektor-N-Logo oberhalb des Anschriftfelds.
- Separater Informationsblock mit Referenz, Telefon, E-Mail und Datum rechts.
- Hervorgehobener Betreff ohne vorangestelltes Wort „Betreff“, danach Anrede, Text und Abschluss.
- Grußformel und Name bleiben zusammen; Platz für eine handschriftliche Unterschrift.
- Optional Falzmarken bei 105/210 mm und Lochmarke bei 148,5 mm.
- Fortsetzungsseiten mit reduziertem Kopf und Seitenzähler.

## Technische Umsetzung

Die Vorschau misst die tatsächliche Carlito-Schrift und bricht Text in Zeilen auf. Die reine Pagination verteilt sie ohne Verlust auf Seiten. Der PDF-Export misst mit derselben eingebetteten Schrift direkt in PDF-Millimetern und verwendet dieselbe Pagination. Vorlagenwerte bleiben Text; weder Vue-Code noch HTML werden aus Briefdaten ausgeführt.

Carlito Regular/Bold sind lokal gebündelt, mit OFL-Lizenz. Der PDF-Download enthält die benötigten Schriftinformationen; kein externer Font-Dienst und kein Screenshot des Briefes. Das Logo wird als Vektor gezeichnet.

Überlange Anschriften, Rücksendeangaben und Informationsblöcke werden beim Export abgelehnt, statt abgeschnitten zu werden. Die Vorschau unterstützt maximal 50.000 Zeichen; PDFs höchstens 50 Seiten. Die serverseitige Textverarbeitung hat eigene dokumentierte Größenlimits.

„PDF herunterladen“ ist der bevorzugte Druckweg. „Drucken“ steht zusätzlich zur Verfügung; Browser müssen dabei A4, 100 % Skalierung und deaktivierte Browser-Kopf-/Fußzeilen verwenden. Der tatsächliche native Druckdialog konnte in der Testumgebung nicht zuverlässig bedient werden; der direkte PDF-Weg wurde vollständig geprüft.

## Prüfung

Ein Musterbrief wurde als PDF erzeugt und gerendert: A4, korrekte Anschrift, Datum, Brieftext und Abschluss. Ein fünfseitiger Test mit 150 nummerierten Zeilen wurde auf Reihenfolge, Vollständigkeit, Sonderzeichen und Seitenränder geprüft. Erste und Fortsetzungsseite wurden visuell kontrolliert. Alle Zeichen lagen innerhalb der Seiten. Auch der über die Browseroberfläche heruntergeladene Musterbrief wurde geöffnet und inhaltlich geprüft.
