import React from 'react';
import type { CardGroup, CardRow, CardTone, YoyCardModel } from '@/lib/data/grid/yoy-card';

/**
 * The "What changed in a year" card — a build of the Figma master
 * (figma.com/design/mLhk4EeYSfg2w9KJll0bu2, frame "YoY Card - 4:5 V2",
 * node 2135:340), filled from the day's sheet instead of typed by hand.
 *
 * Drawn at a fixed 1080×1350 (4:5, Facebook's tallest feed ratio) in absolute
 * pixels on purpose. It is an image, not a page: nothing here may reflow with
 * the panel around it, and the styles are a plain string rather than Tailwind
 * classes so the build's root-relative px rewrite
 * (scripts/postcss-root-relative-px) cannot touch a single measurement. Inter
 * is self-hosted for the same reason — the site's Inter swaps to the Bengali
 * face under `html.locale-bn`, and the PNG must not change with it.
 *
 * The art that never changes — the red field with its vignette, flare stack
 * and coins, the plant skyline, the trees, the logo and the two social marks —
 * is exported from those same Figma layers into public/images/yoy-card/. Every
 * word and figure is live text.
 */

const CSS = `
@font-face{font-family:'YoyCardInter';src:url('/fonts/yoy-card/inter.var.woff2') format('woff2');font-weight:100 900;font-display:block}
.yoyc,.yoyc *{box-sizing:border-box;margin:0;padding:0;border:0 solid transparent;font-feature-settings:normal;font-variant-numeric:normal;font-style:normal;text-transform:none;text-decoration:none;text-shadow:none}
.yoyc{position:relative;width:1080px;height:1350px;overflow:hidden;font-family:'YoyCardInter',sans-serif;color:#14284a;font-size:16px;font-weight:400;line-height:normal;letter-spacing:normal;word-spacing:normal;text-align:left;white-space:nowrap;direction:ltr;background:#8a1a1e;-webkit-font-smoothing:antialiased}
/* The host page may colour bare elements (b, small, span…) for its own theme;
   inside the card they take the card's colours and nothing else. */
.yoyc b,.yoyc small,.yoyc i,.yoyc span,.yoyc div,.yoyc p{color:inherit;font-weight:inherit}
.yoyc .yc-abs{position:absolute}
.yoyc .yc-full{left:0;top:0;width:1080px;height:1350px}
.yoyc .yc-skyline{left:0;top:1159px;width:1080px;height:119px}
.yoyc .yc-stripe{left:0;width:1080px;background:linear-gradient(90deg,#1e9a4f 0 33.33%,#e32b2b 33.33% 66.66%,#f08a2d 66.66%)}

.yoyc .yc-hdr{left:0;top:0;width:1080px;height:155px;background:#fbf8dc}
.yoyc .yc-logo{left:52px;top:37.95px;width:228px;height:79.1px;object-fit:contain}
.yoyc .yc-hc{left:360.5px;top:44.5px;width:359px;display:flex;flex-direction:column;align-items:center;gap:8px}
.yoyc .yc-hc .yc-k{font-size:14px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#8a6100;line-height:1.1}
.yoyc .yc-hc .yc-rule{width:120px;height:3px;background:linear-gradient(90deg,#1e9a4f 0 33.33%,#e32b2b 33.33% 66.66%,#f08a2d 66.66%)}
.yoyc .yc-hc .yc-ed{font-size:28.75px;font-weight:800;letter-spacing:-.375px;color:#b4182f;line-height:1.1}
.yoyc .yc-dates{right:52px;top:47px;display:flex;flex-direction:column;align-items:flex-end;gap:4px;text-align:right}
.yoyc .yc-dates .yc-pub{font-size:16px;font-weight:700;letter-spacing:2.75px;text-transform:uppercase;color:#8a6100;line-height:22.5px}
.yoyc .yc-dates .yc-day{font-size:30px;font-weight:900;letter-spacing:-.375px;color:#14284a;line-height:34px}

.yoyc .yc-card{left:52px;top:207px;width:976px;height:949.25px;background:#fff;border-radius:22px;overflow:hidden;
  box-shadow:0 2px 0 rgba(255,255,255,.6) inset,0 30px 70px rgba(30,0,10,.45),0 0 0 1px rgba(255,255,255,.25)}
.yoyc .yc-title{left:0;top:12px;width:976px;height:51px;text-align:center;font-size:46px;font-weight:900;letter-spacing:-1.4px;line-height:51px;color:#b4182f}

.yoyc .yc-band{left:0;top:75px;width:976px;height:68px;background:#f4cf45;display:flex;align-items:center;justify-content:center}
.yoyc .yc-score{flex:none;width:664px;height:52px;background:#fff;border-radius:26px;filter:drop-shadow(0 2px 3px rgba(89,61,0,.14));display:flex;align-items:center;justify-content:center;gap:44px}
.yoyc .yc-side{flex:none;width:290px;display:flex;flex-direction:column;gap:1px;line-height:1}
.yoyc .yc-side.yc-then{align-items:flex-end;text-align:right;padding-right:22px}
.yoyc .yc-side.yc-now{align-items:flex-start;padding-left:22px}
.yoyc .yc-side small{font-size:20px;font-weight:800;letter-spacing:2.2px;text-transform:uppercase}
.yoyc .yc-side b{font-size:26px;font-weight:900;letter-spacing:-.4px}
.yoyc .yc-then small{color:rgba(20,40,74,.7)} .yoyc .yc-then b{color:#14284a}
.yoyc .yc-now small{color:rgba(232,89,12,.7)} .yoyc .yc-now b{color:#e8590c}
.yoyc .yc-vs{flex:none;position:relative;width:46px;height:46px}
.yoyc .yc-vs .yc-dia{position:absolute;left:0;top:0;width:46px;height:46px;overflow:visible;
  filter:drop-shadow(0 1px 1.5px rgba(77,51,0,.12)) drop-shadow(0 4px 8px rgba(77,51,0,.2))}
.yoyc .yc-vs span{position:absolute;left:23.4px;top:23px;transform:translate(-50%,-50%);font-size:16px;font-weight:900;letter-spacing:.8px;color:#b4182f;line-height:normal}

.yoyc .yc-thead{left:14px;top:163px;width:948px;height:43.25px;background:#8a1a1e;border-radius:12px;font-size:15px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#fff;line-height:1.15}
.yoyc .yc-th{top:13.125px;text-transform:uppercase}

.yoyc .yc-grp{left:14px;width:948px;border-radius:14px;overflow:hidden}
.yoyc .yc-tab{left:0;top:0;width:42.5px}
.yoyc .yc-tab span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-90deg);color:#fff;font-weight:800;text-transform:uppercase;line-height:1}
.yoyc .yc-notch{left:42.5px;width:0;height:0;border-top:11.25px solid transparent;border-bottom:11.25px solid transparent;border-left:11.25px solid}
.yoyc .yc-rows{left:42.5px;top:0;width:905.5px}
.yoyc .yc-row{position:absolute;left:0;width:905.5px;display:flex;align-items:center;padding:0 14px 3.75px 22px}
.yoyc .yc-m{flex:1 0 0;min-width:0;font-size:25px;font-weight:600;color:#14284a;line-height:1.1}
.yoyc .yc-num{flex:none;width:126px;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;text-align:right;line-height:1.1}
.yoyc .yc-num .yc-u{font-size:14.5px;font-weight:600;letter-spacing:.375px;color:#5f6a82}
.yoyc .yc-old .yc-v{font-size:23px;font-weight:600;color:#2a3450}
.yoyc .yc-now .yc-v{font-size:25px;font-weight:900;color:#14284a}
.yoyc .yc-chg .yc-v{font-size:22px;font-weight:800}
.yoyc .yc-pcol{flex:none;width:132px;display:flex;justify-content:flex-end}
.yoyc .yc-pill{width:108px;height:34px;border-radius:999px;border:1.5px solid;display:flex;align-items:center;justify-content:center;gap:6px;font-size:19px;font-weight:800;line-height:1.1}
.yoyc .yc-div{left:18px;bottom:0;width:869.5px;height:3px;border-radius:1px;background:#fff}
.yoyc .yc-t-good{color:#1c7040} .yoyc .yc-t-bad{color:#c62a24} .yoyc .yc-t-neutral{color:#14284a}
.yoyc .yc-pill.yc-t-good{background:#eef8f2;border-color:#b9dcc6}
.yoyc .yc-pill.yc-t-bad{background:#fdf0ef;border-color:#f0c0bc}
.yoyc .yc-pill.yc-t-neutral{background:#eef1f8;border-color:#c3cbe0}

.yoyc .yc-key{left:14px;top:820.25px;width:948px;height:25px;display:flex;justify-content:center}
.yoyc .yc-key-in{display:flex;align-items:center;gap:10px;height:25px;padding:0 18px;border-radius:999px;background:#fbf7e4;border:1px solid #efe8ca}
.yoyc .yc-key .yc-it{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:600;color:#4a5268;line-height:1}
.yoyc .yc-key .yc-dot{width:12px;height:12px;border-radius:50%}
.yoyc .yc-key .yc-sep{width:1px;height:12px;background:#d8ce9c}

.yoyc .yc-link{left:0;top:865.25px;width:976px;height:72px;display:flex;align-items:center;justify-content:center;gap:24px}
.yoyc .yc-arch{display:flex;flex-direction:column;justify-content:center;gap:4px;height:64px;padding-right:24px;border-right:2px solid #b98a0c;font-size:20px}
.yoyc .yc-arch b{font-weight:800;color:#14284a;line-height:24px}
.yoyc .yc-arch span{font-weight:600;color:#4a5268;line-height:36px}
.yoyc .yc-web{display:flex;flex-direction:column;justify-content:center;gap:4px;height:64px;font-weight:800}
.yoyc .yc-web small{font-size:16px;color:#2a3450;line-height:24px}
.yoyc .yc-web .yc-url{font-size:34px;line-height:36px;color:#b4182f}
.yoyc .yc-web .yc-url b{color:#1e9a4f;font-weight:800}

.yoyc .yc-foot{left:0;top:1278px;width:1080px;height:72px;background:#fbf8dc}
.yoyc .yc-fb{left:85px;top:1296px;display:flex;align-items:center;gap:12px;font-size:21px;font-weight:800;letter-spacing:-.2px;color:#1877f2;line-height:1.15}
.yoyc .yc-fb .yc-ic{position:relative;width:36px;height:36px}
.yoyc .yc-fb .yc-ic img{position:absolute;left:0;top:0;width:32px;height:32px}
.yoyc .yc-src{left:429px;top:1302px;height:24px;display:flex;align-items:center;gap:16px;font-size:18px}
.yoyc .yc-src b{font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#8a6100;line-height:1.15}
.yoyc .yc-src span{font-weight:600;color:#14284a;line-height:1.35}
.yoyc .yc-src i{width:1px;height:12px;background:#d8ce9c}
.yoyc .yc-yt{left:804px;top:1300.5px;display:flex;align-items:center;gap:12px;font-size:20px;font-weight:800;color:#f03;line-height:1.35}
.yoyc .yc-yt img{width:27px;height:22px;object-fit:contain}
`;

/** Group geometry from the master, in card coordinates (table top 143 + group y). */
const GROUP_TOP: Record<CardGroup['key'], number> = { power: 222.25, gas: 474.25, cost: 726.25 };
/** Rows are 59 tall; the lone cost row is drawn taller (78) so its group does not read as a footnote. */
const ROW_H: Record<CardGroup['key'], number> = { power: 59, gas: 59, cost: 78 };
const GROUP_STYLE: Record<CardGroup['key'], { tab: string; fill: string; label: number; tracking: number }> = {
  power: { tab: '#146bc4', fill: '#edf5fd', label: 17, tracking: 2 },
  gas: { tab: '#a96508', fill: '#fcf3e4', label: 20, tracking: 2.4 },
  cost: { tab: '#4f7a3a', fill: '#e5efd5', label: 15, tracking: 2 },
};
/** Header-row column edges, in header-row coordinates (the row sits at x 14). */
const TH = { metric: 64.5, thenRight: 551.5, nowRight: 676.5, changeRight: 801.5, pctCentre: 878 };

function Triangle({ dir }: { dir: CardRow['dir'] }) {
  if (dir === 'flat') return null;
  return (
    <svg width="16" height="14" viewBox="0 0 14 13" aria-hidden>
      <polygon points={dir === 'up' ? '7,0.5 13.5,12 0.5,12' : '0.5,1 13.5,1 7,12.5'} fill="currentColor" />
    </svg>
  );
}

function tone(t: CardTone) {
  return `yc-t-${t}`;
}

export function YoyCard({ model }: { model: YoyCardModel }) {
  return (
    <div className="yoyc" lang="en">
      <style>{CSS}</style>
      {/* eslint-disable @next/next/no-img-element -- rasterised by html-to-image, not served */}
      <img className="yc-abs yc-full" src="/images/yoy-card/bg-4x5.jpg" alt="" />
      <img className="yc-abs yc-skyline" src="/images/yoy-card/plant-4x5.svg" alt="" />
      <img className="yc-abs yc-skyline" src="/images/yoy-card/trees-4x5.svg" alt="" />

      <div className="yc-abs yc-hdr" />
      <img className="yc-abs yc-logo" src="/images/yoy-card/logo-4x5.png" alt="ESB Power Line" />
      <div className="yc-abs yc-hc">
        <div className="yc-k">Grid Explorer</div>
        <div className="yc-rule" />
        <div className="yc-ed">Year-on-Year comparison</div>
      </div>
      <div className="yc-abs yc-dates">
        <div className="yc-pub">Published · {model.published.weekday}</div>
        <div className="yc-day">{model.published.date}</div>
      </div>
      <div className="yc-abs yc-stripe" style={{ top: 0, height: 11.25 }} />
      <div className="yc-abs yc-stripe" style={{ top: 143.75, height: 11.25 }} />

      <div className="yc-abs yc-card">
        <div className="yc-abs yc-title">What changed in a year</div>
        <div className="yc-abs yc-band">
          <div className="yc-score">
            <div className="yc-side yc-then">
              <small>Then</small>
              <b>{model.thenLabel}</b>
            </div>
            <div className="yc-vs" aria-hidden>
              {/*
                Figma's 4 px dashed border on this diamond lands as four corner
                chevrons; CSS `dashed` chops it into many short dashes instead.
                So the stroke is drawn here with the master's own rhythm: each
                side (normalised to 25 units) keeps an 8-unit arm at either
                corner and leaves a 9-unit gap in the middle.
              */}
              <svg className="yc-dia" viewBox="0 0 46 46">
                <rect
                  x="4.9" y="4.9" width="36.2" height="36.2" rx="3"
                  transform="rotate(45 23 23)"
                  fill="#fff" stroke="#b4182f" strokeWidth="4"
                  pathLength="100" strokeDasharray="16 9" strokeDashoffset="8"
                />
              </svg>
              <span>VS</span>
            </div>
            <div className="yc-side yc-now">
              <small>As of</small>
              <b>{model.nowLabel}</b>
            </div>
          </div>
        </div>

        <div className="yc-abs yc-thead">
          <div className="yc-abs yc-th" style={{ left: TH.metric }}>Metric</div>
          <div className="yc-abs yc-th" style={{ right: 948 - TH.thenRight }}>{model.thenYear}</div>
          <div className="yc-abs yc-th" style={{ right: 948 - TH.nowRight }}>{model.nowYear}</div>
          <div className="yc-abs yc-th" style={{ right: 948 - TH.changeRight }}>Change</div>
          <div className="yc-abs yc-th" style={{ left: TH.pctCentre - 70, width: 140, textAlign: 'center' }}>Change %</div>
        </div>

        {model.groups.map((g) => {
          const s = GROUP_STYLE[g.key];
          const rh = ROW_H[g.key];
          const h = g.rows.length * rh;
          return (
            <div key={g.key} className="yc-abs yc-grp" style={{ top: GROUP_TOP[g.key], height: h }}>
              <div className="yc-abs yc-tab" style={{ height: h, background: s.tab }}>
                <span style={{ fontSize: s.label, letterSpacing: s.tracking }}>{g.label}</span>
              </div>
              <div className="yc-abs yc-rows" style={{ height: h, background: s.fill }}>
                {g.rows.map((r, i) => (
                  <div key={r.id} className="yc-row" style={{ top: i * rh, height: rh }}>
                    <div className="yc-m">{r.label}</div>
                    <div className="yc-num yc-old">
                      <span className="yc-v">{r.then}</span>
                      <span className="yc-u">{r.unit}</span>
                    </div>
                    <div className="yc-num yc-now">
                      <span className="yc-v">{r.now}</span>
                      <span className="yc-u">{r.unit}</span>
                    </div>
                    <div className={`yc-num yc-chg ${tone(r.tone)}`}>
                      <span className="yc-v">{r.change}</span>
                      <span className="yc-u">{r.unit}</span>
                    </div>
                    <div className="yc-pcol">
                      <div className={`yc-pill ${tone(r.tone)}`}>
                        <Triangle dir={r.dir} />
                        {r.pct}%
                      </div>
                    </div>
                    {i < g.rows.length - 1 && <div className="yc-abs yc-div" />}
                  </div>
                ))}
              </div>
              {/* After the rows, so it paints over their fill. */}
              <div className="yc-abs yc-notch" style={{ top: h / 2 - 11.25, borderLeftColor: s.tab }} />
            </div>
          );
        })}

        <div className="yc-abs yc-key">
          <div className="yc-key-in">
            <span className="yc-it"><i className="yc-dot" style={{ background: '#1c7040' }} />Improved</span>
            <i className="yc-sep" />
            <span className="yc-it"><i className="yc-dot" style={{ background: '#c62a24' }} />Worsened</span>
            <i className="yc-sep" />
            <span className="yc-it"><i className="yc-dot" style={{ background: '#14284a' }} />Neutral</span>
          </div>
        </div>

        <div className="yc-abs yc-link">
          <div className="yc-arch">
            <b>Daily archive</b>
            <span>since 2013</span>
          </div>
          <div className="yc-web">
            <small>Explore the complete grid data</small>
            <span className="yc-url">
              esbpowerline.com<b>/grid-explorer</b>
            </span>
          </div>
        </div>
      </div>

      <div className="yc-abs yc-foot" />
      <div className="yc-abs yc-stripe" style={{ top: 1278, height: 5 }} />
      <div className="yc-abs yc-fb">
        <span className="yc-ic">
          <img src="/images/yoy-card/facebook.svg" alt="" />
        </span>
        esbpowerlineofficial
      </div>
      <div className="yc-abs yc-src">
        <b>Source</b>
        <span>PGCB</span>
        <i />
        <span>Petrobangla</span>
      </div>
      <div className="yc-abs yc-yt">
        <img src="/images/yoy-card/youtube.png" alt="" />
        ESB Power Line
      </div>
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}
