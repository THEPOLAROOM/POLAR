export function FeatureItem({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-royal text-white shadow-ice">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-sm tracking-wide text-navy sm:text-base">
          {title}
        </h3>
        <p className="mt-1 text-sm text-navy/70">{children}</p>
      </div>
    </div>
  );
}
