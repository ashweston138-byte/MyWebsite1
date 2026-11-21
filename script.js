const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");
const yearNode = document.querySelector("#year");
const communityStatus = document.querySelector("#community-status");
const giscusContainer = document.querySelector(".giscus");
const backgroundMusic = document.querySelector("#background-music");
const backgroundMusicStatus = document.querySelector("#background-music-status");

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

if (backgroundMusic && backgroundMusicStatus) {
  backgroundMusic.volume = 0.3;
  backgroundMusic.addEventListener("play", () => {
    backgroundMusicStatus.textContent = "Background music is playing.";
  });
  backgroundMusic.addEventListener("pause", () => {
    backgroundMusicStatus.textContent = "Background music is paused.";
  });
  backgroundMusic.addEventListener("error", () => {
    console.error("Could not load the background music.");
    backgroundMusicStatus.textContent = "The background music could not be loaded.";
  });

  backgroundMusic.play().catch((error) => {
    if (error.name === "NotAllowedError") {
      backgroundMusicStatus.textContent =
        "Your browser blocked autoplay. Press play to start the music.";
      return;
    }

    console.error("Could not start the background music:", error);
    backgroundMusicStatus.textContent = "The background music could not be started.";
  });
}

if (communityStatus && giscusContainer) {
  const repository = "ashweston138-byte/MyWebsite1";
  const discussionUrl = `https://github.com/${repository}/discussions`;

  const showCommunitySetupMessage = (message) => {
    communityStatus.replaceChildren(document.createTextNode(`${message} `));
    const link = document.createElement("a");
    link.href = discussionUrl;
    link.textContent = "Visit GitHub Discussions";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    communityStatus.append(link);
  };

  const giscusScript = document.createElement("script");
  giscusScript.src = "https://giscus.app/client.js";
  giscusScript.async = true;
  giscusScript.crossOrigin = "anonymous";
  giscusScript.dataset.repo = repository;
  giscusScript.dataset.repoId = "R_kgDOVweGxA";
  giscusScript.dataset.category = "Announcements";
  giscusScript.dataset.categoryId = "DIC_kwDOVweGxM4DLp-u";
  giscusScript.dataset.mapping = "pathname";
  giscusScript.dataset.strict = "0";
  giscusScript.dataset.reactionsEnabled = "1";
  giscusScript.dataset.emitMetadata = "0";
  giscusScript.dataset.inputPosition = "top";
  giscusScript.dataset.theme = "light";
  giscusScript.dataset.lang = "en";
  giscusScript.addEventListener("load", () => {
    communityStatus.textContent = "";
  });
  giscusScript.addEventListener("error", () => {
    showCommunitySetupMessage(
      "The embedded discussion could not load. You can still read and join the conversation on GitHub."
    );
  });
  giscusContainer.append(giscusScript);
}

if (navToggle && mainNav) {
  const closeMenu = () => {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    mainNav.classList.remove("is-open");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";

    navToggle.setAttribute("aria-expanded", String(!isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
    mainNav.classList.toggle("is-open", !isOpen);
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      navToggle.getAttribute("aria-expanded") === "true" &&
      !mainNav.contains(event.target) &&
      !navToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });
}

const projectDialog = document.querySelector("#project-dialog");

if (projectDialog) {
  const projectDialogImage = projectDialog.querySelector("#project-dialog-image");
  const projectDialogTag = projectDialog.querySelector("#project-dialog-tag");
  const projectDialogTitle = projectDialog.querySelector("#project-dialog-title");
  const projectDialogDescription = projectDialog.querySelector("#project-dialog-description");
  const projectDialogClose = projectDialog.querySelector("#project-dialog-close");

  document.querySelectorAll(".project-card").forEach((card) => {
    const trigger = card.querySelector(".project-card-trigger");

    trigger.addEventListener("click", () => {
      const image = card.querySelector(".project-image");
      const tag = card.querySelector(".project-tag");
      const title = card.querySelector("h3");
      const description = card.querySelector("p");

      projectDialogImage.src = image.currentSrc || image.src;
      projectDialogImage.alt = image.alt;
      projectDialogTag.textContent = tag.textContent;
      projectDialogTitle.textContent = title.textContent;
      projectDialogDescription.textContent = description.textContent;
      projectDialog.showModal();
    });
  });

  projectDialogClose.addEventListener("click", () => {
    projectDialog.close();
  });

  projectDialog.addEventListener("click", (event) => {
    if (event.target === projectDialog) {
      projectDialog.close();
    }
  });
}

const revealItems = document.querySelectorAll(
  ".hero-copy, .hero-visual, .split-layout > *, .section-heading, .project-card, blockquote, .community-panel"
);

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("has-reveal");

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => {
    item.classList.add("reveal");
    revealObserver.observe(item);
  });
}