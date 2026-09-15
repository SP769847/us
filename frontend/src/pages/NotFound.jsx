import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center text-white gap-3">
      <div className="text-4xl">💔</div>
      <p className="text-white/50 text-sm">This page doesn't exist.</p>
      <Link to="/" className="text-blush-300 hover:text-blush-200 text-sm">
        Go home
      </Link>
    </div>
  );
}
