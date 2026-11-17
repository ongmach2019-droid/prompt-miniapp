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

// Store in-memory VIP users (also saved in localStorage on client)
const vipUsers = new Set();

// ២. Telegram Bot Logic
bot.command('start', async (ctx) => {
    await ctx.reply('សូមស្វាគមន៍មកកាន់ Prompt VIP! ចុចប៊ូតុងខាងក្រោមដើម្បីចូលមើលបញ្ជី Master Prompts ទាំងអស់៖', {
        reply_markup: new InlineKeyboardBuilder()
            .webApp("បើកកម្មវិធី 🚀", WEBAPP_URL)
            .build()
    });
});

// ៣. Backend API
app.get('/api/status/:userId', (req, res) => {
    const { userId } = req.params;
    res.json({ isVip: vipUsers.has(String(userId)) });
});

app.post('/api/upgrade', async (req, res) => {
    const { userId } = req.body;
    if (userId) {
        vipUsers.add(String(userId));
        console.log(`User ${userId} បាន Upgrade ទៅកាន់ VIP!`);
        try {
            await bot.api.sendMessage({
                chat_id: userId,
                text: '🎉 អបអរសាទរ! គណនីរបស់អ្នកត្រូវបាន Unlock Master Prompt សម្រាប់បង្កើតវីដេអូ AI ($2.00) រួចរាល់។ សូមចូលទៅកាន់ Mini App ដើម្បីប្រើប្រាស់ Prompt ទាំងអស់!'
            });
        } catch (err) {
            console.error('Error sending message via bot:', err.message);
        }
    }
    res.json({ success: true, isVip: true, message: 'VIP Upgraded' });
});

// ៤. Frontend (Telegram Mini App UI)
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
            background-color: #0b1120;
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
    </style>
</head>
<body class="p-4 pb-24 max-w-lg mx-auto">

    <!-- Toast Alert -->
    <div id="toast" class="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-2xl transition-all duration-300 opacity-0 pointer-events-none flex items-center gap-2">
        <span>✅</span>
        <span id="toastMsg">បានចម្លងដោយជោគជ័យ!</span>
    </div>

    <!-- Header / User Profile Section -->
    <div class="flex items-center justify-between bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl mb-6 shadow-xl border border-slate-700/60">
        <div class="flex items-center gap-3">
            <div id="userPhoto" class="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-md">
                U
            </div>
            <div>
                <h2 id="userName" class="font-bold text-base leading-snug">ឈ្មោះអ្នកប្រើ</h2>
                <div class="flex items-center gap-2 mt-0.5">
                    <span id="userId" class="text-xs text-slate-400">ID: ...</span>
                    <span id="vipBadge" class="hidden bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        👑 VIP
                    </span>
                </div>
            </div>
        </div>
        <button id="headerUpgradeBtn" onclick="openPaymentModal()" class="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-1.5">
            ⚡ Upgrade VIP
        </button>
    </div>

    <!-- Section: VIP Prompts ($2) -->
    <div class="mb-6">
        <div class="flex justify-between items-center mb-3">
            <div class="flex items-center gap-2">
                <span class="text-xl">🔥</span>
                <h3 class="text-lg font-bold text-white">Master Prompts VIP ($2)</h3>
            </div>
            <span class="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold animate-pulse">
                Hot 🔥
            </span>
        </div>

        <!-- Featured Card: Master Prompts for AI Video -->
        <div class="relative bg-gradient-to-b from-slate-800 to-slate-900/90 rounded-2xl p-4 border border-amber-500/40 shadow-2xl overflow-hidden group">
            <div class="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-2xl shadow-lg">
                        🎬
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="bg-amber-400 text-slate-950 text-[11px] font-extrabold px-2 py-0.5 rounded-md">
                                $2.00 ONLY
                            </span>
                            <span class="text-xs text-amber-400 font-semibold">Master Package</span>
                        </div>
                        <h4 class="font-bold text-base text-white mt-1 leading-tight">
                            Master Prompts សម្រាប់បង្កើតវីដេអូ AI
                        </h4>
                    </div>
                </div>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed mb-3">
                បម្លែងសាច់រឿងទៅជា Video Production ពេញលេញ៖
                <br>• <strong>Prompt 1:</strong> Story to Full Video Package (ChatGPT, Claude, Gemini)
                <br>• <strong>Prompt 2:</strong> ផលិតវីដេអូនីមួយៗ (Sora, Kling, Veo, Runway)
                <br>• <strong>Edit Plan:</strong> កាត់តក្នុង CapCut + Consistency Lines
            </p>

            <div class="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                <button id="vipActionBtn" onclick="handleVipPromptClick()" class="flex-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-bold text-sm py-2.5 px-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                    <span id="vipActionIcon">🔒</span>
                    <span id="vipActionText">ដោះសោរមើល Prompt ($2.00)</span>
                </button>
                <button onclick="openPromptModal(true)" class="bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-600 active:scale-95 transition-all">
                    👀 មើលគំរូ
                </button>
            </div>
        </div>
    </div>

    <!-- Section: Free Prompts -->
    <div class="mb-4">
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-base font-bold flex items-center gap-2 text-slate-200">
                <span>🎁</span> Master Prompt ឥតគិតថ្លៃ (Free)
            </h3>
            <span class="text-xs text-slate-400">២ Prompts</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
            <!-- Free Card 1 -->
            <div onclick="openFreePrompt(1)" class="bg-slate-800/80 rounded-xl overflow-hidden border border-slate-700/60 hover:border-blue-500/50 cursor-pointer active:scale-95 transition-all">
                <div class="bg-gradient-to-br from-blue-900/60 to-slate-800 h-24 flex items-center justify-center relative">
                    <span class="absolute top-2 right-2 bg-emerald-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-bold">FREE</span>
                    <span class="text-3xl">🛠️</span>
                </div>
                <div class="p-3">
                    <h4 class="font-bold text-xs text-slate-200 line-clamp-1">ធ្វើវីដេអូ ជាងបង្កើតរបស់...</h4>
                    <p class="text-emerald-400 text-[11px] font-semibold mt-1">ឥតគិតថ្លៃ (Free)</p>
                </div>
            </div>

            <!-- Free Card 2 -->
            <div onclick="openFreePrompt(2)" class="bg-slate-800/80 rounded-xl overflow-hidden border border-slate-700/60 hover:border-blue-500/50 cursor-pointer active:scale-95 transition-all">
                <div class="bg-gradient-to-br from-purple-900/60 to-slate-800 h-24 flex items-center justify-center relative">
                    <span class="absolute top-2 right-2 bg-emerald-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-bold">FREE</span>
                    <span class="text-3xl">👩‍🏫</span>
                </div>
                <div class="p-3">
                    <h4 class="font-bold text-xs text-slate-200 line-clamp-1">ធ្វើវីដេអូ Ai ម៉ាក់ៗបង្រៀន...</h4>
                    <p class="text-emerald-400 text-[11px] font-semibold mt-1">ឥតគិតថ្លៃ (Free)</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Bottom Navigation Bar -->
    <div class="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 flex justify-around py-3 px-2 text-[11px] text-slate-400 z-30 max-w-lg mx-auto">
        <button class="flex flex-col items-center text-amber-400 font-bold gap-1">
            <span class="text-base">🏠</span>ទំព័រដើម
        </button>
        <button onclick="handleVipPromptClick()" class="flex flex-col items-center hover:text-white gap-1">
            <span class="text-base">💎</span>VIP Prompts
        </button>
        <button onclick="openPaymentModal()" class="flex flex-col items-center hover:text-white gap-1">
            <span class="text-base">💳</span>បង់ប្រាក់ $2
        </button>
    </div>

    <!-- ==================== MODALS ==================== -->

    <!-- 1. Payment Modal (ABA QR $2) -->
    <div id="paymentModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto custom-scrollbar">
            <button onclick="closeModal('paymentModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">
                ✕
            </button>

            <div class="text-center mb-3">
                <span class="text-3xl">💎</span>
                <h3 class="font-bold text-lg text-white mt-1">ដោះសោរ Master Prompt ($2.00)</h3>
                <p class="text-xs text-slate-400">ស្កេនទូទាត់ប្រាក់ ២ ដុល្លារ ឬ 8,000៛ តាមរយៈ ABA KHQR</p>
            </div>

            <!-- QR Code Display -->
            <div class="bg-white p-3 rounded-2xl shadow-inner max-w-[240px] mx-auto mb-3">
                <img src="/aba-qr.png" alt="ABA QR Code" class="w-full h-auto rounded-lg mx-auto">
            </div>

            <!-- Account Details -->
            <div class="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 text-xs mb-4 space-y-1.5">
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
                    <span class="font-extrabold text-amber-400 text-sm">$2.00 (8,000៛)</span>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-2">
                <button onclick="openABALink()" class="w-full bg-[#00527c] hover:bg-[#004266] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    <span>🔗</span> បើកក្នុង ABA Mobile App
                </button>
                <button onclick="confirmPayment()" class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    <span>✅</span> ខ្ញុំបានបង់ប្រាក់រួចរាល់ ($2)
                </button>
            </div>
        </div>
    </div>

    <!-- 2. Master Prompt Detail & Copy Modal -->
    <div id="promptModal" class="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 opacity-0 pointer-events-none transition-opacity duration-300">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-5 shadow-2xl relative max-h-[92vh] flex flex-col">
            
            <!-- Modal Header -->
            <div class="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded">VIP</span>
                        <h3 class="font-bold text-base text-white">Master Prompts AI Video Package</h3>
                    </div>
                    <p class="text-xs text-slate-400 mt-0.5">ប្រើសម្រាប់ ChatGPT/Claude និង Sora/Kling/Veo/Runway</p>
                </div>
                <button onclick="closeModal('promptModal')" class="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm shrink-0">
                    ✕
                </button>
            </div>

            <!-- Tabs -->
            <div class="flex gap-1.5 my-3 bg-slate-800/80 p-1 rounded-xl text-xs overflow-x-auto custom-scrollbar shrink-0">
                <button onclick="switchTab('tabHowTo')" id="btnTabHowTo" class="tab-btn px-3 py-1.5 rounded-lg font-bold bg-amber-500 text-slate-950 transition-all shrink-0">
                    📖 របៀបប្រើ
                </button>
                <button onclick="switchTab('tabPrompt1')" id="btnTabPrompt1" class="tab-btn px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white transition-all shrink-0">
                    🎬 Prompt 1 (ប្លង់រឿង)
                </button>
                <button onclick="switchTab('tabPrompt2')" id="btnTabPrompt2" class="tab-btn px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white transition-all shrink-0">
                    🎥 Prompt 2 (បង្កើតវីដេអូ)
                </button>
                <button onclick="switchTab('tabTips')" id="btnTabTips" class="tab-btn px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white transition-all shrink-0">
                    💡 Tips & Consistency
                </button>
            </div>

            <!-- Tab Content (Scrollable) -->
            <div class="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs font-mono leading-relaxed text-slate-200">
                
                <!-- Tab: How to Use -->
                <div id="tabHowTo" class="tab-panel space-y-3 font-sans">
                    <div class="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl text-blue-300">
                        <h5 class="font-bold text-sm mb-1">🚀 របៀបប្រើប្រាស់ ២ ជំហានងាយៗ៖</h5>
                        <p class="text-xs">អ្នកគ្រាន់តែប្រើ Prompt ចំនួន ២ នេះដើម្បីបម្លែងរឿងរ៉ាវ ឬគំនិតណាមួយឱ្យទៅជាវីដេអូ AI ពេញលេញ!</p>
                    </div>
                    <ol class="list-decimal list-inside space-y-2 text-slate-300 text-xs">
                        <li><strong>ជំហានទី ១៖</strong> ចម្លង <strong>Prompt 1</strong> ដាក់ចូលក្នុង ChatGPT, Claude ឬ Gemini រួចបំពេញព័ត៌មានក្នុងវង់ក្រចក [ ] ដើម្បីទទួលបានប្លង់រឿង, Voiceover និង Prompt រូបភាព/វីដេអូ។</li>
                        <li><strong>ជំហានទី ២៖</strong> ថតសម្លេង Voiceover ជារឿង ឬប្រើ AI Voice (TTS) រក្សាទុកជា File MP3។</li>
                        <li><strong>ជំហានទី ៣៖</strong> យក Prompt រូបភាពបង្កើត Start-Frame ជាមុនសិន រួចយក <strong>Prompt 2</strong> ទៅ Animate ក្នុង Sora, Veo, Kling ឬ Runway (Image-to-Video ៥ វិនាទី)។</li>
                        <li><strong>ជំហានទី ៤៖</strong> ទាញចូល CapCut៖ ដាក់សម្លេង MP3 ជាមុន រួចតម្រឹម Video Clip នីមួយៗឱ្យស៊ីនឹងសម្លេង បន្ថែមភ្លេង និង Subtitles រួច Export ជាការស្រេច!</li>
                    </ol>
                </div>

                <!-- Tab: Prompt 1 -->
                <div id="tabPrompt1" class="tab-panel hidden space-y-2">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[11px] text-amber-400 font-sans font-bold">Copy យកទៅដាក់ក្នុង ChatGPT/Claude/Gemini:</span>
                        <button onclick="copyText(prompt1Text)" class="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded text-[11px] font-sans active:scale-95 transition-all">
                            📋 Copy Prompt 1
                        </button>
                    </div>
                    <pre class="whitespace-pre-wrap select-all font-mono text-[11px]" id="prompt1Pre"></pre>
                </div>

                <!-- Tab: Prompt 2 -->
                <div id="tabPrompt2" class="tab-panel hidden space-y-2">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[11px] text-amber-400 font-sans font-bold">Copy យកទៅប្រើក្នុង Veo, Kling, Sora, Runway:</span>
                        <button onclick="copyText(prompt2Text)" class="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded text-[11px] font-sans active:scale-95 transition-all">
                            📋 Copy Prompt 2
                        </button>
                    </div>
                    <pre class="whitespace-pre-wrap select-all font-mono text-[11px]" id="prompt2Pre"></pre>
                </div>

                <!-- Tab: Tips & Consistency -->
                <div id="tabTips" class="tab-panel hidden space-y-2">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[11px] text-amber-400 font-sans font-bold">Consistency Lines & Negative Prompt:</span>
                        <button onclick="copyText(tipsText)" class="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded text-[11px] font-sans active:scale-95 transition-all">
                            📋 Copy Tips
                        </button>
                    </div>
                    <pre class="whitespace-pre-wrap select-all font-mono text-[11px]" id="tipsPre"></pre>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="pt-3 border-t border-slate-800 flex gap-2 shrink-0">
                <button onclick="copyText(fullPackageText)" class="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                    📋 ចម្លង Prompt ទាំងមូល (Copy All)
                </button>
                <button onclick="closeModal('promptModal')" class="bg-slate-800 text-slate-300 font-semibold text-xs py-2.5 px-4 rounded-xl border border-slate-700">
                    បិទ
                </button>
            </div>
        </div>
    </div>

    <!-- 3. Free Prompt Viewer Modal -->
    <div id="freePromptModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-5 shadow-2xl relative">
            <button onclick="closeModal('freePromptModal')" class="absolute top-4 right-4 text-slate-400 hover:text-white w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">
                ✕
            </button>
            <div class="flex items-center gap-2 mb-2">
                <span class="bg-emerald-500 text-slate-950 text-xs px-2 py-0.5 rounded font-bold">FREE</span>
                <h3 id="freeModalTitle" class="font-bold text-base text-white">Prompt ឥតគិតថ្លៃ</h3>
            </div>
            <p class="text-xs text-slate-400 mb-3">អ្នកអាច Copy យកទៅប្រើប្រាស់បានដោយឥតគិតថ្លៃ៖</p>
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 max-h-60 overflow-y-auto custom-scrollbar mb-4 whitespace-pre-wrap" id="freeModalContent">
            </div>
            <button onclick="copyFreePrompt()" class="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                📋 ចម្លង Prompt នេះ
            </button>
        </div>
    </div>

    <script>
        // ១. ភ្ជាប់ Telegram WebApp
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.expand();
        }

        const ABA_PAY_URL = "https://pay.ababank.com/oRF8/0oqqegqd";

        // ២. Master Prompt Texts
        const prompt1Text = \`You are an expert AI video director and prompt engineer.
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

1. CONCEPT - 2 sentences on the idea and emotional tone.

2. STYLE BIBLE - color palette, lighting, character/product look, line style,
   camera feel. Then ONE "consistency line" (max 40 words) that I will paste at
   the start of every prompt so all scenes look the same.

3. SCENE TABLE - columns: # | time (start-end) | visual | camera move |
   voiceover line (in [VOICEOVER LANGUAGE], one short sentence per scene,
   readable within the scene's duration).

4. FOR EACH SCENE:
   a) IMAGE PROMPT (start frame): subject, position and angle, environment,
      lighting and shadows, materials/textures, mood, composition.
      Leave empty space where subtitles go. No text in the image.
   b) VIDEO PROMPT: one single camera move only (push-in, pan, tilt, orbit,
      dolly, rack focus), motion speed, what moves in the scene, light changes,
      depth of field, "5-second clip, no cuts, stable design throughout".

5. NEGATIVE PROMPT - one line for all scenes.

6. AUDIO - voice style (gender, tone, pace), background music, sound effects
   per scene.

7. EDIT PLAN (CapCut) - trim points, transitions, color grade, subtitle position
   (keep out of the bottom 20% for Reels).

8. PUBLISHING - title, short description and 10 hashtags in [VOICEOVER LANGUAGE]
   + English, and a thumbnail idea.

Rules: write all image and video prompts in English. Keep one camera move per
clip. Never add logos or text inside the generated images. Keep facts accurate
and simple.\`;

        const prompt2Text = \`[CONSISTENCY LINE]
Scene: [what we see - subject, action, environment].
Camera: [one move, e.g. slow push-in / slow pan left to right / slow orbit 30 degrees].
Motion: [what moves - rain dots falling, light sweep, leaves drifting], slow and smooth.
Lighting: [soft key light from left, rim light, sunbeam, dramatic/soft].
Style: [flat 2D vector animation / cinematic photoreal], [palette].
Format: [9:16], 5 seconds, 24fps, one continuous shot, no cuts.
Negative: blurry, distorted, warped shapes, flickering, extra fingers, text,
watermark, logo, oversaturated, low quality, style change between frames.\`;

        const tipsText = \`READY-MADE CONSISTENCY LINES:
----------------------------
2D FLAT EXPLAINER (education, science, how-it-works videos):
Flat 2D vector animation, simple rounded shapes, limited palette of navy, teal, soft green and white, soft gradients, clean outlines, friendly educational mood, vertical 9:16, no text in frame.

LUXURY PRODUCT COMMERCIAL (watches, jewelry, cosmetics; attach product photo):
Product matching the reference image exactly, same proportions and materials, no added logos or text; modern cinematic premium commercial, natural muted palette, soft realistic reflections, shallow depth of field.

NEGATIVE PROMPT (use with every image and video):
blurry, distorted, warped shapes, changed design, flickering, extra fingers, extra hands, text, watermark, logo, oversaturated, low quality, style change between frames

TIPS:
- Keep one camera move per clip.
- Use the first 4 to 5 seconds of each clip; AI clips often drift near the end.
- Regenerate any clip where the design changes.\`;

        const fullPackageText = \`MASTER PROMPTS FOR AI VIDEO GENERATION
=======================================
PROMPT 1: STORY TO FULL VIDEO PACKAGE
-------------------------------------
\` + prompt1Text + \`

=======================================
PROMPT 2: ONE SCENE FOR THE VIDEO TOOL
-------------------------------------
\` + prompt2Text + \`

=======================================
CONSISTENCY LINES & TIPS
-------------------------------------
\` + tipsText;

        // Render Pre-formatted texts
        document.getElementById('prompt1Pre').innerText = prompt1Text;
        document.getElementById('prompt2Pre').innerText = prompt2Text;
        document.getElementById('tipsPre').innerText = tipsText;

        // ៣. ពិនិត្យព័ត៌មានអ្នកប្រើប្រាស់ និង VIP Status
        const user = tg?.initDataUnsafe?.user;
        let isVip = localStorage.getItem('promptvip_is_vip') === 'true';

        if (user) {
            document.getElementById('userName').innerText = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            document.getElementById('userId').innerText = 'ID: ' + user.id;
            document.getElementById('userPhoto').innerText = user.first_name ? user.first_name.charAt(0) : 'U';

            // Check VIP from backend
            fetch('/api/status/' + user.id)
                .then(r => r.json())
                .then(data => {
                    if (data.isVip) {
                        setVipActive();
                    }
                })
                .catch(() => {});
        }

        if (isVip) {
            setVipActive();
        }

        function setVipActive() {
            isVip = true;
            localStorage.setItem('promptvip_is_vip', 'true');
            document.getElementById('vipBadge')?.classList.remove('hidden');
            const actionBtn = document.getElementById('vipActionBtn');
            if (actionBtn) {
                actionBtn.className = "flex-1 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-slate-950 font-bold text-sm py-2.5 px-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2";
                document.getElementById('vipActionIcon').innerText = "✨";
                document.getElementById('vipActionText').innerText = "បើកមើល & Copy Prompt";
            }
            const headerBtn = document.getElementById('headerUpgradeBtn');
            if (headerBtn) {
                headerBtn.innerText = "👑 VIP Active";
                headerBtn.className = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-xs px-3.5 py-2 rounded-xl pointer-events-none";
            }
        }

        // ៤. មុខងារចុចលើ VIP Prompt
        function handleVipPromptClick() {
            if (isVip) {
                openPromptModal(false);
            } else {
                openPaymentModal();
            }
        }

        // ៥. Modals & Actions
        function openPaymentModal() {
            const m = document.getElementById('paymentModal');
            m.classList.remove('opacity-0', 'pointer-events-none');
        }

        function openPromptModal(isPreview = false) {
            const m = document.getElementById('promptModal');
            m.classList.remove('opacity-0', 'pointer-events-none');
            switchTab(isPreview ? 'tabHowTo' : 'tabPrompt1');
        }

        function closeModal(id) {
            const m = document.getElementById(id);
            m.classList.add('opacity-0', 'pointer-events-none');
        }

        function openABALink() {
            if (tg && typeof tg.openLink === 'function') {
                tg.openLink(ABA_PAY_URL);
            } else {
                window.open(ABA_PAY_URL, '_blank');
            }
        }

        function confirmPayment() {
            const confirmMsg = "តើអ្នកបានផ្ទេរប្រាក់ $2.00 តាម ABA រួចរាល់ហើយមែនទេ?";
            const doConfirm = () => {
                const userId = user?.id || 'guest_' + Date.now();
                fetch('/api/upgrade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: userId })
                })
                .then(r => r.json())
                .then(() => {
                    setVipActive();
                    closeModal('paymentModal');
                    showToast('🎉 អបអរសាទរ! គណនីរបស់អ្នកបាន Unlock រួចរាល់');
                    setTimeout(() => {
                        openPromptModal(false);
                    }, 500);
                })
                .catch(() => {
                    setVipActive();
                    closeModal('paymentModal');
                    openPromptModal(false);
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

        // Tabs switcher
        function switchTab(tabId) {
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.className = "tab-btn px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white transition-all shrink-0";
            });

            document.getElementById(tabId)?.classList.remove('hidden');
            const activeBtn = document.getElementById('btn' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
            if (activeBtn) {
                activeBtn.className = "tab-btn px-3 py-1.5 rounded-lg font-bold bg-amber-400 text-slate-950 transition-all shrink-0";
            }
        }

        // Clipboard Copy
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

        function showToast(msg) {
            const toast = document.getElementById('toast');
            document.getElementById('toastMsg').innerText = msg;
            toast.classList.remove('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                toast.classList.add('opacity-0', 'pointer-events-none');
            }, 2500);
        }

        // Free prompts handlers
        const freePrompts = {
            1: {
                title: "ធ្វើវីដេអូ ជាងបង្កើតរបស់ (Craftsman Prompt)",
                text: "Cinematic close-up video of an experienced Cambodian craftsman carving wood in a traditional workshop, warm afternoon sunlight beams through windows, high detail, dust particles floating, 4k 60fps."
            },
            2: {
                title: "ធ្វើវីដេអូ Ai ម៉ាក់ៗបង្រៀន (Educational Mom Prompt)",
                text: "Friendly Asian mother sitting with her kid at a modern desk, teaching enthusiastically with colorful 3D floating educational graphics, bright soft lighting, cheerful atmosphere, 9:16 vertical format."
            }
        };

        let currentFreeText = "";
        function openFreePrompt(id) {
            const p = freePrompts[id];
            if (!p) return;
            document.getElementById('freeModalTitle').innerText = p.title;
            document.getElementById('freeModalContent').innerText = p.text;
            currentFreeText = p.text;
            const m = document.getElementById('freePromptModal');
            m.classList.remove('opacity-0', 'pointer-events-none');
        }

        function copyFreePrompt() {
            copyText(currentFreeText);
            closeModal('freePromptModal');
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
