

const messageHistory = [];
const MAX_LOG_MESSAGES = 30;

function showMessage(message) {
  // Add the message to the permanent log.
  const log = document.getElementById("message-log-entries");
  if (!log) return;

  const entry = document.createElement("div");
  entry.className = "message-log-entry";
  entry.textContent = message;

  if (/damage|fireball|slime|defeated|attack/i.test(message)) {
    entry.classList.add("combat");
  }

  messageHistory.push(entry);

  while (messageHistory.length > MAX_LOG_MESSAGES) {
    messageHistory.shift().remove();
  }
  // Scroll to the bottom after the new message is added.
  const messageLog = document.getElementById("message-log");

  if (messageLog) {
    requestAnimationFrame(() => {
      messageLog.scrollTop = messageLog.scrollHeight;
    });
  }
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

export { messageHistory, showMessage };
