// The personalised coach: same facts, different language level, examples from the user's life.
// It explains and asks; it never tells anyone to buy or sell.
import { CONCEPTS, ANALOGIES, TRENDING, QUESTIONS, STOCKS, COACH_EVENTS } from './data.js';
import { L, t, lang, inr } from './i18n.js';

// Address the player by name: "Ravi जी," (Hindi), "Ravi," (English), "Ravi," (Marathi).
const hello = (p) => (p.name ? (lang() === 'hi' ? `${p.name} जी, ` : `${p.name}, `) : '');

export function conceptText(id, p) {
  const c = CONCEPTS[id];
  if (!c) return '';
  if (p.level === 'fin') return L(c.fin);
  if (p.level === 'mid') return `${L(c.basic)} ${L(c.term)}`;
  return L(c.basic);
}
export const analogy = (id, p) => (ANALOGIES[id] ? L(ANALOGIES[id][p.domain] || ANALOGIES[id].shop) : '');

function card(id, concept, p, extra = {}) {
  return {
    id, concept, event: COACH_EVENTS.includes(id) ? id : null,
    title: extra.title || L(CONCEPTS[concept]?.title),
    lead: extra.lead || '',
    body: conceptText(concept, p),
    analogy: extra.noAnalogy ? '' : analogy(concept, p),
    quote: extra.quote || null,
    tone: extra.tone || 'calm',
  };
}

const answerLabel = (qid, val) => {
  const q = QUESTIONS.find((x) => x.id === qid);
  const o = q?.options.find(([v]) => v === val);
  return o ? L(o[1]) : '';
};
const stockName = (code) => STOCKS.find((s) => s.code === code)?.name || code;

export const COACH = {
  welcome: (p) => ({
    id: 'welcome', event: 'welcome', concept: 'volatility', tone: 'calm',
    title: L({ hi: `नमस्ते${p.name ? ' ' + p.name + ' जी' : ''}! 👋`, en: `Welcome${p.name ? ', ' + p.name : ''}! 👋`, mr: `नमस्कार${p.name ? ' ' + p.name : ''}! 👋` }),
    lead: L({
      hi: `यह आपका अपना बाज़ार है, ${inr(p.startCash)} नकली पैसों के साथ। 20 दिन चलेगा। कंपनियाँ देखें, चाहें तो खरीदें-बेचें, फिर नीचे "अगला दिन" दबाएँ। आख़िर में आपकी आदतों की रिपोर्ट मिलेगी।`,
      en: `This is your own market, with ${inr(p.startCash)} of pretend money. It runs for 20 days. Look at companies, buy or sell if you want, then tap "Next day" below. At the end you get a report on your habits.`,
      mr: `हा तुमचा स्वतःचा बाजार आहे, ${inr(p.startCash)} सरावाच्या पैशांसह. तो 20 दिवस चालेल. कंपन्या पाहा, हवं तर शेअर घ्या किंवा विका, मग खाली "पुढचा दिवस" दाबा. शेवटी तुमच्या सवयींचा रिपोर्ट मिळेल.`,
    }),
    body: conceptText('volatility', p),
    analogy: '',
  }),
  trending: (p) => {
    const tr = TRENDING[p.tipSource];
    return card('trending', 'chasing', p, {
      title: L({ hi: 'एक मैसेज आया है 📩', en: 'You got a message 📩', mr: 'एक मेसेज आला आहे 📩' }),
      quote: { from: L(tr.from), text: L(tr.text) },
      lead: L({ hi: 'ऐसी चर्चा का मतलब यह नहीं कि भाव आगे भी बढ़ेगा। कंपनी की सेहत (ⓘ) ख़ुद देखें।', en: 'Buzz like this does not mean the price will keep rising. Check the company’s fundamentals (ⓘ) yourself.', mr: 'अशा चर्चेचा अर्थ असा नाही की भाव पुढेही वाढेल. कंपनीची स्थिती (ⓘ) स्वतः पाहा.' }),
      tone: 'warn',
    });
  },
  chasing: (p, x) => card('chasing', 'chasing', p, {
    lead: hello(p) + L({ hi: `${stockName(x.code)} पिछले 5 दिन में ${Math.round(x.run)}% चढ़ चुका है।`, en: `${stockName(x.code)} has already risen ${Math.round(x.run)}% in 5 days.`, mr: `${stockName(x.code)} गेल्या 5 दिवसांत आधीच ${Math.round(x.run)}% वाढला आहे.` }),
    tone: 'warn',
  }),
  tip: (p) => card('tip', 'research', p, {
    title: L({ hi: 'टिप पर खरीदा', en: 'Bought on a tip', mr: 'टिपवरून घेतलं' }),
    lead: L({ hi: 'अगली बार पूछें: यह टिप देने वाला SEBI में रजिस्टर्ड है? उसे इससे क्या फ़ायदा?', en: 'Next time ask: is the person giving this tip SEBI-registered? What do they gain from it?', mr: 'पुढच्या वेळी विचारा: ही टिप देणारा SEBI कडे रजिस्टर्ड आहे का? त्याला यातून काय फायदा?' }),
    noAnalogy: true,
  }),
  concentration: (p, x) => card('concentration', 'diversify', p, {
    lead: hello(p) + L({ hi: `आपकी पूँजी का ${Math.round(x.w * 100)}% अब सिर्फ़ ${stockName(x.code)} में है।`, en: `${Math.round(x.w * 100)}% of your money is now in ${stockName(x.code)} alone.`, mr: `तुमच्या पैशांपैकी ${Math.round(x.w * 100)}% आता फक्त ${stockName(x.code)} मध्ये आहेत.` }),
    tone: 'warn',
  }),
  leverage: (p, x) => card('leverage', 'leverage', p, {
    lead: L({
      hi: `आपके ${inr(x.own)} से ${inr(x.value)} के शेयर। भाव 25% गिरा तो आपके ${inr(x.own)} ख़त्म।`,
      en: `Your ${inr(x.own)} buys ${inr(x.value)} of shares. A 25% fall wipes out your ${inr(x.own)}.`,
      mr: `तुमच्या ${inr(x.own)} मधून ${inr(x.value)} चे शेअर. भाव 25% पडला तर तुमचे ${inr(x.own)} संपले.`,
    }),
    tone: 'warn',
  }),
  crash: (p) => card('crash', 'crash', p, {
    title: L({ hi: '📉 बाज़ार गिर रहा है', en: '📉 The market is falling', mr: '📉 बाजार पडतो आहे' }),
    lead: L({
      hi: `${hello(p)}शुरू में आपने कहा था: "${answerLabel('react', p.stated)}"। कोई जल्दी नहीं, सोचकर फ़ैसला करें।`,
      en: `${p.name ? hello(p) + 'at' : 'At'} the start you said: "${answerLabel('react', p.stated)}". No rush. Decide calmly.`,
      mr: `${hello(p)}सुरुवातीला तुम्ही म्हणाला होता: "${answerLabel('react', p.stated)}". घाई नाही, विचार करून निर्णय घ्या.`,
    }),
    tone: 'down',
  }),
  panic: (p) => card('panic', 'crash', p, {
    title: L({ hi: 'डर में बेचा', en: 'Sold in fear', mr: 'भीतीने विकलं' }),
    lead: L({ hi: 'बेचना हमेशा ग़लत नहीं। फ़र्क़ बस इतना है: फ़ैसला कंपनी की वजह से हुआ या डर की वजह से?', en: 'Selling is not always wrong. The question is: was this decision about the company, or about fear?', mr: 'विकणं नेहमीच चूक नसतं. प्रश्न एवढाच: हा निर्णय कंपनीमुळे घेतला की भीतीमुळे?' }),
    tone: 'down',
  }),
  margincall: (p, x) => card('margincall', 'margincall', p, {
    title: L({ hi: '⚠️ मार्जिन कॉल', en: '⚠️ Margin call', mr: '⚠️ मार्जिन कॉल' }),
    lead: L({ hi: `ब्रोकर ने आपके ${stockName(x.code)} के सारे शेयर बेच दिए। आपके अपने पैसे में से ${inr(x.lost)} गए।`, en: `Your broker sold all your ${stockName(x.code)} shares. You lost ${inr(x.lost)} of your own money.`, mr: `ब्रोकरने तुमचे ${stockName(x.code)} चे सगळे शेअर विकले. तुमच्या स्वतःच्या पैशांपैकी ${inr(x.lost)} गेले.` }),
    tone: 'down', noAnalogy: true,
  }),
  debt: (p) => card('debt', 'debt', p, {
    title: L({ hi: 'कर्ज़ की ख़बर', en: 'News about debt', mr: 'कर्जाची बातमी' }),
    lead: L({ hi: 'Vikram Ispat पर बहुत कर्ज़ था और बिक्री घट रही थी। गिरते बाज़ार में यही सबसे पहले टूटता है।', en: 'Vikram Ispat had heavy debt and falling sales. In a falling market, this is what breaks first.', mr: 'Vikram Ispat वर खूप कर्ज होतं आणि विक्री घटत होती. पडत्या बाजारात हेच सगळ्यात आधी तुटतं.' }),
    tone: 'down', noAnalogy: true,
  }),
};

// Goal-linked line for the report (education, not advice)
const GOAL = {
  fast: { hi: 'आपका लक्ष्य "जल्दी ज़्यादा कमाई" है। यही लक्ष्य लोगों को टिप, उधार और भागते शेयरों की ओर धकेलता है, और इस खेल में आपने देखा कि वहाँ क्या होता है।', en: 'Your goal is "quick extra income". That goal is what pushes people towards tips, borrowing and running prices, and you saw what happened there in this game.', mr: 'तुमचं ध्येय "लवकर जास्त कमाई" आहे. हेच ध्येय लोकांना टिप, उधार आणि वेगाने वाढणाऱ्या शेअरकडे ढकलतं, आणि या खेळात तिथे काय होतं ते तुम्ही पाहिलं.' },
  learn: { hi: 'आप सीखने आए थे। अगली बार अलग फ़ैसले लेकर देखिए कि नतीजा कैसे बदलता है।', en: 'You came to learn. Next time, try different decisions and see how the result changes.', mr: 'तुम्ही शिकायला आला होता. पुढच्या वेळी वेगळे निर्णय घेऊन पाहा, निकाल कसा बदलतो.' },
  other: { hi: 'आपका लक्ष्य एक तय समय पर पैसे की ज़रूरत वाला है। ऐसे पैसे पर बड़ी गिरावट सबसे भारी पड़ती है, इसलिए जोखिम उतना ही लें जितना सह सकें।', en: 'Your goal needs money at a fixed time. A big fall hurts most on money like that, so only take the risk you can bear.', mr: 'तुमच्या ध्येयासाठी ठरलेल्या वेळी पैसे लागतील. अशा पैशांवर मोठी घसरण सगळ्यात जास्त त्रास देते, म्हणून जेवढा धोका सहन करू शकता तेवढाच घ्या.' },
};
export const goalLine = (p) => L(GOAL[p.goal] || GOAL.other);

// Pick the 3 lessons that matter most for THIS player.
export function pickLessons(m) {
  const out = [];
  if (m.marginCalls || m.leverage) out.push('leverage');
  if (m.maxWeight.w > 0.4) out.push('diversify');
  if (m.chasedHype || m.tipBuys) out.push('chasing');
  if (m.panicSells || m.actual === 'sell') out.push('crash');
  if (m.researchPct !== null && m.researchPct < 60) out.push('research');
  for (const c of ['research', 'diversify', 'crash', 'volatility']) if (out.length < 3 && !out.includes(c)) out.push(c);
  return out.slice(0, 3);
}
