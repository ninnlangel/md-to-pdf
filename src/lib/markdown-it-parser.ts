import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

// Create a type that mimics the marked function signature
type MarkedLikeFunction = (markdown: string, options?: any) => string;

export const getMarked = (options: any = {}, extensions: any[] = []) => {
    // Create the markdown-it instance with similar configuration
    const md = new MarkdownIt({
        highlight: (code: string, language: string) => {
            const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
            return hljs.highlight(code, { language: validLanguage }).value;
        },
        langPrefix: 'hljs ',
        html: true,  // Often needed to match marked behavior
        ...options,
    });

    // Apply plugins (equivalent to extensions in marked)
    extensions.forEach((plugin) => {
        if (typeof plugin === 'function') {
            md.use(plugin);
        } else if (plugin && typeof plugin === 'object') {
            // Handle plugin objects if needed
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
