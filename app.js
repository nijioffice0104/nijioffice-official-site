const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const items = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = Number(entry.target.dataset.delay || 0);
      window.setTimeout(() => entry.target.classList.add("is-visible"), delay);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  items.forEach((item) => observer.observe(item));
} else {
  items.forEach((item) => item.classList.add("is-visible"));
}

const reels = document.querySelectorAll(".autoplay-reel");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll(".hero-art-video").forEach((video) => {
  const button = video.closest(".hero-art-frame")?.querySelector(".hero-sound-toggle");
  if (!button) return;

  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");

  const setHeroSoundState = (enabled) => {
    button.classList.toggle("is-on", enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", enabled ? "ヘッダー動画の音声をオフにする" : "ヘッダー動画の音声をオンにする");
    const label = button.querySelector("b");
    if (label) label.textContent = enabled ? "音OFF" : "音ありで見る";
  };

  button.addEventListener("click", () => {
    const enabled = video.muted;
    video.muted = !enabled;
    video.defaultMuted = !enabled;
    if (enabled) {
      video.removeAttribute("muted");
      video.volume = 1;
      video.play().catch(() => {});
    } else {
      video.setAttribute("muted", "");
    }
    setHeroSoundState(enabled);
  });
});

document.querySelectorAll(".sound-reel").forEach((video) => {
  const phone = video.closest(".sound-phone");
  const toggleSoundVideo = () => {
    if (video.paused) {
      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  phone?.addEventListener("click", toggleSoundVideo);
  phone?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleSoundVideo();
  });
  video.addEventListener("play", () => {
    phone?.classList.add("is-playing");
    phone?.classList.remove("is-paused");
  });
  video.addEventListener("pause", () => {
    phone?.classList.remove("is-playing");
    if (video.currentTime > 0) phone?.classList.add("is-paused");
  });
});

if (!reduceMotion && "IntersectionObserver" in window) {
  const setPlaybackState = (video, playing, needsTap = false) => {
    const phone = video.closest(".reel-phone");
    const label = phone?.querySelector(".playing-label");
    phone?.classList.toggle("is-playing", playing);
    phone?.classList.toggle("needs-tap", needsTap);
    if (label && !playing) label.textContent = needsTap ? "TAP TO PLAY" : "SCROLL TO PLAY";
  };

  const playReel = (video) => {
    if (video.dataset.inView !== "true") return;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const startPlayback = () => {
      if (video.dataset.inView !== "true") return;
      video.play()
        .then(() => setPlaybackState(video, true))
        .catch(() => setPlaybackState(video, false, true));
    };

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      video.addEventListener("canplay", startPlayback, { once: true });
      video.load();
      return;
    }

    startPlayback();
  };

  const preloadObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.load();
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "320px 0px", threshold: 0 });

  const reelObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.dataset.inView = "true";
        playReel(video);
      } else {
        video.dataset.inView = "false";
        video.pause();
        video.currentTime = 0;
        setPlaybackState(video, false);
      }
    });
  }, { threshold: 0.25 });

  reels.forEach((video) => {
    video.addEventListener("loadeddata", () => playReel(video));
    video.closest(".reel-phone")?.addEventListener("click", () => {
      video.dataset.inView = "true";
      if (video.paused) playReel(video);
      else video.pause();
    });
    preloadObserver.observe(video);
    reelObserver.observe(video);
  });
}

