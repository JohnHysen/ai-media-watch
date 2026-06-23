// content.js - работает на странице TikTok

console.log('[Content] ========== CONTENT SCRIPT LOADED ==========');
console.log('[Content] Current URL:', window.location.href);

let isAutoCollectEnabled = true;

// Проверяем состояние автоподбора
chrome.storage.sync.get(['autoCollectEnabled'], (result) => {
    isAutoCollectEnabled = result.autoCollectEnabled !== false;
    console.log('[Content] Auto-collect enabled:', isAutoCollectEnabled);
});

// Слушаем изменения состояния
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'toggleAutoCollect') {
        isAutoCollectEnabled = msg.enabled;
        console.log('[Content] Auto-collect toggled:', isAutoCollectEnabled);
    }
});

// Отправка в background
function sendVideoToBackground(url) {
  if (!url) {
    console.log('[Content] ❌ No URL to send');
    return;
  }
  
  // Проверяем включен ли автоподбор
  if (!isAutoCollectEnabled) {
    console.log('[Content] ⏭️ Auto-collect disabled, skipping:', url);
    return;
  }
  
  console.log('[Content] 📤 Sending video to background:', url);
  
  chrome.runtime.sendMessage({
    url: url,
    source: 'tiktok',
    action: 'newVideo'
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[Content] ❌ Error sending:', chrome.runtime.lastError.message);
    } else {
      console.log('[Content] ✅ Sent successfully', response);
    }
  });
}

// Получение прямого URL из адресной строки (только валидные форматы)
function getDirectVideoUrl() {
  try {
    const currentUrl = window.location.href;
    console.log('[Content] 🔍 Checking current URL:', currentUrl);
    
    // Проверяем ТОЛЬКО валидный формат: https://www.tiktok.com/@username/video/цифры
    const validMatch = currentUrl.match(/https?:\/\/www\.tiktok\.com\/@[^\/]+\/video\/\d+/);
    if (validMatch) {
      const url = validMatch[0];
      console.log('[Content] ✅ Found valid video URL:', url);
      return url;
    }
    
    // Проверяем альтернативный формат с параметрами
    const paramMatch = currentUrl.match(/https?:\/\/www\.tiktok\.com\/@[^\/]+\/video\/\d+\?/);
    if (paramMatch) {
      const baseUrl = paramMatch[0].split('?')[0];
      console.log('[Content] ✅ Found video URL with params:', baseUrl);
      return baseUrl;
    }
    
    console.log('[Content] ℹ️ Not a valid TikTok video page');
    return null;
  } catch (error) {
    console.error('[Content] Error getting direct URL:', error);
    return null;
  }
}

// Получение username для текущего видео
function getCurrentUsername() {
  try {
    // 1. Ищем через data-e2e атрибут
    const creatorInfo = document.querySelector('[data-e2e="video-author-avatar"]');
    if (creatorInfo) {
      const href = creatorInfo.getAttribute('href');
      if (href) {
        const match = href.match(/@([^/?]+)/);
        if (match) {
          console.log('[Content] Found username from author avatar:', match[1]);
          return match[1];
        }
      }
    }

    // 2. Ищем через ссылку автора
    const authorLink = document.querySelector('[data-e2e="video-author-avatar"]')?.closest('a');
    if (authorLink) {
      const href = authorLink.getAttribute('href');
      if (href) {
        const match = href.match(/@([^/?]+)/);
        if (match) {
          console.log('[Content] Found username from author link:', match[1]);
          return match[1];
        }
      }
    }

    // 3. Ищем через DivCreatorInfoContainer
    const creatorContainer = document.querySelector('.css-f1s7n1-7937d88b--DivCreatorInfoContainer');
    if (creatorContainer) {
      const link = creatorContainer.querySelector('a[href*="/@"]');
      if (link) {
        const href = link.getAttribute('href');
        const match = href.match(/@([^/?]+)/);
        if (match) {
          console.log('[Content] Found username from creator container:', match[1]);
          return match[1];
        }
      }
      
      const nameText = creatorContainer.querySelector('p.TUXText');
      if (nameText) {
        const username = nameText.textContent.trim();
        if (username && !username.includes(' ')) {
          console.log('[Content] Found username from text:', username);
          return username;
        }
      }
    }

    // 4. Ищем через article контейнер
    const article = document.querySelector('article[data-e2e="recommend-list-item-container"]');
    if (article) {
      const link = article.querySelector('a[href*="/@"]');
      if (link) {
        const href = link.getAttribute('href');
        const match = href.match(/@([^/?]+)/);
        if (match) {
          console.log('[Content] Found username from article:', match[1]);
          return match[1];
        }
      }
    }

    // 5. Ищем через avatar
    const avatar = document.querySelector('[data-e2e="video-author-avatar"]');
    if (avatar) {
      const href = avatar.getAttribute('href');
      if (href) {
        const match = href.match(/@([^/?]+)/);
        if (match) {
          console.log('[Content] Found username from avatar data-e2e:', match[1]);
          return match[1];
        }
      }
    }

    // 6. Ищем через wrapper
    const wrapper = document.querySelector('[id^="xgwrapper-"]');
    if (wrapper) {
      const container = wrapper.closest('article') || wrapper.closest('[data-e2e="recommend-list-item-container"]');
      if (container) {
        const link = container.querySelector('a[href*="/@"]');
        if (link) {
          const href = link.getAttribute('href');
          const match = href.match(/@([^/?]+)/);
          if (match) {
            console.log('[Content] Found username from wrapper container:', match[1]);
            return match[1];
          }
        }
      }
    }

    // 7. Пробуем через URL страницы
    const urlMatch = window.location.href.match(/@([^\/]+)/);
    if (urlMatch) {
      console.log('[Content] Found username from URL:', urlMatch[1]);
      return urlMatch[1];
    }

    console.log('[Content] ⚠️ Username not found');
    return null;
  } catch (error) {
    console.error('[Content] Error getting username:', error);
    return null;
  }
}

// Получение video ID из xgwrapper
function getVideoIdFromWrapper() {
  try {
    const wrapper = document.querySelector('[id^="xgwrapper-"]');
    if (wrapper) {
      const match = wrapper.id.match(/xgwrapper-\d+-(\d+)/);
      if (match) {
        console.log('[Content] Found video ID from wrapper:', match[1]);
        return match[1];
      }
    }
    
    // Альтернативный способ - из URL
    const urlMatch = window.location.href.match(/\/video\/(\d+)/);
    if (urlMatch) {
      console.log('[Content] Found video ID from URL:', urlMatch[1]);
      return urlMatch[1];
    }
    
    console.log('[Content] ❌ No video ID found');
    return null;
  } catch (error) {
    console.error('[Content] Error getting video ID:', error);
    return null;
  }
}

// Получение URL видео
function getVideoUrl() {
  try {    
    // 1. Проверяем прямой URL из адресной строки (только валидные форматы)
    const directUrl = getDirectVideoUrl();
    if (directUrl) {
      console.log('[Content] ✅ Using direct URL from address bar:', directUrl);
      return directUrl;
    }
    
    // 2. Если нет прямого URL, собираем из элементов DOM
    const videoId = getVideoIdFromWrapper();
    if (!videoId) {
      console.log('[Content] ❌ No video ID found in DOM');
      return null;
    }
    
    const username = getCurrentUsername();
    
    // Всегда строим URL с @username
    if (username) {
      const url = `https://www.tiktok.com/@${username}/video/${videoId}`;
      console.log('[Content] ✅ Built URL with username:', url);
      return url;
    } else {
      // Если username не найден, пытаемся получить из URL
      const urlMatch = window.location.href.match(/@([^\/]+)/);
      if (urlMatch) {
        const urlFromUrl = `https://www.tiktok.com/@${urlMatch[1]}/video/${videoId}`;
        console.log('[Content] ✅ Built URL from URL username:', urlFromUrl);
        return urlFromUrl;
      }
      
      // Если совсем не найдено - возвращаем null
      console.log('[Content] ❌ Cannot build valid URL without username');
      return null;
    }
  } catch (error) {
    console.error('[Content] ❌ Error getting video URL:', error);
    return null;
  }
}

let lastUrl = '';
let checkCount = 0;

function checkVideo() {
  checkCount++;
  console.log(`[Content] 🔍 Check #${checkCount}`);
  
  const url = getVideoUrl();
  if (url && url !== lastUrl) {
    console.log(`[Content] 🎬 New video detected!`);
    console.log(`[Content] URL: ${url}`);
    lastUrl = url;
    sendVideoToBackground(url);
  } else if (url) {
    console.log('[Content] Same video, skipping');
  } else {
    console.log('[Content] No video found');
  }
}

// Запускаем проверку
console.log('[Content] ⏰ Starting checks...');
setTimeout(checkVideo, 1000);
setTimeout(checkVideo, 3000);
setTimeout(checkVideo, 5000);

// MutationObserver для отслеживания изменений
const observer = new MutationObserver(() => {
  const wrapper = document.querySelector('[id^="xgwrapper-"]');
  if (wrapper) {
    clearTimeout(window._checkTimeout);
    window._checkTimeout = setTimeout(checkVideo, 300);
  }
});

if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['id', 'src', 'href']
  });
  console.log('[Content] 👀 DOM observer started');
}

// Отслеживаем изменение URL (SPA)
let lastPath = window.location.pathname;
setInterval(() => {
  const currentPath = window.location.pathname;
  if (currentPath !== lastPath) {
    console.log(`[Content] 🔄 URL changed from ${lastPath} to ${currentPath}`);
    lastPath = currentPath;
    lastUrl = '';
    setTimeout(checkVideo, 500);
  }
}, 500);

// popstate
window.addEventListener('popstate', () => {
  console.log('[Content] 🔄 Popstate detected');
  lastUrl = '';
  setTimeout(checkVideo, 500);
});

// Экспорт для отладки
window.__tiktokDebug = {
  getDirectVideoUrl,
  getVideoUrl,
  getCurrentUsername,
  getVideoIdFromWrapper,
  checkVideo,
  sendVideoToBackground,
  isAutoCollectEnabled
};

console.log('[Content] ✅ Ready and waiting for videos');
console.log('[Content] 📝 Debug: __tiktokDebug.getVideoUrl()');