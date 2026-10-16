(function () {
  "use strict";

  const style = document.createElement("style");
  style.textContent = ".video-wrapper{background:#010818}.video-wrapper video{display:none!important}";
  document.head.appendChild(style);

  function startNetwork(wrapper) {
    if (wrapper.dataset.networkReady === "true") return;
    wrapper.dataset.networkReady = "true";
    wrapper.style.backgroundColor = "#010818";

    const canvas = document.createElement("canvas");
    canvas.className = "mil-network-canvas";
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      display: "block",
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    });
    wrapper.replaceChildren(canvas);

    const context = canvas.getContext("2d");
    if (!context) return;
    const section = wrapper.closest("section") || wrapper;
    const pointer = { x: 0, y: 0, active: false };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let connectionDistance = 205;
    let points = [];

    function resize() {
      const bounds = wrapper.getBoundingClientRect();
      if (bounds.width === width && bounds.height === height) return;

      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      connectionDistance = width < 700 ? 165 : 220;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.min(240, Math.max(60, Math.round(width * height / 9500)));
      points = Array.from({ length: count }, function () {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.46,
          vy: (Math.random() - 0.5) * 0.46
        };
      });
    }

    function draw() {
      resize();
      context.clearRect(0, 0, width, height);

      for (let i = 0; i < points.length; i += 1) {
        const point = points[i];

        if (!reduceMotion.matches) {
          if (pointer.active) {
            const dx = point.x - pointer.x;
            const dy = point.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 0 && distance < 145) {
              const force = (145 - distance) / 145 * 0.42;
              point.vx += dx / distance * force;
              point.vy += dy / distance * force;
            }
          }

          point.vx = Math.max(-0.9, Math.min(0.9, point.vx * 0.995));
          point.vy = Math.max(-0.9, Math.min(0.9, point.vy * 0.995));
          point.x += point.vx;
          point.y += point.vy;
          if (point.x < 0 || point.x > width) point.vx *= -1;
          if (point.y < 0 || point.y > height) point.vy *= -1;
          point.x = Math.max(0, Math.min(width, point.x));
          point.y = Math.max(0, Math.min(height, point.y));
        }

        for (let j = i + 1; j < points.length; j += 1) {
          const other = points[j];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance > connectionDistance) continue;

          const middleX = (point.x + other.x) / 2;
          const middleY = (point.y + other.y) / 2;
          const hover = pointer.active ? Math.max(0, 1 - Math.hypot(middleX - pointer.x, middleY - pointer.y) / 190) : 0;
          context.strokeStyle = "rgba(72,255,232," + ((1 - distance / connectionDistance) * (0.25 + hover * 0.7)) + ")";
          context.lineWidth = 0.7 + hover * 1.05;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }

        const glow = pointer.active ? Math.max(0, 1 - Math.hypot(point.x - pointer.x, point.y - pointer.y) / 155) : 0;
        context.beginPath();
        context.arc(point.x, point.y, 1.25 + glow * 2, 0, Math.PI * 2);
        context.fillStyle = "rgba(112,255,236," + (0.42 + glow * 0.55) + ")";
        context.fill();
      }

      if (!reduceMotion.matches && canvas.isConnected) window.requestAnimationFrame(draw);
    }

    section.addEventListener("pointermove", function (event) {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
      if (reduceMotion.matches) draw();
    }, { passive: true });
    section.addEventListener("pointerleave", function () {
      pointer.active = false;
      if (reduceMotion.matches) draw();
    }, { passive: true });

    if (typeof ResizeObserver !== "undefined") new ResizeObserver(resize).observe(wrapper);
    else window.addEventListener("resize", resize, { passive: true });
    draw();
  }

  function activateNetworks() {
    document.querySelectorAll(".video-wrapper").forEach(startNetwork);
  }

  new MutationObserver(activateNetworks).observe(document.documentElement, { childList: true, subtree: true });
  activateNetworks();
})();
