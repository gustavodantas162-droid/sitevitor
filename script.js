(function () {
  const config = window.PAGE_CONFIG || {};
  const checkoutUrl = config.checkoutUrl || "#oferta";
  const videoUrl = config.vslVideoUrl || "";
  const posterUrl = config.vslPosterUrl || "./assets/vitor-hero.jpg";

  document.querySelectorAll(".js-checkout-link").forEach((link) => {
    link.setAttribute("href", checkoutUrl);
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      const target = hash ? document.querySelector(hash) : null;
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", hash);
    });
  });

  if (location.hash) {
    setTimeout(() => {
      document.querySelector(location.hash)?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 80);
  }

  const reveals = document.querySelectorAll(".reveal");
  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 })
    : null;

  reveals.forEach((element) => {
    if (revealObserver) {
      revealObserver.observe(element);
    } else {
      element.classList.add("is-visible");
    }
  });

  const video = document.querySelector(".js-sales-video");
  const videoPlayer = document.querySelector(".video-player");
  const videoStart = document.querySelector(".js-video-start");
  const videoSound = document.querySelector(".js-video-sound");
  const progressBar = document.querySelector(".js-vsl-progress");
  const unlockAt = 60;
  const fastProgressUntil = 15;
  const unlockStorageKey = "manualAppearanceVslUnlocked";
  let playbackStarted = false;
  let furthestTime = 0;
  let isCorrectingSeek = false;

  const unlockPage = () => {
    if (!document.body.classList.contains("vsl-locked")) return;

    document.body.classList.remove("vsl-locked");
    document.body.classList.add("vsl-unlocked");

    try {
      localStorage.setItem(unlockStorageKey, "true");
    } catch (error) {
      // Storage may be unavailable in privacy-restricted browsers.
    }
  };

  try {
    if (localStorage.getItem(unlockStorageKey) === "true") unlockPage();
  } catch (error) {
    // The first visit remains locked when storage is unavailable.
  }

  const updateProgress = () => {
    if (!video || !progressBar) return;

    const currentTime = Math.max(0, video.currentTime || 0);
    const duration = Number.isFinite(video.duration) && video.duration > fastProgressUntil
      ? video.duration
      : 122;
    let progress;

    if (currentTime <= fastProgressUntil) {
      progress = (currentTime / fastProgressUntil) * 0.5;
    } else {
      progress = 0.5 + ((currentTime - fastProgressUntil) / (duration - fastProgressUntil)) * 0.5;
    }

    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;

    if (currentTime >= unlockAt) unlockPage();
  };

  if (video) {
    video.poster = posterUrl;
  }

  if (video && videoUrl) {
    const source = document.createElement("source");
    source.src = videoUrl;
    source.type = "video/mp4";
    video.appendChild(source);
    videoPlayer?.classList.add("has-video");
    video.autoplay = true;
    video.controls = false;
    video.disablePictureInPicture = true;
    video.setAttribute("controlslist", "nodownload nofullscreen noremoteplayback");

    const startPlayback = (withSound = false) => {
      video.muted = !withSound;
      video.defaultMuted = !withSound;
      video.volume = 1;
      playbackStarted = true;
      return video.play()
        .then(() => {
          videoPlayer?.classList.add("is-started");
          videoPlayer?.classList.toggle("is-audible", !video.muted);
        })
        .catch(() => {
          playbackStarted = false;
          videoPlayer?.classList.remove("is-started");
        });
    };

    videoStart?.addEventListener("click", () => {
      startPlayback(true);
    });

    videoSound?.addEventListener("click", () => {
      video.muted = false;
      video.defaultMuted = false;
      video.volume = 1;
      videoPlayer?.classList.add("is-audible");
    });

    startPlayback(false);

    video.addEventListener("timeupdate", () => {
      if (!isCorrectingSeek) furthestTime = Math.max(furthestTime, video.currentTime);
      updateProgress();
    });

    video.addEventListener("seeking", () => {
      if (!playbackStarted || isCorrectingSeek) return;
      if (video.currentTime <= furthestTime + 0.75) return;

      isCorrectingSeek = true;
      video.currentTime = furthestTime;
      isCorrectingSeek = false;
    });

    video.addEventListener("pause", () => {
      if (!playbackStarted || video.ended || document.visibilityState !== "visible") return;
      video.play().catch(() => {});
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && playbackStarted && !video.ended) {
        video.play().catch(() => {});
      }
    });

    video.addEventListener("ended", updateProgress);

    video.addEventListener("error", () => {
      videoPlayer?.classList.remove("has-video");
    });
  }

  document.querySelectorAll("details").forEach((detail) => {
    detail.addEventListener("toggle", () => {
      if (!detail.open) return;
      document.querySelectorAll("details[open]").forEach((openDetail) => {
        if (openDetail !== detail) openDetail.open = false;
      });
    });
  });

  document.querySelectorAll(".js-optional-image").forEach((image) => {
    const hideMissingImage = () => {
      const parent = image.parentElement;
      parent?.classList.add("image-missing");
      image.remove();
    };

    image.addEventListener("error", hideMissingImage);

    if (image.complete && image.naturalWidth === 0) {
      hideMissingImage();
    }
  });
})();
