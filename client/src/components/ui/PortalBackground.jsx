/**
 * PortalBackground — subtle dot-grid only.
 * No aurora blobs, no radial color gradients, no radiating effects.
 */
const PortalBackground = () => (
  <div
    className="fixed inset-0 pointer-events-none overflow-hidden"
    style={{ zIndex: 0 }}
    aria-hidden="true"
  >
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    />
  </div>
);

export default PortalBackground;
