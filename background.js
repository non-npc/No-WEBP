// Background Service Worker for No WebP Extension

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  urlRewriting: true,
  allowlist: []
};

let settings = { ...DEFAULT_SETTINGS };

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('No WebP Extension installed');
  
  // Load settings
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  settings = stored;
  
  // Setup DNR rules
  await updateDNRRules();
  
  // Create context menu
  createContextMenu();
});

// Listen for settings changes
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'sync') {
    // Update local settings
    for (let key in changes) {
      settings[key] = changes[key].newValue;
    }
    
    // Update DNR rules when settings change
    await updateDNRRules();
  }
});

// Update Declarative Net Request rules
async function updateDNRRules() {
  try {
    // Get existing dynamic rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);
    
    // Remove all existing rules
    if (existingRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds
      });
    }
    
    if (!settings.enabled) {
      console.log('WebP blocking disabled');
      return;
    }
    
    const newRules = [];
    let ruleId = 1;
    
    // Rule 1: Modify Accept header to remove WebP/AVIF
    newRules.push({
      id: ruleId++,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          {
            header: 'Accept',
            operation: 'set',
            value: 'image/png,image/jpeg,image/gif,image/*;q=0.8,*/*;q=0.5'
          }
        ]
      },
      condition: {
        resourceTypes: ['image'],
        excludedInitiatorDomains: settings.allowlist.length > 0 ? settings.allowlist : undefined
      }
    });
    
    // Rule 2-N: URL rewriting rules (if enabled)
    if (settings.urlRewriting) {
      // Remove common WebP/AVIF forcing parameters
      const webpParams = [
        'fm=webp',
        'format=webp',
        'f=webp',
        'auto=webp',
        'auto=format',
        'output=webp',
        'format=avif',
        'fm=avif'
      ];
      
      // Create redirect rules to strip WebP parameters
      // Note: This is simplified - real implementation would need regex transform
      newRules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: 'redirect',
          transform: {
            queryTransform: {
              removeParams: ['fm', 'format', 'f', 'auto', 'output']
            }
          }
        },
        condition: {
          resourceTypes: ['image'],
          urlFilter: '*fm=webp*',
          excludedInitiatorDomains: settings.allowlist.length > 0 ? settings.allowlist : undefined
        }
      });
      
      newRules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: 'redirect',
          transform: {
            queryTransform: {
              removeParams: ['format']
            }
          }
        },
        condition: {
          resourceTypes: ['image'],
          urlFilter: '*format=webp*',
          excludedInitiatorDomains: settings.allowlist.length > 0 ? settings.allowlist : undefined
        }
      });
    }
    
    // Add all rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: newRules
    });
    
    console.log(`DNR rules updated: ${newRules.length} rules active`);
  } catch (error) {
    console.error('Error updating DNR rules:', error);
  }
}

// Create context menu for saving images
function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'save-original-format',
      title: 'Save image as original format',
      contexts: ['image']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-original-format') {
    try {
      await saveImageInOriginalFormat(info, tab);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  }
});

// Save image in original format
async function saveImageInOriginalFormat(info, tab) {
  const imageUrl = info.srcUrl;
  
  if (!imageUrl) {
    console.error('No image URL found');
    return;
  }
  
  try {
    // Fetch image with modified Accept header (no WebP/AVIF)
    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/png,image/jpeg,image/gif,image/*;q=0.8,*/*;q=0.5'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    // Get content type to determine file extension
    const contentType = response.headers.get('Content-Type') || '';
    let extension = 'jpg'; // default
    
    if (contentType.includes('image/gif')) {
      extension = 'gif';
    } else if (contentType.includes('image/png')) {
      extension = 'png';
    } else if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
      extension = 'jpg';
    } else if (contentType.includes('image/webp')) {
      extension = 'webp';
      console.warn('Server still returned WebP format');
    } else if (contentType.includes('image/avif')) {
      extension = 'avif';
      console.warn('Server still returned AVIF format');
    }
    
    // Convert response to blob
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    // Extract filename from URL
    let filename = imageUrl.split('/').pop().split('?')[0];
    
    // Remove existing extension if present
    filename = filename.replace(/\.(webp|avif|jpg|jpeg|png|gif)$/i, '');
    
    // Add correct extension
    filename = `${filename}.${extension}`;
    
    // Download the image
    chrome.downloads.download({
      url: blobUrl,
      filename: filename,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
      } else {
        console.log(`Image downloaded as ${filename} (${contentType})`);
      }
      
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    });
    
  } catch (error) {
    console.error('Error fetching/saving image:', error);
    
    // Fallback: try to download original URL
    chrome.downloads.download({
      url: imageUrl,
      saveAs: true
    });
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    sendResponse(settings);
  } else if (request.action === 'checkAllowlist') {
    const domain = new URL(sender.tab.url).hostname;
    const isAllowed = settings.allowlist.some(allowed => domain.includes(allowed));
    sendResponse({ isAllowed });
  }
  return true;
});

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  settings = stored;
  await updateDNRRules();
});

