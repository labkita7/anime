import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { Section } from '../components/SectionHeading';

export default function NotFound() {
  usePageMeta('Halaman Tidak Ditemukan');
  return (
    <Section className="py-24 text-center">
      <p className="text-5xl font-extrabold text-white">404</p>
      <p className="mt-2 text-gray-400">Halaman yang Anda cari tidak ditemukan.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
      >
        Kembali ke Beranda
      </Link>
    </Section>
  );
}
