# KCN Android App

KCN 自研 Android 启动器工程，包名 `com.kcn.launcher`。

## 技术栈

- Java 17 / Android SDK 34 / minSdk 26
- 原生 `WebView` + `@JavascriptInterface` 桥
- `org.json` + 原生 HTTP 下载器
- Apache Commons Compress / XZ 用于 OpenJDK 解压
- 自带 OpenJDK 21 arm64 压缩包

## 当前实现

- `KcnBridge.java`
  - Mojang / BMCLAPI 版本清单
  - 版本文件、libraries、assets 对象下载
  - Fabric Loader 安装
  - Modrinth 搜索与下载
  - OpenJDK 解压
  - 任务进度与日志事件
- `MainActivity.java`
  - 全屏 WebView 容器、JS 桥注册、控制台日志转发
- `assets/web/`
  - KCN 自有 Android 界面

## 构建

```bash
cd android-app
# local.properties:
# sdk.dir=/absolute/path/to/android-sdk
./gradlew assembleDebug
```

产物：

```text
app/build/outputs/apk/debug/app-debug.apk
```

## 未完成

- JVM / LWJGL 游戏启动层
- Forge / NeoForge 安装器
- Microsoft 登录
- 触控与渲染配置
