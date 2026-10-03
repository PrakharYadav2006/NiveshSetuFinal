// Shared by the browser (offline fallback) and the server (first gate before the LLM).
// Deterministic: if a message asks what to buy/sell/hold, it never reaches the AI.

const ACTION = /(खरीद|ख़रीद|बेच|होल्ड|रखूँ|रखूं|रखू|निवेश\s*कर|लगाऊ|लगाऊँ|लगाऊं|kharid|khareed|kharee?d|bech|buy|sell|hold|invest\s*kar|lagau|lagaun|rakhu|rakhun)/i;
const CUE = /(चाहिए|क्या|या\s|\bya\b|कौन|सही|अच्छा|बताओ|बताइए|सलाह|टारगेट|chahiye|kya|kaun|sahi|acch?a|batao|salah|should|which|best|recommend|target|good)/i;
const STRONG = [
  /(कौन\s*सा|कौनसा|kaun\s*sa|konsa|which)\s*(शेयर|स्टॉक|share|stock)/i,
  /(भाव|प्राइस|price|rate)\s*(कितना|कहाँ|kitna|kaha|kya)\s*(जाएगा|होगा|jayega|hoga)/i,
  /(टिप|tip|multibagger|मल्टीबैगर)\s*(दो|दीजिए|do|dijiye|batao|बताओ)/i,
  /should\s+i\s+(buy|sell|hold|invest)/i,
  // Marathi
  /(कोणता|कुठला)\s*(शेअर|स्टॉक)/,
  /(घ्यावा|घ्यावे|घ्यावी|घेऊ|विकू|विकावा|विकावे|ठेवू|ठेवावा|गुंतवू|लावू|खरेदी\s*करू)\s*(का|की\s*नको|की\s*नाही)/,
  /भाव\s*(किती|कुठे)\s*(जाईल|होईल)/,
  /(टिप|मल्टीबॅगर)\s*(द्या|सांगा)/,
];
// Questions about checking/safety are allowed through even if they mention buying.
const SAFE = /(पहले|जाँच|जांच|पहचान|ठग|धोखा|फ्रॉड|फ़्रॉड|स्कैम|सुरक्षित|रजिस्टर|pehle|jaanch|janch|pehchan|thag|dhokha|fraud|scam|safe|before|check|regist)/i;

export function isAdviceRequest(text = '') {
  const t = String(text);
  if (STRONG.some((r) => r.test(t))) return true;
  if (SAFE.test(t)) return false;
  return ACTION.test(t) && CUE.test(t);
}

// Output check: did the model slip into telling someone to act?
const ADVICE_OUT = /(खरीद\s*(लो|लें|लीजिए|सकते हैं)|बेच\s*(दो|दें|दीजिए)|होल्ड\s*(करो|करें|कीजिए)|निवेश\s*(करो|करें|कीजिए)|लगा\s*(दो|दें|दीजिए)|खरीदना\s*(सही|अच्छा)\s*(रहेगा|होगा)|बेचना\s*(सही|अच्छा)\s*(रहेगा|होगा)|buy\s+now|you\s+should\s+(buy|sell|hold|invest)|i\s+(would\s+)?(recommend|suggest)\s+(buying|selling|holding)|(good|great)\s+(time\s+to\s+buy|stock\s+to\s+buy)|target\s*price|टारगेट\s*प्राइस)/i;
// Marathi directives ("घ्या", "विका", "खरेदी करा"…), only next to a share word or as fixed buy/sell phrases,
// because "घ्या" alone is everyday Marathi ("काळजी घ्या", "निर्णय घ्या").
const ADVICE_OUT_MR = /((शेअर|स्टॉक|हा|हे|ते|आत्ताच|लगेच)\s*(घ्या|विका|घेऊन\s*टाका|विकून\s*टाका))(?=[\s.!?।,]|$)|विकत\s*घ्या|खरेदी\s*करा|विकून\s*टाका|गुंतवणूक\s*करा|होल्ड\s*करा|धरून\s*ठेवा|पैसे\s*लावा|घेणं\s*(योग्य|चांगलं)\s*(आहे|ठरेल)|विकणं\s*(योग्य|चांगलं)\s*(आहे|ठरेल)|चांगला\s*शेअर|वाईट\s*शेअर/;
export function looksLikeAdvice(text = '') {
  return ADVICE_OUT.test(String(text)) || ADVICE_OUT_MR.test(String(text));
}
