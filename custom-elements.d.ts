import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "lottie-player": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        autoplay?: boolean | string;
        loop?: boolean | string;
        mode?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

export {};
