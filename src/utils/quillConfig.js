import { Quill } from 'react-quill-new';

// 1. Custom Link Blot to remove target="_blank"
const Link = Quill.import('formats/link');

class CustomLink extends Link {
    static create(value) {
        const node = super.create(value);
        node.setAttribute('href', value);
        // By default, Quill adds target="_blank". We explicitly remove it or just don't set it.
        // However, super.create might have set it.
        node.removeAttribute('target');
        return node;
    }
}

CustomLink.blotName = 'link';
CustomLink.tagName = 'A';

// Register the custom blot
Quill.register(CustomLink, true); // true = overwrite existing

// 2. Stable Modules Configuration
export const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link']
    ]
};

export const quillFormats = [
    'header',
    'bold', 'italic',
    'list',
    'link'
];
