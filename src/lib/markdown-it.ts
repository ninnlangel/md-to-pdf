import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import markdownItAnchor from 'markdown-it-anchor'; // Import markdown-it-anchor

// Create a type that mimics the marked function signature
type MarkedLikeFunction = (markdown: string) => string;

export const getMarked = (options: any = {}, extensions: any[] = []) => {
    // Create the markdown-it instance with built-in syntax highlighting
    const md = new MarkdownIt({
        html: true, // Allow HTML tags in the Markdown
        linkify: true, // Automatically convert URLs into clickable links
        typographer: true, // Enable smart quotes and other typographic replacements
        langPrefix: 'hljs ', // Add a class prefix for syntax highlighting
        highlight: (code: string, language: string) => {
            const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
            return hljs.highlight(code, { language: validLanguage }).value;
        },
        ...options, // Allow overriding default options
    });

    // Conditionally apply markdown-it-anchor plugin
    if (options.headerIDs !== false) {
        md.use(markdownItAnchor, {
            permalink: false,
            slugify: (str: string) => {
                // Example: Convert to lowercase, replace spaces with dashes, and remove special characters
                return str
                    .toLowerCase()
                    .replace(/[\s]+/g, '-') // Replace spaces with dashes
                    .replace(/[^\w-]/g, ''); // Remove non-alphanumeric characters
            },
        });
    }


    // Apply additional plugins (extensions)
    extensions.forEach((plugin) => {
        if (typeof plugin === 'function') {
            md.use(plugin);
        } else if (plugin && typeof plugin === 'object') {
            if (plugin.plugin && typeof plugin.plugin === 'function') {
                md.use(plugin.plugin, ...(plugin.options || []));
            }
        }
    });

    // Create a function that mimics marked's interface
    const markedLike: MarkedLikeFunction & { setOptions?: any; use?: any } =
        (markdown: string) => md.render(markdown);

    // Add methods to maintain compatibility with code that might call them
    markedLike.setOptions = (newOptions: any) => {
        Object.assign(md.options, newOptions);
        return markedLike;
    };

    markedLike.use = (plugin: any, ...pluginOptions: any[]) => {
        md.use(plugin, ...pluginOptions);
        return markedLike;
    };

    return markedLike;
};
