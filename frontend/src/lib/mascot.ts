/**
 * Deterministic mascot generator for Forge users.
 * Generates unique, adorable vector mascots (Robots, Kitsune Foxes, Dinos, Cats,
 * Pandas, Bears, Bunnies, Owls, Penguins, Flame Spirits, Aliens, and Frogs)
 * tailored to every user's identity.
 */

export interface MascotPalette {
  bg: string;
  head: string;
  accent: string;
  detail: string;
  blush: string;
  eye: string;
}

export const MASCOT_PALETTES: MascotPalette[] = [
  { bg: "#F4F2F0", head: "#0C0A08", accent: "#E4F222", detail: "#6D6C6B", blush: "#FF8E8E", eye: "#FFFFFF" },
  { bg: "#EBF5FF", head: "#1E3A8A", accent: "#60A5FA", detail: "#93C5FD", blush: "#F87171", eye: "#FFFFFF" },
  { bg: "#FDF2F8", head: "#831843", accent: "#F472B6", detail: "#FBCFE8", blush: "#FB7185", eye: "#FFFFFF" },
  { bg: "#ECFDF5", head: "#064E3B", accent: "#34D399", detail: "#A7F3D0", blush: "#F87171", eye: "#FFFFFF" },
  { bg: "#FFFBEB", head: "#78350F", accent: "#FBBF24", detail: "#FDE68A", blush: "#EF4444", eye: "#FFFFFF" },
  { bg: "#F5F3FF", head: "#4C1D95", accent: "#A78BFA", detail: "#DDD6FE", blush: "#EC4899", eye: "#FFFFFF" },
  { bg: "#FFF1F2", head: "#881337", accent: "#FB7185", detail: "#FECDD3", blush: "#F43F5E", eye: "#FFFFFF" },
  { bg: "#F0FDFA", head: "#134E4A", accent: "#2DD4BF", detail: "#99F6E4", blush: "#F87171", eye: "#FFFFFF" },
];

export const MASCOT_NAMES = [
  "Forge Bot",
  "Cyber Fox",
  "Byte Dino",
  "Pixel Cat",
  "Quantum Panda",
  "Binary Bear",
  "Glitch Bunny",
  "Echo Owl",
  "Kernel Tux",
  "Flame Spirit",
  "Cosmo Alien",
  "Logic Frog",
];

function hashSeed(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Generates an SVG string of a mascot based on the given seed.
 */
export function getMascotSvg(seed: string = "forge-developer"): string {
  const hash = hashSeed(seed || "forge-developer");
  const mascotIndex = hash % 12;
  const paletteIndex = Math.floor(hash / 12) % MASCOT_PALETTES.length;
  const p = MASCOT_PALETTES[paletteIndex];

  let body = "";

  switch (mascotIndex) {
    case 0: // Bot
      body = `
        <line x1="32" y1="12" x2="32" y2="18" stroke="${p.head}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="10" r="3.5" fill="${p.accent}"/>
        <rect x="11" y="28" width="5" height="10" rx="2" fill="${p.head}"/>
        <rect x="48" y="28" width="5" height="10" rx="2" fill="${p.head}"/>
        <rect x="14" y="18" width="36" height="30" rx="8" fill="${p.head}"/>
        <rect x="18" y="22" width="28" height="22" rx="5" fill="#1A1919"/>
        <circle cx="26" cy="30" r="3.5" fill="${p.accent}"/>
        <circle cx="27.5" cy="28.5" r="1.2" fill="#FFFFFF"/>
        <circle cx="38" cy="30" r="3.5" fill="${p.accent}"/>
        <circle cx="39.5" cy="28.5" r="1.2" fill="#FFFFFF"/>
        <rect x="26" y="37" width="12" height="2.5" rx="1.25" fill="${p.accent}"/>
      `;
      break;

    case 1: // Fox
      body = `
        <path d="M16 26 L22 10 L30 22 Z" fill="${p.head}"/>
        <path d="M19 23 L22 13 L27 21 Z" fill="${p.detail}"/>
        <path d="M48 26 L42 10 L34 22 Z" fill="${p.head}"/>
        <path d="M45 23 L42 13 L37 21 Z" fill="${p.detail}"/>
        <ellipse cx="32" cy="36" rx="18" ry="15" fill="${p.head}"/>
        <path d="M18 36 C18 45 25 48 32 48 C39 48 46 45 46 36 C42 38 38 40 32 40 C26 40 22 38 18 36 Z" fill="#FFFFFF"/>
        <path d="M30 40.5 L34 40.5 L32 43 Z" fill="#0C0A08"/>
        <circle cx="25" cy="33" r="3" fill="#0C0A08"/>
        <circle cx="26" cy="32" r="1" fill="#FFFFFF"/>
        <circle cx="39" cy="33" r="3" fill="#0C0A08"/>
        <circle cx="40" cy="32" r="1" fill="#FFFFFF"/>
        <circle cx="21" cy="39" r="2.5" fill="${p.blush}" opacity="0.8"/>
        <circle cx="43" cy="39" r="2.5" fill="${p.blush}" opacity="0.8"/>
      `;
      break;

    case 2: // Dino
      body = `
        <polygon points="24,14 27,9 30,14" fill="${p.accent}"/>
        <polygon points="31,13 34,7 37,13" fill="${p.accent}"/>
        <polygon points="38,14 41,10 44,14" fill="${p.accent}"/>
        <rect x="16" y="15" width="32" height="34" rx="12" fill="${p.head}"/>
        <rect x="18" y="32" width="28" height="15" rx="8" fill="${p.detail}" opacity="0.4"/>
        <circle cx="28" cy="39" r="1.5" fill="#0C0A08"/>
        <circle cx="36" cy="39" r="1.5" fill="#0C0A08"/>
        <circle cx="25" cy="27" r="4" fill="#0C0A08"/>
        <circle cx="26.5" cy="25.5" r="1.5" fill="#FFFFFF"/>
        <circle cx="39" cy="27" r="4" fill="#0C0A08"/>
        <circle cx="40.5" cy="25.5" r="1.5" fill="#FFFFFF"/>
        <circle cx="20" cy="34" r="2.5" fill="${p.blush}" opacity="0.8"/>
        <circle cx="44" cy="34" r="2.5" fill="${p.blush}" opacity="0.8"/>
        <path d="M30 43 Q32 45 34 43" stroke="#0C0A08" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      `;
      break;

    case 3: // Cat
      body = `
        <polygon points="16,26 21,12 28,21" fill="${p.head}"/>
        <polygon points="18,24 21,15 26,20" fill="${p.blush}"/>
        <polygon points="48,26 43,12 36,21" fill="${p.head}"/>
        <polygon points="46,24 43,15 38,20" fill="${p.blush}"/>
        <ellipse cx="32" cy="36" rx="18" ry="14" fill="${p.head}"/>
        <line x1="12" y1="36" x2="20" y2="37" stroke="${p.detail}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="12" y1="41" x2="20" y2="40" stroke="${p.detail}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="52" y1="36" x2="44" y2="37" stroke="${p.detail}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="52" y1="41" x2="44" y2="40" stroke="${p.detail}" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="26" cy="34" r="3.5" fill="${p.eye}"/>
        <circle cx="26" cy="34" r="2.2" fill="#0C0A08"/>
        <circle cx="27" cy="33" r="0.8" fill="#FFFFFF"/>
        <circle cx="38" cy="34" r="3.5" fill="${p.eye}"/>
        <circle cx="38" cy="34" r="2.2" fill="#0C0A08"/>
        <circle cx="39" cy="33" r="0.8" fill="#FFFFFF"/>
        <polygon points="31,39 33,39 32,40.5" fill="${p.blush}"/>
        <path d="M29 42 Q30.5 44 32 42 Q33.5 44 35 42" stroke="#0C0A08" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <circle cx="21" cy="39" r="2.5" fill="${p.blush}" opacity="0.8"/>
        <circle cx="43" cy="39" r="2.5" fill="${p.blush}" opacity="0.8"/>
      `;
      break;

    case 4: // Panda
      body = `
        <circle cx="19" cy="20" r="7" fill="#0C0A08"/>
        <circle cx="45" cy="20" r="7" fill="#0C0A08"/>
        <ellipse cx="32" cy="36" rx="19" ry="16" fill="#FFFFFF"/>
        <ellipse cx="24" cy="34" rx="5.5" ry="6.5" fill="#0C0A08" transform="rotate(-15 24 34)"/>
        <ellipse cx="40" cy="34" rx="5.5" ry="6.5" fill="#0C0A08" transform="rotate(15 40 34)"/>
        <circle cx="24.5" cy="33.5" r="2" fill="#FFFFFF"/>
        <circle cx="39.5" cy="33.5" r="2" fill="#FFFFFF"/>
        <ellipse cx="32" cy="41" rx="3.5" ry="2.2" fill="#0C0A08"/>
        <path d="M30 44 Q32 46 34 44" stroke="#0C0A08" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <circle cx="18" cy="41" r="3" fill="${p.blush}" opacity="0.7"/>
        <circle cx="46" cy="41" r="3" fill="${p.blush}" opacity="0.7"/>
      `;
      break;

    case 5: // Bear
      body = `
        <circle cx="19" cy="20" r="6.5" fill="${p.head}"/>
        <circle cx="19" cy="20" r="3.5" fill="${p.detail}"/>
        <circle cx="45" cy="20" r="6.5" fill="${p.head}"/>
        <circle cx="45" cy="20" r="3.5" fill="${p.detail}"/>
        <circle cx="32" cy="35" r="17" fill="${p.head}"/>
        <ellipse cx="32" cy="40" rx="8" ry="6" fill="#FFFFFF"/>
        <path d="M30 38 L34 38 L32 40.5 Z" fill="#0C0A08"/>
        <path d="M30 42 Q32 44.5 34 42" stroke="#0C0A08" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <circle cx="25" cy="31" r="2.8" fill="#0C0A08"/>
        <circle cx="26" cy="30" r="1" fill="#FFFFFF"/>
        <circle cx="39" cy="31" r="2.8" fill="#0C0A08"/>
        <circle cx="40" cy="30" r="1" fill="#FFFFFF"/>
        <circle cx="19" cy="37" r="2.8" fill="${p.blush}" opacity="0.8"/>
        <circle cx="45" cy="37" r="2.8" fill="${p.blush}" opacity="0.8"/>
      `;
      break;

    case 6: // Bunny
      body = `
        <ellipse cx="23" cy="18" rx="5" ry="12" fill="${p.head}"/>
        <ellipse cx="23" cy="18" rx="2.5" ry="9" fill="${p.blush}"/>
        <ellipse cx="41" cy="18" rx="5" ry="12" fill="${p.head}"/>
        <ellipse cx="41" cy="18" rx="2.5" ry="9" fill="${p.blush}"/>
        <ellipse cx="32" cy="37" rx="17" ry="14" fill="${p.head}"/>
        <circle cx="25" cy="34" r="3" fill="#0C0A08"/>
        <circle cx="26" cy="33" r="1" fill="#FFFFFF"/>
        <circle cx="39" cy="34" r="3" fill="#0C0A08"/>
        <circle cx="40" cy="33" r="1" fill="#FFFFFF"/>
        <polygon points="31,39 33,39 32,40.5" fill="${p.blush}"/>
        <path d="M30 42 Q32 44 34 42" stroke="#0C0A08" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        <circle cx="20" cy="40" r="3" fill="${p.blush}" opacity="0.8"/>
        <circle cx="44" cy="40" r="3" fill="${p.blush}" opacity="0.8"/>
      `;
      break;

    case 7: // Owl
      body = `
        <polygon points="17,23 20,13 26,20" fill="${p.head}"/>
        <polygon points="47,23 44,13 38,20" fill="${p.head}"/>
        <ellipse cx="32" cy="36" rx="18" ry="16" fill="${p.head}"/>
        <circle cx="24" cy="33" r="8" fill="#FFFFFF"/>
        <circle cx="40" cy="33" r="8" fill="#FFFFFF"/>
        <circle cx="24" cy="33" r="7" fill="${p.detail}" opacity="0.3"/>
        <circle cx="40" cy="33" r="7" fill="${p.detail}" opacity="0.3"/>
        <circle cx="24" cy="33" r="4" fill="#0C0A08"/>
        <circle cx="25.5" cy="31.5" r="1.5" fill="#FFFFFF"/>
        <circle cx="40" cy="33" r="4" fill="#0C0A08"/>
        <circle cx="41.5" cy="31.5" r="1.5" fill="#FFFFFF"/>
        <polygon points="30,36 34,36 32,43" fill="${p.accent}"/>
        <path d="M28 47 Q32 49 36 47" stroke="${p.detail}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      `;
      break;

    case 8: // Penguin
      body = `
        <ellipse cx="32" cy="36" rx="18" ry="17" fill="#0C0A08"/>
        <path d="M22 28 C18 36 22 47 32 47 C42 47 46 36 42 28 C38 28 35 32 32 32 C29 32 26 28 22 28 Z" fill="#FFFFFF"/>
        <circle cx="27" cy="34" r="2.5" fill="#0C0A08"/>
        <circle cx="27.8" cy="33.2" r="0.8" fill="#FFFFFF"/>
        <circle cx="37" cy="34" r="2.5" fill="#0C0A08"/>
        <circle cx="37.8" cy="33.2" r="0.8" fill="#FFFFFF"/>
        <ellipse cx="32" cy="38" rx="4" ry="2.5" fill="#F59E0B"/>
        <circle cx="22" cy="39" r="2.5" fill="${p.blush}" opacity="0.8"/>
        <circle cx="42" cy="39" r="2.5" fill="${p.blush}" opacity="0.8"/>
      `;
      break;

    case 9: // Flame Spirit
      body = `
        <path d="M32 10 C32 10 20 22 18 34 C16 44 23 50 32 50 C41 50 48 44 46 34 C44 24 37 18 32 10 Z" fill="${p.accent}"/>
        <path d="M32 22 C32 22 25 30 24 37 C23 43 27 46 32 46 C37 46 41 43 40 37 C39 30 35 27 32 22 Z" fill="${p.head}"/>
        <circle cx="28" cy="35" r="2.8" fill="${p.accent}"/>
        <circle cx="29" cy="34" r="1" fill="#FFFFFF"/>
        <circle cx="36" cy="35" r="2.8" fill="${p.accent}"/>
        <circle cx="37" cy="34" r="1" fill="#FFFFFF"/>
        <path d="M30 40 Q32 42 34 40" stroke="${p.accent}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        <circle cx="42" cy="16" r="2" fill="${p.accent}"/>
      `;
      break;

    case 10: // Alien
      body = `
        <path d="M32 18 Q30 11 32 8" stroke="${p.head}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <circle cx="32" cy="7" r="3" fill="${p.accent}"/>
        <ellipse cx="32" cy="35" rx="19" ry="16" fill="${p.head}"/>
        <circle cx="24" cy="33" r="3.2" fill="${p.accent}"/>
        <circle cx="25" cy="32" r="1" fill="#FFFFFF"/>
        <circle cx="32" cy="27" r="3.8" fill="${p.accent}"/>
        <circle cx="33.2" cy="25.8" r="1.2" fill="#FFFFFF"/>
        <circle cx="40" cy="33" r="3.2" fill="${p.accent}"/>
        <circle cx="41" cy="32" r="1" fill="#FFFFFF"/>
        <ellipse cx="32" cy="41" rx="2.5" ry="3" fill="#0C0A08"/>
        <circle cx="19" cy="38" r="1.5" fill="${p.accent}"/>
        <circle cx="45" cy="38" r="1.5" fill="${p.accent}"/>
      `;
      break;

    case 11: // Froggy
    default:
      body = `
        <circle cx="22" cy="22" r="7" fill="${p.head}"/>
        <circle cx="22" cy="22" r="4.5" fill="#FFFFFF"/>
        <circle cx="22" cy="22" r="2.8" fill="#0C0A08"/>
        <circle cx="23" cy="21" r="1" fill="#FFFFFF"/>
        <circle cx="42" cy="22" r="7" fill="${p.head}"/>
        <circle cx="42" cy="22" r="4.5" fill="#FFFFFF"/>
        <circle cx="42" cy="22" r="2.8" fill="#0C0A08"/>
        <circle cx="43" cy="21" r="1" fill="#FFFFFF"/>
        <ellipse cx="32" cy="36" rx="20" ry="14" fill="${p.head}"/>
        <path d="M20 37 Q32 46 44 37" stroke="#0C0A08" stroke-width="2" stroke-linecap="round" fill="none"/>
        <circle cx="29" cy="33" r="1" fill="#0C0A08"/>
        <circle cx="35" cy="33" r="1" fill="#0C0A08"/>
        <circle cx="17" cy="37" r="3" fill="${p.blush}" opacity="0.8"/>
        <circle cx="47" cy="37" r="3" fill="${p.blush}" opacity="0.8"/>
      `;
      break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="${p.bg}"/>${body}</svg>`;
}

/**
 * Returns a data URI for the mascot SVG that can be used directly as an image src.
 */
export function getMascotAvatar(seed: string = "forge-developer"): string {
  const svg = getMascotSvg(seed);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns descriptive mascot metadata.
 */
export function getMascotInfo(seed: string = "forge-developer"): { name: string; species: string } {
  const hash = hashSeed(seed || "forge-developer");
  const index = hash % 12;
  return {
    name: MASCOT_NAMES[index],
    species: MASCOT_NAMES[index].split(" ")[1] || "Mascot",
  };
}
