const extensionName = 'cozy-cat-for-ST';

// ===== RP Epoch (fixed story start) =====
const RP_BASE_YEAR = 2000; // internal baseline year for Date math
const RP_EPOCH = { m: 12, d: 31, hh: 23, mm: 45, baseAgeDays: 63 }; // 31 Dec 23:45, 9 weeks

function cozyConfirmReset() {
  return new Promise((resolve) => {
    const existing = document.getElementById('cozycat-confirm');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.id = 'cozycat-confirm';
    wrap.className = 'cozycat-confirm-backdrop';

    wrap.innerHTML = `
      <div class="cozycat-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="cozycat-confirm-title">
        <div class="cozycat-confirm-title" id="cozycat-confirm-title">Reset Cozy Cat?</div>
        <div class="cozycat-confirm-text">
          This will clear metadata of the Kitten for this chat.
          
        </div>
        <div class="cozycat-confirm-actions">
          <button type="button" class="cozycat-confirm-btn" data-act="cancel">Cancel</button>
          <button type="button" class="cozycat-confirm-btn danger" data-act="ok">Reset</button>
        </div>
      </div>
    `;

    function close(val) {
      wrap.remove();
      resolve(val);
    }

    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) close(false);
    });

    wrap.querySelector('[data-act="cancel"]').addEventListener('click', () => close(false));
    wrap.querySelector('[data-act="ok"]').addEventListener('click', () => close(true));

    document.body.appendChild(wrap);
  });
}

function loadSettings() {
  $('.cozy-cat-settings').remove();

  const enabledKey = `${extensionName}:enabled`;
  const mobileKey = `${extensionName}:mobileMode`; // Key สำหรับโหมดมือถือ

  const enabled = localStorage.getItem(enabledKey) === 'true';
  const mobileMode = localStorage.getItem(mobileKey) === 'true';

  const settingsHtml = `
    <div class="cozy-cat-settings">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>Cozy Cat for ST</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>

        <div class="inline-drawer-content">
          <div class="styled_description_block" style="text-align:center;">
            <small>
              Created by <a href="https://bio.site/deMors" target="_blank" rel="noopener noreferrer">Mors</a>
              with help of POPKO<br>
              Hopefully, you guys enjoy it. Have fun:)
            </small>
          </div>

          <hr>

          <div class="toggle-and-lower-area">
            
            <div class="cozycat-settings-row" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
              <label class="checkbox_label" for="${extensionName}-enabled" style="margin:0;">
                <input id="${extensionName}-enabled" type="checkbox" ${enabled ? 'checked' : ''}>
                <span>Enable Cozy Cat</span>
              </label>

              <button type="button" class="cozycatResetBtn" id="cozycatResetBtn"
                style="width:auto;min-width:0;padding:6px 10px;font-size:12px;line-height:1;border-radius:8px;">
                Reset Data
              </button>
            </div>

            <div class="cozycat-settings-row" style="display:flex;align-items:center;margin-bottom:8px;">
              <label class="checkbox_label" for="${extensionName}-mobile" style="margin:0;">
                <input id="${extensionName}-mobile" type="checkbox" ${mobileMode ? 'checked' : ''}>
                <span>Mobile Layout (Bottom-Left)</span>
              </label>
            </div>

            <div style="text-align:center;color:#aaa;padding:12px 0 0;">
              <div style="opacity:.7;font-size:12px;margin-top:6px;line-height:1.3;">
                This Extension is for my character, "Your Pet Cat." <br>
                Use "Mobile Layout" if the paw button disappears off-screen on phones.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  $('#extensions_settings').append(settingsHtml);

  const $root = $('.cozy-cat-settings');

  // Logic ปุ่ม Enable
  $root.find(`#${extensionName}-enabled`).on('change', function () {
    const isEnabled = this.checked;
    localStorage.setItem(enabledKey, String(isEnabled));
    applyEnabledState(isEnabled);
  });

  // Logic ปุ่ม Mobile Mode
  $root.find(`#${extensionName}-mobile`).on('change', function () {
    const isMobile = this.checked;
    localStorage.setItem(mobileKey, String(isMobile));
    
    // บังคับย้ายตำแหน่งปุ่มทันที
    const btn = document.getElementById('cozycat-paw-btn');
    if (btn) {
        // ล้างค่าตำแหน่งเดิมที่บันทึกไว้เพื่อป้องกันการตีกัน
        localStorage.removeItem(`${extensionName}:pawPos`);
        
        if (isMobile) {
            // โหมดมือถือ: ย้ายไปซ้ายล่าง
            btn.style.left = '16px';
            btn.style.bottom = '16px';
            btn.style.right = 'auto';
            btn.style.top = 'auto';
        } else {
            // โหมดปกติ: กลับมาขวาล่าง
            btn.style.left = 'auto';
            btn.style.bottom = '16px';
            btn.style.right = '16px';
            btn.style.top = 'auto';
        }
    }
  });

  // Logic ปุ่ม Reset
  const $resetBtn = $root.find('#cozycatResetBtn');
  if ($resetBtn.length) {
    $resetBtn.on('click', async () => {
      const ok = await cozyConfirmReset();
      if (!ok) return;
      await resetCozyCatForThisChat();
    });
  }

  $root.find('.inline-drawer-toggle').on('click', function () {
    $(this).toggleClass('open');
    $root.find('.inline-drawer-icon').toggleClass('down up');
    $root.find('.inline-drawer-content').toggleClass('open');
  });

  // ===== Overlay IDs / storage keys =====
  const pawBtnId = 'cozycat-paw-btn';
  const overlayId = 'cozycat-overlay';
  const pawPosKey = `${extensionName}:pawPos`;

  let escHandler = null;

  // ===== Screen Router State =====
  const SCREENS = {
    home: 'home',
    card: 'card',
    status: 'status',
    music: 'music',
  };

  let currentScreen = SCREENS.home;

  // ... (ส่วน Logic State, Chat, etc. ยังคงเดิม) ...
  // เพื่อความสมบูรณ์ของโค้ด ผมจะใส่ฟังก์ชันที่จำเป็นทั้งหมดลงไป

  // ===== CozyCat State / Storage =====
  const CAT_STATE_KEY = `${extensionName}:catState:v1`;
  const CAT_META_KEY = `${extensionName}:catState`;

  function defaultCatState() {
    const s = {
      profile: {
        name: '—',
        age: '—',
        type: '—',
        sex: '—',
        urlcat: 'https://i.postimg.cc/4yQghhGj/none.png',
        spirit: '—',
        social: '—',
        vocal: '—',
        crime: '—',
        lifestyle: '—',
        HEALTH: 'Healthy',
      },
      rp: {
        start: null,
        current: null,
        baseAgeDays: 63,
        ageDays: 63,
      },
      status: {
        hunger: 10,
        happiness: 15,
        hygiene: 25,
        energy: 10,
      },
      health: {
        injured: false,
      },
    };
    try { ensureDerivedHealth(s); } catch {}
    return s;
  }

  function mergeCatState(raw) {
    const def = defaultCatState();
    const parsed = raw && typeof raw === 'object' ? raw : {};
    const merged = {
      ...def,
      ...parsed,
      profile: { ...def.profile, ...(parsed.profile || {}) },
      status: { ...def.status, ...(parsed.status || {}) },
      health: { ...def.health, ...(parsed.health || {}) },
      rp: { ...def.rp, ...(parsed.rp || {}) },
    };
    try { ensureDerivedHealth(merged); } catch {}
    return merged;
  }

  function getCtx() {
    return (typeof SillyTavern !== 'undefined' && SillyTavern?.getContext) ? SillyTavern.getContext() : null;
  }

  function loadCatState() {
    const ctx = getCtx();
    const meta = ctx?.chatMetadata;
    const metaVal = meta ? meta[CAT_META_KEY] : null;
    if (metaVal && metaVal._reset === true) {
      return defaultCatState();
    }
    if (metaVal) {
      const s = mergeCatState(metaVal);
      const ageDays = (s.rp?.ageDays ?? s.rp?.baseAgeDays ?? 63);
      s.profile.age = formatAgeMonthsDays(ageDays);
      return s;
    }
    try {
      const raw = localStorage.getItem(CAT_STATE_KEY);
      if (!raw) return defaultCatState();
      return mergeCatState(JSON.parse(raw));
    } catch {
      return defaultCatState();
    }
  }

  async function saveCatState(state) {
    const ctx = getCtx();
    if (ctx?.chatMetadata && typeof ctx.saveMetadata === 'function') {
      ctx.chatMetadata[CAT_META_KEY] = state;
      try { await ctx.saveMetadata(); } catch (e) { console.warn('saveMetadata failed', e); }
    }
    try { localStorage.setItem(CAT_STATE_KEY, JSON.stringify(state)); } catch {}
  }

  // ... (Helpers: JSON Extractors) ...
  function extractCozyCatData(text) {
    if (!text) return null;
    const m = text.match(//i);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return null; }
  }
  function extractCozyCatStatus(text) {
    if (!text) return null;
    const m = text.match(//i);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return null; }
  }
  function extractCozyCatName(text) {
    if (!text) return null;
    const m = text.match(//i);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return null; }
  }

  function clamp01(v) {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }

  function clampStatusDelta(delta, maxAbs = 50) {
    const result = {};
    const keys = ['hunger', 'happiness', 'hygiene', 'energy'];
    for (const k of keys) {
      let v = 0;
      if (delta && Object.prototype.hasOwnProperty.call(delta, k)) {
        const n = Number(delta[k]);
        if (Number.isFinite(n)) v = n;
      }
      if (v > maxAbs) v = maxAbs;
      if (v < -maxAbs) v = -maxAbs;
      result[k] = v;
    }
    return result;
  }

  function applyStatusDelta(state, delta) {
    if (!state.status) state.status = { hunger: 50, happiness: 50, hygiene: 50, energy: 50 };
    const d = delta || {};
    state.status.hunger = clamp01((state.status.hunger ?? 50) + (Number(d.hunger) || 0));
    state.status.happiness = clamp01((state.status.happiness ?? 50) + (Number(d.happiness) || 0));
    state.status.hygiene = clamp01((state.status.hygiene ?? 50) + (Number(d.hygiene) || 0));
    state.status.energy = clamp01((state.status.energy ?? 50) + (Number(d.energy) || 0));
  }

  // ... (Date/Time Parsing) ...
  function parseRpDateFromCalendarHtml(html) {
    if (!html) return null;
    html = decodeHtmlEntities(html);
    const monthMap = { JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6, JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12 };
    
    const moEls = [...String(html).matchAll(/<[^>]+class=(["'])[^"']*\bc-mo\b[^"']*\1[^>]*>([\s\S]*?)<\//gi)];
    const ddEls = [...String(html).matchAll(/<[^>]+class=(["'])[^"']*\bc-dd\b[^"']*\1[^>]*>\s*(\d{1,2})\s*<\//gi)];
    const tmEls = [...String(html).matchAll(/<[^>]+class=(["'])[^"']*\bc-tm\b[^"']*\1[^>]*>\s*([0-2]?\d:[0-5]\d)\s*<\//gi)];

    if (moEls.length && ddEls.length) {
      const moEl = moEls[moEls.length - 1];
      const ddEl = ddEls[ddEls.length - 1];
      const moText = String(moEl[2]).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const moParts = moText.match(/([A-Za-z]+)\s*(?:•|&bull;|\u2022)\s*(\d{4})?/i);
      const m = monthMap[String(moParts?.[1] || '').toUpperCase()];
      const y = moParts?.[2] ? Number(moParts[2]) : undefined;
      const day = Number(ddEl[2]);
      let hh, mm;
      if (tmEls.length) {
        const t = tmEls[tmEls.length - 1][2];
        const [hStr, mStr] = t.split(':');
        const hNum = Number(hStr), mNum = Number(mStr);
        if (Number.isFinite(hNum) && Number.isFinite(mNum)) { hh = hNum; mm = mNum; }
      }
      if (m && Number.isFinite(day)) {
        const out = { m, d: day };
        if (Number.isFinite(y)) out.y = y;
        if (Number.isFinite(hh) && Number.isFinite(mm)) { out.hh = hh; out.mm = mm; }
        return out;
      }
    }
    // Legacy calendar support
    const blocks = extractCalendarBlocksFromHtml(html);
    const candidates = blocks.length ? blocks : [html];
    let last = null;
    for (const chunk of candidates) {
      const months = [...String(chunk).matchAll(/class=(["'])cal-title\1\s*>\s*([A-Za-z]+)\s*</gi)].map(x => x[2]);
      const days = [...String(chunk).matchAll(/class=(["'])cal-date\1[^>]*>\s*<b>\s*(\d{1,2})\s*<\/b>/gi)].map(x => x[2]);
      if (!months.length || !days.length) continue;
      const m = monthMap[String(months[months.length - 1]).toUpperCase()];
      const d = Number(days[days.length - 1]);
      if (!m || !Number.isFinite(d)) continue;
      last = { m, d };
    }
    return last;
  }

  function parseRpTimeFromCalendarHtml(html) {
    if (!html) return null;
    html = decodeHtmlEntities(html);
    const mNew = html.match(/class=(["'])c-tm\1[^>]*>\s*([0-2]?\d):([0-5]\d)\s*</i);
    if (mNew) {
      const hh = Number(mNew[2]); const mm = Number(mNew[3]);
      if (Number.isFinite(hh) && Number.isFinite(mm) && hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) return { hh, mm };
    }
    const m = html.match(/>\s*(\d{1,2}):(\d{2})\s*(?:•|&bull;|\u2022)/i) || html.match(/>\s*(\d{1,2}):(\d{2})\s*</i);
    if (!m) return null;
    const hh = Number(m[1]); const mm = Number(m[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return { hh, mm };
  }

  function decodeHtmlEntities(s) {
    if (!s || typeof s !== 'string') return s;
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  }

  function extractCalendarBlocksFromHtml(html) {
    if (!html) return [];
    const blocks = [];
    const reBlock = /<div\s+class=(["'])cal-wrap\1[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;
    let m;
    while ((m = reBlock.exec(html)) !== null) blocks.push(m[0]);
    return blocks;
  }

  function findLatestRpDateTimeInChat(chatArr) {
    if (!Array.isArray(chatArr)) return null;
    for (let i = chatArr.length - 1; i >= 0; i--) {
      const mes = decodeHtmlEntities(chatArr[i]?.mes ?? '');
      const d = parseRpDateFromCalendarHtml(mes);
      if (!d) continue;
      const t = parseRpTimeFromCalendarHtml(mes) || { hh: 0, mm: 0 };
      return { ...d, ...t };
    }
    return null;
  }

  function inferEpochNarrativeYear(latest) {
    if (!latest || typeof latest.y !== 'number') return null;
    if (latest.m < 12 || (latest.m === 12 && latest.d < 31)) return latest.y - 1;
    return latest.y;
  }

  function mapNarrativeYearToBase(narrativeYear, epochNarrativeYear) {
    if (typeof narrativeYear !== 'number' || typeof epochNarrativeYear !== 'number') return RP_BASE_YEAR;
    return RP_BASE_YEAR + (narrativeYear - epochNarrativeYear);
  }

  function ymdhmToEpochMinutes(ymdhm) {
    const dt = new Date(ymdhm.y, ymdhm.m - 1, ymdhm.d, ymdhm.hh || 0, ymdhm.mm || 0, 0, 0);
    return Math.floor(dt.getTime() / 60000);
  }

  function isGoodCareBeforeTimeskip(state) {
    const st = state?.status || {};
    const h = computeHealthBaseStateFromStatus(st);
    const avg = (Number(st.hunger ?? 50) + Number(st.happiness ?? 50) + Number(st.hygiene ?? 50) + Number(st.energy ?? 50)) / 4;
    return (h.base === 'Healthy' && h.value >= 55) || avg >= 60;
  }

  function applyTimeskipReset(state) {
    state.status = state.status || {};
    const good = isGoodCareBeforeTimeskip(state);
    const floors = good
      ? { hunger: 70, energy: 65, hygiene: 65, happiness: 60 }
      : { hunger: 55, energy: 50, hygiene: 50, happiness: 45 };
    state.status.hunger = Math.max(floors.hunger, Number(state.status.hunger ?? floors.hunger));
    state.status.energy = Math.max(floors.energy, Number(state.status.energy ?? floors.energy));
    state.status.hygiene = Math.max(floors.hygiene, Number(state.status.hygiene ?? floors.hygiene));
    state.status.happiness = Math.max(floors.happiness, Number(state.status.happiness ?? floors.happiness));
  }

  function applyHalfHourDecay(state, steps) {
    if (!steps || steps <= 0) return;
    state.status = state.status || {};
    const dec = { hunger: -3, energy: -2, hygiene: -1, happiness: -1 };
    const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
    state.status.hunger = clamp((state.status.hunger ?? 50) + dec.hunger * steps);
    state.status.energy = clamp((state.status.energy ?? 50) + dec.energy * steps);
    state.status.hygiene = clamp((state.status.hygiene ?? 50) + dec.hygiene * steps);
    state.status.happiness = clamp((state.status.happiness ?? 50) + dec.happiness * steps);
  }

  function toDateObj(ymd) { return new Date(ymd.y, ymd.m - 1, ymd.d); }
  function diffDays(a, b) {
    const ms = toDateObj(b).getTime() - toDateObj(a).getTime();
    return Math.floor(ms / (24 * 60 * 60 * 1000));
  }
  function formatAgeMonthsDays(ageDays) {
    const days = Math.max(0, Math.floor(Number(ageDays) || 0));
    const months = Math.floor(days / 30);
    const rem = days % 30;
    return `${months} mo. ${rem} d.`;
  }

  async function hydrateAgeFromChat() {
    const ctx = getCtx();
    const chat = ctx?.chat;
    const state = loadCatState();
    const rp = state.rp || (state.rp = defaultCatState().rp);
    if (!rp.baseAgeDays) rp.baseAgeDays = RP_EPOCH.baseAgeDays;
    if (!rp.ageDays) rp.ageDays = rp.baseAgeDays;
    state.profile = state.profile || {};
    if (!state.profile.age || state.profile.age === '—' || state.profile.age === 0 || state.profile.age === '0') {
      state.profile.age = formatAgeMonthsDays(rp.ageDays);
    }
    if (!Array.isArray(chat) || chat.length === 0) {
      await saveCatState(state);
      return false;
    }
    const latest = findLatestRpDateTimeInChat(chat);
    if (!latest) {
      await saveCatState(state);
      return false;
    }
    const didInitStart = !rp.start;
    if (!rp.start) {
      rp.epochNarrativeYear = inferEpochNarrativeYear(latest);
      rp.start = { y: RP_BASE_YEAR, m: RP_EPOCH.m, d: RP_EPOCH.d, hh: RP_EPOCH.hh, mm: RP_EPOCH.mm };
    } else if (!rp.epochNarrativeYear && typeof latest.y === 'number') {
      rp.epochNarrativeYear = inferEpochNarrativeYear(latest);
    }
    const prevCur = rp.current || rp.start;
    let y = (typeof prevCur?.y === 'number') ? prevCur.y : RP_BASE_YEAR;
    if (typeof latest.y === 'number' && typeof rp.epochNarrativeYear === 'number') {
      y = mapNarrativeYearToBase(latest.y, rp.epochNarrativeYear);
    }
    if (!(typeof latest.y === 'number' && typeof rp.epochNarrativeYear === 'number')) {
      if (prevCur && typeof prevCur.m === 'number' && latest.m < prevCur.m && (prevCur.m - latest.m) >= 6) {
        y = (prevCur.y ?? y) + 1;
      }
    }
    const nextCurrent = { y, m: latest.m, d: latest.d, hh: (latest.hh ?? 0), mm: (latest.mm ?? 0) };
    const changedCurrent = !rp.current || rp.current.y !== nextCurrent.y || rp.current.m !== nextCurrent.m || rp.current.d !== nextCurrent.d || (rp.current.hh ?? 0) !== (nextCurrent.hh ?? 0) || (rp.current.mm ?? 0) !== (nextCurrent.mm ?? 0);
    const prevEpoch = (typeof rp.lastDecayEpochMin === 'number') ? rp.lastDecayEpochMin : ymdhmToEpochMinutes({ ...(rp.current || nextCurrent), hh: (rp.current?.hh ?? nextCurrent.hh), mm: (rp.current?.mm ?? nextCurrent.mm) });
    const nextEpoch = ymdhmToEpochMinutes(nextCurrent);

    if (nextEpoch > prevEpoch) {
      const prevDay = rp.current ? { y: rp.current.y, m: rp.current.m, d: rp.current.d } : { y: nextCurrent.y, m: nextCurrent.m, d: nextCurrent.d };
      const jumpedDays = diffDays(prevDay, { y: nextCurrent.y, m: nextCurrent.m, d: nextCurrent.d });
      const minutesDiff = nextEpoch - prevEpoch;
      if (jumpedDays >= 1 && minutesDiff >= 12 * 60) {
        applyTimeskipReset(state);
        rp.lastDecayEpochMin = nextEpoch;
      } else {
        const steps = Math.floor(minutesDiff / 30);
        if (steps > 0) {
          applyHalfHourDecay(state, steps);
          rp.lastDecayEpochMin = prevEpoch + steps * 30;
        }
      }
    } else if (typeof rp.lastDecayEpochMin !== 'number') {
      rp.lastDecayEpochMin = nextEpoch;
    }
    const deltaDays = diffDays(rp.start, { y: nextCurrent.y, m: nextCurrent.m, d: nextCurrent.d });
    rp.ageDays = (rp.baseAgeDays ?? 63) + Math.max(0, deltaDays);
    state.profile.age = formatAgeMonthsDays(rp.ageDays);
    rp.current = nextCurrent;
    await saveCatState(state);
    return didInitStart || changedCurrent;
  }

  async function rehydrateFromChatHistory() {
    const ctx = getCtx();
    const chat = ctx?.chat;
    if (!Array.isArray(chat) || chat.length === 0) return false;
    const metaVal = ctx?.chatMetadata ? ctx.chatMetadata[CAT_META_KEY] : null;
    if (metaVal && metaVal._reset !== true) {
      const existing = mergeCatState(metaVal);
      if (existing?.profile?.type && existing.profile.type !== '—') return false;
    }
    for (let i = chat.length - 1; i >= 0; i--) {
      const mes = chat[i]?.mes ?? '';
      const data = extractCozyCatData(mes);
      if (!data) continue;
      const state = mergeCatState(metaVal || {});
      state.profile.type = data.type ?? state.profile.type;
      state.profile.sex = data.sex ?? state.profile.sex;
      state.profile.urlcat = data.urlcat ?? state.profile.urlcat;
      state.profile.spirit = data.spirit ?? state.profile.spirit;
      state.profile.social = data.social ?? state.profile.social;
      state.profile.vocal = data.vocal ?? state.profile.vocal;
      state.profile.crime = data.crime ?? state.profile.crime;
      state.profile.lifestyle = data.lifestyle ?? state.profile.lifestyle;
      if (state._reset === true) delete state._reset;
      await saveCatState(state);
      return true;
    }
    return false;
  }

  // ===== Health Logic =====
  const HEALTH_RANK = { Healthy: 0, Weak: 1, Sick: 2, Injured: 3, Critical: 4 };
  function computeHealthValueFromStatus(st) {
    const hunger = Number(st?.hunger ?? 50);
    const happiness = Number(st?.happiness ?? 50);
    const hygiene = Number(st?.hygiene ?? 50);
    const energy = Number(st?.energy ?? 50);
    const v = (hunger * 0.35) + (energy * 0.35) + (hygiene * 0.20) + (happiness * 0.10);
    const minStat = Math.min(hunger, happiness, hygiene, energy);
    return { value: Math.round(v), minStat: Math.round(minStat) };
  }
  function computeHealthBaseStateFromStatus(st) {
    const { value, minStat } = computeHealthValueFromStatus(st);
    if (minStat <= 5) return { base: 'Critical', value };
    if (value < 20) return { base: 'Critical', value };
    if (value < 30) return { base: 'Sick', value };
    if (value < 50) return { base: 'Weak', value };
    return { base: 'Healthy', value };
  }
  function computeHealthShown(health) {
    const base = health?.base || 'Healthy';
    const injured = !!health?.injured;
    if (base === 'Critical') return 'Critical';
    if (injured) return 'Injured';
    return base;
  }
  function ensureDerivedHealth(state) {
    if (!state) return;
    state.status = state.status || { hunger: 50, happiness: 50, hygiene: 50, energy: 50 };
    state.health = state.health || { injured: false };
    const hb = computeHealthBaseStateFromStatus(state.status);
    state.health.base = hb.base;
    state.health.value = hb.value;
    state.health.shown = computeHealthShown(state.health);
    if (!state.profile) state.profile = {};
    state.profile.HEALTH = state.health.shown;
  }

  // ===== Manual Actions =====
  async function applyManualAction(action) {
    const state = await loadCatState();
    state.status = state.status || { hunger: 50, happiness: 50, hygiene: 50, energy: 50 };
    state.health = state.health || { injured: false };
    let delta = { hunger: 0, happiness: 0, hygiene: 0, energy: 0 };
    if (action === 'rest') {
      delta = { energy: +25, happiness: +5, hunger: -5, hygiene: -1 };
    } else if (action === 'heal') {
      state.health.injured = false;
      delta = { energy: +10, happiness: +8, hygiene: +5, hunger: 0 };
    } else {
      return;
    }
    const s = state.status;
    s.hunger = clampInt(Number(s.hunger ?? 50) + delta.hunger, 0, 100);
    s.happiness = clampInt(Number(s.happiness ?? 50) + delta.happiness, 0, 100);
    s.hygiene = clampInt(Number(s.hygiene ?? 50) + delta.hygiene, 0, 100);
    s.energy = clampInt(Number(s.energy ?? 50) + delta.energy, 0, 100);
    ensureDerivedHealth(state);
    await saveCatState(state);
    refreshIfOverlayOpen();
  }

  function clampInt(v, min = 0, max = 100) {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  // ===== Render Templates =====
  function renderTemplate(html, state) {
    const map = {
      name: state.profile.name,
      age: state.profile.age,
      type: state.profile.type,
      sex: state.profile.sex,
      urlcat: state.profile.urlcat,
      spirit: state.profile.spirit,
      social: state.profile.social,
      vocal: state.profile.vocal,
      crime: state.profile.crime,
      lifestyle: state.profile.lifestyle,
      HEALTH: (state.health && state.health.shown) ? state.health.shown : (state.profile.HEALTH ?? 'Healthy'),
      hunger: state.status?.hunger ?? 50,
      happiness: state.status?.happiness ?? 50,
      hygiene: state.status?.hygiene ?? 50,
      energy: state.status?.energy ?? 50,
    };
    return html.replace(/\{\{(\w+)\}\}/g, (_, k) => {
      const v = map[k];
      return (v === undefined || v === null) ? '—' : String(v);
    });
  }

  function applyCatImages(rootEl, state) {
    if (!rootEl) return;
    const url = state.profile.urlcat || 'https://i.postimg.cc/4yQghhGj/none.png';
    rootEl.querySelectorAll('.cozycat-card-img, .cozycat-status-avatar, .cozycat-music-cover')
      .forEach((img) => img.setAttribute('src', url));
  }

  function isOverlayOpen() {
    const el = document.getElementById(overlayId);
    if (!el) return false;
    return el.style.display !== 'none' && el.style.display !== '';
  }

  function refreshIfOverlayOpen() {
    if (!isOverlayOpen()) return;
    renderScreen(currentScreen);
  }

  function attachChatHooks() {
    const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern?.getContext) ? SillyTavern.getContext() : null;
    if (!ctx?.eventSource || !ctx?.event_types) return;
    const { eventSource, event_types } = ctx;
    if (window.__cozycat_hooks_attached) return;
    window.__cozycat_hooks_attached = true;

    eventSource.on(event_types.MESSAGE_RECEIVED, async () => {
      const last = ctx.chat?.[ctx.chat.length - 1];
      const mes = last?.mes ?? '';
      const data = extractCozyCatData(mes);
      if (data) {
        const state = loadCatState();
        state.profile.type = data.type ?? state.profile.type;
        state.profile.sex = data.sex ?? state.profile.sex;
        state.profile.urlcat = data.urlcat ?? state.profile.urlcat;
        state.profile.spirit = data.spirit ?? state.profile.spirit;
        state.profile.social = data.social ?? state.profile.social;
        state.profile.vocal = data.vocal ?? state.profile.vocal;
        state.profile.crime = data.crime ?? state.profile.crime;
        state.profile.lifestyle = data.lifestyle ?? state.profile.lifestyle;
        await saveCatState(state);
      }
      await hydrateAgeFromChat();
      const stPayload = extractCozyCatStatus(mes);
      if (stPayload && stPayload.delta) {
        const state = loadCatState();
        const before = JSON.stringify({ status: state.status, health: state.health });
        const safeDelta = clampStatusDelta(stPayload.delta);
        applyStatusDelta(state, safeDelta);
        state.health = state.health || { base: 'Healthy', injured: false };
        if (stPayload.injured_event === true) state.health.injured = true;
        if (stPayload.injury_resolved === true) state.health.injured = false;
        const hb = computeHealthBaseStateFromStatus(state.status);
        state.health.base = hb.base;
        state.health.value = hb.value;
        state.health.shown = computeHealthShown(state.health);
        const after = JSON.stringify({ status: state.status, health: state.health });
        if (before !== after) await saveCatState(state);
      }
      const namePayload = extractCozyCatName(mes);
      if (namePayload && namePayload.name) {
        const stateName = loadCatState();
        stateName.profile.name = String(namePayload.name);
        await saveCatState(stateName);
      }
      refreshIfOverlayOpen();
    });

    if (event_types.MESSAGE_SENT) {
      eventSource.on(event_types.MESSAGE_SENT, async () => {
        await hydrateAgeFromChat();
        refreshIfOverlayOpen();
      });
    }

    if (event_types.CHAT_CHANGED) {
      eventSource.on(event_types.CHAT_CHANGED, () => {
        Promise.all([rehydrateFromChatHistory(), hydrateAgeFromChat()]).then((results) => {
          if (results.some(Boolean)) refreshIfOverlayOpen();
        });
      });
    }
    if (event_types.CHAT_LOADED) {
      eventSource.on(event_types.CHAT_LOADED, () => {
        Promise.all([rehydrateFromChatHistory(), hydrateAgeFromChat()]).then((results) => {
          if (results.some(Boolean)) refreshIfOverlayOpen();
        });
      });
    }
  }

  // ===== Music =====
  const MUSIC_SRC_DEFAULT = 'https://od.lk/s/ODdfNDIxNjM0ODlf/2am.mp3';
  let cozyMusic = { audio: null, ui: null };
  function ensureMusicAudio() {
    if (cozyMusic.audio) return cozyMusic.audio;
    const a = document.createElement('audio');
    a.id = `${extensionName}-audio`;
    a.src = MUSIC_SRC_DEFAULT;
    a.loop = true;
    a.preload = 'auto';
    a.addEventListener('timeupdate', () => updateMusicUIFromAudio());
    a.addEventListener('loadedmetadata', () => updateMusicUIFromAudio());
    a.addEventListener('play', () => updateMusicUIPlayState(true));
    a.addEventListener('pause', () => updateMusicUIPlayState(false));
    document.body.appendChild(a);
    cozyMusic.audio = a;
    return a;
  }
  function teardownMusicAudio() {
    const a = cozyMusic.audio;
    cozyMusic.ui = null;
    if (!a) return;
    try { a.pause(); } catch {}
    a.src = '';
    a.remove();
    cozyMusic.audio = null;
  }
  function formatTime(seconds) {
    const s = Number(seconds);
    if (!Number.isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r < 10 ? '0' : ''}${r}`;
  }
  function updateMusicUIFromAudio() {
    const audio = cozyMusic.audio;
    const ui = cozyMusic.ui;
    if (!audio || !ui) return;
    const d = audio.duration;
    const t = audio.currentTime;
    ui.currentTimeEl.textContent = formatTime(t);
    ui.durationEl.textContent = Number.isFinite(d) ? formatTime(d) : '0:00';
    if (Number.isFinite(d) && d > 0) ui.progress.value = String((t / d) * 100);
  }
  function updateMusicUIPlayState(isPlaying) {
    const ui = cozyMusic.ui;
    if (!ui) return;
    ui.playIcon.style.display = isPlaying ? 'none' : 'block';
    ui.pauseIcon.style.display = isPlaying ? 'block' : 'none';
    ui.vinyl.classList.toggle('paused-animation', !isPlaying);
    ui.stylus.classList.toggle('playing', isPlaying);
  }
  function connectMusicUI(rootEl) {
    const audio = ensureMusicAudio();
    const ui = {
      playBtn: rootEl.querySelector('#cozycatPlayBtn'),
      playIcon: rootEl.querySelector('#cozycatPlayIcon'),
      pauseIcon: rootEl.querySelector('#cozycatPauseIcon'),
      progress: rootEl.querySelector('#cozycatProgress'),
      currentTimeEl: rootEl.querySelector('#cozycatCurrentTime'),
      durationEl: rootEl.querySelector('#cozycatDuration'),
      vinyl: rootEl.querySelector('#cozycatVinyl'),
      stylus: rootEl.querySelector('#cozycatStylus'),
    };
    if (!ui.playBtn || !ui.progress) return;
    cozyMusic.ui = ui;
    ui.playBtn.addEventListener('click', async () => {
      if (audio.paused) { try { await audio.play(); } catch {} } else { audio.pause(); }
    });
    ui.progress.addEventListener('input', () => {
      if (!Number.isFinite(audio.duration)) return;
      audio.currentTime = (Number(ui.progress.value) / 100) * audio.duration;
    });
    updateMusicUIFromAudio();
    updateMusicUIPlayState(!audio.paused);
  }

  // ===== Overlay System =====
  function mountOverlay() {
    if (document.getElementById(overlayId)) return;
    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.className = 'cozycat-overlay';
    overlay.setAttribute('data-cozycat', 'overlay');
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hideOverlay();
    });
    overlay.innerHTML = `
      <div class="cozycat-screen" role="dialog" aria-modal="true">
        <div class="cozycat-screen-inner"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    escHandler = (e) => { if (e.key === 'Escape') hideOverlay(); };
    document.addEventListener('keydown', escHandler);
    hydrateAgeFromChat().finally(() => renderScreen(SCREENS.home));
  }
  function showOverlay() {
    mountOverlay();
    const el = document.getElementById(overlayId);
    if (el) el.style.display = 'flex';
    Promise.all([rehydrateFromChatHistory(), hydrateAgeFromChat()]).then(([rehydrated]) => {
      if (rehydrated) refreshIfOverlayOpen();
      else renderScreen(currentScreen);
    });
  }
  function hideOverlay() {
    const el = document.getElementById(overlayId);
    if (el) el.style.display = 'none';
  }
  function toggleOverlay() {
    const el = document.getElementById(overlayId);
    if (!el || el.style.display === 'none' || el.style.display === '') showOverlay();
    else hideOverlay();
  }
  function unmountOverlay() {
    hideOverlay();
    const el = document.getElementById(overlayId);
    if (el) el.remove();
    if (escHandler) {
      document.removeEventListener('keydown', escHandler);
      escHandler = null;
    }
  }

  // ===== Render Helpers =====
  function getInnerRoot() {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return null;
    return overlay.querySelector('.cozycat-screen-inner');
  }
  function templateHome() {
    return `
      <div class="cozycat-home">
        <div class="cozycat-header-small">MORS'S COLLECTION</div>
        <div class="cozycat-title" aria-label="Your Pet Cat">
          <span class="cozycat-title-italic">Your</span><br>
          <span class="cozycat-title-indent cozycat-title-normal">Pet</span><br>
          <span class="cozycat-title-italic">Cat.</span>
        </div>
        <div class="cozycat-title-rule"></div>
        <div class="cozycat-watermark">FELINE</div>
        <div class="cozycat-menu">
          <button class="cozycat-menu-item" type="button" data-go="${SCREENS.card}">
            <div class="cozycat-menu-row">
              <span class="cozycat-menu-num">01</span>
              <span class="cozycat-menu-label">Check Pet Card</span>
            </div>
          </button>
          <button class="cozycat-menu-item" type="button" data-go="${SCREENS.status}">
            <div class="cozycat-menu-row">
              <span class="cozycat-menu-num">02</span>
              <span class="cozycat-menu-label">Check Status</span>
            </div>
          </button>
          <button class="cozycat-menu-item" type="button" data-go="${SCREENS.music}">
            <div class="cozycat-menu-row">
              <span class="cozycat-menu-num">03</span>
              <span class="cozycat-menu-label">Music Player</span>
            </div>
          </button>
        </div>
        <div class="cozycat-footer">have a cozy day...</div>
      </div>
    `;
  }
  function templateBack() {
    return `
      <button class="cozycat-back" type="button" data-back="1" title="Back" aria-label="Back">
        <svg class="cozycat-back-svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span class="cozycat-back-text">Back</span>
      </button>
    `;
  }
  function templateCard() {
    const defaultImg = 'https://i.postimg.cc/4yQghhGj/none.png';
    return `
      <div class="cozycat-card-screen">
        ${templateBack()}
        <div class="cozycat-card-wrap">
          <div class="cozycat-card" tabindex="0" role="button" aria-label="Cat Card (tap to flip)">
            <div class="cozycat-card-front">
              <img src="${defaultImg}" class="cozycat-card-img" alt="Cat">
              <div class="cozycat-card-hint">👆 Flip to Read</div>
            </div>
            <div class="cozycat-card-back">
              <div class="cozycat-card-watermark">CAT</div>
              <div class="cozycat-card-content">
                <div>
                  <div class="cozycat-card-sub">MORS'S KITTEN COLLECTION</div>
                  <div class="cozycat-card-title">Your<br>Soon To Be<br>Master.</div>
                </div>
                <div class="cozycat-card-body">
                  <div class="cozycat-card-stats">
                    <span>TYPE: {{type}}</span>
                    <span>SEX: {{sex}}</span>
                  </div>
                  <div class="cozycat-card-personality">
                    <b class="cozycat-card-personality-label">Personality:</b>
                    <ul class="cozycat-card-list">
                      <li>{{spirit}}</li>
                      <li>{{social}}</li>
                      <li>{{vocal}}</li>
                      <li>{{crime}}</li>
                      <li>{{lifestyle}}</li>
                    </ul>
                  </div>
                </div>
                <div class="cozycat-card-icon">🐾</div>
              </div>
            </div>
          </div>
        </div>
        <div class="cozycat-card-signature" aria-hidden="true">
          <span>your little fur ball...</span>
        </div>
      </div>
    `;
  }
  function templateStatus() {
    const defaultImg = 'https://i.postimg.cc/4yQghhGj/none.png';
    return `
      <div class="cozycat-page-screen cozycat-status-screen">
        ${templateBack()}
        <div class="cozycat-status-profile">
          <div class="cozycat-status-avatar-wrap">
            <img src="${defaultImg}" class="cozycat-status-avatar" alt="Cat">
            <div class="cozycat-status-badge">❤ {{HEALTH}}</div>
          </div>
          <div class="cozycat-status-name">{{name}}</div>
          <div class="cozycat-status-meta">
            <span>AGE: {{age}}</span>
            <span>TYPE: {{type}}</span>
          </div>
        </div>
        <div class="cozycat-status-stats">
          ${statusRow('🥩 Hunger', '{{hunger}}')}
          ${statusRow('🧸 Happiness', '{{happiness}}')}
          ${statusRow('🧼 Hygiene', '{{hygiene}}')}
          ${statusRow('⚡ Energy', '{{energy}}')}
        </div>
        <div class="cozycat-status-footer">dreaming of tuna...</div>
      </div>
    `;
  }
  function statusRow(label, value) {
    return `
      <div class="cozycat-status-row">
        <div class="cozycat-status-row-head">
          <span class="cozycat-status-label">${label}</span>
          <span class="cozycat-status-value">${value}%</span>
        </div>
        <div class="cozycat-status-bar-bg">
          <div class="cozycat-status-bar-fill" style="width:${value}%;"></div>
        </div>
      </div>
    `;
  }
  function animateStatusBars(rootEl) {
    const bars = rootEl.querySelectorAll('.cozycat-status-bar-fill');
    if (!bars.length) return;
    requestAnimationFrame(() => {
      bars.forEach((bar) => {
        const target = bar.style.width || '0%';
        bar.style.width = '0%';
        bar.offsetHeight;
        bar.style.width = target;
      });
    });
  }
  function templateMusic() {
    const coverDefault = 'https://i.postimg.cc/4yQghhGj/none.png';
    return `
      <div class="cozycat-page-screen cozycat-music-screen">
        ${templateBack()}
        <div class="cozycat-music-content">
          <div class="cozycat-music-vinyl-area">
            <div class="cozycat-music-vinyl spin-animation paused-animation" id="cozycatVinyl">
              <div class="cozycat-music-grooves"></div>
              <img src="${coverDefault}" class="cozycat-music-cover" alt="Cover">
            </div>
            <div class="cozycat-music-stylus" id="cozycatStylus">
              <div class="cozycat-music-stylus-knob"></div>
            </div>
          </div>
          <div class="cozycat-music-track">
            <div class="cozycat-music-tag">NOW PLAYING • VOL. 03</div>
            <div class="cozycat-music-title">Soft Paws on Wood Floors</div>
            <div class="cozycat-music-artist">M. Entertainment</div>
          </div>
          <div class="cozycat-music-controls">
            <div class="cozycat-music-progress">
              <span id="cozycatCurrentTime">0:00</span>
              <input type="range" id="cozycatProgress" class="cozycat-music-progressbar" value="0" step="0.1">
              <span id="cozycatDuration">0:00</span>
            </div>
            <div class="cozycat-music-btnrow">
              <button class="cozycat-music-btn" type="button" aria-label="Previous" disabled>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 20L9 12l10-8v16zM5 4h2v16H5V4z"/>
                </svg>
              </button>
              <button class="cozycat-music-play" type="button" id="cozycatPlayBtn" aria-label="Play/Pause">
                <svg id="cozycatPlayIcon" width="24" height="24" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <svg id="cozycatPauseIcon" width="24" height="24" viewBox="0 0 24 24" style="display:none;">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              </button>
              <button class="cozycat-music-btn" type="button" aria-label="Next" disabled>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 4l10 8-10 8V4zm14 0h2v16h-2V4z"/>
                </svg>
              </button>
            </div>
            <div class="cozycat-music-sign">on repeat forever...</div>
          </div>
        </div>
      </div>
    `;
  }
  function wireScreenEvents(rootEl) {
    rootEl.querySelectorAll('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-go');
        renderScreen(target);
      });
    });
    const backBtn = rootEl.querySelector('[data-back="1"]');
    if (backBtn) {
      backBtn.addEventListener('click', () => renderScreen(SCREENS.home));
    }
    const card = rootEl.querySelector('.cozycat-card');
    if (card) {
      const toggleFlip = () => card.classList.toggle('is-flipped');
      card.addEventListener('click', (e) => {
        if (e.target.closest('.cozycat-back')) return;
        toggleFlip();
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFlip();
        }
      });
    }
    rootEl.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const act = btn.getAttribute('data-action');
        await applyManualAction(act);
      });
    });
  }

  // ===== Draggable paw button (Settings/Storage) =====
  function getSavedPawPos() {
    try {
      const raw = localStorage.getItem(pawPosKey);
      if (!raw) return null;
      const v = JSON.parse(raw);
      if (typeof v?.x !== 'number' || typeof v?.y !== 'number') return null;
      return v;
    } catch {
      return null;
    }
  }
  function savePawPos(x, y) {
    localStorage.setItem(pawPosKey, JSON.stringify({ x, y }));
  }

  // ===== Draggable paw button (Main Logic) =====
  function mountPawButton() {
    if (document.getElementById(pawBtnId)) return;

    const btn = document.createElement('div');
    btn.id = pawBtnId;
    btn.className = 'cozycat-paw-btn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.title = 'Cozy Cat Overlay';
    btn.innerHTML = `<span class="cozycat-paw-emoji">🐾</span>`;

    // 1. ตรวจสอบว่าเปิดโหมดมือถือหรือไม่
    const mobileKey = `${extensionName}:mobileMode`;
    const isMobileMode = localStorage.getItem(mobileKey) === 'true';

    // 2. ฟังก์ชันตรวจสอบและดึงปุ่มกลับเข้าจอ (Clamping)
    function clampToScreen() {
      // ถ้าเปิดโหมดมือถือ หรือปุ่มยังใช้ค่า Auto (ขวาล่าง/ซ้ายล่าง) ไม่ต้องคำนวณ Pixel
      if (isMobileMode) return;
      if (btn.style.right !== 'auto' && btn.style.left === 'auto') return;

      const rect = btn.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8; 

      let currentLeft = parseFloat(btn.style.left);
      let currentTop = parseFloat(btn.style.top);

      if (isNaN(currentLeft) || isNaN(currentTop)) return;

      const maxLeft = vw - rect.width - margin;
      const maxTop = vh - rect.height - margin;

      const newLeft = Math.max(margin, Math.min(currentLeft, maxLeft));
      const newTop = Math.max(margin, Math.min(currentTop, maxTop));

      btn.style.left = `${newLeft}px`;
      btn.style.top = `${newTop}px`;
    }

    // 3. โหลดตำแหน่งเริ่มต้น
    const saved = getSavedPawPos();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isValidPos = saved && saved.x > 0 && saved.x < (vw - 50) && saved.y > 0 && saved.y < (vh - 50);

    if (isMobileMode) {
      // โหมดมือถือ -> ซ้ายล่างเสมอ
      btn.style.left = '16px';
      btn.style.bottom = '16px';
      btn.style.right = 'auto';
      btn.style.top = 'auto';
    } else if (isValidPos) {
      // โหมดปกติ มีค่าเซฟ -> ใช้ค่าเซฟ
      btn.style.left = `${saved.x}px`;
      btn.style.top = `${saved.y}px`;
      btn.style.right = 'auto';
      btn.style.bottom = 'auto';
    } else {
      // โหมดปกติ ไม่มีค่าเซฟ -> ขวาล่าง
      btn.style.left = 'auto';
      btn.style.top = 'auto';
      btn.style.right = '16px';
      btn.style.bottom = '16px';
    }

    window.addEventListener('resize', clampToScreen);

    // --- Drag Logic ---
    let dragging = false;
    let moved = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;

    function ensureLeftTopMode() {
      const rect = btn.getBoundingClientRect();
      btn.style.left = `${rect.left}px`;
      btn.style.top = `${rect.top}px`;
      btn.style.right = 'auto';
      btn.style.bottom = 'auto';
    }

    btn.addEventListener('pointerdown', (e) => {
      // ถ้าล็อคโหมดมือถือ ไม่ให้ลาก (หรือถ้าอยากให้ลากได้ก็เอาเงื่อนไขนี้ออก)
      // แต่ปกติโหมด Fixed คือไม่อยากให้ขยับ
      // if (isMobileMode) return; 

      dragging = true;
      moved = false;
      btn.setPointerCapture(e.pointerId);
      
      ensureLeftTopMode(); 

      const rect = btn.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;
    });

    btn.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      btn.style.left = `${startLeft + dx}px`;
      btn.style.top = `${startTop + dy}px`;
    });

    btn.addEventListener('pointerup', () => {
      dragging = false;
      if (!moved) {
        toggleOverlay();
        return;
      }
      clampToScreen();
      const rect = btn.getBoundingClientRect();
      // ถ้าไม่ได้อยู่ในโหมดมือถือ ค่อยบันทึกตำแหน่ง
      if (!isMobileMode) {
        savePawPos(rect.left, rect.top);
      }
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleOverlay();
      }
    });

    document.body.appendChild(btn);
  }

  function unmountPawButton() {
    const btn = document.getElementById(pawBtnId);
    if (btn) btn.remove();
  }

  function unmountAll() {
    unmountOverlay();
    unmountPawButton();
  }

  function applyEnabledState(isEnabled) {
    if (isEnabled) {
      ensureMusicAudio();
      mountPawButton();
    } else {
      teardownMusicAudio();
      unmountAll();
    }
  }

  applyEnabledState(localStorage.getItem(`${extensionName}:enabled`) === 'true');
  attachChatHooks();
}

jQuery(async () => {
  loadSettings();
  console.log('[cozy-cat-for-ST] Panel Loaded.');
});
