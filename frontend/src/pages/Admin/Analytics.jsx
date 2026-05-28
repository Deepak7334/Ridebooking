import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Analytics() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ marginLeft: "250px", width: "100%" }}>
        <Navbar />

        <div style={{ padding: "20px" }}>
          <h1>Analytics</h1>

          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                background: "#f59e0b",
                padding: "20px",
                borderRadius: "10px",
                color: "white",
                width: "250px",
              }}
            >
              <h3>Total Bookings</h3>
              <h1>25,000</h1>
            </div>

            <div
              style={{
                background: "#ef4444",
                padding: "20px",
                borderRadius: "10px",
                color: "white",
                width: "250px",
              }}
            >
              <h3>Cancelled Rides</h3>
              <h1>450</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}