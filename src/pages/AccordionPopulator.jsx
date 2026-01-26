import { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { quillModules, quillFormats } from '../utils/quillConfig';
import { parseByHeadings, parseByBold, parseByColon, findWidgetRecursive } from '../utils/elementor';
import { HelpCircle } from 'lucide-react';

export default function AccordionPopulator() {
    const [editorContent, setEditorContent] = useState('');
    const [elementorCode, setElementorCode] = useState('');
    const [strategy, setStrategy] = useState('heading');
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [stripStyles, setStripStyles] = useState(true);

    const handleProcess = () => {
        if (!editorContent || !elementorCode) {
            setStatus({ type: 'error', msg: 'Please fill both boxes!' });
            return;
        }

        // 1. Parse Content
        const temp = document.createElement('div');
        temp.innerHTML = editorContent;

        let listItems = [];
        try {
            if (strategy === 'heading') {
                listItems = parseByHeadings(temp);
            } else if (strategy === 'bold') {
                listItems = parseByBold(temp);
            } else {
                listItems = parseByColon(temp);
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Parsing Error: ' + e.message });
            return;
        }

        if (listItems.length === 0) {
            setStatus({ type: 'error', msg: 'No items found. Check your formatting or selected strategy.' });
            return;
        }

        // 2. Parse Elementor JSON
        try {
            let data;
            try {
                data = JSON.parse(elementorCode);
            } catch (e) {
                throw new Error("Invalid JSON in Elementor Code box.");
            }

            // Locate Accordion
            const isAccordion = (node) =>
                node.elType === 'widget' &&
                node.settings &&
                Array.isArray(node.settings.items) &&
                Array.isArray(node.elements);

            let widget = null;
            if (Array.isArray(data)) {
                widget = data.find(isAccordion) || (data.length > 0 && isAccordion(data[0]) ? data[0] : null);
            } else if (data.elType === 'widget') {
                if (isAccordion(data)) widget = data;
            } else if (data.elements) {
                widget = Array.isArray(data.elements) ? data.elements.find(isAccordion) : null;
            }

            if (!widget) throw new Error("Could not find a valid Accordion widget structure.");

            // 3. Update Data
            const accordionItems = widget.settings.items;
            const contentContainers = widget.elements;
            let updateCount = 0;
            let missingEditorsCount = 0;

            for (let i = 0; i < listItems.length; i++) {
                if (i >= accordionItems.length || i >= contentContainers.length) break;

                // Clean Title: Strip tags and replace NBSP (entity & unicode) with space
                accordionItems[i].item_title = listItems[i].title
                    .replace(/<[^>]*>/g, '')
                    .replace(/(&nbsp;|\u00A0)/g, ' ')
                    .trim();

                const container = contentContainers[i];
                const textEditor = findWidgetRecursive(container, 'text-editor');

                if (textEditor) {
                    let finalContent = listItems[i].content;

                    // Always clean &nbsp; from content too, as requested
                    finalContent = finalContent.replace(/(&nbsp;|\u00A0)/g, ' ');

                    if (stripStyles) {
                        finalContent = finalContent.replace(/\sstyle=['"][^'"]*['"]/gi, '');
                    }
                    textEditor.settings.editor = finalContent;
                    updateCount++;
                } else {
                    missingEditorsCount++;
                    console.warn(`Item ${i + 1} has no inner Text Editor widget.`);
                }
            }

            if (updateCount === 0 && listItems.length > 0) {
                if (missingEditorsCount > 0) {
                    setStatus({ type: 'error', msg: `Failed. Found ${missingEditorsCount} items but none had Text Editor widgets.` });
                } else {
                    setStatus({ type: 'error', msg: "Titles updated, but no content populated (No Text Editor widgets found)." });
                }
                return;
            }

            // 4. Output
            const result = JSON.stringify(data);
            navigator.clipboard.writeText(result).then(() => {
                if (missingEditorsCount > 0) {
                    setStatus({ type: 'warning', msg: `Warning: Populated ${updateCount} items. Skipped ${missingEditorsCount} items (Missing Text Editor widget). Use "Paste from other site" in Elementor.` });
                } else if (listItems.length > updateCount) {
                    setStatus({ type: 'warning', msg: `Partial Success! Populated ${updateCount} of ${listItems.length} items. (Widget too small - add more items). Use "Paste from other site" in Elementor.` });
                } else {
                    setStatus({ type: 'success', msg: `Success! Populated all ${updateCount} items and copied to clipboard. Use "Paste from other site" in Elementor.` });
                }
            }).catch(err => {
                setStatus({ type: 'error', msg: "Browser blocked clipboard copy." });
            });

        } catch (e) {
            setStatus({ type: 'error', msg: 'Error: ' + e.message });
        }
    };

    return (
        <div className="card">
            <title>Accordion Populator - Elementor Populator Tools</title>
            <meta name="description" content="Bulk populate Elementor Accordion widgets from rich text content. Split by headings, bold lines, or colons." />
            <h1>Elementor Accordion Populator</h1>

            <div className="strategy-selector">
                <div className="strategy-header">
                    <span className="strategy-label">Parsing Strategy</span>
                    <div className="tooltip-container">
                        <span className="tooltip-icon"><HelpCircle size={14} /></span>
                        <div className="tooltip-content">
                            <strong>Heading Split (Default):</strong> H1-H6 are titles, content below is body.<br /><br />
                            <strong>Bold Line Split:</strong> Bold lines are titles, content below is body.<br /><br />
                            <strong>Colon Split:</strong> "Title: Content" format, on same line.
                        </div>
                    </div>
                </div>
                <div className="strategy-options">
                    <label className="strategy-option">
                        <input
                            type="radio"
                            name="splitStrategy"
                            value="heading"
                            checked={strategy === 'heading'}
                            onChange={(e) => setStrategy(e.target.value)}
                        /> Split by Heading
                    </label>
                    <label className="strategy-option">
                        <input
                            type="radio"
                            name="splitStrategy"
                            value="bold"
                            checked={strategy === 'bold'}
                            onChange={(e) => setStrategy(e.target.value)}
                        /> Split by Bold Line
                    </label>
                    <label className="strategy-option">
                        <input
                            type="radio"
                            name="splitStrategy"
                            value="colon"
                            checked={strategy === 'colon'}
                            onChange={(e) => setStrategy(e.target.value)}
                        /> Split by Colon
                    </label>
                </div>
            </div>



            <label>1. Paste Content Here (Rich Text):</label>
            <ReactQuill
                theme="snow"
                value={editorContent}
                onChange={setEditorContent}
                modules={quillModules}
                formats={quillFormats}
            />

            <div className="checkbox-option">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={stripStyles}
                        onChange={(e) => setStripStyles(e.target.checked)}
                    />
                    Strip inline styles (remove colors, font sizes, etc.)
                </label>
            </div>

            <label>2. Paste Elementor Widget Code (JSON):</label>
            <textarea
                value={elementorCode}
                onChange={(e) => setElementorCode(e.target.value)}
                placeholder='{"type":"elementor","siteurl":...'
                autoCorrect="off"
                spellCheck="false"
                autoCapitalize="off"
            />

            <button className="process-btn" onClick={handleProcess}>
                Populate & Copy to Clipboard
            </button>

            {status.msg && (
                <div className={`status ${status.type}`}>
                    {status.msg}
                </div>
            )}

            <div className="instructions">
                <h3>How to use:</h3>
                <ol>
                    <li><strong>Prepare Content:</strong> Select a strategy and paste your formatted text into the editor above. Adjust formatting if needed to match the selected strategy.</li>
                    <li><strong>Prepare Elementor:</strong>
                        <ul>
                            <li>Create an <strong>Accordion</strong> widget.</li>
                            <li><strong>Crucial:</strong> Add a <strong>Text Editor</strong> widget inside <em>every</em> accordion item.</li>
                            <li>Add enough accordion items (e.g., 20) to fit your content (use the duplicate button if needed).</li>
                            <li>Copy the widget (right-click the widget in Elementor and select "Copy").</li>
                        </ul>
                    </li>
                    <li><strong>Run Tool:</strong> Paste the copied JSON from Elementor into box 2 and click "Populate".</li>
                    <li><strong>Paste back into Elementor:</strong> Right-click inside Elementor and select <strong>"Paste from other site"</strong>. (Note: The visual editor may not update immediately; click on the content to refresh the view).</li>
                </ol>
            </div>
        </div>
    );
}
