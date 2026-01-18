function process() {
    const textInput = document.getElementById('textList').value;
    const elementorInput = document.getElementById('elementorCode').value;
    const msg = document.getElementById('msg');

    if (!textInput || !elementorInput) {
        msg.style.color = "red";
        msg.innerText = "Please fill both boxes!";
        return;
    }

    // 1. Process Text List
    const listItems = textInput.trim().split('\n')
        .filter(line => line.includes(':'))
        .map(line => {
            const splitIndex = line.indexOf(':');
            return {
                title: line.substring(0, splitIndex).trim(),
                content: line.substring(splitIndex + 1).trim()
            };
        });

    if (listItems.length === 0) {
        msg.style.color = "red";
        msg.innerText = "No valid items found in list! Format should be 'Title: Content'";
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

            accordionItems[i].item_title = listItems[i].title;

            const container = contentContainers[i];
            const textEditor = findWidgetRecursive(container, 'text-editor');

            if (textEditor) {
                textEditor.settings.editor = `<p>${listItems[i].content}</p>`;
                updateCount++;
            } else {
                console.warn(`Item ${i + 1}: Could not find a Text Editor widget inside the accordion item.`);
            }
        }

        // 4. Output
        const result = JSON.stringify(data);

        navigator.clipboard.writeText(result).then(() => {
            msg.style.color = "green";
            msg.innerText = `Success! Populated ${updateCount} items. Use 'Paste from other site' in Elementor.`;
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

// Recursive helper to find a specific widget type
function findWidgetRecursive(node, widgetType) {
    if (!node) return null;

    if (node.elType === 'widget' && node.widgetType === widgetType) {
        return node;
    }

    if (node.elements && node.elements.length > 0) {
        for (const child of node.elements) {
            const found = findWidgetRecursive(child, widgetType);
            if (found) return found;
        }
    }

    return null;
}
