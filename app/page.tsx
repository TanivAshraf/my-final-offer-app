import { createClient } from '@supabase/supabase-js'
export const revalidate = 0
export default async function Offers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return <p>Supabase environment variables are not set.</p>
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: offers, error } = await supabase.from('offer').select('*').order('created_at', { ascending: false })
  if (error) { return <p>Error fetching data: {error.message}</p> }
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Credit Card Offers</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>Live data gathered by our AI Agent.</p>
      {offers && offers.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {offers.map((offer) => (
            <div key={offer.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#f9f9f9' }}>
              <h2 style={{ marginTop: 0, color: '#111' }}>{offer.merchant_name || 'General Offer'}</h2>
              <p style={{ color: '#555' }}><strong>Offer:</strong> {offer.offer_details}</p>
              <p style={{ fontSize: '0.9em', color: '#777' }}>
                <strong>Bank:</strong> {offer.bank_name || 'Not specified'} | <strong>Card:</strong> {offer.card_name || 'All Cards'}
              </p>
              <a href={offer.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8em', color: '#0070f3' }}>
                View Source
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p>No offers found in the database yet.</p>
      )}
    </div>
  )
}
