# Shielded Vibes — Demo Video Script (60 seconds)

> Record your screen + microphone. Open `http://localhost:8000` in Chrome with the Freighter extension (testnet).

---

## Scene 1: Landing Page (0:00–0:10)

| Time | Visual | Audio |
|------|--------|-------|
| 0:00 | Full browser window showing hero: glowing "Shielded Vibes" logo, particle background, big "Connect Freighter" button, 3 vibe cards below | *"Welcome to Shielded Vibes — private payments on Stellar with zero-knowledge proofs."* |
| 0:05 | Point cursor at the **"🧪 Testnet Mode"** banner | *"We're running on testnet — no real funds at risk."* |
| 0:08 | Hover over the **"Privacy Powered by ZK"** badge in the footer to show tooltip | *"Every transaction is shielded by Groth16 ZK proofs."* |

---

## Scene 2: Connect Wallet (0:10–0:18)

| Time | Visual | Audio |
|------|--------|-------|
| 0:10 | Click **Connect Freighter** | *"One click to connect our Freighter wallet."* |
| 0:12 | Freighter popup → approve | *"Approve the connection in the extension."* |
| 0:15 | Dashboard populates: Shielded Balance, Notes count, ASP status | *"The dashboard instantly shows our shielded balance, derived from private notes."* |
| 0:18 | Point to **Console** (F12) showing `👛 [WALLET]` log | *"You can follow every step in the console — logs are emoji-coded for clarity."* |

---

## Scene 3: Deposit (0:18–0:28)

| Time | Visual | Audio |
|------|--------|-------|
| 0:18 | Mouse over the **Deposit** vibe card (left) | *"Let's make a deposit. The quick-action card has a slider and presets."* |
| 0:20 | Drag the slider to **100** (or tap the "100" quick-amount button) | *"I'll set 100 XLM."* |
| 0:22 | Click **"Shield Deposit"** | *"Hit 'Shield Deposit' — the system generates a ZK proof."* |
| 0:24 | Watch the Advanced Controls tab switch to **Deposit** panel | *"It bridges to the advanced deposit panel automatically."* |
| 0:26 | Toast notification appears → **confetti fires + chime sounds** | *"Proof verified on-chain! Confetti and a success chime celebrate."* |
| 0:28 | Activity feed shows new **↓ Deposit 100 XLM** entry | *"The activity feed captures every shielded transaction."* |

---

## Scene 4: Send Shielded Vibes (0:28–0:42)

| Time | Visual | Audio |
|------|--------|-------|
| 0:28 | Click into the **Send Shielded Vibes** card (center) | *"Now for the fun part — sending shielded vibes."* |
| 0:30 | Type a recipient address: `G...` | *"Enter a Stellar address."* |
| 0:33 | Type **25** in the amount field | *"Set the amount — 25 XLM."* |
| 0:35 | Type **"meet at the nebula 🌌"** in the **Vibe Note** field | *"Add an optional encrypted message. This 'Vibe Note' gets AES-GCM encrypted before sending."* |
| 0:37 | Click **"Shield & Send"** | *"Shield & Send — the proof hides the amount AND the recipient."* |
| 0:39 | Advanced tab switches to **Transfer**, keys auto-filled from address book (or hint shown) | *"The system looks up recipient keys from the address book."* |
| 0:41 | Toast → confetti → feed entry with **🔒 vibe: meet at the nebula 🌌** | *"The vibe note shows in the activity feed with a lock icon."* |

---

## Scene 5: Activity Feed (0:42–0:50)

| Time | Visual | Audio |
|------|--------|-------|
| 0:42 | Scroll the **Shielded Activity Feed** section | *"The Shielded Activity Feed shows all events with glowing borders."* |
| 0:44 | Point to a **mock entry** with a vibe note badge | *"Mock entries demonstrate the timeline view. Real entries appear instantly."* |
| 0:46 | Point to the **Live** indicator (pulsing dot) | *"The 'Live' indicator pulses when new events arrive."* |
| 0:48 | Point to the **event count** | *"The count updates in real-time."* |

---

## Scene 6: Withdraw (0:50–0:58)

| Time | Visual | Audio |
|------|--------|-------|
| 0:50 | Click into the **Withdraw** card (right) | *"Finally, a withdrawal."* |
| 0:52 | Type **50** in amount, `G...` in recipient | *"Set amount and destination."* |
| 0:54 | Click **"Shield Withdraw"** | *"Shield Withdraw generates a proof of note ownership."* |
| 0:56 | Toast → confetti → feed entry | *"Proceeds arrive privately — proof stays on-chain."* |

---

## Scene 7: Closing (0:58–1:00)

| Time | Visual | Audio |
|------|--------|-------|
| 0:58 | Full window with dashboard, cards, feed | *"Shielded Vibes — private payments. Real vibes. Powered by ZK on Stellar."* |
| 1:00 | Fade out or show "Thank You" | *"Thank you!"* |

---

## Manual Notes for Recording

| Aspect | Detail |
|--------|--------|
| **Screen resolution** | 1920×1080 or 2560×1440 (scaled to 150% in OBS if needed) |
| **Browser** | Chrome (Freighter extension pre-installed, testnet configured) |
| **Audio** | Clear microphone, no background noise |
| **Cursor** | Use cursor highlight/zoom effect when clicking |
| **Console** | Open DevTools console (F12) in a separate window or docked right — show the `[🚀]`, `[👛]`, `[⬇️]`, `[↗️]`, `[🎉]` logs |
| **Lighting** | Dim room to make the neon UI pop on video |
| **Editing** | Add subtle zoom on the confetti burst for effect |
| **Length** | Aim for 55–65 seconds total |

## Pre-recording Checklist

- [ ] `trunk build --release` passes without errors
- [ ] `make serve` runs without errors
- [ ] Browser loads `http://localhost:8000`
- [ ] Freighter extension installed on testnet
- [ ] Freighter has test XLM (use Stellar testnet friendbot)
- [ ] Console panel open and visible
- [ ] No cached old version (clear Application → Clear storage)
- [ ] Recording software configured (OBS, Loom, or QuickTime)
- [ ] Test run once to verify timing
