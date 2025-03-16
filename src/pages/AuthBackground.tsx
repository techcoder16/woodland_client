
import React from "react";

export function AuthBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-background to-background"></div>
      
      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/5 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: "0s" }}></div>
      <div className="absolute bottom-1/4 right-1/5 w-64 h-64 bg-red-700/20 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float" style={{ animationDelay: "2s" }}></div>
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-red-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float" style={{ animationDelay: "4s" }}></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
    </div>
  );
}
