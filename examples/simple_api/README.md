# Simple SDK API Wrapper

This example allows you to create a simple API wrapper for the SDK.

## Usage

To use with any environment you can follow the steps below:

```bash
cp .env.example .env.local
# Add the environment variables to .env.local
bun run src/main.ts
```

For use with Vercel you can follow the steps below:

```bash
# Add the environment variables from .env.example
vercel env add # KEYS "XXX,YYY"
vercel dev

# to deploy use
vercel --prod

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
