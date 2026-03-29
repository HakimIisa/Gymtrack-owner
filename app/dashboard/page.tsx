"use client";

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Welcome back, Owner</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Members", value: "—", accent: "blue" },
          { label: "Active", value: "—", accent: "green" },
          { label: "Expiring Soon", value: "—", accent: "orange" },
          { label: "Revenue (Month)", value: "—", accent: "purple" },
        ].map(({ label, value }) => (
          <div key={label} className="glass rounded-2xl p-4 border border-zinc-800">
            <p className="text-xs text-zinc-500 mb-2">{label}</p>
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-600">More features coming in the next phases.</p>
    </div>
  );
}
