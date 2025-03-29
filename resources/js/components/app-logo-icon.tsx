import type { ImgHTMLAttributes } from "react"
import aicomLogo from "@/assets/aicom-logo.png" // Adjust path accordingly

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} src={aicomLogo} alt="AICOM Logo" className="h-[50vh]  w-auto" />
}
