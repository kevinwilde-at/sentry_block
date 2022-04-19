const createBundler = require('@airtable/blocks-webpack-bundler').default;
const SentryPlugin = require("@sentry/webpack-plugin");
const SentryConfig = require('./sentryConfig');

function createConfig(baseConfig) {
    if (baseConfig.mode === 'production') {
        baseConfig.devtool = 'source-map';
        baseConfig.plugins = (baseConfig.plugins || []).concat([
            new SentryPlugin({
                release: SentryConfig.RELEASE_VERSION,
                include: "./.tmp/dist",
            }),
        ]);
    }

    return baseConfig;
}

exports.default = () => {
	return createBundler(createConfig)
}
