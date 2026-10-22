'use client';

/**
 * app/barcode/page.jsx  (Next.js App Router)
 *
 * Setup:  npm install qrcode.react
 * Open:   http://localhost:3000/barcode
 *
 * Input format, one label per line:
 *   code | product name | MRP | selling price | copies(optional)
 *   000139205261 | 160P LS RULED | 50 | 46
 *   000139205262 | 200P LONG NOTE | 70 | 64 | 5
 */

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/* ---------- Presets (all values in mm). "Custom" = type your own ---------- */
const PRESETS = {
  roll3: { name: 'Roll 3-up (38 x 25 mm)', labelW: 38, labelH: 25, cols: 3, rows: 1, gapX: 2, gapY: 0, pageW: 118, pageH: 25, marginTop: 0, marginLeft: 0 },
  roll2: { name: 'Roll 2-up (50 x 30 mm)', labelW: 50, labelH: 30, cols: 2, rows: 1, gapX: 2, gapY: 0, pageW: 102, pageH: 30, marginTop: 0, marginLeft: 0 },
  roll1: { name: 'Roll 1-up (50 x 25 mm)', labelW: 50, labelH: 25, cols: 1, rows: 1, gapX: 0, gapY: 0, pageW: 50, pageH: 25, marginTop: 0, marginLeft: 0 },
  a4: { name: 'A4 sheet 3 x 8', labelW: 63.5, labelH: 33.9, cols: 3, rows: 8, gapX: 2.5, gapY: 0, pageW: 210, pageH: 297, marginTop: 13, marginLeft: 7 },
  custom: { name: 'Custom' },
};

const n = (v, min = 0) => (Number.isFinite(+v) && +v >= min ? +v : min);
const p = (v) => (Number.isFinite(+v) && +v > 0 ? +v : 1);
const money = (v) => (v !== '' && Number.isFinite(+v) ? (+v).toFixed(2) : v);

/* ---------- One label ---------- */
function Label({ item, s }) {
  return (
    <div
      className="label"
      style={{
        padding: `${n(s.padding)}mm`,
        border: s.border ? '1px dashed #aaa' : 'none',
      }}
    >
      <div className="top" style={{ gap: `${n(s.innerGap)}mm`, alignItems: s.alignTop ? 'flex-start' : 'center' }}>
        <QRCodeSVG
          value={item.code || ' '}
          size={128}
          level={s.ecc}
          marginSize={0}
          style={{ width: `${p(s.qrSize)}mm`, height: `${p(s.qrSize)}mm`, flexShrink: 0 }}
        />
        <div className="info">
          {s.showCode && <div style={{ fontSize: `${p(s.codeSize)}pt` }}>{item.code}</div>}
          {s.showMrp && item.mrp !== '' && (
            <div style={{ fontSize: `${p(s.mrpSize)}pt` }}>
              {s.mrpText} {money(item.mrp)}
            </div>
          )}
          {s.showPrice && item.price !== '' && (
            <div style={{ fontSize: `${p(s.priceSize)}pt`, fontWeight: 700 }}>
              {s.priceText} {money(item.price)}
            </div>
          )}
        </div>
      </div>
      {s.showName && item.name && (
        <div className="name" style={{ fontSize: `${p(s.nameSize)}pt` }}>
          {item.name}
        </div>
      )}
    </div>
  );
}

/* ---------- Page ---------- */
export default function LabelPrintPage() {
  const [text, setText] = useState(
    '000139205261 | 160P LS RULED | 50 | 46\n000139205262 | 200P LONG NOTE | 70 | 64\n000139205263 | PENCIL BOX | 120 | 110'
  );
  const [copies, setCopies] = useState(3);
  const [preset, setPreset] = useState('roll3');

  const [s, setS] = useState({
    ...PRESETS.roll3,
    padding: 1.5,
    innerGap: 1,
    qrSize: 12,
    ecc: 'M',
    alignTop: false,
    codeSize: 6,
    mrpSize: 7,
    priceSize: 9,
    nameSize: 7,
    mrpText: 'MRP:',
    priceText: 'Rs.',
    showCode: true,
    showMrp: true,
    showPrice: true,
    showName: true,
    border: true,
  });

  const set = (key) => (value) => {
    setS((o) => ({ ...o, [key]: value }));
    if (PRESETS.roll3[key] !== undefined) setPreset('custom'); // sheet/grid edit => custom
  };

  const applyPreset = (key) => {
    setPreset(key);
    if (key !== 'custom') setS((o) => ({ ...o, ...PRESETS[key] }));
  };

  /* ---- parse input ---- */
  const items = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const [code = '', name = '', mrp = '', price = '', qty = ''] = line.split('|').map((x) => x.trim());
      const count = qty && +qty > 0 ? +qty : p(copies);
      return Array(count).fill({ code, name, mrp, price });
    });

  const perPage = p(s.rows) * p(s.cols);
  const pages = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));

  /* ---- small UI helpers ---- */
  const num = (label, key, step = 1) => (
    <label className="field" key={key}>
      <span>{label}</span>
      <input type="number" step={step} min="0" value={s[key]} onChange={(e) => set(key)(e.target.value)} />
    </label>
  );
  const txt = (label, key) => (
    <label className="field" key={key}>
      <span>{label}</span>
      <input type="text" value={s[key]} onChange={(e) => set(key)(e.target.value)} />
    </label>
  );
  const chk = (label, key) => (
    <label className="check" key={key}>
      <input type="checkbox" checked={s[key]} onChange={(e) => set(key)(e.target.checked)} />
      {label}
    </label>
  );

  return (
    <div className="root">
      <style>{`
        @page { size: ${p(s.pageW)}mm ${p(s.pageH)}mm; margin: 0; }
        * { box-sizing: border-box; }
        .root { font-family: Arial, Helvetica, sans-serif; display: flex; gap: 24px; padding: 16px; align-items: flex-start; }
        .panel { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow: auto; padding-right: 6px; }
        .panel h3 { margin: 12px 0 0; font-size: 14px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .field { display: flex; flex-direction: column; font-size: 12px; gap: 2px; }
        .field input, .panel select, .panel textarea { padding: 6px; border: 1px solid #bbb; border-radius: 4px; font-size: 13px; }
        .check { font-size: 13px; display: flex; gap: 6px; align-items: center; }
        .btn { padding: 10px; background: #111; color: #fff; border: 0; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .hint { font-size: 11px; color: #666; margin: 0; }
        .preview { flex: 1; min-width: 0; overflow: auto; background: #e5e5e5; padding: 16px; }
        .page { background: #fff; margin: 0 auto 12px; box-shadow: 0 1px 6px rgba(0,0,0,.25);
                display: grid; align-content: start; justify-content: start; overflow: hidden; }
        .label { display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; color: #000; line-height: 1.2; }
        .top { display: flex; min-height: 0; }
        .info { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
        .info div { white-space: nowrap; }
        .name { font-weight: 700; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        @media print {
          html, body { margin: 0 !important; background: #fff !important; }
          .panel { display: none !important; }
          .root { display: block; padding: 0; }
          .preview { overflow: visible; background: none; padding: 0; }
          .page { margin: 0; box-shadow: none; break-after: page; page-break-after: always; }
          .page:last-child { break-after: auto; page-break-after: auto; }
          .label { border: none !important; }
        }
      `}</style>

      {/* ---------------- Settings ---------------- */}
      <div className="panel">
        <label className="field">
          <span>code | name | MRP | price | copies (optional)</span>
          <textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <label className="field">
          <span>Default copies per line</span>
          <input type="number" min="1" value={copies} onChange={(e) => setCopies(e.target.value)} />
        </label>

        <h3>Label size</h3>
        <label className="field">
          <span>Preset</span>
          <select value={preset} onChange={(e) => applyPreset(e.target.value)}>
            {Object.entries(PRESETS).map(([k, v]) => (
              <option key={k} value={k}>{v.name}</option>
            ))}
          </select>
        </label>
        <div className="grid2">
          {num('Label width (mm)', 'labelW', 0.1)}
          {num('Label height (mm)', 'labelH', 0.1)}
          {num('Labels across (cols)', 'cols')}
          {num('Rows per page', 'rows')}
          {num('Gap X (mm)', 'gapX', 0.1)}
          {num('Gap Y (mm)', 'gapY', 0.1)}
          {num('Inner padding (mm)', 'padding', 0.5)}
          {num('QR - text gap (mm)', 'innerGap', 0.5)}
        </div>

        <h3>QR code</h3>
        <div className="grid2">
          {num('QR size (mm)', 'qrSize', 0.5)}
          <label className="field">
            <span>Error correction</span>
            <select value={s.ecc} onChange={(e) => set('ecc')(e.target.value)}>
              <option value="L">L (smallest)</option>
              <option value="M">M</option>
              <option value="Q">Q</option>
              <option value="H">H (strongest)</option>
            </select>
          </label>
        </div>
        {chk('Align QR and text to top', 'alignTop')}

        <h3>Text</h3>
        <div className="grid2">
          {num('Code size (pt)', 'codeSize', 0.5)}
          {num('MRP size (pt)', 'mrpSize', 0.5)}
          {num('Price size (pt)', 'priceSize', 0.5)}
          {num('Name size (pt)', 'nameSize', 0.5)}
          {txt('MRP prefix', 'mrpText')}
          {txt('Price prefix', 'priceText')}
        </div>
        {chk('Show code number', 'showCode')}
        {chk('Show MRP', 'showMrp')}
        {chk('Show selling price', 'showPrice')}
        {chk('Show product name', 'showName')}
        {chk('Dashed border (preview only)', 'border')}

        <h3>Page / paper</h3>
        <div className="grid2">
          {num('Page width (mm)', 'pageW', 0.1)}
          {num('Page height (mm)', 'pageH', 0.1)}
          {num('Margin top (mm)', 'marginTop', 0.1)}
          {num('Margin left (mm)', 'marginLeft', 0.1)}
        </div>

        <button className="btn" onClick={() => window.print()}>Print</button>
        <p className="hint">
          Print dialog: Margins = None, Scale = 100%, paper size = your roll size.
          {items.length > 0 && ` ${items.length} label(s) on ${pages.length} page(s).`}
        </p>
      </div>

      {/* ---------------- Preview / print area ---------------- */}
      <div className="preview">
        {pages.map((pageItems, pi) => (
          <div
            key={pi}
            className="page"
            style={{
              width: `${p(s.pageW)}mm`,
              height: `${p(s.pageH)}mm`,
              paddingTop: `${n(s.marginTop)}mm`,
              paddingLeft: `${n(s.marginLeft)}mm`,
              gridTemplateColumns: `repeat(${p(s.cols)}, ${p(s.labelW)}mm)`,
              gridAutoRows: `${p(s.labelH)}mm`,
              columnGap: `${n(s.gapX)}mm`,
              rowGap: `${n(s.gapY)}mm`,
            }}
          >
            {pageItems.map((it, i) => (
              <Label key={i} item={it} s={s} />
            ))}
          </div>
        ))}
        {pages.length === 0 && <p>Enter at least one line.</p>}
      </div>
    </div>
  );
}
