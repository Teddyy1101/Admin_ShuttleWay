/**
 * Utility sinh báo cáo PDF dạng văn bản hành chính nhà nước Việt Nam.
 * Sử dụng html2canvas để render HTML (hỗ trợ tiếng Việt đầy đủ)
 * và jsPDF để tạo file PDF nhiều trang.
 */

// ========================= TYPES =========================

export interface ReportData {
  stats: {
    activeStudents: number;
    activeBuses: number;
    todayTrips: number;
    totalRevenue: number;
  };
  tripStats: Array<{ status: string; count: number }>;
  topDrivers: Array<{ id: string; fullName: string; tripCount: number }>;
  revenueData: Array<{ date: string; revenue: number }>;
  popularRoutes: Array<{ routeId: string; routeCode: string; name: string; ticketCount: number }>;
  punctuality: { onTime: number; late: number; total: number; onTimePercent: number };
  currentUserName: string;
}

export interface ReportConfig {
  companyName: string;
  departmentName: string;
  signerTitle: string;
  location: string;
  revenueStartDate: string;
  revenueEndDate: string;
  punctualityStartDate: string;
  punctualityEndDate: string;
}

// ========================= HELPERS =========================

/** Format số tiền VNĐ */
function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

/** Format ngày theo kiểu văn bản hành chính */
function formatDateFormal(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `ngày ${String(day).padStart(2, '0')} tháng ${String(month).padStart(2, '0')} năm ${year}`;
}

/** Format ngày DD/MM/YYYY */
function formatDateShort(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Label trạng thái chuyến đi */
const TRIP_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Sắp chạy',
  IN_PROGRESS: 'Đang chạy',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

// ========================= COMMON STYLES =========================

const STYLES = {
  table: `
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin: 10px 0 20px 0;
  `,
  th: `
    border: 1px solid #000;
    padding: 8px 12px;
    background-color: #f0f0f0;
    font-weight: bold;
    text-align: center;
    font-size: 13px;
  `,
  td: `
    border: 1px solid #000;
    padding: 6px 12px;
    font-size: 13px;
  `,
  tdCenter: `
    border: 1px solid #000;
    padding: 6px 12px;
    text-align: center;
    font-size: 13px;
  `,
  tdRight: `
    border: 1px solid #000;
    padding: 6px 12px;
    text-align: right;
    font-size: 13px;
  `,
  sectionTitle: `
    font-size: 14px;
    font-weight: bold;
    margin: 24px 0 8px 0;
    padding: 0;
  `,
};

// ========================= HTML BUILDER =========================

function buildReportHTML(data: ReportData, config: ReportConfig): string {
  const now = new Date();
  const reportDateFormal = formatDateFormal(now);
  const reportDateShort = formatDateShort(now);
  const reportNumber = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Tính tổng chuyến và tỷ lệ %
  const totalTrips = data.tripStats.reduce((acc, curr) => acc + curr.count, 0);

  // ---- HEADER ----
  const headerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
      <!-- Bên trái: Tên đơn vị -->
      <div style="text-align: center; width: 42%;">
        <p style="font-size: 13px; font-weight: bold; margin: 0; text-transform: uppercase;">
          ${config.companyName}
        </p>
        <p style="font-size: 13px; font-weight: bold; margin: 4px 0 0 0; text-transform: uppercase;">
          ${config.departmentName}
        </p>
        <div style="width: 100px; height: 1.5px; background: #000; margin: 8px auto 4px auto;"></div>
        <p style="font-size: 13px; margin: 4px 0 0 0;">
          Số: ${reportNumber}/BC-QLVH
        </p>
      </div>

      <!-- Bên phải: Quốc hiệu -->
      <div style="text-align: center; width: 54%;">
        <p style="font-size: 13px; font-weight: bold; margin: 0;">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </p>
        <p style="font-size: 14px; font-weight: bold; margin: 2px 0 0 0;">
          Độc lập - Tự do - Hạnh phúc
        </p>
        <div style="width: 180px; height: 1.5px; background: #000; margin: 8px auto 4px auto;"></div>
        <p style="font-size: 13px; font-style: italic; margin: 4px 0 0 0;">
          ${config.location}, ${reportDateFormal}
        </p>
      </div>
    </div>
  `;

  // ---- TITLE ----
  const titleHTML = `
    <div style="text-align: center; margin: 28px 0 20px 0;">
      <h1 style="font-size: 17px; font-weight: bold; margin: 0; letter-spacing: 1px;">
        BÁO CÁO
      </h1>
      <h2 style="font-size: 15px; font-weight: bold; margin: 6px 0 0 0;">
        TÌNH HÌNH HOẠT ĐỘNG VẬN HÀNH HỆ THỐNG XE BUÝT TRƯỜNG HỌC
      </h2>
      <p style="font-size: 13px; font-style: italic; margin: 6px 0 0 0;">
        (Kỳ báo cáo: ${reportDateShort})
      </p>
    </div>
  `;

  // ---- INTRODUCTION ----
  const introHTML = `
    <p style="text-indent: 40px; font-size: 13px; margin: 12px 0; line-height: 1.8; text-align: justify;">
      Căn cứ vào số liệu thống kê từ hệ thống quản lý xe buýt trường học,
      ${config.departmentName} báo cáo tình hình hoạt động vận hành hệ thống như sau:
    </p>
  `;

  // ---- SECTION I: THỐNG KÊ TỔNG QUAN ----
  const section1HTML = `
    <h3 style="${STYLES.sectionTitle}">I. THỐNG KÊ TỔNG QUAN</h3>
    <table style="${STYLES.table}">
      <thead>
        <tr>
          <th style="${STYLES.th} width: 50px;">STT</th>
          <th style="${STYLES.th}">Chỉ tiêu</th>
          <th style="${STYLES.th} width: 160px;">Số liệu</th>
          <th style="${STYLES.th} width: 100px;">Đơn vị</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="${STYLES.tdCenter}">1</td>
          <td style="${STYLES.td}">Tổng số học sinh đang hoạt động</td>
          <td style="${STYLES.tdRight}">${data.stats.activeStudents.toLocaleString('vi-VN')}</td>
          <td style="${STYLES.tdCenter}">Học sinh</td>
        </tr>
        <tr>
          <td style="${STYLES.tdCenter}">2</td>
          <td style="${STYLES.td}">Số xe buýt đang vận hành</td>
          <td style="${STYLES.tdRight}">${data.stats.activeBuses.toLocaleString('vi-VN')}</td>
          <td style="${STYLES.tdCenter}">Xe</td>
        </tr>
        <tr>
          <td style="${STYLES.tdCenter}">3</td>
          <td style="${STYLES.td}">Số chuyến xe trong ngày</td>
          <td style="${STYLES.tdRight}">${data.stats.todayTrips.toLocaleString('vi-VN')}</td>
          <td style="${STYLES.tdCenter}">Chuyến</td>
        </tr>
        <tr>
          <td style="${STYLES.tdCenter}">4</td>
          <td style="${STYLES.td}">Tổng doanh thu</td>
          <td style="${STYLES.tdRight}">${formatVND(data.stats.totalRevenue)}</td>
          <td style="${STYLES.tdCenter}">VNĐ</td>
        </tr>
      </tbody>
    </table>
  `;

  // ---- SECTION II: TRẠNG THÁI CHUYẾN ĐI ----
  const tripStatusRows = data.tripStats.map((stat, index) => {
    const label = TRIP_STATUS_LABELS[stat.status] || stat.status;
    const percent = totalTrips > 0 ? ((stat.count / totalTrips) * 100).toFixed(1) : '0.0';
    return `
      <tr>
        <td style="${STYLES.tdCenter}">${index + 1}</td>
        <td style="${STYLES.td}">${label}</td>
        <td style="${STYLES.tdRight}">${stat.count.toLocaleString('vi-VN')}</td>
        <td style="${STYLES.tdCenter}">${percent}%</td>
      </tr>
    `;
  }).join('');

  const section2HTML = `
    <h3 style="${STYLES.sectionTitle}">II. THỐNG KÊ TRẠNG THÁI CHUYẾN ĐI</h3>
    <table style="${STYLES.table}">
      <thead>
        <tr>
          <th style="${STYLES.th} width: 50px;">STT</th>
          <th style="${STYLES.th}">Trạng thái</th>
          <th style="${STYLES.th} width: 120px;">Số lượng</th>
          <th style="${STYLES.th} width: 100px;">Tỷ lệ (%)</th>
        </tr>
      </thead>
      <tbody>
        ${tripStatusRows}
        <tr style="font-weight: bold;">
          <td style="${STYLES.tdCenter}" colspan="2"><strong>Tổng cộng</strong></td>
          <td style="${STYLES.tdRight}"><strong>${totalTrips.toLocaleString('vi-VN')}</strong></td>
          <td style="${STYLES.tdCenter}"><strong>100%</strong></td>
        </tr>
      </tbody>
    </table>
  `;

  // ---- SECTION III: TOP TÀI XẾ ----
  const topDriverRows = data.topDrivers.map((driver, index) => `
    <tr>
      <td style="${STYLES.tdCenter}">${index + 1}</td>
      <td style="${STYLES.td}">${driver.fullName}</td>
      <td style="${STYLES.tdRight}">${driver.tripCount.toLocaleString('vi-VN')}</td>
    </tr>
  `).join('');

  const section3HTML = data.topDrivers.length > 0 ? `
    <h3 style="${STYLES.sectionTitle}">III. TOP 5 TÀI XẾ XUẤT SẮC</h3>
    <table style="${STYLES.table}">
      <thead>
        <tr>
          <th style="${STYLES.th} width: 50px;">Hạng</th>
          <th style="${STYLES.th}">Họ và tên</th>
          <th style="${STYLES.th} width: 160px;">Số chuyến hoàn thành</th>
        </tr>
      </thead>
      <tbody>
        ${topDriverRows}
      </tbody>
    </table>
  ` : '';

  // ---- SECTION IV: TUYẾN ĐƯỜNG PHỔ BIẾN ----
  const popularRouteRows = data.popularRoutes?.map((route, index) => `
    <tr>
      <td style="${STYLES.tdCenter}">${index + 1}</td>
      <td style="${STYLES.tdCenter}">${route.routeCode}</td>
      <td style="${STYLES.td}">${route.name}</td>
      <td style="${STYLES.tdRight}">${route.ticketCount.toLocaleString('vi-VN')}</td>
    </tr>
  `).join('') || '';

  const section4HTML = data.popularRoutes?.length > 0 ? `
    <h3 style="${STYLES.sectionTitle}">IV. TUYẾN ĐƯỜNG PHỔ BIẾN NHẤT</h3>
    <table style="${STYLES.table}">
      <thead>
        <tr>
          <th style="${STYLES.th} width: 50px;">Hạng</th>
          <th style="${STYLES.th} width: 100px;">Mã tuyến</th>
          <th style="${STYLES.th}">Tên tuyến</th>
          <th style="${STYLES.th} width: 120px;">Số vé đã bán</th>
        </tr>
      </thead>
      <tbody>
        ${popularRouteRows}
      </tbody>
    </table>
  ` : '';

  // ---- SECTION V: DOANH THU & ĐÚNG GIỜ (Theo bộ lọc) ----
  const revenueRows = data.revenueData.map((item, index) => `
    <tr>
      <td style="${STYLES.tdCenter}">${index + 1}</td>
      <td style="${STYLES.tdCenter}">${item.date}</td>
      <td style="${STYLES.tdRight}">${formatVND(item.revenue)}</td>
    </tr>
  `).join('');

  const totalRevenueFilter = data.revenueData.reduce((acc, curr) => acc + curr.revenue, 0);
  
  // Format lại ngày từ config để hiển thị
  const revStartObj = new Date(config.revenueStartDate);
  const revEndObj = new Date(config.revenueEndDate);
  const revenueFilterLabel = `(Từ ngày ${formatDateShort(revStartObj)} đến ngày ${formatDateShort(revEndObj)})`;

  const puncStartObj = new Date(config.punctualityStartDate);
  const puncEndObj = new Date(config.punctualityEndDate);
  const punctualityFilterLabel = `(Từ ngày ${formatDateShort(puncStartObj)} đến ngày ${formatDateShort(puncEndObj)})`;

  const section5HTML = `
    <h3 style="${STYLES.sectionTitle}">V. DOANH THU VÀ TỶ LỆ ĐÚNG GIỜ</h3>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <!-- Khối Tỷ lệ đúng giờ -->
      <div style="width: 48%;">
        <p style="font-size: 13px; font-weight: bold; margin-bottom: 4px;">1. Tỷ lệ đúng giờ</p>
        <p style="font-size: 12px; font-style: italic; margin-top: 0; margin-bottom: 8px;">${punctualityFilterLabel}</p>
        <table style="${STYLES.table}; margin: 0;">
          <thead>
            <tr>
              <th style="${STYLES.th}" colspan="2">Thống kê tỷ lệ đúng giờ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="${STYLES.td}">Số chuyến đúng giờ</td>
              <td style="${STYLES.tdRight}"><strong>${data.punctuality.onTime.toLocaleString('vi-VN')}</strong></td>
            </tr>
            <tr>
              <td style="${STYLES.td}">Số chuyến trễ giờ</td>
              <td style="${STYLES.tdRight}"><strong>${data.punctuality.late.toLocaleString('vi-VN')}</strong></td>
            </tr>
            <tr>
              <td style="${STYLES.td}">Tổng số chuyến hoàn thành</td>
              <td style="${STYLES.tdRight}"><strong>${data.punctuality.total.toLocaleString('vi-VN')}</strong></td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="${STYLES.td}"><strong>Tỷ lệ đúng giờ (%)</strong></td>
              <td style="${STYLES.tdRight} color: ${data.punctuality.onTimePercent >= 80 ? '#10b981' : '#ef4444'}; font-size: 16px;">
                <strong>${data.punctuality.onTimePercent}%</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Khối Doanh thu -->
      <div style="width: 48%;">
        <p style="font-size: 13px; font-weight: bold; margin-bottom: 4px;">2. Doanh thu</p>
        <p style="font-size: 12px; font-style: italic; margin-top: 0; margin-bottom: 8px;">${revenueFilterLabel}</p>
        ${data.revenueData.length > 0 ? `
          <table style="${STYLES.table}; margin: 0;">
            <thead>
              <tr>
                <th style="${STYLES.th} width: 40px;">STT</th>
                <th style="${STYLES.th}">Thời gian</th>
                <th style="${STYLES.th}">Doanh thu (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              ${revenueRows}
              <tr style="font-weight: bold; background-color: #f8f9fa;">
                <td style="${STYLES.tdCenter}" colspan="2">Tổng cộng</td>
                <td style="${STYLES.tdRight}">${formatVND(totalRevenueFilter)}</td>
              </tr>
            </tbody>
          </table>
        ` : `<p style="font-size: 13px; text-align: center; border: 1px solid #000; padding: 20px;">Không có dữ liệu doanh thu trong khoảng thời gian này.</p>`}
      </div>
    </div>
  `;

  // ---- CONCLUSION ----
  const conclusionHTML = `
    <p style="text-indent: 40px; font-size: 13px; margin: 20px 0 8px 0; line-height: 1.8; text-align: justify;">
      Trên đây là báo cáo tình hình hoạt động vận hành hệ thống xe buýt trường học
      tính đến ${reportDateShort}. ${config.departmentName} kính trình lãnh đạo xem xét./.
    </p>
  `;

  // ---- NƠI NHẬN ----
  const recipientsHTML = `
    <div style="font-size: 12px; margin-top: 12px;">
      <p style="margin: 0; font-weight: bold; font-style: italic;">Nơi nhận:</p>
      <p style="margin: 2px 0 0 10px;">- Ban Giám đốc (để b/c);</p>
      <p style="margin: 2px 0 0 10px;">- Lưu: VT, QLVH.</p>
    </div>
  `;

  // ---- SIGNATURE ----
  const signatureHTML = `
    <div style="display: flex; justify-content: space-between; margin-top: 10px; page-break-inside: avoid;">
      <!-- Nơi nhận (góc trái dưới) -->
      <div style="width: 38%;">
        ${recipientsHTML}
      </div>

      <!-- Khối ký tên -->
      <div style="display: flex; justify-content: space-between; width: 58%;">
        <!-- Người lập -->
        <div style="text-align: center; width: 48%;">
          <p style="font-size: 13px; font-weight: bold; margin: 0;">NGƯỜI LẬP BÁO CÁO</p>
          <p style="font-size: 12px; font-style: italic; margin: 4px 0 0 0; color: #555;">(Ký, ghi rõ họ tên)</p>
          <div style="height: 70px;"></div>
          <p style="font-size: 13px; font-weight: bold; margin: 0;">${data.currentUserName}</p>
        </div>

        <!-- Người phê duyệt -->
        <div style="text-align: center; width: 48%;">
          <p style="font-size: 13px; font-weight: bold; margin: 0; text-transform: uppercase;">${config.signerTitle}</p>
          <p style="font-size: 12px; font-style: italic; margin: 4px 0 0 0; color: #555;">(Ký, đóng dấu, ghi rõ họ tên)</p>
          <div style="height: 70px;"></div>
          <p style="font-size: 13px; margin: 0;">...............................</p>
        </div>
      </div>
    </div>
  `;

  // ========================= FULL REPORT =========================
  return `
    <div style="
      font-family: 'Times New Roman', Times, 'Tinos', serif;
      padding: 76px 57px 76px 100px;
      color: #000;
      line-height: 1.6;
      background: #fff;
      box-sizing: border-box;
    ">
      ${headerHTML}
      ${titleHTML}
      ${introHTML}
      ${section1HTML}
      ${section2HTML}
      ${section3HTML}
      ${section4HTML}
      ${section5HTML}
      ${conclusionHTML}
      ${signatureHTML}
    </div>
  `;
}

// ========================= MAIN EXPORT FUNCTION =========================

/**
 * Sinh và tải xuống báo cáo PDF từ dữ liệu Dashboard.
 * Sử dụng html2canvas để render HTML thành canvas (hỗ trợ tiếng Việt),
 * rồi dùng jsPDF để tạo file PDF nhiều trang khổ A4.
 */
export async function generateDashboardPDF(
  data: ReportData,
  config: ReportConfig,
): Promise<void> {
  // Import động để giảm bundle size ban đầu
  const [{ default: jsPDF }, html2canvasModule] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const html2canvas = html2canvasModule.default;

  // 1. Tạo HTML báo cáo
  const reportHTML = buildReportHTML(data, config);

  // 2. Tạo container ẩn (cần nằm trong DOM để html2canvas render)
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    background: white;
    z-index: -1;
  `;
  // 794px = A4 width (210mm) tại 96 DPI
  container.innerHTML = reportHTML;
  document.body.appendChild(container);

  try {
    // 3. Chụp canvas bằng html2canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Tăng DPI cho chất lượng in
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    });

    // 4. Tạo PDF khổ A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    let heightLeft = imgHeight;
    let position = 0;

    // Trang đầu tiên
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Các trang tiếp theo (nếu nội dung dài hơn 1 trang A4)
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 5. Tải xuống PDF
    const now = new Date();
    const fileName = `bao-cao-tong-quan_${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}.pdf`;
    pdf.save(fileName);
  } finally {
    // 6. Dọn dẹp container ẩn
    document.body.removeChild(container);
  }
}
