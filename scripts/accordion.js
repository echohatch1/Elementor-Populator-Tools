// Initialize Quill
var quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link']
        ]
    }
});

function process() {
    // Read from Quill's root
    const richInput = quill.root;
    const elementorInput = document.getElementById('elementorCode').value;
    const msg = document.getElementById('msg');

    // Get Selected Strategy
    const strategy = document.querySelector('input[name="splitStrategy"]:checked').value;

    if (!richInput.innerText.trim() || !elementorInput) {
        msg.style.color = "red";
        msg.innerText = "Please fill both boxes!";
        return;
    }

    // 1. Parse Content based on Strategy
    // We create a temp container to traverse the DOM (Clone Quill root)
    const temp = document.createElement('div');
    temp.innerHTML = richInput.innerHTML;

    let listItems = [];

    try {
        if (strategy === 'heading') {
            listItems = parseByHeadings(temp);
        } else if (strategy === 'bold') {
            listItems = parseByBold(temp);
        } else {
            listItems = parseByColon(temp); // Modified for Rich Text
        }
    } catch (e) {
        msg.style.color = "red";
        msg.innerText = "Parsing Error: " + e.message;
        return;
    }

    if (listItems.length === 0) {
        msg.style.color = "red";
        msg.innerText = "No items found. Check your formatting or selected strategy.";
        return;
    }

    try {
        // 2. Parse Elementor JSON
        let data;
        try {
            data = JSON.parse(elementorInput);
        } catch (e) {
            throw new Error("Invalid JSON in Elementor Code box. Please make sure you copied the entire widget code.");
        }

        // Locate the Accordion Widget
        let widget = null;

        const isAccordion = (node) => {
            return node.elType === 'widget' &&
                node.settings &&
                Array.isArray(node.settings.items) &&
                Array.isArray(node.elements);
        };

        if (Array.isArray(data)) {
            widget = data.find(isAccordion) || (data.length > 0 && isAccordion(data[0]) ? data[0] : null);
        } else if (data.elType === 'widget') {
            if (isAccordion(data)) widget = data;
        } else if (data.elements) {
            widget = Array.isArray(data.elements) ? data.elements.find(isAccordion) : null;
        }

        if (!widget) throw new Error("Could not find a valid Nested Accordion widget structure. Ensure you copied a Nested Accordion.");

        // 3. Update Data
        const accordionItems = widget.settings.items; // Control titles
        const contentContainers = widget.elements;    // Structure containers

        let updateCount = 0;

        for (let i = 0; i < listItems.length; i++) {
            if (i >= accordionItems.length || i >= contentContainers.length) break;

            // A. Update Title (strip HTML from title for safety/cleanliness, usually titles are plain text in Elementor settings)
            // But we can keep it if needed. Elementor titles are usually plain text.
            accordionItems[i].item_title = listItems[i].title.replace(/<[^>]*>/g, '').trim();

            // B. Update Content
            const container = contentContainers[i];
            const textEditor = findWidgetRecursive(container, 'text-editor');

            if (textEditor) {
                // Ensure content is wrapped in something block-level if it's just text, 
                // but our parser generally returns HTML string.
                textEditor.settings.editor = listItems[i].content;
                updateCount++;
            } else {
                console.warn(`Item ${i + 1}: Could not find a Text Editor widget inside the accordion item.`);
                msg.style.color = "red";
                msg.innerText = `Validation Error: Accordion Item #${i + 1} does not contain a 'Text Editor' widget. This tool requires all accordion items to have a Text Editor inside.`;
                return;
            }
        }

        // 4. Output
        if (updateCount === 0 && listItems.length > 0) {
            msg.style.color = "red";
            msg.innerText = "Error: Titles were updated, but no content could be populated. No internal 'Text Editor' widgets were found.";
            return;
        }

        // 4. Output
        const result = JSON.stringify(data);

        navigator.clipboard.writeText(result).then(() => {
            if (listItems.length > updateCount) {
                msg.style.color = "#d97706"; // Amber/Orange
                msg.innerText = `Partial Success! Populated ${updateCount} of ${listItems.length} items. (Widget was too small). Use 'Paste from other site' in Elementor.`;
            } else {
                msg.style.color = "green";
                msg.innerText = `Success! Populated all ${updateCount} items. Use 'Paste from other site' in Elementor.`;
            }
        }).catch(err => {
            console.error(err);
            msg.style.color = "red";
            msg.innerText = "Browser blocked clipboard copy. See console for output.";
        });

    } catch (e) {
        msg.style.color = "red";
        msg.innerText = "Error: " + e.message;
        console.error(e);
    }
}

// --- Parsing Strategies ---

function parseByHeadings(root) {
    const items = [];
    let currentItem = null;

    // Traverse all children
    Array.from(root.childNodes).forEach(node => {
        // If element is H1-H6
        if (node.nodeType === 1 && /^H[1-6]$/.test(node.tagName)) {
            // Push previous item if exists
            if (currentItem) items.push(currentItem);

            // Start new item
            currentItem = {
                title: node.textContent.trim(), // Title is just text
                content: ""
            };
        } else {
            // Add to current item content
            if (currentItem) {
                const html = node.nodeType === 3 ? node.textContent : node.outerHTML;
                // If it's a BR or empty text, minimize
                if (html) currentItem.content += html;
            }
        }
    });

    // Push last item
    if (currentItem) items.push(currentItem);
    return items;
}

function parseByBold(root) {
    const items = [];
    let currentItem = null;

    // We assume a "Bold Line" is a block element (div/p) containing ONLY bold text, 
    // OR a <b>/<strong> tag that is a direct child (or wrapped in block).

    // Easier approach: Iterate children. If a child looks like a "Bold Title", start new item.
    // Definition of Bold Title:
    // 1. It is a <b> or <strong> element.
    // 2. OR it is a <p>/<div> that contains ONLY <b>/<strong> text.

    Array.from(root.childNodes).forEach(node => {
        let isTitle = false;
        let titleText = "";

        if (node.nodeType === 1) {
            // Check if it is B/STRONG
            if (['B', 'STRONG'].includes(node.tagName)) {
                isTitle = true;
                titleText = node.textContent;
            }
            // Check if it is a block containing only B/STRONG
            else if (['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.tagName)) {
                // Check if innerHTML is effectively just a bold tag
                // Simple strip check
                const text = node.textContent.trim();
                if (text.length > 0 && node.querySelector('b, strong') && node.innerText === text) {
                    // It's a bit loose, but works for "whole line bold"
                    isTitle = true;
                    titleText = text;
                }
            }
        }

        if (isTitle) {
            if (currentItem) items.push(currentItem);
            currentItem = { title: titleText.trim(), content: "" };
        } else {
            if (currentItem) {
                const html = node.nodeType === 3 ? node.textContent : node.outerHTML;
                currentItem.content += html;
            }
        }
    });

    if (currentItem) items.push(currentItem);
    return items;
}

function parseByColon(root) {
    // This is trickier with Rich Text because the colon might be inside a tag.
    // We will assume that each "Line" (Div or P) is a separate item.
    // If a line has a colon, split it.

    const items = [];

    // Get block level elements
    const lines = Array.from(root.querySelectorAll('div, p, li'));

    // If no blocks, try splitting by <br> if user just pasted plain text with BRs
    if (lines.length === 0 && root.innerHTML.includes('<br>')) {
        // Fallback for simple BR separated text
        const brLines = root.innerHTML.split(/<br\/?>/i);
        brLines.forEach(lineHtml => {
            const div = document.createElement('div');
            div.innerHTML = lineHtml;
            const text = div.textContent;
            const colonIdx = text.indexOf(':');
            if (colonIdx > -1) {
                items.push({
                    title: text.substring(0, colonIdx).trim(),
                    content: text.substring(colonIdx + 1).trim()
                });
            }
        });
        return items;
    }

    lines.forEach(line => {
        const text = line.textContent || "";
        const colonIdx = text.indexOf(':');

        if (colonIdx > 0) { // Has colon, not at start
            items.push({
                title: text.substring(0, colonIdx).trim(),
                content: text.substring(colonIdx + 1).trim() // Note: This loses formatting on the content line. 
                // For fully rich content, "Heading" strategy is better. 
                // Colon strategy implies simple "Key: Value" usually.
            });
        }
    });

    return items;
}

// Recursive helper to find a specific widget type
function findWidgetRecursive(node, widgetType) {
    if (!node) return null;

    // Check self
    if (node.elType === 'widget' && node.widgetType === widgetType) {
        return node;
    }

    // Check children
    if (node.elements && node.elements.length > 0) {
        for (const child of node.elements) {
            const found = findWidgetRecursive(child, widgetType);
            if (found) return found;
        }
    }

    return null;
}
