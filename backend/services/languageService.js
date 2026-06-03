function getLanguagePrompt(language) {
  switch (language) {
    case 'am':
      return `
IMPORTANT — You MUST follow these language rules:
1. Respond ONLY in Amharic (አማርኛ).
2. Use formal Ethiopian government-style Amharic.
3. ALL headings, summaries, statistics, reports, recommendations must be in Amharic.
4. Translate ALL section titles, labels, and descriptions.
5. Keep numbers, member names, and sector names unchanged.
6. Do NOT mix English words unless necessary for proper names or technical terms.
7. Never switch to English mid-response.`;

    case 'om':
      return `
IMPORTANT — You MUST follow these language rules:
1. Respond ONLY in Afaan Oromo.
2. Use formal administrative Afaan Oromo.
3. ALL headings, summaries, statistics, reports, recommendations must be in Afaan Oromo.
4. Translate ALL section titles, labels, and descriptions.
5. Keep numbers, member names, and sector names unchanged.
6. Do NOT mix English words unless necessary for proper names or technical terms.
7. Never switch to English mid-response.`;

    default:
      return `
IMPORTANT — You MUST follow these language rules:
1. Respond ONLY in English.
2. Use professional administrative tone.
3. Keep responses clear, structured, and suitable for government use.`;
  }
}

function detectLanguage(text = '') {
  if (/[\u1200-\u137F]/.test(text)) return 'am';
  const oromoKeywords = ['mee', 'akka', 'maal', 'yoom', 'eessa', 'kam', 'kana', 'kanas', 'maalif'];
  if (oromoKeywords.some(k => text.toLowerCase().includes(k))) return 'om';
  return 'en';
}

module.exports = { getLanguagePrompt, detectLanguage };
