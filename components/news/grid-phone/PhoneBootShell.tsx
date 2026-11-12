import '@/app/grid-phone-boot.css';

/**
 * The phone app's frame, drawn by the server before any JavaScript runs.
 *
 * Without it, opening the Grid Explorer from the homepage dock on a phone
 * showed the desktop explorer squeezed to 390px for the second or two before
 * GridPhoneGate hydrated and laid the app over it, and before that the
 * route's desktop loading skeleton. The owner asked (2026-11-12) for a
 * "seamless transition from homepage to gridexplorer": this frame matches the
 * app's bar, day strip, cards and floating dock exactly, so the reader sees
 * the app from the first paint and the data simply fills in.
 *
 * Pure CSS, phone widths only (hidden from 768px). It disappears once the gate
 * has mounted (`html.gp-ready`, set in either view, so the classic desktop
 * view is never covered), and a <noscript> rule removes it for readers without
 * JavaScript, who keep the server-rendered desktop explorer underneath.
 */
export function PhoneBootShell() {
  return (
    <>
      <noscript>
        <style>{'.gp-boot{display:none!important}'}</style>
      </noscript>
      <div className="gp-boot" aria-hidden>
        <div className="gp-boot__bar">
          <span className="gp-boot__icon" />
          <div className="gp-boot__title">
            <b>Grid Explorer</b>
            <i />
          </div>
          <span className="gp-boot__icon" />
        </div>
        <div className="gp-boot__chips">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={i === 5 ? 'is-on' : undefined} />
          ))}
        </div>
        <div className="gp-boot__main">
          <div className="gp-boot__card gp-boot__card--sm" />
          <div className="gp-boot__card gp-boot__card--lg">
            <i className="w40" />
            <i className="hero" />
            <i className="plot" />
          </div>
          <div className="gp-boot__card gp-boot__card--md">
            <i className="w60" />
            <i className="w90" />
            <i className="w90" />
          </div>
        </div>
        <div className="gp-boot__dock">
          {['Overview', 'Supply', 'Grid', 'Gas', 'Trends'].map((l, i) => (
            <span key={l} className={i === 0 ? 'is-on' : undefined}>
              <em />
              {l}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
