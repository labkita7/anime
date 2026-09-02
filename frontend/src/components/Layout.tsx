import { Outlet } from 'react-router-dom';
import Header from './Header';
import { site } from '../config/site';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f1117] text-gray-200">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[#262a38] py-6">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {site.name}.</p>
          <a
            href={site.donationUrl}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Dukung via Donasi
          </a>
        </div>
      </footer>
    </div>
  );
}
