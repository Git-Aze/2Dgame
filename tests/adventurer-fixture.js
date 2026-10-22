// The original regression scenarios deliberately mix all equipment and actions.
// A test-only class keeps those scenarios intact; classes.html tests the real
// three classes and their restrictions without this fixture.
import { CLASSES } from "../src/data/classes.js";
import { player, runtime, initialPlayerState, initialActionBar, actionBarSpells } from "../src/core/state.js";
import { resetAdventure, setGameState } from "../src/core/lifecycle.js";

CLASSES.adventurer = {
  id: "adventurer", name: "Test Adventurer", mainStat: "intelligence",
  gearCategories: ["strength", "dexterity", "intelligence"],
  startingWeapon: "00001",
  startingItems: ["00001", "02000", "03000", "04000", "05000", "06000", "07000"],
  abilities: ["00001", "00002", "00003", "00004", "00005"],
};
player.classId = initialPlayerState.classId = runtime.selectedClassId = "adventurer";
for (let i = 0; i < 10; i++) initialActionBar[i] = actionBarSpells[i] = CLASSES.adventurer.abilities[i] ?? null;
resetAdventure("village", "adventurer");
setGameState("start");
