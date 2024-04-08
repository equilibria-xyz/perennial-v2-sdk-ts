# Simple SDK API Wrapper

This example allows you to create a simple API wrapper for the SDK.

## Usage

```bash
cp .env.example .env.local
vercel dev
```

## Endpoints

### POST /api/generic

This endpoint allows you to call any method from the SDK.

#### Request Example

You can call any method from the SDK by sending a JSON object with the following structure:

```json
{
  "func": "methodName",
  "args": {
    "arg1": "value1",
    "arg2": "value2"
  }
}
```
