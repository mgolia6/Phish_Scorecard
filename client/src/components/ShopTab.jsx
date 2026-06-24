import React from 'react';

const PRODUCTS = [
  {
    id: 'tshirt',
    name: 'PHREEZER LOGO T-SHIRT',
    sub: 'Ice Blue Tech Typography',
    price: 'From $23.99',
    desc: 'Softstyle tee. Phreezer snowflake logo across the chest. 100% ring-spun cotton, OEKO-TEX certified. Multiple colors and sizes.',
    url: 'https://mattymattemodgepodge.etsy.com/listing/4521116067',
    img: 'https://i.etsystatic.com/65030338/r/il/d9b7e1/8178642947/il_794xN.8178642947_6oe7.jpg',
    color: 'var(--cyan)',
    tag: 'T-SHIRT',
  },
  {
    id: 'sticker',
    name: 'PHREEZER LOGO BUMPER STICKER',
    sub: 'Snowflake Tech Decal',
    price: '$11.99',
    desc: 'Matte finish, UV-resistant, waterproof. Sticks to bumpers, laptops, water bottles, and anything else that needs a little phreezing.',
    url: 'https://mattymattemodgepodge.etsy.com/listing/4521118995',
    img: 'https://i.etsystatic.com/65030338/r/il/109253/8130742818/il_794xN.8130742818_7dzl.jpg',
    color: 'var(--orange)',
    tag: 'STICKER',
  },
];

export function ShopTab() {
  return (
    <div style={{ padding: '16px 12px 60px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(51,255,51,0.1)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '4px', color: 'rgba(51,255,51,0.5)', marginBottom: 8 }}>
          ◈ PHREEZER MERCH
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
          Represent at lot. Every purchase supports an independent fan project.<br />
          Ships via Etsy · Fulfilled by Printify
        </div>
      </div>

      {/* Product cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {PRODUCTS.map(p => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderTop: `2px solid ${p.color}`,
              overflow: 'hidden',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 0 24px ${p.color}22`;
                e.currentTarget.style.borderColor = `${p.color}88`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              {/* Product image */}
              <div style={{ width: '100%', height: 220, overflow: 'hidden', background: '#111' }}>
                <img
                  src={p.img}
                  alt={p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>

              {/* Product info */}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.66rem', letterSpacing: '2.5px', color: p.color, fontWeight: 700, marginBottom: 3 }}>
                      {p.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'rgba(255,255,255,0.35)' }}>
                      {p.sub}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '1px', color: p.color, whiteSpace: 'nowrap', marginLeft: 12 }}>
                    {p.price}
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 14 }}>
                  {p.desc}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.2)', border: `1px solid rgba(255,255,255,0.1)`, padding: '3px 8px' }}>
                    {p.tag}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', letterSpacing: '2px', color: p.color }}>
                    SHOP ON ETSY →
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid rgba(51,255,51,0.08)', fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.8, textAlign: 'center' }}>
        All products sold via Etsy.<br />
        Questions? <a href="mailto:phreezer.support@mpgink.com" style={{ color: 'rgba(0,224,208,0.4)', textDecoration: 'none' }}>phreezer.support@mpgink.com</a>
      </div>
    </div>
  );
}
