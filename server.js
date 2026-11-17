// server.js
import express from 'express';
import { Bot, InlineKeyboardBuilder } from 'node-telegram-bot-api';

// ១. កំណត់រចនាសម្ព័ន្ធ Bot និង Server
const TOKEN = process.env.BOT_TOKEN || '9202448869:AAHg8FBIyIBmwFGFk3QB_rpS24VAivm5ajM'; 
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://prompt-miniapp.onrender.com';

const bot = new Bot(TOKEN);
const app = express();
app.use(express.json());
app.use(express.static('public'));

// In-memory database for demo/session tracking
const vipUsers = new Set();
const userOrders = new Map(); // userId -> array of orders

// ២. Telegram Bot Logic
bot.command('start', async (ctx) => {
    await ctx.reply('សូមស្វាគមន៍មកកាន់ Chet Panha VIP Bot! ចុចប៊ូតុងខាងក្រោមដើម្បីចូលមើល Master Prompts និងវគ្គសិក្សាទាំងអស់៖', {
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
        const currentOrders = userOrders.get(String(userId)) || [];
        const newOrder = {
            id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
            title: itemTitle || 'VIP Master Prompts Package',
            amount: amount || '$2.00',
            date: new Date().toLocaleDateString('km-KH', { year: 'numeric', month: 'short', day: 'numeric' }),
            status: 'ជោគជ័យ (Completed)'
        };
        currentOrders.unshift(newOrder);
        userOrders.set(String(userId), currentOrders);

        console.log(`User ${userId} បាន Unlock: ${newOrder.title}`);
        try {
            await bot.api.sendMessage({
                chat_id: userId,
                text: `🎉 អបអរសាទរ! ការទូទាត់សម្រាប់ "${newOrder.title}" (${newOrder.amount}) ត្រូវបានបញ្ជាក់ជោគជ័យ។ អ្នកអាចចូលទៅកាន់ Mini App ដើម្បីប្រើប្រាស់បានភ្លាមៗ!`
            });
        } catch (err) {
            console.error('Bot sendMessage error:', err.message);
        }
    }
    res.json({ success: true, isVip: true, message: 'Unlocked successfully' });
});

// ៤. Frontend (Telegram Mini App UI with 5 Working Tabs)
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Chet Panha VIP Bot - Mini App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            background-color: #0c111d;
            color: #f1f5f9;
            font-family: 'Kantumruy Pro', sans-serif;
            -webkit-tap-highlight-color: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 4px;
        }
        .active-tab {
            color: #38bdf8 !important;
        }
        .active-tab-box {
            border: 1px solid rgba(56, 189, 248, 0.4) !important;
            background: rgba(56, 189, 248, 0.08) !important;
            border-radius: 12px;
        }
    </style>
</head>
<body class="p-3 pb-24 max-w-md mx-auto min-h-screen flex flex-col justify-between">

    <!-- Toast Alert -->
    <div id="toast" class="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl transition-all duration-300 opacity-0 pointer-events-none flex items-center gap-2">
        <span>✅</span>
        <span id="toastMsg">បានចម្លងដោយជោគជ័យ!</span>
    </div>

    <!-- MAIN APP WRAPPER -->
    <div class="w-full">
        
        <!-- Header / User Profile Bar -->
        <div class="flex items-center justify-between bg-slate-900/95 border border-slate-800 p-3.5 rounded-2xl mb-4 shadow-lg">
            <div class="flex items-center gap-3">
                <div id="userAvatarContainer" class="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-md overflow-hidden shrink-0 border border-blue-400/30">
                    <span id="userInitial">U</span>
                </div>
                <div>
                    <h2 id="userName" class="font-bold text-sm text-white leading-tight">Ong Mach</h2>
                    <p id="userId" class="text-[11px] text-slate-400 font-mono mt-0.5">ID: 880554075</p>
                </div>
            </div>
            <button id="upgradeHeaderBtn" onclick="openPaymentModal('VIP All Access', '$2.00')" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0">
                <span>⚡</span> Upgrade VIP
            </button>
        </div>

        <!-- ==================== TAB 1: 🏠 ទំព័រដើម (HOME) ==================== -->
        <div id="tabContentHome" class="tab-content space-y-4">
            
            <!-- Hero Banner -->
            <div class="relative bg-gradient-to-r from-blue-900/80 via-indigo-900/70 to-slate-900 p-4 rounded-2xl border border-blue-500/30 shadow-xl overflow-hidden">
                <div class="relative z-10">
                    <span class="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Master VIP 2026
                    </span>
                    <h3 class="font-bold text-base text-white mt-2 leading-snug">
                        ស្វាគមន៍មកកាន់ Chet Panha VIP Bot!
                    </h3>
                    <p class="text-xs text-slate-300 mt-1 leading-relaxed">
                        ប្រភព Master Prompts និងវគ្គសិក្សា AI លំដាប់ VIP សម្រាប់បង្កើនចំណូលលើ TikTok, YouTube និង DistroKid។
                    </p>
                    <div class="flex gap-2 mt-3">
                        <button onclick="switchTabNav('prompts')" class="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 px-3 rounded-xl shadow active:scale-95 transition-all">
                            🎨 មើល Prompts
                        </button>
                        <button onclick="switchTabNav('courses')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 active:scale-95 transition-all">
                            📚 វគ្គសិក្សា
                        </button>
                    </div>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-3 gap-2.5 text-center">
                <div class="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                    <div class="text-lg font-bold text-blue-400">148+</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">Master Prompts</div>
                </div>
                <div class="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                    <div class="text-lg font-bold text-amber-400">2+</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">វគ្គសិក្សា AI</div>
                </div>
                <div class="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                    <div class="text-lg font-bold text-emerald-400">24/7</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">គាំទ្របច្ចេកទេស</div>
                </div>
            </div>

            <!-- Featured VIP Prompt Preview -->
            <div class="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3.5 shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <span>🔥</span> Prompt កំពុងពេញនិយម
                    </span>
                    <span class="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        $2.00
                    </span>
                </div>
                <h4 class="font-bold text-sm text-white">Master Prompts សម្រាប់បង្កើតវីដេអូ AI</h4>
                <p class="text-xs text-slate-400 mt-1 line-clamp-2">
                    Story to Full Video Package សម្រាប់ ChatGPT, Claude, Sora, Kling, Veo និង Runway។
                </p>
                <div class="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center">
                    <span class="text-[11px] text-slate-400">Unlock មើល និង Copy ភ្លាមៗ</span>
                    <button onclick="handlePromptAction('vip-video')" class="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1">
                        <span>👁️</span> មើល Prompt
                    </button>
                </div>
            </div>
        </div>

        <!-- ==================== TAB 2: 🎨 PROMPTS ==================== -->
        <div id="tabContentPrompts" class="tab-content hidden space-y-3">
            
            <!-- Search Bar -->
            <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">🔍</span>
                <input type="text" id="promptSearchInput" oninput="filterPrompts()" placeholder="ស្វែងរក Master Prompt..." class="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors">
            </div>

            <!-- Filter Categories -->
            <div class="flex gap-2 text-xs overflow-x-auto pb-1 custom-scrollbar">
                <button onclick="setPromptFilter('all')" id="filterBtnAll" class="prompt-filter-btn px-3 py-1.5 rounded-xl font-bold bg-blue-600 text-white shrink-0 active:scale-95 transition-all">
                    🔥 ទាំងអស់ (148)
                </button>
                <button onclick="setPromptFilter('free')" id="filterBtnFree" class="prompt-filter-btn px-3 py-1.5 rounded-xl font-semibold bg-slate-800 text-slate-300 hover:text-white shrink-0 active:scale-95 transition-all">
                    🎁 ឥតគិតថ្លៃ (Free)
                </button>
                <button onclick="setPromptFilter('vip')" id="filterBtnVip" class="prompt-filter-btn px-3 py-1.5 rounded-xl font-semibold bg-slate-800 text-slate-300 hover:text-white shrink-0 active:scale-95 transition-all">
                    👑 VIP
                </button>
            </div>

            <!-- Prompts List -->
            <div id="promptsListContainer" class="space-y-2.5">

                <!-- Prompt 1: Video Master Package ($2.00) -->
                <div class="prompt-item vip-item bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-3 rounded-2xl flex items-center gap-3 transition-all" data-title="master prompts ai video veao kling sora">
                    <div class="w-20 h-16 rounded-xl bg-gradient-to-br from-purple-700 to-indigo-900 flex items-center justify-center text-2xl shrink-0 relative overflow-hidden">
                        <span class="absolute top-1 left-1 bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1 rounded">VIP</span>
                        🎬
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-xs text-white truncate flex items-center gap-1">
                            Master Prompts បង្កើតវីដេអូ AI 🔒
                        </h4>
                        <p class="text-[11px] text-slate-400 truncate mt-0.5">Prompt 1 ប្លង់រឿង + Prompt 2 Sora/Veo...</p>
                        <div class="flex items-center justify-between mt-1.5">
                            <span class="text-emerald-400 text-xs font-bold">$2.00</span>
                            <button onclick="handlePromptAction('vip-video')" class="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition-all">
                                <span>👁️</span> មើល
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Prompt 2: Claude AI Video ($2.00) -->
                <div class="prompt-item vip-item bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-3 rounded-2xl flex items-center gap-3 transition-all" data-title="claude ai វីដេអូ">
                    <div class="w-20 h-16 rounded-xl bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center text-2xl shrink-0 relative overflow-hidden">
                        <span class="absolute top-1 left-1 bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1 rounded">VIP</span>
                        🤖
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-xs text-white truncate flex items-center gap-1">
                            ប្រើ Claude AI បង្កើតវីដេអូ 🔒
                        </h4>
                        <p class="text-[11px] text-slate-400 truncate mt-0.5">ខ្លឹមសារត្រូវបានចាក់សោរ (ចុចមើល)...</p>
                        <div class="flex items-center justify-between mt-1.5">
                            <span class="text-emerald-400 text-xs font-bold">$2.00</span>
                            <button onclick="handlePromptAction('vip-claude')" class="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition-all">
                                <span>👁️</span> មើល
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Prompt 3: Voice Cartoon ($1.00) -->
                <div class="prompt-item vip-item bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-3 rounded-2xl flex items-center gap-3 transition-all" data-title="របៀបបង្កើតសំឡេង តុក្កតា cartoon voice">
                    <div class="w-20 h-16 rounded-xl bg-gradient-to-br from-pink-600 to-rose-900 flex items-center justify-center text-2xl shrink-0 relative overflow-hidden">
                        <span class="absolute top-1 left-1 bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1 rounded">VIP</span>
                        🎙️
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-xs text-white truncate flex items-center gap-1">
                            របៀបបង្កើតសំឡេង តុក្កតា 🔒
                        </h4>
                        <p class="text-[11px] text-slate-400 truncate mt-0.5">ខ្លឹមសារត្រូវបានចាក់សោរ (ចុចមើល)...</p>
                        <div class="flex items-center justify-between mt-1.5">
                            <span class="text-emerald-400 text-xs font-bold">$1.00</span>
                            <button onclick="handlePromptAction('vip-voice')" class="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition-all">
                                <span>👁️</span> មើល
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Prompt 4: Free Craftsman -->
                <div class="prompt-item free-item bg-slate-900 border border-slate-800 hover:border-blue-500/40 p-3 rounded-2xl flex items-center gap-3 transition-all" data-title="ធ្វើវីដេអូ ជាងបង្កើតរបស់ craftsman diy">
                    <div class="w-20 h-16 rounded-xl bg-gradient-to-br from-blue-700 to-cyan-900 flex items-center justify-center text-2xl shrink-0 relative overflow-hidden">
                        <span class="absolute top-1 left-1 bg-emerald-400 text-slate-950 text-[9px] font-extrabold px-1 rounded">FREE</span>
                        🛠️
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-xs text-white truncate">
                            ធ្វើវីដេអូ ជាងបង្កើតរបស់...
                        </h4>
                        <p class="text-[11px] text-slate-400 truncate mt-0.5">You are an expert AI DIY craftsman...</p>
                        <div class="flex items-center justify-between mt-1.5">
                            <span class="text-emerald-400 text-xs font-bold">ឥតគិតថ្លៃ (Free)</span>
                            <button onclick="handlePromptAction('free-1')" class="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition-all">
                                <span>👁️</span> មើល
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Prompt 5: Free Mom Teaching -->
                <div class="prompt-item free-item bg-slate-900 border border-slate-800 hover:border-blue-500/40 p-3 rounded-2xl flex items-center gap-3 transition-all" data-title="ធ្វើវីដេអូ ai ម៉ាក់ៗបង្រៀន mom teaching education">
                    <div class="w-20 h-16 rounded-xl bg-gradient-to-br from-teal-700 to-emerald-900 flex items-center justify-center text-2xl shrink-0 relative overflow-hidden">
                        <span class="absolute top-1 left-1 bg-emerald-400 text-slate-950 text-[9px] font-extrabold px-1 rounded">FREE</span>
                        👩‍🏫
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-xs text-white truncate">
                            ធ្វើវីដេអូ Ai ម៉ាក់ៗបង្រៀន...
                        </h4>
                        <p class="text-[11px] text-slate-400 truncate mt-0.5">Prompt បង្កើតវីដេអូបង្រៀនបែបកុមារ...</p>
                        <div class="flex items-center justify-between mt-1.5">
                            <span class="text-emerald-400 text-xs font-bold">ឥតគិតថ្លៃ (Free)</span>
                            <button onclick="handlePromptAction('free-2')" class="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition-all">
                                <span>👁️</span> មើល
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- ==================== TAB 3: 📚 វគ្គសិក្សា (COURSES) ==================== -->
        <div id="tabContentCourses" class="tab-content hidden space-y-3">
            
            <!-- Search Bar -->
            <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">🔍</span>
                <input type="text" id="courseSearchInput" oninput="filterCourses()" placeholder="ស្វែងរកវគ្គសិក្សា..." class="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors">
            </div>

            <!-- Course Card 1: YouTube -->
            <div class="course-item bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3" data-title="មេរៀនរកលុយតាម youtube វគ្គសិក្សា">
                <div class="flex gap-3">
                    <div class="w-24 h-24 rounded-xl bg-gradient-to-tr from-red-600 to-rose-900 flex flex-col items-center justify-center text-center p-2 shrink-0 border border-red-500/30">
                        <span class="text-3xl">▶️</span>
                        <span class="text-[9px] font-bold text-white mt-1 leading-tight">រកលុយពី YouTube</span>
                        <span class="text-[8px] text-red-200">30+ មេរៀន</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-sm text-white leading-snug">មេរៀនរកលុយតាម YouTube</h4>
                        <p class="text-[11px] text-slate-400 line-clamp-3 mt-1 leading-relaxed">
                            🚀 ចង់ចាប់ផ្តើមរកចំណូលពី YouTube តែមិនដឹងត្រូវចាប់ផ្តើមពីណា? វគ្គសិក្សា "មេរៀនរកលុយពី YouTube" នេះមាន ៦ ជំពូក ៣០+ មេរៀន បង្រៀនលម្អិតពី CapCut, Channel Branding, SEO និង AdSense...
                        </p>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div>
                        <span class="text-xs text-slate-400 line-through mr-1">$120.00</span>
                        <span class="text-emerald-400 font-extrabold text-sm">$39.00</span>
                    </div>
                    <button onclick="openPaymentModal('មេរៀនរកលុយតាម YouTube', '$39.00')" class="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow active:scale-95 transition-all flex items-center gap-1">
                        <span>🛒</span> ទិញ
                    </button>
                </div>
            </div>

            <!-- Course Card 2: DistroKid -->
            <div class="course-item bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3" data-title="មេរៀនរកលុយតាម distrokid suno ai">
                <div class="flex gap-3">
                    <div class="w-24 h-24 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-900 flex flex-col items-center justify-center text-center p-2 shrink-0 border border-purple-500/30">
                        <span class="text-3xl">🎵</span>
                        <span class="text-[9px] font-bold text-white mt-1 leading-tight">រកលុយពី DistroKid</span>
                        <span class="text-[8px] text-purple-200">Suno AI + Music</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-sm text-white leading-snug">មេរៀនរកលុយតាម DistroKid</h4>
                        <p class="text-[11px] text-slate-400 line-clamp-3 mt-1 leading-relaxed">
                            🎵 ចង់ចាប់ផ្តើមរកចំណូលពី DistroKid តែមិនដឹងត្រូវចាប់ផ្តើមពីណា? វគ្គសិក្សានេះនឹងបង្រៀនអ្នកពីការប្រើ Suno AI ដើម្បីបង្កើតបទចម្រៀង, Upload ទៅកាន់ Spotify & Apple Music, និងការដកប្រាក់...
                        </p>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div>
                        <span class="text-xs text-slate-400 line-through mr-1">$75.00</span>
                        <span class="text-emerald-400 font-extrabold text-sm">$29.00</span>
                    </div>
                    <button onclick="openPaymentModal('មេរៀនរកលុយតាម DistroKid', '$29.00')" class="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow active:scale-95 transition-all flex items-center gap-1">
                        <span>🛒</span> ទិញ
                    </button>
                </div>
            </div>

        </div>

        <!-- ==================== TAB 4: 📜 ប្រវត្តិ (HISTORY / ORDERS) ==================== -->
        <div id="tabContentHistory" class="tab-content hidden space-y-3">
            
            <div class="flex items-center justify-between">
                <h3 class="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>📜</span> ប្រវត្តិបញ្ជាទិញ (<span id="orderCount">0</span>)
                </h3>
                <button onclick="refreshOrders()" class="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1">
                    <span>🔄</span> Refresh
                </button>
            </div>

            <!-- Search Bar in History -->
            <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">🔍</span>
                <input type="text" id="orderSearchInput" oninput="filterOrders()" placeholder="ស្វែងរកក្នុងប្រវត្តិទិញ..." class="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors">
            </div>

            <!-- Empty State -->
            <div id="emptyOrderState" class="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                <span class="text-4xl">📬</span>
                <p class="text-xs text-slate-400">មិនមានទិន្នន័យប្រវត្តិទិញត្រូវស្វែងរកឡើយ។</p>
                <button onclick="switchTabNav('prompts')" class="text-xs font-bold text-blue-400 hover:underline pt-2">
                    មើលបញ្ជី Prompts ដើម្បីចាប់ផ្ដើម ➔
                </button>
            </div>

            <!-- Order List Container -->
            <div id="orderListContainer" class="space-y-2.5 hidden">
            </div>

        </div>

        <!-- ==================== TAB 5: 👤 PROFILE ==================== -->
        <div id="tabContentProfile" class="tab-content hidden space-y-4">
            
            <!-- User Profile Big Card -->
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center relative overflow-hidden">
                <div id="profilePhotoLarge" class="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-3xl text-white shadow-xl mb-3 border-2 border-blue-400/40">
                    <span id="profileInitial">O</span>
                </div>
                <h3 id="profileName" class="font-bold text-base text-white">Ong Mach</h3>
                <p id="profileTelegramId" class="text-xs text-slate-400 font-mono mt-0.5">Telegram ID: 880554075</p>

                <!-- Current Plan Box -->
                <div class="bg-slate-950/80 rounded-xl p-3 border border-slate-800 mt-4 text-center">
                    <div id="planBadgeTitle" class="text-xs font-bold text-slate-300">
                        គណនីធម្មតា (Free Plan)
                    </div>
                    <p id="planBadgeDesc" class="text-[11px] text-slate-500 mt-0.5">
                        មិនទាន់មានគម្រោង VIP នៅឡើយទេ
                    </p>
                </div>
            </div>

            <!-- Profile Menu Links -->
            <div class="space-y-2 text-xs">
                
                <button onclick="openExternalTelegram('https://t.me/chetpanhavipbot')" class="w-full bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-slate-200 transition-all active:scale-[0.99]">
                    <div class="flex items-center gap-3">
                        <span class="text-base">📢</span>
                        <span class="font-medium">ចូលរួម Community Telegram Channel</span>
                    </div>
                    <span class="text-slate-500">➔</span>
                </button>

                <button onclick="openExternalTelegram('https://t.me/ongmach2019')" class="w-full bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-slate-200 transition-all active:scale-[0.99]">
                    <div class="flex items-center gap-3">
                        <span class="text-base">👤</span>
                        <span class="font-medium">ទាក់ទងទៅ Admin</span>
                    </div>
                    <span class="text-slate-500">➔</span>
                </button>

                <button onclick="openTermsModal()" class="w-full bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-slate-200 transition-all active:scale-[0.99]">
                    <div class="flex items-center gap-3">
                        <span class="text-base">📜</span>
                        <span class="font-medium">លក្ខខណ្ឌនៃការប្រើប្រាស់ (Terms & Services)</span>
                    </div>
                    <span class="text-slate-500">➔</span>
                </button>

            </div>

        </div>

    </div>

    <!-- ==================== BOTTOM NAVIGATION BAR (5 TABS) ==================== -->
    <div class="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 flex justify-around py-2.5 px-2 text-[11px] text-slate-400 z-40 max-w-md mx-auto">
        <button onclick="switchTabNav('home')" id="navBtnHome" class="nav-btn flex flex-col items-center gap-1 active-tab">
            <span class="text-lg">🏠</span>
            <span>ទំព័រដើម</span>
        </button>
        <button onclick="switchTabNav('prompts')" id="navBtnPrompts" class="nav-btn flex flex-col items-center gap-1 hover:text-white">
            <span class="text-lg">🎨</span>
            <span>Prompts</span>
        </button>
        <button onclick="switchTabNav('courses')" id="navBtnCourses" class="nav-btn flex flex-col items-center gap-1 hover:text-white">
            <span class="text-lg">📚</span>
            <span>វគ្គសិក្សា</span>
        </button>
        <button onclick="switchTabNav('history')" id="navBtnHistory" class="nav-btn flex flex-col items-center gap-1 hover:text-white">
            <span class="text-lg">📜</span>
            <span>ប្រវត្តិ</span>
        </button>
        <button onclick="switchTabNav('profile')" id="navBtnProfile" class="nav-btn flex flex-col items-center gap-1 hover:text-white">
            <span class="text-lg">👤</span>
            <span>Profile</span>
        </button>
    </div>

    <!-- ==================== MODALS ==================== -->

    <!-- 1. Universal Payment Modal (ABA QR) -->
    <div id="paymentModal" class="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 opacity-0 pointer-events-none transition-opacity duration-300">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto custom-scrollbar">
            <button onclick="closeModal('paymentModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">
                ✕
            </button>

            <div class="text-center mb-3">
                <span class="text-3xl">💎</span>
                <h3 id="paymentModalItemTitle" class="font-bold text-base text-white mt-1">ដោះសោរ Master Prompt</h3>
                <p class="text-xs text-slate-400 mt-0.5">ស្កេនទូទាត់ប្រាក់តាមរយៈ ABA KHQR</p>
            </div>

            <!-- QR Code Display -->
            <div class="bg-white p-2.5 rounded-2xl shadow-inner max-w-[220px] mx-auto mb-3">
                <img src="/aba-qr.png" alt="ABA QR Code" class="w-full h-auto rounded-lg mx-auto">
            </div>

            <!-- Account Details -->
            <div class="bg-slate-800/80 rounded-xl p-3 border border-slate-700 text-xs mb-3 space-y-1.5">
                <div class="flex justify-between">
                    <span class="text-slate-400">ឈ្មោះគណនី:</span>
                    <span class="font-bold text-white">MACH ONG</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">គណនី USD ($):</span>
                    <span class="font-bold text-emerald-400 tracking-wider">003 528 193</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">គណនី KHR (៛):</span>
                    <span class="font-bold text-amber-400 tracking-wider">500 633 436</span>
                </div>
                <div class="flex justify-between pt-1 border-t border-slate-700">
                    <span class="text-slate-400">ចំនួនទឹកប្រាក់:</span>
                    <span id="paymentModalAmount" class="font-extrabold text-amber-400 text-sm">$2.00</span>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-2">
                <button onclick="openABALink()" class="w-full bg-[#00527c] hover:bg-[#004266] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    <span>🔗</span> បើកក្នុង ABA Mobile App
                </button>
                <button onclick="confirmCurrentPayment()" class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    <span>✅</span> ខ្ញុំបានបង់ប្រាក់រួចរាល់
                </button>
            </div>
        </div>
    </div>

    <!-- 2. Master Prompt Viewer Modal -->
    <div id="promptModal" class="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 opacity-0 pointer-events-none transition-opacity duration-300">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-5 shadow-2xl relative max-h-[92vh] flex flex-col">
            
            <div class="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                    <div class="flex items-center gap-2">
                        <span id="viewerBadge" class="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded">VIP</span>
                        <h3 id="viewerTitle" class="font-bold text-sm text-white">Master Prompts</h3>
                    </div>
                    <p id="viewerSubtitle" class="text-xs text-slate-400 mt-0.5">ប្រើប្រាស់ជាមួយ AI Tools</p>
                </div>
                <button onclick="closeModal('promptModal')" class="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm shrink-0">
                    ✕
                </button>
            </div>

            <!-- Viewer Tabs -->
            <div id="viewerTabsHeader" class="flex gap-1.5 my-3 bg-slate-800/80 p-1 rounded-xl text-xs overflow-x-auto custom-scrollbar shrink-0">
                <button onclick="switchViewerSubTab('viewHowTo')" id="btnViewHowTo" class="viewer-subtab px-3 py-1.5 rounded-lg font-bold bg-amber-400 text-slate-950 transition-all shrink-0">
                    📖 របៀបប្រើ
                </button>
                <button onclick="switchViewerSubTab('viewPrompt1')" id="btnViewPrompt1" class="viewer-subtab px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white transition-all shrink-0">
                    🎬 Prompt 1
                </button>
                <button onclick="switchViewerSubTab('viewPrompt2')" id="btnViewPrompt2" class="viewer-subtab px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white transition-all shrink-0">
                    🎥 Prompt 2
                </button>
                <button onclick="switchViewerSubTab('viewTips')" id="btnViewTips" class="viewer-subtab px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white transition-all shrink-0">
                    💡 Tips
                </button>
            </div>

            <!-- Viewer Content Box -->
            <div class="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs font-mono leading-relaxed text-slate-200">
                
                <div id="viewHowTo" class="viewer-panel space-y-2 font-sans">
                    <p class="text-blue-300 font-bold">🚀 របៀបប្រើប្រាស់ Prompt នេះ៖</p>
                    <div id="howToText" class="text-slate-300 text-xs whitespace-pre-wrap"></div>
                </div>

                <div id="viewPrompt1" class="viewer-panel hidden space-y-2">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[11px] text-amber-400 font-sans font-bold">Prompt Text:</span>
                        <button onclick="copyCurrentSubTab('p1')" class="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[11px] font-sans active:scale-95 transition-all">
                            📋 Copy
                        </button>
                    </div>
                    <pre class="whitespace-pre-wrap select-all font-mono text-[11px]" id="prompt1Pre"></pre>
                </div>

                <div id="viewPrompt2" class="viewer-panel hidden space-y-2">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[11px] text-amber-400 font-sans font-bold">Prompt Text:</span>
                        <button onclick="copyCurrentSubTab('p2')" class="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[11px] font-sans active:scale-95 transition-all">
                            📋 Copy
                        </button>
                    </div>
                    <pre class="whitespace-pre-wrap select-all font-mono text-[11px]" id="prompt2Pre"></pre>
                </div>

                <div id="viewTips" class="viewer-panel hidden space-y-2">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[11px] text-amber-400 font-sans font-bold">Tips Text:</span>
                        <button onclick="copyCurrentSubTab('tips')" class="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[11px] font-sans active:scale-95 transition-all">
                            📋 Copy
                        </button>
                    </div>
                    <pre class="whitespace-pre-wrap select-all font-mono text-[11px]" id="tipsPre"></pre>
                </div>

            </div>

            <!-- Viewer Footer -->
            <div class="pt-3 border-t border-slate-800 flex gap-2 shrink-0">
                <button onclick="copyFullPromptPackage()" class="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                    📋 ចម្លងទាំងអស់ (Copy All)
                </button>
                <button onclick="closeModal('promptModal')" class="bg-slate-800 text-slate-300 font-semibold text-xs py-2.5 px-4 rounded-xl border border-slate-700">
                    បិទ
                </button>
            </div>

        </div>
    </div>

    <!-- 3. Terms & Services Modal -->
    <div id="termsModal" class="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-5 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button onclick="closeModal('termsModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">
                ✕
            </button>
            <h3 class="font-bold text-base text-white mb-2 flex items-center gap-2">
                <span>📜</span> លក្ខខណ្ឌនៃការប្រើប្រាស់
            </h3>
            <div class="flex-1 overflow-y-auto custom-scrollbar text-xs text-slate-300 space-y-2 pr-1 leading-relaxed">
                <p>១. រាល់ Master Prompts និងវគ្គសិក្សាទាំងអស់ជាកម្មសិទ្ធិរបស់ Chet Panha VIP Bot។</p>
                <p>២. អតិថិជនដែលបាន Unlock អាចប្រើប្រាស់សម្រាប់អាជីវកម្មផ្ទាល់ខ្លួន ហាមចែកចាយបន្តក្នុងគោលបំណងពាណិជ្ជកម្មដោយគ្មានការអនុញ្ញាត។</p>
                <p>៣. ប្រសិនបើមានបញ្ហាបច្ចេកទេស ឬមិនអាចបើកមើលបាន សូមចុចលើប៊ូតុង "ទាក់ទងទៅ Admin" ដើម្បីទទួលបានការដោះស្រាយភ្លាមៗ។</p>
            </div>
            <button onclick="closeModal('termsModal')" class="w-full mt-4 bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs">
                យល់ព្រម
            </button>
        </div>
    </div>

    <!-- ==================== JAVASCRIPT ==================== -->
    <script>
        // ១. Telegram WebApp Init
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.expand();
        }

        const ABA_PAY_URL = "https://pay.ababank.com/oRF8/0oqqegqd";

        // State
        const user = tg?.initDataUnsafe?.user;
        let isVip = localStorage.getItem('promptvip_is_vip') === 'true';
        let currentPayingItem = { title: 'VIP Master Prompts', amount: '$2.00' };

        // Prompts Database
        const promptsData = {
            'vip-video': {
                title: "Master Prompts សម្រាប់បង្កើតវីដេអូ AI",
                subtitle: "Story to Full Video Package (Sora/Kling/Veo/CapCut)",
                badge: "VIP $2.00",
                isVip: true,
                howTo: "១. Copy Prompt 1 ដាក់ ChatGPT/Claude ដើម្បីបានប្លង់រឿង\n២. ថតសម្លេង Voiceover MP3\n៣. ប្រើ Prompt 2 Animate រូបភាពក្នុង Sora/Kling/Veo\n៤. កាត់តក្នុង CapCut",
                p1: \`You are an expert AI video director and prompt engineer.
Turn my story into a complete production package for AI video generation.

STORY / TOPIC: [paste story or question, e.g. "Why does it rain?"]
VIDEO TYPE: [2D flat explainer / luxury product commercial / cinematic story]
STYLE: [e.g. flat 2D vector, limited navy-teal palette, soft gradients, simple shapes]
ASPECT RATIO: [9:16 for Reels/TikTok, or 16:9]
TOTAL LENGTH: [e.g. 40 seconds]
NUMBER OF SCENES: [e.g. 8]
VOICEOVER LANGUAGE: [Khmer]
AUDIENCE: [e.g. general Cambodian audience, beginners]
TEXT ON SCREEN: [none / Khmer subtitles only]
REFERENCE IMAGE: [yes - keep design identical / no]

Deliver in this order:
1. CONCEPT (2 sentences)
2. STYLE BIBLE & CONSISTENCY LINE
3. SCENE TABLE (#, time, visual, camera move, voiceover)
4. FOR EACH SCENE: Image Prompt + Video Prompt
5. NEGATIVE PROMPT
6. AUDIO PLAN (voice style, music, SFX)
7. EDIT PLAN (CapCut)
8. PUBLISHING (title, description, 10 hashtags)\`,
                p2: \`[CONSISTENCY LINE]
Scene: [what we see - subject, action, environment].
Camera: [one move, e.g. slow push-in / slow pan left to right].
Motion: [what moves - rain dots falling, light sweep, leaves drifting], slow and smooth.
Lighting: [soft key light from left, rim light, sunbeam].
Style: [flat 2D vector animation / cinematic photoreal].
Format: [9:16], 5 seconds, 24fps, one continuous shot, no cuts.
Negative: blurry, distorted, warped shapes, flickering, extra fingers, text, watermark, logo, oversaturated, low quality, style change between frames.\`,
                tips: \`CONSISTENCY LINES:
- 2D Explainer: Flat 2D vector animation, simple rounded shapes, limited palette of navy, teal, soft green and white, soft gradients, clean outlines, 9:16 vertical, no text.
- Luxury Commercial: Product matching reference image exactly, same proportions, natural muted palette, soft realistic reflections, shallow depth of field.\`
            },
            'vip-claude': {
                title: "ប្រើ Claude AI បង្កើតវីដេអូ",
                subtitle: "Claude AI Scriptwriting & Storyboard Prompt",
                badge: "VIP $2.00",
                isVip: true,
                howTo: "ប្រើសម្រាប់បង្កើត Script និង Visual Prompts ជាមួយ Claude 3.5 Sonnet",
                p1: "You are a professional viral video scriptwriter. Create an engaging 60-second video script in Khmer with visual scene descriptions for each 5-second interval.",
                p2: "Cinematic shot of [Subject], photorealistic 8k, dynamic lighting, octane render, 9:16 ratio.",
                tips: "ប្រើប្រាស់ Claude 3.5 Sonnet ដើម្បីទទួលបានលទ្ធផល Creative បំផុត។"
            },
            'vip-voice': {
                title: "របៀបបង្កើតសំឡេង តុក្កតា",
                subtitle: "Cartoon AI Voice & Sound Effects",
                badge: "VIP $1.00",
                isVip: true,
                howTo: "ប្រើជាមួយ ElevenLabs ឬ CapCut Text-to-Speech",
                p1: "Cartoon narrator voice, cheerful, playful, animated character style, high pitch with warm undertone.",
                p2: "Sound effect: funny boing sound, comical whistle, cheerful upbeat acoustic cartoon melody.",
                tips: "ជ្រើសរើស Voice Style 'Animation' ក្នុង ElevenLabs សម្រាប់សម្លេងកំប្លែង។"
            },
            'free-1': {
                title: "ធ្វើវីដេអូ ជាងបង្កើតរបស់...",
                subtitle: "Free Craftsman DIY Prompt",
                badge: "FREE",
                isVip: false,
                howTo: "ចម្លង Prompt នេះយកទៅដាក់ក្នុង Midjourney, Leonardo AI ឬ Sora/Kling",
                p1: "Cinematic close-up video of an experienced Cambodian craftsman carving wood in a traditional workshop, warm afternoon sunlight beams through windows, high detail, dust particles floating, 4k 60fps.",
                p2: "Slow camera push-in towards the craftsman's hands carving intricate wooden floral patterns, smooth motion, natural bokeh.",
                tips: "អាចបន្ថែមពាក្យ 'photorealistic 8k' ដើម្បីឱ្យរូបកាន់តែច្បាស់។"
            },
            'free-2': {
                title: "ធ្វើវីដេអូ Ai ម៉ាក់ៗបង្រៀន...",
                subtitle: "Free Educational Mom Prompt",
                badge: "FREE",
                isVip: false,
                howTo: "ចម្លង Prompt នេះទៅប្រើសម្រាប់វីដេអូបង្រៀនកុមារ",
                p1: "Friendly Asian mother sitting with her kid at a modern desk, teaching enthusiastically with colorful 3D floating educational graphics, bright soft lighting, cheerful atmosphere, 9:16 vertical format.",
                p2: "Gentle pan shot of mother smiling and gesturing towards a glowing 3D alphabet letter, vibrant colors, child clapping happily.",
                tips: "ស័ក្តិសមបំផុតសម្រាប់ធ្វើវីដេអូ Reels និង TikTok កុមារ។"
            }
        };

        let currentActivePromptKey = 'vip-video';

        // ២. អាប់ដេតព័ត៌មានអ្នកប្រើប្រាស់ពី Telegram
        if (user) {
            const fullName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            const initial = user.first_name ? user.first_name.charAt(0) : 'U';

            document.getElementById('userName').innerText = fullName;
            document.getElementById('userId').innerText = 'ID: ' + user.id;
            document.getElementById('profileName').innerText = fullName;
            document.getElementById('profileTelegramId').innerText = 'Telegram ID: ' + user.id;

            if (user.photo_url) {
                document.getElementById('userAvatarContainer').innerHTML = \`<img src="\${user.photo_url}" class="w-full h-full object-cover">\`;
                document.getElementById('profilePhotoLarge').innerHTML = \`<img src="\${user.photo_url}" class="w-full h-full object-cover rounded-full">\`;
            } else {
                document.getElementById('userInitial').innerText = initial;
                document.getElementById('profileInitial').innerText = initial;
            }

            // Fetch VIP & Orders status from server
            fetch('/api/status/' + user.id)
                .then(r => r.json())
                .then(data => {
                    if (data.isVip) setVipActive();
                    if (data.orders && data.orders.length > 0) {
                        saveOrdersToStorage(data.orders);
                    }
                })
                .catch(() => {});
        }

        if (isVip) {
            setVipActive();
        }
        renderOrders();

        function setVipActive() {
            isVip = true;
            localStorage.setItem('promptvip_is_vip', 'true');
            const hBtn = document.getElementById('upgradeHeaderBtn');
            if (hBtn) {
                hBtn.innerHTML = "👑 VIP Member";
                hBtn.className = "bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow-md pointer-events-none";
            }
            const planTitle = document.getElementById('planBadgeTitle');
            const planDesc = document.getElementById('planBadgeDesc');
            if (planTitle) planTitle.innerText = "⭐ គណនី VIP (VIP Plan)";
            if (planDesc) planDesc.innerText = "អ្នកអាចប្រើប្រាស់ Master Prompts ទាំងអស់បាន!";
        }

        // ៣. Tab Navigation Switching
        function switchTabNav(tab) {
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.className = "nav-btn flex flex-col items-center gap-1 text-slate-400 hover:text-white";
            });

            if (tab === 'home') {
                document.getElementById('tabContentHome').classList.remove('hidden');
                document.getElementById('navBtnHome').className = "nav-btn flex flex-col items-center gap-1 active-tab font-bold";
            } else if (tab === 'prompts') {
                document.getElementById('tabContentPrompts').classList.remove('hidden');
                document.getElementById('navBtnPrompts').className = "nav-btn flex flex-col items-center gap-1 active-tab font-bold";
            } else if (tab === 'courses') {
                document.getElementById('tabContentCourses').classList.remove('hidden');
                document.getElementById('navBtnCourses').className = "nav-btn flex flex-col items-center gap-1 active-tab font-bold";
            } else if (tab === 'history') {
                document.getElementById('tabContentHistory').classList.remove('hidden');
                document.getElementById('navBtnHistory').className = "nav-btn flex flex-col items-center gap-1 active-tab font-bold";
                renderOrders();
            } else if (tab === 'profile') {
                document.getElementById('tabContentProfile').classList.remove('hidden');
                document.getElementById('navBtnProfile').className = "nav-btn flex flex-col items-center gap-1 active-tab font-bold";
            }
        }

        // ៤. Prompt Actions (View or Buy)
        function handlePromptAction(key) {
            const p = promptsData[key];
            if (!p) return;
            currentActivePromptKey = key;

            if (p.isVip && !isVip) {
                openPaymentModal(p.title, p.badge);
            } else {
                openPromptViewer(key);
            }
        }

        function openPromptViewer(key) {
            const p = promptsData[key];
            if (!p) return;
            currentActivePromptKey = key;

            document.getElementById('viewerTitle').innerText = p.title;
            document.getElementById('viewerSubtitle').innerText = p.subtitle;
            document.getElementById('viewerBadge').innerText = p.badge;
            document.getElementById('howToText').innerText = p.howTo;
            document.getElementById('prompt1Pre').innerText = p.p1;
            document.getElementById('prompt2Pre').innerText = p.p2;
            document.getElementById('tipsPre').innerText = p.tips;

            switchViewerSubTab('viewHowTo');
            const m = document.getElementById('promptModal');
            m.classList.remove('opacity-0', 'pointer-events-none');
        }

        function switchViewerSubTab(tabId) {
            document.querySelectorAll('.viewer-panel').forEach(p => p.classList.add('hidden'));
            document.querySelectorAll('.viewer-subtab').forEach(b => {
                b.className = "viewer-subtab px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white transition-all shrink-0";
            });

            document.getElementById(tabId)?.classList.remove('hidden');
            const btnId = 'btn' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
            const activeBtn = document.getElementById(btnId);
            if (activeBtn) {
                activeBtn.className = "viewer-subtab px-3 py-1.5 rounded-lg font-bold bg-amber-400 text-slate-950 transition-all shrink-0";
            }
        }

        // ៥. Modals & Payments
        function openPaymentModal(title, amount) {
            currentPayingItem = { title: title || 'VIP Package', amount: amount || '$2.00' };
            document.getElementById('paymentModalItemTitle').innerText = currentPayingItem.title;
            document.getElementById('paymentModalAmount').innerText = currentPayingItem.amount;

            const m = document.getElementById('paymentModal');
            m.classList.remove('opacity-0', 'pointer-events-none');
        }

        function closeModal(id) {
            document.getElementById(id)?.classList.add('opacity-0', 'pointer-events-none');
        }

        function openTermsModal() {
            document.getElementById('termsModal')?.classList.remove('opacity-0', 'pointer-events-none');
        }

        function openABALink() {
            if (tg && typeof tg.openLink === 'function') {
                tg.openLink(ABA_PAY_URL);
            } else {
                window.open(ABA_PAY_URL, '_blank');
            }
        }

        function openExternalTelegram(url) {
            if (tg && typeof tg.openTelegramLink === 'function') {
                tg.openTelegramLink(url);
            } else if (tg && typeof tg.openLink === 'function') {
                tg.openLink(url);
            } else {
                window.open(url, '_blank');
            }
        }

        function confirmCurrentPayment() {
            const confirmMsg = "តើអ្នកបានទូទាត់ប្រាក់ " + currentPayingItem.amount + " តាម ABA រួចរាល់ហើយមែនទេ?";
            const doConfirm = () => {
                const userId = user?.id || 'user_' + Date.now();
                fetch('/api/upgrade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: userId,
                        itemTitle: currentPayingItem.title,
                        amount: currentPayingItem.amount
                    })
                })
                .then(r => r.json())
                .then(() => {
                    setVipActive();
                    recordLocalOrder(currentPayingItem.title, currentPayingItem.amount);
                    closeModal('paymentModal');
                    showToast('🎉 ទូទាត់ជោគជ័យ! បាន Unlock រួចរាល់');
                    setTimeout(() => {
                        openPromptViewer(currentActivePromptKey);
                    }, 400);
                })
                .catch(() => {
                    setVipActive();
                    recordLocalOrder(currentPayingItem.title, currentPayingItem.amount);
                    closeModal('paymentModal');
                    openPromptViewer(currentActivePromptKey);
                });
            };

            if (tg && typeof tg.showConfirm === 'function') {
                tg.showConfirm(confirmMsg, function(agreed) {
                    if (agreed) doConfirm();
                });
            } else {
                if (confirm(confirmMsg)) doConfirm();
            }
        }

        // ៦. Orders / History System
        function recordLocalOrder(title, amount) {
            const orders = getLocalOrders();
            orders.unshift({
                id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
                title: title,
                amount: amount,
                date: new Date().toLocaleDateString('km-KH'),
                status: 'ជោគជ័យ (Completed)'
            });
            localStorage.setItem('promptvip_orders', JSON.stringify(orders));
            renderOrders();
        }

        function getLocalOrders() {
            try {
                return JSON.parse(localStorage.getItem('promptvip_orders')) || [];
            } catch {
                return [];
            }
        }

        function saveOrdersToStorage(orders) {
            localStorage.setItem('promptvip_orders', JSON.stringify(orders));
            renderOrders();
        }

        function renderOrders() {
            const orders = getLocalOrders();
            const countEl = document.getElementById('orderCount');
            if (countEl) countEl.innerText = orders.length;

            const emptyEl = document.getElementById('emptyOrderState');
            const listEl = document.getElementById('orderListContainer');

            if (!listEl) return;

            if (orders.length === 0) {
                emptyEl?.classList.remove('hidden');
                listEl.classList.add('hidden');
                listEl.innerHTML = '';
            } else {
                emptyEl?.classList.add('hidden');
                listEl.classList.remove('hidden');
                listEl.innerHTML = orders.map(o => \`
                    <div class="order-item bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between" data-title="\${o.title.toLowerCase()}">
                        <div class="space-y-0.5">
                            <span class="text-[10px] text-slate-400 font-mono">#\${o.id} • \${o.date}</span>
                            <h4 class="font-bold text-xs text-white">\${o.title}</h4>
                            <span class="inline-block text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold border border-emerald-500/20">
                                \${o.status}
                            </span>
                        </div>
                        <div class="text-right">
                            <span class="font-extrabold text-sm text-amber-400">\${o.amount}</span>
                        </div>
                    </div>
                \`).join('');
            }
        }

        function refreshOrders() {
            showToast('🔄 បាន Refresh ប្រវត្តិបញ្ជាទិញរួចរាល់');
            renderOrders();
        }

        // ៧. Filtering & Searching
        function filterPrompts() {
            const q = document.getElementById('promptSearchInput').value.toLowerCase().trim();
            document.querySelectorAll('.prompt-item').forEach(el => {
                const title = el.getAttribute('data-title') || '';
                el.style.display = title.includes(q) ? 'flex' : 'none';
            });
        }

        function setPromptFilter(type) {
            document.querySelectorAll('.prompt-filter-btn').forEach(b => {
                b.className = "prompt-filter-btn px-3 py-1.5 rounded-xl font-semibold bg-slate-800 text-slate-300 hover:text-white shrink-0 active:scale-95 transition-all";
            });

            if (type === 'all') {
                document.getElementById('filterBtnAll').className = "prompt-filter-btn px-3 py-1.5 rounded-xl font-bold bg-blue-600 text-white shrink-0";
                document.querySelectorAll('.prompt-item').forEach(el => el.style.display = 'flex');
            } else if (type === 'free') {
                document.getElementById('filterBtnFree').className = "prompt-filter-btn px-3 py-1.5 rounded-xl font-bold bg-blue-600 text-white shrink-0";
                document.querySelectorAll('.prompt-item').forEach(el => {
                    el.style.display = el.classList.contains('free-item') ? 'flex' : 'none';
                });
            } else if (type === 'vip') {
                document.getElementById('filterBtnVip').className = "prompt-filter-btn px-3 py-1.5 rounded-xl font-bold bg-blue-600 text-white shrink-0";
                document.querySelectorAll('.prompt-item').forEach(el => {
                    el.style.display = el.classList.contains('vip-item') ? 'flex' : 'none';
                });
            }
        }

        function filterCourses() {
            const q = document.getElementById('courseSearchInput').value.toLowerCase().trim();
            document.querySelectorAll('.course-item').forEach(el => {
                const title = el.getAttribute('data-title') || '';
                el.style.display = title.includes(q) ? 'block' : 'none';
            });
        }

        function filterOrders() {
            const q = document.getElementById('orderSearchInput').value.toLowerCase().trim();
            document.querySelectorAll('.order-item').forEach(el => {
                const title = el.getAttribute('data-title') || '';
                el.style.display = title.includes(q) ? 'flex' : 'none';
            });
        }

        // ៨. Copy Functions
        function copyText(text) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    showToast('✅ បានចម្លងទៅ Clipboard រួចរាល់!');
                });
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showToast('✅ បានចម្លងទៅ Clipboard រួចរាល់!');
            }
        }

        function copyCurrentSubTab(sub) {
            const p = promptsData[currentActivePromptKey];
            if (!p) return;
            if (sub === 'p1') copyText(p.p1);
            else if (sub === 'p2') copyText(p.p2);
            else if (sub === 'tips') copyText(p.tips);
        }

        function copyFullPromptPackage() {
            const p = promptsData[currentActivePromptKey];
            if (!p) return;
            const full = \`=== \${p.title} ===\\n\\n[របៀបប្រើប្រាស់]:\\n\${p.howTo}\\n\\n[PROMPT 1]:\\n\${p.p1}\\n\\n[PROMPT 2]:\\n\${p.p2}\\n\\n[TIPS & CONSISTENCY]:\\n\${p.tips}\`;
            copyText(full);
        }

        function showToast(msg) {
            const toast = document.getElementById('toast');
            document.getElementById('toastMsg').innerText = msg;
            toast.classList.remove('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                toast.classList.add('opacity-0', 'pointer-events-none');
            }, 2500);
        }
    </script>
</body>
</html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log("Server is running on port " + PORT);
    bot.startPolling().catch(err => {
        console.error("Bot polling error:", err);
    });
    console.log("Telegram bot polling started.");
});
