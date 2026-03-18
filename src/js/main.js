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
        } else {
            rootElement.setAttribute('data-theme', 'dark');
            iconSun.style.display = 'block';
            iconMoon.style.display = 'none';
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
    root.style.setProperty('--m3-surface', hexFromArgb(scheme.surface));
    root.style.setProperty('--m3-on-surface', hexFromArgb(scheme.onSurface));
    root.style.setProperty('--m3-surface-container', hexFromArgb(scheme.surfaceVariant));
    root.style.setProperty('--m3-on-surface-variant', hexFromArgb(scheme.onSurfaceVariant));

    const colorIndicator = document.querySelector('.color-picker-card .color-indicator');
    const colorHex = document.querySelector('.color-picker-card .color-hex');
    
    if (colorIndicator && colorHex) {
        const primaryHex = hexFromArgb(scheme.primary);
        colorIndicator.style.backgroundColor = primaryHex;
        colorHex.textContent = primaryHex.toUpperCase();
    }
}