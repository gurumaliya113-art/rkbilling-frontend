import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <p className="text-7xl font-extrabold text-brand-500">404</p>
      <p className="mt-2 text-lg font-semibold">Page not found</p>
      <Link to="/" className="btn-primary mt-6">Back to Dashboard</Link>
    </div>
  );
}
