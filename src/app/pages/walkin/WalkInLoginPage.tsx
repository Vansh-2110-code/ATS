import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function WalkInLoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-500">Redirecting to login...</p>
      </div>
    </div>
  );
}
