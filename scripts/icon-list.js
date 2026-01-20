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
    const richBox = quill.root;
    const elementorInput = document.getElementById('elementorCode').value;
    const msg = document.getElementById('msg');

    if (!elementorInput) {
        msg.style.color = "red";
        msg.innerText = "Please paste your Elementor code!";
        return;
    }

    // --- STEP 1: Flatten the List ---
    const temp = document.createElement('div');
    temp.innerHTML = richBox.innerHTML;

    let items = Array.from(temp.querySelectorAll('li, p, div'))
        .map(el => el.innerHTML.trim())
        .filter(html => html.length > 0 && html !== '<br>');

    // Fallback
    if (items.length === 0) {
        items = richBox.innerHTML.split(/<br\/?>/gi)
            .map(item => item.trim())
            .filter(item => item.length > 0);
    }

    if (items.length === 0) {
        msg.style.color = "red";
        msg.innerText = "No content found in the text box.";
        return;
    }

    // --- STEP 2: JSON Parsing & Replacement ---
    try {
        let data;
        try {
            data = JSON.parse(elementorInput);
        } catch (e) {
            throw new Error("Invalid JSON. Please copy the text exactly from Elementor.");
        }

        const findIconListWidget = (node) => {
            if (!node) return null;
            if (node.widgetType === 'icon-list') return node;

            if (node.elements && Array.isArray(node.elements)) {
                for (const child of node.elements) {
                    const found = findIconListWidget(child);
                    if (found) return found;
                }
            }
            return null;
        };

        let widget = null;
        const roots = Array.isArray(data) ? data : [data];

        for (const root of roots) {
            widget = findIconListWidget(root);
            if (widget) break;
        }

        if (!widget) throw new Error("Could not find an 'Icon List' widget in the pasted code.");
        if (!widget.settings || !Array.isArray(widget.settings.icon_list)) {
            throw new Error("Widget found but it has no 'icon_list' items structure.");
        }

        const iconItems = widget.settings.icon_list;
        let updateCount = 0;

        for (let i = 0; i < items.length; i++) {
            if (i >= iconItems.length) break;

            // Quill output is generally cleaner, but we still strip block tags to just get inner content if needed within Elementor's strict fields
            // For Icon List 'text' field, it accepts some HTML but generally expects inline content.
            // Quill wraps lines in <p> by default. We want just the content inside the <p> or <li>.

            // Note: If the item coming from 'items' array (flattened) is "Some <b>Bold</b> Text", that is good.
            // If it is "<p>Some Text</p>", the regex below strips the P.

            let cleanContent = items[i].replace(/<\/?(li|ul|ol|p|div|h[1-6])[^>]*>/gi, '');
            iconItems[i].text = cleanContent;
            updateCount++;
        }

        const result = JSON.stringify(data);

        navigator.clipboard.writeText(result).then(() => {
            msg.style.color = "green";
            msg.innerText = `Success! Populated icon list with ${updateCount} items. Use 'Paste from other site' in Elementor.`;
        }).catch(err => {
            msg.style.color = "red";
            msg.innerText = "Clipboard error. Check browser console.";
            console.error(err);
        });

    } catch (e) {
        msg.style.color = "red";
        msg.innerText = "Error: " + e.message;
        console.error(e);
    }
}
