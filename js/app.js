/**
 * WG-Kasse Schleißheimer Straße - Frontend Application Logic
 * Mobile-First PWA für Kassenbon-Erkennung, Saldo-Liveberechnung & WG-Finanz-Bot
 */

// ============================================================================
// 1. STATE & KONFIGURATION
// ============================================================================

const STORAGE_KEYS = {
  CONFIG: 'wg_kasse_config_v1',
  CACHED_DATA: 'wg_kasse_cached_data_v1',
  CHAT_HISTORY: 'wg_kasse_chat_history_v1'
};

const DEFAULT_CONFIG = {
  scriptUrl: '',
  secretToken: '',
  userA: 'Johannes',
  userB: 'Mitbewohner',
  activeUser: 'Johannes',
  isDemo: true // Standardmäßig Demo, bis echte Apps Script URL konfiguriert ist
};

// Beispiel-Datensatz für Sofort-Funktionalität vor dem manuellen Setup
const MOCK_DATA = {
  config: { userA: 'Johannes', userB: 'Mitbewohner' },
  balance: { netAmount: 18.45, userA: 'Johannes', userB: 'Mitbewohner' },
  transactions: [
    {
      id: 'txn_mock_1',
      date: getRelativeDateStr(0),
      description: 'Rewe City Schwabing',
      category: 'Lebensmittel',
      paidBy: 'Johannes',
      amount: 42.60,
      splitMethod: '50_50',
      shareA: 21.30,
      shareB: 21.30,
      type: 'EXPENSE',
      createdAt: getRelativeDateStr(0)
    },
    {
      id: 'txn_mock_2',
      date: getRelativeDateStr(-2),
      description: 'dm Drogeriemarkt',
      category: 'Haushalt/Drogerie',
      paidBy: 'Mitbewohner',
      amount: 15.90,
      splitMethod: '50_50',
      shareA: 7.95,
      shareB: 7.95,
      type: 'EXPENSE',
      createdAt: getRelativeDateStr(-2)
    },
    {
      id: 'txn_mock_3',
      date: getRelativeDateStr(-5),
      description: 'Takumi Ramen Bar',
      category: 'Restaurant/Café',
      paidBy: 'Johannes',
      amount: 38.00,
      splitMethod: '50_50',
      shareA: 19.00,
      shareB: 19.00,
      type: 'EXPENSE',
      createdAt: getRelativeDateStr(-5)
    },
    {
      id: 'txn_mock_4',
      date: getRelativeDateStr(-10),
      description: 'Schuldenausgleich via PayPal',
      category: 'Ausgleich',
      paidBy: 'Mitbewohner',
      amount: 25.00,
      splitMethod: 'SETTLEMENT',
      shareA: 0,
      shareB: 0,
      type: 'SETTLEMENT',
      createdAt: getRelativeDateStr(-10)
    },
    {
      id: 'txn_mock_5',
      date: getRelativeDateStr(-14),
      description: 'Edeka Schleißheimer Str.',
      category: 'Lebensmittel',
      paidBy: 'Johannes',
      amount: 54.30,
      splitMethod: '50_50',
      shareA: 27.15,
      shareB: 27.15,
      type: 'EXPENSE',
      createdAt: getRelativeDateStr(-14)
    }
  ],
  items: [
    {
      id: 'item_mock_1',
      transactionId: 'txn_mock_1',
      name: 'Natives Bio-Olivenöl Extra 500ml',
      quantity: 1,
      price: 6.99,
      assignedTo: 'GEMEINSAM',
      category: 'Öl & Essig',
      date: getRelativeDateStr(0),
      paidBy: 'Johannes',
      store: 'Rewe City Schwabing'
    },
    {
      id: 'item_mock_2',
      transactionId: 'txn_mock_1',
      name: 'Hokkaido-Kürbis für Suppe',
      quantity: 1,
      price: 2.49,
      assignedTo: 'GEMEINSAM',
      category: 'Lebensmittel', // Frischeware -> wird in Pantry gefiltert!
      date: getRelativeDateStr(0),
      paidBy: 'Johannes',
      store: 'Rewe City Schwabing'
    },
    {
      id: 'item_mock_3',
      transactionId: 'txn_mock_2',
      name: 'Toilettenpapier 3-lagig 8er',
      quantity: 1,
      price: 3.95,
      assignedTo: 'GEMEINSAM',
      category: 'Haushalt',
      date: getRelativeDateStr(-2),
      paidBy: 'Mitbewohner',
      store: 'dm Drogeriemarkt'
    },
    {
      id: 'item_mock_4',
      transactionId: 'txn_mock_2',
      name: 'Spülmaschinentabs All-in-1',
      quantity: 1,
      price: 5.45,
      assignedTo: 'GEMEINSAM',
      category: 'Putzmittel',
      date: getRelativeDateStr(-2),
      paidBy: 'Mitbewohner',
      store: 'dm Drogeriemarkt'
    },
    {
      id: 'item_mock_5',
      transactionId: 'txn_mock_2',
      name: 'Müllbeutel 35L mit Zugband',
      quantity: 1,
      price: 1.85,
      assignedTo: 'GEMEINSAM',
      category: 'Haushalt',
      date: getRelativeDateStr(-2),
      paidBy: 'Mitbewohner',
      store: 'dm Drogeriemarkt'
    },
    {
      id: 'item_mock_6',
      transactionId: 'txn_mock_5',
      name: 'Aceto Balsamico di Modena',
      quantity: 1,
      price: 4.29,
      assignedTo: 'GEMEINSAM',
      category: 'Öl & Essig',
      date: getRelativeDateStr(-14),
      paidBy: 'Johannes',
      store: 'Edeka Schleißheimer Str.'
    },
    {
      id: 'item_mock_7',
      transactionId: 'txn_mock_5',
      name: 'Schwarzer Pfeffer aus der Mühle',
      quantity: 1,
      price: 2.99,
      assignedTo: 'GEMEINSAM',
      category: 'Gewürze',
      date: getRelativeDateStr(-14),
      paidBy: 'Johannes',
      store: 'Edeka Schleißheimer Str.'
    },
    {
      id: 'item_mock_8',
      transactionId: 'txn_mock_5',
      name: 'Mittelscharfer Senf im Glas',
      quantity: 1,
      price: 1.29,
      assignedTo: 'GEMEINSAM',
      category: 'Kondimente',
      date: getRelativeDateStr(-20),
      paidBy: 'Mitbewohner',
      store: 'Rewe City Schwabing'
    },
    {
      id: 'item_mock_9',
      transactionId: 'txn_mock_5',
      name: 'Airfryer-Backpapier 50er Pack',
      quantity: 1,
      price: 4.99,
      assignedTo: 'GEMEINSAM',
      category: 'Haushalt',
      date: getRelativeDateStr(-25),
      paidBy: 'Johannes',
      store: 'dm Drogeriemarkt'
    },
    {
      id: 'item_mock_10',
      transactionId: 'txn_mock_5',
      name: 'Bambus Schneidebrett groß',
      quantity: 1,
      price: 8.99,
      assignedTo: 'GEMEINSAM',
      category: 'Küchenutensilien',
      date: getRelativeDateStr(-40),
      paidBy: 'Johannes',
      store: 'IKEA München'
    }
  ]
};

// Globaler App-State
let appState = {
  config: loadConfig(),
  transactions: [],
  items: [],
  balance: { netAmount: 0, userA: 'Johannes', userB: 'Mitbewohner' },
  activeTab: 'tab-saldo',
  activeInputMode: 'camera',
  activeTimeframe: 'this_month',
  activePantryCategory: 'all',
  pendingCompressedImage: null,
  reviewTransaction: null,
  reviewItems: [],
  categoryChartInstance: null,
  monthlyChartInstance: null
};

// ============================================================================
// 2. INITIALISIERUNG
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initEventListeners();
  loadCachedOrInitialData();
  updateUserSelectors();
  renderApp();
  
  // Wenn Backend-URL hinterlegt ist, gleich synchronisieren
  if (appState.config.scriptUrl && !appState.config.isDemo) {
    syncWithBackend();
  }
});

function loadConfig() {
  const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
  if (saved) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Fehler beim Laden der Konfiguration:', e);
    }
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(newConfig) {
  appState.config = { ...appState.config, ...newConfig };
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(appState.config));
}

function loadCachedOrInitialData() {
  const cached = localStorage.getItem(STORAGE_KEYS.CACHED_DATA);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      appState.transactions = data.transactions || [];
      appState.items = data.items || [];
      appState.balance = data.balance || calculateBalanceLocally(appState.transactions);
      return;
    } catch (e) {
      console.warn('Cache ungültig:', e);
    }
  }

  // Fallback auf Mock Data
  appState.transactions = [...MOCK_DATA.transactions];
  appState.items = [...MOCK_DATA.items];
  appState.balance = calculateBalanceLocally(appState.transactions);
}

function saveCache() {
  const data = {
    transactions: appState.transactions,
    items: appState.items,
    balance: appState.balance
  };
  localStorage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(data));
}

// ============================================================================
// 3. UI SETUP & EVENT LISTENERS
// ============================================================================

function initUI() {
  // Aktuelles Datum in Datum-Inputs setzen
  const todayStr = new Date().toISOString().split('T')[0];
  const dateInputs = ['manualDate', 'reviewDate', 'settleDate'];
  dateInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = todayStr;
  });

  // Demo Banner Visibility
  const demoBanner = document.getElementById('demoBanner');
  if (demoBanner) {
    demoBanner.style.display = appState.config.isDemo ? 'flex' : 'none';
  }
}

function initEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // User Switcher im Header
  const activeUserBadge = document.getElementById('activeUserBadge');
  if (activeUserBadge) {
    activeUserBadge.addEventListener('click', toggleActiveUser);
  }

  // Settings Modal
  document.getElementById('openSettingsBtn').addEventListener('click', openSettingsModal);
  document.getElementById('btnCloseSettings').addEventListener('click', closeSettingsModal);
  document.getElementById('btnSaveSettings').addEventListener('click', handleSaveSettings);
  document.getElementById('btnTestConnection').addEventListener('click', testConnectionAndSync);
  document.getElementById('demoBannerBtn').addEventListener('click', openSettingsModal);

  // Erfassen Mode Switcher
  document.querySelectorAll('.segmented-control .segment-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      switchCaptureMode(mode);
    });
  });

  // Kamera & Bild-Upload
  const btnTriggerCamera = document.getElementById('btnTriggerCamera');
  const btnTriggerGallery = document.getElementById('btnTriggerGallery');
  const cameraInput = document.getElementById('cameraInput');
  const galleryInput = document.getElementById('galleryInput');
  const dropZone = document.getElementById('dropZone');

  if (btnTriggerCamera && cameraInput) {
    btnTriggerCamera.addEventListener('click', () => cameraInput.click());
    cameraInput.addEventListener('change', e => handleImageSelected(e.target.files[0]));
  }
  if (btnTriggerGallery && galleryInput) {
    btnTriggerGallery.addEventListener('click', () => galleryInput.click());
    galleryInput.addEventListener('change', e => handleImageSelected(e.target.files[0]));
  }
  if (dropZone) {
    dropZone.addEventListener('click', () => {
      if (cameraInput) cameraInput.click();
    });
  }

  document.getElementById('btnRemovePreview').addEventListener('click', removeImagePreview);
  document.getElementById('btnAnalyzeReceipt').addEventListener('click', analyzeReceiptImage);

  // KI-Freitext
  document.querySelectorAll('#textChips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-text');
      const input = document.getElementById('freeTextInput');
      if (input) input.value = text;
    });
  });
  document.getElementById('btnAnalyzeText').addEventListener('click', analyzeFreeText);

  // Manuelle Eingabe
  document.getElementById('btnSaveManual').addEventListener('click', handleSaveManual);

  // Settle Up Modal
  document.getElementById('btnOpenSettle').addEventListener('click', openSettleModal);
  document.getElementById('btnCloseSettle').addEventListener('click', closeSettleModal);
  document.getElementById('btnCancelSettle').addEventListener('click', closeSettleModal);
  document.getElementById('btnConfirmSettle').addEventListener('click', handleConfirmSettle);

  // Review Modal
  document.getElementById('btnCloseReview').addEventListener('click', closeReviewModal);
  document.getElementById('btnCancelReview').addEventListener('click', closeReviewModal);
  document.getElementById('btnConfirmSaveReview').addEventListener('click', handleConfirmSaveReview);
  document.getElementById('btnAddReviewItem').addEventListener('click', addReviewItemRow);

  // Detail Modal
  document.getElementById('btnCloseDetail').addEventListener('click', closeDetailModal);
  document.getElementById('btnDoneDetail').addEventListener('click', closeDetailModal);
  document.getElementById('btnDeleteTxn').addEventListener('click', handleDeleteCurrentTxn);

  // Pantry Detail Modal
  const btnClosePantryDetail = document.getElementById('btnClosePantryDetail');
  const btnDonePantryDetail = document.getElementById('btnDonePantryDetail');
  if (btnClosePantryDetail) btnClosePantryDetail.addEventListener('click', closePantryDetailModal);
  if (btnDonePantryDetail) btnDonePantryDetail.addEventListener('click', closePantryDetailModal);

  // Analyse Timeframe Filter
  document.querySelectorAll('#timeframeFilter .segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#timeframeFilter .segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.activeTimeframe = btn.getAttribute('data-range');
      renderAnalytics();
    });
  });

  // Chatbot
  document.getElementById('btnSendChat').addEventListener('click', handleSendChatMessage);
  document.getElementById('chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSendChatMessage();
  });
  document.querySelectorAll('#botChips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      const input = document.getElementById('chatInput');
      if (input) input.value = prompt;
      handleSendChatMessage();
    });
  });

  // Zuletzt gekauft / Pantry: Suche & Kategorie-Filter
  const itemSearchInput = document.getElementById('itemSearchInput');
  if (itemSearchInput) {
    itemSearchInput.addEventListener('input', () => renderPantry());
  }
  document.querySelectorAll('#basicChips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#basicChips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      appState.activePantryCategory = chip.getAttribute('data-filter') || 'all';
      renderPantry();
    });
  });
}

function switchTab(tabId) {
  appState.activeTab = tabId;
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.toggle('active', view.id === tabId);
  });
  document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  if (tabId === 'tab-analyse') {
    renderAnalytics();
  } else if (tabId === 'tab-zuletzt') {
    renderPantry();
  }
}

function switchCaptureMode(mode) {
  appState.activeInputMode = mode;
  document.querySelectorAll('.segmented-control .segment-btn[data-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
  });
  ['camera', 'text', 'manual'].forEach(m => {
    const el = document.getElementById(`mode-${m}`);
    if (el) el.style.display = m === mode ? 'block' : 'none';
  });
}

function toggleActiveUser() {
  const nextUser = appState.config.activeUser === appState.config.userA ? appState.config.userB : appState.config.userA;
  appState.config.activeUser = nextUser;
  saveConfig({ activeUser: nextUser });
  updateUserSelectors();
  renderSaldo();
  showToast(`Aktiver Nutzer gewechselt zu: ${nextUser}`);
}

function updateUserSelectors() {
  const userA = appState.config.userA || 'Johannes';
  const userB = appState.config.userB || 'Mitbewohner';
  const activeUser = appState.config.activeUser || userA;

  // Header Badge
  const badgeName = document.getElementById('activeUserName');
  if (badgeName) badgeName.textContent = activeUser;

  // Manual Payer
  const manualPayer = document.getElementById('manualPayer');
  if (manualPayer) {
    manualPayer.innerHTML = `
      <option value="${userA}">${userA}</option>
      <option value="${userB}">${userB}</option>
    `;
    manualPayer.value = activeUser;
  }

  // Review Payer
  const reviewPayer = document.getElementById('reviewPayer');
  if (reviewPayer) {
    reviewPayer.innerHTML = `
      <option value="${userA}">${userA}</option>
      <option value="${userB}">${userB}</option>
    `;
    reviewPayer.value = activeUser;
  }

  // Settle Payer
  const settlePayer = document.getElementById('settlePayer');
  if (settlePayer) {
    settlePayer.innerHTML = `
      <option value="${userA}">${userA}</option>
      <option value="${userB}">${userB}</option>
    `;
  }

  // Settings active user
  const settingActiveUser = document.getElementById('settingActiveUser');
  if (settingActiveUser) {
    settingActiveUser.innerHTML = `
      <option value="${userA}">${userA}</option>
      <option value="${userB}">${userB}</option>
    `;
    settingActiveUser.value = activeUser;
  }

  // Analytics Labels
  const userALabel = document.getElementById('statUserALabel');
  const userBLabel = document.getElementById('statUserBLabel');
  if (userALabel) userALabel.textContent = userA;
  if (userBLabel) userBLabel.textContent = userB;
}

// ============================================================================
// 4. SALDO-BERECHNUNG & HOME RENDERING
// ============================================================================

function calculateBalanceLocally(transactions) {
  const userA = appState.config.userA || 'Johannes';
  const userB = appState.config.userB || 'Mitbewohner';

  let netBalance = 0; // > 0: userB schuldet userA; < 0: userA schuldet userB

  transactions.forEach(t => {
    const amount = Number(t.amount) || 0;
    if (t.type === 'SETTLEMENT') {
      if (t.paidBy === userB) {
        netBalance -= amount;
      } else if (t.paidBy === userA) {
        netBalance += amount;
      }
    } else {
      const shareA = Number(t.shareA) || (amount / 2);
      const shareB = Number(t.shareB) || (amount / 2);

      if (t.paidBy === userA) {
        netBalance += shareB;
      } else if (t.paidBy === userB) {
        netBalance -= shareA;
      }
    }
  });

  return {
    netAmount: Math.round(netBalance * 100) / 100,
    userA: userA,
    userB: userB
  };
}

function renderApp() {
  renderSaldo();
  renderTransactions();
  renderRecentItems();
}

function renderSaldo() {
  appState.balance = calculateBalanceLocally(appState.transactions);

  const net = appState.balance.netAmount;
  const userA = appState.config.userA;
  const userB = appState.config.userB;
  const activeUser = appState.config.activeUser;

  const amountEl = document.getElementById('saldoAmount');
  const subtextEl = document.getElementById('saldoSubtext');
  const badgeEl = document.getElementById('saldoBadge');

  if (!amountEl || !subtextEl) return;

  // Perspektive je nach aktivem Nutzer:
  // net > 0 bedeutet: userB schuldet userA
  // net < 0 bedeutet: userA schuldet userB
  if (Math.abs(net) < 0.01) {
    amountEl.textContent = '0,00 €';
    amountEl.className = 'saldo-amount saldo-zero';
    subtextEl.textContent = 'Ihr seid aktuell quitt! 🎉';
    badgeEl.textContent = 'Ausgeglichen';
    badgeEl.style.background = 'rgba(255, 255, 255, 0.1)';
    badgeEl.style.color = '#fff';
  } else if (activeUser === userA) {
    if (net > 0) {
      amountEl.textContent = `+${formatEuro(net)}`;
      amountEl.className = 'saldo-amount saldo-positive';
      subtextEl.textContent = `${userB} schuldet dir Geld`;
      badgeEl.textContent = 'Guthaben';
      badgeEl.style.background = 'var(--accent-green-bg)';
      badgeEl.style.color = 'var(--accent-green)';
    } else {
      amountEl.textContent = `-${formatEuro(Math.abs(net))}`;
      amountEl.className = 'saldo-amount saldo-negative';
      subtextEl.textContent = `Du schuldest ${userB} Geld`;
      badgeEl.textContent = 'Schulden';
      badgeEl.style.background = 'var(--accent-rose-bg)';
      badgeEl.style.color = 'var(--accent-rose)';
    }
  } else {
    // aktiver Nutzer ist userB
    if (net < 0) {
      amountEl.textContent = `+${formatEuro(Math.abs(net))}`;
      amountEl.className = 'saldo-amount saldo-positive';
      subtextEl.textContent = `${userA} schuldet dir Geld`;
      badgeEl.textContent = 'Guthaben';
      badgeEl.style.background = 'var(--accent-green-bg)';
      badgeEl.style.color = 'var(--accent-green)';
    } else {
      amountEl.textContent = `-${formatEuro(net)}`;
      amountEl.className = 'saldo-amount saldo-negative';
      subtextEl.textContent = `Du schuldest ${userA} Geld`;
      badgeEl.textContent = 'Schulden';
      badgeEl.style.background = 'var(--accent-rose-bg)';
      badgeEl.style.color = 'var(--accent-rose)';
    }
  }

  // Monats-Statistik auf Saldo-Card
  const thisMonthTxs = filterByTimeframe(appState.transactions, 'this_month');
  let monthlyTotal = 0;
  let myShareTotal = 0;

  thisMonthTxs.forEach(t => {
    if (t.type !== 'SETTLEMENT') {
      const amount = Number(t.amount) || 0;
      monthlyTotal += amount;
      if (activeUser === userA) {
        myShareTotal += (Number(t.shareA) || (amount / 2));
      } else {
        myShareTotal += (Number(t.shareB) || (amount / 2));
      }
    }
  });

  const mTotalEl = document.getElementById('monthlyTotalStat');
  const mShareEl = document.getElementById('monthlyMyShareStat');
  if (mTotalEl) mTotalEl.textContent = formatEuro(monthlyTotal);
  if (mShareEl) mShareEl.textContent = formatEuro(myShareTotal);
}

function renderTransactions() {
  const listEl = document.getElementById('transactionList');
  const badgeEl = document.getElementById('txnCountBadge');
  if (!listEl) return;

  const txs = appState.transactions;
  if (badgeEl) badgeEl.textContent = `${txs.length} Einträge`;

  if (txs.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🧾</div>
        <p>Noch keine Ausgaben erfasst.<br>Scanne deinen ersten Kassenbon im Tab <strong>Erfassen</strong>!</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = txs.map(t => {
    const isSettlement = t.type === 'SETTLEMENT';
    const icon = isSettlement ? '🤝' : getCategoryEmoji(t.category);
    const dateFormatted = formatDatePretty(t.date);
    const amountFormatted = formatEuro(t.amount);

    return `
      <div class="txn-card" onclick="openDetailModal('${t.id}')">
        <div class="txn-left">
          <div class="txn-icon ${isSettlement ? 'settlement' : ''}">${icon}</div>
          <div class="txn-info">
            <div class="txn-title">${escapeHtml(t.description || 'Einkauf')}</div>
            <div class="txn-meta">
              <span>${dateFormatted}</span>
              <span>•</span>
              <span class="txn-tag">${escapeHtml(t.paidBy)}</span>
            </div>
          </div>
        </div>
        <div class="txn-right">
          <div class="txn-amount ${isSettlement ? 'saldo-positive' : ''}">${isSettlement ? '' : ''}${amountFormatted}</div>
          <div class="txn-share">${isSettlement ? 'Ausgleich' : getSplitShortLabel(t.splitMethod)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// 5. BILDKOMPRESSION & BELEGERFASSUNG (ISSUE #5)
// ============================================================================

function handleImageSelected(file) {
  if (!file) return;

  const previewContainer = document.getElementById('previewContainer');
  const previewImg = document.getElementById('receiptPreviewImg');
  const compressionBadge = document.getElementById('compressionBadge');
  const btnAnalyze = document.getElementById('btnAnalyzeReceipt');

  // Bild mit Canvas auf max 1024px komprimieren (~80-150 KB für spürbar schnelleren Upload & KI-Verarbeitung)
  compressImage(file, 1024, 0.70).then(result => {
    appState.pendingCompressedImage = result.base64;
    previewImg.src = result.base64;
    previewContainer.style.display = 'block';
    compressionBadge.textContent = `Komprimiert: ~${Math.round(result.sizeKb)} KB`;
    btnAnalyze.disabled = false;
    showToast(`Bild bereit (${Math.round(result.sizeKb)} KB)`);
  }).catch(err => {
    console.error('Kompressionsfehler:', err);
    showToast('Konnte Bild nicht laden');
  });
}

function compressImage(file, maxDimension, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        const sizeKb = (compressedBase64.length * 3 / 4) / 1024;
        resolve({ base64: compressedBase64, sizeKb: sizeKb });
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function removeImagePreview() {
  appState.pendingCompressedImage = null;
  const previewContainer = document.getElementById('previewContainer');
  const btnAnalyze = document.getElementById('btnAnalyzeReceipt');
  const cameraInput = document.getElementById('cameraInput');
  const galleryInput = document.getElementById('galleryInput');

  if (previewContainer) previewContainer.style.display = 'none';
  if (btnAnalyze) btnAnalyze.disabled = true;
  if (cameraInput) cameraInput.value = '';
  if (galleryInput) galleryInput.value = '';
}

async function analyzeReceiptImage() {
  if (!appState.pendingCompressedImage) return;

  const btn = document.getElementById('btnAnalyzeReceipt');
  const btnText = document.getElementById('analyzeBtnText');
  const modeCamera = document.getElementById('mode-camera');

  btn.disabled = true;
  btnText.textContent = 'Gemini scannt Beleg...';
  if (modeCamera) modeCamera.classList.add('scanner-active');

  try {
    let result = null;

    if (appState.config.isDemo || !appState.config.scriptUrl) {
      // Mock AI Parse
      await sleep(1500);
      result = {
        merchant: 'Rewe City Schleißheimer',
        date: new Date().toISOString().split('T')[0],
        totalAmount: 28.45,
        category: 'Lebensmittel',
        suggestedPayer: appState.config.activeUser,
        suggestedSplit: '50_50',
        items: [
          { name: 'Natives Olivenöl Extra 500ml', price: 7.49, quantity: 1, category: 'Lebensmittel' },
          { name: 'Bio-Hafermilch Barista', price: 2.19, quantity: 2, category: 'Lebensmittel' },
          { name: 'Toilettenpapier 3-lagig', price: 3.99, quantity: 1, category: 'Haushalt/Drogerie' },
          { name: 'Bio Bananen Fairtrade', price: 2.59, quantity: 1, category: 'Lebensmittel' }
        ]
      };
    } else {
      // Echter Backend Call
      const res = await callBackend('parseReceiptOrText', {
        image: appState.pendingCompressedImage
      });
      if (!res.success) throw new Error(res.error || 'Fehler bei der Analyse');
      result = res.data;
    }

    removeImagePreview();
    openReviewModal(result);

  } catch (err) {
    console.error('Scan-Fehler:', err);
    showToast('Fehler beim Scan: ' + err.message);
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Kassenbon mit KI analysieren';
    if (modeCamera) modeCamera.classList.remove('scanner-active');
  }
}

async function analyzeFreeText() {
  const input = document.getElementById('freeTextInput');
  const text = input ? input.value.trim() : '';

  if (!text) {
    showToast('Bitte Text eingeben');
    return;
  }

  const btn = document.getElementById('btnAnalyzeText');
  const btnText = document.getElementById('analyzeTextBtnText');

  btn.disabled = true;
  btnText.textContent = 'Gemini analysiert...';

  try {
    let result = null;

    if (appState.config.isDemo || !appState.config.scriptUrl) {
      await sleep(1200);
      result = parseMockText(text);
    } else {
      const res = await callBackend('parseReceiptOrText', { text: text });
      if (!res.success) throw new Error(res.error || 'Fehler beim Parsen');
      result = res.data;
    }

    input.value = '';
    openReviewModal(result);

  } catch (err) {
    console.error('Freitext-Fehler:', err);
    showToast('Fehler: ' + err.message);
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Mit Gemini erfassen';
  }
}

function parseMockText(text) {
  // Simples intelligentes Mock-Parsing für Demo-Zwecke
  const amountMatch = text.match(/(\d+[\.,]?\d*)\s*€/i) || text.match(/(\d+[\.,]\d{2})/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 25.00;
  const userA = appState.config.userA;
  const userB = appState.config.userB;

  let payer = appState.config.activeUser;
  if (text.toLowerCase().includes(userA.toLowerCase())) payer = userA;
  if (text.toLowerCase().includes(userB.toLowerCase())) payer = userB;

  let category = 'Sonstiges';
  if (/thai|restaurant|ramen|pizza|café|döner|burger/i.test(text)) category = 'Restaurant/Café';
  else if (/rewe|edeka|aldi|lidl|supermarkt|lebensmittel/i.test(text)) category = 'Lebensmittel';
  else if (/bier|bar|späti|club|drinks/i.test(text)) category = 'Freizeit/Bar';
  else if (/drogerie|dm|müller|klopapier|spüli/i.test(text)) category = 'Haushalt/Drogerie';

  return {
    merchant: text.slice(0, 32),
    date: new Date().toISOString().split('T')[0],
    totalAmount: amount,
    category: category,
    suggestedPayer: payer,
    suggestedSplit: '50_50',
    items: [
      { name: text.slice(0, 32), price: amount, quantity: 1, category: category }
    ]
  };
}

function handleSaveManual() {
  const title = document.getElementById('manualTitle').value.trim();
  const amount = parseFloat(document.getElementById('manualAmount').value);
  const date = document.getElementById('manualDate').value;
  const category = document.getElementById('manualCategory').value;
  const paidBy = document.getElementById('manualPayer').value;
  const split = document.getElementById('manualSplit').value;

  if (!title || isNaN(amount) || amount <= 0) {
    showToast('Bitte Titel und gültigen Betrag eingeben');
    return;
  }

  const userA = appState.config.userA;
  const userB = appState.config.userB;
  let shareA = 0;
  let shareB = 0;

  if (split === '50_50') {
    shareA = amount / 2;
    shareB = amount / 2;
  } else if (split === '100_USER_A') {
    shareA = paidBy === userA ? amount : 0;
    shareB = paidBy === userB ? amount : 0;
  } else if (split === '100_USER_B') {
    shareA = paidBy === userA ? 0 : amount;
    shareB = paidBy === userB ? 0 : amount;
  }

  const txn = {
    id: 'txn_' + Date.now(),
    date: date || new Date().toISOString().split('T')[0],
    description: title,
    category: category,
    paidBy: paidBy,
    amount: amount,
    splitMethod: split,
    shareA: shareA,
    shareB: shareB,
    type: 'EXPENSE',
    createdAt: new Date().toISOString()
  };

  const item = {
    id: 'item_' + Date.now(),
    transactionId: txn.id,
    name: title,
    quantity: 1,
    price: amount,
    assignedTo: 'GEMEINSAM',
    category: category,
    date: txn.date,
    paidBy: paidBy,
    store: title
  };

  persistTransaction(txn, [item]);

  // Felder leeren & zu Tab 1 wechseln
  document.getElementById('manualTitle').value = '';
  document.getElementById('manualAmount').value = '';
  switchTab('tab-saldo');
  showToast('Ausgabe gespeichert!');
}

// ============================================================================
// 6. INTERACTIVE REVIEW-EDITOR (MODAL)
// ============================================================================

function openReviewModal(parsedData) {
  const modal = document.getElementById('reviewModal');
  const merchantInput = document.getElementById('reviewMerchant');
  const totalInput = document.getElementById('reviewTotal');
  const dateInput = document.getElementById('reviewDate');
  const categoryInput = document.getElementById('reviewCategory');
  const payerInput = document.getElementById('reviewPayer');
  const splitInput = document.getElementById('reviewSplit');

  merchantInput.value = parsedData.merchant || 'Einkauf';
  totalInput.value = (Number(parsedData.totalAmount) || 0).toFixed(2);
  dateInput.value = parsedData.date || new Date().toISOString().split('T')[0];
  categoryInput.value = parsedData.category || 'Lebensmittel';

  if (parsedData.suggestedPayer && (parsedData.suggestedPayer === appState.config.userA || parsedData.suggestedPayer === appState.config.userB)) {
    payerInput.value = parsedData.suggestedPayer;
  } else {
    payerInput.value = appState.config.activeUser;
  }

  splitInput.value = parsedData.suggestedSplit || '50_50';

  appState.reviewItems = Array.isArray(parsedData.items) ? [...parsedData.items] : [];
  renderReviewItemsTable();

  modal.classList.add('open');
}

function closeReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (modal) modal.classList.remove('open');
}

function renderReviewItemsTable() {
  const tbody = document.getElementById('reviewItemsTbody');
  if (!tbody) return;

  if (appState.reviewItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 12px;">Keine Einzelposten vorhanden.</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.reviewItems.map((item, idx) => `
    <tr>
      <td>
        <input type="text" value="${escapeHtml(item.name || '')}" onchange="updateReviewItemName(${idx}, this.value)" placeholder="Artikelname">
      </td>
      <td>
        <input type="number" step="0.01" value="${Number(item.price || 0).toFixed(2)}" onchange="updateReviewItemPrice(${idx}, this.value)" style="text-align: right;">
      </td>
      <td style="text-align: center;">
        <button onclick="removeReviewItem(${idx})" style="background: none; border: none; color: var(--accent-rose); font-size: 16px; cursor: pointer;">✕</button>
      </td>
    </tr>
  `).join('');
}

window.updateReviewItemName = (idx, val) => {
  if (appState.reviewItems[idx]) appState.reviewItems[idx].name = val;
};

window.updateReviewItemPrice = (idx, val) => {
  if (appState.reviewItems[idx]) {
    const oldPrice = Number(appState.reviewItems[idx].price) || 0;
    const newPrice = parseFloat(val) || 0;
    const diff = newPrice - oldPrice;
    appState.reviewItems[idx].price = newPrice;

    const totalInput = document.getElementById('reviewTotal');
    if (totalInput) {
      const currentTotal = parseFloat(totalInput.value) || 0;
      const updatedTotal = Math.max(0, Math.round((currentTotal + diff) * 100) / 100);
      totalInput.value = updatedTotal.toFixed(2);
    }
  }
};

window.removeReviewItem = (idx) => {
  if (idx >= 0 && idx < appState.reviewItems.length) {
    const removedPrice = Number(appState.reviewItems[idx].price) || 0;
    const totalInput = document.getElementById('reviewTotal');
    if (totalInput) {
      const currentTotal = parseFloat(totalInput.value) || 0;
      const newTotal = Math.max(0, Math.round((currentTotal - removedPrice) * 100) / 100);
      totalInput.value = newTotal.toFixed(2);
    }
    appState.reviewItems.splice(idx, 1);
    renderReviewItemsTable();
  }
};

function addReviewItemRow() {
  const newItemPrice = 1.00;
  appState.reviewItems.push({
    name: 'Neuer Artikel',
    price: newItemPrice,
    quantity: 1,
    category: document.getElementById('reviewCategory').value
  });
  const totalInput = document.getElementById('reviewTotal');
  if (totalInput) {
    const currentTotal = parseFloat(totalInput.value) || 0;
    totalInput.value = (currentTotal + newItemPrice).toFixed(2);
  }
  renderReviewItemsTable();
}

async function handleConfirmSaveReview() {
  const merchant = document.getElementById('reviewMerchant').value.trim() || 'Einkauf';
  const total = parseFloat(document.getElementById('reviewTotal').value) || 0;
  const date = document.getElementById('reviewDate').value || new Date().toISOString().split('T')[0];
  const category = document.getElementById('reviewCategory').value;
  const paidBy = document.getElementById('reviewPayer').value;
  const split = document.getElementById('reviewSplit').value;

  const userA = appState.config.userA;
  const userB = appState.config.userB;
  let shareA = 0;
  let shareB = 0;

  if (split === '50_50') {
    shareA = total / 2;
    shareB = total / 2;
  } else if (split === '100_USER_A') {
    shareA = paidBy === userA ? total : 0;
    shareB = paidBy === userB ? total : 0;
  } else if (split === '100_USER_B') {
    shareA = paidBy === userA ? 0 : total;
    shareB = paidBy === userB ? 0 : total;
  }

  const txnId = 'txn_' + Date.now();
  const txn = {
    id: txnId,
    date: date,
    description: merchant,
    category: category,
    paidBy: paidBy,
    amount: total,
    splitMethod: split,
    shareA: shareA,
    shareB: shareB,
    type: 'EXPENSE',
    createdAt: new Date().toISOString()
  };

  const items = appState.reviewItems.map((it, idx) => ({
    id: `item_${Date.now()}_${idx}`,
    transactionId: txnId,
    name: it.name || merchant,
    quantity: it.quantity || 1,
    price: Number(it.price) || 0,
    assignedTo: 'GEMEINSAM',
    category: it.category || category,
    date: date,
    paidBy: paidBy,
    store: merchant
  }));

  closeReviewModal();
  await persistTransaction(txn, items);
  switchTab('tab-saldo');
  showToast('Transaktion erfolgreich gespeichert! 🎉');
}

// ============================================================================
// 7. SETTLE UP (SCHULDEN BEGLEICHEN - ISSUE #4)
// ============================================================================

function openSettleModal() {
  const modal = document.getElementById('settleModal');
  const userA = appState.config.userA;
  const userB = appState.config.userB;
  const net = appState.balance.netAmount;

  const descEl = document.getElementById('settleDescription');
  const amountDisp = document.getElementById('settleSuggestedAmount');
  const amountInput = document.getElementById('settleAmount');
  const payerSelect = document.getElementById('settlePayer');

  // Wer schuldet wem?
  let debtor = userB;
  let creditor = userA;
  let absAmount = Math.abs(net);

  if (net < 0) {
    debtor = userA;
    creditor = userB;
  }

  if (absAmount < 0.01) {
    descEl.textContent = 'Ihr seid quitt! Freie Ausgleichszahlung buchen:';
    amountDisp.textContent = '0,00 €';
    amountInput.value = '10.00';
    payerSelect.value = appState.config.activeUser;
  } else {
    descEl.textContent = `${debtor} gleicht offene Schulden an ${creditor} aus:`;
    amountDisp.textContent = formatEuro(absAmount);
    amountInput.value = absAmount.toFixed(2);
    payerSelect.value = debtor;
  }

  modal.classList.add('open');
}

function closeSettleModal() {
  const modal = document.getElementById('settleModal');
  if (modal) modal.classList.remove('open');
}

async function handleConfirmSettle() {
  const payer = document.getElementById('settlePayer').value;
  const amount = parseFloat(document.getElementById('settleAmount').value);
  const date = document.getElementById('settleDate').value || new Date().toISOString().split('T')[0];
  const note = document.getElementById('settleNote').value.trim() || 'Schuldenausgleich';

  if (isNaN(amount) || amount <= 0) {
    showToast('Bitte gültigen Betrag eingeben');
    return;
  }

  const txn = {
    id: 'txn_' + Date.now(),
    date: date,
    description: note,
    category: 'Ausgleich',
    paidBy: payer,
    amount: amount,
    splitMethod: 'SETTLEMENT',
    shareA: 0,
    shareB: 0,
    type: 'SETTLEMENT',
    createdAt: new Date().toISOString()
  };

  closeSettleModal();
  await persistTransaction(txn, []);
  showToast('Schuldenausgleich gebucht! ✨');
}

// ============================================================================
// 8. TRANSACTION DETAIL & DELETE
// ============================================================================

let currentDetailTxnId = null;

window.openDetailModal = (txnId) => {
  currentDetailTxnId = txnId;
  const txn = appState.transactions.find(t => t.id === txnId);
  if (!txn) return;

  const modal = document.getElementById('detailModal');
  const body = document.getElementById('detailBody');

  const relatedItems = appState.items.filter(it => it.transactionId === txnId);
  const isSettlement = txn.type === 'SETTLEMENT';

  body.innerHTML = `
    <div style="background: var(--bg-surface-elevated); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px;">
      <div style="font-size: 20px; font-weight: 800; margin-bottom: 4px;">${escapeHtml(txn.description)}</div>
      <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">${formatDatePretty(txn.date)} • Gezahlt von <strong>${escapeHtml(txn.paidBy)}</strong></div>
      
      <div style="display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
        <span style="font-size: 14px; color: var(--text-muted);">Gesamtbetrag</span>
        <span style="font-size: 22px; font-weight: 800; color: ${isSettlement ? 'var(--accent-green)' : '#fff'};">${formatEuro(txn.amount)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
        <span>Aufteilung</span>
        <span>${isSettlement ? 'Schuldenausgleich' : getSplitShortLabel(txn.splitMethod)}</span>
      </div>
    </div>

    ${!isSettlement && relatedItems.length > 0 ? `
      <div style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">Kassenbon-Posten (${relatedItems.length}):</div>
      <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
        ${relatedItems.map(it => `
          <div style="display: flex; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 8px; font-size: 13px;">
            <span>${escapeHtml(it.name)}</span>
            <span style="font-weight: 600;">${formatEuro(it.price)}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;

  modal.classList.add('open');
};

function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.classList.remove('open');
  currentDetailTxnId = null;
}

async function handleDeleteCurrentTxn() {
  if (!currentDetailTxnId) return;

  if (!confirm('Möchtest du diese Transaktion wirklich unwiderruflich löschen?')) {
    return;
  }

  const id = currentDetailTxnId;
  closeDetailModal();

  // Lokal entfernen
  appState.transactions = appState.transactions.filter(t => t.id !== id);
  appState.items = appState.items.filter(it => it.transactionId !== id);
  saveCache();
  renderApp();

  // Backend synchronisieren
  if (!appState.config.isDemo && appState.config.scriptUrl) {
    try {
      await callBackend('deleteTransaction', { id: id });
    } catch (e) {
      console.warn('Löschen auf Backend fehlgeschlagen:', e);
    }
  }

  showToast('Transaktion gelöscht');
}

// ============================================================================
// 9. PERSISTIERUNG (BACKEND / LOCAL)
// ============================================================================

async function persistTransaction(txn, items) {
  // 1. Sofort lokal hinzufügen für verzögerungsfreie UX
  appState.transactions.unshift(txn);
  if (Array.isArray(items) && items.length > 0) {
    appState.items.unshift(...items);
  }
  saveCache();
  renderApp();

  // 2. An Backend senden falls konfiguriert
  if (!appState.config.isDemo && appState.config.scriptUrl) {
    try {
      const res = await callBackend('saveTransaction', {
        transaction: txn,
        items: items
      });
      if (!res.success) throw new Error(res.error || 'Serverfehler beim Speichern');
    } catch (e) {
      console.error('Backend Save Error:', e);
      showToast('Konnte nicht mit Google Sheets synchronisieren: ' + e.message);
    }
  }
}

async function callBackend(action, payload) {
  const url = appState.config.scriptUrl;
  const token = appState.config.secretToken;

  if (!url) {
    throw new Error('Google Apps Script URL ist noch nicht konfiguriert.');
  }

  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8' // text/plain verhindert störende CORS-Preflights bei Google Apps Script
    },
    body: JSON.stringify({
      token: token,
      action: action,
      ...payload
    }),
    redirect: 'follow'
  });

  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (err) {
    console.error('Ungültige Server-Antwort:', responseText);
    throw new Error('Ungültige Antwort vom Server (Google Apps Script). Bitte prüfe, ob die Web-App aktuell bereitgestellt ist.');
  }
  return data;
}

// ============================================================================
// 10. ANALYSE & KI-CHATBOT (ISSUE #6)
// ============================================================================

function filterByTimeframe(transactions, range) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  return transactions.filter(t => {
    const d = new Date(t.date || t.createdAt);
    if (isNaN(d.getTime())) return true;

    if (range === 'this_month') {
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    } else if (range === 'last_month') {
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
    } else if (range === 'ytd') {
      return d.getFullYear() === currentYear;
    }
    return true; // 'all'
  });
}

function renderAnalytics() {
  const txs = filterByTimeframe(appState.transactions, appState.activeTimeframe);
  const userA = appState.config.userA;
  const userB = appState.config.userB;

  // Begleichungen (SETTLEMENT) ausschließen für echte Konsumanalyse!
  const consumptionTxs = txs.filter(t => t.type !== 'SETTLEMENT');

  let totalExpenses = 0;
  let paidByUserA = 0;
  let paidByUserB = 0;
  const categoryTotals = {};

  consumptionTxs.forEach(t => {
    const amt = Number(t.amount) || 0;
    totalExpenses += amt;
    if (t.paidBy === userA) paidByUserA += amt;
    else if (t.paidBy === userB) paidByUserB += amt;

    const cat = t.category || 'Sonstiges';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
  });

  // KPI UI
  document.getElementById('statsTotalExpenses').textContent = formatEuro(totalExpenses);
  document.getElementById('statUserAAmount').textContent = formatEuro(paidByUserA);
  document.getElementById('statUserBAmount').textContent = formatEuro(paidByUserB);

  // Monatsdurchschnitt
  let monthsCount = 1;
  if (appState.activeTimeframe === 'ytd') {
    monthsCount = Math.max(1, new Date().getMonth() + 1);
  } else if (appState.activeTimeframe === 'all' && consumptionTxs.length > 0) {
    monthsCount = 3; // sinnvoller Standard
  }
  const monthlyAvg = totalExpenses / monthsCount;
  document.getElementById('statsMonthlyAvg').textContent = formatEuro(monthlyAvg);
  document.getElementById('statsPeriodCount').textContent = `über ${monthsCount} Monat${monthsCount > 1 ? 'e' : ''}`;

  renderCategoryChart(categoryTotals);
  renderMonthlyTrendChart();
}

function renderCategoryChart(categoryTotals) {
  const canvas = document.getElementById('categoryChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const categories = Object.keys(categoryTotals);
  const dataValues = categories.map(c => categoryTotals[c]);

  if (categories.length === 0) {
    categories.push('Keine Ausgaben');
    dataValues.push(1);
  }

  const bgColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#64748B'  // Muted
  ];

  if (appState.categoryChartInstance) {
    appState.categoryChartInstance.destroy();
  }

  appState.categoryChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: dataValues,
        backgroundColor: bgColors.slice(0, categories.length),
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94A3B8',
            font: { size: 11, family: '-apple-system, sans-serif' },
            boxWidth: 12,
            padding: 10
          }
        }
      },
      cutout: '70%'
    }
  });
}

function renderMonthlyTrendChart() {
  const canvas = document.getElementById('monthlyTrendChart');
  if (!canvas || typeof Chart === 'undefined') return;

  // Letzte 4 Monate vorbereiten
  const monthLabels = [];
  const monthKeys = [];
  const now = new Date();

  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('de-DE', { month: 'short' });
    monthLabels.push(label);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const monthlySums = monthKeys.map(key => {
    return appState.transactions
      .filter(t => t.type !== 'SETTLEMENT' && (t.date || '').startsWith(key))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  });

  if (appState.monthlyChartInstance) {
    appState.monthlyChartInstance.destroy();
  }

  appState.monthlyChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [{
        label: 'Ausgaben (€)',
        data: monthlySums,
        backgroundColor: '#3B82F6',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94A3B8', font: { size: 12 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94A3B8', font: { size: 11 }, callback: val => `${val}€` }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

async function handleSendChatMessage() {
  const input = document.getElementById('chatInput');
  const question = input ? input.value.trim() : '';
  if (!question) return;

  input.value = '';
  appendChatBubble(question, 'user');

  // Loading Bubble
  const loadingBubble = appendChatBubble('Gemini überlegt... 💭', 'assistant');

  try {
    let answer = '';

    if (appState.config.isDemo || !appState.config.scriptUrl) {
      await sleep(1400);
      answer = generateMockBotAnswer(question);
    } else {
      const res = await callBackend('askBot', { question: question });
      if (!res.success) throw new Error(res.error || 'Fehler beim Abfragen des Bots');
      answer = res.answer;
    }

    loadingBubble.innerHTML = formatMarkdown(answer);

  } catch (err) {
    console.error('Chatbot-Fehler:', err);
    loadingBubble.innerHTML = `⚠️ Entschuldige, ich konnte die Frage nicht beantworten: ${escapeHtml(err.message)}`;
  }
}

function appendChatBubble(text, role) {
  const container = document.getElementById('chatMessages');
  if (!container) return null;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerHTML = escapeHtml(text);
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

function generateMockBotAnswer(question) {
  const q = question.toLowerCase();
  if (q.includes('olivenöl')) {
    return '🫒 Ihr habt am **' + getRelativeDateStr(0) + '** zuletzt **Natives Bio-Olivenöl Extra** bei **Rewe City Schwabing** für **6,99 €** gekauft (gezahlt von Johannes).';
  } else if (q.includes('restaurant') || q.includes('essen')) {
    return '🍽️ Euer teuerster Restaurantbesuch der letzten Zeit war die **Takumi Ramen Bar** mit **38,00 €** am ' + getRelativeDateStr(-5) + '.';
  } else if (q.includes('wer hat mehr') || q.includes('ausgelegt')) {
    return '⚖️ Aktuell hat **' + appState.config.userA + '** etwas mehr ausgelegt. Der aktuelle Saldo beträgt **' + formatEuro(Math.abs(appState.balance.netAmount)) + '** zugunsten von ' + appState.config.userA + '.';
  } else if (q.includes('klopapier') || q.includes('toilettenpapier')) {
    return '🧻 Toilettenpapier (3-lagig 8er) wurde vor 2 Tagen am **' + getRelativeDateStr(-2) + '** bei **dm Drogeriemarkt** für **3,95 €** von ' + appState.config.userB + ' besorgt.';
  }
  return '💡 In diesem Monat habt ihr bisher ca. **' + formatEuro(appState.transactions.reduce((s, t) => s + (t.type !== 'SETTLEMENT' ? t.amount : 0), 0)) + '** für WG-Konsum ausgegeben. Alles liegt im grünen Bereich!';
}

// ============================================================================
// 11. WG-PANTRY: DAUERHAFTE VORRÄTE & BASICS (OHNE FRISCHEWARE & PREISE)
// ============================================================================

const PANTRY_CATEGORIES = {
  oil_vinegar: {
    id: 'oil_vinegar',
    label: 'Öl & Essig',
    icon: '🫒',
    pattern: /(öl|speiseöl|olivenöl|rapsöl|sonnenblumenöl|sesamöl|bratöl|essig|vinegar|balsamico|aceto|sojaso[sß]e|tamari|teriyaki|\boil\b)/i
  },
  spices: {
    id: 'spices',
    label: 'Gewürze',
    icon: '🧂',
    pattern: /(salz|salt|pfeffer|pepper|paprikapulver|oregano|basilikum|thymian|rosmarin|curry|kurkuma|zimt|chili|kreuzkümmel|muskat|lorbeer|knoblauchpulver|gewürz|kräuter)/i
  },
  condiments: {
    id: 'condiments',
    label: 'Kondimente',
    icon: '🥫',
    pattern: /(ketchup|senf|mustard|mayo|mayonnaise|sriracha|tabasco|pesto|sambal|remoulade|bbq|barbecue|dressing|worcester|ajvar)/i
  },
  cleaning: {
    id: 'cleaning',
    label: 'Putzmittel',
    icon: '🧼',
    pattern: /(spül|tabs|allzweckreiniger|glasreiniger|scheuermilch|wc-reiniger|badreiniger|putzmittel|putzstein|schwamm|schwämme|lappen|mikrofasertuch|entkalker|klarspüler|waschmittel)/i
  },
  household: {
    id: 'household',
    label: 'Haushalt',
    icon: '🧻',
    pattern: /(müllbeutel|mülltüten|abfallbeutel|backpapier|airfryer|alufolie|frischhaltefolie|toilettenpapier|klopapier|küchenrolle|küchentücher|servietten|zipper|gefrierbeutel|kerzen|feuerzeug|batterien)/i
  },
  utensils: {
    id: 'utensils',
    label: 'Küchenutensilien',
    icon: '🔪',
    pattern: /(schneidebrett|brett|messer|knife|schere|pfannenwender|kochlöffel|schäler|sparschäler|dosenöffner|sieb|reibe|schneebesen|korkenzieher|schöpflöffel|pfanne|topf)/i
  }
};

/**
 * Striktes Whitelist-Filter: Ordnet einen Artikel einer der 6 WG-Kategorien zu.
 * Gibt null zurück für kurzlebige Kochzutaten (Kürbis, Fleisch, Brot, Milch, Obst etc.)!
 */
function classifyPantryItem(item) {
  if (!item || !item.name) return null;
  const name = String(item.name).trim();
  const cat = String(item.pantryCategory || item.category || '').toLowerCase();

  // 1. Prüfung über direkte Gemini-Pantry-Kategorie oder Subkategorie
  if (cat.includes('öl') || cat.includes('essig') || cat.includes('oil')) return PANTRY_CATEGORIES.oil_vinegar;
  if (cat.includes('gewürz') || cat.includes('spice')) return PANTRY_CATEGORIES.spices;
  if (cat.includes('kondiment') || cat.includes('condiment') || cat.includes('senf') || cat.includes('ketchup') || cat.includes('pesto')) return PANTRY_CATEGORIES.condiments;
  if (cat.includes('putzmittel') || cat.includes('cleaning') || cat.includes('spül')) return PANTRY_CATEGORIES.cleaning;
  if (cat.includes('utensil')) return PANTRY_CATEGORIES.utensils;

  // 2. Keyword-Matching gegen die 6 Pantry-Kategorien
  for (const key in PANTRY_CATEGORIES) {
    if (PANTRY_CATEGORIES[key].pattern.test(name)) {
      return PANTRY_CATEGORIES[key];
    }
  }

  // Alles andere (wie Kürbis, Fleisch, Milch, Nudeln, Obst, Gemüse etc.) ist Frischeware -> null!
  return null;
}

/**
 * Filtert und dedupliziert Pantry-Vorräte: Behält pro Artikel nur den neuesten Kauf!
 */
function getDeduplicatedPantryItems(allItems) {
  const pantryItems = [];
  const seenMap = new Map();

  // Neueste zuerst sortieren
  const sorted = [...allItems].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  for (const item of sorted) {
    const classification = classifyPantryItem(item);
    if (!classification) continue; // Kurzlebige Frischezutaten ignorieren!

    // Normalisierter Schlüssel zur Vermeidung von Doppel-Einträgen bei Mehrfachkauf
    const normKey = item.name.toLowerCase()
      .replace(/(\d+ml|\d+g|\d+kg|\d+er|\d+l)/gi, '')
      .replace(/[^a-z0-9äöüß]/gi, '')
      .trim();

    if (!seenMap.has(normKey)) {
      seenMap.set(normKey, true);
      pantryItems.push({
        ...item,
        normKey: normKey,
        pantryCat: classification
      });
    }
  }

  return pantryItems;
}

function renderPantry() {
  const listEl = document.getElementById('itemsList');
  if (!listEl) return;

  const searchInput = document.getElementById('itemSearchInput');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const activeCat = appState.activePantryCategory || 'all';

  // 1. Nur echte Pantry-Vorräte holen & deduplizieren
  let items = getDeduplicatedPantryItems(appState.items);

  // 2. Kategorie-Filter anwenden
  if (activeCat && activeCat !== 'all') {
    items = items.filter(it => it.pantryCat && it.pantryCat.id === activeCat);
  }

  // 3. Textsuche anwenden
  if (query) {
    items = items.filter(it => 
      (it.name || '').toLowerCase().includes(query) ||
      (it.store || '').toLowerCase().includes(query) ||
      (it.pantryCat && it.pantryCat.label.toLowerCase().includes(query))
    );
  }

  // 4. Kategorie-Zusammenfassungs-Banner (Option B) berechnen
  let summarySpent = 0;
  let summaryLabel = 'Alle WG-Vorräte';
  let summaryIcon = '🥫';

  if (activeCat && activeCat !== 'all' && PANTRY_CATEGORIES[activeCat]) {
    summaryLabel = PANTRY_CATEGORIES[activeCat].label;
    summaryIcon = PANTRY_CATEGORIES[activeCat].icon;
  }

  // Gesamtausgaben für die gewählte Kategorie über alle bisherigen Einkäufe summieren
  appState.items.forEach(it => {
    const cls = classifyPantryItem(it);
    if (!cls) return;
    if (activeCat === 'all' || cls.id === activeCat) {
      summarySpent += (Number(it.price) || 0);
    }
  });

  const iconEl = document.getElementById('summaryIcon');
  const labelEl = document.getElementById('summaryLabel');
  const spentEl = document.getElementById('summaryTotalSpent');
  const countEl = document.getElementById('summaryItemCount');

  if (iconEl) iconEl.textContent = summaryIcon;
  if (labelEl) labelEl.textContent = summaryLabel;
  if (spentEl) spentEl.textContent = formatEuro(summarySpent);
  if (countEl) countEl.textContent = `${items.length} Vorräte gelistet`;

  if (items.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🥫</div>
        <p>Keine WG-Vorräte in dieser Auswahl.<br>Einmalige Kochzutaten (z. B. Kürbis, Fleisch) werden hier bewusst ausgeblendet.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = items.map(it => {
    const timeAgoStr = getTimeAgo(it.date);
    const datePretty = formatDatePretty(it.date);
    const cat = it.pantryCat || PANTRY_CATEGORIES.household;

    return `
      <div class="pantry-card" onclick="openPantryDetailModal('${it.normKey}')">
        <div class="pantry-left">
          <div class="pantry-icon">${cat.icon}</div>
          <div class="pantry-info">
            <div class="pantry-title">${escapeHtml(it.name)}</div>
            <span class="pantry-category-badge">${cat.label}</span>
          </div>
        </div>
        <div class="pantry-right">
          <div class="pantry-right-text">
            <div class="pantry-time-ago">${timeAgoStr}</div>
            <div class="pantry-meta">am ${datePretty}</div>
            <div class="pantry-meta">von <strong>${escapeHtml(it.paidBy || 'WG')}</strong></div>
          </div>
          <span class="pantry-chevron">›</span>
        </div>
      </div>
    `;
  }).join('');
}

function closePantryDetailModal() {
  const modal = document.getElementById('pantryDetailModal');
  if (modal) modal.classList.remove('open');
}

/**
 * 1-Tap Drilldown & Detailanalyse für ein einzelnes Pantry-Produkt (Option A)
 */
window.openPantryDetailModal = (normKey) => {
  if (!normKey) return;
  const modal = document.getElementById('pantryDetailModal');
  const titleEl = document.getElementById('pantryModalTitle');
  const iconEl = document.getElementById('pantryModalIcon');
  const bodyEl = document.getElementById('pantryModalBody');

  // Alle historischen Einkäufe dieses Artikels finden
  const matchingPurchases = appState.items
    .filter(it => {
      const cls = classifyPantryItem(it);
      if (!cls) return false;
      const key = it.name.toLowerCase()
        .replace(/(\d+ml|\d+g|\d+kg|\d+er|\d+l)/gi, '')
        .replace(/[^a-z0-9äöüß]/gi, '')
        .trim();
      return key === normKey;
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (matchingPurchases.length === 0) return;

  const latest = matchingPurchases[0];
  const cat = classifyPantryItem(latest) || PANTRY_CATEGORIES.household;

  if (titleEl) titleEl.textContent = latest.name;
  if (iconEl) iconEl.textContent = cat.icon;

  // KPIs berechnen
  let totalSpent = 0;
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  const buyerCounts = {};

  matchingPurchases.forEach(p => {
    const pr = Number(p.price) || 0;
    totalSpent += pr;
    if (pr > 0 && pr < minPrice) minPrice = pr;
    if (pr > maxPrice) maxPrice = pr;
    const b = p.paidBy || 'WG';
    buyerCounts[b] = (buyerCounts[b] || 0) + 1;
  });

  const count = matchingPurchases.length;
  const avgPrice = count > 0 ? (totalSpent / count) : 0;
  if (minPrice === Infinity) minPrice = avgPrice;
  if (maxPrice === -Infinity) maxPrice = avgPrice;

  // Kauf-Rhythmus berechnen (falls >= 2 Einkäufe vorhanden)
  let rhythmStr = `Zuletzt ${getTimeAgo(latest.date)}`;
  if (count >= 2) {
    const oldest = matchingPurchases[count - 1];
    const dNew = new Date(latest.date || 0);
    const dOld = new Date(oldest.date || 0);
    const totalDays = Math.max(1, Math.round((dNew - dOld) / (1000 * 60 * 60 * 24)));
    const avgDays = Math.round(totalDays / (count - 1));
    rhythmStr = `alle ~${avgDays} Tage`;
  }

  // Buyer Aufteilung
  const buyerSummaryStr = Object.keys(buyerCounts)
    .map(name => `${name} (${buyerCounts[name]}x)`)
    .join(' • ');

  bodyEl.innerHTML = `
    <!-- KPI 2x2 Grid -->
    <div class="pantry-modal-grid">
      <div class="pantry-kpi-card">
        <div class="pantry-kpi-title">Gesamtausgaben</div>
        <div class="pantry-kpi-value">${formatEuro(totalSpent)}</div>
        <div class="pantry-kpi-sub">${count}x gekauft</div>
      </div>
      <div class="pantry-kpi-card">
        <div class="pantry-kpi-title">Ø Preis pro Stück</div>
        <div class="pantry-kpi-value">${formatEuro(avgPrice)}</div>
        <div class="pantry-kpi-sub">${minPrice < maxPrice ? `${formatEuro(minPrice)} - ${formatEuro(maxPrice)}` : 'konstant'}</div>
      </div>
      <div class="pantry-kpi-card">
        <div class="pantry-kpi-title">Kauf-Rhythmus</div>
        <div class="pantry-kpi-value" style="font-size: 15px;">${rhythmStr}</div>
        <div class="pantry-kpi-sub">Verbrauchstempo</div>
      </div>
      <div class="pantry-kpi-card">
        <div class="pantry-kpi-title">Wer hat bezahlt?</div>
        <div class="pantry-kpi-value" style="font-size: 14px;">${escapeHtml(buyerSummaryStr || 'WG')}</div>
        <div class="pantry-kpi-sub">Käufe pro Mitbewohner</div>
      </div>
    </div>

    <!-- Purchase History List -->
    <div class="pantry-history-section-title">
      <span>Kauf-Historie (${count})</span>
      <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">Neueste zuerst</span>
    </div>

    <div class="pantry-history-list">
      ${matchingPurchases.map(p => {
        const timeAgo = getTimeAgo(p.date);
        const datePretty = formatDatePretty(p.date);
        return `
          <div class="pantry-history-row">
            <div class="pantry-history-left">
              <div class="pantry-history-date">${datePretty} (${timeAgo})</div>
              <div class="pantry-history-store">🏪 ${escapeHtml(p.store || 'Supermarkt')}</div>
            </div>
            <div class="pantry-history-right">
              <div class="pantry-history-price">${formatEuro(p.price)}</div>
              <div class="pantry-history-payer">von ${escapeHtml(p.paidBy || 'WG')}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  modal.classList.add('open');
};

// Kompatibilitäts-Alias
function renderRecentItems() {
  renderPantry();
}

// ============================================================================
// 12. EINSTELLUNGEN & SYNCHRONISIERUNG
// ============================================================================

function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  document.getElementById('settingAppUrl').value = appState.config.scriptUrl || '';
  document.getElementById('settingSecret').value = appState.config.secretToken || '';
  document.getElementById('settingUserA').value = appState.config.userA || 'Johannes';
  document.getElementById('settingUserB').value = appState.config.userB || 'Mitbewohner';
  document.getElementById('settingDemoToggle').checked = appState.config.isDemo;

  updateUserSelectors();
  modal.classList.add('open');
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('open');
}

function handleSaveSettings() {
  const url = document.getElementById('settingAppUrl').value.trim();
  const secret = document.getElementById('settingSecret').value.trim();
  const userA = document.getElementById('settingUserA').value.trim() || 'Johannes';
  const userB = document.getElementById('settingUserB').value.trim() || 'Mitbewohner';
  const activeUser = document.getElementById('settingActiveUser').value;
  const isDemo = document.getElementById('settingDemoToggle').checked;

  saveConfig({
    scriptUrl: url,
    secretToken: secret,
    userA: userA,
    userB: userB,
    activeUser: activeUser,
    isDemo: isDemo
  });

  updateUserSelectors();
  initUI();
  renderApp();
  closeSettingsModal();
  showToast('Einstellungen gespeichert');

  if (!isDemo && url) {
    syncWithBackend();
  }
}

async function testConnectionAndSync() {
  const btn = document.getElementById('btnTestConnection');
  btn.textContent = 'Verbinde mit Google Apps Script...';
  btn.disabled = true;

  const url = document.getElementById('settingAppUrl').value.trim();
  const secret = document.getElementById('settingSecret').value.trim();

  if (!url) {
    showToast('Bitte Web-App-URL eingeben');
    btn.textContent = '🔄 Verbindung testen & synchronisieren';
    btn.disabled = false;
    return;
  }

  saveConfig({ scriptUrl: url, secretToken: secret, isDemo: false });

  try {
    const res = await callBackend('init', {});
    if (!res.success) throw new Error(res.error || 'Server lehnte Anfrage ab');

    appState.transactions = res.transactions || [];
    appState.items = res.items || [];
    appState.balance = res.balance || calculateBalanceLocally(appState.transactions);
    if (res.config) {
      saveConfig({
        userA: res.config.userA || appState.config.userA,
        userB: res.config.userB || appState.config.userB,
        isDemo: false
      });
    }

    saveCache();
    updateUserSelectors();
    initUI();
    renderApp();

    showToast('Erfolgreich mit Google Sheets verbunden! 🚀');
    closeSettingsModal();

  } catch (err) {
    console.error('Verbindungsfehler:', err);
    showToast('Verbindung fehlgeschlagen: ' + err.message);
  } finally {
    btn.textContent = '🔄 Verbindung testen & synchronisieren';
    btn.disabled = false;
  }
}

async function syncWithBackend() {
  try {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    if (statusDot) statusDot.className = 'status-dot';
    if (statusText) statusText.textContent = 'Synchronisiere...';

    const res = await callBackend('init', {});
    if (res.success) {
      appState.transactions = res.transactions || [];
      appState.items = res.items || [];
      appState.balance = res.balance || calculateBalanceLocally(appState.transactions);
      saveCache();
      renderApp();
      if (statusText) statusText.textContent = 'Online';
    }
  } catch (err) {
    console.warn('Hintergrund-Sync fehlgeschlagen:', err);
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    if (statusDot) statusDot.className = 'status-dot offline';
    if (statusText) statusText.textContent = 'Offline (Cache)';
  }
}

// ============================================================================
// 13. HILFSFUNKTIONEN
// ============================================================================

function formatEuro(amount) {
  const num = Number(amount) || 0;
  return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function formatDatePretty(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getRelativeDateStr(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function getTimeAgo(dateStr) {
  if (!dateStr) return 'Unbekannt';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const diffMs = new Date() - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Heute';
  if (diffDays === 1) return 'Gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  if (diffDays < 14) return 'vor 1 Woche';
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
  return `vor ${Math.floor(diffDays / 30)} Monaten`;
}

function getCategoryEmoji(category) {
  switch (category) {
    case 'Lebensmittel': return '🛒';
    case 'Restaurant/Café': return '🍽️';
    case 'Haushalt/Drogerie': return '🧴';
    case 'Freizeit/Bar': return '🍻';
    case 'Ausgleich': return '💸';
    default: return '📦';
  }
}

function getSplitShortLabel(splitMethod) {
  switch (splitMethod) {
    case '50_50': return '50 / 50';
    case '100_USER_A': return '100% Zahler';
    case '100_USER_B': return '100% Mitbewohner';
    case 'SETTLEMENT': return 'Ausgleich';
    default: return 'Individuell';
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMarkdown(text) {
  if (!text) return '';
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
