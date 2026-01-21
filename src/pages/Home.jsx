import { Link } from 'react-router-dom';
import { List, Minimize2 } from 'lucide-react';

export default function Home() {
    return (
        <div className="home-container">
            <h1>Welcome to Elementor Populator Tools</h1>
            <p className="home-intro">
                Automate your Elementor workflow. Do less copy-pasting and convert rich text content into Elementor widgets instantly.
            </p>

            <div className="tools-grid">

                <Link to="/accordion" className="tool-link">
                    <div className="card tool-card">
                        <div className="tool-icon">
                            <Minimize2 size={48} />
                        </div>
                        <h2>Accordion Populator</h2>
                        <p>
                            Populate Accordion widgets from titles and content seperated by headings, bold lines, or colons.
                            Perfect for FAQ sections or structured content.
                        </p>
                    </div>
                </Link>

                <Link to="/icon-list" className="tool-link">
                    <div className="card tool-card">
                        <div className="tool-icon">
                            <List size={48} />
                        </div>
                        <h2>Icon List Populator</h2>
                        <p>
                            Convert lists or plain text seperated by lines into Elementor Icon List widgets.
                            Great for feature lists, table of contents, or checkmarks.
                        </p>
                    </div>
                </Link>

            </div>
        </div>
    );
}
