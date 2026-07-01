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
  avatar: document.querySelector("#profile-avatar"),
  name: document.querySelector("#profile-name"),
  username: document.querySelector("#profile-username"),
  bio: document.querySelector("#profile-bio"),
  location: document.querySelector("#profile-location"),
  company: document.querySelector("#profile-company"),
  blog: document.querySelector("#profile-blog"),
  hireable: document.querySelector("#profile-hireable"),
  createdAt: document.querySelector("#profile-created"),
  followers: document.querySelector("#profile-followers"),
  following: document.querySelector("#profile-following"),
  repositories: document.querySelector("#profile-repos"),
  gists: document.querySelector("#profile-gists"),
  profileLink: document.querySelector("#profile-link"),
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

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}

function getWebsiteUrl(website) {
  if (!website) {
    return null;
  }

  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function renderWebsite(website) {
  const websiteUrl = getWebsiteUrl(website);

  if (!websiteUrl) {
    elements.blog.textContent = "Not provided";
    return;
  }

  const link = document.createElement("a");
  link.href = websiteUrl;
  link.textContent = website;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  elements.blog.replaceChildren(link);
}

function renderProfile(profile) {
  elements.avatar.src = profile.avatar_url;
  elements.avatar.alt = `${profile.login}'s GitHub avatar`;
  elements.name.textContent = profile.name || profile.login;
  elements.username.textContent = `@${profile.login}`;
  elements.bio.textContent = profile.bio || "No bio provided.";
  elements.location.textContent = profile.location || "Not provided";
  elements.company.textContent = profile.company || "Not provided";
  elements.hireable.textContent =
    profile.hireable === null
      ? "Not specified"
      : profile.hireable
        ? "Available for hire"
        : "Not available";
  elements.createdAt.textContent = formatDate(profile.created_at);
  elements.followers.textContent = profile.followers.toLocaleString();
  elements.following.textContent = profile.following.toLocaleString();
  elements.repositories.textContent = profile.public_repos.toLocaleString();
  elements.gists.textContent = profile.public_gists.toLocaleString();
  elements.profileLink.href = profile.html_url;

  renderWebsite(profile.blog);
  setPanelState("profile");
}

async function fetchProfile(username) {
  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub API request failed with status ${response.status}.`);
  }

  return response.json();
}

function showTemporaryError() {
  elements.placeholderTitle.textContent = "Unable to load this profile";
  elements.placeholderMessage.textContent =
    "Detailed error feedback will be added in the next development step.";
  setPanelState("placeholder");
}

async function handleSubmit(event) {
  event.preventDefault();

  const username = elements.usernameInput.value.trim();

  if (!username) {
    showFormMessage("Please enter a GitHub username.");
    elements.usernameInput.focus();
    return;
  }

  clearFormMessage();

  try {
    const profile = await fetchProfile(username);
    renderProfile(profile);
  } catch (error) {
    console.error(error);
    showTemporaryError();
  }
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
