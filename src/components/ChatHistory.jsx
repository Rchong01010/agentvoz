export default function ChatHistory({ messages }) {
  if (messages.length === 0) return null;

  return (
    <div className="w-full max-w-lg mx-auto max-h-48 overflow-y-auto space-y-3 px-4 scrollbar-thin">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
            msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
          }`}>
            {msg.role === 'assistant' ? (
              <div>
                <p className="font-medium">{msg.spanish}</p>
                <p className="text-zinc-400 text-xs mt-1">{msg.english}</p>
                {msg.correction && (
                  <p className="text-amber-400 text-xs mt-1 border-t border-zinc-700 pt-1">
                    {msg.correction}
                  </p>
                )}
              </div>
            ) : (
              <p>{msg.content}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
