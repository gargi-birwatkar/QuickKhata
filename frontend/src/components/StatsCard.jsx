import React from 'react';

export default function StatsCard({ title, value, subtitle, icon: Icon, badge, colorClass = "emerald" }) {
  const colorMap = {
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      iconBg: "bg-emerald-100 text-emerald-700",
      border: "border-emerald-100",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      iconBg: "bg-amber-100 text-amber-700",
      border: "border-amber-100",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      iconBg: "bg-blue-100 text-blue-700",
      border: "border-blue-100",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      iconBg: "bg-purple-100 text-purple-700",
      border: "border-purple-100",
    },
  };

  const scheme = colorMap[colorClass] || colorMap.emerald;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
          {value}
        </h3>
        {badge && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${scheme.bg} ${scheme.text} border ${scheme.border}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
