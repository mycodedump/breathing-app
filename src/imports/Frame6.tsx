import svgPaths from "./svg-5005la55fq";

function Frame() {
  return <div className="bg-[#d8d8b9] rounded-[316.25px] shrink-0 size-[253px]" />;
}

function Frame1() {
  return <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#e1cb79] left-1/2 rounded-[316.25px] size-[168.667px] top-[calc(50%-0.17px)]" />;
}

function Frame2() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[53.5px] size-[253px] top-[95px]">
      <Frame />
      <Frame1 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
      <div className="h-[15.5px] relative shrink-0 w-[29px]" data-name="Ellipse 5 (Stroke)">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 29 15.5">
          <path d={svgPaths.p12c87b80} fill="var(--fill-0, #CA7A0A)" id="Ellipse 5 (Stroke)" />
        </svg>
      </div>
      <div className="h-[15.5px] relative shrink-0 w-[29px]" data-name="Ellipse 4 (Stroke)">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 29 15.5">
          <path d={svgPaths.p12c87b80} fill="var(--fill-0, #CA7A0A)" id="Ellipse 5 (Stroke)" />
        </svg>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[14px] items-center left-[146.5px] top-[163px] w-[66px]">
      <Frame4 />
      <div className="h-[7.938px] relative shrink-0 w-[51.001px]" data-name="Ellipse 6 (Stroke)">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 51.0008 7.93807">
          <path d={svgPaths.p2b283d00} fill="var(--fill-0, #CA7A0A)" id="Ellipse 6 (Stroke)" />
        </svg>
      </div>
    </div>
  );
}

export default function Frame3() {
  return (
    <div className="bg-[#c1d4d2] relative size-full">
      <Frame2 />
      <div className="absolute h-[794.5px] left-[-172px] top-[448px] w-[661px]" data-name="Union">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 661 794.5">
          <path d={svgPaths.p1aa1efb0} fill="url(#paint0_linear_1_83)" id="Union" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_83" x1="330.5" x2="330.5" y1="0" y2="794.5">
              <stop stopColor="#82936F" />
              <stop offset="1" stopColor="#899B71" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute flex h-[758px] items-center justify-center left-[-344px] top-[485px] w-[1077px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[758px] relative w-[1077px]" data-name="Union">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1077 758">
              <path d={svgPaths.p239e8e40} fill="url(#paint0_linear_1_79)" id="Union" />
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_79" x1="538.5" x2="538.5" y1="-37" y2="757.5">
                  <stop stopColor="#6B8560" />
                  <stop offset="1" stopColor="#778D66" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
      <div className="absolute h-[794px] left-[-404px] top-[531px] w-[1085px]" data-name="Union">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1085 794">
          <path d={svgPaths.p2f6f8200} fill="url(#paint0_linear_1_73)" id="Union" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_73" x1="542.5" x2="542.5" y1="0" y2="794.5">
              <stop stopColor="#678059" />
              <stop offset="1" stopColor="#78916A" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute h-[781px] left-[-150px] top-[605px] w-[1085px]" data-name="Union">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1085 781">
          <path d={svgPaths.p42d7000} fill="url(#paint0_linear_1_69)" id="Union" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_69" x1="542.5" x2="542.5" y1="-13" y2="781.5">
              <stop stopColor="#5D7451" />
              <stop offset="1" stopColor="#78916A" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <Frame5 />
    </div>
  );
}