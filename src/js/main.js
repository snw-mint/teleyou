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
    });
});
    const wallItems = document.querySelectorAll('.wall-item:not(.upload-btn)');
    wallItems.forEach(item => {
        item.addEventListener('click', () => {
            wallItems.forEach(w => w.classList.remove('active'));
            item.classList.add('active');
        });
    });