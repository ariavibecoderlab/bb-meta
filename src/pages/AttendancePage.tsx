export default function AttendancePage({ profile }: { profile: any }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-700">📋 Attendance</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-400">
        <p className="text-lg mb-2">📋 Full Attendance View</p>
        <p className="text-sm">Attendance history, reports, and analytics</p>
      </div>
    </div>
  );
}
