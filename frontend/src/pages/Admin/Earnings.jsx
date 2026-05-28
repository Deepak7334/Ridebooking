import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Earnings() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ marginLeft: "250px", width: "100%" }}>
        <Navbar />

        <div style={{ padding: "20px" }}>
          <h1>Earnings Dashboard</h1>

          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                background: "#10b981",
                color: "white",
                padding: "20px",
                borderRadius: "10px",
                width: "250px",
              }}
            >
              <h3>Total Revenue</h3>
              <h1>₹5,40,000</h1>
            </div>

            <div
              style={{
                background: "#3b82f6",
                color: "white",
                padding: "20px",
                borderRadius: "10px",
                width: "250px",
              }}
            >
              <h3>Today's Revenue</h3>
              <h1>₹12,000</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}