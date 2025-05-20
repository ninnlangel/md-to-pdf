import { Config } from './config';

export const getMarked = async (config: Config) => {
	if (config.markdown_parser === 'markdown-it') {
		const { getMarked } = await import('./markdown-it');
		return getMarked(config.markdown_it_options, Object.values(config.markdown_it_plugins));
	} else {
		const { getMarked } = await import('./get-marked-with-highlighter');
		return getMarked(config.marked_options, config.marked_extensions);
	}
};
