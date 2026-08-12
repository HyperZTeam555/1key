"use client"

import { useState, useMemo, useEffect, useCallback, useDeferredValue } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createPortal } from "react-dom"
import { ArrowUp, Search, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useSettings } from "@/lib/settings-context"
import { useUiText } from "@/lib/ui-text"
import { withBasePath } from "@/lib/base-path"

type GameEntry = {
  id: number
  slug: string
  title: string
  logo: string
  searchTerms?: string[]
  objectPosition?: string
}

const BASE_TITLE_PX_BY_SCALE: Record<string, number> = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
}

function AutoFitGameTitle({
  title,
  fontScale,
}: {
  title: string
  fontScale: string
}) {
  const basePx = BASE_TITLE_PX_BY_SCALE[fontScale] ?? 14
  const byLengthPx = 250 / Math.max(1, title.length)
  const fontPx = Math.max(7, Math.min(basePx, Number(byLengthPx.toFixed(2))))

  return (
    <p
      className="font-medium text-foreground text-center leading-tight whitespace-normal break-words"
      style={{ fontSize: `${fontPx}px` }}
    >
      {title}
    </p>
  )
}

const REAL_GAMES: GameEntry[] = [
  {
    id: 184,
    slug: "10-minutes-till-dawn",
    title: "10 Minutes Till Dawn",
    logo: "/images/game-covers/10-minutes-till-dawn.webp",
  },
  {
    id: 173,
    slug: "12-mini-battles",
    title: "12 Mini Battles",
    logo: "/images/game-covers/12-mini-battles.webp",
  },
  {
    id: 205,
    slug: "2048",
    title: "2048",
    logo: "/images/game-covers/2048.png",
    searchTerms: ["2048 game", "two zero four eight"],
  },
  {
    id: 74,
    slug: "1v1-lol",
    title: "1v1.lol",
    logo: "/images/game-covers/1v1-lol.webp",
  },
  {
    id: 46,
    slug: "a-small-world-cup",
    title: "A Small World Cup",
    logo: "/images/asmallworldcup.png",
  },
  {
    id: 82,
    slug: "ages-of-conflict",
    title: "Ages of Conflict",
    logo: "/images/game-covers/ages-of-conflict.webp",
  },
  {
    id: 106,
    slug: "amanda-the-adventurer",
    title: "Amanda the Adventurer",
    logo: "/images/game-covers/amanda-the-adventurer.webp",
  },
  {
    id: 188,
    slug: "andys-apple-farm",
    title: "Andy's Apple Farm",
    logo: "/images/game-covers/andys-apple-farm.webp",
  },
  {
    id: 43,
    slug: "angry-birds",
    title: "Angry Birds",
    logo: "/images/bird.webp",
  },
  {
    id: 83,
    slug: "awesome-tanks-2",
    title: "Awesome Tanks 2",
    logo: "/images/game-covers/awesome-tanks-2.webp",
  },
  {
    id: 226,
    slug: "baby-sniper-in-vietnam",
    title: "Baby Sniper In Vietnam",
    logo: "/images/game-covers/babysniper.webp",
  },
  {
    id: 178,
    slug: "backrooms",
    title: "Backrooms",
    logo: "/images/game-covers/backrooms.webp",
  },
  {
    id: 85,
    slug: "bacon-may-die",
    title: "Bacon May Die",
    logo: "/images/game-covers/bacon-may-die.webp",
  },
  {
    id: 84,
    slug: "bad-parenting-1",
    title: "Bad Parenting 1",
    logo: "/images/game-covers/bad-parenting-1.webp",
  },
  {
    id: 107,
    slug: "bad-time-simulator",
    title: "Bad Time Simulator",
    logo: "/images/game-covers/bad-time-simulator.webp",
  },
  {
    id: 108,
    slug: "balatro",
    title: "Balatro",
    logo: "/images/game-covers/balatro.webp",
  },
  {
    id: 86,
    slug: "bank-robbery-3",
    title: "Bank Robbery 3",
    logo: "/images/game-covers/bank-robbery-3.webp",
  },
  {
    id: 120,
    slug: "baseball-bros",
    title: "Baseball Bros",
    logo: "/images/game-covers/baseball-bros.webp",
  },
  {
    id: 227,
    slug: "ben-10-omniverse",
    title: "Ben 10 Omniverse",
    logo: "/images/game-covers/ogom.jpg",
  },
  {
    id: 228,
    slug: "ben-10-protector-of-earth",
    title: "Ben 10 Protector of Earth",
    logo: "/images/game-covers/protecotr.webp",
  },
  {
    id: 6,
    slug: "basketball-random",
    title: "Basketball Random",
    logo: "/images/game-covers/basketball-random.png",
  },
  {
    id: 10,
    slug: "basketball-stars",
    title: "Basketball Stars",
    logo: "/images/game-covers/basketball-stars.png",
  },
  {
    id: 87,
    slug: "bendy-and-the-ink-machine",
    title: "Bendy and the Ink Machine",
    logo: "/images/game-covers/bendy-and-the-ink-machine.webp",
  },
  {
    id: 18,
    slug: "bot-life",
    title: "Bit Life",
    logo: "/images/game-covers/bot-life.png",
  },
  {
    id: 206,
    slug: "bitplanes",
    title: "BitPlanes",
    logo: "/images/game-covers/bitplanes.png",
  },
  {
    id: 189,
    slug: "blade-ball",
    title: "Blade Ball",
    logo: "/images/game-covers/blade-ball.webp",
  },
  {
    id: 78,
    slug: "blackjack",
    title: "BlackJack",
    logo: "/images/game-covers/blackjack.webp",
  },
  {
    id: 56,
    slug: "block-blast",
    title: "Block Blast",
    logo: "/images/game-covers/block-blast.webp",
  },
  {
    id: 42,
    slug: "bloons-td-4",
    title: "Bloons TD 4",
    logo: "/images/game-covers/bloons-td-4.png",
  },
  {
    id: 207,
    slug: "bloodmoney",
    title: "BLOODMONEY!",
    logo: "/images/game-covers/bloodmoney.png",
  },
  {
    id: 58,
    slug: "bloxorz",
    title: "Bloxorz",
    logo: "/images/game-covers/bloxorz.webp",
  },
  {
    id: 79,
    slug: "bob-the-robber-2",
    title: "Bob The Robber 2",
    logo: "/images/game-covers/bob-the-robber-2.webp",
  },
  {
    id: 330,
    slug: "binding-of-isaac-wrath-of-the-lamb",
    title: "Binding of Isaac Wrath of The Lamb",
    logo: "/images/game-covers/bidningofissac.webp",
  },
  {
    id: 88,
    slug: "boxing-random",
    title: "Boxing Random",
    logo: "/images/game-covers/boxing-random.webp",
  },
  {
    id: 89,
    slug: "bridge-race",
    title: "Bridge Race",
    logo: "/images/game-covers/bridge-race.avif",
  },
  {
    id: 229,
    slug: "brotato",
    title: "Brotato",
    logo: "/images/game-covers/brooo.png",
  },
  {
    id: 208,
    slug: "buildnow-gg",
    title: "BuildNow.gg",
    logo: "/images/game-covers/buildnow-gg.png",
    searchTerms: ["buildnow", "buildnow.gg", "build now"],
  },
  {
    id: 24,
    slug: "buckshot-roulette",
    title: "Buckshot Roulette",
    logo: "/images/game-covers/buckshot-roulette.png",
  },
  {
    id: 140,
    slug: "bust-a-loop",
    title: "Bust a Loop",
    logo: "/images/game-covers/bust-a-loop.webp",
  },
  {
    id: 25,
    slug: "celeste",
    title: "Celeste",
    logo: "/images/game-covers/celeste.png",
  },
  {
    id: 246,
    slug: "cheese-rolling",
    title: "Cheese Rolling",
    logo: "/images/game-covers/cheese-rolling.png",
  },
  {
    id: 109,
    slug: "clash-of-vikings",
    title: "Clash Of Vikings",
    logo: "/images/game-covers/clash-of-vikings.webp",
  },
  {
    id: 141,
    slug: "class-of-09",
    title: "Class of '09",
    logo: "/images/game-covers/class-of-09.webp",
  },
  {
    id: 75,
    slug: "cluster-rush",
    title: "Cluster Rush",
    logo: "/images/game-covers/cluster-rush.webp",
  },
  {
    id: 59,
    slug: "cookie-clicker",
    title: "Cookie Clicker",
    logo: "/images/game-covers/cookie-clicker.webp",
  },
  {
    id: 200,
    slug: "cloverpit",
    title: "Cloverpit",
    logo: "/images/game-covers/cloverpit.jpeg",
  },
  {
    id: 121,
    slug: "cooking-mama",
    title: "Cooking Mama",
    logo: "/images/game-covers/cooking-mama.webp",
  },
  {
    id: 32,
    slug: "core-ball",
    title: "Core Ball",
    logo: "/images/game-covers/core-ball.png",
  },
  {
    id: 91,
    slug: "crazy-cattle-3d",
    title: "Crazy Cattle 3D",
    logo: "/images/game-covers/crazy-cattle-3d.webp",
  },
  {
    id: 142,
    slug: "crazy-chicken-3d",
    title: "Crazy Chicken 3D",
    logo: "/images/game-covers/crazy-chicken-3d.webp",
  },
  {
    id: 143,
    slug: "crazy-kitty-3d",
    title: "Crazy Kitty 3D",
    logo: "/images/game-covers/crazy-kitty-3d.webp",
  },
  {
    id: 60,
    slug: "crossy-road",
    title: "Crossy Road",
    logo: "/images/game-covers/crossy-road.webp",
  },
  {
    id: 209,
    slug: "csgo-clicker",
    title: "CSGO Clicker",
    logo: "/images/game-covers/csgo-clicker.webp",
    searchTerms: ["csgo", "counter strike", "clicker"],
  },
  {
    id: 61,
    slug: "cube-field",
    title: "Cube Field",
    logo: "/images/game-covers/cube-field.webp",
  },
  {
    id: 76,
    slug: "cuphead",
    title: "Cuphead",
    logo: "/images/game-covers/cuphead.webp",
  },
  {
    id: 17,
    slug: "death-run-3d",
    title: "Death Run 3D",
    logo: "/images/game-covers/death-run-3d.png",
  },
  {
    id: 247,
    slug: "dice-a-million",
    title: "Dice A Million",
    logo: "/images/game-covers/dice-a-million.png",
  },
  {
    id: 122,
    slug: "deltarune",
    title: "Deltarune",
    logo: "/images/game-covers/deltarune.webp",
  },
  {
    id: 166,
    slug: "deltatraveler",
    title: "Deltatraveler",
    logo: "/images/game-covers/deltatraveler.webp",
  },
  {
    id: 144,
    slug: "destroy-the-car-3d",
    title: "Destroy The Car 3D",
    logo: "/images/game-covers/destroy-the-car-3d.webp",
  },
  {
    id: 145,
    slug: "doge-miner",
    title: "Doge Miner",
    logo: "/images/game-covers/doge-miner.webp",
  },
  {
    id: 195,
    slug: "dungeons-degenerate-gamblers",
    title: "Dungeons & Degenerate Gamblers",
    logo: "/images/game-covers/dungeons-degenerate-gamblers.jpeg",
    searchTerms: ["gamblers", "dungeon gamblers", "degenerate"],
  },
  {
    id: 62,
    slug: "draw-joust",
    title: "Draw Joust",
    logo: "/images/game-covers/draw-joust.webp",
  },
  {
    id: 33,
    slug: "drift-boss",
    title: "Drift Boss",
    logo: "/images/game-covers/drift-boss.png",
  },
  {
    id: 22,
    slug: "drift-hunters",
    title: "Drift Hunters",
    logo: "/images/game-covers/drift-hunters.png",
  },
  {
    id: 1,
    slug: "drive-mad",
    title: "Drive Mad",
    logo: "/images/game-covers/drive-mad.webp",
  },
  {
    id: 146,
    slug: "elastic-man",
    title: "Elastic Man",
    logo: "/images/game-covers/elastic-man.webp",
  },
  {
    id: 147,
    slug: "endoparasitic",
    title: "Endoparasitic",
    logo: "/images/game-covers/endoparasitic.webp",
  },
  {
    id: 93,
    slug: "escape-road-2",
    title: "Escape Road 2",
    logo: "/images/game-covers/escape-road-2.webp",
  },
  {
    id: 248,
    slug: "escape-road-city-2",
    title: "Escape Road City 2",
    logo: "/images/game-covers/escape-road-city-2.png",
  },
  {
    id: 249,
    slug: "escape-road-3",
    title: "Escape Road 3",
    logo: "/images/game-covers/escape-road-3.png",
  },
  {
    id: 110,
    slug: "evil-glitch",
    title: "Evil Glitch",
    logo: "/images/game-covers/evil-glitch.webp",
  },
  {
    id: 111,
    slug: "fear-and-hunger",
    title: "Fear & Hunger",
    logo: "/images/game-covers/fear-and-hunger.webp",
  },
  {
    id: 112,
    slug: "fears-to-fathom-home-alone",
    title: "Fears to Fathom: Home Alone",
    logo: "/images/game-covers/fears-to-fathom-home-alone.webp",
  },
  {
    id: 133,
    slug: "five-nights-at-epsteins",
    title: "Five Nights at Epstein's",
    logo: "/images/game-covers/five-nights-at-epsteins.webp",
    searchTerms: ["fnaf", "fnae", "five nights at epsteins", "five nights at epstein's"],
  },
  {
    id: 44,
    slug: "flappy-bird",
    title: "Flappy Bird",
    logo: "/images/flap.webp",
  },
  {
    id: 8,
    slug: "flight-simulator",
    title: "Flight Simulator",
    logo: "/images/game-covers/flight-simulator.png",
  },
  {
    id: 51,
    slug: "fnaf-1",
    title: "FNAF 1",
    logo: "/images/game-covers/fnaf-1.avif",
    searchTerms: ["fnaf", "fnaf 1", "five nights at freddy's 1", "five nights at freddys 1", "five nights at freddy's one", "five nights at freddys one"],
  },
  {
    id: 124,
    slug: "fnaf-2",
    title: "FNAF 2",
    logo: "/images/game-covers/fnaf-2.webp",
    searchTerms: ["fnaf", "fnaf 2", "five nights at freddy's 2", "five nights at freddys 2", "five nights at freddy's two", "five nights at freddys two"],
  },
  {
    id: 134,
    slug: "fnaf-3",
    title: "FNAF 3",
    logo: "/images/game-covers/fnaf-3.webp",
    searchTerms: ["fnaf", "fnaf 3", "five nights at freddy's 3", "five nights at freddys 3", "five nights at freddy's three", "five nights at freddys three"],
  },
  {
    id: 135,
    slug: "fnaf-4",
    title: "FNAF 4",
    logo: "/images/game-covers/fnaf-4.webp",
    searchTerms: ["fnaf", "fnaf 4", "five nights at freddy's 4", "five nights at freddys 4", "five nights at freddy's four", "five nights at freddys four"],
  },
  {
    id: 9,
    slug: "fnaf",
    title: "FNAF Sister Location",
    logo: "/images/game-covers/fnaf.webp",
    searchTerms: ["fnaf", "fnaf sister location", "five nights at freddy's sister location", "five nights at freddys sister location"],
  },
  {
    id: 50,
    slug: "fnaf-ucn",
    title: "FNAF Ultimate Custom Night",
    logo: "/images/game-covers/fnaf-ucn.webp",
    searchTerms: ["fnaf", "fnaf ucn", "ultimate custom night", "five nights at freddy's ultimate custom night", "five nights at freddys ultimate custom night"],
  },
  {
    id: 123,
    slug: "football-bros",
    title: "Football Bros",
    logo: "/images/game-covers/football-bros.webp",
  },
  {
    id: 148,
    slug: "fruit-ninja",
    title: "Fruit Ninja",
    logo: "/images/game-covers/fruit-ninja.webp",
  },
  {
    id: 136,
    slug: "funny-shooter-2",
    title: "Funny Shooter 2",
    logo: "/images/game-covers/funny-shooter-2.webp",
  },
  {
    id: 5,
    slug: "geometry-dash",
    title: "Geometry Dash",
    logo: "/images/game-covers/geometry-dash.png",
  },
  {
    id: 180,
    slug: "geometry-dash-subzero",
    title: "Geometry Dash Subzero",
    logo: "/images/game-covers/geometry-dash-subzero.webp",
  },
  {
    id: 63,
    slug: "get-yoked",
    title: "Get Yoked",
    logo: "/images/game-covers/get-yoked.webp",
  },
  {
    id: 64,
    slug: "getting-over-it",
    title: "Getting Over It",
    logo: "/images/game-covers/getting-over-it.webp",
  },
  {
    id: 65,
    slug: "gladihoppers",
    title: "Gladihoppers",
    logo: "/images/game-covers/gladihoppers.webp",
  },
  {
    id: 174,
    slug: "goblin-goopmaxxing",
    title: "Goblin Goopmaxxing",
    logo: "/images/game-covers/goblin-goopmaxxing.jpg",
  },
  {
    id: 149,
    slug: "google-baseball",
    title: "Google Baseball",
    logo: "/images/game-covers/google-baseball.webp",
  },
  {
    id: 167,
    slug: "google-dino",
    title: "Google Dino",
    logo: "/images/game-covers/google-dino.webp",
  },
  {
    id: 194,
    slug: "gta-vice-city",
    title: "Grand Theft Auto: Vice City",
    logo: "/images/gta.png",
    searchTerms: ["gta", "grand theft auto", "vice city"],
  },
  {
    id: 113,
    slug: "gorilla-tag",
    title: "Gorilla Tag",
    logo: "/images/game-covers/gorilla-tag.webp",
  },
  {
    id: 12,
    slug: "granny",
    title: "Granny",
    logo: "/images/game-covers/granny.png",
  },
  {
    id: 150,
    slug: "growden-io",
    title: "Growden.io",
    logo: "/images/game-covers/growden-io.webp",
  },
  {
    id: 28,
    slug: "gun-spin",
    title: "Gun Spin",
    logo: "/images/game-covers/gun-spin.png",
  },
  {
    id: 94,
    slug: "half-life",
    title: "Half Life",
    logo: "/images/game-covers/half-life.webp",
  },
  {
    id: 80,
    slug: "happy-wheels",
    title: "Happy Wheels",
    logo: "/images/game-covers/happy-wheels.webp",
  },
  {
    id: 95,
    slug: "highway-racer-2",
    title: "Highway Racer 2",
    logo: "/images/game-covers/highway-racer-2.webp",
  },
  {
    id: 23,
    slug: "hollow-knight",
    title: "Hollow Knight",
    logo: "/images/game-covers/hollow-knight.png",
  },
  {
    id: 250,
    slug: "hollow-knight-silksong",
    title: "Hollow Knight: Silksong",
    logo: "/images/game-covers/hollow-knight-silksong.png",
    searchTerms: ["hollow knight silksong", "silksong"],
  },
  {
    id: 96,
    slug: "hotline-miami",
    title: "Hotline Miami",
    logo: "/images/game-covers/hotline-miami.webp",
  },
  {
    id: 30,
    slug: "idle-breakout",
    title: "Idle Breakout",
    logo: "/images/game-covers/idle-breakout.png",
  },
  {
    id: 21,
    slug: "idle-dice",
    title: "Idle Dice",
    logo: "/images/game-covers/idle-dice.png",
  },
  {
    id: 77,
    slug: "idle-mining-empire",
    title: "Idle Mining Empire",
    logo: "/images/game-covers/idle-mining-empire.webp",
  },
  {
    id: 216,
    slug: "the-impossible-quiz",
    title: "The Impossible Quiz",
    logo: "/images/game-covers/qui.png",
  },
  {
    id: 114,
    slug: "iron-lung",
    title: "Iron Lung",
    logo: "/images/game-covers/iron-lung.webp",
  },
  {
    id: 182,
    slug: "iron-snout",
    title: "Iron Snout",
    logo: "/images/game-covers/iron-snout.webp",
  },
  {
    id: 97,
    slug: "jelly-drift",
    title: "Jelly Drift",
    logo: "/images/game-covers/jelly-drift.webp",
  },
  {
    id: 211,
    slug: "jelly-mario",
    title: "Jelly Mario",
    logo: "/images/game-covers/jelly-mario.png",
  },
  {
    id: 151,
    slug: "johnny-trigger",
    title: "Johnny Trigger",
    logo: "/images/game-covers/johnny-trigger.webp",
  },
  {
    id: 175,
    slug: "karlson",
    title: "Karlson",
    logo: "/images/game-covers/karlson.webp",
  },
  {
    id: 125,
    slug: "kindergarten",
    title: "Kindergarten",
    logo: "/images/game-covers/kindergarten.webp",
  },
  {
    id: 212,
    slug: "kindergarten-2",
    title: "Kindergarten 2",
    logo: "/images/game-covers/kindergarten-2.png",
  },
  {
    id: 251,
    slug: "kindergarten-3",
    title: "Kindergarten 3",
    logo: "/images/game-covers/kindergarten-3.png",
  },
  {
    id: 57,
    slug: "legend-of-zelda-ocarina-of-time",
    title: "Legend of Zelda Ocarina of Time",
    logo: "/images/game-covers/legend-of-zelda-ocarina-of-time.webp",
  },
  {
    id: 201,
    slug: "legend-of-zelda",
    title: "Legend Of Zelda",
    logo: "/images/game-covers/legend-of-zelda.webp",
    searchTerms: ["zelda", "legend of zelda"],
  },
  {
    id: 202,
    slug: "legend-of-zelda-the-minish-cap",
    title: "Legend Of Zelda The Minish Cap",
    logo: "/images/game-covers/zelda-minish-cap.jpg",
    searchTerms: ["zelda", "minish cap", "legend of zelda minish cap"],
  },
  {
    id: 203,
    slug: "legend-of-zelda-the-spirit-tracks",
    title: "Legend Of Zelda The Spirit Tracks",
    logo: "/images/game-covers/legend-of-zelda-the-spirit-tracks.jpg",
    searchTerms: ["zelda", "spirit tracks", "legend of zelda spirit tracks"],
  },
  {
    id: 204,
    slug: "legend-of-zelda-phantom-hourglass",
    title: "Legend Of Zelda Phantom Hourglass",
    logo: "/images/game-covers/legend-of-zelda-phantom-hourglass.jpg",
    searchTerms: ["zelda", "phantom hourglass", "legend of zelda phantom hourglass"],
  },
  {
    id: 39,
    slug: "madalin-stunt-cars-3",
    title: "Madalin Stunt Cars 2",
    logo: "/images/game-covers/car.png",
  },
  {
    id: 54,
    slug: "masked-forces-unlimited",
    title: "Masked Forces Unlimited",
    logo: "/images/game-covers/masked-forces-unlimited.webp",
  },
  {
    id: 66,
    slug: "melon-playground",
    title: "Melon Playground",
    logo: "/images/game-covers/melon-playground.webp",
  },
  {
    id: 11,
    slug: "minecraft",
    title: "Minecraft 1.12.2",
    logo: "/images/game-covers/minecraft.png",
  },
  {
    id: 119,
    slug: "minecraft-1-8-8",
    title: "Minecraft 1.8.8",
    logo: "/images/game-covers/minecraft-1-8-8.png",
  },
  {
    id: 252,
    slug: "minecraft-pocket-edition",
    title: "Minecraft Pocket Edition",
    logo: "/images/game-covers/minecraft-pocket-edition.jpg",
    searchTerms: ["minecraft pocket edition", "mcpe", "pocket edition"],
  },
  {
    id: 187,
    slug: "midnight-shift",
    title: "Midnight Shift",
    logo: "/images/game-covers/midnight-shift.webp",
    objectPosition: "center bottom",
  },
  {
    id: 152,
    slug: "minesweeper-mania",
    title: "Minesweeper Mania",
    logo: "/images/game-covers/minesweeper-mania.webp",
  },
  {
    id: 15,
    slug: "monkey-mart",
    title: "Monkey Mart",
    logo: "/images/game-covers/monkey-mart.png",
  },
  {
    id: 126,
    slug: "monster-tracks",
    title: "Monster Tracks",
    logo: "/images/game-covers/monster-tracks.webp",
  },
  {
    id: 153,
    slug: "moto-x3m-3",
    title: "Moto X3M 3",
    logo: "/images/game-covers/moto-x3m-3.webp",
  },
  {
    id: 67,
    slug: "moto-x3m-spooky",
    title: "Moto X3M Spooky",
    logo: "/images/game-covers/moto-x3m-spooky.webp",
  },
  {
    id: 176,
    slug: "mountain-bike-runner",
    title: "Mountain Bike Runner",
    logo: "/images/game-covers/mountain-bike-runner.webp",
  },
  {
    id: 190,
    slug: "my-friend-pedro",
    title: "My Friend Pedro",
    logo: "/images/game-covers/my-friend-pedro.webp",
  },
  {
    id: 230,
    slug: "my-friend-pedro-arena",
    title: "My Friend Pedro Arena",
    logo: "/images/game-covers/arena.jpg",
  },
  {
    id: 213,
    slug: "offroad-mountain-bike",
    title: "Offroad Mountain Bike",
    logo: "/images/game-covers/offroad-mountain-bike.png",
    searchTerms: ["offroad", "mountain bike", "mx offroad"],
  },
  {
    id: 127,
    slug: "ovo",
    title: "OvO",
    logo: "/images/game-covers/ovo.avif",
  },
  {
    id: 98,
    slug: "papas-bakeria",
    title: "Papa's Bakeria",
    logo: "/images/game-covers/papas-bakeria.webp",
  },
  {
    id: 115,
    slug: "papas-cheeseria",
    title: "Papa's Cheeseria",
    logo: "/images/game-covers/papas-cheeseria.webp",
  },
  {
    id: 116,
    slug: "papas-cupcakeria",
    title: "Papa's Cupcakeria",
    logo: "/images/game-covers/papas-cupcakeria.webp",
  },
  {
    id: 99,
    slug: "papas-sushiria",
    title: "Papa's Sushiria",
    logo: "/images/game-covers/papas-sushiria.jpeg",
  },
  {
    id: 68,
    slug: "paper-io-2",
    title: "Paper.io 2",
    logo: "/images/game-covers/paper-io-2.webp",
  },
  {
    id: 214,
    slug: "people-playground",
    title: "People Playground",
    logo: "/images/game-covers/people-playground.png",
  },
  {
    id: 220,
    slug: "please-dont-touch-anything",
    title: "Please Dont Touch Anything",
    logo: "/images/game-covers/please-dont-touch-anything.jpg",
  },
  {
    id: 117,
    slug: "plants-vs-deads",
    title: "Plants vs Zombies",
    logo: "/images/game-covers/plants-vs-deads.webp",
  },
  {
    id: 181,
    slug: "modded-plinko",
    title: "Plinko With Cheats",
    logo: "/images/game-covers/modded-plinko.webp",
  },
  {
    id: 29,
    slug: "plinko",
    title: "Plinko",
    logo: "/images/game-covers/plinko.webp",
  },
  {
    id: 3,
    slug: "poly-track",
    title: "Poly Track",
    logo: "/images/game-covers/poly-track.png",
  },
  {
    id: 197,
    slug: "postal",
    title: "Postal",
    logo: "/images/game-covers/postal.jpg",
  },
  {
    id: 118,
    slug: "repo",
    title: "R.E.P.O",
    logo: "/images/game-covers/repo.webp",
  },
  {
    id: 14,
    slug: "ragdoll-archers",
    title: "Ragdoll Archers",
    logo: "/images/game-covers/ragdoll-archers.png",
  },
  {
    id: 69,
    slug: "ragdoll-hit",
    title: "Ragdoll Hit",
    logo: "/images/game-covers/ragdoll-hit.avif",
  },
  {
    id: 164,
    slug: "re-run",
    title: "RE:RUN",
    logo: "/images/game-covers/re-run.webp",
  },
  {
    id: 81,
    slug: "recoil",
    title: "Recoil",
    logo: "/images/game-covers/recoil.webp",
  },
  {
    id: 170,
    slug: "resident-evil-3",
    title: "Resident Evil 3",
    logo: "/images/game-covers/resident-evil-3.avif",
  },
  {
    id: 191,
    slug: "rio-rex",
    title: "Rio Rex",
    logo: "/images/game-covers/rio-rex.webp",
  },
  {
    id: 13,
    slug: "old-bowl",
    title: "Retro Bowl",
    logo: "/images/game-covers/old-bowl.png",
  },
  {
    id: 36,
    slug: "old-bowl-college",
    title: "Retro Bowl College",
    logo: "/images/game-covers/old-bowl-college.png",
  },
  {
    id: 70,
    slug: "rogue-sergeant-the-final-operation",
    title: "Rogue Sergeant",
    logo: "/images/game-covers/rogue-sergeant-the-final-operation.webp",
  },
  {
    id: 155,
    slug: "rolly-vortex",
    title: "Rolly Vortex",
    logo: "/images/game-covers/rolly-vortex.webp",
  },
  {
    id: 231,
    slug: "roulette-hero",
    title: "Roulette Hero",
    logo: "/images/game-covers/hero.png",
  },
  {
    id: 41,
    slug: "rooftop-snipers",
    title: "Rooftop Snipers",
    logo: "/images/game-covers/rooftop-snipers.png",
  },
  {
    id: 55,
    slug: "run-3",
    title: "Run 3",
    logo: "/images/game-covers/run-3.webp",
  },
  {
    id: 40,
    slug: "schoolboy-runaway",
    title: "SchoolBoy Runaway",
    logo: "/images/game-covers/schoolboy-runaway.png",
  },
  {
    id: 156,
    slug: "scrap-metal-3",
    title: "Scrap Metal 3",
    logo: "/images/game-covers/scrap-metal-3.webp",
  },
  {
    id: 185,
    slug: "side-effects",
    title: "Side Effects",
    logo: "/images/game-covers/side-effects.webp",
  },
  {
    id: 100,
    slug: "slime-rancher",
    title: "Slime Rancher",
    logo: "/images/game-covers/slime-rancher.webp",
  },
  {
    id: 222,
    slug: "slender",
    title: "Slender",
    logo: "/images/game-covers/slender.jpg",
  },
  {
    id: 223,
    slug: "slendy-tubbies",
    title: "Slendy Tubbies",
    logo: "/images/game-covers/slendy-tubbies.webp",
  },
  {
    id: 2,
    slug: "slope",
    title: "Slope",
    logo: "/images/game-covers/slope.png",
  },
  {
    id: 71,
    slug: "slow-roads",
    title: "Slow Roads",
    logo: "/images/game-covers/slow-roads.webp",
  },
  {
    id: 7,
    slug: "snow-rider-3d",
    title: "Snow Rider 3D",
    logo: "/images/game-covers/snow-rider-3d.png",
  },
  {
    id: 128,
    slug: "soccer-random",
    title: "Soccer Random",
    logo: "/images/game-covers/soccer-random.webp",
  },
  {
    id: 31,
    slug: "solar-smash",
    title: "Solar Smash",
    logo: "/images/game-covers/solar-smash.png",
  },
  {
    id: 129,
    slug: "soundboard",
    title: "Soundboard",
    logo: "/images/game-covers/soundboard.webp",
  },
  {
    id: 192,
    slug: "stackball-io",
    title: "Stackball io",
    logo: "/images/game-covers/stackball-io.webp",
  },
  {
    id: 183,
    slug: "stake-mines",
    title: "Stake Mines",
    logo: "/images/game-covers/stake-mines.webp",
  },
  {
    id: 101,
    slug: "space-waves",
    title: "Space Waves",
    logo: "/images/game-covers/space-waves.webp",
  },
  {
    id: 102,
    slug: "spacebar-clicker",
    title: "Spacebar Clicker",
    logo: "/images/game-covers/spacebar-clicker.webp",
  },
  {
    id: 130,
    slug: "stickman-hook",
    title: "Stickman Hook",
    logo: "/images/game-covers/stickman-hook.webp",
  },
  {
    id: 4,
    slug: "subway-surfers",
    title: "Subway Surfers",
    logo: "/images/game-covers/subway-surfers.png",
  },
  {
    id: 193,
    slug: "suika-game",
    title: "Suika Game",
    logo: "/images/game-covers/suika-game.webp",
  },
  {
    id: 158,
    slug: "superhot",
    title: "Superhot",
    logo: "/images/game-covers/superhot.webp",
  },
  {
    id: 16,
    slug: "survival-race-arena",
    title: "Survival Race Arena",
    logo: "/images/game-covers/survival-race-arena.png",
  },
  {
    id: 159,
    slug: "survivor-io",
    title: "Survivor.io",
    logo: "/images/game-covers/survivor-io.webp",
  },
  {
    id: 160,
    slug: "tanuki-sunset",
    title: "Tanuki Sunset",
    logo: "/images/game-covers/tanuki-sunset.webp",
  },
  {
    id: 131,
    slug: "temple-run-2",
    title: "Temple Run 2",
    logo: "/images/game-covers/temple-run-2.avif",
  },
  {
    id: 27,
    slug: "terraria",
    title: "Terraria",
    logo: "/images/game-covers/terraria.png",
  },
  {
    id: 26,
    slug: "thats-not-my-neighbor",
    title: "That's Not My Neighbor",
    logo: "/images/game-covers/thats-not-my-neighbor.png",
  },
  {
    id: 215,
    slug: "they-are-coming",
    title: "They Are Coming",
    logo: "/images/game-covers/they-are-coming.png",
  },
  {
    id: 161,
    slug: "the-worlds-hardest-game",
    title: "The World's Hardest Game",
    logo: "/images/game-covers/hardestgame3.png",
  },
  {
    id: 199,
    slug: "the-man-from-the-window",
    title: "The Man From The Window",
    logo: "/images/game-covers/the-man-from-the-window.webp",
  },
  {
    id: 19,
    slug: "time-shooter",
    title: "Time Shooter",
    logo: "/images/game-covers/time-shooter.png",
  },
  {
    id: 172,
    slug: "time-shooter-3-swat",
    title: "Time Shooter 3: SWAT",
    logo: "/images/game-covers/time-shooter-3-swat.webp",
  },
  {
    id: 132,
    slug: "tiny-fishing",
    title: "Tiny Fishing",
    logo: "/images/game-covers/tiny-fishing.webp",
  },
  {
    id: 47,
    slug: "tomb-of-the-mask",
    title: "Tomb Of The Mask",
    logo: "/images/tombofthemask.png",
  },
  {
    id: 162,
    slug: "traffic-racer",
    title: "Traffic Racer",
    logo: "/images/game-covers/traffic-racer.webp",
  },
  {
    id: 224,
    slug: "war-the-knights",
    title: "War The Knights",
    logo: "/images/game-covers/war-the-knights.png",
  },
  {
    id: 52,
    slug: "ultrakill",
    title: "ULTRAKILL",
    logo: "/images/game-covers/ultrakill.webp",
  },
  {
    id: 103,
    slug: "undertale-yellow",
    title: "Undertale Yellow",
    logo: "/images/game-covers/undertale-yellow.webp",
  },
  {
    id: 73,
    slug: "vex-8",
    title: "Vex 8",
    logo: "/images/game-covers/vex-8.webp",
  },
  {
    id: 104,
    slug: "webfishing",
    title: "WebFishing",
    logo: "/images/game-covers/webfishing.avif",
  },
  {
    id: 139,
    slug: "webgl-fluid",
    title: "WebGl Fluid",
    logo: "/images/game-covers/webgl-fluid.webp",
  },
  {
    id: 171,
    slug: "wordle",
    title: "Wordle",
    logo: "/images/game-covers/wordle.webp",
  },
  {
    id: 163,
    slug: "yandere-simulator",
    title: "Yandere Simulator",
    logo: "/images/game-covers/yandere-simulator.webp",
  },
  {
    id: 105,
    slug: "you-vs-100-skibidi",
    title: "You vs. 100 Skibidi",
    logo: "/images/game-covers/you-vs-100-skibidi.webp",
  },
  {
    id: 232,
    slug: "agar-io-lite",
    title: "Agar.io Lite",
    logo: "/images/game-covers/agarlite.jpg",
  },
  {
    id: 233,
    slug: "among-us",
    title: "Among Us",
    logo: "/images/game-covers/amongus.jpg",
  },
  {
    id: 234,
    slug: "aqua-park",
    title: "Aqua Park",
    logo: "/images/game-covers/aquapark.png",
  },
  {
    id: 235,
    slug: "babel-tower",
    title: "Babel Tower",
    logo: "/images/game-covers/babeltower.png",
  },
  {
    id: 236,
    slug: "saul-goodman-run",
    title: "Saul Goodman Run",
    logo: "/images/game-covers/saulgoodam.png",
  },
  {
    id: 237,
    slug: "fused-240",
    title: "Fused 240",
    logo: "/images/game-covers/fused240-cover.png",
  },
  {
    id: 238,
    slug: "christmas-massacre",
    title: "Christmas Massacre",
    logo: "/images/game-covers/christmas-massacre-cover.png",
  },
  {
    id: 239,
    slug: "cell-machine",
    title: "Cell Machine",
    logo: "/images/game-covers/cell-machine-cover.png",
  },
  {
    id: 240,
    slug: "bart-blast",
    title: "Bart Blast",
    logo: "/images/game-covers/bart-blast-cover.png",
  },
  {
    id: 241,
    slug: "shred-sauce",
    title: "Shred Sauce",
    logo: "/images/game-covers/shred-sauce-cover.png",
  },
  {
    id: 242,
    slug: "skibidi-backrooms",
    title: "Skibidi Backrooms",
    logo: "/images/game-covers/ndonutrapem.webp",
  },
  {
    id: 243,
    slug: "code-editor",
    title: "Code Editor",
    logo: "/images/game-covers/codeeditor.png",
  },
  {
    id: 244,
    slug: "omori",
    title: "Omori",
    logo: "/images/game-covers/omori.png",
  },
  {
    id: 245,
    slug: "tung-tung-horror",
    title: "Tung Tung Horror",
    logo: "/images/game-covers/tungtung.jpeg",
  },
];

const SEARCH_PLACEHOLDER_BASE = "Search games..."
const FAVORITES_STORAGE_KEY = "1key-favorite-games"
const FAVORITES_PAGE_SIZE = 2
type PlaceholderPhase = "typing" | "pause" | "deleting"

const REAL_GAME_SEARCH_INDEX = REAL_GAMES.map((game) => ({
  game,
  terms: [game.title, ...(game.searchTerms ?? [])].map((term) => term.toLowerCase()),
}))
const SORT_GAMES_ALPHA = (games: GameEntry[]) =>
  [...games].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))

export default function GamesPage() {
  const router = useRouter()
  const { settings } = useSettings()
  const { tx } = useUiText()
  const [searchQuery, setSearchQuery] = useState("")
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [placeholderText, setPlaceholderText] = useState("")
  const [placeholderTarget, setPlaceholderTarget] = useState(SEARCH_PLACEHOLDER_BASE)
  const [placeholderPhase, setPlaceholderPhase] = useState<PlaceholderPhase>("typing")
  const [lastRandomTitle, setLastRandomTitle] = useState<string | null>(null)
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([])
  const [favoritesPage, setFavoritesPage] = useState(0)
  const [favoritesReady, setFavoritesReady] = useState(false)
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const gameTitles = useMemo(() => REAL_GAMES.map((game) => game.title), [])
  const gamesBySlug = useMemo(() => new Map(REAL_GAMES.map((game) => [game.slug, game])), [])
  const favoriteSlugSet = useMemo(() => new Set(favoriteSlugs), [favoriteSlugs])
  const favoriteGames = useMemo(
    () => favoriteSlugs.map((slug) => gamesBySlug.get(slug)).filter((game): game is GameEntry => Boolean(game)),
    [favoriteSlugs, gamesBySlug],
  )
  const favoritePageCount = Math.max(1, Math.ceil(favoriteGames.length / FAVORITES_PAGE_SIZE))
  const safeFavoritePage = Math.min(favoritesPage, favoritePageCount - 1)
  const pagedFavoriteGames = useMemo(() => {
    const start = safeFavoritePage * FAVORITES_PAGE_SIZE
    return favoriteGames.slice(start, start + FAVORITES_PAGE_SIZE)
  }, [favoriteGames, safeFavoritePage])

  const pickRandomTitle = useCallback(
    (exclude: string | null) => {
      if (gameTitles.length === 0) return SEARCH_PLACEHOLDER_BASE
      const pool = exclude ? gameTitles.filter((title) => title !== exclude) : gameTitles
      const source = pool.length > 0 ? pool : gameTitles
      return source[Math.floor(Math.random() * source.length)]
    },
    [gameTitles],
  )

  const normalizedDeferredQuery = deferredSearchQuery.toLowerCase().trim()

  const filteredGames = useMemo(() => {
    if (!normalizedDeferredQuery) return SORT_GAMES_ALPHA(REAL_GAMES)
    return SORT_GAMES_ALPHA(REAL_GAME_SEARCH_INDEX.filter((entry) =>
      entry.terms.some((term) => term.includes(normalizedDeferredQuery))
    ).map((entry) => entry.game))
  }, [normalizedDeferredQuery])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const validSlugs = parsed.filter((slug): slug is string => typeof slug === "string" && gamesBySlug.has(slug))
          setFavoriteSlugs(validSlugs)
        }
      }
    } catch {
      setFavoriteSlugs([])
    } finally {
      setFavoritesReady(true)
    }
  }, [gamesBySlug])

  useEffect(() => {
    if (!favoritesReady) return
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteSlugs))
    } catch {
    }
  }, [favoriteSlugs, favoritesReady])

  useEffect(() => {
    if (favoritesPage > favoritePageCount - 1) {
      setFavoritesPage(Math.max(0, favoritePageCount - 1))
    }
  }, [favoritePageCount, favoritesPage])

  const toggleFavorite = useCallback((slug: string) => {
    setFavoriteSlugs((previous) => {
      const next = new Set(previous)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return Array.from(next)
    })
  }, [])

  useEffect(() => {
    const checkScrollPosition = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollableHeight <= 0) {
        setShowScrollTop((previous) => (previous ? false : previous))
        return
      }
      const shouldShow = window.scrollY > scrollableHeight * 0.3
      setShowScrollTop((previous) => (previous === shouldShow ? previous : shouldShow))
    }

    checkScrollPosition()
    window.addEventListener("scroll", checkScrollPosition, { passive: true })
    window.addEventListener("resize", checkScrollPosition)

    return () => {
      window.removeEventListener("scroll", checkScrollPosition)
      window.removeEventListener("resize", checkScrollPosition)
    }
  }, [filteredGames.length])

  useEffect(() => {
    let timer: number | undefined

    if (placeholderPhase === "typing") {
      if (placeholderText.length < placeholderTarget.length) {
        timer = window.setTimeout(() => {
          setPlaceholderText(placeholderTarget.slice(0, placeholderText.length + 1))
        }, 48)
      } else {
        timer = window.setTimeout(() => setPlaceholderPhase("pause"), 900)
      }
    } else if (placeholderPhase === "pause") {
      timer = window.setTimeout(() => setPlaceholderPhase("deleting"), 520)
    } else if (placeholderPhase === "deleting") {
      if (placeholderText.length > 0) {
        timer = window.setTimeout(() => {
          setPlaceholderText((previous) => previous.slice(0, -1))
        }, 22)
      } else {
        if (placeholderTarget === SEARCH_PLACEHOLDER_BASE) {
          const nextRandomTitle = pickRandomTitle(lastRandomTitle)
          setPlaceholderTarget(nextRandomTitle)
          setLastRandomTitle(nextRandomTitle)
        } else {
          setPlaceholderTarget(SEARCH_PLACEHOLDER_BASE)
        }
        setPlaceholderPhase("typing")
      }
    }

    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [lastRandomTitle, pickRandomTitle, placeholderPhase, placeholderTarget, placeholderText])

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-[78rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            {tx("Games Library")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {tx("Explore our collection of games. Click on any game to start playing.")}
          </p>
        </div>

        <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border/70 bg-card/18 p-4 sm:p-5 backdrop-blur-xl">
            <div className="relative group">
              <div className="absolute inset-0 bg-accent/12 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={placeholderText}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 h-14 rounded-full bg-background/42 border-border focus:border-foreground/50 focus:ring-2 focus:ring-foreground/20 text-foreground placeholder:text-muted-foreground transition-all duration-300"
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {filteredGames.length}/{REAL_GAMES.length} {tx("games loaded")}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/18 p-4 sm:p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Favorite</h2>
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {favoriteGames.length}
              </span>
            </div>

            {favoriteGames.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/80 bg-background/24 px-4 py-8 text-sm text-muted-foreground text-center">
                Favorite some games to pin them here.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                {pagedFavoriteGames.map((game) => (
                  <div
                    key={`favorite-${game.slug}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/games/game?id=${game.slug}`)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        router.push(`/games/game?id=${game.slug}`)
                      }
                    }}
                    className="group relative overflow-hidden rounded-xl border border-border/70 bg-background/28 text-left transition-all duration-200 hover:border-foreground/30 hover:translate-y-[-1px]"
                  >
                    <div className="relative h-24">
                      <Image
                        src={withBasePath(game.logo || "/images/ui/placeholder.svg")}
                        alt={game.title}
                        fill
                        sizes="160px"
                        className="object-cover"
                        style={game.objectPosition ? { objectPosition: game.objectPosition } : undefined}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-background/12 to-transparent" />
                      <button
                        type="button"
                        aria-label={`Unfavorite ${game.title}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleFavorite(game.slug)
                        }}
                        className="absolute right-2 top-2 rounded-full border border-border/70 bg-background/62 p-1 text-amber-300"
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </button>
                    </div>
                    <div className="p-2.5">
                      <p className="line-clamp-1 text-center text-sm font-semibold text-foreground">{game.title}</p>
                    </div>
                  </div>
                ))}
              </div>

              {favoritePageCount > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/22 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setFavoritesPage((previous) => Math.max(0, previous - 1))}
                    disabled={safeFavoritePage === 0}
                    className="rounded-md border border-border/70 bg-background/34 px-2.5 py-1 text-xs text-foreground disabled:opacity-45"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Page {safeFavoritePage + 1} / {favoritePageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFavoritesPage((previous) => Math.min(favoritePageCount - 1, previous + 1))}
                    disabled={safeFavoritePage >= favoritePageCount - 1}
                    className="rounded-md border border-border/70 bg-background/34 px-2.5 py-1 text-xs text-foreground disabled:opacity-45"
                  >
                    Next
                  </button>
                </div>
              )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredGames.map((game) => {
            const favorited = favoriteSlugSet.has(game.slug)
            return (
              <div
                key={game.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/games/game?id=${game.slug}`)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    router.push(`/games/game?id=${game.slug}`)
                  }
                }}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-card/14 border border-border/65 hover:border-foreground/24 transition-all duration-300 hover:scale-[1.045] focus:outline-none focus:ring-2 focus:ring-foreground/30"
              >
                <Image
                  src={withBasePath(game.logo || "/images/ui/placeholder.svg")}
                  alt={game.title}
                  fill
                  className="object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:blur-[1px]"
                  style={game.objectPosition ? { objectPosition: game.objectPosition } : undefined}
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-background/68 via-background/16 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <button
                  type="button"
                  aria-label={favorited ? `Unfavorite ${game.title}` : `Favorite ${game.title}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleFavorite(game.slug)
                  }}
                  className="absolute right-2 top-2 z-10 rounded-full border border-border/70 bg-background/62 p-1.5 text-foreground/85 transition-colors hover:text-amber-300"
                >
                  <Star className={`h-4 w-4 ${favorited ? "fill-current text-amber-300" : ""}`} />
                </button>

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <AutoFitGameTitle title={game.title} fontScale={settings.fontScale} />
                </div>
              </div>
            )
          })}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {tx("No games found matching your search.")}
            </p>
          </div>
        )}

      </div>

      {isMounted &&
        showScrollTop &&
        searchQuery.trim().length === 0 &&
        createPortal(
          <button
            type="button"
            aria-label={tx("Back to top")}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed right-2 bottom-2 md:right-3 md:bottom-3 z-[60] h-12 w-12 rounded-full border border-border bg-card/72 backdrop-blur-xl text-foreground shadow-lg hover:scale-105 transition-transform"
          >
            <ArrowUp className="w-5 h-5 mx-auto" />
          </button>,
          document.body,
        )}
    </div>
  )
}
