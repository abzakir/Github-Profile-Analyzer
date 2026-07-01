const elements = {
  form: document.querySelector("#search-form"),
  usernameInput: document.querySelector("#username"),
  searchButton: document.querySelector("#search-button"),
  formMessage: document.querySelector("#form-message"),
  statusPanel: document.querySelector("#status-panel"),
  placeholder: document.querySelector("#placeholder"),
  placeholderTitle: document.querySelector("#placeholder-title"),
  placeholderMessage: document.querySelector("#placeholder-message"),
  loadingState: document.querySelector("#loading-state"),
  errorState: document.querySelector("#error-state"),
  errorMessage: document.querySelector("#error-message"),
  profileCard: document.querySelector("#profile-card"),
};

const panelStates = {
  placeholder: elements.placeholder,
  loading: elements.loadingState,
  error: elements.errorState,
};

function setPanelState(activeState) {
  Object.entries(panelStates).forEach(([state, element]) => {
    element.hidden = state !== activeState;
  });

  elements.statusPanel.hidden = activeState === "profile";
  elements.profileCard.hidden = activeState !== "profile";
}

function showFormMessage(message) {
  elements.formMessage.textContent = message;
  elements.formMessage.hidden = false;
  elements.usernameInput.setAttribute("aria-invalid", "true");
}

function clearFormMessage() {
  elements.formMessage.textContent = "";
  elements.formMessage.hidden = true;
  elements.usernameInput.removeAttribute("aria-invalid");
}

function showSearchReadyState(username) {
  elements.placeholderTitle.textContent = `Ready to analyze @${username}`;
  elements.placeholderMessage.textContent =
    "The profile request will be connected in the next development step.";
  setPanelState("placeholder");
}

function handleSubmit(event) {
  event.preventDefault();

  const username = elements.usernameInput.value.trim();

  if (!username) {
    showFormMessage("Please enter a GitHub username.");
    elements.usernameInput.focus();
    return;
  }

  clearFormMessage();
  showSearchReadyState(username);
}

function handleInput() {
  if (elements.usernameInput.value.trim()) {
    clearFormMessage();
  }
}

function initializeApp() {
  setPanelState("placeholder");
  elements.form.addEventListener("submit", handleSubmit);
  elements.usernameInput.addEventListener("input", handleInput);
}

initializeApp();
