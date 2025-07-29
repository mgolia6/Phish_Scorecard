const terminal = document.getElementById("terminal");

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const line = document.createElement("div");
    line.textContent = "> Loading Phish setlist...";
    terminal.appendChild(line);
    // Later: add fetch call to Phish.net API here!
  }
});