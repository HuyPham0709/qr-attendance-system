import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";

function Attendees() {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/attendees")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải dữ liệu từ server");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setAttendees(data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi khi fetch dữ liệu:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <PageHeader
        title="Người tham dự"
        subtitle="Tìm kiếm, lọc và thêm người tham dự thủ công."
        action={
          <button type="button" className="btn-primary">
            + Thêm người tham dự
          </button>
        }
      />

      <div style={{ padding: "16px" }}>
        {loading && <p>Đang tải dữ liệu từ CSDL...</p>}
        {error && <p style={{ color: "red" }}>Lỗi: {error}</p>}
        
        {!loading && !error && (
          <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {attendees.length > 0 ? (
                attendees.map((item) => (
                  <tr key={item._id}>
                    <td>{item._id}</td>
                    <td>{item.fullName}</td>
                    <td>{item.email}</td>
                    <td>{item.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>Chưa có dữ liệu người tham dự trong CSDL</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default Attendees;