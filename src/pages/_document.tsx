import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* No base tag - let the browser handle URLs normally */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
