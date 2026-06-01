export function showActionButton(id, handler) {
  const btn = document.getElementById(id);
  if (!btn) return;

  btn.classList.remove("hidden");
  btn.onclick = handler;
}

export function hideActionButton(id) {
  const btn = document.getElementById(id);
  if (!btn) return;

  btn.classList.add("hidden");
  btn.onclick = null;
}

export function clearGlobalActions() {
  hideActionButton("addUserGlobalBtn");
  hideActionButton("addRoleGlobalBtn");
}