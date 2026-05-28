import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Settings() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ marginLeft: "250px", width: "100%" }}>
        <Navbar />

        <div style={{ padding: "20px" }}>
          <h1>Settings</h1>

          <div style={{ marginTop: "20px" }}>
            <label>App Name</label>

            <input
              type="text"
              defaultValue="Rapido Clone"
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "10px",
              }}
            />
          </div>

          <button
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "10px",
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}