import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        
        {/* Logo / Brand Name */}
        <div className="text-xl font-bold tracking-wide">
          <Link href="/">World Majalis</Link>
        </div>

        {/* Navigation Links */}
        <div className="flex space-x-6 text-sm font-medium">
          <Link href="/" className="hover:text-blue-400 transition-colors">
            Home
          </Link>
          <Link href="/about" className="hover:text-blue-400 transition-colors">
            About Us
          </Link>
          <Link href="/donations" className="hover:text-blue-400 transition-colors">
            Donations
          </Link>
        </div>
        
      </div>
    </nav>
  );
}