import { imageUrl } from './api';

// 10 themed sets of 15 cover image IDs. Zero API calls on login.
// Each set is a coherent theme. One is randomly picked per page load.

const CAROUSEL_SETS: { name: string; covers: string[] }[] = [
  {
    name: 'Cozy & Relaxing',
    covers: [
      'coa93h', // Stardew Valley
      'co3wls', // Animal Crossing: New Horizons
      'co6e83', // A Short Hike
      'co2879', // Unpacking
      'co55rx', // Coffee Talk
      'co2fe7', // Spiritfarer
      'co3u2x', // Cozy Grove
      'co3iua', // Garden Story
      'co6lvg', // Wylde Flowers
      'co2dfx', // Ooblets
      'co1l12', // Littlewood
      'co73i2', // Slime Rancher
      'co1oey', // Wandersong
      'coayhk', // Chicory: A Colorful Tale
      'cobav7', // Yoshi's Crafted World
    ],
  },
  {
    name: 'Adventure & Exploration',
    covers: [
      'co5vmg', // Zelda: Tears of the Kingdom
      'co65ac', // Outer Wilds
      'co28sy', // Abzu
      'co1qv5', // Gris
      'co2e1l', // Ori and the Will of the Wisps
      'co2s0m', // Ori and the Blind Forest
      'cobfzp', // Hollow Knight
      'cob9dh', // Celeste
      'co2crj', // Ghost of Tsushima
      'co1r7h', // Uncharted 4
      'co9hwy', // Kena: Bridge of Spirits
      'co4522', // Sackboy: A Big Adventure
      'co2str', // Ratchet & Clank: Rift Apart
      'co1sod', // Psychonauts 2
      'co935n', // Metroid Dread
    ],
  },
  {
    name: 'Nintendo Favorites',
    covers: [
      'co4yjz', // Kirby and the Forgotten Land
      'coba9h', // Pikmin 4
      'co59x3', // Splatoon 3
      'co22a9', // Luigi's Mansion 3
      'co2255', // Super Smash Bros. Ultimate
      'co3d03', // Pokemon Legends: Arceus
      'co5vmg', // Zelda: Tears of the Kingdom
      'cobav7', // Yoshi's Crafted World
      'cob89j', // Paper Mario: The Origami King
      'co7pmi', // DK Country: Tropical Freeze
      'co1n8t', // Fire Emblem: Three Houses
      'co4z2i', // Bayonetta 3
      'co3wls', // Animal Crossing: New Horizons
      'coba3k', // Astro Bot
      'co4rs3', // Hades
    ],
  },
  {
    name: 'Building & Simulation',
    covers: [
      'co8fu7', // Minecraft
      'coaamg', // Terraria
      'co8y08', // Planet Coaster
      'coa93h', // Stardew Valley
      'co73i2', // Slime Rancher
      'co1l12', // Littlewood
      'co3iua', // Garden Story
      'co2dfx', // Ooblets
      'co6lvg', // Wylde Flowers
      'co3u2x', // Cozy Grove
      'co2879', // Unpacking
      'cob22v', // It Takes Two
      'co4522', // Sackboy: A Big Adventure
      'co4yjz', // Kirby and the Forgotten Land
      'co2fe7', // Spiritfarer
    ],
  },
  {
    name: 'Story & Narrative',
    covers: [
      'cob1ts', // Firewatch
      'co2hlq', // Oxenfree
      'co1rbj', // What Remains of Edith Finch
      'cob1t2', // Undertale
      'co4rs3', // Hades
      'co55rx', // Coffee Talk
      'co1qv5', // Gris
      'co27j9', // Return of the Obra Dinn
      'co401c', // Inscryption
      'co2fe7', // Spiritfarer
      'co1oey', // Wandersong
      'coayhk', // Chicory: A Colorful Tale
      'co65ac', // Outer Wilds
      'co1r7h', // Uncharted 4
      'co2crj', // Ghost of Tsushima
    ],
  },
  {
    name: 'Indie Gems',
    covers: [
      'co62ao', // Cuphead
      'cobaa7', // Shovel Knight
      'co1isp', // Katana Zero
      'co4dwx', // Hyper Light Drifter
      'co401c', // Inscryption
      'co27j9', // Return of the Obra Dinn
      'co25ni', // Braid
      'co1uqz', // Superliminal
      'co2ws9', // Manifold Garden
      'co3kby', // Gorogoa
      'cob9dh', // Celeste
      'cobfzp', // Hollow Knight
      'co6e83', // A Short Hike
      'co2879', // Unpacking
      'co3hih', // The Witness
    ],
  },
  {
    name: 'RPG & Fantasy',
    covers: [
      'cobcwt', // Final Fantasy VII Remake
      'co1x9d', // Dragon Quest XI
      'co1rbw', // Ni no Kuni
      'cob89j', // Paper Mario: The Origami King
      'co87df', // Chrono Trigger
      'co670h', // Baldur's Gate III
      'co4rs3', // Hades
      'cob1t2', // Undertale
      'co2e1l', // Ori and the Will of the Wisps
      'cobfzp', // Hollow Knight
      'co5vmg', // Zelda: Tears of the Kingdom
      'co2crj', // Ghost of Tsushima
      'co1n8t', // Fire Emblem: Three Houses
      'co9hwy', // Kena: Bridge of Spirits
      'co2str', // Ratchet & Clank: Rift Apart
    ],
  },
  {
    name: 'Puzzle & Chill',
    covers: [
      'co2kfy', // Tetris Effect
      'co3hih', // The Witness
      'co25ni', // Braid
      'co3kby', // Gorogoa
      'co1uqz', // Superliminal
      'co2ws9', // Manifold Garden
      'co2879', // Unpacking
      'co6e83', // A Short Hike
      'co27j9', // Return of the Obra Dinn
      'co401c', // Inscryption
      'cob1t2', // Undertale
      'co55rx', // Coffee Talk
      'co1oey', // Wandersong
      'coayhk', // Chicory: A Colorful Tale
      'co1qv5', // Gris
    ],
  },
  {
    name: 'Action & Fun',
    covers: [
      'cobg1j', // Spider-Man: Miles Morales
      'co2str', // Ratchet & Clank: Rift Apart
      'co1sod', // Psychonauts 2
      'cob22v', // It Takes Two
      'co4522', // Sackboy: A Big Adventure
      'co62ao', // Cuphead
      'co59x3', // Splatoon 3
      'co2255', // Super Smash Bros. Ultimate
      'co935n', // Metroid Dread
      'co4z2i', // Bayonetta 3
      'co5p52', // Sonic Frontiers
      'co4nzt', // Deathloop
      'coba3k', // Astro Bot
      'co4rs3', // Hades
      'co1isp', // Katana Zero
    ],
  },
  {
    name: 'Colorful Worlds',
    covers: [
      'coayhk', // Chicory: A Colorful Tale
      'co1qv5', // Gris
      'co2e1l', // Ori and the Will of the Wisps
      'co4yjz', // Kirby and the Forgotten Land
      'co3wls', // Animal Crossing: New Horizons
      'coa93h', // Stardew Valley
      'coba9h', // Pikmin 4
      'co6e83', // A Short Hike
      'co62ao', // Cuphead
      'co5p52', // Sonic Frontiers
      'cobav7', // Yoshi's Crafted World
      'co1oey', // Wandersong
      'co28sy', // Abzu
      'co2fe7', // Spiritfarer
      'co73i2', // Slime Rancher
    ],
  },
];

export function getRandomCarouselCovers(): string[][] {
  const set = CAROUSEL_SETS[Math.floor(Math.random() * CAROUSEL_SETS.length)];
  // Shuffle within the set
  const shuffled = [...set.covers];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // Distribute round-robin into 3 columns
  const cols: string[][] = [[], [], []];
  shuffled.forEach((id, i) => cols[i % 3].push(id));
  return cols.map((col) =>
    col.map((id) => imageUrl(id, 't_cover_small_2x'))
  );
}
