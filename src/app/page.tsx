import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <main className="text-center px-6">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Team Share
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          팀원들과 자료를 공유하고
          <br />
          실시간으로 소통하세요
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            회원가입
          </Link>
        </div>
      </main>
    </div>
  );
}
