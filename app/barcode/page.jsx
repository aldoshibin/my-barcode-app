'use client';

// npm install jsbarcode
import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

function Barcode({ value, format, barWidth, barHeight, showText, fontSize }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, value, {
        format,
        width: barWidth,      // thickness of each bar (px)
        height: barHeight,    // bar height (px)
        displayValue: showText,
        fontSize,
        margin: 0,
      });
    } catch {
      ref.current.innerHTML = ''; // invalid value for this format
    }
  }, [value, format, barWidth, barHeight, showText, fontSize]);

  return <svg ref={ref} style={{ maxWidth: '100%', maxHeight: '100%' }} />;
}

const num = (v) => (Number.isFinite(+v) && +v > 0 ? +v : 1);

export default function BarcodePrint() {
  const [codes, setCodes] = useState('1001\n1002\n1003\n1004\n1005\n1006');
  const [copies, setCopies] = useState(1);
  const [format, setFormat] = useState('CODE128');

  // Sheet (page) settings, in mm
  const [pageW, setPageW] = useState(210); // A4
  const [pageH, setPageH] = useState(297);
  const [marginTop, setMarginTop] = useState(10);
  const [marginLeft, setMarginLeft] = useState(10);

  // Grid settings
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(8);
  const [labelW, setLabelW] = useState(60); // mm
  const [labelH, setLabelH] = useState(30); // mm
  const [gapX, setGapX] = useState(2);
  const [gapY, setGapY] = useState(2);

  // Barcode settings (inside each label)
  const [barWidth, setBarWidth] = useState(2);
  const [barHeight, setBarHeight] = useState(60);
  const [showText, setShowText] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [border, setBorder] = useState(true);

  const list = codes
    .split('\n')
    .map((c) => c.trim())
    .filter(Boolean)
    .flatMap((c) => Array(num(copies)).fill(c));

  const perPage = num(rows) * num(cols);
  const pages = [];
  for (let i = 0; i < list.length; i += perPage) pages.push(list.slice(i, i + perPage));

  const field = (label, value, setter, step = 1) => (
    <label className="field">
      <span>{label}</span>
      <input type="number" step={step} min="0" value={value} onChange={(e) => setter(e.target.value)} />
    </label>
  );

  return (
    <div className="root">
      <style>{`
        @page { size: ${num(pageW)}mm ${num(pageH)}mm; margin: 0; }
        .root { font-family: system-ui, sans-serif; display: flex; gap: 24px; padding: 16px; }
        .panel { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; }
        .panel h3 { margin: 10px 0 0; font-size: 14px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .field { display: flex; flex-direction: column; font-size: 12px; gap: 2px; }
        .field input, .panel select, .panel textarea { padding: 6px; border: 1px solid #bbb; border-radius: 4px; }
        .check { font-size: 13px; display: flex; gap: 6px; align-items: center; }
        .btn { padding: 10px; background: #111; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
        .preview { overflow: auto; flex: 1; background: #e5e5e5; padding: 16px; }
        .page { background: #fff; margin: 0 auto 16px; box-shadow: 0 1px 6px rgba(0,0,0,.25);
                box-sizing: border-box; display: grid; align-content: start; justify-content: start; overflow: hidden; }
        .label { display: flex; align-items: center; justify-content: center; overflow: hidden; box-sizing: border-box; }
        @media print {
          .panel { display: none !important; }
          .root { display: block; padding: 0; }
          .preview { overflow: visible; background: none; padding: 0; }
          .page { margin: 0; box-shadow: none; page-break-after: always; break-after: page; }
          .page:last-child { page-break-after: auto; break-after: auto; }
        }
      `}</style>

      <div className="panel">
        <label className="field">
          <span>Barcodes (one per line)</span>
          <textarea rows={6} value={codes} onChange={(e) => setCodes(e.target.value)} />
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

        <h3>Grid</h3>
        <div className="grid2">
          {field('Columns', cols, setCols)}
          {field('Rows', rows, setRows)}
          {field('Label width (mm)', labelW, setLabelW)}
          {field('Label height (mm)', labelH, setLabelH)}
          {field('Gap X (mm)', gapX, setGapX, 0.5)}
          {field('Gap Y (mm)', gapY, setGapY, 0.5)}
        </div>

        <h3>Barcode</h3>
        <div className="grid2">
          {field('Bar width (px)', barWidth, setBarWidth, 0.5)}
          {field('Bar height (px)', barHeight, setBarHeight)}
          {field('Text size', fontSize, setFontSize)}
        </div>
        <label className="check">
          <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} />
          Show text under barcode
        </label>
        <label className="check">
          <input type="checkbox" checked={border} onChange={(e) => setBorder(e.target.checked)} />
          Label border (for preview/cutting)
        </label>

        <h3>Page</h3>
        <div className="grid2">
          {field('Page width (mm)', pageW, setPageW)}
          {field('Page height (mm)', pageH, setPageH)}
          {field('Margin top (mm)', marginTop, setMarginTop)}
          {field('Margin left (mm)', marginLeft, setMarginLeft)}
        </div>

        <button className="btn" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="preview">
        {pages.map((items, p) => (
          <div
            key={p}
            className="page"
            style={{
              width: `${num(pageW)}mm`,
              height: `${num(pageH)}mm`,
              padding: `${marginTop}mm 0 0 ${marginLeft}mm`,
              gridTemplateColumns: `repeat(${num(cols)}, ${num(labelW)}mm)`,
              gridAutoRows: `${num(labelH)}mm`,
              columnGap: `${gapX}mm`,
              rowGap: `${gapY}mm`,
            }}
          >
            {items.map((code, i) => (
              <div
                key={i}
                className="label"
                style={{ border: border ? '1px dashed #999' : 'none' }}
              >
                <Barcode
                  value={code}
                  format={format}
                  barWidth={num(barWidth)}
                  barHeight={num(barHeight)}
                  showText={showText}
                  fontSize={num(fontSize)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
