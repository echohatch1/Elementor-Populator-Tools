
export function parseByHeadings(root) {
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

export function parseByBold(root) {
    const items = [];
    let currentItem = null;

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
                const text = node.textContent.trim();
                const boldNode = node.querySelector('b, strong');

                // Check if the block's text matches the bold tag's text (ignoring whitespace)
                if (text.length > 0 && boldNode) {
                    const boldText = boldNode.textContent.trim();
                    if (text === boldText) {
                        isTitle = true;
                        titleText = text;
                    }
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

export function parseByColon(root) {
    const items = [];
    // Get block level elements
    const lines = Array.from(root.querySelectorAll('div, p, li'));

    // If no blocks, try splitting by <br> if user just pasted plain text with BRs
    // (Existing Fallback for plain text, slightly improved to wrap in Divs)
    if (lines.length === 0 && root.innerHTML.includes('<br>')) {
        const brLines = root.innerHTML.split(/<br\/?>/i);
        brLines.forEach(lineHtml => {
            if (!lineHtml.trim()) return;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = lineHtml;
            const result = splitBlockHtml(tempDiv);
            if (result) {
                items.push({
                    title: result.title.trim(),
                    content: result.content.trim()
                });
            }
        });
        return items;
    }

    lines.forEach(line => {
        const result = splitBlockHtml(line);
        if (result) {
            items.push({
                title: result.title.trim(),
                content: result.content.trim()
            });
        }
    });

    return items;
}

// Helper to split a block's HTML by the first colon
function splitBlockHtml(block) {
    if (!block.textContent.includes(':')) return null;

    // 1. Find the text node containing the first colon
    let colonNode = null;
    let colonOffset = -1;

    // TreeWalker to find text node
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null, false);
    let currentNode;
    while (currentNode = walker.nextNode()) {
        const idx = currentNode.textContent.indexOf(':');
        if (idx !== -1) {
            colonNode = currentNode;
            colonOffset = idx;
            break;
        }
    }

    if (!colonNode) return null;

    // 2. Clone the block twice: one for Title, one for Content
    const titleBlock = block.cloneNode(true);
    const contentBlock = block.cloneNode(true);

    // 3. Process Title Block: Remove everything AFTER the colon
    const titleWalker = document.createTreeWalker(titleBlock, NodeFilter.SHOW_TEXT, null, false);
    let titleColonNode = null;
    let index = 0;
    // We need to find the equivalent node in the clone. 
    // Since we just cloned, the traversal order is identical.
    // We count nodes to match? Or just search for the same text content approach (risky if duplicates)?
    // Robust way: Find matching node by path? 
    // Easier: Just re-traverse and find the *first* colon again. It must be the same one.
    while (currentNode = titleWalker.nextNode()) {
        const idx = currentNode.textContent.indexOf(':');
        if (idx !== -1) {
            titleColonNode = currentNode;
            // Truncate text at colon
            currentNode.textContent = currentNode.textContent.substring(0, idx);
            break;
        }
    }

    // Now remove all subsequent nodes in the Title Block
    // Logic: Walk backwards from end, removing nodes until we hit titleColonNode?
    // Or: Helper to deleteAfter(node, root)
    deleteFollowingNodes(titleColonNode, titleBlock);


    // 4. Process Content Block: Remove everything BEFORE the colon
    const contentWalker = document.createTreeWalker(contentBlock, NodeFilter.SHOW_TEXT, null, false);
    let contentColonNode = null;
    while (currentNode = contentWalker.nextNode()) {
        const idx = currentNode.textContent.indexOf(':');
        if (idx !== -1) {
            contentColonNode = currentNode;
            // Truncate text after colon
            currentNode.textContent = currentNode.textContent.substring(idx + 1);
            break;
        }
    }

    // Remove all preceding nodes
    deletePrecedingNodes(contentColonNode, contentBlock);

    return {
        title: titleBlock.innerHTML, // HTML Preserved!
        content: contentBlock.innerHTML // HTML Preserved!
    };
}

function deleteFollowingNodes(targetNode, root) {
    let curr = targetNode;
    while (curr !== root) {
        while (curr.nextSibling) {
            curr.parentNode.removeChild(curr.nextSibling);
        }
        curr = curr.parentNode;
    }
}

function deletePrecedingNodes(targetNode, root) {
    let curr = targetNode;
    while (curr !== root) {
        while (curr.previousSibling) {
            curr.parentNode.removeChild(curr.previousSibling);
        }
        curr = curr.parentNode;
    }
}

export function findWidgetRecursive(node, widgetType) {
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
