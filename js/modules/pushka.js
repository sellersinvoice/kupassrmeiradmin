import { getCollection, updateItem } from "../services/dbService.js";
import { isLoaded, setData, getData, clearData } from "../stats.js";
import { handleExport } from "../utils/exportUtils.js";
let activeTypeFilter = "all";
/* =========================
   MAIN RENDER
========================= */

export async function renderPushka({ setContent }) {
  
  setContent(`<div>Loading...</div>`);

  const tasks = await loadPushkaTasks();

  setContent(renderFilters() + renderTable(filterTasks(tasks)));
  const container = document.getElementById("moduleContent");
  attachPushkaEvents(container);
  handleExport({
  elementId: "pushkaExportArea",
  imageFileName: "pushka-tasks.png",
  pdfFileName: "pushka-tasks.pdf",
  // includeSelectors: ["#pageTitle"],
  excludeSelectors: [".export-skip"]
});
}



/* =========================
   LOAD DATA (WITH CACHE)
========================= */

async function loadPushkaTasks() {

  if (!isLoaded("pushkaTasks")) {

    const [gabai, pushka, donations] = await Promise.all([
      getCollection("gabaiRequests"),
      getCollection("pushkaRequests"),
      getCollection("donations")
    ]);

    const tasks = [];

    // 🟡 pickup
    gabai.forEach(d => {
      tasks.push({
        ...d,
        type: "pickup",
        collection: "gabaiRequests",
        status: d.status || "pending",
        gabaiId: d.gabaiId || null
      });
    });

    // 🔵 delivery
    pushka.forEach(d => {
      tasks.push({
        ...d,
        type: "delivery",
        collection: "pushkaRequests",
        status: d.status || "pending",
        gabaiId: d.gabaiId || null
      });
    });

    // 🟢 card payments
    donations.forEach(d => {
      if (d.type === "pushka") {
        tasks.push({
          ...d,
          type: "card",
          collection: "donations",
          status: "done",
          gabaiId: null
        });
      }
    });

    setData("pushkaTasks", tasks);
  }

  return getData("pushkaTasks");
}



/* =========================
   TABLE RENDER
========================= */

function renderTable(tasks) {

    return `
      <div id="pushkaExportArea" class="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">

        <div class="px-5 py-4 border-b bg-gray-50">
          <h3 class="font-semibold text-gray-800">Pushka Tasks</h3>
          <p class="text-sm text-gray-500">Pickup, delivery, and card-emptying records</p>
        </div>

        <div class="overflow-auto">
          <table id="pushkaTable" class="w-full text-sm text-gray-700">
            <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th class="p-3 text-left">Type</th>
                <th class="p-3 text-left">City</th>
                <th class="p-3 text-left">Phone</th>
                <th class="p-3 text-left">Address</th>
                <th class="p-3 text-left">Status</th>
                <th class="p-3 text-left">Gabai</th>
                <th class="p-3 text-left export-skip">Actions</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-100">
              ${tasks.map(t => `
                <tr class="hover:bg-gray-50">
                  <td class="p-3 font-medium">${formatType(t.type)}</td>
                  <td class="p-3">${t.city || "-"}</td>
                  <td class="p-3">${t.phone || "-"}</td>
                  <td class="p-3">${t.address || "-"}</td>
                  <td class="p-3">${t.status}</td>
                  <td class="p-3">${t.gabaiId || "-"}</td>

                  <td class="p-3 space-x-2 export-skip">
                    ${t.type !== "card" ? `
                      <button data-assign="${t.id}" class="text-blue-600 font-medium">Assign</button>
                      <button data-done="${t.id}" class="text-green-600 font-medium">Done</button>
                    ` : "-"}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
}

function formatType(type) {
  if (type === "pickup") return "Pickup";
  if (type === "delivery") return "Delivery";
  if (type === "card") return "Card Paid";
}



/* =========================
   ACTION HANDLERS
========================= */

export function attachPushkaEvents(container) {

  // Assign
  container.querySelectorAll("[data-assign]").forEach(btn => {
    btn.addEventListener("click", async () => {

      const id = btn.dataset.assign;
      const task = getData("pushkaTasks").find(t => t.id === id);

      const gabaiId = prompt("Enter Gabai ID");

      if (!gabaiId) return;

      await updateItem(task.collection, id, {
        gabaiId,
        status: "assigned"
      });

      clearData("pushkaTasks");
      location.reload(); // quick refresh (we improve later)
    });
  });

  // Mark done
  container.querySelectorAll("[data-done]").forEach(btn => {
    btn.addEventListener("click", async () => {

      const id = btn.dataset.done;
      const task = getData("pushkaTasks").find(t => t.id === id);

      await updateItem(task.collection, id, {
        status: "done"
      });

      clearData("pushkaTasks");
      location.reload();
    });
  });

  container.querySelectorAll("[data-filter-type]").forEach(btn => {
  btn.addEventListener("click", async () => {
    activeTypeFilter = btn.dataset.filterType;

    const tasks = getData("pushkaTasks");

    container.innerHTML = renderFilters() + renderTable(filterTasks(tasks));

    attachPushkaEvents(container);
  });
});

}

function filterTasks(tasks) {
  if (activeTypeFilter === "all") return tasks;
  return tasks.filter(t => t.type === activeTypeFilter);
}

function renderFilters() {
  return `
    <div class="bg-white rounded shadow p-4 mb-4 flex flex-wrap gap-2">
      ${filterButton("all", "All")}
      ${filterButton("pickup", "Pickup Requests")}
      ${filterButton("delivery", "Request Pushka")}
      ${filterButton("card", "Emptied by Card")}
    </div>
  `;
}

function filterButton(type, label) {
  const active = activeTypeFilter === type;

  return `
    <button 
      data-filter-type="${type}"
      class="px-4 py-2 rounded-full border text-sm
      ${active ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-700"}">
      ${label}
    </button>
  `;
}