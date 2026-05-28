"use client";

import Link from "next/link";
import {
  Bath,
  BedDouble,
  MapPin,
  MoreHorizontal,
  Ruler,
} from "lucide-react";
import { PropertyCoverImage } from "@/components/property-cover-image";
import type { Property } from "@/lib/types";
import { useLanguage } from "@/context/language-context";
import { cn, getStatusColor } from "@/lib/utils";

type PropertyListCardProps = {
  property: Property;
  href: string;
  occupancyLabel?: string;
};

export function PropertyListCard({
  property,
  href,
  occupancyLabel,
}: PropertyListCardProps) {
  const { formatCurrency, formatStatus } = useLanguage();
  const occupied = property.status === "rented";

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-[18px] border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_rgba(28,25,23,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-[0_12px_32px_rgba(13,148,136,0.1)]"
    >
      <div className="relative h-40 overflow-hidden bg-stone-100">
        {property.images[0] ? (
          <PropertyCoverImage
            images={property.images}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400 text-sm">
            No image
          </div>
        )}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm",
            getStatusColor(property.status)
          )}
        >
          {formatStatus(property.status)}
        </span>
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-600 opacity-0 shadow transition-opacity group-hover:opacity-100"
          aria-label="Actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold text-stone-900 line-clamp-1 group-hover:text-primary-700 transition-colors">
          {property.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{property.subCity || property.address}</span>
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-stone-900 tabular-nums">
              {formatCurrency(property.monthlyRent)}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
              / month
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              occupied
                ? "bg-blue-50 text-blue-700"
                : "bg-emerald-50 text-emerald-700"
            )}
          >
            {occupancyLabel ?? (occupied ? "Occupied" : "Vacant")}
          </span>
        </div>
        <div className="mt-3 flex gap-3 border-t border-stone-100 pt-3 text-xs text-stone-600">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5 text-stone-400" />
            {property.bedrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-3.5 w-3.5 text-stone-400" />
            {property.bathrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5 text-stone-400" />
            {property.area} m²
          </span>
        </div>
      </div>
    </Link>
  );
}
