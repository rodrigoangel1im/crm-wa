import "./loading-bars.css"

export default function LoadingBars() {
  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="bars">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  )
}
