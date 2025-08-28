
export default function SkeletonCard() {
  return (
    <div className="sk-card">
      <div className="sk-img shimmer"></div>
      <div className="sk-line shimmer" style={{ width: "80%" }}></div>
      <div className="sk-line shimmer" style={{ width: "60%" }}></div>
    </div>
  );
}
