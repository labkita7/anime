export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-[#262a38] bg-[#1a1d27]/50 px-6 py-10 text-center text-sm text-gray-400">
      {message}
    </div>
  );
}
