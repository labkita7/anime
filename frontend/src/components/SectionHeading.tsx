import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function SectionHeading({
  title,
  subtitle,
  moreTo,
}: {
  title: string;
  subtitle?: string;
  moreTo?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
        {subtitle ? <p className="text-sm text-gray-400">{subtitle}</p> : null}
      </div>
      {moreTo ? (
        <Link
          to={moreTo}
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          Tampilkan Semua
        </Link>
      ) : null}
    </div>
  );
}

export function Section({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`container-page py-6 ${className}`}>{children}</section>;
}
