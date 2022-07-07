# sentry_block

Airtable block that sends errors and source maps to Sentry.

```
npm i @sentry/browser @sentry/tracing
npm i --save-dev @airtable/blocks-webpack-bundler @sentry/webpack-plugin
```

Create a custom bundler 
```js
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
```

Update `block.json` to point to this custom bundler
```diff
{
    "version": "1.0",
-    "frontendEntry": "./frontend/index.js"
+    "frontendEntry": "./frontend/index.js",
+    "bundler": {
+        "module": "./bundler.js"
+    }
}
```

Create a `.sentryclirc` file, replacing the org, project, and token with your own.
```
[defaults]
url = https://sentry.io/
org = <your org>
project = <your project>

[auth]
token = <your auth token>
```

Create a file that holds Sentry configuration information. I chose to make `sentryConfig.js` so that I could reference the release version in both the bundler and the frontend code. Replace the DNS constant with your DNS.
```
exports.DNS = 'YOUR DNS';
exports.RELEASE_VERSION = '1.0.0';
```

Update your frontend code to create a Sentry `BrowserClient` and attach a global error listener.
```diff
import {initializeBlock} from '@airtable/blocks/ui';
import React from 'react';
+import * as Sentry from '@sentry/browser';
+import {BrowserTracing} from '@sentry/tracing';
+import SentryConfig from '../sentryConfig';
+
+const BUNDLE_REGEX = new RegExp(/^https:\/\/cdn\.airtableblocks\.com\/.+\/bundle\.js$/)
+
+const client = new Sentry.BrowserClient({
+    release: SentryConfig.RELEASE_VERSION,
+    dsn: SentryConfig.DNS,
+    integrations: [...Sentry.defaultIntegrations, new BrowserTracing()],
+
+    // Set tracesSampleRate to 1.0 to capture 100%
+    // of transactions for performance monitoring.
+    // We recommend adjusting this value in production
+    tracesSampleRate: 1.0,

+    // Rewrite frame filename to match artifact uploaded to Sentry.
+    // The blocks CLI uploads artifacts named ~/bundle.js and ~/bundle.js.map
+    // to Sentry. However, bundle.js is actually served from
+    // https://cdn.airtableblocks.com/<some-ID>/bundle.js
+    // When Sentry gets an error from this file, it looks for a sourcemap
+    // at ~/<some-ID>/bundle.js.map.
+    // The solution is usually to upload the artifacts to Sentry with the
+    // same prefix that they are served from, but we can't do this because
+    // <some-ID> is not known to us (it's set by Airtable). Instead, we can
+    // modify the frame filenames in the stacktrace to match the Sentry
+    // artifact before we send the event to Sentry. We just need to rewrite
+    // the filename to any url where the pathname is /bundle.js (host doesn't
+    // actually matter). This way Sentry will look for a sourcemap at
+    // ~/bundle.js.map and find it.
+    beforeSend: (sentryEvent) => {
+      if (Array.isArray(sentryEvent.exception.values)) {
+        for (const exceptionValue of sentryEvent.exception.values) {
+          if (exceptionValue.stacktrace?.frames) {
+            for (const frame of exceptionValue.stacktrace.frames) {
+              if (frame.filename.match(BUNDLE_REGEX)) {
+                frame.filename = 'https://cdn.airtableblocks.com/bundle.js'
+              }
+            }
+          }
+        }
+      }
+      return sentryEvent
+    }
+});
+window.addEventListener('error', function (err) {
+    client.captureException(err)
+});

function HelloWorldApp() {
    // YOUR CODE GOES HERE
    return <div>Hello world</div>
}

initializeBlock(() => <HelloWorldApp />);
```
