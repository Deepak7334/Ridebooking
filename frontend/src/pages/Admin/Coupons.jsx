import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Coupons() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ marginLeft: "250px", width: "100%" }}>
        <Navbar />

        <div style={{ padding: "20px" }}>
          <h1>Coupons</h1>

          <button
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "10px",
            }}
          >
            Create Coupon
          </button>
        </div>
      </div>
    </div>
  );
}