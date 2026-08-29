import { Link } from 'react-router-dom';
import Notice from '../components/ui/Notice';

export default function NotFound() {
  return (
    <Notice
      title="404 - Page Not Found"
      titleClassName="text-purple-600"
      message="That page does not exist. It may have been moved, or the link may be wrong."
    >
      <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
        Go to Home
      </Link>
      <Link to="/dashboard" className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300">
        My Rooms
      </Link>
    </Notice>
  );
}
