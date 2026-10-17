/* -------------------------------------------

Name: 		Ruizarch
Version:    1.0
Developer:	Nazar Miller (millerDigitalDesign)
Portfolio:  https://themeforest.net/user/millerdigitaldesign/portfolio?ref=MillerDigitalDesign

p.s. I am available for Freelance hire (UI design, web development). email: miller.themes@gmail.com

------------------------------------------- */

$(function () {

    "use strict";

    function ensurePageAwareChatbot() {
        if (document.getElementById("chatbot-container")) return;

        const hasChatbotScript = Array.from(document.scripts).some(function (script) {
            return /(?:^|\/)chatbot\.js(?:\?|$)/.test(script.src);
        });
        if (hasChatbotScript) return;

        const chatbotScript = document.createElement("script");
        chatbotScript.src = new URL("chatbot.js?v=conversational-20261017", document.baseURI).href;
        chatbotScript.dataset.pageAwareChatbot = "true";
        document.head.appendChild(chatbotScript);
    }

    ensurePageAwareChatbot();

    function addSignatureNetworkCanvases() {
        document.querySelectorAll(".mil-inner-banner:not([data-network-motif])").forEach(function (banner) {
            if (!banner.querySelector(".mil-network-canvas")) {
                const canvas = document.createElement("canvas");
                canvas.className = "mil-network-canvas";
                canvas.dataset.networkTheme = "signature-dark";
                canvas.setAttribute("aria-hidden", "true");
                banner.insertBefore(canvas, banner.firstChild);
            }
            banner.dataset.networkMotif = "true";
        });
    }

    function initInteractiveNetworks() {
        addSignatureNetworkCanvases();
        document.querySelectorAll(".mil-network-canvas:not([data-network-ready])").forEach(function (canvas) {
            const section = canvas.parentElement;
            const context = canvas.getContext("2d");
            const isLightTheme = canvas.dataset.networkTheme === "light";
            const isSignatureDark = canvas.dataset.networkTheme === "signature-dark";
            const isHomeHero = canvas.dataset.networkTheme === "home-hero";
            const isSoftNetwork = isLightTheme || isSignatureDark;

            if (!section || !context) return;

            canvas.dataset.networkReady = "true";

            const pointer = { x: 0, y: 0, active: false };
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
            const ripples = [];
            let width = 0;
            let height = 0;
            let pixelRatio = 1;
            let connectionDistance = 205;
            let points = [];
            let isInViewport = true;

            function resize() {
                const bounds = section.getBoundingClientRect();
                const nextWidth = Math.max(1, bounds.width);
                const nextHeight = Math.max(1, bounds.height);

                if (nextWidth === width && nextHeight === height) return;

                width = nextWidth;
                height = nextHeight;
                connectionDistance = isHomeHero ? (width < 700 ? 146 : 198) : width < 700 ? 180 : 245;
                pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
                canvas.width = Math.round(width * pixelRatio);
                canvas.height = Math.round(height * pixelRatio);
                context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

                const pointCount = isHomeHero
                    ? Math.min(width < 700 ? 82 : 210, Math.max(width < 700 ? 58 : 120, Math.round((width * height) / (width < 700 ? 4700 : 11500))))
                    : Math.min(isLightTheme ? 220 : 260, Math.max(width < 700 ? 68 : 72, Math.round((width * height) / (isLightTheme ? 11000 : 9000))));
                points = Array.from({ length: pointCount }, function () {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.sqrt(Math.random());
                    const mobile = width < 700;
                    const anchorX = isHomeHero
                        ? width * (mobile ? 0.62 : 0.74) + Math.cos(angle) * width * (mobile ? 0.46 : 0.32) * radius
                        : Math.random() * width;
                    const anchorY = isHomeHero
                        ? height * 0.51 + Math.sin(angle) * height * 0.55 * radius
                        : Math.random() * height;
                    const x = Math.max(0, Math.min(width, anchorX));
                    const y = Math.max(0, Math.min(height, anchorY));
                    return {
                        x: x,
                        y: y,
                        anchorX: x,
                        anchorY: y,
                        vx: (Math.random() - 0.5) * (isHomeHero ? 0.24 : 0.46),
                        vy: (Math.random() - 0.5) * (isHomeHero ? 0.24 : 0.46)
                    };
                });
            }

            function draw() {
                resize();
                context.clearRect(0, 0, width, height);
                const now = performance.now();

                if (pointer.active) {
                    const glowRadius = isHomeHero ? 270 : 190;
                    const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, glowRadius);
                    glow.addColorStop(0, isHomeHero ? "rgba(24, 221, 202, 0.20)" : isLightTheme ? "rgba(18, 145, 148, 0.045)" : isSignatureDark ? "rgba(18, 214, 195, 0.065)" : "rgba(18, 214, 195, 0.10)");
                    if (isHomeHero) glow.addColorStop(0.38, "rgba(18, 151, 165, 0.085)");
                    glow.addColorStop(1, isSoftNetwork ? "rgba(18, 145, 148, 0)" : "rgba(18, 214, 195, 0)");
                    context.fillStyle = glow;
                    context.fillRect(pointer.x - glowRadius, pointer.y - glowRadius, glowRadius * 2, glowRadius * 2);
                }

                for (let i = 0; i < points.length; i += 1) {
                    const point = points[i];

                    if (!reduceMotion.matches) {
                        if (pointer.active) {
                            const dx = point.x - pointer.x;
                            const dy = point.y - pointer.y;
                            const distance = Math.hypot(dx, dy);

                            const interactionRadius = isHomeHero ? 210 : 145;
                            if (distance > 0 && distance < interactionRadius) {
                                const force = ((interactionRadius - distance) / interactionRadius) * (isHomeHero ? 0.055 : 0.42);
                                const direction = isHomeHero ? -1 : 1;
                                point.vx += (dx / distance) * force * direction;
                                point.vy += (dy / distance) * force * direction;
                            }
                        }

                        if (isHomeHero) {
                            point.vx += (point.anchorX - point.x) * 0.00045;
                            point.vy += (point.anchorY - point.y) * 0.00045;
                        }

                        const maxVelocity = isHomeHero ? 0.5 : 0.9;
                        point.vx = Math.max(-maxVelocity, Math.min(maxVelocity, point.vx * 0.995));
                        point.vy = Math.max(-maxVelocity, Math.min(maxVelocity, point.vy * 0.995));
                        point.x += point.vx;
                        point.y += point.vy;

                        if (point.x < -10 || point.x > width + 10) point.vx *= -1;
                        if (point.y < -10 || point.y > height + 10) point.vy *= -1;
                        point.x = Math.max(0, Math.min(width, point.x));
                        point.y = Math.max(0, Math.min(height, point.y));
                    }

                    for (let j = i + 1; j < points.length; j += 1) {
                        const other = points[j];
                        const dx = point.x - other.x;
                        const dy = point.y - other.y;
                        const distance = Math.hypot(dx, dy);

                        if (distance > connectionDistance) continue;

                        let hoverStrength = 0;
                        if (pointer.active) {
                            const midpointX = (point.x + other.x) / 2;
                            const midpointY = (point.y + other.y) / 2;
                            const pointerDistance = Math.hypot(midpointX - pointer.x, midpointY - pointer.y);
                            hoverStrength = Math.max(0, 1 - pointerDistance / 190);
                        }

                        const baseOpacity = isHomeHero ? 0.18 : isLightTheme ? 0.14 : isSignatureDark ? 0.13 : 0.25;
                        const hoverOpacity = isHomeHero ? 0.78 : isLightTheme ? 0.34 : isSignatureDark ? 0.46 : 0.7;
                        const midpointX = (point.x + other.x) / 2;
                        const compositionFade = isHomeHero ? Math.max(0.12, Math.min(1, (midpointX / width - 0.12) / 0.68)) : 1;
                        const opacity = (1 - distance / connectionDistance) * (baseOpacity + hoverStrength * hoverOpacity) * compositionFade;
                        const lineColor = isHomeHero ? "70, 235, 221" : isLightTheme ? "20, 112, 119" : "72, 255, 232";
                        context.strokeStyle = "rgba(" + lineColor + ", " + opacity + ")";
                        context.lineWidth = isHomeHero ? 0.55 + hoverStrength * 1.1 : isSoftNetwork ? 0.55 + hoverStrength * 0.8 : 0.7 + hoverStrength * 1.05;
                        context.beginPath();
                        context.moveTo(point.x, point.y);
                        context.lineTo(other.x, other.y);
                        context.stroke();

                        if (isHomeHero && !reduceMotion.matches && (i * 3 + j) % 10 === 0) {
                            const signalProgress = (now * 0.0001 + i * 0.137 + j * 0.043) % 1;
                            const signalX = point.x + (other.x - point.x) * signalProgress;
                            const signalY = point.y + (other.y - point.y) * signalProgress;
                            context.beginPath();
                            context.arc(signalX, signalY, 1.35 + hoverStrength, 0, Math.PI * 2);
                            context.fillStyle = "rgba(142, 255, 243, " + (0.42 + hoverStrength * 0.45) + ")";
                            context.shadowColor = "rgba(42, 242, 222, 0.82)";
                            context.shadowBlur = 8;
                            context.fill();
                            context.shadowBlur = 0;
                        }
                    }

                    const pointDistance = pointer.active ? Math.hypot(point.x - pointer.x, point.y - pointer.y) : Infinity;
                    const pointGlow = Math.max(0, 1 - pointDistance / 155);
                    context.beginPath();
                    const pointRadius = isHomeHero ? 0.85 : isLightTheme ? 0.8 : isSignatureDark ? 0.95 : 1.25;
                    const pointOpacity = isHomeHero ? 0.34 : isLightTheme ? 0.22 : isSignatureDark ? 0.24 : 0.42;
                    const pointColor = isHomeHero ? "126, 255, 239" : isLightTheme ? "20, 112, 119" : "112, 255, 236";
                    context.arc(point.x, point.y, pointRadius + pointGlow * (isHomeHero ? 2.6 : isSoftNetwork ? 1.2 : 2), 0, Math.PI * 2);
                    context.fillStyle = "rgba(" + pointColor + ", " + (pointOpacity + pointGlow * 0.55) + ")";
                    context.fill();

                    if (isHomeHero && pointGlow > 0.55) {
                        context.beginPath();
                        context.arc(point.x, point.y, 4 + pointGlow * 4, 0, Math.PI * 2);
                        context.strokeStyle = "rgba(87, 255, 232, " + (pointGlow * 0.4) + ")";
                        context.lineWidth = 0.8;
                        context.stroke();
                    }
                }

                const activeRipples = ripples.filter(function (ripple) {
                    return now - ripple.startedAt < 1100;
                });
                ripples.length = 0;
                activeRipples.forEach(function (ripple) {
                    ripples.push(ripple);
                    const progress = reduceMotion.matches ? 0 : (now - ripple.startedAt) / 1100;
                    context.beginPath();
                    context.arc(ripple.x, ripple.y, 18 + progress * 250, 0, Math.PI * 2);
                    context.strokeStyle = "rgba(86, 255, 231, " + ((1 - progress) * 0.56) + ")";
                    context.lineWidth = 1 + (1 - progress) * 1.5;
                    context.shadowColor = "rgba(49, 235, 221, 0.72)";
                    context.shadowBlur = 14 * (1 - progress);
                    context.stroke();
                    context.shadowBlur = 0;
                });

                if (!reduceMotion.matches && canvas.isConnected && isInViewport) {
                    window.requestAnimationFrame(draw);
                }
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

            section.addEventListener("pointerdown", function (event) {
                if (!isHomeHero || event.target.closest("a, button")) return;
                const bounds = canvas.getBoundingClientRect();
                const x = event.clientX - bounds.left;
                const y = event.clientY - bounds.top;
                pointer.x = x;
                pointer.y = y;
                pointer.active = true;
                ripples.push({ x: x, y: y, startedAt: performance.now() });
                if (reduceMotion.matches) draw();
            }, { passive: true });

            if (typeof ResizeObserver !== "undefined") {
                new ResizeObserver(resize).observe(section);
            } else {
                window.addEventListener("resize", resize, { passive: true });
            }

            if (typeof IntersectionObserver !== "undefined") {
                const visibilityObserver = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        isInViewport = entry.isIntersecting;
                        if (isInViewport && !reduceMotion.matches) draw();
                    });
                }, { rootMargin: "120px" });
                visibilityObserver.observe(section);
            }

            draw();
        });
    }

    initInteractiveNetworks();

    let motionStoryTimeline = null;

    function initMotionStory() {
        if (motionStoryTimeline) {
            motionStoryTimeline.scrollTrigger?.kill();
            motionStoryTimeline.kill();
            motionStoryTimeline = null;
        }

        const story = document.querySelector("[data-motion-story]");
        if (!story || !window.gsap || !window.ScrollTrigger || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const steps = Array.from(story.querySelectorAll(".wm-story-step"));
        const progressLine = story.querySelector(".wm-story-progress");
        if (!steps.length || !progressLine) return;

        gsap.set(steps, { autoAlpha: 0, y: 18 });
        story.style.setProperty("--wm-story-progress", "0");
        story.dataset.motionReady = "true";

        motionStoryTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: story,
                start: "top 78%",
                end: "bottom 48%",
                scrub: 0.6,
                invalidateOnRefresh: true
            },
            onUpdate: function () {
                const timelineProgress = this.progress();
                story.style.setProperty("--wm-story-progress", timelineProgress.toFixed(3));
                const activeIndex = Math.min(steps.length - 1, Math.floor(timelineProgress * steps.length));
                steps.forEach(function (step, index) {
                    step.classList.toggle("is-current", index === activeIndex);
                    step.classList.toggle("is-complete", index < activeIndex);
                    if (index === activeIndex) step.setAttribute("aria-current", "step");
                    else step.removeAttribute("aria-current");
                });
            }
        });

        motionStoryTimeline.to(steps, { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.19, ease: "power2.out" }, 0.04);
    }

    /***************************

    swup

    ***************************/
    const options = {
        containers: ['#swupMain', '#swupMenu'],
        animateHistoryBrowsing: true,
        linkSelector: 'a:not([data-no-swup])',
        animationSelector: '[class="mil-main-transition"]'
    };
    const swup = new Swup(options);

    /***************************

    register gsap plugins

    ***************************/
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    initMotionStory();
    /***************************

    color variables

    ***************************/

    var accent = 'rgba(255, 152, 0, 1)';
    var dark = '#000';
    var light = '#fff';

    /***************************

    preloader
    
    ***************************/

    var timeline = gsap.timeline();

    timeline.to(".mil-preloader-animation", {
        opacity: 1,
    });

    timeline.fromTo(
        ".mil-animation-1 .mil-h3", {
            y: "30px",
            opacity: 0
        }, {
            y: "0px",
            opacity: 1,
            stagger: 0.4
        },
    );

    timeline.to(".mil-animation-1 .mil-h3", {
        opacity: 0,
        y: '-30',
    }, "+=.3");

    timeline.fromTo(".mil-reveal-box", 0.1, {
        opacity: 0,
    }, {
        opacity: 1,
        x: '-30',
    });

    timeline.to(".mil-reveal-box", 0.45, {
        width: "100%",
        x: 0,
    }, "+=.1");
    timeline.to(".mil-reveal-box", {
        right: "0"
    });
    timeline.to(".mil-reveal-box", 0.3, {
        width: "0%"
    });
    timeline.fromTo(".mil-animation-2 .mil-h3", {
        opacity: 0,
    }, {
        opacity: 1,
    }, "-=.5");
    timeline.to(".mil-animation-2 .mil-h3", 0.6, {
        opacity: 0,
        y: '-30'
    }, "+=.5");
    timeline.to(".mil-preloader", 0.8, {
        opacity: 0,
        ease: 'sine',
    }, "+=.2");
    timeline.fromTo(".mil-up", 0.8, {
        opacity: 0,
        y: 40,
        scale: .98,
        ease: 'sine',

    }, {
        y: 0,
        opacity: 1,
        scale: 1,
        onComplete: function () {
            $('.mil-preloader').addClass("mil-hidden");
        },
    }, "-=1");
    /***************************

    anchor scroll

    ***************************/
    $(document).on('click', 'a[href^="#"]', function (event) {
        event.preventDefault();

        var target = $($.attr(this, 'href'));
        var offset = 0;

        if ($(window).width() < 1200) {
            offset = 90;
        }

        $('html, body').animate({
            scrollTop: target.offset().top - offset
        }, 400);
    });
    /***************************

    append

    ***************************/
    $(document).ready(function () {
        $(".mil-arrow").clone().appendTo(".mil-arrow-place");
        $(".mil-dodecahedron").clone().appendTo(".mil-animation");
        $(".mil-lines").clone().appendTo(".mil-lines-place");
        $(".mil-main-menu ul li.mil-active > a").clone().appendTo(".mil-current-page");
    });
    /***************************

    accordion

    ***************************/

    let groups = gsap.utils.toArray(".mil-accordion-group");
    let menus = gsap.utils.toArray(".mil-accordion-menu");
    let menuToggles = groups.map(createAnimation);

    menus.forEach((menu) => {
        menu.addEventListener("click", () => toggleMenu(menu));
    });

    function toggleMenu(clickedMenu) {
        menuToggles.forEach((toggleFn) => toggleFn(clickedMenu));
    }

    function createAnimation(element) {
        let menu = element.querySelector(".mil-accordion-menu");
        let box = element.querySelector(".mil-accordion-content");
        let symbol = element.querySelector(".mil-symbol");
        let minusElement = element.querySelector(".mil-minus");
        let plusElement = element.querySelector(".mil-plus");

        gsap.set(box, {
            height: "auto",
        });

        let animation = gsap
            .timeline()
            .from(box, {
                height: 0,
                duration: 0.4,
                ease: "sine"
            })
            .from(minusElement, {
                duration: 0.4,
                autoAlpha: 0,
                ease: "none",
            }, 0)
            .to(plusElement, {
                duration: 0.4,
                autoAlpha: 0,
                ease: "none",
            }, 0)
            .to(symbol, {
                background: accent,
                ease: "none",
            }, 0)
            .reverse();

        return function (clickedMenu) {
            if (clickedMenu === menu) {
                animation.reversed(!animation.reversed());
            } else {
                animation.reverse();
            }
        };
    }
    /***************************

    back to top

    ***************************/
    const btt = document.querySelector(".mil-back-to-top .mil-link");

    gsap.set(btt, {
        x: -30,
        opacity: 0,
    });

    gsap.to(btt, {
        x: 0,
        opacity: 1,
        ease: 'sine',
        scrollTrigger: {
            trigger: "body",
            start: "top -40%",
            end: "top -40%",
            toggleActions: "play none reverse none"
        }
    });
    /***************************

    cursor

    ***************************/
    const cursor = document.querySelector('.mil-ball');

    gsap.set(cursor, {
        xPercent: -50,
        yPercent: -50,
    });

    document.addEventListener('pointermove', movecursor);

    function movecursor(e) {
        gsap.to(cursor, {
            duration: 0.6,
            ease: 'sine',
            x: e.clientX,
            y: e.clientY,
        });
    }

    $('.mil-drag, .mil-more, .mil-choose').mouseover(function () {
        gsap.to($(cursor), .2, {
            width: 90,
            height: 90,
            opacity: 1,
            ease: 'sine',
        });
    });

    $('.mil-drag, .mil-more, .mil-choose').mouseleave(function () {
        gsap.to($(cursor), .2, {
            width: 20,
            height: 20,
            opacity: .1,
            ease: 'sine',
        });
    });

    $('.mil-accent-cursor').mouseover(function () {
        gsap.to($(cursor), .2, {
            background: accent,
            ease: 'sine',
        });
        $(cursor).addClass('mil-accent');
    });

    $('.mil-accent-cursor').mouseleave(function () {
        gsap.to($(cursor), .2, {
            background: dark,
            ease: 'sine',
        });
        $(cursor).removeClass('mil-accent');
    });

    $('.mil-drag').mouseover(function () {
        gsap.to($('.mil-ball .mil-icon-1'), .2, {
            scale: '1',
            ease: 'sine',
        });
    });

    $('.mil-drag').mouseleave(function () {
        gsap.to($('.mil-ball .mil-icon-1'), .2, {
            scale: '0',
            ease: 'sine',
        });
    });

    $('.mil-more').mouseover(function () {
        gsap.to($('.mil-ball .mil-more-text'), .2, {
            scale: '1',
            ease: 'sine',
        });
    });

    $('.mil-more').mouseleave(function () {
        gsap.to($('.mil-ball .mil-more-text'), .2, {
            scale: '0',
            ease: 'sine',
        });
    });

    $('.mil-choose').mouseover(function () {
        gsap.to($('.mil-ball .mil-choose-text'), .2, {
            scale: '1',
            ease: 'sine',
        });
    });

    $('.mil-choose').mouseleave(function () {
        gsap.to($('.mil-ball .mil-choose-text'), .2, {
            scale: '0',
            ease: 'sine',
        });
    });

    $('a:not(".mil-choose , .mil-more , .mil-drag , .mil-accent-cursor"), input , textarea, .mil-accordion-menu').mouseover(function () {
        gsap.to($(cursor), .2, {
            scale: 0,
            ease: 'sine',
        });
        gsap.to($('.mil-ball svg'), .2, {
            scale: 0,
        });
    });

    $('a:not(".mil-choose , .mil-more , .mil-drag , .mil-accent-cursor"), input, textarea, .mil-accordion-menu').mouseleave(function () {
        gsap.to($(cursor), .2, {
            scale: 1,
            ease: 'sine',
        });

        gsap.to($('.mil-ball svg'), .2, {
            scale: 1,
        });
    });

    $('body').mousedown(function () {
        gsap.to($(cursor), .2, {
            scale: .1,
            ease: 'sine',
        });
    });
    $('body').mouseup(function () {
        gsap.to($(cursor), .2, {
            scale: 1,
            ease: 'sine',
        });
    });
    /***************************

     menu

    ***************************/
    $('.mil-menu-btn').on("click", function () {
        $('.mil-menu-btn').toggleClass('mil-active');
        $('.mil-menu').toggleClass('mil-active');
        $('.mil-menu-frame').toggleClass('mil-active');
    });
    /***************************

    main menu

    ***************************/
    $('.mil-has-children a').on('click', function () {
        $('.mil-has-children ul').removeClass('mil-active');
        $('.mil-has-children a').removeClass('mil-active');
        $(this).toggleClass('mil-active');
        $(this).next().toggleClass('mil-active');
    });
    /***************************

    progressbar

    ***************************/
    gsap.to('.mil-progress', {
        height: '100%',
        ease: 'sine',
        scrollTrigger: {
            scrub: 0.3
        }
    });
    /***************************

    scroll animations

    ***************************/

    const appearance = document.querySelectorAll(".mil-up");

    appearance.forEach((section) => {
        gsap.fromTo(section, {
            opacity: 0,
            y: 40,
            scale: .98,
            ease: 'sine',

        }, {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: .4,
            scrollTrigger: {
                trigger: section,
                toggleActions: 'play none none reverse',
            }
        });
    });

    const scaleImage = document.querySelectorAll(".mil-scale");

    scaleImage.forEach((section) => {
        var value1 = $(section).data("value-1");
        var value2 = $(section).data("value-2");
        gsap.fromTo(section, {
            ease: 'sine',
            scale: value1,

        }, {
            scale: value2,
            scrollTrigger: {
                trigger: section,
                scrub: true,
                toggleActions: 'play none none reverse',
            }
        });
    });

    const parallaxImage = document.querySelectorAll(".mil-parallax");


    if ($(window).width() > 960) {
        parallaxImage.forEach((section) => {
            var value1 = $(section).data("value-1");
            var value2 = $(section).data("value-2");
            gsap.fromTo(section, {
                ease: 'sine',
                y: value1,

            }, {
                y: value2,
                scrollTrigger: {
                    trigger: section,
                    scrub: true,
                    toggleActions: 'play none none reverse',
                }
            });
        });
    }

    const rotate = document.querySelectorAll(".mil-rotate");

    rotate.forEach((section) => {
        var value = $(section).data("value");
        gsap.fromTo(section, {
            ease: 'sine',
            rotate: 0,

        }, {
            rotate: value,
            scrollTrigger: {
                trigger: section,
                scrub: true,
                toggleActions: 'play none none reverse',
            }
        });
    });
    /***************************

    fancybox

    ***************************/
    $('[data-fancybox="gallery"]').fancybox({
        buttons: [
            "slideShow",
            "zoom",
            "fullScreen",
            "close"
          ],
        loop: false,
        protect: true
    });
    $.fancybox.defaults.hash = false;
    /***************************

    reviews slider

    ***************************/

    var menu = ['<div class="mil-custom-dot mil-slide-1"></div>', '<div class="mil-custom-dot mil-slide-2"></div>', '<div class="mil-custom-dot mil-slide-3"></div>', '<div class="mil-custom-dot mil-slide-4"></div>', '<div class="mil-custom-dot mil-slide-5"></div>', '<div class="mil-custom-dot mil-slide-6"></div>', '<div class="mil-custom-dot mil-slide-7"></div>']
    var mySwiper = new Swiper('.mil-reviews-slider', {
        // If we need pagination
        pagination: {
            el: '.mil-revi-pagination',
            clickable: true,
            renderBullet: function (index, className) {
                return '<span class="' + className + '">' + (menu[index]) + '</span>';
            },
        },
        speed: 800,
        effect: 'fade',
        parallax: true,
        navigation: {
            nextEl: '.mil-revi-next',
            prevEl: '.mil-revi-prev',
        },
    })

    /***************************

    infinite slider

    ***************************/
    var swiper = new Swiper('.mil-infinite-show', {
        slidesPerView: 2,
        spaceBetween: 30,
        speed: 5000,
        autoplay: true,
        autoplay: {
            delay: 0,
        },
        loop: true,
        freeMode: true,
        breakpoints: {
            992: {
                slidesPerView: 4,
            },
        },
    });

    /***************************

    portfolio slider

    ***************************/
    var swiper = new Swiper('.mil-portfolio-slider', {
        slidesPerView: 1,
        spaceBetween: 0,
        speed: 800,
        parallax: true,
        mousewheel: {
            enable: true
        },
        navigation: {
            nextEl: '.mil-portfolio-next',
            prevEl: '.mil-portfolio-prev',
        },
        pagination: {
            el: '.swiper-portfolio-pagination',
            type: 'fraction',
        },
    });
    /***************************

    1 item slider

    ***************************/
    var swiper = new Swiper('.mil-1-slider', {
        slidesPerView: 1,
        spaceBetween: 30,
        speed: 800,
        parallax: true,
        navigation: {
            nextEl: '.mil-portfolio-next',
            prevEl: '.mil-portfolio-prev',
        },
        pagination: {
            el: '.swiper-portfolio-pagination',
            type: 'fraction',
        },
    });
    /***************************

    2 item slider

    ***************************/
    var swiper = new Swiper('.mil-2-slider', {
        slidesPerView: 1,
        spaceBetween: 30,
        speed: 800,
        parallax: true,
        navigation: {
            nextEl: '.mil-portfolio-next',
            prevEl: '.mil-portfolio-prev',
        },
        pagination: {
            el: '.swiper-portfolio-pagination',
            type: 'fraction',
        },
        breakpoints: {
            992: {
                slidesPerView: 2,
            },
        },
    });

    /*----------------------------------------------------------
    ------------------------------------------------------------

    REINIT

    ------------------------------------------------------------
    ----------------------------------------------------------*/
    document.addEventListener("swup:contentReplaced", function () {

        initInteractiveNetworks();
        initMotionStory();
        document.dispatchEvent(new Event("wm:page-context-change"));

        $('html, body').animate({
            scrollTop: 0,
        }, 0);

        gsap.to('.mil-progress', {
            height: 0,
            ease: 'sine',
            onComplete: () => {
                ScrollTrigger.refresh()
            },
        });
        /***************************

         menu

        ***************************/
        $('.mil-menu-btn').removeClass('mil-active');
        $('.mil-menu').removeClass('mil-active');
        $('.mil-menu-frame').removeClass('mil-active');
        /***************************

        append

        ***************************/
        $(document).ready(function () {
            $(".mil-arrow-place .mil-arrow, .mil-animation .mil-dodecahedron, .mil-current-page a").remove();
            $(".mil-arrow").clone().appendTo(".mil-arrow-place");
            $(".mil-dodecahedron").clone().appendTo(".mil-animation");
            $(".mil-lines").clone().appendTo(".mil-lines-place");
            $(".mil-main-menu ul li.mil-active > a").clone().appendTo(".mil-current-page");
        });
        /***************************

        accordion

        ***************************/

        let groups = gsap.utils.toArray(".mil-accordion-group");
        let menus = gsap.utils.toArray(".mil-accordion-menu");
        let menuToggles = groups.map(createAnimation);

        menus.forEach((menu) => {
            menu.addEventListener("click", () => toggleMenu(menu));
        });

        function toggleMenu(clickedMenu) {
            menuToggles.forEach((toggleFn) => toggleFn(clickedMenu));
        }

        function createAnimation(element) {
            let menu = element.querySelector(".mil-accordion-menu");
            let box = element.querySelector(".mil-accordion-content");
            let symbol = element.querySelector(".mil-symbol");
            let minusElement = element.querySelector(".mil-minus");
            let plusElement = element.querySelector(".mil-plus");

            gsap.set(box, {
                height: "auto",
            });

            let animation = gsap
                .timeline()
                .from(box, {
                    height: 0,
                    duration: 0.4,
                    ease: "sine"
                })
                .from(minusElement, {
                    duration: 0.4,
                    autoAlpha: 0,
                    ease: "none",
                }, 0)
                .to(plusElement, {
                    duration: 0.4,
                    autoAlpha: 0,
                    ease: "none",
                }, 0)
                .to(symbol, {
                    background: accent,
                    ease: "none",
                }, 0)
                .reverse();

            return function (clickedMenu) {
                if (clickedMenu === menu) {
                    animation.reversed(!animation.reversed());
                } else {
                    animation.reverse();
                }
            };
        }

        /***************************

        cursor

        ***************************/

        $('.mil-drag, .mil-more, .mil-choose').mouseover(function () {
            gsap.to($(cursor), .2, {
                width: 90,
                height: 90,
                opacity: 1,
                ease: 'sine',
            });
        });

        $('.mil-drag, .mil-more, .mil-choose').mouseleave(function () {
            gsap.to($(cursor), .2, {
                width: 20,
                height: 20,
                opacity: .1,
                ease: 'sine',
            });
        });

        $('.mil-accent-cursor').mouseover(function () {
            gsap.to($(cursor), .2, {
                background: accent,
                ease: 'sine',
            });
            $(cursor).addClass('mil-accent');
        });

        $('.mil-accent-cursor').mouseleave(function () {
            gsap.to($(cursor), .2, {
                background: dark,
                ease: 'sine',
            });
            $(cursor).removeClass('mil-accent');
        });

        $('.mil-drag').mouseover(function () {
            gsap.to($('.mil-ball .mil-icon-1'), .2, {
                scale: '1',
                ease: 'sine',
            });
        });

        $('.mil-drag').mouseleave(function () {
            gsap.to($('.mil-ball .mil-icon-1'), .2, {
                scale: '0',
                ease: 'sine',
            });
        });

        $('.mil-more').mouseover(function () {
            gsap.to($('.mil-ball .mil-more-text'), .2, {
                scale: '1',
                ease: 'sine',
            });
        });

        $('.mil-more').mouseleave(function () {
            gsap.to($('.mil-ball .mil-more-text'), .2, {
                scale: '0',
                ease: 'sine',
            });
        });

        $('.mil-choose').mouseover(function () {
            gsap.to($('.mil-ball .mil-choose-text'), .2, {
                scale: '1',
                ease: 'sine',
            });
        });

        $('.mil-choose').mouseleave(function () {
            gsap.to($('.mil-ball .mil-choose-text'), .2, {
                scale: '0',
                ease: 'sine',
            });
        });

        $('a:not(".mil-choose , .mil-more , .mil-drag , .mil-accent-cursor"), input , textarea, .mil-accordion-menu').mouseover(function () {
            gsap.to($(cursor), .2, {
                scale: 0,
                ease: 'sine',
            });
            gsap.to($('.mil-ball svg'), .2, {
                scale: 0,
            });
        });

        $('a:not(".mil-choose , .mil-more , .mil-drag , .mil-accent-cursor"), input, textarea, .mil-accordion-menu').mouseleave(function () {
            gsap.to($(cursor), .2, {
                scale: 1,
                ease: 'sine',
            });

            gsap.to($('.mil-ball svg'), .2, {
                scale: 1,
            });
        });

        $('body').mousedown(function () {
            gsap.to($(cursor), .2, {
                scale: .1,
                ease: 'sine',
            });
        });
        $('body').mouseup(function () {
            gsap.to($(cursor), .2, {
                scale: 1,
                ease: 'sine',
            });
        });
        /***************************

        main menu

        ***************************/
        $('.mil-has-children a').on('click', function () {
            $('.mil-has-children ul').removeClass('mil-active');
            $('.mil-has-children a').removeClass('mil-active');
            $(this).toggleClass('mil-active');
            $(this).next().toggleClass('mil-active');
        });
        /***************************

        scroll animations

        ***************************/

        const appearance = document.querySelectorAll(".mil-up");

        appearance.forEach((section) => {
            gsap.fromTo(section, {
                opacity: 0,
                y: 40,
                scale: .98,
                ease: 'sine',

            }, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: .4,
                scrollTrigger: {
                    trigger: section,
                    toggleActions: 'play none none reverse',
                }
            });
        });

        const scaleImage = document.querySelectorAll(".mil-scale");

        scaleImage.forEach((section) => {
            var value1 = $(section).data("value-1");
            var value2 = $(section).data("value-2");
            gsap.fromTo(section, {
                ease: 'sine',
                scale: value1,

            }, {
                scale: value2,
                scrollTrigger: {
                    trigger: section,
                    scrub: true,
                    toggleActions: 'play none none reverse',
                }
            });
        });

        const parallaxImage = document.querySelectorAll(".mil-parallax");


        if ($(window).width() > 960) {
            parallaxImage.forEach((section) => {
                var value1 = $(section).data("value-1");
                var value2 = $(section).data("value-2");
                gsap.fromTo(section, {
                    ease: 'sine',
                    y: value1,

                }, {
                    y: value2,
                    scrollTrigger: {
                        trigger: section,
                        scrub: true,
                        toggleActions: 'play none none reverse',
                    }
                });
            });
        }

        const rotate = document.querySelectorAll(".mil-rotate");

        rotate.forEach((section) => {
            var value = $(section).data("value");
            gsap.fromTo(section, {
                ease: 'sine',
                rotate: 0,

            }, {
                rotate: value,
                scrollTrigger: {
                    trigger: section,
                    scrub: true,
                    toggleActions: 'play none none reverse',
                }
            });
        });
        /***************************

        fancybox

        ***************************/
        $('[data-fancybox="gallery"]').fancybox({
            buttons: [
            "slideShow",
            "zoom",
            "fullScreen",
            "close"
          ],
            loop: false,
            protect: true
        });
        $.fancybox.defaults.hash = false;
        /***************************

        reviews slider

        ***************************/

        var menu = ['<div class="mil-custom-dot mil-slide-1"></div>', '<div class="mil-custom-dot mil-slide-2"></div>', '<div class="mil-custom-dot mil-slide-3"></div>', '<div class="mil-custom-dot mil-slide-4"></div>', '<div class="mil-custom-dot mil-slide-5"></div>', '<div class="mil-custom-dot mil-slide-6"></div>', '<div class="mil-custom-dot mil-slide-7"></div>']
        var mySwiper = new Swiper('.mil-reviews-slider', {
            // If we need pagination
            pagination: {
                el: '.mil-revi-pagination',
                clickable: true,
                renderBullet: function (index, className) {
                    return '<span class="' + className + '">' + (menu[index]) + '</span>';
                },
            },
            speed: 800,
            effect: 'fade',
            parallax: true,
            navigation: {
                nextEl: '.mil-revi-next',
                prevEl: '.mil-revi-prev',
            },
        })

        /***************************

        infinite slider

        ***************************/
        var swiper = new Swiper('.mil-infinite-show', {
            slidesPerView: 2,
            spaceBetween: 30,
            speed: 5000,
            autoplay: true,
            autoplay: {
                delay: 0,
            },
            loop: true,
            freeMode: true,
            breakpoints: {
                992: {
                    slidesPerView: 4,
                },
            },
        });

        /***************************

        portfolio slider

        ***************************/
        var swiper = new Swiper('.mil-portfolio-slider', {
            slidesPerView: 1,
            spaceBetween: 0,
            speed: 800,
            parallax: true,
            mousewheel: {
                enable: true
            },
            navigation: {
                nextEl: '.mil-portfolio-next',
                prevEl: '.mil-portfolio-prev',
            },
            pagination: {
                el: '.swiper-portfolio-pagination',
                type: 'fraction',
            },
        });
        /***************************

        1 item slider

        ***************************/
        var swiper = new Swiper('.mil-1-slider', {
            slidesPerView: 1,
            spaceBetween: 30,
            speed: 800,
            parallax: true,
            navigation: {
                nextEl: '.mil-portfolio-next',
                prevEl: '.mil-portfolio-prev',
            },
            pagination: {
                el: '.swiper-portfolio-pagination',
                type: 'fraction',
            },
        });
        /***************************

        2 item slider

        ***************************/
        var swiper = new Swiper('.mil-2-slider', {
            slidesPerView: 1,
            spaceBetween: 30,
            speed: 800,
            parallax: true,
            navigation: {
                nextEl: '.mil-portfolio-next',
                prevEl: '.mil-portfolio-prev',
            },
            pagination: {
                el: '.swiper-portfolio-pagination',
                type: 'fraction',
            },
            breakpoints: {
                992: {
                    slidesPerView: 2,
                },
            },
        });

    });

});
