// NiveshSetu — Telegram tip demo. A scripted story (tip → crash → debrief → a new trick → recovery scam),
// now in Hindi or English, personalised by the player's answers, with the AI reasoning check on "Buy".
import {
  APP, FLAGS, SCENARIO_1, SCENARIO_2, RECOVERY_SCAM, HELP, HELP_ALWAYS, CHECK_QUESTIONS, CHECK_RULE,
  FACT_CARDS, ASK_SUGGESTIONS, REFUSAL, PITCH_HOOK, INTRO_BY_SOURCE,
} from './content.js';
import { newSession, quizOptions, scoreQuiz, lossAt, summary, pilotRecord, latencySec } from './engine.js';
import { lineChart, salesBars } from './chart.js';
import * as voice from './voice.js';
import { LANGS, DEMO_QUESTIONS, buildProfile, setPlayerName, getPlayerName } from '../shared/profile.js';
import { L, setLang, lang, inr, t as simT } from '../simulator/i18n.js';
import { lessonHTML, pickFlagLessons, DEMO_FLAG_LESSON } from '../shared/lessons.js';
import { isAdviceRequest } from '../shared/safety.js';
import { initTheme, toggleTheme, themeIcon } from '../shared/theme.js';
import { LOGO } from '../shared/brand.js';
import { api, health, listen } from '../shared/listen.js';
import { newGate, runCheck, decided, overriding, record, gateHTML, onGateInput } from '../shared/gate.js';

const PILOT = new URLSearchParams(location.search).has('pilot');
const STEPS = ['chat1', 'trade1', 'quiz1', 'crash', 'debrief', 'chat2', 'trade2', 'quiz2', 'outcome2', 'recovery', 'help', 'results'];
const STAKES = [5000, 20000, 50000, 100000];
const LEVELS = ['basic', 'mid', 'fin'];

// ── Demo strings ─────────────────────────────────────────────
const D = {
  title: { hi: 'Telegram टिप डेमो', en: 'Telegram tip demo', mr: 'Telegram टिप डेमो' },
  sub: { hi: 'एक खेल। असली पैसा नहीं लगता। कोई लॉग-इन नहीं।', en: 'A game. No real money. No login.', mr: 'एक खेळ. खरे पैसे लागत नाहीत. लॉग-इन नाही.' },
  choose: { hi: 'अपनी भाषा चुनें', en: 'Choose your language', mr: 'तुमची भाषा निवडा' },
  back: { hi: 'पीछे', en: 'Back', mr: 'मागे' }, next: { hi: 'आगे', en: 'Next', mr: 'पुढे' }, skip: { hi: 'छोड़ें', en: 'Skip', mr: 'वगळा' }, why: { hi: 'क्यों पूछ रहे हैं?', en: 'Why we ask', mr: 'हे का विचारतो?' },
  qOf: { hi: 'सवाल {n} / {t}', en: 'Question {n} of {t}', mr: 'प्रश्न {n} / {t}' },
  privacy: { hi: 'नाम और फ़ोन नंबर कभी नहीं भेजते। AI को सिर्फ़ आपके खेल के फ़ैसले जाते हैं, सहेजे नहीं जाते।', en: 'We never send your name or phone number. Only your game choices go to the AI, and they are not stored.', mr: 'नाव आणि फोन नंबर आम्ही कधीच पाठवत नाही. AI ला फक्त तुमचे खेळातले निर्णय जातात, ते साठवले जात नाहीत.' },
  madeFor: { hi: '{name}आपके लिए ऐसा तैयार किया', en: '{name}here is how we set it up for you', mr: '{name}तुमच्यासाठी असे तयार केले आहे' },
  lv_basic: { hi: 'बहुत आसान भाषा, कम विकल्पों वाला क्विज़', en: 'Very simple language, an easier quiz', mr: 'खूप सोपी भाषा, कमी पर्यायांची क्विझ' },
  lv_mid: { hi: 'आसान भाषा, बाज़ार के शब्दों का मतलब साथ में', en: 'Plain language, with market words explained', mr: 'सोपी भाषा, बाजारातल्या शब्दांचा अर्थ सोबत' },
  lv_fin: { hi: 'सटीक वित्तीय शब्द, और मुश्किल क्विज़', en: 'Precise financial terms, and a harder quiz', mr: 'अचूक आर्थिक शब्द, आणि अवघड क्विझ' },
  dm_farm: { hi: 'खेती से जुड़ी मिसालें', en: 'Examples from farming', mr: 'शेतीतली उदाहरणे' }, dm_shop: { hi: 'दुकान की मिसालें', en: 'Examples from running a shop', mr: 'दुकानाची उदाहरणं' },
  dm_job: { hi: 'तनख़्वाह और घर-ख़र्च की मिसालें', en: 'Examples from salary and household budgets', mr: 'पगार आणि घरखर्चाची उदाहरणं' }, dm_home: { hi: 'घर चलाने की मिसालें', en: 'Examples from running a home', mr: 'घर चालवण्याची उदाहरणं' },
  dm_student: { hi: 'पढ़ाई की मिसालें', en: 'Examples from student life', mr: 'अभ्यासाची उदाहरणं' },
  src: { hi: 'टिप वैसे ही आएगी जैसे आप तक आम तौर पर आती है', en: 'The tip reaches you the way tips usually do', mr: 'टिप तशीच येईल जशी तुमच्यापर्यंत नेहमी येते' },
  stake: { hi: 'नफ़ा-नुकसान {amt} पर दिखेगा', en: 'Gains and losses are shown on {amt}', mr: 'नफा-तोटा {amt} वर दिसेल' },
  newbie: { hi: 'पहली बार हैं, तो ट्रेडिंग स्क्रीन पर हर चीज़ का मतलब बताएँगे', en: 'First time? The trading screen explains every part', mr: 'पहिल्यांदाच आहात, तर ट्रेडिंग स्क्रीनवरच्या प्रत्येक गोष्टीचा अर्थ सांगू' },
  exp: { hi: 'आपने पहले शेयर लिए हैं, तो जाल भी वैसा ही होगा जैसा अनुभवी लोगों के लिए', en: 'You have traded before, so the trap is set for experienced people too', mr: 'तुम्ही आधी शेअर घेतले आहेत, म्हणून सापळाही अनुभवी लोकांसाठी असतो तसाच असेल' },
  voiceOn: { hi: 'कोच बोलकर समझाएगा', en: 'The coach will speak', mr: 'कोच बोलून समजावेल' }, voiceOff: { hi: 'कोच लिखकर समझाएगा', en: 'The coach will write (sound off)', mr: 'कोच लिहून समजावेल' },
  gateOn: { hi: '"खरीदें" दबाने पर AI पूछेगा: क्यों? और आपकी सोच परखेगा', en: 'When you tap "Buy", the AI asks why and checks your thinking', mr: '"खरेदी करा" दाबल्यावर AI विचारेल: का? आणि तुमचा विचार तपासेल' },
  start: { hi: 'शुरू करें ▶', en: 'Start ▶', mr: 'सुरू करा ▶' }, guardLink: { hi: 'हम क्या कभी नहीं करेंगे →', en: 'What we will never do →', mr: 'आम्ही काय कधीच करणार नाही →' },
  run1Intro: { hi: 'आपके फ़ोन पर एक Telegram ग्रुप से मैसेज आया है…', en: 'A message arrives from a Telegram group…', mr: 'तुमच्या फोनवर एका Telegram ग्रुपमधून मेसेज आला आहे…' },
  run2Intro: { hi: 'कुछ हफ़्ते बाद, WhatsApp पर…', en: 'A few weeks later, on WhatsApp…', mr: 'काही आठवड्यांनंतर, WhatsApp वर…' },
  openApp: { hi: '📈 ट्रेडिंग ऐप खोलो', en: '📈 Open the trading app', mr: '📈 ट्रेडिंग ॲप उघडा' }, showAll: { hi: 'सब मैसेज अभी दिखाओ ⏭', en: 'Show all messages now ⏭', mr: 'सगळे मेसेज आत्ता दाखवा ⏭' },
  sim: { hi: 'खेल · नकली पैसा · असली ब्रोकर नहीं', en: 'Game · pretend money · not a real broker', mr: 'खेळ · सरावाचे पैसे · खरा ब्रोकर नाही' },
  fictional: { hi: 'काल्पनिक कंपनी', en: 'Fictional company', mr: 'काल्पनिक कंपनी' }, biz: { hi: 'कंपनी का कारोबार देखें', en: 'See the company’s business', mr: 'कंपनीचा व्यवसाय पाहा' },
  sales: { hi: 'सालाना बिक्री', en: 'Yearly sales', mr: 'वार्षिक विक्री' }, howMuch: { hi: 'कितने का खरीदना है?', en: 'How much to buy?', mr: 'किती रुपयांचे घ्यायचे?' },
  buy: { hi: 'खरीदो {amt}', en: 'Buy {amt}', mr: 'खरेदी करा {amt}' }, checkFirst: { hi: '🔍 रुककर पहले जाँचो', en: '🔍 Stop and check first', mr: '🔍 थांबा, आधी तपासा' }, noBuy: { hi: 'नहीं खरीदना', en: 'Don’t buy', mr: 'घ्यायचं नाही' },
  helper: { hi: 'पहली बार? ऊपर का भाव = एक शेयर की क़ीमत। हरा % = आज कितना बढ़ा। चार्ट = पिछले 30 दिन। "कारोबार" में दिखता है कि कंपनी असल में कितना बेचती है।', en: 'First time? The price = cost of one share. Green % = how much it rose today. Chart = last 30 days. "Business" shows how much the company really sells.', mr: 'पहिल्यांदा? वरचा भाव = एका शेअरची किंमत. हिरवा % = आज किती वाढला. चार्ट = मागचे 30 दिवस. "व्यवसाय" मध्ये दिसतं की कंपनी खरंच किती विकते.' },
  checkTitle: { hi: '3 सवाल पूछो', en: 'Ask 3 questions', mr: '3 प्रश्न विचारा' }, q1: { hi: '1. यह किसने भेजा?', en: '1. Who sent this?', mr: '1. हे कोणी पाठवलं?' }, q2: { hi: '2. क्या वह SEBI में रजिस्टर्ड है?', en: '2. Are they SEBI-registered?', mr: '2. ते SEBI मध्ये रजिस्टर्ड आहेत का?' },
  q3: { hi: '3. अगर भाव आधा हो गया तो?', en: '3. What if the price halves?', mr: '3. भाव निम्मा झाला तर?' },
  half: { hi: 'आपने {a} लगाए, तो सिर्फ़ {h} बचेंगे। क्या आप {h} खोने के लिए तैयार हैं?', en: 'You put in {a}, so only {h} would be left. Are you ready to lose {h}?', mr: 'तुम्ही {a} लावले, तर फक्त {h} उरतील. तुम्ही {h} गमवायला तयार आहात का?' },
  close: { hi: 'वापस', en: 'Back', mr: 'मागे' }, placeBuy: { hi: 'ऑर्डर दो {amt}', en: 'Place order {amt}', mr: 'ऑर्डर द्या {amt}' }, buyAnyway: { hi: 'फिर भी खरीदो {amt}', en: 'Buy anyway {amt}', mr: 'तरीही खरेदी करा {amt}' },
  needReason: { hi: 'पहले अपना कारण जाँचें', en: 'Check your reason first', mr: 'आधी तुमचे कारण तपासा' },
  quizH: { hi: 'नतीजा देखने से पहले…', en: 'Before you see what happened…', mr: 'निकाल पाहण्याआधी…' }, quizSub: { hi: 'इस मैसेज में आपको क्या-क्या गड़बड़ लगा? जो-जो लगे, सब चुनें।', en: 'What looked wrong in this message? Pick everything that applies.', mr: 'या मेसेजमध्ये तुम्हाला काय-काय गडबड वाटली? जे-जे वाटलं, ते सगळं निवडा.' },
  quizNext: { hi: 'आगे →', en: 'Next →', mr: 'पुढे →' }, quizNone: { hi: 'कुछ गड़बड़ नहीं लगा →', en: 'Nothing looked wrong →', mr: 'काहीच गडबड वाटली नाही →' },
  next9: { hi: 'अगले 9 दिन', en: 'The next 9 days', mr: 'पुढचे 9 दिवस' }, bought: { hi: 'आपने {a} के लगभग {s} शेयर ₹{p} पर खरीदे।', en: 'You bought about {s} shares at ₹{p} for {a}.', mr: 'तुम्ही {a} मध्ये सुमारे {s} शेअर ₹{p} भावाने घेतले.' },
  notBought: { hi: 'आपने नहीं खरीदा। देखिए, जिसने {a} लगाए उसका क्या हुआ।', en: 'You did not buy. See what happened to someone who put in {a}.', mr: 'तुम्ही घेतले नाहीत. पाहा, ज्याने {a} लावले त्याचं काय झालं.' },
  dayN: { hi: 'दिन {d}', en: 'Day {d}', mr: 'दिवस {d}' }, yourNow: { hi: 'आपके {a} अब: ', en: 'Your {a} is now: ', mr: 'तुमचे {a} आता: ' }, theirNow: { hi: 'उनके {a} अब: ', en: 'Their {a} is now: ', mr: 'त्यांचे {a} आता: ' },
  lossH: { hi: 'नुकसान: {l} ({p}%)', en: 'Loss: {l} ({p}%)', mr: 'तोटा: {l} ({p}%)' }, lossP: { hi: 'और लोअर सर्किट में आप बेच भी नहीं पाए। ₹126 का "टारगेट" कभी नहीं आया।', en: 'And at the lower circuit you could not even sell. The ₹126 "target" never came.', mr: 'आणि लोअर सर्किटमध्ये तुम्ही विकूही शकला नाहीत. ₹126 चं "टारगेट" कधीच आलं नाही.' },
  savedH: { hi: 'आप बच गए। उनका नुकसान: {l}', en: 'You were saved. Their loss: {l}', mr: 'तुम्ही वाचलात. त्यांचा तोटा: {l}' }, savedP: { hi: 'ग्रुप के 18,412 लोगों में से जिसने भी खरीदा, उसका यही हाल हुआ।', en: 'Of the 18,412 people in the group, everyone who bought ended up like this.', mr: 'ग्रुपमधल्या 18,412 लोकांपैकी ज्याने ज्याने घेतले, त्या सगळ्यांचे असेच हाल झाले.' },
  whatHappened: { hi: 'क्या हुआ? समझें →', en: 'What happened? Understand →', mr: 'काय झालं? समजून घ्या →' }, fast: { hi: 'आगे बढ़ाओ ⏭', en: 'Skip ahead ⏭', mr: 'पुढे जा ⏭' }, yourPrice: { hi: 'आपका भाव', en: 'Your price', mr: 'तुमचा भाव' },
  debriefH: { hi: 'क्या हुआ? समझते हैं', en: 'What happened? Let’s understand', mr: 'काय झालं? समजून घेऊ' }, caught: { hi: 'खतरे के इशारे आपने पकड़े', en: 'warning signs you spotted', mr: 'तुम्ही ओळखलेले धोक्याचे इशारे' },
  tipHere: { hi: '● टिप यहाँ आई — भाव पहले ही 3 गुना हो चुका था', en: '● The tip came here — the price had already tripled', mr: '● टिप इथे आली — भाव आधीच 3 पट झाला होता' },
  salesFlat: { hi: 'कंपनी की सालाना बिक्री — 3 साल से वहीं की वहीं', en: 'The company’s yearly sales — flat for 3 years', mr: 'कंपनीची वार्षिक विक्री — 3 वर्षांपासून तेवढीच' },
  yourLevel: { hi: 'अपने हिसाब से समझें:', en: 'Explain at my level:', mr: 'तुमच्या पातळीवर समजून घ्या:' }, lvl_basic: { hi: 'आसान', en: 'Simple', mr: 'सोपं' }, lvl_mid: { hi: 'बीच का', en: 'Medium', mr: 'मध्यम' }, lvl_fin: { hi: 'वित्तीय', en: 'Financial', mr: 'आर्थिक' },
  hear: { hi: '🔊 सुनो', en: '🔊 Listen', mr: '🔊 ऐका' }, explainMe: { hi: '✨ मेरे लिए समझाओ', en: '✨ Explain it for me', mr: '✨ मला समजावून सांगा' },
  sixFlags: { hi: 'मैसेज में {n} खतरे के इशारे थे', en: 'The message had {n} warning signs', mr: 'मेसेजमध्ये {n} धोक्याचे इशारे होते' },
  falseAlarm: { hi: 'आपने "{x}" को भी खतरा माना। यह अपने आप में खतरे का इशारा नहीं है।', en: 'You also marked "{x}". On its own, that is not a warning sign.', mr: 'तुम्ही "{x}" लाही धोका मानलं. हा स्वतःहून धोक्याचा इशारा नाही.' },
  newMsg: { hi: '📩 एक नया मैसेज आया है →', en: '📩 A new message has arrived →', mr: '📩 एक नवीन मेसेज आला आहे →' },
  got: { hi: '✅ पकड़ा', en: '✅ Spotted', mr: '✅ ओळखलं' }, missedP: { hi: '❌ छूटा', en: '❌ Missed', mr: '❌ सुटलं' }, newTrick: { hi: 'नया तरीका', en: 'New trick', mr: 'नवीन युक्ती' }, inMsg: { hi: 'मैसेज में: ', en: 'In the message: ', mr: 'मेसेजमध्ये: ' },
  forYou: { hi: 'आपके लिए: ', en: 'For you: ', mr: 'तुमच्यासाठी: ' },
  aiCoach: { hi: '💬 आपका AI कोच', en: '💬 Your AI coach', mr: '💬 तुमचा AI कोच' }, aiThinking: { hi: 'आपके फ़ैसलों को देख रहा है', en: 'Looking at your choices', mr: 'तुमचे निर्णय पाहत आहे' },
  aiSrc: { hi: '✨ {p} AI · सिर्फ़ खेल के तथ्यों से', en: '✨ {p} AI · from the game’s facts only', mr: '✨ {p} AI · फक्त खेळातल्या माहितीवरून' }, aiOff: { hi: 'ऑफ़लाइन (AI से नहीं जुड़ पाए)', en: 'Offline (could not reach the AI)', mr: 'ऑफलाइन (AI शी जोडता आलं नाही)' },
  youSaid: { hi: 'आपका कारण था: ', en: 'Your reason was: ', mr: 'तुमचं कारण होतं: ' },
  nextCheck: { hi: 'अगली बार: रुककर ये 3 सवाल', en: 'Next time: stop and ask these 3', mr: 'पुढच्या वेळी: थांबा आणि हे 3 प्रश्न विचारा' },
  askH: { hi: 'कुछ पूछना है? बोलकर या लिखकर', en: 'Have a question? Speak or type', mr: 'काही विचारायचं आहे? बोलून किंवा लिहून' }, askPh: { hi: 'जैसे: SEBI नंबर कहाँ देखें?', en: 'e.g. Where do I check a SEBI number?', mr: 'उदा.: SEBI नंबर कुठे पाहायचा?' },
  listening: { hi: 'बोलिए… फिर ⏹ दबाइए', en: 'Speak… then tap ⏹', mr: 'बोला… मग ⏹ दाबा' }, thinking: { hi: 'सोच रहा है', en: 'Thinking', mr: 'विचार करत आहे' },
  ruleBadge: { hi: '🛡️ नियम: सलाह नहीं देते', en: '🛡️ Rule: no advice', mr: '🛡️ नियम: सल्ला देत नाही' }, aiBadge: { hi: '✨ AI · जाँचे हुए तथ्यों से', en: '✨ AI · from verified facts', mr: '✨ AI · तपासलेल्या माहितीवरून' },
  noHear: { hi: 'आवाज़ समझ नहीं आई। दोबारा बोलें या लिखें।', en: 'Could not catch that. Speak again or type.', mr: 'आवाज समजला नाही. पुन्हा बोला किंवा लिहा.' },
  aiFail: { hi: 'अभी AI से नहीं जुड़ पाए। ऊपर के कार्ड देखें। पैसा गया हो तो तुरंत 1930 पर कॉल करें।', en: 'Could not reach the AI right now. See the cards above. If you lost money, call 1930 right away.', mr: 'आत्ता AI शी जोडता आलं नाही. वरची कार्ड पाहा. पैसे गेले असतील तर लगेच 1930 वर कॉल करा.' },
  youBought: { hi: 'आपने खरीदा', en: 'You bought', mr: 'तुम्ही घेतले' }, youSkipped: { hi: 'आपने नहीं खरीदा 👏', en: 'You did not buy 👏', mr: 'तुम्ही घेतले नाहीत 👏' },
  vipApp: { hi: 'भरोसा VIP ऐप', en: 'Bharosa VIP app', mr: 'भरोसा VIP ॲप' }, profit: { hi: 'मुनाफ़ा +₹38,400 📈', en: 'Profit +₹38,400 📈', mr: 'नफा +₹38,400 📈' }, blocked: { hi: '⛔ निकासी रुकी — पहले 20% टैक्स भरें', en: '⛔ Withdrawal blocked — pay 20% tax first', mr: '⛔ पैसे काढणं थांबलं — आधी 20% टॅक्स भरा' },
  spotted: { hi: 'इशारे पकड़े', en: 'signs spotted', mr: 'ओळखलेले इशारे' }, newOnes: { hi: 'नए वाले', en: 'new ones', mr: 'नवीन इशारे' }, thisTime: { hi: 'इस बार के इशारे', en: 'This time’s warning signs', mr: 'या वेळचे इशारे' },
  later: { hi: 'कुछ दिन बाद, एक और मैसेज…', en: 'A few days later, another message…', mr: 'काही दिवसांनंतर, अजून एक मेसेज…' }, found: { hi: '🔍 जाँच में यह मिला', en: '🔍 What the check found', mr: '🔍 तपासणीत हे सापडलं' },
  send: { hi: '₹4,999 भेजो', en: 'Send ₹4,999', mr: '₹4,999 पाठवा' }, rcCheck: { hi: '🔍 रुको, पहले जाँचो', en: '🔍 Wait, check first', mr: '🔍 थांबा, आधी तपासा' }, refuse: { hi: 'मना करो, रिपोर्ट करो', en: 'Refuse and report', mr: 'नकार द्या, रिपोर्ट करा' },
  twice: { hi: 'दूसरी बार ठगे गए', en: 'Cheated a second time', mr: 'दुसऱ्यांदा फसवणूक झाली' }, wellDone: { hi: 'शाबाश! आपने दूसरी ठगी पकड़ ली।', en: 'Well done! You caught the second fraud.', mr: 'शाब्बास! तुम्ही दुसरी फसवणूक ओळखली.' },
  feeRule: { hi: 'जो पैसा वापस दिलाने के लिए पहले फ़ीस माँगे, वह ठग है।', en: 'Anyone who asks for a fee first to get your money back is a fraud.', mr: 'पैसे परत मिळवून देण्यासाठी जो आधी फी मागतो, तो फसवणारा आहे.' },
  wrong: { hi: 'इसमें क्या गड़बड़ थी', en: 'What was wrong here', mr: 'यात काय गडबड होती' }, ifLost: { hi: 'अगर सच में पैसा गया हो, तो क्या करें? →', en: 'If you really lost money, what to do? →', mr: 'खरंच पैसे गेले असतील, तर काय करायचं? →' },
  lost: { hi: 'डूबे पैसे', en: 'your lost money', mr: 'बुडालेले पैसे' },
  helpH: { hi: 'पैसा गया? सच और सही रास्ता', en: 'Lost money? The truth and the right path', mr: 'पैसे गेले? खरी गोष्ट आणि योग्य मार्ग' }, helpSub: { hi: 'आपके साथ क्या हुआ, वह चुनें:', en: 'Choose what happened to you:', mr: 'तुमच्यासोबत काय झालं, ते निवडा:' },
  results: { hi: 'मेरा नतीजा देखें →', en: 'See my result →', mr: 'माझा निकाल पाहा →' }, resultH: { hi: 'आपका नतीजा', en: 'Your result', mr: 'तुमचा निकाल' },
  learned: { hi: 'आपने रुककर जाँचना सीख लिया। 👏', en: 'You have learned to stop and check. 👏', mr: 'तुम्ही थांबून तपासायला शिकलात. 👏' }, keepGoing: { hi: 'हर बार थोड़ा और रुकना — यही असली बचाव है।', en: 'Stopping a little longer each time is the real protection.', mr: 'प्रत्येक वेळी थोडं जास्त थांबणं — हाच खरा बचाव आहे.' },
  first: { hi: 'पहला मैसेज', en: 'First message', mr: 'पहिला मेसेज' }, second: { hi: 'दूसरा मैसेज', en: 'Second message', mr: 'दुसरा मेसेज' },
  r_bought: { hi: 'खरीदा?', en: 'Bought?', mr: 'घेतले?' }, r_checked: { hi: 'खरीदने से पहले जाँच की?', en: 'Checked before buying?', mr: 'घेण्याआधी तपासलं?' }, r_flags: { hi: 'खतरे के इशारे पकड़े', en: 'Warning signs spotted', mr: 'ओळखलेले धोक्याचे इशारे' },
  r_unseen: { hi: 'नए (कभी न सिखाए) इशारे', en: 'New (never taught) signs', mr: 'नवीन (कधीही न शिकवलेले) इशारे' }, r_reason: { hi: 'कारण की मज़बूती (AI जाँच)', en: 'Reason strength (AI check)', mr: 'कारण किती मजबूत (AI तपासणी)' }, r_time: { hi: 'फ़ैसले से पहले सोचा (सेकंड)', en: 'Thought before deciding (sec)', mr: 'निर्णयाआधी विचार केला (सेकंद)' },
  rec: { hi: '"रिकवरी" ठग पकड़ा?', en: 'Caught the "recovery" fraud?', mr: '"रिकव्हरी" फसवणूक ओळखली?' }, yes: { hi: 'हाँ', en: 'Yes', mr: 'हो' }, no: { hi: 'नहीं', en: 'No', mr: 'नाही' },
  card: { hi: 'निवेश सेतु कार्ड', en: 'NiveshSetu card', mr: 'निवेश सेतु कार्ड' }, cardSub: { hi: 'कोई भी टिप आए, तो पहले 3 सवाल:', en: 'Whenever a tip arrives, first 3 questions:', mr: 'कोणतीही टिप आली, तर आधी 3 प्रश्न:' },
  missedYou: { hi: 'आपसे जो छूटा:', en: 'What you missed:', mr: 'तुमच्याकडून जे सुटलं:' }, helpLine: { hi: 'पैसा गया हो: 1930 · cybercrime.gov.in', en: 'Lost money: 1930 · cybercrime.gov.in', mr: 'पैसे गेले असतील: 1930 · cybercrime.gov.in' },
  replay: { hi: '🔁 फिर से खेलें', en: '🔁 Play again', mr: '🔁 पुन्हा खेळा' }, localOnly: { hi: 'यह नतीजा कहीं सहेजा नहीं जाता।', en: 'This result is not stored anywhere.', mr: 'हा निकाल कुठेही साठवला जात नाही.' },
  pilot: { hi: 'पायलट (ऑब्ज़र्वर के लिए)', en: 'Pilot (for the observer)', mr: 'पायलट (निरीक्षकासाठी)' }, copy: { hi: 'कॉपी करें', en: 'Copy', mr: 'कॉपी करा' }, copied: { hi: 'कॉपी हो गया', en: 'Copied', mr: 'कॉपी झाले' },
  guardH: { hi: 'हम क्या कभी नहीं करेंगे', en: 'What we will never do', mr: 'आम्ही काय कधीच करणार नाही' },
  guard: {
    hi: ['❌ किसी भी शेयर को खरीदने, बेचने या रखने की सलाह — कभी नहीं।', '🎭 इस खेल की हर कंपनी, ग्रुप, नाम, नंबर और UPI काल्पनिक है।', '🔒 कोई लॉग-इन नहीं। नाम या फ़ोन नंबर कभी नहीं भेजते। SMS/OTP कभी नहीं पढ़ते।', '🚫 किसी ब्रोकर का लिंक, विज्ञापन या "निवेश शुरू करें" बटन नहीं।', '🎙️ आपकी आवाज़ सिर्फ़ उसी पल टेक्स्ट बनाने के लिए भेजी जाती है, सहेजी नहीं जाती।', '🤖 AI आपकी सोच पर सवाल करता है और समझाता है; स्कोर तय नियमों से बनते हैं।', '🤝 हम आपका डूबा पैसा वापस नहीं दिला सकते। हम सिर्फ़ सही रास्ता बता सकते हैं।'],
    mr: ['❌ कोणताही शेअर घ्या, विका किंवा ठेवा असा सल्ला — कधीच नाही.', '🎭 या खेळातील प्रत्येक कंपनी, ग्रुप, नाव, नंबर आणि UPI काल्पनिक आहे.', '🔒 लॉग-इन नाही. नाव किंवा फोन नंबर कधीच पाठवत नाही. SMS/OTP कधीच वाचत नाही.', '🚫 कोणत्याही ब्रोकरची लिंक, जाहिरात किंवा "गुंतवणूक सुरू करा" बटण नाही.', '🎙️ तुमचा आवाज फक्त त्याच क्षणी मजकूर बनवण्यासाठी पाठवला जातो, साठवला जात नाही.', '🤖 AI तुमच्या विचारांवर प्रश्न विचारतो आणि समजावतो; स्कोअर ठरलेल्या नियमांनुसार बनतात.', '🤝 आम्ही तुमचे गेलेले पैसे परत मिळवून देऊ शकत नाही. आम्ही फक्त योग्य मार्ग दाखवू शकतो.'],
    en: ['❌ Advice to buy, sell or hold any share — never.', '🎭 Every company, group, name, number and UPI in this game is fictional.', '🔒 No login. We never send your name or phone number. We never read SMS/OTP.', '🚫 No broker links, ads or "start investing" buttons.', '🎙️ Your voice is sent only to turn it into text at that moment, and is not stored.', '🤖 The AI questions your thinking and explains; scores come from fixed rules.', '🤝 We cannot get your lost money back. We can only show the right path.'],
  },
};
const tr = (k, v = {}) => { let s = L(D[k]); if (typeof s === 'string') for (const [a, b] of Object.entries(v)) s = s.split(`{${a}}`).join(b); return s; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const br = (s) => esc(s).replace(/\n/g, '<br>');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const prov = () => 'Sarvam';
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

// ── State ────────────────────────────────────────────────────
const S = {
  screen: 'lang', qi: 0, answers: {}, profile: null, session: null,
  chatShown: 0, fresh: -1, freshDay: -1, anim: null, amount: 20000,
  sheet: null, checkOpen: null, quizSel: [], crashDay: 0, crashDone: false,
  explain: { level: 'mid', text: '', ai: false, loading: false, note: '' },
  flagAI: {}, coach: {}, ask: { q: '', a: '', source: '', loading: false, listening: false },
  helpOpen: null, rc: { stage: 'msg', checked: false }, aiOk: null,
};
let flow = 0, listener = null;
const $app = document.getElementById('app');
const run = () => (S.screen.endsWith('2') || ['outcome2', 'recovery', 'help', 'results'].includes(S.screen) ? 2 : 1);
const scen = () => (run() === 1 ? SCENARIO_1 : SCENARIO_2);
const R = () => S.session.runs[run()];
const P = () => S.profile;
const safeProfile = () => { const { name, answers, ...rest } = S.profile; return rest; };

// Chat messages for this player: the admin adds a line aimed at people like them.
function messages() {
  const m = scen().chat.messages;
  if (run() !== 1) return m;
  const hook = PITCH_HOOK[P().domain];
  return hook ? [m[0], { from: m[0].from, admin: true, text: hook }, ...m.slice(1)] : m;
}

// ── Navigation ───────────────────────────────────────────────
function go(screen) {
  flow++; voice.stop(); stopListening();
  S.screen = screen; S.sheet = null; S.checkOpen = null;
  render(); window.scrollTo(0, 0);
  enter(screen, flow);
}
function enter(screen, my) {
  if (screen === 'chat1' || screen === 'chat2') { S.chatShown = 0; chatLoop(my); }
  if (screen === 'trade1' || screen === 'trade2') { if (!R().tradeOpenedAt) R().tradeOpenedAt = Date.now(); }
  if (screen === 'quiz1' || screen === 'quiz2') { S.quizSel = []; voice.speak('quiz'); }
  if (screen === 'crash') { S.crashDay = 0; S.crashDone = false; crashLoop(my); }
  if (screen === 'debrief') { voice.speak('debrief'); askCoach('run1'); }
  if (screen === 'outcome2') askCoach('run2');
  if (screen === 'results') askCoach('final');
  if (screen === 'recovery') { S.rc = { stage: 'msg', checked: false }; voice.speak('rc_msg'); }
}
async function chatLoop(my) {
  const msgs = messages();
  await sleep(500);
  while (my === flow && S.chatShown < msgs.length) {
    S.chatShown++; S.fresh = S.chatShown - 1; render(); S.fresh = -1;
    const m = msgs[S.chatShown - 1];
    if (m.voice && !voice.isMuted()) await Promise.race([voice.speak(m.voice), sleep(14000)]);
    else await sleep(L(m.text)?.length > 80 ? 1600 : 1000);
  }
}
async function crashLoop(my) {
  const path = SCENARIO_1.path;
  await sleep(700);
  for (let d = 1; d < path.length; d++) {
    if (my !== flow) return;
    S.crashDay = d; S.freshDay = d; render(); S.freshDay = -1;
    const ev = SCENARIO_1.events[d];
    if (ev?.voice && !voice.isMuted()) await Promise.race([voice.speak(ev.voice), sleep(6000)]);
    await sleep(ev ? 900 : 650);
  }
  if (my !== flow) return;
  S.crashDone = true; render();
}

// AI coach: a personal debrief from what this player actually did.
async function askCoach(stage) {
  if (S.coach[stage]?.data || S.coach[stage]?.loading) return;
  if (!S.aiOk) { S.coach[stage] = { failed: true }; render(); return; }
  S.coach[stage] = { loading: true }; render();
  const runInfo = (n) => { const r = S.session.runs[n]; return { decision: r.decision, amount: r.amount, reasonText: r.reasonText, verdict: r.gate?.verdict, score: r.gate?.score, hits: r.result?.hits, missed: r.result?.missed, falseAlarms: r.result?.falseAlarms, checks: r.checksOpened }; };
  const out = await api('debrief', { profile: safeProfile(), stage, runs: { 1: runInfo(1), 2: runInfo(2) }, recovery: S.session.recovery.action }, 30000);
  S.coach[stage] = out && !out.fallback ? { data: out } : { failed: true };
  render();
  if (out && !out.fallback && P().voiceAuto) voice.speak(null, `${out.title}. ${out.message}`, 'app');
}

// ── Actions ──────────────────────────────────────────────────
const A = {
  theme: () => { toggleTheme(); render(); },
  lang: (l) => { setLang(l); S.screen = 'q'; S.qi = 0; render(); },
  opt: (v) => {
    const q = DEMO_QUESTIONS[S.qi];
    if (q.type === 'multi') {
      const cur = S.answers[q.id] || [], ex = ['none', 'nothing'];
      let next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur.filter((x) => !ex.includes(x)), v];
      if (ex.includes(v) && !cur.includes(v)) next = [v];
      S.answers[q.id] = next; render();
    } else { S.answers[q.id] = v; render(); setTimeout(() => A.qnext(), 220); }
  },
  qnext: () => {
    const q = DEMO_QUESTIONS[S.qi];
    if (q.type === 'text') { const i = $app.querySelector('#qtext'); S.answers.name = setPlayerName(i ? i.value : getPlayerName()); }
    else if (S.answers.name == null) S.answers.name = getPlayerName();
    if (S.qi < DEMO_QUESTIONS.length - 1) { S.qi++; render(); }
    else {
      S.profile = buildProfile(lang(), S.answers);
      S.amount = S.profile.stake;
      voice.setMuted(!S.profile.voiceAuto);
      go('setup');
    }
  },
  qskip: () => { const i = $app.querySelector('#qtext'); if (i) i.value = ''; S.answers.name = setPlayerName(''); A.qnext(); },
  qback: () => { if (S.qi > 0) { S.qi--; render(); } else go('lang'); },
  start: () => {
    S.session = newSession(P());
    S.explain = { level: P().level, text: L(FACT_CARDS.pump.cached[P().level]), ai: false, loading: false, note: '' };
    S.flagAI = {}; S.coach = {};
    voice.speak('intro');
    setTimeout(() => go('chat1'), 300);
  },
  guard: () => { S.prev = S.screen; go('guard'); },
  back: () => go(S.prev || 'lang'),
  mute: () => { voice.setMuted(!voice.isMuted()); render(); },
  showAll: () => { flow++; voice.stop(); S.chatShown = messages().length; render(); },
  openTrade: () => go(run() === 1 ? 'trade1' : 'trade2'),
  amount: (v) => { S.amount = +v; render(); },
  check: () => { S.sheet = { kind: 'check' }; S.anim = 'sheet'; render(); },
  checkItem: (k) => { S.checkOpen = S.checkOpen === k ? null : k; if (!R().checksOpened.includes(k)) R().checksOpened.push(k); render(); },
  buy: () => { S.sheet = { kind: 'buy', gate: newGate('buy') }; S.anim = 'sheet'; render(); },
  closeSheet: () => { stopListening(); S.sheet = null; render(); },
  gateCheck: async () => {
    const g = S.sheet?.gate; if (!g) return;
    stopListening();
    const p = runCheck(g, { app: 'demo', scenario: run(), amount: S.amount, profile: safeProfile(), ctx: { demo: true, value: S.amount, own: S.amount, weightAfter: 0, flagIds: ['tip_source', 'guaranteed_returns_claim'] } }, lang());
    render(); await p;
    if (S.sheet?.gate === g) { render(); const r = g.result; if (P().voiceAuto && r) voice.speak(null, [r.gap, r.question].filter(Boolean).join(' ') || r.good, 'app'); }
  },
  gateMic: async () => {
    const g = S.sheet?.gate; if (!g) return;
    if (g.listening && listener) {
      g.listening = false; render();
      const text = await listener.stop(); listener = null;
      if (text) { if (g.result?.question) g.answer = (g.answer ? g.answer + ' ' : '') + text; else g.text = (g.text ? g.text + ' ' : '') + text; }
      render(); return;
    }
    voice.stop(); g.listening = true; render(); listener = await listen(lang());
  },
  place: () => {
    const g = S.sheet?.gate; if (!g || !decided(g)) return;
    const rec = record(g);
    Object.assign(R(), { reasonText: rec.reasonText, gate: rec.gate });
    A.decide('buy');
  },
  decide: (d) => {
    const r = R();
    r.decision = d; r.amount = d === 'buy' ? S.amount : 0; r.decidedAt = Date.now();
    go(run() === 1 ? 'quiz1' : 'quiz2');
  },
  toggleQ: (id) => { S.quizSel = S.quizSel.includes(id) ? S.quizSel.filter((x) => x !== id) : [...S.quizSel, id]; render(); },
  submitQuiz: () => { const r = R(); r.selected = [...S.quizSel]; r.result = scoreQuiz(scen(), r.selected); go(run() === 1 ? 'crash' : 'outcome2'); },
  skipCrash: () => { flow++; voice.stop(); S.crashDay = SCENARIO_1.path.length - 1; S.crashDone = true; render(); },
  toDebrief: () => go('debrief'),
  level: (lvl) => { S.explain = { level: lvl, text: L(FACT_CARDS.pump.cached[lvl]), ai: false, loading: false, note: '' }; render(); },
  hearExplain: () => { const e = S.explain; if (!e.ai && e.level === P().level) voice.speak('fc_pump_' + e.level); else voice.speak(null, e.text, 'app'); },
  aiExplain: async () => {
    S.explain.loading = true; S.explain.note = ''; render();
    const out = await api('explain', { card: 'pump', profile: { ...safeProfile(), level: S.explain.level }, lang: lang() });
    S.explain.loading = false;
    if (out?.text && !out.fallback) { S.explain.text = out.text; S.explain.ai = true; } else S.explain.note = tr('aiOff');
    render();
  },
  hearFlag: (id) => voice.speak('fl_' + id),
  aiFlag: async (id) => {
    S.flagAI[id] = { loading: true }; render();
    const out = await api('explain', { card: 'flag:' + id, profile: safeProfile(), lang: lang() });
    S.flagAI[id] = out?.text && !out.fallback ? { text: out.text } : { note: tr('aiOff') };
    render();
  },
  hearCheck: () => voice.speak('check'),
  suggest: (i) => { S.ask.q = L(ASK_SUGGESTIONS)[+i]; askNow(); },
  ask: () => { const el = document.getElementById('askq'); S.ask.q = el ? el.value : S.ask.q; askNow(); },
  mic: async () => {
    if (S.ask.listening && listener) {
      S.ask.listening = false; render();
      const text = await listener.stop(); listener = null;
      if (text) { S.ask.q = text; askNow(); } else { S.ask.a = tr('noHear'); S.ask.source = ''; render(); }
      return;
    }
    S.ask.listening = true; render(); listener = await listen(lang());
  },
  hearAnswer: () => S.ask.a && voice.speak(S.ask.source === 'rule' ? 'refusal' : null, S.ask.a, 'app'),
  toChat2: () => go('chat2'),
  toRecovery: () => go('recovery'),
  rcCheck: () => { S.rc.checked = true; S.session.recovery.checked = true; render(); },
  rcPay: () => { S.session.recovery.action = 'pay'; S.rc.stage = 'paid'; render(); voice.speak('rc_line'); },
  rcRefuse: () => { S.session.recovery.action = 'refuse'; S.rc.stage = 'refused'; render(); voice.speak('rc_line'); },
  toHelp: () => go('help'),
  help: (id) => { S.helpOpen = S.helpOpen === id ? null : id; render(); },
  toResults: () => go('results'),
  replay: () => location.reload(),
  copyPilot: () => { navigator.clipboard?.writeText(JSON.stringify(pilotRecord(S.session))); const el = document.getElementById('pilotmsg'); if (el) el.textContent = tr('copied'); },
};
function stopListening() { if (listener) { listener.stop(); listener = null; } if (S.sheet?.gate) S.sheet.gate.listening = false; }

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  A[el.dataset.a]?.(el.dataset.v, el);
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'qtext') { S.answers.name = setPlayerName(e.target.value); return; }
  onGateInput(e, S.sheet?.gate);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'askq') A.ask();
  if ((e.key === 'Enter' || e.keyCode === 13) && e.target.id === 'qtext') { e.preventDefault(); A.qnext(); }
});

async function askNow() {
  const q = (S.ask.q || '').trim();
  if (!q) return;
  if (isAdviceRequest(q)) { S.ask = { ...S.ask, a: L(REFUSAL), source: 'rule', loading: false }; render(); voice.speak('refusal'); return; }
  S.ask.loading = true; S.ask.a = ''; render();
  const out = await api('ask', { q, profile: safeProfile(), app: 'demo' });
  S.ask.loading = false;
  if (out?.answer) { S.ask.a = out.answer; S.ask.source = out.source || 'ai'; } else { S.ask.a = tr('aiFail'); S.ask.source = ''; }
  render();
}

// ── Layout ───────────────────────────────────────────────────
function render() {
  const idx = STEPS.indexOf(S.screen);
  const onb = ['lang', 'q', 'setup'].includes(S.screen);
  $app.innerHTML = (onb ? '' : `
    <header class="top sp">
      <span class="brandtxt">${LOGO} ${L(APP.name)}</span>
      <span class="hb"><button class="icon-btn" data-a="theme" aria-label="theme">${themeIcon()}</button><button class="icon-btn" data-a="mute" aria-label="sound">${voice.isMuted() ? '🔇' : '🔊'}</button></span>
      ${idx >= 0 ? `<div class="prog"><i style="width:${Math.round(((idx + 1) / STEPS.length) * 100)}%"></i></div>` : ''}
    </header>`) + `<main class="${onb ? '' : 'screen'} s-${S.screen}">${SCREENS[S.screen]()}</main>` + overlay();
  S.anim = null;
  const body = $app.querySelector('.chat-body');
  if (body) body.scrollTop = body.scrollHeight;
}

const SCREENS = {
  lang: () => `
    <div class="onb lang-screen">
      <div class="corner"><button class="icon-btn" data-a="theme" aria-label="theme">${themeIcon()}</button></div>
      <div class="brandmark">${LOGO}</div>
      <h1>निवेश सेतु <span>NiveshSetu · Telegram tip demo</span></h1>
      <p class="muted">टिप और टैप के बीच का पुल · The bridge between a tip and a tap</p>
      <h2>अपनी भाषा चुनें<br><small>Choose your language · तुमची भाषा निवडा</small></h2>
      <div class="langs">${LANGS.map((l) => `<button class="langcard" data-a="lang" data-v="${l.id}"><b>${l.label}</b><span>${l.sub}</span></button>`).join('')}</div>
      <p class="fine">खेल · नकली पैसा · कोई लॉग-इन नहीं · A game · pretend money · no login</p>
    </div>`,

  q: () => {
    const q = DEMO_QUESTIONS[S.qi], val = S.answers[q.id];
    const sel = (v) => (q.type === 'multi' ? (val || []).includes(v) : val === v);
    return `<div class="onb">
      <div class="qtop"><button class="ghost-btn" data-a="qback">← ${tr('back')}</button><span class="muted">${tr('qOf', { n: S.qi + 1, t: DEMO_QUESTIONS.length })}</span>
        <button class="icon-btn" data-a="theme" aria-label="theme">${themeIcon()}</button></div>
      <div class="qbar"><i style="width:${((S.qi + 1) / DEMO_QUESTIONS.length) * 100}%"></i></div>
      <h2 class="qtext">${esc(L(q.q))}</h2>
      ${q.hint ? `<p class="muted">${esc(L(q.hint))}</p>` : ''}
      ${q.type === 'text' ? `<input id="qtext" class="qinput" enterkeyhint="next" value="${esc(S.answers.name ?? getPlayerName())}" placeholder="${esc(L(q.placeholder))}" maxlength="24" autocomplete="off">`
        : `<div class="opts">${q.options.map(([v, label]) => `<button class="opt ${sel(v) ? 'on' : ''}" data-a="opt" data-v="${v}"><span class="tick">${q.type === 'multi' ? (sel(v) ? '✓' : '') : sel(v) ? '●' : ''}</span>${esc(L(label))}</button>`).join('')}</div>`}
      ${q.why ? `<details class="why"><summary>${tr('why')}</summary><p>${esc(L(q.why))}</p></details>` : ''}
      <div class="qnav">${q.type === 'text' ? `<button class="btn ghost" data-a="qskip">${tr('skip')}</button>` : ''}
        ${q.type !== 'single' ? `<button class="btn primary" data-a="qnext" ${q.type === 'multi' && !(val || []).length ? 'disabled' : ''}>${tr('next')} →</button>` : ''}</div>
      <p class="fine center">${tr('privacy')}</p>
    </div>`;
  },

  setup: () => {
    const p = P();
    const nm = p.name ? (lang() === 'hi' ? `${p.name} जी, ` : `${p.name}, `) : '';
    const items = [tr('lv_' + p.level), tr('dm_' + p.domain), `${tr('src')}: “${L(INTRO_BY_SOURCE[p.tipSource] || INTRO_BY_SOURCE.none)}”`, tr('stake', { amt: inr(p.stake) }),
      p.experienced ? tr('exp') : tr('newbie'), p.voiceAuto ? tr('voiceOn') : tr('voiceOff'), tr('gateOn')];
    return `<div class="onb">
      <div class="brandmark sm">${LOGO}</div>
      <h2>${esc(cap(tr('madeFor', { name: nm })))}</h2>
      <ul class="setup">${items.map((x) => `<li><span>✓</span>${esc(x)}</li>`).join('')}</ul>
      <button class="btn primary big" data-a="start">${tr('start')}</button>
      <button class="btn ghost" data-a="guard">${tr('guardLink')}</button>
    </div>`;
  },

  chat1: () => chatScreen(), chat2: () => chatScreen(),
  trade1: () => tradeScreen(), trade2: () => tradeScreen(),
  quiz1: () => quizScreen(), quiz2: () => quizScreen(),

  crash: () => {
    const r = S.session.runs[1], p = SCENARIO_1.path;
    const amt = r.decision === 'buy' ? r.amount : P().stake;
    const now = lossAt(amt, p[0], p[S.crashDay]);
    const evs = Object.entries(SCENARIO_1.events).filter(([d]) => +d <= S.crashDay);
    const down = p[S.crashDay] < p[0];
    return `
    <h2>${tr('next9')}</h2>
    <p class="sub">${r.decision === 'buy' ? tr('bought', { a: inr(now.invested), s: now.shares, p: p[0] }) : tr('notBought', { a: inr(amt) })}</p>
    <div class="card">
      <div class="ticker"><b>GADAELEC</b><span>${tr('dayN', { d: S.crashDay })}</span><span class="${down ? 'dn' : 'up'}">₹${p[S.crashDay].toFixed(1)}</span></div>
      ${lineChart(p, { upto: S.crashDay + 1, color: down ? 'var(--down)' : 'var(--up)', buyAt: p[0], buyLabel: tr('yourPrice'), min: 18, max: 52 })}
      <div class="worth ${down ? 'dn' : 'up'}">${r.decision === 'buy' ? tr('yourNow', { a: inr(now.invested) }) : tr('theirNow', { a: inr(now.invested) })}<b>${inr(now.value)}</b></div>
    </div>
    <ol class="timeline">${evs.map(([d, e]) => `<li class="ev-${e.tone} ${+d === S.freshDay ? 'fresh' : ''}"><span>${tr('dayN', { d })}</span>${esc(L(e.text))}</li>`).join('')}</ol>
    ${S.crashDone ? `
      <div class="card result ${now.loss > 0 ? 'bad' : ''}">
        ${r.decision === 'buy' ? `<h3>${tr('lossH', { l: inr(now.loss), p: Math.round((now.loss / now.invested) * 100) })}</h3><p>${tr('lossP')}</p>` : `<h3>${tr('savedH', { l: inr(now.loss) })}</h3><p>${tr('savedP')}</p>`}
      </div>
      <button class="btn big primary" data-a="toDebrief">${tr('whatHappened')}</button>` : `<button class="btn ghost" data-a="skipCrash">${tr('fast')}</button>`}`;
  },

  debrief: () => {
    const r = S.session.runs[1], res = r.result, e = S.explain;
    const full = [...SCENARIO_1.stock.history.slice(0, -1), ...SCENARIO_1.path];
    return `
    <h2>${tr('debriefH')}</h2>
    <div class="score"><b>${res.hits.length}/${res.total}</b> ${tr('caught')}</div>
    ${coachBox('run1', r)}
    <section class="card">
      <h3>${esc(L(FACT_CARDS.pump.title))}</h3>
      ${lineChart(full, { marks: [SCENARIO_1.stock.history.length - 1], color: 'var(--down)' })}
      <p class="cap">${tr('tipHere')}</p>
      ${salesBars(SCENARIO_1.stock.sales, { unit: { hi: 'करोड़', mr: 'कोटी' }[lang()] || 'Cr' })}
      <p class="cap">${tr('salesFlat')}</p>
      <div class="lvl"><span>${tr('yourLevel')}</span>${LEVELS.map((v) => `<button class="chip sm ${e.level === v ? 'on' : ''}" data-a="level" data-v="${v}">${tr('lvl_' + v)}</button>`).join('')}</div>
      <p class="say">${e.loading ? `<span class="dots">${tr('thinking')}</span>` : esc(e.text)}</p>
      ${e.ai ? `<small class="ainote">${tr('aiBadge')}</small>` : ''}${e.note ? `<p class="note">${esc(e.note)}</p>` : ''}
      <div class="crow"><button class="btn sm" data-a="hearExplain">${tr('hear')}</button><button class="btn sm" data-a="aiExplain" ${e.loading ? 'disabled' : ''}>${tr('explainMe')}</button></div>
    </section>
    <h3 class="sech">${tr('sixFlags', { n: SCENARIO_1.quiz.flags.length })}</h3>
    ${SCENARIO_1.quiz.flags.map((id) => flagCard(id, res.hits.includes(id), false, null, 'run1')).join('')}
    ${res.falseAlarms.length ? `<p class="note">${tr('falseAlarm', { x: res.falseAlarms.map((d) => esc(L(quizTitle(d)))).join('", "') })}</p>` : ''}
    ${demoLessons(SCENARIO_1.quiz.flags)}
    ${checkCard(tr('nextCheck'))}
    ${askBox()}
    <button class="btn big primary" data-a="toChat2">${tr('newMsg')}</button>`;
  },

  outcome2: () => {
    const r = S.session.runs[2], o = SCENARIO_2.outcome[r.decision === 'buy' ? 'bought' : 'skipped'], res = r.result;
    return `
    <h2>${r.decision === 'buy' ? tr('youBought') : tr('youSkipped')}</h2>
    <section class="card ${r.decision === 'buy' ? 'result bad' : ''}">
      <h3>${esc(L(o.title))}</h3>
      <ol class="steps">${o.steps.map((s) => `<li>${esc(L(s))}</li>`).join('')}</ol>
      ${r.decision === 'buy' ? `<div class="fakeapp"><div>${tr('vipApp')}</div><b>${tr('profit')}</b><span>${tr('blocked')}</span></div>` : ''}
    </section>
    <div class="score"><b>${res.hits.length}/${res.total}</b> ${tr('spotted')} · ${tr('newOnes')} <b>${res.unseenHits}/${res.unseenTotal}</b></div>
    ${coachBox('run2', r)}
    <h3 class="sech">${tr('thisTime')}</h3>
    ${SCENARIO_2.quiz.flags.map((id) => flagCard(id, res.hits.includes(id), true, SCENARIO_2.seen[id], 'run2')).join('')}
    ${demoLessons(SCENARIO_2.quiz.flags, SCENARIO_1.quiz.flags)}
    <button class="btn big primary" data-a="toRecovery">${tr('next')} →</button>`;
  },

  recovery: () => {
    const r1 = S.session.runs[1];
    const loss = r1.decision === 'buy' ? lossAt(r1.amount, SCENARIO_1.path[0], SCENARIO_1.path.at(-1)).loss : 0;
    const lossText = loss ? inr(loss) : tr('lost');
    const st = S.rc.stage;
    const flagsHtml = RECOVERY_SCAM.flags.map((f) => `<div class="mini"><b>⚠️ ${esc(L(FLAGS[f].title))}</b><p>${esc(L(FLAGS[f].explain))}</p></div>`).join('');
    return `
    <p class="sub">${tr('later')}</p>
    <div class="phone wa dark">
      <div class="ph-head"><div class="av">🏛️</div><div><b>${esc(L(RECOVERY_SCAM.from))}</b><small>${esc(RECOVERY_SCAM.number)}</small></div></div>
      <div class="chat-body"><div class="msg in"><p>${br(L(RECOVERY_SCAM.text)(lossText))}</p><time>11:20</time></div></div>
    </div>
    ${st === 'msg' ? `
      ${S.rc.checked ? `<section class="card"><h3>${tr('found')}</h3>${flagsHtml}</section>` : ''}
      <div class="stack">
        <button class="btn big dangerb" data-a="rcPay">${tr('send')}</button>
        ${S.rc.checked ? '' : `<button class="btn big" data-a="rcCheck">${tr('rcCheck')}</button>`}
        <button class="btn big primary" data-a="rcRefuse">${tr('refuse')}</button>
      </div>` : `
      <section class="card result ${st === 'paid' ? 'bad' : 'good'}">
        ${st === 'paid' ? `<h3>${tr('twice')}</h3><ol class="steps">${RECOVERY_SCAM.paid.map((s) => `<li>${esc(L(s))}</li>`).join('')}</ol>` : `<h3>${tr('wellDone')}</h3><p>${tr('feeRule')}</p>`}
        <p class="big-line">${esc(L(RECOVERY_SCAM.line))}</p>
      </section>
      ${S.rc.checked ? '' : `<section class="card"><h3>${tr('wrong')}</h3>${flagsHtml}</section>`}
      <button class="btn big primary" data-a="toHelp">${tr('ifLost')}</button>`}`;
  },

  help: () => `
    <h2>${tr('helpH')}</h2><p class="sub">${tr('helpSub')}</p>
    ${HELP.map((h) => `<section class="card acc ${S.helpOpen === h.id ? 'open' : ''}">
        <button class="acc-h" data-a="help" data-v="${h.id}">${esc(L(h.q))}<span>${S.helpOpen === h.id ? '−' : '+'}</span></button>
        ${S.helpOpen === h.id ? `<ul>${h.a.map((x) => `<li>${esc(L(x))}</li>`).join('')}</ul>` : ''}</section>`).join('')}
    <div class="warnbox">⚠️ ${esc(L(HELP_ALWAYS))}</div>
    <button class="btn big primary" data-a="toResults">${tr('results')}</button>`,

  results: () => {
    const rows = summary(S.session), rec = S.session.recovery.action;
    const missed = (S.session.runs[2].result?.missed || []).slice(0, 3);
    const improved = rows.filter((r) => r.better).length;
    const cell = (v) => (v === true ? tr('yes') : v === false ? tr('no') : v);
    return `
    <h2>${tr('resultH')}</h2>
    <p class="sub">${improved >= 2 ? tr('learned') : tr('keepGoing')}</p>
    <table class="cmp"><thead><tr><th></th><th>${tr('first')}</th><th>${tr('second')}</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${tr('r_' + r.key)}</td><td>${esc(cell(r.a))}</td><td class="${r.better ? 'better' : ''}">${esc(cell(r.b))}${r.better ? ' ✓' : ''}</td></tr>`).join('')}
      <tr><td>${tr('rec')}</td><td>—</td><td class="${rec === 'refuse' ? 'better' : ''}">${rec === 'refuse' ? tr('yes') + ' ✓' : tr('no')}</td></tr></tbody></table>
    ${coachBox('final')}
    <section class="setucard">
      <h3>${tr('card')}</h3><p>${tr('cardSub')}</p>
      <ol>${CHECK_QUESTIONS.map((q) => `<li>${esc(L(q))}</li>`).join('')}</ol>
      <p class="rule">${esc(L(CHECK_RULE))}</p>
      ${missed.length ? `<p class="miss"><b>${tr('missedYou')}</b> ${missed.map((m) => esc(L(FLAGS[m].title))).join(' · ')}</p>` : ''}
      <p class="miss">${tr('helpLine')}</p>
    </section>
    <div class="crow"><button class="btn" data-a="hearCheck">${tr('hear')}</button><button class="btn primary" data-a="replay">${tr('replay')}</button></div>
    <p class="fine center">${tr('localOnly')}</p>
    ${PILOT ? `<section class="card pilot"><h3>${tr('pilot')}</h3><pre>${esc(JSON.stringify(pilotRecord(S.session), null, 1))}</pre><button class="btn sm" data-a="copyPilot">${tr('copy')}</button> <span id="pilotmsg"></span></section>` : ''}
    <button class="btn ghost" data-a="guard">${tr('guardLink')}</button>`;
  },

  guard: () => `
    <h2>${tr('guardH')}</h2>
    <ul class="guard">${L(D.guard).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <button class="btn big" data-a="back">← ${tr('back')}</button>`,
};

// ── Builders ─────────────────────────────────────────────────
function chatScreen() {
  const c = scen().chat, msgs = messages();
  const shown = msgs.slice(0, S.chatShown), done = S.chatShown >= msgs.length;
  const intro = run() === 1 ? L(INTRO_BY_SOURCE[P().tipSource] || INTRO_BY_SOURCE.none) || tr('run1Intro') : tr('run2Intro');
  return `
  <p class="sub">${esc(intro)}</p>
  <div class="phone ${c.style}">
    <div class="ph-head"><div class="av">${c.style === 'tg' ? '🚀' : '👑'}</div><div><b>${esc(L(c.title))}</b><small>${esc(L(c.subtitle))}</small></div></div>
    ${c.info ? `<div class="ph-info">${esc(L(c.info))}</div>` : ''}
    <div class="chat-body">${shown.map((m, i) => msgBubble(m, i, c.time)).join('')}${!done ? '<div class="typing"><i></i><i></i><i></i></div>' : ''}</div>
  </div>
  ${done ? `<button class="btn big primary" data-a="openTrade">${tr('openApp')}</button>` : `<button class="btn ghost" data-a="showAll">${tr('showAll')}</button>`}`;
}
function msgBubble(m, i, time) {
  if (m.banner) return `<div class="msg in ${i === S.fresh ? 'fresh' : ''}"><span class="who">${esc(L(m.from))}</span>
      <div class="banner-card"><small>${esc(L(m.banner.brand))}</small><b>${esc(L(m.banner.line))}</b><span>${esc(L(m.banner.cta))}</span></div><time>${time}</time></div>`;
  return `<div class="msg in ${m.admin ? 'admin' : ''} ${i === S.fresh ? 'fresh' : ''}"><span class="who">${esc(L(m.from))}</span>
    ${m.proof ? `<div class="proof"><small>${esc(L(m.proof.label))}</small><b>${esc(m.proof.amount)}</b><span>▲ ▲ ▲</span></div>` : ''}
    <p>${br(L(m.text))}</p><time>${time}</time></div>`;
}

function tradeScreen() {
  const st = scen().stock;
  return `
  <div class="simbar">${tr('sim')}</div>
  <section class="card trade">
    <div class="shead"><span class="logo lg" style="--c:${run() === 1 ? '#3B82F6' : '#10B981'}">${st.code.slice(0, 2)}</span>
      <div><h1>${esc(st.name)}</h1><small class="muted">${st.code} · ${tr('fictional')}</small></div></div>
    <div class="sprice">₹${st.price.toFixed(2)}</div><div class="up schg">${esc(st.changeToday)} <span class="muted">1D</span></div>
    ${lineChart(st.history)}
    <p class="cap">${esc(L(st.historyLabel))}</p>
    ${!P().experienced ? `<p class="helper">💡 ${tr('helper')}</p>` : ''}
    <details class="biz"><summary>${tr('biz')}</summary>
      ${salesBars(st.sales, { unit: { hi: 'करोड़', mr: 'कोटी' }[lang()] || 'Cr' })}<p class="cap">${tr('sales')}</p><p class="cap">${esc(L(st.volumeNote))}</p>
    </details>
    <h3>${tr('howMuch')}</h3>
    <div class="chips">${STAKES.map((a) => `<button class="chip ${S.amount === a ? 'on' : ''}" data-a="amount" data-v="${a}">${inr(a)}</button>`).join('')}</div>
  </section>
  <div class="stack">
    <button class="btn big buyb" data-a="buy">${tr('buy', { amt: inr(S.amount) })}</button>
    <button class="btn big" data-a="check">${tr('checkFirst')}</button>
    <button class="btn ghost" data-a="decide" data-v="skip">${tr('noBuy')}</button>
  </div>`;
}

function overlay() {
  if (!S.sheet) return '';
  const anim = S.anim === 'sheet' ? 'anim' : '';
  if (S.sheet.kind === 'check') {
    const sc = scen(), half = Math.round(S.amount / 2);
    return `<div class="scrim ${anim}" data-a="closeSheet"></div>
    <section class="sheet ${anim}" role="dialog"><div class="grab"></div>
      <div class="sh-head"><b>✋ ${tr('checkTitle')}</b><button class="icon-btn" data-a="closeSheet">✕</button></div>
      ${checkItem('who', tr('q1'), L(sc.check.who))}${checkItem('sebi', tr('q2'), L(sc.check.sebi))}
      ${checkItem('fall', tr('q3'), tr('half', { a: inr(S.amount), h: inr(half) }))}
      <button class="btn big" data-a="closeSheet">${tr('close')}</button>
    </section>`;
  }
  const g = S.sheet.gate, amt = inr(S.amount);
  return `<div class="scrim ${anim}" data-a="closeSheet"></div>
    <section class="sheet ${anim}" role="dialog"><div class="grab"></div>
      <div class="sh-head"><b>${esc(scen().stock.name)} · ${amt}</b><button class="icon-btn" data-a="closeSheet">✕</button></div>
      ${gateHTML(g, { lang: lang() })}
      <button class="btn big buyb" data-a="place" ${decided(g) ? '' : 'disabled'}>${!decided(g) ? tr('needReason') : tr('placeBuy', { amt })}</button>
    </section>`;
}

function checkItem(k, q, a) {
  const open = S.checkOpen === k, seen = R().checksOpened.includes(k);
  return `<div class="acc ${open ? 'open' : ''}"><button class="acc-h" data-a="checkItem" data-v="${k}">${seen ? '✓ ' : ''}${esc(q)}<span>${open ? '−' : '+'}</span></button>${open ? `<p class="ans">${esc(a)}</p>` : ''}</div>`;
}

function quizScreen() {
  const opts = quizOptions(scen(), P().level);
  return `
  <h2>${tr('quizH')}</h2><p class="sub">${tr('quizSub')}</p>
  <div class="quiz">${opts.map((o) => `<button class="qopt ${S.quizSel.includes(o.id) ? 'on' : ''}" data-a="toggleQ" data-v="${o.id}"><span class="box">${S.quizSel.includes(o.id) ? '✓' : ''}</span>${esc(L(o.title))}</button>`).join('')}</div>
  <button class="btn big primary" data-a="submitQuiz">${S.quizSel.length ? tr('quizNext') : tr('quizNone')}</button>`;
}
function quizTitle(id) { return quizOptions(SCENARIO_1, 'fin').concat(quizOptions(SCENARIO_2, 'fin')).find((o) => o.id === id)?.title || id; }

function flagCard(id, caught, showNew, seenOverride, stage) {
  const f = FLAGS[id], ai = S.flagAI[id];
  const mine = S.coach[stage]?.data?.missed?.find((m) => m.id === id);
  const an = f.analogies?.[P().domain] || f.analogy;
  const seen = seenOverride || f.seen;
  return `<section class="card flag ${caught ? 'got' : 'miss'}">
    <div class="fh"><span class="pill ${caught ? 'ok' : 'no'}">${caught ? tr('got') : tr('missedP')}</span>${showNew && !f.taught ? `<span class="pill new">${tr('newTrick')}</span>` : ''}</div>
    <h4>${esc(L(f.title))}</h4>
    ${seen ? `<p class="seen">${tr('inMsg')}${esc(L(seen))}</p>` : ''}
    <p>${esc(L(f.explain))}</p>
    ${an ? `<p class="analogy">${tr('forYou')}${esc(L(an))}</p>` : ''}
    ${mine ? `<p class="aiout">${esc(mine.why)}</p>` : ''}
    ${ai?.text ? `<p class="aiout">${esc(ai.text)}</p><small class="ainote">${tr('aiBadge')}</small>` : ''}${ai?.note ? `<p class="note">${esc(ai.note)}</p>` : ''}
    <div class="crow"><button class="btn sm" data-a="hearFlag" data-v="${id}">${tr('hear')}</button>
      <button class="btn sm" data-a="aiFlag" data-v="${id}" ${ai?.loading ? 'disabled' : ''}>${ai?.loading ? '…' : tr('explainMe')}</button></div>
  </section>`;
}

// Flags met in this run → what to check next time, and where SEBI's site explains it (static, no AI).
// skip: flags whose lessons were already shown after the first run.
function demoLessons(flags, skip = []) {
  const done = new Set(skip.map((f) => DEMO_FLAG_LESSON[f]).filter(Boolean));
  const ids = pickFlagLessons(flags.map((f) => DEMO_FLAG_LESSON[f]).filter((id) => id && !done.has(id)), 3);
  if (!ids.length) return '';
  return `<h3 class="sech">${simT('flagWhere')}</h3>${ids.map((id) => lessonHTML(id, { t: simT, L, esc, lang: lang() })).join('')}`;
}

function coachBox(stage, r) {
  const c = S.coach[stage];
  if (!c || c.failed) return r?.reasonText ? `<section class="card coachbox"><p class="note">${tr('youSaid')}“${esc(r.reasonText)}”</p></section>` : '';
  if (c.loading) return `<section class="card coachbox"><b>${tr('aiCoach')}</b><p class="muted"><span class="dots">${tr('aiThinking')}</span></p><div class="skel w80"></div><div class="skel w60"></div></section>`;
  const d = c.data;
  return `<section class="card coachbox"><small class="cbadge">${tr('aiCoach')}</small><h3>${esc(d.title)}</h3>
    ${r?.reasonText ? `<p class="note">${tr('youSaid')}“${esc(r.reasonText)}”</p>` : ''}
    <p>${esc(d.message)}</p>${d.question ? `<p class="askq">🤔 ${esc(d.question)}</p>` : ''}
    ${d.nextTime?.length ? `<ol class="rules">${d.nextTime.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
    <small class="ainote">${tr('aiSrc', { p: prov(d.provider) })}</small></section>`;
}

function checkCard(title) {
  return `<section class="setucard"><h3>${title}</h3><ol>${CHECK_QUESTIONS.map((q) => `<li>${esc(L(q))}</li>`).join('')}</ol>
    <button class="btn sm ghostw" data-a="hearCheck">${tr('hear')}</button></section>`;
}

function askBox() {
  const a = S.ask;
  return `<section class="card ask"><h3>${tr('askH')}</h3>
    <div class="chips">${L(ASK_SUGGESTIONS).map((s, i) => `<button class="chip sm" data-a="suggest" data-v="${i}">${esc(s)}</button>`).join('')}</div>
    <div class="askrow"><input id="askq" value="${esc(a.q)}" placeholder="${tr('askPh')}" autocomplete="off">
      <button class="mic ${a.listening ? 'rec' : ''}" data-a="mic" aria-label="mic">${a.listening ? '⏹' : '🎤'}</button><button class="btn primary" data-a="ask">➤</button></div>
    ${a.listening ? `<p class="note">${tr('listening')}</p>` : ''}
    ${a.loading ? `<p class="say"><span class="dots">${tr('thinking')}</span></p>` : ''}
    ${a.a ? `<p class="say">${esc(a.a)}</p>${a.source === 'rule' ? `<small class="offnote">${tr('ruleBadge')}</small>` : a.source === 'ai' ? `<small class="ainote">${tr('aiBadge')}</small>` : ''}
      <div class="crow"><button class="btn sm" data-a="hearAnswer">${tr('hear')}</button></div>` : ''}
  </section>`;
}

// ── Boot ─────────────────────────────────────────────────────
initTheme();
voice.initVoice();
render();
health().then((h) => { S.aiOk = !!h?.ok; });
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((r) => r.update()).catch(() => {});
window.__demo = { S, go, A, latencySec };
