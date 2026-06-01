import { renderPushka } from "./modules/pushka.js";
import { renderKvitlech } from "./modules/kvitlech.js";
import { renderUsers } from "./modules/users.js";
import { renderSettings } from "./modules/settings.js";
import { clearGlobalActions } from "./utils/actionButtons.js";
import { clearData } from "./stats.js";
import { clearExportButtons } from "./utils/exportUtils.js";
import { signIn, signOut, initAuth } from "./services/loginService.js";
import { firebaseConfig } from "./firebase.js";
import { getByField, getItem } from "./services/dbService.js";
const buttons = document.querySelectorAll(".nav-btn");
const pageTitle = document.getElementById("pageTitle");
const contentEl = document.getElementById("moduleContent");
const refreshBtn = document.getElementById("globalRefreshBtn");

let currentUser = null;
let currentRole = null;

const menuItems = [
  { label: "Dashboard", page: "dashboard" },
  { label: "Pushka", page: "pushka" },
  { label: "Kvitlech", page: "kvitlech" },
  { label: "Gabai", page: "gabai" },
  { label: "donations", page: "donations" },
  { label: "Site Settings", page: "settings" },
  { label: "banking", page: "banking" },
  { label: "Users", page: "users" }
];


clearExportButtons()
document.addEventListener("DOMContentLoaded", () => {
  initAuth(async (authData) => {
    if (authData?.needsAccess) {
      renderSidebar([]);

      setContent(`
        <div class="bg-white rounded-2xl shadow border border-gray-200 p-8 max-w-xl">
          <h2 class="text-2xl font-bold mb-2">Request Admin Access</h2>
          <p class="text-gray-600 mb-6">
            Your email is not registered for this dashboard.
          </p>

          <button id="requestAccessBtn"
            class="bg-amber-600 text-white px-5 py-3 rounded">
            Request Access
          </button>
        </div>
      `);

      document.getElementById("requestAccessBtn")?.addEventListener("click", async () => {
        await authData.requestAccess();

        setContent(`
          <div class="bg-white rounded-2xl shadow border border-gray-200 p-8 max-w-xl">
            <h2 class="text-2xl font-bold mb-2">Request Sent</h2>
            <p class="text-gray-600">
              Your access request was submitted and is waiting for approval.
            </p>
          </div>
        `);
      });

      return;
    }
    if (!authData) {
      currentUser = null;
      currentRole = null;
      renderSidebar([]);
      setContent(`<div class="text-gray-500">Please log in.</div>`);
      return;
    }

    currentUser = authData.appUser;

    currentRole = await getItem("roles", currentUser.role);

    renderSidebar(getAllowedMenuItems(currentRole));

    const firstPage = getAllowedMenuItems(currentRole)[0]?.page || "dashboard";
    await loadModule(firstPage);
  });
});

const sidebarNav = document.getElementById("sidebarNav");

function getAllowedMenuItems(role) {
  if (!role) return [];

  const allowedTabs = role.allowedTabs || [];

  if (allowedTabs.includes("all")) {
    return menuItems;
  }

  return menuItems.filter(item => allowedTabs.includes(item.page));
}

function renderSidebar(items) {
  sidebarNav.innerHTML = items.map(item => `
    <button data-page="${item.page}" class="nav-btn">
      ${item.label}
    </button>
  `).join("");

  sidebarNav.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      sidebarNav.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      pageTitle.innerText = btn.innerText;

      await loadModule(btn.dataset.page);
    });
  });
}

let currentPage = "dashboard";

buttons.forEach(btn => {
  btn.addEventListener("click", async () => {
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentPage = btn.dataset.page;
    pageTitle.innerText = btn.innerText;

    await loadModule(currentPage);
  });
});

async function loadModule(page) {
  clearGlobalActions();
  refreshBtn.classList.add("hidden");
  refreshBtn.onclick = null;

  contentEl.innerHTML = `<div class="text-gray-500">Loading...</div>`;

  if (page === "pushka") {
    refreshBtn.classList.remove("hidden");

    refreshBtn.onclick = async () => {
      clearData("pushkaTasks");
      await loadModule("pushka");
    };

    await renderPushka({ setContent });
    return;
  }

  if (page === "kvitlech"){
    
      refreshBtn.classList.remove("hidden");

      refreshBtn.onclick = async () => {
        clearData("kvitlech");
        await loadModule("kvitlech");
      };

      await renderKvitlech({ setContent });
      return;
    
  }

  if (page === "users") {
    refreshBtn.classList.remove("hidden");

    refreshBtn.onclick = async () => {
      clearData("users");
      clearData("roles");
      await loadModule("users");
    };

    await renderUsers({ setContent });
    return;
  }

  if (page === "settings") {
    await renderSettings({ setContent });
    return;
  }

  contentEl.innerHTML = `
    <div class="bg-white p-6 rounded shadow text-gray-500">
      ${page} coming soon
    </div>
  `;
}

function setContent(html) {
  contentEl.innerHTML = html;
}

/* =========================
   TEMP MODULE (example)
========================= */

function renderGabai() {
  setTitle("Gabai Requests");

  setActions([
    {
      label: "Refresh",
      action: () => renderGabai()
    }
  ]);

  setContent(`
    <div class="bg-white p-4 rounded shadow">
      <p>Gabai requests table will go here</p>
    </div>
  `);
}

// modual logic

window.signIn = signIn;
window.signOut = signOut;
