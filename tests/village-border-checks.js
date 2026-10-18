import { player, enemies, runtime } from "../src/core/state.js";
import { resetAdventure } from "../src/core/lifecycle.js";
import { collides, movePlayer } from "../src/world/movement.js";
import { spellPathBlocked } from "../src/world/collision.js";
import { buildings, buildingIsNearby } from "../src/world/buildings.js";
import { nearbyPortal } from "../src/world/areas.js";

export function runVillageBorderChecks(assert) {
  resetAdventure();
  const at = (x,y) => ({ x:x*1.5-player.w/2, y:y*1.5-player.h/2 });
  try {
    assert(!collides(player.x,player.y) && enemies.every(enemy=>!collides(enemy.x,enemy.y,enemy)), "Village reference preserves clear player and enemy spawns");
    for (const [x,y] of [[310,300],[760,220],[1190,480],[1180,320],[800,900],[900,850],[350,700]]) {
      const point=at(x,y);
      assert(collides(point.x,point.y), `Village reference blocks river, ridge, or sea at ${x},${y}`);
    }
    for (const [x,y] of [[700,500],[500,550],[900,600],[1400,183]]) {
      const point=at(x,y);
      assert(!collides(point.x,point.y), `Village reference keeps floor at ${x},${y} open`);
    }
    for (const [ax,ay,bx,by,label] of [[220,223,330,245,"northwest bridge"],
      [270,422,355,449,"southwest bridge"],[1425,510,1505,470,"east bridge"],
      [620,752,555,827,"dock"]]) {
      const start=at(ax,ay), end=at(bx,by);
      Object.assign(player,start);
      assert(!collides(player.x,player.y), `${label} approach is clear`);
      for (let step=0;step<100;step++) {
        movePlayer((end.x-start.x)/100,(end.y-start.y)/100);
        assert(!collides(player.x,player.y), `${label} traversal stays on floor`);
      }
      assert(Math.hypot(player.x-end.x,player.y-end.y)<2, `${label} remains traversable along its deck (${player.x},${player.y} toward ${end.x},${end.y})`);
    }
    assert(!spellPathBlocked(1140*1.5,310*1.5,1145*1.5,315*1.5), "Reference river remains transparent to spells");
    assert(spellPathBlocked(700*1.5,220*1.5,830*1.5,220*1.5), "Reference ridge blocks spells through enclosed floor exclusion");
    // Check broad field connectivity separately; narrow sloping decks are
    // verified by continuous movement above rather than coarse grid sampling.
    Object.assign(player,at(700,500));
    const queue=[[player.x,player.y]],seen=new Set([`${player.x},${player.y}`]);
    for(let i=0;i<queue.length;i++) {
      const [x,y]=queue[i];
      for(const [dx,dy] of [[12,0],[-12,0],[0,12],[0,-12]]) {
        const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
        if(!seen.has(key)&&!collides(nx,ny)){seen.add(key);queue.push([nx,ny]);}
      }
    }
    for(const [x,y,label] of [[620,740,"dock approach"],[740,530,"shop entrance"],[1400,183,"cave approach"]]) {
      const goal=at(x,y);
      assert(queue.some(([px,py])=>Math.hypot(px-goal.x,py-goal.y)<24), `Village field connects to ${label}`);
    }
    Object.assign(player,at(740,530));
    assert(buildingIsNearby(buildings[0]), "Shop interaction remains reachable on reference floor");
    Object.assign(player,{x:2100,y:275});
    assert(nearbyPortal()?.targetArea === "cave", "Cave interaction remains reachable on reference floor");
    assert(runtime.areaId === "village", "Village border checks preserve active area");
  } finally {
    resetAdventure();
  }
}
