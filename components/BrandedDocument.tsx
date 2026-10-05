export default function BrandedDocument({
  settings,
  documentType,
  title,
  children,
}: {
  settings: any;
  documentType: string;
  title: string;
  children: React.ReactNode;
}) {
  let watermarkTargets: string[] = [];
  try { watermarkTargets = JSON.parse(settings?.watermarkAppliesTo || "[]"); } catch { watermarkTargets = []; }
  const showWatermark = Boolean(settings?.watermarkEnabled && settings?.logoUrl && watermarkTargets.includes(documentType));
  const opacity = Math.min(20, Math.max(5, Number(settings?.watermarkOpacity) || 10)) / 100;
  const primaryColor = settings?.primaryColor || "#102a56";
  const secondaryColor = settings?.secondaryColor || "#167d72";

  return (
    <article className="relative isolate overflow-hidden bg-white p-7 text-slate-800 shadow-sm sm:p-10 print:p-8 print:shadow-none" style={{ borderTop: `5px solid ${primaryColor}` }}>
      {showWatermark && <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <img src={settings.logoUrl} alt="" className="max-h-[45%] max-w-[55%] object-contain" style={{ opacity, transform: settings.watermarkPosition === "DIAGONAL" ? "rotate(-28deg)" : undefined }} />
      </div>}
      <header className="relative z-10 flex items-center gap-4 border-b pb-5" style={{ borderColor: secondaryColor }}>
        {settings?.logoUrl ? <img src={settings.logoUrl} alt="School logo" className="h-16 w-16 shrink-0 object-contain" /> : <div className="h-16 w-16 shrink-0 rounded bg-slate-100" />}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold" style={{ color: primaryColor }}>{settings?.schoolName || "School"}</h1>
          {settings?.motto && <p className="text-sm italic text-slate-600">{settings.motto}</p>}
          <p className="mt-1 text-xs text-slate-500">{[settings?.address, settings?.phone, settings?.email, settings?.website].filter(Boolean).join(" · ")}</p>
          {settings?.schoolRegistrationNumber && <p className="text-xs text-slate-500">Registration: {settings.schoolRegistrationNumber}</p>}
        </div>
      </header>
      <div className="relative z-10 py-5">
        <h2 className="mb-5 text-center text-lg font-bold uppercase tracking-wide" style={{ color: primaryColor }}>{title}</h2>
        {children}
      </div>
      <footer className="relative z-10 border-t pt-4 text-center text-xs text-slate-500" style={{ borderColor: secondaryColor }}>
        {settings?.schoolName || "School"} · Computer-generated {title.toLowerCase()}
      </footer>
    </article>
  );
}