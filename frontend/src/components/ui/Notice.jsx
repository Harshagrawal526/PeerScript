// Full-screen message shown in place of a page: a room that cannot be opened,
// a URL that does not exist. Actions are passed as children.
export default function Notice({ title, titleClassName, message, children }) {
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className={`text-2xl font-bold mb-4 ${titleClassName}`}>{title}</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex gap-3 justify-center">{children}</div>
      </div>
    </div>
  );
}
