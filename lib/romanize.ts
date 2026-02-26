const devanagariRegex = /[\u0900-\u097F]/;

const independentVowelMap: Record<string, string> = {
  "अ": "a",
  "आ": "aa",
  "इ": "i",
  "ई": "ee",
  "उ": "u",
  "ऊ": "oo",
  "ऋ": "ri",
  "ए": "e",
  "ऐ": "ai",
  "ओ": "o",
  "औ": "au",
};

const vowelSignMap: Record<string, string> = {
  "ा": "aa",
  "ि": "i",
  "ी": "ee",
  "ु": "u",
  "ू": "oo",
  "ृ": "ri",
  "े": "e",
  "ै": "ai",
  "ो": "o",
  "ौ": "au",
};

const consonantMap: Record<string, string> = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
  "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
  "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh",
  "ष": "sh", "स": "s", "ह": "h", "क़": "q", "ख़": "kh",
  "ग़": "gh", "ज़": "z", "फ़": "f", "ड़": "r", "ढ़": "rh",
};

function toTitleCase(input: string): string {
  return input
    .split(/(\s+)/)
    .map((part) => (part.trim() ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
    .join("");
}

function romanizeCore(token: string): string {
  let output = "";

  for (let index = 0; index < token.length; index += 1) {
    const char = token[index];

    if (char in independentVowelMap) {
      output += independentVowelMap[char];
      continue;
    }

    if (char in consonantMap) {
      const next = token[index + 1];

      if (next === "्") {
        output += consonantMap[char];
        index += 1;
        continue;
      }

      if (next && next in vowelSignMap) {
        output += consonantMap[char] + vowelSignMap[next];
        index += 1;
        continue;
      }

      output += consonantMap[char] + "a";
      continue;
    }

    if (char === "ं" || char === "ँ") {
      output += "n";
    } else if (char === "ः") {
      output += "h";
    } else if (char === "।") {
      output += ".";
    } else if (char === "॥") {
      output += "..";
    } else if (!devanagariRegex.test(char)) {
      output += char;
    }
  }

  return output.replace(/a$/g, "");
}

function romanizeToken(token: string): string {
  if (token === "श्री") return "Shri";
  if (token.startsWith("श्री")) {
    return `Shri ${romanizeCore(token.slice(3))}`.trim();
  }
  return romanizeCore(token);
}

export function containsDevanagari(content: string): boolean {
  return devanagariRegex.test(content);
}

export function romanizeDevanagari(content: string, options?: { titleCase?: boolean }): string {
  const titleCase = options?.titleCase ?? true;
  const romanized = content
    .split(/(\s+)/)
    .map((token) => (token.trim() ? romanizeToken(token) : token))
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  return titleCase ? toTitleCase(romanized) : romanized;
}

export function validateRomanizedLatin(content: string): { hasDevanagari: boolean; offendingCharacters: string[] } {
  const offendingCharacters = Array.from(new Set(content.match(/[\u0900-\u097F]/g) ?? []));
  return { hasDevanagari: offendingCharacters.length > 0, offendingCharacters };
}
