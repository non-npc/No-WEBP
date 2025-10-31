// Options page logic for No WebP Extension

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  urlRewriting: true,
  allowlist: [
    'reddit.com',
    'redd.it',
    'redditstatic.com',
    'redditmedia.com'
  ]
};

// DOM elements
const enabledToggle = document.getElementById('enabledToggle');
const urlRewritingToggle = document.getElementById('urlRewritingToggle');
const domainInput = document.getElementById('domainInput');
const addDomainBtn = document.getElementById('addDomainBtn');
const allowlistItems = document.getElementById('allowlistItems');
const statusMessage = document.getElementById('statusMessage');

// Current settings
let settings = { ...DEFAULT_SETTINGS };

// Initialize options page
async function init() {
  try {
    // Load settings from storage
    const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    settings = stored;
    
    // Update UI
    updateUI();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Update UI with current settings
function updateUI() {
  enabledToggle.checked = settings.enabled;
  urlRewritingToggle.checked = settings.urlRewriting;
  renderAllowlist();
}

// Render allowlist
function renderAllowlist() {
  allowlistItems.innerHTML = '';
  
  if (!settings.allowlist || settings.allowlist.length === 0) {
    allowlistItems.innerHTML = '<div class="empty-message">No domains in allowlist</div>';
    return;
  }
  
  settings.allowlist.forEach(domain => {
    const item = document.createElement('div');
    item.className = 'allowlist-item';
    
    const span = document.createElement('span');
    span.textContent = domain;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => removeDomain(domain);
    
    item.appendChild(span);
    item.appendChild(removeBtn);
    allowlistItems.appendChild(item);
  });
}

// Save settings to storage
async function saveSettings() {
  try {
    await chrome.storage.sync.set(settings);
    showStatus('Settings saved successfully!');
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings', true);
  }
}

// Show status message
function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message show ' + (isError ? 'error' : 'success');
  
  // Hide after 3 seconds
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 3000);
}

// Add domain to allowlist
function addDomain() {
  let domain = domainInput.value.trim();
  
  if (!domain) {
    showStatus('Please enter a domain', true);
    return;
  }
  
  // Clean up domain input
  domain = domain.toLowerCase();
  domain = domain.replace(/^(https?:\/\/)?(www\.)?/, ''); // Remove protocol and www
  domain = domain.replace(/\/.*$/, ''); // Remove path
  
  if (!domain) {
    showStatus('Invalid domain', true);
    return;
  }
  
  // Check if already in allowlist
  if (settings.allowlist.includes(domain)) {
    showStatus('Domain already in allowlist', true);
    return;
  }
  
  // Add to allowlist
  settings.allowlist.push(domain);
  settings.allowlist.sort();
  
  // Save and update UI
  saveSettings();
  renderAllowlist();
  domainInput.value = '';
}

// Remove domain from allowlist
function removeDomain(domain) {
  settings.allowlist = settings.allowlist.filter(d => d !== domain);
  saveSettings();
  renderAllowlist();
}

// Event listeners
enabledToggle.addEventListener('change', () => {
  settings.enabled = enabledToggle.checked;
  saveSettings();
});

urlRewritingToggle.addEventListener('change', () => {
  settings.urlRewriting = urlRewritingToggle.checked;
  saveSettings();
});

addDomainBtn.addEventListener('click', addDomain);

domainInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addDomain();
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

