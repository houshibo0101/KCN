package com.kcn.launcher;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Builds a deterministic Minecraft launch plan from an installed instance.
 *
 * This is the first half of the launch layer: classpath, main class, Java path,
 * asset index and an offline argument template. The JVM/GL bridge is still a
 * separate step, so this class never starts a process.
 */
public final class LaunchPlanner {
    private final File minecraftRoot;
    private final File filesRoot;

    public LaunchPlanner(File minecraftRoot, File filesRoot) {
        this.minecraftRoot = minecraftRoot;
        this.filesRoot = filesRoot;
    }

    public JSONObject prepare(String instanceId) throws Exception {
        if (instanceId == null || instanceId.isEmpty()) throw new IOException("实例 ID 为空");
        File versionDir = new File(minecraftRoot, "versions/" + instanceId);
        File childFile = new File(versionDir, instanceId + ".json");
        if (!childFile.isFile()) throw new IOException("找不到版本 JSON：" + instanceId);

        JSONObject child = new JSONObject(readText(childFile));
        String baseId = child.optString("inheritsFrom", "");
        JSONObject base = child;
        if (!baseId.isEmpty()) {
            File baseFile = new File(minecraftRoot, "versions/" + baseId + "/" + baseId + ".json");
            if (!baseFile.isFile()) throw new IOException("找不到父版本：" + baseId);
            base = new JSONObject(readText(baseFile));
        }

        JSONArray warnings = new JSONArray();
        Set<String> classpath = new LinkedHashSet<>();
        Set<String> seenLibraries = new LinkedHashSet<>();
        addLibraries(base.optJSONArray("libraries"), classpath, seenLibraries, warnings);
        addLibraries(child.optJSONArray("libraries"), classpath, seenLibraries, warnings);

        File clientJar = new File(versionDir, instanceId + ".jar");
        if (!clientJar.isFile() && !baseId.isEmpty()) {
            clientJar = new File(minecraftRoot, "versions/" + baseId + "/" + baseId + ".jar");
        }
        if (clientJar.isFile()) classpath.add(clientJar.getAbsolutePath());
        else warnings.put("缺少 client.jar");

        String mainClass = child.optString("mainClass", base.optString("mainClass", "net.minecraft.client.main.Main"));
        JSONObject assetIndex = base.optJSONObject("assetIndex");
        String assetIndexId = assetIndex == null ? "" : assetIndex.optString("id", baseId);
        if (assetIndexId.isEmpty()) warnings.put("缺少 assetIndex");

        File javaHome = new File(filesRoot, "runtime/jre21");
        File javaBin = new File(javaHome, "bin/java");
        boolean javaReady = new File(javaHome, ".kcn_java").isFile();
        if (!javaReady) warnings.put("Java 21 运行时尚未解压");
        if (!javaBin.isFile()) warnings.put("找不到 bin/java");

        File natives = new File(minecraftRoot, "natives/" + instanceId);
        if (!natives.isDirectory()) warnings.put("natives 目录尚未由启动层解压");

        List<String> args = new ArrayList<>();
        args.add(javaBin.getAbsolutePath());
        args.add("-Xmx2G");
        args.add("-Xms512M");
        args.add("-Dfile.encoding=UTF-8");
        args.add("-Dminecraft.launcher.brand=KCN");
        args.add("-Dminecraft.launcher.version=0.1.3");
        args.add("-Djava.library.path=" + natives.getAbsolutePath());
        args.add("-cp");
        args.add(String.join(File.pathSeparator, classpath));
        args.add(mainClass);
        args.add("--username");
        args.add("KCNPlayer");
        args.add("--version");
        args.add(instanceId);
        args.add("--gameDir");
        args.add(minecraftRoot.getAbsolutePath());
        args.add("--assetsDir");
        args.add(new File(minecraftRoot, "assets").getAbsolutePath());
        args.add("--assetIndex");
        args.add(assetIndexId);
        args.add("--uuid");
        args.add("00000000000000000000000000000000");
        args.add("--accessToken");
        args.add("0");
        args.add("--userType");
        args.add("legacy");
        args.add("--versionType");
        args.add("KCN");

        JSONObject plan = new JSONObject();
        plan.put("ok", true);
        plan.put("instance", instanceId);
        plan.put("base", baseId.isEmpty() ? instanceId : baseId);
        plan.put("mainClass", mainClass);
        plan.put("java", javaBin.getAbsolutePath());
        plan.put("javaReady", javaReady);
        plan.put("assetIndex", assetIndexId);
        plan.put("clientJar", clientJar.getAbsolutePath());
        plan.put("classpathCount", classpath.size());
        plan.put("natives", natives.getAbsolutePath());
        plan.put("warnings", warnings);
        JSONArray argumentArray = new JSONArray();
        for (String arg : args) argumentArray.put(arg);
        plan.put("args", argumentArray);

        JSONObject summary = new JSONObject();
        summary.put("instance", instanceId);
        summary.put("mainClass", mainClass);
        summary.put("classpathCount", classpath.size());
        summary.put("javaReady", javaReady);
        summary.put("createdAt", System.currentTimeMillis());
        summary.put("warnings", warnings);
        writeText(new File(versionDir, "launch-plan.json"), summary.toString());
        return plan;
    }

    private void addLibraries(JSONArray libraries, Set<String> classpath, Set<String> seen,
                              JSONArray warnings) {
        if (libraries == null) return;
        for (int i = 0; i < libraries.length(); i++) {
            JSONObject library = libraries.optJSONObject(i);
            if (library == null) continue;
            JSONObject downloads = library.optJSONObject("downloads");
            JSONObject artifact = downloads == null ? null : downloads.optJSONObject("artifact");
            String relative = null;
            if (artifact != null) relative = artifact.optString("path", "");
            if (relative == null || relative.isEmpty()) {
                String name = library.optString("name", "");
                String[] parts = name.split(":");
                if (parts.length >= 3) {
                    relative = parts[0].replace('.', '/') + "/" + parts[1] + "/" + parts[2] + "/"
                            + parts[1] + "-" + parts[2] + ".jar";
                }
            }
            if (relative == null || relative.isEmpty()) continue;
            if (!seen.add(relative)) continue;
            File jar = new File(minecraftRoot, "libraries/" + relative);
            if (jar.isFile()) classpath.add(jar.getAbsolutePath());
            else warnings.put("缺少运行库：" + relative);
        }
    }

    private static String readText(File file) throws IOException {
        try (FileInputStream input = new FileInputStream(file);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
            return output.toString(StandardCharsets.UTF_8.name());
        }
    }

    private static void writeText(File file, String text) throws IOException {
        File parent = file.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) throw new IOException("无法创建目录");
        try (FileOutputStream output = new FileOutputStream(file)) {
            output.write(text.getBytes(StandardCharsets.UTF_8));
        }
    }
}
