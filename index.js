const extensionName = 'cozy-cat-for-ST';

function loadSettings() {
  $('.cozy-cat-settings').remove();

  const enabledKey = `${extensionName}:enabled`;
  const enabled = localStorage.getItem(enabledKey) === 'true';

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
            <label class="checkbox_label" for="${extensionName}-enabled">
              <input id="${extensionName}-enabled" type="checkbox" ${enabled ? 'checked' : ''}>
              <span>Enable Cozy Cat</span>
            </label>

            <div style="text-align:center;color:#aaa;padding:20px;">
              (พื้นที่ว่าง)
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  $('#extensions_settings').append(settingsHtml);

  // drawer open/close
  const $root = $('.cozy-cat-settings');
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

  // ===== Overlay system =====
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

    escHandler = (e) => {
      if (e.key === 'Escape') hideOverlay();
    };
    document.addEventListener('keydown', escHandler);

    renderScreen(SCREENS.home);
  }

  function showOverlay() {
    mountOverlay();
    const el = document.getElementById(overlayId);
    if (el) el.style.display = 'flex';
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

  // ===== Render helpers =====
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
    // ปุ่ม Back
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
    // ใช้ default image
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
                  <!-- ใช้ div แทน h2 กันธีมอื่นแทรกเส้น/สี -->
                  <div class="cozycat-card-title">Your<br>Soon To Be<br>Master.</div>
                </div>

                <div class="cozycat-card-body">
                  <div class="cozycat-card-stats">
                    <span>TYPE: —</span>
                    <span>SEX: —</span>
                  </div>

                  <div class="cozycat-card-personality">
                    <b class="cozycat-card-personality-label">Personality:</b>
                    <ul class="cozycat-card-list">
                      <li>—</li>
                      <li>—</li>
                      <li>—</li>
                      <li>—</li>
                      <li>—</li>
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
    return `
      <div class="cozycat-page-screen">
        ${templateBack()}
        <div class="cozycat-page">
          <div class="cozycat-page-title">status</div>
          <div class="cozycat-page-desc">หน้าสเตตัสแมว (เดี๋ยวทำต่อ)</div>
        </div>
      </div>
    `;
  }

  function templateMusic() {
    return `
      <div class="cozycat-page-screen">
        ${templateBack()}
        <div class="cozycat-page">
          <div class="cozycat-page-title">music</div>
          <div class="cozycat-page-desc">หน้าเครื่องเล่นเพลง (เดี๋ยวทำต่อ)</div>
        </div>
      </div>
    `;
  }

  function renderScreen(next) {
    currentScreen = next;

    const root = getInnerRoot();
    if (!root) return;

    let html = '';
    if (next === SCREENS.home) html = templateHome();
    else if (next === SCREENS.card) html = templateCard();
    else if (next === SCREENS.status) html = templateStatus();
    else if (next === SCREENS.music) html = templateMusic();
    else html = templateHome();

    root.innerHTML = html;
    wireScreenEvents(root);
  }

  function wireScreenEvents(rootEl) {
    // go
    rootEl.querySelectorAll('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-go');
        renderScreen(target);
      });
    });

    // back
    const backBtn = rootEl.querySelector('[data-back="1"]');
    if (backBtn) {
      backBtn.addEventListener('click', () => renderScreen(SCREENS.home));
    }

    // card flip (มือถือจะชัวร์กว่าพึ่ง :focus อย่างเดียว)
    const card = rootEl.querySelector('.cozycat-card');
    if (card) {
      const toggleFlip = () => card.classList.toggle('is-flipped');

      card.addEventListener('click', (e) => {
        // กันคลิกโดนปุ่ม back ถ้ามี overlap
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
  }

  // ===== Draggable paw button (remember position) =====
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

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function mountPawButton() {
    if (document.getElementById(pawBtnId)) return;

    const btn = document.createElement('div');
    btn.id = pawBtnId;
    btn.className = 'cozycat-paw-btn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.title = 'Cozy Cat Overlay';
    btn.innerHTML = `<span class="cozycat-paw-emoji">🐾</span>`;

    const saved = getSavedPawPos();
    if (saved) {
      btn.style.left = `${saved.x}px`;
      btn.style.top = `${saved.y}px`;
      btn.style.right = 'auto';
      btn.style.bottom = 'auto';
    } else {
      btn.style.right = '16px';
      btn.style.bottom = '16px';
    }

    let dragging = false;
    let moved = false;

    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;

    function ensureLeftTop() {
      const rect = btn.getBoundingClientRect();
      btn.style.left = `${rect.left}px`;
      btn.style.top = `${rect.top}px`;
      btn.style.right = 'auto';
      btn.style.bottom = 'auto';
    }

    btn.addEventListener('pointerdown', (e) => {
      dragging = true;
      moved = false;

      btn.setPointerCapture(e.pointerId);
      ensureLeftTop();

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

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const rect = btn.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      const nextLeft = clamp(startLeft + dx, 8, vw - w - 8);
      const nextTop = clamp(startTop + dy, 8, vh - h - 8);

      btn.style.left = `${nextLeft}px`;
      btn.style.top = `${nextTop}px`;
    });

    btn.addEventListener('pointerup', () => {
      dragging = false;

      const rect = btn.getBoundingClientRect();
      savePawPos(rect.left, rect.top);

      if (!moved) toggleOverlay();
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

  // ===== enable/disable =====
  function applyEnabledState(isEnabled) {
    if (isEnabled) {
      mountPawButton();
    } else {
      unmountAll();
    }
  }

  const $enabled = $root.find(`#${extensionName}-enabled`);
  $enabled.on('change', function () {
    const isEnabled = this.checked;
    localStorage.setItem(enabledKey, String(isEnabled));
    applyEnabledState(isEnabled);
  });

  applyEnabledState(enabled);
}

jQuery(async () => {
  loadSettings();
  console.log('[cozy-cat-for-ST] Panel Loaded.');
});
