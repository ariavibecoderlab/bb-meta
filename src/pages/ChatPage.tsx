export default function ChatPage({ profile }: { profile: any }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-700">💬 Messages</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-400">
        <p className="text-lg mb-2">💬 Chat Coming Soon</p>
        <p className="text-sm">Secure messaging between parents, teachers, and admin</p>
        <p className="text-xs mt-2">Direct chat, class groups, campus broadcasts</p>
      </div>
    </div>
  );
}
