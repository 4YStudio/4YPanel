<div align="center">

# 🎮 MC Web Panel

[![GitHub stars](https://img.shields.io/github/stars/4YStudio/mc-web-panel?style=social)](https://github.com/4YStudio/mc-web-panel/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/4YStudio/mc-web-panel?style=social)](https://github.com/4YStudio/mc-web-panel/network/members)
[![GitHub license](https://img.shields.io/github/license/4YStudio/mc-web-panel)](https://github.com/4YStudio/mc-web-panel/blob/main/LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/4YStudio/mc-web-panel)](https://github.com/4YStudio/mc-web-panel/releases)
[![GitHub issues](https://img.shields.io/github/issues/4YStudio/mc-web-panel)](https://github.com/4YStudio/mc-web-panel/issues)

一个轻量级、现代化且高性能的 Minecraft 服务器管理面板

[English](#english) | [中文](#chinese)

</div>

---

<a name="chinese"></a>
## 🇨🇳 中文

### ✨ 项目简介

MC Web Panel 是一个基于 **Node.js** 和 **Vue 3** 构建的现代化 Minecraft 服务器管理面板。它提供了美观的 Web 界面，原生全架构支持各类主流 Minecraft 服务端——无论是**官方原版 (Vanilla)**、**现代插件服 (Paper / Purpur / Spigot)**，还是**主流模组服 (Fabric / Forge / NeoForge)**，都能轻松搞定实例生命周期、扩展生态、玩家管理、文件运维与自动化脚本。

无论是个人服务器还是小型社区，MC Web Panel 都能为您提供专业的管理体验！

### 📸 截图展示

| 实例列表 | 实例详情 |
|---------|---------|
| ![实例列表](./img/2.png) | ![实例详情](./img/1.png) |

### 🚀 核心特性

| 特性 | 描述 |
|-----|-----|
| 🧱 **全架构原生支持** | 完整覆盖**官方原版 (Vanilla)**、**现代插件服 (Paper / Purpur / Spigot)** 与 **模组服 (Fabric / Forge / NeoForge)**，向导式一键安装与多架构智能自适应 |
| 🧩 **扩展与生态管理** | 智能识别当前架构：插件服对应 `plugins/` 目录，模组服对应 `mods/` 目录；内置 `plugin.yml` 元数据解析与无损 `.jar.disabled` 启禁用 |
| 🎮 **Modrinth 市场集成** | 全架构生态打通：模组服智能搜索安装 Mod，插件服智能搜索安装 Paper/Purpur/Spigot/Bukkit 插件，一键直装与自动分流目录 |
| 📜 **卷轴系统 (自动化脚本)** | 全核心通用、零侵入免崩服的控制台事件驱动自动化脚本系统（进服迎宾、扫地姬、防沉迷等） |
| 📊 **实时监控** | 实时查看服务器状态、CPU/内存使用率和控制台输出 |
| 📁 **文件管理** | 支持在线上传、下载、编辑和解压文件，内置代码编辑器与高精度折行搜索 |
| 🔧 **侧边栏自定义** | 拖拽排序和显示/隐藏侧边栏项目，且随选中的实例架构自适应展示管理项 |
| 🌐 **内网穿透** | 内置 FRP 管理，轻松实现公网访问 |
| 👥 **玩家与子账号管理** | 管理白名单、OP、封禁，支持多级子账号精细化权限分配与独立 2FA |
| 👤 **智能头像系统** | 2D 纯正面头像，多源智能容灾降级与 100% 本地矢量像素兜底，彻底解决头像加载失效 |
| 🎨 **外观自定义** | 个性化主题设置，支持自定义背景图、模糊度及透明度 |
| 📱 **响应式设计** | 针对移动端和桌面端深度优化的 UI/UX 体验 |
| 💾 **备份管理** | 强大的备份还原系统（支持快照和增量备份） |
| 🔒 **安全** | 支持 2FA (Google 身份验证器) 双重验证 |
| 🐧 **系统支持** | 官方开箱仅支持 **Linux** (x64 / ARM64)；如需在其他系统（如 Windows / macOS）使用，需克隆仓库稍作适配后自行打包 |
| 🔌 **插件扩展体系** | 模块化架构，支持开发者轻松扩展后端逻辑与前端 UI |

### 🎯 为什么选择 MC Web Panel？

1. **全架构通用** - 原版、插件、模组三大主流生态全部开箱即用
2. **轻量高效** - 占用资源少，启动速度快，极简依赖
3. **简单易用** - 直观的自适应界面设计，新手服主也能轻松上手
4. **功能全面** - 涵盖扩展管理、文件运维、玩家控制与自动化脚本
5. **持续更新** - 活跃的开发社区，功能不断迭代
6. **开源免费** - 完全开源，自由使用和修改

### 📜 卷轴系统 (Scroll Automation)

面板独创的 **「卷轴 (Scroll)」** 自动化脚本系统，无需在服务端安装任何 Mod 或插件，纯净服、模组服、插件服全版本通用：

- **🌟 新手迎宾大标题 (`welcome-scroll`)**：玩家进服屏幕中央展示金色大标题与全服彩色欢迎公告（支持面板可视化自定义文案与颜色）
- **🧹 智能扫地姬 (`auto-cleaner`)**：周期性自动清理地面掉落物，清理前 60s/10s 倒计时广播预警，避免误删贵重物品
- **🛡 健康防沉迷守护 (`health-guardian`)**：统计玩家在线时长，通过 ActionBar 柔性提醒休息防沉迷
- **🛠 卷轴工坊 & 在线开发指南**：内置可视化配置表单、在线代码编辑器、标准事件模板与详尽中文开发手册

### 📦 支持的模组与扩展集成

本面板为以下功能与第三方生态提供了专属的图形化管理界面：

- **Paper / Purpur / Spigot 插件管理** - 本地插件解析、版本识别、无损启禁用与 Modrinth 插件生态
- **Fabric / Forge / NeoForge 模组管理** - 模组元数据展示、状态切换与 Modrinth 模组生态
- **FRP 内网穿透** - 内置的内网穿透管理器
- **Easy Auth (简单认证)** - 管理已注册用户、修改密码和注销用户
- **Advanced Backup (高级备份)** - 创建和还原备份（支持快照和增量备份）
- **Simple Voice Chat (简单语音聊天)** - 直接在面板中配置语音聊天设置

### 🛠️ 快速开始

> [!NOTE]
> **系统支持说明**：目前项目官方预编译发布与测试环境仅支持 **Linux** (x64 / ARM64)。若需要在其他操作系统（如 Windows、macOS）运行，需自行克隆仓库后根据目标系统稍作修改并自行打包（或直接从源码启动）。

#### 方式一：使用预编译可执行文件（推荐，Linux）

1. 从 [Releases](https://github.com/4YStudio/mc-web-panel/releases) 页面下载适用于您 Linux 架构的可执行文件（如 `mc-web-panel-linux-x64` 或 `mc-web-panel-linux-arm64`）
2. 将其放置在一个空目录中（推荐）
3. 赋予执行权限并启动：
   ```bash
   chmod +x mc-web-panel-linux-x64
   ./mc-web-panel-linux-x64 start
   ```
4. 打开浏览器访问 `http://localhost:3000`
5. 跟随设置向导安装新的 Minecraft 服务器，或指定现有的服务端 JAR 文件

#### 方式二：从源码运行与跨平台自行打包（其他操作系统）

如果您需要在 Windows、macOS 等其他操作系统使用，或希望直接从源码运行面板：

```bash
# 1. 克隆仓库
git clone https://github.com/4YStudio/mc-web-panel.git
cd mc-web-panel

# 2. 安装依赖 (需要 Node.js 18+)
npm install

# 3. 从源码直接启动面板
npm run start

# 4. (可选) 自行适配并打包为可执行文件
# 目前项目的打包脚本 build.js 默认面向 Linux (x64 / ARM64)。
# 如需打包到其他操作系统平台，可在 build.js 中稍作修改后执行：
npm run build
```

### 💻 命令行管理

| 命令 | 说明 |
|---|---|
| `start` | 启动面板（后台运行，默认行为） |
| `stop` | 停止面板 |
| `restart` | 重启面板 |
| `host <地址> [端口]` | 修改面板监听地址及端口（如 `host 0.0.0.0 3000` 或 `host 8080`） |
| `port <端口>` | 修改面板端口（如 `port 8080`） |
| `reset` | 重置 2FA 密钥并打印新密钥 |
| `help` | 显示帮助信息 |

**使用示例：**

```bash
./mc-web-panel-linux-x64 start              # 后台启动面板
./mc-web-panel-linux-x64 stop               # 停止面板
./mc-web-panel-linux-x64 restart            # 重启面板
./mc-web-panel-linux-x64 host 0.0.0.0 8080  # 同时修改监听地址与端口
./mc-web-panel-linux-x64 port 8080          # 将端口改为 8080
./mc-web-panel-linux-x64 reset              # 重置 2FA 密钥
```

### 🤝 贡献指南

我们欢迎任何形式的贡献！包括但不限于：

- 提交 Bug 报告
- 提出新功能建议
- 提交代码改进
- 完善文档

请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)（如果有）了解详细的贡献流程。

### 📄 许可证

本项目采用 [MIT License](./LICENSE) 许可证。

---

<a name="english"></a>
## 🇺🇸 English

### ✨ Introduction

MC Web Panel is a lightweight, modern, and high-performance Minecraft server management panel built with **Node.js** and **Vue 3**. It delivers native, multi-architecture support for all major Minecraft servers—including **Official Vanilla**, **Modern Plugin Servers (Paper / Purpur / Spigot)**, and **Modded Servers (Fabric / Forge / NeoForge)**—empowering server owners to effortlessly manage server lifecycles, extensions, players, files, and automation scripts.

Whether it's a personal server or a small community, MC Web Panel provides you with a professional management experience!

### 📸 Screenshots

| Instance List | Instance Details |
|---------------|------------------|
| ![Instance List](./img/2.png) | ![Instance Details](./img/1.png) |

### 🚀 Key Features

| Feature | Description |
|---------|-------------|
| 🧱 **Universal Multi-Architecture** | Native support for **Vanilla**, **Paper / Purpur / Spigot**, and **Fabric / Forge / NeoForge** with one-click setup wizards and auto-adaptation |
| 🧩 **Extension & Ecosystem Manager** | Architecture-aware isolation: `plugins/` for plugin servers and `mods/` for modded servers; built-in `plugin.yml` metadata parsing and non-destructive `.jar.disabled` toggle |
| 🎮 **Modrinth Marketplace Integration** | Seamless dual ecosystem: search & install Mods for modded servers and Bukkit/Spigot/Paper plugins for plugin servers with automated target directory routing |
| 📜 **Scroll System (Automation)** | Zero-intrusion, crash-proof console event-driven automation system for all server cores (Welcome titles, item cleaner, anti-fatigue alerts, etc.) |
| 📊 **Dashboard** | Real-time server status, CPU/RAM usage, and console output |
| 📁 **File Manager** | Web-based file management with upload, download, edit, and unzip capabilities, featuring an advanced code editor and wrap-aware text search |
| 🔧 **Customizable Sidebar** | Drag-and-drop to reorder sidebar items, toggle visibility, and auto-adapt items based on the active server's architecture |
| 🌐 **Intranet Penetration** | Built-in FRP management for easy public access |
| 👥 **Players & Sub-Accounts** | Manage whitelist, OPs, bans, plus granular sub-account permissions and independent 2FA |
| 👤 **Smart Avatar System** | High-performance 2D player avatars with multi-source auto-fallback and 100% local vector rendering |
| 🎨 **Appearance Customization** | Personalized themes with custom background images, blur, and transparency settings |
| 📱 **Responsive Design** | Optimized UI/UX for both desktop and mobile devices |
| 💾 **Backup Management** | Powerful backup and restore system (supports snapshots and incremental backups) |
| 🔒 **Security** | 2FA (Google Authenticator) support |
| 🐧 **System Support** | Officially supports **Linux** (x64 / ARM64) only. For other OS (e.g., Windows / macOS), users need to clone the repository, adapt slightly, and build/run manually |
| 🔌 **Plugin Extension Architecture** | Modular architecture allowing developers to extend backend logic and frontend UI easily |

### 🎯 Why Choose MC Web Panel?

1. **Universal Multi-Architecture** - Vanilla, Paper, Purpur, Spigot, Fabric, Forge, and NeoForge all supported out of the box
2. **Lightweight & Efficient** - Low resource consumption, fast startup, and minimal dependencies
3. **Easy to Use** - Intuitive, adaptive interface design with zero learning curve
4. **Comprehensive Features** - Covers extension management, file operations, player controls, and automation scripts
5. **Continuous Updates** - Active development community with steady iterations
6. **Open Source & Free** - Completely open source, free to use and modify

### 📜 Scroll Automation System

The exclusive **Scroll (卷轴)** automation script system requires no mods or server plugins, fully compatible across Vanilla, Fabric, Forge, NeoForge, Paper, and Purpur:

- **🌟 Welcome Title (`welcome-scroll`)**: Displays customizable golden titles and server-wide announcements upon player join
- **🧹 Auto Cleaner (`auto-cleaner`)**: Periodically cleans dropped ground items with 60s & 10s countdown broadcast warnings
- **🛡 Health Guardian (`health-guardian`)**: Tracks player playtime and sends friendly anti-fatigue alerts via ActionBar
- **🛠 Workshop & Dev Guide**: Built-in visual schema config, online script editor, event templates, and comprehensive documentation

### 📦 Supported Integrations & Ecosystems

This panel features dedicated GUI integrations for:

- **Paper / Purpur / Spigot Plugins** - Local jar parsing, version detection, non-destructive toggling, and Modrinth plugin store
- **Fabric / Forge / NeoForge Mods** - Mod metadata display, state toggle, and Modrinth mod ecosystem
- **FRP**: Built-in intranet penetration manager
- **Easy Auth**: Manage registered users, change passwords, and unregister users
- **Advanced Backup**: Create and restore backups (snapshots/differential)
- **Simple Voice Chat**: Configure voice chat settings directly from the panel

### 🛠️ Quick Start

> [!NOTE]
> **Operating System Notice**: Pre-compiled releases and official testing currently only target **Linux** (x64 / ARM64). If you need to use this panel on other operating systems (e.g. Windows, macOS), please clone the repository, make minor adjustments for your target platform, and build or run directly from source.

#### Method 1: Using Pre-built Executable (Recommended for Linux)

1. Download the executable for your Linux architecture from the [Releases](https://github.com/4YStudio/mc-web-panel/releases) page (`mc-web-panel-linux-x64` or `mc-web-panel-linux-arm64`)
2. Place it in an empty directory (recommended)
3. Grant execution permissions and run:
   ```bash
   chmod +x mc-web-panel-linux-x64
   ./mc-web-panel-linux-x64 start
   ```
4. Open your browser and visit `http://localhost:3000`
5. Follow the setup wizard to install a Minecraft server or point it to your existing server jar

#### Method 2: Run from Source & Self-Packaging (Other Operating Systems)

If you wish to run from source code or adapt for other operating systems (requires Node.js 18+):

```bash
# 1. Clone the repository
git clone https://github.com/4YStudio/mc-web-panel.git
cd mc-web-panel

# 2. Install dependencies
npm install

# 3. Start the server (source mode)
npm run start

# 4. (Optional) Custom build / packaging
# The built-in build.js currently targets Linux (x64 / ARM64).
# To package for other operating systems, adjust build.js to target your OS platform and run:
npm run build
```

### 💻 CLI Commands

| Command | Description |
|---|---|
| `start` | Start the panel (runs in background, default) |
| `stop` | Stop the panel |
| `restart` | Restart the panel |
| `host <ip> [port]` | Change the panel listening address and/or port (e.g., `host 0.0.0.0 3000` or `host 8080`) |
| `port <port>` | Change the panel port (e.g., `port 8080`) |
| `reset` | Reset the 2FA key and print the new secret |
| `help` | Show help information |

**Examples:**

```bash
./mc-web-panel-linux-x64 start              # Start panel in background
./mc-web-panel-linux-x64 stop               # Stop panel
./mc-web-panel-linux-x64 restart            # Restart panel
./mc-web-panel-linux-x64 host 0.0.0.0 8080  # Change both listening address and port
./mc-web-panel-linux-x64 port 8080          # Change port to 8080
./mc-web-panel-linux-x64 reset              # Reset 2FA credentials
```

### 🤝 Contributing

We welcome any form of contribution! Including but not limited to:

- Submitting bug reports
- Proposing new features
- Submitting code improvements
- Improving documentation

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) (if available) for detailed contribution guidelines.

### 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

<div align="center">

Made with ❤️ by [4YStudio](https://github.com/4YStudio)

</div>
