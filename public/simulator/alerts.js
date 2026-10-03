// "Set an Alert": rules that are checked the moment a new market day opens.
//   Simple alert → only a notification (in the app + the phone's own notification).
//   Alert Trigger Order (ATO) → when the rule is met, the order is placed automatically.
//     The reason for an ATO is checked when it is SET (same reasoning check as any order),
//     so the decision is made calmly, in advance — never in the heat of the moment.
// Everything is local: no server, no email, no account. Pretend money only.
import { STOCKS } from './data.js';
import { px, quote, range, volume, avgVolume, sma } from './engine.js';
import { L, inr } from './i18n.js';

export const MAX_ACTIVE = 10;

// Condition types. needs: 'price' (₹), 'pct' (%), 'mult' (× average volume) or null.
export const CONDS = [
  { id: 'price_above', needs: 'price', group: 'price' },
  { id: 'price_below', needs: 'price', group: 'price' },
  { id: 'up_pct', needs: 'pct', group: 'change' },
  { id: 'down_pct', needs: 'pct', group: 'change' },
  { id: 'vol_spike', needs: 'mult', group: 'volume' },
  { id: 'above_sma20', needs: null, group: 'tech' },
  { id: 'below_sma20', needs: null, group: 'tech' },
  { id: 'high_3m', needs: null, group: 'tech' },
  { id: 'low_3m', needs: null, group: 'tech' },
];
export const condOf = (id) => CONDS.find((c) => c.id === id);

// Is the rule met on `day`? (Called for each new day after the alert was set.)
export function isMet({ code, cond, value }, M, day) {
  const p = px(M, code, day);
  switch (cond) {
    case 'price_above': return p >= value;
    case 'price_below': return p <= value;
    case 'up_pct': return quote(M, code, day).pct >= value;
    case 'down_pct': return quote(M, code, day).pct <= -value;
    case 'vol_spike': return volume(M, code, day) >= value * avgVolume(M, code, day);
    case 'above_sma20': return px(M, code, day - 1) < sma(M, code, day - 1) && p >= sma(M, code, day);
    case 'below_sma20': return px(M, code, day - 1) > sma(M, code, day - 1) && p <= sma(M, code, day);
    case 'high_3m': return p > range(M, code, day - 1, 60).hi;
    case 'low_3m': return p < range(M, code, day - 1, 60).lo;
    default: return false;
  }
}

// A sensible starting value for each condition (the player can change it).
export function defaultValue(cond, M, code, day) {
  const p = px(M, code, day);
  const round = (x) => (x >= 100 ? Math.round(x) : Math.round(x * 2) / 2);
  return { price_above: round(p * 1.05), price_below: round(p * 0.95), up_pct: 5, down_pct: 5, vol_spike: 2 }[cond] ?? null;
}

// Check every active alert for the new day. Returns the alerts that fired (one-shot).
export function evaluate(alerts, M, day) {
  const fired = [];
  for (const a of alerts) {
    if (a.status !== 'active' || day <= a.createdDay) continue;
    if (isMet(a, M, day)) { a.status = 'triggered'; a.triggeredDay = day; a.triggeredPrice = px(M, a.code, day); fired.push(a); }
  }
  return fired;
}

// ── Text (Hindi / English / Marathi) ──
export const AS = {
  setAlert: { hi: '🔔 अलर्ट लगाएँ', en: '🔔 Set an alert', mr: '🔔 अलर्ट लावा' },
  alerts: { hi: 'अलर्ट', en: 'Alerts', mr: 'अलर्ट' },
  intro: { hi: 'एक नियम तय करें। जैसे ही नया दिन खुलेगा और नियम पूरा होगा, आपको ऐप में और फ़ोन पर सूचना मिलेगी। दिन भर स्क्रीन देखने की ज़रूरत नहीं।', en: 'Set a rule. The moment a new day opens and the rule is met, you get a notice in the app and on your phone. No need to stare at the screen all day.', mr: 'एक नियम ठरवा. नवा दिवस उघडताच नियम पूर्ण झाला की तुम्हाला ॲपमध्ये आणि फोनवर सूचना मिळेल. दिवसभर स्क्रीन बघत बसायची गरज नाही.' },
  when: { hi: 'कब बताएँ?', en: 'When should we tell you?', mr: 'केव्हा सांगायचं?' },
  g_price: { hi: 'भाव', en: 'Price', mr: 'भाव' },
  g_change: { hi: 'एक दिन का बदलाव', en: 'One-day change', mr: 'एका दिवसाचा बदल' },
  g_volume: { hi: 'वॉल्यूम (कितने शेयर बिके)', en: 'Volume (shares traded)', mr: 'व्हॉल्यूम (किती शेअरची खरेदी-विक्री झाली)' },
  g_tech: { hi: 'तकनीकी स्तर', en: 'Technical levels', mr: 'तांत्रिक पातळ्या' },
  c_price_above: { hi: 'भाव इससे ऊपर जाए', en: 'Price goes above', mr: 'भाव याच्या वर गेला तर' },
  c_price_below: { hi: 'भाव इससे नीचे आए', en: 'Price falls below', mr: 'भाव याच्या खाली आला तर' },
  c_up_pct: { hi: 'एक दिन में इतना % चढ़े', en: 'Rises this % in a day', mr: 'एका दिवसात इतके % वाढला तर' },
  c_down_pct: { hi: 'एक दिन में इतना % गिरे', en: 'Falls this % in a day', mr: 'एका दिवसात इतके % पडला तर' },
  c_vol_spike: { hi: 'वॉल्यूम 20 दिन के औसत का इतने गुना हो', en: 'Volume is this many times its 20-day average', mr: 'व्हॉल्यूम 20 दिवसांच्या सरासरीच्या इतके पट झाला तर' },
  c_above_sma20: { hi: 'भाव 20 दिन के औसत से ऊपर निकले', en: 'Price crosses above its 20-day average', mr: 'भाव 20 दिवसांच्या सरासरीच्या वर गेला तर' },
  c_below_sma20: { hi: 'भाव 20 दिन के औसत से नीचे आए', en: 'Price crosses below its 20-day average', mr: 'भाव 20 दिवसांच्या सरासरीच्या खाली आला तर' },
  c_high_3m: { hi: '3 महीने का नया ऊँचा भाव', en: 'Makes a new 3-month high', mr: '3 महिन्यांचा नवा उच्चांक' },
  c_low_3m: { hi: '3 महीने का नया निचला भाव', en: 'Makes a new 3-month low', mr: '3 महिन्यांचा नवा नीचांक' },
  d_price_above: { hi: 'भाव {v} से ऊपर गया', en: 'price went above {v}', mr: 'भाव {v} च्या वर गेला' },
  d_price_below: { hi: 'भाव {v} से नीचे आया', en: 'price fell below {v}', mr: 'भाव {v} च्या खाली आला' },
  d_up_pct: { hi: 'एक दिन में {v} या ज़्यादा चढ़ा', en: 'rose {v} or more in a day', mr: 'एका दिवसात {v} किंवा जास्त वाढला' },
  d_down_pct: { hi: 'एक दिन में {v} या ज़्यादा गिरा', en: 'fell {v} or more in a day', mr: 'एका दिवसात {v} किंवा जास्त पडला' },
  d_vol_spike: { hi: 'वॉल्यूम 20 दिन के औसत का {v} या ज़्यादा', en: 'volume {v} or more of its 20-day average', mr: 'व्हॉल्यूम 20 दिवसांच्या सरासरीच्या {v} किंवा जास्त' },
  d_above_sma20: { hi: 'भाव 20 दिन के औसत से ऊपर निकला', en: 'price crossed above its 20-day average', mr: 'भाव 20 दिवसांच्या सरासरीच्या वर गेला' },
  d_below_sma20: { hi: 'भाव 20 दिन के औसत से नीचे आया', en: 'price crossed below its 20-day average', mr: 'भाव 20 दिवसांच्या सरासरीच्या खाली आला' },
  d_high_3m: { hi: '3 महीने का नया ऊँचा भाव', en: 'new 3-month high', mr: '3 महिन्यांचा नवा उच्चांक' },
  d_low_3m: { hi: '3 महीने का नया निचला भाव', en: 'new 3-month low', mr: '3 महिन्यांचा नवा नीचांक' },
  u_price: { hi: '₹', en: '₹', mr: '₹' }, u_pct: { hi: '%', en: '%', mr: '%' }, u_mult: { hi: 'गुना', en: '×', mr: 'पट' },
  now: { hi: 'अभी: {v}', en: 'Now: {v}', mr: 'आत्ता: {v}' },
  avg20: { hi: '20 दिन का औसत भाव {v}', en: '20-day average {v}', mr: '20 दिवसांची सरासरी {v}' },
  volNow: { hi: 'आज का वॉल्यूम औसत का {v} गुना', en: 'Today’s volume is {v}× its average', mr: 'आजचा व्हॉल्यूम सरासरीच्या {v} पट' },
  alreadyTrue: { hi: 'यह नियम आज ही पूरा है। अलर्ट कल से जाँचा जाएगा।', en: 'This rule is already true today. The alert is checked from tomorrow.', mr: 'हा नियम आजच पूर्ण आहे. अलर्ट उद्यापासून तपासला जाईल.' },
  type: { hi: 'अलर्ट का प्रकार', en: 'Alert type', mr: 'अलर्टचा प्रकार' },
  simple: { hi: 'सिर्फ़ सूचना', en: 'Simple alert', mr: 'फक्त सूचना' },
  simpleSub: { hi: 'बताएगा, कुछ करेगा नहीं', en: 'Only tells you', mr: 'फक्त सांगेल, काही करणार नाही' },
  ato: { hi: 'अलर्ट ट्रिगर ऑर्डर (ATO)', en: 'Alert Trigger Order (ATO)', mr: 'अलर्ट ट्रिगर ऑर्डर (ATO)' },
  atoSub: { hi: 'नियम पूरा होते ही ऑर्डर अपने-आप', en: 'Places the order by itself', mr: 'नियम पूर्ण होताच ऑर्डर आपोआप' },
  atoBuy: { hi: 'तब खरीदें', en: 'Then buy', mr: 'तेव्हा घ्या' },
  atoSell: { hi: 'तब बेचें', en: 'Then sell', mr: 'तेव्हा विका' },
  atoNote: { hi: 'ATO उस दिन के भाव पर चलता है। भाव अचानक उछले या गिरे, तो सौदा आपके तय भाव से बुरे भाव पर भी हो सकता है। ATO सिर्फ़ अपने पैसे से (MTF नहीं)।', en: 'An ATO runs at that day’s price. If the price jumps or drops suddenly, the trade can happen at a worse price than your level. ATO uses your own money only (no MTF).', mr: 'ATO त्या दिवसाच्या भावाने चालतो. भाव अचानक वाढला किंवा पडला, तर व्यवहार तुमच्या ठरवलेल्या भावापेक्षा वाईट भावाने होऊ शकतो. ATO फक्त स्वतःच्या पैशांनी (MTF नाही).' },
  atoWhy: { hi: 'ATO का कारण अभी, शांत दिमाग से लिखें। बाद में ऑर्डर बिना पूछे चलेगा।', en: 'Write the reason for the ATO now, while you are calm. Later the order runs without asking.', mr: 'ATO चं कारण आत्ताच, शांतपणे लिहा. नंतर ऑर्डर न विचारता चालेल.' },
  save: { hi: 'अलर्ट लगाएँ', en: 'Set alert', mr: 'अलर्ट लावा' },
  saveAto: { hi: 'ATO लगाएँ', en: 'Set ATO', mr: 'ATO लावा' },
  needValue: { hi: 'एक मान डालें', en: 'Enter a value', mr: 'एक किंमत भरा' },
  needQty: { hi: 'कितने शेयर, चुनें', en: 'Choose how many shares', mr: 'किती शेअर, ते निवडा' },
  needReason: { hi: 'पहले कारण जाँचें', en: 'Check your reason first', mr: 'आधी कारण तपासा' },
  tooMany: { hi: 'एक साथ ज़्यादा से ज़्यादा 10 अलर्ट।', en: 'At most 10 active alerts at a time.', mr: 'एकावेळी जास्तीत जास्त 10 अलर्ट.' },
  saved: { hi: '🔔 अलर्ट लग गया', en: '🔔 Alert set', mr: '🔔 अलर्ट लावला' },
  none: { hi: 'अभी कोई अलर्ट नहीं। किसी कंपनी के पेज पर 🔔 दबाएँ।', en: 'No alerts yet. Tap 🔔 on any company’s page.', mr: 'अजून एकही अलर्ट नाही. कोणत्याही कंपनीच्या पानावर 🔔 दाबा.' },
  active: { hi: 'चालू', en: 'Active', mr: 'चालू' },
  fired: { hi: 'पूरा हुआ', en: 'Triggered', mr: 'पूर्ण झाला' },
  cancelled: { hi: 'रद्द', en: 'Cancelled', mr: 'रद्द' },
  failed: { hi: 'ऑर्डर नहीं हुआ', en: 'Order not placed', mr: 'ऑर्डर झाला नाही' },
  cancel: { hi: 'रद्द करें', en: 'Cancel', mr: 'रद्द करा' },
  setOn: { hi: 'दिन {d} को लगाया', en: 'Set on day {d}', mr: 'दिवस {d} ला लावला' },
  firedOn: { hi: 'दिन {d}, भाव {p}', en: 'Day {d}, price {p}', mr: 'दिवस {d}, भाव {p}' },
  popTitle: { hi: '🔔 आपका अलर्ट', en: '🔔 Your alert', mr: '🔔 तुमचा अलर्ट' },
  popAto: { hi: 'ATO चला: {side} {q} शेयर {p} पर', en: 'ATO ran: {side} {q} shares at {p}', mr: 'ATO चालला: {side} {q} शेअर {p} ला' },
  popFail: { hi: 'ATO नहीं चला: {why}', en: 'ATO did not run: {why}', mr: 'ATO चालला नाही: {why}' },
  why_cash: { hi: 'उतना नकद नहीं था', en: 'not enough cash', mr: 'तेवढी रोख नव्हती' },
  why_none: { hi: 'बेचने के लिए शेयर नहीं थे', en: 'no shares left to sell', mr: 'विकायला शेअर नव्हते' },
  why_mix: { hi: 'यह शेयर MTF पर है, ATO सिर्फ़ अपने पैसे वाला', en: 'this holding is on MTF; ATO is own-money only', mr: 'हा शेअर MTF वर आहे; ATO फक्त स्वतःच्या पैशांचा' },
  buyW: { hi: 'खरीदा', en: 'Bought', mr: 'घेतले' },
  sellW: { hi: 'बेचा', en: 'Sold', mr: 'विकले' },
  notifyOn: { hi: 'फ़ोन पर सूचना चालू करें', en: 'Turn on phone notifications', mr: 'फोनवर सूचना चालू करा' },
  notifyOff: { hi: 'फ़ोन की सूचना बंद है; अलर्ट ऐप में दिखेगा।', en: 'Phone notifications are off; alerts will show in the app.', mr: 'फोनवरील सूचना बंद आहेत; अलर्ट ॲपमध्ये दिसेल.' },
  practice: { hi: 'अभ्यास · नकली पैसा', en: 'Practice · pretend money', mr: 'सराव · सरावाचे पैसे' },
  tagAto: { hi: 'ATO', en: 'ATO', mr: 'ATO' },
  ok: { hi: 'ठीक है', en: 'OK', mr: 'ठीक आहे' },
};
export function at(key, vars = {}) { let s = L(AS[key]) || key; for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v); return s; }

// "Rocket Infra · price went above ₹45"
export function describe(a) {
  const name = STOCKS.find((s) => s.code === a.code)?.name.replace(' Ltd', '') || a.code;
  const c = condOf(a.cond);
  const v = c.needs === 'price' ? inr(a.value, a.value < 100 ? 2 : 0) : c.needs === 'pct' ? `${a.value}%` : c.needs === 'mult' ? `${a.value}×` : '';
  return `${name} · ${at('d_' + a.cond, { v })}`;
}
