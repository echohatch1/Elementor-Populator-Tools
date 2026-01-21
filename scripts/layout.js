document.addEventListener('DOMContentLoaded', () => {
    // 1. Create Header
    const header = document.createElement('header');
    header.className = 'global-header';
    header.innerHTML = `
        <div class="header-container">
            <div class="logo">
                <img src="logo.svg" width="246" height="76" alt="Elementor Populator Tools">
            </div>
            <nav>
                <a href="accordion-populator.html">Accordion Populator</a>
                <a href="icon-list-populator.html">Icon List Populator</a>
            </nav>
        </div>
    `;

    // 2. Create Footer
    const footer = document.createElement('footer');
    footer.className = 'global-footer';
    const year = new Date().getFullYear();
    footer.innerHTML = `
        <div class="footer-container">
            <p>&copy; ${year} <a href='https://landonhatch.com' target='_blank'>Landon Hatch</a>. All rights reserved.</p>
            <p class="footer-disclaimer">This tool is not affiliated with or endorsed by Elementor Ltd.</p>
            <p class="footer-version">v1.0 • Last Updated: Jan 20, 2026</p>
        </div>
    `;

    // 3. Highlight Active Link
    const currentPath = window.location.pathname.split('/').pop() || 'accordion-populator.html'; // Default to index if empty
    const navLinks = header.querySelectorAll('nav a');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // 4. Inject into DOM
    document.body.prepend(header);
    document.body.appendChild(footer);
});
