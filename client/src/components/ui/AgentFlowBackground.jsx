import React from 'react';

const AgentFlowBackground = () => (
  <div
    className="fixed inset-0 pointer-events-none overflow-hidden"
    style={{ 
      zIndex: 0,
      backgroundColor: '#0A0A0A'
    }}
    aria-hidden="true"
  >
    {/* Subtle grid pattern matching AgentFlow AI */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at top, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at top, black 40%, transparent 80%)',
      }}
    />

    {/* Subtle starry dots */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 0)',
        backgroundSize: '100px 100px',
        backgroundPosition: '-19px -19px',
        maskImage: 'radial-gradient(circle at center, black 10%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 10%, transparent 80%)',
      }}
    />

    {/* Soft glows in corners/center */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-[100%] opacity-20 blur-[100px]"
         style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)' }} />
  </div>
);

export default AgentFlowBackground;
