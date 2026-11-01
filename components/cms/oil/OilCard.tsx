import React from 'react';
import type { Dir, OilCardModel, OilWorldRow, PumpTile, WorldCell } from '@/lib/data/oil/oil-card';

/**
 * "Fuel prices at home and abroad" — a build of the Figma master
 * (figma.com/design/mLhk4EeYSfg2w9KJll0bu2, frame "Fuel Oil Price Report - 4:5
 * - Minimal V1.1 — 1 Nov 2026 (live values)", node 2519:448), filled from
 * EMRD's instruments and the stored futures settlements.
 *
 * A fixed 1080×1350 image in absolute pixels, for the same reasons as the
 * year-on-year card (components/cms/yoy/YoyCard.tsx): it must not reflow with
 * the panel, the styles are a plain string so the build's root-relative px
 * rewrite cannot touch them, and every face is self-hosted so the PNG cannot
 * change with the site's locale. The header and footer are the YoY card's, so
 * the two read as one series.
 */

const CSS = `
@font-face{font-family:'OilCardInter';src:url('/fonts/yoy-card/inter.var.woff2') format('woff2');font-weight:100 900;font-display:block}
@font-face{font-family:'OilCardSerif';src:url('/fonts/oil-card/dm-serif-display.ttf') format('truetype');font-weight:400;font-display:block}
@font-face{font-family:'OilCardBengali';src:url('/fonts/oil-card/noto-sans-bengali.woff2') format('woff2');font-weight:100 900;font-display:block}
.oilc,.oilc *{box-sizing:border-box;margin:0;padding:0;border:0 solid transparent;font-feature-settings:normal;font-variant-numeric:normal;font-style:normal;text-transform:none;text-decoration:none;text-shadow:none}
.oilc{position:relative;width:1080px;height:1350px;overflow:hidden;font-family:'OilCardInter',sans-serif;color:#1a1a1f;font-size:16px;font-weight:400;line-height:normal;letter-spacing:normal;text-align:left;white-space:nowrap;direction:ltr;
  background:linear-gradient(180deg,#7e1229,#ad2150);-webkit-font-smoothing:antialiased}
.oilc b,.oilc small,.oilc i,.oilc span,.oilc div,.oilc p{color:inherit;font-weight:inherit}
.oilc .o-abs{position:absolute}
.oilc .o-tk{font-family:'OilCardBengali',sans-serif;font-weight:700}
.oilc .o-serif{font-family:'OilCardSerif',serif;font-weight:400}
.oilc .o-stripe{left:0;width:1080px;background:linear-gradient(90deg,#1e9a4f 0 33.33%,#e32b2b 33.33% 66.66%,#f08a2d 66.66%)}

.oilc .o-hdr{left:0;top:0;width:1080px;height:155px;background:#fbf8dc}
.oilc .o-logo{left:52px;top:37.95px;width:228px;height:79.1px;object-fit:contain}
.oilc .o-hc{left:360.5px;top:44.5px;width:359px;display:flex;flex-direction:column;align-items:center;gap:8px}
.oilc .o-hc .o-k{font-size:14px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#8a6100;line-height:1.1}
.oilc .o-hc .o-rule{width:120px;height:3px;background:linear-gradient(90deg,#1e9a4f 0 33.33%,#e32b2b 33.33% 66.66%,#f08a2d 66.66%)}
.oilc .o-hc .o-ed{font-size:28.75px;font-weight:800;letter-spacing:-.375px;color:#b4182f;line-height:1.1}
.oilc .o-dates{right:52px;top:47px;display:flex;flex-direction:column;align-items:flex-end;gap:4px;text-align:right}
.oilc .o-dates .o-pub{font-size:16px;font-weight:700;letter-spacing:2.75px;text-transform:uppercase;color:#8a6100;line-height:22.5px}
.oilc .o-dates .o-day{font-size:30px;font-weight:900;letter-spacing:-.375px;color:#14284a;line-height:34px}

.oilc .o-headline{left:52px;top:186px;font-size:56px;line-height:1.06;color:#fff;white-space:pre}

.oilc .o-card{left:52px;width:976px;background:#fff;border-radius:32px;box-shadow:0 8px 24px -4px rgba(38,0,13,.28);padding:24px 28px;display:flex;flex-direction:column}
.oilc .o-chead{display:flex;align-items:center;justify-content:space-between;height:44px}
.oilc .o-title{display:flex;align-items:baseline;gap:12px}
.oilc .o-title .o-h{font-size:32px;line-height:44px;color:#1a1a1f}
.oilc .o-title .o-sub{font-size:20px;font-weight:600;color:#555b6b}
.oilc .o-chip{display:flex;align-items:center;gap:8px;padding:8px 16px 8px 14px;border-radius:20px;background:#eef1f8;font-size:18px;font-weight:700;color:#14284a;line-height:22px}
.oilc .o-chip i{width:10px;height:10px;border-radius:50%;background:#14284a}

.oilc .o-tiles{display:flex;gap:16px;margin-top:16px}
.oilc .o-tile{width:218px;height:231px;border-radius:24px;padding:18px 20px;display:flex;flex-direction:column;gap:4px}
.oilc .o-tname{display:flex;align-items:center;gap:8px;height:41px;font-size:30px}
.oilc .o-price{display:flex;align-items:flex-start;gap:4px;height:82px}
.oilc .o-price .o-tk{font-size:28px;line-height:37px;color:#1a1a1f}
.oilc .o-price b{font-size:68px;font-weight:800;letter-spacing:-2.5px;line-height:82px;color:#1a1a1f}
.oilc .o-state{align-self:flex-start;display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:16px;background:#fff;font-size:22px;font-weight:800;line-height:27px;color:#14284a}
.oilc .o-last{font-size:17px;font-weight:600;color:#5f6a82;line-height:23px}

.oilc .o-cols{display:flex;gap:12px;margin-right:16px}
.oilc .o-col{font-size:17px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#555b6b;line-height:21px}
.oilc .o-rows{display:flex;flex-direction:column;gap:8px;margin-top:14px}
.oilc .o-row{height:49px;border-radius:16px;background:#f6f2e8;padding:5px 16px;display:flex;align-items:center;justify-content:space-between}
.oilc .o-rname{display:flex;align-items:center;gap:12px}
.oilc .o-rname b{font-size:25px;font-weight:700;letter-spacing:-.3px;line-height:30px}
.oilc .o-rname span{font-size:18px;font-weight:600;color:#555b6b;margin-left:-2px}
.oilc .o-rvals{display:flex;align-items:center;gap:12px}
.oilc .o-usd{width:150px;display:flex;justify-content:flex-end;align-items:flex-start;gap:2px}
.oilc .o-usd small{font-size:20px;font-weight:700;line-height:24px}
.oilc .o-usd b{font-size:39px;font-weight:800;letter-spacing:-1.2px;line-height:39px}
.oilc .o-pill{width:124px;height:36px;border-radius:18px;background:#fff;border:1.5px solid #c3cbe0;display:flex;align-items:center;justify-content:center;gap:6px;font-size:20px;font-weight:800;color:#14284a;line-height:24px}
.oilc .o-pill.o-up{border-color:#f0c0bc} .oilc .o-pill.o-down{border-color:#b9dcc6}
.oilc .o-key{display:flex;gap:18px;margin-top:14px;font-size:15px;font-weight:600;color:#4a5268;line-height:18px}
.oilc .o-key span{display:flex;align-items:center;gap:7px}
.oilc .o-key i{width:11px;height:11px;border-radius:50%}
.oilc .o-cap{margin-top:14px;font-size:15px;font-weight:600;color:#5f6a82;line-height:18px}

.oilc .o-illus{left:0;top:1118px;width:1080px;height:160px}
.oilc .o-foot{left:0;top:1278px;width:1080px;height:72px;background:#fbf8dc}
.oilc .o-fb{left:85px;top:1296px;display:flex;align-items:center;gap:12px;font-size:21px;font-weight:800;letter-spacing:-.2px;color:#1877f2;line-height:1.15}
.oilc .o-fb .o-ic{position:relative;width:36px;height:36px}
.oilc .o-fb .o-ic img{position:absolute;left:0;top:0;width:32px;height:32px}
.oilc .o-src{left:429px;top:1302px;height:24px;display:flex;align-items:center;gap:16px;font-size:18px}
.oilc .o-src b{font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#8a6100;line-height:1.15}
.oilc .o-src span{font-weight:600;color:#14284a;line-height:1.35}
.oilc .o-src i{width:1px;height:12px;background:#d8ce9c}
.oilc .o-yt{left:804px;top:1300.5px;display:flex;align-items:center;gap:12px;font-size:20px;font-weight:800;color:#f03;line-height:1.35}
.oilc .o-yt img{width:27px;height:22px;object-fit:contain}
`;

const TILE_STYLE: Record<PumpTile['id'], { fill: string; ink: string }> = {
  'diesel-bpc': { fill: '#fbe5b0', ink: '#a86a00' },
  'kerosene-bpc': { fill: '#d5e8f7', ink: '#1f6fb0' },
  'petrol-bpc': { fill: '#ece6f8', ink: '#6b3fbf' },
  'octane-bpc': { fill: '#dcefed', ink: '#0e7470' },
};
const DROP_FILL: Record<PumpTile['id'], string> = {
  'diesel-bpc': '#e39b12',
  'kerosene-bpc': '#3b8fd0',
  'petrol-bpc': '#6b3fbf',
  'octane-bpc': '#0e7470',
};
const DROP = 'M13 2.78571C13 2.78571 5.10718 11.6071 5.10718 16.7143C5.10718 18.8076 5.93874 20.8152 7.41894 22.2954C8.89914 23.7756 10.9067 24.6071 13 24.6071C15.0934 24.6071 17.1009 23.7756 18.5811 22.2954C20.0613 20.8152 20.8929 18.8076 20.8929 16.7143C20.8929 11.6071 13 2.78571 13 2.78571Z';

/** The row icons, exported from the master's own layers. */
function RowIcon({ id }: { id: string }) {
  if (id === 'brent' || id === 'wti') {
    return (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <path d="M17.6428 2.78571H8.35711C6.30576 2.78571 4.64282 4.44865 4.64282 6.49999V19.5C4.64282 21.5513 6.30576 23.2143 8.35711 23.2143H17.6428C19.6942 23.2143 21.3571 21.5513 21.3571 19.5V6.49999C21.3571 4.44865 19.6942 2.78571 17.6428 2.78571Z" fill="#3A2A1F" />
        <path d="M4.64282 8.35712H21.3571M4.64282 17.6428H21.3571" stroke="white" strokeOpacity="0.55" strokeWidth="2" />
      </svg>
    );
  }
  if (id === 'ulsd') {
    return (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <path d="M13 1.85718C13.9286 6.50004 19.5 9.28575 19.5 15.7857C19.5 17.5097 18.8152 19.163 17.5962 20.3819C16.3772 21.6009 14.7239 22.2857 13 22.2857C11.2761 22.2857 9.62279 21.6009 8.40381 20.3819C7.18482 19.163 6.5 17.5097 6.5 15.7857C6.5 13 8.35714 11.1429 9.28571 9.28575C10.2143 11.1429 11.1429 12.0715 12.0714 12.0715C12.0714 8.35718 11.1429 6.50004 13 1.85718Z" fill="#E2572B" />
      </svg>
    );
  }
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
      <path d={DROP} fill="#8FB22A" />
    </svg>
  );
}

const ARROW = { up: '▲', down: '▼', flat: '' } as const;
const TONE = { up: '#c62a24', down: '#1c7040', flat: '#14284a' } as const;

/** Only the triangle carries the colour; the figure stays navy. */
function Pill({ c }: { c: WorldCell | null }) {
  if (!c) return <div className="o-pill">—</div>;
  return (
    <div className={`o-pill o-${c.dir}`}>
      {c.dir !== 'flat' && <span style={{ color: TONE[c.dir] }}>{ARROW[c.dir]}</span>}
      {c.pct}%
    </div>
  );
}

function Taka() {
  return <span className="o-tk">৳</span>;
}

function TileState({ t }: { t: PumpTile }) {
  if (t.state === 'changed') {
    return (
      <div className="o-state">
        {t.lastChange ? (
          <>
            <span style={{ color: TONE[t.lastChange.dir as Dir] }}>{ARROW[t.lastChange.dir as Dir]}</span>
            <span>
              <Taka />
              {t.lastChange.amount}
            </span>
          </>
        ) : (
          'New rate'
        )}
      </div>
    );
  }
  return <div className="o-state">Unchanged</div>;
}

function TileLine({ t }: { t: PumpTile }) {
  if (t.state === 'changed') return <div className="o-last">Re-fixed {t.since}</div>;
  if (!t.lastChange) return <div className="o-last">since {t.since}</div>;
  return (
    <div className="o-last">
      {ARROW[t.lastChange.dir]} <Taka />
      {t.lastChange.amount} on {t.lastChange.on}
    </div>
  );
}

const PLACEHOLDER_ROWS: OilWorldRow[] = [
  { id: 'brent', label: 'Brent Crude', unit: 'USD/barrel', price: '—', week: null, month: null },
  { id: 'wti', label: 'WTI Crude', unit: 'USD/barrel', price: '—', week: null, month: null },
  { id: 'rbob', label: 'Gasoline', unit: 'USD/gallon', price: '—', week: null, month: null },
  { id: 'ulsd', label: 'Heating Oil (ULSD)', unit: 'USD/gallon', price: '—', week: null, month: null },
];

export function OilCard({ model }: { model: OilCardModel }) {
  const rows = model.world?.rows ?? PLACEHOLDER_ROWS;
  return (
    <div className="oilc" lang="en">
      <style>{CSS}</style>
      {/* eslint-disable @next/next/no-img-element -- rasterised by html-to-image, not served */}
      <img className="o-abs o-illus" src="/images/oil-card/illustration.svg" alt="" />

      <div className="o-abs o-hdr" />
      <img className="o-abs o-logo" src="/images/yoy-card/logo-4x5.png" alt="ESB Power Line" />
      <div className="o-abs o-hc">
        <div className="o-k">Fuel Prices</div>
        <div className="o-rule" />
        <div className="o-ed">Daily price report</div>
      </div>
      <div className="o-abs o-dates">
        <div className="o-pub">Published · {model.published.weekday}</div>
        <div className="o-day">{model.published.date}</div>
      </div>
      <div className="o-abs o-stripe" style={{ top: 0, height: 11.25 }} />
      <div className="o-abs o-stripe" style={{ top: 143.75, height: 11.25 }} />

      <div className="o-abs o-headline o-serif">{'Fuel prices\nat home and abroad'}</div>

      <div className="o-abs o-card" style={{ top: 340 }}>
        <div className="o-chead">
          <div className="o-title">
            <span className="o-h o-serif">Bangladesh pump prices</span>
            <span className="o-sub">
              <Taka /> per litre
            </span>
          </div>
          <div className="o-chip">
            <i />
            {model.pump.chip}
          </div>
        </div>
        <div className="o-tiles">
          {model.pump.tiles.map((t) => (
            <div key={t.id} className="o-tile" style={{ background: TILE_STYLE[t.id].fill }}>
              <div className="o-tname o-serif" style={{ color: TILE_STYLE[t.id].ink }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
                  <path d={DROP} fill={DROP_FILL[t.id]} />
                </svg>
                {t.name}
              </div>
              <div className="o-price">
                <Taka />
                <b>{t.value}</b>
              </div>
              <TileState t={t} />
              <TileLine t={t} />
            </div>
          ))}
        </div>
      </div>

      <div className="o-abs o-card" style={{ top: 704 }}>
        <div className="o-chead">
          <div className="o-title" style={{ alignItems: 'flex-end' }}>
            <span className="o-h o-serif">World oil prices</span>
            <span className="o-sub" style={{ lineHeight: '24px' }}>
              {model.world ? `Settlement · ${model.world.settlement}` : 'Settlement · awaiting first capture'}
            </span>
          </div>
          <div className="o-cols">
            <div className="o-col" style={{ width: 150, textAlign: 'right', paddingRight: 6, color: '#14284a' }}>Settled</div>
            <div className="o-col" style={{ width: 124, textAlign: 'center' }}>vs week</div>
            <div className="o-col" style={{ width: 124, textAlign: 'center' }}>vs month</div>
          </div>
        </div>
        <div className="o-rows">
          {rows.map((r) => (
            <div key={r.id} className="o-row">
              <div className="o-rname">
                <RowIcon id={r.id} />
                <b>{r.label}</b>
                <span>{r.unit}</span>
              </div>
              <div className="o-rvals">
                <div className="o-usd">
                  {r.price !== '—' && <small>$</small>}
                  <b>{r.price}</b>
                </div>
                <Pill c={r.week} />
                <Pill c={r.month} />
              </div>
            </div>
          ))}
        </div>
        <div className="o-key">
          <span><i style={{ background: '#c62a24' }} />Price up · higher import bill</span>
          <span><i style={{ background: '#1c7040' }} />Price down · lower import bill</span>
        </div>
        <div className="o-cap">
          Front-month futures settlement · Brent on ICE; WTI, gasoline (RBOB) and heating oil (ULSD) on NYMEX · via Yahoo Finance
        </div>
      </div>

      <div className="o-abs o-foot" />
      <div className="o-abs o-stripe" style={{ top: 1278, height: 5 }} />
      <div className="o-abs o-fb">
        <span className="o-ic">
          <img src="/images/yoy-card/facebook.svg" alt="" />
        </span>
        esbpowerlineofficial
      </div>
      <div className="o-abs o-src">
        <b>Source</b>
        <span>EMRD</span>
        <i />
        <span>NYMEX · ICE</span>
      </div>
      <div className="o-abs o-yt">
        <img src="/images/yoy-card/youtube.png" alt="" />
        ESB Power Line
      </div>
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}
