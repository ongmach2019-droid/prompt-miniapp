// server.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Bot, InlineKeyboardBuilder, InputFile } from 'node-telegram-bot-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ១. កំណត់រចនាសម្ព័ន្ធ Bot, Server និង Admin
const TOKEN = process.env.BOT_TOKEN || '9202448869:AAHg8FBIyIBmwFGFk3QB_rpS24VAivm5ajM'; 
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://prompt-miniapp.onrender.com';
const ADMIN_ID = process.env.ADMIN_ID || '880554075'; // Telegram ID របស់ Admin (Ong Mach)

const bot = new Bot(TOKEN);
const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Persistent storage for VIP users
const VIP_FILE = path.join(__dirname, 'vip_users.json');
function loadVipUsers() {
    try {
        if (fs.existsSync(VIP_FILE)) {
            const data = JSON.parse(fs.readFileSync(VIP_FILE, 'utf8'));
            return new Set(data);
        }
    } catch (e) {
        console.error('Error loading vip users:', e.message);
    }
    return new Set();
}
function saveVipUsers(set) {
    try {
        fs.writeFileSync(VIP_FILE, JSON.stringify(Array.from(set)), 'utf8');
    } catch (e) {
        console.error('Error saving vip users:', e.message);
    }
}
const vipUsers = loadVipUsers();

// Persistent storage for Orders
const ORDERS_FILE = path.join(__dirname, 'user_orders.json');
function loadOrders() {
    try {
        if (fs.existsSync(ORDERS_FILE)) {
            const data = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
            return new Map(Object.entries(data));
        }
    } catch (e) {
        console.error('Error loading orders:', e.message);
    }
    return new Map();
}
function saveOrders(map) {
    try {
        const obj = Object.fromEntries(map);
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(obj), 'utf8');
    } catch (e) {
        console.error('Error saving orders:', e.message);
    }
}
const userOrders = loadOrders();

// ២. Telegram Bot Logic

// Command: /start
bot.command('start', async (ctx) => {
    const userFirstName = ctx.from?.first_name || 'មិត្តភក្តិ';
    await ctx.reply(`សូមស្វាគមន៍មកកាន់ Chet Panha VIP Bot, ${userFirstName}! ចុចប៊ូតុងខាងក្រោមដើម្បីចូលមើល Master Prompts និងវគ្គសិក្សាទាំងអស់៖`, {
        reply_markup: new InlineKeyboardBuilder()
            .webApp("បើកកម្មវិធី 🚀", WEBAPP_URL)
            .build()
    });
});

// Admin Approval & Rejection Handling
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery?.data;
    if (!data) return;

    if (data.startsWith('approve_')) {
        const parts = data.split('_');
        const targetUserId = parts[1];
        const itemTitle = parts[2] ? decodeURIComponent(parts[2]) : 'Master Prompts AI Video ($2.00)';

        // Unlock user
        vipUsers.add(String(targetUserId));
        saveVipUsers(vipUsers);

        // Record order
        const currentOrders = userOrders.get(String(targetUserId)) || [];
        const newOrder = {
            id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
            title: itemTitle,
            amount: '$2.00',
            date: new Date().toLocaleDateString('km-KH', { year: 'numeric', month: 'short', day: 'numeric' }),
            status: 'ជោគជ័យ (Approved)'
        };
        currentOrders.unshift(newOrder);
        userOrders.set(String(targetUserId), currentOrders);
        saveOrders(userOrders);

        // Update Admin message
        try {
            await ctx.answerCallbackQuery({ text: '✅ បានអនុម័ត និង Unlock ជូនអតិថិជនរួចរាល់!' });
            const origCaption = ctx.callbackQuery.message?.caption || '';
            await ctx.editMessageCaption({
                caption: origCaption + '\n\n━━━━━━━━━━━━━━━━\n✅ [បានអនុម័ត (APPROVED) ដោយ Admin]\nអតិថិជនត្រូវបាន Unlock រួចរាល់!'
            });
        } catch (e) {
            console.error('Error editing admin caption:', e.message);
        }

        // Notify customer directly in Telegram
        try {
            await bot.api.sendMessage({
                chat_id: targetUserId,
                text: `🎉 អបអរសាទរ! វិក្កយបត្របង់ប្រាក់ $2.00 របស់អ្នកត្រូវបាន Admin ផ្ទៀងផ្ទាត់ និងអនុម័តត្រឹមត្រូវ។\n\n✨ "${itemTitle}" ត្រូវបាន Unlock រួចរាល់ក្នុង Mini App របស់អ្នក! សូមចុចលើប៊ូតុងខាងក្រោមដើម្បីចូលទៅមើល និង Copy យកទៅប្រើប្រាស់ភ្លាមៗ៖`,
                reply_markup: {
                    inline_keyboard: [[{
                        text: "បើកកម្មវិធីដើម្បី Copy Prompt 🚀",
                        web_app: { url: WEBAPP_URL }
                    }]]
                }
            });
        } catch (e) {
            console.error('Error notifying user:', e.message);
        }
    } else if (data.startsWith('reject_')) {
        const parts = data.split('_');
        const targetUserId = parts[1];

        // Update Admin message
        try {
            await ctx.answerCallbackQuery({ text: '❌ បានបដិសេធសំណើ!' });
            const origCaption = ctx.callbackQuery.message?.caption || '';
            await ctx.editMessageCaption({
                caption: origCaption + '\n\n━━━━━━━━━━━━━━━━\n❌ [បានបដិសេធ (REJECTED) ដោយ Admin]\nមិនមានប្រាក់ចូលក្នុងគណនី ABA ឡើយ។'
            });
        } catch (e) {
            console.error('Error editing admin caption:', e.message);
        }

        // Notify customer of rejection
        try {
            await bot.api.sendMessage({
                chat_id: targetUserId,
                text: '⚠️ សុំទោស! វិក្កយបត្ររបស់អ្នកមិនត្រូវបានអនុម័តឡើយ ដោយសារ Admin បានពិនិត្យក្នុងគណនី ABA មិនទាន់ឃើញមានប្រតិបត្តិការប្រាក់ $2.00 ចូលឡើយ។\n\nប្រសិនបើអ្នកបានផ្ទេរប្រាក់រួចរាល់ពិតមែន សូមទាក់ទងមកកាន់ Admin @ongmach2019 ដើម្បីដោះស្រាយជូន។'
            });
        } catch (e) {
            console.error('Error sending rejection message:', e.message);
        }
    }
});

// Handling receipt photo sent directly into Telegram Chat
bot.on('message', async (ctx) => {
    const msg = ctx.message;
    if (!msg || !msg.photo || msg.photo.length === 0) return;

    const senderId = msg.from.id;
    const senderName = (msg.from.first_name || '') + (msg.from.last_name ? ' ' + msg.from.last_name : '');
    const largestPhoto = msg.photo[msg.photo.length - 1];

    try {
        // Forward to Admin with Approve/Reject buttons
        await bot.api.sendPhoto({
            chat_id: ADMIN_ID,
            photo: largestPhoto.file_id,
            caption: `🔔 មានសំណើទូទាត់ប្រាក់ថ្មី (ផ្ញើបុងតាម Chat)!\n━━━━━━━━━━━━━━━━\n👤 អតិថិជន: ${senderName}\n🆔 Telegram ID: ${senderId}\n📦 ទំនិញ: Master Prompts AI Video ($2.00)\n💰 ចំនួនទឹកប្រាក់: $2.00 (8,000៛)\n⏰ ម៉ោង: ${new Date().toLocaleTimeString('km-KH')}\n━━━━━━━━━━━━━━━━\nសូមពិនិត្យមើលក្នុង App ABA របស់អ្នក។ ប្រសិនបើបានទទួលប្រាក់ $2.00 ពិតមែន សូមចុច [អនុម័ត]៖`,
            reply_markup: {
                inline_keyboard: [[
                    { text: '✅ អនុម័ត (Approve)', callback_data: `approve_${senderId}_Master%20Prompts` },
                    { text: '❌ បដិសេធ (Reject)', callback_data: `reject_${senderId}` }
                ]]
            }
        });

        // Reply to customer
        await ctx.reply('📥 វិក្កយបត្ររបស់អ្នកត្រូវបានបញ្ជូនទៅកាន់ Admin ពិនិត្យរួចរាល់ហើយ! សូមរង់ចាំ Admin ផ្ទៀងផ្ទាត់ក្នុង App ABA ប្រហែល ១-៣ នាទី។ បន្ទាប់ពី Admin អនុម័តរួច Bot នឹងផ្ញើសារប្រាប់ និង Unlock ជូនភ្លាមៗ!');
    } catch (err) {
        console.error('Error forwarding photo from chat to admin:', err.message);
    }
});

// ៣. Backend API

// Check VIP & Orders Status
app.get('/api/status/:userId', (req, res) => {
    const { userId } = req.params;
    const isVip = vipUsers.has(String(userId));
    const orders = userOrders.get(String(userId)) || [];
    res.json({ isVip, orders });
});

// Submit Receipt from Mini App
app.post('/api/submit-receipt', async (req, res) => {
    const { userId, userName, itemTitle, amount, imageBase64 } = req.body;

    if (!userId || !imageBase64) {
        return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    try {
        // Convert Base64 to Buffer
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(imageBase64, 'base64');
        const inputFile = new InputFile(buffer, { filename: 'receipt.jpg', contentType: 'image/jpeg' });

        const encodedItem = encodeURIComponent(itemTitle || 'Master Prompts AI Video');

        // Send photo to Admin with Approve / Reject buttons
        await bot.api.sendPhoto({
            chat_id: ADMIN_ID,
            photo: inputFile,
            caption: `🔔 មានសំណើទូទាត់ប្រាក់ថ្មី (ពី Mini App)!\n━━━━━━━━━━━━━━━━\n👤 អតិថិជន: ${userName || 'Telegram User'}\n🆔 Telegram ID: ${userId}\n📦 ទំនិញ: ${itemTitle || 'Master Prompts AI Video'}\n💰 ចំនួនទឹកប្រាក់: ${amount || '$2.00'}\n⏰ ម៉ោង: ${new Date().toLocaleTimeString('km-KH')}\n━━━━━━━━━━━━━━━━\nសូមពិនិត្យមើលក្នុង App ABA របស់អ្នក។ ប្រសិនបើបានទទួលប្រាក់ $2.00 ពិតមែន សូមចុច [អនុម័ត]៖`,
            reply_markup: {
                inline_keyboard: [[
                    { text: '✅ អនុម័ត (Approve)', callback_data: `approve_${userId}_${encodedItem}` },
                    { text: '❌ បដិសេធ (Reject)', callback_data: `reject_${userId}` }
                ]]
            }
        });

        console.log(`Receipt from user ${userId} (${userName}) sent to Admin ${ADMIN_ID} successfully.`);
        res.json({ success: true, message: 'Receipt submitted to admin successfully' });
    } catch (err) {
        console.error('Error forwarding receipt to admin:', err.message);
        res.status(500).json({ success: false, message: 'Failed to deliver receipt to admin' });
    }
});

// Direct Upgrade (Backup/Admin override)
app.post('/api/upgrade', async (req, res) => {
    const { userId, itemTitle, amount } = req.body;
    if (userId) {
        vipUsers.add(String(userId));
        saveVipUsers(vipUsers);

        const currentOrders = userOrders.get(String(userId)) || [];
        const newOrder = {
            id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
            title: itemTitle || 'Master Prompts សម្រាប់បង្កើតវីដេអូ AI',
            amount: amount || '$2.00',
            date: new Date().toLocaleDateString('km-KH', { year: 'numeric', month: 'short', day: 'numeric' }),
            status: 'ជោគជ័យ (Completed)'
        };
        currentOrders.unshift(newOrder);
        userOrders.set(String(userId), currentOrders);
        saveOrders(userOrders);
    }
    res.json({ success: true, isVip: true, message: 'VIP Unlocked' });
});

// ៤. Frontend (Telegram Mini App UI)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log("Server is running on port " + PORT);
    bot.startPolling().catch(err => {
        console.error("Bot polling error:", err);
    });
    // Set persistent menu button
    bot.api.setChatMenuButton({
        menu_button: {
            type: 'web_app',
            text: 'បើកកម្មវិធី 🚀',
            web_app: { url: WEBAPP_URL }
        }
    }).catch(err => console.error("Menu button error:", err.message));
    console.log("Telegram bot polling started. Admin ID: " + ADMIN_ID);
});
