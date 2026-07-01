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
  analyzerCard: document.querySelector("#analyzer-card"),
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

let isLoading = false;
const statAnimationFrames = new WeakMap();
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const supportsPointerEffects = window.matchMedia(
  "(hover: hover) and (pointer: fine)",
);

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

function setLoading(loading) {
  isLoading = loading;
  elements.searchButton.disabled = loading;
  elements.searchButton.textContent = loading ? "Searching…" : "Analyze profile";
  elements.statusPanel.setAttribute("aria-busy", String(loading));

  if (loading) {
    setPanelState("loading");
  }
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

function animateNumber(element, value) {
  const activeFrame = statAnimationFrames.get(element);

  if (activeFrame) {
    cancelAnimationFrame(activeFrame);
  }

  if (prefersReducedMotion.matches) {
    element.textContent = value.toLocaleString();
    return;
  }

  const duration = 700;
  const startTime = performance.now();

  function updateNumber(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const easedProgress = 1 - (1 - progress) ** 3;
    const currentValue = Math.round(value * easedProgress);

    element.textContent = currentValue.toLocaleString();

    if (progress === 1) {
      statAnimationFrames.delete(element);
      return;
    }

    const frame = requestAnimationFrame(updateNumber);
    statAnimationFrames.set(element, frame);
  }

  const frame = requestAnimationFrame(updateNumber);
  statAnimationFrames.set(element, frame);
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
  elements.profileLink.href = profile.html_url;

  renderWebsite(profile.blog);
  setPanelState("profile");
  animateNumber(elements.followers, profile.followers);
  animateNumber(elements.following, profile.following);
  animateNumber(elements.repositories, profile.public_repos);
  animateNumber(elements.gists, profile.public_gists);
}

function getRequestError(status) {
  if (status === 404) {
    return new Error(
      "We couldn't find that GitHub user. Check the username and try again.",
    );
  }

  if (status === 403 || status === 429) {
    return new Error(
      "GitHub's request limit has been reached. Please wait a little and try again.",
    );
  }

  if (status >= 500) {
    return new Error(
      "GitHub is having trouble responding right now. Please try again shortly.",
    );
  }

  return new Error("We couldn't load this profile. Please try again.");
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
    throw getRequestError(response.status);
  }

  return response.json();
}

function showError(error) {
  const isNetworkError = error instanceof TypeError;

  elements.errorMessage.textContent = isNetworkError
    ? "A network error interrupted the request. Check your connection and try again."
    : error.message;
  setPanelState("error");
}

async function handleSubmit(event) {
  event.preventDefault();

  if (isLoading) {
    return;
  }

  const username = elements.usernameInput.value.trim();

  if (!username) {
    showFormMessage("Please enter a GitHub username.");
    elements.usernameInput.focus();
    return;
  }

  clearFormMessage();
  setLoading(true);

  try {
    const profile = await fetchProfile(username);
    renderProfile(profile);
  } catch (error) {
    console.error(error);
    showError(error);
  } finally {
    setLoading(false);
  }
}

function handleInput() {
  if (elements.usernameInput.value.trim()) {
    clearFormMessage();
  }
}

function handleCardPointerMove(event) {
  const bounds = elements.analyzerCard.getBoundingClientRect();
  const horizontalPosition = (event.clientX - bounds.left) / bounds.width;
  const verticalPosition = (event.clientY - bounds.top) / bounds.height;
  const rotateX = (0.5 - verticalPosition) * 4;
  const rotateY = (horizontalPosition - 0.5) * 5;

  elements.analyzerCard.style.setProperty(
    "--pointer-x",
    `${horizontalPosition * 100}%`,
  );
  elements.analyzerCard.style.setProperty(
    "--pointer-y",
    `${verticalPosition * 100}%`,
  );
  elements.analyzerCard.style.setProperty("--tilt-x", `${rotateX}deg`);
  elements.analyzerCard.style.setProperty("--tilt-y", `${rotateY}deg`);
}

function resetCardEffects() {
  elements.analyzerCard.style.setProperty("--pointer-x", "50%");
  elements.analyzerCard.style.setProperty("--pointer-y", "30%");
  elements.analyzerCard.style.setProperty("--tilt-x", "0deg");
  elements.analyzerCard.style.setProperty("--tilt-y", "0deg");
}

function initializePointerEffects() {
  if (!supportsPointerEffects.matches || prefersReducedMotion.matches) {
    return;
  }

  elements.analyzerCard.addEventListener("pointermove", handleCardPointerMove);
  elements.analyzerCard.addEventListener("pointerleave", resetCardEffects);
}

function initializeApp() {
  setPanelState("placeholder");
  elements.form.addEventListener("submit", handleSubmit);
  elements.usernameInput.addEventListener("input", handleInput);
  initializePointerEffects();
}

initializeApp();
