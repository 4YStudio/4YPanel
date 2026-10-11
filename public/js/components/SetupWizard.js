import { ref, onMounted, onUnmounted, computed, watch } from '/js/vue.esm-browser.js';
import { api } from '../api.js';
import { showToast } from '../utils.js';
import { store } from '../store.js';
import { createI18n } from '../i18n.js';
import { socket } from '../socket.js';
import CustomSelect from './CustomSelect.js';

export default {
    components: { CustomSelect },
    template: `
    <div class="setup-wizard-container h-100 w-100 overflow-auto custom-scrollbar p-2 p-sm-3 p-md-4 p-xl-5">
        <div class="container-xl p-0">
            <!-- Header Banner (Responsive) -->
            <div class="card border-0 shadow-sm rounded-4 mb-3 mb-md-4 overflow-hidden position-relative animate-in setup-header-card">
                <div class="card-body p-3 p-md-4 p-lg-5 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 gap-md-4">
                    <div class="d-flex align-items-center gap-3 text-start w-100 w-md-auto">
                        <div class="position-relative flex-shrink-0 setup-logo-box">
                            <img :src="store.customLogoUrl || '/logo.png'" alt="Logo" class="w-100 h-100 rounded-3" style="object-fit: contain; filter: drop-shadow(0 4px 12px rgba(var(--c-primary-rgb), 0.2));">
                        </div>
                        <div class="min-w-0 flex-grow-1">
                            <div class="d-flex flex-wrap align-items-center gap-1 gap-md-2 mb-1">
                                <h4 class="fw-black m-0 tracking-tight fs-5 fs-md-4 fs-lg-3 text-truncate">{{ $t('setup.welcome') }}</h4>
                                <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-0-5 small rounded-pill text-truncate" style="max-width: 180px;">
                                    <i class="fa-solid fa-server me-1"></i>{{ currentInstanceName }}
                                </span>
                            </div>
                            <p class="text-muted m-0 small opacity-75 text-truncate-2" style="font-size: 0.8rem;">{{ $t('setup.desc') }}</p>
                        </div>
                    </div>

                    <!-- Selected Core Badges (Wrap cleanly on mobile) -->
                    <div class="d-flex align-items-center gap-2 flex-wrap w-100 w-md-auto justify-content-start justify-content-md-end pt-2 pt-md-0 border-top border-md-0 border-secondary border-opacity-10">
                        <span class="badge bg-secondary bg-opacity-10 text-body border border-secondary border-opacity-10 px-2.5 py-1.5 rounded-3 small">
                            <i class="fa-solid fa-cube text-primary me-1"></i> {{ formatLoaderLabel(selectedLoaderType) }}
                        </span>
                        <span v-if="selectedMc" class="badge bg-secondary bg-opacity-10 text-body border border-secondary border-opacity-10 px-2.5 py-1.5 rounded-3 small">
                            <i class="fa-brands fa-codepen text-warning me-1"></i> MC {{ selectedMc }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Active Installation Progress Card (Mobile Redesigned) -->
            <div v-if="installing" class="card border-0 shadow-lg rounded-4 p-3 p-md-5 mb-4 animate-in text-center position-relative overflow-hidden setup-progress-card" style="background: rgba(var(--c-primary-rgb), 0.03);">
                <div class="position-absolute top-0 start-0 w-100 h-100 pointer-events-none opacity-25" style="background: radial-gradient(circle at top right, rgba(var(--c-primary-rgb), 0.15), transparent 70%);"></div>

                <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary mx-auto mb-2 mb-md-3" style="width: 56px; height: 56px;">
                    <i v-if="progress.step === 'complete'" class="fa-solid fa-check fa-xl text-success animate-in"></i>
                    <i v-else-if="progress.step === 'error'" class="fa-solid fa-triangle-exclamation fa-xl text-danger animate-in"></i>
                    <i v-else-if="progress.step === 'downloading'" class="fa-solid fa-cloud-arrow-down fa-xl animate-pulse text-primary"></i>
                    <i v-else class="fa-solid fa-gear fa-spin fa-xl text-primary"></i>
                </div>

                <h5 class="fw-bold mb-1 mb-md-2 fs-5 fs-md-4">{{ progressTitle }}</h5>
                <p class="text-muted small mb-3 mb-md-4 px-2 px-md-5 mx-auto text-truncate-2" style="max-width: 650px; font-size: 0.85rem;">
                    <span v-if="progress.stepText" class="fw-semibold text-primary">{{ progress.stepText }}</span>
                    <span v-else>{{ $t('setup.progress_hint') }}</span>
                </p>

                <!-- Main Progress Bar -->
                <div class="w-100 mx-auto mb-3 mb-md-4" style="max-width: 700px;">
                    <div class="progress rounded-pill overflow-hidden shadow-inner" style="height: 14px; background: rgba(var(--bs-body-color-rgb), 0.08);">
                        <div class="progress-bar progress-bar-striped progress-bar-animated transition-all"
                            :class="progress.step === 'complete' ? 'bg-success' : (progress.step === 'error' ? 'bg-danger' : 'bg-primary')"
                            role="progressbar"
                            :style="{ width: Math.max(progress.percent || 5, 5) + '%' }"
                            :aria-valuenow="progress.percent || 0"
                            aria-valuemin="0"
                            aria-valuemax="100">
                        </div>
                    </div>
                </div>

                <!-- Metrics Dashboard Grid (Mobile-First: 2 columns on mobile, 3 on desktop, no text-overlap) -->
                <div class="row g-2 g-md-3 justify-content-center mx-auto w-100" style="max-width: 700px;">
                    <div class="col-6 col-md-4">
                        <div class="card h-100 border-0 rounded-3 p-2 p-md-3 text-center progress-metric-card" style="background: rgba(var(--bs-body-color-rgb), 0.04);">
                            <div class="text-muted small mb-1" style="font-size: 0.72rem;">
                                <i class="fa-solid fa-gauge-high text-info me-1"></i>{{ $t('setup.progress_download_speed') }}
                            </div>
                            <div class="fw-black text-body" style="font-size: clamp(0.85rem, 3.2vw, 1.05rem);">
                                {{ formatSpeed(progress.speed) }}
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-4">
                        <div class="card h-100 border-0 rounded-3 p-2 p-md-3 text-center progress-metric-card" style="background: rgba(var(--bs-body-color-rgb), 0.04);">
                            <div class="text-muted small mb-1" style="font-size: 0.72rem;">
                                <i class="fa-solid fa-file-arrow-down text-warning me-1"></i>{{ $t('setup.progress_file_size') }}
                            </div>
                            <div class="fw-black text-body" style="font-size: clamp(0.85rem, 3.2vw, 1.05rem);">
                                {{ formatSizeText(progress.processedSize, progress.totalSize) }}
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-md-4">
                        <div class="card h-100 border-0 rounded-3 p-2 p-md-3 text-center progress-metric-card" style="background: rgba(var(--bs-body-color-rgb), 0.04);">
                            <div class="text-muted small mb-1" style="font-size: 0.72rem;">
                                <i class="fa-solid fa-percent text-success me-1"></i>{{ $t('setup.step_install') }}
                            </div>
                            <div class="fw-black text-body" style="font-size: clamp(0.85rem, 3.2vw, 1.05rem);">
                                {{ progress.percent || 0 }}%
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Error Actions -->
                <div v-if="progress.step === 'error'" class="mt-3 mt-md-4 animate-in">
                    <button class="btn btn-outline-danger px-4 py-2 rounded-3 fw-bold" @click="resetInstallState">
                        <i class="fa-solid fa-arrow-rotate-left me-2"></i>重新尝试安装
                    </button>
                </div>
            </div>

            <!-- Configuration Steps View (Hidden while installing) -->
            <div v-else class="row g-3 g-md-4 animate-in">
                <!-- Step 1: Core Architecture Selection -->
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4 p-3 p-md-4">
                        <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 24px; height: 24px; font-size: 0.75rem;">1</span>
                                <h5 class="fw-bold m-0 fs-6 fs-md-5">{{ $t('setup.select_loader_type') }}</h5>
                            </div>
                            <span class="small text-muted" style="font-size: 0.8rem;">{{ $t('setup.step_architecture') }}</span>
                        </div>

                        <!-- 1.1 Plugins Section -->
                        <div class="mb-3 mb-md-4">
                            <div class="small fw-bold text-muted text-uppercase tracking-wider mb-2 opacity-75" style="font-size: 0.75rem;">
                                <i class="fa-solid fa-puzzle-piece text-primary me-1"></i> {{ $t('setup.group_plugin') }}
                            </div>
                            <div class="row g-2 g-md-3">
                                <div class="col-12 col-md-6" v-for="item in pluginCores" :key="item.value">
                                    <div class="card h-100 core-select-card cursor-pointer p-2.5 p-md-3 rounded-3 transition-all border"
                                        :class="selectedLoaderType === item.value ? 'border-primary bg-primary bg-opacity-10 shadow-sm ring-active' : 'border-secondary border-opacity-15'"
                                        @click="selectLoaderType(item.value)">
                                        <div class="d-flex align-items-center gap-2 gap-md-3">
                                            <div class="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0 core-icon-box"
                                                :class="selectedLoaderType === item.value ? 'bg-primary text-white' : 'bg-body-tertiary text-muted'">
                                                <i :class="item.icon" class="fa-lg"></i>
                                            </div>
                                            <div class="flex-grow-1 min-w-0">
                                                <div class="d-flex align-items-center justify-content-between flex-wrap gap-1 mb-1">
                                                    <span class="fw-bold text-truncate fs-6">{{ item.label }}</span>
                                                    <span class="badge bg-primary bg-opacity-15 text-primary border border-primary border-opacity-25 px-1.5 py-0.5 rounded" style="font-size: 0.65rem;">
                                                        {{ item.tag }}
                                                    </span>
                                                </div>
                                                <p class="text-muted small m-0 text-truncate-2" style="font-size: 0.78rem; line-height: 1.35;">{{ item.desc }}</p>
                                            </div>
                                            <div class="flex-shrink-0 ms-1">
                                                <i v-if="selectedLoaderType === item.value" class="fa-solid fa-circle-check text-primary fa-lg"></i>
                                                <i v-else class="fa-regular fa-circle text-muted opacity-30 fa-lg"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 1.2 Modded Loaders Section -->
                        <div class="mb-3 mb-md-4">
                            <div class="small fw-bold text-muted text-uppercase tracking-wider mb-2 opacity-75" style="font-size: 0.75rem;">
                                <i class="fa-solid fa-cubes-stacked text-warning me-1"></i> {{ $t('setup.group_mod') }}
                            </div>
                            <div class="row g-2 g-md-3">
                                <div class="col-12 col-sm-6 col-md-4" v-for="item in modLoaders" :key="item.value">
                                    <div class="card h-100 core-select-card cursor-pointer p-2.5 p-md-3 rounded-3 transition-all border"
                                        :class="selectedLoaderType === item.value ? 'border-primary bg-primary bg-opacity-10 shadow-sm ring-active' : 'border-secondary border-opacity-15'"
                                        @click="selectLoaderType(item.value)">
                                        <div class="d-flex align-items-center gap-2 gap-md-3">
                                            <div class="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0 core-icon-box"
                                                :class="selectedLoaderType === item.value ? 'bg-primary text-white' : 'bg-body-tertiary text-muted'">
                                                <i :class="item.icon" class="fa-lg"></i>
                                            </div>
                                            <div class="flex-grow-1 min-w-0">
                                                <div class="d-flex align-items-center justify-content-between flex-wrap gap-1 mb-1">
                                                    <span class="fw-bold text-truncate fs-6">{{ item.label }}</span>
                                                    <span class="badge bg-secondary bg-opacity-15 text-body border border-secondary border-opacity-25 px-1.5 py-0.5 rounded" style="font-size: 0.65rem;">
                                                        {{ item.tag }}
                                                    </span>
                                                </div>
                                                <p class="text-muted small m-0 text-truncate-2" style="font-size: 0.78rem; line-height: 1.35;">{{ item.desc }}</p>
                                            </div>
                                            <div class="flex-shrink-0 ms-1">
                                                <i v-if="selectedLoaderType === item.value" class="fa-solid fa-circle-check text-primary fa-lg"></i>
                                                <i v-else class="fa-regular fa-circle text-muted opacity-30 fa-lg"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 1.3 Official Vanilla Section -->
                        <div>
                            <div class="small fw-bold text-muted text-uppercase tracking-wider mb-2 opacity-75" style="font-size: 0.75rem;">
                                <i class="fa-solid fa-cube text-success me-1"></i> {{ $t('setup.group_vanilla') }}
                            </div>
                            <div class="row g-2 g-md-3">
                                <div class="col-12 col-md-6">
                                    <div class="card h-100 core-select-card cursor-pointer p-2.5 p-md-3 rounded-3 transition-all border"
                                        :class="selectedLoaderType === 'vanilla' ? 'border-primary bg-primary bg-opacity-10 shadow-sm ring-active' : 'border-secondary border-opacity-15'"
                                        @click="selectLoaderType('vanilla')">
                                        <div class="d-flex align-items-center gap-2 gap-md-3">
                                            <div class="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0 core-icon-box"
                                                :class="selectedLoaderType === 'vanilla' ? 'bg-primary text-white' : 'bg-body-tertiary text-muted'">
                                                <i class="fa-solid fa-cube fa-lg"></i>
                                            </div>
                                            <div class="flex-grow-1 min-w-0">
                                                <div class="d-flex align-items-center justify-content-between flex-wrap gap-1 mb-1">
                                                    <span class="fw-bold text-truncate fs-6">Vanilla (官方原版)</span>
                                                    <span class="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 px-1.5 py-0.5 rounded" style="font-size: 0.65rem;">
                                                        Mojang 官方
                                                    </span>
                                                </div>
                                                <p class="text-muted small m-0 text-truncate-2" style="font-size: 0.78rem; line-height: 1.35;">{{ $t('setup.vanilla_desc') }}</p>
                                            </div>
                                            <div class="flex-shrink-0 ms-1">
                                                <i v-if="selectedLoaderType === 'vanilla'" class="fa-solid fa-circle-check text-primary fa-lg"></i>
                                                <i v-else class="fa-regular fa-circle text-muted opacity-30 fa-lg"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 2 & 3: Version Selection Panel -->
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4 p-3 p-md-4">
                        <div class="row g-3 g-md-4">
                            <!-- Minecraft Version Select -->
                            <div class="col-12 col-md-6">
                                <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-1">
                                    <label class="form-label fw-bold m-0 d-flex align-items-center gap-2 fs-6">
                                        <span class="badge bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 22px; height: 22px; font-size: 0.7rem;">2</span>
                                        {{ $t('setup.select_mc') }}
                                        <span v-if="loadingMc" class="spinner-border spinner-border-sm text-primary ms-1" role="status"></span>
                                    </label>
                                    <span class="badge bg-secondary bg-opacity-10 text-muted px-2 py-0.5 small rounded-pill">
                                        {{ mcVersions.length }} 个版本
                                    </span>
                                </div>
                                <CustomSelect v-model="selectedMc" :options="mcVersions"
                                    :placeholder="loadingMc ? $t('common.loading') : $t('setup.choose')"
                                    :disabled="loadingMc || installing" size="lg" searchable @change="fetchLoaders" />
                                <div class="form-text small opacity-75 mt-1" style="font-size: 0.75rem;">支持在输入框内输入如 1.20.1 进行快速模糊搜索</div>
                            </div>

                            <!-- Loader / Build Version Select -->
                            <div class="col-12 col-md-6">
                                <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-1">
                                    <label class="form-label fw-bold m-0 d-flex align-items-center gap-2 fs-6">
                                        <span class="badge bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 22px; height: 22px; font-size: 0.7rem;">3</span>
                                        {{ $t('setup.select_loader') }}
                                        <span v-if="loadingLoaders" class="spinner-border spinner-border-sm text-primary ms-1" role="status"></span>
                                    </label>
                                    <span v-if="selectedLoaderType !== 'vanilla'" class="badge bg-secondary bg-opacity-10 text-muted px-2 py-0.5 small rounded-pill">
                                        {{ loaderVersions.length }} 个构建/版本
                                    </span>
                                </div>

                                <div v-if="selectedLoaderType === 'vanilla'" class="card border border-success border-opacity-25 bg-success bg-opacity-10 rounded-3 p-3 d-flex flex-row align-items-center gap-2" style="min-height: 48px;">
                                    <i class="fa-solid fa-circle-check text-success fa-lg"></i>
                                    <span class="small fw-semibold text-success">{{ $t('setup.vanilla_locked') }}</span>
                                </div>
                                <CustomSelect v-else v-model="selectedLoader" :options="loaderVersions"
                                    :placeholder="loadingLoaders ? $t('common.loading') : (!selectedMc ? '请先选择游戏版本' : $t('setup.choose'))"
                                    :disabled="loadingLoaders || !selectedMc || installing" size="lg" searchable />
                                <div v-if="selectedLoaderType !== 'vanilla'" class="form-text small opacity-75 mt-1" style="font-size: 0.75rem;">默认自动推荐并选中官方最新稳定构建</div>
                            </div>
                        </div>

                        <!-- Step 4: Install Trigger Bar (Responsive Full-width on Mobile) -->
                        <div class="mt-3 mt-md-4 pt-3 border-top d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                            <div class="d-flex align-items-center gap-2 text-muted small text-start w-100 w-md-auto" style="font-size: 0.8rem;">
                                <i class="fa-solid fa-shield-halved text-success flex-shrink-0"></i>
                                <span>将自动写入 EULA 许可协议，部署完成后立即就绪可启动</span>
                            </div>
                            <div class="w-100 w-md-auto flex-shrink-0">
                                <button class="btn btn-primary px-4 py-2.5 rounded-3 fw-bold w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm setup-install-btn"
                                    @click="install" :disabled="!canInstall || installing">
                                    <i class="fa-solid fa-download"></i>
                                    <span>{{ $t('setup.install') }}</span>
                                    <span v-if="selectedMc" class="badge bg-white text-primary bg-opacity-25 rounded-pill ms-1 px-2 py-0.5 small text-truncate" style="max-width: 150px; font-size: 0.75rem;">
                                        {{ formatLoaderLabel(selectedLoaderType) }} {{ selectedMc }}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    setup(props, { emit }) {
        const t = createI18n(store);
        const mcVersions = ref([]);
        const loaderVersions = ref([]);
        const selectedMc = ref('');
        const selectedLoader = ref('');
        const selectedLoaderType = ref('paper');
        const loadingMc = ref(false);
        const loadingLoaders = ref(false);
        const installing = ref(false);

        const progress = ref({
            isInstalling: false,
            step: 'idle',
            stepText: '',
            fileName: '',
            processedSize: 0,
            totalSize: 0,
            speed: 0,
            percent: 0,
            error: null
        });

        let pollTimer = null;

        const currentInstanceName = computed(() => {
            const cur = (store.instanceList || []).find(i => i.id === store.currentInstanceId);
            return cur ? cur.name : (store.currentInstanceId || '当前实例');
        });

        const pluginCores = computed(() => [
            {
                value: 'paper',
                label: 'Paper',
                tag: '主流首选',
                icon: 'fa-solid fa-scroll',
                desc: t('setup.paper_desc')
            },
            {
                value: 'purpur',
                label: 'Purpur',
                tag: '高配调优',
                icon: 'fa-solid fa-feather-pointed',
                desc: t('setup.purpur_desc')
            }
        ]);

        const modLoaders = computed(() => [
            {
                value: 'fabric',
                label: 'Fabric',
                tag: '轻量极速',
                icon: 'fa-solid fa-feather',
                desc: t('setup.fabric_desc')
            },
            {
                value: 'neoforge',
                label: 'NeoForge',
                tag: '新一代模组',
                icon: 'fa-solid fa-fire',
                desc: t('setup.neoforge_desc')
            },
            {
                value: 'forge',
                label: 'Forge',
                tag: '经典生态',
                icon: 'fa-solid fa-hammer',
                desc: t('setup.forge_desc')
            }
        ]);

        const formatLoaderLabel = (type) => {
            if (!type) return 'Paper';
            if (type === 'vanilla') return 'Vanilla';
            if (type === 'paper') return 'Paper';
            if (type === 'purpur') return 'Purpur';
            if (type === 'fabric') return 'Fabric';
            if (type === 'neoforge') return 'NeoForge';
            if (type === 'forge') return 'Forge';
            return type.charAt(0).toUpperCase() + type.slice(1);
        };

        const canInstall = computed(() => {
            if (!selectedMc.value) return false;
            if (selectedLoaderType.value === 'vanilla') return true;
            return !!selectedLoader.value && !loadingLoaders.value;
        });

        const progressTitle = computed(() => {
            if (progress.value.step === 'complete') return '部署完成！';
            if (progress.value.step === 'error') return '安装出错';
            if (progress.value.step === 'downloading') return '正在下载核心文件...';
            if (progress.value.step === 'installing') return '正在解包安装服务端...';
            return t('setup.progress_title') || '正在部署服务端核心';
        });

        const formatSpeed = (bytesPerSec) => {
            if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s';
            if (bytesPerSec >= 1024 * 1024) {
                return (bytesPerSec / (1024 * 1024)).toFixed(2) + ' MB/s';
            }
            return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
        };

        const formatSizeText = (processed, total) => {
            if (!processed || processed <= 0) {
                return total > 0 ? ('0 / ' + formatBytes(total)) : '计算中...';
            }
            if (total && total > 0) {
                return formatBytes(processed) + ' / ' + formatBytes(total);
            }
            return formatBytes(processed);
        };

        const formatBytes = (bytes) => {
            if (!bytes || bytes <= 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
        };

        const selectLoaderType = (type) => {
            if (selectedLoaderType.value === type) return;
            selectedLoaderType.value = type;
            selectedMc.value = '';
            selectedLoader.value = type === 'vanilla' ? 'standard' : '';
            loaderVersions.value = [];
            fetchMc();
        };

        const fetchMc = async () => {
            loadingMc.value = true;
            try {
                const res = await api.get('/api/setup/versions/mc', { params: { loaderType: selectedLoaderType.value } });
                mcVersions.value = res.data;
                if (res.data.length > 0 && !selectedMc.value) {
                    selectedMc.value = res.data[0];
                    fetchLoaders();
                }
            } catch (e) {
                showToast(t('setup.fetch_fail_mc'), 'danger');
            } finally {
                loadingMc.value = false;
            }
        };

        const fetchLoaders = async () => {
            if (!selectedMc.value) return;
            if (selectedLoaderType.value === 'vanilla') {
                selectedLoader.value = 'standard';
                loaderVersions.value = [{ value: 'standard', label: '官方标准构建' }];
                return;
            }
            loaderVersions.value = [];
            selectedLoader.value = '';
            loadingLoaders.value = true;
            try {
                const res = await api.get(`/api/setup/versions/loader/${selectedMc.value}`, { params: { loaderType: selectedLoaderType.value } });
                loaderVersions.value = res.data;
                if (res.data.length > 0) {
                    selectedLoader.value = res.data[0];
                }
            } catch (e) {
                showToast(t('setup.fetch_fail_loader'), 'danger');
            } finally {
                loadingLoaders.value = false;
            }
        };

        let isFinishing = false;

        const handleProgressUpdate = (prog) => {
            if (!prog) return;
            progress.value = { ...progress.value, ...prog };
            if (prog.isInstalling || prog.step === 'downloading' || prog.step === 'installing' || prog.step === 'preparing' || prog.step === 'configuring') {
                installing.value = true;
                store.isInstallingCore = true;
            }
            if (prog.step === 'complete') {
                finishSetup();
            } else if (prog.step === 'error') {
                installing.value = false;
                store.isInstallingCore = false;
            }
        };

        const finishSetup = () => {
            if (isFinishing) return;
            isFinishing = true;
            progress.value.percent = 100;
            progress.value.step = 'complete';
            progress.value.stepText = '服务端部署完成！正在进入控制台...';
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
            setTimeout(() => {
                store.isInstallingCore = false;
                store.isSetup = true;
                installing.value = false;
                emit('setup-complete');
                showToast(t('setup.install_success_toast'), 'success');
            }, 800);
        };

        const resetInstallState = () => {
            installing.value = false;
            store.isInstallingCore = false;
            isFinishing = false;
            progress.value = {
                isInstalling: false,
                step: 'idle',
                stepText: '',
                fileName: '',
                processedSize: 0,
                totalSize: 0,
                speed: 0,
                percent: 0,
                error: null
            };
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
        };

        const install = async () => {
            if (!canInstall.value || installing.value) return;
            installing.value = true;
            store.isInstallingCore = true;
            isFinishing = false;
            progress.value = {
                isInstalling: true,
                step: 'preparing',
                stepText: '正在启动安装任务...',
                fileName: '',
                processedSize: 0,
                totalSize: 0,
                speed: 0,
                percent: 5,
                error: null
            };

            try {
                await api.post('/api/setup/install', {
                    gameVersion: selectedMc.value,
                    loaderVersion: selectedLoader.value,
                    loaderType: selectedLoaderType.value
                });
                showToast(t('setup.install_start_toast'), 'info');

                // 开启轮询双保险机制（仅根据 progress 状态同步，绝不根据粗暴的 isSetup 提前退出）
                if (pollTimer) clearInterval(pollTimer);
                let checks = 0;
                pollTimer = setInterval(async () => {
                    checks++;
                    try {
                        const res = await api.get('/api/setup/status');
                        if (res.data?.progress) {
                            handleProgressUpdate(res.data.progress);
                        }
                    } catch (_) { }

                    if (checks > 300) { // 超过 5 分钟超时
                        clearInterval(pollTimer);
                        pollTimer = null;
                        if (installing.value && progress.value.step !== 'complete') {
                            installing.value = false;
                            store.isInstallingCore = false;
                            showToast(t('setup.install_timeout_toast'), 'warning');
                        }
                    }
                }, 1000);

            } catch (e) {
                installing.value = false;
                store.isInstallingCore = false;
                progress.value.step = 'error';
                progress.value.stepText = e.response?.data?.error || e.message;
                showToast(t('setup.install_fail_toast'), 'danger');
            }
        };

        // Socket 实时进度监听
        const onSetupProgress = (data) => {
            if (!data) return;
            if (data.instanceId && data.instanceId !== store.currentInstanceId) return;
            handleProgressUpdate(data);
        };

        onMounted(async () => {
            fetchMc();
            if (socket.connected) {
                socket.on(`setup_progress:${store.currentInstanceId}`, onSetupProgress);
                socket.on('setup_progress', onSetupProgress);
            }
            try {
                const res = await api.get('/api/setup/progress');
                if (res.data && res.data.isInstalling) {
                    handleProgressUpdate(res.data);
                }
            } catch (_) {}
        });

        onUnmounted(() => {
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
            socket.off(`setup_progress:${store.currentInstanceId}`, onSetupProgress);
            socket.off('setup_progress', onSetupProgress);
        });

        return {
            store,
            mcVersions,
            loaderVersions,
            selectedMc,
            selectedLoader,
            selectedLoaderType,
            pluginCores,
            modLoaders,
            loadingMc,
            loadingLoaders,
            installing,
            progress,
            canInstall,
            progressTitle,
            currentInstanceName,
            formatLoaderLabel,
            formatSpeed,
            formatSizeText,
            selectLoaderType,
            fetchLoaders,
            install,
            resetInstallState
        };
    }
};
