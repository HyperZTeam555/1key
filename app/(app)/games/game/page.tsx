"use client"

import { useRef, useCallback, useEffect, useMemo, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Maximize, Minimize } from "lucide-react"
import { useSettings } from "@/lib/settings-context"
import { stripBasePath, withBasePath } from "@/lib/base-path"

const EMBED_VERSION = "2026-02-17"
const APP_SHELL_PATHS = new Set([
  "/",
  "/home",
  "/games",
  "/links",
  "/data",
  "/settings",
  "/games/game",
])

type GameWarning = {
  title: string
  body: string
}

const GAME_WARNINGS: Record<string, GameWarning> = {
  deltatraveler: {
    title: "Display Tip",
    body: "Deltatraveler can show a black screen unless you enter fullscreen. If you see one, switch to fullscreen and the game should appear.",
  },
  "escape-road-3": {
    title: "Large Game Notice",
    body: "Escape Road 3 is a larger game and may need a few reloads before it works. If it does not start right away, reload the game and try again.",
  },
  "hollow-knight-silksong": {
    title: "Large Game Notice",
    body: "Hollow Knight: Silksong is a larger game and may need a few reloads before it works. If it does not start right away, reload the game and try again.",
  },
  "monkey-mart": {
    title: "Notice",
    body: "Monkey Mart does not save your progress. This is a known issue that cannot be fixed, so progress will be lost when you leave or refresh the page.",
  },
  "monster-tracks": {
    title: "Heads Up",
    body: "Monster Tracks can take a bit to load. Please be patient while it starts.",
  },
  "1v1-lol": {
    title: "Multiplayer Notice",
    body: "1v1.lol runs in offline mode here and does not support multiplayer. For online matches, open it through a proxy.",
  },
  "dungeons-degenerate-gamblers": {
    title: "Loading Notice",
    body: "Please give this game time to load. It can take up to 2 minutes on first launch.",
  },
  postal: {
    title: "17+ Content Warning",
    body: "Postal contains extreme gore and violence and is intended for ages 17+ only.",
  },
  "buildnow-gg": {
    title: "Network Notice",
    body: "BuildNow.gg often does not work on school Wi-Fi. Use a home connection or hotspot for best results.",
  },
  omori: {
    title: "Compatibility Warning",
    body: "Omori does not work for everyone. There is currently no fix.",
  },
}

const GAMES: Record<string, { title: string; file: string }> = {
  "1v1-lol": { title: "1v1.lol", file: "/games/1v1.LoL.html" },
  "10-minutes-till-dawn": { title: "10 Minutes Till Dawn", file: "/games/cl10minutestildawn.html" },
  "12-mini-battles": { title: "12 Mini Battles", file: "/games/12 Mini Battles.html" },
  "2048": { title: "2048", file: "/games/cl2048.html" },
  "a-small-world-cup": { title: "A Small World Cup", file: "/games/asmallworldcup.html" },
  "ages-of-conflict": { title: "Ages of Conflict", file: "/games/clagesofconflict.html" },
  "amanda-the-adventurer": { title: "Amanda the Adventurer", file: "/games/Amanda the Adventurer.html" },
  "andys-apple-farm": { title: "Andy's Apple Farm", file: "/games/Andy's Apple Farm.html" },
  "angry-birds": { title: "Angry Birds", file: "/games/angrybirds.html" },
  "awesome-tanks-2": { title: "Awesome Tanks 2", file: "/games/Awesome Tanks 2.html" },
  "baby-sniper-in-vietnam": { title: "Baby Sniper In Vietnam", file: "/games/Baby Sniper In Vietnam.html" },
  "bad-parenting-1": { title: "Bad Parenting 1", file: "/games/clbadparenting.html" },
  "bad-time-simulator": { title: "Bad Time Simulator", file: "/games/Bad Time Simulator.html" },
  balatro: { title: "Balatro", file: "/games/clbalatrogba.html" },
  "bacon-may-die": { title: "Bacon May Die", file: "/games/Bacon May Die.html" },
  "bank-robbery-3": { title: "Bank Robbery 3", file: "/games/Bank Robbery 3.html" },
  "baseball-bros": { title: "Baseball Bros", file: "/games/Baseball Bros.html" },
  "ben-10-omniverse": { title: "Ben 10 Omniverse", file: "/games/Ben 10 Omniverse.html" },
  "ben-10-protector-of-earth": { title: "Ben 10 Protector of Earth", file: "/games/Ben 10 Protector of Earth.html" },
  "bendy-and-the-ink-machine": { title: "Bendy and the Ink Machine", file: "/games/Bendy and the Ink Machine.html" },
  "basketball-random": { title: "Basketball Random", file: "/games/random.html" },
  "basketball-stars": { title: "Basketball Stars", file: "/games/stars.html" },
  "bot-life": { title: "Bit Life", file: "/games/botlife.html" },
  bitplanes: { title: "BitPlanes", file: "/games/BitPlanes.html" },
  "blade-ball": { title: "Blade Ball", file: "/games/Blade Ball.html" },
  blackjack: { title: "BlackJack", file: "/games/BlackJack.html" },
  "block-blast": { title: "Block Blast", file: "/games/blockblast.html" },
  bloxorz: { title: "Bloxorz", file: "/games/bloxorz.html" },
  "bloons-td-4": { title: "Bloons TD 4", file: "/games/bloonstd4.html" },
  bloodmoney: { title: "BLOODMONEY!", file: "/games/BLOODMONEY!.html" },
  "bob-the-robber-2": { title: "Bob The Robber 2", file: "/games/Bob The Robber.html" },
  "binding-of-isaac-wrath-of-the-lamb": {
    title: "Binding of Isaac Wrath of The Lamb",
    file: "/games/Binding of Isaac Wrath of The Lamb.html",
  },
  "boxing-random": { title: "Boxing Random", file: "/games/Boxing Random.html" },
  "bridge-race": { title: "Bridge Race", file: "/games/Bridge Race.html" },
  "code-editor": { title: "Code Editor", file: "/games/Code Editor.html" },
  brotato: { title: "Brotato", file: "/games/Brotato.html" },
  "buildnow-gg": { title: "BuildNow.gg", file: "/games/BuildNow.gg.html" },
  "buckshot-roulette": { title: "Buckshot Roulette", file: "/games/buck.html" },
  "bust-a-loop": { title: "Bust a Loop", file: "/games/Bust a Loop.html" },
  celeste: { title: "Celeste", file: "/games/cel.html" },
  "cheese-rolling": { title: "Cheese Rolling", file: "/games/Cheese Rolling.html" },
  "clash-of-vikings": { title: "Clash Of Vikings", file: "/games/Clash Of Vikings.html" },
  "class-of-09": { title: "Class of '09", file: "/games/Class of '09.html" },
  "cluster-rush": { title: "Cluster Rush", file: "/games/Cluster Rush.html" },
  cloverpit: { title: "Cloverpit", file: "/games/343434.html" },
  "cookie-clicker": { title: "Cookie Clicker", file: "/games/cookieclicker.html" },
  "cooking-mama": { title: "Cooking Mama", file: "/games/Cooking Mama.html" },
  "core-ball": { title: "Core Ball", file: "/games/core.html" },
  "crazy-cattle-3d": { title: "Crazy Cattle 3D", file: "/games/cattle3d.html" },
  "crazy-chicken-3d": { title: "Crazy Chicken 3D", file: "/games/Crazy Chicken 3D.html" },
  "crazy-kitty-3d": { title: "Crazy Kitty 3D", file: "/games/Crazy Kitty 3D.html" },
  "crossy-road": { title: "Crossy Road", file: "/games/crossyroad.html" },
  "csgo-clicker": { title: "CSGO Clicker", file: "/games/clcsgoclicker.html" },
  "cube-field": { title: "Cube Field", file: "/games/cubefield.html" },
  cuphead: { title: "Cuphead", file: "/games/Cuphead.html" },
  "draw-joust": { title: "Draw Joust", file: "/games/drawjoust.html" },
  "death-run-3d": { title: "Death Run 3D", file: "/games/run.html" },
  deltarune: { title: "Deltarune", file: "/games/cldeltarune.html" },
  deltatraveler: { title: "Deltatraveler", file: "/games/cldeltatraveler.html" },
  "dice-a-million": { title: "Dice A Million", file: "/games/Dice A Million.html" },
  "destroy-the-car-3d": { title: "Destroy The Car 3D", file: "/games/Destroy The Car 3D.html" },
  "doge-miner": { title: "Doge Miner", file: "/games/Doge Miner.html" },
  "dungeons-degenerate-gamblers": { title: "Dungeons & Degenerate Gamblers", file: "/games/Gamblers.html" },
  "goblin-goopmaxxing": { title: "Goblin Goopmaxxing", file: "/games/Goblin Goopmaxxing.html" },
  "drift-boss": { title: "Drift Boss", file: "/games/cldriftboss.html" },
  "drift-hunters": { title: "Drift Hunters", file: "/games/drift.html" },
  "drive-mad": { title: "Drive Mad", file: "/games/drivemad.html" },
  "escape-road-2": { title: "Escape Road 2", file: "/games/clescaperoad-2.html" },
  "escape-road-3": { title: "Escape Road 3", file: "/games/Escape Road 3.html" },
  "escape-road-city-2": { title: "Escape Road City 2", file: "/games/Escape Road City 2.html" },
  "elastic-man": { title: "Elastic Man", file: "/games/Elastic Man.html" },
  endoparasitic: { title: "Endoparasitic", file: "/games/Endoparasitic.html" },
  "evil-glitch": { title: "Evil Glitch", file: "/games/Evil Glitch.html" },
  "fear-and-hunger": { title: "Fear & Hunger", file: "/games/Fear & Hunger.html" },
  "fears-to-fathom-home-alone": { title: "Fears to Fathom: Home Alone", file: "/games/Fears to Fathom_ Home Alone.html" },
  "five-nights-at-epsteins": { title: "Five Nights at Epstein's", file: "/games/Five Nights at Epstein's.html" },
  "flight-simulator": { title: "Flight Simulator", file: "/games/sim.html" },
  "flappy-bird": { title: "Flappy Bird", file: "/games/flappybird.html" },
  "fnaf-1": { title: "FNAF 1", file: "/games/fnaf1.html" },
  "fnaf-2": { title: "FNAF 2", file: "/games/Five Nights at Freddy's 2.html" },
  "fnaf-3": { title: "FNAF 3", file: "/games/Five Nights at Freddy's 3.html" },
  "fnaf-4": { title: "FNAF 4", file: "/games/Five Nights at Freddy's 4.html" },
  fnaf: { title: "FNAF Sister Location", file: "/games/fnaf.html" },
  "fnaf-ucn": { title: "FNAF Ultimate Custom Night", file: "/games/fnafucn.html" },
  "football-bros": { title: "Football Bros", file: "/games/Football Bros.html" },
  "fruit-ninja": { title: "Fruit Ninja", file: "/games/clfruitninja.html" },
  "funny-shooter-2": { title: "Funny Shooter 2", file: "/games/clfunnyshooter2.html" },
  "google-dino": { title: "Google Dino", file: "/games/clgoogledino.html" },
  "geometry-dash": { title: "Geometry Dash", file: "/games/dash.html" },
  "geometry-dash-subzero": { title: "Geometry Dash Subzero", file: "/games/clgdsubzero.html" },
  "get-yoked": { title: "Get Yoked", file: "/games/getyoked.html" },
  "getting-over-it": { title: "Getting Over It", file: "/games/gettingoverit.html" },
  gladihoppers: { title: "Gladihoppers", file: "/games/gladhoppers.html" },
  "google-baseball": { title: "Google Baseball", file: "/games/Google Baseball.html" },
  "gorilla-tag": { title: "Gorilla Tag", file: "/games/Gorilla Tag.html" },
  granny: { title: "Granny", file: "/games/granny.html" },
  "gta-vice-city": { title: "Grand Theft Auto: Vice City", file: "/games/gta-vice-city.html" },
  "growden-io": { title: "Growden.io", file: "/games/Growden.io.html" },
  "gun-spin": { title: "Gun Spin", file: "/games/spin.html" },
  "half-life": { title: "Half Life", file: "/games/Half Life.html" },
  "happy-wheels": { title: "Happy Wheels", file: "/games/Happy Wheels.html" },
  "highway-racer-2": { title: "Highway Racer 2", file: "/games/clhighwayracer2.html" },
  "hollow-knight": { title: "Hollow Knight", file: "/games/knight.html" },
  "hollow-knight-silksong": { title: "Hollow Knight: Silksong", file: "/games/Hollow Knight Silksong.html" },
  "hotline-miami": { title: "Hotline Miami", file: "/games/Hotline Miami.html" },
  "idle-breakout": { title: "Idle Breakout", file: "/games/breakout.html" },
  "idle-dice": { title: "Idle Dice", file: "/games/dice.html" },
  "idle-mining-empire": { title: "Idle Mining Empire", file: "/games/Idle Mining Empire.html" },
  "iron-lung": { title: "Iron Lung", file: "/games/Iron Lung.html" },
  "iron-snout": { title: "Iron Snout", file: "/games/clironsnout.html" },
  "jelly-drift": { title: "Jelly Drift", file: "/games/Jelly Drift.html" },
  "jelly-mario": { title: "Jelly Mario", file: "/games/Jelly Mario.html" },
  "johnny-trigger": { title: "Johnny Trigger", file: "/games/Johnny Trigger.html" },
  karlson: { title: "Karlson", file: "/games/Karlson.html" },
  kindergarten: { title: "Kindergarten", file: "/games/Kindergarten.html" },
  "kindergarten-2": { title: "Kindergarten 2", file: "/games/Kindergarten 2.html" },
  "kindergarten-3": { title: "Kindergarten 3", file: "/games/Kindergarten 3.html" },
  "legend-of-zelda-ocarina-of-time": { title: "Legend of Zelda Ocarina of Time", file: "/games/zelda.html" },
  "legend-of-zelda": { title: "Legend Of Zelda", file: "/games/clloz1.html" },
  "legend-of-zelda-the-minish-cap": { title: "Legend Of Zelda The Minish Cap", file: "/games/cllozminishcap.html" },
  "legend-of-zelda-the-spirit-tracks": { title: "Legend Of Zelda The Spirit Tracks", file: "/games/cllozspirittracks.html" },
  "legend-of-zelda-phantom-hourglass": { title: "Legend Of Zelda Phantom Hourglass", file: "/games/cllozphantomhourglass.html" },
  "madalin-stunt-cars-3": { title: "Madalin Stunt Cars 2", file: "/games/clmadstuntcars2.html" },
  "masked-forces-unlimited": { title: "Masked Forces Unlimited", file: "/games/maskedforces.html" },
  "melon-playground": { title: "Melon Playground", file: "/games/melonplayground.html" },
  minecraft: { title: "Minecraft 1.12.2", file: "/games/craft.html" },
  "minecraft-1-8-8": { title: "Minecraft 1.8.8", file: "/games/Minecraft 1.8.8.html" },
  "minecraft-pocket-edition": { title: "Minecraft Pocket Edition", file: "/games/Minecraft Pocket Edition.html" },
  "midnight-shift": { title: "Midnight Shift", file: "/games/midnight_shift.html" },
  "minesweeper-mania": { title: "Minesweeper Mania", file: "/games/Minesweeper Mania.html" },
  "mountain-bike-runner": { title: "Mountain Bike Runner", file: "/games/BIKER.html" },
  "my-friend-pedro": { title: "My Friend Pedro", file: "/games/clmyfriendpedro.html" },
  "my-friend-pedro-arena": { title: "My Friend Pedro Arena", file: "/games/My Friend Pedro Arena.html" },
  "monkey-mart": { title: "Monkey Mart", file: "/games/mart.html" },
  "monster-tracks": { title: "Monster Tracks", file: "/games/Monster Tracks.html" },
  "moto-x3m-3": { title: "Moto X3M 3", file: "/games/Moto X3M 3.html" },
  "moto-x3m-spooky": { title: "Moto X3M Spooky", file: "/games/motox3mspooky.html" },
  "offroad-mountain-bike": { title: "Offroad Mountain Bike", file: "/games/clmxoffroadmaster.html" },
  ovo: { title: "OvO", file: "/games/clovofixed.html" },
  "papas-bakeria": { title: "Papa's Bakeria", file: "/games/Papa's Bakeria.html" },
  "papas-cheeseria": { title: "Papa's Cheeseria", file: "/games/Papa's Cheeseria.html" },
  "papas-cupcakeria": { title: "Papa's Cupcakeria", file: "/games/Papa's Cupcakeria.html" },
  "papas-sushiria": { title: "Papa's Sushiria", file: "/games/Papa's Sushiria.html" },
  "paper-io-2": { title: "Paper.io 2", file: "/games/paperio2.html" },
  "people-playground": { title: "People Playground", file: "/games/People Playground.html" },
  "please-dont-touch-anything": { title: "Please Dont Touch Anything", file: "/games/Please Dont Touch Anything.html" },
  "plants-vs-deads": { title: "Plants vs Zombies", file: "/games/Plants vs Zombies.html" },
  plinko: { title: "Plinko", file: "/games/plinko.html" },
  "modded-plinko": {
    title: "Plinko With Cheats",
    file: "/plinko-game-online.github.io-main/build/",
  },
  "poly-track": { title: "Poly Track", file: "/games/polytrack.html" },
  postal: { title: "Postal", file: "/games/clpostal.html" },
  "ragdoll-archers": { title: "Ragdoll Archers", file: "/games/arch.html" },
  "ragdoll-hit": { title: "Ragdoll Hit", file: "/games/clragollhit.html" },
  repo: { title: "R.E.P.O", file: "/games/R.E.P.O.html" },
  "re-run": { title: "RE:RUN", file: "/games/RE_RUN.html" },
  recoil: { title: "Recoil", file: "/games/Recoil.html" },
  backrooms: { title: "Backrooms", file: "/games/clbackrooms.html" },
  "resident-evil-3": { title: "Resident Evil 3", file: "/games/clre3.html" },
  "rio-rex": { title: "Rio Rex", file: "/games/Rio Rex.html" },
  "old-bowl": { title: "Retro Bowl", file: "/games/old-bowl.html" },
  "old-bowl-college": { title: "Retro Bowl College", file: "/games/oldbowlcollege.html" },
  omori: { title: "Omori", file: "/games/Omori.html" },
  "rogue-sergeant-the-final-operation": { title: "Rogue Sergeant", file: "/games/roguesergeantthefinaloperation.html" },
  "rolly-vortex": { title: "Rolly Vortex", file: "/games/Rolly Vortex.html" },
  "roulette-hero": { title: "Roulette Hero", file: "/games/Roulette Hero.html" },
  "rooftop-snipers": { title: "Rooftop Snipers", file: "/games/rooftop.html" },
  "run-3": { title: "Run 3", file: "/games/run3.html" },
  "schoolboy-runaway": { title: "SchoolBoy Runaway", file: "/games/schoolboy.html" },
  "scrap-metal-3": { title: "Scrap Metal 3", file: "/games/Scrap Metal 3.html" },
  "side-effects": { title: "Side Effects", file: "/games/clsideeffects.html" },
  slender: { title: "Slender", file: "/games/Slender.html" },
  "slendy-tubbies": { title: "Slendy Tubbies", file: "/games/clslendytubbies.html" },
  "slime-rancher": { title: "Slime Rancher", file: "/games/Slime Rancher.html" },
  slope: { title: "Slope", file: "/games/slope.html" },
  "slow-roads": { title: "Slow Roads", file: "/games/slowroads.html" },
  "soccer-random": { title: "Soccer Random", file: "/games/clsoccerrandomgood.html" },
  "solar-smash": { title: "Solar Smash", file: "/games/clsolarsmash.html" },
  "snow-rider-3d": { title: "Snow Rider 3D", file: "/games/3d.html" },
  soundboard: { title: "Soundboard", file: "/games/Soundboard.html" },
  "stackball-io": { title: "Stackball io", file: "/games/clstackballio.html" },
  "stake-mines": { title: "Stake Mines", file: "/mines/stake_mines.html" },
  "space-waves": { title: "Space Waves", file: "/games/Space Waves.html" },
  "spacebar-clicker": { title: "Spacebar Clicker", file: "/games/spacebarclicker-single.html" },
  "stickman-hook": { title: "Stickman Hook", file: "/games/Stickman Hook.html" },
  "subway-surfers": { title: "Subway Surfers", file: "/games/subwaysurfers.html" },
  "suika-game": { title: "Suika Game", file: "/games/clsuika.html" },
  superhot: { title: "Superhot", file: "/games/clsuperhot.html" },
  "survival-race-arena": { title: "Survival Race Arena", file: "/games/are.html" },
  "survivor-io": { title: "Survivor.io", file: "/games/Survivor.io.html" },
  "tanuki-sunset": { title: "Tanuki Sunset", file: "/games/cltanukisunset.html" },
  "temple-run-2": { title: "Temple Run 2", file: "/games/Temple Run 2.html" },
  terraria: { title: "Terraria", file: "/games/t.html" },
  "thats-not-my-neighbor": { title: "That's Not My Neighbor", file: "/games/tat.html" },
  "they-are-coming": { title: "They Are Coming", file: "/games/They Are Coming.html" },
  "the-impossible-quiz": { title: "The Impossible Quiz", file: "/games/The Impossible Quiz.html" },
  "the-man-from-the-window": { title: "The Man From The Window", file: "/games/clthemaninthewindow.html" },
  "the-worlds-hardest-game": { title: "The World's Hardest Game", file: "/games/The World's Hardest Game.html" },
  "time-shooter": { title: "Time Shooter", file: "/games/time.html" },
  "time-shooter-3-swat": { title: "Time Shooter 3: SWAT", file: "/games/Time Shooter 3_ SWAT.html" },
  "tiny-fishing": { title: "Tiny Fishing", file: "/games/Tiny Fishing.html" },
  wordle: { title: "Wordle", file: "/games/clwordle.html" },
  "tomb-of-the-mask": { title: "Tomb Of The Mask", file: "/games/tombofthemask.html" },
  "traffic-racer": { title: "Traffic Racer", file: "/games/Traffic Racer.html" },
  ultrakill: { title: "ULTRAKILL", file: "/games/ultrakill.html" },
  "undertale-yellow": { title: "Undertale Yellow", file: "/games/Undertale Yellow.html" },
  "vex-8": { title: "Vex 8", file: "/games/vex8.html" },
  "war-the-knights": { title: "War The Knights", file: "/games/clwartheknight.html" },
  "webgl-fluid": { title: "WebGl Fluid", file: "/games/fluid.html" },
  webfishing: { title: "WebFishing", file: "/games/WebFishing.html" },
  "yandere-simulator": { title: "Yandere Simulator", file: "/games/Yandere Simulator.html" },
  "you-vs-100-skibidi": { title: "You vs. 100 Skibidi", file: "/games/clyouvs100skibidi.html" },
  "agar-io-lite": { title: "Agar.io Lite", file: "/games/Agar.io Lite.html" },
  "among-us": { title: "Among Us", file: "/games/Among Us.html" },
  "aqua-park": { title: "Aqua Park", file: "/games/Aqua Park.html" },
  "babel-tower": { title: "Babel Tower", file: "/games/Babel Tower.html" },
  "saul-goodman-run": { title: "Saul Goodman Run", file: "/games/Saul Goodman Run.html" },
  "fused-240": { title: "Fused 240", file: "/games/Fused 240.html" },
  "christmas-massacre": { title: "Christmas Massacre", file: "/games/Christmas Massacre.html" },
  "cell-machine": { title: "Cell Machine", file: "/games/Cell Machine.html" },
  "bart-blast": { title: "Bart Blast", file: "/games/Bart Blast.html" },
  "shred-sauce": { title: "Shred Sauce", file: "/games/Shred Sauce.html" },
  "skibidi-backrooms": { title: "Skibidi Backrooms", file: "/games/Skibidi Backrooms.html" },
  "tung-tung-horror": { title: "Tung Tung Horror", file: "/games/tung.html" },
}

function GamePlayerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { settings } = useSettings()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [warning, setWarning] = useState<GameWarning | null>(null)
  const [showBlobLaunchWarning, setShowBlobLaunchWarning] = useState(false)
  const [retryNonce, setRetryNonce] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showEmbedError, setShowEmbedError] = useState(false)

  const slug = searchParams.get("id") || ""
  const game = Object.prototype.hasOwnProperty.call(GAMES, slug) ? GAMES[slug] : undefined
  const resolvedGameFile = useMemo(() => (game ? withBasePath(game.file) : ""), [game])
  const isEpsteins = slug === "five-nights-at-epsteins"
  const iframeSandbox = "allow-scripts allow-same-origin allow-pointer-lock allow-forms"
  const gameSrc = useMemo(() => {
    if (!resolvedGameFile) return ""
    const retry = retryNonce ? `&r=${retryNonce}` : ""
    return `${resolvedGameFile}?v=${EMBED_VERSION}${retry}`
  }, [resolvedGameFile, retryNonce])

  const buildTabShellHtml = useCallback((src: string) => {
    const safeSrc = src.replace(/"/g, "&quot;")
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>about:blank</title>
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        background: #000;
        overflow: hidden;
      }
      iframe {
        width: 100%;
        height: 100%;
        border: 0;
        display: block;
      }
      .onekey-watermark {
        position: fixed;
        right: 10px;
        bottom: 8px;
        z-index: 20;
        font: 600 13px/1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.32);
        pointer-events: none;
        user-select: none;
      }
    </style>
  </head>
  <body>
    <iframe src="${safeSrc}" allowfullscreen referrerpolicy="no-referrer"></iframe>
    <div class="onekey-watermark">1Key</div>
  </body>
</html>`
  }, [])

  const openGameInNewTab = useCallback(() => {
    if (!game) return
    const absoluteSrc = new URL(gameSrc, window.location.origin).toString()
    const shellHtml = buildTabShellHtml(absoluteSrc)

    if (settings.launchMode === "blob") {
      const blob = new Blob([shellHtml], { type: "text/html" })
      const blobUrl = URL.createObjectURL(blob)
      const popup = window.open(blobUrl, "_blank")
      if (!popup) {
        URL.revokeObjectURL(blobUrl)
        window.open(absoluteSrc, "_blank", "noopener,noreferrer")
        return
      }
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
      return
    }

    const popup = window.open("about:blank", "_blank")
    if (!popup) {
      window.open(absoluteSrc, "_blank", "noopener,noreferrer")
      return
    }
    popup.document.open()
    popup.document.write(shellHtml)
    popup.document.close()
  }, [buildTabShellHtml, game, gameSrc, settings.launchMode])

  const handleOpenInTab = useCallback(() => {
    if (settings.launchMode === "blob") {
      setShowBlobLaunchWarning(true)
      return
    }
    openGameInNewTab()
  }, [openGameInNewTab, settings.launchMode])

  useEffect(() => {
    setWarning(Object.prototype.hasOwnProperty.call(GAME_WARNINGS, slug) ? GAME_WARNINGS[slug] : null)
  }, [slug])

  useEffect(() => {
    setRetryNonce(null)
    setRetryCount(0)
    setShowEmbedError(false)
  }, [slug])

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    try {
      const iframeWindow = iframe.contentWindow
      if (!iframeWindow) return
      if (iframeWindow.location.origin !== window.location.origin) return

      const path = iframeWindow.location.pathname
      const normalizedPath = stripBasePath(path)
      const title = iframe.contentDocument?.title ?? ""
      const loadedShell = APP_SHELL_PATHS.has(normalizedPath) || title === "1Key"

      if (!loadedShell) return
      if (retryCount < 1) {
        setRetryCount((count) => count + 1)
        setRetryNonce(String(Date.now()))
        return
      }

      setShowEmbedError(true)
    } catch {
    }
  }, [retryCount])

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isFullscreen])

  useEffect(() => {
    if (!isFullscreen) return
    if (slug !== "iron-snout") return

    const iframe = iframeRef.current
    if (!iframe) return

    const applyFix = () => {
      try {
        const win = iframe.contentWindow
        const doc = iframe.contentDocument
        if (!win || !doc) return
        if (win.location.origin !== window.location.origin) return

        doc.documentElement.style.width = "100%"
        doc.documentElement.style.height = "100%"
        doc.body.style.width = "100%"
        doc.body.style.height = "100%"
        doc.body.style.margin = "0"
        doc.body.style.display = "flex"
        doc.body.style.alignItems = "center"
        doc.body.style.justifyContent = "center"
        doc.body.style.background = "#000"

        const wrapper = doc.getElementById("gm4html5_div_id") as HTMLDivElement | null
        if (wrapper) {
          wrapper.style.width = "100%"
          wrapper.style.height = "100%"
          wrapper.style.display = "flex"
          wrapper.style.alignItems = "center"
          wrapper.style.justifyContent = "center"
        }

        const canvas = doc.getElementById("canvas") as HTMLCanvasElement | null
        if (canvas) {
          canvas.style.margin = "0 auto"
          canvas.style.width = "min(100vw, calc(100vh * 1.6))"
          canvas.style.height = "auto"
          canvas.style.maxHeight = "100vh"
        }
      } catch {
      }
    }

    applyFix()
    const t1 = window.setTimeout(applyFix, 250)
    const t2 = window.setTimeout(applyFix, 1200)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [isFullscreen, slug])

  if (!game) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Game Not Found</h1>
          <Button
            onClick={() => router.push("/games")}
            variant="outline"
            className="h-10 rounded-xl border border-border/70 bg-card/52 px-4 text-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_10%,transparent)] hover:border-foreground/48 hover:bg-card/68 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      {warning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-foreground mb-3">{warning.title}</h2>
            <p className="text-muted-foreground mb-6">{warning.body}</p>
            <Button 
              onClick={() => setWarning(null)} 
              className="w-full"
            >
              OK, I Understand
            </Button>
          </div>
        </div>
      )}

      {showBlobLaunchWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-foreground mb-3">Blob Launch Warning</h2>
            <p className="text-muted-foreground mb-6">
              blob: mode is less stable and can break on some games or browsers. Use it only if your school blocks
              about:blank launches.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBlobLaunchWarning(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowBlobLaunchWarning(false)
                  openGameInNewTab()
                }}
              >
                Continue with blob:
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="relative flex items-center justify-between gap-2 mb-4">
          <Button
            onClick={() => router.push("/games")}
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border border-border/70 bg-card/52 px-4 text-foreground backdrop-blur-sm shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_10%,transparent)] hover:border-foreground/48 hover:bg-card/68 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2 shrink-0" />
            Back to Games
          </Button>
          <h1 className="pointer-events-none absolute left-1/2 -translate-x-[43%] text-xl font-bold text-foreground whitespace-nowrap">
            {game.title}
          </h1>
          <div className="flex items-center gap-2">
            <Button onClick={handleOpenInTab} variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Tab
            </Button>
            <Button onClick={toggleFullscreen} size="sm" className="min-w-[140px]">
              <Maximize className="w-4 h-4 mr-2" />
              Enter Fullscreen
            </Button>
          </div>
        </div>

        <div
          ref={containerRef}
          className={`relative bg-background rounded-xl overflow-hidden border border-border ${
            isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
          }`}
        >
          {showEmbedError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 backdrop-blur">
              <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-4 shadow-2xl text-center">
                <h2 className="text-lg font-semibold text-foreground mb-2">Game failed to load</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  The game page loaded the site shell instead of the game. This can happen on some networks or from
                  cached responses.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRetryCount(0)
                      setRetryNonce(String(Date.now()))
                      setShowEmbedError(false)
                    }}
                  >
                    Retry
                  </Button>
                  <Button onClick={() => window.open(resolvedGameFile, "_blank")}>Open in new tab</Button>
                </div>
              </div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={gameSrc}
            title={game.title}
            className={`w-full ${isFullscreen ? "h-full" : "h-[85vh]"}`}
            allowFullScreen
            sandbox={iframeSandbox}
            referrerPolicy="no-referrer"
            onLoad={handleIframeLoad}
          />

          {isFullscreen && (
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              className={`absolute bottom-4 bg-background/80 backdrop-blur z-10 ${
                isEpsteins ? "left-1/2 -translate-x-1/2" : "right-4"
              }`}
            >
              <Minimize className="w-4 h-4 mr-2" />
              Exit Fullscreen (ESC)
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GamePlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-foreground">Loading game...</div>
      </div>
    }>
      <GamePlayerContent />
    </Suspense>
  )
}
