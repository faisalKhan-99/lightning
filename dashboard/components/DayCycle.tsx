'use client';

interface Props {
  hour: number; // 0-24
}

export default function DayCycle({ hour }: Props) {
  // Normalize hour to 0-24 range
  const normalizedHour = ((hour % 24) + 24) % 24;

  // Calculate position percentage (0-100)
  const position = (normalizedHour / 24) * 100;

  // Determine if it's day (6-18) or night (18-6)
  const isDay = normalizedHour >= 6 && normalizedHour < 18;

  // Get period label
  const getPeriod = () => {
    if (normalizedHour >= 6 && normalizedHour < 10) return 'Morning';
    if (normalizedHour >= 10 && normalizedHour < 16) return 'Day';
    if (normalizedHour >= 16 && normalizedHour < 20) return 'Evening';
    return 'Night';
  };

  // Format time display
  const formatTime = (h: number) => {
    const hour12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${hour12}${ampm}`;
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wide">Day/Night Cycle</span>
        <span className="text-sm font-medium text-gray-300">
          {formatTime(normalizedHour)} - {getPeriod()}
        </span>
      </div>

      {/* Gradient bar */}
      <div className="relative h-8 rounded-full overflow-hidden">
        {/* Background gradient representing 24-hour cycle */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right,
              #1e3a5f 0%,      /* Midnight - dark blue */
              #1e3a5f 20%,     /* 4:48 AM */
              #f97316 25%,     /* 6 AM - dawn orange */
              #fbbf24 35%,     /* 8:24 AM - morning yellow */
              #fcd34d 50%,     /* Noon - bright yellow */
              #fbbf24 65%,     /* 3:36 PM - afternoon yellow */
              #f97316 75%,     /* 6 PM - dusk orange */
              #1e3a5f 80%,     /* 7:12 PM - night begins */
              #1e3a5f 100%     /* Midnight - dark blue */
            )`
          }}
        />

        {/* Time markers */}
        <div className="absolute inset-0 flex items-end">
          {[0, 6, 12, 18].map((h) => (
            <div
              key={h}
              className="absolute bottom-0 h-full flex flex-col justify-end"
              style={{ left: `${(h / 24) * 100}%` }}
            >
              <div className="w-px h-2 bg-gray-900/50" />
            </div>
          ))}
        </div>

        {/* Current position indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 ease-out"
          style={{ left: `${position}%` }}
        >
          <div className="relative">
            {/* Icon */}
            <span className="text-xl drop-shadow-lg">
              {isDay ? '☀️' : '🌙'}
            </span>
            {/* Glow effect */}
            <div
              className={`absolute inset-0 blur-md rounded-full -z-10 ${
                isDay ? 'bg-yellow-400/50' : 'bg-blue-400/30'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>12AM</span>
        <span>6AM</span>
        <span>12PM</span>
        <span>6PM</span>
        <span>12AM</span>
      </div>
    </div>
  );
}
