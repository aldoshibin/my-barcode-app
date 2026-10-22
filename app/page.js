import Image from "next/image";
import BarcodePrint from "./barcode/page";
import BarcodePrintPage from "./barcodenew/page";
import LabelPrintPage from "./barcodeqr/page";

export default function Home() {
  return (
    <div>
      {/* <BarcodePrint /> */}
      {/* <BarcodePrintPage/> */}
      <LabelPrintPage/>
      </div>
  );
}
