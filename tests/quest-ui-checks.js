import { runtime, player, questProgress } from "../src/core/state.js";
import { resetAdventure, setGameState } from "../src/core/lifecycle.js";
import { acceptQuest, recordQuestEvent } from "../src/quests/quest-system.js";
import { toggleQuestLog, closeQuestLog, selectQuest } from "../src/ui/quest-ui.js";
import { toggleCharacterSheet } from "../src/ui/character-ui.js";
import { toggleSpellBook } from "../src/ui/spellbook.js";
import { createSave, applySave, parseSave } from "../src/persistence/saves.js";
import { damagePlayer } from "../src/player/player.js";
import { resizeCanvas } from "../src/rendering/canvas.js";

export async function runQuestUIChecks(assert) {
  resetAdventure(); acceptQuest("firstSteps");
  const panel=document.getElementById("quest-log"), tracker=document.getElementById("tracked-quest");
  const key=(key,options={})=>window.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true,cancelable:true,...options}));
  const row=id=>document.querySelector(`#quest-list [data-quest-id="${id}"]`);
  const frame=window.frameElement, previousStyle=frame.style.cssText;
  try {
    assert(panel.classList.contains("hidden") && panel.inert, "Quest log starts closed and inert");
    assert(tracker.querySelectorAll("h3").length === 1 && tracker.textContent.includes("Ready for Adventure") && !tracker.textContent.includes("Arena Guardian"), "Side tracker shows only selected introductory quest");
    key("l");
    assert(!panel.classList.contains("hidden") && !panel.inert && document.querySelectorAll(".quest-row").length === 3, "L opens log containing active, available, and locked quests");
    key("l",{repeat:true});
    assert(!panel.classList.contains("hidden"), "Held L does not repeatedly toggle quest log");
    const close=document.getElementById("close-quest-log"), details=document.getElementById("quest-details");
    close.focus();close.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",shiftKey:true,bubbles:true,cancelable:true}));
    assert(document.activeElement === details, "Keyboard focus reaches scrollable quest details");
    details.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",bubbles:true,cancelable:true}));
    assert(document.activeElement === close, "Quest dialog wraps keyboard focus back to close control");
    const progression=JSON.stringify([player.gold,player.xp,questProgress]);
    row("stonehorn").click();
    assert(runtime.selectedQuestId === "stonehorn" && tracker.textContent.includes("Arena Guardian") && !tracker.textContent.includes("Ready for Adventure"), "Selecting quest replaces the single side tracker");
    assert(document.getElementById("quest-details").textContent.includes("150 XP") && row("stonehorn").getAttribute("aria-pressed") === "true", "Selection shows quest details and rewards with accessible selected state");
    assert(progression === JSON.stringify([player.gold,player.xp,questProgress]), "Browsing quests never advances objectives or grants rewards");
    row("slimeTrouble").click();
    assert(document.getElementById("quest-details").textContent.includes("Requires: Ready for Adventure"), "Locked quest details explain prerequisite");
    recordQuestEvent({type:"itemEquipped",itemId:"00001"});
    row("slimeTrouble").focus();
    recordQuestEvent({type:"enemyDefeated",enemyTypeId:"00001"});
    assert(tracker.textContent.includes("1 / 3") && document.getElementById("quest-details").textContent.includes("1 / 3"), "Quest progress updates selected tracker and log together");
    assert(document.activeElement.dataset.questId === "slimeTrouble", "Quest progress refresh preserves focused quest row");
    row("firstSteps").click();
    assert(tracker.textContent.includes("Completed") && document.getElementById("quest-details").textContent.includes("Rewards have been received"), "Completed quests remain browsable and selectable");
    row("stonehorn").click();
    const saved=createSave();
    closeQuestLog(); selectQuest("firstSteps"); applySave(JSON.stringify(saved));
    assert(runtime.selectedQuestId === "stonehorn" && tracker.textContent.includes("Arena Guardian"), "Save/load preserves selected quest");
    const older={...saved};delete older.selectedQuestId;
    assert(parseSave(JSON.stringify(older)).selectedQuestId === null, "Saves without optional selection remain compatible");
    const invalid={...saved,selectedQuestId:"__proto__"};let rejected=false;
    try{applySave(JSON.stringify(invalid));}catch{rejected=true;}
    assert(rejected && runtime.selectedQuestId === "stonehorn", "Invalid saved quest selection is rejected without changing live selection");
    toggleCharacterSheet();toggleSpellBook();toggleQuestLog();
    key("Escape");
    assert(panel.classList.contains("hidden") && panel.inert && !runtime.menuOpen && !document.getElementById("spell-book").classList.contains("hidden"), "Escape closes topmost quest log before spell book or pause menu");
    assert(!panel.contains(document.activeElement), "Closing quest log keeps focus out of hidden panel");
    key("Escape");key("Escape");key("Escape");
    assert(runtime.menuOpen, "Escape opens pause only after all gameplay panels close");
    key("l");assert(panel.classList.contains("hidden"), "L cannot open quest log behind pause menu");
    key("Escape");
    document.getElementById("open-quest-log").focus(); document.getElementById("open-quest-log").click();
    document.getElementById("close-quest-log").click();
    assert(panel.classList.contains("hidden") && document.activeElement.id === "open-quest-log", "Visible close control restores tracker-button focus");
    key("L");key("l");assert(panel.classList.contains("hidden"), "L toggles quest log closed");
    const input=document.createElement("input");document.body.appendChild(input);input.focus();
    input.dispatchEvent(new KeyboardEvent("keydown",{key:"l",bubbles:true}));input.remove();
    assert(panel.classList.contains("hidden"), "Typing L in a text input does not toggle quest log");
    toggleQuestLog();selectQuest("stonehorn");
    for(const [width,height] of [[1100,700],[640,360],[390,480]]) {
      frame.style.width=`${width}px`;frame.style.height=`${height}px`;
      await new Promise(resolve=>requestAnimationFrame(resolve));resizeCanvas();
      const bounds=panel.getBoundingClientRect(), close=document.getElementById("close-quest-log").getBoundingClientRect();
      assert(bounds.left>=8 && bounds.top>=8 && bounds.right<=innerWidth-8 && bounds.bottom<=innerHeight-8, `Quest log fits ${width}x${height} viewport`);
      const footer=panel.querySelector(".quest-log-footer"), footerTop=footer.getBoundingClientRect().top;
      document.getElementById("quest-list").scrollTop=9999;document.getElementById("quest-details").scrollTop=9999;
      assert(close.top>=bounds.top && close.bottom<=bounds.bottom && footer.getBoundingClientRect().top === footerTop && footer.getBoundingClientRect().bottom<=bounds.bottom, "Quest header close button and footer stay reachable while contents scroll");
      assert(panel.scrollWidth<=panel.clientWidth, "Quest log has no horizontal overflow");
    }
    frame.style.cssText=previousStyle;resizeCanvas();
    damagePlayer(10000);
    assert(panel.classList.contains("hidden") && panel.inert && !panel.contains(document.activeElement), "Death closes quest log without hidden focus");
    player.hp=100;setGameState("playing");resetAdventure();
    assert(runtime.selectedQuestId === "firstSteps", "Fresh adventure resets selected quest to introduction");
  } finally {
    frame.style.cssText=previousStyle;resizeCanvas();closeQuestLog();setGameState("playing");resetAdventure();
  }
}
