import PageHeader from "../components/PageHeader.jsx";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";

function Events() {
  return (
    <>
      <PageHeader
        title="Sự kiện"
        subtitle="Danh sách sự kiện và form tạo/sửa sự kiện."
        action={
          <button type="button" className="btn-primary" disabled>
            + Tạo sự kiện
          </button>
        }
      />
      <PlaceholderPanel eyebrow="Tuần 2 · Auth &amp; Event CRUD">
        Bảng danh sách sự kiện sẽ kết nối với API CRUD Event thật (Thành viên
        A) ở Tuần 2.
      </PlaceholderPanel>
    </>
  );
}

export default Events;
