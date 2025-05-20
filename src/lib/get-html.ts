import { Config } from './config';
import { getMarked } from './get-marked';

/**
 * Generates a HTML document from a markdown string and returns it as a string.
 */
export const getHtml = async (md: string, config: Config): Promise<string> => {
    const marked = await getMarked(config);

    return `<!DOCTYPE html>
<html>
    <head>
    <title>${config.document_title || ''}</title>
    <meta charset="utf-8"></head>
    <body class="${config.body_class.join(' ')}">
        ${marked(md)}
    </body>
</html>
`;
};
