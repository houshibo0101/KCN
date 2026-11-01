package com.kcn.launcher;

import android.app.Activity;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.json.JSONArray;
import org.json.JSONObject;
import org.tukaani.xz.XZInputStream;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * KCN native bridge.
 *
 * The bridge is deliberately small: it owns the real Minecraft version metadata
 * and file download paths, while the WebView owns the visual layer.
 */
public class KcnBridge {
    private static final String TAG = "KCN-Bridge";
    private static final String USER_AGENT = "KCN-Launcher/0.1 (Android)";
    private static final String[] MANIFEST_URLS = new String[]{
            "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json",
            "https://bmclapi2.bangbang93.com/mc/game/version_manifest_v2.json",
            "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json"
    };

    private final Activity activity;
    private final WebView webView;
    private final ExecutorService io = Executors.newFixedThreadPool(4);
    private final Handler main = new Handler(Looper.getMainLooper());
    private final List<String> logs = Collections.synchronizedList(new ArrayList<>());
    private final Set<String> cancelledTasks = Collections.synchronizedSet(new java.util.HashSet<>());
    private final AtomicInteger taskSequence = new AtomicInteger(1);
    private final File root;
    private volatile boolean destroyed = false;
    private volatile String manifestCache;
    private volatile long manifestCacheTime;

    public KcnBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        File base = activity.getExternalFilesDir(null);
        if (base == null) base = activity.getFilesDir();
        this.root = new File(base, "minecraft");
        if (!root.exists()) root.mkdirs();
        log("INFO", "CORE", "KCN Core 0.1 已启动");
        log("INFO", "CORE", "数据目录 " + root.getAbsolutePath());
        log("INFO", "JAVA", "启动层将在下一阶段接入 OpenJDK / LWJGL");
    }

    @JavascriptInterface
    public void ping() {
        callJs("onReady", getDeviceInfo());
    }

    @JavascriptInterface
    public String getDeviceInfo() {
        JSONObject out = new JSONObject();
        try {
            out.put("brand", Build.BRAND);
            out.put("model", Build.MODEL);
            out.put("device", Build.DEVICE);
            out.put("android", Build.VERSION.RELEASE);
            out.put("sdk", Build.VERSION.SDK_INT);
            out.put("abi", Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "unknown");
            out.put("package", activity.getPackageName());
            out.put("version", "0.1.9");
            out.put("root", root.getAbsolutePath());
        } catch (Exception error) {
            Log.e(TAG, "device info", error);
        }
        return out.toString();
    }

    @JavascriptInterface
    public void loadVersions() {
        io.execute(() -> {
            try {
                JSONObject manifest = getManifest(false);
                emitManifest(manifest);
            } catch (Exception error) {
                log("ERROR", "NETWORK", "版本清单加载失败：" + error.getMessage());
                callJs("onError", error.getMessage() == null ? "版本清单加载失败" : error.getMessage());
            }
        });
    }

    @JavascriptInterface
    public void getInstalledVersions() {
        io.execute(() -> {
            try {
                JSONArray installed = new JSONArray();
                File versions = new File(root, "versions");
                File[] dirs = versions.listFiles(File::isDirectory);
                if (dirs != null) {
                    for (File dir : dirs) {
                        if (new File(dir, ".installed.json").isFile()) installed.put(dir.getName());
                    }
                }
                callJs("onInstalled", installed.toString());
            } catch (Exception error) {
                log("ERROR", "CORE", "读取已安装版本失败：" + error.getMessage());
            }
        });
    }

    @JavascriptInterface
    public void installVersion(String versionId) {
        if (versionId == null || versionId.isEmpty()) return;
        io.execute(() -> installVersionBlocking(versionId, "vanilla"));
    }

    @JavascriptInterface
    public void installVersionWithLoader(String versionId, String loader) {
        if (versionId == null || versionId.isEmpty()) return;
        io.execute(() -> installVersionBlocking(versionId,
                "fabric".equals(loader) ? "fabric" : "vanilla"));
    }

    @JavascriptInterface
    public void searchResources(String type, String query) {
        io.execute(() -> {
            try {
                String projectType = "shader".equals(type) ? "shader" : "mod";
                String facets = "[[\"project_type:" + projectType + "\"]]";
                String url = "https://api.modrinth.com/v2/search?limit=20&index=relevance"
                        + "&query=" + java.net.URLEncoder.encode(query == null ? "" : query, "UTF-8")
                        + "&facets=" + java.net.URLEncoder.encode(facets, "UTF-8");
                log("INFO", "RESOURCE", "搜索 " + projectType + "：" + (query == null ? "热门" : query));
                JSONObject response = new JSONObject(downloadText(url));
                JSONArray hits = response.optJSONArray("hits");
                JSONArray result = new JSONArray();
                if (hits != null) {
                    for (int i = 0; i < hits.length(); i++) {
                        JSONObject hit = hits.getJSONObject(i);
                        JSONObject item = new JSONObject();
                        item.put("id", hit.optString("project_id"));
                        item.put("slug", hit.optString("slug"));
                        item.put("title", hit.optString("title"));
                        item.put("description", hit.optString("description"));
                        item.put("icon", hit.optString("icon_url"));
                        item.put("downloads", hit.optLong("downloads"));
                        item.put("author", hit.optString("author"));
                        item.put("type", projectType);
                        JSONArray categories = hit.optJSONArray("categories");
                        item.put("categories", categories == null ? new JSONArray() : categories);
                        result.put(item);
                    }
                }
                callJs("onResources", result.toString());
                log("INFO", "RESOURCE", "找到 " + result.length() + " 个资源");
            } catch (Exception error) {
                log("ERROR", "RESOURCE", "资源搜索失败：" + error.getMessage());
                callJs("onError", "资源搜索失败：" + error.getMessage());
            }
        });
    }

    @JavascriptInterface
    public void installResource(String type, String projectId, String title, String gameVersion) {
        io.execute(() -> installResourceBlocking(type, projectId, title, gameVersion));
    }

    private void installResourceBlocking(String type, String projectId, String title, String gameVersion) {
        String taskId = "resource-" + projectId + "-" + taskSequence.getAndIncrement();
        String folder = "shader".equals(type) ? "shaderpacks" : "mods";
        try {
            emitTask(taskId, title, "查询 Modrinth 版本", 2, "running", 0, "");
            String versionsUrl = "https://api.modrinth.com/v2/project/" + projectId + "/version";
            JSONArray versions = new JSONArray(downloadText(versionsUrl));
            JSONObject selected = null;
            JSONObject fallback = null;
            for (int i = 0; i < versions.length(); i++) {
                JSONObject version = versions.getJSONObject(i);
                if (fallback == null) fallback = version;
                JSONArray gameVersions = version.optJSONArray("game_versions");
                boolean gameMatch = gameVersions == null;
                if (gameVersions != null) {
                    for (int j = 0; j < gameVersions.length(); j++) {
                        if (gameVersion.equals(gameVersions.getString(j))) {
                            gameMatch = true;
                            break;
                        }
                    }
                }
                if (!gameMatch) continue;
                if (!"shader".equals(type)) {
                    JSONArray loaders = version.optJSONArray("loaders");
                    boolean loaderMatch = false;
                    if (loaders != null) {
                        for (int j = 0; j < loaders.length(); j++) {
                            if ("fabric".equals(loaders.getString(j))) {
                                loaderMatch = true;
                                break;
                            }
                        }
                    }
                    if (!loaderMatch) continue;
                }
                selected = version;
                break;
            }
            if (selected == null) selected = fallback;
            if (selected == null) throw new IOException("没有可用文件");
            JSONArray files = selected.optJSONArray("files");
            if (files == null || files.length() == 0) throw new IOException("版本没有文件");
            JSONObject file = files.getJSONObject(0);
            String url = file.optString("url");
            String filename = file.optString("filename", projectId + ".jar");
            File target = new File(root, folder + "/" + filename);
            log("INFO", "RESOURCE", "下载 " + title + " · " + selected.optString("version_number"));
            emitTask(taskId, title, "下载 " + filename, 8, "running", 0, humanBytes(file.optLong("size")));
            downloadFile(url, target, taskId, title, 8, 100);
            emitTask(taskId, title, "已保存到 " + folder, 100, "done", 0, "");
            log("INFO", "RESOURCE", title + " 已安装到 " + folder + "/" + filename);
            callJs("onResourceInstalled", new JSONObject()
                    .put("id", projectId).put("type", type).put("file", filename).toString());
        } catch (Exception error) {
            emitTask(taskId, title, "下载失败", 0, "error", 0, "");
            log("ERROR", "RESOURCE", title + " 下载失败：" + error.getMessage());
            callJs("onError", "资源下载失败：" + error.getMessage());
        }
    }

    @JavascriptInterface
    public void cancelTask(String taskId) {
        if (taskId == null || taskId.isEmpty()) return;
        cancelledTasks.add(taskId);
        log("WARN", "TASK", "用户取消任务 " + taskId);
        callJs("onTaskCancelled", taskId);
    }

    private void checkCancelled(String taskId) throws IOException {
        if (cancelledTasks.contains(taskId)) throw new IOException("用户已取消");
    }

    @JavascriptInterface
    public void testJvm() {
        io.execute(() -> {
            File javaHome = new File(activity.getFilesDir(), "runtime/jre21");
            File marker = new File(javaHome, ".kcn_java");
            File launcher = new File(activity.getApplicationInfo().nativeLibraryDir, "libkcnjava.so");
            try {
                if (!marker.isFile()) throw new IOException("请先在 Java 页面解压运行时");
                if (!launcher.isFile()) throw new IOException("APK 中缺少 JVM 启动器");
                log("INFO", "JVM", "开始 JVM 冒烟测试 · " + launcher.getAbsolutePath());
                ProcessBuilder builder = new ProcessBuilder(launcher.getAbsolutePath(),
                        "-Djava.home=" + javaHome.getAbsolutePath(), "-version");
                builder.redirectErrorStream(true);
                builder.environment().put("JAVA_HOME", javaHome.getAbsolutePath());
                builder.environment().put("LD_LIBRARY_PATH",
                        new File(javaHome, "lib").getAbsolutePath() + ":" +
                                new File(javaHome, "lib/server").getAbsolutePath());
                Process process = builder.start();
                StringBuilder output = new StringBuilder();
                try (InputStream input = process.getInputStream()) {
                    byte[] buffer = new byte[4096];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        output.append(new String(buffer, 0, read, StandardCharsets.UTF_8));
                    }
                }
                boolean finished = process.waitFor(20, java.util.concurrent.TimeUnit.SECONDS);
                if (!finished) {
                    process.destroyForcibly();
                    throw new IOException("JVM 启动超时");
                }
                int code = process.exitValue();
                for (String line : output.toString().split("\\r?\\n")) {
                    if (!line.trim().isEmpty()) log("INFO", "JVM", line.trim());
                }
                if (code != 0) throw new IOException("JVM 退出码 " + code);
                log("INFO", "JVM", "JVM 冒烟测试通过 · 可以进入 LWJGL 启动层");
                callJs("onJvmTest", new JSONObject().put("ok", true)
                        .put("output", output.toString()).toString());
            } catch (Exception error) {
                log("ERROR", "JVM", "JVM 测试失败：" + error.getMessage());
                JSONObject result = new JSONObject();
                try {
                    result.put("ok", false);
                    result.put("error", error.getMessage());
                } catch (Exception ignored) {
                }
                callJs("onJvmTest", result.toString());
            }
        });
    }

    @JavascriptInterface
    public void startGame(String instanceId) {
        io.execute(() -> {
            Process process = null;
            try {
                File javaHome = new File(activity.getFilesDir(), "runtime/jre21");
                File launcher = new File(activity.getApplicationInfo().nativeLibraryDir, "libkcnjava.so");
                if (!new File(javaHome, ".kcn_java").isFile()) throw new IOException("请先安装 Java 21 运行时");
                if (!launcher.isFile()) throw new IOException("缺少 JVM 启动器");
                File lwjglHome = prepareLwjgl();
                File lwjglNatives = new File(lwjglHome, "natives");
                JSONObject plan = new LaunchPlanner(root, activity.getFilesDir()).prepare(instanceId);
                JSONArray args = plan.optJSONArray("args");
                if (args == null || args.length() < 2) throw new IOException("启动参数为空");
                List<String> command = new ArrayList<>();
                command.add(launcher.getAbsolutePath());
                command.add("-Djava.home=" + javaHome.getAbsolutePath());
                StringBuilder extraJars = new StringBuilder();
                File[] jars = new File(lwjglHome, "jars").listFiles((dir, name) -> name.endsWith(".jar"));
                if (jars != null) {
                    for (File jar : jars) extraJars.append(File.pathSeparator).append(jar.getAbsolutePath());
                }
                for (int i = 1; i < args.length(); i++) {
                    String arg = args.getString(i);
                    if ("-cp".equals(arg) && i + 1 < args.length()) {
                        command.add(arg);
                        command.add(args.getString(i + 1) + extraJars);
                        i++;
                    } else if (arg.startsWith("-Djava.library.path=")) {
                        command.add("-Djava.library.path=" + lwjglNatives.getAbsolutePath());
                    } else {
                        command.add(arg);
                    }
                }
                command.add("-Dorg.lwjgl.librarypath=" + lwjglNatives.getAbsolutePath());
                ProcessBuilder builder = new ProcessBuilder(command);
                builder.directory(root);
                builder.redirectErrorStream(true);
                builder.environment().put("JAVA_HOME", javaHome.getAbsolutePath());
                builder.environment().put("LD_LIBRARY_PATH",
                        new File(javaHome, "lib").getAbsolutePath() + ":" +
                                new File(javaHome, "lib/server").getAbsolutePath());
                log("INFO", "LAUNCH", "创建游戏进程 · " + instanceId);
                process = builder.start();
                final Process running = process;
                log("INFO", "LAUNCH", "游戏进程已创建，PID 不可直接读取；开始收集输出");
                callJs("onGameStarted", new JSONObject().put("instance", instanceId).toString());
                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(running.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        log("INFO", "GAME", line);
                    }
                }
                int code = running.waitFor();
                log(code == 0 ? "INFO" : "ERROR", "LAUNCH", "游戏进程结束，退出码 " + code);
                callJs("onGameExit", new JSONObject().put("code", code).toString());
            } catch (Exception error) {
                if (process != null) process.destroy();
                log("ERROR", "LAUNCH", "游戏进程启动失败：" + error.getMessage());
                callJs("onError", "游戏进程启动失败：" + error.getMessage());
            }
        });
    }

    @JavascriptInterface
    public void prepareLaunch(String instanceId) {
        io.execute(() -> {
            try {
                JSONObject plan = new LaunchPlanner(root, activity.getFilesDir()).prepare(instanceId);
                JSONArray warnings = plan.optJSONArray("warnings");
                log("INFO", "LAUNCH", "启动计划已生成 · " + instanceId + " · "
                        + plan.optInt("classpathCount") + " 个 classpath 条目");
                if (warnings != null && warnings.length() > 0) {
                    for (int i = 0; i < warnings.length(); i++) {
                        log("WARN", "LAUNCH", warnings.optString(i));
                    }
                }
                log("INFO", "LAUNCH", "JVM / LWJGL 启动层尚未接入，未创建游戏进程");
                callJs("onLaunchPlan", plan.toString());
            } catch (Exception error) {
                log("ERROR", "LAUNCH", "启动计划生成失败：" + error.getMessage());
                callJs("onError", "启动计划生成失败：" + error.getMessage());
            }
        });
    }

    @JavascriptInterface
    public String getInstances() {
        JSONArray out = new JSONArray();
        try {
            File versions = new File(root, "versions");
            File[] dirs = versions.listFiles(File::isDirectory);
            String active = activeInstance();
            if (dirs != null) {
                for (File dir : dirs) {
                    File markerFile = new File(dir, ".installed.json");
                    if (!markerFile.isFile()) continue;
                    JSONObject marker = new JSONObject(readText(markerFile));
                    JSONObject item = new JSONObject();
                    String id = marker.optString("id", dir.getName());
                    item.put("id", id);
                    item.put("folder", dir.getName());
                    item.put("loader", marker.optString("loader", "vanilla"));
                    item.put("base", marker.optString("inheritsFrom", id));
                    item.put("installedAt", marker.optLong("installedAt", 0));
                    item.put("active", id.equals(active));
                    out.put(item);
                }
            }
        } catch (Exception error) {
            log("WARN", "CORE", "读取实例失败：" + error.getMessage());
        }
        return out.toString();
    }

    @JavascriptInterface
    public void setActiveInstance(String id) {
        activity.getSharedPreferences("kcn", Activity.MODE_PRIVATE).edit()
                .putString("active_instance", id == null ? "" : id).apply();
        log("INFO", "CORE", "当前实例切换为 " + id);
        callJs("onInstances", getInstances());
    }

    private String activeInstance() {
        return activity.getSharedPreferences("kcn", Activity.MODE_PRIVATE)
                .getString("active_instance", "");
    }

    @JavascriptInterface
    public String getJavaStatus() {
        JSONObject out = new JSONObject();
        try {
            File runtime = new File(activity.getFilesDir(), "runtime/jre21");
            File marker = new File(runtime, ".kcn_java");
            out.put("installed", marker.isFile());
            out.put("version", "21");
            out.put("path", runtime.getAbsolutePath());
            out.put("bundled", true);
            out.put("abi", isX86() ? "x86_64" : "arm64");
            out.put("note", "内置 OpenJDK 21 · 启动层将在下一阶段接入");
            if (marker.isFile()) out.put("size", directorySize(runtime));
        } catch (Exception ignored) {
        }
        return out.toString();
    }

    @JavascriptInterface
    public void installJava(String version) {
        io.execute(() -> {
            String taskId = "java-" + version + "-" + taskSequence.getAndIncrement();
            String title = "Java " + version;
            File runtime = new File(activity.getFilesDir(), "runtime/jre" + version);
            try {
                if (new File(runtime, ".kcn_java").isFile()) {
                    emitTask(taskId, title, "运行时已安装", 100, "done", 0, "");
                    log("INFO", "JAVA", "Java " + version + " 已安装");
                    return;
                }
                log("INFO", "JAVA", "开始解压内置 OpenJDK " + version);
                emitTask(taskId, title, "准备解压运行时", 2, "running", 0, "");
                deleteRecursive(runtime);
                ensureDir(runtime);
                boolean x86 = isX86();
                String assetBase = "runtime/jre" + version + (x86 ? "-x86_64" : "");
                String binName = x86 ? "bin-x86_64.tar.xz" : "bin-arm64.tar.xz";
                extractAsset(assetBase + "/universal.tar.xz", runtime, taskId, title, 4, 48);
                extractAsset(assetBase + "/" + binName, runtime, taskId, title, 48, 96);
                markExecutable(new File(runtime, "bin"));
                markLibraries(new File(runtime, "lib"));
                writeText(new File(runtime, ".kcn_java"), new JSONObject()
                        .put("version", version).put("installedAt", System.currentTimeMillis()).toString());
                emitTask(taskId, title, "运行时已解压", 100, "done", 0, "");
                log("INFO", "JAVA", "Java " + version + " 解压完成 · " + runtime.getAbsolutePath());
                callJs("onJavaStatus", getJavaStatus());
            } catch (Exception error) {
                Log.e(TAG, "java install failed", error);
                emitTask(taskId, title, "解压失败", 0, "error", 0, "");
                log("ERROR", "JAVA", "Java 解压失败：" + error.getMessage());
                callJs("onError", "Java 运行时解压失败：" + error.getMessage());
            }
        });
    }

    private void extractAsset(String assetName, File destination, String taskId, String title,
                              double start, double end) throws IOException {
        try (InputStream raw = activity.getAssets().open(assetName);
             XZInputStream xz = new XZInputStream(new BufferedInputStream(raw));
             TarArchiveInputStream tar = new TarArchiveInputStream(xz)) {
            String rootPath = destination.getCanonicalPath();
            TarArchiveEntry entry;
            int count = 0;
            while ((entry = tar.getNextEntry()) != null) {
                String name = entry.getName();
                if (name.startsWith("./")) name = name.substring(2);
                if (name.isEmpty() || ".".equals(name)) continue;
                File target = new File(destination, name);
                if (!target.getCanonicalPath().startsWith(rootPath + File.separator) && !target.getCanonicalPath().equals(rootPath)) {
                    throw new IOException("非法归档路径");
                }
                if (entry.isDirectory()) {
                    ensureDir(target);
                    continue;
                }
                ensureDir(target.getParentFile());
                try (FileOutputStream output = new FileOutputStream(target)) {
                    byte[] buffer = new byte[65536];
                    int read;
                    while ((read = tar.read(buffer)) != -1) output.write(buffer, 0, read);
                }
                target.setExecutable(true, false);
                target.setReadable(true, true);
                count++;
                if (count % 20 == 0) {
                    emitTask(taskId, title, "解压 " + name, start + (end - start) * Math.min(1, count / 260.0),
                            "running", 0, "");
                }
            }
            log("INFO", "JAVA", "解压 " + assetName + " · " + count + " 个文件");
        }
    }

    private File prepareLwjgl() throws IOException {
        File lwjglHome = new File(activity.getFilesDir(), "runtime/lwjgl");
        File jars = new File(lwjglHome, "jars");
        File natives = new File(lwjglHome, "natives");
        File marker = new File(lwjglHome, ".kcn_lwjgl");
        if (!marker.isFile()) {
            log("INFO", "LWJGL", "解压 LWJGL jars 与 " + (isX86() ? "x86_64" : "arm64") + " natives");
            deleteRecursive(lwjglHome);
            ensureDir(jars);
            ensureDir(natives);
            copyAssetTree("runtime/lwjgl/3.3.3/common", jars);
            copyAssetTree("runtime/lwjgl/3.3.3/" + (isX86() ? "x86_64" : "arm64"), natives);
            markLibraries(natives);
            writeText(marker, "3.3.3");
            log("INFO", "LWJGL", "LWJGL 资源准备完成 · " + jars.getAbsolutePath());
        }
        return lwjglHome;
    }

    private void copyAssetTree(String assetPath, File destination) throws IOException {
        String[] children = activity.getAssets().list(assetPath);
        if (children == null) return;
        if (children.length == 0) {
            try (InputStream input = activity.getAssets().open(assetPath);
                 FileOutputStream output = new FileOutputStream(new File(destination, new File(assetPath).getName()))) {
                byte[] buffer = new byte[65536];
                int read;
                while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
            }
            return;
        }
        ensureDir(destination);
        for (String child : children) {
            String childPath = assetPath + "/" + child;
            String[] grandChildren = activity.getAssets().list(childPath);
            if (grandChildren != null && grandChildren.length > 0) {
                File dir = new File(destination, child);
                ensureDir(dir);
                copyAssetTree(childPath, dir);
            } else {
                ensureDir(destination);
                File out = new File(destination, child);
                try (InputStream input = activity.getAssets().open(childPath);
                     FileOutputStream output = new FileOutputStream(out)) {
                    byte[] buffer = new byte[65536];
                    int read;
                    while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
                }
                out.setReadable(true, true);
            }
        }
    }

    private static boolean isX86() {
        for (String abi : Build.SUPPORTED_ABIS) {
            if (abi.contains("x86")) return true;
        }
        return false;
    }

    private static void markExecutable(File dir) {
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File file : files) {
            if (file.isDirectory()) markExecutable(file);
            else file.setExecutable(true, false);
        }
    }

    private static void markLibraries(File dir) {
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File file : files) {
            if (file.isDirectory()) markLibraries(file);
            else if (file.getName().endsWith(".so")) file.setExecutable(true, false);
        }
    }

    private static void deleteRecursive(File file) {
        if (file == null || !file.exists()) return;
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) for (File child : children) deleteRecursive(child);
        }
        file.delete();
    }

    private static long directorySize(File dir) {
        long total = 0;
        File[] files = dir.listFiles();
        if (files == null) return 0;
        for (File file : files) total += file.isDirectory() ? directorySize(file) : file.length();
        return total;
    }

    @JavascriptInterface
    public String getLogs() {
        JSONArray out = new JSONArray();
        synchronized (logs) {
            for (String line : logs) {
                try {
                    out.put(new JSONObject(line));
                } catch (Exception ignored) {
                }
            }
        }
        return out.toString();
    }

    @JavascriptInterface
    public void clearLogs() {
        synchronized (logs) {
            logs.clear();
        }
        log("INFO", "CORE", "日志已清空");
    }

    @JavascriptInterface
    public String getStorage() {
        JSONObject out = new JSONObject();
        try {
            out.put("root", root.getAbsolutePath());
            out.put("free", root.getUsableSpace());
            out.put("total", root.getTotalSpace());
            out.put("used", root.getTotalSpace() - root.getUsableSpace());
        } catch (Exception ignored) {
        }
        return out.toString();
    }

    @JavascriptInterface
    public void repairManifest() {
        io.execute(() -> {
            try {
                JSONObject manifest = getManifest(true);
                emitManifest(manifest);
                log("INFO", "CORE", "版本清单已从网络刷新");
            } catch (Exception error) {
                log("ERROR", "NETWORK", "刷新失败：" + error.getMessage());
            }
        });
    }

    private void installVersionBlocking(String versionId, String loader) {
        String taskId = "install-" + versionId + "-" + taskSequence.getAndIncrement();
        String title = "Minecraft " + versionId + ("fabric".equals(loader) ? " · Fabric" : "");
        long start = System.currentTimeMillis();
        try {
            log("INFO", "INSTALL", "开始安装 " + versionId + ("fabric".equals(loader) ? " (Fabric)" : ""));
            emitTask(taskId, title, "读取版本清单", 0, "running", 0, "");
            JSONObject manifest = getManifest(false);
            String versionUrl = null;
            JSONArray versions = manifest.getJSONArray("versions");
            for (int i = 0; i < versions.length(); i++) {
                JSONObject version = versions.getJSONObject(i);
                if (versionId.equals(version.optString("id"))) {
                    versionUrl = version.optString("url");
                    break;
                }
            }
            if (versionUrl == null) throw new IOException("版本不存在");
            File versionDir = new File(root, "versions/" + versionId);
            ensureDir(versionDir);
            File versionJsonFile = new File(versionDir, versionId + ".json");
            downloadFile(versionUrl, versionJsonFile, taskId, title, 0, 4);
            JSONObject versionJson = new JSONObject(readText(versionJsonFile));
            log("INFO", "INSTALL", "版本元数据下载完成");

            JSONObject downloads = versionJson.optJSONObject("downloads");
            if (downloads == null) throw new IOException("版本缺少 downloads");
            JSONObject client = downloads.optJSONObject("client");
            if (client == null) throw new IOException("版本缺少 client");

            File clientJar = new File(versionDir, versionId + ".jar");
            if (!clientJar.isFile() || clientJar.length() == 0) {
                String clientUrl = client.optString("url");
                try {
                    downloadFile(clientUrl, clientJar, taskId, title, 4, 60);
                } catch (IOException first) {
                    String mirror = "https://bmclapi2.bangbang93.com/version/" + versionId + "/client";
                    log("WARN", "NETWORK", "官方客户端节点失败，切换 BMCLAPI");
                    downloadFile(mirror, clientJar, taskId, title, 4, 60);
                }
                log("INFO", "INSTALL", "client.jar 下载完成");
            } else {
                emitTask(taskId, title, "客户端已存在，跳过", 60, "running", 0, "");
            }

            JSONArray libraries = versionJson.optJSONArray("libraries");
            if (libraries != null && libraries.length() > 0) {
                int total = libraries.length();
                for (int i = 0; i < total; i++) {
                    checkCancelled(taskId);
                    JSONObject library = libraries.getJSONObject(i);
                    JSONObject artifact = library.optJSONObject("downloads") == null
                            ? null : library.getJSONObject("downloads").optJSONObject("artifact");
                    if (artifact == null) continue;
                    String path = artifact.optString("path");
                    String url = artifact.optString("url");
                    if (path.isEmpty() || url.isEmpty()) continue;
                    File target = new File(root, "libraries/" + path);
                    if (target.isFile() && target.length() > 0) continue;
                    ensureDir(target.getParentFile());
                    double startProgress = 60.0 + (28.0 * i / total);
                    double endProgress = 60.0 + (28.0 * (i + 1) / total);
                    try {
                        downloadFile(url, target, taskId, title, startProgress, endProgress);
                    } catch (IOException error) {
                        log("WARN", "INSTALL", "运行库跳过：" + path + " (" + error.getMessage() + ")");
                    }
                }
            }

            JSONObject assetIndex = versionJson.optJSONObject("assetIndex");
            if (assetIndex != null) {
                File indexFile = new File(root, "assets/indexes/" + versionId + ".json");
                ensureDir(indexFile.getParentFile());
                downloadFile(assetIndex.optString("url"), indexFile, taskId, title, 89, 91);
                log("INFO", "INSTALL", "资源索引下载完成");
                downloadAssetObjects(indexFile, taskId, title);
            }

            JSONObject marker = new JSONObject();
            marker.put("id", versionId);
            marker.put("installedAt", System.currentTimeMillis());
            marker.put("type", versionJson.optString("type", "release"));
            marker.put("loader", "fabric".equals(loader) ? "fabric" : "vanilla");
            writeText(new File(versionDir, ".installed.json"), marker.toString());
            if ("fabric".equals(loader)) {
                installFabric(versionId, taskId, title);
            }
            emitTask(taskId, title, "安装完成", 100, "done", 0, "");
            log("INFO", "INSTALL", versionId + " 安装完成，用时 " + ((System.currentTimeMillis() - start) / 1000) + "s");
            callJs("onInstalled", new JSONArray().put(versionId).toString());
        } catch (Exception error) {
            if (cancelledTasks.contains(taskId)) {
                emitTask(taskId, title, "已取消", 0, "cancelled", 0, "");
                log("WARN", "INSTALL", "已取消安装 " + versionId);
            } else {
                Log.e(TAG, "install failed", error);
                emitTask(taskId, title, error.getMessage() == null ? "安装失败" : error.getMessage(), 0, "error", 0, "");
                log("ERROR", "INSTALL", "安装 " + versionId + " 失败：" + error.getMessage());
                callJs("onError", "安装失败：" + error.getMessage());
            }
        }
    }

    private void installFabric(String gameVersion, String taskId, String title) throws Exception {
        emitTask(taskId, title, "查询 Fabric Loader", 94, "running", 0, "");
        String base = "https://bmclapi2.bangbang93.com/fabric-meta/v2/versions/loader/" + gameVersion;
        JSONArray loaders = new JSONArray(downloadText(base));
        if (loaders.length() == 0) throw new IOException("没有适配 " + gameVersion + " 的 Fabric Loader");
        JSONObject first = loaders.getJSONObject(0);
        String loaderVersion = first.getJSONObject("loader").optString("version");
        if (loaderVersion.isEmpty()) throw new IOException("Fabric Loader 版本为空");
        log("INFO", "FABRIC", "选择 Fabric Loader " + loaderVersion);

        JSONObject profile = new JSONObject(downloadText(base + "/" + loaderVersion + "/profile/json"));
        String profileId = profile.optString("id", "fabric-loader-" + loaderVersion + "-" + gameVersion);
        JSONArray libraries = profile.optJSONArray("libraries");
        if (libraries == null) libraries = new JSONArray();
        int total = libraries.length();
        for (int i = 0; i < total; i++) {
            JSONObject library = libraries.getJSONObject(i);
            String name = library.optString("name");
            String[] parts = name.split(":");
            if (parts.length < 3) continue;
            String group = parts[0];
            String artifact = parts[1];
            String version = parts[2];
            String relative = group.replace('.', '/') + "/" + artifact + "/" + version + "/"
                    + artifact + "-" + version + ".jar";
            String repo = library.optString("url", "https://maven.fabricmc.net/");
            if (!repo.endsWith("/")) repo += "/";
            File target = new File(root, "libraries/" + relative);
            if (target.isFile() && target.length() > 0) continue;
            ensureDir(target.getParentFile());
            downloadFile(repo + relative, target, taskId, title,
                    94 + 4.0 * i / Math.max(1, total),
                    94 + 4.0 * (i + 1) / Math.max(1, total));
        }

        File profileDir = new File(root, "versions/" + profileId);
        ensureDir(profileDir);
        writeText(new File(profileDir, profileId + ".json"), profile.toString());
        JSONObject marker = new JSONObject();
        marker.put("id", profileId);
        marker.put("inheritsFrom", gameVersion);
        marker.put("loader", "fabric");
        marker.put("loaderVersion", loaderVersion);
        marker.put("installedAt", System.currentTimeMillis());
        writeText(new File(profileDir, ".installed.json"), marker.toString());
        emitTask(taskId, title, "Fabric Loader 已安装", 98, "running", 0, "");
        log("INFO", "FABRIC", "Fabric " + profileId + " 安装完成");
        callJs("onInstalled", new JSONArray().put(profileId).toString());
    }

    private void downloadAssetObjects(File indexFile, String taskId, String title) throws Exception {
        JSONObject index = new JSONObject(readText(indexFile));
        JSONObject objects = index.optJSONObject("objects");
        if (objects == null) return;
        int total = objects.length();
        log("INFO", "INSTALL", "开始补齐资源对象，共 " + total + " 个文件");
        emitTask(taskId, title, "资源对象 0/" + total, 91, "running", 0, "");
        java.util.Iterator<String> keys = objects.keys();
        int done = 0;
        long downloadedBytes = 0;
        while (keys.hasNext()) {
            checkCancelled(taskId);
            String name = keys.next();
            JSONObject object = objects.optJSONObject(name);
            if (object == null) continue;
            String hash = object.optString("hash");
            if (hash.length() < 2) continue;
            File target = new File(root, "assets/objects/" + hash.substring(0, 2) + "/" + hash);
            if (!target.isFile() || target.length() == 0) {
                ensureDir(target.getParentFile());
                String url = "https://resources.download.minecraft.net/" + hash.substring(0, 2) + "/" + hash;
                try {
                    downloadedBytes += downloadQuiet(url, target);
                } catch (IOException error) {
                    log("WARN", "INSTALL", "资源跳过 " + name + "：" + error.getMessage());
                }
            }
            done++;
            if (done % 25 == 0 || done == total) {
                double progress = 91 + 8.0 * done / Math.max(1, total);
                emitTask(taskId, title, "资源对象 " + done + "/" + total, progress, "running", 0, humanBytes(downloadedBytes));
            }
            if (done % 200 == 0) log("INFO", "INSTALL", "资源进度 " + done + "/" + total);
        }
        log("INFO", "INSTALL", "资源对象补齐完成 · " + done + " 个");
    }

    private long downloadQuiet(String url, File target) throws IOException {
        ensureDir(target.getParentFile());
        File temp = new File(target.getAbsolutePath() + ".part");
        HttpURLConnection connection = open(url);
        long downloaded = 0;
        try {
            int code = connection.getResponseCode();
            if (code < 200 || code >= 300) throw new IOException("HTTP " + code);
            try (InputStream input = new BufferedInputStream(connection.getInputStream());
                 BufferedOutputStream output = new BufferedOutputStream(new FileOutputStream(temp))) {
                byte[] buffer = new byte[32768];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    output.write(buffer, 0, read);
                    downloaded += read;
                }
            }
            if (!temp.renameTo(target)) {
                copyFile(temp, target);
                temp.delete();
            }
            return downloaded;
        } catch (IOException error) {
            temp.delete();
            throw error;
        } finally {
            connection.disconnect();
        }
    }

    private JSONObject getManifest(boolean force) throws Exception {
        long now = System.currentTimeMillis();
        if (!force && manifestCache != null && now - manifestCacheTime < 12 * 60 * 60 * 1000L) {
            return new JSONObject(manifestCache);
        }
        IOException last = null;
        for (String url : MANIFEST_URLS) {
            try {
                log("INFO", "NETWORK", "拉取版本清单 " + hostOf(url));
                String text = downloadText(url);
                JSONObject json = new JSONObject(text);
                manifestCache = text;
                manifestCacheTime = now;
                File cacheFile = new File(activity.getFilesDir(), "version_manifest.json");
                writeText(cacheFile, text);
                log("INFO", "NETWORK", "版本清单同步完成，共 " + json.getJSONArray("versions").length() + " 个版本");
                return json;
            } catch (IOException error) {
                last = error;
                log("WARN", "NETWORK", hostOf(url) + " 不可用：" + error.getMessage());
            }
        }
        File cacheFile = new File(activity.getFilesDir(), "version_manifest.json");
        if (cacheFile.isFile()) {
            String text = readText(cacheFile);
            manifestCache = text;
            manifestCacheTime = now - 12 * 60 * 60 * 1000L + 60000L;
            log("WARN", "NETWORK", "使用本地缓存版本清单");
            return new JSONObject(text);
        }
        throw last == null ? new IOException("无法连接版本服务器") : last;
    }

    private void emitManifest(JSONObject manifest) throws Exception {
        JSONArray installed = new JSONArray();
        File versions = new File(root, "versions");
        File[] dirs = versions.listFiles(File::isDirectory);
        if (dirs != null) {
            for (File dir : dirs) {
                if (new File(dir, ".installed.json").isFile()) installed.put(dir.getName());
            }
        }
        JSONObject payload = new JSONObject();
        payload.put("latest", manifest.optJSONObject("latest"));
        payload.put("versions", manifest.optJSONArray("versions"));
        payload.put("installed", installed);
        payload.put("root", root.getAbsolutePath());
        callJs("onManifest", payload.toString());
    }

    private void emitTask(String id, String title, String subtitle, double progress,
                          String status, double speed, String size) {
        JSONObject payload = new JSONObject();
        try {
            payload.put("id", id);
            payload.put("title", title);
            payload.put("subtitle", subtitle);
            payload.put("progress", Math.max(0, Math.min(100, progress)));
            payload.put("status", status);
            payload.put("speed", speed);
            payload.put("size", size);
        } catch (Exception ignored) {
        }
        callJs("onTask", payload.toString());
    }

    private void callJs(String function, String json) {
        if (destroyed) return;
        final String script = "window.KCN && window.KCN." + function + " && window.KCN." + function + "("
                + JSONObject.quote(json) + ");";
        main.post(() -> {
            if (!destroyed) webView.evaluateJavascript(script, null);
        });
    }

    public void appendLog(String level, String source, String message) {
        log(level, source, message);
    }

    private void log(String level, String source, String message) {
        JSONObject entry = new JSONObject();
        try {
            entry.put("time", new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date()));
            entry.put("level", level);
            entry.put("source", source);
            entry.put("message", message);
        } catch (Exception ignored) {
        }
        String line = entry.toString();
        synchronized (logs) {
            logs.add(line);
            if (logs.size() > 300) logs.remove(0);
        }
        callJs("onLog", line);
    }

    private String downloadText(String url) throws IOException {
        HttpURLConnection connection = open(url);
        try {
            int code = connection.getResponseCode();
            if (code < 200 || code >= 300) throw new IOException("HTTP " + code);
            try (InputStream input = new BufferedInputStream(connection.getInputStream());
                 ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[16384];
                int read;
                while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
                return output.toString(StandardCharsets.UTF_8.name());
            }
        } finally {
            connection.disconnect();
        }
    }

    private void downloadFile(String url, File target, String taskId, String title,
                              double startProgress, double endProgress) throws IOException {
        checkCancelled(taskId);
        ensureDir(target.getParentFile());
        File temp = new File(target.getAbsolutePath() + ".part");
        long existing = temp.isFile() ? temp.length() : 0;
        HttpURLConnection connection = open(url);
        if (existing > 0) connection.setRequestProperty("Range", "bytes=" + existing + "-");
        long total = -1;
        try {
            int code = connection.getResponseCode();
            if (existing > 0 && code == 200) {
                existing = 0;
                temp.delete();
            }
            if (code < 200 || code >= 300) throw new IOException("HTTP " + code);
            boolean append = existing > 0 && code == 206;
            total = append ? existing + connection.getContentLengthLong() : connection.getContentLengthLong();
            try (InputStream input = new BufferedInputStream(connection.getInputStream());
                 BufferedOutputStream output = new BufferedOutputStream(new FileOutputStream(temp, append))) {
                byte[] buffer = new byte[65536];
                long downloaded = append ? existing : 0;
                long started = System.currentTimeMillis();
                long lastUpdate = 0;
                int read;
                while ((read = input.read(buffer)) != -1) {
                    checkCancelled(taskId);
                    output.write(buffer, 0, read);
                    downloaded += read;
                    long now = System.currentTimeMillis();
                    if (now - lastUpdate > 220 || (total > 0 && downloaded == total)) {
                        lastUpdate = now;
                        double ratio = total > 0 ? (double) downloaded / total : 0.35;
                        double progress = startProgress + (endProgress - startProgress) * ratio;
                        double speed = downloaded / Math.max(1.0, (now - started) / 1000.0);
                        emitTask(taskId, title, humanBytes(downloaded) + (total > 0 ? " / " + humanBytes(total) : ""),
                                progress, "running", speed / 1024.0 / 1024.0, humanBytes(downloaded));
                    }
                }
            }
            if (!temp.renameTo(target)) {
                copyFile(temp, target);
                temp.delete();
            }
        } catch (IOException error) {
            // Keep the .part file so the next attempt can resume with a Range request.
            throw error;
        } finally {
            connection.disconnect();
        }
    }

    private HttpURLConnection open(String url) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setConnectTimeout(20000);
        connection.setReadTimeout(60000);
        connection.setInstanceFollowRedirects(true);
        connection.setRequestProperty("User-Agent", USER_AGENT);
        connection.setRequestProperty("Accept", "*/*");
        return connection;
    }

    private static void copyFile(File from, File to) throws IOException {
        try (FileInputStream input = new FileInputStream(from);
             FileOutputStream output = new FileOutputStream(to)) {
            byte[] buffer = new byte[65536];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
        }
    }

    private static void ensureDir(File dir) throws IOException {
        if (dir != null && !dir.exists() && !dir.mkdirs()) throw new IOException("无法创建目录 " + dir);
    }

    private static String readText(File file) throws IOException {
        if (!file.isFile()) return "";
        try (FileInputStream input = new FileInputStream(file);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
            return output.toString(StandardCharsets.UTF_8.name());
        }
    }

    private static void writeText(File file, String text) throws IOException {
        ensureDir(file.getParentFile());
        try (FileOutputStream output = new FileOutputStream(file)) {
            output.write(text.getBytes(StandardCharsets.UTF_8));
        }
    }

    private static String hostOf(String url) {
        try {
            return new URL(url).getHost();
        } catch (Exception ignored) {
            return url;
        }
    }

    private static String humanBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format(Locale.US, "%.1f KB", bytes / 1024.0);
        if (bytes < 1024L * 1024 * 1024) return String.format(Locale.US, "%.1f MB", bytes / 1024.0 / 1024.0);
        return String.format(Locale.US, "%.2f GB", bytes / 1024.0 / 1024.0 / 1024.0);
    }

    public void shutdown() {
        destroyed = true;
        io.shutdownNow();
    }
}
