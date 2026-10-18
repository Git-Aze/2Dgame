import { player } from "../src/core/state.js";
import { resetAdventure } from "../src/core/lifecycle.js";
import { mapCollision } from "../src/world/collision.js";
import { collides, movePlayer } from "../src/world/movement.js";
import { blocked, trees } from "../src/world/world-state.js";
import { buildings } from "../src/world/buildings.js";

export function runWallSlideChecks(assert) {
  resetAdventure();
  const polygon = (points) => ({ points, left: Math.min(...points.map(p=>p[0])), right: Math.max(...points.map(p=>p[0])), top: Math.min(...points.map(p=>p[1])), bottom: Math.max(...points.map(p=>p[1])) });
  try {
    for (const regions of Object.values(mapCollision)) regions.length = 0;
    blocked.clear(); trees.length = 0; buildings.length = 0;
    for (const kind of ["solid", "water", "walkable"]) {
      const points = kind === "walkable"
        ? [[200,200],[700,200],[1300,800],[1300,1200],[200,1200]]
        : [[900,400],[1300,800],[1300,400]];
      mapCollision[kind].push(polygon(points));
      Object.assign(player, { x: 850, y: 500 });
      for (let i=0;i<100;i++) {
        movePlayer(5,0);
        assert(!collides(player.x,player.y), `Player stays outside ${kind} border while sliding`);
      }
      assert(player.x > 1050 && player.y > 570, `Right input slides down-right along sloped ${kind} border`);
      const startX=player.x, startY=player.y;
      movePlayer(0,0);
      assert(player.x === startX && player.y === startY, "No input causes no wall drift");
      movePlayer(-30,0);
      assert(Math.abs(player.x-(startX-30))<0.001 && player.y === startY, "Moving away from wall follows input without sliding");
      mapCollision[kind].length=0;
    }
    mapCollision.solid.push(polygon([[950,400],[1100,400],[1100,900],[950,900]]));
    Object.assign(player,{x:900,y:500});
    movePlayer(100,100);
    assert(player.x + player.w - 3 <= 950 && player.y > 590 && !collides(player.x,player.y), "Diagonal input slides along vertical wall without crossing it");
    const stoppedY=player.y;
    movePlayer(100,0);
    assert(player.y === stoppedY && !collides(player.x,player.y), "Head-on input against flat wall does not pick an arbitrary sideways direction");
    mapCollision.solid.push(polygon([[700,700],[950,700],[950,900],[700,900]]));
    Object.assign(player,{x:900,y:650});
    movePlayer(100,100);
    assert(!collides(player.x,player.y) && player.x + player.w - 3 <= 950 && player.y + player.h - 3 < 700, "Inside corner stops safely without pushing through either wall");
    mapCollision.solid.length=0;
    Object.assign(player,{x:850,y:500});
    movePlayer(30,40);
    assert(player.x === 880 && player.y === 540, "Unobstructed movement retains requested displacement");
  } finally {
    resetAdventure();
  }
}
