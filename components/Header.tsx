import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Bagian Kiri: Logo / Nama Brand */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-2xl font-bold text-blue-600 dark:text-blue-400"
            >
              UAV Dasbor
            </Link>
          </div>

          {/* Bagian Tengah: Link Navigasi (Tersembunyi di HP) */}
          <div className="hidden md:flex md:space-x-8">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="/#fitur"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Fitur
            </Link>
            <Link
              href="/#harga"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Harga
            </Link>
          </div>

          {/* Bagian Kanan: Tombol Login/Daftar (Tersembunyi di HP) */}
          <div className="hidden md:block">
            <Link href="/login">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Login
              </button>
            </Link>
            <Link
              href="/register"
              className="ml-2 text-gray-600 dark:text-gray-300 font-medium text-sm"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
