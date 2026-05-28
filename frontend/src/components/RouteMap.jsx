import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";
import { STOP_META } from "../utils";

// Build a colored circular div-icon for a map marker.
function pinIcon(color, label) {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${color};
      width:26px;height:26px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2.5px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.35);
      display:grid;place-items:center;">
      <span style="transform:rotate(45deg);color:#fff;font-size:12px;font-weight:700;">${label}</span>
      </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

function smallIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${color};width:16px;height:16px;border-radius:50%;
      border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

export default function RouteMap({ plan }) {
  const geometry = plan.route?.geometry || [];
  const locations = plan.locations || {};

  const bounds = useMemo(() => {
    if (geometry.length) return geometry;
    return [
      [locations.current?.lat, locations.current?.lon],
      [locations.dropoff?.lat, locations.dropoff?.lon],
    ].filter((p) => p[0] != null);
  }, [geometry, locations]);

  // Intermediate stops (fuel/rest/break) — place along the route by fraction
  // of total distance so they appear roughly where they occur.
  const totalMiles = plan.summary?.total_distance_miles || 1;
  const intermediateStops = (plan.stops || []).filter((s) =>
    ["fuel", "rest", "break"].includes(s.kind)
  );

  const stopLatLng = (stop) => {
    if (!geometry.length) return null;
    const frac = Math.min(1, Math.max(0, stop.distance_miles / totalMiles));
    const idx = Math.min(
      geometry.length - 1,
      Math.round(frac * (geometry.length - 1))
    );
    return geometry[idx];
  };

  const mainPins = [
    { key: "current", color: "#2563eb", label: "A", title: "Current location" },
    { key: "pickup", color: "#16a34a", label: "P", title: "Pickup" },
    { key: "dropoff", color: "#dc2626", label: "D", title: "Drop-off" },
  ];

  const legend = [
    { c: "#3b82f6", t: "Current" },
    { c: "#16a34a", t: "Pickup" },
    { c: "#dc2626", t: "Drop-off" },
    { c: "#f59e0b", t: "Fuel" },
    { c: "#7c3aed", t: "Rest" },
    { c: "#0ea5e9", t: "Break" },
  ];

  return (
    <div className="map-wrap">
      <div className="map-legend">
        {legend.map((l) => (
          <div className="row" key={l.t}>
            <span className="dot" style={{ background: l.c }} />
            {l.t}
          </div>
        ))}
      </div>
      <MapContainer
        bounds={bounds.length > 1 ? bounds : undefined}
        center={bounds.length === 1 ? bounds[0] : [39.5, -98.35]}
        zoom={bounds.length > 1 ? undefined : 4}
        scrollWheelZoom
        boundsOptions={{ padding: [40, 40] }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {geometry.length > 1 && (
          <Polyline
            positions={geometry}
            pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.8 }}
          />
        )}

        {mainPins.map((p) => {
          const loc = locations[p.key];
          if (!loc) return null;
          return (
            <Marker
              key={p.key}
              position={[loc.lat, loc.lon]}
              icon={pinIcon(p.color, p.label)}
            >
              <Popup>
                <strong>{p.title}</strong>
                <br />
                {loc.name}
              </Popup>
            </Marker>
          );
        })}

        {intermediateStops.map((stop, i) => {
          const pos = stopLatLng(stop);
          if (!pos) return null;
          const meta = STOP_META[stop.kind] || { color: "#64748b" };
          return (
            <Marker
              key={`${stop.kind}-${i}`}
              position={pos}
              icon={smallIcon(meta.color)}
            >
              <Popup>
                <strong>
                  {meta.icon} {stop.label}
                </strong>
                <br />
                ~{Math.round(stop.distance_miles)} mi into trip
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
