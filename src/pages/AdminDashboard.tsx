export default function AdminDashboard({ profile: _profile }: { profile: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold">Admin Panel 🏫</h1>
        <p className="text-purple-100 mt-1">Campus Management Dashboard</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-400">
        <p className="text-lg mb-2">🚧 Under Construction</p>
        <p className="text-sm">Full admin dashboard coming in Phase 2</p>
        <p className="text-xs mt-2">Campus management, reports, broadcast, staff management</p>
      </div>
    </div>
  );
}
