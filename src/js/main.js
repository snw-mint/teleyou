import { sourceColorFromImage, themeFromSourceColor, hexFromArgb, argbFromHex, Hct, Blend, TonalPalette } from '@material/material-color-utilities';
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
// ==========================================
    // COMPILADOR DE TEMAS: TELEGRAM MOBILE
    // ==========================================

    const exportMobileBtn = document.getElementById('export-mobile-btn');

    // 1. COLE O CONTEÚDO DOS ARQUIVOS AQUI DENTRO DAS CRASES
    const telemoneDarkTemplate = `COLE_O_CONTEUDO_DO_defaultDarkFile.attheme_AQUI`;
    
    const telemoneLightTemplate = `COLE_O_CONTEUDO_DO_defaultLightFile.attheme_AQUI`;

    // 2. Dicionário de Fallbacks extraído do ThemeRepository.kt do Telemone
    const telemoneFallbacks = {
        "chat_inAdminText": "chat_inTimeText", "chat_inAdminSelectedText": "chat_inTimeSelectedText", "player_progressCachedBackground": "player_progressBackground", "chat_inAudioCacheSeekbar": "chat_inAudioSeekbar", "chat_outAudioCacheSeekbar": "chat_outAudioSeekbar", "chat_emojiSearchBackground": "chat_emojiPanelStickerPackSelector", "location_sendLiveLocationIcon": "location_sendLocationIcon", "changephoneinfo_image2": "featuredStickers_addButton", "graySectionText": "windowBackgroundWhiteGrayText2", "chat_inMediaIcon": "chat_inBubble", "chat_outMediaIcon": "chat_outBubble", "chat_inMediaIconSelected": "chat_inBubbleSelected", "chat_outMediaIconSelected": "chat_outBubbleSelected", "chats_actionUnreadIcon": "profile_actionIcon", "chats_actionUnreadBackground": "profile_actionBackground", "chats_actionUnreadPressedBackground": "profile_actionPressedBackground", "dialog_inlineProgressBackground": "windowBackgroundGray", "dialog_inlineProgress": "chats_menuItemIcon", "groupcreate_spanDelete": "chats_actionIcon", "sharedMedia_photoPlaceholder": "windowBackgroundGray", "chat_attachPollBackground": "chat_attachAudioBackground", "chat_attachPollIcon": "chat_attachAudioIcon", "chats_onlineCircle": "windowBackgroundWhiteBlueText", "windowBackgroundWhiteBlueButton": "windowBackgroundWhiteValueText", "windowBackgroundWhiteBlueIcon": "windowBackgroundWhiteValueText", "undo_background": "chat_gifSaveHintBackground", "undo_cancelColor": "chat_gifSaveHintText", "undo_infoColor": "chat_gifSaveHintText", "windowBackgroundUnchecked": "windowBackgroundWhite", "windowBackgroundChecked": "windowBackgroundWhite", "switchTrackBlue": "switchTrack", "switchTrackBlueChecked": "switchTrackChecked", "switchTrackBlueThumb": "windowBackgroundWhite", "switchTrackBlueThumbChecked": "windowBackgroundWhite", "windowBackgroundCheckText": "windowBackgroundWhite", "contextProgressInner4": "contextProgressInner1", "contextProgressOuter4": "contextProgressOuter1", "switchTrackBlueSelector": "listSelector", "switchTrackBlueSelectorChecked": "listSelector", "chat_emojiBottomPanelIcon": "chat_emojiPanelIcon", "chat_emojiSearchIcon": "chat_emojiPanelIcon", "chat_emojiPanelStickerSetNameHighlight": "windowBackgroundWhiteBlueText4", "chat_emojiPanelStickerPackSelectorLine": "chat_emojiPanelIconSelected", "sharedMedia_actionMode": "actionBarDefault", "sheet_scrollUp": "chat_emojiPanelStickerPackSelector", "sheet_other": "player_actionBarItems", "dialogSearchBackground": "chat_emojiPanelStickerPackSelector", "dialogSearchHint": "chat_emojiPanelIcon", "dialogSearchIcon": "chat_emojiPanelIcon", "dialogSearchText": "windowBackgroundWhiteBlackText", "dialogFloatingButtonPressed": "dialogRoundCheckBox", "dialogFloatingIcon": "dialogRoundCheckBoxCheck", "dialogShadowLine": "chat_emojiPanelShadowLine", "chat_emojiPanelIconSelector": "listSelector", "actionBarDefaultArchived": "actionBarDefault", "actionBarDefaultArchivedSelector": "actionBarDefaultSelector", "actionBarDefaultArchivedIcon": "actionBarDefaultIcon", "actionBarDefaultArchivedTitle": "actionBarDefaultTitle", "actionBarDefaultArchivedSearch": "actionBarDefaultSearch", "actionBarDefaultArchivedSearchPlaceholder": "actionBarDefaultSearchPlaceholder", "chats_message_threeLines": "chats_message", "chats_nameMessage_threeLines": "chats_nameMessage", "chats_nameArchived": "chats_name", "chats_nameMessageArchived": "chats_nameMessage", "chats_nameMessageArchived_threeLines": "chats_nameMessage", "chats_messageArchived": "chats_message", "avatar_backgroundArchived": "chats_unreadCounterMuted", "chats_archiveBackground": "chats_actionBackground", "chats_archivePinBackground": "chats_unreadCounterMuted", "chats_archiveIcon": "chats_actionIcon", "chats_archiveText": "chats_actionIcon", "actionBarDefaultSubmenuItemIcon": "dialogIcon", "checkboxDisabled": "chats_unreadCounterMuted", "chat_status": "actionBarDefaultSubtitle", "chat_inGreenCall": "calls_callReceivedGreenIcon", "chat_inRedCall": "calls_callReceivedRedIcon", "chat_outGreenCall": "calls_callReceivedGreenIcon", "actionBarTabActiveText": "actionBarDefaultTitle", "actionBarTabUnactiveText": "actionBarDefaultSubtitle", "actionBarTabLine": "actionBarDefaultTitle", "actionBarTabSelector": "actionBarDefaultSelector", "profile_status": "avatar_subtitleInProfileBlue", "chats_menuTopBackgroundCats": "avatar_backgroundActionBarBlue", "chat_outLinkSelectBackground": "chat_linkSelectBackground", "actionBarDefaultSubmenuSeparator": "windowBackgroundGray", "chat_attachPermissionImage": "dialogTextBlack", "chat_attachPermissionMark": "chat_sentError", "chat_attachPermissionText": "dialogTextBlack", "chat_attachEmptyImage": "emptyListPlaceholder", "actionBarBrowser": "actionBarDefault", "chats_sentReadCheck": "chats_sentCheck", "chat_outSentCheckRead": "chat_outSentCheck", "chat_outSentCheckReadSelected": "chat_outSentCheckSelected", "chats_archivePullDownBackground": "chats_unreadCounterMuted", "chats_archivePullDownBackgroundActive": "chats_actionBackground", "avatar_backgroundArchivedHidden": "avatar_backgroundSaved", "featuredStickers_removeButtonText": "featuredStickers_addButtonPressed", "dialogEmptyImage": "player_time", "dialogEmptyText": "player_time", "location_actionIcon": "dialogTextBlack", "location_actionActiveIcon": "windowBackgroundWhiteBlueText7", "location_actionBackground": "dialogBackground", "location_actionPressedBackground": "dialogBackgroundGray", "location_sendLocationText": "windowBackgroundWhiteBlueText7", "location_sendLiveLocationText": "windowBackgroundWhiteGreenText", "chat_outTextSelectionHighlight": "chat_textSelectBackground", "chat_inTextSelectionHighlight": "chat_textSelectBackground", "chat_TextSelectionCursor": "chat_messagePanelCursor", "chat_outTextSelectionCursor": "chat_TextSelectionCursor", "chat_inPollCorrectAnswer": "chat_attachLocationBackground", "chat_outPollCorrectAnswer": "chat_attachLocationBackground", "chat_inPollWrongAnswer": "chat_attachAudioBackground", "chat_outPollWrongAnswer": "chat_attachAudioBackground", "windowBackgroundWhiteYellowText": "avatar_nameInMessageOrange", "profile_tabText": "windowBackgroundWhiteGrayText", "profile_tabSelectedText": "windowBackgroundWhiteBlueHeader", "profile_tabSelectedLine": "windowBackgroundWhiteBlueHeader", "profile_tabSelector": "listSelector", "statisticChartPopupBackground": "dialogBackground", "chat_attachGalleryText": "chat_attachGalleryBackground", "chat_attachAudioText": "chat_attachAudioBackground", "chat_attachFileText": "chat_attachFileBackground", "chat_attachContactText": "chat_attachContactBackground", "chat_attachLocationText": "chat_attachLocationBackground", "chat_attachPollText": "chat_attachPollBackground", "chat_inPsaNameText": "avatar_nameInMessageGreen", "chat_outPsaNameText": "avatar_nameInMessageGreen", "chat_outAdminText": "chat_outTimeText", "chat_outAdminSelectedText": "chat_outTimeSelectedText", "returnToCallMutedBackground": "windowBackgroundWhite", "dialogSwipeRemove": "avatar_backgroundRed", "chat_inReactionButtonBackground": "chat_inLoader", "chat_outReactionButtonBackground": "chat_outLoader", "chat_inReactionButtonText": "chat_inPreviewInstantText", "chat_outReactionButtonText": "chat_outPreviewInstantText", "chat_inReactionButtonTextSelected": "windowBackgroundWhite", "chat_outReactionButtonTextSelected": "windowBackgroundWhite", "dialogReactionMentionBackground": "voipgroup_mutedByAdminGradient2", "topics_unreadCounter": "chats_unreadCounter", "topics_unreadCounterMuted": "chats_message", "avatar_background2Saved": "avatar_backgroundSaved", "avatar_background2Red": "avatar_backgroundRed", "avatar_background2Orange": "avatar_backgroundOrange", "avatar_background2Violet": "avatar_backgroundViolet", "avatar_background2Green": "avatar_backgroundGreen", "avatar_background2Cyan": "avatar_backgroundCyan", "avatar_background2Blue": "avatar_backgroundBlue", "avatar_background2Pink": "avatar_backgroundPink", "statisticChartLine_orange": "color_orange", "statisticChartLine_blue": "color_blue", "statisticChartLine_red": "color_red", "statisticChartLine_lightblue": "color_lightblue", "statisticChartLine_golden": "color_yellow", "statisticChartLine_purple": "color_purple", "statisticChartLine_indigo": "color_purple", "statisticChartLine_cyan": "color_cyan"
    };

    exportMobileBtn.addEventListener('click', () => {
        if (!currentExtractedTheme) {
            alert('Selecione um papel de parede primeiro!');
            return;
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const palettes = currentExtractedTheme.palettes;
        const sourceColor = currentExtractedTheme.source; // Semente para harmonização

        // O Telegram exige Signed 32-bit Integers para as cores
        const toSigned32 = (argb) => (argb | 0).toString();

        // Cores base do Kotlin do Telemone para mesclagem de tons secundários
        const customBases = {
            blue: '#0000FF', red: '#FF0000', green: '#00FF00',
            orange: '#FFAA00', violet: '#EB00FF', pink: '#FF32AC', cyan: '#14AAAC'
        };

        // O COMPILADOR DE TOKENS
        const resolveToken = (token) => {
            if (!token || token === 'transparent') return '0';
            if (token === 'white') return toSigned32(0xFFFFFFFF);
            if (token === 'black') return toSigned32(0xFF000000);

            // 1. Processa Roles do tipo: "surface_container_dark" ou "on_primary_light"
            const roleMatch = token.match(/^(.*)_(dark|light)$/);
            if (roleMatch) {
                // Converte snake_case para camelCase (ex: surface_container -> surfaceContainer)
                let roleName = roleMatch[1].replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                const targetScheme = roleMatch[2] === 'dark' ? currentExtractedTheme.schemes.dark : currentExtractedTheme.schemes.light;
                if (targetScheme[roleName] !== undefined) return toSigned32(targetScheme[roleName]);
            }

            // 2. Processa Tones exatos: "primary_50", "neutral_variant_20", "cyan_80"
            const toneMatch = token.match(/^(.*)_(\d+)$/);
            if (toneMatch) {
                let paletteName = toneMatch[1].replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                const toneValue = parseInt(toneMatch[2], 10);

                if (palettes[paletteName]) {
                    return toSigned32(palettes[paletteName].tone(toneValue));
                } else if (customBases[paletteName]) {
                    // Reproduz a harmonização exata do Palette.kt do Telemone
                    const baseArgb = argbFromHex(customBases[paletteName]);
                    const harmonized = Blend.harmonize(baseArgb, sourceColor);
                    return toSigned32(TonalPalette.fromInt(harmonized).tone(toneValue));
                }
            }
            
            console.warn("Ignorado pelo Compilador:", token);
            return '0';
        };

        // Extrai linha por linha do Template
        const templateString = isDark ? telemoneDarkTemplate : telemoneLightTemplate;
        const parsedTheme = {};

        templateString.split('\n').forEach(line => {
            if (!line || !line.includes('=')) return;
            
            // Remove lixo de formatação como 
            const cleanLine = line.replace(/\[.*?\]\s*/, '').trim();
            const [key, token] = cleanLine.split('=');
            if (key && token) parsedTheme[key] = resolveToken(token);
        });

        // Aplica os Fallbacks (Se uma variável faltar, copia o valor da sua correspondente)
        for (const [source, target] of Object.entries(telemoneFallbacks)) {
            if (parsedTheme[target] !== undefined && parsedTheme[source] === undefined) {
                parsedTheme[source] = parsedTheme[target];
            }
        }

        // Reconstrói o arquivo TDesktop
        let themeContent = '';
        for (const [key, value] of Object.entries(parsedTheme)) {
            themeContent += `${key}=${value}\n`;
        }

        // Exportação Nativa
        const blob = new Blob([themeContent], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const modeName = isDark ? 'Dark' : 'Light';
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `FluentYou_${modeName}.attheme`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
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