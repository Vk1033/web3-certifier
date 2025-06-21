import '../styles/globals.css'
import { useEffect } from 'react'

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize any global Web3 configurations here
    if (typeof window !== 'undefined') {
      // Client-side only code
      console.log('🔗 Web3 Certificate Registry initialized');
    }
  }, [])

  return <Component {...pageProps} />
}

export default MyApp