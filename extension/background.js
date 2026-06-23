// background.js

console.log('[BG] Service worker started');

// Состояние автоподбора
let isAutoCollectEnabled = true; // по умолчанию включен

// Загружаем сохраненное состояние
chrome.storage.sync.get(['autoCollectEnabled'], (result) => {
    isAutoCollectEnabled = result.autoCollectEnabled !== false;
    console.log('[BG] Auto-collect enabled:', isAutoCollectEnabled);
});

// Кэш для предотвращения дублирования
const sentUrls = new Map();
const DEDUP_INTERVAL = 5000; // 5 секунд

async function send(url) {
  if (!url?.startsWith("http")) {
    console.log('[BG] Invalid URL:', url);
    return;
  }

  try {
    // Проверяем, содержит ли URL reels, shorts или tiktok
    const urlLower = url.toLowerCase();
    if (!urlLower.includes('tiktok.com') && 
        !urlLower.includes('/reels/') && 
        !urlLower.includes('/shorts/')) {
      console.log('[BG] ⏭️ Skipping (not reels/shorts/tiktok):', url);
      return;
    }

    // Проверяем дубликаты
    const now = Date.now();
    const lastSent = sentUrls.get(url);
    if (lastSent && (now - lastSent) < DEDUP_INTERVAL) {
      console.log('[BG] ⏭️ Skipping duplicate (sent recently):', url);
      return;
    }

    console.log('[BG] 📤 Sending to server:', url);
    
    const response = await fetch("http://localhost:3500/analysis-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        url: url,
      }),
    });

    if (response.ok) {
      console.log("[BG] ✅ Sent successfully:", url);
      sentUrls.set(url, now);
    } else {
      console.log("[BG] ❌ Server error:", response.status);
      if (response.status === 409) {
        console.log('[BG] ⚠️ Duplicate on server side, ignoring');
      }
    }
  } catch (error) {
    console.error("[BG] ❌ Network error:", error.message);
  }
}

// Обработка сообщений
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[BG] Received message:', msg);
  
  // Обработка переключения автоподбора
  if (msg.action === 'toggleAutoCollect') {
    isAutoCollectEnabled = msg.enabled;
    console.log('[BG] Auto-collect toggled:', isAutoCollectEnabled);
    sendResponse({ success: true, enabled: isAutoCollectEnabled });
    return true;
  }
  
  // Проверяем включен ли автоподбор
  if (!isAutoCollectEnabled) {
    console.log('[BG] ⏭️ Auto-collect disabled, skipping:', msg.url);
    sendResponse({ success: false, message: 'Auto-collect disabled' });
    return true;
  }
  
  // Обработка URL от content script
  if (msg.url) {
    console.log('[BG] 📹 URL from content script:', msg.url);
    send(msg.url);
    sendResponse({ success: true, message: 'URL received and sent to server' });
    return true;
  }
  
  return true;
});

// Смена вкладки / URL
let lastProcessedTabId = null;
let lastProcessedUrl = null;

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  // Игнорируем, если автоподбор выключен
  if (!isAutoCollectEnabled) {
    console.log('[BG] ⏭️ Auto-collect disabled, ignoring tab update');
    return;
  }
  
  if (info.status !== "complete") return;
  if (!tab.url) return;
  
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }
  
  console.log('[BG] Tab updated:', tab.url);
  
  if (tab.url.includes('tiktok.com')) {
    console.log('[BG] TikTok detected, waiting for content script');
    return;
  }
  
  if (lastProcessedTabId === tabId && lastProcessedUrl === tab.url) {
    console.log('[BG] ⏭️ Skipping duplicate tab update');
    return;
  }
  
  lastProcessedTabId = tabId;
  lastProcessedUrl = tab.url;
  
  send(tab.url);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  // Игнорируем, если автоподбор выключен
  if (!isAutoCollectEnabled) {
    console.log('[BG] ⏭️ Auto-collect disabled, ignoring tab activation');
    return;
  }
  
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) return;
    
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }
    
    if (!tab.url.includes('tiktok.com')) {
      if (lastProcessedTabId === tabId && lastProcessedUrl === tab.url) {
        console.log('[BG] ⏭️ Skipping duplicate activation');
        return;
      }
      send(tab.url);
    }
  } catch (error) {
    console.error('[BG] Error getting tab:', error);
  }
});

// Очищаем кэш отправленных URL каждые 30 секунд
setInterval(() => {
  const now = Date.now();
  for (const [url, timestamp] of sentUrls.entries()) {
    if (now - timestamp > DEDUP_INTERVAL) {
      sentUrls.delete(url);
    }
  }
}, 30000);

console.log('[BG] ✅ Ready, waiting for messages...');