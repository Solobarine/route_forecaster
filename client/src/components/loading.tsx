import { CloudSun, MapPin, Truck } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm text-center">
        {/* Brand */}
        <div className="mb-10 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Truck size={21} />
          </div>
          <span className="text-xl font-semibold tracking-tight text-slate-900">
            Route Forecaster
          </span>
        </div>

        {/* Animated route illustration */}
        <div className="relative mx-auto mb-8 flex h-28 w-64 items-center justify-center">
          <div className="absolute left-5 right-5 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-slate-300" />

          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-emerald-600 shadow-sm">
            <MapPin size={17} />
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-rose-500 shadow-sm">
            <MapPin size={17} />
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-xl bg-slate-900 p-3 text-white shadow-lg">
            <Truck size={22} />
          </div>

          <div className="absolute right-12 top-0 animate-bounce text-amber-500">
            <CloudSun size={22} />
          </div>
        </div>

        {/* Loading message */}
        <h1 className="text-lg font-semibold text-slate-900">
          Planning your journey
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Analyzing routes and checking weather conditions...
        </p>

        {/* Progress indicator */}
        <div className="mx-auto mt-7 h-1 w-48 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/3 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-emerald-600" />
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Finding the best way forward
        </p>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
