// ==UserScript==
// @name         Facebook Reaction Extractor
// @namespace    bishnu076
// @version      2.0
// @description  Extract reactor names from Facebook posts
// @match        https://www.facebook.com/*
// @match        https://m.facebook.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const BLOCKED = ['click','view','profile','follow','add friend','message','more','like','comment','share','reply','see','all','reactions','people','this','you'];

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

    let nameList = [...names].join('\n');

    // Auto copy to clipboard
    navigator.clipboard.writeText(nameList).catch(() => {
      let ta = document.createElement('textarea');
      ta.value = nameList;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });

    // Show confirmation box
    let existing = document.getElementById('fb-reaction-box');
    if (existing) existing.remove();

    let box = document.createElement('div');
    box.id = 'fb-reaction-box';
    box.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;background:#fff;border:3px solid #1877f2;border-radius:12px;padding:15px;z-index:999999;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
    box.innerHTML = `
      <div style="font-weight:bold;color:#1877f2;font-size:16px;margin-bottom:6px;">✅ ${names.size} names copied!</div>
      <div style="color:#333;font-size:13px;margin-bottom:10px;">Ready to paste into ZOZO Checker</div>
      <textarea style="width:100%;height:150px;font-size:12px;border:1px solid #ccc;border-radius:6px;padding:8px;box-sizing:border-box;">${nameList}</textarea>
      <button style="margin-top:8px;padding:10px;background:#1877f2;color:white;border:none;border-radius:6px;font-size:14px;width:48%;margin-right:2%;" onclick="navigator.clipboard.writeText(document.querySelector('#fb-reaction-box textarea').value)">📋 Copy </button>
      <button style="margin-top:8px;padding:10px;background:#e74c3c;color:white;border:none;border-radius:6px;font-size:14px;width:48%;" onclick="document.getElementById('fb-reaction-box').remove()">❌ Close</button>
    `;
    document.body.appendChild(box);
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
