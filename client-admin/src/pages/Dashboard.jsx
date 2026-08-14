import PageHeader from "../components/PageHeader.jsx";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";

function Dashboard() {
  return (
    <>
      <PageHeader
        title="Tổng quan"
        subtitle="Số liệu check-in real-time sẽ hiển thị ở đây."
      />
      <PlaceholderPanel eyebrow="Tuần 7 · Dashboard & Socket.io">
        Biểu đồ và số liệu real-time (Recharts) sẽ được nối vào đây sau khi
        API Report và Socket.io sẵn sàng.
      </PlaceholderPanel>
    </>
  );
}

export default Dashboard;
