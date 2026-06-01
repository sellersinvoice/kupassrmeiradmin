import {
  getBrandingSettings,
  getModuleBackgrounds,
  updateBrandingSettings,
  updateModuleBackground
} from "../services/siteSettingsService.js";

const modules = [
  { id: "hero", label: "Home / Hero" },
  { id: "kvitel", label: "Kvitel" },
  { id: "donate", label: "Donate" },
  { id: "pushka", label: "Pushka" },
  { id: "contact", label: "Contact" }
];

let activeSettingsTab = "backgrounds";

export async function renderSettings({ setContent }) {
  setContent(`<div class="text-gray-500">Loading site settings...</div>`);

  const [backgrounds, branding] = await Promise.all([
    getModuleBackgrounds(),
    getBrandingSettings()
  ]);

  setContent(`
    <div class="max-w-6xl space-y-4">
      <div class="bg-white rounded-2xl shadow border border-gray-200 p-4 flex flex-wrap gap-2">
        ${renderTabButton("backgrounds", "Background URLs")}
        ${renderTabButton("branding", "Branding")}
      </div>

      <div class="${activeSettingsTab === "backgrounds" ? "" : "hidden"}">
        ${renderBackgroundsPanel(backgrounds)}
      </div>

      <div class="${activeSettingsTab === "branding" ? "" : "hidden"}">
        ${renderBrandingPanel(branding)}
      </div>
    </div>
  `);

  attachSettingsEvents(setContent);
}

function renderTabButton(tab, label) {
  const active = activeSettingsTab === tab;

  return `
    <button
      data-settings-tab="${tab}"
      class="px-4 py-2 rounded-full border text-sm font-medium
      ${active ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-700"}">
      ${label}
    </button>
  `;
}

function renderBackgroundsPanel(backgrounds) {
  return `
    <div class="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
      <div class="px-5 py-4 border-b bg-gray-50">
        <h3 class="font-semibold text-gray-800">Module Background Pictures</h3>
      </div>

      <div class="p-5 grid xl:grid-cols-2 gap-5">
        ${modules.map(module => renderBackgroundCard(module, backgrounds[module.id] || "")).join("")}
      </div>
    </div>
  `;
}

function renderBackgroundCard(module, value) {
  const escapedValue = escapeHtml(value);

  return `
    <form data-background-card="${module.id}" class="border rounded-xl p-4 space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <label for="bg-${module.id}" class="font-semibold text-gray-800">
            ${module.label}
          </label>
          <p class="text-xs text-gray-500">${module.id}</p>
        </div>

        <button class="bg-amber-600 text-white px-4 py-2 rounded font-semibold text-sm">
          Save
        </button>
      </div>

      <input
        id="bg-${module.id}"
        name="imageUrl"
        type="url"
        value="${escapedValue}"
        placeholder="https://example.com/image.jpg"
        class="w-full border p-3 rounded"
      >

      <div
        data-preview="${module.id}"
        class="h-36 rounded-lg border bg-gray-100 bg-center bg-cover"
        style="${value ? `background-image: url('${escapeAttribute(value)}')` : ""}"
      ></div>

      <p data-status="${module.id}" class="text-sm text-gray-500 min-h-5"></p>
    </form>
  `;
}

function renderBrandingPanel(branding) {
  const logoUrl = branding.logoUrl || "";

  return `
    <div class="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden max-w-3xl">
      <div class="px-5 py-4 border-b bg-gray-50">
        <h3 class="font-semibold text-gray-800">Branding</h3>
        <p class="text-sm text-gray-500">
          Change public site branding. The public website checks this once when it loads.
        </p>
      </div>

      <div class="p-5">
        <form id="brandingForm" class="border rounded-xl p-4 space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <label for="logoUrl" class="font-semibold text-gray-800">Logo URL</label>
              <p class="text-xs text-gray-500">Used in the public site header</p>
            </div>

            <button class="bg-amber-600 text-white px-4 py-2 rounded font-semibold text-sm">
              Save
            </button>
          </div>

          <input
            id="logoUrl"
            name="logoUrl"
            type="url"
            value="${escapeHtml(logoUrl)}"
            placeholder="https://example.com/logo.png"
            class="w-full border p-3 rounded"
          >

          <div class="h-28 rounded-lg border bg-gray-100 flex items-center justify-center p-4">
            <img
              id="logoPreview"
              src="${escapeHtml(logoUrl)}"
              alt="Logo preview"
              class="max-h-20 max-w-full object-contain ${logoUrl ? "" : "hidden"}"
            >
            <span id="logoPreviewEmpty" class="text-sm text-gray-500 ${logoUrl ? "hidden" : ""}">
              No logo selected
            </span>
          </div>

          <p id="brandingStatus" class="text-sm text-gray-500 min-h-5"></p>
        </form>
      </div>
    </div>
  `;
}

function attachSettingsEvents(setContent) {
  document.querySelectorAll("[data-settings-tab]").forEach(button => {
    button.addEventListener("click", async () => {
      activeSettingsTab = button.dataset.settingsTab;
      await renderSettings({ setContent });
    });
  });

  attachBackgroundEvents();
  attachBrandingEvents();
}

function attachBackgroundEvents() {
  document.querySelectorAll("[data-background-card]").forEach(form => {
    const moduleId = form.dataset.backgroundCard;
    const input = form.querySelector("input[name='imageUrl']");
    const preview = document.querySelector(`[data-preview="${moduleId}"]`);
    const status = document.querySelector(`[data-status="${moduleId}"]`);
    const button = form.querySelector("button");

    input.addEventListener("input", () => {
      preview.style.backgroundImage = input.value.trim()
        ? `url("${input.value.trim()}")`
        : "";
    });

    form.addEventListener("submit", async e => {
      e.preventDefault();

      button.disabled = true;
      button.innerText = "Saving...";
      status.innerText = "";

      try {
        await updateModuleBackground(moduleId, input.value.trim());
        status.innerText = "Saved";
      } catch (error) {
        console.error(error);
        status.innerText = "Could not save";
      } finally {
        button.disabled = false;
        button.innerText = "Save";
      }
    });
  });
}

function attachBrandingEvents() {
  const form = document.getElementById("brandingForm");
  if (!form) return;

  const input = form.querySelector("input[name='logoUrl']");
  const preview = document.getElementById("logoPreview");
  const empty = document.getElementById("logoPreviewEmpty");
  const status = document.getElementById("brandingStatus");
  const button = form.querySelector("button");

  input.addEventListener("input", () => {
    const value = input.value.trim();
    preview.src = value;
    preview.classList.toggle("hidden", !value);
    empty.classList.toggle("hidden", Boolean(value));
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();

    button.disabled = true;
    button.innerText = "Saving...";
    status.innerText = "";

    try {
      await updateBrandingSettings({ logoUrl: input.value.trim() });
      status.innerText = "Saved";
    } catch (error) {
      console.error(error);
      status.innerText = "Could not save";
    } finally {
      button.disabled = false;
      button.innerText = "Save";
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}
