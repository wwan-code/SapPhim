import React from 'react';
import PropTypes from 'prop-types';
import {
  AiOutlineFileText,
  AiOutlineCheckCircle,
  AiOutlineWarning,
  AiOutlineDownload,
  AiOutlineSafety
} from 'react-icons/ai';
import '@/assets/scss/components/auth/_import-guide-modal.scss';

const ImportGuideModal = () => {
  const handleDownloadSample = () => {
    const sampleData = {
      login: {
        email: "user@example.com",
        password: "yourPassword123"
      },
      register: [
        {
          username: "user1",
          email: "user1@example.com",
          password: "password123",
          phoneNumber: "0901234567"
        },
        {
          username: "user2",
          email: "user2@example.com",
          password: "password456"
        }
      ]
    };

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-sample.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="import-guide">
      {/* Section: Định dạng hỗ trợ */}
      <section className="import-guide__section">
        <h3 className="import-guide__heading">
          <AiOutlineFileText className="import-guide__icon" />
          Định dạng file được hỗ trợ
        </h3>
        <ul className="import-guide__list">
          <li><strong>.json</strong> - Định dạng JSON chuẩn (khuyến nghị)</li>
          <li><strong>.txt</strong> - File text thuần (JSON hoặc key:value hoặc CSV)</li>
          <li><strong>.docx</strong> - Microsoft Word document (chứa JSON hoặc text)</li>
        </ul>
        <p className="import-guide__note">
          <strong>Giới hạn:</strong> Mỗi file tối đa 200KB
        </p>
      </section>

      {/* Section: Cấu trúc file */}
      <section className="import-guide__section">
        <h3 className="import-guide__heading">
          <AiOutlineCheckCircle className="import-guide__icon" />
          Cấu trúc file mẫu
        </h3>

        <div className="import-guide__subsection">
          <h4 className="import-guide__subheading">1. File Đăng nhập (Login)</h4>
          <p className="import-guide__description">
            Chỉ xử lý <strong>tài khoản đầu tiên</strong> và tự động đăng nhập:
          </p>
          <pre className="import-guide__code">
            {`{
  "email": "user@example.com",
  "password": "yourPassword123"
}`}
          </pre>
          <p className="import-guide__description">
            Hoặc định dạng text:
          </p>
          <pre className="import-guide__code">
            {`email: user@example.com
password: yourPassword123`}
          </pre>
        </div>

        <div className="import-guide__subsection">
          <h4 className="import-guide__subheading">2. File Đăng ký (Register)</h4>
          <p className="import-guide__description">
            Xử lý <strong>tất cả tài khoản</strong> trong file, đăng ký lần lượt:
          </p>
          <pre className="import-guide__code">
            {`[
  {
    "username": "user1",
    "email": "user1@example.com",
    "password": "password123",
    "confPassword": "password123",
    "phoneNumber": "0901234567"
  },
  {
    "username": "user2",
    "email": "user2@example.com",
    "password": "password456",
    "confPassword": "password456"
  }
]`}
          </pre>
          <p className="import-guide__note">
            <strong>Lưu ý:</strong> <code>phoneNumber</code> là tùy chọn. <code>confPassword</code> phải trùng với <code>password</code>.
          </p>
        </div>

        <div className="import-guide__subsection">
          <h4 className="import-guide__subheading">3. File hỗn hợp (Mixed)</h4>
          <p className="import-guide__description">
            Bạn có thể kết hợp login + register trong một file JSON:
          </p>
          <pre className="import-guide__code">
            {`{
  "login": {
    "email": "admin@example.com",
    "password": "adminPass"
  },
  "register": [
    { "username": "newuser", ... }
  ]
}`}
          </pre>
        </div>
      </section>

      {/* Section: Hướng dẫn sử dụng */}
      <section className="import-guide__section">
        <h3 className="import-guide__heading">
          <AiOutlineDownload className="import-guide__icon" />
          Cách sử dụng
        </h3>
        <ol className="import-guide__list import-guide__list--ordered">
          <li>Click vào khu vực "Import từ file" hoặc kéo-thả file vào.</li>
          <li>Chọn <strong>1 file duy nhất</strong> (định dạng .json, .txt, hoặc .docx).</li>
          <li>Hệ thống sẽ tự động phát hiện loại file (login/register).</li>
          <li>Xem tiến trình xử lý trong modal "File đang xử lý".</li>
          <li>
            <strong>Login:</strong> Chỉ tài khoản đầu tiên được xử lý, popup tự đóng sau khi đăng nhập thành công.
          </li>
          <li>
            <strong>Register:</strong> Tất cả tài khoản được đăng ký tuần tự, popup không tự đóng để bạn xem kết quả.
          </li>
        </ol>
      </section>

      {/* Section: Bảo mật */}
      <section className="import-guide__section import-guide__section--warning">
        <h3 className="import-guide__heading">
          <AiOutlineSafety className="import-guide__icon" />
          Lưu ý bảo mật
        </h3>
        <ul className="import-guide__list">
          <li className="import-guide__warning-item">
            <AiOutlineWarning className="import-guide__warning-icon" />
            <strong>Không lưu trữ mật khẩu:</strong> Hệ thống không lưu file hoặc mật khẩu của bạn. Mọi dữ liệu chỉ tồn tại trong phiên làm việc hiện tại.
          </li>
          <li className="import-guide__warning-item">
            <AiOutlineWarning className="import-guide__warning-icon" />
            <strong>Chỉ upload file tin cậy:</strong> Chỉ sử dụng file từ nguồn đáng tin cậy để tránh rủi ro bảo mật.
          </li>
          <li className="import-guide__warning-item">
            <AiOutlineWarning className="import-guide__warning-icon" />
            <strong>Xóa file sau khi dùng:</strong> Sau khi import, hãy xóa file chứa thông tin nhạy cảm khỏi máy tính.
          </li>
        </ul>
      </section>

      {/* Section: Hỗ trợ */}
      <section className="import-guide__section">
        <h3 className="import-guide__heading">Cần hỗ trợ?</h3>
        <p className="import-guide__description">
          Nếu gặp vấn đề, vui lòng liên hệ:
          <a href="mailto:support@sapphim.com" className="import-guide__link"> support@sapphim.com</a>
        </p>
        <button
          type="button"
          className="import-guide__download-btn"
          onClick={handleDownloadSample}
        >
          <AiOutlineDownload />
          Tải file mẫu (.json)
        </button>
      </section>
    </div>
  );
};

ImportGuideModal.propTypes = {};

export default ImportGuideModal;
