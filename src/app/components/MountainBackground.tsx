import svgPaths from "../../imports/svg-jq5cb9be3a";

export function MountainBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes sway1 { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(8px); } 75% { transform: translateX(-8px); } }
        @keyframes sway2 { 0%, 100% { transform: translateX(0); } 30% { transform: translateX(-12px); } 70% { transform: translateX(12px); } }
        @keyframes sway3 { 0%, 100% { transform: translateX(0); } 35% { transform: translateX(14px); } 65% { transform: translateX(-14px); } }
        @keyframes sway4 { 0%, 100% { transform: translateX(0); } 40% { transform: translateX(-18px); } 60% { transform: translateX(18px); } }
      `}</style>

      {/* Hill layer 1 - lightest, furthest back */}
      <div
        className="absolute h-[60%] left-[-50%] bottom-0 w-[200%]"
        style={{ zIndex: 2, animation: "sway1 26s ease-in-out infinite" }}
      >
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 661 794.5">
          <path d={svgPaths.p1aa1efb0} fill="url(#bg_grad1)" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="bg_grad1" x1="330.5" x2="330.5" y1="0" y2="794.5">
              <stop stopColor="#82936F" />
              <stop offset="1" stopColor="#899B71" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Hill layer 2 */}
      <div
        className="absolute h-[55%] left-[-80%] bottom-0 w-[280%]"
        style={{ zIndex: 3, animation: "sway2 20s ease-in-out infinite" }}
      >
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1077 758">
          <path d={svgPaths.p239e8e40} fill="url(#bg_grad2)" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="bg_grad2" x1="538.5" x2="538.5" y1="-37" y2="757.5">
              <stop stopColor="#6B8560" />
              <stop offset="1" stopColor="#778D66" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Hill layer 3 */}
      <div
        className="absolute h-[50%] left-[-100%] bottom-0 w-[300%]"
        style={{ zIndex: 4, animation: "sway3 16s ease-in-out infinite" }}
      >
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1085 794">
          <path d={svgPaths.p2f6f8200} fill="url(#bg_grad3)" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="bg_grad3" x1="542.5" x2="542.5" y1="0" y2="794.5">
              <stop stopColor="#678059" />
              <stop offset="1" stopColor="#78916A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Hill layer 4 - darkest, foreground */}
      <div
        className="absolute h-[45%] left-[-40%] bottom-0 w-[280%]"
        style={{ zIndex: 5, animation: "sway4 13s ease-in-out infinite" }}
      >
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1085 781">
          <path d={svgPaths.p42d7000} fill="url(#bg_grad4)" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="bg_grad4" x1="542.5" x2="542.5" y1="-13" y2="781.5">
              <stop stopColor="#5D7451" />
              <stop offset="1" stopColor="#78916A" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
