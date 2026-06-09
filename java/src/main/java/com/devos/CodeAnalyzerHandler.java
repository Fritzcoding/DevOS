package com.devos;

import com.google.gson.JsonObject;

/**
 * Analyzes code patterns and potential issues
 */
public class CodeAnalyzerHandler implements DevOSServiceMain.ServiceHandler {

    @Override
    public JsonObject handle(JsonObject payload) throws Exception {
        String code = payload.get("code").getAsString();
        String language = payload.get("language").getAsString();

        JsonObject result = new JsonObject();
        result.addProperty("lineCount", countLines(code));
        result.addProperty("charCount", code.length());
        result.addProperty("language", language);
        
        // Basic pattern analysis
        result.addProperty("hasComments", hasComments(code, language));
        result.addProperty("hasErrorHandling", hasErrorHandling(code));
        result.addProperty("complexityLevel", analyzeComplexity(code));
        
        return result;
    }

    private int countLines(String code) {
        return code.split("\n", -1).length;
    }

    private boolean hasComments(String code, String language) {
        if (language.equals("java")) {
            return code.contains("//") || code.contains("/*");
        } else if (language.equals("python")) {
            return code.contains("#") || code.contains("\"\"\"");
        } else if (language.contains("script")) {
            return code.contains("//") || code.contains("/*");
        }
        return false;
    }

    private boolean hasErrorHandling(String code) {
        return code.contains("try") || code.contains("catch") || 
               code.contains("throws") || code.contains("except") ||
               code.contains("error");
    }

    private String analyzeComplexity(String code) {
        int nestingLevel = 0;
        int maxNesting = 0;
        
        for (char c : code.toCharArray()) {
            if (c == '{' || c == '[' || c == '(') {
                nestingLevel++;
                maxNesting = Math.max(maxNesting, nestingLevel);
            } else if (c == '}' || c == ']' || c == ')') {
                nestingLevel--;
            }
        }
        
        if (maxNesting > 5) return "high";
        if (maxNesting > 3) return "medium";
        return "low";
    }
}
