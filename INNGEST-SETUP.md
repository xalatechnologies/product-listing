# Inngest Setup Guide

## Local Development

For local development, you need to run the Inngest dev server alongside your Next.js app.

### Step 1: Install Inngest CLI (if not already installed)

```bash
npm install -g inngest-cli
```

Or use npx:

```bash
npx inngest-cli@latest dev
```

### Step 2: Start Inngest Dev Server

In a separate terminal, run:

```bash
npx inngest-cli dev
```

This will:
- Start the Inngest dev server on `http://localhost:8288`
- Provide a UI to monitor functions and events
- Automatically sync your Inngest functions

### Step 3: Start Your Next.js App

```bash
npm run dev
```

Your app should be running on `http://localhost:3000` (or the port specified in your `.env`)

### Step 4: Verify Setup

1. Open the Inngest dev UI: `http://localhost:8288`
2. You should see your functions listed:
   - `generate-listing-images`
   - `generate-complete-pack`
   - `user-registered-handler`
   - `message-handler`

## Environment Variables

For local development, you can use placeholder values:

```env
INNGEST_EVENT_KEY=local
INNGEST_SIGNING_KEY=local-signing-key
```

For production, you'll need actual Inngest credentials from your Inngest dashboard.

## Troubleshooting

### Error: "Failed to queue Inngest job"

This usually means:
1. Inngest dev server is not running - start it with `npx inngest-cli dev`
2. The Inngest API endpoint is not accessible - check that `/api/inngest` route is working
3. Network issues - check firewall/port blocking

### Functions Not Appearing in Dev UI

1. Make sure your functions are exported in `src/app/api/inngest/route.ts`
2. Restart both the Next.js server and Inngest dev server
3. Check the Inngest dev server logs for errors

### Events Not Processing

1. Check the Inngest dev UI for event logs
2. Verify the event name matches between `inngest.send()` and function definition
3. Check function logs in the Inngest dev UI

## Production Setup

For production, you'll need:

1. An Inngest account at https://www.inngest.com
2. Your Inngest app ID and keys
3. Set environment variables:
   ```env
   INNGEST_EVENT_KEY=your-event-key
   INNGEST_SIGNING_KEY=your-signing-key
   ```

The Inngest functions will automatically sync when you deploy your Next.js app.

