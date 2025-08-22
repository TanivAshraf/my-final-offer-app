import { createClient } from '@supabase/supabase-js'
import OfferBrowser from './OfferBrowser' // We import our interactive component

// This special instruction tells Vercel to always get fresh data from the database.
export const revalidate = 0

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
        <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '50px' }}>
            <h1>Configuration Error</h1>
            <p>Supabase environment variables are not set correctly in Vercel.</p>
        </div>
    )
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: offers, error } = await supabase.from('offer').select('*').order('created_at', { ascending: false })

  if (error) {
    return <p style={{ fontFamily: 'sans-serif', color: 'red' }}>Error fetching data: {error.message}</p>
  }
  
  const lastSynced = offers && offers.length > 0 ? new Date(offers[0].created_at).toLocaleString() : 'N/A'
  const sources = offers && offers.length > 0 ? Array.from(new Set(offers.map(o => o.source_url))) : []

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#333' }}>Credit Card Offers</h1>
        <p style={{ color: '#666' }}>Live data gathered by the Offer Hunter AI Agent.</p>
        <p style={{ fontSize: '0.8em', color: '#999', margin: '0' }}>Last Synced: {lastSynced}</p>
        {/* --- THIS IS THE NEW LINE WE ADDED --- */}
        <p style={{ fontSize: '0.8em', color: '#999', marginTop: '4px' }}>Next Sync: Daily at 7:00 AM BDT</p>
      </header>
      
      <main>
        {offers && offers.length > 0 ? (
          <OfferBrowser offers={offers} />
        ) : (
          <p style={{ textAlign: 'center', color: '#888' }}>No offers found in the database yet. The agent might be on a mission!</p>
        )}
      </main>

      <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '0.8em', color: '#aaa' }}>
        <h3 style={{ color: '#666' }}>Data Sources</h3>
        <ul>
          {sources.map(source => (
            <li key={source}><a href={source} target="_blank" rel="noopener noreferrer">{source}</a></li>
          ))}
        </ul>
        <p>This is unverified data scraped from public sources. Use at your own risk.</p>
      </footer>
    </div>
  )
}
