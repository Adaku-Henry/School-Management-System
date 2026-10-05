import Icon from "./Icon";

export default function StatCard({
  label,
  value,
  icon,
  color = "navy",
  sub,
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: "navy" | "green" | "yellow" | "red";
  sub?: string;
}) {
  const colorMap: Record<string, string> = {
    navy: "bg-navy-900 text-white",
    green: "bg-brandGreen text-white",
    yellow: "bg-brandYellow text-navy-900",
    red: "bg-red-600 text-white",
  };

  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-navy-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon name={icon} className="w-5 h-5" />
      </div>
    </div>
  );
}
