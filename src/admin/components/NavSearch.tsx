"use client";

import { Search, X } from "lucide-react";

type NavSearchProps = {
  onChange: (value: string) => void;
  value: string;
};

export function NavSearch({ onChange, value }: NavSearchProps) {
  return (
    <label className="jb-admin-sidebar__search" htmlFor="jb-admin-sidebar-search">
      <Search aria-hidden="true" className="jb-admin-sidebar__search-icon" />
      <input
        autoComplete="off"
        id="jb-admin-sidebar-search"
        name="sidebar-search"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search collections and globals"
        type="search"
        value={value}
      />
      {value ? (
        <button
          aria-label="Clear navigation search"
          className="jb-admin-sidebar__search-clear"
          onClick={() => onChange("")}
          type="button"
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </label>
  );
}
