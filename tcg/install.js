// Install PWA
let installPrompt = null;
const installLink = document.getElementById("install");
window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
window.addEventListener("appinstalled", handleAppInstalled);
installLink.addEventListener("click", handleInstallClick);

function disableInAppInstallPrompt() {
  installPrompt = null;
  installLink.setAttribute("hidden", "");
}

function handleBeforeInstallPrompt(event) {
  event.prompt();
  installPrompt = event;
  installLink.removeAttribute("hidden");
}

function handleAppInstalled() {
  disableInAppInstallPrompt();
}

async function handleInstallClick() {
  if (!installPrompt) {
    return;
  }
  const result = await installPrompt.prompt();
  console.log(`Install prompt was: ${result.outcome}`);
  disableInAppInstallPrompt();
}
