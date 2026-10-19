import { ctx } from "./canvas.js";

const bossImage = new Image();
let bossSheet = null;
bossImage.addEventListener("load",()=>{
  bossSheet = document.createElement("canvas");
  bossSheet.width = bossImage.naturalWidth; bossSheet.height = bossImage.naturalHeight;
  const sheetContext = bossSheet.getContext("2d");
  sheetContext.drawImage(bossImage,0,0);
  // Sheet headings are metadata, not part of the animation frames.
  for (const [x,y,w,h] of [[18,10,86,33],[18,203,87,32],[18,391,208,32],
    [18,632,86,32],[588,632,105,32],[18,833,246,33],[620,833,208,33],[1222,833,168,33]]) {
    sheetContext.clearRect(x,y,w,h);
  }
});
bossImage.src = new URL("../../assets/images/boss1.png",import.meta.url).href;

// The supplied sheet has labelled, uneven rows rather than a regular grid.
// Crop each animation below its label and anchor it at the collision footprint.
const frames = {
  idle: [[12,24,190,156],[208,24,155,156],[366,24,150,156],[522,24,150,156]],
  walk: [[72,204,175,160],[250,204,158,160],[412,204,158,160],[579,204,158,160],[741,204,162,160],[907,204,160,160],[1072,204,166,160]],
  cleave: [[12,384,225,226],[254,384,205,226],[465,384,220,226],[687,384,200,226],[888,384,204,226],[1094,384,195,226],[1290,384,235,226]],
  hurt: [[24,652,145,154],[176,652,150,154],[332,652,185,154]],
  charge: [[24,870,150,133],[173,870,143,133],[318,870,145,133],[465,870,145,133]],
  charging: [[614,870,192,136],[810,870,192,136],[1005,870,192,136]],
  death: [[1300,655,230,150]],
};

function drawBossSprite(boss, dead = false, context = ctx) {
  if (!bossSheet) return false;
  const action = boss.bossAction;
  const moving = boss.spriteMoving && !action && boss.bossState === "active";
  const kind = dead ? "death" : boss.hurtTime > 0 ? "hurt" : action?.type ?? (moving ? "walk" : "idle");
  const row = frames[kind] ?? frames.idle;
  const time = action && action.type !== "charging" ? (action.duration-action.remaining)/action.duration : (boss.bossTime ?? 0)*0.8;
  const frame = action && action.type !== "charging" ? Math.min(row.length-1,Math.floor(time*row.length)) : Math.floor(time*row.length)%row.length;
  const [sx,sy,sw,sh] = row[frame];
  const scale = 0.8;
  context.save();
  context.translate(Math.round(boss.x+boss.w/2),Math.round(boss.y+boss.h));
  if ((kind === "charging" && action.dx < 0) || (kind === "walk" && boss.facingLeft)) context.scale(-1,1);
  context.drawImage(bossSheet,sx,sy,sw,sh,-sw*scale/2,-sh*scale,sw*scale,sh*scale);
  context.restore();
  return true;
}

export { bossImage, drawBossSprite };
