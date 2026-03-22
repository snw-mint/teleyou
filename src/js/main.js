import { sourceColorFromImage, themeFromSourceColor, hexFromArgb, argbFromHex, Hct, Blend, TonalPalette } from '@material/material-color-utilities';
import { generateMobileTheme, downloadAttheme } from './theme-mobile.js';
import { generateDesktopColors, downloadDesktopTheme } from './theme-desktop.js';
import { createHctPicker } from './hct-picker.js';
import { createExportModal } from './export-modal.js';
let currentExtractedTheme = null;
let currentWallpaperUrl = null;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader-overlay');
        const appContainer = document.getElementById('app-container');
        loader.classList.add('hidden');
        appContainer.style.display = 'flex';
        document.body.style.overflow = 'auto'; 
    }, 1500);

    const themeBtn = document.getElementById('theme-toggle');
    const iconSun = document.querySelector('.icon-sun');
    const iconMoon = document.querySelector('.icon-moon');
    const rootElement = document.documentElement;

    const applyTheme = (isDark) => {
        rootElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        if (iconSun) iconSun.style.display = isDark ? 'block' : 'none';
        if (iconMoon) iconMoon.style.display = isDark ? 'none' : 'block';
        if (themeBtn) themeBtn.setAttribute('data-tooltip', isDark ? 'Switch to light theme' : 'Switch to dark theme');

        if (currentExtractedTheme) {
            applyMaterialThemeToUI(currentExtractedTheme);
        }
    };

    // Set initial theme based on system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(mediaQuery.matches);

    // Listen for system theme changes
    mediaQuery.addEventListener('change', (e) => {
        applyTheme(e.matches);
    });

    // Handle manual theme toggle
    themeBtn.addEventListener('click', () => {
        const isCurrentlyDark = rootElement.getAttribute('data-theme') === 'dark';
        applyTheme(!isCurrentlyDark);
    });

    const wallItems = document.querySelectorAll('.wall-item:not(.upload-btn)');
    const uploadTriggerBtn = document.getElementById('upload-trigger-btn');
    const imageUploadInput = document.getElementById('image-upload-input');
    const randomizeColorBtn = document.querySelector('.color-picker-card .small-btn');
    const exportMobileBtn = null; 
    const exportPcBtn = null;     

    wallItems.forEach(w => w.classList.remove('active'));

    wallItems.forEach(item => {
        item.addEventListener('click', () => {
            wallItems.forEach(w => w.classList.remove('active'));
            uploadTriggerBtn.classList.remove('active');
            uploadTriggerBtn.style.backgroundImage = '';
            imageUploadInput.value = ''; 

            item.classList.add('active');
            
            const bgImage = window.getComputedStyle(item).backgroundImage;
            const url = bgImage.slice(5, -2).replace(/"/g, "");
            currentWallpaperUrl = url;
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    extractThemeFromImage(url);
                });
            });
        });
    });

    uploadTriggerBtn.addEventListener('click', () => {
        imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            wallItems.forEach(w => w.classList.remove('active'));
            
            const imageUrl = URL.createObjectURL(file);
            uploadTriggerBtn.style.backgroundImage = `url('${imageUrl}')`;
            uploadTriggerBtn.classList.add('active');
            currentWallpaperUrl = imageUrl;
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    extractThemeFromImage(imageUrl);
                });
            });
        }
    });

    const btnMobile = document.getElementById('btn-mobile');
    const btnDesktop = document.getElementById('btn-desktop');
    const mockupMobile = document.getElementById('mockup-mobile');
    const mockupDesktop = document.getElementById('mockup-desktop');

    btnMobile.addEventListener('click', () => {
        if (btnMobile.classList.contains('active')) return;
        
        btnDesktop.classList.remove('active');
        btnMobile.classList.add('active');
        
        mockupDesktop.classList.remove('active');
        mockupMobile.classList.add('active');
    });

    btnDesktop.addEventListener('click', () => {
        if (btnDesktop.classList.contains('active')) return;
        
        btnMobile.classList.remove('active');
        btnDesktop.classList.add('active');
        
        mockupMobile.classList.remove('active');
        mockupDesktop.classList.add('active');
    });

    randomizeColorBtn.addEventListener('click', () => {
        wallItems.forEach(w => w.classList.remove('active'));
        uploadTriggerBtn.classList.remove('active');
        uploadTriggerBtn.style.backgroundImage = '';
        imageUploadInput.value = '';

        const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const sourceColorArgb = argbFromHex(randomHex);
        
        currentWallpaperUrl = null;
        currentExtractedTheme = themeFromSourceColor(sourceColorArgb);
        applyMaterialThemeToUI(currentExtractedTheme);
    });

    const exportModal = createExportModal({
        getTheme:         getThemeForExport,
        getWallpaperBlob: () => getActiveWallpaperBlob(wallItems, uploadTriggerBtn),
        generateMobile:   generateMobileTheme,
        downloadAttheme:  downloadAttheme,
        generateDesktop:  generateDesktopColors,
        downloadDesktop:  downloadDesktopTheme,
    });
    const fab = document.getElementById('m3-export-fab');
    if (fab) fab.addEventListener('click', () => exportModal.open());

    const infoBtn = document.getElementById('info-btn');
    if (infoBtn) {
        const infoScrim = document.getElementById('m3-info-modal-scrim');
        const infoClose = document.getElementById('m3-info-modal-close');

        function openInfoModal() {
            infoScrim.classList.add('open');
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', onInfoKeyDown);
        }
        function closeInfoModal() {
            infoScrim.classList.remove('open');
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onInfoKeyDown);
        }
        function onInfoKeyDown(e) { if (e.key === 'Escape') closeInfoModal(); }

        infoBtn.addEventListener('click', openInfoModal);
        infoClose.addEventListener('click', closeInfoModal);
        infoScrim.addEventListener('click', e => { if (e.target === infoScrim) closeInfoModal(); });
    }

    const tooltipElement = document.getElementById('m3-tooltip');
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');

    const showTooltip = (e) => {
        const trigger = e.currentTarget;
        const text = trigger.getAttribute('data-tooltip');
        if (!text) return;
        tooltipElement.textContent = text;
        tooltipElement.classList.add('visible');
        const rect = trigger.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();
        const placeBelow = trigger.getAttribute('data-tooltip-pos') === 'below';
        let topPosition = placeBelow ? rect.bottom + 8 : rect.top - tooltipRect.height - 8;
        let leftPosition = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        if (!placeBelow && topPosition < 8) topPosition = rect.bottom + 8;
        if (leftPosition < 8) leftPosition = 8;
        const rightOverflow = leftPosition + tooltipRect.width - window.innerWidth + 8;
        if (rightOverflow > 0) leftPosition -= rightOverflow;
        tooltipElement.style.top = `${topPosition}px`;
        tooltipElement.style.left = `${leftPosition}px`;
    };

    const hideTooltip = () => {
        tooltipElement.classList.remove('visible');
    };

    tooltipTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', showTooltip);
        trigger.addEventListener('mouseleave', hideTooltip);
        trigger.addEventListener('focus', showTooltip);
        trigger.addEventListener('blur', hideTooltip);
    });

    
    const PALETTE_ROLES = [
        { cssVar: '--m3-primary',         label: 'Primary',         description: 'Key actions & highlights',      constraintRole: 'primary'       },
        { cssVar: '--m3-secondary',        label: 'Secondary',       description: 'Supporting elements',           constraintRole: 'secondary'     },
        { cssVar: '--m3-tertiary',         label: 'Tertiary',        description: 'Complementary accents',         constraintRole: 'tertiary'      },
        { cssVar: '--m3-error',            label: 'Error',           description: 'Errors & warnings',             constraintRole: 'error'         },
        { cssVar: '--m3-neutral',          label: 'Neutral',         description: 'Outlines & dividers',           constraintRole: 'neutral'       },
        { cssVar: '--m3-neutral-variant',  label: 'Neutral Variant', description: 'Subtle secondary elements',     constraintRole: 'neutralVariant'},
    ];

    let activePaletteRole = null;

    const hctPicker = createHctPicker({
        onchange(argb) {
            if (!activePaletteRole) return;
            if (activePaletteRole.cssVar) {
                document.documentElement.style.setProperty(activePaletteRole.cssVar, hexFromArgb(argb));
            } else {
                
                currentExtractedTheme = themeFromSourceColor(argb);
                applyMaterialThemeToUI(currentExtractedTheme);
            }
        },
        onclose(argb) {
            if (!activePaletteRole) return;
            if (activePaletteRole.cssVar) {
                document.documentElement.style.setProperty(activePaletteRole.cssVar, hexFromArgb(argb));
            } else {
                currentExtractedTheme = themeFromSourceColor(argb);
                applyMaterialThemeToUI(currentExtractedTheme);
            }
        },
    });

    document.querySelectorAll('.palette-list .palette-card').forEach((card, i) => {
        const role = PALETTE_ROLES[i];
        if (!role) return;
        const dot = card.querySelector('.color-indicator');
        if (!dot) return;
        dot.setAttribute('role', 'button');
        dot.setAttribute('tabindex', '0');
        dot.setAttribute('aria-label', `Edit ${role.label} color`);

        function openPickerForRole() {
            const currentHex = getComputedStyle(document.documentElement)
                .getPropertyValue(role.cssVar).trim() || '#65558F';
            const argb = argbFromHex(currentHex.startsWith('#') ? currentHex : '#' + currentHex);
            activePaletteRole = role;
            hctPicker.setRole(role.constraintRole);
            hctPicker.setLabel(role.label, role.description);
            hctPicker.open(argb, dot);
        }

        dot.addEventListener('click', openPickerForRole);
        dot.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPickerForRole();
            }
        });
    });
    const sourceColorDot = document.querySelector('.color-picker-card .color-indicator');
    if (sourceColorDot) {
        sourceColorDot.setAttribute('role', 'button');
        sourceColorDot.setAttribute('tabindex', '0');
        sourceColorDot.setAttribute('aria-label', 'Edit source color');

        function openPickerForSource() {
            const currentHex = getComputedStyle(document.documentElement)
                .getPropertyValue('--m3-primary').trim() || '#65558F';
            const argb = argbFromHex(currentHex.startsWith('#') ? currentHex : '#' + currentHex);
            activePaletteRole = { cssVar: null, label: 'Source Color', description: 'Seed for the entire palette' };
            hctPicker.setRole('primary');
            hctPicker.setLabel('Source Color', 'Seed for the entire palette');
            hctPicker.open(argb, sourceColorDot);
        }

        sourceColorDot.addEventListener('click', openPickerForSource);
        sourceColorDot.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPickerForSource();
            }
        });
    }

    
    const DEFAULT_SOURCE = '#6750A4';
    currentExtractedTheme = themeFromSourceColor(argbFromHex(DEFAULT_SOURCE));
    applyMaterialThemeToUI(currentExtractedTheme);
});
async function extractThemeFromImage(imageUrl) {
    const imgElement = new Image();
    imgElement.crossOrigin = "anonymous";
    imgElement.src = imageUrl;
    await new Promise(resolve => { imgElement.onload = resolve; });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const MAX_SIZE = 128; 
    let width = imgElement.width;
    let height = imgElement.height;
    if (width > height) {
        if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
        }
    } else {
        if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
        }
    }
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgElement, 0, 0, width, height);
    const tinyImage = new Image();
    tinyImage.src = canvas.toDataURL('image/png');
    await new Promise(resolve => { tinyImage.onload = resolve; });
    try {
        const sourceColor = await sourceColorFromImage(tinyImage);
        currentExtractedTheme = themeFromSourceColor(sourceColor);
        applyMaterialThemeToUI(currentExtractedTheme);
    } catch (error) {
        console.error("Color extraction failed:", error);
    }
}
function applyToMockup(scheme) {
    const safeGet = (key, fallback) => scheme[key] ?? scheme[fallback];
    document.querySelectorAll('.chat-screen').forEach(screen => {
        screen.style.setProperty('--tg-background',             hexFromArgb(scheme.background));
        screen.style.setProperty('--tg-surface',                hexFromArgb(scheme.surface));
        screen.style.setProperty('--tg-surface-container',      hexFromArgb(safeGet('surfaceContainer', 'surfaceVariant')));
        screen.style.setProperty('--tg-surface-container-low',  hexFromArgb(safeGet('surfaceContainerLow', 'surfaceVariant')));
        screen.style.setProperty('--tg-surface-container-high', hexFromArgb(safeGet('surfaceContainerHigh', 'primaryContainer')));
        screen.style.setProperty('--tg-on-surface',             hexFromArgb(scheme.onSurface));
        screen.style.setProperty('--tg-on-surface-variant',     hexFromArgb(scheme.onSurfaceVariant));
        screen.style.setProperty('--tg-on-primary-container',   hexFromArgb(scheme.onPrimaryContainer));
        screen.style.setProperty('--tg-primary',                hexFromArgb(scheme.primary));
        screen.style.setProperty('--tg-primary-container',      hexFromArgb(scheme.primaryContainer));
        screen.style.setProperty('--tg-on-primary',             hexFromArgb(scheme.onPrimary));
        screen.style.setProperty('--tg-secondary',              hexFromArgb(scheme.secondary));
        screen.style.setProperty('--tg-secondary-container',    hexFromArgb(scheme.secondaryContainer));
        screen.style.setProperty('--tg-tertiary',               hexFromArgb(scheme.tertiary));
        screen.style.setProperty('--tg-tertiary-container',     hexFromArgb(scheme.tertiaryContainer));
        screen.style.setProperty('--tg-inverse-surface',        hexFromArgb(scheme.inverseSurface));
        screen.style.setProperty('--tg-inverse-on-surface',     hexFromArgb(scheme.inverseOnSurface));
        screen.style.setProperty('--tg-inverse-primary',        hexFromArgb(scheme.inversePrimary));
        screen.style.setProperty('--tg-error',                  hexFromArgb(scheme.error));
        screen.style.setProperty('--tg-outline',                hexFromArgb(scheme.outline));
        screen.style.setProperty('--tg-outline-variant',        hexFromArgb(scheme.outlineVariant));
        screen.style.setProperty('--tg-unread-bg',              hexFromArgb(scheme.primaryContainer));
        screen.style.setProperty('--tg-unread-fg',              hexFromArgb(scheme.onSurface));
        if (currentWallpaperUrl) {
            screen.style.backgroundImage = `url('${currentWallpaperUrl}')`;
            screen.style.backgroundSize = 'cover';
            screen.style.backgroundPosition = 'center';
        } else {
            screen.style.backgroundImage = 'none';
            screen.style.backgroundSize = '';
            screen.style.backgroundPosition = '';
        }
    });
    document.querySelectorAll('.mockup-scope').forEach(scope => {
        scope.style.setProperty('--tg-background',             hexFromArgb(scheme.background));
        scope.style.setProperty('--tg-surface',                hexFromArgb(scheme.surface));
        scope.style.setProperty('--tg-surface-container',      hexFromArgb(safeGet('surfaceContainer', 'surfaceVariant')));
        scope.style.setProperty('--tg-surface-container-high', hexFromArgb(safeGet('surfaceContainerHigh', 'primaryContainer')));
        scope.style.setProperty('--tg-on-surface',             hexFromArgb(scheme.onSurface));
        scope.style.setProperty('--tg-on-surface-variant',     hexFromArgb(scheme.onSurfaceVariant));
        scope.style.setProperty('--tg-on-primary-container',   hexFromArgb(scheme.onPrimaryContainer));
        scope.style.setProperty('--tg-primary',                hexFromArgb(scheme.primary));
        scope.style.setProperty('--tg-primary-container',      hexFromArgb(scheme.primaryContainer));
        scope.style.setProperty('--tg-on-primary',             hexFromArgb(scheme.onPrimary));
        scope.style.setProperty('--tg-secondary',              hexFromArgb(scheme.secondary));
        scope.style.setProperty('--tg-secondary-container',    hexFromArgb(scheme.secondaryContainer));
        scope.style.setProperty('--tg-tertiary',               hexFromArgb(scheme.tertiary));
        scope.style.setProperty('--tg-outline-variant',        hexFromArgb(scheme.outlineVariant));
        scope.style.setProperty('--tg-unread-bg',              hexFromArgb(scheme.primaryContainer));
        scope.style.setProperty('--tg-unread-fg',              hexFromArgb(scheme.onSurface));
    });
}

function applyMaterialThemeToUI(theme) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const scheme = isDark ? theme.schemes.dark : theme.schemes.light;
    const root = document.documentElement;
    root.style.setProperty('--m3-primary',                hexFromArgb(scheme.primary));
    root.style.setProperty('--m3-on-primary',             hexFromArgb(scheme.onPrimary));
    root.style.setProperty('--m3-primary-container',      hexFromArgb(scheme.primaryContainer));
    root.style.setProperty('--m3-on-primary-container',   hexFromArgb(scheme.onPrimaryContainer));
    root.style.setProperty('--m3-secondary',              hexFromArgb(scheme.secondary));
    root.style.setProperty('--m3-tertiary',               hexFromArgb(scheme.tertiary));
    root.style.setProperty('--m3-on-tertiary',            hexFromArgb(scheme.onTertiary));
    root.style.setProperty('--m3-tertiary-container',     hexFromArgb(scheme.tertiaryContainer));
    root.style.setProperty('--m3-on-tertiary-container',  hexFromArgb(scheme.onTertiaryContainer));
    root.style.setProperty('--m3-error',                  hexFromArgb(scheme.error));
    root.style.setProperty('--m3-neutral',                hexFromArgb(theme.palettes.neutral.tone(isDark ? 80 : 40)));
    root.style.setProperty('--m3-neutral-variant',        hexFromArgb(theme.palettes.neutralVariant.tone(isDark ? 80 : 40)));
    const _nvHex = hexFromArgb(theme.palettes.neutralVariant.tone(isDark ? 80 : 40));
    const _nvR = parseInt(_nvHex.slice(1,3), 16);
    const _nvG = parseInt(_nvHex.slice(3,5), 16);
    const _nvB = parseInt(_nvHex.slice(5,7), 16);
    root.style.setProperty('--m3-segmented-bg',           `rgba(${_nvR},${_nvG},${_nvB},0.12)`);
    root.style.setProperty('--m3-surface',                hexFromArgb(scheme.surface));
    root.style.setProperty('--m3-on-surface',             hexFromArgb(scheme.onSurface));
    root.style.setProperty('--m3-surface-container',      hexFromArgb(scheme.surfaceVariant));
    root.style.setProperty('--m3-on-surface-variant',     hexFromArgb(scheme.onSurfaceVariant));
    root.style.setProperty('--m3-inverse-surface',        hexFromArgb(scheme.inverseSurface));
    root.style.setProperty('--m3-inverse-on-surface',     hexFromArgb(scheme.inverseOnSurface));

    applyToMockup(scheme);

    const colorIndicator = document.querySelector('.color-picker-card .color-indicator');
    const colorHex = document.querySelector('.color-picker-card .color-hex');
    if (colorIndicator && colorHex) {
        const primaryHex = hexFromArgb(scheme.primary);
        colorIndicator.style.backgroundColor = primaryHex;
        colorHex.textContent = primaryHex.toUpperCase();
    }

    updateDynamicFavicon(
        hexFromArgb(scheme.primary),
        hexFromArgb(scheme.onPrimary)
    );
}

function getThemeForExport() {
    if (currentExtractedTheme) {
        return currentExtractedTheme;
    }

    const primaryHex = getComputedStyle(document.documentElement)
        .getPropertyValue('--m3-primary')
        .trim() || '#65558F';

    currentExtractedTheme = themeFromSourceColor(argbFromHex(primaryHex));
    return currentExtractedTheme;
}
function updateDynamicFavicon(bgHex, iconHex) {
    const faviconTag = document.getElementById('dynamic-favicon');
    if (!faviconTag) return;

    const bgScale = 192 / 380;
    const iconScale = 28 / 48;
    const iconOffset = (192 - (192 * iconScale)) / 2;

    const svgString = `<svg viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg" fill="none">
        <g transform="scale(${bgScale})">
            <path fill="${bgHex}" d="M166.697 39.8458C167.238 39.3157 167.508 39.0506 167.743 38.8298C180.246 27.0567 199.754 27.0567 212.257 38.8298C212.492 39.0506 212.762 39.3157 213.303 39.8458C213.628 40.1639 213.79 40.323 213.945 40.4703C221.945 48.1056 233.282 51.1433 244.028 48.5311C244.235 48.4807 244.456 48.4242 244.896 48.311C245.629 48.1224 245.996 48.0282 246.31 47.9542C263.024 44.0098 279.919 53.7642 284.86 70.2114C284.953 70.5199 285.055 70.8847 285.258 71.6143C285.38 72.0522 285.442 72.2711 285.502 72.4758C288.613 83.0884 296.912 91.3875 307.524 94.4985C307.729 94.5585 307.948 94.6195 308.386 94.7417C309.115 94.9452 309.48 95.0469 309.789 95.1396C326.236 100.081 335.99 116.976 332.046 133.69C331.972 134.004 331.878 134.371 331.689 135.104C331.576 135.544 331.519 135.765 331.469 135.972C328.857 146.718 331.894 158.055 339.53 166.055C339.677 166.21 339.836 166.372 340.154 166.697C340.684 167.238 340.949 167.508 341.17 167.743C352.943 180.246 352.943 199.754 341.17 212.257C340.949 212.492 340.684 212.762 340.154 213.303C339.836 213.628 339.677 213.79 339.53 213.945C331.894 221.945 328.857 233.282 331.469 244.028C331.519 244.235 331.576 244.456 331.689 244.896C331.878 245.629 331.972 245.996 332.046 246.31C335.99 263.024 326.236 279.919 309.789 284.86C309.48 284.953 309.115 285.055 308.386 285.258C307.948 285.381 307.729 285.442 307.524 285.502C296.912 288.613 288.613 296.912 285.502 307.524C285.442 307.729 285.381 307.948 285.258 308.386C285.055 309.115 284.953 309.48 284.86 309.789C279.919 326.236 263.024 335.99 246.31 332.046C245.996 331.972 245.629 331.878 244.896 331.689C244.456 331.576 244.235 331.519 244.028 331.469C233.282 328.857 221.945 331.894 213.945 339.53C213.79 339.677 213.628 339.836 213.303 340.154C212.762 340.684 212.492 340.949 212.257 341.17C199.754 352.943 180.246 352.943 167.743 341.17C167.508 340.949 167.238 340.684 166.697 340.154C166.372 339.836 166.21 339.677 166.055 339.53C158.055 331.894 146.718 328.857 135.972 331.469C135.765 331.519 135.544 331.576 135.104 331.689C134.371 331.878 134.004 331.972 133.69 332.046C116.976 335.99 100.081 326.236 95.1396 309.789C95.0469 309.48 94.9452 309.115 94.7417 308.386C94.6195 307.948 94.5585 307.729 94.4985 307.524C91.3875 296.912 83.0884 288.613 72.4758 285.502C72.2711 285.442 72.0522 285.38 71.6143 285.258C70.8847 285.055 70.5199 284.953 70.2114 284.86C53.7642 279.919 44.0098 263.024 47.9542 246.31C48.0282 245.996 48.1224 245.629 48.311 244.896C48.4242 244.456 48.4807 244.235 48.5311 244.028C51.1433 233.282 48.1056 221.945 40.4703 213.945C40.323 213.79 40.1639 213.628 39.8458 213.303C39.3157 212.762 39.0506 212.492 38.8298 212.257C27.0567 199.754 27.0567 180.246 38.8298 167.743C39.0506 167.508 39.3157 167.238 39.8458 166.697C40.1639 166.372 40.323 166.21 40.4703 166.055C48.1056 158.055 51.1433 146.718 48.5311 135.972C48.4807 135.765 48.4242 135.544 48.311 135.104C48.1224 134.371 48.0282 134.004 47.9542 133.69C44.0098 116.976 53.7642 100.081 70.2114 95.1396C70.5199 95.0469 70.8847 94.9452 71.6143 94.7417C72.0522 94.6195 72.2711 94.5585 72.4758 94.4985C83.0884 91.3875 91.3875 83.0884 94.4985 72.4758C94.5585 72.2711 94.6195 72.0522 94.7417 71.6143C94.9452 70.8847 95.0469 70.5199 95.1396 70.2114C100.081 53.7642 116.976 44.0098 133.69 47.9542C134.004 48.0282 134.371 48.1224 135.104 48.311C135.544 48.4242 135.765 48.4807 135.972 48.5311C146.718 51.1433 158.055 48.1056 166.055 40.4703C166.21 40.323 166.372 40.1639 166.697 39.8458Z"/>
        </g>
        <g transform="translate(${iconOffset} ${iconOffset}) scale(${iconScale})">
            <path stroke="${iconHex}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" d="M23.073 88.132s65.458-26.782 88.16-36.212c8.702-3.772 38.215-15.843 38.215-15.843s13.621-5.28 12.486 7.544c-.379 5.281-3.406 23.764-6.433 43.756-4.54 28.291-9.459 59.221-9.459 59.221s-.756 8.676-7.188 10.185c-6.433 1.509-17.027-5.281-18.919-6.79-1.513-1.132-28.377-18.106-38.214-26.404-2.649-2.263-5.676-6.79.378-12.071 13.621-12.447 29.891-27.913 39.728-37.72 4.54-4.527 9.081-15.089-9.837-2.264-26.864 18.483-53.35 35.835-53.35 35.835s-6.053 3.772-17.404.377c-11.351-3.395-24.594-7.921-24.594-7.921s-9.08-5.659 6.433-11.693Z"></path>
        </g>
    </svg>`;
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

    faviconTag.type = 'image/svg+xml';
    faviconTag.href = svgUrl;

    const shortcutFavicon = document.querySelector('link[rel="shortcut icon"]');
    if (shortcutFavicon) {
        shortcutFavicon.href = svgUrl;
        shortcutFavicon.type = 'image/svg+xml';
    }
}

async function getActiveWallpaperBlob(wallItems, uploadTriggerBtn) {
    const activePreset = Array.from(wallItems).find(item => item.classList.contains('active'));
    const activeUpload = uploadTriggerBtn.classList.contains('active') ? uploadTriggerBtn : null;
    const sourceElement = activeUpload || activePreset;

    if (!sourceElement) {
        return null;
    }

    const bgImage = window.getComputedStyle(sourceElement).backgroundImage;
    const wallpaperUrl = extractUrlFromBackgroundImage(bgImage);
    if (!wallpaperUrl) {
        return null;
    }

    try {
        const response = await fetch(wallpaperUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch wallpaper: ${response.status}`);
        }

        return await response.blob();
    } catch (error) {
        console.error('Desktop wallpaper export failed:', error);
        return null;
    }
}

function extractUrlFromBackgroundImage(backgroundImage) {
    const match = backgroundImage.match(/^url\((['"]?)(.*?)\1\)$/);
    return match ? match[2] : null;
}