import {initializeBlock} from '@airtable/blocks/ui';
import React from 'react';
import * as Sentry from '@sentry/browser';
import {BrowserTracing} from '@sentry/tracing';
import SentryConfig from '../sentryConfig';

const client = new Sentry.BrowserClient({
    release: SentryConfig.RELEASE_VERSION,
    dsn: SentryConfig.DNS,
    integrations: [...Sentry.defaultIntegrations, new BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});
window.addEventListener('error', function (err) {
    client.captureException(err)
});

function HelloWorldApp() {
    // YOUR CODE GOES HERE
    return (
        <div>
            <div>Hello world 🚀</div>
            <div>
                <button
                    onClick={() => {
                        throw new Error('test4')
                    }}
                >
                    Throw error
                </button>
            </div>
        </div>
    );
}

initializeBlock(() => <HelloWorldApp />);
