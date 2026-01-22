import { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { quillModules, quillFormats } from '../utils/quillConfig';
import { findWidgetRecursive } from '../utils/elementor';
import { Clipboard } from 'lucide-react';
export default function IconListPopulator() {
    const [editorContent, setEditorContent] = useState('');
    const [elementorCode, setElementorCode] = useState('');
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [stripStyles, setStripStyles] = useState(true);

    const handleProcess = () => {
        if (!elementorCode) {
            setStatus({ type: 'error', msg: 'Please paste your Elementor code!' });
            return;
        }
        if (!editorContent) {
            setStatus({ type: 'error', msg: 'Please paste content!' });
            return;
        }

        // 1. Flatten List
        const temp = document.createElement('div');
        temp.innerHTML = editorContent;

        let items = Array.from(temp.querySelectorAll('li, p, div'))
            .map(el => el.innerHTML.trim())
            .filter(html => html.length > 0 && html !== '<br>');

        // Fallback for just text lines
        if (items.length === 0) {
            items = editorContent.split(/<br\/?>/gi)
                .map(item => item.trim())
                .filter(item => item.length > 0 && item !== '<p><br></p>'); // Quill empty line check
        }

        // Remove empty P tags if Quill wraps everything
        if (items.length === 1 && items[0] === '<br>') items = [];

        if (items.length === 0) {
            setStatus({ type: 'error', msg: "No content found in the text box." });
            return;
        }

        // 2. Parse JSON
        try {
            let data;
            try {
                data = JSON.parse(elementorCode);
            } catch (e) {
                throw new Error("Invalid JSON. Please copy the text exactly from Elementor.");
            }

            let widget = null;
            const roots = Array.isArray(data) ? data : [data];

            for (const root of roots) {
                widget = findWidgetRecursive(root, 'icon-list');
                if (widget) break;
            }

            if (!widget) throw new Error("Could not find an 'Icon List' widget in the pasted code.");
            if (!widget.settings || !Array.isArray(widget.settings.icon_list)) {
                throw new Error("Widget found but it has no 'icon_list' items structure.");
            }

            // 3. Update Data
            const iconItems = widget.settings.icon_list;
            let updateCount = 0;

            for (let i = 0; i < items.length; i++) {
                if (i >= iconItems.length) break;

                // Strip block tags to get clean inline HTML
                let cleanContent = items[i].replace(/<\/?(li|ul|ol|p|div|h[1-6])[^>]*>/gi, '');

                // Replace &nbsp; with normal space
                cleanContent = cleanContent.replace(/&nbsp;/gi, ' ');

                if (stripStyles) {
                    cleanContent = cleanContent.replace(/\sstyle=['"][^'"]*['"]/gi, '');
                }

                iconItems[i].text = cleanContent;
                updateCount++;
            }

            // 4. Output
            const result = JSON.stringify(data);
            navigator.clipboard.writeText(result).then(() => {
                if (items.length > updateCount) {
                    setStatus({ type: 'warning', msg: `Partial Success! Populated ${updateCount} of ${items.length} items. (Widget was too small). Use "Paste from other site" in Elementor.` });
                } else {
                    setStatus({ type: 'success', msg: `Success! Populated all ${updateCount} items and copied to clipboard. Use "Paste from other site" in Elementor.` });
                }
            }).catch(err => {
                setStatus({ type: 'error', msg: "Clipboard error. Check console." });
            });

        } catch (e) {
            setStatus({ type: 'error', msg: 'Error: ' + e.message });
        }
    };

    return (
        <div className="card">
            <title>Icon List Populator - Elementor Populator Tools</title>
            <meta name="description" content="Bulk populate Elementor Icon List widgets. Maintain rich text formatting like links, bold, and italics." />
            <h1>Elementor Icon List Populator</h1>



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
                    <li><strong>Prepare Content:</strong> Paste your list into the editor above. (You can use bullets, numbers, or just new lines).</li>
                    <li><strong>Prepare Elementor:</strong>
                        <ul>
                            <li>Create an <strong>Icon List</strong> widget.</li>
                            <li>Add enough list items (e.g., 20) to fit your content (use the duplicate button if needed).</li>
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
