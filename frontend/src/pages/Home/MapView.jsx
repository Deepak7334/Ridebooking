import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Navigation,
  LocateFixed,
  Car,
  Clock3,
  ShieldCheck,
} from 'lucide-react';

const MapView = ({
  pickupLocation,
  dropoffLocation,
}) => {
  const [loading, setLoading] = useState(true);

  const hasRoute =
    pickupLocation && dropoffLocation;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [pickupLocation, dropoffLocation]);

  return (
    <div
      className="
        relative
        w-full
        md:w-2/3
        h-[60vh]
        md:h-[82vh]
        overflow-hidden
        rounded-[32px]
        border
        border-white/10
        bg-[#0b1020]
        shadow-2xl
      "
    >

      {/* BACKGROUND */}

      <div className="absolute inset-0 bg-gradient-to-br from-[#101935] via-[#0b1020] to-[#0d1f1b]" />

      {/* GRID */}

      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '45px 45px',
        }}
      />

      {/* TOP BAR */}

      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">

        {/* LIVE */}

        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">

          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-70" />

            <div className="relative w-3 h-3 rounded-full bg-green-400" />
          </div>

          <div>
            <h3 className="text-white text-sm font-bold">
              Live Tracking
            </h3>

            <p className="text-white/45 text-xs">
              Drivers nearby
            </p>
          </div>
        </div>

        {/* LOCATION */}

        <button
          className="
            w-12
            h-12
            rounded-2xl
            bg-black/40
            backdrop-blur-xl
            border
            border-white/10
            flex
            items-center
            justify-center
            hover:bg-white/10
            transition-all
          "
        >
          <LocateFixed
            size={20}
            className="text-white"
          />
        </button>
      </div>

      {/* LOADING */}

      {loading ? (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">

          <div className="w-16 h-16 rounded-full border-[4px] border-white/10 border-t-yellow-400 animate-spin mb-5" />

          <h2 className="text-white text-xl font-bold">
            Loading Map...
          </h2>

          <p className="text-white/40 text-sm mt-2">
            Searching nearby drivers
          </p>
        </div>
      ) : hasRoute ? (
        <>
          {/* ROUTE LINE */}

          <svg
            className="absolute inset-0 w-full h-full z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M18,78 C30,60 45,45 80,25"
              stroke="url(#routeGradient)"
              strokeWidth="1"
              fill="none"
              strokeDasharray="4 2"
              strokeLinecap="round"
            />

            <defs>
              <linearGradient
                id="routeGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor="#4ade80"
                />

                <stop
                  offset="100%"
                  stopColor="#f43f5e"
                />
              </linearGradient>
            </defs>
          </svg>

          {/* PICKUP */}

          <div className="absolute left-[14%] bottom-[24%] z-20 flex flex-col items-center">

            <div className="relative">

              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />

              <div
                className="
                  relative
                  w-14
                  h-14
                  rounded-full
                  bg-green-500
                  border-4
                  border-white
                  flex
                  items-center
                  justify-center
                  shadow-[0_0_25px_rgba(74,222,128,0.8)]
                "
              >
                <Navigation
                  size={20}
                  className="text-white"
                />
              </div>
            </div>

            <div
              className="
                mt-3
                px-4
                py-3
                rounded-2xl
                bg-black/55
                backdrop-blur-xl
                border
                border-white/10
                max-w-[220px]
              "
            >
              <p className="text-green-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Pickup
              </p>

              <p className="text-white text-sm font-medium truncate">
                {pickupLocation}
              </p>
            </div>
          </div>

          {/* DROPOFF */}

          <div className="absolute right-[14%] top-[22%] z-20 flex flex-col items-center">

            <div className="relative">

              <div className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-60" />

              <div
                className="
                  relative
                  w-14
                  h-14
                  rounded-full
                  bg-rose-500
                  border-4
                  border-white
                  flex
                  items-center
                  justify-center
                  shadow-[0_0_25px_rgba(244,63,94,0.8)]
                "
              >
                <MapPin
                  size={20}
                  className="text-white"
                />
              </div>
            </div>

            <div
              className="
                mt-3
                px-4
                py-3
                rounded-2xl
                bg-black/55
                backdrop-blur-xl
                border
                border-white/10
                max-w-[220px]
              "
            >
              <p className="text-rose-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Dropoff
              </p>

              <p className="text-white text-sm font-medium truncate">
                {dropoffLocation}
              </p>
            </div>
          </div>

          {/* DRIVER CARD */}

          <div className="absolute bottom-5 left-5 right-5 z-30">

            <div
              className="
                rounded-[28px]
                bg-black/55
                backdrop-blur-2xl
                border
                border-white/10
                p-5
                shadow-2xl
              "
            >

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                {/* DRIVER */}

                <div className="flex items-center gap-4">

                  <div
                    className="
                      w-16
                      h-16
                      rounded-3xl
                      bg-gradient-to-br
                      from-yellow-400
                      to-orange-500
                      flex
                      items-center
                      justify-center
                      shadow-lg
                    "
                  >
                    <Car
                      size={28}
                      className="text-black"
                    />
                  </div>

                  <div>
                    <h2 className="text-white text-lg font-bold">
                      Driver Found
                    </h2>

                    <p className="text-white/45 text-sm mt-1">
                      Captain arriving shortly
                    </p>
                  </div>
                </div>

                {/* STATS */}

                <div className="flex flex-wrap items-center gap-3">

                  <div
                    className="
                      px-4
                      py-3
                      rounded-2xl
                      bg-white/5
                      border
                      border-white/10
                    "
                  >
                    <p className="text-white/40 text-xs">
                      Distance
                    </p>

                    <h3 className="text-white font-bold mt-1">
                      3.2 km
                    </h3>
                  </div>

                  <div
                    className="
                      px-4
                      py-3
                      rounded-2xl
                      bg-white/5
                      border
                      border-white/10
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <Clock3
                      size={16}
                      className="text-yellow-400"
                    />

                    <div>
                      <p className="text-white/40 text-xs">
                        ETA
                      </p>

                      <h3 className="text-white font-bold mt-1">
                        5 mins
                      </h3>
                    </div>
                  </div>

                  <div
                    className="
                      px-4
                      py-3
                      rounded-2xl
                      bg-emerald-500/10
                      border
                      border-emerald-500/20
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <ShieldCheck
                      size={16}
                      className="text-emerald-400"
                    />

                    <span className="text-emerald-400 text-sm font-semibold">
                      Safe Ride
                    </span>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">

          <div
            className="
              w-28
              h-28
              rounded-full
              bg-white/5
              border
              border-white/10
              flex
              items-center
              justify-center
              mb-6
              backdrop-blur-xl
            "
          >
            <MapPin
              size={46}
              className="text-white/50"
            />
          </div>

          <h2 className="text-white text-2xl sm:text-3xl font-extrabold">
            Search Your Ride
          </h2>

          <p className="text-white/40 text-sm sm:text-base mt-3 max-w-md leading-relaxed">
            Enter pickup and destination locations
            to display route details and nearby
            drivers.
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;