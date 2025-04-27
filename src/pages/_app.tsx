import { useEffect } from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';

export default function MyApp({ Component, pageProps }: AppProps) {
  // Fix script loading and Promise handling issues
  useEffect(() => {
    // Fix Promise rendering issues
    const originalToString = Object.prototype.toString;
    Promise.prototype.toString = function() {
      return '[Promise]';
    };

    // Fix JSON.stringify for Promises
    const originalJSONStringify = JSON.stringify;
    JSON.stringify = function(value, ...args) {
      // Replace Promise objects with a placeholder before stringifying
      const replacer = (key, val) => {
        if (val instanceof Promise) {
          return '[Promise]';
        }
        return val;
      };

      // Use our custom replacer along with any existing replacer
      if (args[0]) {
        const originalReplacer = args[0];
        if (typeof originalReplacer === 'function') {
          args[0] = (key, val) => replacer(key, originalReplacer(key, val));
        } else if (Array.isArray(originalReplacer)) {
          // If it's an array replacer, we still need to check for promises
          args[0] = (key, val) => {
            if (originalReplacer.includes(key) || key === '') {
              return replacer(key, val);
            }
            return undefined;
          };
        }
      } else {
        args.unshift(replacer);
      }

      return originalJSONStringify(value, ...args);
    };
    // Get the current origin dynamically
    const currentOrigin = window.location.origin;

    // Fix script loading from wrong port
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string') {
        // Replace any localhost URL with the current origin
        const localhostRegex = /http:\/\/localhost:\d+\//;
        if (localhostRegex.test(url)) {
          url = url.replace(localhostRegex, `${currentOrigin}/`);
        }
      }
      return originalFetch(url, options);
    };

    // Fix script src attributes
    function fixScriptSrc() {
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach(script => {
        const localhostRegex = /http:\/\/localhost:\d+\//;
        if (typeof script.src === 'string' && localhostRegex.test(script.src)) {
          script.src = script.src.replace(localhostRegex, `${currentOrigin}/`);
        }
      });
    }

    // Run immediately and also after DOM is loaded
    fixScriptSrc();
    document.addEventListener('DOMContentLoaded', fixScriptSrc);

    // Clean up
    return () => {
      document.removeEventListener('DOMContentLoaded', fixScriptSrc);
      // Restore original methods
      Promise.prototype.toString = originalToString;
      JSON.stringify = originalJSONStringify;
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
