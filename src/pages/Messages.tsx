import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Redirect legacy /messages route to Community messages tab
export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUser = searchParams.get('user');

  useEffect(() => {
    const params = targetUser ? `?tab=messages&user=${targetUser}` : '?tab=messages';
    navigate(`/community${params}`, { replace: true });
  }, [navigate, targetUser]);

  return null;
}
