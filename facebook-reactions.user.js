// ==UserScript==
// @name         Facebook Reaction Extractor
// @namespace    bishnu076
// @version      3.0
// @description  Extract reactor names from Facebook posts
// @match        https://www.facebook.com/*
// @match        https://m.facebook.com/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
  'use strict';

  const BLOCKED = ['click','view','profile','follow','add friend','message','more','like','comment','share','reply','see','all','reactions','people','this','you'];

  function copyText(text) {
    // Method 1 - GM_setClipboard (most reliable in userscripts)
    if (typeof GM_setClipboard !== 'undefined') {
      GM_setClipboard(text);
      return true;
    }
    // Method 2 - execCommand fallback
    let ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }

  function showBox(names, copied) {
    let existing = document.getElementById('fb-reaction-box');
    if (existing) existing.remove();

    let nameList = [...names].join('\n');

    let box = document.createElement('div');
    box.id = 'fb-reaction-box';
    box.style.cssText = `
      position:fixed;
      top:0;left:0;right:0;bottom:0;
      background:rgba(0,0,0,0.6);
      z-index:999999;
      display:flex;
      align-items:center;
      justify-content:center;
      font-family:-apple-system,sans-serif;
    `;

    let card = document.createElement('div');
    card.style.cssText = `
      background:#fff;
      border-radius:16px;
      padding:20px;
      margin:16px;
      width:100%;
      max-width:420px;
      max-height:85vh;
      overflow-y:auto;
      box-shadow:0 8px 32px rgba(0,0,0,0.4);
    `;

    // Header
    let header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;';
    header.innerHTML = `
      <div>
        <div style="font-size:18px;font-weight:700;color:#1877f2;">👥 Reaction Extractor</div>
        <div style="font-size:13px;color:#666;margin-top:2px;">${names.size} names found</div>
      </div>
      <div style="background:${copied ? '#e8f5e9' : '#fff3e0'};color:${copied ? '#2e7d32' : '#e65100'};padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;">
        ${copied ? '✅ Copied!' : '⚠️ Copy failed'}
      </div>
    `;
    card.appendChild(header);

    // Textarea
    let ta = document.createElement('textarea');
    ta.id = 'fb-name-list';
    ta.value = nameList;
    ta.readOnly = true;
    ta.style.cssText = `
      width:100%;
      height:180px;
      font-size:13px;
      border:1.5px solid #e0e0e0;
      border-radius:10px;
      padding:10px;
      box-sizing:border-box;
      resize:none;
      background:#f8f9fa;
      color:#222;
      line-height:1.6;
    `;
    card.appendChild(ta);

    // Buttons row
    let btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;margin-top:12px;';

    // Copy button
    let copyBtn = document.createElement('button');
    copyBtn.id = 'fb-copy-btn';
    copyBtn.innerText = '📋 Copy';
    copyBtn.style.cssText = `
      flex:1;
      padding:12px;
      background:#1877f2;
      color:white;
      border:none;
      border-radius:10px;
      font-size:15px;
      font-weight:600;
      cursor:pointer;
    `;
    copyBtn.addEventListener('click', function() {
      ta.removeAttribute('readonly');
      ta.select();
      let ok = copyText(nameList);
      ta.setAttribute('readonly', true);
      copyBtn.innerText = ok ? '✅ Copied!' : '❌ Failed';
      copyBtn.style.background = ok ? '#2e7d32' : '#c62828';
      setTimeout(() => {
        copyBtn.innerText = '📋 Copy';
        copyBtn.style.background = '#1877f2';
      }, 2000);
    });
    btnRow.appendChild(copyBtn);

    // Close button
    let closeBtn = document.createElement('button');
    closeBtn.innerText = '✕ Close';
    closeBtn.style.cssText = `
      padding:12px 18px;
      background:#f0f0f0;
      color:#333;
      border:none;
      border-radius:10px;
      font-size:15px;
      font-weight:600;
      cursor:pointer;
    `;
    closeBtn.addEventListener('click', () => box.remove());
    btnRow.appendChild(closeBtn);

    card.appendChild(btnRow);

    // Tip
    let tip = document.createElement('div');
    tip.style.cssText = 'margin-top:10px;font-size:11px;color:#999;text-align:center;';
    tip.innerText = 'Tap Copy → paste into ZOZO Checker';
    card.appendChild(tip);

    box.appendChild(card);

    // Close on background tap
    box.addEventListener('click', function(e) {
      if (e.target === box) box.remove();
    });

    document.body.appendChild(box);

    // Try auto-select textarea
    setTimeout(() => {
      ta.removeAttribute('readonly');
      ta.focus();
      ta.select();
      ta.setAttribute('readonly', true);
    }, 100);
  }

  function extractNames() {
    let names = new Set();
    let dialogs = document.querySelectorAll('[role="dialog"]');
    let target = null;
    dialogs.forEach(d => {
      if (d.innerText.toLowerCase().includes('reaction')) target = d;
    });
    if (!target) return;

    target.querySelectorAll('a[role="link"]').forEach(a => {
      let spans = a.querySelectorAll('span');
      spans.forEach(s => {
        let t = s.innerText.trim();
        let low = t.toLowerCase();
        if (
          t.length > 1 &&
          t.length < 50 &&
          !t.includes('\n') &&
          !t.match(/^\d+$/) &&
          !BLOCKED.some(b => low.includes(b))
        ) names.add(t);
      });
    });

    if (names.size === 0) return;

    // Try auto copy
    let nameList = [...names].join('\n');
    let copied = copyText(nameList);
    showBox(names, copied);
  }

  let observer = new MutationObserver(function() {
    let dialogs = document.querySelectorAll('[role="dialog"]');
    dialogs.forEach(d => {
      if (d.innerText.toLowerCase().includes('reaction') && !d.dataset.extracted) {
        d.dataset.extracted = 'true';
        setTimeout(extractNames, 1500);
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
