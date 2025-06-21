import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Blockchain-based certificate verification system" />
        <meta name="keywords" content="blockchain, certificates, web3, ethereum, verification" />
        <meta name="author" content="Web3 Certificate Registry" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Web3 Meta Tags */}
        <meta property="og:title" content="Web3 Certificate Registry" />
        <meta property="og:description" content="Issue and verify certificates on the blockchain" />
        <meta property="og:type" content="website" />
        
        {/* Prevent FOUC (Flash of Unstyled Content) */}
        <style dangerouslySetInnerHTML={{
          __html: `
            body { margin: 0; padding: 0; }
            .loading { opacity: 0; }
          `
        }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}