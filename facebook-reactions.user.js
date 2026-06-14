// ==UserScript==
// @name         Facebook Reaction Extractor
// @namespace    bishnu076
// @version      1.0
// @description  Extract reactor names from Facebook posts
// @match        https://www.facebook.com/*
// @match        https://m.facebook.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  function extractNames() {
    let names = new Set();
    let dialogs = document.querySelectorAll('[role="dialog"]');
    let target = null;
    dialogs.forEach(d => {
      if (d.innerText.includes('reactions') || d.innerText.includes('Reactions')) target = d;
    });
    if (!target) return;
    target.querySelectorAll('a[role="link"]').forEach(a => {
      let spans = a.querySelectorAll('span');
      spans.forEach(s => {
        let t = s.innerText.trim();
        if (t.length > 1 && t.length < 50 && 
    !t.includes('\n') && 
    !t.match(/^\d+$/) &&
    !t.toLowerCase().includes('click') &&
    !t.toLowerCase().includes('view') &&
    !t.toLowerCase().includes('profile') &&
    !t.toLowerCase().includes('follow') &&
    !t.toLowerCase().includes('add friend') &&
    !t.toLowerCase().includes('message') &&
    !t.toLowerCase().includes('more'))
          names.add(t);
      });
    });
    if (names.size === 0) return;
    let existing = document.getElementById('fb-reaction-box');
    if (existing) existing.remove();
    let box = document.createElement('div');
    box.id = 'fb-reaction-box';
    box.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;background:#fff;border:3px solid #1877f2;border-radius:12px;padding:15px;z-index:999999;max-height:70vh;overflow-y:auto;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
    box.innerHTML = '<div style="font-weight:bold;color:#1877f2;font-size:16px;margin-bottom:10px;">✅ ' + names.size + ' Reactor Names</div>';
    let ta = document.createElement('textarea');
    ta.value = [...names].join('\n');
    ta.style.cssText = 'width:100%;height:200px;font-size:13px;border:1px solid #ccc;border-radius:6px;padding:8px;box-sizing:border-box;';
    box.appendChild(ta);
    let closeBtn = document.createElement('button');
    closeBtn.innerText = '❌ Close';
    closeBtn.style.cssText = 'margin-top:8px;padding:10px 20px;background:#e74c3c;color:white;border:none;border-radius:6px;font-size:14px;width:100%;';
    closeBtn.onclick = () => box.remove();
    box.appendChild(closeBtn);
    document.body.appendChild(box);
    ta.focus();
    ta.select();
  }

  // Watch for reaction dialog opening
  let observer = new MutationObserver(function() {
    let dialogs = document.querySelectorAll('[role="dialog"]');
    dialogs.forEach(d => {
      if (d.innerText.includes('reactions') && !d.dataset.extracted) {
        d.dataset.extracted = 'true';
        setTimeout(extractNames, 1500);
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
