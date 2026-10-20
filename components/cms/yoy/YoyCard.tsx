import React from 'react';
import type { CardRow, CardTone, YoyCardModel } from '@/lib/data/grid/yoy-card';

/**
 * The "What changed in a year" card — a 1:1 build of the Figma master
 * (figma.com/design/uSaRYhIFAFFFyWoJujS0l4, frame "YoY Card — 1080"), filled
 * from the day's sheet instead of typed by hand.
 *
 * Drawn at a fixed 1080×1080 in absolute pixels on purpose. It is an image, not
 * a page: nothing here may reflow with the panel around it, and the styles are
 * a plain string rather than Tailwind classes so the build's root-relative px
 * rewrite (scripts/postcss-root-relative-px) cannot touch a single measurement.
 * The two faces are self-hosted for the same reason — the site's Inter swaps to
 * the Bengali face under `html.locale-bn`, and the PNG must not change with it.
 */

const CSS = `
@font-face{font-family:'YoyCardInter';src:url('/fonts/yoy-card/inter.var.woff2') format('woff2');font-weight:100 900;font-display:block}
@font-face{font-family:'YoyCardBengali';src:url('/fonts/yoy-card/noto-sans-bengali.woff2') format('woff2');font-weight:100 900;font-display:block}
.yoyc,.yoyc *{box-sizing:border-box;margin:0;padding:0;border:0 solid transparent;font-feature-settings:normal;font-variant-numeric:normal;font-style:normal;text-transform:none;text-decoration:none;text-shadow:none}
.yoyc{position:relative;width:1080px;height:1080px;overflow:hidden;font-family:'YoyCardInter',sans-serif;color:#14284a;font-size:16px;font-weight:400;line-height:normal;letter-spacing:normal;word-spacing:normal;text-align:left;white-space:normal;direction:ltr;
  background:conic-gradient(from 200deg at 50% -10%,rgba(255,200,150,.10),rgba(255,200,150,0) 12%,rgba(255,200,150,.08) 24%,rgba(255,200,150,0) 36%,rgba(255,200,150,.07) 48%,rgba(255,200,150,0) 60%),linear-gradient(165deg,#741019,#a8211d 60%,#b5321f);
  -webkit-font-smoothing:antialiased}
/* The host page may colour bare elements (b, small, span…) for its own theme;
   inside the card they take the card's colours and nothing else. */
.yoyc b,.yoyc small,.yoyc i,.yoyc span,.yoyc div{color:inherit;font-weight:inherit}
.yoyc .yc-abs{position:absolute}
.yoyc .yc-bn{font-family:'YoyCardBengali',sans-serif}
.yoyc .yc-towers{left:0;top:0;width:1080px;height:1080px}
.yoyc .yc-stripe{left:0;width:1080px;background:linear-gradient(90deg,#1e9a4f 0 33.33%,#e32b2b 33.33% 66.66%,#f08a2d 66.66%)}

.yoyc .yc-hdr{left:0;top:0;width:1080px;height:150px;background:#fbf8dc}
.yoyc .yc-logo{left:52px;top:37px;height:76px;width:219px}
.yoyc .yc-hc{left:340px;width:400px;top:48px;display:flex;flex-direction:column;align-items:center}
.yoyc .yc-hc .yc-k{font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#8a6100;line-height:13px}
.yoyc .yc-hc .yc-rule{width:120px;height:3px;margin-top:7px;border-radius:2px;background:linear-gradient(90deg,#1e9a4f 0 33.33%,#e32b2b 33.33% 66.66%,#f08a2d 66.66%)}
.yoyc .yc-hc .yc-ed{margin-top:7px;font-size:22px;font-weight:900;letter-spacing:-.3px;line-height:25px}
.yoyc .yc-dates{right:52px;top:32px;display:flex;flex-direction:column;align-items:flex-end;text-align:right}
.yoyc .yc-dates .yc-pub{font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#8a6100;line-height:13px;margin-bottom:2px}
.yoyc .yc-dates .yc-en{font-size:21px;font-weight:800;letter-spacing:-.3px;line-height:24px}
.yoyc .yc-dates .yc-bn{font-size:15.5px;font-weight:600;color:#3b4560;line-height:20px}

.yoyc .yc-card{left:52px;top:174px;width:976px;height:738px;background:#fff;border-radius:24px;overflow:hidden;
  box-shadow:0 2px 0 rgba(255,255,255,.6) inset,0 30px 70px rgba(30,0,10,.45),0 0 0 1px rgba(255,255,255,.25)}
.yoyc .yc-title{left:0;top:18px;width:976px;text-align:center;font-size:46px;font-weight:900;letter-spacing:-1.4px;line-height:51px;color:#b4182f}
.yoyc .yc-band{left:0;top:87px;width:976px;height:63px;background:linear-gradient(90deg,#f3c93a,#f8dc5c 50%,#f3c93a)}
.yoyc .yc-tk{top:5px;width:250px;height:53px;background:#fff;border-radius:14px;box-shadow:0 3px 10px rgba(120,80,0,.18);padding:6px 22px 7px;display:flex;flex-direction:column}
.yoyc .yc-tk small{font-size:10.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;line-height:12px}
.yoyc .yc-tk b{font-size:25px;font-weight:900;letter-spacing:-.3px;line-height:28px}
.yoyc .yc-tk.yc-l{left:176px;align-items:flex-start} .yoyc .yc-tk.yc-l small{color:#14284a}
.yoyc .yc-tk.yc-r{left:550px;align-items:flex-end} .yoyc .yc-tk.yc-r small{color:#b4182f}
.yoyc .yc-vsr{top:30px;width:28px;height:2.5px}
.yoyc .yc-vs{left:465px;top:8px;width:46px;height:46px}

.yoyc .yc-thead{left:20px;top:173px;width:936px;height:31px;background:#14284a;border-radius:9px}
.yoyc .yc-th{top:9px;font-size:11.5px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#fff;line-height:13px}

.yoyc .yc-grp{left:20px;width:936px;border-radius:14px}
.yoyc .yc-tab{left:0;top:0;width:34px;border-radius:14px 0 0 14px}
.yoyc .yc-tab span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-90deg);white-space:nowrap;color:#fff;
  font-weight:800;letter-spacing:1.6px;text-transform:uppercase;text-align:center}
.yoyc .yc-notch{left:34px;width:0;height:0;border-top:9px solid transparent;border-bottom:9px solid transparent;border-left:9px solid}
.yoyc .yc-rows{left:34px;top:0;width:902px;border-radius:0 14px 14px 0;overflow:hidden}
.yoyc .yc-row{position:absolute;left:0;width:902px;height:50px}
.yoyc .yc-row + .yc-row{border-top:2px solid #fff}
.yoyc .yc-m{left:20px;top:0;height:50px;display:flex;align-items:center;font-size:18.5px;font-weight:700;line-height:22px}
.yoyc .yc-num{top:0;height:50px;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;text-align:right}
.yoyc .yc-num .yc-v{line-height:21px}
.yoyc .yc-num .yc-u{margin-top:1px;font-size:12.5px;font-weight:700;letter-spacing:.3px;color:#4c556b;line-height:14px}
.yoyc .yc-num.yc-old .yc-v{font-size:19px;font-weight:700;color:#2a3450}
.yoyc .yc-num.yc-now .yc-v{font-size:21px;font-weight:900;color:#14284a}
.yoyc .yc-num.yc-chg .yc-v{font-size:18.5px;font-weight:800}
.yoyc .yc-pill{top:11px;width:108px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:16.5px;font-weight:800;line-height:20px}
.yoyc .yc-t-good{color:#1c7040} .yoyc .yc-t-bad{color:#c62a24} .yoyc .yc-t-neutral{color:#14284a}
.yoyc .yc-pill.yc-t-good{background:#eef8f2;box-shadow:inset 0 0 0 1.5px #b9dcc6}
.yoyc .yc-pill.yc-t-bad{background:#fdf0ef;box-shadow:inset 0 0 0 1.5px #f0c0bc}
.yoyc .yc-pill.yc-t-neutral{background:#eef1f8;box-shadow:inset 0 0 0 1.5px #c3cbe0}

.yoyc .yc-key{left:0;top:702px;width:976px;display:flex;align-items:center;justify-content:center;gap:22px;line-height:16px}
.yoyc .yc-key .yc-lab{font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#4a5268}
.yoyc .yc-key .yc-it{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:#4a5268}
.yoyc .yc-key .yc-dot{width:11px;height:11px;border-radius:50%}

.yoyc .yc-strip{left:0;top:936px;width:1080px;height:62px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 -6px 18px rgba(40,0,10,.18)}
.yoyc .yc-strip .yc-lead{display:flex;align-items:center;gap:12px;padding-right:22px;margin-right:22px;border-right:2px solid #ead9a6}
.yoyc .yc-strip .yc-ic{width:38px;height:38px;border-radius:50%;background:#b4182f;display:flex;align-items:center;justify-content:center}
.yoyc .yc-strip .yc-lead b{display:block;font-size:16px;font-weight:800;line-height:18px}
.yoyc .yc-strip .yc-lead .yc-sub{display:block;font-size:13px;font-weight:600;color:#6b7488;line-height:16px}
.yoyc .yc-strip .yc-url{font-size:30px;font-weight:900;color:#b4182f;line-height:36px}
.yoyc .yc-strip .yc-url b{color:#14284a;font-weight:900}
.yoyc .yc-strip .yc-go{margin-left:16px;width:34px;height:34px;border-radius:50%;background:#b4182f;display:flex;align-items:center;justify-content:center}

.yoyc .yc-foot{left:0;top:998px;width:1080px;height:82px;background:#fbf8dc}
.yoyc .yc-fb{left:52px;top:998px;height:82px;display:flex;align-items:center;gap:9px;font-size:18px;font-weight:700}
.yoyc .yc-fb .yc-ic{width:30px;height:30px;border-radius:50%;background:#14284a;display:flex;align-items:center;justify-content:center}
.yoyc .yc-src{right:52px;top:1013px;text-align:right;font-size:13px;font-weight:600;color:#4a5268;line-height:17.5px}
.yoyc .yc-src span{display:block;font-size:10.5px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#8a6100;line-height:13px;margin-bottom:2px}
`;

/** Table geometry from the master: right edges of the four numeric columns. */
const COL = { then: 556, now: 702, change: 848, pillRight: 994 };
/** Card left (52) + table inset (20) + tab (34) — the rows' own x origin. */
const ROWS_X = 52 + 20 + 34;
const GROUP_STYLE = {
  power: { tab: '#14284a', fill: '#fbf4cf', label: 13 },
  gas: { tab: '#c9820e', fill: '#fde8d2', label: 13 },
  energy: { tab: '#4f7a3a', fill: '#e5efd5', label: 12 },
} as const;

function Triangle({ dir }: { dir: CardRow['dir'] }) {
  if (dir === 'flat') return null;
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden>
      <polygon points={dir === 'up' ? '7,1 13,12 1,12' : '1,2 13,2 7,13'} fill="currentColor" />
    </svg>
  );
}

function tone(t: CardTone) {
  return `yc-t-${t}`;
}

/** The VS badge: a crimson rounded diamond with a white ring, as in the master. */
function VsBadge() {
  return (
    <svg className="yc-abs yc-vs" viewBox="0 0 46 46" aria-hidden>
      <defs>
        <filter id="yoyc-vs-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#780a1e" floodOpacity=".35" />
        </filter>
      </defs>
      <rect x="9" y="9" width="28" height="28" rx="6" transform="rotate(45 23 23)" fill="#b4182f" stroke="#fff" strokeWidth="3" filter="url(#yoyc-vs-shadow)" />
      <text x="23" y="28" textAnchor="middle" fontFamily="YoyCardInter" fontWeight="900" fontSize="14" fill="#fff">VS</text>
    </svg>
  );
}

export function YoyCard({ model }: { model: YoyCardModel }) {
  const groupTops = { power: 216, gas: 378, energy: 590 };
  return (
    <div className="yoyc" lang="en">
      <style>{CSS}</style>
      {/* eslint-disable-next-line @next/next/no-img-element -- rasterised by html-to-image, not served */}
      <img className="yc-abs yc-towers" src="/images/yoy-card/towers.svg" alt="" />

      <div className="yc-abs yc-hdr" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="yc-abs yc-logo" src="/images/esb-logo-ng.png" alt="ESB PowerLine" />
      <div className="yc-abs yc-hc">
        <div className="yc-k">Grid Explorer</div>
        <div className="yc-rule" />
        <div className="yc-ed">Year-on-Year comparison</div>
      </div>
      <div className="yc-abs yc-dates">
        <div className="yc-pub">Published</div>
        <div className="yc-en">{model.published.gregorian}</div>
        <div className="yc-bn">{model.published.bangla}</div>
        {model.published.hijri && <div className="yc-bn">{model.published.hijri}</div>}
      </div>
      <div className="yc-abs yc-stripe" style={{ top: 0, height: 9 }} />
      <div className="yc-abs yc-stripe" style={{ top: 141, height: 9 }} />

      <div className="yc-abs yc-card">
        <div className="yc-abs yc-title">What changed in a year</div>
        <div className="yc-abs yc-band">
          <div className="yc-abs yc-tk yc-l">
            <small>Then</small>
            <b>{model.thenLabel}</b>
          </div>
          <div className="yc-abs yc-vsr" style={{ left: 431, background: '#14284a' }} />
          <VsBadge />
          <div className="yc-abs yc-vsr" style={{ left: 517, background: '#b4182f' }} />
          <div className="yc-abs yc-tk yc-r">
            <small>Now</small>
            <b>{model.nowLabel}</b>
          </div>
        </div>

        <div className="yc-abs yc-thead">
          <div className="yc-abs yc-th" style={{ left: 54 }}>Metric</div>
          <div className="yc-abs yc-th" style={{ right: 936 - (COL.then - 72) }}>{model.thenYear}</div>
          <div className="yc-abs yc-th" style={{ right: 936 - (COL.now - 72) }}>{model.nowYear}</div>
          <div className="yc-abs yc-th" style={{ right: 936 - (COL.change - 72) }}>Change</div>
          <div className="yc-abs yc-th" style={{ right: 936 - (COL.pillRight - 72) }}>Change %</div>
        </div>

        {model.groups.map((g) => {
          const s = GROUP_STYLE[g.key];
          const h = g.rows.length * 50;
          return (
            <div key={g.key} className="yc-abs yc-grp" style={{ top: groupTops[g.key], height: h }}>
              <div className="yc-abs yc-tab" style={{ height: h, background: s.tab }}>
                <span style={{ fontSize: s.label, lineHeight: g.key === 'energy' ? '14px' : '16px', letterSpacing: g.key === 'energy' ? 1.2 : 1.6 }}>
                  {g.key === 'energy' ? (
                    <>
                      Energy
                      <br />& cost
                    </>
                  ) : (
                    g.label
                  )}
                </span>
              </div>
              <div className="yc-abs yc-notch" style={{ top: h / 2 - 9, borderLeftColor: s.tab }} />
              <div className="yc-abs yc-rows" style={{ height: h, background: s.fill }}>
                {g.rows.map((r, i) => (
                  <div key={r.id} className="yc-row" style={{ top: i * 50 }}>
                    <div className="yc-abs yc-m">{r.label}</div>
                    <div className="yc-abs yc-num yc-old" style={{ right: 902 - (COL.then - ROWS_X) }}>
                      <span className="yc-v">{r.then}</span>
                      <span className="yc-u">{r.unit}</span>
                    </div>
                    <div className="yc-abs yc-num yc-now" style={{ right: 902 - (COL.now - ROWS_X) }}>
                      <span className="yc-v">{r.now}</span>
                      <span className="yc-u">{r.unit}</span>
                    </div>
                    <div className={`yc-abs yc-num yc-chg ${tone(r.tone)}`} style={{ right: 902 - (COL.change - ROWS_X) }}>
                      <span className="yc-v">{r.change}</span>
                      <span className="yc-u">{r.unit}</span>
                    </div>
                    <div className={`yc-abs yc-pill ${tone(r.tone)}`} style={{ left: COL.pillRight - ROWS_X - 108 }}>
                      <Triangle dir={r.dir} />
                      {r.pct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="yc-abs yc-key">
          <span className="yc-lab">Change colour</span>
          <span className="yc-it"><i className="yc-dot" style={{ background: '#1c7040' }} />Improved</span>
          <span className="yc-it"><i className="yc-dot" style={{ background: '#c62a24' }} />Worsened</span>
          <span className="yc-it"><i className="yc-dot" style={{ background: '#14284a' }} />Neutral</span>
        </div>
      </div>

      <div className="yc-abs yc-strip">
        <div className="yc-lead">
          <span className="yc-ic">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
              <path d="M3.5 10h17M8 3v4M16 3v4" />
            </svg>
          </span>
          <div>
            <b>Daily archive</b>
            <span className="yc-sub">since 2013</span>
          </div>
        </div>
        <span className="yc-url">
          esbpowerline.com<b>/grid-explorer</b>
        </span>
        <span className="yc-go">
          <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden>
            <path d="M3 7h7M7 3.5 10.5 7 7 10.5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      <div className="yc-abs yc-foot" />
      <div className="yc-abs yc-stripe" style={{ top: 998, height: 4 }} />
      <div className="yc-abs yc-fb">
        <span className="yc-ic">
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
            <path d="M14 22v-8.2h2.8l.4-3.3H14V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.8v3.3h2.8V22z" fill="#fff" />
          </svg>
        </span>
        esbpowerlineofficial
      </div>
      <div className="yc-abs yc-src">
        <span>Source</span>
        PGCB daily report
        <br />
        Petrobangla daily gas report
      </div>
    </div>
  );
}
