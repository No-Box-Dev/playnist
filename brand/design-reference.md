# Playnist Design Reference

Source: Bubble app at playnist-20.bubbleapps.io + Figma exports

## App Identity
- **Domain**: playnist.com
- **Tagline**: Discover, Organise & Share Your Gaming Journey
- **Description**: Social platform for gamers to discover, organise and share gaming experiences

## Pages (from Bubble app)
1. **index** - Landing/home page
2. **login** - Login page ("Welcome back")
3. **auth** - Auth callback handler
4. **dashboard** - Main app dashboard (Discover feed)
5. **game_page** - Individual game detail page
6. **reset_pw** - Password reset
7. **404** - Not found page

## Reusable Components (from Bubble app)
- **Header** - Top navigation bar
- **Sidebar** - Left sidebar navigation
- **AddGame** - Add game modal/dropdown
- **AddGame Dropdown Step1** - First step of add game flow
- **GameImage** - Game cover card component
- **Ambassador** - Ambassador spotlight component
- **PostReaction** - Post reaction buttons (heart, star, happy, fire, angry)
- **AdminManagement** - Admin panel
- **Onboarding** - Onboarding flow (web)
- **Onboarding Mobile** - Onboarding flow (mobile)
- **Bottom Bar** - Mobile bottom navigation
- **Add Comment** - Comment input component
- **Add Journal** - Journal entry creation
- **Reaction Game** - Game reaction buttons
- **Comment Reaction** - Comment reaction buttons
- **ChangeGame** - Change/edit game status

## Screens Overview

### Sign Up
- Split layout: form left, game collage right
- Email/Password tabs + Username step
- "Continue with Google" option (OAuth)
- CTA: "Sign Up" button (burnt orange)

### Login
- "Welcome back" heading
- "Enter your information to access your accounts"
- Email + password fields
- "Reset here" link for password reset
- Google OAuth login

### Onboarding (3-step modal)
1. **Games** - Pick favorite games (grid of game covers, selectable)
2. **Community** - Follow suggested players (6 user cards with + button)
3. **Let's Go!** - Completion with smiley face, "Discover" CTA

### Dashboard (Discover Feed)
- **Trending on Playnist** - 4 large game cover cards with + button
- **Ambassador Spotlight** - Featured user quote + game + journal excerpt
- **What the Community is Playing** - User cards with game, reactions, read more
- **New & Noteworthy** - Game cover row
- **Ambassador Top Picks** - User-curated game pair
- **Journal Prompt of the Week** - Text prompt with CTA
- **Games for a Rainy Day** - Themed game row

### Profile
- Sunburst banner (cream/peach radial lines)
- Circular avatar with edit pencil icon
- Ambassador badge (yellow/orange label)
- Followers / Following count
- "Edit Profile" button (outlined)
- Two tabs: **Library** (filled orange) | **Journal** (outlined)

#### Library Tab
- Filters: Played (green) | Playing (orange) | Play Next (outlined)
- Game covers in 5-column grid
- Orange + button on each cover (bottom right)
- "Add New Game +" button (top right)
- Empty state: sad face emoji, "Your Library is Empty", "Add a Game +" CTA

#### Journal Tab
- List of journal entries
- Each entry: game cover thumbnail, game name, genre tag, full text
- Delete icon (trash) per entry

### Game Page
- Game cover art (large)
- Title, genre, platform info
- Developer/publisher
- Rating
- Reactions (heart, star, happy, fire, angry)
- Related posts and comments
- Add to collection CTA

### Add a Game (Modal)
- Search game input with autocomplete
- Select category dropdown (Played/Playing/Want to Play)
- Cancel (outlined) | Save (filled orange) buttons

### Write in Journal (Modal)
- Game name search input
- Select category dropdown
- "Write in Journal" textarea
- Placeholder: "What moment made you smile? Made you cry? Made you frustrated?"
- Cancel | Post buttons

### Notifications (Dropdown)
- Orange header bar "NOTIFICATIONS"
- List items: "A game just landed in your list - check it out now"
- Timestamp per notification
- Date separators

### Public Profile
- Same layout as own profile
- "Follow +" button instead of "Edit Profile"
- No edit icons

## Design System

### Colors
- Primary: `#C62E07` (burnt orange/red)
- Background: `#FFFDEB` (cream)
- Banner: `#FDE9C3` (peach)
- Accent: `#F4CF03` (yellow)
- Secondary accent: `#FA9B18` (orange)
- Success/Played: `#79BC90` (green)
- Text: `#000000`, `#252525`, `#091747`
- Terra cotta: `#DD8167`
- Blue primary: `#0205D3`
- Named categories: Beige, Black, Green, Orange, Red, Terra Cotta, Yellow

### Typography
- Headings: 'HF Gesco Bold', Georgia, serif — ALL CAPS, typewriter style
- Body: 'IBM Plex Sans', sans-serif — regular weight
- Mono: 'GT America Mono'
- Logo: Custom italic serif "playnist" in white on orange

### Google Fonts (loaded dynamically in Bubble)
- DM Sans (regular)
- Figtree (regular)
- IBM Plex Sans (regular, 500)
- Inter Tight (regular, 500)
- Inter (regular, 700)
- LXGW WenKai Mono TC (regular)

### Layout
- Left sidebar navigation (fixed): Profile, Discover, Journal icons
- Active nav item: filled orange background
- Content area: right of sidebar, max-width container
- Cards: rounded corners, subtle borders

### Components
- **Game cards**: Cover art with rounded corners, orange + button overlay
- **Buttons**: Filled (orange) or outlined (orange border, white fill)
- **Modals**: White background, close X button, rounded corners
- **Tabs**: Two-tab toggle (filled active, outlined inactive)
- **Filter pills**: Rounded, color-coded (green=Played, orange=Playing, outline=Play Next)
- **Avatar**: Circular with optional edit pencil icon
- **Badge**: "Ambassador" yellow/orange label with star icon
- **Sunburst banner**: Radial lines from bottom-left, cream/peach gradient
- **Empty states**: Emoji face + descriptive text + CTA button
- **Dashed borders**: Orange dashed borders on empty/journal containers
- **Reactions**: Heart, Star/Eyes, Happy/Laughing, Fire/Shocked, Angry/Smile
- **Switch/Toggle**: Green on, pink off
- **Checkbox**: Green checked, pink unchecked

### Data Model
- **User**: username, bio, profilepic, background_image, ambassador_tag, following, games_played, onboarding_step
- **Game**: title, description, cover_image, cover_url, developers, publishers, genre_name, platform_names, game_mode_names, theme_names, rating, release_date, igdb_id, reactions (heart/star/happy/fire/angry)
- **Post**: content, images, category, related_game, is_journal, reactions
- **Comment**: author, message, post, reactions
- **Collection**: games list, name (category)
- **Section**: sectionName, sectionType, ambassador, highlighted post/games
- **Notification**: body, is_read, recipient, related_game

### Game Statuses
- **Played** (green)
- **Playing** (orange)
- **Want to Play** (outlined/red)

### External Services
- IGDB API (game database via Twitch OAuth)
- Supabase (game search)
- Google OAuth (social login)
- Stripe (payments)
- Iconify (icons)
- Lottie (animations)
