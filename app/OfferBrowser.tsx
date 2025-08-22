// This is a special instruction that tells Next.js this is an interactive component that runs in the user's browser.
'use client'

import { useState, useMemo } from 'react'

// This defines what a single "offer" object looks like.
type Offer = {
  id: number;
  bank_name: string;
  card_name: string;
  merchant_name: string;
  offer_details: string;
  source_url: string;
};

// This is our main component. It receives the full list of offers as a "prop".
export default function OfferBrowser({ offers }: { offers: Offer[] }) {
  // We use React's "useState" to keep track of which tab is currently active.
  // We start with the 'All' tab selected.
  const [activeTab, setActiveTab] = useState('All')

  // We use "useMemo" to efficiently get a unique list of bank names from all the offers.
  // This list will be used to create our tabs.
  const banks = useMemo(() => {
    const bankSet = new Set(offers.map(offer => offer.bank_name || 'Other'))
    return ['All', ...Array.from(bankSet)]
  }, [offers])

  // This is our filtering logic. It shows only the offers that match the active tab.
  const filteredOffers = useMemo(() => {
    if (activeTab === 'All') {
      return offers
    }
    return offers.filter(offer => (offer.bank_name || 'Other') === activeTab)
  }, [offers, activeTab])

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {banks.map(bank => (
          <button
            key={bank}
            onClick={() => setActiveTab(bank)}
            style={{
              padding: '10px 15px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: activeTab === bank ? '#0070f3' : '#f0f0f0',
              color: activeTab === bank ? 'white' : 'black',
              fontWeight: activeTab === bank ? 'bold' : 'normal'
            }}
          >
            {bank}
          </button>
        ))}
      </div>

      {/* Offer List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredOffers.length > 0 ? (
          filteredOffers.map((offer) => (
            <div key={offer.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h2 style={{ marginTop: 0, color: '#111', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>{offer.merchant_name || 'General Offer'}</h2>
              <p style={{ color: '#555', lineHeight: '1.6' }}><strong>Offer:</strong> {offer.offer_details}</p>
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', fontSize: '0.9em', color: '#777' }}>
                <p style={{ margin: '5px 0' }}><strong>Bank:</strong> {offer.bank_name || 'Not specified'}</p>
                <p style={{ margin: '5px 0' }}><strong>Card:</strong> {offer.card_name || 'All Cards'}</p>
                <a href={offer.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', textDecoration: 'none' }}>
                  View Source
                </a>
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#888' }}>No offers found for this bank.</p>
        )}
      </div>
    </div>
  )
}
