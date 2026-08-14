import PageHeader from "../components/PageHeader.jsx";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";

function Reports() {
  return (
    <>
      <PageHeader
        title="Báo cáo"
        subtitle="Thống kê theo giờ và xuất Excel/PDF."
      />
      <PlaceholderPanel eyebrow="Tuần 7 · Dashboard &amp; Báo cáo">
        Trang xuất báo cáo sẽ hoàn thiện ở Tuần 7, sau khi API
        Report/Summary sẵn sàng.
      </PlaceholderPanel>
    </>
  );
}

export default Reports;
