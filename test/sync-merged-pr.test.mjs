import test from "node:test";
import assert from "node:assert/strict";
import { buildTelegramMessage, extractTaskId } from "../scripts/sync-merged-pr.mjs";

test("extracts a task ID from the PR title", () => {
  assert.equal(extractTaskId("TSK-42 Add retry handling"), "TSK-42");
});

test("extracts a task ID from the PR body", () => {
  assert.equal(extractTaskId("Add retry handling", "Related to tsk-7"), "TSK-7");
});

test("returns undefined when no task ID is present", () => {
  assert.equal(extractTaskId("Update documentation"), undefined);
});

test("builds a concise Telegram handoff", () => {
  const message = buildTelegramMessage({
    taskId: "TSK-2",
    repository: "andres/project",
    prUrl: "https://github.com/andres/project/pull/12"
  });

  assert.match(message, /Ready for QA: TSK-2/);
  assert.match(message, /andres\/project/);
  assert.match(message, /pull\/12/);
});
