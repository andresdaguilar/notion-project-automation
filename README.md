# Notion Project Automation

This repository connects software delivery activity with a Notion project workspace and Telegram notifications.

When a pull request is merged, the GitHub Action:

1. Looks for a Notion task ID such as `TSK-12` in the PR title or body.
2. Finds the matching task in the Notion Tasks & Milestones database.
3. Adds the pull request URL and changes the task to `Ready for QA`.
4. Sends a short Telegram notification when a bot and chat are configured.

## Purpose

The goal is to keep project status close to the actual delivery event. The team does not need to remember to update the same status in two places, and the project lead still has an auditable link between the deliverable, the PR, and the QA handoff.

## Repository secrets

- `NOTION_TOKEN`: Notion integration token.
- `NOTION_TASKS_DATA_SOURCE_ID`: Tasks & Milestones data source ID.
- `TELEGRAM_BOT_TOKEN`: optional Telegram bot token.
- `TELEGRAM_CHAT_ID`: optional destination chat ID.

The Notion integration needs access to the Tasks & Milestones database.

## Usage in a PR

Include a task ID in the title or description:

```text
TSK-12 Add payment-terminal retry handling
```

The workflow runs only after the pull request is merged. This repository contains no production credentials.

## Local demonstration

Run the complete flow without calling Notion or Telegram:

```bash
npm run demo
```

The dry run validates the task ID and prints the Notion update and Telegram message that would be sent.

Run the automated tests with:

```bash
npm test
```

## Operating controls

- No update occurs when the PR does not contain a `TSK-n` identifier.
- The integration fails when a task ID is missing or duplicated in Notion.
- Telegram is optional; Notion synchronization can run independently.
- All credentials are stored as GitHub repository secrets.
- The PR URL creates an audit trail between delivery activity and the project record.
