import { renderBrandIcon } from "@/lib/brand-icon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Browser-tab icon. 64px so it stays crisp on the 2x tab strips. */
export default function Icon() {
  return renderBrandIcon(size.width);
}
