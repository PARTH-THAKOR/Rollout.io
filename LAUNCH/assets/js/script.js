document.addEventListener('DOMContentLoaded', () => {

    /* =======================================================
       1. Custom Cursor Glow
    ======================================================= */
    const cursorGlow = document.getElementById('cursor-glow');
    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
    });

    document.addEventListener('mouseleave', () => cursorGlow.style.opacity = '0');
    document.addEventListener('mouseenter', () => cursorGlow.style.opacity = '1');

    /* =======================================================
       2. Detailed Scroll Indicator
    ======================================================= */
    const myBar = document.getElementById("myBar");
    window.addEventListener('scroll', function () {
        if (!myBar) return;
        let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        let scrolled = (winScroll / height) * 100;
        myBar.style.width = scrolled + "%";
    });

    /* =======================================================
       3. 3D Tilt Effect on Elements (gand phaad feature)
    ======================================================= */
    const effectElements = document.querySelectorAll('.effect-3d');

    effectElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Subtle rotation based on mouse position
            const rotateX = ((y - centerY) / centerY) * -4;
            const rotateY = ((x - centerX) / centerX) * 4;

            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        el.addEventListener('mouseleave', () => {
            // Reset transformation and add smooth transition back
            el.style.transition = 'transform 0.5s ease-out';
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            setTimeout(() => el.style.transition = '', 500); // Remove transition text so JS interaction is snappy again
        });
    });

    /* =======================================================
       4. Scroll Reveal (Intersection Observer)
    ======================================================= */
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px 50px 0px"
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Safety Fallback: Ensure elements become visible even if scroll observer fails
    setTimeout(() => {
        document.querySelectorAll('.fade-in').forEach(el => {
            if (!el.classList.contains('visible')) {
                el.classList.add('visible');
            }
        });
    }, 800);


    /* =======================================================
       5. Abstract Particle Network Background (Removed)
    ======================================================= */
    // Replaced with CSS Star Background



    /* =======================================================
       6. Code Editor Tab Switching Logic
    ======================================================= */
    const tabs = document.querySelectorAll('.editor-header .tab');
    const editors = document.querySelectorAll('.editor-code');

    tabs.forEach(tab => {
        // Enforce clickable css
        tab.style.cursor = 'pointer';
        tab.style.pointerEvents = 'auto';
        tab.style.position = 'relative';
        tab.style.zIndex = '100';

        tab.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Hide all editors
            editors.forEach(ed => {
                ed.style.display = 'none';
                ed.style.opacity = '0';
            });

            // Add active to clicked tab
            this.classList.add('active');

            // Show corresponding editor
            const targetId = this.getAttribute('data-target');
            const targetEditor = document.getElementById(targetId);
            if (targetEditor) {
                targetEditor.style.display = 'block';
                setTimeout(() => targetEditor.style.opacity = '1', 10);
            }
        });
    });



});
