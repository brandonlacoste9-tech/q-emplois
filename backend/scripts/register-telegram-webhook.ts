#!/usr/bin/env node
/**
 * register-telegram-webhook.ts
 *
 * One-time script to register (or update) the Telegram Bot webhook URL.
 *
 * Usage:
 *   npx ts-node scripts/register-telegram-webhook.ts
 *
 * Or, if you only have Node:
 *   TELEGRAM_BOT_TOKEN=... BACKEND_URL=https://api.qemplois.ca node -e "$(cat scripts/register-telegram-webhook.ts)"
 *
 * Env vars (can be in .env):
 *   TELEGRAM_BOT_TOKEN   — from @BotFather
 *   BACKEND_URL          — your deployed backend (e.g. https://api.qemplois.ca)
 */

// Load .env if present
try {
  require('dotenv').config();
} catch {
  // dotenv not installed — env vars must be set manually
}

async function main() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const backendUrl = process.env.BACKEND_URL;

  if (!botToken) {
    console.error('❌  TELEGRAM_BOT_TOKEN is not set.');
    console.error('    Set it in .env or export it before running this script.');
    process.exit(1);
  }

  if (!backendUrl) {
    console.error('❌  BACKEND_URL is not set.');
    console.error('    Example: BACKEND_URL=https://api.qemplois.ca');
    process.exit(1);
  }

  const webhookUrl = `${backendUrl.replace(/\/$/, '')}/api/v1/webhooks/telegram`;

  console.log(`\n🤖  Registering Telegram webhook...`);
  console.log(`    Bot token : ${botToken.slice(0, 10)}...`);
  console.log(`    Webhook   : ${webhookUrl}\n`);

  // 1. Set webhook
  const setRes = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
      }),
    },
  );

  const setData = await setRes.json() as any;

  if (!setRes.ok || !setData.ok) {
    console.error('❌  setWebhook failed:', JSON.stringify(setData, null, 2));
    process.exit(1);
  }

  console.log('✅  Webhook registered:', setData.description);

  // 2. Verify
  const infoRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
  const infoData = await infoRes.json() as any;

  console.log('\n📋  Webhook info:');
  console.log(`    URL         : ${infoData.result?.url}`);
  console.log(`    Pending     : ${infoData.result?.pending_update_count ?? 0} updates`);
  console.log(`    Last error  : ${infoData.result?.last_error_message ?? 'none'}`);
  console.log('\n🚀  Done! Your bot is ready to receive messages.\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
