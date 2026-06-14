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
  const soundButton = document.querySelector(".js-sound-button");
  const progress = document.querySelector(".js-video-progress");

  if (video) {
    video.poster = posterUrl;
  }

  if (video && videoUrl) {
    const source = document.createElement("source");
    source.src = videoUrl;
    source.type = "video/mp4";
    video.appendChild(source);
    videoPlayer?.classList.add("has-video");
    video.load();

    video.play().catch(() => {
      soundButton?.classList.remove("is-hidden");
    });

    soundButton?.addEventListener("click", () => {
      video.muted = false;
      video.volume = 1;
      video.play().then(() => {
        soundButton.classList.add("is-hidden");
      }).catch(() => {});
    });

    video.addEventListener("timeupdate", () => {
      if (!progress || !video.duration) return;
      const percent = Math.max(0, Math.min(video.currentTime / video.duration, 1));
      progress.style.transform = `scaleX(${percent})`;
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
