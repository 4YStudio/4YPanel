import { ref, reactive, computed, watch, onMounted, getCurrentInstance } from '/js/vue.esm-browser.js';
import { api } from '../api.js';
import { store } from '../store.js';
import { showToast, t } from '../utils.js';
import CustomSelect from './CustomSelect.js';

const API_BASE = '/api/plugins/mc-panel-plugin-modrinth';

export default {
    components: { CustomSelect },
    template: `
    <div class="h-100 d-flex flex-column resource-downloader-view">
        <!-- Page Header (Responsive for Desktop & Mobile) -->
        <div class="page-header d-flex flex-column pb-3 mb-3 border-bottom gap-2 animate-in">
            <!-- Row 1: Title, Active Badge, Sort & Mobile Filters -->
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2 gap-md-3">
                    <div class="p-2 rounded-3 bg-primary-subtle text-primary border border-primary-subtle d-flex align-items-center justify-content-center flex-shrink-0 header-icon-box">
                        <i class="fa-solid fa-cloud-arrow-down fs-5 fs-md-4"></i>
                    </div>
                    <div>
                        <h4 class="m-0 fw-bold d-flex align-items-center gap-2 flex-wrap fs-5 fs-md-3">
                            <span>{{ $t('resources.title') || '资源下载' }}</span>
                            <span class="badge rounded-pill px-2 py-1 fs-7 fs-md-6 fw-semibold border"
                                  :class="currentCategoryBadgeClass">
                                <i :class="currentCategoryIcon" class="me-1"></i>
                                {{ currentCategoryLabel }}
                            </span>
                        </h4>
                        <div class="text-muted small mt-1 d-none d-md-flex align-items-center gap-2 flex-wrap">
                            <span>{{ $t('resources.current_core') }}: <strong class="text-body">{{ activeCoreText }}</strong></span>
                            <span class="opacity-50">•</span>
                            <span class="text-primary-emphasis">{{ autoSelectedMessage }}</span>
                        </div>
                    </div>
                </div>

                <!-- Top Right Controls: Sort & Mobile Filter Toggle -->
                <div class="d-flex align-items-center gap-2">
                    <!-- Sort By Dropdown -->
                    <div class="d-flex align-items-center">
                        <CustomSelect v-model="sortBy" :options="sortOptions" size="sm" width="130px" @change="searchModrinth(true)" />
                    </div>

                    <!-- Mobile Filter Drawer Button -->
                    <button class="btn btn-sm btn-outline-primary d-md-none rounded-pill fw-bold position-relative px-3"
                            @click="showMobileFilters = true">
                        <i class="fa-solid fa-sliders me-1"></i>
                        <span>{{ $t('common.filter') || '筛选' }}</span>
                        <span v-if="activeFilterCount > 0"
                              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light"
                              style="font-size: 0.65rem;">
                            {{ activeFilterCount }}
                        </span>
                    </button>
                </div>
            </div>

            <!-- Mobile Core Architecture Info (Compact for mobile screens) -->
            <div class="text-muted small d-md-none d-flex align-items-center gap-1 flex-wrap py-1 px-2 rounded-2 bg-body-tertiary border" style="font-size: 0.75rem;">
                <i class="fa-solid fa-server text-primary opacity-75 me-1"></i>
                <span class="text-body fw-medium">{{ activeCoreText }}</span>
                <span class="opacity-50 mx-1">•</span>
                <span class="text-primary-emphasis text-truncate">{{ autoSelectedMessage }}</span>
            </div>

            <!-- Row 2: Category Tabs (Horizontal Scrollable on Mobile) -->
            <div class="d-flex align-items-center justify-content-between gap-2 pt-1 flex-wrap flex-md-nowrap">
                <div class="tabs-scroll-container d-flex p-1 bg-body-tertiary rounded-pill border shadow-sm w-100 w-md-auto overflow-x-auto no-scrollbar" role="group">
                    <button type="button" class="btn btn-sm rounded-pill px-3 fw-bold transition-all text-nowrap flex-grow-1 flex-md-grow-0"
                            :class="currentTab === 'plugin' ? 'btn-primary shadow-sm' : 'btn-ghost text-muted'"
                            @click="switchTab('plugin')">
                        <i class="fa-solid fa-plug me-1"></i>{{ $t('resources.tab_plugins') || '插件' }}
                    </button>
                    <button type="button" class="btn btn-sm rounded-pill px-3 fw-bold transition-all text-nowrap flex-grow-1 flex-md-grow-0"
                            :class="currentTab === 'mod' ? 'btn-primary shadow-sm' : 'btn-ghost text-muted'"
                            @click="switchTab('mod')">
                        <i class="fa-solid fa-cubes me-1"></i>{{ $t('resources.tab_mods') || '模组' }}
                    </button>
                    <button type="button" class="btn btn-sm rounded-pill px-3 fw-bold transition-all text-nowrap flex-grow-1 flex-md-grow-0"
                            :class="currentTab === 'datapack' ? 'btn-primary shadow-sm' : 'btn-ghost text-muted'"
                            @click="switchTab('datapack')">
                        <i class="fa-solid fa-box-archive me-1"></i>{{ $t('resources.tab_datapacks') || '数据包' }}
                    </button>
                    <button type="button" class="btn btn-sm rounded-pill px-3 fw-bold transition-all text-nowrap flex-grow-1 flex-md-grow-0"
                            :class="currentTab === 'resourcepack' ? 'btn-primary shadow-sm' : 'btn-ghost text-muted'"
                            @click="switchTab('resourcepack')">
                        <i class="fa-solid fa-palette me-1"></i>{{ $t('resources.tab_resourcepacks') || '资源包' }}
                    </button>
                </div>

                <!-- Mobile Quick Search Bar (Directly accessible on mobile) -->
                <div class="d-md-none w-100 mt-1">
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control rounded-start-pill border-secondary-subtle"
                               v-model="modrinthSearch"
                               @keyup.enter="searchModrinth(true)"
                               :placeholder="$t('resources.search_placeholder') || '搜索资源...'">
                        <button v-if="modrinthSearch" class="btn btn-outline-secondary border-secondary-subtle" @click="modrinthSearch = ''; searchModrinth(true)">
                            <i class="fa-solid fa-times"></i>
                        </button>
                        <button class="btn btn-primary rounded-end-pill px-3" @click="searchModrinth(true)">
                            <i class="fa-solid fa-search"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Vanilla Unsupported Centered Prompt -->
        <div v-if="isVanillaInstance && !showBrowseAnyway" class="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-4 bg-body-tertiary rounded-4 border shadow-sm text-center animate-in">
            <div class="p-4 rounded-circle bg-warning-subtle text-warning border border-warning-subtle shadow-sm mb-3">
                <i class="fa-solid fa-ban fa-3x"></i>
            </div>
            <h4 class="fw-bold text-body mb-2">{{ $t('resources.vanilla_title') || '插件暂不支持当前实例的核心架构' }}</h4>
            <p class="text-muted small mb-2" style="max-width: 560px;">
                {{ $t('resources.vanilla_desc1') || '当前实例运行在官方原版 (Vanilla) 服务端架构上，原生不支持加载任何第三方插件 (Plugins) 或模组 (Mods)。' }}
            </p>
            <p class="text-muted small mb-4" style="max-width: 560px;">
                {{ $t('resources.vanilla_desc2') || '若您需要安装插件或模组，请前往【服务器设置】将核心架构切换为 Paper / Purpur（推荐插件服）或 Fabric / NeoForge（推荐模组服）。' }}
            </p>
            <div class="d-flex gap-3 flex-wrap justify-content-center">
                <button class="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm" @click="goToSettings">
                    <i class="fa-solid fa-gear me-2"></i>{{ $t('resources.switch_core_btn') || '前往服务器设置切换架构' }}
                </button>
                <button class="btn btn-outline-secondary rounded-pill px-3 py-2 fw-bold" @click="showBrowseAnyway = true">
                    <i class="fa-solid fa-eye me-1"></i>{{ $t('resources.read_only_browse') || '浏览资源库 (只读预览)' }}
                </button>
            </div>
        </div>

        <!-- Main Layout Body -->
        <div v-else class="flex-grow-1 overflow-hidden d-flex bg-body-tertiary rounded-4 border shadow-sm animate-in delay-100">
            <!-- Left Sidebar Filters (Desktop Only) -->
            <div class="sidebar-filters overflow-auto bg-body border-end px-3 py-4 d-none d-md-block custom-scrollbar" style="width: 280px; min-width: 280px;">
                <!-- Search Box -->
                <div class="mb-4">
                    <label class="fw-bold small text-uppercase text-muted mb-2 d-flex align-items-center">
                        <i class="fa-solid fa-search me-2 text-primary"></i>{{ $t('common.search') }}
                    </label>
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control rounded-start-pill border-secondary-subtle"
                               v-model="modrinthSearch"
                               @keyup.enter="searchModrinth(true)"
                               :placeholder="$t('resources.search_placeholder')">
                        <button class="btn btn-primary rounded-end-pill px-3" @click="searchModrinth(true)">
                            <i class="fa-solid fa-search"></i>
                        </button>
                    </div>
                </div>

                <!-- Platform / Loader Filter (Plugins & Mods) -->
                <div class="mb-4" v-if="activePlatformOptions.length > 0">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <label class="fw-bold small text-uppercase text-muted m-0 d-flex align-items-center">
                            <i class="fa-solid fa-microchip me-2 text-primary"></i>
                            {{ currentTab === 'plugin' ? '服务端平台 (Platform)' : $t('mods.loader') }}
                        </label>
                        <button v-if="filters.loaders.length > 0" class="btn btn-link btn-xs text-muted p-0 text-decoration-none" @click="filters.loaders = []; searchModrinth(true)">
                            清空
                        </button>
                    </div>
                    <div class="p-2 border rounded-3 bg-body-tertiary d-flex flex-wrap gap-2">
                        <div v-for="l in activePlatformOptions" :key="l.id" class="form-check p-0 m-0">
                            <input type="checkbox" class="btn-check" :value="l.id" v-model="filters.loaders" :id="'l-'+l.id" autocomplete="off" @change="searchModrinth(true)">
                            <label class="btn btn-xs rounded-pill px-2 py-1 fw-medium border"
                                   :class="filters.loaders.includes(l.id) ? 'btn-primary' : 'btn-outline-secondary'"
                                   :for="'l-'+l.id">
                                {{ l.name }}
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Game Versions Filter -->
                <div class="mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <label class="fw-bold small text-uppercase text-muted m-0 d-flex align-items-center">
                            <i class="fa-solid fa-code-branch me-2 text-primary"></i>{{ $t('mods.game_version') }}
                        </label>
                        <span v-if="currentInstanceMc" class="badge bg-secondary-subtle text-secondary border small">当前: {{ currentInstanceMc }}</span>
                    </div>
                    <div class="filter-list custom-scrollbar overflow-auto border rounded-3 p-2 bg-body-tertiary" style="max-height: 160px;">
                        <div class="form-check small mb-1" v-for="v in ALL_VERSIONS" :key="v">
                            <input class="form-check-input" type="checkbox" :value="v" v-model="filters.versions" :id="'v-'+v" @change="searchModrinth(true)">
                            <label class="form-check-label fw-medium d-flex justify-content-between" :for="'v-'+v">
                                <span>{{ v }}</span>
                                <span v-if="v === currentInstanceMc" class="badge bg-primary-subtle text-primary border rounded-pill" style="font-size: 0.65rem;">推荐</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Environment Filter (Mods only) -->
                <div class="mb-4" v-if="currentTab === 'mod'">
                    <label class="fw-bold small text-uppercase text-muted mb-2 d-flex align-items-center">
                        <i class="fa-solid fa-server me-2 text-primary"></i>{{ $t('mods.modrinth.environment') }}
                    </label>
                    <div class="p-2 border rounded-3 bg-body-tertiary">
                        <div class="form-check small mb-1">
                            <input class="form-check-input" type="checkbox" value="server_side:required" v-model="filters.environment" id="env-server" @change="searchModrinth(true)">
                            <label class="form-check-label fw-medium" for="env-server">{{ $t('mods.modrinth.env.server') }}</label>
                        </div>
                        <div class="form-check small">
                            <input class="form-check-input" type="checkbox" value="client_side:required" v-model="filters.environment" id="env-client" @change="searchModrinth(true)">
                            <label class="form-check-label fw-medium" for="env-client">{{ $t('mods.modrinth.env.client') }}</label>
                        </div>
                    </div>
                </div>

                <!-- Categories Filter -->
                <div class="mb-4" v-if="activeCategories.length > 0">
                    <label class="fw-bold small text-uppercase text-muted mb-2 d-flex align-items-center">
                        <i class="fa-solid fa-tags me-2 text-primary"></i>{{ $t('mods.categories_title') }}
                    </label>
                    <div class="filter-list border rounded-3 p-2 bg-body-tertiary overflow-auto custom-scrollbar" style="max-height: 220px;">
                        <div class="form-check small mb-1" v-for="cat in activeCategories" :key="cat.id">
                            <input class="form-check-input" type="checkbox" :value="cat.id" v-model="filters.categories" :id="'cat-'+cat.id" @change="searchModrinth(true)">
                            <label class="form-check-label d-flex align-items-center fw-medium" :for="'cat-'+cat.id">
                                <i :class="cat.icon" class="me-2 text-primary opacity-75" style="width: 14px;"></i>
                                {{ getCategoryName(cat.id) }}
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Reset Filters Button -->
                <button class="btn btn-outline-secondary btn-sm w-100 rounded-pill fw-bold" @click="clearFilters">
                    <i class="fa-solid fa-rotate-left me-1"></i>{{ $t('resources.clear_filters') || '重置筛选条件' }}
                </button>
            </div>

            <!-- Right Results Area -->
            <div class="flex-grow-1 overflow-auto p-2 p-md-4 position-relative bg-body shadow-inner custom-scrollbar d-flex flex-column">
                <!-- Loading State -->
                <div v-if="loadingModrinth && modrinthResults.length === 0" class="my-auto text-center py-5">
                    <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
                    <div class="text-muted fw-bold fs-5">{{ $t('mods.modrinth.searching') }}</div>
                </div>

                <!-- Empty State -->
                <div v-else-if="!loadingModrinth && modrinthResults.length === 0" class="my-auto text-center py-5 text-muted">
                    <div class="p-4 rounded-circle bg-body-tertiary d-inline-flex mb-3 border shadow-sm">
                        <i class="fa-solid fa-box-open fa-3x opacity-50 text-secondary"></i>
                    </div>
                    <h5 class="fw-bold">{{ $t('resources.no_results') || '未找到匹配的资源' }}</h5>
                    <p class="small text-muted mb-4">{{ $t('resources.try_different') || '请尝试调整搜索关键词或减少过滤选项' }}</p>
                    <button class="btn btn-sm btn-outline-primary rounded-pill px-4 fw-bold" @click="clearFilters">
                        {{ $t('resources.clear_filters') || '清空所有筛选' }}
                    </button>
                </div>

                <!-- Results Grid -->
                <div v-else class="row g-2 g-md-3">
                    <div v-for="res in modrinthResults" :key="res.project_id" class="col-12 col-xl-6">
                        <div class="card resource-card h-100 border rounded-4 shadow-sm transition-all hover-grow overflow-hidden position-relative"
                             @click="fetchModDetails(res.project_id)">
                            <div class="card-body p-3 d-flex flex-column justify-content-between">
                                <div>
                                    <!-- Header: Icon + Title + Type Badge + Author -->
                                    <div class="d-flex gap-2 gap-md-3 mb-2">
                                        <div class="flex-shrink-0">
                                            <img :src="res.icon_url || defaultIcon"
                                                 class="rounded-3 border shadow-sm bg-white resource-card-icon"
                                                 @error="$event.target.src = defaultIcon">
                                        </div>
                                        <div class="flex-grow-1 min-width-0">
                                            <div class="d-flex justify-content-between align-items-start gap-1">
                                                <h6 class="fw-bold mb-1 text-truncate text-primary fs-6">{{ res.title }}</h6>
                                                <div class="d-flex align-items-center gap-1 flex-shrink-0">
                                                    <span v-if="isResourceInstalled(res)"
                                                          class="badge rounded-pill px-2 py-0-5 fw-bold bg-success text-white shadow-xs border border-success-subtle"
                                                          style="font-size: 0.68rem;">
                                                        <i class="fa-solid fa-circle-check me-1"></i>{{ $t('resources.installed') || '已安装' }}
                                                    </span>
                                                    <span class="badge rounded-pill px-2 py-1 flex-shrink-0 fw-semibold border"
                                                          style="font-size: 0.7rem;"
                                                          :class="getProjectTypeBadgeClass(res)">
                                                        {{ getProjectTypeName(res) }}
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="text-muted small text-truncate" style="font-size: 0.8rem;">
                                                <span>{{ $t('resources.author') }}: <strong class="text-body">{{ res.author }}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Description & AI Translation -->
                                    <div class="resource-description small text-muted mb-2 text-truncate-2" style="min-height: 2.6em; line-height: 1.35;">
                                        {{ translations[res.project_id] || res.description }}
                                    </div>
                                </div>

                                <!-- Footer: Tags + Stats + Action Buttons -->
                                <div>
                                    <!-- Categories Tags -->
                                    <div class="d-flex flex-wrap gap-1 mb-2">
                                        <span v-for="cat in (res.categories || []).slice(0, 3)" :key="cat"
                                              class="badge bg-body-secondary text-secondary-emphasis border rounded-pill px-2 py-0-5" style="font-size: 0.68rem;">
                                            {{ getCategoryName(cat) }}
                                        </span>
                                        <span v-if="(res.categories || []).length > 3" class="badge bg-body-secondary text-muted border rounded-pill px-2 py-0-5" style="font-size: 0.68rem;">
                                            +{{ res.categories.length - 3 }}
                                        </span>
                                    </div>

                                    <!-- Bottom Row: Download Count, Heart, Actions -->
                                    <div class="d-flex justify-content-between align-items-center pt-2 border-top gap-2 flex-wrap">
                                        <div class="d-flex gap-2 gap-md-3 text-muted small" style="font-size: 0.8rem;">
                                            <span :title="$t('resources.downloads')">
                                                <i class="fa-solid fa-download me-1 text-primary"></i>{{ formatDownloads(res.downloads) }}
                                            </span>
                                            <span :title="$t('resources.follows')">
                                                <i class="fa-regular fa-heart me-1 text-danger"></i>{{ formatDownloads(res.follows) }}
                                            </span>
                                        </div>

                                        <div class="d-flex gap-1 gap-md-2">
                                            <!-- AI Quick Translate Button -->
                                            <button class="btn btn-xs btn-outline-secondary rounded-pill px-2 fw-medium"
                                                    @click.stop="translateMod(res)"
                                                    :disabled="translatingModIds.has(res.project_id)">
                                                <i v-if="!translatingModIds.has(res.project_id)" class="fa-solid fa-language me-1"></i>
                                                <span v-else class="spinner-border spinner-border-sm me-1"></span>
                                                {{ translations[res.project_id] ? '原文' : '翻译' }}
                                            </button>
                                            <!-- Details / Install Button -->
                                            <button class="btn btn-xs btn-primary rounded-pill px-3 fw-bold shadow-sm"
                                                    @click.stop="fetchModDetails(res.project_id)">
                                                <i class="fa-solid fa-circle-info me-1"></i>{{ $t('resources.details_title') }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Load More Button -->
                    <div class="col-12 text-center py-3" v-if="hasMore">
                        <button class="btn btn-outline-primary rounded-pill px-4 fw-bold shadow-sm"
                                @click="loadMore"
                                :disabled="loadingModrinth">
                            <span v-if="loadingModrinth" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="fa-solid fa-chevron-down me-2"></i>
                            {{ loadingModrinth ? $t('common.loading') : $t('resources.load_more') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile Filter Drawer Bottom Sheet (Modern App Style) -->
        <Teleport to="body">
            <Transition name="fade">
                <div v-if="showMobileFilters" class="modal-backdrop fade show" style="z-index: 2050;" @click="showMobileFilters = false"></div>
            </Transition>
            <Transition name="slide-up">
                <div v-if="showMobileFilters" class="mobile-filter-drawer border-top shadow-2xl d-flex flex-column" style="z-index: 2055;">
                    <!-- Drawer Handle Bar -->
                    <div class="drawer-handle-bar py-2 d-flex justify-content-center cursor-pointer" @click="showMobileFilters = false">
                        <div class="drawer-handle"></div>
                    </div>

                    <!-- Drawer Header -->
                    <div class="drawer-header px-4 py-2 border-bottom d-flex justify-content-between align-items-center">
                        <h6 class="m-0 fw-bold d-flex align-items-center gap-2">
                            <i class="fa-solid fa-sliders text-primary"></i>
                            <span>{{ $t('resources.filter_drawer_title') || '高级筛选' }}</span>
                            <span v-if="activeFilterCount > 0" class="badge rounded-pill bg-primary-subtle text-primary border small ms-1">
                                已选 {{ activeFilterCount }} 项
                            </span>
                        </h6>
                        <button type="button" class="btn-close" @click="showMobileFilters = false"></button>
                    </div>

                    <!-- Drawer Body -->
                    <div class="drawer-body p-3 p-md-4 overflow-auto custom-scrollbar flex-grow-1">
                        <!-- Mobile Search -->
                        <div class="mb-3">
                            <label class="fw-bold small text-muted mb-2 d-flex align-items-center">
                                <i class="fa-solid fa-search me-1 text-primary"></i>{{ $t('common.search') }}
                            </label>
                            <input type="text" class="form-control rounded-pill" v-model="modrinthSearch"
                                   @keyup.enter="searchModrinth(true); showMobileFilters = false"
                                   :placeholder="$t('resources.search_placeholder')">
                        </div>

                        <!-- Platform / Loader Filter (Plugins / Mods) -->
                        <div class="mb-3" v-if="activePlatformOptions.length > 0">
                            <label class="fw-bold small text-muted mb-2 d-flex justify-content-between align-items-center">
                                <span><i class="fa-solid fa-microchip me-1 text-primary"></i>{{ currentTab === 'plugin' ? '服务端平台 (Platform)' : $t('mods.loader') }}</span>
                                <button v-if="filters.loaders.length > 0" class="btn btn-link btn-xs text-muted p-0 text-decoration-none" @click="filters.loaders = []">清空</button>
                            </label>
                            <div class="d-flex flex-wrap gap-2">
                                <div v-for="l in activePlatformOptions" :key="l.id">
                                    <input type="checkbox" class="btn-check" :value="l.id" v-model="filters.loaders" :id="'ml-'+l.id" autocomplete="off">
                                    <label class="btn btn-xs rounded-pill px-3 py-1-5 border fw-medium"
                                           :class="filters.loaders.includes(l.id) ? 'btn-primary' : 'btn-outline-secondary'"
                                           :for="'ml-'+l.id">
                                        {{ l.name }}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Game Versions -->
                        <div class="mb-3">
                            <label class="fw-bold small text-muted mb-2 d-flex justify-content-between align-items-center">
                                <span><i class="fa-solid fa-code-branch me-1 text-primary"></i>{{ $t('mods.game_version') }}</span>
                                <span v-if="currentInstanceMc" class="badge bg-secondary-subtle text-secondary border small">当前: {{ currentInstanceMc }}</span>
                            </label>
                            <div class="d-flex flex-wrap gap-2 overflow-auto p-2 border rounded-3" style="max-height: 140px; background: rgba(var(--c-primary-rgb), 0.03);">
                                <div v-for="v in ALL_VERSIONS" :key="v">
                                    <input type="checkbox" class="btn-check" :value="v" v-model="filters.versions" :id="'mv-'+v" autocomplete="off">
                                    <label class="btn btn-xs rounded-pill px-2 py-1 border fw-medium"
                                           :class="filters.versions.includes(v) ? 'btn-primary' : 'btn-outline-secondary'"
                                           :for="'mv-'+v">
                                        {{ v }}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Mod Environment (Mod tab only) -->
                        <div class="mb-3" v-if="currentTab === 'mod'">
                            <label class="fw-bold small text-muted mb-2 d-flex align-items-center">
                                <i class="fa-solid fa-server me-1 text-primary"></i>{{ $t('mods.modrinth.environment') }}
                            </label>
                            <div class="d-flex gap-2">
                                <div>
                                    <input type="checkbox" class="btn-check" value="server_side:required" v-model="filters.environment" id="menv-server" autocomplete="off">
                                    <label class="btn btn-xs rounded-pill px-3 py-1-5 border" :class="filters.environment.includes('server_side:required') ? 'btn-primary' : 'btn-outline-secondary'" for="menv-server">
                                        {{ $t('mods.modrinth.env.server') }}
                                    </label>
                                </div>
                                <div>
                                    <input type="checkbox" class="btn-check" value="client_side:required" v-model="filters.environment" id="menv-client" autocomplete="off">
                                    <label class="btn btn-xs rounded-pill px-3 py-1-5 border" :class="filters.environment.includes('client_side:required') ? 'btn-primary' : 'btn-outline-secondary'" for="menv-client">
                                        {{ $t('mods.modrinth.env.client') }}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Categories -->
                        <div class="mb-3" v-if="activeCategories.length > 0">
                            <label class="fw-bold small text-muted mb-2 d-flex align-items-center">
                                <i class="fa-solid fa-tags me-1 text-primary"></i>{{ $t('mods.categories_title') }}
                            </label>
                            <div class="d-flex flex-wrap gap-2 overflow-auto p-2 border rounded-3" style="max-height: 140px; background: rgba(var(--c-primary-rgb), 0.03);">
                                <div v-for="cat in activeCategories" :key="cat.id">
                                    <input type="checkbox" class="btn-check" :value="cat.id" v-model="filters.categories" :id="'mcat-'+cat.id" autocomplete="off">
                                    <label class="btn btn-xs rounded-pill px-2 py-1 border fw-medium"
                                           :class="filters.categories.includes(cat.id) ? 'btn-primary' : 'btn-outline-secondary'"
                                           :for="'mcat-'+cat.id">
                                        <i :class="cat.icon" class="me-1"></i>{{ getCategoryName(cat.id) }}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Drawer Sticky Footer -->
                    <div class="drawer-footer p-3 border-top d-flex gap-2">
                        <button class="btn btn-light border flex-grow-1 fw-bold rounded-pill" @click="clearFilters(); showMobileFilters = false">
                            <i class="fa-solid fa-rotate-left me-1"></i>{{ $t('resources.clear_filters') || '清空重置' }}
                        </button>
                        <button class="btn btn-primary flex-grow-1 fw-bold rounded-pill shadow-sm" @click="showMobileFilters = false; searchModrinth(true)">
                            <i class="fa-solid fa-check me-1"></i>{{ $t('common.confirm') || '查看结果' }}
                        </button>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Resource Details & Versions Dialog Modal (Responsive for Desktop & Mobile) -->
        <Teleport to="body">
            <Transition name="fade">
                <div v-if="loadingDetails" class="modal-backdrop fade show" style="z-index: 2060; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);">
                    <div class="h-100 d-flex flex-column align-items-center justify-content-center text-white gap-3">
                        <div class="spinner-border text-primary" style="width: 3.5rem; height: 3.5rem;"></div>
                        <h5 class="fw-bold tracking-wide">{{ $t('resources.loading_detail') }}</h5>
                    </div>
                </div>
            </Transition>

            <Transition name="fade">
                <div v-if="selectedMod" class="modal-backdrop fade show" style="z-index: 2060; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);"></div>
            </Transition>

            <Transition name="scale">
                <div v-if="selectedMod" class="modal show d-block" @click.self="selectedMod = null" style="z-index: 2070;">
                    <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable resource-modal-dialog" style="max-width: 1100px;">
                        <div class="modal-content shadow-2xl border-0 rounded-4 overflow-hidden h-100 resource-modal-content" style="max-height: 92vh; background-color: var(--c-surface) !important;">
                            <!-- Modal Header -->
                            <div class="modal-header border-bottom py-2 py-md-3 px-3 px-md-4 shadow-sm flex-shrink-0 bg-body">
                                <div class="d-flex align-items-center gap-2 gap-md-3 min-width-0">
                                    <img :src="selectedMod.project.icon_url || defaultIcon"
                                         class="rounded-3 border shadow-sm bg-white flex-shrink-0"
                                         width="44" height="44"
                                         style="object-fit: cover; width: 44px; height: 44px;"
                                         @error="$event.target.src = defaultIcon">
                                    <div class="min-width-0">
                                        <div class="d-flex align-items-center gap-2 flex-wrap">
                                            <h5 class="modal-title fw-bold text-truncate text-body mb-0 fs-6 fs-md-5">{{ selectedMod.project.title }}</h5>
                                            <span class="badge rounded-pill px-2 py-1 small fw-semibold border" :class="getProjectTypeBadgeClass(selectedMod.project)">
                                                {{ getProjectTypeName(selectedMod.project) }}
                                            </span>
                                        </div>
                                        <div class="small text-muted mt-0-5 text-truncate" style="font-size: 0.78rem;">
                                            <span>作者: <strong class="text-body">{{ selectedMod.project.author || selectedMod.project.team || 'Modrinth Author' }}</strong></span>
                                            <span class="mx-2">•</span>
                                            <a :href="'https://modrinth.com/' + (selectedMod.project.project_type || 'mod') + '/' + selectedMod.project.slug"
                                               target="_blank" class="text-primary text-decoration-none fw-medium">
                                                <i class="fa-solid fa-arrow-up-right-from-square me-1"></i>{{ $t('resources.open_modrinth') }}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" class="btn-close" @click="selectedMod = null"></button>
                            </div>

                            <!-- Mobile Segmented Tabs Switcher (< 992px) -->
                            <div class="d-lg-none px-3 pt-2 pb-2 border-bottom bg-body flex-shrink-0">
                                <div class="nav nav-pills nav-fill bg-body-tertiary p-1 rounded-pill border" role="tablist">
                                    <button type="button" class="nav-link rounded-pill py-1 px-3 small fw-bold"
                                            :class="{'active shadow-sm': mobileDetailTab === 'versions'}"
                                            @click="mobileDetailTab = 'versions'">
                                        <i class="fa-solid fa-download me-1"></i>{{ $t('resources.mobile_tab_versions') || '可用版本' }} ({{ filteredVersions.length }})
                                    </button>
                                    <button type="button" class="nav-link rounded-pill py-1 px-3 small fw-bold"
                                            :class="{'active shadow-sm': mobileDetailTab === 'readme'}"
                                            @click="mobileDetailTab = 'readme'">
                                        <i class="fa-solid fa-file-lines me-1"></i>{{ $t('resources.mobile_tab_readme') || '说明文档' }}
                                    </button>
                                </div>
                            </div>

                            <!-- Modal Body Layout (Responsive: Tabs on Mobile, Split columns on Desktop) -->
                            <div class="modal-body p-0 d-flex flex-column flex-lg-row overflow-hidden flex-grow-1">
                                <!-- Readme / Introduction Section -->
                                <div class="col-12 col-lg-7 border-end overflow-auto p-3 p-md-4 custom-scrollbar bg-body"
                                     :class="{'d-none d-lg-block': mobileDetailTab !== 'readme'}">
                                    <!-- Summary Quote -->
                                    <div class="p-3 rounded-4 bg-body-tertiary border mb-3 mb-md-4">
                                        <div class="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                                            <span class="fw-bold small text-muted text-uppercase">简要描述</span>
                                            <div class="d-flex gap-2">
                                                <span v-if="selectedMod.project.server_side" class="badge rounded-pill px-2 py-0-5 small border"
                                                      :class="selectedMod.project.server_side === 'required' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'">
                                                    服务端: {{ selectedMod.project.server_side }}
                                                </span>
                                                <span v-if="selectedMod.project.client_side" class="badge rounded-pill px-2 py-0-5 small border"
                                                      :class="selectedMod.project.client_side === 'required' ? 'bg-info-subtle text-info' : 'bg-secondary-subtle text-secondary'">
                                                    客户端: {{ selectedMod.project.client_side }}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="small text-body">{{ bodyTranslations[selectedMod.project.id + '_desc'] || selectedMod.project.description }}</div>
                                    </div>

                                    <!-- Full Markdown Documentation -->
                                    <div>
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <label class="fw-bold text-uppercase text-muted small m-0 d-flex align-items-center">
                                                <i class="fa-solid fa-file-lines me-2 text-primary"></i>详细说明文档
                                            </label>
                                            <button v-if="selectedMod.project.body" class="btn btn-xs btn-outline-primary rounded-pill px-3 fw-bold"
                                                    @click="translateBody" :disabled="translatingBody">
                                                <span v-if="translatingBody" class="spinner-border spinner-border-sm me-1"></span>
                                                <i v-else class="fa-solid fa-language me-1"></i>
                                                {{ translatingBody ? $t('mods.translating') : (bodyTranslations[selectedMod.project.id] ? '显示英文原文' : 'AI 中文翻译') }}
                                            </button>
                                        </div>

                                        <div class="markdown-body p-3 rounded-4 bg-body-tertiary border small text-body overflow-auto custom-scrollbar"
                                             style="max-height: 520px;"
                                             v-html="renderMarkdown(bodyTranslations[selectedMod.project.id] || selectedMod.project.body)">
                                        </div>
                                    </div>
                                </div>

                                <!-- Compatible Version Files & Download Section (Default tab on Mobile) -->
                                <div class="col-12 col-lg-5 overflow-auto p-3 p-md-4 custom-scrollbar bg-body-tertiary d-flex flex-column flex-grow-1"
                                     :class="{'d-none d-lg-flex': mobileDetailTab !== 'versions'}">
                                    <div class="mb-3">
                                        <h6 class="fw-bold text-body mb-2 d-flex align-items-center justify-content-between">
                                            <span><i class="fa-solid fa-download me-2 text-primary"></i>{{ $t('resources.compatible_versions') }}</span>
                                            <span class="badge bg-primary-subtle text-primary border rounded-pill small">{{ filteredVersions.length }} 个可用</span>
                                        </h6>
                                        <!-- Version Filter Controls -->
                                        <div class="d-flex gap-2 flex-wrap mb-2">
                                            <div class="flex-grow-1" style="min-width: 120px;">
                                                <CustomSelect v-model="filterGameVersion" :options="availableGameVersions" size="sm" width="100%" placeholder="游戏版本" />
                                            </div>
                                            <div class="flex-grow-1" style="min-width: 120px;" v-if="availableLoaders.length > 0">
                                                <CustomSelect v-model="filterLoader" :options="availableLoaders" size="sm" width="100%" placeholder="核心/架构" />
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Version List -->
                                    <div v-if="filteredVersions.length === 0" class="text-center py-5 my-auto text-muted">
                                        <i class="fa-solid fa-triangle-exclamation fa-2x mb-2 text-warning opacity-75"></i>
                                        <p class="small fw-bold mb-1">{{ $t('resources.no_versions') }}</p>
                                        <p class="small opacity-75">可尝试更改上方游戏版本或架构筛选条件</p>
                                    </div>

                                    <div v-else class="d-flex flex-column gap-2 gap-md-3 flex-grow-1">
                                        <div v-for="v in filteredVersions" :key="v.id"
                                             class="card version-item-card border rounded-4 shadow-sm transition-all"
                                             :class="{'border-primary bg-primary-subtle bg-opacity-10': isCompatibleWithCurrentInstance(v)}">
                                            <div class="card-body p-3">
                                                <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                                                    <div class="fw-bold text-body text-truncate fs-6" :title="v.name">{{ v.name }}</div>
                                                    <span class="badge rounded-pill text-uppercase"
                                                          :class="v.version_type === 'release' ? 'bg-success' : 'bg-warning text-dark'"
                                                          style="font-size: 0.65rem;">
                                                        {{ v.version_type }}
                                                    </span>
                                                </div>

                                                <div class="d-flex flex-wrap gap-1 mb-2">
                                                    <span v-if="isCompatibleWithCurrentInstance(v)" class="badge bg-success text-white rounded-pill small">
                                                        <i class="fa-solid fa-check me-1"></i>当前服推荐
                                                    </span>
                                                    <span v-for="g in v.game_versions.slice(0, 3)" :key="g" class="badge bg-secondary-subtle text-secondary border small">
                                                        {{ g }}
                                                    </span>
                                                    <span v-if="v.game_versions.length > 3" class="badge bg-secondary-subtle text-muted border small">
                                                        +{{ v.game_versions.length - 3 }}
                                                    </span>
                                                    <span v-for="l in v.loaders" :key="l" class="badge bg-info-subtle text-info border small text-capitalize">
                                                        {{ l }}
                                                    </span>
                                                </div>

                                                <div class="d-flex justify-content-between align-items-center text-muted small mb-2 pt-1 border-top" style="font-size: 0.78rem;">
                                                    <span><i class="fa-regular fa-calendar me-1"></i>{{ formatDate(v.date_published) }}</span>
                                                    <span v-if="v.files[0]"><i class="fa-solid fa-weight-hanging me-1"></i>{{ (v.files[0].size/1024/1024).toFixed(2) }} MB</span>
                                                </div>

                                                <!-- Download / Install Action Button -->
                                                <button class="btn btn-sm w-100 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 py-2"
                                                        :class="installedVersionIds.has(v.id) ? 'btn-success' : 'btn-primary'"
                                                        @click="startInstallWorkflow(v)"
                                                        :disabled="downloadingId === v.id || resolvingVersionId === v.id">
                                                    <span v-if="resolvingVersionId === v.id || downloadingId === v.id" class="spinner-border spinner-border-sm"></span>
                                                    <i v-else-if="installedVersionIds.has(v.id)" class="fa-solid fa-check"></i>
                                                    <i v-else class="fa-solid fa-cloud-arrow-down"></i>
                                                    <span>{{ getInstallButtonText(v) }}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Required Dependencies Resolution & Batch Installation Modal -->
        <Teleport to="body">
            <Transition name="fade">
                <div v-if="showDependencyModal" class="modal-backdrop fade show" style="z-index: 2080; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);"></div>
            </Transition>
            <Transition name="scale">
                <div v-if="showDependencyModal" class="modal show d-block" style="z-index: 2090;" @click.self="!isInstallingBatch && (showDependencyModal = false)">
                    <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable px-2">
                        <div class="modal-content shadow-2xl border-0 rounded-4 overflow-hidden" style="background-color: var(--c-surface) !important;">
                            <!-- Header -->
                            <div class="modal-header border-bottom py-3 px-3 px-md-4 bg-body">
                                <div class="d-flex align-items-center gap-2 gap-md-3 min-width-0">
                                    <div class="p-2 rounded-3 bg-primary-subtle text-primary border border-primary-subtle d-flex align-items-center justify-content-center flex-shrink-0">
                                        <i class="fa-solid fa-cubes-stacked fs-5 fs-md-4"></i>
                                    </div>
                                    <div class="min-width-0">
                                        <h5 class="modal-title fw-bold text-body mb-0 fs-6 fs-md-5">{{ $t('resources.dep_modal_title') || '前置依赖联动安装' }}</h5>
                                        <p class="text-muted small m-0 text-truncate" style="font-size: 0.78rem;">
                                            {{ $t('resources.dep_modal_subtitle') || '检测到当前版本包含必要的前置依赖，需要一并安装以确保正常运行' }}
                                        </p>
                                    </div>
                                </div>
                                <button type="button" class="btn-close" :disabled="isInstallingBatch" @click="showDependencyModal = false"></button>
                            </div>

                            <!-- Body -->
                            <div class="modal-body p-3 p-md-4 custom-scrollbar overflow-auto bg-body-tertiary" style="max-height: 60vh;">
                                <!-- Skipped Dependencies Notice -->
                                <div v-if="skippedDependencyList.length > 0" class="alert alert-success-subtle border border-success-subtle py-2 px-3 rounded-3 small mb-3 d-flex align-items-center gap-2">
                                    <i class="fa-solid fa-circle-check text-success flex-shrink-0"></i>
                                    <span class="text-success-emphasis">
                                        已自动检测并跳过当前实例已安装的 <strong>{{ skippedDependencyList.length }}</strong> 个前置依赖
                                        <span class="opacity-75">({{ skippedDependencyList.map(s => s.title).join('、') }})</span>
                                    </span>
                                </div>

                                <!-- Dependency Queue List -->
                                <div class="d-flex flex-column gap-2">
                                    <div v-for="(item, idx) in dependencyQueue" :key="item.versionId || idx"
                                         class="card border rounded-3 p-3 transition-all"
                                         :class="item.isTarget ? 'bg-primary-subtle bg-opacity-10 border-primary' : 'bg-body'">
                                        <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                                            <div class="d-flex align-items-center gap-2 gap-md-3 min-width-0">
                                                <img :src="item.icon_url || defaultIcon"
                                                     class="rounded-2 border bg-white flex-shrink-0"
                                                     width="38" height="38" style="object-fit: cover; width: 38px; height: 38px;"
                                                     @error="$event.target.src = defaultIcon">
                                                <div class="min-width-0">
                                                    <div class="d-flex align-items-center gap-1 gap-md-2 flex-wrap">
                                                        <span class="fw-bold text-body text-truncate fs-6" :title="item.title">{{ item.title }}</span>
                                                        <span v-if="item.isTarget" class="badge bg-primary text-white rounded-pill px-2 py-0-5" style="font-size: 0.65rem;">
                                                            {{ $t('resources.dep_target_badge') || '目标版本' }}
                                                        </span>
                                                        <span v-else class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2 py-0-5" style="font-size: 0.65rem;">
                                                            {{ $t('resources.dep_required_badge') || '必要前置' }}
                                                        </span>
                                                        <span class="badge bg-secondary-subtle text-secondary border rounded-pill px-2 py-0-5 text-uppercase" style="font-size: 0.65rem;">
                                                            {{ item.projectType || 'mod' }}
                                                        </span>
                                                    </div>
                                                    <div class="text-muted small mt-0-5 text-truncate" style="font-size: 0.78rem;">
                                                        <span class="font-monospace text-truncate d-inline-block" style="max-width: 260px;">{{ item.file?.filename || item.versionName }}</span>
                                                        <span v-if="item.file?.size" class="ms-1 opacity-75">({{ (item.file.size/1024/1024).toFixed(2) }} MB)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Status Indicator -->
                                            <div class="flex-shrink-0">
                                                <span v-if="item.status === 'pending'" class="badge bg-secondary-subtle text-secondary border rounded-pill px-3 py-1-5">
                                                    <i class="fa-regular fa-clock me-1"></i>{{ $t('resources.dep_pending') || '等待安装' }}
                                                </span>
                                                <span v-else-if="item.status === 'downloading'" class="badge bg-primary-subtle text-primary border rounded-pill px-3 py-1-5 d-flex align-items-center gap-1">
                                                    <span class="spinner-border spinner-border-sm"></span>
                                                    <span>{{ $t('resources.dep_downloading') || '正在下载部署...' }}</span>
                                                </span>
                                                <span v-else-if="item.status === 'done'" class="badge bg-success text-white rounded-pill px-3 py-1-5">
                                                    <i class="fa-solid fa-check me-1"></i>{{ $t('resources.dep_installed_done') || '安装完成' }}
                                                </span>
                                                <span v-else-if="item.status === 'error'" class="badge bg-danger text-white rounded-pill px-3 py-1-5" :title="item.errorMsg">
                                                    <i class="fa-solid fa-triangle-exclamation me-1"></i>失败
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div class="modal-footer border-top py-2 px-3 px-md-4 bg-body d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <span class="text-muted small">
                                    共包含 <strong>{{ dependencyQueue.length - 1 }}</strong> 个必要前置及 1 个目标资源
                                </span>
                                <div class="d-flex gap-2">
                                    <button v-if="!batchInstallDone" type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold"
                                            :disabled="isInstallingBatch" @click="showDependencyModal = false">
                                        {{ $t('common.cancel') || '取消' }}
                                    </button>
                                    <button v-if="!batchInstallDone" type="button" class="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                                            :disabled="isInstallingBatch" @click="executeDependencyBatchInstall">
                                        <span v-if="isInstallingBatch" class="spinner-border spinner-border-sm"></span>
                                        <i v-else class="fa-solid fa-cloud-arrow-down"></i>
                                        <span>{{ isInstallingBatch ? '正在依序安装...' : ($t('resources.dep_install_all_btn') || '一键安装全部前置与目标') }}</span>
                                    </button>
                                    <button v-else type="button" class="btn btn-success btn-sm rounded-pill px-4 fw-bold shadow-sm"
                                            @click="showDependencyModal = false">
                                        <i class="fa-solid fa-check me-1"></i>{{ $t('common.done') || '完成并关闭' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
    `,
    setup() {
        const { proxy } = getCurrentInstance();
        const $t = proxy.$t;

        const defaultIcon = 'https://modrinth.com/img/brand/icon_dark.svg';
        const modrinthSearch = ref('');
        const modrinthResults = ref([]);
        const loadingModrinth = ref(false);
        const loadingDetails = ref(false);
        const selectedMod = ref(null);
        const downloadingId = ref(null);
        const installedVersionIds = ref(new Set());
        const showMobileFilters = ref(false);
        const showBrowseAnyway = ref(false);
        const mobileDetailTab = ref('versions'); // 'versions' | 'readme'
        const offset = ref(0);
        const hasMore = ref(false);

        // 实例已安装资源索引集合
        const installedData = reactive({
            projectIds: new Set(),
            slugs: new Set(),
            modIds: new Set(),
            names: new Set(),
            filenames: new Set()
        });
        const loadingInstalled = ref(false);

        // 前置依赖联动安装状态
        const resolvingVersionId = ref(null);
        const showDependencyModal = ref(false);
        const dependencyQueue = ref([]);
        const skippedDependencyList = ref([]);
        const dependencyInstallTarget = ref(null);
        const isInstallingBatch = ref(false);
        const batchInstallDone = ref(false);

        const filterGameVersion = ref('');
        const filterLoader = ref('');
        const sortBy = ref('relevance');
        const ALL_VERSIONS = ref(['1.21.4', '1.21.3', '1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2', '1.18.2', '1.16.5']);

        const translations = reactive({});
        const translatingModIds = reactive(new Set());
        const bodyTranslations = reactive({});
        const translatingBody = ref(false);

        // 获取当前实例信息
        const currentInstance = computed(() => {
            const list = store.instanceList || [];
            return list.find(i => i.id === store.currentInstanceId) || {};
        });

        const activeCoreType = computed(() => {
            return (currentInstance.value.loaderType || store.stats.loaderType || 'fabric').toLowerCase();
        });

        const currentInstanceMc = computed(() => {
            return currentInstance.value.version?.mc || store.stats.version?.mc || store.stats.mc?.version || '';
        });

        // 核心架构类别判定
        const isVanillaInstance = computed(() => activeCoreType.value === 'vanilla');
        const isPluginInstance = computed(() => ['paper', 'purpur', 'spigot', 'bukkit', 'bungeecord', 'velocity'].includes(activeCoreType.value));
        const isModInstance = computed(() => ['fabric', 'forge', 'neoforge', 'quilt'].includes(activeCoreType.value));

        // 当前选中的大分类 (plugin / mod / datapack / resourcepack)
        const currentTab = ref(isPluginInstance.value ? 'plugin' : 'mod');

        const activeCoreText = computed(() => {
            const mc = currentInstanceMc.value ? ` ${currentInstanceMc.value}` : '';
            if (isVanillaInstance.value) return `官方原版 (Vanilla${mc})`;
            if (isPluginInstance.value) return `${activeCoreType.value.toUpperCase()}${mc} (插件服架构)`;
            return `${activeCoreType.value.toUpperCase()}${mc} (模组服架构)`;
        });

        const autoSelectedMessage = computed(() => {
            if (isVanillaInstance.value) return '原版服务端不加载第三方插件与模组';
            if (currentTab.value === 'plugin') return '已匹配 Paper/Purpur/Spigot 插件生态';
            if (currentTab.value === 'mod') return `已匹配 ${activeCoreType.value} 模组生态`;
            if (currentTab.value === 'datapack') return '已匹配 Minecraft 数据包生态';
            return '已匹配 Minecraft 资源包生态';
        });

        const currentCategoryLabel = computed(() => {
            if (currentTab.value === 'plugin') return '插件模式 (Plugins)';
            if (currentTab.value === 'datapack') return '数据包模式 (Datapacks)';
            if (currentTab.value === 'resourcepack') return '资源包模式 (Resource Packs)';
            return '模组模式 (Mods)';
        });

        const currentCategoryIcon = computed(() => {
            if (currentTab.value === 'plugin') return 'fa-solid fa-plug';
            if (currentTab.value === 'datapack') return 'fa-solid fa-box-archive';
            if (currentTab.value === 'resourcepack') return 'fa-solid fa-palette';
            return 'fa-solid fa-cubes';
        });

        const currentCategoryBadgeClass = computed(() => {
            if (currentTab.value === 'plugin') return 'bg-info-subtle text-info border-info-subtle';
            if (currentTab.value === 'datapack') return 'bg-warning-subtle text-warning border-warning-subtle';
            if (currentTab.value === 'resourcepack') return 'bg-primary-subtle text-primary border-primary-subtle';
            return 'bg-success-subtle text-success border-success-subtle';
        });

        // 平台与加载器配置
        const PLUGIN_PLATFORMS = [
            { id: 'paper', name: 'Paper' },
            { id: 'purpur', name: 'Purpur' },
            { id: 'spigot', name: 'Spigot' },
            { id: 'bukkit', name: 'Bukkit' },
            { id: 'bungeecord', name: 'BungeeCord' },
            { id: 'velocity', name: 'Velocity' }
        ];

        const MOD_LOADERS = [
            { id: 'fabric', name: 'Fabric' },
            { id: 'neoforge', name: 'NeoForge' },
            { id: 'forge', name: 'Forge' },
            { id: 'quilt', name: 'Quilt' }
        ];

        const activePlatformOptions = computed(() => {
            if (currentTab.value === 'plugin') return PLUGIN_PLATFORMS;
            if (currentTab.value === 'mod') return MOD_LOADERS;
            return [];
        });

        // 分类标签库
        const CATEGORIES = [
            { id: 'optimization', icon: 'fa-solid fa-gauge-high', for: ['mod', 'plugin'] },
            { id: 'economy', icon: 'fa-solid fa-coins', for: ['plugin'] },
            { id: 'management', icon: 'fa-solid fa-shield-halved', for: ['plugin', 'mod'] },
            { id: 'utility', icon: 'fa-solid fa-screwdriver-wrench', for: ['mod', 'plugin', 'datapack', 'resourcepack'] },
            { id: 'library', icon: 'fa-solid fa-book', for: ['mod', 'plugin'] },
            { id: 'minigame', icon: 'fa-solid fa-gamepad', for: ['plugin'] },
            { id: 'game-mechanics', icon: 'fa-solid fa-hammer', for: ['mod', 'plugin', 'datapack'] },
            { id: 'adventure', icon: 'fa-solid fa-compass', for: ['mod', 'datapack'] },
            { id: 'worldgen', icon: 'fa-solid fa-earth-americas', for: ['mod', 'datapack'] },
            { id: 'magic', icon: 'fa-solid fa-wand-sparkles', for: ['mod', 'datapack'] },
            { id: 'technology', icon: 'fa-solid fa-gear', for: ['mod'] },
            { id: 'storage', icon: 'fa-solid fa-box-open', for: ['mod'] },
            { id: 'decoration', icon: 'fa-solid fa-couch', for: ['mod', 'resourcepack'] },
            { id: 'equipment', icon: 'fa-solid fa-shield', for: ['mod'] },
            { id: 'food', icon: 'fa-solid fa-utensils', for: ['mod'] },
            { id: 'vanilla-like', icon: 'fa-solid fa-cube', for: ['resourcepack'] },
            { id: 'models', icon: 'fa-solid fa-shapes', for: ['resourcepack'] }
        ];

        const activeCategories = computed(() => {
            return CATEGORIES.filter(c => c.for.includes(currentTab.value));
        });

        const sortOptions = [
            { value: 'relevance', label: '相关度最高' },
            { value: 'downloads', label: '下载量最多' },
            { value: 'follows', label: '关注数最高' },
            { value: 'newest', label: '最新发布' },
            { value: 'updated', label: '最近更新' }
        ];

        // 筛选状态
        const filters = reactive({
            versions: [],
            loaders: [],
            categories: [],
            environment: []
        });

        // 计算当前生效的过滤选项数量
        const activeFilterCount = computed(() => {
            let count = 0;
            if (filters.loaders.length > 0) count += filters.loaders.length;
            if (filters.versions.length > 0) count += filters.versions.length;
            if (filters.categories.length > 0) count += filters.categories.length;
            if (filters.environment.length > 0) count += filters.environment.length;
            if (modrinthSearch.value.trim()) count += 1;
            return count;
        });

        // 初始化过滤器的平台默认值
        const initDefaultFilters = () => {
            if (currentTab.value === 'plugin') {
                if (PLUGIN_PLATFORMS.some(p => p.id === activeCoreType.value)) {
                    filters.loaders = [activeCoreType.value];
                } else {
                    filters.loaders = ['paper', 'spigot'];
                }
            } else if (currentTab.value === 'mod') {
                if (MOD_LOADERS.some(m => m.id === activeCoreType.value)) {
                    filters.loaders = [activeCoreType.value];
                } else {
                    filters.loaders = ['fabric'];
                }
            } else {
                filters.loaders = [];
            }

            if (currentInstanceMc.value && !filters.versions.length) {
                filters.versions = [currentInstanceMc.value];
            }
        };

        const switchTab = (tab) => {
            if (currentTab.value === tab) return;
            currentTab.value = tab;
            filters.categories = [];
            filters.environment = [];
            initDefaultFilters();
            searchModrinth(true);
        };

        const clearFilters = () => {
            filters.categories = [];
            filters.environment = [];
            filters.versions = currentInstanceMc.value ? [currentInstanceMc.value] : [];
            modrinthSearch.value = '';
            initDefaultFilters();
            searchModrinth(true);
        };

        const goToSettings = () => {
            store.view = 'properties';
        };

        const getCategoryName = (catId) => {
            const key = `mods.categories.${catId}`;
            const res = $t(key);
            return (res && !res.startsWith('mods.categories.')) ? res : catId;
        };

        // 核心资源类型推导逻辑 (解决 Modrinth 所有资源底层 project_type 均为 mod 导致的显示错误)
        const resolveResourceType = (item) => {
            if (!item) return currentTab.value || 'mod';

            // 1. 如果在当前特定 Tab 下浏览，以当前激活的模式优先
            if (currentTab.value === 'plugin') return 'plugin';
            if (currentTab.value === 'datapack') return 'datapack';
            if (currentTab.value === 'resourcepack') return 'resourcepack';

            const pType = (item.project_type || '').toLowerCase();
            const allTypes = (item.all_project_types || []).map(t => t.toLowerCase());
            const categories = (item.categories || item.loaders || []).map(c => c.toLowerCase());

            // 2. 根据对象元数据精准推断
            if (pType === 'resourcepack' || allTypes.includes('resourcepack') || categories.includes('resourcepack')) {
                return 'resourcepack';
            }
            if (pType === 'datapack' || allTypes.includes('datapack') || categories.includes('datapack')) {
                return 'datapack';
            }
            const pluginKeywords = ['paper', 'spigot', 'purpur', 'bukkit', 'bungeecord', 'velocity', 'folia', 'sponge'];
            const modKeywords = ['fabric', 'forge', 'neoforge', 'quilt'];
            const hasPluginTag = categories.some(c => pluginKeywords.includes(c));
            const hasModTag = categories.some(c => modKeywords.includes(c));

            if (pType === 'plugin' || allTypes.includes('plugin') || (hasPluginTag && !hasModTag)) {
                return 'plugin';
            }
            return 'mod';
        };

        const getProjectTypeName = (item) => {
            const type = typeof item === 'string' ? item : resolveResourceType(item);
            if (type === 'plugin') return $t('resources.type_plugin') || '插件 (Plugin)';
            if (type === 'datapack') return $t('resources.type_datapack') || '数据包 (Datapack)';
            if (type === 'resourcepack') return $t('resources.type_resourcepack') || '资源包 (Resource Pack)';
            return $t('resources.type_mod') || '模组 (Mod)';
        };

        const getProjectTypeBadgeClass = (item) => {
            const type = typeof item === 'string' ? item : resolveResourceType(item);
            if (type === 'plugin') return 'bg-info-subtle text-info border-info-subtle';
            if (type === 'datapack') return 'bg-warning-subtle text-warning border-warning-subtle';
            if (type === 'resourcepack') return 'bg-primary-subtle text-primary border-primary-subtle';
            return 'bg-success-subtle text-success border-success-subtle';
        };

        const formatDownloads = (num) => {
            if (!num && num !== 0) return '0';
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return String(num);
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString(store.lang === 'zh' ? 'zh-CN' : 'en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        };

        const renderMarkdown = (text) => {
            if (!text) return '';
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/_(.*?)_/g, '<em>$1</em>')
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-primary text-decoration-none">$1</a>')
                .replace(/^# (.*$)/gim, '<h4 class="mt-3 mb-2 fw-bold text-body">$1</h4>')
                .replace(/^## (.*$)/gim, '<h5 class="mt-3 mb-2 fw-bold text-body">$1</h5>')
                .replace(/^### (.*$)/gim, '<h6 class="mt-3 mb-2 fw-bold text-body">$1</h6>')
                .replace(/^\* (.*$)/gim, '<li class="ms-3">$1</li>')
                .replace(/^- (.*$)/gim, '<li class="ms-3">$1</li>')
                .replace(/\n\n/g, '<br><br>')
                .replace(/\n/g, '<br>');
        };

        // Modrinth API 搜索
        const searchModrinth = async (reset = true) => {
            if (reset) {
                modrinthResults.value = [];
                offset.value = 0;
            }
            loadingModrinth.value = true;

            try {
                // 构造 facets 过滤规则
                const facets = [[`project_type:${currentTab.value}`]];

                if (filters.loaders.length > 0) {
                    facets.push(filters.loaders.map(l => `categories:${l}`));
                }

                if (filters.versions.length > 0) {
                    facets.push(filters.versions.map(v => `versions:${v}`));
                }

                if (filters.categories.length > 0) {
                    filters.categories.forEach(cat => {
                        facets.push([`categories:${cat}`]);
                    });
                }

                if (filters.environment.length > 0) {
                    filters.environment.forEach(env => {
                        facets.push([env]);
                    });
                }

                const res = await api.get(`${API_BASE}/search`, {
                    params: {
                        q: modrinthSearch.value,
                        facets: JSON.stringify(facets),
                        offset: offset.value,
                        limit: 20,
                        index: sortBy.value
                    }
                });

                if (res.data && Array.isArray(res.data.hits)) {
                    modrinthResults.value = [...modrinthResults.value, ...res.data.hits];
                    hasMore.value = res.data.hits.length === 20;
                }
            } catch (e) {
                console.error('[Resource Downloader] Search error:', e);
                showToast('搜索资源失败，请检查网络连接', 'danger');
            } finally {
                loadingModrinth.value = false;
            }
        };

        const loadMore = () => {
            offset.value += 20;
            searchModrinth(false);
        };

        // 快捷卡片描述翻译
        const translateMod = async (mod) => {
            if (translations[mod.project_id]) {
                delete translations[mod.project_id];
                return;
            }
            translatingModIds.add(mod.project_id);
            try {
                const res = await api.post('/api/ai/translate', { text: mod.description });
                if (res.data?.translated) {
                    translations[mod.project_id] = res.data.translated;
                }
            } catch (e) {
                showToast(e.response?.data?.message || 'AI 翻译失败，请在面板设置中检查 AI 配置', 'warning');
            } finally {
                translatingModIds.delete(mod.project_id);
            }
        };

        // 全文文档翻译
        const translateBody = async () => {
            const id = selectedMod.value?.project?.id;
            if (!id || !selectedMod.value.project.body) return;
            if (bodyTranslations[id]) {
                delete bodyTranslations[id];
                delete bodyTranslations[id + '_desc'];
                return;
            }

            translatingBody.value = true;
            try {
                const [resBody, resDesc] = await Promise.all([
                    api.post('/api/ai/translate', { text: selectedMod.value.project.body }),
                    api.post('/api/ai/translate', { text: selectedMod.value.project.description })
                ]);
                bodyTranslations[id] = resBody.data?.translated;
                bodyTranslations[id + '_desc'] = resDesc.data?.translated;
            } catch (e) {
                showToast(e.response?.data?.message || 'AI 翻译失败，请在面板设置中检查配置', 'warning');
            } finally {
                translatingBody.value = false;
            }
        };

        // 获取资源详细信息与所有版本
        const fetchModDetails = async (id) => {
            loadingDetails.value = true;
            mobileDetailTab.value = 'versions'; // 移动端默认直接展示可用版本下载
            try {
                const res = await api.get(`${API_BASE}/project/${id}`);
                selectedMod.value = res.data;

                // 预填弹窗内部版本过滤器
                if (availableGameVersions.value.length > 0) {
                    filterGameVersion.value = availableGameVersions.value.some(v => v.value === currentInstanceMc.value)
                        ? currentInstanceMc.value
                        : '';
                }

                if (availableLoaders.value.length > 0) {
                    const match = availableLoaders.value.find(l => l.value === activeCoreType.value);
                    filterLoader.value = match ? match.value : '';
                }
            } catch (e) {
                console.error('[Resource Downloader] Fetch details error:', e);
                showToast('获取资源版本详情失败', 'danger');
            } finally {
                loadingDetails.value = false;
            }
        };

        // 弹窗内的可用游戏版本选项
        const availableGameVersions = computed(() => {
            if (!selectedMod.value?.versions) return [];
            const set = new Set();
            selectedMod.value.versions.forEach(v => {
                (v.game_versions || []).forEach(gv => set.add(gv));
            });
            const list = Array.from(set);
            return [
                { value: '', label: '全部游戏版本' },
                ...list.map(v => ({ value: v, label: v }))
            ];
        });

        // 弹窗内的可用加载器选项
        const availableLoaders = computed(() => {
            if (!selectedMod.value?.versions) return [];
            const set = new Set();
            selectedMod.value.versions.forEach(v => {
                (v.loaders || []).forEach(l => set.add(l));
            });
            const list = Array.from(set);
            return [
                { value: '', label: '全部加载器/平台' },
                ...list.map(l => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))
            ];
        });

        // 过滤出的版本列表
        const filteredVersions = computed(() => {
            if (!selectedMod.value?.versions) return [];
            return selectedMod.value.versions.filter(v => {
                const matchGame = !filterGameVersion.value || (v.game_versions || []).includes(filterGameVersion.value);
                const matchLoader = !filterLoader.value || (v.loaders || []).includes(filterLoader.value);
                return matchGame && matchLoader;
            });
        });

        // 判断版本是否与当前实例匹配
        const isCompatibleWithCurrentInstance = (v) => {
            if (!currentInstanceMc.value) return false;
            const hasMc = (v.game_versions || []).includes(currentInstanceMc.value);
            const hasLoader = (v.loaders || []).includes(activeCoreType.value);
            return hasMc && hasLoader;
        };

        // 获取当前实例已安装资源索引
        const fetchInstalledResources = async () => {
            if (!store.currentInstanceId) return;
            loadingInstalled.value = true;
            try {
                const res = await api.get(`${API_BASE}/installed`, {
                    params: { instanceId: store.currentInstanceId }
                });
                if (res.data) {
                    installedData.projectIds = new Set((res.data.projectIds || []).map(String));
                    installedData.slugs = new Set((res.data.slugs || []).map(s => String(s).toLowerCase()));
                    installedData.modIds = new Set((res.data.modIds || []).map(s => String(s).toLowerCase()));
                    installedData.names = new Set((res.data.names || []).map(s => String(s).toLowerCase()));
                    installedData.filenames = new Set((res.data.filenames || []).map(s => String(s).toLowerCase()));
                }
            } catch (e) {
                console.warn('[Resource Downloader] 获取已安装资源表失败:', e.message);
            } finally {
                loadingInstalled.value = false;
            }
        };

        // 判断任意资源是否已安装在当前实例
        const isResourceInstalled = (res) => {
            if (!res) return false;
            const pid = res.project_id || res.id;
            if (pid && installedData.projectIds.has(String(pid))) return true;

            const slug = (res.slug || '').toLowerCase();
            if (slug) {
                if (installedData.slugs.has(slug) || installedData.modIds.has(slug)) return true;
                const baseSlug = slug.split(/[-_]\d+/)[0];
                if (baseSlug && (installedData.slugs.has(baseSlug) || installedData.modIds.has(baseSlug))) return true;
            }

            const title = (res.title || '').toLowerCase();
            if (title && (installedData.names.has(title) || installedData.slugs.has(title))) return true;

            return false;
        };

        const getInstallButtonText = (v) => {
            if (resolvingVersionId.value === v.id) return '正在分析前置依赖...';
            if (downloadingId.value === v.id) return '正在下载部署...';
            if (installedVersionIds.value.has(v.id)) return '已安装 (重新安装)';
            return '一键安装此版本';
        };

        // 一键安装版本文件 (单文件)
        const downloadResourceForVersion = async (version) => {
            if (!version) return;
            const primaryFile = version.files.find(f => f.primary) || version.files[0];
            if (!primaryFile) return;

            downloadingId.value = version.id;
            try {
                const res = await api.post(`${API_BASE}/download`, {
                    url: primaryFile.url,
                    filename: primaryFile.filename,
                    type: currentTab.value,
                    projectType: currentTab.value,
                    projectId: selectedMod.value?.project?.id,
                    slug: selectedMod.value?.project?.slug,
                    title: selectedMod.value?.project?.title,
                    versionId: version.id,
                    instanceId: store.currentInstanceId
                });

                installedVersionIds.value.add(version.id);
                if (selectedMod.value?.project?.id) {
                    installedData.projectIds.add(String(selectedMod.value.project.id));
                }
                if (selectedMod.value?.project?.slug) {
                    installedData.slugs.add(String(selectedMod.value.project.slug).toLowerCase());
                }

                const subDir = res.data?.targetDir || (currentTab.value === 'plugin' ? 'plugins' : (currentTab.value === 'datapack' ? 'world/datapacks' : (currentTab.value === 'resourcepack' ? 'resourcepacks' : 'mods')));
                showToast(`成功将 ${selectedMod.value?.project?.title || primaryFile.filename} 安装到 ${subDir}/ 目录！`, 'success');

                // 静默刷新已安装索引
                await fetchInstalledResources();
            } catch (e) {
                console.error('[Resource Downloader] Download fail:', e);
                showToast(`下载安装失败: ${e.response?.data?.error || e.message}`, 'danger');
            } finally {
                downloadingId.value = null;
            }
        };

        // 启动安装工作流：解析必要前置，无前置直接装，有前置弹窗联动安装
        const startInstallWorkflow = async (version) => {
            if (!version || downloadingId.value || resolvingVersionId.value) return;

            resolvingVersionId.value = version.id;
            try {
                const res = await api.post(`${API_BASE}/resolve-dependencies`, {
                    versionId: version.id,
                    projectId: selectedMod.value?.project?.id,
                    gameVersion: currentInstanceMc.value || filterGameVersion.value || '',
                    loader: activeCoreType.value || filterLoader.value || '',
                    instanceId: store.currentInstanceId
                });

                const { hasRequiredDeps, requiredDeps, skippedDeps } = res.data || {};
                skippedDependencyList.value = skippedDeps || [];

                // 若没有未安装的前置依赖，直接安装主资源
                if (!hasRequiredDeps || !requiredDeps || requiredDeps.length === 0) {
                    await downloadResourceForVersion(version);
                    return;
                }

                // 存在未安装的必要前置：构建队列并打开弹窗
                dependencyInstallTarget.value = version;

                const queue = (requiredDeps || []).map(dep => ({
                    ...dep,
                    status: 'pending',
                    isTarget: false
                }));

                const primaryFile = version.files.find(f => f.primary) || version.files[0];
                queue.push({
                    projectId: selectedMod.value?.project?.id,
                    title: selectedMod.value?.project?.title,
                    slug: selectedMod.value?.project?.slug,
                    icon_url: selectedMod.value?.project?.icon_url,
                    projectType: currentTab.value,
                    versionId: version.id,
                    versionName: version.name,
                    file: {
                        url: primaryFile.url,
                        filename: primaryFile.filename,
                        size: primaryFile.size
                    },
                    status: 'pending',
                    isTarget: true
                });

                dependencyQueue.value = queue;
                batchInstallDone.value = false;
                showDependencyModal.value = true;
            } catch (e) {
                console.error('[Dependencies] 解析前置依赖出错:', e);
                showToast('解析前置依赖失败，将直接尝试安装主文件: ' + (e.response?.data?.error || e.message), 'warning');
                await downloadResourceForVersion(version);
            } finally {
                resolvingVersionId.value = null;
            }
        };

        // 执行批量依赖安装
        const executeDependencyBatchInstall = async () => {
            if (isInstallingBatch.value || dependencyQueue.value.length === 0) return;
            isInstallingBatch.value = true;

            let successCount = 0;
            let targetInstalled = false;

            for (let i = 0; i < dependencyQueue.value.length; i++) {
                const item = dependencyQueue.value[i];
                if (item.status === 'done') continue;

                item.status = 'downloading';
                try {
                    await api.post(`${API_BASE}/download`, {
                        url: item.file.url,
                        filename: item.file.filename,
                        type: item.projectType || 'mod',
                        projectType: item.projectType || 'mod',
                        projectId: item.projectId,
                        slug: item.slug,
                        title: item.title,
                        versionId: item.versionId,
                        instanceId: store.currentInstanceId
                    });

                    item.status = 'done';
                    successCount++;
                    if (item.isTarget) {
                        targetInstalled = true;
                        installedVersionIds.value.add(item.versionId);
                    }
                } catch (e) {
                    item.status = 'error';
                    item.errorMsg = e.response?.data?.error || e.message;
                    console.error(`下载安装依赖 [${item.title}] 失败:`, e);
                }
            }

            isInstallingBatch.value = false;
            batchInstallDone.value = true;

            // 重新刷新已安装集合
            await fetchInstalledResources();

            if (targetInstalled) {
                const depsCount = successCount - 1;
                if (depsCount > 0) {
                    showToast(`成功安装 ${dependencyInstallTarget.value?.name || '目标资源'} 及 ${depsCount} 个必要前置依赖！`, 'success');
                } else {
                    showToast(`成功安装 ${dependencyInstallTarget.value?.name || '目标资源'}！`, 'success');
                }
            } else {
                showToast('部分前置依赖或目标安装失败，请检查网络或日志', 'danger');
            }
        };

        // 获取官方最新游戏版本列表
        const fetchVersions = async () => {
            try {
                const res = await api.get(`${API_BASE}/versions`);
                if (res.data && Array.isArray(res.data)) {
                    ALL_VERSIONS.value = res.data
                        .filter(v => v.version_type === 'release')
                        .map(v => v.version)
                        .slice(0, 45);
                }
            } catch (e) {
                console.warn('[Resource Downloader] Fetching Minecraft version list failed, using defaults.', e.message);
            }
        };

        // 监听实例或核心切换
        watch(() => store.currentInstanceId, () => {
            currentTab.value = isPluginInstance.value ? 'plugin' : 'mod';
            initDefaultFilters();
            fetchInstalledResources();
            searchModrinth(true);
        });

        onMounted(async () => {
            await Promise.all([
                fetchVersions(),
                fetchInstalledResources()
            ]);
            initDefaultFilters();
            searchModrinth(true);
        });

        return {
            defaultIcon, modrinthSearch, modrinthResults, loadingModrinth, loadingDetails,
            selectedMod, downloadingId, installedVersionIds, showMobileFilters, showBrowseAnyway,
            mobileDetailTab, activeFilterCount, filterGameVersion, filterLoader,
            availableGameVersions, availableLoaders, filteredVersions, currentTab,
            isVanillaInstance, activeCoreText, autoSelectedMessage, currentCategoryLabel,
            currentCategoryIcon, currentCategoryBadgeClass, activePlatformOptions,
            activeCategories, sortOptions, sortBy, filters, ALL_VERSIONS, currentInstanceMc,
            translations, translatingModIds, bodyTranslations, translatingBody, hasMore,
            switchTab, clearFilters, goToSettings, getCategoryName, getProjectTypeName,
            getProjectTypeBadgeClass, formatDownloads, formatDate, renderMarkdown,
            searchModrinth, loadMore, translateMod, translateBody, fetchModDetails,
            isCompatibleWithCurrentInstance, getInstallButtonText, downloadResourceForVersion,
            // 新增依赖与已安装导出
            installedData, isResourceInstalled, fetchInstalledResources,
            resolvingVersionId, showDependencyModal, dependencyQueue, skippedDependencyList,
            dependencyInstallTarget, isInstallingBatch, batchInstallDone,
            startInstallWorkflow, executeDependencyBatchInstall
        };
    }
};
