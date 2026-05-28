import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Complaints() {
  const complaints = [
    {
      user: "Deepak",
      issue: "Driver was late",
      status: "Pending",
    },
    {
      user: "Rahul",
      issue: "Payment issue",
      status: "Resolved",
    },
  ];

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ marginLeft: "250px", width: "100%" }}>
        <Navbar />

        <div style={{ padding: "20px" }}>
          <h1>Complaints</h1>

          <table
            border="1"
            width="100%"
            cellPadding="10"
            style={{ marginTop: "20px" }}
          >
            <thead>
              <tr>
                <th>User</th>
                <th>Issue</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {complaints.map((item, index) => (
                <tr key={index}>
                  <td>{item.user}</td>
                  <td>{item.issue}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}