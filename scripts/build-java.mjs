#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import fs from "node:fs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");
const javaSourceDir = resolve(projectRoot, "java/src/main/java");
const javaOutputDir = resolve(projectRoot, "java/target/classes");
const libDir = resolve(projectRoot, "java/target/lib");
const jarPath = resolve(projectRoot, "java/target/devos-services.jar");
const javacPath = "C:\\java-21\\bin\\javac.exe";
const jarTool = "C:\\java-21\\bin\\jar.exe";

if (!existsSync(javacPath)) {
  console.error("[java] Error: Java 21 not found at C:\\java-21");
  console.error("[java] Please install Java 21 from https://adoptium.net");
  process.exit(1);
}

[javaOutputDir, libDir].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    if (existsSync(filePath)) {
      console.log(`  [cached] ${filePath.split("\\").pop()}`);
      resolve();
      return;
    }
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log(`  [✓] downloaded ${filePath.split("\\").pop()}`);
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

try {
  console.log("[java] Downloading dependencies...");
  
  const gsonJar = resolve(libDir, "gson-2.10.1.jar");
  const slf4jJar = resolve(libDir, "slf4j-api-2.0.9.jar");
  const slf4jSimpleJar = resolve(libDir, "slf4j-simple-2.0.9.jar");

  await downloadFile(
    "https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar",
    gsonJar
  );
  await downloadFile(
    "https://repo1.maven.org/maven2/org/slf4j/slf4j-api/2.0.9/slf4j-api-2.0.9.jar",
    slf4jJar
  );
  await downloadFile(
    "https://repo1.maven.org/maven2/org/slf4j/slf4j-simple/2.0.9/slf4j-simple-2.0.9.jar",
    slf4jSimpleJar
  );

  console.log("[java] Compiling Java source files...");
  const javaFiles = execSync(
    `dir /s /b "${javaSourceDir}\\*.java"`,
    { encoding: "utf8", stdio: "pipe" }
  )
    .trim()
    .split("\n")
    .filter((f) => f.trim());

  if (javaFiles.length === 0) {
    console.log("[java] No Java files found.");
    process.exit(0);
  }

  const classpath = `"${gsonJar}";"${slf4jJar}";"${slf4jSimpleJar}"`;
  const compileCmd = `"${javacPath}" -cp ${classpath} -d "${javaOutputDir}" ${javaFiles.map((f) => `"${f}"`).join(" ")}`;
  execSync(compileCmd, { stdio: "inherit" });
  console.log(`[java] Compiled ${javaFiles.length} Java files.`);

  console.log("[java] Creating JAR archive...");
  const jarCmd = `"${jarTool}" cfe "${jarPath}" com.devos.DevOSServiceMain -C "${javaOutputDir}" . -C "${libDir}" .`;
  execSync(jarCmd, { stdio: "inherit" });
  console.log(`[java] Build complete!`);
} catch (error) {
  console.error("[java] Build failed!");
  console.error(error.message);
  process.exit(1);
}
