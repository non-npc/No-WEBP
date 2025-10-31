// Content Script for No WebP Extension
// Runs at document_start to intercept image loading

(function() {
  'use strict';
  
  let settings = { enabled: true, allowlist: [] };
  let isAllowlisted = false;
  
  // Check if current site is allowlisted
  async function checkAllowlist() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkAllowlist' });
      isAllowlisted = response?.isAllowed || false;
    } catch (error) {
      console.error('Error checking allowlist:', error);
    }
  }
  
  // Get settings from background
  async function loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response) {
        settings = response;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  // Initialize
  (async () => {
    await loadSettings();
    await checkAllowlist();
    
    if (!settings.enabled || isAllowlisted) {
      return;
    }
    
    // Start processing images
    processExistingImages();
    observeNewImages();
  })();
  
  // Process all existing images in the document
  function processExistingImages() {
    // Process <picture> elements
    document.querySelectorAll('picture').forEach(processPictureElement);
    
    // Process <img> elements with srcset
    document.querySelectorAll('img[srcset]').forEach(processImgSrcset);
  }
  
  // Process a <picture> element to remove/demote WebP sources
  function processPictureElement(picture) {
    if (picture.dataset.nowebpProcessed) return;
    picture.dataset.nowebpProcessed = 'true';
    
    const sources = picture.querySelectorAll('source');
    const img = picture.querySelector('img');
    
    if (!img) return;
    
    // Find non-WebP/AVIF sources
    const validSources = [];
    const webpSources = [];
    
    sources.forEach(source => {
      const type = source.getAttribute('type') || '';
      
      if (type.includes('webp') || type.includes('avif')) {
        webpSources.push(source);
      } else {
        validSources.push(source);
      }
    });
    
    // Remove or hide WebP/AVIF sources
    webpSources.forEach(source => {
      // Option 1: Remove entirely
      source.remove();
      
      // Option 2: Set an invalid type to demote (commented out)
      // source.setAttribute('type', 'image/invalid');
    });
    
    // If we have valid sources, the browser will use them
    // If no valid sources remain, try to extract from srcset
    if (validSources.length === 0 && img.srcset) {
      processImgSrcset(img);
    }
  }
  
  // Process <img> srcset to select non-WebP candidates
  function processImgSrcset(img) {
    if (img.dataset.nowebpProcessed) return;
    img.dataset.nowebpProcessed = 'true';
    
    const srcset = img.getAttribute('srcset');
    if (!srcset) return;
    
    // Parse srcset
    const candidates = parseSrcset(srcset);
    
    // Filter out WebP/AVIF candidates
    const nonWebpCandidates = candidates.filter(c => {
      return !c.url.match(/\.webp(\?|$)/i) && !c.url.match(/\.avif(\?|$)/i);
    });
    
    if (nonWebpCandidates.length === 0) {
      // No non-WebP candidates found, leave as is
      return;
    }
    
    // Select best candidate based on device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    let selectedCandidate = nonWebpCandidates[0];
    
    // Find candidate closest to current DPR
    for (const candidate of nonWebpCandidates) {
      if (candidate.descriptor.startsWith('x')) {
        const candidateDpr = parseFloat(candidate.descriptor);
        const currentDpr = parseFloat(selectedCandidate.descriptor) || 1;
        
        if (Math.abs(candidateDpr - dpr) < Math.abs(currentDpr - dpr)) {
          selectedCandidate = candidate;
        }
      }
    }
    
    // Set the selected non-WebP source as src
    img.setAttribute('src', selectedCandidate.url);
    
    // Optionally rebuild srcset without WebP
    const newSrcset = nonWebpCandidates
      .map(c => `${c.url} ${c.descriptor}`)
      .join(', ');
    img.setAttribute('srcset', newSrcset);
  }
  
  // Parse srcset attribute into structured data
  function parseSrcset(srcset) {
    const candidates = [];
    const parts = srcset.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      
      const tokens = trimmed.split(/\s+/);
      const url = tokens[0];
      const descriptor = tokens[1] || '1x';
      
      candidates.push({ url, descriptor });
    }
    
    return candidates;
  }
  
  // Observe DOM for new images (lazy loading, dynamic content)
  function observeNewImages() {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        // Check added nodes
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          
          const element = node;
          
          // Check if it's a picture element
          if (element.tagName === 'PICTURE') {
            processPictureElement(element);
          }
          
          // Check if it's an img with srcset
          if (element.tagName === 'IMG' && element.hasAttribute('srcset')) {
            processImgSrcset(element);
          }
          
          // Check descendants
          element.querySelectorAll('picture').forEach(processPictureElement);
          element.querySelectorAll('img[srcset]').forEach(processImgSrcset);
        }
        
        // Check attribute changes on existing images
        if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
          const element = mutation.target;
          
          if (element.tagName === 'IMG' && mutation.attributeName === 'srcset') {
            // Remove processing flag to allow reprocessing
            delete element.dataset.nowebpProcessed;
            processImgSrcset(element);
          }
        }
      }
    });
    
    // Start observing
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['srcset', 'src']
    });
  }
  
  // Handle CSS background images (bonus feature)
  function processCssBackgroundImages() {
    // This is more complex and may not be necessary for MVP
    // Could be added in future versions
    // Would need to inspect computed styles and modify them
  }
  
  // Log for debugging
  console.log('No WebP Extension: Content script loaded');
  
})();

