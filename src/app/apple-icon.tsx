import { renderBrandIcon } from "@/lib/brand-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon. 180px is the size iOS asks for; it applies its own
 *  rounding and does not support transparency, so this renders on white. */
export default function AppleIcon() {
  return renderBrandIcon(size.width);
}
