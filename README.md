# Online Code Compiler API

An API for executing code snippets in various programming languages. The API supports multiple languages and provides execution results including output, errors, and execution time.

## Endpoints

### GET /languages

Fetches a list of supported programming languages.

**Response:**

```json
{
    "supportedLanguages": [
        {
            "id": "javascript",
            "language": "javascript"
        },
        {
            "id": "Java",
            "language": "java"
        },
        {
            "id": "Python",
            "language": "python"
        },
        {
            "id": "C",
            "language": "c"
        },
        {
            "id": "c++",
            "language": "cpp"
        },
        {
            "id": "ruby",
            "language": "ruby"
        }
    ]
}

```

### execute

executes the code and return the response

```json
{
  "language": "python",  // Programming language
  "code": "print('Hello, World!')"  // Code to be executed
}

```
**Response:**

```json
{
  "executionId": "unique-execution-id",
  "output": "Hello, World!",
  "error": "",
  "startTime": "2024-07-30T12:00:00Z",
  "executionTime": "10 ms",
  "linesOfCode": 1
}
```
