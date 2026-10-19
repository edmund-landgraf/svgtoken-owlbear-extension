import OBR from "@owlbear-rodeo/sdk";
import { createLetterTokens, normalizeLetter } from "../owlbear/tokenCreator.js";
import { renderAppShell } from "../ui/renderAppShell.js";

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function selectedColor() {
  return document.querySelector('input[name="tokenColor"]:checked')?.value;
}

function currentRequest() {
  return {
    letter: document.getElementById("letterInput")?.value,
    letter2: document.getElementById("letterInput2")?.value,
    letter3: document.getElementById("letterInput3")?.value,
    fontKey: document.getElementById("fontPicker")?.value,
    sizeKey: document.getElementById("sizePicker")?.value,
    quantity: document.getElementById("quantityInput")?.value,
    numberPlacement: document.querySelector('input[name="numberPlacement"]:checked')?.value,
    contrastMode: document.querySelector('input[name="contrastMode"]:checked')?.value,
    addTextLabel: Boolean(document.getElementById("addTextLabel")?.checked),
    color: selectedColor(),
  };
}

function wireTokenForm() {
  const letterInputs = [...document.querySelectorAll(".letter-input")];
  const createButton = document.getElementById("createTokens");

  letterInputs.forEach((letterInput) => {
    letterInput.addEventListener("input", () => {
      const normalized = normalizeLetter(letterInput.value);
      letterInput.value = normalized || letterInput.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1);
    });
  });

  createButton.addEventListener("click", async () => {
    createButton.disabled = true;
    try {
      const count = await createLetterTokens(currentRequest(), (message) => setText("tokenStatus", message));
      setText("tokenStatus", `Created ${count} token${count === 1 ? "" : "s"}.`);
    } catch (error) {
      setText("tokenStatus", error instanceof Error ? error.message : String(error));
    } finally {
      createButton.disabled = false;
    }
  });
}

export async function startApp() {
  renderAppShell();

  await OBR.onReady();

  setText("status", "Connected to Owlbear.");
  wireTokenForm();
}
