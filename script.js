(function () {
  const config = window.PAGE_CONFIG || {};
  const checkoutUrl = config.checkoutUrl || "#oferta";
  const youtubeVideoId = config.vslYoutubeId || "";

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

  const videoPlayer = document.querySelector(".video-player");
  const videoStart = document.querySelector(".js-video-start");
  const videoSound = document.querySelector(".js-video-sound");
  const progressBar = document.querySelector(".js-vsl-progress");
  const unlockAt = 60;
  const fastProgressUntil = 15;
  const unlockStorageKey = "manualAppearanceVslUnlocked";
  const fallbackDuration = 123;
  let youtubePlayer = null;
  let playerReady = false;
  let playbackStarted = false;
  let progressTimer = null;

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

  const updateProgress = (currentTime = 0, playerDuration = fallbackDuration) => {
    if (!progressBar) return;

    const safeCurrentTime = Math.max(0, currentTime || 0);
    const duration = Number.isFinite(playerDuration) && playerDuration > fastProgressUntil
      ? playerDuration
      : fallbackDuration;
    let progress;

    if (safeCurrentTime <= fastProgressUntil) {
      progress = (safeCurrentTime / fastProgressUntil) * 0.5;
    } else {
      progress = 0.5 + ((safeCurrentTime - fastProgressUntil) / (duration - fastProgressUntil)) * 0.5;
    }

    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;

    if (safeCurrentTime >= unlockAt) unlockPage();
  };

  const readPlayerTime = () => {
    if (!playerReady || !youtubePlayer) return;

    try {
      const currentTime = youtubePlayer.getCurrentTime() || 0;
      const duration = youtubePlayer.getDuration() || fallbackDuration;
      updateProgress(currentTime, duration);
    } catch (error) {
      // The YouTube iframe can be unavailable for a brief moment while it reconnects.
    }
  };

  const startProgressMonitor = () => {
    if (progressTimer) return;
    progressTimer = window.setInterval(readPlayerTime, 250);
  };

  const markPlayerError = () => {
    playerReady = false;
    playbackStarted = false;
    videoPlayer?.classList.remove("has-video", "is-started", "is-audible");
    videoPlayer?.classList.add("has-error");
    if (progressTimer) {
      window.clearInterval(progressTimer);
      progressTimer = null;
    }
  };

  const playYoutubeVideo = (withSound = false) => {
    if (!playerReady || !youtubePlayer) return;

    try {
      if (withSound) {
        youtubePlayer.unMute();
        youtubePlayer.setVolume(100);
      } else {
        youtubePlayer.mute();
      }
      youtubePlayer.playVideo();
      playbackStarted = true;
      videoPlayer?.classList.add("has-video", "is-started");
      videoPlayer?.classList.toggle("is-audible", withSound);
      startProgressMonitor();
    } catch (error) {
      markPlayerError();
    }
  };

  const loadYouTubeApi = () => new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const previousReadyHandler = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => reject(new Error("YouTube API timeout")), 12000);

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      if (typeof previousReadyHandler === "function") previousReadyHandler();
      resolve(window.YT);
    };

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("YouTube API failed to load"));
    };
    document.head.appendChild(script);
  });

  if (youtubeVideoId && document.getElementById("youtube-vsl-player")) {
    loadYouTubeApi()
      .then((YT) => {
        youtubePlayer = new YT.Player("youtube-vsl-player", {
          host: "https://www.youtube-nocookie.com",
          videoId: youtubeVideoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            mute: 1,
            start: 0,
            origin: location.origin
          },
          events: {
            onReady: (event) => {
              playerReady = true;
              videoPlayer?.classList.remove("has-error");
              videoPlayer?.classList.add("has-video");

              const iframe = event.target.getIframe();
              iframe.setAttribute("title", "Apresentação do Manual da Aparência");
              iframe.setAttribute("tabindex", "-1");
              iframe.setAttribute("aria-hidden", "true");

              event.target.seekTo(0, true);
              playYoutubeVideo(false);
            },
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.PLAYING) {
                playbackStarted = true;
                videoPlayer?.classList.add("has-video", "is-started");
                startProgressMonitor();
                return;
              }

              if (event.data === YT.PlayerState.PAUSED && playbackStarted && document.visibilityState === "visible") {
                window.setTimeout(() => youtubePlayer?.playVideo(), 120);
              }

              if (event.data === YT.PlayerState.ENDED) {
                readPlayerTime();
                playbackStarted = false;
                if (progressTimer) {
                  window.clearInterval(progressTimer);
                  progressTimer = null;
                }
              }
            },
            onError: markPlayerError
          }
        });
      })
      .catch(markPlayerError);
  }

  videoStart?.addEventListener("click", () => {
    if (!playerReady) {
      location.reload();
      return;
    }
    playYoutubeVideo(true);
  });

  videoSound?.addEventListener("click", () => playYoutubeVideo(true));

  document.addEventListener("visibilitychange", () => {
    if (!playerReady || !youtubePlayer) return;

    if (document.visibilityState === "hidden") {
      youtubePlayer.pauseVideo();
    } else if (playbackStarted) {
      youtubePlayer.playVideo();
    }
  });

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
