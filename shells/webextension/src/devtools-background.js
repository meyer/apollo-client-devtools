// this script is called whenever a user opens the chrome devtools
// on a page. We check to see if Apollo Client exists, and if
// it does, then we create the Apollo devtools, otherwise we poll each
// second to see if its been created
//
// XXX we should show a better loading state here instead of nothing
// much like a connector / loading page while data is loaded. Then
// after a timeout, we can show instructions / docs for setting up
// AC to work with the devtools

let panelLoaded = false;
let panelCreated = false;
let panelShown = false;
// stop after 10 seconds
let checkCount = 0;
let loadCheckInterval;

// Manage panel visibility
function onPanelShown() {
  chrome.runtime.sendMessage("apollo-panel-shown");
  panelShown = true;
  // XXX for toast notifications
  // panelLoaded && executePendingAction();
}

function onPanelHidden() {
  chrome.runtime.sendMessage("apollo-panel-hidden");
  panelShown = false;
}

function createPanel() {
  // stop trying if above 10 seconds or already made
  if (panelCreated || checkCount++ > 10) return;

  panelLoaded = false;
  panelShown = false;
  chrome.devtools.inspectedWindow.eval(
    `!!(window.__APOLLO_DEVTOOLS_GLOBAL_HOOK__.ApolloClient);`,
    function(result, isException) {
      // XXX how should we better handle this error?
      if (isException) console.warn(isException);

      // already created or no ApolloClient
      if (!result || panelCreated) return;

      // clear watcher
      if (loadCheckInterval) clearInterval(loadCheckInterval);
      panelCreated = true;
      chrome.devtools.panels.create(
        "Apollo",
        "./imgs/logo_devtools.png",
        "devtools.html",
        panel => {
          panel.onShown.addListener(onPanelShown);
          panel.onHidden.addListener(onPanelHidden);
        },
      );
    },
  );
}

// Attempt to create Apollo panel on navigations as well
chrome.devtools.network.onNavigated.addListener(createPanel);

// Attempt to create Apollo panel once per second in case
// Apollo is loaded after page load
loadCheckInterval = setInterval(createPanel, 1000);

// Start the first attempt immediately
createPanel();
