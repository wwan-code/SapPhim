# **Đặc tả Yêu cầu Thiết kế và Kỹ thuật: Giao diện Người dùng "Liquid Glass" (Phong cách iOS 26\)**

---

## **Phần 1: Bối cảnh Chiến lược và Triết lý Thiết kế**

Phần này thiết lập bối cảnh triết lý và chiến lược đằng sau ngôn ngữ thiết kế Liquid Glass. Đây không phải là một lựa chọn thẩm mỹ đơn thuần, mà là một sự tiến hóa có chủ ý trong thiết kế giao diện, chuyển đổi từ các nguyên tắc "phẳng" (flat) sang các nguyên tắc "vật lý" (physical) và "không gian" (spatial).

### **1.1. Tuyên bố Tầm nhìn**

Mục tiêu trải nghiệm cốt lõi là tạo ra một giao diện không chỉ "trông" giống kính, mà còn "hành xử" giống như một vật liệu lỏng, sống động và thông minh.1 Giao diện phải mang lại cảm giác "vui vẻ và kỳ diệu" (fun and magical) trong các tương tác đơn giản nhất.1 Mục tiêu cuối cùng là làm mờ đi ranh giới nhận thức giữa phần cứng vật lý và phần mềm kỹ thuật số, tạo ra một trải nghiệm liền mạch và hài hòa.2

Như Alan Dye, Phó Chủ tịch Thiết kế Giao diện Con người của Apple, đã nêu, vật liệu này "kết hợp các đặc tính quang học của kính với một sự lỏng (fluidity) chỉ Apple mới có thể đạt được, khi nó biến đổi tùy thuộc vào nội dung hoặc bối cảnh của bạn".1

### **1.2. Triết lý Cốt lõi: Vượt qua Glassmorphism**

Cần phải phân biệt rõ ràng giữa Glassmorphism truyền thống và Liquid Glass. Glassmorphism, một xu hướng thiết kế phổ biến từ khoảng năm 2021, về cơ bản là một hiệu ứng *tĩnh*.3 Nó chủ yếu dựa trên một thuộc tính CSS duy nhất là backdrop-filter: blur() (bộ lọc làm mờ hậu cảnh) để tạo ra một lớp kính mờ đơn giản.5

Liquid Glass, ngược lại, là một *vật liệu* động, có tính toán. Nó không chỉ làm mờ mà còn mô phỏng vật lý ánh sáng thực tế. Nó bổ sung hai yếu tố quan trọng không có trong Glassmorphism tiêu chuẩn:

1. **Khúc xạ (Refraction):** Khả năng "bẻ cong" (bend) và "biến dạng" (distort) ánh sáng và nội dung phía sau nó một cách động, giống như một thấu kính.1  
2. **Phản chiếu (Reflection):** Khả năng hiển thị "các điểm sáng lóe" (specular highlights) dựa trên một nguồn sáng giả định. Những phản chiếu này phản ứng động với chuyển động của người dùng, chẳng hạn như cuộn hoặc nghiêng thiết bị.1

Các nhà phân tích kỹ thuật đã chỉ ra rằng Liquid Glass không chỉ là một backdrop-blur; nó là một "visual trick cấp độ tiếp theo" sử dụng các bản đồ dịch chuyển (displacement maps) để "bẻ cong" hậu cảnh một cách có chủ ý.10 Sự thay đổi này là từ một hiệu ứng CSS tĩnh sang một mô phỏng vật lý được render bằng GPU, có tính toán.9

### **1.3. Nguồn gốc Hệ thống: Sự hội tụ của các Giao diện**

Liquid Glass không phải là một sáng tạo biệt lập mà là sự tiến hóa hội tụ của nhiều ngôn ngữ thiết kế trước đây của Apple 3:

* **Aqua (macOS):** Ảnh hưởng về kết cấu, độ bóng (gloss), và cảm giác "vật lý", trái ngược với thiết kế phẳng.3  
* **iOS 7:** Giới thiệu hiệu ứng Gaussian blur thời gian thực, đây là nền tảng kỹ thuật cho phép tạo ra độ mờ (frost) làm nền tảng cho vật liệu.3  
* **iPhone X / Dynamic Island:** Ảnh hưởng về chuyển động, sự "lỏng" (fluidity), và khả năng "biến hình" (morphing) của các thành phần giao diện người dùng.3  
* **visionOS:** Đây là ảnh hưởng triết học quan trọng nhất, đại diện cho việc mang "tư duy ba chiều vào màn hình hai chiều".11

### **1.4. Ảnh hưởng từ Thiết kế Không gian (visionOS)**

Liquid Glass là một chiến lược có chủ ý để thống nhất trải nghiệm người dùng trên tất cả các nền tảng của Apple (iOS, macOS, watchOS, v.v.).1 Quan trọng hơn, nó đóng vai trò là một "cầu nối" chiến lược để chuẩn bị và huấn luyện người dùng các khái niệm về điện toán không gian (spatial computing) trước khi họ tiếp xúc với phần cứng không gian chuyên dụng.3

Các nguyên tắc của visionOS được "nén" và mô phỏng trên màn hình 2D:

* **Chiều sâu (Depth):** Giao diện 2D mô phỏng trục Z (chiều sâu) thông qua việc sử dụng các lớp mờ, bóng đổ tinh tế, và hiệu ứng thị sai (parallax), tạo cảm giác các yếu tố đang lơ lửng ở các độ sâu khác nhau.13  
* **Ánh sáng (Light):** Các điểm sáng lóe động 8 mô phỏng một môi trường có ánh sáng xung quanh, khiến các thành phần UI phản ứng giống như các vật thể vật lý trong một không gian 3D.  
* **Passthrough (Nhìn xuyên qua):** Các yếu tố như thanh điều hướng trong suốt 1 cho phép người dùng nhìn thấy nội dung "xuyên qua" lớp điều khiển, mô phỏng các cửa sổ passthrough của visionOS cho phép người dùng nhìn thấy thế giới thực xung quanh họ.15

---

## **Phần 2: Đặc tả Vật liệu Trực quan – Giải phẫu của "Kính Lỏng"**

Phần này cung cấp các thông số kỹ thuật chính xác và có thể hành động để tái tạo vật liệu Liquid Glass. Vật liệu này phải được hiểu là một "ngăn xếp" (stack) gồm nhiều lớp quang học, chứ không phải là một thuộc tính duy nhất.

### **2.1. Lớp nền: Sự cần thiết của Hậu cảnh Sống động**

Hiệu ứng kính hoàn toàn phụ thuộc vào nội dung phía sau nó. Nó trở nên vô nghĩa nếu không có một hậu cảnh nhiều màu sắc, sống động để làm mờ và khúc xạ.17 Do đó, tất cả các thiết kế sử dụng Liquid Glass phải luôn được trình bày trên các hình nền có độ dốc (gradients) màu sắc phong phú, ảnh chụp chi tiết, hoặc nội dung ứng dụng đang hoạt động. Phải tránh các hậu cảnh xám, phẳng.

### **2.2. Lớp Vật liệu: Độ trong suốt và Độ mờ**

Đây là thuộc tính cơ bản nhất của "kính mờ" (frosted glass).6 Nó xác định màu sắc và độ mờ cơ bản của chính tấm kính.

* **CSS:** Sử dụng giá trị alpha (độ trong suốt) rất thấp cho màu nền. Ví dụ: background: rgba(255, 255, 255, 0.15).5  
* **Figma:** Sử dụng Background Blur 17 hoặc tham số Frost trong hiệu ứng "Glass" gốc của Figma.21  
* **SwiftUI:** Sử dụng API cấp hệ thống: .background(.ultraThinMaterial).22  
* **Biến thể:** Hệ thống thiết kế phải xác định các biến thể. Apple sử dụng "regular" (mờ đục hơn, ưu tiên khả năng đọc) và "clear" (trong suốt hơn, ưu tiên thẩm mỹ).24

### **2.3. Lớp Biến dạng: Khúc xạ**

Đây là yếu tố kỹ thuật *then chốt* phân biệt Liquid Glass với Glassmorphism. Vật liệu này phải "bẻ cong" (bend) hình ảnh bên dưới nó một cách tinh tế, mô phỏng một thấu kính.10

* **Figma:** Sử dụng các tham số Refraction (Khúc xạ) và Depth (Độ sâu) trong hiệu ứng "Glass" gốc.21 Điều này mô phỏng sự biến dạng thấu kính (lensing) được mô tả trong các nguyên tắc thiết kế của Apple.11  
* **Web (CSS/SVG):** Đây là một thách thức kỹ thuật đòi hỏi một giải pháp phức tạp hơn là chỉ dùng CSS. Cách triển khai chính xác nhất là sử dụng bộ lọc SVG feDisplacementMap được áp dụng thông qua backdrop-filter: url(\#filter-id).7  
  * Bộ lọc feDisplacementMap sử dụng các kênh màu (thường là Đỏ và Xanh lá) của một hình ảnh đầu vào thứ hai (thường là một bản đồ nhiễu được tạo bởi feTurbulence 27) để di chuyển (displace) các pixel của hình ảnh gốc (SourceGraphic).28  
  * Thuộc tính scale của bộ lọc kiểm soát cường độ của hiệu ứng biến dạng này.7

### **2.4. Lớp Ánh sáng: Phản chiếu & Điểm sáng Lóe**

Lớp này nằm trên cùng và làm cho vật liệu có cảm giác "bóng" (glossy) và 3D.

* **Viền (Borders):** Một đường viền 1px siêu mỏng, thường có độ trong suốt thấp (ví dụ: rgba(255, 255, 255, 0.3) 5) hoặc một LinearGradient tinh tế (từ mờ sang trong suốt).17 Điều này mô phỏng cạnh của tấm kính vật lý bắt ánh sáng.  
* **Điểm sáng Lóe Động (Dynamic Specular Highlights):** Đây là một yêu cầu *phải có* và là đặc điểm nhận dạng chính.  
  * Đây không phải là một gradient tĩnh. Chúng là các "micro-glints" (tia sáng nhỏ) được render bằng GPU, "trôi dạt" (drift) trên bề mặt của thành phần khi người dùng cuộn hoặc nghiêng thiết bị.9  
  * Chúng là các phản xạ *thời gian thực* từ một nguồn sáng môi trường giả định, làm cho các điều khiển có cảm giác sống động và phản ứng lại với chuyển động vật lý.1  
  * **Figma:** Điều này có thể được mô phỏng trong các mẫu tĩnh bằng cách sử dụng các tham số Light Angle (Góc ánh sáng) và Light Intensity (Cường độ ánh sáng) trong hiệu ứng "Glass".21  
  * Trong sản xuất, hiệu ứng này phải được liên kết với các cảm biến của thiết bị (con quay hồi chuyển) hoặc vị trí cuộn để tạo ra ảo giác phản chiếu.

### **2.5. Ma trận Thuộc tính Vật liệu (Figma & CSS/SwiftUI)**

Để biến các mô tả trừu tượng thành các thông số kỹ thuật có thể hành động, bảng sau đây hoạt động như một "bảng tra cứu" (lookup table) cho hệ thống thiết kế. Thứ tự của các hiệu ứng (ví dụ: trong Figma) rất quan trọng: Khúc xạ phải xảy ra trước, sau đó là Làm mờ (Blur/Frost), sau đó là lớp phủ màu, và cuối cùng là các hiệu ứng bề mặt như viền.

| Thuộc tính (Property) | Giá trị Figma (Hiệu ứng "Glass") | Giá trị CSS | Giá trị SwiftUI | Mục đích |
| :---- | :---- | :---- | :---- | :---- |
| **Độ mờ Vật liệu** | Fill: 10-20% (Linear Gradient) | background: rgba(255, 255, 255, 0.15) | (Được xử lý bởi Material) | Tạo màu sắc cho kính |
| **Độ mờ (Frost)** | Frost: 10-20 (hoặc Background Blur) | backdrop-filter: blur(20px) | .background(.ultraThinMaterial) | Làm mờ nội dung phía sau |
| **Khúc xạ (Refraction)** | Refraction: 1.05-1.1, Depth: 5-10 | backdrop-filter: url(\#svg-displacement) | (Được xử lý bởi hệ thống/API riêng) | *Bẻ cong* ánh sáng/nội dung |
| **Viền (Border)** | Stroke: 1px (Linear Gradient) | border: 1px solid rgba(255, 255, 255, 0.3) | .overlay(RoundedRectangle(...)) | Bắt sáng ở cạnh |
| **Điểm sáng (Highlight)** | Light Angle: \-45deg, Intensity: 50 | (Yêu cầu JS/hoạt ảnh cuộn) | .interactive(\_:) | Phản chiếu ánh sáng động |

---

## **Phần 3: Động lực học Tương tác – Nguyên tắc Chuyển động của iOS 26**

Trong Liquid Glass, hoạt ảnh không phải là trang trí; chúng là một phần của *vật lý* vật liệu. Chuyển động xác định cách vật liệu được cảm nhận.

### **3.1. Nguyên tắc Chuyển động Nền tảng**

Thuật ngữ "hoạt ảnh" (animation) truyền thống có thể gây hiểu lầm. Yêu cầu đúng là "mô phỏng" (simulation). Các chuyển động không được dựa trên thời gian cố định (ví dụ: 300ms ease-in-out 32). Thay vào đó, chúng phải:

* **Dựa trên Vật lý (Physics-Based):** Hoạt ảnh *phải* sử dụng các đường cong lò xo (spring curves).33 Các tương tác phải có "trọng lượng" (weight) và "động lượng" (momentum).35 Chúng phải phản ứng với vận tốc đầu vào (ví dụ: tốc độ vuốt của người dùng) và có thể bị gián đoạn bất cứ lúc nào.33  
* **Nhận thức Không gian (Spatial Awareness):** Hoạt ảnh phải củng cố mô hình tinh thần của người dùng về vị trí của các đối tượng trong không gian 3D.32 Khi một modal xuất hiện, nó phải trượt lên *từ bên dưới* và đẩy màn hình chính *ra phía sau* (thường được mô phỏng bằng cách thu nhỏ và làm mờ màn hình chính).32  
* **Phản hồi Tương tác (Interactive Feedback):** Chuyển động phải là phản hồi trực tiếp cho cử chỉ của người dùng. Thanh điều hướng co lại *vì* người dùng cuộn.2 Điểm sáng lóe trên nút phản ứng với *điểm chạm*.31

### **3.2. Hoạt ảnh "Biến hình Lỏng" (Fluid Morphing) – Yêu cầu Kỹ thuật Cốt lõi**

Đây là hành vi động xác định của Liquid Glass. Nó mô tả cách các thành phần kính riêng biệt có thể hợp nhất (merge) thành một thực thể lỏng duy nhất và sau đó tách ra (split) một cách linh hoạt. Điều này được quan sát thấy khi các thanh tab co lại 3 hoặc khi các công cụ chọn văn bản mở rộng.2

**Chỉ thị Kỹ thuật (SwiftUI):** Cách triển khai "chính thức" cho điều này là thông qua các API SwiftUI iOS 26 mới:

1. **GlassEffectContainer:** Các nhóm thành phần dự định biến hình (ví dụ: một nhóm các nút FAB mở rộng) *phải* được bọc trong một GlassEffectContainer.37  
2. **Hiệu ứng "Hợp nhất" (Merge):** Container này làm cho các thành phần con nhận biết lẫn nhau. Khi chúng di chuyển đủ gần nhau (một ngưỡng được kiểm soát bởi tham số spacing), chúng sẽ "tự động hòa trộn liền mạch và hợp nhất thành một".31 Đây là hiệu ứng "giọt chất lỏng" (liquid drop) đặc trưng.  
3. **glassEffectID & @Namespace:** Các công cụ này được sử dụng cho các chuyển đổi hình học trùng khớp (matched geometry transitions).38 Điều này cho phép hệ thống hiểu rằng một Button ở trạng thái thu nhỏ là *cùng một vật thể* với một Card ở trạng thái mở rộng.39 Hệ thống sau đó sẽ tự động tạo ra một hoạt ảnh biến hình lỏng, liền mạch giữa hai trạng thái.

### **3.3. Hoạt ảnh Vi mô (Micro-interactions) & PhaseAnimator**

Để làm cho vật liệu kính có cảm giác "sống động" liên tục, các hoạt ảnh vi mô tinh tế, lặp lại là rất quan trọng.

**Chỉ thị Kỹ thuật (SwiftUI):** Sử dụng PhaseAnimator (được giới thiệu trong iOS 17+) 41 để tạo các hoạt ảnh nhiều bước, lặp lại.

**Trường hợp sử dụng:**

* Tạo một hiệu ứng lấp lánh (shimmer effect) tinh tế di chuyển qua bề mặt của một nút không hoạt động để thu hút sự chú ý.44  
* Tạo một xung (pulse) nhẹ hoặc hiệu ứng "thở" (breathing) cho một điều khiển đang hoạt động.  
* Tạo các chuyển đổi phân cấp (staggered transitions) khi các mục menu xuất hiện, thay vì tất cả xuất hiện cùng một lúc.32

### **3.4. Lưu ý về Khả năng tiếp cận: Chế độ "Giảm Chuyển động"**

Các báo cáo từ các phiên bản beta ban đầu về "hoạt ảnh đột ngột" (abrupt animations) 45 không phải là lỗi. Chúng là cơ chế dự phòng (fallback) bắt buộc cho khả năng tiếp cận.

Các hiệu ứng chuyển động, khúc xạ và biến hình liên tục có thể gây mất phương hướng hoặc khó chịu về mặt vật lý cho một số người dùng (ví dụ: những người mắc chứng rối loạn tiền đình).15

Do đó, hệ thống thiết kế *phải* chỉ định hai chế độ hoạt ảnh:

1. **Chế độ Mặc định:** Đầy đủ vật lý, biến hình, và khúc xạ.  
2. **Chế độ "Giảm Chuyển động" (Reduce Motion):** Khi người dùng kích hoạt cài đặt trợ năng này, *tất cả* các hoạt ảnh biến hình và dựa trên vật lý *phải* được thay thế bằng các chuyển động mờ dần (cross-fades) đơn giản, "đột ngột".45

---

## **Phần 4: Thư viện Thành phần – Chỉ thị Thiết kế Cụ thể**

Phần này áp dụng các nguyên tắc vật liệu và chuyển động cho các thành phần UI cụ thể, dựa trên các "thành phần khung dây thiết yếu" (essential wireframe components).47

### **4.1. Điều hướng & Thanh (Navigation & Bars)**

* **Thành phần:** Layered Navigation Bars (Thanh điều hướng phân lớp).47  
* **Mô tả:** Các thanh (Tab Bars, Sidebars, Navigation Bars) là lớp "chrome" (khung) chức năng chính của giao diện, nằm trên nội dung.1  
* **Hành vi Động:** Chúng phải được thiết kế để *biến đổi* (morph) theo ngữ cảnh:  
  * **Khi cuộn:** Thanh tab (Tab bar) phải co lại (shrink) về mặt vật lý để tối đa hóa không gian nội dung.2  
  * **Hiệu ứng Cạnh cuộn (Scroll Edge):** Thanh điều hướng (Nav bar) phải chuyển từ trạng thái hoàn toàn trong suốt (khi ở đầu trang) sang vật liệu kính mờ (khi nội dung cuộn bên dưới nó).46  
  * **Thích ứng:** Thanh tab phải có khả năng tự động thích ứng thành thanh bên (sidebar) trên các màn hình lớn hơn (ví dụ: sử dụng API .sidebarAdaptable của SwiftUI).46

### **4.2. Thẻ & Modal (Cards & Modals)**

* **Thành phần:** Glass Cards & Modals (Thẻ & Modal bằng kính).47  
* **Mô tả:** Các khối nội dung bán trong suốt, lơ lửng, được sử dụng cho các bảng thông tin, widget, hoặc các cửa sổ pop-up.47  
* **Yêu cầu Vật liệu:**  
  * Phải "nổi" (float) phía trên nội dung với bóng đổ mềm, lan tỏa.22  
  * Phải sử dụng *khúc xạ* (xem Phần 2.3) để làm biến dạng tinh tế nội dung bên dưới, củng cố cảm giác về chiều sâu.  
  * Phải có viền 1px bắt sáng (xem Phần 2.4).

### **4.3. Nút & Điều khiển (Controls & CTAs)**

Đây là thành phần có rủi ro cao nhất về khả năng sử dụng. Các nhà phê bình đã chỉ ra rằng Liquid Glass có nguy cơ làm cho các nút trở nên "vô định hình" (amorphous) và mất đi "khả năng nhận diện" (affordances) vật lý của chúng (ví dụ: một nút không còn trông giống như một thứ có thể nhấn được).49

Một thách thức thiết kế lớn là cân bằng giữa "tính thẩm mỹ" (aesthetic) và "khả năng nhận diện" (affordance). Quy tắc thiết kế phải là: **"Đối với mỗi đơn vị khả năng nhận diện bị mất do độ trong suốt, một đơn vị phản hồi tương tác (ánh sáng, vật lý, hoặc xúc giác) phải được thêm vào."**

**Yêu cầu Bắt buộc để Giảm thiểu Rủi ro:**

1. **Phân cấp Tương phản:** Các Floating CTAs (Nút kêu gọi hành động chính) *phải* có độ mờ đục (opaque) hoàn toàn và độ tương phản cao để đảm bảo chúng luôn rõ ràng và có thể hành động được.47 *Không* được làm chúng trong suốt.  
2. **Khôi phục Khả năng nhận diện:** Đối với các nút kính (buttons), công tắc (toggles), và thanh trượt (sliders) thứ cấp, khả năng nhận diện phải được khôi phục thông qua các kênh phản hồi mới:  
   * **Hoạt ảnh Nhấn (Press Animation):** Khi nhấn, nút phải mô phỏng độ sâu 3D (ví dụ: sử dụng kỹ thuật "đẩy" 3D trong đó bề mặt trước di chuyển xuống để lộ ra một "cạnh" 50) và không chỉ đơn giản là thay đổi độ mờ.  
   * **Phản hồi Ánh sáng (Light Feedback):** Khi chạm, nút phải sử dụng API .interactive(\_:) (SwiftUI) 31 hoặc tương đương để tạo ra một điểm sáng lóe lan tỏa từ điểm tiếp xúc, xác nhận tương tác.8  
   * **Biến hình Hình dạng (Shape Morphing):** Công tắc và thanh trượt phải biến hình một cách linh hoạt khi tương tác để cung cấp phản hồi rõ ràng về sự thay đổi trạng thái.1

### **4.4. Lớp phủ & Menu (Overlays & Menus)**

* **Thành phần:** Blurred Background Zones (Vùng nền mờ) & Contextual Overlays (Lớp phủ theo ngữ cảnh).47  
* **Mô tả:** Bao gồm các menu ngữ cảnh (context menus) và action sheets.51  
* **Hành vi Động:**  
  * Phải xuất hiện từ điểm tương tác. Một menu ngữ cảnh không nên chỉ "hiện ra" (pop in); nó phải "nở ra" (expand) một cách linh hoạt từ điểm chạm của người dùng.2  
  * Khi xuất hiện, lớp phủ phải đẩy nội dung nền "ra sau" (ví dụ: bằng cách thu nhỏ và làm mờ nền) để tạo ra nhận thức không gian rõ ràng và tập trung vào các hành động theo ngữ cảnh.32

---

## **Phần 5: Sản phẩm Bàn giao, Công cụ, và Cảnh báo về Khả năng tiếp cận**

Phần này xác định các sản phẩm bàn giao kỹ thuật cụ thể và các cảnh báo quan trọng để đảm bảo một dự án thành công.

### **5.1. Yêu cầu về Sản phẩm Bàn giao (Cho Nhà thiết kế)**

* **Hệ thống Thiết kế Figma:**  
  * *Bắt buộc:* Phải sử dụng hiệu ứng "Glass" gốc mới của Figma.21  
  * *Bắt buộc:* Tận dụng đầy đủ các tham số Light Angle, Refraction, và Depth để mô phỏng chính xác vật lý của vật liệu.21 Các "hack" Glassmorphism cũ (chỉ làm mờ và thêm nhiễu) không được chấp nhận.  
  * Phải bao gồm các biến thể thành phần cho cả chế độ Sáng (Light) và Tối (Dark).1  
* **Nguyên mẫu (Prototypes) Tương tác:**  
  * Các mẫu tĩnh là không đủ. Phải tạo các nguyên mẫu tương tác, có độ trung thực cao để trình diễn các chuyển động "biến hình lỏng" (Phần 3.2).  
  * Phải trình diễn các tương tác vi mô dựa trên vật lý (ví dụ: phản ứng khi nhấn nút 3D, điểm sáng lóe) (Phần 4.3).

### **5.2. Yêu cầu về Kỹ thuật (Cho Nhà phát triển)**

* **Nền tảng Web (CSS/SCSS):**  
  * **Biến (Variables):** Cung cấp tệp \_variables.scss hoặc CSS :root 54 để kiểm soát các thuộc tính kính trên toàn cầu (ví dụ: \--glass-blur: 20px, \--glass-bg-opacity: 0.15).  
  * **Mixin (SASS):** Cung cấp một mixin SASS @mixin liquid-glass($blur, $opacity) có thể tái sử dụng để áp dụng các hiệu ứng cơ bản một cách nhất quán.55  
  * **Khúc xạ (Refraction):** Cung cấp một đoạn mã (snippet) cho bộ lọc SVG feDisplacementMap \+ feTurbulence 27 và một lớp CSS tiện ích để áp dụng nó (như đã mô tả trong 7).  
* **Nền tảng iOS (SwiftUI):**  
  * *Cấm:* Cấm các triển khai Glassmorphism tùy chỉnh (ví dụ: ZStack với BlurView thủ công).22 Các phương pháp này thiếu các hiệu ứng khúc xạ, biến hình và phản chiếu động.  
  * *Bắt buộc:* Chỉ thị cho nhóm kỹ thuật chỉ sử dụng các API iOS 26 gốc, chính thức do Apple cung cấp.46  
  * **Các API chính cần sử dụng:**  
    * .glassEffect(): Áp dụng vật liệu kính cho một View.31  
    * .interactive(\_:): Thêm phản hồi chạm động (điểm sáng lóe).31  
    * GlassEffectContainer: Bọc các nhóm thành phần để cho phép "hợp nhất" lỏng.31  
    * .glassEffectID(\_:in:): Kết hợp với @Namespace cho các chuyển đổi biến hình giữa các trạng thái.39  
* **Nền tảng iOS (UIKit):**  
  * **Fallback:** Đối với các dự án UIKit kế thừa, cơ chế fallback được chấp nhận là UIBlurEffect với style .systemUltraThinMaterial.23 Phải hiểu rằng đây là một giải pháp thay thế có giới hạn, chỉ cung cấp hiệu ứng "mờ" (frost) và sẽ thiếu các hiệu ứng "khúc xạ" và "biến hình lỏng" (fluid morphing) của SwiftUI gốc.

### **5.3. Các Cạm bẫy và Hướng dẫn về Khả năng tiếp cận (Bắt buộc)**

Việc không tuân thủ các hướng dẫn này sẽ dẫn đến một sản phẩm không thể sử dụng được và không thể tiếp cận.

1. **Nguy cơ về Độ tương phản (Contrast Risk):**  
   * **Vấn đề:** Văn bản và các biểu tượng trên kính trong suốt có thể trở nên không thể đọc được khi chúng di chuyển qua các hậu cảnh có màu sắc khác nhau.49  
   * **Giải pháp (Bắt buộc):**  
     * Nghiêm cấm văn bản có độ tương phản thấp trên các bề mặt kính.  
     * Tất cả các thành phần văn bản trên kính *phải* được kiểm tra so với nhiều hình nền (sáng, tối, nhiều màu sắc) để đảm bảo tuân thủ WCAG.  
     * Vật liệu kính phải *thích ứng*. Như Apple gợi ý 1, vật liệu này tự động điều chỉnh. Yêu cầu một cơ chế mà nếu độ tương phản của hậu cảnh quá gần với văn bản, độ mờ (Frost) của kính sẽ tự động tăng lên để đảm bảo khả năng đọc.  
2. **Rối loạn Chuyển động (Motion Sickness):**  
   * **Vấn đề:** Các hiệu ứng khúc xạ, biến hình và thị sai liên tục có thể gây khó chịu về mặt vật lý.15  
   * **Giải pháp (Bắt buộc):** Như đã nêu trong Phần 3.4, phải thiết kế *hai* chế độ hoạt ảnh. Chế độ "Giảm Chuyển động" (Reduce Motion) *phải* thay thế tất cả các hoạt ảnh biến hình và dựa trên vật lý bằng các chuyển động mờ dần (cross-fades) đơn giản, "đột ngột".45  
3. **Tránh Lạm dụng (Overuse):**  
   * **Vấn đề:** Sự cám dỗ là làm *mọi thứ* bằng kính.61  
   * **Giải pháp (Bắt buộc):** Chỉ thị rõ ràng rằng Liquid Glass *chỉ* được sử dụng cho "lớp chrome" (khung điều khiển) – thanh điều hướng, thanh tab, modal, menu, và các điều khiển.1 *Không bao giờ* sử dụng nó cho nội dung chính (ví dụ: thân bài viết, các hàng trong danh sách). Việc lạm dụng sẽ tạo ra "tiếng ồn thị giác" (visual noise) và các vấn đề nghiêm trọng về khả năng đọc.49