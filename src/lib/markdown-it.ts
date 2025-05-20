import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItCallouts from 'markdown-it-callouts'; // <-- Add this import

type MarkedLikeFunction = (markdown: string) => string;

export const getMarked = (options: any = {}, extensions: any[] = []) => {
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        langPrefix: 'hljs ',
        highlight: (code: string, language: string) => {
            const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
            return hljs.highlight(code, { language: validLanguage }).value;
        },
        ...options,
    });

    // Always enable markdown-it-callouts by default
    md.use(markdownItCallouts);

    if (options.headerIDs !== false) {
        md.use(markdownItAnchor, {
            permalink: false,
            slugify: (str: string) => {
                return str
                    .toLowerCase()
                    .replace(/[\s]+/g, '-')
                    .replace(/[^\w-]/g, '');
            },
        });
    }

    extensions.forEach((plugin) => {
        if (typeof plugin === 'function') {
            md.use(plugin);
        } else if (plugin && typeof plugin === 'object') {
            if (plugin.plugin && typeof plugin.plugin === 'function') {
                md.use(plugin.plugin, ...(plugin.options || []));
            }
        }
    });

    const markedLike: MarkedLikeFunction & { setOptions?: any; use?: any } =
        (markdown: string) => md.render(markdown);

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
