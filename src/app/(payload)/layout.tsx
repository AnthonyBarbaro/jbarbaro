import type { ServerFunctionClient } from "payload";
import React from "react";

import "@/app/globals.css";
import "@/admin/admin.scss";
import "@payloadcms/next/css";
import config from "@/payload.config";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";

import { importMap } from "./cms/importMap.js";

type LayoutProps = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";

  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

export default function PayloadLayout({ children }: LayoutProps) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
