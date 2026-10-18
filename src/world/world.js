

// Shared world definition. Locations use tile coordinates plus pixel offsets.
// Scenery and its collision footprint are defined together.
import { CAVE_DATA } from "./cave-world.js";
import { CAVE_ARENA_DATA } from "./cave-arena.js";
import { VILLAGE_FLOOR, VILLAGE_FLOOR_HOLES } from "./village-border.js";

const VILLAGE_DATA = {
  id: "village",
  name: "Greenfield Village",
  tileSize: 32,
  width: 72,
  height: 48,
  background: new URL("../../assets/images/ground_map.png", import.meta.url).href,
  collision: {
    boundaryTiles: 1,
    entityMargin: 3,
    // Reference coordinates match ground_map_border.png and the ground image.
    referenceWidth: 1536,
    referenceHeight: 1024,
    water: [
      { id: "sea", points: [[0,510],[80,489],[165,490],[243,459],[300,451],
        [303,481],[255,532],[220,596],[192,655],[245,685],[365,692],
        [445,731],[492,751],[548,738],[598,755],[639,757],[697,785],
        [765,803],[843,832],[922,886],[976,913],[1072,939],[1152,953],
        [1247,968],[1352,969],[1424,927],[1487,935],[1536,975],
        [1536,1024],[0,1024]] },
      { id: "west-river", points: [[244,0],[280,0],[323,42],[331,86],
        [355,113],[366,146],[348,183],[312,209],[285,238],[291,270],
        [310,292],[339,315],[373,331],[389,359],[377,393],[353,414],
        [340,442],[311,464],[273,477],[250,465],[284,434],[302,411],
        [330,395],[344,368],[335,347],[307,331],[283,311],[260,283],
        [253,259],[252,232],[270,205],[298,174],[317,145],[309,119],
        [289,106],[285,74],[273,48]] },
      { id: "east-river", points: [[1018,172],[1058,165],[1092,180],
        [1109,207],[1098,231],[1083,251],[1101,267],[1138,282],
        [1173,306],[1190,329],[1213,348],[1257,367],[1310,389],
        [1355,417],[1381,448],[1418,467],[1452,483],[1490,505],
        [1536,532],[1536,573],[1499,552],[1464,532],[1430,514],
        [1394,497],[1358,479],[1334,449],[1311,429],[1275,410],
        [1237,395],[1197,380],[1160,355],[1142,330],[1119,310],
        [1080,293],[1055,275],[1045,248],[1062,223],[1069,204],
        [1048,193],[1021,197],[1003,185]] },
    ],
    // Bridge/dock guides for the debug overlay. The traced floor defines their
    // movement edges; water polygons remain available for spell visibility.
    crossings: [
      { id: "west-north-bridge", points: [[240,215],[310,230],[307,254],[232,237]] },
      { id: "west-south-bridge", points: [[284,417],[354,438],[343,452],[281,437]] },
      { id: "east-bridge", points: [[1391,494],[1499,454],[1524,500],[1416,542]] },
      { id: "dock", points: [[606,733],[640,751],[565,859],[524,840]] },
    ],
    walkable: VILLAGE_FLOOR,
    floorHoles: VILLAGE_FLOOR_HOLES,
    waterBlocksMovement: false,
    solid: [],
    // Trunks of prominent trees already painted into the background image.
    // The canopy remains passable, just like the separate tree sprites.
    backgroundTrunks: [
      [102,251],[153,244],[214,315],[142,384],[184,425],[233,414],
      [405,259],[493,445],[608,452],[659,354],[542,315],[594,259],
      [755,106],[819,83],[969,160],[1015,143],[1060,128],[1111,88],
      [1222,284],[1250,317],[1372,359],[1486,298],[1510,412],
      [1109,398],[1235,505],[1213,472],[1336,663],[1482,684],
      [1184,669],[1264,742],[1080,787],[1044,858],[776,758],
      [737,709],[312,580],[315,667],[352,648],[402,671],[420,712],
      [228,602],[187,583],[1457,788],[1401,750],[1416,885],
    ],
    backgroundTrunkWidth: 14,
    backgroundTrunkHeight: 10,
  },
  tree: {
    image: new URL("../../assets/images/tree.png", import.meta.url).href,
    width: 112,
    height: 124,
    trunkWidth: 26,
    trunkHeight: 18,
  },
  // Each position marks the center of the trunk's ground footprint.
  trees: [
    [35, 20], [39, 24], [28, 22], [42, 19],
    [25, 27], [46, 27], [51, 22], [57, 18],
    [36, 7], [43, 8], [52, 6], [61, 12],
  ],
  portals: [{ id: "northeast-cave", label: "Enter Northeast Cave", x: 2105, y: 195, width: 75, height: 65,
    targetArea: "cave" }],
  playerSpawn: { tileX: 33, tileY: 23, offsetX: 4, offsetY: 2 },
  buildings: [{
    id: "general-store",
    name: "General Store",
    image: new URL("../../assets/images/house.png", import.meta.url).href,
    tileX: 36, tileY: 24,
    width: 200, height: 178,
    footprint: { x: -66, y: -48, width: 136, height: 48 },
    entrance: { x: -30, y: 12 },
    interactionRange: 90,
    shop: { stock: ["00001", "01000", "01001", "02000", "02001", "02002", "02003", "02004", "03000", "04000", "05000", "06000", "07000"] },
  }],
  enemySpawns: [
    { id: "00001", tileX: 30, tileY: 9 },
    { id: "00001", tileX: 32, tileY: 13 },
    { id: "00001", tileX: 28, tileY: 16 },
    { id: "00002", tileX: 34, tileY: 13 },
    { id: "00003", tileX: 38, tileY: 15 },
  ],
};

function worldPosition({ tileX, tileY, offsetX = 0, offsetY = 0 }) {
  return {
    x: tileX * WORLD_DATA.tileSize + offsetX,
    y: tileY * WORLD_DATA.tileSize + offsetY,
  };
}

const AREAS = Object.freeze({ village: VILLAGE_DATA, cave: CAVE_DATA, "cave-arena": CAVE_ARENA_DATA });
let WORLD_DATA = VILLAGE_DATA;

function selectWorldDefinition(id) {
  if (!Object.hasOwn(AREAS, id)) throw new Error("Unknown area.");
  WORLD_DATA = AREAS[id];
}

export { WORLD_DATA, AREAS, selectWorldDefinition, worldPosition };
