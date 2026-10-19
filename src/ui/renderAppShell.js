import { TOKEN_FONTS } from "../owlbear/tokenFonts.js";
import { TOKEN_COLORS } from "../owlbear/tokenPalette.js";
import { TOKEN_SIZES } from "../owlbear/tokenSizes.js";

export function renderAppShell() {
  document.querySelector("#app").innerHTML = `
    <main class="token-shell">
      <header>
        <h1>SVG Token Owlbear</h1>
        <p id="status">Connecting...</p>
      </header>

      <section class="panel">
        <div class="letter-grid">
          <div class="field">
            <label class="field-label" for="letterInput">Letter 1</label>
            <input id="letterInput" class="letter-input" maxlength="1" pattern="[A-Za-z]" autocomplete="off" value="A" />
          </div>
          <div class="field">
            <label class="field-label" for="letterInput2">Letter 2</label>
            <input id="letterInput2" class="letter-input" maxlength="1" pattern="[A-Za-z]" autocomplete="off" />
          </div>
          <div class="field">
            <label class="field-label" for="letterInput3">Letter 3</label>
            <input id="letterInput3" class="letter-input" maxlength="1" pattern="[A-Za-z]" autocomplete="off" />
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="fontPicker">Font</label>
          <select id="fontPicker">
            ${TOKEN_FONTS.map((font) => `<option value="${font.key}">${font.label}</option>`).join("")}
          </select>
        </div>

        <div class="field">
          <label class="field-label" for="sizePicker">Size</label>
          <select id="sizePicker">
            ${TOKEN_SIZES.map(
              (size) => `<option value="${size.key}" ${size.key === "medium" ? "selected" : ""}>${size.label}</option>`
            ).join("")}
          </select>
        </div>

        <div class="field">
          <label class="field-label" for="quantityInput">Quantity</label>
          <input id="quantityInput" type="number" min="1" max="100" step="1" value="1" />
        </div>

        <fieldset class="radio-group" aria-labelledby="numberPlacementLegend">
          <legend id="numberPlacementLegend">Copy number</legend>
          <label class="radio-option">
            <input name="numberPlacement" type="radio" value="superscript" checked />
            <span>Superscript</span>
          </label>
          <label class="radio-option">
            <input name="numberPlacement" type="radio" value="subscript" />
            <span>Subscript</span>
          </label>
        </fieldset>

        <fieldset class="radio-group contrast-group" aria-labelledby="contrastModeLegend">
          <legend id="contrastModeLegend">Letter contrast</legend>
          <label class="contrast-option">
            <input name="contrastMode" type="radio" value="auto" checked />
            <span>Auto</span>
          </label>
          <label class="contrast-option">
            <input name="contrastMode" type="radio" value="dark-on-light" />
            <span>Dark on light</span>
          </label>
          <label class="contrast-option">
            <input name="contrastMode" type="radio" value="light-on-dark" />
            <span>Light on dark</span>
          </label>
        </fieldset>

        <label class="checkbox-field" for="addTextLabel">
          <input id="addTextLabel" type="checkbox" />
          <span>Add text label to token?</span>
        </label>

        <fieldset class="palette" aria-labelledby="colorLegend">
          <legend id="colorLegend">Color</legend>
          ${TOKEN_COLORS.map(
            (color, index) => `
              <label class="swatch-label" title="${color}">
                <input name="tokenColor" type="radio" value="${color}" ${index === 0 ? "checked" : ""} />
                <span class="swatch" style="--swatch-color: ${color}"></span>
              </label>`
          ).join("")}
        </fieldset>

        <button id="createTokens">Create tokens</button>
        <p id="tokenStatus" aria-live="polite"></p>
      </section>
    </main>
  `;
}
