// Floor boundaries follow the supplied image. Everything outside these regions
// is wall, water, or void; only the stairs connect the raised northern platform.
const CAVE_ARENA_DATA = {
  id: "cave-arena", name: "Cave Arena", tileSize: 32, width: 72, height: 48,
  background: new URL("../../assets/images/cave_boss_area.png", import.meta.url).href,
  playerSpawn: { tileX: 35, tileY: 43, offsetX: 20, offsetY: 4 },
  trees: [], buildings: [], enemySpawns: [],
  portals: [{ id: "arena-exit", label: "Return to Northeast Cave", x: 1080, y: 1440, width: 150, height: 64,
    targetArea: "cave", arrival: { x: 1998, y: 316 } }],
  collision: {
    entityMargin: 3, boundaryTiles: 1, referenceWidth: 1536, referenceHeight: 1024,
    backgroundTrunks: [], water: [], crossings: [],
    walkable: [
      { id: "arena-floor", points: [[435,316],[470,320],[515,326],[553,312],[588,310],[622,301],[655,288],[700,286],[720,282],[815,282],[842,285],[880,295],[916,303],[958,314],[1003,324],[1040,317],[1077,316],[1099,335],[1121,343],[1136,381],[1168,411],[1218,430],[1201,451],[1167,471],[1134,493],[1118,525],[1107,559],[1104,583],[1084,606],[1046,618],[1003,626],[950,632],[911,643],[878,662],[852,682],[841,711],[837,746],[828,768],[711,768],[699,746],[697,714],[685,687],[661,664],[630,651],[588,638],[543,631],[495,620],[459,608],[440,589],[432,556],[424,530],[405,511],[377,494],[346,475],[319,453],[309,432],[333,418],[361,403],[391,398],[411,366],[423,343]] },
      { id: "north-platform", points: [[664,170],[704,149],[737,132],[798,132],[837,147],[871,171],[884,198],[870,220],[844,235],[814,242],[720,242],[691,233],[671,214]] },
      { id: "platform-stairs", points: [[725,232],[808,232],[808,301],[725,301]] },
      { id: "entrance-corridor", points: [[716,745],[824,745],[822,810],[819,864],[826,925],[827,1000],[714,1000],[707,949],[711,894],[713,839]] },
    ],
    solid: [
      { id: "west-stalagmite", points: [[345,355],[382,355],[382,402],[345,402]] },
      { id: "east-stalagmite", points: [[1134,355],[1175,355],[1175,402],[1134,402]] },
      { id: "southwest-stalagmite", points: [[495,565],[535,565],[535,616],[495,616]] },
      { id: "southeast-stalagmite", points: [[1001,565],[1043,565],[1043,616],[1001,616]] },
    ],
  },
};

export { CAVE_ARENA_DATA };
