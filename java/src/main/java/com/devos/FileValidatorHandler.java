package com.devos;

import com.google.gson.JsonObject;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Validates file paths and permissions
 */
public class FileValidatorHandler implements DevOSServiceMain.ServiceHandler {

    @Override
    public JsonObject handle(JsonObject payload) throws Exception {
        String filePath = payload.get("filePath").getAsString();
        
        Path path = Paths.get(filePath);
        JsonObject result = new JsonObject();
        
        result.addProperty("path", filePath);
        result.addProperty("exists", Files.exists(path));
        result.addProperty("isDirectory", Files.isDirectory(path));
        result.addProperty("isFile", Files.isRegularFile(path));
        result.addProperty("isReadable", Files.isReadable(path));
        result.addProperty("isWritable", Files.isWritable(path));
        
        if (Files.exists(path)) {
            result.addProperty("size", Files.size(path));
            result.addProperty("lastModified", Files.getLastModifiedTime(path).toMillis());
            result.addProperty("absolutePath", path.toAbsolutePath().toString());
        }
        
        return result;
    }
}
