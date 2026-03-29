#!/bin/bash
# Seed script: Creates 6 ambassador accounts, adds games to collections,
# creates journal posts, and adds journal posts to the user's account.

API="https://playnist-api.jasper-414.workers.dev"

echo "=== Creating 6 Ambassador Accounts ==="

# Ambassador 1: SkyeVault
echo "Creating SkyeVault..."
R1=$(curl -s -X POST "$API/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"skye.vault@playnist.test","password":"${AMBASSADOR_PASSWORD:-TestPass123!}","username":"SkyeVault","bio":"RPG enthusiast and speedrunner. If it has a level-up system, I have played it."}')
T1=$(echo "$R1" | jq -r '.token')
U1=$(echo "$R1" | jq -r '.user.id')
echo "  Token: ${T1:0:20}... ID: $U1"

# Ambassador 2: PixelNova
echo "Creating PixelNova..."
R2=$(curl -s -X POST "$API/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"pixel.nova@playnist.test","password":"${AMBASSADOR_PASSWORD:-TestPass123!}","username":"PixelNova","bio":"Indie game curator and retro collector. Finding hidden gems since 2008."}')
T2=$(echo "$R2" | jq -r '.token')
U2=$(echo "$R2" | jq -r '.user.id')
echo "  Token: ${T2:0:20}... ID: $U2"

# Ambassador 3: LunaPlays
echo "Creating LunaPlays..."
R3=$(curl -s -X POST "$API/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"luna.plays@playnist.test","password":"${AMBASSADOR_PASSWORD:-TestPass123!}","username":"LunaPlays","bio":"Story-driven game lover. I cry at every ending and I am not ashamed."}')
T3=$(echo "$R3" | jq -r '.token')
U3=$(echo "$R3" | jq -r '.user.id')
echo "  Token: ${T3:0:20}... ID: $U3"

# Ambassador 4: ZenithGG
echo "Creating ZenithGG..."
R4=$(curl -s -X POST "$API/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"zenith.gg@playnist.test","password":"${AMBASSADOR_PASSWORD:-TestPass123!}","username":"ZenithGG","bio":"Competitive gamer turned chill collector. Documenting every boss fight."}')
T4=$(echo "$R4" | jq -r '.token')
U4=$(echo "$R4" | jq -r '.user.id')
echo "  Token: ${T4:0:20}... ID: $U4"

# Ambassador 5: EmberQuest
echo "Creating EmberQuest..."
R5=$(curl -s -X POST "$API/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"ember.quest@playnist.test","password":"${AMBASSADOR_PASSWORD:-TestPass123!}","username":"EmberQuest","bio":"Open-world explorer. 200+ hours in every Bethesda game. No fast travel."}')
T5=$(echo "$R5" | jq -r '.token')
U5=$(echo "$R5" | jq -r '.user.id')
echo "  Token: ${T5:0:20}... ID: $U5"

# Ambassador 6: NightOwlGames
echo "Creating NightOwlGames..."
R6=$(curl -s -X POST "$API/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"nightowl@playnist.test","password":"${AMBASSADOR_PASSWORD:-TestPass123!}","username":"NightOwlGames","bio":"Horror and survival specialist. Playing in the dark is the only way."}')
T6=$(echo "$R6" | jq -r '.token')
U6=$(echo "$R6" | jq -r '.user.id')
echo "  Token: ${T6:0:20}... ID: $U6"

# Game IDs from trending/popular
# GTA V: 45131, Skyrim AE: 165192, Witcher 3 GOTY: 22439, Bloodborne: 42931
# We'll also use: Hollow Knight: 26758, Celeste: 24426, Hades: 116754, Stardew: 17000
# Elden Ring: 119133, BotW: 7346, Disco Elysium: 23827, Outer Wilds: 26959

echo ""
echo "=== Adding Games to Ambassador Collections ==="

# SkyeVault - RPG focus
for gid in 165192 22439 42931 119133; do
  curl -s -X POST "$API/collection" -H "Content-Type: application/json" -H "Authorization: Bearer $T1" -d "{\"igdb_game_id\":$gid,\"status\":\"played\"}" > /dev/null
done
for gid in 45131 26758; do
  curl -s -X POST "$API/collection" -H "Content-Type: application/json" -H "Authorization: Bearer $T1" -d "{\"igdb_game_id\":$gid,\"status\":\"playing\"}" > /dev/null
done
echo "  SkyeVault: 6 games added"

# PixelNova - Indie focus
for gid in 26758 24426 116754; do
  curl -s -X POST "$API/collection" -H "Content-Type: application/json" -H "Authorization: Bearer $T2" -d "{\"igdb_game_id\":$gid,\"status\":\"played\"}" > /dev/null
done
for gid in 22439 42931; do
  curl -s -X POST "$API/collection" -H "Content-Type: application/json" -H "Authorization: Bearer $T2" -d "{\"igdb_game_id\":$gid,\"status\":\"want_to_play\"}" > /dev/null
done
echo "  PixelNova: 5 games added"

# LunaPlays - Story focus
for gid in 22439 42931 165192; do
  curl -s -X POST "$API/collection" -H "Content-Type: application/json" -H "Authorization: Bearer $T3" -d "{\"igdb_game_id\":$gid,\"status\":\"played\"}" > /dev/null
done
for gid in 119133 116754; do
  curl -s -X POST "$API/collection" -H "Content-Type: application/json" -H "Authorization: Bearer $T3" -d "{\"igdb_game_id\":$gid,\"status\":\"playing\"}" > /dev/null
done
echo "  LunaPlays: 5 games added"

# ZenithGG - Competitive/action
for gid in 45131 119133 42931; do
  curl -s -X POST "$API/collection" -H "Content-Type: application/json" -H "Authorization: Bearer $T4" -d "{\"igdb_game_id\":$gid,\"status\":\"played\"}" > /dev/null
done
for gid in 165192 26758; do
  curl -s -X POST "$API/collection" -H "Content-Type: application/json" -H "Authorization: Bearer $T4" -d "{\"igdb_game_id\":$gid,\"status\":\"want_to_play\"}" > /dev/null
done
echo "  ZenithGG: 5 games added"

# EmberQuest - Open world
for gid in 165192 45131 22439 119133; do
  curl -s -X POST "$API/collection" -H "Content-Type: application/json" -H "Authorization: Bearer $T5" -d "{\"igdb_game_id\":$gid,\"status\":\"played\"}" > /dev/null
done
for gid in 116754; do
  curl -s -X POST "$API/collection" -H "Content-Type: application/json" -H "Authorization: Bearer $T5" -d "{\"igdb_game_id\":$gid,\"status\":\"playing\"}" > /dev/null
done
echo "  EmberQuest: 5 games added"

# NightOwlGames - Horror/survival
for gid in 42931 26758; do
  curl -s -X POST "$API/collection" -H "Content-Type: application/json" -H "Authorization: Bearer $T6" -d "{\"igdb_game_id\":$gid,\"status\":\"played\"}" > /dev/null
done
for gid in 119133 165192 24426; do
  curl -s -X POST "$API/collection" -H "Content-Type: application/json" -H "Authorization: Bearer $T6" -d "{\"igdb_game_id\":$gid,\"status\":\"want_to_play\"}" > /dev/null
done
echo "  NightOwlGames: 5 games added"

echo ""
echo "=== Creating Ambassador Journal Posts ==="

# SkyeVault journals
curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $T1" \
  -d '{"igdb_game_id":165192,"content":"Finally completed every guild questline in Skyrim Anniversary Edition. The Thieves Guild storyline is still the best one after all these years. The new Creation Club content adds some nice variety but the core experience remains untouched perfection."}' > /dev/null
curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $T1" \
  -d '{"igdb_game_id":119133,"content":"Elden Ring has ruined other open worlds for me. Every cave, every ruin has something worth finding. No filler content, no pointless collectibles. Just pure exploration rewarded at every turn."}' > /dev/null
echo "  SkyeVault: 2 journal posts"

# PixelNova journals
curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $T2" \
  -d '{"igdb_game_id":26758,"content":"Hollow Knight is the gold standard for indie metroidvanias. The art direction, the music, the tight controls — everything clicks. Team Cherry created something that stands toe to toe with any AAA title."}' > /dev/null
curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $T2" \
  -d '{"igdb_game_id":116754,"content":"Just beat Hades for the 50th time and somehow it still feels fresh. The dialogue system is incredible — Supergiant really nailed the roguelike narrative loop. Every run teaches you something new."}' > /dev/null
echo "  PixelNova: 2 journal posts"

# LunaPlays journals
curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $T3" \
  -d '{"igdb_game_id":22439,"content":"The Witcher 3 Blood and Wine DLC is basically a full game on its own. Toussaint is gorgeous and the story hits different on a second playthrough. Regis is one of the best written characters in gaming."}' > /dev/null
curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $T3" \
  -d '{"igdb_game_id":42931,"content":"Bloodborne changed how I think about difficulty in games. It is not about punishment — it is about learning patterns and earning your progress. The Lovecraftian atmosphere is unmatched."}' > /dev/null
echo "  LunaPlays: 2 journal posts"

# ZenithGG journals
curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $T4" \
  -d '{"igdb_game_id":45131,"content":"GTA V Online has evolved into something completely different from what it started as. The Cayo Perico heist is the best solo content they have added. Still playing after all these years."}' > /dev/null
echo "  ZenithGG: 1 journal post"

# EmberQuest journals
curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $T5" \
  -d '{"igdb_game_id":165192,"content":"Started a new Skyrim playthrough with zero fast travel and survival mode on. The world feels completely different when you have to plan routes and manage resources. This is how it was meant to be played."}' > /dev/null
curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $T5" \
  -d '{"igdb_game_id":45131,"content":"Drove from one end of the GTA V map to the other without using the minimap. The environmental storytelling in this game is insane — every neighborhood tells its own story through architecture and atmosphere."}' > /dev/null
echo "  EmberQuest: 2 journal posts"

# NightOwlGames journals
curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $T6" \
  -d '{"igdb_game_id":42931,"content":"Playing Bloodborne at 2am with headphones is a different experience entirely. The audio design carries so much of the horror. Every footstep in the Forbidden Woods had me on edge."}' > /dev/null
echo "  NightOwlGames: 1 journal post"

echo ""
echo "=== Setting Ambassador Flags via D1 ==="
echo "Run these commands manually with wrangler:"
echo ""
echo "cd worker && npx wrangler d1 execute playnist-db --remote --command=\"UPDATE users SET is_ambassador = 1 WHERE username IN ('SkyeVault','PixelNova','LunaPlays','ZenithGG','EmberQuest','NightOwlGames');\""
echo ""

# Complete onboarding for all ambassadors
echo "=== Completing Onboarding for Ambassadors ==="
for TOKEN in $T1 $T2 $T3 $T4 $T5 $T6; do
  curl -s -X PATCH "$API/me" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
    -d '{"onboarding_step":3}' > /dev/null
done
echo "  All ambassadors onboarding completed"

echo ""
echo "=== Ambassador User IDs ==="
echo "SkyeVault:      $U1"
echo "PixelNova:      $U2"
echo "LunaPlays:      $U3"
echo "ZenithGG:       $U4"
echo "EmberQuest:     $U5"
echo "NightOwlGames:  $U6"

echo ""
echo "=== Now add journal posts to YOUR account ==="
echo "Enter your auth token (from localStorage 'playnist_token'):"
read -rs MY_TOKEN
echo ""

if [ -n "$MY_TOKEN" ]; then
  echo "Adding journal posts to your account..."

  curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $MY_TOKEN" \
    -d '{"igdb_game_id":45131,"content":"GTA V holds up incredibly well. The attention to detail in Los Santos is something most modern open worlds still cannot match. Every corner has a story waiting to be found."}' > /dev/null

  curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $MY_TOKEN" \
    -d '{"igdb_game_id":165192,"content":"Started modding Skyrim Anniversary Edition and completely lost track of time. Three hours of installing mods, twenty minutes of actual gameplay. Worth it."}' > /dev/null

  curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $MY_TOKEN" \
    -d '{"igdb_game_id":22439,"content":"The Witcher 3 Gwent minigame is genuinely one of the best card games ever made. I spent more time collecting cards than fighting monsters on this playthrough."}' > /dev/null

  curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $MY_TOKEN" \
    -d '{"igdb_game_id":119133,"content":"Finally beat Malenia in Elden Ring. Took 47 attempts. My hands were shaking. This is why FromSoftware games are special — real achievement, not participation trophies."}' > /dev/null

  curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $MY_TOKEN" \
    -d '{"igdb_game_id":26758,"content":"Hollow Knight Silksong cannot come soon enough. Replaying the original and the Grimm Troupe DLC is still peak gaming. The Pantheon of Hallownest nearly broke me."}' > /dev/null

  curl -s -X POST "$API/journals" -H "Content-Type: application/json" -H "Authorization: Bearer $MY_TOKEN" \
    -d '{"igdb_game_id":42931,"content":"Just discovered the Bloodborne cut content videos and now I want a full remake even more. The nightmare of Mensis is still the most unsettling area in any game I have played."}' > /dev/null

  echo "  6 journal posts added to your account!"
else
  echo "Skipped — no token provided"
fi

echo ""
echo "=== DONE ==="
echo "Remember to run the wrangler command above to set ambassador flags!"
