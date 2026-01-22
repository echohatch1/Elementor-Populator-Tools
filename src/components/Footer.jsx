export default function Footer() {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="global-footer">
            <div className="footer-container">
                <p>&copy; {currentYear} <a href="https://landonhatch.com" target="_blank" rel="noopener noreferrer">Landon Hatch</a>. All rights reserved.</p>
                <p className="footer-disclaimer">This tool is not affiliated with or endorsed by Elementor Ltd.</p>
                <p className="footer-version">Last Updated: {__BUILD_DATE__}</p>
            </div>
        </footer>
    );
}
