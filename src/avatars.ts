// 30 iconic game character avatars — assigned to new users based on hash of their ID
// Using high-quality game cover art from IGDB as character avatars

const AVATAR_COVERS = [
  { name: 'Mario', imageId: 'co7kjl' },          // Super Mario Odyssey
  { name: 'Link', imageId: 'co5vmg' },            // Zelda: Tears of the Kingdom
  { name: 'Kirby', imageId: 'co4yjz' },           // Kirby and the Forgotten Land
  { name: 'Samus', imageId: 'co935n' },            // Metroid Dread
  { name: 'Pikachu', imageId: 'co3d03' },          // Pokemon Legends: Arceus
  { name: 'Sonic', imageId: 'co5p52' },            // Sonic Frontiers
  { name: 'Crash', imageId: 'co62ao' },            // Cuphead (iconic style)
  { name: 'Ori', imageId: 'co2e1l' },              // Ori and the Will of the Wisps
  { name: 'Hollow Knight', imageId: 'cobfzp' },    // Hollow Knight
  { name: 'Celeste', imageId: 'cob9dh' },          // Celeste
  { name: 'Stardew', imageId: 'coa93h' },          // Stardew Valley
  { name: 'Animal Crossing', imageId: 'co3wls' },  // Animal Crossing: New Horizons
  { name: 'Pikmin', imageId: 'coba9h' },           // Pikmin 4
  { name: 'Splatoon', imageId: 'co59x3' },         // Splatoon 3
  { name: 'Hades', imageId: 'co4rs3' },            // Hades
  { name: 'Undertale', imageId: 'cob1t2' },        // Undertale
  { name: 'Spiritfarer', imageId: 'co2fe7' },      // Spiritfarer
  { name: 'Gris', imageId: 'co1qv5' },             // Gris
  { name: 'Abzu', imageId: 'co28sy' },             // Abzu
  { name: 'Wandersong', imageId: 'co1oey' },       // Wandersong
  { name: 'Chicory', imageId: 'coayhk' },          // Chicory: A Colorful Tale
  { name: 'Coffee Talk', imageId: 'co55rx' },      // Coffee Talk
  { name: 'Unpacking', imageId: 'co2879' },        // Unpacking
  { name: 'Slime Rancher', imageId: 'co73i2' },    // Slime Rancher
  { name: 'Astro Bot', imageId: 'coba3k' },        // Astro Bot
  { name: 'Ratchet', imageId: 'co2str' },          // Ratchet & Clank: Rift Apart
  { name: 'Psychonauts', imageId: 'co1sod' },      // Psychonauts 2
  { name: 'Kena', imageId: 'co9hwy' },             // Kena: Bridge of Spirits
  { name: 'It Takes Two', imageId: 'cob22v' },     // It Takes Two
  { name: 'Sackboy', imageId: 'co4522' },          // Sackboy: A Big Adventure
];

/**
 * Get a deterministic avatar URL for a user based on their ID.
 * Uses IGDB cover art thumbnails cropped to square.
 */
export function getDefaultAvatar(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATAR_COVERS.length;
  const cover = AVATAR_COVERS[index];
  // t_thumb is 90x90 square crop from IGDB
  return `https://images.igdb.com/igdb/image/upload/t_thumb/${cover.imageId}.jpg`;
}

/**
 * Get avatar URL — use user's uploaded avatar if available, otherwise deterministic default.
 */
export function getAvatarUrl(userId: string, uploadedAvatarUrl?: string): string {
  const normalized = uploadedAvatarUrl?.trim();
  if (normalized) return normalized;
  return getDefaultAvatar(userId);
}

export { AVATAR_COVERS };
