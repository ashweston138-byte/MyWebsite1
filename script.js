const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");
const yearNode = document.querySelector("#year");
const communityStatus = document.querySelector("#community-status");
const giscusContainer = document.querySelector(".giscus");
const musicToggle = document.querySelector("#music-toggle");
const musicStatus = document.querySelector("#music-status");

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

if (musicToggle && musicStatus) {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextConstructor) {
    musicToggle.disabled = true;
    musicStatus.textContent = "Background music is not supported by this browser.";
  } else {
    const melody = [
      ["B4", 1], ["E5", 1], ["G5", 0.75], ["A5", 0.75], ["B5", 1],
      ["C6", 0.75], ["B5", 0.75], ["A5", 1], ["F#5", 1], ["D5", 1],
      ["B4", 1.5], ["E5", 1], ["G5", 0.75], ["A5", 0.75], ["B5", 1],
      ["A5", 0.75], ["G5", 0.75], ["F#5", 1], ["E5", 1], ["F#5", 0.75],
      ["G5", 0.75], ["F#5", 1], ["E5", 1], ["D5", 1], ["B4", 1.5],
      ["A4", 1], ["C5", 1], ["D5", 0.75], ["E5", 0.75], ["F#5", 1],
      ["G5", 0.75], ["E5", 0.75], ["D5", 1], ["B4", 1], ["A4", 1],
      ["F#4", 1], ["D5", 1], ["B4", 1], ["E5", 1.5],
    ];
    const noteOffsets = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    let audioContext;
    let masterGain;
    let musicTimer;
    let noteIndex = 0;
    let isPlaying = false;

    const noteFrequency = (note) => {
      const [, letter, accidental = "", octave] = /^([A-G])(#?)(\d)$/.exec(note);
      const midiNote = (Number(octave) + 1) * 12 + noteOffsets[letter] + (accidental ? 1 : 0);
      return 440 * 2 ** ((midiNote - 69) / 12);
    };

    const playPluckedNote = (frequency, duration, volume) => {
      const startTime = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0.0001, startTime);
      envelope.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(0.12, duration * 0.8));
      oscillator.connect(envelope);
      envelope.connect(masterGain);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const playNextNote = () => {
      if (!isPlaying) return;

      const [note, beats] = melody[noteIndex];
      const duration = beats * 0.48;
      const frequency = noteFrequency(note);
      playPluckedNote(frequency, duration, 0.12);

      if (noteIndex % 4 === 0) {
        playPluckedNote(frequency / 2, duration * 1.35, 0.035);
      }

      noteIndex = (noteIndex + 1) % melody.length;
      musicTimer = window.setTimeout(playNextNote, duration * 1000);
    };

    musicToggle.addEventListener("click", async () => {
      if (isPlaying) {
        isPlaying = false;
        window.clearTimeout(musicTimer);
        masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.04);
        musicToggle.textContent = "♫ Play Greensleeves";
        musicToggle.setAttribute("aria-pressed", "false");
        musicStatus.textContent = "Greensleeves is paused.";
        return;
      }

      try {
        if (!audioContext) {
          audioContext = new AudioContextConstructor();
          masterGain = audioContext.createGain();
          masterGain.gain.value = 0.0001;
          masterGain.connect(audioContext.destination);
        }

        await audioContext.resume();
        masterGain.gain.setTargetAtTime(0.22, audioContext.currentTime, 0.04);
        isPlaying = true;
        playNextNote();
        musicToggle.textContent = "Pause Greensleeves";
        musicToggle.setAttribute("aria-pressed", "true");
        musicStatus.textContent = "Greensleeves is playing; press pause to stop.";
      } catch (error) {
        console.error("Could not start Greensleeves playback:", error);
        musicStatus.textContent = "Music could not start. Please try again.";
      }
    });
  }
}

if (communityStatus && giscusContainer) {
  const repository = "ashweston138-byte/MyWebsite1";
  const discussionUrl = `https://github.com/${repository}/discussions`;

  const showCommunitySetupMessage = (
    message,
    linkUrl = discussionUrl,
    linkLabel = "Visit GitHub Discussions"
  ) => {
    communityStatus.replaceChildren(document.createTextNode(`${message} `));
    const link = document.createElement("a");
    link.href = linkUrl;
    link.textContent = linkLabel;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    communityStatus.append(link);
  };

  fetch(`https://api.github.com/repos/${repository}/discussions/categories`, {
    headers: { Accept: "application/vnd.github+json" },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`GitHub Discussions returned ${response.status}`);
      }
      return response.json();
    })
    .then((categories) => {
      const generalCategory = categories.find(
        (category) => category.slug.toLowerCase() === "general"
      );

      if (!generalCategory) {
        showCommunitySetupMessage(
          "The community board needs a GitHub Discussions category named General.",
          `https://github.com/${repository}/settings`,
          "Open repository settings"
        );
        return;
      }

      const giscusScript = document.createElement("script");
      giscusScript.src = "https://giscus.app/client.js";
      giscusScript.async = true;
      giscusScript.crossOrigin = "anonymous";
      giscusScript.dataset.repo = repository;
      giscusScript.dataset.repoId = "R_kgDOVweGxA";
      giscusScript.dataset.category = generalCategory.name;
      giscusScript.dataset.categoryId = generalCategory.node_id;
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
          "The embedded discussion could not load. The discussion board is available directly on GitHub."
        );
      });
      giscusContainer.append(giscusScript);
    })
    .catch((error) => {
      console.error("Could not load the community discussion:", error);
      showCommunitySetupMessage(
        "GitHub Discussions is not available yet. Enable it for the repository to start the community board.",
        `https://github.com/${repository}/settings`,
        "Open repository settings"
      );
    });
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