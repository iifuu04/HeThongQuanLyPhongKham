import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="notfound-shell">
      <div className="card section-card">
        <div className="eyebrow dark">404</div>
        <h2>Không tìm thấy trang</h2>
        <p className="muted">Đường dẫn bạn truy cập hiện không tồn tại hoặc bạn không có quyền xem nội dung này.</p>
        <Link className="button" to="/">Quay lại bảng điều hành</Link>
      </div>
    </div>
  );
}
