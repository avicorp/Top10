export default function ProgressRing({
  percentage,
  size = 64,
  colorClass = 'text-blue-500',
  label,
  sublabel,
}: {
  percentage: number;
  size?: number;
  colorClass?: string;
  label?: string;
  sublabel?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" style={{ width: size, height: size }} viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="dark:text-slate-700 text-slate-200"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
            className={colorClass}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {percentage}%
        </span>
      </div>
      {label && <span className="text-sm font-medium mt-2">{label}</span>}
      {sublabel && <span className="text-xs dark:text-slate-500 text-slate-400">{sublabel}</span>}
    </div>
  );
}
