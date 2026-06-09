package com.devos;

import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Detects development environment tools and versions
 * Checks for Node.js, Python, Java, Git, Docker, etc.
 */
public class EnvironmentDetectorHandler implements DevOSServiceMain.ServiceHandler {

    @Override
    public JsonObject handle(JsonObject payload) throws Exception {
        JsonArray detected = new JsonArray();
        
        // Check for common development tools
        checkTool("node", "Node.js", detected);
        checkTool("python", "Python", detected);
        checkTool("java", "Java", detected);
        checkTool("git", "Git", detected);
        checkTool("docker", "Docker", detected);
        checkTool("npm", "npm", detected);
        checkTool("mvn", "Maven", detected);
        
        JsonObject result = new JsonObject();
        result.add("detectedTools", detected);
        result.addProperty("osName", System.getProperty("os.name"));
        result.addProperty("osVersion", System.getProperty("os.version"));
        result.addProperty("javaVersion", System.getProperty("java.version"));
        
        return result;
    }

    private void checkTool(String command, String toolName, JsonArray detected) {
        try {
            ProcessBuilder pb = new ProcessBuilder(isWindows() ? "where" : "which", command);
            Process process = pb.start();
            
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line = reader.readLine();
            
            if (line != null && !line.isEmpty()) {
                JsonObject tool = new JsonObject();
                tool.addProperty("name", toolName);
                tool.addProperty("command", command);
                tool.addProperty("path", line.trim());
                tool.addProperty("installed", true);
                
                // Try to get version
                try {
                    String version = getVersion(command);
                    tool.addProperty("version", version);
                } catch (Exception e) {
                    tool.addProperty("version", "unknown");
                }
                
                detected.add(tool);
            }
            
            process.waitFor();
        } catch (Exception e) {
            // Tool not found, skip it
        }
    }

    private String getVersion(String command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command, "--version");
        Process process = pb.start();
        
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String firstLine = reader.readLine();
        
        process.waitFor();
        return firstLine != null ? firstLine.trim() : "unknown";
    }

    private boolean isWindows() {
        return System.getProperty("os.name").toLowerCase().contains("windows");
    }
}
