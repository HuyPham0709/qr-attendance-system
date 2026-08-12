import PageHeader from "../components/PageHeader.jsx";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";

function Attendees() {
  return (
    <>
      <PageHeader
        title="Người tham dự"
        subtitle="Tìm kiếm, lọc và thêm người tham dự thủ công."
        action={
          <button type="button" className="btn-primary" disabled>
            + Thêm người tham dự
          </button>
        }
      />
      <PlaceholderPanel eyebrow="Tuần 3 · Attendee &amp; QR Engine">
        Bảng danh sách + tìm kiếm/lọc sẽ được xây ở Tuần 3, cùng lúc với
        Import Excel ở Tuần 4.
      </PlaceholderPanel>
    </>
  );
}

export default Attendees;
