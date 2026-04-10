import { useEffect, useRef } from "react";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface MentorLocation {
  name: string; field: string; county: string;
  lat: number; lng: number; rating: number;
  sessions: number; avatar: string; tags: string[]; bio: string;
}

interface MentorMapProps {
  mentors: MentorLocation[];
  matchStatuses?: Record<string, string>; // { [mentorId]: status }
  onSelectMentor?: (mentor: MentorLocation) => void;
  onCancelMatch?:  (mentor: MentorLocation) => void;
}

function getPopupButton(mentorName: string, status: string): string {
  if (status === "accepted") {
    return `
      <div style="display:flex;gap:6px;">
        <div style="flex:1;padding:8px;background:#16a34a;color:white;border-radius:8px;
          font-size:11px;font-weight:600;text-align:center;font-family:Inter,sans-serif;">
          ✓ Matched
        </div>
        <button onclick="window.dispatchEvent(new CustomEvent('mentor-cancel',{detail:'${mentorName}'}))"
          style="padding:8px 10px;background:#ef4444;color:white;border:none;border-radius:8px;
          font-size:11px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap;">
          Unmatch
        </button>
      </div>`;
  }
  if (status === "pending") {
    return `
      <div style="display:flex;gap:6px;">
        <div style="flex:1;padding:8px;background:#d1d5db;color:#374151;border-radius:8px;
          font-size:11px;font-weight:600;text-align:center;font-family:Inter,sans-serif;">
          ⏳ Request Sent
        </div>
        <button onclick="window.dispatchEvent(new CustomEvent('mentor-cancel',{detail:'${mentorName}'}))"
          style="padding:8px 10px;background:#f97316;color:white;border:none;border-radius:8px;
          font-size:11px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap;">
          Cancel
        </button>
      </div>`;
  }
  // none / declined / cancelled — show Request Match
  return `
    <button onclick="window.dispatchEvent(new CustomEvent('mentor-select',{detail:'${mentorName}'}))"
      style="width:100%;padding:8px;background:linear-gradient(135deg,#00A651,#006B3C);
      color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;
      cursor:pointer;font-family:Inter,sans-serif;">
      Request Match
    </button>`;
}

function buildPopupHtml(mentor: MentorLocation, status: string): string {
  return `
    <div style="font-family:Inter,sans-serif;min-width:220px;padding:4px 2px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:42px;height:42px;border-radius:50%;flex-shrink:0;
          background:linear-gradient(135deg,#00A651,#006B3C);
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:700;font-size:14px;">${mentor.avatar}</div>
        <div>
          <p style="margin:0;font-weight:700;font-size:14px;color:#111;">${mentor.name}</p>
          <p style="margin:0;font-size:11px;color:#555;">${mentor.field}</p>
          <p style="margin:0;font-size:11px;color:#888;">📍 ${mentor.county}</p>
        </div>
      </div>
      <p style="margin:0 0 6px;font-size:11px;color:#444;line-height:1.5;">${mentor.bio}</p>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;font-size:12px;">
        <span style="color:#f59e0b;font-weight:600;">★ ${mentor.rating}</span>
        <span style="color:#666;">${mentor.sessions} sessions</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">
        ${mentor.tags.map(t => `<span style="background:#E8F5E9;color:#006B3C;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;">${t}</span>`).join("")}
      </div>
      ${getPopupButton(mentor.name, status)}
    </div>`;
}

export default function MentorMap({ mentors, matchStatuses = {}, onSelectMentor, onCancelMatch }: MentorMapProps) {
  const mapRef         = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef     = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [-0.5, 37.5], zoom: 6, zoomControl: true, scrollWheelZoom: false,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mentors.forEach((mentor) => {
      const id     = (mentor as any).id || mentor.name;
      const status = matchStatuses[id] || "none";

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:38px;height:38px;
          background:linear-gradient(135deg,#00A651,#006B3C);
          border:3px solid white;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 3px 10px rgba(0,166,81,0.55);cursor:pointer;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>`,
        iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -42],
      });

      const marker = L.marker([mentor.lat, mentor.lng], { icon }).addTo(map);
      marker.bindPopup(buildPopupHtml(mentor, status), { maxWidth: 280 });
      markersRef.current.set(id, marker);
    });

    setTimeout(() => map.invalidateSize(), 200);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Re-render popup content when matchStatuses change (without re-initializing the map)
  useEffect(() => {
    mentors.forEach((mentor) => {
      const id     = (mentor as any).id || mentor.name;
      const marker = markersRef.current.get(id);
      if (!marker) return;
      const status = matchStatuses[id] || "none";
      marker.setPopupContent(buildPopupHtml(mentor, status));
    });
  }, [matchStatuses, mentors]);

  // Handle popup button events
  useEffect(() => {
    const handleSelect = (e: Event) => {
      const name   = (e as CustomEvent<string>).detail;
      const mentor = mentors.find(m => m.name === name);
      if (mentor && onSelectMentor) onSelectMentor(mentor);
    };
    const handleCancel = (e: Event) => {
      const name   = (e as CustomEvent<string>).detail;
      const mentor = mentors.find(m => m.name === name);
      if (mentor && onCancelMatch) onCancelMatch(mentor);
    };
    window.addEventListener("mentor-select", handleSelect);
    window.addEventListener("mentor-cancel", handleCancel);
    return () => {
      window.removeEventListener("mentor-select", handleSelect);
      window.removeEventListener("mentor-cancel", handleCancel);
    };
  }, [mentors, onSelectMentor, onCancelMatch]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: "500px" }} />;
}
