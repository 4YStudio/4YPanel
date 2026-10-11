# MC Web Panel 全架构支持改造计划 (插件服 & 原版服)

> **创建时间**：2026-10-12  
> **文档定位**：全功能支持 **原版服 (Vanilla)** 与 **主流现代插件服 (Paper / Purpur / Spigot)** 的全景架构规划、技术设计、改动文件清单与分阶段实施路线图。即使当前会话中断或重新开启，也可直接依据此文档无缝恢复全部上下文与思考成果。

---

## 目录
1. [背景与现状评估](#1-背景与现状评估)
2. [全架构兼容性与可行性论证](#2-全架构兼容性与可行性论证)
3. [核心技术方案设计](#3-核心技术方案设计)
   - 3.1 [服务端核心类型与下载源矩阵](#31-服务端核心类型与下载源矩阵)
   - 3.2 [实例模型 (Instance Schema) 与架构分类](#32-实例模型-instance-schema-与架构分类)
   - 3.3 [插件管理体系与本地元数据解析](#33-插件管理体系与本地元数据解析)
   - 3.4 [前端多架构动态呈现逻辑](#34-前端多架构动态呈现逻辑)
4. [详细代码与文件改动清单](#4-详细代码与文件改动清单)
5. [分阶段实施路线图 (Phase 1 ~ 4)](#5-分阶段实施路线图-phase-1--4)
6. [技术风险评估与避坑指南](#6-技术风险评估与避坑指南)

---

## 1. 背景与现状评估

### 1.1 现状分析
当前面板主要面向**模组服 (Modded Server)**，底层逻辑与前端存在以下模组绑定假定：
1. **核心安装与版本切换**：仅内置了 `fabric`、`forge`、`neoforge` 三种加载器的抓取与安装逻辑；
2. **扩展目录假定**：扩展组件管理强绑定于每个实例的 `mods/` 文件夹；
3. **侧边栏导航**：侧边栏写死展示「模组管理」菜单，并未根据实例类型做条件分支。

### 1.2 改造目标
在**100% 保持现有模组服（Fabric/Forge/NeoForge）零破坏兼容**的前提下，让面板升级为多架构全能服务器面板，全面支持：
1. **原版服 (Vanilla)**：Mojang 官方官方服务端核心 `server.jar`；
2. **现代插件服 (Paper / Purpur / Spigot)**：基于 Bukkit/Spigot 生态的高性能插件服务器；
3. **原有模组服 (Fabric / Forge / NeoForge)**：无缝保持原有体验。

---

## 2. 全架构兼容性与可行性论证

### 2.1 为什么改造成本低、难度小？
面板的底层底座本质上是**全通用的 Minecraft Java Edition 服务端管理器**，以下核心能力全部基于 Minecraft 原版通用规范，无需任何底层改动即可 100% 适配原版服与插件服：
- **进程生命周期与守护**：`child_process.spawn('java', ...)` 启停控制对所有核心通用；
- **控制台交互与监控**：标准输入输出流（`stdin` / `stdout`）、CPU/内存采集、实时玩家统计对所有核心通用；
- **基础配置文件**：`server.properties`、`eula.txt` 规则在原版、插件服、模组服完全一致；
- **玩家管理系统**：`ops.json`、`whitelist.json`、`banned-players.json`、`banned-ips.json`、`usercache.json` 格式完全一致；
- **文件管理器 (FileManager)**：查看与编辑插件配置（如 `plugins/Essentials/config.yml`、`paper-global.yml`、`spigot.yml`）天然支持；
- **卷轴工坊 (Scrolls)**：卷轴底层依托于原版指令（`/tellraw`, `/scoreboard`, `/execute`）与原生数据包机制，在 Paper/Purpur/Vanilla 上表现甚至优于模组服；
- **备份与恢复系统**：针对整个实例目录打包，天然无缝覆盖插件和原版世界。

### 2.2 兼容性保障准则
1. **旧实例平滑继承**：历史实例配置中未指定或指定为 `fabric` 的，继续保持模组服模式，不影响既有数据；
2. **核心隔离**：不同实例可自由选择不同核心（实例 A 是 Paper 插件服，实例 B 是 Fabric 模组服，实例 C 是 Vanilla 原版服），互不干扰。

---

## 3. 核心技术方案设计

### 3.1 服务端核心类型与下载源矩阵

| 架构分类 | 标识 `loaderType` | 核心名称 | 官方/权威 API 接口 | 安装方式 |
| :--- | :--- | :--- | :--- | :--- |
| **官方原版** | `vanilla` | Vanilla Server | Mojang Manifest: `https://piston-meta.mojang.com/mc/game/version_manifest_v2.json` | 单 Jar 直装（读取对应版本的 `downloads.server.url`） |
| **现代插件服** | `paper` | PaperMC (推荐) | PaperMC API v2: `https://api.papermc.io/v2/projects/paper` | 单 Jar 直装（下载最新构建 build） |
| **现代插件服** | `purpur` | Purpur (高性能) | Purpur API v2: `https://api.purpurmc.org/v2/purpur` | 单 Jar 直装（下载最新构建 build） |
| **经典插件服** | `spigot` | Spigot | Hub Spigot / 社区镜像 / 预编译源 | 单 Jar 直装 |
| **轻量模组服** | `fabric` | Fabric Loader | Fabric Meta: `https://meta.fabricmc.net/v2/` | 单 Jar 直装（现有逻辑不变） |
| **重型模组服** | `forge` | Minecraft Forge | Forge Maven: `https://maven.minecraftforge.net/` | 运行安装器生成脚本（现有逻辑不变） |
| **重型模组服** | `neoforge` | NeoForge | NeoForge Maven: `https://maven.neoforged.net/` | 运行安装器生成脚本（现有逻辑不变） |

> **启动特性**：Vanilla、Paper、Purpur 均使用 `java [jvm_args] -jar <jarName> nogui` 直接拉起，比 Forge 复杂脚本更加稳定纯粹。

### 3.2 实例模型 (Instance Schema) 与架构分类

在实例配置中（`data/instances.json`），`loaderType` 扩充以下枚举：
```typescript
type LoaderType = 'vanilla' | 'paper' | 'purpur' | 'spigot' | 'fabric' | 'forge' | 'neoforge';
```

后端与前端提供统一的辅助判断分类器：
```javascript
const isModdedLoader = (type) => ['fabric', 'forge', 'neoforge'].includes(type);
const isPluginLoader = (type) => ['paper', 'purpur', 'spigot'].includes(type);
const isVanillaLoader = (type) => type === 'vanilla';
```

### 3.3 插件管理体系与本地元数据解析

#### A. 实例目录与系统插件隔离
- **面板系统插件**：项目根目录 `plugins/`（面板自身的 JS 插件）；
- **实例插件目录**：`instances/<instanceId>/plugins/`（Minecraft 服务端运行加载的 `.jar` 插件）。两者层级绝对隔离，语义明确。

#### B. 本地 Jar 插件元数据解析引擎 (`parseLocalPluginJar`)
在 `server.js` 中增加流式解包读取 `plugin.yml`（Bukkit 插件标准规范）：
- 读取字段：
  - `name`: 插件显示名称
  - `version`: 插件版本号
  - `author` / `authors`: 作者
  - `description`: 描述信息
  - `main`: 主类路径
  - `api-version`: 支持的 Bukkit API 版本（如 1.20）
  - `depend` / `softdepend`: 依赖列表
- 插件启用/禁用：遵循行业通用做法，重命名为 `.jar.disabled`。

#### C. 在线插件检索与一键下载
- **在线源**：复用现有 Modrinth 体系。
- **请求参数**：搜索时根据实例类型设定 `facets`：
  - 模组服：`facets=[["project_type:mod"], ["categories:<loader>"]]`
  - 插件服：`facets=[["project_type:plugin"], ["categories:spigot", "categories:paper", "categories:purpur"]]`
- 无需引入新依赖，极速开箱即用。

### 3.4 前端多架构动态呈现逻辑

#### A. 侧边栏菜单智能切换 (`Sidebar.js`)
- 若当前实例为 **模组服** $\to$ 渲染「模组管理」（`sidebar.mods`，图标 `fa-microchip`）；
- 若当前实例为 **插件服** $\to$ 自动动态渲染为「插件管理」（`sidebar.plugins`，图标 `fa-puzzle-piece`）；
- 若当前实例为 **原版服** $\to$ 自动隐藏该栏目（保持界面纯粹高雅）。

#### B. 版本切换与核心安装模态框 (`ServerPropertiesManager.js`)
- 模态框提供架构选择器：
  - **模组核心 (Mods)**：`Fabric (推荐)`、`Forge`、`NeoForge`；
  - **插件核心 (Plugins)**：`Paper (主流推荐)`、`Purpur (高配性能优化)`、`Spigot`；
  - **官方原版 (Vanilla)**：`Vanilla (官方服务端)`。
- 选择 `Vanilla` 时，下拉框自动精简为只选游戏版本（如 `1.20.1`、`1.21`），隐藏 Loader 版本下拉框，实现一键秒级安装。

---

## 4. 详细代码与文件改动清单

### 4.1 后端文件
- [`server.js`](file:///home/henvei/文档/云语软件中心相关开发/mc-web-panel/server.js)：
  1. **版本拉取 API 扩充**：
     - `fetchVanillaMcVersions()`：对接 Mojang Version Manifest；
     - `fetchPaperMcVersions()` 与 `fetchPaperBuilds(gameVersion)`：对接 PaperMC API；
     - `fetchPurpurVersions()`：对接 Purpur API；
  2. **核心安装引擎扩展**：
     - `installLoaderCore`：针对 `vanilla`、`paper`、`purpur` 实现直链下载流式写入目标 jar；
  3. **插件扩展 API**：
     - `/api/plugins/local/list` 与 `/api/plugins/local/toggle`：管理 `instances/<id>/plugins/` 目录；
     - `parseLocalPluginJar`：解析 `plugin.yml`；
     - `/api/mods/modrinth/search`：支持根据当前实例类型自动透传 `project_type=plugin` 或 `project_type=mod`。

### 4.2 前端文件
- [`public/js/components/Sidebar.js`](file:///home/henvei/文档/云语软件中心相关开发/mc-web-panel/public/js/components/Sidebar.js)：
  - 根据实例 `loaderType` 动态调整菜单项文案与图标（模组 vs 插件 vs 原版隐藏）；
- [`public/js/components/ServerPropertiesManager.js`](file:///home/henvei/文档/云语软件中心相关开发/mc-web-panel/public/js/components/ServerPropertiesManager.js)：
  - 版本切换模态框重构，分组展示模组核心/插件核心/官方原版；
  - 针对原版核心简化安装步骤；
- [`public/js/components/ModsManager.js`](file:///home/henvei/文档/云语软件中心相关开发/mc-web-panel/public/js/components/ModsManager.js)：
  - 抽象并适配为通用扩展管理器（或在组件内感知 `isPluginMode`），动态切换目标目录为 `plugins/` 或 `mods/`；
- [`public/js/components/InstancesManager.js`](file:///home/henvei/文档/云语软件中心相关开发/mc-web-panel/public/js/components/InstancesManager.js)：
  - 创建新实例向导提供核心架构预设（模组服 / 插件服 / 原版服）；
- [`public/js/i18n.js`](file:///home/henvei/文档/云语软件中心相关开发/mc-web-panel/public/js/i18n.js)：
  - 增加插件服与原版服相关的多语言字典（如 `sidebar.plugins`, `properties.core_type`, `properties.vanilla_note` 等）。

---

## 5. 分阶段实施路线图 (Phase 1 ~ 4)

### 阶段一：后端官方原版与 Paper/Purpur 核心下载与启动适配
- [x] 1.1 在 `server.js` 中实现 Mojang 官方清单版本解析与 `server.jar` 直装器；
- [x] 1.2 在 `server.js` 中实现 PaperMC API v3 客户端与 Paper 核心直装器；
- [x] 1.3 在 `server.js` 中实现 Purpur API v2 客户端与 Purpur 核心直装器；
- [x] 1.4 适配启动逻辑：确保 `vanilla`、`paper`、`purpur` 使用单 jar 纯净启动参数并加入版本日志动态捕获；
- [x] 1.5 扩展 `/api/setup/versions/mc`、`/api/setup/versions/loader`、`/api/loader/versions/mc`、`/api/loader/versions/loader` 与安装换版本接口。

### 阶段二：插件文件管理与本地元数据解析
- [x] 2.1 增加 `parseLocalPluginJar` 流式解析 `plugin.yml`；
- [x] 2.2 扩展插件列表 API（读取 `instances/<id>/plugins/`，兼容 `.disabled` 启禁用）与 `/api/plugins/local/metadata`；
- [x] 2.3 联动 Modrinth API 搜索接口，支持插件分类筛选与自动下载到 `plugins/` 目录。

### 阶段三：前端界面多架构动态呈现
- [x] 3.1 改造 `Sidebar.js`：根据实例 `loaderType` 自动切换模组管理/插件管理/原版隐藏；
- [x] 3.2 改造 `ServerPropertiesManager.js`：提供清晰的核心分组选择界面与原版简化流程；
- [x] 3.3 改造 `ModsManager.js`：无缝支持插件模式（标题、上传路径 `plugins/` vs `mods/`、按钮文案、图标自适应）；
- [x] 3.4 改造 `ModrinthBrowser.js`：自动检测插件服并切换搜索 `project_type:plugin`，动态切换加载器为 Paper/Purpur/Spigot，一键下载到 `plugins/` 目录；
- [x] 3.5 改造 `InstanceManager.js` 与 `SetupWizard.js`：新建实例向导与初始化向导全面支持 Paper、Purpur、Vanilla 等核心选择与展示；
- [x] 3.6 补充 `i18n.js` 中英文翻译词条。

### 阶段四：实机联调、回归验证与边界测试
- [x] 4.1 测试 Vanilla 原版服官方清单解析、单 Jar 直装与 EULA 自动写入；
- [x] 4.2 测试 Paper/Purpur 插件服构建号解析、双 API 直装与启动参数适配；
- [x] 4.3 测试本地插件 Jar 流式解包与 `plugin.yml` 元数据解析引擎；
- [x] 4.4 测试 Modrinth 针对 Paper/Spigot 插件的精准检索与定向安装至 `plugins/` 目录；
- [x] 4.5 测试全架构前端组件（Sidebar / Properties / ModsManager / ModrinthBrowser / InstanceManager / SetupWizard）ES Module 语法与动态自适应；
- [x] 4.6 校验卷轴系统、在线文件编辑、玩家白名单管理在不同架构核心下的稳定性。

---

## 7. 版本发布交付记录 (v2.6.0)

- [x] **版本号全链路升级至 2.6.0**：
  - `package.json` & `package-lock.json`：升级至 `2.6.0`；
  - `server.js`：代号升级为 `Universal Multi-Architecture Support`，动态绑定 User-Agent；
  - `public/index.html`：静态脚本缓存破除参数刷新为 `js/app.js?v=2.6.0`。
- [x] **更新日志撰写 (`CHANGELOG.md`)**：
  - 详细收录 2.6.0 全架构原生支持、插件 Jar 解析引擎、Modrinth 插件生态打通与 100% 向下兼容保障。
- [x] **项目说明文档同步 (`README.md`)**：
  - 中英双语全面更新关于 Vanilla / Paper / Purpur / Spigot / Fabric / Forge / NeoForge 的支持说明与核心特性表。

---

## 8. 技术风险评估与避坑指南

1. **EULA 自动接受**：
   - 原版服与 Paper 首次生成 `eula.txt`，安装器必须继续保证 `eula=true` 自动写入，避免首次启动直接退出。
2. **端口与世界目录结构差异**：
   - 传统原版与 Fabric 的地狱/末地存放在 `world/DIM-1` 和 `world/DIM1`；
   - Paper/Spigot 默认将地狱与末地拆分为同级的 `world_nether` 与 `world_the_end`。备份机制针对整个实例目录打包，不受此结构变化影响。
3. **Modrinth 插件筛选维度**：
   - 插件搜索需使用 `project_type=plugin`，分类需包含 `paper`、`spigot`、`purpur`，避免搜出不匹配的客户端 Mod。
4. **插件与模组共存防混淆**：
   - 插件服实例内部不建议存在 `mods/` 目录；模组服实例不建议执行 `plugins/`。前端根据当前 `loaderType` 严格只呈现对应的管理器，杜绝用户混淆放错目录。
