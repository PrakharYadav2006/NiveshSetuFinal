// ─────────────────────────────────────────────────────────────
// निवेश सेतु (NiveshSetu) — all scenario content in one place.
// Bilingual: every user-visible string is { hi, en }.
// Shared by the browser app AND the server (server reads fact
// cards from here, so the client can never inject its own "facts").
// Every company, person, group, UPI ID and phone number is FICTIONAL.
// ─────────────────────────────────────────────────────────────

export const APP = {
  name: { hi: 'निवेश सेतु', en: 'NiveshSetu' },
  tagline: { hi: 'टिप और टैप के बीच का पुल', en: 'The bridge between a tip and a tap' },
  team: { hi: 'घोटाला विरोधी', en: 'Ghotala Virodhi' },
};

// ── Red flags (the rule engine's catalogue) ──────────────────
// taught: explained in the debrief after run 1.
// taught:false → only appears in run 2, to test transfer to NEW tricks.
// analogies: one everyday comparison per user background (personalisation).
export const FLAGS = {
  guaranteed: {
    title: { hi: 'पक्के मुनाफ़े का वादा', en: 'Promise of sure profit' },
    seen: { hi: '"3 गुना, 100% पक्का मुनाफ़ा"', en: '"3x, 100% sure profit"' },
    explain: {
      hi: 'शेयर बाज़ार में कोई भी पक्का मुनाफ़ा नहीं दे सकता। SEBI में रजिस्टर्ड सलाहकार भी गारंटी नहीं दे सकते। जो "पक्का" बोले, वह आपको फँसा रहा है।',
      en: 'Nobody can give sure profit in the share market. Even SEBI-registered advisors cannot give a guarantee. Whoever says "sure" is trapping you.',
    },
    analogy: {
      hi: 'जैसे कोई बोले "यह बीज बोओ, 7 दिन में 3 गुना फ़सल पक्की" — मौसम, मिट्टी, कुछ भी पक्का नहीं होता।',
      en: 'Like someone saying "Sow this seed, 3 times the crop in 7 days, guaranteed" — weather, soil, nothing is ever sure.',
    },
    analogies: {
      farm: {
        hi: 'मंडी में कल क्या भाव मिलेगा, यह कोई पक्का नहीं बता सकता। जो पक्का बताए, वह झूठ बोल रहा है।',
        en: 'Nobody can promise what price the mandi will give tomorrow. Anyone who promises it is lying.',
      },
      shop: {
        hi: 'कोई दुकानदार पक्का नहीं कह सकता कि अगले हफ़्ते बिक्री 3 गुना होगी। जो कहे, वह सपने बेच रहा है।',
        en: 'No shopkeeper can promise that next week\'s sales will be 3 times more. Whoever says so is selling dreams.',
      },
      job: {
        hi: 'कोई बोले "₹999 दो, अगले महीने तनख़्वाह पक्की 3 गुना" — क्या आप मानेंगे?',
        en: 'If someone said "Pay ₹999 and your salary will surely be 3 times next month", would you believe it?',
      },
      home: {
        hi: 'घर का बजट भी कभी पक्का नहीं चलता — कभी बीमारी, कभी मेहमान। शेयर का भाव तो उससे भी कम पक्का होता है।',
        en: 'Even a home budget never goes exactly to plan — sometimes illness, sometimes guests. A share price is even less sure.',
      },
      student: {
        hi: 'कोई बोले "₹999 दो, 100% पक्का टॉप करोगे" — ऐसी गारंटी तो कोई टीचर भी नहीं देता।',
        en: 'If someone says "Pay ₹999, you will 100% top the exam" — even your teacher can\'t promise that.',
      },
    },
    taught: true,
  },
  urgency: {
    title: { hi: '"जल्दी करो, सिर्फ़ आज"', en: '"Hurry, only today"' },
    seen: {
      hi: '"सिर्फ़ आज! 10 बजे के बाद यह भाव नहीं मिलेगा"',
      en: '"Only today! After 10 o\'clock you won\'t get this price"',
    },
    explain: {
      hi: 'जल्दी इसलिए करवाते हैं ताकि आप सोचें नहीं, किसी से पूछें नहीं। सही मौका 10 मिनट में भाग नहीं जाता।',
      en: 'They rush you so that you don\'t think and don\'t ask anyone. A real chance does not run away in 10 minutes.',
    },
    analogy: {
      hi: 'मेले का ठग भी यही बोलता है — "आखिरी पीस है, अभी लो वरना गया।"',
      en: 'The cheat at the mela says the same thing — "Last piece, take it now or it\'s gone."',
    },
    analogies: {
      farm: {
        hi: 'कोई बोले "10 मिनट में खेत का सौदा करो, वरना गया" — समझदार किसान पहले खेत देखता है, कागज़ जाँचता है।',
        en: 'If someone says "Sign the land deal in 10 minutes or lose it" — a wise farmer first sees the field and checks the papers.',
      },
      shop: {
        hi: 'थोक वाला बोले "आज ही सारा माल उठाओ, कल नहीं मिलेगा" — अच्छा व्यापारी पहले माल जाँचता है।',
        en: 'A wholesaler says "Take all the stock today, it\'s gone tomorrow" — a good trader checks the goods first.',
      },
      job: {
        hi: 'कोई कॉल करके बोले "अभी OTP बताओ वरना खाता बंद" — जल्दी मचाना ठगी का पुराना तरीका है।',
        en: 'A caller says "Tell me the OTP now or your account will close" — rushing you is an old fraud trick.',
      },
      home: {
        hi: 'दरवाज़े पर सेल्समैन बोले "यह ऑफ़र सिर्फ़ अभी के लिए" — समझदार घर वाले कहते हैं, "सोचकर बताएँगे।"',
        en: 'A salesman at the door says "This offer is only for right now" — a sensible family says, "We\'ll think and tell you."',
      },
      student: {
        hi: 'कोई बोले "अभी फ़ॉर्म भरो, 5 मिनट में लिंक बंद" — असली एडमिशन में ऐसी हड़बड़ी नहीं होती।',
        en: 'Someone says "Fill the form now, the link closes in 5 minutes" — real admissions never rush you like this.',
      },
    },
    taught: true,
  },
  paid_group: {
    title: { hi: 'पैसे देकर "प्रीमियम" ग्रुप', en: 'Paying to join a "premium" group' },
    seen: { hi: '"प्रीमियम ग्रुप ₹999, UPI पर भेजो"', en: '"Premium group ₹999, send on UPI"' },
    explain: {
      hi: 'असली कमाई टिप बेचने से हो रही है, शेयर से नहीं। और पैसा किसी के निजी UPI पर जा रहा है, किसी कंपनी के खाते में नहीं।',
      en: 'The real earning is from selling tips, not from shares. And the money goes to someone\'s personal UPI, not to a company\'s account.',
    },
    analogy: {
      hi: 'जिसे सच में खज़ाने का रास्ता पता हो, वह ₹999 में नक्शा क्यों बेचेगा?',
      en: 'If someone really knew the way to a treasure, why would he sell the map for ₹999?',
    },
    analogies: {
      farm: {
        hi: 'जिसे पक्का पता हो कि कौन सी फ़सल सोना बनेगी, वह खुद बोएगा — ₹999 में आपको राज़ क्यों बेचेगा?',
        en: 'If a man really knew which crop would turn to gold, he would grow it himself. Why sell you the secret for ₹999?',
      },
      shop: {
        hi: 'जिसकी दुकान सच में खूब चल रही हो, वह "कमाई का तरीका" बेचने नहीं निकलता।',
        en: 'A shopkeeper whose shop is really doing well does not go around selling "ways to earn".',
      },
      job: {
        hi: 'जो रोज़ लाखों कमा रहा हो, उसे आपके ₹999 की क्या ज़रूरत? उसकी असली कमाई आपकी फ़ीस ही है।',
        en: 'Someone earning lakhs every day doesn\'t need your ₹999. Your fee is his real income.',
      },
      home: {
        hi: 'कोई अजनबी घर आकर बोले "₹999 दो, बताऊँगा खज़ाना कहाँ गड़ा है" — आप हँसेंगे। यह वही बात है।',
        en: 'A stranger comes home and says "Give me ₹999, I\'ll tell you where the treasure is buried" — you would laugh. This is the same thing.',
      },
      student: {
        hi: 'जो "पक्के सवाल" ₹999 में बेचे, उसके पास असली पेपर नहीं होता। उसकी कमाई आपकी फ़ीस है।',
        en: 'A person selling "sure-shot exam questions" for ₹999 doesn\'t have the real paper. Your fee is his income.',
      },
    },
    taught: true,
  },
  unregistered: {
    title: { hi: 'SEBI रजिस्ट्रेशन नहीं', en: 'No SEBI registration' },
    seen: { hi: '"राजू भाई" — न असली नाम, न SEBI नंबर', en: '"Raju Bhai" — no real name, no SEBI number' },
    explain: {
      hi: 'शेयर की सलाह देने वाले को SEBI में रजिस्टर्ड होना ज़रूरी है। असली सलाहकार अपना नाम और SEBI रजिस्ट्रेशन नंबर बताते हैं — और फिर भी मुनाफ़ा पक्का नहीं होता।',
      en: 'Anyone giving share advice must be registered with SEBI. Real advisors tell you their name and SEBI registration number — and even then, profit is not sure.',
    },
    analogy: {
      hi: 'बिना डिग्री वाला आदमी डॉक्टर बनकर दवा दे, तो क्या आप लेंगे?',
      en: 'If a man with no degree acts like a doctor and gives you medicine, would you take it?',
    },
    analogies: {
      farm: {
        hi: 'बिना लाइसेंस वाले से खाद-दवाई लेंगे? नकली निकली तो फ़सल भी गई, और शिकायत किससे करेंगे?',
        en: 'Would you buy fertiliser from someone with no licence? If it\'s fake, the crop is gone — and whom will you complain to?',
      },
      shop: {
        hi: 'बिना GST नंबर और पक्के बिल वाले सप्लायर पर आप भरोसा नहीं करते। SEBI नंबर भी वैसा ही है।',
        en: 'You don\'t trust a supplier with no GST number and no proper bill. A SEBI number works the same way.',
      },
      job: {
        hi: 'नौकरी का ऑफ़र बिना कंपनी के नाम-पते के आए, तो आप जाँचते हैं। सलाहकार का SEBI नंबर भी वैसे ही जाँचिए।',
        en: 'If a job offer comes with no company name or address, you check it. Check an advisor\'s SEBI number the same way.',
      },
      home: {
        hi: 'बिना पहचान-पत्र वाले "बिजली वाले" को आप घर का मीटर नहीं खोलने देते। पैसों की सलाह देने वाले की पहचान भी ज़रूरी है।',
        en: 'You don\'t let a "meter man" with no ID card open your meter. Someone giving money advice also needs a proper ID.',
      },
      student: {
        hi: 'बिना मान्यता वाले कॉलेज की डिग्री किसी काम की नहीं। बिना SEBI रजिस्ट्रेशन वाले की सलाह भी वैसी ही है।',
        en: 'A degree from an unrecognised college is of no use. Advice from someone not registered with SEBI is the same.',
      },
    },
    taught: true,
  },
  fake_proof: {
    title: { hi: 'मुनाफ़े के स्क्रीनशॉट, "थैंक यू भाई"', en: 'Profit screenshots, "Thank you Bhai"' },
    seen: { hi: '"1.8 लाख बना लिए 🙏 आपने ज़िंदगी बदल दी"', en: '"Made 1.8 lakh 🙏 You changed my life"' },
    explain: {
      hi: 'मुनाफ़े का स्क्रीनशॉट 2 मिनट में नकली बन जाता है। ग्रुप के कई "सदस्य" ठग के अपने लोग होते हैं, ताकि आपको लगे सब कमा रहे हैं।',
      en: 'A fake profit screenshot can be made in 2 minutes. Many "members" of the group are the fraudster\'s own people, so that you feel everyone is earning.',
    },
    analogy: {
      hi: 'जैसे दुकान के बाहर नकली ग्राहक भीड़ लगाकर बोलें, "बहुत बढ़िया माल है, जल्दी लो!"',
      en: 'Like fake customers crowding outside a shop and saying, "Great stuff, buy it fast!"',
    },
    analogies: {
      farm: {
        hi: 'बीज वाला दूसरे गाँव के "खुश किसानों" की फ़ोटो दिखाए — पर क्या आपने वह खेत खुद देखा?',
        en: 'A seed seller shows photos of "happy farmers" from another village — but did you see that field yourself?',
      },
      shop: {
        hi: 'ऑनलाइन दुकान के 5-स्टार रिव्यू खरीदे भी जा सकते हैं। ग्रुप के "थैंक यू" मैसेज भी वैसे ही हैं।',
        en: 'An online shop\'s 5-star reviews can be bought. The "thank you" messages in the group are the same.',
      },
      job: {
        hi: 'नकली ऑफ़र लेटर भी बिल्कुल असली जैसा दिखता है। मुनाफ़े का स्क्रीनशॉट भी वैसे ही बनता है।',
        en: 'A fake job offer letter looks just like a real one. Profit screenshots are made the same way.',
      },
      home: {
        hi: 'रिश्ते की बात में सिर्फ़ फ़ोटो देखकर हाँ नहीं करते, घर-परिवार जाँचते हैं। स्क्रीनशॉट देखकर भी पैसा मत लगाइए।',
        en: 'For a marriage proposal, you don\'t say yes just by seeing a photo — you check the family. Don\'t invest just by seeing a screenshot.',
      },
      student: {
        hi: 'फ़ोन के ऐप से कोई भी 2 मिनट में 100/100 वाली नकली मार्कशीट बना सकता है। मुनाफ़े का स्क्रीनशॉट भी वैसे ही बनता है।',
        en: 'With a phone app, anyone can make a fake 100/100 marksheet in 2 minutes. Profit screenshots are made the same way.',
      },
    },
    taught: true,
  },
  price_vs_business: {
    title: { hi: 'भाव 3 गुना, कारोबार वही', en: 'Price 3x, business the same' },
    seen: {
      hi: 'भाव 30 दिन में ₹14 से ₹42, बिक्री 3 साल से ₹12 करोड़',
      en: 'Price ₹14 to ₹42 in 30 days, sales stuck at ₹12 crore for 3 years',
    },
    explain: {
      hi: 'कंपनी की बिक्री बढ़ी ही नहीं, फिर भी भाव 3 गुना हो गया और खरीद-बिक्री 20 गुना। मतलब कुछ लोग मिलकर भाव चढ़ा रहे थे।',
      en: 'The company\'s sales did not grow at all, yet the price became 3 times and buying-selling became 20 times. That means some people were pushing the price up together.',
    },
    analogy: {
      hi: 'दुकान वही, माल वही, पर उसकी कीमत अचानक 3 गुना — क्योंकि कुछ लोग आपस में ही ऊँची बोली लगा रहे हैं।',
      en: 'Same shop, same goods, but its price is suddenly 3 times — because some people are bidding high among themselves.',
    },
    analogies: {
      farm: {
        hi: 'खेत वही, पैदावार वही, पर कोई अचानक उसकी कीमत 3 गुना लगाए — तो पूछिए, बदला क्या?',
        en: 'Same field, same harvest, but suddenly someone offers 3 times the price — ask, what changed?',
      },
      shop: {
        hi: 'आपकी दुकान की बिक्री वही है, पर कोई उसे 3 गुना दाम पर खरीदने को तैयार है — कुछ तो गड़बड़ है।',
        en: 'Your shop\'s sales are the same, but someone wants to buy it at 3 times the price — something is wrong.',
      },
      job: {
        hi: 'तनख़्वाह 3 साल से वही, काम वही। कोई बोले आपकी कीमत 3 गुना हो गई — तो क्या सच में कुछ बदला?',
        en: 'Same salary for 3 years, same work. If someone says your value is now 3 times, did anything really change?',
      },
      home: {
        hi: 'मकान वही, मोहल्ला वही, पर दलाल अचानक किराया 3 गुना बताए — समझिए वह खेल कर रहा है।',
        en: 'Same house, same area, but the broker suddenly says the rent is 3 times — understand that he is playing a game.',
      },
      student: {
        hi: 'पढ़ाई वही, तैयारी वही, पर रिज़ल्ट में अचानक 3 गुना नंबर? कुछ तो गड़बड़ है।',
        en: 'Same studies, same preparation, but suddenly 3 times the marks in the result? Something is wrong.',
      },
    },
    taught: true,
  },
  // ── NOT taught: only in run 2 (transfer test) ──
  impersonation: {
    title: { hi: 'बड़ी कंपनी का नाम, नंबर किसी अनजान का', en: 'Big company\'s name, a stranger\'s number' },
    seen: {
      hi: '"भरोसा वेल्थ" का नाम और बैनर, पर एक निजी मोबाइल नंबर',
      en: '"Bharosa Wealth" name and banner, but a personal mobile number',
    },
    explain: {
      hi: 'ठग जानी-मानी कंपनी का नाम और बैनर लगाते हैं ताकि भरोसा हो जाए। किसी भी कंपनी से हुई बात उसकी ऑफ़िशियल वेबसाइट या कस्टमर केयर से पक्की करें।',
      en: 'Fraudsters use a well-known company\'s name and banner so that you trust them. Confirm any talk with a company through its official website or customer care.',
    },
    taught: false,
  },
  screenshot_ask: {
    title: { hi: 'ऑर्डर का स्क्रीनशॉट माँगना', en: 'Asking for your order screenshot' },
    seen: {
      hi: '"ट्रेड पूरा करके ऑर्डर का स्क्रीनशॉट भेजें"',
      en: '"Complete the trade and send the order screenshot"',
    },
    explain: {
      hi: 'स्क्रीनशॉट से उन्हें पता चलता है कि आप कितना पैसा लगा सकते हैं, और आप उनकी बात मानते हैं। अगली माँग बड़ी होती है।',
      en: 'The screenshot tells them how much money you can put in, and that you follow their orders. The next demand is bigger.',
    },
    taught: false,
  },
  new_group: {
    title: { hi: 'अनजान ने जोड़ा, 2 दिन पुराना, 1 सदस्य', en: 'Added by a stranger, 2 days old, 1 member' },
    seen: {
      hi: '"VIP 1V1 सर्विस टीम" — सिर्फ़ आप, 2 दिन पहले बना',
      en: '"VIP 1V1 Service Team" — only you, made 2 days ago',
    },
    explain: {
      hi: 'किसी अनजान नंबर ने बिना पूछे आपको ऐसे ग्रुप में जोड़ा जिसमें सिर्फ़ आप हैं। यह पहचान छुपाने और आप पर अकेले दबाव डालने का तरीका है।',
      en: 'An unknown number added you, without asking, to a group where you are the only member. This is a way to hide who they are and to pressure you alone.',
    },
    taught: false,
  },
  outside_app: {
    title: { hi: 'अलग "VIP ऐप" डाउनलोड करवाना', en: 'Making you download a separate "VIP app"' },
    seen: {
      hi: '"ज़्यादा मुनाफ़े के लिए भरोसा VIP ऐप डाउनलोड करें 👉 .apk"',
      en: '"For more profit, download the Bharosa VIP app 👉 .apk"',
    },
    explain: {
      hi: 'नकली ऐप में मुनाफ़ा बढ़ता दिखता है, पर पैसा कभी नहीं निकलता। लिंक से भेजी गई .apk फ़ाइल कभी इंस्टॉल न करें।',
      en: 'In a fake app the profit seems to grow, but the money never comes out. Never install an .apk file sent through a link.',
    },
    taught: false,
  },
  // ── Recovery-scam flags (climax) ──
  fake_official: {
    title: { hi: 'SEBI/सरकार का नाम, WhatsApp पर', en: 'SEBI/Government name, on WhatsApp' },
    explain: {
      hi: 'सरकारी संस्थाएँ WhatsApp पर "रिकवरी फ़ीस" नहीं माँगतीं। "Official" लिख देने से कोई ऑफ़िशियल नहीं बनता।',
      en: 'Government bodies do not ask for a "recovery fee" on WhatsApp. Writing "Official" does not make anyone official.',
    },
    taught: false,
  },
  upfront_fee: {
    title: { hi: 'पहले फ़ीस, फिर पैसा वापस', en: 'Fee first, money back later' },
    explain: {
      hi: 'जो पैसा वापस दिलाने के लिए पहले पैसा माँगे, वह दूसरी बार ठग रहा है। फ़ीस के बाद "टैक्स", फिर "चार्ज" — माँग कभी ख़त्म नहीं होती।',
      en: 'Anyone who asks for money first to get your money back is cheating you a second time. After the fee comes "tax", then "charges" — the demands never end.',
    },
    taught: false,
  },
  guaranteed_recovery: {
    title: { hi: '"90% वापसी, गारंटी"', en: '"90% back, guaranteed"' },
    explain: {
      hi: 'बाज़ार में डूबा पैसा वापस आने की कोई गारंटी नहीं होती। गारंटी शब्द फिर से वही जाल है।',
      en: 'There is no guarantee that money lost in the market will come back. The word "guarantee" is the same trap again.',
    },
    taught: false,
  },
};

// ── Distractors: true facts that are NOT warning signs by themselves ──
export const DISTRACTORS = {
  d_code: { title: { hi: 'मैसेज में शेयर का कोड (GADAELEC) लिखा है', en: 'The message has the share code (GADAELEC)' } },
  d_morning: { title: { hi: 'मैसेज सुबह 9 बजे आया', en: 'The message came at 9 in the morning' } },
  d_listed: { title: { hi: 'शेयर NSE पर लिस्टेड है', en: 'The share is listed on NSE' } },
  d_namaste: { title: { hi: 'मैसेज में "नमस्ते सर" लिखा है', en: 'The message says "Namaste sir"' } },
  d_logo: { title: { hi: 'मैसेज में कंपनी का लोगो जैसा चित्र है', en: 'The message has a company-logo-like picture' } },
  d_hindi: { title: { hi: 'मैसेज हिंदी में लिखा है', en: 'The message is written in Hindi' } },
};

// ── Personalisation: one extra admin line aimed at the user's background ──
export const PITCH_HOOK = {
  farm: {
    hi: 'किसान भाइयों 🌾 एक फ़सल जितनी कमाई सिर्फ़ 7 दिन में!',
    en: 'Farmer brothers 🌾 a whole harvest\'s earnings in just 7 days!',
  },
  shop: {
    hi: 'दुकानदार भाइयों 🏪 असली कमाई गल्ले में नहीं, इस कॉल में है! पैसा सीधा 3 गुना 💰',
    en: 'Shopkeeper brothers 🏪 the real earning is not in your cash box, it\'s in this call! Money straight 3x 💰',
  },
  job: {
    hi: 'नौकरी वाले दोस्तों 💼 महीने के आखिर की तनख़्वाह का इंतज़ार छोड़ो, पैसा सीधा 3 गुना करो 🚀',
    en: 'Salaried friends 💼 stop waiting for month-end salary, make your money straight 3x 🚀',
  },
  home: {
    hi: 'घर चलाने वाले भाइयों-बहनों 🏠 घर ख़र्च से बचाए पैसे अब 3 गुना! किसी को बताने की ज़रूरत नहीं 🤫',
    en: 'Brothers and sisters running the home 🏠 turn your saved household money 3x! No need to tell anyone 🤫',
  },
  student: {
    hi: 'स्टूडेंट्स 🎓 पॉकेट मनी को बनाओ 3 गुना! फ़ीस का टेंशन ख़त्म 💸',
    en: 'Students 🎓 make your pocket money 3x! No more fees tension 💸',
  },
};

// ── Personalisation: how the Telegram message reached the user ──
export const INTRO_BY_SOURCE = {
  groups: {
    hi: 'आपको एक Telegram ग्रुप में जोड़ा गया है। सुबह 9 बजे यह मैसेज आया…',
    en: 'You have been added to a Telegram group. At 9 in the morning, this message came…',
  },
  social: {
    hi: 'एक YouTube वीडियो के नीचे Telegram ग्रुप का लिंक था। आप जुड़ गए। सुबह यह मैसेज आया…',
    en: 'There was a Telegram group link under a YouTube video. You joined. In the morning, this message came…',
  },
  people: {
    hi: 'आपके एक दोस्त ने यह Telegram मैसेज आगे भेजा: "देख, सब कमा रहे हैं!"',
    en: 'A friend forwarded you this Telegram message: "Look, everyone is earning!"',
  },
  app: {
    hi: 'आपने एक ट्रेडिंग ऐप डाउनलोड किया। कुछ दिन बाद एक अनजान नंबर ने "फ़्री टिप्स" वाले Telegram ग्रुप का लिंक भेजा। आप जुड़ गए। सुबह यह मैसेज आया…',
    en: 'You downloaded a trading app. A few days later, an unknown number sent you a link to a "free tips" Telegram group. You joined. In the morning, this message came…',
  },
  news: {
    hi: 'बिज़नेस न्यूज़ जैसी दिखने वाली एक वेबसाइट पर "आज का हॉट स्टॉक" लिखा था, साथ में Telegram लिंक। आप जुड़ गए। सुबह यह मैसेज आया…',
    en: 'A website that looked like business news said "Today\'s hot stock", with a Telegram link. You joined. In the morning, this message came…',
  },
  none: {
    hi: 'आपने अभी शेयर बाज़ार के बारे में सुनना शुरू ही किया है। एक दिन किसी अनजान नंबर ने आपको Telegram ग्रुप में जोड़ दिया। सुबह 9 बजे यह मैसेज आया…',
    en: 'You have only just started hearing about the share market. One day, an unknown number added you to a Telegram group. At 9 in the morning, this message came…',
  },
};

// ── Scenario 1: Telegram pump-and-dump (Gada Electronics) ────
const RAJU = { hi: 'राजू भाई (Admin)', en: 'Raju Bhai (Admin)' };

export const SCENARIO_1 = {
  id: 's1',
  chat: {
    style: 'tg',
    title: { hi: '🚀 मल्टीबैगर किंग VIP 💎', en: '🚀 Multibagger King VIP 💎' },
    subtitle: { hi: '18,412 सदस्य', en: '18,412 members' },
    time: '9:02',
    messages: [
      { from: RAJU, admin: true, voice: 's1_tip',
        text: {
          hi: '🔔🔔 आज का जैकपॉट कॉल 🔔🔔\n\nGada Electronics Ltd\nकोड: GADAELEC\nअभी भाव: ₹42\n🎯 टारगेट: ₹126 (सीधा 3 गुना!)\n⏳ सिर्फ़ 7 दिन में\n✅ 100% पक्का मुनाफ़ा\n\n⚠️ सिर्फ़ आज! कल से भाव भागेगा 🚀',
          en: '🔔🔔 Today\'s Jackpot Call 🔔🔔\n\nGada Electronics Ltd\nCode: GADAELEC\nPrice now: ₹42\n🎯 Target: ₹126 (straight 3x!)\n⏳ In just 7 days\n✅ 100% sure profit\n\n⚠️ Only today! From tomorrow the price will fly 🚀',
        } },
      { from: { hi: 'सोनू (गोरखपुर)', en: 'Sonu (Gorakhpur)' },
        proof: { label: { hi: 'आज का P&L', en: 'Today\'s P&L' }, amount: '+₹1,84,250' },
        text: {
          hi: 'राजू भाई आपकी पिछली कॉल से 1.8 लाख बना लिए 🙏🙏 आपने ज़िंदगी बदल दी',
          en: 'Raju Bhai, made 1.8 lakh from your last call 🙏🙏 You changed my life',
        } },
      { from: { hi: 'पिंकी शर्मा', en: 'Pinky Sharma' },
        text: { hi: 'थैंक यू सर ❤️ पिछली बार 60% मिला', en: 'Thank you sir ❤️ got 60% last time' } },
      { from: { hi: 'राहुल ट्रेडर', en: 'Rahul Trader' },
        text: { hi: 'मैंने अभी 50,000 लगा दिए 🚀🚀🚀', en: 'I just put in 50,000 🚀🚀🚀' } },
      { from: RAJU, admin: true,
        text: {
          hi: 'अगली कॉल सिर्फ़ 💎 प्रीमियम ग्रुप में\nफ़ीस सिर्फ़ ₹999\nUPI: raju-profit@demo\nसीटें सीमित ⏰',
          en: 'Next call only in 💎 Premium Group\nFee only ₹999\nUPI: raju-profit@demo\nLimited seats ⏰',
        } },
      { from: RAJU, admin: true, voice: 's1_hurry',
        text: {
          hi: 'जल्दी करो दोस्तों, 10 बजे के बाद यह भाव नहीं मिलेगा ⏰⏰',
          en: 'Hurry friends, after 10 o\'clock you won\'t get this price ⏰⏰',
        } },
    ],
  },
  stock: {
    name: 'Gada Electronics Ltd',
    code: 'GADAELEC',
    price: 42,
    changeToday: '+9.4%',
    history: [14, 14.6, 15.9, 17.2, 18.9, 21.4, 24.8, 28.1, 31.9, 35.6, 38.4, 42],
    historyLabel: { hi: 'पिछले 30 दिन', en: 'Last 30 days' },
    sales: [{ y: '2023-24', v: 12.1 }, { y: '2024-25', v: 12.3 }, { y: '2025-26', v: 11.8 }],
    volumeNote: { hi: 'आज की खरीद-बिक्री: सामान्य से 20 गुना', en: 'Today\'s buying-selling: 20 times the normal' },
  },
  check: {
    who: {
      hi: 'Telegram पर "राजू भाई" नाम का एडमिन। असली नाम, पता, कंपनी — कुछ नहीं पता।',
      en: 'An admin called "Raju Bhai" on Telegram. Real name, address, company — nothing is known.',
    },
    sebi: {
      hi: '"राजू भाई" या "मल्टीबैगर किंग" के नाम से SEBI रजिस्टर में कोई सलाहकार नहीं मिला। मैसेज में कोई SEBI नंबर भी नहीं है।',
      en: 'No advisor named "Raju Bhai" or "Multibagger King" was found in the SEBI register. The message has no SEBI number either.',
    },
  },
  quiz: {
    flags: ['guaranteed', 'urgency', 'paid_group', 'unregistered', 'fake_proof', 'price_vs_business'],
    distractors: ['d_code', 'd_morning'],
  },
  // After the tip: day 0 = price you buy at. 10% circuit bands.
  path: [42, 46.2, 48.5, 45.1, 40.6, 36.5, 32.9, 29.6, 26.6, 23.9],
  events: {
    1: { text: { hi: 'अपर सर्किट! ग्रुप में जश्न 🎉 "देखा, बोला था!"', en: 'Upper circuit! Party in the group 🎉 "See, I told you!"' }, tone: 'up', voice: 's1_d1' },
    2: { text: { hi: '₹48.5 — यहीं सबसे ऊपर था', en: '₹48.5 — this was the very top' }, tone: 'up' },
    3: { text: { hi: 'राजू भाई और साथी चुपचाप अपने शेयर बेच रहे हैं', en: 'Raju Bhai and his friends are quietly selling their shares' }, tone: 'warn', voice: 's1_d3' },
    4: { text: { hi: 'लोअर सर्किट — बेचने वाले बहुत, खरीदार कोई नहीं', en: 'Lower circuit — too many sellers, no buyers' }, tone: 'down', voice: 's1_d4' },
    6: { text: { hi: 'ग्रुप में सवाल पूछे तो "होल्ड करो, ₹126 आएगा"', en: 'Ask questions in the group and they say "Hold, ₹126 will come"' }, tone: 'down' },
    9: { text: { hi: 'Telegram ग्रुप डिलीट। राजू भाई गायब।', en: 'Telegram group deleted. Raju Bhai has vanished.' }, tone: 'down', voice: 's1_d9' },
  },
};

// ── Scenario 2: fake broker "VIP 1V1" WhatsApp group (UNSEEN tricks) ──
const S2_NUM = { hi: '+91 72XXX XX032', en: '+91 72XXX XX032' };

export const SCENARIO_2 = {
  id: 's2',
  chat: {
    style: 'wa',
    title: { hi: '2️⃣ VIP 1V1 सर्विस टीम -633', en: '2️⃣ VIP 1V1 Service Team -633' },
    subtitle: { hi: '+91 72XXX XX032 (एडमिन ~भरोसा वेल्थ)', en: '+91 72XXX XX032 (Admin ~Bharosa Wealth)' },
    info: {
      hi: '1 सदस्य • 2 दिन पहले बना • +91 72XXX XX032 ने आपको जोड़ा',
      en: '1 member • created 2 days ago • +91 72XXX XX032 added you',
    },
    time: '7:46',
    messages: [
      { from: S2_NUM, text: { hi: 'नमस्ते सर, कृपया मेरे मैसेज का जवाब दें 🙏', en: 'Namaste sir, kindly reply to my message 🙏' } },
      { from: S2_NUM, banner: {
        brand: { hi: 'भरोसा सिक्योरिटीज़', en: 'Bharosa Securities' },
        line: { hi: '16वाँ इन्वेस्टमेंट प्लान', en: '16th Investment Plan' },
        cta: { hi: 'APPLY', en: 'APPLY' },
      } },
      { from: S2_NUM, text: { hi: 'क्या आपको प्लान समझ आया सर? 🙏', en: 'Did you understand the plan, sir? 🙏' } },
      { from: S2_NUM, voice: 's2_tip',
        text: {
          hi: 'आज की ट्रेडिंग सिफ़ारिश 🔥🔥🔥\n\nइंस्टिट्यूशनल स्टॉक ✅\nGokuldham Agro Ltd (GOKULAGRO) NSE\n\n🎯 3 दिन में 30% रिटर्न\n✅ बिल्कुल सुरक्षित',
          en: 'Today\'s trading recommendation 🔥🔥🔥\n\nInstitutional stock ✅\nGokuldham Agro Ltd (GOKULAGRO) NSE\n\n🎯 30% return in 3 days\n✅ Totally safe',
        } },
      { from: S2_NUM, voice: 's2_ask',
        text: {
          hi: 'सभी सदस्य आज ही ASAP ट्रेड पूरा करें और ऑर्डर का स्क्रीनशॉट मुझे भेजें, ताकि हम सही समय पर बेचने का अलर्ट दे सकें 📈',
          en: 'All members please complete the trade TODAY ASAP and send me the order screenshot, so we can give you the alert to sell at the right time 📈',
        } },
      { from: S2_NUM,
        text: {
          hi: 'ज़्यादा मुनाफ़े के लिए हमारा "भरोसा VIP" ऐप डाउनलोड करें 👉 bharosa-vip.apk',
          en: 'For more profit, download our "Bharosa VIP" app 👉 bharosa-vip.apk',
        } },
    ],
  },
  stock: {
    name: 'Gokuldham Agro Ltd',
    code: 'GOKULAGRO',
    price: 118,
    changeToday: '+1.2%',
    history: [109, 111, 110, 112, 114, 113, 115, 114, 116, 117, 116, 118],
    historyLabel: { hi: 'पिछले 30 दिन', en: 'Last 30 days' },
    sales: [{ y: '2023-24', v: 210 }, { y: '2024-25', v: 236 }, { y: '2025-26', v: 251 }],
    volumeNote: { hi: 'आज की खरीद-बिक्री: सामान्य', en: 'Today\'s buying-selling: normal' },
  },
  check: {
    who: {
      hi: 'एक अनजान मोबाइल नंबर, जो खुद को "भरोसा वेल्थ" का बताता है। आपको बिना पूछे ग्रुप में जोड़ा।',
      en: 'An unknown mobile number that says it is from "Bharosa Wealth". It added you to the group without asking.',
    },
    sebi: {
      hi: 'खेल में: "भरोसा सिक्योरिटीज़" रजिस्टर्ड ब्रोकर है, पर यह मोबाइल नंबर कंपनी की वेबसाइट पर कहीं नहीं है। कंपनी के नाम का इस्तेमाल हो रहा है।',
      en: 'In the game: "Bharosa Securities" is a registered broker, but this mobile number is nowhere on the company\'s website. Someone is misusing the company\'s name.',
    },
  },
  // What each shared flag looked like in THIS message
  seen: {
    urgency: { hi: '"सभी सदस्य आज ही ASAP ट्रेड पूरा करें"', en: '"All members complete the trade TODAY ASAP"' },
    guaranteed: { hi: '"3 दिन में 30% रिटर्न, बिल्कुल सुरक्षित"', en: '"30% return in 3 days, totally safe"' },
    unregistered: { hi: 'एक अनजान नंबर — न नाम, न SEBI नंबर', en: 'An unknown number — no name, no SEBI number' },
  },
  quiz: {
    flags: ['urgency', 'guaranteed', 'unregistered', 'impersonation', 'screenshot_ask', 'new_group', 'outside_app'],
    distractors: ['d_listed', 'd_namaste'],
  },
  outcome: {
    bought: {
      title: { hi: 'आगे यह हुआ', en: 'This is what happened next' },
      steps: [
        {
          hi: 'आपने स्क्रीनशॉट भेजा। अगले दिन: "सर, असली मुनाफ़ा VIP ऐप में है। वहाँ ₹50,000 डालें।"',
          en: 'You sent the screenshot. Next day: "Sir, the real profit is in the VIP app. Put ₹50,000 there."',
        },
        {
          hi: 'VIP ऐप में मुनाफ़ा रोज़ बढ़ता दिखा: +₹38,400 📈',
          en: 'In the VIP app, the profit seemed to grow every day: +₹38,400 📈',
        },
        {
          hi: 'पैसे निकालने गए: "निकासी रुकी। पहले 20% टैक्स ₹14,000 भरें।"',
          en: 'You tried to take the money out: "Withdrawal stopped. First pay 20% tax, ₹14,000."',
        },
        {
          hi: 'ऐप का पैसा कभी किसी एक्सचेंज पर गया ही नहीं था। सीधे ठगों के खाते में गया।',
          en: 'The app money never went to any stock exchange. It went straight into the fraudsters\' account.',
        },
      ],
    },
    skipped: {
      title: { hi: 'अच्छा फ़ैसला। अगर खरीदते, तो आगे यह होता:', en: 'Good decision. If you had bought, this would have happened next:' },
      steps: [
        {
          hi: 'स्क्रीनशॉट के बाद: "असली मुनाफ़ा VIP ऐप में है। वहाँ पैसे डालें।"',
          en: 'After the screenshot: "The real profit is in the VIP app. Put money there."',
        },
        {
          hi: 'ऐप में मुनाफ़ा बढ़ता दिखता, पर निकालते समय "पहले टैक्स भरें"।',
          en: 'The app would show profit growing, but when you try to take it out: "Pay tax first".',
        },
        {
          hi: 'ऐसे ज़्यादातर लोगों को पता तभी चलता है जब पैसा निकलना बंद हो जाता है।',
          en: 'Most people find out only when the money stops coming out.',
        },
      ],
    },
  },
};

// ── Climax: the recovery scam ──
export const RECOVERY_SCAM = {
  from: { hi: 'SEBI रिकवरी सेल (Official) ✅', en: 'SEBI Recovery Cell (Official) ✅' },
  number: '+91 98XXX XX417',
  voice: 'rc_msg',
  text: {
    hi: (lossText) => `आदरणीय निवेशक,\nGada Electronics घोटाले में आपके ${lossText} वापस दिलाए जा सकते हैं।\n\nसरकारी रिकवरी सॉफ़्टवेयर फ़ीस: ₹4,999\nUPI: sebi-refund@demo\n\n✅ 24 घंटे में 90% रकम वापस, गारंटी\n⚠️ ऑफ़र सिर्फ़ आज तक`,
    en: (lossText) => `Respected Investor,\nYour ${lossText} lost in the Gada Electronics scam can be recovered.\n\nGovernment recovery software fee: ₹4,999\nUPI: sebi-refund@demo\n\n✅ 90% amount back in 24 hours, guaranteed\n⚠️ Offer valid only till today`,
  },
  flags: ['fake_official', 'upfront_fee', 'guaranteed_recovery', 'urgency'],
  paid: [
    { hi: '₹4,999 गए।', en: '₹4,999 gone.' },
    {
      hi: 'अगले दिन: "सॉफ़्टवेयर लाइसेंस के लिए ₹9,999 और भेजें।"',
      en: 'Next day: "Send ₹9,999 more for the software licence."',
    },
    {
      hi: 'फिर: "RBI क्लियरेंस टैक्स ₹15,000।" माँग कभी ख़त्म नहीं होती।',
      en: 'Then: "RBI clearance tax ₹15,000." The demands never end.',
    },
  ],
  line: { hi: 'पहली ठगी लालच से हुई। दूसरी, उम्मीद से।', en: 'The first fraud came from greed. The second, from hope.' },
};

// ── Honest recovery guide (decision tree) ──
export const HELP = [
  {
    id: 'market',
    q: {
      hi: 'शेयर का भाव गिरने से नुकसान हुआ (असली ब्रोकर ऐप पर)',
      en: 'I lost money because the share price fell (on a real broker app)',
    },
    a: [
      { hi: 'सच यह है: यह पैसा ज़्यादातर वापस नहीं आता।', en: 'The truth is: this money mostly does not come back.' },
      {
        hi: 'नुकसान पूरा करने के लिए और बड़ा जोखिम न लें। यही दूसरी ग़लती होती है।',
        en: 'Don\'t take a bigger risk to cover the loss. That is the second mistake people make.',
      },
      {
        hi: 'टिप वाले ग्रुप को Telegram/WhatsApp पर रिपोर्ट करें और छोड़ दें।',
        en: 'Report the tips group on Telegram/WhatsApp and leave it.',
      },
    ],
  },
  {
    id: 'paid',
    q: {
      hi: 'किसी "सलाहकार" को पैसे भेजे, या किसी ऐप में पैसा डाला',
      en: 'I sent money to an "advisor", or put money into some app',
    },
    a: [
      { hi: 'तुरंत 1930 पर कॉल करें (साइबर क्राइम हेल्पलाइन)।', en: 'Call 1930 right away (Cyber Crime Helpline).' },
      { hi: 'या cybercrime.gov.in पर शिकायत दर्ज करें।', en: 'Or file a complaint at cybercrime.gov.in.' },
      {
        hi: 'अपने बैंक को तुरंत बताएँ। जितनी जल्दी, उतनी उम्मीद।',
        en: 'Tell your bank immediately. The sooner you act, the more hope.',
      },
    ],
  },
  {
    id: 'broker',
    q: {
      hi: 'रजिस्टर्ड ब्रोकर या डिपॉज़िटरी पार्टिसिपेंट ने गड़बड़ की',
      en: 'A registered broker or depository participant did something wrong',
    },
    a: [
      { hi: 'पहले ब्रोकर/DP से लिखित शिकायत करें।', en: 'First, complain in writing to the broker/DP.' },
      {
        hi: 'हल न हो तो SEBI SCORES (scores.sebi.gov.in) पर शिकायत करें।',
        en: 'If it is not solved, complain on SEBI SCORES (scores.sebi.gov.in).',
      },
      { hi: 'फिर भी हल न हो तो SmartODR (smartodr.in) पर।', en: 'If it is still not solved, go to SmartODR (smartodr.in).' },
    ],
  },
];
export const HELP_ALWAYS = {
  hi: 'जो "पैसा वापस दिलाने" के लिए पहले फ़ीस माँगे — वह ठग है। हम भी आपका पैसा वापस नहीं दिला सकते; हम सिर्फ़ सही रास्ता बता सकते हैं।',
  en: 'Anyone who asks for a fee first to "get your money back" is a fraud. We cannot get your money back either; we can only show you the right path.',
};

// ── The NiveshSetu check card: the one reflex we build ──
export const CHECK_QUESTIONS = [
  { hi: 'यह किसने भेजा? (असली नाम, SEBI नंबर)', en: 'Who sent this? (Real name, SEBI number)' },
  {
    hi: 'क्या वह SEBI में रजिस्टर्ड है? (SEBI की वेबसाइट पर जाँचें)',
    en: 'Are they registered with SEBI? (Check on the SEBI website)',
  },
  { hi: 'अगर भाव आधा हो जाए, तो मेरा क्या होगा?', en: 'If the price falls to half, what happens to me?' },
];
export const CHECK_RULE = {
  hi: 'जो पक्का मुनाफ़ा या पक्की वापसी बोले — वह ठग है।',
  en: 'Anyone who promises sure profit or sure money back is a fraud.',
};

// ── Fact cards for the personalised explainer ──
// Sarvam may ONLY rephrase these facts. `cached` = pre-written (and
// reviewable) versions, used offline and as the safe fallback.
// Levels: basic (was '8'), mid (was '12'), fin (was 'grad').
export const FACT_CARDS = {
  pump: {
    title: { hi: 'भाव बनाम कारोबार', en: 'Price vs business' },
    facts: {
      hi: 'Gada Electronics (काल्पनिक कंपनी) की सालाना बिक्री 3 साल से लगभग ₹12 करोड़ पर टिकी है। फिर भी 30 दिन में शेयर का भाव ₹14 से ₹42 हो गया, यानी 3 गुना। उसी समय खरीद-बिक्री (वॉल्यूम) सामान्य से 20 गुना हो गई। टिप आने के बाद 9 दिन में भाव ₹42 से ₹24 पर आ गया, यानी 43% नीचे। लोअर सर्किट लगने से कई लोग बेच भी नहीं पाए।',
      en: 'Gada Electronics (a made-up company) has had yearly sales stuck at about ₹12 crore for 3 years. Still, in 30 days its share price went from ₹14 to ₹42, that is 3 times. At the same time, buying and selling (volume) became 20 times the normal. After the tip, in 9 days the price fell from ₹42 to ₹24, that is 43% down. Because of the lower circuit, many people could not even sell.',
    },
    cached: {
      basic: {
        hi: 'सोचिए, गाँव में एक दुकान है जो हर साल उतना ही चावल बेचती है। अचानक कुछ लोग उस दुकान का हिस्सा 3 गुना दाम में खरीदने की बोली लगाने लगते हैं। दुकान में कुछ नहीं बदला, बस बोली बढ़ी। फिर उन्हीं लोगों ने चुपचाप अपना हिस्सा बेचा और निकल गए। दाम गिरा, और जो आखिर में खरीदे, उनका सबसे ज़्यादा नुकसान हुआ। Gada Electronics में भी यही हुआ: बिक्री वही रही, भाव ₹14 से ₹42 हुआ, फिर ₹24 पर आ गया।',
        en: 'Think of a shop in a village that sells the same amount of rice every year. Suddenly some people start bidding 3 times the price to buy a share in that shop. Nothing changed in the shop, only the bids went up. Then the same people quietly sold their share and left. The price fell, and those who bought last lost the most. The same thing happened with Gada Electronics: sales stayed the same, the price went from ₹14 to ₹42, then fell to ₹24.',
      },
      mid: {
        hi: 'Gada Electronics की बिक्री 3 साल से लगभग ₹12 करोड़ पर अटकी है, पर 30 दिन में शेयर का भाव ₹14 से ₹42, यानी 3 गुना हो गया। साथ में खरीद-बिक्री (वॉल्यूम) अचानक 20 गुना हो गई। जब कारोबार न बढ़े और भाव इतना भागे, तो समझिए कुछ लोग मिलकर भाव चढ़ा रहे हैं। टिप भेजकर उन्होंने आप जैसे खरीदारों को बुलाया और खुद ऊँचे भाव पर बेच दिया। 9 दिन में भाव ₹24 रह गया, यानी 43% नीचे।',
        en: 'Gada Electronics\' sales have been stuck at about ₹12 crore for 3 years, but in 30 days its share price went from ₹14 to ₹42 — that is 3 times. At the same time, buying and selling (volume) suddenly became 20 times. When the business does not grow but the price runs this fast, understand that some people are pushing the price up together. They sent the tip to call in buyers like you, and sold their own shares at the high price. In 9 days the price was just ₹24, that is 43% down.',
      },
      fin: {
        hi: 'यह पंप-एंड-डंप का सीधा पैटर्न है: रेवेन्यू तीन साल से लगभग ₹12 करोड़ पर फ़्लैट, पर 30 दिन में प्राइस 3 गुना और वॉल्यूम सामान्य से 20 गुना। ऑपरेटर पहले सस्ते में शेयर जमा करते हैं, फिर Telegram टिप से रिटेल खरीदार लाते हैं और उन्हीं को अपने शेयर बेचकर निकल जाते हैं। टिप के बाद 9 दिन में प्राइस ₹42 से ₹24 (43% नीचे), और लोअर सर्किट में कई लोग बेच भी नहीं पाए।',
        en: 'This is a textbook pump-and-dump pattern: revenue flat at about ₹12 crore for three years, but in 30 days the price went 3x and volume hit 20x the normal. Operators first collect shares cheaply, then use Telegram tips to bring in retail buyers, and exit by selling their own shares to those same buyers. In 9 days after the tip, the price fell from ₹42 to ₹24 (43% down), and in the lower circuit many people could not even sell.',
      },
    },
  },
};

// ── Curated knowledge for free-form questions (server side) ──
export const KB = {
  hi: [
    'SEBI भारत में शेयर बाज़ार की नियामक संस्था है।',
    'शेयर खरीदने-बेचने की सलाह देने वाले को SEBI में रिसर्च एनालिस्ट (RA) या इन्वेस्टमेंट एडवाइज़र (IA) के रूप में रजिस्टर्ड होना चाहिए। SEBI की वेबसाइट पर रजिस्टर्ड लोगों की सूची में नाम और रजिस्ट्रेशन नंबर जाँचा जा सकता है।',
    'रजिस्टर्ड सलाहकार भी मुनाफ़े की गारंटी नहीं दे सकते। "पक्का मुनाफ़ा" बोलना खतरे का इशारा है।',
    'पंप-एंड-डंप: कुछ लोग पहले सस्ते में शेयर जमा करते हैं, फिर टिप फैलाकर भाव चढ़ाते हैं, और ऊँचे भाव पर नए खरीदारों को बेचकर निकल जाते हैं। भाव फिर गिर जाता है।',
    'सर्किट: एक्सचेंज हर शेयर के लिए एक दिन में भाव ऊपर-नीचे जाने की सीमा तय करता है। लोअर सर्किट पर बेचने वाले बहुत होते हैं और खरीदार नहीं मिलते, इसलिए बेचना मुश्किल हो जाता है।',
    'ऑनलाइन धोखाधड़ी में पैसा गया हो तो तुरंत 1930 (राष्ट्रीय साइबर क्राइम हेल्पलाइन) पर कॉल करें या cybercrime.gov.in पर शिकायत करें, और बैंक को बताएँ। जल्दी करने से उम्मीद बढ़ती है।',
    'रजिस्टर्ड ब्रोकर, डिपॉज़िटरी पार्टिसिपेंट या लिस्टेड कंपनी के खिलाफ़ शिकायत SEBI SCORES (scores.sebi.gov.in) पर होती है। हल न हो तो SmartODR (smartodr.in) पर ऑनलाइन विवाद समाधान।',
    'शेयर बाज़ार में गिरे भाव से हुआ नुकसान आम तौर पर वापस नहीं मिलता। जो "रिकवरी" के लिए पहले फ़ीस माँगे, वह ठग है।',
    'डीमैट खाता शेयरों को इलेक्ट्रॉनिक रूप में रखता है। NSDL एक डिपॉज़िटरी है जो डीमैट खातों का रिकॉर्ड रखती है।',
    'SEBI के अध्ययन के अनुसार इक्विटी F&O में 10 में से 9 व्यक्तिगत ट्रेडर्स को कुल मिलाकर नुकसान हुआ।',
    'किसी लिंक से भेजी गई .apk फ़ाइल इंस्टॉल न करें। नकली ट्रेडिंग ऐप में मुनाफ़ा दिखता है पर पैसा नहीं निकलता।',
    'वॉल्यूम का मतलब है एक दिन में कितने शेयर खरीदे-बेचे गए। बिना किसी खबर के वॉल्यूम का अचानक कई गुना होना संदिग्ध हो सकता है।',
  ],
  en: [
    'SEBI is the regulator of the share market in India.',
    'Anyone giving advice on buying or selling shares must be registered with SEBI as a Research Analyst (RA) or Investment Adviser (IA). You can check their name and registration number in the list of registered people on the SEBI website.',
    'Even registered advisors cannot guarantee profit. Saying "sure profit" is a warning sign.',
    'Pump-and-dump: some people first collect shares cheaply, then spread tips to push the price up, and exit by selling to new buyers at the high price. Then the price falls.',
    'Circuit: the exchange sets a limit on how much a share\'s price can go up or down in one day. At the lower circuit there are many sellers and no buyers, so selling becomes hard.',
    'If you lost money in an online fraud, call 1930 (National Cyber Crime Helpline) right away or complain at cybercrime.gov.in, and tell your bank. Acting fast gives more hope.',
    'Complaints against a registered broker, depository participant or listed company go on SEBI SCORES (scores.sebi.gov.in). If not solved, use SmartODR (smartodr.in) for online dispute resolution.',
    'A loss from a falling share price usually does not come back. Anyone who asks for a fee first for "recovery" is a fraud.',
    'A demat account holds shares in electronic form. NSDL is a depository that keeps the records of demat accounts.',
    'According to a SEBI study, 9 out of 10 individual traders in equity F&O lost money overall.',
    'Do not install an .apk file sent through a link. A fake trading app shows profit, but the money never comes out.',
    'Volume means how many shares were bought and sold in a day. A sudden jump of many times in volume, without any news, can be suspicious.',
  ],
};

export const ASK_SUGGESTIONS = {
  hi: [
    'SEBI रजिस्ट्रेशन कैसे जाँचें?',
    'लोअर सर्किट क्या होता है?',
    'क्या मुझे Gada Electronics खरीदना चाहिए?',
  ],
  en: [
    'How do I check SEBI registration?',
    'What is a lower circuit?',
    'Should I buy Gada Electronics?',
  ],
};

export const REFUSAL = {
  hi: 'मैं किसी भी शेयर को खरीदने, बेचने या रखने की सलाह नहीं देता — यही मेरा नियम है। मैं आपको यह समझा सकता हूँ कि किसी टिप को कैसे जाँचें: किसने भेजा, क्या वह SEBI में रजिस्टर्ड है, और भाव आधा हुआ तो आपका क्या होगा।',
  en: 'I never advise buying, selling or holding any share — that is my rule. I can explain how to check a tip: who sent it, whether they are registered with SEBI, and what happens to you if the price falls to half.',
  mr: 'मी कोणताही शेअर घ्या, विका किंवा ठेवा असा सल्ला कधीच देत नाही — हा माझा नियम आहे. टिप कशी तपासायची ते मी समजावू शकतो: ती कोणी पाठवली, ते SEBI कडे रजिस्टर्ड आहेत का, आणि भाव निम्मा झाला तर तुमचं काय होईल.',
};

// ── Lines that get pre-generated audio (scripts/generate-audio.js) ──
// voice: 'tipster' = loud, urgent scammer · 'app' = calm NiveshSetu guide
export const VOICE_LINES = {
  intro: { voice: 'app', text: {
    hi: 'नमस्ते। यह एक खेल है। इसमें असली पैसा नहीं लगेगा। आपके फ़ोन पर एक मैसेज आने वाला है। आप जो सही लगे, वही करें।',
    en: 'Namaste. This is a game. No real money is used. A message is about to come on your phone. Do whatever feels right to you.',
  } },
  s1_tip: { voice: 'tipster', text: {
    hi: 'आज का जैकपॉट कॉल! गडा इलेक्ट्रॉनिक्स। अभी भाव बयालीस रुपये। सात दिन में सीधा तीन गुना! सौ प्रतिशत पक्का मुनाफ़ा! सिर्फ़ आज!',
    en: 'Today\'s jackpot call! Gada Electronics. Price now forty-two rupees. Straight three times in seven days! One hundred percent sure profit! Only today!',
  } },
  s1_hurry: { voice: 'tipster', text: {
    hi: 'जल्दी करो दोस्तों, दस बजे के बाद यह भाव नहीं मिलेगा!',
    en: 'Hurry friends, after ten o\'clock you won\'t get this price!',
  } },
  quiz: { voice: 'app', text: {
    hi: 'नतीजा देखने से पहले बताइए: इस मैसेज में आपको क्या-क्या गड़बड़ लगा? जो-जो लगे, सब चुनिए।',
    en: 'Before you see the result, tell us: what all felt wrong in this message? Pick everything you noticed.',
  } },
  s1_d1: { voice: 'tipster', text: { hi: 'देखा! अपर सर्किट! बोला था ना!', en: 'See! Upper circuit! Didn\'t I tell you!' } },
  s1_d3: { voice: 'app', text: {
    hi: 'राजू भाई और उसके साथी चुपचाप अपने शेयर बेच रहे हैं।',
    en: 'Raju Bhai and his friends are quietly selling their shares.',
  } },
  s1_d4: { voice: 'app', text: {
    hi: 'लोअर सर्किट। बेचने वाले बहुत हैं, खरीदार कोई नहीं।',
    en: 'Lower circuit. Lots of sellers, no buyers.',
  } },
  s1_d9: { voice: 'app', text: {
    hi: 'ग्रुप डिलीट हो गया। राजू भाई गायब हैं।',
    en: 'The group is deleted. Raju Bhai has vanished.',
  } },
  debrief: { voice: 'app', text: {
    hi: 'चलिए समझते हैं कि क्या हुआ। इस मैसेज में छह खतरे के इशारे थे।',
    en: 'Let\'s understand what happened. This message had six warning signs.',
  } },
  check: { voice: 'app', text: {
    hi: 'अगली बार कोई टिप आए, तो रुकिए और तीन सवाल पूछिए। यह किसने भेजा? क्या वह सेबी में रजिस्टर्ड है? और अगर भाव आधा हो जाए, तो मेरा क्या होगा?',
    en: 'Next time a tip comes, stop and ask three questions. Who sent this? Are they registered with SEBI? And if the price falls to half, what happens to me?',
  } },
  s2_tip: { voice: 'tipster', text: {
    hi: 'आज की ट्रेडिंग सिफ़ारिश। इंस्टिट्यूशनल स्टॉक। तीन दिन में तीस प्रतिशत रिटर्न। बिल्कुल सुरक्षित।',
    en: 'Today\'s trading recommendation. Institutional stock. Thirty percent return in three days. Totally safe.',
  } },
  s2_ask: { voice: 'tipster', text: {
    hi: 'सभी सदस्य आज ही ट्रेड पूरा करें और ऑर्डर का स्क्रीनशॉट मुझे भेजें।',
    en: 'All members, complete the trade today and send me the order screenshot.',
  } },
  rc_msg: { voice: 'tipster', text: {
    hi: 'आदरणीय निवेशक, आपका डूबा हुआ पैसा वापस दिलाया जा सकता है। बस चार हज़ार नौ सौ निन्यानवे रुपये की सॉफ़्टवेयर फ़ीस भेजें। चौबीस घंटे में नब्बे प्रतिशत वापसी, गारंटी।',
    en: 'Respected investor, your lost money can be recovered. Just send a software fee of four thousand nine hundred ninety-nine rupees. Ninety percent back in twenty-four hours, guaranteed.',
  } },
  rc_line: { voice: 'app', text: { hi: RECOVERY_SCAM.line.hi, en: RECOVERY_SCAM.line.en } },
  ...Object.fromEntries(
    Object.entries(FLAGS).map(([id, f]) => [`fl_${id}`, {
      voice: 'app',
      text: {
        hi: `${f.title.hi}। ${f.explain.hi}${f.analogy ? ' ' + f.analogy.hi : ''}`,
        en: `${f.title.en}. ${f.explain.en}${f.analogy ? ' ' + f.analogy.en : ''}`,
      },
    }])
  ),
  ...Object.fromEntries(
    Object.entries(FACT_CARDS.pump.cached).map(([lvl, t]) => [`fc_pump_${lvl}`, { voice: 'app', text: { hi: t.hi, en: t.en } }])
  ),
  refusal: { voice: 'app', text: REFUSAL },
};
