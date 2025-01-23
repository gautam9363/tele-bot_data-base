# tele-bot_data-base
This bot serves as a temporary content management system with the following capabilities:

# Telegram Database Bot

A Telegram bot that allows users to share content which automatically gets deleted after 1 hour for privacy purposes.

## Features

- Share content through the bot
- Automatic deletion of shared content after 1 hour
- Privacy protection for shared content
- Notification messages for users
- Error handling and logging

## Installation

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd bot
    ```

2. Create a `.env` file in the root directory and add your Telegram bot token and channel ID:
    ```
    BOT_TOKEN=your_telegram_bot_token
    CHANNEL_ID=your_channel_id
    ```

3. Install dependencies:
    ```bash
    npm install
    ```

## Dependencies

- `telegraf`: ^4.16.3
- `axios`: ^1.7.9
- `dotenv`: ^16.4.7
