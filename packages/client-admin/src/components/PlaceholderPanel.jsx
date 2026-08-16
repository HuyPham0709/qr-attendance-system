import "./PlaceholderPanel.css";

function PlaceholderPanel({ eyebrow, children }) {
  return (
    <div className="placeholder-panel">
      {eyebrow && <span className="placeholder-eyebrow">{eyebrow}</span>}
      <p>{children}</p>
    </div>
  );
}

export default PlaceholderPanel;
