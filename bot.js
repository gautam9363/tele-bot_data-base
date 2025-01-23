const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const PRIVATE_CHANNEL_ID = process.env.PRIVATE_CHANNEL_ID;
const PUBLIC_CHANNEL_ID = process.env.PUBLIC_CHANNEL_ID;
const CHANNEL_USERNAME = 'code_nood';
const bot = new Telegraf(BOT_TOKEN);

// Debug logging with improved error handling
console.log('Bot initialized with channels:', {
    private: PRIVATE_CHANNEL_ID,
    public: PUBLIC_CHANNEL_ID
});

// Verify bot has access to channels
bot.telegram.getChat(PUBLIC_CHANNEL_ID)
    .then(() => console.log('Public channel access verified'))
    .catch(err => console.error('Public channel access failed:', err));

bot.telegram.getChat(PRIVATE_CHANNEL_ID)
    .then(() => console.log('Private channel access verified'))
    .catch(err => console.error('Private channel access failed:', err));

// Check channel membership with improved debugging
async function checkMembership(ctx, userId) {
    try {
        console.log('Checking membership for user:', userId);
        const member = await ctx.telegram.getChatMember(PUBLIC_CHANNEL_ID, userId);
        console.log('Member status:', member.status);
        return ['creator', 'administrator', 'member'].includes(member.status);
    } catch (error) {
        console.error('Membership check error:', {
            userId,
            error: error.message,
            channelId: PUBLIC_CHANNEL_ID
        });
        return false;
    }
}

// Handle /start command with better error handling
bot.start(async (ctx) => {
    try {
        const userId = ctx.from.id;
        const messageId = ctx.startPayload;

        console.log('Processing start command:', {
            userId,
            messageId,
            username: ctx.from.username
        });

        // Check membership first
        const isMember = await checkMembership(ctx, userId);
        console.log('Membership status:', { userId, isMember });

        if (!isMember) {
            return ctx.reply(
                '❌ Access Denied!\n\n' +
                '1️⃣ You must join our channel first\n' +
                '2️⃣ Click below to join\n' +
                '3️⃣ Return here and try again',
                Markup.inlineKeyboard([
                    [Markup.button.url('🔔 Join Channel', `https://t.me/${CHANNEL_USERNAME}`)]
                ])
            );
        }

        // Validate message ID
        if (!messageId) {
            return ctx.reply('❌ Invalid access link');
        }

        // Try to send content
        await ctx.telegram.copyMessage(
            userId,
            PRIVATE_CHANNEL_ID,
            parseInt(messageId),
            {
                protect_content: true
            }
        );

    } catch (error) {
        console.error('Start command failed:', {
            userId: ctx.from.id,
            error: error.message,
            stack: error.stack
        });
        
        if (error.description?.includes('bot was blocked')) {
            await ctx.reply('❌ Please unblock the bot and try again');
        } else if (error.description?.includes('message not found')) {
            await ctx.reply('❌ Content is no longer available');
        } else {
            await ctx.reply('❌ Please join channel and try again');
        }
    }
});

// Handle channel posts
bot.on('channel_post', async (ctx) => {
    if (ctx.channelPost.chat.id.toString() === PRIVATE_CHANNEL_ID) {
        try {
            if (ctx.channelPost.video || ctx.channelPost.photo) {
                const messageId = ctx.channelPost.message_id;
                const botUsername = ctx.botInfo.username;
                const shareLink = `https://t.me/${botUsername}?start=${messageId}`;

                await ctx.telegram.sendMessage(
                    PUBLIC_CHANNEL_ID,
                    `🔒 Protected Content\n\n` +
                    `▫️ No Screenshots\n` +
                    `▫️ No Downloads\n` +
                    `▫️ No Forwarding\n\n` +
                    `🔗 Access: ${shareLink}\n\n⚠️ Note: This video and message will be automatically deleted after 1 hour.`,
                    { 
                        protect_content: true,
                        disable_web_page_preview: true
                    }
                ).then(sentMsg => {
                    // Send notification message
                    ctx.reply('⚠️ Sorry, the video will be deleted after 1 hour for privacy reasons.')
                        .then(notificationMsg => {
                            // Delete notification after 1 hour
                            setTimeout(async () => {
                                try {
                                    await bot.telegram.deleteMessage(ctx.chat.id, notificationMsg.message_id);
                                } catch (error) {
                                    console.error('Error deleting notification:', error);
                                }
                            }, 3600000);
                        });

                    // Delete share link message after 1 hour
                    setTimeout(async () => {
                        try {
                            await bot.telegram.deleteMessage(ctx.chat.id, sentMsg.message_id);
                            console.log('Deleted share link message');
                        } catch (error) {
                            console.error('Error deleting share link message:', error);
                        }
                    }, 3600000);

                    // Delete video message after 1 hour
                    if (ctx.message && ctx.message.message_id) {
                        setTimeout(async () => {
                            try {
                                await bot.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id);
                                console.log('Deleted video message');
                            } catch (error) {
                                console.error('Error deleting video message:', error);
                            }
                        }, 3600000);
                    }
                });
            }
        } catch (error) {
            console.error('Channel post error:', error);
        }
    }
});

// Launch bot with error handling
bot.launch()
    .then(() => console.log('Bot started successfully'))
    .catch(err => console.error('Failed to launch bot:', err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
