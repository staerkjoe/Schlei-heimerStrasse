/**
 * WG-Kasse Schleißheimer Straße - Google Apps Script Backend
 * 
 * Verwaltet Datenbank in Google Sheets & fungiert als sicherer Serverless Proxy
 * für Google Gemini AI (Belegerkennung & WG-Kassenbot).
 */

// Konstanten & Defaults
const SHEET_NAMES = {
  TRANSACTIONS: 'Transactions',
  ITEMS: 'Items',
  CONFIG: 'Config'
};

const DEFAULT_USERS = {
  USER_A: 'Johannes',
  USER_B: 'Mitbewohner'
};

/**
 * HTTP GET - Status / Health Check
 */
function doGet(e) {
  return createJsonResponse({
    status: 'ok',
    message: 'WG-Kasse Backend ist online.',
    timestamp: new Date().toISOString()
  });
}

/**
 * HTTP POST - Haupt-API Router
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: 'Keine Daten empfangen' }, 400);
    }

    const payload = JSON.parse(e.postData.contents);
    const scriptProps = PropertiesService.getScriptProperties();
    const serverSecret = scriptProps.getProperty('SECRET_TOKEN') || 'schleissheimer2026';

    // 1. Authentifizierung
    if (!payload.token || payload.token !== serverSecret) {
      return createJsonResponse({ success: false, error: 'Ungültiger oder fehlender SECRET_TOKEN' }, 401);
    }

    // 2. Tabellenblätter sicherstellen
    initDatabase();

    const action = payload.action;

    switch (action) {
      case 'init':
        return handleInit(payload);

      case 'parseReceiptOrText':
        return handleParseReceiptOrText(payload);

      case 'saveTransaction':
        return handleSaveTransaction(payload);

      case 'deleteTransaction':
        return handleDeleteTransaction(payload);

      case 'askBot':
        return handleAskBot(payload);

      default:
        return createJsonResponse({ success: false, error: 'Unbekannte Aktion: ' + action }, 400);
    }

  } catch (error) {
    Logger.log('Fehler in doPost: ' + error.toString());
    return createJsonResponse({
      success: false,
      error: error.message || error.toString()
    }, 500);
  }
}

/**
 * Initialisiert benötigte Tabellenblätter mit Formatierung
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Transactions Sheet
  let transSheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
  if (!transSheet) {
    transSheet = ss.insertSheet(SHEET_NAMES.TRANSACTIONS);
    const headers = [
      'ID', 'Datum', 'Beschreibung', 'Kategorie', 'Zahler',
      'Betrag', 'SplitModus', 'AnteilA', 'AnteilB', 'Typ', 'ErstelltAm'
    ];
    transSheet.appendRow(headers);
    formatHeaderRow(transSheet, headers.length);
  }

  // 2. Items Sheet
  let itemsSheet = ss.getSheetByName(SHEET_NAMES.ITEMS);
  if (!itemsSheet) {
    itemsSheet = ss.insertSheet(SHEET_NAMES.ITEMS);
    const headers = [
      'ID', 'TransaktionsID', 'Artikelname', 'Menge',
      'Preis', 'Zuweisung', 'Kategorie', 'Datum', 'Zahler', 'Laden'
    ];
    itemsSheet.appendRow(headers);
    formatHeaderRow(itemsSheet, headers.length);
  }

  // 3. Config Sheet
  let configSheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!configSheet) {
    configSheet = ss.insertSheet(SHEET_NAMES.CONFIG);
    const headers = ['Schluessel', 'Wert'];
    configSheet.appendRow(headers);
    formatHeaderRow(configSheet, headers.length);

    const scriptProps = PropertiesService.getScriptProperties();
    const userA = scriptProps.getProperty('USER_A') || DEFAULT_USERS.USER_A;
    const userB = scriptProps.getProperty('USER_B') || DEFAULT_USERS.USER_B;

    configSheet.appendRow(['USER_A', userA]);
    configSheet.appendRow(['USER_B', userB]);
  }
}

function formatHeaderRow(sheet, numColumns) {
  const headerRange = sheet.getRange(1, 1, 1, numColumns);
  headerRange.setBackground('#1E293B');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/**
 * Lädt Basisdaten, Transaktionen und Historie
 */
function handleInit(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scriptProps = PropertiesService.getScriptProperties();

  const userA = scriptProps.getProperty('USER_A') || DEFAULT_USERS.USER_A;
  const userB = scriptProps.getProperty('USER_B') || DEFAULT_USERS.USER_B;

  const transSheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
  const itemsSheet = ss.getSheetByName(SHEET_NAMES.ITEMS);

  const transactions = [];
  if (transSheet && transSheet.getLastRow() > 1) {
    const data = transSheet.getRange(2, 1, transSheet.getLastRow() - 1, 11).getValues();
    data.forEach(row => {
      if (row[0]) {
        transactions.push({
          id: String(row[0]),
          date: formatDateString(row[1]),
          description: String(row[2]),
          category: String(row[3]),
          paidBy: String(row[4]),
          amount: Number(row[5]) || 0,
          splitMethod: String(row[6]),
          shareA: Number(row[7]) || 0,
          shareB: Number(row[8]) || 0,
          type: String(row[9] || 'EXPENSE'),
          createdAt: formatDateString(row[10])
        });
      }
    });
  }

  const items = [];
  if (itemsSheet && itemsSheet.getLastRow() > 1) {
    const data = itemsSheet.getRange(2, 1, itemsSheet.getLastRow() - 1, 10).getValues();
    data.forEach(row => {
      if (row[0]) {
        items.push({
          id: String(row[0]),
          transactionId: String(row[1]),
          name: String(row[2]),
          quantity: Number(row[3]) || 1,
          price: Number(row[4]) || 0,
          assignedTo: String(row[5] || 'GEMEINSAM'),
          category: String(row[6] || 'Sonstiges'),
          date: formatDateString(row[7]),
          paidBy: String(row[8]),
          store: String(row[9] || '')
        });
      }
    });
  }

  // Neueste zuerst sortieren
  transactions.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Saldo berechnen: positiv = User B schuldet User A; negativ = User A schuldet User B
  const balance = calculateBalance(transactions, userA, userB);

  return createJsonResponse({
    success: true,
    config: {
      userA: userA,
      userB: userB
    },
    balance: balance,
    transactions: transactions.slice(0, 150),
    items: items.slice(0, 300)
  });
}

/**
 * Berechnet den Saldo centgenau
 */
function calculateBalance(transactions, userA, userB) {
  // Saldo aus Sicht von User A:
  // > 0: User B schuldet User A
  // < 0: User A schuldet User B
  let netBalance = 0;

  transactions.forEach(t => {
    if (t.type === 'SETTLEMENT') {
      // Wenn User B gezahlt hat (an User A), sinkt User Bs Schuld:
      if (t.paidBy === userB) {
        netBalance -= t.amount;
      } else if (t.paidBy === userA) {
        netBalance += t.amount;
      }
    } else {
      // Normale EXPENSE
      if (t.paidBy === userA) {
        // User A hat gezahlt, User B schuldet shareB
        netBalance += (t.shareB || 0);
      } else if (t.paidBy === userB) {
        // User B hat gezahlt, User A schuldet shareA
        netBalance -= (t.shareA || 0);
      }
    }
  });

  return {
    netAmount: Math.round(netBalance * 100) / 100,
    userA: userA,
    userB: userB
  };
}

/**
 * Gemini AI: Belegerkennung & Freitext-Analyse
 */
function handleParseReceiptOrText(payload) {
  const scriptProps = PropertiesService.getScriptProperties();
  const apiKey = scriptProps.getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    return createJsonResponse({
      success: false,
      error: 'GEMINI_API_KEY ist nicht in den Google Apps Script Properties hinterlegt.'
    }, 400);
  }

  const userA = scriptProps.getProperty('USER_A') || DEFAULT_USERS.USER_A;
  const userB = scriptProps.getProperty('USER_B') || DEFAULT_USERS.USER_B;
  const today = Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd');

  const systemPrompt = `Du bist ein hochpräziser Beleg- und Ausgaben-Parser für die WG "Schleißheimer Straße".
Die Mitbewohner heißen "${userA}" und "${userB}".
Heutiges Datum: ${today}.

Deine Aufgabe:
Extrahiere aus dem Foto (Kassenbon, Restaurant-Rechnung, Quittung) oder dem Freitext alle relevanten Daten und gib STRENG ein valides JSON zurück.

JSON Schema:
{
  "merchant": "Name des Ladens / Restaurants / Beschreibung (z.B. Rewe, Thai Restaurant, Apotheke)",
  "date": "YYYY-MM-DD (Datum des Einkaufs, falls nicht lesbar oder im Text heute: ${today})",
  "totalAmount": 0.00 (Gesamtsumme als Dezimalzahl mit Punkt, z.B. 24.50),
  "category": "Eine von: Lebensmittel, Restaurant/Café, Haushalt/Drogerie, Freizeit/Bar, Sonstiges",
  "suggestedPayer": "${userA}" oder "${userB}" (falls im Text genannt, sonst "${userA}"),
  "suggestedSplit": "50_50", "100_USER_A", "100_USER_B" oder "CUSTOM",
  "items": [
    {
      "name": "Präziser Produktname auf Deutsch (z.B. Olivenöl Extra Vergine, Bio-Hafermilch, Toilettenpapier)",
      "quantity": 1,
      "price": 0.00,
      "category": "Lebensmittel, Haushalt/Drogerie, etc.",
      "pantryCategory": "Öl & Essig" | "Gewürze" | "Kondimente" | "Putzmittel" | "Haushalt" | "Küchenutensilien" | null
    }
  ]
}

Regeln:
1. Erkenne Einzelartikel so genau wie möglich mit Einzelpreis.
2. WG-Pantry-Zuordnung ("pantryCategory"):
   - Setze "pantryCategory" NUR auf eine der 6 Kategorien ("Öl & Essig", "Gewürze", "Kondimente", "Putzmittel", "Haushalt", "Küchenutensilien"), wenn es sich um langlebige Grundausstattung oder haltbare Vorräte handelt (z.B. Olivenöl, Balsamico, Pfeffer, Salz, Senf, Ketchup, Spülitabs, Müllbeutel, Backpapier, Messer).
   - Bei kurzlebigen Kochzutaten, Frischeprodukten (wie Kürbis, Zucchini, Fleisch, Gemüse, Obst, Milch, Nudeln, Brot) oder Snacks MUSS "pantryCategory" null sein!
3. Wenn die Summe der Einzelartikel leicht vom Gesamtbetrag abweicht (z.B. wegen Pfand oder Rabatt), setze "totalAmount" auf die echte Gesamtsumme des Bons.
4. Bei Restaurantrechnungen: Erkenne Trinkgeld falls vorhanden oder die Gesamtsumme.
5. Bei Freitext (z.B. "45€ Thai Restaurant gestern, Johannes hat gezahlt, 50/50"):
   - Verstehe relative Datumsangaben (gestern, vorgestern).
   - Ordne den Zahler "${userA}" oder "${userB}" zu.
   - Falls keine Einzelartikel genannt sind, erstelle einen Eintrag in "items" mit der Gesamtsumme.
6. Antworte NUR im reinen JSON-Format ohne Markdown-Backticks (\`\`\`json).`;

  let geminiParts = [];

  if (payload.image) {
    // Base64 Bild verarbeiten
    let base64Data = payload.image;
    let mimeType = 'image/jpeg';

    if (base64Data.indexOf('data:') === 0) {
      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

    geminiParts.push({
      inline_data: {
        mime_type: mimeType,
        data: base64Data
      }
    });

    geminiParts.push({
      text: systemPrompt + '\n\nBitte analysiere diesen Kassenbon / diese Rechnung präzise.'
    });
  } else if (payload.text) {
    // Freitext verarbeiten
    geminiParts.push({
      text: systemPrompt + '\n\nZu analysierender Freitext:\n"' + payload.text + '"'
    });
  } else {
    return createJsonResponse({ success: false, error: 'Weder Bild noch Freitext übergeben' }, 400);
  }

  // Gemini API Call mit dynamischer Modell-Auswahl & automatischem Fallback
  let geminiData = null;
  try {
    geminiData = callGeminiApi(
      [{ parts: geminiParts }],
      {
        temperature: 0.1,
        response_mime_type: 'application/json'
      },
      scriptProps
    );
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: 'Gemini API Fehler: ' + err.message
    }, 500);
  }

  let parsedContent = null;

  try {
    const rawAnswer = geminiData.candidates[0].content.parts[0].text;
    const cleanJson = rawAnswer.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    parsedContent = JSON.parse(cleanJson);
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: 'Konnte Antwort von Gemini nicht parsen: ' + err.toString()
    }, 500);
  }

  return createJsonResponse({
    success: true,
    data: parsedContent
  });
}

/**
 * Speichert eine Transaktion und optionale Einzelposten in Google Sheets
 */
function handleSaveTransaction(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transSheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
  const itemsSheet = ss.getSheetByName(SHEET_NAMES.ITEMS);

  const t = payload.transaction;
  if (!t || !t.amount || !t.paidBy) {
    return createJsonResponse({ success: false, error: 'Ungültige Transaktionsdaten' }, 400);
  }

  const id = t.id || ('txn_' + Utilities.getUuid());
  const now = Utilities.formatDate(new Date(), 'Europe/Berlin', "yyyy-MM-dd'T'HH:mm:ss");
  const date = t.date || Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd');
  const type = t.type || 'EXPENSE';

  // Transaktionszeile
  const transRow = [
    id,
    date,
    t.description || (type === 'SETTLEMENT' ? 'Schuldenausgleich' : 'Einkauf'),
    t.category || (type === 'SETTLEMENT' ? 'Ausgleich' : 'Sonstiges'),
    t.paidBy,
    Number(t.amount) || 0,
    t.splitMethod || '50_50',
    Number(t.shareA) || 0,
    Number(t.shareB) || 0,
    type,
    now
  ];

  transSheet.appendRow(transRow);

  // Einzelartikel speichern (falls vorhanden)
  if (Array.isArray(payload.items) && payload.items.length > 0 && type !== 'SETTLEMENT') {
    payload.items.forEach(item => {
      const itemId = 'item_' + Utilities.getUuid();
      itemsSheet.appendRow([
        itemId,
        id,
        item.name || 'Artikel',
        Number(item.quantity) || 1,
        Number(item.price) || 0,
        item.assignedTo || 'GEMEINSAM',
        item.category || t.category || 'Sonstiges',
        date,
        t.paidBy,
        t.description || ''
      ]);
    });
  }

  return createJsonResponse({
    success: true,
    transactionId: id
  });
}

/**
 * Löscht eine Transaktion und zugehörige Einzelartikel
 */
function handleDeleteTransaction(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transSheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
  const itemsSheet = ss.getSheetByName(SHEET_NAMES.ITEMS);

  const targetId = payload.id;
  if (!targetId) {
    return createJsonResponse({ success: false, error: 'ID fehlt' }, 400);
  }

  // 1. In Transactions suchen und löschen
  if (transSheet && transSheet.getLastRow() > 1) {
    const data = transSheet.getRange(2, 1, transSheet.getLastRow() - 1, 1).getValues();
    for (let i = data.length - 1; i >= 0; i--) {
      if (String(data[i][0]) === String(targetId)) {
        transSheet.deleteRow(i + 2);
        break;
      }
    }
  }

  // 2. In Items suchen und löschen
  if (itemsSheet && itemsSheet.getLastRow() > 1) {
    const data = itemsSheet.getRange(2, 2, itemsSheet.getLastRow() - 1, 1).getValues();
    for (let i = data.length - 1; i >= 0; i--) {
      if (String(data[i][0]) === String(targetId)) {
        itemsSheet.deleteRow(i + 2);
      }
    }
  }

  return createJsonResponse({ success: true, deletedId: targetId });
}

/**
 * KI-Chatbot ("Frag die WG-Kasse")
 */
function handleAskBot(payload) {
  const scriptProps = PropertiesService.getScriptProperties();
  const apiKey = scriptProps.getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    return createJsonResponse({ success: false, error: 'GEMINI_API_KEY fehlt in den Script Properties.' }, 400);
  }

  const question = payload.question;
  if (!question) {
    return createJsonResponse({ success: false, error: 'Keine Frage übergeben' }, 400);
  }

  const userA = scriptProps.getProperty('USER_A') || DEFAULT_USERS.USER_A;
  const userB = scriptProps.getProperty('USER_B') || DEFAULT_USERS.USER_B;

  // Kontext aus Sheets laden
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transSheet = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
  const itemsSheet = ss.getSheetByName(SHEET_NAMES.ITEMS);

  let transSummary = [];
  if (transSheet && transSheet.getLastRow() > 1) {
    const data = transSheet.getRange(2, 1, transSheet.getLastRow() - 1, 11).getValues();
    data.forEach(r => {
      transSummary.push(`${r[1]}: ${r[2]} (${r[3]}), Betrag: ${r[5]}€, gezahlt von: ${r[4]}, Typ: ${r[9]}`);
    });
  }

  let itemsSummary = [];
  if (itemsSheet && itemsSheet.getLastRow() > 1) {
    const data = itemsSheet.getRange(2, 1, itemsSheet.getLastRow() - 1, 10).getValues();
    data.forEach(r => {
      itemsSummary.push(`${r[7]}: ${r[2]} - ${r[4]}€ (${r[9] || 'Laden'}, gezahlt von ${r[8]})`);
    });
  }

  const prompt = `Du bist der schlaue, hilfsbereite Finanz-Assistent der WG "Schleißheimer Straße".
Die Mitbewohner heißen "${userA}" und "${userB}".
Datum heute: ${Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd')}.

Hier ist die Datenbank der WG:

--- AUSGABEN & BEGLEICHUNGEN (Transaktionen) ---
${transSummary.slice(-100).join('\n')}

--- EINZELARTIKEL (Kassenbon-Posten) ---
${itemsSummary.slice(-250).join('\n')}

Frage des Nutzers:
"${question}"

Anweisungen:
1. Antworte auf Deutsch in einem sympathischen, prägnanten WG-Ton.
2. Beantworte konkrete Fragen (z.B. nach Olivenöl, Bier, Restaurantbesuchen, Gesamtkosten) präzise mit Summen, Daten und Ladennamen.
3. Begleichungen (Typ: SETTLEMENT) sind Schuldenausgleiche und gehören NICHT zu Konsumausgaben!
4. Fasse dich kurz, nutze gerne Aufzählungspunkte oder Emojis für gute Lesbarkeit auf dem Smartphone.`;

  let responseData = null;
  try {
    responseData = callGeminiApi(
      [{ parts: [{ text: prompt }] }],
      { temperature: 0.2 },
      scriptProps
    );
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: 'Fehler beim Aufruf des KI-Modells: ' + err.message
    }, 500);
  }

  const answer = responseData.candidates[0].content.parts[0].text;
  return createJsonResponse({ success: true, answer: answer });
}

/**
 * Ruft die Gemini API mit flexibler Modellauswahl und automatischem Fallback auf
 */
function callGeminiApi(contents, generationConfig, scriptProps) {
  const apiKey = scriptProps.getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY fehlt in den Script Properties.');
  }

  // Konfiguriertes Modell oder Fallbacks (bevorzugt gemini-3.8-flash)
  const customModel = scriptProps.getProperty('GEMINI_MODEL');
  const candidateModels = customModel 
    ? [customModel, 'gemini-3.8-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'] 
    : ['gemini-3.8-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  let lastError = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;

    const requestOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        contents: contents,
        generationConfig: generationConfig
      }),
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(endpoint, requestOptions);
      const code = response.getResponseCode();
      const text = response.getContentText();

      if (code === 200) {
        return JSON.parse(text);
      } else {
        Logger.log('Modell ' + model + ' fehlgeschlagen (' + code + '): ' + text);
        lastError = 'Modell ' + model + ' (' + code + '): ' + text;
        // Bei 404 (Modell existiert nicht) oder 400 (Modell nicht unterstützt) probiere nächstes Modell
        if (code !== 404 && code !== 400) {
          throw new Error(lastError);
        }
      }
    } catch (e) {
      lastError = e.message || String(e);
      // Wenn letztes Modell erreicht, weiterwerfen
      if (i === candidateModels.length - 1) {
        throw new Error(lastError);
      }
    }
  }

  throw new Error(lastError || 'Kein Gemini-Modell konnte erfolgreich aufgerufen werden.');
}

/**
 * Datum formatiert als String YYYY-MM-DD
 */
function formatDateString(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Europe/Berlin', 'yyyy-MM-dd');
  }
  return String(val);
}

/**
 * Gibt eine JSON-Antwort mit CORS Headern zurück
 */
function createJsonResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
