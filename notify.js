const fs = require("fs");
const path = require("path");
const notifier = require("node-notifier");

const APP_ID = "com.productivity.notifier";

if (process.argv.length < 3) {
  console.error("Usage: node notify.js <path-to-json>");
  process.exit(1);
}

const configPath = path.resolve(process.argv[2]);

if (!fs.existsSync(configPath)) {
  console.error("Config file not found:", configPath);
  process.exit(1);
}

let config;

try {
  const raw = fs.readFileSync(configPath, "utf-8");
  config = JSON.parse(raw);
} catch (err) {
  console.error("Invalid JSON file.");
  process.exit(1);
}

if (!Array.isArray(config.notifications)) {
  console.error("Invalid config format. 'notifications' must be an array.");
  process.exit(1);
}

const baseDir = path.dirname(configPath);

function resolveIcon(notificationIcon) {
  let finalPath;

  if (notificationIcon) {
    finalPath = path.resolve(baseDir, notificationIcon);
  } else if (config.defaultIcon) {
    finalPath = path.resolve(baseDir, config.defaultIcon);
  }

  if (finalPath && fs.existsSync(finalPath)) {
    return finalPath;
  }

  return undefined; 
}

function showNotification(item) {
  const iconPath = resolveIcon(item.icon);

  notifier.notify({
    title: item.title || "Notification",
    message: item.message || "",
    appID: APP_ID,
    timeout: 10,
    icon: iconPath
  });

  console.log(
    `[${new Date().toLocaleTimeString()}] Sent: ${item.title}`
  );
}

console.log("Notification service started...\n");

config.notifications.forEach((item) => {
  if (!item.intervalMinutes || item.intervalMinutes <= 0) {
    console.warn("Skipping invalid interval:", item.title);
    return;
  }

  const intervalMs = item.intervalMinutes * 60 * 1000;

  showNotification(item);

  setInterval(() => {
    showNotification(item);
  }, intervalMs);

  console.log(
    `Scheduled "${item.title}" every ${item.intervalMinutes} minutes`
  );
});