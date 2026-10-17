# Agent guidelines

- Keep changes focused on the requested task. Avoid unrelated refactors.
- Follow existing code style and project structure.
- Keep gameplay logic separate from rendering and UI where practical.
- Use delta time for movement, animation, cooldowns, and other timed gameplay.
- Keep world, screen, and canvas coordinates consistent.
- Maintain a single source of truth for game state and character stats.
- Avoid unnecessary allocations and DOM updates in the game loop. Measure before optimizing.
- Reuse existing assets and systems before adding dependencies or new frameworks.
- Preserve existing controls and gameplay behavior unless the task requires changing them.
- Verify affected gameplay flows and check the browser console for errors when possible. State any checks that could not be performed.
- Update `todo.md` when completing tracked tasks.
