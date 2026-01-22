import { Link } from 'react-router-dom';
import { List, Minimize2, Layers, Clock, Wand2, Users } from 'lucide-react';

export default function Home() {
    return (
        <div className="home-container">
            <title>Elementor Populator Tools - Automate Your Workflow</title>
            <meta name="description" content="Free tools to automatically populate Elementor Accordion and Icon List widgets from rich text content. Save time on copy-pasting." />

            <div className="card home-hero">
                <h1>Welcome to Elementor Populator Tools</h1>
                <p className="home-intro">
                    Automate your Elementor workflow. Do less copy-pasting and convert rich text content into Elementor widgets instantly.
                </p>
            </div>

            <h2 className="section-title">Choose Your Tool</h2>
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

            <div className="card home-details">
                <div className="detail-section">
                    <div className="detail-icon"><Layers size={32} /></div>
                    <h3>What is Elementor Populator Tools?</h3>
                    <p>
                        A seamless bridge between your content documents and Elementor. This suite of tools allows you to bulk-populate complex Elementor widgets (like Accordions and Icon Lists) instantly, bypassing the tedious manual entry process.
                    </p>
                </div>
                <div className="detail-section">
                    <div className="detail-icon"><Clock size={32} /></div>
                    <h3>Why do I need Elementor Populator Tools?</h3>
                    <p>
                        Building long lists or FAQs in Elementor is slow. You have to create an item, click to open it, paste the title, click the content area, and paste the content—repeat 50 times. These tools automate that entirely, turning hours of busywork into a 10-second task.
                    </p>
                </div>
                <div className="detail-section">
                    <div className="detail-icon"><Wand2 size={32} /></div>
                    <h3>How does Elementor Populator Tools work?</h3>
                    <p>
                        It uses smart parsing logic to read your rich text. You paste your content (from Word, Google Docs, or AI chat), select how it's formatted (e.g., "Split by Heading"), and the tool generates a JSON code snippet. Paste that snippet into Elementor, and your widget is instantly fully populated.
                    </p>
                </div>
                <div className="detail-section">
                    <div className="detail-icon"><Users size={32} /></div>
                    <h3>Who is Elementor Populator Tools for?</h3>
                    <p>
                        Web designers, agencies, and developers who value their time. Whether you're building a massive documentation site or just a simple FAQ page, this tool eliminates the manual repetitive work so you can focus on design and strategy.
                    </p>
                </div>
            </div>
        </div>
    );
}
