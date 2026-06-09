package com.devos;

import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

/**
 * Handles file organization operations
 * Detects file types, groups similar files, and suggests organization
 */
public class FileOrganizerHandler implements DevOSServiceMain.ServiceHandler {

    @Override
    public JsonObject handle(JsonObject payload) throws Exception {
        String basePath = payload.get("basePath").getAsString();
        boolean recursive = payload.has("recursive") && payload.get("recursive").getAsBoolean();

        Path rootPath = Paths.get(basePath);
        if (!Files.exists(rootPath)) {
            throw new IllegalArgumentException("Path does not exist: " + basePath);
        }

        JsonArray fileGroups = new JsonArray();
        try (Stream<Path> paths = recursive ? Files.walk(rootPath) : Files.list(rootPath)) {
            paths.filter(Files::isRegularFile)
                .forEach(path -> categorizeFile(path, basePath, fileGroups));
        }

        JsonObject result = new JsonObject();
        result.add("fileGroups", fileGroups);
        result.addProperty("totalFiles", fileGroups.size());
        result.addProperty("basePath", basePath);
        return result;
    }

    private void categorizeFile(Path filePath, String basePath, JsonArray groups) {
        String fileName = filePath.getFileName().toString();
        String extension = getExtension(fileName);
        String category = categorizeByExtension(extension);

        // Find or create group
        JsonObject group = findOrCreateGroup(groups, category);
        JsonArray files = group.getAsJsonArray("files");
        
        JsonObject fileObj = new JsonObject();
        fileObj.addProperty("name", fileName);
        fileObj.addProperty("path", filePath.toString());
        fileObj.addProperty("extension", extension);
        fileObj.addProperty("size", filePath.toFile().length());

        files.add(fileObj);
    }

    private JsonObject findOrCreateGroup(JsonArray groups, String category) {
        for (int i = 0; i < groups.size(); i++) {
            JsonObject group = groups.get(i).getAsJsonObject();
            if (group.get("category").getAsString().equals(category)) {
                return group;
            }
        }

        JsonObject newGroup = new JsonObject();
        newGroup.addProperty("category", category);
        newGroup.add("files", new JsonArray());
        groups.add(newGroup);
        return newGroup;
    }

    private String getExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : "none";
    }

    private String categorizeByExtension(String ext) {
        return switch (ext) {
            case "java", "class", "jar" -> "Java Files";
            case "js", "ts", "jsx", "tsx" -> "JavaScript/TypeScript";
            case "py", "pyw", "pyx" -> "Python";
            case "json", "xml", "yaml", "yml" -> "Configuration";
            case "md", "txt", "doc", "docx" -> "Documents";
            case "png", "jpg", "jpeg", "gif", "svg" -> "Images";
            case "zip", "tar", "gz", "rar" -> "Archives";
            default -> "Other";
        };
    }
}
