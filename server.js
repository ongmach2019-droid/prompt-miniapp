// server.js
import express from 'express';
import { Bot, InlineKeyboardBuilder } from 'node-telegram-bot-api';

// ១. កំណត់រចនាសម្ព័ន្ធ Bot និង Server
const TOKEN = process.env.BOT_TOKEN || '9202448869:AAHg8FBIyIBmwFGFk3QB_rpS24VAivm5ajM'; 
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://evil-monkeys-read.loca.lt'; // ឧទាហរណ៍ URL ពី ngrok, Vercel ឬ Render

const bot = new Bot(TOKEN);
const app = express();
app.use(express.json());

// ២. Telegram Bot Logic
bot.command('start', async (ctx) => {

    await ctx.reply( 'សូមស្វាគមន៍មកកាន់ Prompt VIP! ចុចប៊ូតុងខាងក្រោមដើម្បីចូលមើលបញ្ជី Prompt:', {
        reply_markup: {
            inline_keyboard: [[{
                text: "បើកកម្មវិធី 🚀",
                web_app: { url: WEBAPP_URL }
            }]]
        }
    });
});

// ៣. Backend API (សម្រាប់ទទួល Webhook ពី n8n ឬទូទាត់ប្រាក់)
app.post('/api/upgrade', async (req, res) => {
    const { userId } = req.body;
    // នៅទីនេះជាកន្លែងភ្ជាប់ជាមួយ PostgreSQL របស់អ្នកដើម្បី Update គណនីទៅជា VIP
    console.log(`User ${userId} បាន Upgrade ទៅកាន់ VIP!`);
    
    // ផ្ញើសារបញ្ជាក់ទៅកាន់អតិថិជន
    try {
        await bot.api.sendMessage({
            chat_id: userId,
            text: '🎉 អបអរសាទរ! គណនីរបស់អ្នកត្រូវបានតម្លើងទៅជា VIP រួចរាល់។ អ្នកអាចប្រើប្រាស់ Master Prompt ទាំងអស់បាន។'
        });
    } catch (err) {
        console.error('Error sending message via bot:', err.message);
    }
    res.json({ success: true, message: 'VIP Upgraded' });
});

// ៤. Frontend (Telegram Mini App UI)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="km">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Chet Panha VIP Bot - Mini App</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://telegram.org/js/telegram-web-app.js"></script>
            <style>
                body { background-color: #0f172a; color: white; font-family: 'Khmer OS Siemreap', sans-serif; }
            </style>
        </head>
        <body class="p-4">
            
            <!-- User Profile & Upgrade Section -->
            <div class="flex items-center justify-between bg-slate-800 p-4 rounded-xl mb-6 shadow-lg border border-slate-700">
                <div class="flex items-center gap-3">
                    <div id="userPhoto" class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xl shadow-inner">
                        U
                    </div>
                    <div>
                        <h2 id="userName" class="font-bold text-lg leading-tight">ឈ្មោះអ្នកប្រើ</h2>
                        <p id="userId" class="text-xs text-gray-400">ID: ...</p>
                    </div>
                </div>
                <button onclick="upgradeVIP()" class="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-lg font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center gap-1">
                    ⚡ Upgrade VIP
                </button>
            </div>

            <!-- Free Prompts Section -->
            <div class="mb-4 flex justify-between items-end">
                <h3 class="text-lg font-bold flex items-center gap-2">🎁 Master Prompt ឥតគិតថ្លៃ (Free)</h3>
                <a href="#" class="text-blue-400 text-sm">មើលទាំងអស់ ➔</a>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <!-- Card 1 -->
                <div class="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 pb-2">
                    <div class="bg-slate-700 h-28 flex items-center justify-center relative">
                        <span class="absolute top-1 right-1 bg-green-500 text-xs px-2 py-1 rounded font-bold">FREE</span>
                        <span class="text-gray-400">រូបភាព Thumbnail</span>
                    </div>
                    <div class="p-2">
                        <h4 class="font-bold text-sm truncate">ធ្វើវីដេអូ ជាងបង្កើតរបស់...</h4>
                        <p class="text-blue-400 text-xs mt-1">ឥតគិតថ្លៃ (Free)</p>
                    </div>
                </div>
                <!-- Card 2 -->
                <div class="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 pb-2">
                    <div class="bg-slate-700 h-28 flex items-center justify-center relative">
                        <span class="absolute top-1 right-1 bg-green-500 text-xs px-2 py-1 rounded font-bold">FREE</span>
                        <span class="text-gray-400">រូបភាព Thumbnail</span>
                    </div>
                    <div class="p-2">
                        <h4 class="font-bold text-sm truncate">ធ្វើវីដេអូ Ai ម៉ាក់ៗបង្រៀន...</h4>
                        <p class="text-blue-400 text-xs mt-1">ឥតគិតថ្លៃ (Free)</p>
                    </div>
                </div>
            </div>

            <!-- Bottom Navigation Bar (Mockup) -->
            <div class="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 text-xs text-gray-400">
                <div class="flex flex-col items-center text-blue-500"><span class="text-lg mb-1">🏠</span>ទំព័រដើម</div>
                <div class="flex flex-col items-center"><span class="text-lg mb-1">🎨</span>Prompts</div>
                <div class="flex flex-col items-center"><span class="text-lg mb-1">📚</span>វគ្គសិក្សា</div>
                <div class="flex flex-col items-center"><span class="text-lg mb-1">👤</span>Profile</div>
            </div>

            <script>
                // ភ្ជាប់ជាមួយ Telegram Web App
                const tg = window.Telegram.WebApp;
                tg.expand(); // បើកពេញអេក្រង់

                // ទាញយកព័ត៌មានអ្នកប្រើប្រាស់
                const user = tg.initDataUnsafe?.user;
                if (user) {
                    document.getElementById('userName').innerText = user.first_name + (user.last_name ? ' ' + user.last_name : '');
                    document.getElementById('userId').innerText = 'ID: ' + user.id;
                    document.getElementById('userPhoto').innerText = user.first_name.charAt(0);
                }

                // អនុវត្តមុខងារ Upgrade
                function upgradeVIP() {
                    tg.showConfirm("តើអ្នកចង់ Upgrade ទៅកាន់ VIP មែនទេ?", function(agreed) {
                        if (agreed && user) {
                            // ផ្ញើសំណើទៅកាន់ Backend របស់អ្នក
                            fetch('/api/upgrade', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: user.id })
                            })
                            .then(res => res.json())
                            .then(data => {
                                tg.showAlert("ស្នើសុំជោគជ័យ! សូមឆែកមើលសារក្នុង Telegram របស់អ្នក។");
                                tg.close();
                            });
                        }
                    });
                }
            </script>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log("Server is running on port " + PORT);
    bot.startPolling().catch(err => {
        console.error("Bot polling error:", err);
    });
    console.log("Telegram bot polling started.");
});