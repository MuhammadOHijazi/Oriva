import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Layout } from "@/components/layout";
import { Download, QrCode, Copy, Check, Facebook, Instagram, Phone } from "lucide-react";

export default function QrCodePage() {
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const appUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = "pill-guardian-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground font-display tracking-tight">QR Code</h1>
        <p className="text-muted-foreground mt-1">Scan to open the Pill Guardian app on any device.</p>
      </div>

      <div className="flex items-start gap-6 flex-wrap">
        <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-xl shadow-blue-100/40 p-8 flex flex-col items-center gap-6">

          <div className="flex items-center gap-2 text-primary">
            <QrCode className="w-5 h-5" />
            <span className="font-semibold text-sm">Orvia</span>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-inner border border-border/40">
            <QRCodeSVG
              ref={svgRef}
              value={appUrl}
              size={220}
              bgColor="#ffffff"
              fgColor="#1e293b"
              level="H"
              marginSize={1}
              imageSettings={{
                src: "",
                x: undefined,
                y: undefined,
                height: 0,
                width: 0,
                excavate: false,
              }}
            />
          </div>

          <p className="text-xs text-center text-muted-foreground px-4">
            Point your camera at this code to open the app
          </p>

          <div className="w-full bg-secondary/60 rounded-xl px-4 py-3 flex items-center justify-between gap-2 border border-border/40">
            <span className="text-xs text-muted-foreground truncate font-mono">{appUrl}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-6 rounded-2xl hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-lg shadow-primary/25"
          >
            <Download className="w-4 h-4" />
            Download QR Code
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Share this QR code with patients or caregivers to give them quick access.
        </p>

        {/* Contact numbers */}
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-foreground/80 font-mono text-sm">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>0963 936 861 180</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80 font-mono text-sm">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>0963 995 443 461</span>
          </div>
        </div>
        </div>

        {/* Social links */}
        <div className="flex flex-col gap-4">
          <a
            href="https://www.facebook.com/share/17Wn6cqjzY/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-4 rounded-2xl font-semibold text-white transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
            style={{ background: "#1877f2", boxShadow: "0 4px 16px rgba(24,119,242,0.35)" }}
          >
            <Facebook className="w-5 h-5" />
            View on Facebook
          </a>
          <a
            href="https://www.instagram.com/medi_track_box?igsh=MW9pazk3dTh3N3BsYw=="
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-4 rounded-2xl font-semibold text-white transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
            style={{ background: "linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4)", boxShadow: "0 4px 16px rgba(221,42,123,0.35)" }}
          >
            <Instagram className="w-5 h-5" />
            View on Instagram
          </a>
          <p className="text-xs text-muted-foreground px-1">Follow us on social media.</p>
        </div>
      </div>
    </Layout>
  );
}
