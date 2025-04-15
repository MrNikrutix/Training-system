// components/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { Home, Dumbbell, FileText, Calendar, Video, ClipboardList, GraduationCap, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Strona Główna", href: "/", icon: Home },
  { name: "Ćwiczenia", href: "/cwiczenia", icon: Dumbbell },
  { name: "Konspekty", href: "/konspekty", icon: FileText },
  { name: "Planer", href: "/planer", icon: ClipboardList },
  { name: "Kalendarz", href: "/kalendarz", icon: Calendar },
  { name: "Wideo analizator", href: "/wideo-analizator", icon: Video },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  return (
    <div
      className={cn(
        "fixed md:relative z-20 h-full transition-all duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-16",
        isOpen ? "w-64" : "w-0 md:w-16"
      )}
    >
      <div className="flex h-full flex-col border-r bg-card">
        <div className="p-6 flex justify-between items-center">
          <div className={cn("flex items-center gap-2 font-semibold", !isOpen && "md:hidden")}>
            <GraduationCap className="h-6 w-6" />
            <span className={cn("text-lg transition-opacity", !isOpen && "md:opacity-0")}>
              System Treningowy
            </span>
          </div>
          {isMobile && (
            <button onClick={() => setIsOpen(false)} className="md:hidden" aria-label="Close sidebar">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
                !isOpen && "md:justify-center"
              )}
              title={!isOpen ? item.name : undefined}
            >
              <item.icon className="h-4 w-4" />
              <span className={cn(!isOpen && "md:hidden")}>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
