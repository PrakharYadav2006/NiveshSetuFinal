// Offline reasoning check — used only when the AI cannot be reached, so the pause still works
// with no network. It scores whether a reason covers the business, the risk and the size,
// and asks about the most important thing that is missing. Shared by browser and server.

const RX = {
  business: /(विक्री|नफा|नफ्या|व्यवसाय|धंदा|ग्राहक|कर्ज|उत्पादन|मागणी|पाऊस|बिक्री|सेल्स|मुनाफ़|मुनाफा|कमाई|कारोबार|बिज़नेस|बिजनेस|बनाती|बेचती|प्रोडक्ट|ग्राहक|कर्ज़|कर्ज|P\/?E|पी\/?ई|फ़ंडामेंटल|फंडामेंटल|sales|revenue|profit|earning|business|product|customer|debt|loan|fundamental|valuation|margin|demand|monsoon|मानसून|market share|growth|ग्रोथ)/i,
  risk: /(पडला|पडले|पडेल|तोटा|नुकसान|निम्मा|अर्धा|धोका|जोखीम|सहन|बुडाले|गिर|नुकसान|घाटा|जोखिम|रिस्क|आधा|सह\s?(सक|पा)|डूब|fall|drop|loss|lose|risk|half|afford|downside|worst|crash|stop.?loss)/i,
  plan: /(थोडे|थोडेच|थोडा|भाग|टक्के|वर्ष|ध्येय|योजना|वाटून|थोड़ा|थोडा|हिस्सा|प्रतिशत|%|लंबे|साल|लक्ष्य|प्लान|योजना|बाँट|बांट|small|part of|portion|percent|long.?term|years?|goal|plan|diversif|spread|only\s+\d|budget)/i,
  tip: /(मित्र|कोणीतरी|सांगितलं|सांगितले|सगळे|सगळ्यांनी|टिप|ग्रुप|whatsapp|telegram|youtube|यूट्यूब|दोस्त|किसी ने|सबने|सब कह|बताया|tip|group|friend|someone said|told me|everyone|influencer|channel)/i,
  hype: /(वेगाने|झपाट्याने|दुप्पट|भाग\s*रहा|भागा|भागेगा|भाग\s*रहे|दौड़|रॉकेट|🚀|तेज़ी से|जल्दी|दोगुना|गुना|मल्टीबैगर|running|rocket|shooting|fast|quick|double|\b\d+x\b|multibagger|moon|before it goes)/i,
  fear: /(भीती|घाबर|आणखी\s*पडेल|वाचवू|डर|घबरा|और गिरेगा|बचा लूँ|बचा लूं|scared|fear|panic|afraid|falling more|will fall|save what)/i,
  horizon: /(वर्ष|महिने|महिन्यां|दीर्घ|आठवडे|पर्यंत\s*ठेव|साल|महीने|लंबे|लम्बे|हफ़्ते|तक रख|years?|months?|long.?term|weeks?|horizon|till|until)/i,
};

// What a reason talks about (business, risk, plan, horizon, tip, hype, fear).
export const covers = (text) => Object.fromEntries(Object.entries(RX).map(([k, r]) => [k, r.test(String(text))]));

// ── The verdict card's "one tip for next time" is a CATEGORY, not free advice ──
// The server decides which categories are allowed for this order; the AI picks one and words it.
export const TIP_TYPES = ['use_fundamentals', 'check_news', 'verify_source', 'watchlist_wait', 'size_small', 'exit_plan', 'time_horizon', 'no_borrowed_money', 'diversify', 'compare_stated_reaction'];
export const TIP_TEXT = {
  use_fundamentals: { hi: 'रकम तय करने से पहले ⓘ खोलकर कंपनी का कर्ज़ और मुनाफ़ा देखें।', en: 'Before you decide the amount, open the ⓘ facts on the company’s debt and profit.', mr: 'रक्कम ठरवण्याआधी ⓘ उघडून कंपनीचं कर्ज आणि नफा पाहा.' },
  check_news: { hi: 'ख़बर पढ़ें तो देखें: यह किस दिन की है, और किसने कही है।', en: 'When you read a news item, check its date and who said it.', mr: 'बातमी वाचताना पाहा: ती कोणत्या दिवसाची आहे, आणि कोणी सांगितली आहे.' },
  verify_source: { hi: 'किसी टिप पर भरोसा करने से पहले पता करें कि बात कहाँ से शुरू हुई।', en: 'Before relying on a tip, find out where it came from.', mr: 'कोणत्याही टिपवर विश्वास ठेवण्याआधी, ही गोष्ट कुठून सुरू झाली ते शोधा.' },
  watchlist_wait: { hi: 'इसे ★ Watchlist में डालें और किसी और दिन फिर से देखें।', en: 'Put it on your ★ Watchlist and look at it again on another day.', mr: 'हे ★ Watchlist मध्ये टाका आणि दुसऱ्या एखाद्या दिवशी पुन्हा पाहा.' },
  size_small: { hi: 'कोई भी एक कंपनी अपने कुल पैसे का छोटा हिस्सा ही रखें।', en: 'Keep any one company a small part of your total money.', mr: 'कोणत्याही एका कंपनीत तुमच्या एकूण पैशांचा छोटा भागच ठेवा.' },
  exit_plan: { hi: 'पहले से लिख लें कि कितनी गिरावट पर आप दोबारा सोचेंगे।', en: 'Write down in advance what fall would make you rethink.', mr: 'आधीच लिहून ठेवा की किती घसरणीवर तुम्ही पुन्हा विचार कराल.' },
  time_horizon: { hi: 'लिख लें कि यह पैसा कितने समय तक बिना छुए रह सकता है।', en: 'Write down how long this money can stay untouched.', mr: 'हे पैसे किती काळ हात न लावता राहू शकतात, ते लिहून ठेवा.' },
  no_borrowed_money: { hi: 'निवेश के लिए उधार या इमरजेंसी की बचत का पैसा न लगाएँ।', en: 'Do not use loans or emergency savings for investing.', mr: 'गुंतवणुकीसाठी उधारीचे किंवा इमर्जन्सीसाठी ठेवलेल्या बचतीचे पैसे लावू नका.' },
  diversify: { hi: 'पैसा अलग-अलग तरह के कारोबारों में बाँटकर रखें।', en: 'Spread your money across different kinds of businesses.', mr: 'पैसे वेगवेगळ्या प्रकारच्या व्यवसायांमध्ये वाटून ठेवा.' },
  compare_stated_reaction: { hi: 'शुरू में आपने गिरावट पर जो करने को कहा था, उससे इस फ़ैसले की तुलना करें।', en: 'Compare this with the reaction you stated at the start of the game.', mr: 'सुरुवातीला घसरणीवर तुम्ही जे करणार असं सांगितलं होतं, त्याच्याशी या निर्णयाची तुलना करा.' },
};

// flagIds: from orderFlags() (simulator) — ctx.flagIds. has: what the reason text covers.
export function allowedTips({ side = 'buy', ctx = {}, has = {} }) {
  const f = new Set(ctx.flagIds || []);
  if (side === 'sell') return ['exit_plan', 'time_horizon', ...(ctx.inCrash ? ['compare_stated_reaction'] : [])];
  const out = ['use_fundamentals'];
  if (f.has('rumour_unconfirmed') || ctx.news) out.push('check_news');
  if (f.has('tip_source') || f.has('guaranteed_returns_claim') || has.tip || ctx.demo) out.push('verify_source');
  if (f.has('price_runup') || has.hype || ctx.run5 >= 15) out.push('watchlist_wait');
  if (f.has('concentration') || ctx.weightAfter > 0.25) out.push('size_small');
  if (!has.risk) out.push('exit_plan');
  if (!has.horizon) out.push('time_horizon');
  if (f.has('leverage_mtf') || ctx.lev > 1) out.push('no_borrowed_money');
  if (ctx.weightAfter > 0.4) out.push('diversify');
  return out;
}
const TIP_PRIORITY = ['no_borrowed_money', 'verify_source', 'watchlist_wait', 'size_small', 'diversify', 'check_news', 'compare_stated_reaction', 'exit_plan', 'time_horizon', 'use_fundamentals'];

// "What is missing or wrong" (about the reasoning, never the company), and for a strong reason,
// the one thing that would make it stronger. The card never says "nothing wrong".
const WRONG = {
  tip: { hi: 'आपका कारण किसी और की बात पर टिका है, आपकी अपनी जाँच पर नहीं।', en: 'Your reason rests on someone else’s word, not on your own checking.', mr: 'तुमचं कारण दुसऱ्या कोणाच्या बोलण्यावर अवलंबून आहे, तुमच्या स्वतःच्या तपासणीवर नाही.' },
  hype: { hi: 'आपका कारण भाव की तेज़ी पर है, कंपनी के कारोबार पर नहीं।', en: 'Your reason is about the price running up, not about the business.', mr: 'तुमचं कारण भाव वेगाने वाढण्यावर आहे, कंपनीच्या व्यवसायावर नाही.' },
  business: { hi: 'आपने यह नहीं बताया कि कंपनी क्या करती है या उसकी बिक्री-मुनाफ़ा कैसा है।', en: 'You have not said what the company does or how its sales and profit look.', mr: 'कंपनी काय करते किंवा तिची विक्री-नफा कसा आहे, हे तुम्ही सांगितलं नाही.' },
  lev: { hi: 'उधार के पैसे का जोखिम आपके कारण में नहीं है।', en: 'Your reason does not cover the risk of the borrowed money.', mr: 'उधारीच्या पैशांचा धोका तुमच्या कारणात नाही.' },
  risk: { hi: 'आपने यह नहीं सोचा कि भाव आधा हुआ तो क्या करेंगे।', en: 'You have not thought about what you would do if the price halved.', mr: 'भाव निम्मा झाला तर काय कराल, याचा तुम्ही विचार केला नाही.' },
  size: { hi: 'आपने यह नहीं बताया कि इतना बड़ा हिस्सा एक ही कंपनी में क्यों।', en: 'You have not said why so much of your money goes into one company.', mr: 'एवढा मोठा भाग एकाच कंपनीत का, हे तुम्ही सांगितलं नाही.' },
  plan: { hi: 'आपने यह नहीं लिखा कि इसे कितने समय रखेंगे।', en: 'You have not written how long you plan to keep it.', mr: 'हा शेअर किती काळ ठेवाल, हे तुम्ही लिहिलं नाही.' },
  fear: { hi: 'यह फ़ैसला गिरावट के डर से लगता है; कंपनी में क्या बदला, यह नहीं लिखा।', en: 'This looks driven by fear of the fall; you have not said what changed in the company.', mr: 'हा निर्णय घसरणीच्या भीतीने घेतल्यासारखा वाटतो; कंपनीत काय बदललं, ते लिहिलं नाही.' },
  sellWhy: { hi: 'आपने यह नहीं बताया कि बेचकर आप क्या पाना चाहते हैं।', en: 'You have not said what you want to achieve by selling.', mr: 'विकून तुम्हाला काय मिळवायचं आहे, हे तुम्ही सांगितलं नाही.' },
  stronger: { hi: 'और मज़बूत बनाने के लिए: लिख लें कि किस बात पर आप अपना फ़ैसला बदलेंगे।', en: 'To make it stronger: write down what would make you change your mind.', mr: 'अजून मजबूत करण्यासाठी: कोणत्या गोष्टीमुळे तुम्ही तुमचा निर्णय बदलाल, ते लिहून ठेवा.' },
  empty: { hi: 'अभी कोई कारण नहीं लिखा गया।', en: 'No reason has been written yet.', mr: 'अजून कोणतंही कारण लिहिलेलं नाही.' },
};

const Q = {
  tip: { hi: 'यह बात आपको किसने बताई, और क्या वह SEBI में रजिस्टर्ड है? उनकी बात के अलावा आपने ख़ुद क्या जाँचा?', en: 'Who told you this, and are they SEBI-registered? Apart from what they said, what did you check yourself?', mr: 'ही गोष्ट तुम्हाला कोणी सांगितली, आणि ते SEBI मध्ये रजिस्टर्ड आहेत का? त्यांच्या बोलण्याशिवाय तुम्ही स्वतः काय तपासलं?' },
  run: { hi: 'यह शेयर पिछले 5 दिन में {run}% चढ़ चुका है। आपके हिसाब से यह क्यों चढ़ा: कंपनी की कमाई से या सिर्फ़ चर्चा से?', en: 'This share has already risen {run}% in 5 days. Why do you think it rose: the company’s earnings, or just buzz?', mr: 'हा शेअर मागच्या 5 दिवसांत {run}% वाढला आहे. तुमच्या मते तो का वाढला: कंपनीच्या कमाईमुळे की फक्त चर्चेमुळे?' },
  business: { hi: 'यह कंपनी क्या बेचती है, और इसकी बिक्री और मुनाफ़ा बढ़ रहे हैं या घट रहे हैं?', en: 'What does this company sell, and are its sales and profit growing or shrinking?', mr: 'ही कंपनी काय विकते, आणि तिची विक्री आणि नफा वाढत आहेत की कमी होत आहेत?' },
  lev: { hi: 'आप उधार (MTF) से खरीद रहे हैं। भाव 25% गिरा तो आपका अपना पूरा पैसा ख़त्म। फिर आप क्या करेंगे?', en: 'You are buying with borrowed money (MTF). A 25% fall wipes out all your own money. What would you do then?', mr: 'तुम्ही उधारीवर (MTF) खरेदी करत आहात. भाव 25% घसरला तर तुमचे स्वतःचे सगळे पैसे संपतील. मग तुम्ही काय कराल?' },
  risk: { hi: 'अगर इसका भाव आधा हो जाए, तो आप पर क्या असर होगा? क्या आप वह सह सकते हैं?', en: 'If the price halves, what happens to you? Can you live with that?', mr: 'याचा भाव निम्मा झाला, तर तुमच्यावर काय परिणाम होईल? तुम्ही ते सहन करू शकाल का?' },
  size: { hi: 'इस ऑर्डर के बाद आपके पैसे का {w}% एक ही कंपनी में होगा। इतना क्यों?', en: 'After this order {w}% of your money would be in one company. Why that much?', mr: 'या ऑर्डरनंतर तुमच्या पैशांपैकी {w}% एकाच कंपनीत असतील. एवढे का?' },
  plan: { hi: 'आप इसे कितने समय के लिए रख रहे हैं, और किस बात पर बेचेंगे?', en: 'How long do you plan to hold it, and what would make you sell?', mr: 'तुम्ही हा शेअर किती काळासाठी ठेवणार आहात, आणि कोणत्या गोष्टीवर विकाल?' },
  fear: { hi: 'यह फ़ैसला कंपनी की किसी ख़बर की वजह से है, या आज की गिरावट के डर से? कंपनी में ऐसा क्या बदला?', en: 'Is this decision about something in the company, or about the fear of today’s fall? What changed in the company?', mr: 'हा निर्णय कंपनीच्या एखाद्या बातमीमुळे आहे, की आजच्या घसरणीच्या भीतीमुळे? कंपनीत असं काय बदललं?' },
  sellWhy: { hi: 'आप बेचकर क्या पाना चाहते हैं, और यह शेयर खरीदते समय आपने क्या सोचा था?', en: 'What do you want to achieve by selling, and what did you think when you bought this share?', mr: 'विकून तुम्हाला काय मिळवायचं आहे, आणि हा शेअर घेताना तुम्ही काय विचार केला होता?' },
  empty: { hi: 'अपने शब्दों में बताइए: आप यह फ़ैसला क्यों ले रहे हैं?', en: 'In your own words: why are you making this decision?', mr: 'तुमच्या शब्दांत सांगा: तुम्ही हा निर्णय का घेत आहात?' },
};
const GOOD = {
  business: { hi: 'आपने कंपनी के कारोबार को देखा है।', en: 'You looked at the company’s business.', mr: 'तुम्ही कंपनीचा व्यवसाय पाहिला आहे.' },
  risk: { hi: 'आपने नुकसान के बारे में सोचा है।', en: 'You thought about the downside.', mr: 'तुम्ही तोट्याचा विचार केला आहे.' },
  plan: { hi: 'आपके पास एक योजना है।', en: 'You have a plan.', mr: 'तुमच्याकडे एक योजना आहे.' },
  none: { hi: 'आपने कारण लिखा, यह अच्छी शुरुआत है।', en: 'You wrote a reason down; that is a good start.', mr: 'तुम्ही कारण लिहिलं, ही चांगली सुरुवात आहे.' },
};
const fill = (s, v) => s.replace('{run}', v.run).replace('{w}', v.w);

// ctx: { run5, weightAfter (0-1), lev, inCrash, demo (scripted tip scenario) }
export function offlineEvaluate({ text = '', thread = [], lang = 'hi', side = 'buy', ctx = {} }) {
  const L = (o) => o[lang] || o.hi;
  const all = [text, ...thread.map((t) => t.a || '')].join(' ').trim();
  const has = covers(all);
  const flags = [];
  if (has.tip) flags.push('tip');
  if (has.hype || (side === 'buy' && ctx.run5 >= 15)) flags.push('fomo');
  if (ctx.demo && !has.business) flags.push('tip');
  if (side === 'sell' && has.fear) flags.push('fear');
  if (ctx.lev > 1) flags.push('leverage');
  if (ctx.weightAfter > 0.4) flags.push('concentration');

  if (all.length < 6) { const tt = allowedTips({ side, ctx, has })[0]; return { verdict: 'weak', score: 5, right: '', wrong: L(WRONG.empty), tip_type: tt, tip: L(TIP_TEXT[tt]), good: '', gap: '', question: L(Q.empty), flags, source: 'offline' }; }

  let score = 25 + (has.business ? 25 : 0) + (has.risk ? 20 : 0) + (has.plan ? 15 : 0) + (all.length >= 60 ? 15 : all.length >= 30 ? 8 : 0);
  if (has.tip) score -= 30;
  if (has.hype) score -= 20;
  if (side === 'buy' && ctx.lev > 1 && !has.risk) score -= 15;
  if (side === 'sell' && has.fear && !has.business) score -= 25;
  score = Math.max(0, Math.min(100, score));

  const v = { run: Math.round(ctx.run5 || 0), w: Math.round((ctx.weightAfter || 0) * 100) };
  let q;
  if (side === 'sell') q = has.fear && !has.business ? Q.fear : !has.business ? Q.sellWhy : null;
  else if (has.tip || (ctx.demo && !has.business)) q = Q.tip;
  else if (ctx.run5 >= 15 && !has.business) q = Q.run;
  else if (!has.business) q = Q.business;
  else if (ctx.lev > 1 && !has.risk) q = Q.lev;
  else if (!has.risk) q = Q.risk;
  else if (ctx.weightAfter > 0.4 && !has.plan) q = Q.size;
  else if (!has.plan) q = Q.plan;

  const verdict = score >= 70 && !q ? 'sound' : score >= 70 ? 'partly' : score >= 45 ? 'partly' : 'weak';
  const goodKey = side === 'sell' && has.fear && !has.business ? 'none' : has.business ? 'business' : has.risk ? 'risk' : has.plan ? 'plan' : 'none';
  const wrongKey = verdict === 'sound' ? 'stronger'
    : side === 'sell' ? (has.fear && !has.business ? 'fear' : !has.business ? 'sellWhy' : !has.risk ? 'risk' : 'plan')
    : has.tip || ctx.demo && !has.business ? 'tip' : has.hype && !has.business ? 'hype' : !has.business ? 'business' : ctx.lev > 1 && !has.risk ? 'lev' : !has.risk ? 'risk' : ctx.weightAfter > 0.4 && !has.plan ? 'size' : 'plan';
  const allowed = allowedTips({ side, ctx, has });
  const tipType = TIP_PRIORITY.find((t) => allowed.includes(t) && (t !== 'compare_stated_reaction' || has.fear)) || allowed[0];
  const right = L(GOOD[goodKey]), wrong = L(WRONG[wrongKey]);
  return { verdict, score, right, wrong, tip_type: tipType, tip: L(TIP_TEXT[tipType]), good: right, gap: wrong, question: q ? fill(L(q), v) : '', flags, source: 'offline' };
}
