package com.devos;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.io.*;
import java.util.HashMap;
import java.util.Map;

/**
 * Main entry point for DevOps Java Services
 * Communicates with Node.js main process via stdin/stdout using JSON messages
 * Each message has format: {"command": "...", "payload": {...}, "requestId": "..."}
 */
public class DevOSServiceMain {
    private static final Gson gson = new Gson();
    private static final Map<String, ServiceHandler> handlers = new HashMap<>();

    static {
        // Register all service handlers
        handlers.put("organizeFiles", new FileOrganizerHandler());
        handlers.put("detectEnvironment", new EnvironmentDetectorHandler());
        handlers.put("analyzeCode", new CodeAnalyzerHandler());
        handlers.put("validatePath", new FileValidatorHandler());
    }

    public static void main(String[] args) {
        System.setErr(new PrintStream(System.err)); // Ensure stderr is available for logging
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));

        try {
            String line;
            while ((line = reader.readLine()) != null) {
                processMessage(line);
            }
        } catch (IOException e) {
            sendError("IO_ERROR", "Failed to read from stdin: " + e.getMessage(), "");
        }
    }

    private static void processMessage(String jsonLine) {
        try {
            JsonObject request = gson.fromJson(jsonLine, JsonObject.class);
            String command = request.get("command").getAsString();
            String requestId = request.get("requestId").getAsString();
            JsonObject payload = request.getAsJsonObject("payload");

            ServiceHandler handler = handlers.get(command);
            if (handler == null) {
                sendError("UNKNOWN_COMMAND", "Command not found: " + command, requestId);
                return;
            }

            JsonObject result = handler.handle(payload);
            sendSuccess(result, requestId, command);
        } catch (Exception e) {
            sendError("PARSE_ERROR", "Failed to parse message: " + e.getMessage(), "");
        }
    }

    private static void sendSuccess(JsonObject data, String requestId, String command) {
        JsonObject response = new JsonObject();
        response.addProperty("status", "success");
        response.addProperty("requestId", requestId);
        response.addProperty("command", command);
        response.add("data", data);
        System.out.println(gson.toJson(response));
        System.out.flush();
    }

    private static void sendError(String errorCode, String message, String requestId) {
        JsonObject response = new JsonObject();
        response.addProperty("status", "error");
        response.addProperty("errorCode", errorCode);
        response.addProperty("message", message);
        response.addProperty("requestId", requestId);
        System.out.println(gson.toJson(response));
        System.out.flush();
    }

    interface ServiceHandler {
        JsonObject handle(JsonObject payload) throws Exception;
    }
}
