import React from "react";
import { ImageResponse } from "next/og";
import { readFile, writeFile } from "node:fs/promises";

// Mirrors src/lib/brand-icon.tsx so the rendered PNG proves the same crop.
const SOURCE_ASPECT = 673 / 684;
const L = 0.07;
const R = 0.975;
const T = 0.025;
const B = 0.655;

const edge = 256;
const bytes = await readFile("public/brand/dhwarsh-logo.jpg");
const src = `data:image/jpeg;base64,${bytes.toString("base64")}`;

const width = edge / (R - L);
const height = width * SOURCE_ASPECT;
const emblemHeight = (B - T) * height;

const el = React.createElement(
  "div",
  {
    style: {
      position: "relative",
      display: "flex",
      width: edge,
      height: edge,
      overflow: "hidden",
      backgroundColor: "#ffffff",
    },
  },
  React.createElement("img", {
    alt: "",
    src,
    width,
    height,
    style: {
      position: "absolute",
      left: -L * width,
      top: (edge - emblemHeight) / 2 - T * height,
    },
  }),
);

const res = new ImageResponse(el, { width: edge, height: edge });
const buf = Buffer.from(await res.arrayBuffer());
await writeFile("icon-preview.png", buf);
console.log("wrote icon-preview.png", buf.length, "bytes");
