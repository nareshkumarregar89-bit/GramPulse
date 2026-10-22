/**
 * VillagePulse Offline English-to-Hindi Transliteration Engine
 * 
 * 100% Client-Side, Zero External APIs, Zero CDNs.
 * Fully bundled with the PWA and cached offline by Workbox Service Worker.
 */

// Curated Lexicon of common Rajasthani, Hindi, and Indian first names, surnames, and titles
export const INDIAN_NAME_LEXICON = {
  // Common male & female first names
  'ramesh': 'रमेश',
  'naresh': 'नरेश',
  'suresh': 'सुरेश',
  'mahesh': 'महेश',
  'dinesh': 'दिनेश',
  'mukesh': 'मुकेश',
  'rajesh': 'राजेश',
  'kamlesh': 'कमलेश',
  'rakesh': 'राकेश',
  'shyam': 'श्याम',
  'shyam lal': 'श्याम लाल',
  'mohan': 'मोहन',
  'mohanlal': 'मोहनलाल',
  'ratan': 'रतन',
  'ratanlal': 'रतनलाल',
  'shankar': 'शंकर',
  'shankarlal': 'शंकर लाल',
  'bheru': 'भेरू',
  'bherulal': 'भेरू लाल',
  'bhairu': 'भैरू',
  'bhairulal': 'भैरू लाल',
  'jamna': 'जमना',
  'jamnalal': 'जमना लाल',
  'jagdish': 'जगदीश',
  'prakash': 'प्रकाश',
  'dilkhush': 'दिलखुश',
  'abhishek': 'अभिषेक',
  'ram': 'राम',
  'rama': 'रामा',
  'ramlal': 'रामलाल',
  'kanhaiya': 'कन्हैया',
  'kanhaiyalal': 'कन्हैया लाल',
  'haridev': 'हरदेव',
  'sohan': 'सोहन',
  'sohanlal': 'सोहन लाल',
  'mangi': 'मांगी',
  'mangilal': 'मांगी लाल',
  'om': 'ओम',
  'omprakash': 'ओमप्रकाश',
  'gopal': 'गोपाल',
  'kishore': 'किशोर',
  'kishan': 'किशन',
  'radheshyam': 'राधेश्याम',
  'laxman': 'लक्ष्मण',
  'bharat': 'भरत',
  'satyanarayan': 'सत्यनारायण',
  'kailash': 'कैलाश',
  'bhagwan': 'भगवान',
  'vinod': 'विनोद',
  'anil': 'अनिल',
  'sunil': 'सुनील',
  'manoj': 'मनोज',
  'sanjay': 'संजय',
  'ajay': 'अजय',
  'vijay': 'विजय',
  'vikram': 'विक्रम',
  'rohit': 'रोहित',
  'rahul': 'राहुल',
  'amit': 'अमित',
  'sumit': 'सुमित',
  'deepak': 'दीपक',
  'pradeep': 'प्रदीप',
  'sandeep': 'संदीप',
  'kuldeep': 'कुलदीप',
  'dharmendra': 'धर्मेन्द्र',
  'jitendra': 'जितेन्द्र',
  'surendra': 'सुरेन्द्र',
  'narendra': 'नरेन्द्र',
  'mahendra': 'महेन्द्र',
  'gajendra': 'गजेन्द्र',

  // Female names
  'shanti': 'शांति',
  'kali': 'काली',
  'radha': 'राधा',
  'pushpa': 'पुष्पा',
  'gani': 'गनी',
  'pooja': 'पूजा',
  'puja': 'पूजा',
  'sunita': 'सुनीता',
  'anita': 'अनीता',
  'kavita': 'कविता',
  'geeta': 'गीता',
  'gita': 'गीता',
  'seema': 'सीमा',
  'rekha': 'रेखा',
  'manju': 'मंजू',
  'santosh': 'संतोष',
  'movni': 'मोवनी',
  'badam': 'बादाम',
  'kankoo': 'कंकू',
  'leela': 'लीला',
  'kamla': 'कमला',
  'vimla': 'विमला',
  'nirmala': 'निर्मला',
  'saroj': 'सरोज',
  'mamta': 'ममता',
  'priyanka': 'प्रियंका',
  'neetu': 'नीतू',
  'monika': 'मोनिका',
  'preeti': 'प्रीति',
  'payal': 'पायल',
  'komal': 'कोमल',
  'pinki': 'पिंकी',
  'chanda': 'चंदा',

  // Middle names, titles, relations
  'kumar': 'कुमार',
  'kumari': 'कुमारी',
  'singh': 'सिंह',
  'lal': 'लाल',
  'devi': 'देवी',
  'bai': 'बाई',
  'chand': 'चंद',
  'prasad': 'प्रसाद',
  'kanwar': 'कंवर',
  'das': 'दास',
  'nath': 'नाथ',

  // Castes, Surnames, Mohallas
  'regar': 'रेगर',
  'raigar': 'रेगर',
  'sharma': 'शर्मा',
  'verma': 'वर्मा',
  'gupta': 'गुप्ता',
  'meena': 'मीना',
  'jat': 'जाट',
  'gurjar': 'गुर्जर',
  'gujjar': 'गुर्जर',
  'bhati': 'भाटी',
  'rathore': 'राठौड़',
  'chauhan': 'चौहान',
  'solanki': 'सोलंकी',
  'gehlot': 'गहलोत',
  'choudhary': 'चौधरी',
  'chaudhary': 'चौधरी',
  'patel': 'पटेल',
  'yadav': 'यादव',
  'tiwari': 'तिवारी',
  'joshi': 'जोशी',
  'mali': 'माली',
  'dhaker': 'धाकड़',
  'sen': 'सैन',
  'sain': 'सैन',
  'vaishnav': 'वैष्णव',
  'swami': 'स्वामी',
  'prajapat': 'प्रजापत',
  'kumhar': 'कुम्हार',
  'suthar': 'सुथार',
  'jangid': 'जांगिड़',
  'lohar': 'लोहार',
  'bairwa': 'बैरवा',
  'meghwal': 'मेघवाल',
  'bheel': 'भील',
  'bhil': 'भील',
  'rajput': 'राजपूत',
  'brahmin': 'ब्राह्मण',
  'jain': 'जैन',
  'maheshwari': 'माहेश्वरी',
  'agarwal': 'अग्रवाल',
  'khatik': 'खटीक',
  'dhobi': 'धोबी',
  'nayak': 'नायक',

  // Common Rajasthan village identifiers
  'samodi': 'समोड़ी',
  'kotri': 'कोटड़ी'
};

const CONSONANTS = {
  'ksh': 'क्ष', 'gy': 'ज्ञ', 'jny': 'ज्ञ', 'shr': 'श्र', 'tr': 'त्र',
  'chh': 'छ', 'ch': 'च', 'kh': 'ख', 'gh': 'घ', 'jh': 'झ',
  'th': 'थ', 'dh': 'ध', 'ph': 'फ', 'bh': 'भ', 'shh': 'ष', 'sh': 'श',
  'rh': 'ढ़',
  'k': 'क', 'g': 'ग', 'c': 'क', 'j': 'ज', 't': 'त', 'd': 'द',
  'n': 'न', 'p': 'प', 'b': 'ब', 'm': 'म', 'y': 'य', 'r': 'र',
  'l': 'ल', 'v': 'व', 'w': 'व', 's': 'स', 'h': 'ह', 'z': 'ज़',
  'f': 'फ', 'q': 'क़', 'x': 'क्स'
};

const INITIAL_VOWELS = {
  'aa': 'आ', 'ee': 'ई', 'oo': 'ऊ', 'ai': 'ऐ', 'au': 'औ',
  'a': 'अ', 'i': 'इ', 'u': 'उ', 'e': 'ए', 'o': 'ओ'
};

const MATRAS = {
  'aa': 'ा', 'ee': 'ी', 'oo': 'ू', 'ai': 'ै', 'au': 'ौ',
  'a': '', 'i': 'ि', 'u': 'ु', 'e': 'े', 'o': 'ो'
};

/**
 * Checks if a string contains Devanagari (Hindi) characters.
 */
export function isHindiText(text) {
  if (!text || typeof text !== 'string') return false;
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Checks if a string contains English letters.
 */
export function containsEnglish(text) {
  if (!text || typeof text !== 'string') return false;
  return /[a-zA-Z]/.test(text);
}

/**
 * Transliterates a single English word into Hindi script.
 */
export function transliterateWord(word) {
  if (!word) return '';
  const clean = word.toLowerCase().trim();

  // 1. Check Lexicon for exact known name
  if (INDIAN_NAME_LEXICON[clean]) {
    return INDIAN_NAME_LEXICON[clean];
  }

  // 2. Phonetic Rule-Based Parsing
  let res = '';
  let i = 0;
  let lastWasConsonant = false;

  while (i < clean.length) {
    // Check multi-character consonants
    let matchedConsonant = null;
    let matchedLen = 0;
    for (const len of [3, 2, 1]) {
      const sub = clean.substr(i, len);
      if (CONSONANTS[sub]) {
        matchedConsonant = CONSONANTS[sub];
        matchedLen = len;
        break;
      }
    }

    if (matchedConsonant) {
      if (lastWasConsonant) {
        // Virama (halant) between consecutive consonants
        res += '्';
      }
      res += matchedConsonant;
      lastWasConsonant = true;
      i += matchedLen;
      continue;
    }

    // Check vowels
    let matchedVowel = null;
    let vLen = 0;
    for (const len of [2, 1]) {
      const sub = clean.substr(i, len);
      if (MATRAS[sub] !== undefined) {
        matchedVowel = sub;
        vLen = len;
        break;
      }
    }

    if (matchedVowel !== null) {
      // Ending 'a' on Indian names is almost universally the 'ा' matra (e.g. Pooja, Radha, Anita, Sunita)
      if (matchedVowel === 'a' && i === clean.length - 1 && lastWasConsonant) {
        res += 'ा';
      } else if (lastWasConsonant) {
        res += MATRAS[matchedVowel];
      } else {
        res += INITIAL_VOWELS[matchedVowel];
      }
      lastWasConsonant = false;
      i += vLen;
      continue;
    }

    // Non-letter or punctuation (spaces, numbers, hyphens)
    res += clean[i];
    lastWasConsonant = false;
    i++;
  }

  return res;
}

/**
 * Transliterates full English text (names, full sentences, phrases) to Hindi script.
 * Preserves spaces, punctuation, numbers, and existing Hindi characters.
 */
export function transliterateToHindi(text) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // If text is already completely in Devanagari script, return as-is
  if (!containsEnglish(trimmed) && isHindiText(trimmed)) {
    return text;
  }

  // Check multi-word lexicon match (e.g., 'ramesh kumar', 'naresh kumar regar', 'shyam singh')
  const lowerWhole = trimmed.toLowerCase();
  if (INDIAN_NAME_LEXICON[lowerWhole]) {
    return INDIAN_NAME_LEXICON[lowerWhole];
  }

  // Replace each English word token while preserving delimiters
  return text.replace(/([a-zA-Z]+)/g, (match) => {
    return transliterateWord(match);
  });
}
