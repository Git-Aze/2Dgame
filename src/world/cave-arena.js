// Walkable floor follows the inner edge of cave_boss_area_border.png.
// The 936x932 border crop aligns at (300,92) in the 1536x1024 ground map.
const CAVE_ARENA_DATA = {
  id: "cave-arena", name: "Cave Arena", tileSize: 32, width: 72, height: 48,
  background: new URL("../../assets/images/cave_boss_area.png", import.meta.url).href,
  playerSpawn: { tileX: 35, tileY: 43, offsetX: 20, offsetY: 4 },
  trees: [], buildings: [], enemySpawns: [{ id: "00004", tileX: 36, tileY: 19 }],
  portals: [{ id: "arena-exit", label: "Return to Northeast Cave", x: 1080, y: 1440, width: 150, height: 64,
    targetArea: "cave", arrival: { x: 1998, y: 316 } }],
  collision: {
    entityMargin: 3, boundaryTiles: 1, referenceWidth: 1536, referenceHeight: 1024,
    backgroundTrunks: [], water: [], crossings: [],
    // Static contour simplified within 1.5 reference pixels; no runtime image reads.
    walkable: [
      { id: "arena-floor", points: [
        [750,101],[828,102],[825,136],[827,144],[886,182],[820,235],[821,292],[823,295],
        [828,295],[875,271],[920,311],[931,318],[1057,303],[1151,323],[1173,349],[1179,353],
        [1226,404],[1227,451],[1182,469],[1127,495],[1125,494],[1121,498],[1118,575],[1116,577],
        [1105,582],[1105,584],[1048,619],[958,624],[951,629],[902,649],[856,672],[824,818],
        [834,1018],[707,1019],[724,816],[693,681],[605,627],[532,632],[433,580],[428,502],
        [313,433],[361,366],[492,296],[631,314],[640,313],[670,285],[723,296],[725,294],
        [725,234],[662,182],[724,138],[725,129],[721,102],
      ] },
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
