export function extractTaskId(title, body = "") {
  return `${title}\n${body}`.match(/\bTSK-\d+\b/i)?.[0]?.toUpperCase();
}

export function buildTelegramMessage({ taskId, repository, prUrl }) {
  return [
    `Ready for QA: ${taskId}`,
    `Repository: ${repository}`,
    `Pull request: ${prUrl}`
  ].join("\n");
}

export async function main() {
const dryRun = process.env.DRY_RUN === "true";
const required = dryRun
  ? ["PR_TITLE", "PR_URL"]
  : ["NOTION_TOKEN", "NOTION_TASKS_DATA_SOURCE_ID", "PR_TITLE", "PR_URL"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const taskId = extractTaskId(process.env.PR_TITLE, process.env.PR_BODY);

if (!taskId) {
  console.log("No Notion task ID found; nothing to sync.");
  process.exit(0);
}

const notification = buildTelegramMessage({
  taskId,
  repository: process.env.PR_REPOSITORY || "unknown",
  prUrl: process.env.PR_URL
});

if (dryRun) {
  console.log("DRY RUN - no external systems were changed.");
  console.log(`Notion task: ${taskId}`);
  console.log("New status: Ready for QA");
  console.log(`GitHub URL: ${process.env.PR_URL}`);
  console.log(`Telegram message:\n${notification}`);
  process.exit(0);
}

const notionHeaders = {
  Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28"
};

const queryResponse = await fetch(
  `https://api.notion.com/v1/databases/${process.env.NOTION_TASKS_DATA_SOURCE_ID}/query`,
  {
    method: "POST",
    headers: notionHeaders,
    body: JSON.stringify({
      filter: {
        property: "Task ID",
        unique_id: { equals: Number(taskId.split("-")[1]) }
      }
    })
  }
);

if (!queryResponse.ok) {
  throw new Error(`Notion query failed: ${queryResponse.status} ${await queryResponse.text()}`);
}

const { results } = await queryResponse.json();
if (results.length !== 1) {
  throw new Error(`Expected one task for ${taskId}, found ${results.length}.`);
}

const updateResponse = await fetch(`https://api.notion.com/v1/pages/${results[0].id}`, {
  method: "PATCH",
  headers: notionHeaders,
  body: JSON.stringify({
    properties: {
      Status: { select: { name: "Ready for QA" } },
      "GitHub URL": { url: process.env.PR_URL }
    }
  })
});

if (!updateResponse.ok) {
  throw new Error(`Notion update failed: ${updateResponse.status} ${await updateResponse.text()}`);
}

if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  const telegramResponse = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: notification,
        disable_web_page_preview: true
    })
    }
  );

  if (!telegramResponse.ok) {
    throw new Error(`Telegram notification failed: ${telegramResponse.status}`);
  }
}

console.log(`${taskId} updated successfully.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
