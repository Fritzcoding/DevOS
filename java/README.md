# Java Backend Services

This directory contains Java microservices that handle heavy lifting operations for DevOps Lite.

## Architecture

\\\
Renderer (React) 
    ↓ IPC (unchanged)
Main Process (Node.js)
    ↓ stdin/stdout JSON
Java Service (this module)
    ├── FileOrganizerHandler (file analysis & categorization)
    ├── EnvironmentDetectorHandler (tool detection)
    ├── CodeAnalyzerHandler (code pattern analysis)
    └── FileValidatorHandler (file system validation)
\\\

## Why Java?

- **Better file system API**: Robust path handling, permissions, metadata
- **Native tool integration**: Subprocess management for detecting development tools
- **Performance**: Faster for file operations and pattern matching
- **Separation of concerns**: Heavy lifting separate from Electron main process
- **Cross-platform**: JVM ensures consistent behavior across Windows/Mac/Linux

## Building

### Requirements
- Maven 3.6+
- Java 17+

### Build Commands

\\\ash
# Build the JAR (runs automatically on npm run dev)
mvn -f java/pom.xml clean package

# Build with debug output
mvn -f java/pom.xml clean package -X

# Run tests
mvn -f java/pom.xml test
\\\

Output: \java/target/devops-services.jar\

## Usage from Node.js

### TypeScript

\\\	ypescript
import { javaServiceAdapter } from '../services/java/JavaServiceAdapter';

// Start the service
await javaServiceAdapter.start();

// Execute a command
const result = await javaServiceAdapter.execute('organizeFiles', {
  basePath: '/path/to/project',
  recursive: true
});

// Shutdown
await javaServiceAdapter.stop();
\\\

### Supported Commands

#### organizeFiles
Scans a directory and categorizes files by type.

**Payload:**
\\\json
{
  "basePath": "/path/to/directory",
  "recursive": true
}
\\\

**Response:**
\\\json
{
  "fileGroups": [
    {
      "category": "JavaScript/TypeScript",
      "files": [
        {
          "name": "file.ts",
          "path": "/path/to/file.ts",
          "extension": "ts",
          "size": 1024
        }
      ]
    }
  ],
  "totalFiles": 5,
  "basePath": "/path/to/directory"
}
\\\

#### detectEnvironment
Detects installed development tools and versions.

**Payload:** (empty object)
\\\json
{}
\\\

**Response:**
\\\json
{
  "detectedTools": [
    {
      "name": "Node.js",
      "command": "node",
      "path": "/usr/bin/node",
      "installed": true,
      "version": "v20.10.0"
    }
  ],
  "osName": "Linux",
  "osVersion": "5.15.0",
  "javaVersion": "17.0.1"
}
\\\

#### analyzeCode
Analyzes code for patterns and complexity.

**Payload:**
\\\json
{
  "code": "public class Foo { ... }",
  "language": "java"
}
\\\

**Response:**
\\\json
{
  "lineCount": 42,
  "charCount": 1024,
  "language": "java",
  "hasComments": true,
  "hasErrorHandling": true,
  "complexityLevel": "medium"
}
\\\

#### validatePath
Validates file permissions and metadata.

**Payload:**
\\\json
{
  "filePath": "/path/to/file"
}
\\\

**Response:**
\\\json
{
  "path": "/path/to/file",
  "exists": true,
  "isDirectory": false,
  "isFile": true,
  "isReadable": true,
  "isWritable": true,
  "size": 1024,
  "lastModified": 1234567890,
  "absolutePath": "/absolute/path/to/file"
}
\\\

## Adding New Handlers

1. Create a new handler class implementing \ServiceHandler\
2. Register in \DevOpsServiceMain\ static initializer
3. Document in this README
4. Test locally before deploying

Example:

\\\java
public class MyNewHandler implements DevOpsServiceMain.ServiceHandler {
    @Override
    public JsonObject handle(JsonObject payload) throws Exception {
        // Implementation
        JsonObject result = new JsonObject();
        result.addProperty("status", "ok");
        return result;
    }
}
\\\

Then register:
\\\java
static {
    handlers.put("myCommand", new MyNewHandler());
}
\\\

## Integration Points

### IPC Layer (Unchanged)
The renderer still uses IPC to communicate with the Node.js main process. No changes to \ipc-types.ts\ needed.

### Main Process Hook
In \main.ts\, when handling IPC requests for file operations:

\\\	ypescript
// Option 1: Use Java for heavy operations
const result = await javaServiceAdapter.execute('organizeFiles', {
  basePath,
  recursive: true
});

// Option 2: Continue using Node.js for simple operations
// No breaking changes - existing code still works
\\\

## Troubleshooting

**JAR not found:**
\\\
Error: devops-services.jar not found
\\\
→ Run \mvn -f java/pom.xml clean package\ to build

**Process won't start:**
\\\
Java service process error: spawn java ENOENT
\\\
→ Ensure Java 17+ is installed: \java --version\

**Timeout errors:**
- Increase timeout parameter: \execute(cmd, payload, 60000)\
- Check system resources
- Look at Java stderr logs

## Future Enhancements

- [ ] Connection pooling for multiple Java instances
- [ ] Caching layer for repeated operations
- [ ] gRPC instead of JSON/stdio for better performance
- [ ] Native image compilation with GraalVM
