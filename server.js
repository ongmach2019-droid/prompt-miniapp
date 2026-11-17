// server.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Bot, InlineKeyboardBuilder } from 'node-telegram-bot-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ១. កំណត់រចនាសម្ព័ន្ធ Bot និង Server
const TOKEN = process.env.BOT_TOKEN || '9202448869:AAHg8FBIyIBmwFGFk3QB_rpS24VAivm5ajM'; 
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://prompt-miniapp.onrender.com';

const bot = new Bot(TOKEN);
const app = express();
app.use(express.json());
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
bot.command('start', async (ctx) => {
    const userFirstName = ctx.from?.first_name || 'មិត្តភក្តិ';
    await ctx.reply(`សូមស្វាគមន៍មកកាន់ Chet Panha VIP Bot, ${userFirstName}! ចុចប៊ូតុងខាងក្រោមដើម្បីចូលមើល Master Prompts និងវគ្គសិក្សាទាំងអស់៖`, {
        reply_markup: new InlineKeyboardBuilder()
            .webApp("បើកកម្មវិធី 🚀", WEBAPP_URL)
            .build()
    });
});

// ៣. Backend API
app.get('/api/status/:userId', (req, res) => {
    const { userId } = req.params;
    const isVip = vipUsers.has(String(userId));
    const orders = userOrders.get(String(userId)) || [];
    res.json({ isVip, orders });
});

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

        console.log(`User ${userId} បាន Unlock: ${newOrder.title}`);
        try {
            await bot.api.sendMessage({
                chat_id: userId,
                text: `🎉 អបអរសាទរ! ការទូទាត់សម្រាប់ "${newOrder.title}" (${newOrder.amount}) ត្រូវបានបញ្ជាក់ជោគជ័យ។ Master Prompt ត្រូវបាន Unlock រួចរាល់ក្នុង Mini App របស់អ្នក! សូមចូលទៅកាន់ Mini App ដើម្បីមើល និង Copy យកទៅប្រើប្រាស់បានភ្លាមៗ!`
            });
        } catch (err) {
            console.error('Bot sendMessage error:', err.message);
        }
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
    console.log("Telegram bot polling started.");
});
