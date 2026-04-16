export default function PerformancePage({ profile }: { profile: any }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-700">📊 Student Progress</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-400">
        <p className="text-lg mb-2">📊 Performance Tracker</p>
        <p className="text-sm">Progress tracking, weekly updates, learning plans, and portfolio</p>
      </div>
    </div>
  );
}
