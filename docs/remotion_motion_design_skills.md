# Nâng cấp Motion Design Skills cho AI Agent sử dụng Remotion

## 1. Bối cảnh và mục tiêu

Agent hiện đã dựng video bằng Remotion, nhưng kết quả còn hơi cứng. Vấn
đề nhiều khả năng không nằm ở khả năng render của Remotion mà nằm ở năng
lực thiết kế chuyển động (Motion Design Intelligence) của Agent.

Mục tiêu là nâng cấp Agent từ việc chỉ biết đặt keyframe và thay đổi
`opacity`, `scale`, `translateX` thành một hệ thống có thể:

-   Phân tích phong cách và chuyển động từ video tham khảo.
-   Lựa chọn kỹ thuật phù hợp với nội dung và nhịp điệu.
-   Xây dựng Motion Specification trước khi viết code.
-   Triển khai animation bằng Remotion.
-   Render, đánh giá và cải thiện kết quả.

## 2. Những nguyên nhân khiến video bị cứng

### 2.1. Linear Motion

Chuyển động bắt đầu và kết thúc với vận tốc không đổi, thiếu
acceleration và deceleration.

### 2.2. Thiếu Stagger Animation

Các chữ, hình hoặc layer xuất hiện cùng lúc thay vì có thứ tự và độ trễ
có chủ đích.

### 2.3. Thiếu Secondary Motion

Chuyển động chính không có phản ứng phụ như overshoot, bounce, rotation
hoặc follow-through.

### 2.4. Thiếu Dynamic Composition

Chữ, hình và background chỉ di chuyển độc lập, không tương tác với nhau
hoặc không tạo thành một bố cục có chủ đích.

### 2.5. Timing đơn điệu

Các đoạn animation có thời lượng gần giống nhau, thiếu nhịp nhanh, chậm
và khoảng nghỉ.

### 2.6. Thiếu Depth

Các layer không có sự khác biệt về tốc độ, chiều sâu và hướng di chuyển.

## 3. Kiến trúc Skill đề xuất

Nên chia hệ thống thành ba tầng kỹ năng.

### Layer 1 --- Motion Physics & Animation Principles

Đây là tầng nền tảng, giúp Agent hiểu nguyên lý chuyển động.

-   Easing Curves
-   Velocity Control
-   Acceleration / Deceleration
-   Anticipation
-   Overshoot & Follow-through
-   Secondary Motion
-   Squash & Stretch
-   Stagger Timing

### Layer 2 --- Motion Design Techniques

Tầng này biến nguyên lý thành kỹ thuật thiết kế cụ thể.

-   Kinetic Typography
-   Dynamic Layout
-   Shape Morphing
-   Mask Transitions
-   Camera Movement
-   Parallax
-   Motion Blur
-   Rhythm-based Animation

### Layer 3 --- Remotion Implementation

Tầng này hướng dẫn Agent triển khai kỹ thuật bằng code.

-   `spring()`
-   `interpolate()`
-   `Sequence`
-   `AbsoluteFill`
-   `useCurrentFrame()`
-   SVG Animation
-   CSS Transform
-   Layer compositing

## 4. Kỹ thuật Remotion cần ưu tiên

### 4.1. Easing thay vì Linear

Ví dụ sử dụng Bézier easing:

``` tsx
import { interpolate, Easing } from "remotion";

const x = interpolate(
  frame,
  [0, 30],
  [-300, 0],
  {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }
);
```

Không nên dùng một đường easing cho mọi chuyển động. Easing phải phù hợp
với tính chất của hành động: snap, glide, settle, bounce hoặc dramatic
reveal.

### 4.2. Spring Animation

Ví dụ:

``` tsx
import { spring, useVideoConfig } from "remotion";

const { fps } = useVideoConfig();

const progress = spring({
  frame,
  fps,
  config: {
    damping: 12,
    stiffness: 150,
    mass: 0.8,
  },
});

const scale = 0.5 + progress * 0.5;
```

Spring phù hợp với các chuyển động có cảm giác vật lý như bật vào vị
trí, overshoot hoặc settle. Không nên áp dụng Spring cho tất cả
animation.

### 4.3. Stagger Animation

Thay vì cho cả câu xuất hiện cùng lúc, có thể tạo độ trễ theo từng ký tự
hoặc thành phần:

``` tsx
const delay = index * 3;

const progress = spring({
  frame: frame - delay,
  fps,
  config: {
    damping: 14,
    stiffness: 180,
  },
});
```

Stagger cần được điều chỉnh theo độ dài chữ, nhịp nhạc và mục đích thị
giác. Không phải lúc nào từng ký tự cũng cần xuất hiện lần lượt.

## 5. Skill quan trọng: Motion Reference Analysis

Agent cần học cách phân tích video tham khảo thay vì chỉ nhận yêu cầu
chung chung như "tạo kinetic typography đẹp".

Mỗi cảnh nên được phân tích theo các yếu tố:

  Thành phần    Câu hỏi cần trả lời
  ------------- -------------------------------------------
  Motion        Vật thể chuyển động như thế nào?
  Timing        Chuyển động kéo dài bao nhiêu frame?
  Easing        Vận tốc thay đổi như thế nào?
  Hierarchy     Thành phần nào được ưu tiên thị giác?
  Interaction   Các layer tương tác với nhau ra sao?
  Rhythm        Chuyển động đồng bộ với âm thanh thế nào?
  Transition    Cách chuyển từ cảnh A sang cảnh B?

### 5.1. Motion Specification

Sau khi phân tích, Agent nên tạo một bản đặc tả chuyển động trước khi
viết code.

Ví dụ:

``` yaml
scene:
  duration: 90
  style: kinetic_typography

  elements:
    - name: main_text
      motion:
        type: overshoot_scale
        entrance: bottom_to_center
        stagger: 3
        easing: custom_bezier

    - name: geometric_shapes
      motion:
        type: rotational_reveal
        delay: 8
        secondary_motion: true

    - name: background
      motion:
        type: subtle_parallax
        continuous: true

  rhythm:
    sync_to_music: true
    variation: dynamic
```

Đây là cấu trúc minh họa, chưa phải schema bắt buộc. Khi triển khai thực
tế, cần định nghĩa schema rõ ràng, kiểm tra dữ liệu đầu vào và ánh xạ
từng motion type sang implementation tương ứng.

## 6. Motion Knowledge Pipeline

Để Agent có thể tích lũy và cập nhật kiến thức Motion Graphics, có thể
xây dựng pipeline sau:

1.  **Reference Collection:** Thu thập video tham khảo từ TikTok,
    YouTube, Behance và các nguồn phù hợp.
2.  **Motion Analysis:** Phân tích frame, timing, layout và animation.
3.  **Technique Extraction:** Trích xuất Motion Pattern và kỹ thuật có
    thể tái sử dụng.
4.  **Skill Knowledge Base:** Lưu hướng dẫn, code mẫu, thông số, ví dụ
    và giới hạn sử dụng.
5.  **Agent Application & Evaluation:** Agent sử dụng Skill, render
    video, đánh giá kết quả và đề xuất cải thiện.

Không nên tự động biến mọi video tham khảo thành Skill. Cần có bước đánh
giá chất lượng, loại bỏ kỹ thuật trùng lặp và kiểm thử khả năng tái sử
dụng.

## 7. Phân biệt bốn loại kiến thức

Nên tách biệt bốn nhóm kiến thức để tránh Skill bị trộn lẫn trách nhiệm:

-   **Design Knowledge:** Biết video nên trông như thế nào.
-   **Motion Knowledge:** Biết chuyển động được tạo ra như thế nào.
-   **Implementation Knowledge:** Biết triển khai chuyển động bằng
    Remotion.
-   **Evaluation Knowledge:** Biết đánh giá video sau khi render.

Vì pipeline hiện tại sử dụng Remotion, không cần bắt Agent điều khiển
After Effects hoặc Alight Motion. Agent có thể học các nguyên lý và kỹ
thuật Motion Design rồi tái triển khai bằng React, CSS, SVG hoặc Canvas
trong Remotion.

## 8. Quy trình làm việc đề xuất cho Agent

``` text
User Brief
    |
    v
Creative Direction
    |
    v
Reference Analysis
    |
    v
Storyboard / Scene Breakdown
    |
    v
Motion Specification
    |
    v
Remotion Implementation
    |
    v
Render Preview
    |
    v
Motion & Visual Evaluation
    |
    +---- Không đạt ----> Revise Motion Specification
    |
    v
Final Render
```

### Các tiêu chí đánh giá

-   **Timing:** Chuyển động có đúng nhịp và có khoảng nghỉ hợp lý không?
-   **Easing:** Có gia tốc, giảm tốc và cảm giác chuyển động phù hợp
    không?
-   **Hierarchy:** Người xem có nhận biết đúng nội dung quan trọng nhất
    không?
-   **Composition:** Các thành phần có phối hợp thành một bố cục thống
    nhất không?
-   **Secondary Motion:** Chuyển động phụ có bổ trợ cho chuyển động
    chính không?
-   **Rhythm:** Animation có đồng bộ với âm thanh và nhịp dựng không?
-   **Consistency:** Phong cách chuyển động có nhất quán giữa các cảnh
    không?

## 9. Thứ tự triển khai ưu tiên

Không nên xây dựng tất cả Skill cùng lúc. Nên triển khai theo thứ tự:

1.  `motion-timing` --- timing, easing, velocity và nhịp chuyển động.
2.  `typography-motion` --- kinetic typography, text reveal, stagger.
3.  `transition-design` --- chuyển cảnh và sự liên kết giữa các scene.
4.  `shape-motion` --- shape animation, morphing và geometric motion.
5.  `visual-layout` --- hierarchy, composition và negative space.
6.  `texture-compositing` --- texture, blend, blur và compositing.
7.  `camera-motion` --- camera movement và parallax.
8.  `motion-reference-analysis` --- phân tích và trích xuất kỹ thuật từ
    video tham khảo.
9.  `motion-evaluation` --- đánh giá preview và đề xuất sửa đổi.

## 10. Kết luận

Mục tiêu không phải là khiến Agent sử dụng càng nhiều hiệu ứng càng tốt.
Mục tiêu là giúp Agent hiểu:

-   Vì sao một chuyển động cần nhanh hoặc chậm.
-   Vì sao một thành phần cần xuất hiện trước thành phần khác.
-   Khi nào cần overshoot, anticipation hoặc follow-through.
-   Khi nào nên giữ khung hình tĩnh để tạo khoảng nghỉ.
-   Làm thế nào để typography, shape, background và âm thanh phối hợp
    với nhau.

**Khác biệt cốt lõi:** Agent không chỉ biết tạo animation, mà phải biết
tại sao một chuyển động cần nhanh, chậm, mạnh, nhẹ hoặc dừng đúng thời
điểm đó.
