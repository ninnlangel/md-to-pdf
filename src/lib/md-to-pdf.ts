import { promises as fs } from 'fs';
const { mkdir } = fs;
import grayMatter from 'gray-matter';
import { dirname, relative, resolve } from 'path';
import { Browser } from 'puppeteer';
import { Config } from './config';
import { generateOutput } from './generate-output';
import { getHtml } from './get-html';
import { getOutputFilePath } from './get-output-file-path';
import { getMarginObject } from './helpers';
import { readFile } from './read-file';

type CliArgs = typeof import('../cli').cliFlags;

export const convertMdToPdf = async (
	input: { path: string } | { content: string },
	config: Config,
	{
		args = {} as CliArgs,
		browser,
	}: {
		args?: CliArgs;
		browser?: Browser;
	} = {},
) => {
	const mdFileContent =
		'content' in input
			? input.content
			: await readFile(input.path, args['--md-file-encoding'] ?? config.md_file_encoding);

	const { content: md, data: frontMatterConfig } = grayMatter(
		mdFileContent,
		args['--gray-matter-options'] ? JSON.parse(args['--gray-matter-options']) : config.gray_matter_options,
	);

	if (frontMatterConfig && typeof frontMatterConfig === 'object') {
		config = {
			...config,
			...(frontMatterConfig as Config),
			pdf_options: { ...config.pdf_options, ...frontMatterConfig.pdf_options },
		};
	} else {
		console.warn('Warning: Invalid front-matter configuration. Skipping merge.');
	}

	const { headerTemplate, footerTemplate, displayHeaderFooter } = config.pdf_options;

	if ((headerTemplate || footerTemplate) && displayHeaderFooter === undefined) {
		config.pdf_options.displayHeaderFooter = true;
	}

	const arrayOptions = ['body_class', 'script', 'stylesheet'] as const;

	for (const option of arrayOptions) {
		if (!Array.isArray(config[option])) {
			config[option] = [config[option]].filter(Boolean) as any;
		}
	}

	const jsonArgs = new Set(['--marked-options', '--pdf-options', '--launch-options']);

	for (const arg of Object.entries(args)) {
		const [argKey, argValue] = arg as [string, string];
		const key = argKey.slice(2).replace(/-/g, '_');

		try {
			(config as Record<string, any>)[key] = jsonArgs.has(argKey) ? JSON.parse(argValue) : argValue;
		} catch (error) {
			const err = error as Error; // Assert error as Error
			console.warn(`Warning: Failed to parse argument ${argKey}: ${err.message}`);
		}
	}

	if (typeof config.pdf_options.margin === 'string') {
		config.pdf_options.margin = getMarginObject(config.pdf_options.margin);
	}

	if (config.dest === undefined) {
		config.dest = 'path' in input ? getOutputFilePath(input.path, config.as_html ? 'html' : 'pdf') : 'stdout';
	}

	let highlightStylesheet;
	try {
		highlightStylesheet = resolve(
			dirname(require.resolve('highlight.js')),
			'..',
			'styles',
			`${config.highlight_style}.css`,
		);
	} catch (error) {
		const err = error as Error; // Assert error as Error
		throw new Error(`Failed to resolve highlight.js stylesheet: ${err.message}`);
	}

	config.stylesheet = [...new Set([...config.stylesheet, highlightStylesheet])];

	const html = await getHtml(md, config);

	const relativePath = 'path' in input ? relative(config.basedir, input.path) : '.';

	const output = await generateOutput(html, relativePath, config, browser);

	if (!output) {
		if (config.devtools) {
			throw new Error('No file is generated with --devtools. Check the browser console for errors.');
		}

		throw new Error(`Failed to create ${config.as_html ? 'HTML' : 'PDF'}. Ensure the input is valid and all dependencies are installed.`);
	}

	if (output.filename) {
		if (output.filename === 'stdout') {
			process.stdout.write(output.content);
		} else {
			await mkdir(dirname(output.filename), { recursive: true });
			await fs.writeFile(output.filename, output.content);
		}
	}

	return output;
};
