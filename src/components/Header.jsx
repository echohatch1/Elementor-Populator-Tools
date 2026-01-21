import { NavLink, Link } from 'react-router-dom';

export default function Header() {
    return (
        <header className="global-header">
            <div className="header-container">
                <Link to="/" className="logo">
                    <img src="/logo.svg" alt="Elementor Populator Tools" width="200" />
                </Link>
                <nav>
                    <NavLink to="/accordion" className={({ isActive }) => isActive ? "active" : ""}>
                        Accordion Populator
                    </NavLink>
                    <NavLink to="/icon-list" className={({ isActive }) => isActive ? "active" : ""}>
                        Icon List Populator
                    </NavLink>
                </nav>
            </div>
        </header>
    );
}
