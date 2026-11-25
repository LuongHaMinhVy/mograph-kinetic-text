# Reference Frame Blueprints (Tài Liệu Tiền Đề Từ Video Gốc)

Tài liệu này tổng hợp kết quả kiểm tra từng khung hình (1-frame, 2-frame, 4-frame, 8-frame và 16-frame) trên toàn bộ 4 video mẫu trong thư mục `references/` để làm chuẩn khuôn (`template`) cho engine Remotion và hệ thống skill tạo motion graphic.

> [!NOTE]
> Toàn bộ 3 khuôn mẫu (`hk-1999-halftone`, `pop-collage-light`, `dreamy-glow-dark`), bộ primitive mở rộng (`StickerBlock`, `HollowEchoTrail`, `DashedOrbitRing`, `BokehField`), cùng dây chuyền `prep:audio` -> `align:lyrics` (có review `.review.md`) -> `gen:storyboard` -> `KineticDynamic` đã được cài đặt trong mã nguồn của dự án.

---

## 1. Tổng Quan Kỹ Thuật 4 Video Nguồn

| File nguồn | Ngôn ngữ / Nhãn | Độ phân giải | FPS | Tổng frame | Thời lượng | StylePack ID |
|---|---|---|---:|---:|---:|---|
| `_luntuyett.01_7640160161155386645.mp4` | Tiếng Việt (`Dạo Bước Hồng Kông 1999`) | `768x576` (`4:3`) | `24` | `588` | `24.50s` | `hk-1999-halftone` |
| `_luntuyett.01_7640159698364615956 (1).mp4` | Tiếng Quảng Đông / Hoa (`漫步香港1999`) | `768x576` (`4:3`) | `24` | `731` | `30.46s` | `hk-1999-halftone` |
| `ref-ca-ngay-light.mp4` | Tiếng Việt (`Cả Ngày...`) | `768x576` (`4:3`) | `30` | `555` | `18.50s` | `pop-collage-light` |
| `ref-an-ngo-dark-purple.mp4` | Tiếng Việt (`Biết Đâu / An Ngõ...`) | `768x576` (`4:3`) | `30` | `1708` | `56.93s` | `dreamy-glow-dark` |

---

## 2. Phân Tích Từng Frame (`1f/cell`): HK1999 Bản Tiếng Việt (`588` frames @ `24fps`)

Nguồn ảnh kiểm tra: `hk1_exact_20_79.png`, `hk1_exact_104_193.png`, `hk1_exact_236_295.png`, `hk1_f0_142_2f.png`, `hk1_f144_286_2f.png`, `hk1_f288_587_4f.png`.

### Bảng Mốc Khung Hình Chuẩn Xác Theo Single-Frame

| Mốc Frame | Chuyển Động / Text Hiển Thị | Quy Luật Chuyển Cảnh Quan Sát Được |
|---|---|---|
| `0–20` | Nền đen tĩnh hoàn toàn | Im lặng trước beat đầu |
| `21–26` | `"về"` xuất hiện nhỏ (`f=21`), nở starburst viền đỏ 14 cánh (`f=22–26`), góc dải băng đỏ ló vào từ `f=24` | Pop scale nhẹ + starburst xoay |
| `27–33` | `"LỜI"` viền mảnh (`f=27–29`) -> đặc trắng (`f=30–33`) bên phải `"về"`, cùng dải băng đỏ chéo | Viền -> đặc trong 3 frame |
| `34–39` | Khung chữ nhật đỏ + chữ trắng `"hẹn"` trồi lên từ dưới (`f=34–35`), giữ đến `f=39` | Slide-up + boxed label |
| `40–44` | Whip-pan xuống dưới + phóng cận nền băng đỏ halftone; `"ƯỚC"` xuất hiện từ trắng (`f=40–43`) đổi thành xanh cyan `#00F0FF` kèm bóng đỏ rực (`f=44`) | Whip-pan + đổi màu nhấn vào nhịp |
| `45–57` | `"nếu"` (`f=45`) và `"duyên"` (`f=50–54`) điền tiếp bên phải, kèm starburst cyan nhỏ ở cạnh dưới | Sequence ngang trái sang phải |
| `58–65` | Chữ kéo dọc khổng lồ `"TÌNH"` màu trắng/cyan kèm thanh che đen cắt ngang thân chữ | Censor-invert + chromatic cyan |
| `66–108` | Starburst trắng khổng lồ bung từ góc dưới-phải (`f=66`), lần lượt hiện `"ta"` (`f=66`), `"có"` (`f=73`), `"lỡ"` (`f=80+`), rồi camera pan dọc đẩy cụm starburst trượt dần lên khỏi mép trên (`f=80–108`), chỉ còn thanh đỏ nhỏ ở góc dưới-trái | Camera vertical pan liên tục |
| `109–114` | `"TÌNH"` cắt cứng đặt hơi nghiêng -> dựng thẳng | Hard cut + micro tilt settle |
| `115–121` | `f=115` là **frame morph trung gian** vừa xoay `"TÌNH"` vừa hiện `"NỒNG"`; `f=116–120` giữ `"NỒNG"` gradient lửa; `f=121` bắt đầu morph sang `"làm"` | 1-frame rotational overlap |
| `122–126` | `"làm"` xoay thu nhỏ ở tâm, `f=126` tách mảnh biến mất | Spin-shrink exit |
| `127–133` | `"sao"` nằm trên dải băng đỏ chéo góc nông (`f=127–132`), đến `f=133` băng đỏ whip-xoay dựng dốc hơn về góc trên-phải | Ribbon angle whip ở frame cuối |
| `134–145` | `f=134` cut trung gian starburst đỏ -> `f=135–145` giữ `"GIẤU"` trắng trên sọc đỏ đứng + starburst đỏ viền trắng trên đỉnh, `f=142–145` zoom tiến nhẹ | Punch zoom 3 frame cuối |
| `146–152` | Một cú zoom liên tục duy nhất trên `"NHỮNG"` vắt ngang dải chéo trắng (`\`): `f=146` cỡ trung -> `f=152` phóng đại cực đại (~3.5x) đến mức các nét đứng của `"NHỮNG"` lấp đầy khung hình | Continuous rapid scale-in (không phải cut) |
| `153–159` | `f=153` `"luyến"` nghiêng theo vạch trắng -> `f=154–158` sọc trắng dựng thẳng đứng ở giữa kèm `"luyến"` đen và starburst cyan/đỏ ở mép dưới; `f=159` lóe morph sang vạch `/` | Vertical strip hold + 1f morph |
| `160–166` | Vạch chéo trắng `/` kèm chữ lửa lớn `"lưu"` phóng to dần từ `f=160` tới `f=166` | Diagonal slash + rising fire text |
| `167` | **1 frame X-cross chuyển tiếp** (vạch đỏ và vạch trắng giao chữ X với `"tràn"` ở tâm) | Single-frame geometric bridge |
| `168–172` | Dải trắng rất rộng hướng `\` với `"tràn"` đen ở tâm (`f=168–171`), `f=172` phóng đại xoay lớn lấp màn hình | Wide ribbon hold -> scale slam |
| `173–183` | `"dâng"` đỏ/cam ở tâm (`f=173–180`), `f=181–182` chữ trắng khổng lồ xoay dọc làm màn chắn, **`f=183` đảo nền trắng toàn màn hình 1 frame** với serif đỏ `"CHUYỆN"` | 1-frame inverted flash cut |
| `184–238` | Chuỗi 2 lớp: nền serif đỏ khổng lồ (`CHUYỆN` `184–189` -> `MÌNH` `190–196` -> `ĐỂ` `197–202` -> `VẦNG` `203–206` -> `TRĂNG` `207–213` -> `KIA` `214–221` -> `CHỨNG` `222–228` -> `DÁM` `229–238`) kết hợp lớp chữ trắng nén ở tiền cảnh | Dual-layer serif BG + condensed FG |
| `239–264` | Nhịp thở tối giản căn giữa `"hẹn hò một đêm trăng"` (video gốc gõ nhầm `"đên"`), kèm **3 chùm nháy 2–3 frame chữ `"13 giờ đêm"` đè trực tiếp tại `f=252–254`, `f=258–260`, và `f=264`** | Minimal breather + triple glitch flash |
| `265–283` | `f=265` cắt thẳng vào chữ rỗng viền đỏ `"TRĂNG"` phóng đại vượt khung -> `f=266–283` kéo zoom lùi mượt để thu gọn chữ | Instant closeup -> zoom-out pull |
| `284–285` | **Overlap 2 frame**: cụm điệp khúc (`dạo bước / 香港1999 / SÁNG` + tem vé + băng đỏ) xuất hiện chéo từ trên-phải đè lên chữ rỗng `TRĂNG` | Corner overlap transition |
| `286–317` | Zoom cận cụm mở đầu điệp khúc; thanh ngang đỏ quét từ `f=287`, thanh glow xanh lá–vàng chạy từ `f=288–317` ở dưới `"SÁNG"` | Lockup + horizontal glow sweep |
| `318–485` | Snap zoom-out sang bố cục toàn cảnh; camera drift ngang từ trái sang phải giữ dòng chữ lyric cố định theo màn hình (`ước mơ của ta và nàng` -> `BÓNG` -> `HÌNH` -> `ANH` -> `BÓNG HÌNH ANH YÊU` đến `f=485`) cùng dải băng đỏ xoay dần góc âm và khung wireframe `"漫 步 / 1999"` + biển neon góc phải | Panoramic parallax + screen-fixed lyric |
| `486–587` | Kết không lời trên nền wireframe đỏ `"漫 步 / 1999"`, các ô lửa lơ lửng và biển hiệu neon nghiêng góc trên-phải | Instrumental clean outro |

---

## 3. Khung Khuôn Chung Giữa 2 Video HK1999 (`hk1` vs `hk2`)

So sánh `hk1` (`588`f) và `hk2` (`_luntuyett.01_7640159698364615956 (1).mp4`, `731`f @ `24fps` trong `hk2_all_8f.png`) xác nhận **cả hai video dùng chung một kiến trúc khuôn mẫu (`hk-1999-halftone`)**:

1. **Intro Đen Tĩnh**: `0–20f` (`hk1`) / `0–31f` (`hk2`).
2. **Word-Map Panning + Starburst + Ribbon**: Nhảy/pan qua từng cụm từ, sử dụng cùng bộ từ vựng thị giác: starburst 14 cánh rỗng/đặc, dải băng đỏ halftone + lửa, label hộp đỏ, và 1–2 chữ kéo dọc hiệu ứng `chromatic cyan + censor invert` (`TÌNH` ở `hk1`, `你` ở `hk2`).
3. **Solo Beat Hits + Slashes**: Cắt nhịp 4–12 frame dùng vạch chéo trắng/đỏ, starburst đảo cực âm, zoom-in xuyên chữ ở nhịp đỉnh, rồi **nhịp thở chữ serif nhỏ căn giữa** (`hẹn hò một đêm trăng` ở `hk1`; chuỗi đơn tự `紅 / 燭 / 照 / 亮 / 一 / 方 / 就 / 把` có chấm lửa & tia hướng tâm ở `hk2`).
4. **Điệp Khúc & Outro Toàn Cảnh Dùng Chung Hoàn Toàn Asset Layout**:
   - Cùng cụm tiêu đề đỏ trên-trái (`dạo bước 香港1999` vs `漫步香港1999`) + chữ trắng nghiêng nhấn nhịp (`SÁNG` vs `開`).
   - Cùng vé Kowloon #3 góc dưới-trái, ô lửa nhỏ, dải băng đỏ xoay góc, thanh glow vàng-xanh ngang màn hình, biển neon `VICTORIA PARTS CO. LTD`, và khung nét mảnh `"漫 步 / 1999"` trượt vào outro.

---

## 4. Khuôn Mẫu Của 2 Phong Cách Còn Lại Trong `references/`

### Template #2: Light Pop Collage (`ref-ca-ngay-light.mp4` — `555`f @ `30fps`) -> `pop-collage-light`
Quan sát từ `cangay_all_8f.png`:
- **Bảng màu & Đảo cực nền**: Nền chính trắng tinh `#FFFFFF` chữ đen/đỏ; đến đoạn chuyển tối ở giữa (`~f=144–264`) đảo sang nền đen `#080808` phủ ảnh hoa đỏ/hồng bán trong suốt + bàn tay phát sáng, sau đó lật lại nền trắng `#FFFFFF`.
- **Ngôn ngữ khối & chữ**:
  - Ô sticker chữ nhật màu bão hòa cao nghiêng `±2–8deg`: tím `#6C28FF`, cam `#FF4518`, xanh bạc hà `#8FD99F`.
  - Chữ rỗng viền đen mỏng xếp lớp/trượt ngang tạo đuôi echo (`BÃOOOOOO...` ở `f=384–448`) kèm dòng chữ nhỏ đi ngang tâm các chữ `O` (`liệu ban đêm có ngắm những vì sao`).
  - Nút ảnh hoa cắt ghép đằng sau chữ đậm cỡ lớn (`như thế này`, `nghĩ lời`, `SAO`, `HAY?`).

### Template #3: Dark Purple / Pale Yellow Dreamy Glow (`ref-an-ngo-dark-purple.mp4` — `1708`f @ `30fps`) -> `dreamy-glow-dark`
Quan sát từ `anngo_all_16f.png`:
- **Bảng màu & Ánh sáng**: Nền tím than tối (`#16141C`), bokeh tròn vàng ấm mờ, đốm sáng sao/bướm vàng lơ lửng, vòng tròn nét đứt quay quanh tiêu điểm, ảnh vuông viền trắng (Polaroid inset) có bóng đổ nhẹ.
- **Màu chữ**: Tím neon (`#A357FF` / `#8E44FF`), vàng bơ nhạt (`#F2EC7E`), trắng sạch (`#F5F5F5`).
- **Ngữ pháp camera**: Kết hợp quay camera tới `±90deg` (`f=400–528`) để biến dòng chữ dọc thành ngang mượt mà giữa các cụm câu, xen kẽ các đoạn breather chữ nhỏ màu xám tím nhạt (`có em bên đời..`, `mà cớ sao..?`, `hoa đã về với mây gió biển khơi...`), và kết bằng tường chữ đồng tâm phóng lùi ở cao trào (`ƠI!` -> `duyên / tình / anh / cố đợi nhưng sao? / DƯỜNG NHƯ` ở `f=1152–1392`).

---

## 5. Trạng Thái Hiện Thực Hóa Trong Engine

- **Bản tinh chỉnh `hk1999-vn`**: Đã sửa lỗi hiển thị tại frame đầu ở `KineticWord`, `DiagonalRibbon`, `StarburstBadge`, `MediaInset`, thêm `"hold"` keyframe và motion blur có điều kiện; một số thủ thuật 1-frame siêu ngắn trong video gốc (`1-frame rotational overlap` tại `f=115`, `f=121`, X-cross `f=167`, đảo nền trắng `f=183`, chớp 3 lần `"13 giờ đêm"`) có thể thêm thủ công trực tiếp vào `src/storyboards/hk1999-vn.ts` khi cần bản sao khít từng frame đơn.
- **Hệ thống đa khuôn mẫu**: `src/engine/types.ts` và `src/compositions/KineticMV.tsx` đã hoàn thiện đầy đủ 3 Style Pack (`hk-1999-halftone`, `pop-collage-light`, `dreamy-glow-dark`) cùng các primitive `StickerBlock`, `HollowEchoTrail`, `DashedOrbitRing`, `BokehField` và `BgOverride`.
- **Dây chuyền ElevenLabs + Review + Render tự động**:
  - `scripts/prep-audio.mjs` tách MP3 + energy/beat JSON.
  - `scripts/align-lyrics.mjs` căn lời qua ElevenLabs Forced Alignment / Scribe v3 kèm SHA-256 cache (`0` credit khi lặp), `--dry-run`, và vòng lặp review `.review.md` (`--export-review` / `--apply-review`).
  - `scripts/generate-storyboard.mjs` áp cổng chặn `reviewed === true` rồi sinh JSON storyboard theo 3 style, kết hợp `KineticDynamic` / `KineticDynamicVertical` trong `src/Root.tsx`.
