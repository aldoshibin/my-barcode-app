'use client';

/**
 * app/barcode/page.jsx  (Next.js App Router)
 *
 * Setup:  npm install jsbarcode
 * Open:   http://localhost:3000/barcode
 *
 * Input format (one per line):
 *   1001
 *   1002 | Product name
 *   1003 | Product name | Rs 250
 */

import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

/* ---------- Label presets (Custom = you type your own size) ---------- */
const PRESETS = {
  custom: { name: 'Custom', labelW: 60, labelH: 30, cols: 3, rows: 8, gapX: 2, gapY: 2, pageW: 210, pageH: 297, marginTop: 10, marginLeft: 10 },
  a4_3x8: { name: 'A4 sheet 3 x 8', labelW: 63.5, labelH: 33.9, cols: 3, rows: 8, gapX: 2.5, gapY: 0, pageW: 210, pageH: 297, marginTop: 13, marginLeft: 7 },
  a4_4x12: { name: 'A4 sheet 4 x 12', labelW: 48.5, labelH: 22, cols: 4, rows: 12, gapX: 2, gapY: 0, pageW: 210, pageH: 297, marginTop: 16, marginLeft: 6 },
  roll_50x25: { name: 'Roll 50 x 25 mm (1 per page)', labelW: 50, labelH: 25, cols: 1, rows: 1, gapX: 0, gapY: 0, pageW: 50, pageH: 25, marginTop: 0, marginLeft: 0 },
  roll_38x25_2up: { name: 'Roll 2-up 38 x 25 mm', labelW: 38, labelH: 25, cols: 2, rows: 1, gapX: 2, gapY: 0, pageW: 78, pageH: 25, marginTop: 0, marginLeft: 0 },
};

const num = (v, min = 0) => (Number.isFinite(+v) && +v >= min ? +v : min);
const pos = (v) => (Number.isFinite(+v) && +v > 0 ? +v : 1);

/* ---------- Single barcode (SVG) ---------- */
function Barcode({ value, format, barWidth, barHeight, showText, fontSize, fit }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, value, {
        format,
        width: barWidth,
        height: barHeight,
        displayValue: showText,
        fontSize,
        margin: 0,
      });
      // Scale to the label instead of overflowing
      ref.current.style.width = fit ? '100%' : 'auto';
      ref.current.style.height = fit ? '100%' : 'auto';
    } catch {
      ref.current.innerHTML = '';
    }
  }, [value, format, barWidth, barHeight, showText, fontSize, fit]);

  return <svg ref={ref} preserveAspectRatio="xMidYMid meet" style={{ maxWidth: '100%', minHeight: 0, flex: '1 1 auto' }} />;
}

/* ---------- Page ---------- */
export default function BarcodePrintPage() {
  const [codes, setCodes] = useState('1001 | Rice 1kg | Rs 60\n1002 | Sugar 1kg | Rs 45\n1003\n1004\n1005\n1006');
  const [copies, setCopies] = useState(1);
  const [format, setFormat] = useState('CODE128');
  const [preset, setPreset] = useState('custom');

  // Page / sheet (mm)
  const [pageW, setPageW] = useState(PRESETS.custom.pageW);
  const [pageH, setPageH] = useState(PRESETS.custom.pageH);
  const [marginTop, setMarginTop] = useState(PRESETS.custom.marginTop);
  const [marginLeft, setMarginLeft] = useState(PRESETS.custom.marginLeft);

  // Label grid (mm)
  const [cols, setCols] = useState(PRESETS.custom.cols);
  const [rows, setRows] = useState(PRESETS.custom.rows);
  const [labelW, setLabelW] = useState(PRESETS.custom.labelW);
  const [labelH, setLabelH] = useState(PRESETS.custom.labelH);
  const [gapX, setGapX] = useState(PRESETS.custom.gapX);
  const [gapY, setGapY] = useState(PRESETS.custom.gapY);
  const [padding, setPadding] = useState(1.5); // inner padding of a label (mm)

  // Barcode
  const [barWidth, setBarWidth] = useState(2);
  const [barHeight, setBarHeight] = useState(60);
  const [showText, setShowText] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [fit, setFit] = useState(true); // stretch barcode to fill the label area
  const [titleSize, setTitleSize] = useState(9); // pt, for the title / price lines

  const [border, setBorder] = useState(true);

  const applyPreset = (key) => {
    setPreset(key);
    const p = PRESETS[key];
    setLabelW(p.labelW); setLabelH(p.labelH);
    setCols(p.cols); setRows(p.rows);
    setGapX(p.gapX); setGapY(p.gapY);
    setPageW(p.pageW); setPageH(p.pageH);
    setMarginTop(p.marginTop); setMarginLeft(p.marginLeft);
  };

  // Any manual edit switches the preset to "Custom"
  const edit = (setter) => (v) => { setter(v); setPreset('custom'); };

  /* ---- build label list ---- */
  const items = codes
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [code, title = '', extra = ''] = l.split('|').map((s) => s.trim());
      return { code, title, extra };
    })
    .flatMap((it) => Array(pos(copies)).fill(it));

  const perPage = pos(rows) * pos(cols);
  const pages = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));

  const field = (label, value, setter, step = 1) => (
    <label className="field">
      <span>{label}</span>
      <input type="number" step={step} min="0" value={value} onChange={(e) => edit(setter)(e.target.value)} />
    </label>
  );

  return (
    <div className="root">
      <style>{`
        @page { size: ${pos(pageW)}mm ${pos(pageH)}mm; margin: 0; }
        * { box-sizing: border-box; }
        .root { font-family: system-ui, Arial, sans-serif; display: flex; gap: 24px; padding: 16px; align-items: flex-start; }
        .panel { width: 310px; flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow: auto; padding-right: 6px; }
        .panel h3 { margin: 12px 0 0; font-size: 14px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .field { display: flex; flex-direction: column; font-size: 12px; gap: 2px; }
        .field input, .panel select, .panel textarea { padding: 6px; border: 1px solid #bbb; border-radius: 4px; font-size: 13px; }
        .check { font-size: 13px; display: flex; gap: 6px; align-items: center; }
        .btn { padding: 10px; background: #111; color: #fff; border: 0; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .hint { font-size: 11px; color: #666; margin: 0; }
        .preview { flex: 1; min-width: 0; overflow: auto; background: #e5e5e5; padding: 16px; }
        .page { background: #fff; margin: 0 auto 16px; box-shadow: 0 1px 6px rgba(0,0,0,.25);
                display: grid; align-content: start; justify-content: start; overflow: hidden; }
        .label { display: flex; flex-direction: column; align-items: center; justify-content: center;
                 overflow: hidden; text-align: center; line-height: 1.15; }
        .label .t { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; font-weight: 600; }
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

      {/* ---------------- Settings panel ---------------- */}
      <div className="panel">
        <label className="field">
          <span>Codes (code | title | price) - one per line</span>
          <textarea rows={7} value={codes} onChange={(e) => setCodes(e.target.value)} />
        </label>

        <div className="grid2">
          {field('Copies of each', copies, setCopies)}
          <label className="field">
            <span>Format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option>CODE128</option>
              <option>CODE39</option>
              <option>EAN13</option>
              <option>EAN8</option>
              <option>UPC</option>
              <option>ITF14</option>
            </select>
          </label>
        </div>

        <h3>Label size</h3>
        <label className="field">
          <span>Preset</span>
          <select value={preset} onChange={(e) => applyPreset(e.target.value)}>
            {Object.entries(PRESETS).map(([k, p]) => (
              <option key={k} value={k}>{p.name}</option>
            ))}
          </select>
        </label>
        <div className="grid2">
          {field('Label width (mm)', labelW, setLabelW, 0.1)}
          {field('Label height (mm)', labelH, setLabelH, 0.1)}
          {field('Columns', cols, setCols)}
          {field('Rows', rows, setRows)}
          {field('Gap X (mm)', gapX, setGapX, 0.1)}
          {field('Gap Y (mm)', gapY, setGapY, 0.1)}
          {field('Inner padding (mm)', padding, setPadding, 0.5)}
        </div>
        <p className="hint">Typing any size automatically switches to "Custom".</p>

        <h3>Barcode size</h3>
        <div className="grid2">
          {field('Bar width (px)', barWidth, setBarWidth, 0.5)}
          {field('Bar height (px)', barHeight, setBarHeight)}
          {field('Code text size', fontSize, setFontSize)}
          {field('Title text (pt)', titleSize, setTitleSize, 0.5)}
        </div>
        <label className="check">
          <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} />
          Show code number under barcode
        </label>
        <label className="check">
          <input type="checkbox" checked={fit} onChange={(e) => setFit(e.target.checked)} />
          Fit barcode to label (keeps proportions)
        </label>
        <label className="check">
          <input type="checkbox" checked={border} onChange={(e) => setBorder(e.target.checked)} />
          Dashed border (preview only, hidden on print)
        </label>

        <h3>Page / paper</h3>
        <div className="grid2">
          {field('Page width (mm)', pageW, setPageW, 0.1)}
          {field('Page height (mm)', pageH, setPageH, 0.1)}
          {field('Margin top (mm)', marginTop, setMarginTop, 0.1)}
          {field('Margin left (mm)', marginLeft, setMarginLeft, 0.1)}
        </div>

        <button className="btn" onClick={() => window.print()}>Print</button>
        <p className="hint">
          In the print dialog set Margins = None and Scale = 100%.
          {items.length > 0 && ` ${items.length} label(s) on ${pages.length} page(s).`}
        </p>
      </div>

      {/* ---------------- Preview / print area ---------------- */}
      <div className="preview">
        {pages.map((pageItems, p) => (
          <div
            key={p}
            className="page"
            style={{
              width: `${pos(pageW)}mm`,
              height: `${pos(pageH)}mm`,
              paddingTop: `${num(marginTop)}mm`,
              paddingLeft: `${num(marginLeft)}mm`,
              gridTemplateColumns: `repeat(${pos(cols)}, ${pos(labelW)}mm)`,
              gridAutoRows: `${pos(labelH)}mm`,
              columnGap: `${num(gapX)}mm`,
              rowGap: `${num(gapY)}mm`,
            }}
          >
            {pageItems.map((it, i) => (
              <div
                key={i}
                className="label"
                style={{
                  padding: `${num(padding)}mm`,
                  border: border ? '1px dashed #aaa' : 'none',
                }}
              >
                {it.title && <div className="t" style={{ fontSize: `${pos(titleSize)}pt` }}>{it.title}</div>}
                <Barcode
                  value={it.code}
                  format={format}
                  barWidth={pos(barWidth)}
                  barHeight={pos(barHeight)}
                  showText={showText}
                  fontSize={pos(fontSize)}
                  fit={fit}
                />
                {it.extra && <div className="t" style={{ fontSize: `${pos(titleSize)}pt` }}>{it.extra}</div>}
              </div>
            ))}
          </div>
        ))}
        {pages.length === 0 && <p>Enter at least one code.</p>}
      </div>
    </div>
  );
}
