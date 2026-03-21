export function createExportModal({
    getTheme,
    getWallpaperBlob,
    generateMobile,
    downloadAttheme,
    generateDesktop,
    downloadDesktop,
}) {
    const MODES = [
        {
            id: 'light',
            label: 'Light',
            svgPath: 'M338.584 189.998C364.427 238.164 344.902 281.771 295.066 295.061C281.771 344.902 238.164 364.422 189.998 338.584C141.831 364.427 98.2245 344.902 84.9337 295.066C35.0981 281.771 15.573 238.164 41.4157 189.998C15.573 141.831 35.0981 98.2245 84.9337 84.9337C98.2245 35.0981 141.831 15.573 189.998 41.4157C238.164 15.573 281.771 35.0981 295.061 84.9337C344.902 98.2245 364.422 141.831 338.584 189.998Z',
        },
        {
            id: 'dark',
            label: 'Dark',
            svgPath: 'M134.186 54.5654C165.276 24.4782 214.724 24.4782 245.814 54.5654C255.328 63.7718 266.984 70.4811 279.738 74.0919C321.419 85.8924 346.142 128.586 335.552 170.473C332.312 183.291 332.312 196.709 335.552 209.527C346.142 251.414 321.419 294.108 279.738 305.908C266.984 309.519 255.328 316.228 245.814 325.435C214.724 355.522 165.276 355.522 134.186 325.435C124.672 316.228 113.016 309.519 100.262 305.908C58.5815 294.108 33.8578 251.414 44.4476 209.527C47.6879 196.709 47.6879 183.291 44.4476 170.473C33.8578 128.586 58.5815 85.8924 100.262 74.0919C113.016 70.4811 124.672 63.7718 134.186 54.5654Z',
        },
        {
            id: 'amoled',
            label: 'AMOLED',
            svgPath: 'M155.064 49.459C176.093 34.1803 204.569 34.1803 225.598 49.459L322.926 120.171C343.955 135.45 352.754 162.532 344.722 187.253L307.546 301.668C299.514 326.39 276.476 343.127 250.483 343.127H130.18C104.186 343.127 81.1489 326.39 73.1164 301.668L35.9407 187.253C27.9082 162.532 36.7077 135.45 57.737 120.171L155.064 49.459Z',
        },
    ];
    let step = 1;
    let selectedMode = null;
    const scrim = document.createElement('div');
    scrim.className = 'm3-modal-scrim';
    scrim.innerHTML = `
        <div class="m3-export-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <!-- Header -->
            <div class="m3-modal-header">
                <span class="m3-modal-title" id="modal-title">Export theme</span>
                <button class="m3-modal-close" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224z"/></svg>
                </button>
            </div>

            <!-- Step indicator -->
            <div class="m3-step-indicator">
                <div class="m3-step-pip active" style="width: 24px;" data-pip="1"></div>
                <div class="m3-step-pip" style="width: 16px;" data-pip="2"></div>
            </div>

            <!-- Body (rendered per step) -->
            <div class="m3-modal-body"></div>

            <!-- Footer -->
            <div class="m3-modal-footer">
                <span class="m3-footer-leading"></span>
                <button class="m3-modal-next-btn">Next</button>
            </div>
        </div>
    `;

    document.body.appendChild(scrim);
    const modal       = scrim.querySelector('.m3-export-modal');
    const closeBtn    = scrim.querySelector('.m3-modal-close');
    const body        = scrim.querySelector('.m3-modal-body');
    const footer      = scrim.querySelector('.m3-modal-footer');
    const pips        = scrim.querySelectorAll('.m3-step-pip');
    function setStep(n) {
        step = n;
        pips.forEach((p, i) => {
            const active = i < n;
            p.classList.toggle('active', active);
            p.style.width = active ? '24px' : '16px';
        });
        if (n === 1) renderStep1();
        else         renderStep2();
    }

    function buildAmoledScheme(theme) {
        const base = theme.schemes.dark.toJSON();
        return {
            ...base,
            background:           0xFF000000,
            surface:              0xFF000000,
            surfaceVariant:       0xFF0D0D0D,
            surfaceContainer:     0xFF0A0A0A,
            surfaceContainerLow:  0xFF050505,
            surfaceContainerHigh: 0xFF121212,
            surfaceContainerHighest: 0xFF1A1A1A,
            surfaceBright:        0xFF1A1A1A,
            surfaceDim:           0xFF000000,
        };
    }

    function getSchemeForMode(mode) {
        const theme = getTheme();
        if (!theme) return null;
        switch (mode) {
            case 'light':  return { scheme: theme.schemes.light, isDark: false };
            case 'dark':   return { scheme: theme.schemes.dark,  isDark: true  };
            case 'amoled': return { scheme: buildAmoledScheme(theme),           isDark: true  };
        }
    }

    function getModeSwatchColors(mode) {
        const theme = getTheme();
        if (!theme) return { bg: '#888' };
        const s = mode === 'light' ? theme.schemes.light.toJSON() : theme.schemes.dark.toJSON();

        const toHex = (argb) => {
            const r = (argb >> 16) & 0xFF;
            const g = (argb >> 8)  & 0xFF;
            const b =  argb        & 0xFF;
            return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
        };

        if (mode === 'amoled') return { bg: '#000000' };
        return { bg: toHex(s.primaryContainer) };
    }

    function renderStep1() {
        body.innerHTML = `
            <p class="m3-modal-step-label">01 — Color mode</p>
            <div class="m3-mode-grid">
                ${MODES.map(m => {
                    const swatchColor = m.id === 'amoled' ? '#000000' : getModeSwatchColors(m.id).bg;
                    return `
                    <div class="m3-mode-card${selectedMode === m.id ? ' selected' : ''}" data-mode="${m.id}">
                        <div class="m3-mode-check">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                                <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
                            </svg>
                        </div>
                        <svg class="m3-mode-swatch" viewBox="0 0 380 380" fill="none" xmlns="http://www.w3.org/2000/svg"
                             aria-hidden="true" style="color: ${swatchColor};">
                            <path d="${m.svgPath}" fill="currentColor"/>
                        </svg>
                        <span class="m3-mode-label">${m.label}</span>
                    </div>`;
                }).join('')}
            </div>
        `;

        body.querySelectorAll('.m3-mode-card').forEach(card => {
            card.addEventListener('click', () => {
                selectedMode = card.dataset.mode;
                renderStep1();
            });
        });

        footer.innerHTML = `
            <span class="m3-footer-leading"></span>
            <button class="m3-modal-next-btn"${!selectedMode ? ' disabled style="opacity:0.4;cursor:default;"' : ''}>Next</button>
        `;
        footer.querySelector('.m3-modal-next-btn').addEventListener('click', () => {
            if (selectedMode) setStep(2);
        });
    }

    function renderStep2() {
        const modeLabel = MODES.find(m => m.id === selectedMode)?.label ?? '';
        const colors = getModeSwatchColors(selectedMode);

        body.innerHTML = `
            <p class="m3-modal-step-label">02 — Platform</p>
            <div class="m3-platform-grid">
                <div class="m3-platform-card" data-platform="mobile">
                    <div class="m3-platform-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M280-40q-33 0-56.5-23.5T200-120v-720q0-33 23.5-56.5T280-920h400q33 0 56.5 23.5T760-840v124q18 7 29 22t11 34v80q0 19-11 34t-29 22v404q0 33-23.5 56.5T680-40zm0-80h400v-720H280zm0 0v-720zm228.5-611.5Q520-743 520-760t-11.5-28.5T480-800t-28.5 11.5T440-760t11.5 28.5T480-720t28.5-11.5"/></svg>
                    </div>
                    <div>
                        <div class="m3-platform-name">Telegram Mobile</div>
                        <div class="m3-platform-ext">.attheme</div>
                    </div>
                </div>
                <div class="m3-platform-card" data-platform="desktop">
                    <div class="m3-platform-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentcolor"><path d="M40-120v-80h880v80zm120-120q-33 0-56.5-23.5T80-320v-440q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v440q0 33-23.5 56.5T800-240zm0-80h640v-440H160zm0 0v-440z"/></svg>
                    </div>
                    <div>
                        <div class="m3-platform-name">Telegram Desktop</div>
                        <div class="m3-platform-ext">.tdesktop-theme</div>
                    </div>
                </div>
            </div>
        `;

        body.querySelectorAll('.m3-platform-card').forEach(card => {
            card.addEventListener('click', () => triggerExport(card.dataset.platform));
        });
        footer.innerHTML = `
            <button class="m3-modal-back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor"><path d="M560-240 320-480l240-240 56 56-184 184 184 184z"/></svg>
                Back
            </button>
            <div class="m3-summary-pill">
                <div class="m3-summary-swatch" style="background:${colors.bg};"></div>
                ${modeLabel}
            </div>
        `;
        footer.querySelector('.m3-modal-back-btn').addEventListener('click', () => setStep(1));
    }

    async function triggerExport(platform) {
        body.innerHTML = `
            <div class="m3-modal-success">
                <div class="m3-success-icon">
                    <svg class="m3-spinner" viewBox="22 22 44 44" xmlns="http://www.w3.org/2000/svg" style="width:26px;height:26px;">
                        <circle cx="44" cy="44" r="20.2" fill="none" stroke="currentColor" stroke-width="3.6"
                                stroke-dasharray="55 90" stroke-linecap="round"
                                style="animation: m3-spin 1s linear infinite; transform-origin: center;"/>
                    </svg>
                </div>
                <div class="m3-success-title">Generating theme…</div>
            </div>
        `;
        footer.innerHTML = '';

        try {
            const { scheme, isDark } = getSchemeForMode(selectedMode) ?? {};
            if (!scheme) throw new Error('No theme available.');

            const suffix = selectedMode === 'amoled' ? 'amoled' : (isDark ? 'dark' : 'light');
            const filename = `TeleYou-${suffix}`;

            if (platform === 'mobile') {
                const content = generateMobile(scheme, isDark);
                downloadAttheme(content, `${filename}.attheme`);
            } else {
                const colors      = generateDesktop(scheme);
                const wallBlob    = await getWallpaperBlob();
                await downloadDesktop(colors, wallBlob, `${filename}.tdesktop-theme`);
            }

            showSuccess(platform);
        } catch (err) {
            console.error('[ExportModal]', err);
            showError(err.message);
        }
    }

    function showSuccess(platform) {
        const label = platform === 'mobile' ? 'Telegram Mobile' : 'Telegram Desktop';
        body.innerHTML = `
            <div class="m3-modal-success">
                <div class="m3-success-icon m3-success-icon--logo">
                    <svg class="m3-success-logo-bg" viewBox="0 0 380 380" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M166.697 39.846c.541-.53.811-.795 1.046-1.016 12.503-11.773 32.011-11.773 44.514 0 .235.22.505.486 1.046 1.016.325.318.487.477.642.624a32.47 32.47 0 0 0 30.083 8.061c.207-.05.428-.107.868-.22.733-.189 1.1-.283 1.414-.357 16.714-3.944 33.609 5.81 38.55 22.257.093.309.195.674.398 1.403.122.438.184.657.244.862a32.47 32.47 0 0 0 22.022 22.023c.205.06.424.12.862.243a77 77 0 0 1 1.403.398c16.447 4.941 26.201 21.836 22.257 38.55-.074.314-.168.681-.357 1.414-.113.44-.17.661-.22.868a32.46 32.46 0 0 0 8.061 30.083c.147.155.306.317.624.642.53.541.795.811 1.016 1.046 11.773 12.503 11.773 32.011 0 44.514-.221.235-.486.505-1.016 1.046-.318.325-.477.487-.624.642a32.46 32.46 0 0 0-8.061 30.083c.05.207.107.428.22.868.189.733.283 1.1.357 1.414 3.944 16.714-5.81 33.609-22.257 38.55a77 77 0 0 1-1.403.398c-.438.123-.657.184-.862.244a32.47 32.47 0 0 0-22.022 22.022c-.06.205-.121.424-.244.862a77 77 0 0 1-.398 1.403c-4.941 16.447-21.836 26.201-38.55 22.257a75 75 0 0 1-1.414-.357c-.44-.113-.661-.17-.868-.22a32.46 32.46 0 0 0-30.083 8.061c-.155.147-.317.306-.642.624-.541.53-.811.795-1.046 1.016-12.503 11.773-32.011 11.773-44.514 0-.235-.221-.505-.486-1.046-1.016-.325-.318-.487-.477-.642-.624a32.46 32.46 0 0 0-30.083-8.061c-.207.05-.428.107-.868.22-.733.189-1.1.283-1.414.357-16.714 3.944-33.609-5.81-38.55-22.257a77 77 0 0 1-.398-1.403c-.123-.438-.184-.657-.243-.862a32.47 32.47 0 0 0-22.023-22.022c-.205-.06-.424-.122-.862-.244a74 74 0 0 1-1.403-.398c-16.447-4.941-26.201-21.836-22.257-38.55.074-.314.168-.681.357-1.414.113-.44.17-.661.22-.868a32.47 32.47 0 0 0-8.06-30.083c-.148-.155-.307-.317-.625-.642-.53-.541-.795-.811-1.016-1.046-11.773-12.503-11.773-32.011 0-44.514.22-.235.486-.505 1.016-1.046.318-.325.477-.487.624-.642a32.47 32.47 0 0 0 8.061-30.083 71 71 0 0 0-.22-.868c-.189-.733-.283-1.1-.357-1.414-3.944-16.714 5.81-33.609 22.257-38.55a77 77 0 0 1 1.403-.398c.438-.123.657-.184.862-.243a32.47 32.47 0 0 0 22.023-22.023c.06-.205.12-.424.243-.862.203-.73.305-1.094.398-1.403 4.941-16.447 21.836-26.201 38.55-22.257.314.074.681.168 1.414.357.44.113.661.17.868.22a32.47 32.47 0 0 0 30.083-8.06c.155-.148.317-.307.642-.625" fill="currentColor"/></svg>
                    <svg class="m3-success-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
                    </svg>
                </div>
                <div class="m3-success-title">Theme exported!</div>
                <div class="m3-success-subtitle">${label} — ready to import.</div>
            </div>
        `;
        footer.innerHTML = `
            <span></span>
            <button class="m3-modal-next-btn">Close</button>
        `;
        footer.querySelector('.m3-modal-next-btn').addEventListener('click', close);
    }

    function showError(msg) {
        body.innerHTML = `
            <div class="m3-modal-success">
                <div class="m3-success-icon" style="background-color: var(--m3-error-container);">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" style="color: var(--m3-on-error-container);">
                        <path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/>
                    </svg>
                </div>
                <div class="m3-success-title">Export failed</div>
                <div class="m3-success-subtitle">${msg}</div>
            </div>
        `;
        footer.innerHTML = `
            <span></span>
            <button class="m3-modal-next-btn">Close</button>
        `;
        footer.querySelector('.m3-modal-next-btn').addEventListener('click', close);
    }

    function open() {
        step = 1;
        selectedMode = null;
        setStep(1);
        requestAnimationFrame(() => {
            scrim.classList.add('open');
        });
        document.addEventListener('keydown', onKeyDown);
    }

    function close() {
        scrim.classList.remove('open');
        document.removeEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') close();
    }

    scrim.addEventListener('click', (e) => {
        if (e.target === scrim) close();
    });

    closeBtn.addEventListener('click', close);

    return { open, close };
}
