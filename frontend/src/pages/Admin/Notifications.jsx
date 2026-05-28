import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Notifications() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ marginLeft: "250px", width: "100%" }}>
        <Navbar />

        <div style={{ padding: "20px" }}>
          <h1>Notifications</h1>

          <textarea
            placeholder="Write notification..."
            rows="5"
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "15px",
            }}
          />

          <button
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "10px",
            }}
          >
            Send Notification
          </button>
        </div>
      </div>
    </div>
  );
}