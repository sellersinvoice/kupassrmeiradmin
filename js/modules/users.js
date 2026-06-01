import { getCollection, addItem, updateItem, deleteItem, setItem } from "../services/dbService.js";
import { isLoaded, setData, getData, clearData } from "../stats.js";
import { handleExport } from "../utils/exportUtils.js";
import { showActionButton } from "../utils/actionButtons.js";
let activeRoleFilter = "all";

async function loadAccessRequests() {
  if (!isLoaded("accessRequests")) {
    const data = await getCollection("accessRequests");
    setData("accessRequests", data);
  }

  return getData("accessRequests");
}

export async function renderUsers({ setContent }) {
  setContent(`<div class="text-gray-500">Loading users...</div>`);

  const users = await loadUsers();
  const roles = await loadRoles();
  const accessRequests = await loadAccessRequests();

  setContent(`
    ${renderFilters(roles, accessRequests.length)}
    ${activeRoleFilter === "requests"
     ? renderRequestsTable(accessRequests) : renderTable(filterUsers(users)) }
    ${renderModal(roles)}
    ${renderRoleModal()}
  `);
  
  showActionButton("addUserGlobalBtn", () => openUserModal());
  showActionButton("addRoleGlobalBtn", () => openRoleModal());

  attachUserEvents(setContent);

  handleExport({
    elementId: "usersExportArea",
    imageFileName: "users.png",
    pdfFileName: "users.pdf",
    includeSelectors: ["#pageTitle"],
    excludeSelectors: [".export-skip"]
  });
}

async function loadUsers() {
  if (!isLoaded("users")) {
    const data = await getCollection("users");

    setData("users", data.map(u => ({
      ...u,
      active: u.active !== false,
      areas: Array.isArray(u.areas) ? u.areas : []
    })));
  }

  return getData("users");
}

async function loadRoles() {
  if (!isLoaded("roles")) {
    const data = await getCollection("roles");

    if (data.length === 0) {
      setData("roles", [
        { id: "admin", label: "Admin" },
        { id: "gabai", label: "Gabai" },
        { id: "manager", label: "Manager" }
      ]);
    } else {
      setData("roles", data);
    }
  }

  return getData("roles");
}

function filterUsers(users) {
  if (activeRoleFilter === "all") return users;
  return users.filter(u => u.role === activeRoleFilter);
}



function renderFilters(roles, requestCount = 0) {
  return `
    <div class="bg-white rounded-2xl shadow border border-gray-200 p-4 mb-4 flex flex-wrap gap-2">
      ${roleFilterButton("all", "All")}
      ${requestFilterButton(requestCount)}
      ${roles.map(r => roleFilterButton(r.id, r.label || r.id)).join("")}
    </div>
  `;
}
function requestFilterButton(count) {
  const active = activeRoleFilter === "requests";
  return `
    <button
      data-role-filter="requests"
      class="px-4 py-2 rounded-full border text-sm font-medium
      ${active ? "bg-blue-600 text-white border-amber-600" : "bg-blue-50 text-blue-700 border-blue-200"}">
      Requests ${count ? `(${count})` : ""}
    </button>
  `;
}
function roleFilterButton(role, label) {
  const active = activeRoleFilter === role;

  return `
    <button
      data-role-filter="${role}"
      class="px-4 py-2 rounded-full border text-sm
      ${active ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-700"}">
      ${label}
    </button>
  `;
}

function renderTable(users) {
  return `
    <div id="usersExportArea" class="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
      <div class="px-5 py-4 border-b bg-gray-50">
        <h3 class="font-semibold text-gray-800">User List</h3>
      </div>

      <div class="overflow-auto">
        <table class="w-full text-sm text-gray-700">
          <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th class="p-3 text-left">Name</th>
              <th class="p-3 text-left">Email</th>
              <th class="p-3 text-left">Role</th>
              <th class="p-3 text-left">Areas</th>
              <th class="p-3 text-left">Active</th>
              <th class="p-3 text-left export-skip">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            ${users.map(u => `
              <tr class="hover:bg-gray-50">
                <td class="p-3 font-medium">${escapeHtml(u.name || "-")}</td>
                <td class="p-3">${escapeHtml(u.email || "-")}</td>
                <td class="p-3">${escapeHtml(u.role || "-")}</td>
                <td class="p-3">${escapeHtml((u.areas || []).join(", ") || "-")}</td>
                <td class="p-3">${u.active ? "Yes" : "No"}</td>

                <td class="p-3 space-x-2 export-skip">
                  <button data-edit-user="${u.id}" class="text-blue-600 font-medium">Edit</button>

                  <button data-toggle-user="${u.id}" class="text-orange-600 font-medium">
                    ${u.active ? "Deactivate" : "Activate"}
                  </button>

                  <button data-delete-user="${u.id}" class="text-red-600 font-medium">Delete</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderRequestsTable(requests) {
  return `
    <div id="userExportArea" class="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
      <div class="px-5 py-4 border-b bg-gray-50">
        <h3 class="font-semibold text-gray-800">Access Requests</h3>
      </div>
    </div>
    <div class="overflow-auto">
      <table class="w-full text-sm text-gray-700">
        <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
          <tr>
            <th class="p-3 text-left">Name</th>
            <th class="p-3 text-left">Email</th>
            <th class="p-3 text-left">Status</th>
            <th class="p-3 text-left ">Date</th>
            <th class="p-3 text-left export-skip">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          ${requests.map(r => `
            <tr class="hover:bg-gray-50">
              <td class="p-3 font-medium">${escapeHtml(r.name || "-")}</td>
              <td class="p-3">${escapeHtml(r.email || "-")}</td>
              <td class="p-3">${escapeHtml(r.status || "-")}</td>
              <td class="p-3">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"}</td>

              <td class="p-3 space-x-2 export-skip">
                <button data-approve-request="${r.id}" class="text-green-600 font-medium">Approve</button>
                <button data-reject-request="${r.id}" class="text-red-600 font-medium">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    </div>
  `;
}

function renderModal(roles) {
  return `
    <div id="userModal" class="hidden fixed inset-0 bg-black/40 z-50 flex items-center justify-center export-skip">
      <div class="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 id="userModalTitle" class="text-xl font-semibold">Add User</h3>
          <button id="closeUserModal" class="text-gray-500">✕</button>
        </div>

        <form id="userForm" class="space-y-4">
          <input type="hidden" name="id">

          <input name="name" placeholder="Name" class="w-full border p-3 rounded" required>

          <input name="email" type="email" placeholder="Email" class="w-full border p-3 rounded" required>

          <select name="role" class="w-full border p-3 rounded" required>
            <option value="">Select Role</option>
            ${roles.map(r => `
              <option value="${r.id}">${r.label || r.id}</option>
            `).join("")}
          </select>

          <input name="areas" placeholder="Areas, separated by commas" class="w-full border p-3 rounded">

          <label class="flex items-center gap-2">
            <input type="checkbox" name="active" checked>
            Active
          </label>

          <button class="bg-amber-600 text-white w-full py-3 rounded">
            Save User
          </button>
        </form>
      </div>
    </div>
  `;
}

function renderRoleModal() {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "kvitlech", label: "Kvitlech" },
    { id: "pushka", label: "Pushka" },
    { id: "donations", label: "Donations" },
    { id: "banking", label: "Banking" },
    { id: "settings", label: "Site Settings" },
    { id: "users", label: "Users" }
  ];

  return `
    <div id="roleModal" class="hidden fixed inset-0 bg-black/40 z-50 flex items-center justify-center export-skip">
      <div class="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">

        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold">Add Role</h3>
          <button id="closeRoleModal" class="text-gray-500">✕</button>
        </div>

        <form id="roleForm" class="space-y-4">
          <input name="id" placeholder="Role ID, example: manager"
            class="w-full border p-3 rounded" required>

          <input name="label" placeholder="Role Label, example: Manager"
            class="w-full border p-3 rounded" required>

          <div class="border rounded p-3 space-y-2">
            <p class="font-semibold mb-2">Allowed Tabs</p>

            <label class="flex items-center gap-2">
              <input type="checkbox" name="allowedTabs" value="all">
              Full Access
            </label>

            ${tabs.map(tab => `
              <label class="flex items-center gap-2">
                <input type="checkbox" name="allowedTabs" value="${tab.id}">
                ${tab.label}
              </label>
            `).join("")}
          </div>

          <button class="bg-amber-600 text-white w-full py-3 rounded">
            Save Role
          </button>
        </form>

      </div>
    </div>
  `;
}

    function attachUserEvents(setContent) {
    const container = document.getElementById("moduleContent");

    container.querySelectorAll("[data-role-filter]").forEach(btn => {
        btn.addEventListener("click", async () => {
        activeRoleFilter = btn.dataset.roleFilter;
        await renderUsers({ setContent });
        });
    });
    container.querySelectorAll("[data-approve-request]").forEach(btn => {
        btn.addEventListener("click", async () => {
        const id = btn.dataset.approveRequest;
        const request = getData("accessRequests").find(r => r.id === id);
        openUserModal({
            name: request.name || "",
            email: request.email || "",
            role: "",
            areas: [],
            active: true,
            fromRequestId: id
        });
    });
    });

    container.querySelectorAll("[data-delete-request]").forEach(btn => {
        btn.addEventListener("click", async () => {
        const id = btn.dataset.deleteRequest;
        if (!confirm("Delete this access request?")) return;

        await deleteItem("accessRequests", id);
        clearData("accessRequests");
        await renderUsers({ setContent });
        });
    });
    document.getElementById("addUserBtn")?.addEventListener("click", () => {
        openUserModal();
    });

    document.getElementById("closeUserModal")?.addEventListener("click", closeUserModal);

    document.getElementById("userModal")?.addEventListener("click", e => {
        if (e.target.id === "userModal") closeUserModal();
    });

    container.querySelectorAll("[data-edit-user]").forEach(btn => {
        btn.addEventListener("click", () => {
        const id = btn.dataset.editUser;
        const user = getData("users").find(u => u.id === id);
        openUserModal(user);
        });
    });

    container.querySelectorAll("[data-toggle-user]").forEach(btn => {
        btn.addEventListener("click", async () => {
        const id = btn.dataset.toggleUser;
        const user = getData("users").find(u => u.id === id);

        await setItem("roles", id, {
            label,
            allowedTabs
        });

        clearData("users");
        await renderUsers({ setContent });
        });
    });

    container.querySelectorAll("[data-delete-user]").forEach(btn => {
        btn.addEventListener("click", async () => {
        const id = btn.dataset.deleteUser;

        if (!confirm("Delete this user?")) return;

        await deleteItem("users", id);

        clearData("users");
        await renderUsers({ setContent });
        });
    });

    document.getElementById("userForm")?.addEventListener("submit", async e => {
      e.preventDefault();

      const form = e.currentTarget;
      const data = Object.fromEntries(new FormData(form));

      const payload = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role,
        areas: data.areas
          ? data.areas.split(",").map(a => a.trim()).filter(Boolean)
          : [],
        active: form.active.checked
      };

      if (data.id) {
        await updateItem("users", data.id, payload);
      } else {
        await addItem("users", {
          ...payload,
          uid: null
        });

        // 👇 THIS IS THE PART
        const fromRequestId = form.dataset.fromRequestId;

        if (fromRequestId) {
          await deleteItem("accessRequests", fromRequestId);
          clearData("accessRequests");
        }
      }

      closeUserModal();

      clearData("users");

      await renderUsers({ setContent });
    });

    document.getElementById("closeRoleModal")?.addEventListener("click", closeRoleModal);

    document.getElementById("roleModal")?.addEventListener("click", e => {
    if (e.target.id === "roleModal") closeRoleModal();
    });

    document.getElementById("roleForm")?.addEventListener("submit", async e => {
    e.preventDefault();

    const form = e.currentTarget;
    const data = new FormData(form);

    const id = data.get("id").trim().toLowerCase();
    const label = data.get("label").trim();
    const allowedTabs = data.getAll("allowedTabs");

    if (!allowedTabs.length) {
        alert("Please select at least one tab");
        return;
    }

    await setItem("roles", id, {
        label,
        allowedTabs
    });

    closeRoleModal();

    clearData("roles");

    await renderUsers({ setContent });
    });
}

function openUserModal(user = null) {
  const modal = document.getElementById("userModal");
  const form = document.getElementById("userForm");
  const title = document.getElementById("userModalTitle");

  if (!modal || !form) return;

  form.reset();

  if (user) {
    title.innerText = user.fromRequestId ? "Approve Access Request" : "Edit User";

    form.id.value = user.fromRequestId ? "" : (user.id || "");
    form.name.value = user.name || "";
    form.email.value = user.email || "";
    form.role.value = user.role || "";
    form.areas.value = (user.areas || []).join(", ");
    form.active.checked = user.active !== false;
    form.dataset.fromRequestId = user.fromRequestId || "";
  } else {
    title.innerText = "Add User";
    form.id.value = "";
    form.active.checked = true;
    form.dataset.fromRequestId = "";
  }

  modal.classList.remove("hidden");
}

function closeUserModal() {
  document.getElementById("userModal")?.classList.add("hidden");
}

function openRoleModal() {
  const modal = document.getElementById("roleModal");
  const form = document.getElementById("roleForm");

  if (!modal || !form) return;

  form.reset();
  modal.classList.remove("hidden");
}

function closeRoleModal() {
  document.getElementById("roleModal")?.classList.add("hidden");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}