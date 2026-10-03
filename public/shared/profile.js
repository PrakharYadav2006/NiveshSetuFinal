// Language + onboarding questions + how answers change the app. Shared by the simulator,
// the Telegram demo and the server (which only reads the derived profile fields).

export const LANGS = [
  { id: 'hi', label: 'हिंदी', sub: 'Hindi' },
  { id: 'en', label: 'English', sub: 'अंग्रेज़ी' },
  { id: 'mr', label: 'मराठी', sub: 'Marathi' },
];

// ── Onboarding questions (asked AFTER language) ──────────────
export const QUESTIONS = [
  {
    id: 'name', type: 'text', optional: true,
    q: { hi: 'आपको किस नाम से बुलाएँ?', en: 'What should we call you?', mr: 'तुम्हाला कोणत्या नावाने हाक मारू?' },
    why: { hi: 'ताकि कोच आपसे बात कर सके। नाम इस फ़ोन से बाहर नहीं जाता।', en: 'So the coach can talk to you. Your name never leaves this phone.', mr: 'म्हणजे कोच तुमच्याशी बोलू शकेल. नाव या फोनबाहेर जात नाही.' },
    placeholder: { hi: 'जैसे: रमेश', en: 'e.g. Ramesh', mr: 'उदा.: रमेश' },
  },
  {
    id: 'age', type: 'single',
    q: { hi: 'आपकी उम्र क्या है?', en: 'What is your age group?', mr: 'तुमचं वय किती आहे?' },
    options: [
      ['18-25', { hi: '18 से 25', en: '18 to 25', mr: '18 ते 25' }],
      ['26-35', { hi: '26 से 35', en: '26 to 35', mr: '26 ते 35' }],
      ['36-50', { hi: '36 से 50', en: '36 to 50', mr: '36 ते 50' }],
      ['50+', { hi: '50 से ज़्यादा', en: 'Above 50', mr: '50 पेक्षा जास्त' }],
    ],
  },
  {
    id: 'edu', type: 'single',
    q: { hi: 'आपकी पढ़ाई कहाँ तक हुई है?', en: 'How far have you studied?', mr: 'तुमचं शिक्षण कुठपर्यंत झालं आहे?' },
    why: { hi: 'इससे तय होता है कि हम बातें कितनी आसान भाषा में समझाएँ।', en: 'This decides how simply we explain things.', mr: 'यावरून ठरतं की आम्ही गोष्टी किती सोप्या भाषेत समजावू.' },
    options: [
      ['school', { hi: 'स्कूल की कुछ पढ़ाई (10वीं से कम)', en: 'Some schooling (below Class 10)', mr: 'शाळेचं थोडं शिक्षण (10वी पेक्षा कमी)' }],
      ['10', { hi: '10वीं पास', en: 'Class 10 pass', mr: '10वी पास' }],
      ['12', { hi: '12वीं पास', en: 'Class 12 pass', mr: '12वी पास' }],
      ['iti', { hi: 'ITI, डिप्लोमा या कोई तकनीकी कोर्स', en: 'ITI, diploma or a vocational course', mr: 'ITI, डिप्लोमा किंवा एखादा तांत्रिक कोर्स' }],
      ['grad', { hi: 'ग्रेजुएट (आर्ट्स, साइंस या कोई और विषय)', en: 'Graduate (Arts, Science or another subject)', mr: 'पदवीधर (आर्ट्स, सायन्स किंवा इतर विषय)' }],
      ['grad_fin', { hi: 'ग्रेजुएट: कॉमर्स, अर्थशास्त्र या फ़ाइनेंस', en: 'Graduate in Commerce, Economics or Finance', mr: 'पदवीधर: कॉमर्स, अर्थशास्त्र किंवा फायनान्स' }],
      ['pro', { hi: 'पोस्ट-ग्रेजुएट या प्रोफ़ेशनल (CA, MBA, इंजीनियर, डॉक्टर…)', en: 'Postgraduate or professional (CA, MBA, engineer, doctor…)', mr: 'पदव्युत्तर किंवा प्रोफेशनल (CA, MBA, इंजिनिअर, डॉक्टर…)' }],
    ],
  },
  {
    id: 'work', type: 'single',
    q: { hi: 'आप क्या काम करते हैं?', en: 'What do you do for a living?', mr: 'तुम्ही काय काम करता?' },
    why: { hi: 'ताकि मिसालें आपकी अपनी ज़िंदगी से हों।', en: 'So our examples come from your own life.', mr: 'म्हणजे उदाहरणं तुमच्या स्वतःच्या आयुष्यातली असतील.' },
    options: [
      ['farm', { hi: 'खेती-किसानी', en: 'Farming', mr: 'शेती' }],
      ['shop', { hi: 'दुकान या अपना छोटा काम', en: 'Shop or my own small business', mr: 'दुकान किंवा स्वतःचा छोटा धंदा' }],
      ['job', { hi: 'नौकरी (सरकारी या प्राइवेट)', en: 'Salaried job (government or private)', mr: 'नोकरी (सरकारी किंवा खाजगी)' }],
      ['daily', { hi: 'दिहाड़ी, ड्राइवर या डिलीवरी का काम', en: 'Daily wage, driving or delivery work', mr: 'रोजंदारी, ड्रायव्हर किंवा डिलिव्हरीचं काम' }],
      ['home', { hi: 'घर सँभालना', en: 'Running the home', mr: 'घर सांभाळणं' }],
      ['student', { hi: 'पढ़ाई', en: 'Student', mr: 'शिक्षण' }],
      ['retired', { hi: 'रिटायर्ड', en: 'Retired', mr: 'निवृत्त' }],
    ],
  },
  {
    id: 'sources', type: 'multi',
    q: { hi: 'शेयर के बारे में आप कहाँ से सुनते हैं?', en: 'Where do you hear about stocks?', mr: 'शेअरबद्दल तुम्ही कुठून ऐकता?' },
    hint: { hi: 'जितने सही हों, सब चुनें', en: 'Pick all that apply', mr: 'जेवढे लागू असतील, ते सगळे निवडा' },
    options: [
      ['groups', { hi: 'WhatsApp / Telegram ग्रुप', en: 'WhatsApp / Telegram groups', mr: 'WhatsApp / Telegram ग्रुप' }],
      ['social', { hi: 'YouTube / Instagram वाले', en: 'YouTube / Instagram creators', mr: 'YouTube / Instagram वाले' }],
      ['people', { hi: 'दोस्त, रिश्तेदार, साथ काम करने वाले', en: 'Friends, family or colleagues', mr: 'मित्र, नातेवाईक, सोबत काम करणारे' }],
      ['app', { hi: 'ब्रोकर ऐप के सुझाव', en: 'Suggestions inside broker apps', mr: 'ब्रोकर ॲपचे सुचवलेले' }],
      ['news', { hi: 'अख़बार / TV', en: 'Newspaper / TV', mr: 'वर्तमानपत्र / TV' }],
      ['none', { hi: 'अभी कहीं से नहीं', en: 'Nowhere yet', mr: 'अजून कुठूनच नाही' }],
    ],
  },
  {
    id: 'done', type: 'multi',
    q: { hi: 'अब तक पैसे कहाँ लगाए हैं?', en: 'Where have you put money so far?', mr: 'आतापर्यंत पैसे कुठे लावले आहेत?' },
    hint: { hi: 'जितने सही हों, सब चुनें', en: 'Pick all that apply', mr: 'जेवढे लागू असतील, ते सगळे निवडा' },
    options: [
      ['bank', { hi: 'बचत खाता / FD / RD', en: 'Savings account / FD / RD', mr: 'बचत खातं / FD / RD' }],
      ['gold', { hi: 'सोना', en: 'Gold', mr: 'सोनं' }],
      ['insurance', { hi: 'LIC / बीमा', en: 'LIC / insurance', mr: 'LIC / विमा' }],
      ['mf', { hi: 'म्यूचुअल फंड / SIP', en: 'Mutual funds / SIP', mr: 'म्युच्युअल फंड / SIP' }],
      ['stocks', { hi: 'शेयर', en: 'Shares', mr: 'शेअर' }],
      ['fno', { hi: 'F&O या इंट्राडे ट्रेडिंग', en: 'F&O or intraday trading', mr: 'F&O किंवा इंट्राडे ट्रेडिंग' }],
      ['nothing', { hi: 'अभी कहीं नहीं', en: 'Nothing yet', mr: 'अजून कुठेच नाही' }],
    ],
  },
  {
    id: 'goal', type: 'single',
    q: { hi: 'पैसा लगाने का सबसे बड़ा कारण क्या है?', en: 'What is your main reason to invest?', mr: 'पैसे लावण्याचं सगळ्यात मोठं कारण काय?' },
    options: [
      ['family', { hi: 'बच्चों की पढ़ाई या शादी', en: "Children's education or wedding", mr: 'मुलांचं शिक्षण किंवा लग्न' }],
      ['asset', { hi: 'घर, ज़मीन या गाड़ी', en: 'A home, land or vehicle', mr: 'घर, जमीन किंवा गाडी' }],
      ['old', { hi: 'बुढ़ापे के लिए', en: 'For old age', mr: 'म्हातारपणासाठी' }],
      ['fast', { hi: 'जल्दी से ज़्यादा कमाई', en: 'Quick extra income', mr: 'लवकर जास्त कमाई' }],
      ['learn', { hi: 'बस सीखना है', en: 'I just want to learn', mr: 'फक्त शिकायचं आहे' }],
    ],
  },
  {
    id: 'react', type: 'single',
    q: { hi: 'मान लीजिए आपने ₹10,000 लगाए और एक हफ़्ते में ₹7,000 रह गए। आप क्या करेंगे?', en: 'Say you invested ₹10,000 and a week later it is worth ₹7,000. What would you do?', mr: 'समजा तुम्ही ₹10,000 लावले आणि एका आठवड्यात ₹7,000 उरले. तुम्ही काय कराल?' },
    why: { hi: 'खेल के अंत में हम देखेंगे कि आपने सच में क्या किया।', en: "At the end we'll compare this with what you actually do.", mr: 'खेळाच्या शेवटी आपण पाहू की तुम्ही खरंच काय केलं.' },
    options: [
      ['sell', { hi: 'तुरंत सब बेच दूँगा / दूँगी', en: 'Sell everything right away', mr: 'लगेच सगळं विकेन' }],
      ['wait', { hi: 'रुककर कारण समझूँगा / समझूँगी', en: 'Pause and find out why', mr: 'थांबून कारण समजून घेईन' }],
      ['buy', { hi: 'और खरीदूँगा / खरीदूँगी, सस्ता मिल रहा है', en: 'Buy more, it is cheaper now', mr: 'आणखी घेईन, स्वस्त मिळतंय' }],
      ['unsure', { hi: 'पता नहीं', en: "I don't know", mr: 'माहीत नाही' }],
    ],
  },
  {
    id: 'amount', type: 'single',
    q: { hi: 'खेल में कितने (नकली) पैसों से शुरू करें?', en: 'How much (pretend) money do you want to start with?', mr: 'खेळात किती (सरावाच्या) पैशांनी सुरुवात करायची?' },
    why: { hi: 'उतना चुनें जितना आप सच में लगाने की सोचते हैं, ताकि खेल असली लगे।', en: 'Pick what you would really think of investing, so it feels real.', mr: 'जेवढे पैसे तुम्ही खरंच लावायचा विचार करता तेवढे निवडा, म्हणजे खेळ खरा वाटेल.' },
    options: [
      ['10000', { hi: '₹10,000', en: '₹10,000', mr: '₹10,000' }],
      ['50000', { hi: '₹50,000', en: '₹50,000', mr: '₹50,000' }],
      ['100000', { hi: '₹1,00,000', en: '₹1,00,000', mr: '₹1,00,000' }],
      ['500000', { hi: '₹5,00,000', en: '₹5,00,000', mr: '₹5,00,000' }],
    ],
  },
  {
    id: 'learn', type: 'single',
    q: { hi: 'आप कैसे समझना पसंद करते हैं?', en: 'How do you prefer to learn?', mr: 'तुम्हाला कसं समजून घ्यायला आवडतं?' },
    options: [
      ['voice', { hi: '🔊 सुनकर', en: '🔊 By listening', mr: '🔊 ऐकून' }],
      ['read', { hi: '📖 पढ़कर', en: '📖 By reading', mr: '📖 वाचून' }],
      ['both', { hi: '🔊📖 दोनों', en: '🔊📖 Both', mr: '🔊📖 दोन्ही' }],
    ],
  },
];

// ── The player's name: one source of truth ──
// The name stays on this phone. It is never sent to the AI (safeProfile() strips it).
const NAME_KEY = 'ns_name';
let playerName = '';
try { playerName = cleanName(localStorage.getItem(NAME_KEY) || ''); } catch {}
export function cleanName(raw) {
  const s = String(raw ?? '');
  if (s === 'undefined' || s === 'null') return '';
  return s.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24).trim();
}
export function setPlayerName(raw) {
  playerName = cleanName(raw);
  try { playerName ? localStorage.setItem(NAME_KEY, playerName) : localStorage.removeItem(NAME_KEY); } catch {}
  return playerName;
}
export const getPlayerName = () => playerName;
// For display: capitalise the first Latin letter; Devanagari is left untouched.
export const displayName = (n = playerName) => (/^[a-z]/.test(n) ? n[0].toUpperCase() + n.slice(1) : n);

// Turn answers into how the app behaves.
export function buildProfile(lang, a) {
  const level = ['school', '10', '12'].includes(a.edu) ? 'basic' : ['iti', 'grad'].includes(a.edu) ? 'mid' : 'fin';
  const domain = { farm: 'farm', shop: 'shop', job: 'job', daily: 'job', retired: 'job', home: 'home', student: 'student' }[a.work] || 'shop';
  const done = a.done || [];
  const sources = a.sources || [];
  return {
    lang, answers: a, name: displayName(cleanName(a.name)),
    work: a.work || '', sources, age: a.age || '',
    level, domain,
    experienced: done.includes('stocks') || done.includes('fno'),
    fno: done.includes('fno'),
    newbie: !done.some((d) => ['mf', 'stocks', 'fno'].includes(d)),
    tipSource: sources.includes('groups') ? 'groups' : sources.includes('social') ? 'social' : sources.includes('people') ? 'people' : 'news',
    voiceAuto: a.learn !== 'read',
    startCash: Number(a.amount || 50000),
    stake: Number(a.stake || 20000),
    allowLeverage: done.includes('stocks') || done.includes('fno'),
    stated: a.react || 'unsure',
    goal: a.goal || 'learn',
  };
}

// The Telegram demo asks a shorter set, plus how much the player would put on a "sure" tip.
export const STAKE_Q = {
  id: 'stake', type: 'single',
  q: { hi: 'अगर कोई "पक्की" टिप मिले, तो आप उसमें कितना लगाने की सोचेंगे?', en: 'If you got a "sure-shot" tip, how much would you think of putting in?', mr: 'एखादी "पक्की" टिप मिळाली, तर तुम्ही त्यात किती पैसे लावायचा विचार कराल?' },
  why: { hi: 'खेल में नुकसान-फ़ायदा इसी रकम पर दिखेगा, ताकि असली लगे। पैसा नकली है।', en: 'The game shows gains and losses on this amount so it feels real. The money is pretend.', mr: 'खेळात नफा-तोटा याच रकमेवर दिसेल, म्हणजे खरं वाटेल. पैसे सरावाचे आहेत.' },
  options: [
    ['5000', { hi: '₹5,000', en: '₹5,000', mr: '₹5,000' }],
    ['20000', { hi: '₹20,000', en: '₹20,000', mr: '₹20,000' }],
    ['50000', { hi: '₹50,000', en: '₹50,000', mr: '₹50,000' }],
    ['100000', { hi: '₹1,00,000', en: '₹1,00,000', mr: '₹1,00,000' }],
  ],
};
export const DEMO_QUESTIONS = ['name', 'edu', 'work', 'sources', 'done'].map((id) => QUESTIONS.find((q) => q.id === id)).concat([STAKE_Q, QUESTIONS.find((q) => q.id === 'learn')]);
