// webhook-setup.js
// Run this script to set up your Telegram bot webhook
// Usage: deno run --allow-net webhook-setup.js

const BOT_TOKEN = prompt("8881037426:AAFKnDo8ybWT4mJdoFhQy8brSjOMpsEe6hw");
const WEBHOOK_URL = prompt("https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot");
const WEBHOOK_SECRET = prompt("a8f5f167f44f4964e6c998dee827110c3b2e3f9a6d7c8b5e2f1a4d9c7b6e3f8a");

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error("❌ BOT_TOKEN and WEBHOOK_URL are required");
  Deno.exit(1);
}

const webhookFullUrl = `${WEBHOOK_URL}/bot-webhook`;

console.log("\n🔧 Setting up webhook...");
console.log(`   URL: ${webhookFullUrl}`);
console.log(`   Secret: ${WEBHOOK_SECRET || 'None'}`);

try {
  // Set webhook
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookFullUrl,
      secret_token: WEBHOOK_SECRET || undefined,
      allowed_updates: ["message", "callback_query", "my_chat_member", "chat_member"],
    }),
  });

  const data = await res.json();
  
  if (data.ok) {
    console.log("\n✅ Webhook set successfully!");
    console.log(`   Description: ${data.description}`);
  } else {
    console.error("\n❌ Failed to set webhook:");
    console.error(`   Error: ${data.description}`);
  }

  // Verify webhook
  console.log("\n🔍 Checking webhook info...");
  const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const infoData = await infoRes.json();
  
  if (infoData.ok) {
    const info = infoData.result;
    console.log(`   URL: ${info.url}`);
    console.log(`   Pending updates: ${info.pending_update_count}`);
    console.log(`   Last error: ${info.last_error_message || 'None'}`);
    console.log(`   Last error date: ${info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : 'None'}`);
  }
} catch (e) {
  console.error("\n❌ Error:", e.message);
}

console.log("\n📋 Next Steps:");
console.log("1. Send /setup to your bot in Telegram to verify configuration");
console.log("2. Add the bot to a channel as admin");
console.log("3. You should receive a confirmation message");
console.log("\n⚠️ Important: Make sure bot privacy is DISABLED in @BotFather");
console.log("   Send /setprivacy to @BotFather → Select your bot → DISABLED");
