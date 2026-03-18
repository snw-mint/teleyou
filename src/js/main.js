import { sourceColorFromImage, themeFromSourceColor, hexFromArgb, argbFromHex } from '@material/material-color-utilities';

let currentExtractedTheme = null;

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
    

    themeBtn.addEventListener('click', () => {
        const rootElement = document.documentElement;
        const isDark = rootElement.getAttribute('data-theme') === 'dark';
        
        if (isDark) {
            rootElement.setAttribute('data-theme', 'light');
            iconSun.style.display = 'none';
            iconMoon.style.display = 'block';
            themeBtn.setAttribute('data-tooltip', 'Switch to dark theme');
        } else {
            rootElement.setAttribute('data-theme', 'dark');
            iconSun.style.display = 'block';
            iconMoon.style.display = 'none';
            themeBtn.setAttribute('data-tooltip', 'Switch to light theme');
        }

        if (currentExtractedTheme) {
            applyMaterialThemeToUI(currentExtractedTheme);
        }
    });

    const wallItems = document.querySelectorAll('.wall-item:not(.upload-btn)');
    const uploadTriggerBtn = document.getElementById('upload-trigger-btn');
    const imageUploadInput = document.getElementById('image-upload-input');
    const randomizeColorBtn = document.querySelector('.color-picker-card .small-btn');

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
        
        currentExtractedTheme = themeFromSourceColor(sourceColorArgb);
        applyMaterialThemeToUI(currentExtractedTheme);
    });

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
function applyMaterialThemeToUI(theme) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const scheme = isDark ? theme.schemes.dark : theme.schemes.light;
    const root = document.documentElement;
    root.style.setProperty('--m3-primary', hexFromArgb(scheme.primary));
    root.style.setProperty('--m3-on-primary', hexFromArgb(scheme.onPrimary));
    root.style.setProperty('--m3-primary-container', hexFromArgb(scheme.primaryContainer));
    root.style.setProperty('--m3-on-primary-container', hexFromArgb(scheme.onPrimaryContainer));
    root.style.setProperty('--m3-secondary', hexFromArgb(scheme.secondary));
    root.style.setProperty('--m3-tertiary', hexFromArgb(scheme.tertiary));
    root.style.setProperty('--m3-error', hexFromArgb(scheme.error));
    root.style.setProperty('--m3-neutral', hexFromArgb(scheme.outline));
    root.style.setProperty('--m3-neutral-variant', hexFromArgb(scheme.outlineVariant));
    root.style.setProperty('--m3-surface', hexFromArgb(scheme.surface));
    root.style.setProperty('--m3-on-surface', hexFromArgb(scheme.onSurface));
    root.style.setProperty('--m3-surface-container', hexFromArgb(scheme.surfaceVariant));
    root.style.setProperty('--m3-on-surface-variant', hexFromArgb(scheme.onSurfaceVariant));
    root.style.setProperty('--m3-secondary', hexFromArgb(scheme.secondary));
    root.style.setProperty('--m3-tertiary', hexFromArgb(scheme.tertiary));
    root.style.setProperty('--m3-on-tertiary', hexFromArgb(scheme.onTertiary));
    root.style.setProperty('--m3-tertiary-container', hexFromArgb(scheme.tertiaryContainer));
    root.style.setProperty('--m3-on-tertiary-container', hexFromArgb(scheme.onTertiaryContainer));
    root.style.setProperty('--m3-error', hexFromArgb(scheme.error));
    root.style.setProperty('--m3-inverse-surface', hexFromArgb(scheme.inverseSurface));
    root.style.setProperty('--m3-inverse-on-surface', hexFromArgb(scheme.inverseOnSurface));
    const colorIndicator = document.querySelector('.color-picker-card .color-indicator');
    const colorHex = document.querySelector('.color-picker-card .color-hex');
    if (colorIndicator && colorHex) {
        const primaryHex = hexFromArgb(scheme.primary);
        colorIndicator.style.backgroundColor = primaryHex;
        colorHex.textContent = primaryHex.toUpperCase();
    }

}