const state = {
    lang: localStorage.getItem('scroll_doc_lang') || 'zh',
    activeSection: 'intro'
};

const UI = {
    docContent: null,
    tocNav: null,
    btnZh: null,
    btnEn: null,
    sidebar: null,
    sidebarBackdrop: null,
    sidebarToggle: null,
    sidebarClose: null,
    mainContainer: null,
    toast: null,
    toastMsg: null
};

let toastTimer = null;

function getDocData() {
    if (typeof docContentData !== 'undefined') {
        return docContentData;
    }
    if (typeof window !== 'undefined' && window.docContentData) {
        return window.docContentData;
    }
    return null;
}

function initUI() {
    UI.docContent = document.getElementById('doc-content');
    UI.tocNav = document.getElementById('toc-nav');
    UI.btnZh = document.getElementById('btn-zh');
    UI.btnEn = document.getElementById('btn-en');
    UI.sidebar = document.getElementById('sidebar');
    UI.sidebarBackdrop = document.getElementById('sidebar-backdrop');
    UI.sidebarToggle = document.getElementById('sidebar-toggle');
    UI.sidebarClose = document.getElementById('sidebar-close');
    UI.mainContainer = document.getElementById('main-container');
    UI.toast = document.getElementById('doc-toast');
    UI.toastMsg = document.getElementById('doc-toast-msg');
}

function showToast(msg, duration = 2200) {
    if (!UI.toast) return;
    if (UI.toastMsg) UI.toastMsg.textContent = msg;
    UI.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        UI.toast.classList.remove('show');
    }, duration);
}

function openSidebar() {
    if (UI.sidebar) UI.sidebar.classList.add('show');
    if (UI.sidebarBackdrop) UI.sidebarBackdrop.classList.add('show');
    document.body.classList.add('sidebar-open');
}

function closeSidebar() {
    if (UI.sidebar) UI.sidebar.classList.remove('show');
    if (UI.sidebarBackdrop) UI.sidebarBackdrop.classList.remove('show');
    document.body.classList.remove('sidebar-open');
}

function init() {
    initUI();
    updateLangButtons();
    render();
    setupEventListeners();
    setupScrollSpy();
}

function updateLangButtons() {
    if (UI.btnZh) UI.btnZh.classList.toggle('active', state.lang === 'zh');
    if (UI.btnEn) UI.btnEn.classList.toggle('active', state.lang === 'en');
    const titleEl = document.getElementById('sidebar-title');
    const subEl = document.getElementById('sidebar-sub');
    if (titleEl) {
        titleEl.textContent = state.lang === 'en' ? 'Scroll Dev Guide' : '卷轴开发手册';
    }
    if (subEl) {
        subEl.textContent = state.lang === 'en' ? 'Developer Manual' : 'Scroll Dev Guide';
    }
}

function render() {
    const rawData = getDocData();
    if (!rawData) {
        console.warn('Doc data not available yet');
        return;
    }

    const data = rawData[state.lang] || rawData['zh'] || rawData['en'] || Object.values(rawData)[0];
    if (!data || !data.sections) return;

    // Render TOC
    if (UI.tocNav) {
        UI.tocNav.innerHTML = data.sections.map(s => `
            <a href="#section-${s.id}" class="nav-link ${state.activeSection === s.id ? 'active' : ''}" data-id="${s.id}">
                <i class="fa-solid fa-fw ${s.icon}"></i>
                <span class="text-truncate">${s.title}</span>
            </a>
        `).join('');
    }

    // Render Content
    if (UI.docContent) {
        UI.docContent.innerHTML = data.sections.map(s => `
            <section id="section-${s.id}" class="doc-section mb-5">
                <div class="d-flex align-items-center mb-4">
                    <div class="section-icon-box bg-purple-box text-purple rounded-4 d-flex align-items-center justify-content-center me-3 shadow-sm flex-shrink-0" style="width: 52px; height: 52px;">
                        <i class="fa-solid ${s.icon}" style="font-size: 1.45rem;"></i>
                    </div>
                    <div>
                        <h3 class="fw-bold m-0 tracking-tight">${s.title}</h3>
                        <p class="text-muted small m-0 mt-1 opacity-75">${s.description || ''}</p>
                    </div>
                </div>
                <div class="section-body">
                    ${s.content}
                </div>
                <hr class="my-5 opacity-10" style="border-color: var(--c-border);">
            </section>
        `).join('');
    }

    // Re-highlight code safely
    try {
        if (window.Prism && Prism.highlightAll) {
            Prism.highlightAll();
        }
    } catch (e) {
        console.warn('Prism highlight error:', e);
    }

    // Enhance code blocks with copy buttons
    try {
        setupCodeCopyButtons();
    } catch (e) {
        console.warn('Code copy button setup error:', e);
    }
}

function setupCodeCopyButtons() {
    const copyLabel = state.lang === 'zh' ? '复制' : 'Copy';
    const copiedLabel = state.lang === 'zh' ? '已复制' : 'Copied';
    const toastCopySuccess = state.lang === 'zh' ? '代码已复制到剪贴板' : 'Code copied to clipboard';

    // 1. Process structured wrappers
    document.querySelectorAll('.code-block-wrapper').forEach(wrapper => {
        let header = wrapper.querySelector('.code-header');
        if (!header) {
            header = document.createElement('div');
            header.className = 'code-header d-flex justify-content-between align-items-center px-3 py-2 small bg-dark bg-opacity-10 border-bottom';
            header.innerHTML = `<span class="fw-bold opacity-75">Code</span>`;
            wrapper.prepend(header);
        }

        // Avoid adding duplicate copy button
        if (header.querySelector('.copy-btn')) return;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn ms-auto';
        copyBtn.setAttribute('type', 'button');
        copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i><span>${copyLabel}</span>`;

        copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const pre = wrapper.querySelector('pre');
            const code = pre ? (pre.querySelector('code') || pre).textContent : '';
            if (!code) return;

            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(code);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = code;
                    ta.style.position = 'fixed';
                    ta.style.left = '-9999px';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = `<i class="fa-solid fa-check"></i><span>${copiedLabel}</span>`;
                showToast(toastCopySuccess);
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i><span>${copyLabel}</span>`;
                }, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
            }
        });

        header.appendChild(copyBtn);
    });

    // 2. Process standalone pre elements not inside .code-block-wrapper
    document.querySelectorAll('.doc-section pre').forEach(pre => {
        if (pre.closest('.code-block-wrapper') || pre.querySelector('.copy-btn') || (pre.parentElement && pre.parentElement.querySelector('.copy-btn-floating'))) return;

        const container = pre.parentElement;
        if (!container) return;
        if (window.getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn copy-btn-floating';
        copyBtn.style.cssText = 'position: absolute; top: 12px; right: 12px; z-index: 5;';
        copyBtn.setAttribute('type', 'button');
        copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i><span>${copyLabel}</span>`;

        copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const code = (pre.querySelector('code') || pre).textContent;
            if (!code) return;
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(code);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = code;
                    ta.style.position = 'fixed';
                    ta.style.left = '-9999px';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = `<i class="fa-solid fa-check"></i><span>${copiedLabel}</span>`;
                showToast(toastCopySuccess);
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i><span>${copyLabel}</span>`;
                }, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
            }
        });

        container.appendChild(copyBtn);
    });
}

function setupEventListeners() {
    if (UI.btnZh) {
        UI.btnZh.addEventListener('click', () => {
            if (state.lang === 'zh') return;
            state.lang = 'zh';
            localStorage.setItem('scroll_doc_lang', 'zh');
            updateLangButtons();
            render();
        });
    }

    if (UI.btnEn) {
        UI.btnEn.addEventListener('click', () => {
            if (state.lang === 'en') return;
            state.lang = 'en';
            localStorage.setItem('scroll_doc_lang', 'en');
            updateLangButtons();
            render();
        });
    }

    if (UI.sidebarToggle) {
        UI.sidebarToggle.addEventListener('click', () => {
            if (UI.sidebar && UI.sidebar.classList.contains('show')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    if (UI.sidebarClose) {
        UI.sidebarClose.addEventListener('click', closeSidebar);
    }

    if (UI.sidebarBackdrop) {
        UI.sidebarBackdrop.addEventListener('click', closeSidebar);
    }

    // Keyboard ESC closes sidebar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSidebar();
        }
    });

    // TOC click
    if (UI.tocNav) {
        UI.tocNav.addEventListener('click', (e) => {
            const link = e.target.closest('.nav-link');
            if (link) {
                closeSidebar();
                const targetId = link.getAttribute('href');
                if (targetId && targetId.startsWith('#')) {
                    const targetEl = document.querySelector(targetId);
                    if (targetEl && UI.mainContainer) {
                        e.preventDefault();
                        const topPos = targetEl.offsetTop - 20;
                        UI.mainContainer.scrollTo({ top: topPos, behavior: 'smooth' });
                    }
                }
            }
        });
    }
}

function setupScrollSpy() {
    if (!UI.mainContainer) return;

    let ticking = false;
    const onScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const sections = document.querySelectorAll('.doc-section');
                const scrollPos = UI.mainContainer.scrollTop + 140;

                let currentId = '';
                sections.forEach(sec => {
                    if (sec.offsetTop <= scrollPos) {
                        currentId = sec.id.replace('section-', '');
                    }
                });

                if (currentId && currentId !== state.activeSection) {
                    state.activeSection = currentId;
                    updateActiveToc();
                }
                ticking = false;
            });
            ticking = true;
        }
    };

    UI.mainContainer.addEventListener('scroll', onScroll, { passive: true });
}

function updateActiveToc() {
    if (!UI.tocNav) return;
    UI.tocNav.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.id === state.activeSection);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
