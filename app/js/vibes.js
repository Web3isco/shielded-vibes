/**
 * vibes.js — Shielded Vibes enhancement layer
 *
 * Adds: vibe note encryption (AES-GCM), particle effects, confetti,
 * sound, activity feed, quick-amount buttons, and bridges the new
 * vibe cards to the existing tab-based transaction system.
 *
 * Runs alongside ui.js without modifying it.
 * All DOM IDs reference NEW elements only — never touches ui.js IDs.
 */

/* ═══════════════════════════════════════════════
   GLOBAL STATE
   ═══════════════════════════════════════════════ */

window.__shieldedVibes = {
  activityCount: 0,
  particles: null,
  particleBoost: 1,
};

/* ═══════════════════════════════════════════════
   DEBUG LOGGING (emoji-coded for hackathon demos)
   ═══════════════════════════════════════════════ */

const DEBUG = true;

function logWithEmoji(label, msg, data) {
  if (!DEBUG) return;
  const icon = {
    INIT:     '🚀', CONF:     '🎉', SOUND:    '🔊',
    PROOF:    '🧾', WALLET:   '👛', DEPOSIT:  '⬇️',
    SEND:     '↗️', WITHDRAW: '⬆️', ENCRYPT:  '🔒',
    DECRYPT:  '🔓', FEED:     '📡', PARTICLES:'✨',
    BRIDGE:   '🌉', SYNC:     '🔄', ERROR:    '❌',
    TESTNET:  '🧪', BANNER:   '📋',
  }[label] || 'ℹ️';
  const ts = new Date().toLocaleTimeString();
  if (data) {
    console.log(`%c[${ts}] ${icon} [${label}] ${msg}`, 'color:#00f0ff;font-weight:500', data);
  } else {
    console.log(`%c[${ts}] ${icon} [${label}] ${msg}`, 'color:#00f0ff;font-weight:500');
  }
}

/* ═══════════════════════════════════════════════
   TESTNET MODE BANNER
   ═══════════════════════════════════════════════ */

function getNetworkName() {
  const el = document.getElementById('network-name');
  return el?.textContent?.trim().toLowerCase() || '';
}

function initTestnetBanner() {
  const target = document.querySelector('.hero-glow');
  if (!target) { logWithEmoji('BANNER', 'Hero section not found'); return; }

  function updateBanner() {
    const existing = document.getElementById('testnet-banner');
    const name = getNetworkName();
    const isTestnet = name.includes('testnet');

    logWithEmoji('TESTNET', `Network detected: "${name}" → ${isTestnet ? '🧪 TESTNET' : 'mainnet'}`);

    if (isTestnet && !existing) {
      const banner = document.createElement('div');
      banner.id = 'testnet-banner';
      banner.className = 'testnet-banner';
      banner.innerHTML = `
        <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v4M12 17h.01"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
        <span><strong>🧪 Testnet Mode</strong> — Using the Stellar testnet. No real funds at risk.</span>
      `;
      target.insertBefore(banner, target.firstChild);
      logWithEmoji('BANNER', 'Testnet banner added to hero');
    } else if (!isTestnet && existing) {
      existing.remove();
      logWithEmoji('BANNER', 'Testnet banner removed (mainnet detected)');
    }
  }

  updateBanner();

  const netName = document.getElementById('network-name');
  if (netName) {
    new MutationObserver(updateBanner).observe(netName, { childList: true, characterData: true, subtree: true });
  }
}

/* ═══════════════════════════════════════════════
   VIBE NOTE ENCRYPTION (Web Crypto API — AES-GCM)
   ═══════════════════════════════════════════════ */

async function deriveVibeKey(recipientAddress) {
  const salt = new TextEncoder().encode('shielded-vibes-v1:' + recipientAddress);
  const keyMaterial = await crypto.subtle.importKey(
    'raw', salt, 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptVibeNote(text, recipientAddress) {
  const key = await deriveVibeKey(recipientAddress);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  // Pack: iv(12) + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptVibeNote(packedBase64, recipientAddress) {
  try {
    const key = await deriveVibeKey(recipientAddress);
    const combined = Uint8Array.from(atob(packedBase64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decoded = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decoded);
  } catch { return null; }
}

const VIBE_NOTES_KEY = 'shielded_vibe_notes';

function storeVibeNote(recipient, note) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(VIBE_NOTES_KEY) || '{}');
    stored[recipient] = stored[recipient] || [];
    stored[recipient].push({ note, at: Date.now() });
    sessionStorage.setItem(VIBE_NOTES_KEY, JSON.stringify(stored));
  } catch {}
}

/* ═══════════════════════════════════════════════
   SOUND ENGINE (Web Audio API)
   ═══════════════════════════════════════════════ */

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSuccessChime() {
  try {
    ensureAudio();
    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1).connect(audioCtx.destination);
    osc1.start(now); osc1.stop(now + 0.4);
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.25);
    gain2.gain.setValueAtTime(0.1, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2).connect(audioCtx.destination);
    osc2.start(now + 0.1); osc2.stop(now + 0.5);
  } catch {}
}

function playClick() {
  try {
    ensureAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now); osc.stop(now + 0.06);
  } catch {}
}

/* ═══════════════════════════════════════════════
   PARTICLE CANVAS BACKGROUND (intensity-aware)
   ═══════════════════════════════════════════════ */

function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];
  let animId = null;

  const MAX_PARTICLES = 160;
  const BASE_COUNT = 80;

  logWithEmoji('PARTICLES', 'Initializing particle canvas');

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function createParticles(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.8 + 0.4,
        hue: Math.random() < 0.5 ? 185 : (Math.random() < 0.5 ? 320 : 260),
        alpha: Math.random() * 0.5 + 0.15,
      });
    }
    return arr;
  }

  particles = createParticles(BASE_COUNT);

  window.__shieldedVibes.particles = {
    boost(count) {
      const target = Math.min(MAX_PARTICLES, BASE_COUNT + count);
      const diff = target - particles.length;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          particles.push({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 2.2 + 0.6,
            hue: [185, 320, 260][Math.floor(Math.random() * 3)],
            alpha: Math.random() * 0.6 + 0.2,
          });
        }
        logWithEmoji('PARTICLES', `Boosted to ${particles.length} particles`);
      } else if (diff < 0) {
        particles.length = target;
        logWithEmoji('PARTICLES', `Reduced to ${particles.length} particles`);
      }
    },
    decay() {
      if (particles.length > BASE_COUNT) {
        particles.length = BASE_COUNT;
        logWithEmoji('PARTICLES', `Decayed to ${BASE_COUNT} particles`);
      }
    },
  };

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, 0.3)`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.04 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    animId = requestAnimationFrame(draw);
  }
  draw();
}

function boostParticles(count) {
  if (window.__shieldedVibes.particles) {
    window.__shieldedVibes.particles.boost(count);
    setTimeout(() => {
      if (window.__shieldedVibes.particles) {
        window.__shieldedVibes.particles.decay();
      }
    }, 8000);
  }
}

/* ═══════════════════════════════════════════════
   CONFETTI SYSTEM
   ═══════════════════════════════════════════════ */

function fireConfetti() {
  logWithEmoji('CONF', 'ZK proof verified! Firing confetti + chime');
  boostParticles(40);
  window.__shieldedVibes.activityCount++;

  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  const colors = ['#00f0ff', '#ff007a', '#b300ff', '#ff2d8e', '#1affff', '#d966ff'];
  const shapes = ['■', '●', '▲', '★'];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.8;
    const duration = Math.random() * 1.5 + 1.5;
    piece.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    piece.style.cssText = `
      left:${left}%;width:8px;height:8px;font-size:8px;color:${color};
      animation-delay:${delay}s;animation-duration:${duration}s;
      text-shadow:0 0 6px ${color};
    `;
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 4000);
  playSuccessChime();
}

/* ═══════════════════════════════════════════════
   ACTIVITY FEED
   ═══════════════════════════════════════════════ */

const MOCK_ACTIVITY = [
  { type: 'deposit',    amount: '50.00',  when: '2 min ago',  hash: '0x3a1f...b9e2' },
  { type: 'transfer',   amount: '25.00',  when: '15 min ago', hash: '0x7c4d...f1a3', note: 'vibe: meet at the nebula 🌌' },
  { type: 'withdraw',   amount: '100.00', when: '1 hour ago', hash: '0x9e8b...2c7d' },
  { type: 'transfer',   amount: '10.00',  when: '3 hours ago',hash: '0x2f5a...e8b1', note: 'vibe: your vibes are unmatched ✨' },
  { type: 'deposit',    amount: '200.00', when: '6 hours ago',hash: '0x4d1c...7f3e' },
  { type: 'transfer',   amount: '5.00',   when: '12 hours ago',hash: '0x8a2b...1d4f', note: 'vibe: shieldy love 💜' },
  { type: 'withdraw',   amount: '42.00',  when: '1 day ago',  hash: '0x6e7f...3c8a' },
  { type: 'transfer',   amount: '88.00',  when: '2 days ago', hash: '0x1b9c...5d0e', note: 'vibe: cyberpunk forever 🌆' },
];

const TX_CONFIG = {
  deposit:  { icon: '↓', label: 'Deposit',  clr: 'text-brand-400',  bord: 'border-l-brand-500/50' },
  transfer: { icon: '↗', label: 'Send',     clr: 'text-pink-400',   bord: 'border-l-pink-500/50'  },
  withdraw: { icon: '↑', label: 'Withdraw', clr: 'text-magenta-400',bord: 'border-l-magenta-500/50' },
};

function renderActivityEntry(entry) {
  const cfg = TX_CONFIG[entry.type] || TX_CONFIG.transfer;
  const div = document.createElement('div');
  div.className = `activity-entry ${cfg.bord} py-2 px-1`;

  // Show "vibe:" prefix for sender's own notes; non-prefixed for original content
  let noteHtml = '';
  if (entry.note) {
    const displayNote = entry.note.startsWith('vibe: ')
      ? entry.note
      : `vibe: ${entry.note}`;
    noteHtml = `<div class="flex items-center gap-1.5 mt-1 ml-5">
         <span class="vibe-note-badge text-[10px]">🔒 ${displayNote}</span>
       </div>`;
  }

  const fromHtml = entry.from
    ? `<span class="text-[9px] text-dark-500 ml-5">from ${entry.from}</span>`
    : '';

  div.innerHTML = `
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-xs font-bold ${cfg.clr}">${cfg.icon}</span>
        <span class="text-xs font-medium text-dark-200">${cfg.label}</span>
        <span class="font-mono text-sm font-bold text-brand-400">${entry.amount}</span>
        <span class="text-[10px] text-dark-500">XLM</span>
      </div>
      <span class="text-[10px] text-dark-500 flex-shrink-0">${entry.when}</span>
    </div>
    <div class="flex items-center gap-1.5 mt-0.5 ml-5">
      <span class="text-[9px] text-dark-600 font-mono">${entry.hash}</span>
    </div>
    ${fromHtml}
    ${noteHtml}
  `;
  return div;
}

function seedMockActivity() {
  const list = document.getElementById('activity-list');
  const empty = document.getElementById('activity-empty');
  if (!list) return;
  list.innerHTML = '';
  for (const entry of MOCK_ACTIVITY) {
    list.appendChild(renderActivityEntry(entry));
  }
  list.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');
  const count = document.getElementById('activity-count');
  if (count) count.textContent = `${MOCK_ACTIVITY.length} events`;
  logWithEmoji('FEED', `Seeded ${MOCK_ACTIVITY.length} mock activity entries`);
}

function addActivityEntry(entry) {
  const list = document.getElementById('activity-list');
  const empty = document.getElementById('activity-empty');
  if (!list) return;
  if (empty) empty.classList.add('hidden');
  list.classList.remove('hidden');
  const el = renderActivityEntry(entry);
  el.style.opacity = '0';
  el.style.transform = 'translateY(-12px)';
  list.prepend(el);
  requestAnimationFrame(() => {
    el.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  const count = document.getElementById('activity-count');
  if (count) {
    const c = parseInt(count.textContent) || 0;
    count.textContent = `${c + 1} events`;
  }
  // Trim to last 50 entries
  while (list.children.length > 50) list.lastChild.remove();
}

/* ═══════════════════════════════════════════════
   TOAST OBSERVER — confetti ONLY on ZK proof success
   ═══════════════════════════════════════════════ */

function initToastObserver() {
  const container = document.getElementById('toast-container');
  if (!container) return;
  logWithEmoji('INIT', 'Watching toasts for proof verification events');
  const observer = new MutationObserver(() => {
    const toasts = container.querySelectorAll('.toast:not([data-vibes])');
    for (const toast of toasts) {
      toast.setAttribute('data-vibes', '1');
      const msg = toast.querySelector('.toast-message');
      if (!msg) continue;
      const text = msg.textContent.toLowerCase();

      logWithEmoji('FEED', `Toast detected: "${msg.textContent}"`);

      // Only trigger confetti on WASM-proof-verified success
      const isZkProofSuccess =
        (text.includes('success') || text.includes('complete') ||
         text.includes('submitted') || text.includes('confirmed') ||
         text.includes('deposited') || text.includes('transferred') ||
         text.includes('withdrew'))
        && !text.includes('mock') && !text.includes('demo');

      if (isZkProofSuccess) {
        logWithEmoji('PROOF', 'ZK proof verified on-chain! 🧾✅');
        setTimeout(() => { fireConfetti(); }, 400);
        playClick();
      }

      // Extract type
      const type = text.includes('deposit') ? 'deposit'
                 : text.includes('withdraw') ? 'withdraw'
                 : text.includes('transfer') ? 'transfer'
                 : 'transfer';
      const amtMatch = text.match(/([\d.]+)/);
      const hashLink = toast.querySelector('.toast-open');
      const hash = hashLink?.getAttribute('href') || '';
      const shortHash = hash ? hash.slice(-10) : ('0x' + Math.random().toString(16).slice(2, 8) + '...');

      // Retrieve pending vibe note if any
      let note = sessionStorage.getItem('pending_vibe_note') || undefined;
      if (note) sessionStorage.removeItem('pending_vibe_note');

      addActivityEntry({
        type,
        amount: amtMatch ? amtMatch[1] : '—',
        when: 'just now',
        hash: shortHash,
        note,
      });

      boostParticles(15);
    }
  });
  observer.observe(container, { childList: true, subtree: true });
}

/* ═══════════════════════════════════════════════
   QUICK AMOUNT BUTTONS
   ═══════════════════════════════════════════════ */

function initQuickAmounts() {
  document.querySelectorAll('.quick-amount').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      const amount = btn.getAttribute('data-amount');
      const targetId = btn.getAttribute('data-target');
      if (targetId) {
        const input = document.getElementById(targetId);
        if (input) {
          input.value = amount;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        const slider = document.getElementById('vibe-deposit-slider');
        const display = document.getElementById('vibe-deposit-amount');
        if (slider && display) {
          slider.value = amount;
          updateSliderStyle(slider);
          display.textContent = amount;
        }
      }
      btn.closest('.flex')?.querySelectorAll('.quick-amount').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════════════
   DEPOSIT SLIDER
   ═══════════════════════════════════════════════ */

function updateSliderStyle(slider) {
  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 100;
  const val = parseFloat(slider.value) || 0;
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--slider-pct', `${pct}%`);
  // Track fill with gradient
  slider.style.background = `linear-gradient(to right, rgba(0,240,255,0.35) 0%, rgba(0,240,255,0.35) ${pct}%, rgba(255,255,255,0.06) ${pct}%, rgba(255,255,255,0.06) 100%)`;
}

function initDepositSlider() {
  const slider = document.getElementById('vibe-deposit-slider');
  const display = document.getElementById('vibe-deposit-amount');
  if (!slider || !display) return;
  updateSliderStyle(slider);
  slider.addEventListener('input', () => {
    updateSliderStyle(slider);
    display.textContent = slider.value;
  });
}

/* ═══════════════════════════════════════════════
   VIBE CARD → EXISTING TAB BRIDGES
   ═══════════════════════════════════════════════ */

function initDepositBridge() {
  const btn = document.getElementById('vibe-btn-deposit');
  if (!btn) return;
  logWithEmoji('BRIDGE', 'Deposit card bridge initialized');
  btn.addEventListener('click', () => {
    playClick();
    const amount = document.getElementById('vibe-deposit-slider')?.value || '0';
    logWithEmoji('DEPOSIT', `Bridging deposit: ${amount} XLM`);
    const dInput = document.getElementById('deposit-amount');
    if (dInput) {
      dInput.value = amount;
      dInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const tab = document.getElementById('tab-deposit');
    if (tab) tab.click();
    setTimeout(() => {
      const dBtn = document.getElementById('btn-deposit');
      if (dBtn && !dBtn.disabled) {
        logWithEmoji('DEPOSIT', 'Clicking deposit button in advanced panel');
        dBtn.click();
      }
    }, 400);
  });
}

function initSendBridge() {
  const btn = document.getElementById('vibe-btn-send');
  if (!btn) return;
  logWithEmoji('BRIDGE', 'Send card bridge initialized');

  btn.addEventListener('click', async () => {
    playClick();
    const recipient = document.getElementById('vibe-recipient')?.value?.trim();
    const amount = document.getElementById('vibe-send-amount')?.value;
    const noteText = document.getElementById('vibe-note')?.value?.trim();

    logWithEmoji('SEND', `Preparing send: ${amount} XLM → ${recipient} ${noteText ? '📝 note attached' : ''}`);

    if (!recipient) {
      logWithEmoji('SEND', 'No recipient entered — showing error');
      const el = document.getElementById('vibe-recipient');
      el.style.borderColor = '#ff007a';
      el.style.boxShadow = '0 0 12px rgba(255,0,122,0.3)';
      setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 2000);
      return;
    }

    // Encrypt and store the vibe note
    if (noteText) {
      try {
        logWithEmoji('ENCRYPT', `Encrypting vibe note for ${recipient}`);
        const encrypted = await encryptVibeNote(noteText, recipient);
        storeVibeNote(recipient, encrypted);
        sessionStorage.setItem('pending_vibe_note', noteText);
        logWithEmoji('ENCRYPT', 'Vibe note encrypted & stored ✓');
      } catch {
        logWithEmoji('ENCRYPT', 'Encryption failed — storing plaintext for activity feed');
        sessionStorage.setItem('pending_vibe_note', noteText);
      }
    }

    // Look up recipient in address book for keys
    const rows = document.querySelectorAll('#addressbook-tbody tr');
    let foundKey = false;
    for (const row of rows) {
      const addrEl = row.querySelector('.ab-address');
      if (addrEl && addrEl.textContent.trim() === recipient) {
        const nk = row.querySelector('.ab-notekey')?.textContent?.trim();
        const ek = row.querySelector('.ab-enckey')?.textContent?.trim();
        const nkInput = document.getElementById('transfer-recipient-key');
        const ekInput = document.getElementById('transfer-recipient-enc-key');
        if (nkInput && nk) nkInput.value = nk;
        if (ekInput && ek) ekInput.value = ek;
        foundKey = true;
        break;
      }
    }

    // If keys not found, try to look up from address book by searching
    if (!foundKey) {
      const searchInput = document.getElementById('addressbook-search');
      if (searchInput) {
        searchInput.value = recipient;
        const searchBtn = document.getElementById('addressbook-search-btn');
        if (searchBtn) searchBtn.click();
        await new Promise(r => setTimeout(r, 300));
        for (const row of document.querySelectorAll('#addressbook-tbody tr')) {
          const addrEl = row.querySelector('.ab-address');
          if (addrEl && addrEl.textContent.trim() === recipient) {
            const nk = row.querySelector('.ab-notekey')?.textContent?.trim();
            const ek = row.querySelector('.ab-enckey')?.textContent?.trim();
            const nkInput = document.getElementById('transfer-recipient-key');
            const ekInput = document.getElementById('transfer-recipient-enc-key');
            if (nkInput && nk) nkInput.value = nk;
            if (ekInput && ek) ekInput.value = ek;
            foundKey = true;
            break;
          }
        }
      }
    }

    // If still no keys, notify the user to register or use advanced
    if (!foundKey) {
      logWithEmoji('SEND', 'Recipient keys not found in address book');
      const note = document.getElementById('vibe-note');
      const existingHint = document.getElementById('vibe-keys-hint');
      if (!existingHint) {
        const hint = document.createElement('p');
        hint.id = 'vibe-keys-hint';
        hint.className = 'text-[10px] text-pink-400 text-center mt-1';
        hint.innerHTML = '⚠ Recipient not in address book — using Advanced tab';
        note?.parentNode?.insertBefore(hint, note.nextSibling);
        setTimeout(() => hint.remove(), 5000);
      }
    } else {
      logWithEmoji('SEND', 'Recipient keys found in address book ✓');
    }

    // Set amount
    const amtInput = document.getElementById('transfer-amount');
    if (amtInput && amount) {
      amtInput.value = amount;
      amtInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Switch to transfer tab
    const tab = document.getElementById('tab-transfer');
    if (tab) tab.click();

    // Trigger transfer button
    setTimeout(() => {
      const tBtn = document.getElementById('btn-transfer');
      if (tBtn && !tBtn.disabled) {
        logWithEmoji('SEND', 'Clicking transfer button in advanced panel');
        tBtn.click();
      } else {
        const existingHint = document.getElementById('vibe-transfer-hint');
        if (!existingHint) {
          const p = document.createElement('p');
          p.id = 'vibe-transfer-hint';
          p.className = 'text-xs text-brand-400 text-center mt-2 animate-pulse';
          p.textContent = 'Fill in recipient keys above, then click Transfer';
          document.getElementById('panel-transfer')?.querySelector('.space-y-6')?.appendChild(p);
          setTimeout(() => p.remove(), 8000);
        }
      }
      if (amount) {
        addActivityEntry({
          type: 'transfer',
          amount,
          when: 'just now',
          hash: '0x...shielding',
          note: noteText || undefined,
        });
      }
    }, 600);
  });
}

function initWithdrawBridge() {
  const btn = document.getElementById('vibe-btn-withdraw');
  if (!btn) return;
  logWithEmoji('BRIDGE', 'Withdraw card bridge initialized');
  btn.addEventListener('click', () => {
    playClick();
    const amount = document.getElementById('vibe-withdraw-amount')?.value;
    const recipient = document.getElementById('vibe-withdraw-recipient')?.value?.trim();
    logWithEmoji('WITHDRAW', `Bridging withdraw: ${amount} XLM → ${recipient}`);
    const amtInput = document.getElementById('withdraw-amount');
    if (amtInput && amount) { amtInput.value = amount; amtInput.dispatchEvent(new Event('input', { bubbles: true })); }
    const recInput = document.getElementById('withdraw-recipient');
    if (recInput && recipient) { recInput.value = recipient; recInput.dispatchEvent(new Event('input', { bubbles: true })); }
    const tab = document.getElementById('tab-withdraw');
    if (tab) tab.click();
    setTimeout(() => {
      const wBtn = document.getElementById('btn-withdraw');
      if (wBtn && !wBtn.disabled) {
        logWithEmoji('WITHDRAW', 'Clicking withdraw button in advanced panel');
        wBtn.click();
      }
    }, 400);
  });
}

/* ═══════════════════════════════════════════════
   DASHBOARD SYNC
   ═══════════════════════════════════════════════ */

function initDashboardSync() {
  const netName = document.getElementById('network-name');
  const dashNet = document.getElementById('dashboard-net-name');
  if (netName && dashNet) {
    const up = () => { dashNet.textContent = netName.textContent; };
    up();
    new MutationObserver(up).observe(netName, { childList: true, characterData: true, subtree: true });
  }

  const noteTbody = document.getElementById('notes-tbody');
  const noteCount = document.getElementById('dashboard-note-count');
  if (noteTbody && noteCount) {
    const up = () => { noteCount.textContent = noteTbody.querySelectorAll('tr.note-row').length; };
    up();
    new MutationObserver(up).observe(noteTbody, { childList: true, subtree: true });
  }

  const poolInd = document.getElementById('pool-indicator');
  const dashAsp = document.getElementById('dashboard-asp-status');
  if (poolInd && dashAsp) {
    const up = () => {
      const c = poolInd.className.includes('emerald') ? 'bg-emerald-500' : poolInd.className.includes('red') ? 'bg-red-500' : 'bg-dark-500';
      dashAsp.className = `w-2 h-2 ${c} rounded-full`;
    };
    up();
    new MutationObserver(up).observe(poolInd, { attributes: true, attributeFilter: ['class'] });
  }

  const poolLevels = document.getElementById('pool-levels');
  const dashLevels = document.getElementById('dashboard-pool-levels');
  if (poolLevels && dashLevels) {
    const up = () => { dashLevels.textContent = poolLevels.textContent; };
    up();
    new MutationObserver(up).observe(poolLevels, { childList: true, characterData: true, subtree: true });
  }

  const shieldedBal = document.getElementById('shielded-balance');
  const notesBody = document.getElementById('notes-tbody');
  if (shieldedBal && notesBody) {
    const up = () => {
      let total = 0;
      for (const row of notesBody.querySelectorAll('tr.note-row')) {
        if (row.getAttribute('data-status') !== 'spent') {
          const v = parseFloat(row.querySelector('.note-amount')?.textContent) || 0;
          total += v;
        }
      }
      shieldedBal.textContent = total.toFixed(2);
    };
    up();
    new MutationObserver(up).observe(notesBody, { childList: true, subtree: true, characterData: true });
  }
}

/* ═══════════════════════════════════════════════
   PRIVACY BADGE TOOLTIP
   ═══════════════════════════════════════════════ */

function initPrivacyTooltips() {
  document.querySelectorAll('[data-privacy-tip]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      const tip = document.createElement('div');
      tip.className = 'privacy-tooltip';
      tip.textContent = el.getAttribute('data-privacy-tip');
      tip.style.cssText = `
        position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%);
        background:#120822; border:1px solid rgba(0,240,255,0.2); border-radius:8px;
        padding:6px 10px; font-size:11px; color:#94a3b8; white-space:nowrap;
        box-shadow:0 4px 20px rgba(0,0,0,0.5); z-index:100;
        pointer-events:none;
      `;
      if (el.classList.contains('privacy-wrapper')) {
        el.style.position = 'relative';
        el.appendChild(tip);
      }
    });
    el.addEventListener('mouseleave', () => {
      const tip = el.querySelector('.privacy-tooltip');
      if (tip) tip.remove();
    });
  });
}

/* ═══════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  logWithEmoji('INIT', '🚀 Shielded Vibes enhancement layer starting...');
  logWithEmoji('INIT', `User agent: ${navigator.userAgent.slice(0, 80)}`);

  // Warn if running on a low-end CPU (4 or fewer logical cores)
  const cpuCores = navigator.hardwareConcurrency;
  if (cpuCores && cpuCores <= 4) {
    console.warn(`[Shielded Vibes] Low-end CPU detected: ${cpuCores} logical cores. ZK proof generation may take 60-120 seconds on your device.`);
    logWithEmoji('INIT', `⚠ Low-end CPU (${cpuCores} cores) — proof generation may be slow`);
  }

  initParticles();
  seedMockActivity();
  initQuickAmounts();
  initDepositSlider();
  initDepositBridge();
  initSendBridge();
  initWithdrawBridge();
  initToastObserver();
  initDashboardSync();
  initPrivacyTooltips();
  initTestnetBanner();

  logWithEmoji('INIT', '✅ All systems initialized — ready for demo!');
  logWithEmoji('INIT', '💡 Tip: Connect Freighter wallet to begin');
});
