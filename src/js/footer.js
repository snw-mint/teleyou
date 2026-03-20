import version from '../../version.json' with { type: 'json' };

const REPO_URL   = `https://github.com/${version.author}/teleyou`;
const AUTHOR_URL = `https://github.com/${version.author}`;

const IS_GENERATOR = !!document.getElementById('loader-overlay');

function buildDivider() {
    const wrap = document.createElement('div');
    wrap.className = 'app-footer-divider';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = `
        <svg viewBox="0 0 1000 12" preserveAspectRatio="none"
             xmlns="http://www.w3.org/2000/svg">
            <path
                d="M0 6
                   C 50 2, 100 10, 150 6
                   C 200 2, 250 10, 300 6
                   C 350 2, 400 10, 450 6
                   C 500 2, 550 10, 600 6
                   C 650 2, 700 10, 750 6
                   C 800 2, 850 10, 900 6
                   C 950 2, 1000 10, 1000 6"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                style="color: var(--m3-neutral-variant); opacity: 0.45;"
            />
        </svg>
    `;
    return wrap;
}

function buildFooter() {
    const el = document.createElement('footer');
    el.className = 'app-footer';
    el.innerHTML = `
        <div class="app-footer-inner">
            <div class="footer-left">
                <div class="footer-copyright">
                    <span>©&nbsp;${version.year}</span>
                    <a href="${AUTHOR_URL}" target="_blank" rel="noopener noreferrer">Snow Mint ✦</a>
                    <span>·</span>
                    <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer">TeleYou</a>
                    <span>·</span>
                    <span>MIT License</span>
                </div>
                <div class="footer-version">v${version.version}</div>
            </div>
            <nav class="footer-links" aria-label="Footer links">
                <a href="./help.html" class="footer-link">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                        <path d="M478-240q21 0 35.5-14.5T528-290q0-21-14.5-35.5T478-340q-21 0-35.5 14.5T428-290q0 21 14.5 35.5T478-240Zm-36-154h74q0-36 8-53t44-47q35-35 49.5-58.5T632-572q0-60-42.5-96T480-704q-53 0-95.5 28.5T322-594l66 26q14-31 37.5-47.5T480-632q32 0 52 18t20 46q0 21-12 39.5T508-487q-54 47-63 70t-3 63Zm38 314q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                    </svg>
                    Need help?
                </a>
                <div class="footer-link-sep" aria-hidden="true"></div>
                <a href="./privacy.html" class="footer-link">Privacy</a>
                <div class="footer-link-sep" aria-hidden="true"></div>
                <a href="./terms.html" class="footer-link">Terms</a>
                <div class="footer-link-sep" aria-hidden="true"></div>
                <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer" class="footer-link">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .839-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                    GitHub
                </a>
            </nav>
        </div>
    `;
    return el;
}

function inject(target) {
    target.appendChild(buildDivider());
    target.appendChild(buildFooter());
}

if (IS_GENERATOR) {
    const container = document.getElementById('app-container');
    const obs = new MutationObserver(() => {
        if (container.style.display !== 'none') {
            inject(container);
            obs.disconnect();
        }
    });
    obs.observe(container, { attributes: true, attributeFilter: ['style'] });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        inject(document.body);
    });
}
