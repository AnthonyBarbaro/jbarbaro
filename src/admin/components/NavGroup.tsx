"use client";

import type { ReactNode } from "react";

import { ChevronDown } from "lucide-react";

type NavGroupProps = {
  children: ReactNode;
  count: number;
  description?: string;
  id: string;
  isOpen: boolean;
  label: string;
  onToggle: (id: string) => void;
};

export function NavGroup({ children, count, description, id, isOpen, label, onToggle }: NavGroupProps) {
  return (
    <section className={`jb-admin-sidebar__group ${isOpen ? "is-open" : "is-collapsed"}`}>
      <button
        aria-controls={`${id}-panel`}
        aria-expanded={isOpen}
        className="jb-admin-sidebar__group-toggle"
        onClick={() => onToggle(id)}
        type="button"
      >
        <span className="jb-admin-sidebar__group-text">
          <span className="jb-admin-sidebar__group-label">{label}</span>
          {description ? <span className="jb-admin-sidebar__group-description">{description}</span> : null}
        </span>
        <span className="jb-admin-sidebar__group-meta">
          <span className="jb-admin-sidebar__group-count">{count}</span>
          <ChevronDown aria-hidden="true" className="jb-admin-sidebar__group-chevron" />
        </span>
      </button>
      <div className="jb-admin-sidebar__group-panel" id={`${id}-panel`}>
        <div className="jb-admin-sidebar__group-inner">{children}</div>
      </div>
    </section>
  );
}
