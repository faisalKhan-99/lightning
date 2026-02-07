'use client';

interface Props {
  hour: number;
}

export default function DayCycle({ hour }: Props) {
  const normalizedHour = ((hour % 24) + 24) % 24;
  const position = (normalizedHour / 24) * 100;
  const isDay = normalizedHour >= 6 && normalizedHour < 18;

  const getPeriod = () => {
    if (normalizedHour >= 6 && normalizedHour < 10) return 'Morning';
    if (normalizedHour >= 10 && normalizedHour < 16) return 'Day';
    if (normalizedHour >= 16 && normalizedHour < 20) return 'Evening';
    return 'Night';
  };

  const formatTime = (h: number) => {
    const hour12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${hour12}${ampm}`;
  };

  return (
    <div className="card-cyber p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="label-mono">Day/Night Cycle</span>
        <span className="text-sm font-medium text-txt-primary">
          {formatTime(normalizedHour)} - {getPeriod()}
        </span>
      </div>

      <div className="relative h-8 rounded-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right,
              #0a1628 0%,
              #0a1628 20%,
              #b8860b 25%,
              #c99a2e 35%,
              #d4a830 50%,
              #c99a2e 65%,
              #b8860b 75%,
              #0a1628 80%,
              #0a1628 100%
            )`
          }}
        />

        <div className="absolute inset-0 flex items-end">
          {[0, 6, 12, 18].map((h) => (
            <div
              key={h}
              className="absolute bottom-0 h-full flex flex-col justify-end"
              style={{ left: `${(h / 24) * 100}%` }}
            >
              <div className="w-px h-2 bg-surface-0/50" />
            </div>
          ))}
        </div>

        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 ease-out"
          style={{ left: `${position}%` }}
        >
          <div className="relative">
            <div
              className={`w-5 h-5 rounded-full ${
                isDay
                  ? 'bg-solar shadow-glow-solar'
                  : 'bg-home shadow-glow-home'
              }`}
            />
            <div
              className={`absolute inset-0 rounded-full blur-md -z-10 ${
                isDay ? 'bg-solar/40' : 'bg-home/30'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-1 label-mono">
        <span>12AM</span>
        <span>6AM</span>
        <span>12PM</span>
        <span>6PM</span>
        <span>12AM</span>
      </div>
    </div>
  );
}
