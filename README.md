# WG-Kasse Schleißheimer Straße 🧾💶

Eine komplett kostenlose (0,00 € laufende Kosten), mobil-optimierte Web-App (PWA) für Mitbewohner zur Belegerfassung per KI, Schulden-Berechnung und Ausgaben-Analyse.

---

## 💡 Das Konzept

- **100 % kostenlos:** Kein kostenpflichtiger Server, keine Datenbankgebühren.
  - **Frontend:** Gehostet via **GitHub Pages** (als PWA auf dem iPhone installierbar).
  - **Backend:** **Google Apps Script** (Serverless REST/Proxy im Google-Konto).
  - **KI-Erkennung & Chatbot:** **Google Gemini API** (`gemini-2.5-flash` im kostenlosen Free Tier).
  - **Datenbank:** **Google Sheets** (volle Datentransparenz und einfaches Backup).
- **Splitwise-Ersatz:** Live-Saldo (*„Wer schuldet wem wie viel?“*) mit 1-Klick-Begleichung (*„Settle Up“*).
- **Smarte Erfassung:** Kassenbons (Kamera-Scan), Restaurant-Rechnungen, Freizeit-Ausgaben oder schnelle Freitext-Eingabe (*„45€ Thai Restaurant gestern, Johannes hat gezahlt, 50/50“*).
- **Ausgaben-Analyse & KI-Bot:** Visuelle Diagramme über Konsumausgaben nach Kategorie & Monat sowie ein integrierter Chatbot (*„Wie viel haben wir dieses Jahr für Olivenöl ausgegeben?“*).
- **„Zuletzt gekauft“-Quick-Check:** Kein lästiges Vorrats-Management – stattdessen sieht man im Supermarkt sofort, wann Basics (Olivenöl, Gewürze, Spülmittel, Klopapier) zuletzt gekauft wurden und zu welchem Preis.

---

## 🏗️ Architektur & Datenfluss

```plaintext
[ iPhone / PWA (GitHub Pages) ]
       │ 1. Foto-Kompression & POST mit Secret-Token
       ▼
[ Google Apps Script (Serverless Web App) ]
       │ 2. Ruft Gemini mit sicher hinterlegtem Key auf
       ▼
[ Google Gemini 2.5 Flash (Free Tier) ]
       │ 3. Liefert strukturiertes JSON (Transaktion & Einzelartikel)
       ▼
[ Google Sheets (Datenbank: Transactions, Items, Config) ]
```

---

## 📋 GitHub Issues / Roadmap

Die Implementierung ist in 6 fokussierte GitHub Issues unterteilt:

1. **[Issue #2: Backend – Google Apps Script, Datenmodell & Gemini API](https://github.com/staerkjoe/Schlei-heimerStrasse/issues/2)**
2. **[Issue #3: Frontend – Mobile-First PWA Shell, iOS UI & Setup-Flow](https://github.com/staerkjoe/Schlei-heimerStrasse/issues/3)**
3. **[Issue #4: Feature – Schulden-Berechnung, Saldo-Liveanzeige & Begleichung](https://github.com/staerkjoe/Schlei-heimerStrasse/issues/4)**
4. **[Issue #5: Feature – Smarte Belegerfassung (Bon-Scan, Restaurant & Freitext)](https://github.com/staerkjoe/Schlei-heimerStrasse/issues/5)**
5. **[Issue #6: Feature – Ausgaben-Analyse & KI-Chatbot („Frag die WG-Kasse“)](https://github.com/staerkjoe/Schlei-heimerStrasse/issues/6)**
6. **[Issue #7: Feature – „Zuletzt gekauft“-Quick-Check für WG-Basics](https://github.com/staerkjoe/Schlei-heimerStrasse/issues/7)**

---

## 🛠️ Manuelles Setup (Schritt-für-Schritt)

### 1. Kostenlosen Gemini API-Key erstellen (2 Min.)
1. Öffne [Google AI Studio (aistudio.google.com)](https://aistudio.google.com/) und melde dich an.
2. Klicke auf **"Get API key"** ➔ **"Create API key"**.
3. Kopiere den Key (`AIza...`).

### 2. Google Sheet als Datenbank anlegen (1 Min.)
1. Öffne [Google Sheets (sheets.new)](https://sheets.new) und erstelle eine neue leere Tabelle (z. B. `WG-Kasse Schleißheimer Straße`).
2. Du musst keine Spalten manuell anlegen – das Backend initialisiert diese automatisch beim ersten Start.

### 3. Google Apps Script einrichten & veröffentlichen (5 Min.)
1. Klicke im Menü des Google Sheets auf **Erweiterungen** ➔ **Apps Script**.
2. Ersetze den Inhalt von `Code.gs` durch den Skriptcode aus `backend/Code.gs` und speichere (💾).
3. Gehe links auf das **Zahnrad (Projekteinstellungen)** ➔ scrolle zu **Skripteigenschaften**:
   - `GEMINI_API_KEY`: Dein Gemini API-Key (`AIza...`)
   - `SECRET_TOKEN`: Ein sicheres WG-Passwort (z. B. `schleissheimer2026`)
   - `USER_A`: Erster Mitbewohner (z. B. `Johannes`)
   - `USER_B`: Zweiter Mitbewohner
4. Klicke oben rechts auf **Bereitstellen** ➔ **Neue Bereitstellung**:
   - Typ: **Web-App**
   - Ausführen als: **Ich**
   - Zugriff: **Jeder** *(wichtig für den PWA-Zugriff ohne OAuth-Zwang; der Zugriff ist durch `SECRET_TOKEN` geschützt)*
5. Kopiere die generierte Web-App-URL (`.../exec`).

### 4. GitHub Pages aktivieren (1 Min.)
1. Im GitHub Repository unter **Settings** ➔ **Pages**:
   - Source: **Deploy from a branch**
   - Branch: **`main`** / Folder: **`/ (root)`**
   - Speichern. Die Web-App ist nach ca. 1 Minute unter `https://staerkjoe.github.io/Schlei-heimerStrasse/` erreichbar.

### 5. PWA auf iPhones installieren (1 Min.)
1. Im Safari auf dem iPhone die GitHub Pages URL aufrufen.
2. **Teilen-Button** ➔ **„Zum Home-Bildschirm“**.
3. Beim ersten Start Web-App-URL und `SECRET_TOKEN` eingeben und Namen auswählen.
