(function () {
    // 注册 Service Worker 实现网络优先策略，解决 GitHub Pages 缓存问题
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    var navbar = document.getElementById('navbar');
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    var navBackdrop = document.getElementById('navBackdrop');
    var navCloseBtn = document.getElementById('navCloseBtn');
    var navDocsBtn = document.getElementById('navDocsBtn');

    // 导航栏滚动毛玻璃背景变化
    window.addEventListener('scroll', function () {
        if (window.scrollY > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    // 关闭移动端抽屉
    function closeMobileMenu() {
        if (!navToggle || !navLinks) return;
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
        if (navbar) navbar.classList.remove('menu-open');
        if (navBackdrop) navBackdrop.classList.remove('active');
        document.body.style.overflow = '';
    }

    // 打开移动端抽屉
    function openMobileMenu() {
        if (!navToggle || !navLinks) return;
        navToggle.classList.add('active');
        navLinks.classList.add('active');
        if (navbar) navbar.classList.add('menu-open');
        if (navBackdrop) navBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 移动端菜单切换
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            if (navLinks.classList.contains('active')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        if (navCloseBtn) {
            navCloseBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                closeMobileMenu();
            });
        }

        if (navBackdrop) {
            navBackdrop.addEventListener('click', closeMobileMenu);
        }

        // 点击导航链接自动关闭抽屉
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                closeMobileMenu();
            });
        });

        // 移动端点击文档下拉切换展开
        if (navDocsBtn) {
            navDocsBtn.addEventListener('click', function (e) {
                if (window.innerWidth <= 992) {
                    e.preventDefault();
                    var dropdown = navDocsBtn.closest('.nav-dropdown');
                    if (dropdown) dropdown.classList.toggle('open');
                }
            });
        }

        // ESC 按键关闭抽屉
        window.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                closeMobileMenu();
            }
        });

        // 点击导航抽屉外部任意区域自动关闭
        document.addEventListener('click', function (e) {
            if (navLinks.classList.contains('active')) {
                if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
                    closeMobileMenu();
                }
            }
        });
    }

    // 轻量现代 Toast 提示
    var toastTimer = null;
    function showToast(message, type) {
        var existingToast = document.getElementById('landingToast');
        if (existingToast) existingToast.remove();
        if (toastTimer) clearTimeout(toastTimer);

        var toast = document.createElement('div');
        toast.id = 'landingToast';
        toast.className = 'landing-toast ' + (type || 'success');
        toast.innerHTML = '<i class="fa-solid ' + (type === 'error' ? 'fa-circle-xmark' : 'fa-circle-check') + '"></i><span>' + message + '</span>';
        document.body.appendChild(toast);

        // 触发重绘以激活动画
        requestAnimationFrame(function () {
            toast.classList.add('show');
        });

        toastTimer = setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 2200);
    }

    // 全局一键复制逻辑
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-copy-target]');
        if (!btn) return;
        e.preventDefault();

        var targetSelector = btn.getAttribute('data-copy-target');
        var targetEl = document.querySelector(targetSelector);
        var textToCopy = '';

        if (targetEl) {
            textToCopy = targetEl.textContent.trim();
        } else if (btn.getAttribute('data-copy-text')) {
            textToCopy = btn.getAttribute('data-copy-text');
        }

        if (!textToCopy) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(function () {
                var originalHtml = btn.innerHTML;
                btn.classList.add('copied');
                btn.innerHTML = '<i class="fa-solid fa-check"></i> <span>已复制</span>';
                showToast('已复制命令到剪贴板！');
                setTimeout(function () {
                    btn.classList.remove('copied');
                    btn.innerHTML = originalHtml;
                }, 2000);
            }).catch(function () {
                fallbackCopy(textToCopy, btn);
            });
        } else {
            fallbackCopy(textToCopy, btn);
        }
    });

    function fallbackCopy(text, btn) {
        try {
            var textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('已复制命令到剪贴板！');
            var originalHtml = btn.innerHTML;
            btn.classList.add('copied');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> <span>已复制</span>';
            setTimeout(function () {
                btn.classList.remove('copied');
                btn.innerHTML = originalHtml;
            }, 2000);
        } catch (_) {
            showToast('复制失败，请手动选取代码复制', 'error');
        }
    }

    // 视口动态交错淡入 Reveal Observer
    var observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    document
        .querySelectorAll('.arch-card, .feature-card, .scrolls-banner, .screenshot-card, .step-card, .terminal-box, .plugin-card')
        .forEach(function (el, i) {
            el.style.transitionDelay = (i % 4) * 0.08 + 's';
            observer.observe(el);
        });
})();
