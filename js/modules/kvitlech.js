import { getCollection, updateItem } from "../services/dbService.js";
import { isLoaded, setData, getData, clearData } from "../stats.js";
import { handleExport } from "../utils/exportUtils.js";
let activeStatusFilter = "all";
let activeDateFilter = "all";
let activeView = "table";

export async function renderKvitlech({ setContent }) {
  setContent(`<div class="text-gray-500">Loading kvitlech...</div>`);

  const kvitlech = await loadKvitlech();
  const filtered = filterKvitlech(kvitlech);

  if (activeView === "names") {
    setContent(renderFilters() + renderNamesOnly(filtered));
  } else {
    setContent(renderFilters() + renderTable(filtered));
  }

  attachKvitelEvents(setContent);
}

async function loadKvitlech() {
  if (!isLoaded("kvitlech")) {
    const data = await getCollection("kvitelService");

    const normalized = data.map(k => ({
      ...k,
      status: k.status || "unread",
      createdAt: k.createdAt || Date.now()
    }));

    setData("kvitlech", normalized);
  }

  return getData("kvitlech");
}

function filterKvitlech(items) {
  let result = [...items];

  if (activeStatusFilter !== "all") {
    result = result.filter(k => k.status === activeStatusFilter);
  }

  if (activeDateFilter !== "all") {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    if (activeDateFilter === "today") {
      result = result.filter(k => isSameDay(k.createdAt, now));
    }

    if (activeDateFilter === "week") {
      result = result.filter(k => now - k.createdAt <= 7 * day);
    }

    if (activeDateFilter === "month") {
      result = result.filter(k => now - k.createdAt <= 30 * day);
    }
  }

  return result.sort((a, b) => b.createdAt - a.createdAt);
}

function renderFilters() {
  return `
    <div class="bg-white rounded-2xl shadow border border-gray-200 p-4 mb-4 space-y-4">

      <div class="flex flex-wrap gap-2">
        ${filterButton("status", "all", "All")}
        ${filterButton("status", "unread", "Unread")}
        ${filterButton("status", "read", "Read")}
      </div>

      <div class="flex flex-wrap gap-2">
        ${filterButton("date", "all", "All Dates")}
        ${filterButton("date", "today", "Today")}
        ${filterButton("date", "week", "Last 7 Days")}
        ${filterButton("date", "month", "Last 30 Days")}
      </div>

      <div class="flex flex-wrap gap-2 pt-2 border-t">
        ${viewButton("table", "Table View")}
        ${viewButton("names", "Names Only")}
      </div>

    </div>
  `;
}

function filterButton(group, value, label) {
  const active =
    group === "status"
      ? activeStatusFilter === value
      : activeDateFilter === value;

  return `
    <button
      data-filter-group="${group}"
      data-filter-value="${value}"
      class="px-4 py-2 rounded-full border text-sm
      ${active ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-700"}">
      ${label}
    </button>
  `;
}

function viewButton(view, label) {
  const active = activeView === view;

  return `
    <button
      data-view="${view}"
      class="px-4 py-2 rounded-full border text-sm
      ${active ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700"}">
      ${label}
    </button>
  `;
}

function renderTable(items) {
  return `
    <div id="kvitelExportArea" class="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">

      <div class="px-5 py-4 border-b bg-gray-50">
        <h3 class="font-semibold text-gray-800">Kvitlech</h3>
        <p class="text-sm text-gray-500">Manage submitted kvitlech</p>
      </div>

      <div class="overflow-auto">
        <table class="w-full text-sm text-gray-700">
          <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th class="p-3 text-left">Name</th>
              <th class="p-3 text-left">Email</th>
              <th class="p-3 text-left">Status</th>
              <th class="p-3 text-left">Date</th>
              <th class="p-3 text-left export-skip">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            ${items.map(k => `
              <tr class="hover:bg-gray-50">
                <td class="p-3 font-medium">${k.name || "Anonymous"}</td>
                <td class="p-3">${k.email || "-"}</td>
                <td class="p-3">${statusBadge(k.status)}</td>
                <td class="p-3">${formatDate(k.createdAt)}</td>

                <td class="p-3 space-x-2 export-skip">
                  <button data-open-kvitel="${k.id}" class="text-blue-600 font-medium">Open</button>

                  ${k.status === "read" ? `
                    <button data-mark-unread="${k.id}" class="text-orange-600 font-medium">Mark Unread</button>
                  ` : `
                    <button data-mark-read="${k.id}" class="text-green-600 font-medium">Mark Read</button>
                  `}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderNamesOnly(items) {
  return `
    <div id="kvitelExportArea" class="bg-white rounded-2xl shadow border border-gray-200 p-8">

      <h3 class="font-semibold text-gray-800 mb-6 export-skip">
        Names Only Export
      </h3>

      <div class="text-lg leading-loose whitespace-pre-line">
        ${items.map(k => `
${escapeHtml(k.text || "Anonymous")}

        `).join("")}
      </div>

    </div>
  `;
}

function renderSingleKvitel(k) {
  return `
    <div id="kvitelExportArea" class="bg-white rounded-2xl shadow border border-gray-200 p-8 max-w-3xl">

      <div class="flex justify-between items-start mb-6 export-skip">
        <button data-back-kvitlech class="border px-4 py-2 rounded">
          ← Back
        </button>

        <button data-toggle-read="${k.id}" class="bg-amber-600 text-white px-4 py-2 rounded">
          ${k.status === "read" ? "Mark Unread" : "Mark Read"}
        </button>
      </div>

      <div class="border-b pb-4 mb-6">
        <h3 class="text-2xl font-bold">${escapeHtml(k.name || "Anonymous")}</h3>
        <p class="text-sm text-gray-500">${formatDate(k.createdAt)}</p>
      </div>

      <div class="text-lg leading-8 whitespace-pre-wrap">
        ${escapeHtml(k.text || "")}
      </div>

    </div>
  `;
}

function attachKvitelEvents(setContent) {
  const container = document.getElementById("moduleContent");

  container.querySelectorAll("[data-filter-group]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const group = btn.dataset.filterGroup;
      const value = btn.dataset.filterValue;

      if (group === "status") activeStatusFilter = value;
      if (group === "date") activeDateFilter = value;

      await renderKvitlech({ setContent });
    });
  });

  container.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", async () => {
      activeView = btn.dataset.view;
      await renderKvitlech({ setContent });
    });
  });

  container.querySelectorAll("[data-mark-read]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await changeStatus(btn.dataset.markRead, "read", setContent);
    });
  });

  container.querySelectorAll("[data-mark-unread]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await changeStatus(btn.dataset.markUnread, "unread", setContent);
    });
  });

  container.querySelectorAll("[data-open-kvitel]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.openKvitel;
      const kvitel = getData("kvitlech").find(k => k.id === id);

      setContent(renderSingleKvitel(kvitel));

      handleExport({
        elementId: "kvitelExportArea",
        imageFileName: `kvitel-${id}.png`,
        pdfFileName: `kvitel-${id}.pdf`,
        includeSelectors: ["#pageTitle"],
        excludeSelectors: [".export-skip"]
      });

      attachSingleEvents(setContent);
    });
  });

  handleExport({
    elementId: "kvitelExportArea",
    imageFileName: activeView === "names" ? "kvitel-names.png" : "kvitlech.png",
    pdfFileName: activeView === "names" ? "kvitel-names.pdf" : "kvitlech.pdf",
    // includeSelectors: ["#pageTitle"],
    excludeSelectors: [".export-skip"]
  });
}

function attachSingleEvents(setContent) {
  const container = document.getElementById("moduleContent");

  container.querySelector("[data-back-kvitlech]")?.addEventListener("click", async () => {
    await renderKvitlech({ setContent });
  });

  container.querySelector("[data-toggle-read]")?.addEventListener("click", async (e) => {
    const id = e.currentTarget.dataset.toggleRead;
    const kvitel = getData("kvitlech").find(k => k.id === id);
    const newStatus = kvitel.status === "read" ? "unread" : "read";

    await changeStatus(id, newStatus, setContent, true);
  });
}

async function changeStatus(id, status, setContent, staySingle = false) {
  await updateItem("kvitelService", id, { status });

  const data = getData("kvitlech");
  const item = data.find(k => k.id === id);
  if (item) item.status = status;

  if (staySingle && item) {
    setContent(renderSingleKvitel(item));
    attachSingleEvents(setContent);
  } else {
    await renderKvitlech({ setContent });
  }
}

function statusBadge(status) {
  if (status === "read") {
    return `<span class="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">Read</span>`;
  }

  return `<span class="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs">Unread</span>`;
}

function formatDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString();
}

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);

  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}