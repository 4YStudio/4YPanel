import { ref } from '/js/vue.esm-browser.js';
import { store } from './store.js';
import { messages } from './i18n.js';

// Simple translation helper for non-component files
export const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = messages[store.lang];
    for (const k of keys) {
        value = value?.[k];
        if (!value) return key;
    }
    if (typeof value === 'string') {
        return value.replace(/{(\w+)}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
    }
    return value;
};

export const toasts = ref([]);

export const removeToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id);
};

export const showToast = (msg, type = 'success', params = {}) => {
    const id = Date.now();
    // Try to translate if it's a key, otherwise keep as is
    const translatedMsg = t(msg, params);
    // If t() returns the key itself (meaning no translation found) and msg has spaces, 
    // it's likely a hardcoded string, so just show it. 
    // But t() returns key if not found, so this logic is built-in to t() kind of, 
    // except t() splits by dot.
    // Let's just blindly try t(). If msg is "Error fetching", t("Error fetching") 
    // might look for messages["Error fetching"], which won't exist, so it returns "Error fetching".
    // This enables backward compatibility for hardcoded strings.

    toasts.value.push({ id, message: translatedMsg, type });
    setTimeout(() => removeToast(id), 3000);
};

// 纯净 Minecraft 玩家名称安全过滤
export const sanitizePlayerName = (name) => {
    if (!name || typeof name !== 'string') return '';
    let clean = name
        .replace(/(?:\x1b|\u001b|\u00a4|\u00a7)\[[0-9;]*[a-zA-Z]/g, '')
        .replace(/(?:§|¤|\u00a7|\u00a4)[0-9a-fk-orA-FK-OR]/gi, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim();
    const match = clean.match(/([a-zA-Z0-9_.*-]+)$/);
    if (match) clean = match[1];
    return clean.replace(/^[^\w.*-]+|[^\w.*-]+$/g, '').trim();
};

export const formatLog = (log) => {
    if (!log) return '';
    // 1. 转义基础 HTML 实体，避免 XSS
    let escaped = log.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // 2. 将变体转义符 (如 ¤[...m 或 §[...m) 统一转为标准 ANSI 格式 \x1b[...m
    escaped = escaped.replace(/(?:¤|§|\u00a4|\u00a7)\[/g, '\x1b[');

    // 3. 将 Minecraft 原生 § / ¤ 颜色与排版样式转换为等效的 ANSI 序列
    const mcAnsiMap = {
        '0': '\x1b[30m', '1': '\x1b[34m', '2': '\x1b[32m', '3': '\x1b[36m',
        '4': '\x1b[31m', '5': '\x1b[35m', '6': '\x1b[33m', '7': '\x1b[37m',
        '8': '\x1b[90m', '9': '\x1b[94m', 'a': '\x1b[92m', 'b': '\x1b[96m',
        'c': '\x1b[91m', 'd': '\x1b[95m', 'e': '\x1b[93m', 'f': '\x1b[97m',
        'l': '\x1b[1m',  'm': '\x1b[9m',  'n': '\x1b[4m',  'o': '\x1b[3m',
        'r': '\x1b[0m'
    };
    escaped = escaped.replace(/(?:§|¤|\u00a7|\u00a4)([0-9a-fk-orA-FK-OR])/gi, (_, code) => {
        return mcAnsiMap[code.toLowerCase()] || '';
    });

    // 16色终端配色表 (针对深色控制台优化的明晰配色)
    const standardColors = {
        0: '#1e293b', 1: '#ef4444', 2: '#22c55e', 3: '#eab308',
        4: '#3b82f6', 5: '#a855f7', 6: '#06b6d4', 7: '#e2e8f0',
        8: '#64748b', 9: '#f87171', 10: '#4ade80', 11: '#fde047',
        12: '#60a5fa', 13: '#c084fc', 14: '#22d3ee', 15: '#ffffff'
    };

    const get256Color = (n) => {
        if (n < 16) return standardColors[n] || '#e2e8f0';
        if (n >= 232) {
            const v = Math.round((n - 232) * 10 + 8);
            return `rgb(${v},${v},${v})`;
        }
        const idx = n - 16;
        const b = (idx % 6) * 51;
        const g = (Math.floor(idx / 6) % 6) * 51;
        const r = (Math.floor(idx / 36) % 6) * 51;
        return `rgb(${r},${g},${b})`;
    };

    // 4. 解析全功能 ANSI 序列 (支持16色、256色、RGB真彩色及粗体/斜体/下划线/删除线)
    let activeSpanCount = 0;
    escaped = escaped.replace(/\x1b\[([0-9;]*)m/g, (match, paramStr) => {
        if (!paramStr || paramStr === '0') {
            const res = '</span>'.repeat(activeSpanCount);
            activeSpanCount = 0;
            return res;
        }

        const args = paramStr.split(';').map(x => parseInt(x, 10) || 0);
        const styles = [];
        let closeTags = '';

        for (let i = 0; i < args.length; i++) {
            const code = args[i];
            if (code === 0) {
                closeTags += '</span>'.repeat(activeSpanCount);
                activeSpanCount = 0;
            } else if (code === 1) {
                styles.push('font-weight:bold');
            } else if (code === 2) {
                styles.push('opacity:0.75');
            } else if (code === 3) {
                styles.push('font-style:italic');
            } else if (code === 4) {
                styles.push('text-decoration:underline');
            } else if (code === 9) {
                styles.push('text-decoration:line-through');
            } else if (code >= 30 && code <= 37) {
                styles.push(`color:${standardColors[code - 30]}`);
            } else if (code === 39) {
                styles.push('color:inherit');
            } else if (code >= 40 && code <= 47) {
                styles.push(`background-color:${standardColors[code - 40]}`);
            } else if (code === 49) {
                styles.push('background-color:transparent');
            } else if (code >= 90 && code <= 97) {
                styles.push(`color:${standardColors[code - 90 + 8]}`);
            } else if (code >= 100 && code <= 107) {
                styles.push(`background-color:${standardColors[code - 100 + 8]}`);
            } else if (code === 38 && args[i + 1] === 5 && args[i + 2] !== undefined) {
                styles.push(`color:${get256Color(args[i + 2])}`);
                i += 2;
            } else if (code === 48 && args[i + 1] === 5 && args[i + 2] !== undefined) {
                styles.push(`background-color:${get256Color(args[i + 2])}`);
                i += 2;
            } else if (code === 38 && args[i + 1] === 2 && args[i + 4] !== undefined) {
                styles.push(`color:rgb(${args[i + 2]},${args[i + 3]},${args[i + 4]})`);
                i += 4;
            } else if (code === 48 && args[i + 1] === 2 && args[i + 4] !== undefined) {
                styles.push(`background-color:rgb(${args[i + 2]},${args[i + 3]},${args[i + 4]})`);
                i += 4;
            }
        }

        if (styles.length > 0) {
            activeSpanCount++;
            return closeTags + `<span style="${styles.join(';')}">`;
        }
        return closeTags;
    });

    if (activeSpanCount > 0) {
        escaped += '</span>'.repeat(activeSpanCount);
    }

    // 5. 额外清理任何残余未识别的非打印控制序列
    escaped = escaped.replace(/(?:\x1b|\u001b|\u00a4|\u00a7)\[[0-9;]*[a-zA-Z]/g, '')
                     .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 6. 标签高亮
    return escaped
        .replace(/(\/INFO\])/g, '/<span class="log-info">INFO</span>]')
        .replace(/(\/WARN\])/g, '/<span class="log-warn">WARN</span>]')
        .replace(/(\/ERROR\])/g, '/<span class="log-error">ERROR</span>]')
        .replace(/(\[系统\])/g, `<span class="log-system">[${t('dashboard.system')}]</span>`)
        .replace(/(\[诊断\])/g, `<span class="log-diagnostic" style="color: #f43f5e; font-weight: bold; background: rgba(244, 63, 94, 0.15); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(244, 63, 94, 0.25);">[诊断]</span>`)
        .replace(/(\[Diagnostic\])/g, `<span class="log-diagnostic" style="color: #f43f5e; font-weight: bold; background: rgba(244, 63, 94, 0.15); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(244, 63, 94, 0.25);">[Diagnostic]</span>`);
};

// Global Modal State
export const modalData = ref({ title: '', message: '', mode: 'confirm', inputValue: '', suffix: '', options: [], placeholder: '', callback: null });
let modalInstance = null;

// Prevent 'Blocked aria-hidden on an element because its descendant retained focus'
if (typeof document !== 'undefined') {
    document.addEventListener('hide.bs.modal', (e) => {
        if (document.activeElement && e.target && e.target.contains(document.activeElement)) {
            document.activeElement.blur();
        }
    });
}

export const initModal = () => {
    const el = document.getElementById('confirmModal');
    if (el) {
        modalInstance = new bootstrap.Modal(el);
        el.addEventListener('hidden.bs.modal', () => {
            el.style.zIndex = '';
        });
    }
};

export const openModal = (opts) => {
    if (opts.showAgainKey && localStorage.getItem(opts.showAgainKey) === 'true') {
        if (opts.callback) opts.callback(opts.inputValue || '');
        return;
    }
    modalData.value = {
        title: opts.title || t('common.confirm'),
        message: opts.message || '',
        mode: opts.mode || 'confirm',
        inputValue: opts.inputValue || '',
        suffix: opts.suffix || '',
        options: opts.options || [],
        placeholder: opts.placeholder || '',
        callback: opts.callback,
        showAgainKey: opts.showAgainKey || '',
        dontShowAgain: false
    };
    if (modalInstance) {
        const el = document.getElementById('confirmModal');
        const hasOpenModal = document.querySelectorAll('.modal.show, .modal.d-block').length > 0;
        if (hasOpenModal) {
            el.style.zIndex = '3050';
        } else {
            el.style.zIndex = '';
        }
        modalInstance.show();
        if (hasOpenModal) {
            requestAnimationFrame(() => {
                const backdrops = document.querySelectorAll('.modal-backdrop');
                if (backdrops.length >= 2) {
                    backdrops[backdrops.length - 1].style.zIndex = '3040';
                }
            });
        }
    }
};

export const confirmModalAction = () => {
    if (modalData.value.showAgainKey && modalData.value.dontShowAgain) {
        localStorage.setItem(modalData.value.showAgainKey, 'true');
    }
    if (modalData.value.callback) modalData.value.callback(modalData.value.inputValue);
    if (modalInstance) modalInstance.hide();
};

/**
 * 等待面板重新上线
 * @param {string|number} targetPort 目标端口 (可选)
 * @returns {Promise<void>}
 */
export const waitForPanel = (targetPort = null) => {
    return new Promise(async (resolve) => {
        let oldStartupTime = null;
        const currentPort = window.location.port || '80';
        const isSameOrigin = !targetPort || targetPort.toString() === currentPort.toString();

        // 1. 如果是同源重启，先获取当前服务器的 startupTime 作为参照物
        if (isSameOrigin) {
            try {
                const res = await fetch('/api/system/version', { cache: 'no-store' });
                const data = await res.json();
                oldStartupTime = data.startupTime;
            } catch (e) {
                // 如果获取失败，就不进行对比
            }
        }

        const check = async () => {
            try {
                let url = '/api/system/version';
                if (targetPort) {
                    const protocol = window.location.protocol;
                    const hostname = window.location.hostname;
                    url = `${protocol}//${hostname}:${targetPort}/api/system/version`;
                }
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                const fetchOptions = { 
                    cache: 'no-store', 
                    signal: controller.signal 
                };
                if (!isSameOrigin) {
                    fetchOptions.mode = 'no-cors';
                }

                const response = await fetch(url, fetchOptions);
                clearTimeout(timeoutId);
                
                if (isSameOrigin && oldStartupTime) {
                    const data = await response.json();
                    if (data.startupTime && data.startupTime !== oldStartupTime) {
                        resolve();
                        return;
                    }
                    setTimeout(check, 500);
                } else {
                    resolve();
                }
            } catch (e) {
                setTimeout(check, 500);
            }
        };
        // 缩短初始等待，因为我们有了 startupTime 的动态对比，不需要长等
        setTimeout(check, 500);
    });
};

const CHUNK_SIZE = 10 * 1024 * 1024;
const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024;

export const uploadFileWithChunk = async (file, options = {}) => {
    const {
        initUrl,
        uploadUrl = '/api/files/chunk/upload',
        completeUrl,
        cancelUrl = '/api/files/chunk/cancel',
        fieldName = 'chunk',
        fileName = file.name,
        extraInitData = {},
        onProgress = () => {},
        signal = null,
        headers = {},
    } = options;

    const isLargeFile = file.size >= LARGE_FILE_THRESHOLD;

    if (!isLargeFile) {
        return null;
    }

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadId = null;

    try {
        const initRes = await axios.post(initUrl, {
            fileName,
            fileSize: file.size,
            totalChunks,
            ...extraInitData,
        }, { headers, signal });
        uploadId = initRes.data.uploadId;

        let uploadedBytes = 0;
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunkBlob = file.slice(start, end);

            const fd = new FormData();
            fd.append(fieldName, chunkBlob);
            fd.append('uploadId', uploadId);
            fd.append('chunkIndex', i);

            await axios.post(uploadUrl, fd, { headers, signal });

            uploadedBytes += (end - start);
            onProgress(uploadedBytes, file.size, i + 1, totalChunks);
        }

        const completeRes = await axios.post(completeUrl, { uploadId }, { headers, signal });
        return completeRes.data;
    } catch (e) {
        if (uploadId) {
            try { await axios.post(cancelUrl, { uploadId }, { headers }); } catch (_) {}
        }
        throw e;
    }
};

export const isLargeFile = (file) => file.size >= LARGE_FILE_THRESHOLD;