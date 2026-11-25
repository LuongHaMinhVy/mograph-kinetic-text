# Kinetic Text Motion Graphic Skill Maker

Tiếng Việt | [English](./README.en.md)

Engine tạo video kinetic typography đồng bộ nhịp (beat-synced) và chính xác từng khung hình, xây dựng trên [Remotion](https://www.remotion.dev/), React và TypeScript. Dự án biến file âm thanh cùng lời bài hát thành video motion graphic có tính tất định (cùng đầu vào luôn cho ra cùng khung hình) thông qua hệ thống style pack tái sử dụng, camera rig làm mượt bằng lò xo, bộ sinh storyboard tự động, công cụ kiểm lỗi bố cục/đồng bộ, công cụ QA so sánh từng khung hình và bộ agent skills đi kèm.

## Tính năng chính

- **Motion Engine tất định (`src/engine/`)**: Camera rig mượt theo lực lò xo (`CameraRig`), co giãn khung hình đa tỷ lệ (`StageViewport`), hiệu ứng vào/ra trượt mờ (`softEntrances`), kiểm tra và tự bảo vệ độ tương phản chữ (`legibility`), cùng hơn 16 thành phần đồ họa chuyển động (kinetic word, starburst badge, dải halftone chéo, đường zigzag, chữ bóng rỗng hollow echo, lưới plexus, bokeh, vòng quỹ đạo nét đứt, vòng chữ tròn, hoa cắt giấy, sticker block, hình doodle, tia tỏa radial, thanh tiến trình phát sáng, khung media inset và hậu kỳ post-processing FX).
- **5 Style Packs (`src/styles/`)**: Bộ giao diện chuyển đổi linh hoạt gồm halftone cổ điển tối màu, neon dreamy phát sáng, pop collage sáng màu, lưới neon plexus và editorial pastel.
- **Pipeline Audio -> Video hoàn chỉnh (`scripts/`)**: Tách âm thanh và tính năng lượng/nhịp onset (`prep:audio`), căn chỉnh lời bài hát từng từ qua ElevenLabs forced alignment hoặc STT kèm chế độ `--dry-run` ước lượng chi phí (`align:lyrics`), sinh storyboard camera chuyển động liên tục (`gen:storyboard`), kiểm lỗi bố cục và nhịp (`lint:storyboard`), phân tích video tham khảo và so sánh QA (`analyze:ref`, `qa:compare`, `scripts/qa/`).
- **Đa tỷ lệ khung hình (`src/Root.tsx`)**: Hỗ trợ xuất 4:3 (`1200x900`), 16:9 (`1920x1080`) và 9:16 (`1080x1920`), bao gồm composition tự nhận thời lượng và FPS từ file props JSON.
- **Bộ Agent Skills đi kèm (`.agents/skills/`)**: Tài liệu quy trình cho agent tạo video (`kinetic-mv-maker`), phân tích chuyển động từ video tham khảo từng khung hình (`kinetic-reference-analysis`) và kiểm duyệt hình ảnh/đồng bộ (`kinetic-qa-and-house-rules`).

## Yêu cầu môi trường

- **Node.js** (khuyến nghị v20 trở lên)
- **pnpm** (repo sử dụng `pnpm` và lockfile `pnpm-lock.yaml`)
- **ffmpeg** và **ffprobe** có sẵn trong `PATH` (dùng để tách âm thanh, phân tích năng lượng onset, xuất contact sheet tham khảo và so sánh QA)
- **ElevenLabs API key** (tuỳ chọn, chỉ cần khi chạy `pnpm run align:lyrics` chưa có cache): sao chép `.env.example` thành `.env.local` rồi điền `ELEVENLABS_API_KEY` (hoặc chạy `pnpm dlx @elevenlabs/cli@latest onboard connect --env-path .env.local`); file `.env.local` đã được ignore trong git

## Bắt đầu nhanh

```powershell
# 1. Cài đặt thư viện
pnpm install

# 2. Kiểm tra kiểu TypeScript
pnpm run typecheck

# 3. Mở Remotion Studio để xem trước trực tiếp
pnpm run dev

# 4. Render bản demo HK1999 mặc định
pnpm run build:hk1999
```

## Các Style Pack

| Style Pack ID | FPS mặc định | Phong cách hình ảnh |
| --- | ---: | --- |
| `hk-1999-halftone` | 24 | Nền đen `#050505`, đỏ thẫm `#F21B14`, xanh cyan `#00F0FF`, trắng; dải halftone, starburst 14 cánh, chữ serif nhấn mạnh |
| `dreamy-glow-dark` | 30 | Tím than `#1F1C22`, tím neon `#9B5CFF`, vàng bơ `#FFF066`, hồng `#FF5C8A`; doodle mềm, starburst nét mảnh, vòng chấm quỹ đạo, bokeh |
| `pop-collage-light` | 30 | Trắng ngà `#FAFAFA` xen đoạn tối `#0D0D0F`; cam `#FF4518`, tím `#6C28FF`, xanh bạc hà `#8FD99F`; sticker nghiêng, hoa cắt giấy vector, chữ hollow echo |
| `neon-plexus-dark` | 30 | Đen sâu `#06070A`, xanh mint neon `#4EFFB2`, vàng nhạt `#FFF59E`, xanh tím `#5B7CFF`, đỏ san hô `#FF6B5B`; nền lưới plexus chuyển động và scanlines |
| `pastel-editorial-light` | 30 | Trắng sạch `#FCFCFD` kết hợp xám đậm `#121318`; tím xanh `#6E6BF5`, đỏ san hô `#FF5A5F`, xanh mint `#8EF0B0`, vàng nhạt `#FFE46B`; typography editorial tối giản |

Các mức FPS hỗ trợ gồm `24`, `30` và `60`. Các primitive tự động chuẩn hoá nhịp thời gian theo tỷ lệ `fps / 24`.

## Các Remotion Composition

| Composition ID | Độ phân giải | Ghi chú |
| --- | --- | --- |
| `KineticDynamic` | 1200x900 | Tự lấy thời lượng và FPS từ file `--props` storyboard JSON |
| `KineticDynamicVertical` | 1080x1920 | Bản dọc 9:16 chạy theo `--props` storyboard JSON |
| `HK1999Demo` | 1200x900 | Storyboard HK1999 tiếng Việt dựng tay (`src/storyboards/hk1999-vn.ts`, 24 fps) |
| `HK1999DemoWide` | 1920x1080 | Khung hình ngang 16:9 của `HK1999Demo` |
| `HK1999DemoVertical` | 1080x1920 | Khung hình dọc 9:16 của `HK1999Demo` |
| `HK1999Cantonese` | 1200x900 | Storyboard HK1999 tiếng Quảng Đông dựng tay (`src/storyboards/hk1999-2.ts`, 24 fps) |

## Quy trình tạo video đầy đủ

### 1. Chuẩn bị âm thanh và dữ liệu nhịp onset

```powershell
pnpm run prep:audio -- --input references/song.mp4 --audio-out public/audio/song.mp3 --energy-out src/storyboards/song.energy.json --fps 30
```

### 2. Căn chỉnh lời bài hát (chạy thử trước khi gọi API)

Luôn chạy `--dry-run` trước để xem ước lượng credit ElevenLabs trước khi gọi API thật:

```powershell
pnpm run align:lyrics -- --audio public/audio/song.mp3 --text-file lyrics.txt --fps 30 --dry-run
```

Sau khi xác nhận, bỏ `--dry-run` để chạy thật. Kiểm tra và chỉnh sửa file `src/storyboards/<slug>.review.md`, áp dụng lại vào JSON căn chỉnh và đánh dấu `reviewed: true`:

```powershell
pnpm run align:lyrics -- --apply-review src/storyboards/<slug>.review.md
```

Tuỳ chọn: thêm `"phraseEnd": true` vào từ cuối mỗi câu hát trong `<slug>.align.json` để chia cảnh chính xác theo câu.

### 3. Sinh storyboard và kiểm lỗi (lint)

```powershell
pnpm run gen:storyboard -- --align src/storyboards/<slug>.align.json --energy src/storyboards/<slug>.energy.json --style dreamy-glow-dark --audio-src audio/<slug>.mp3 --title "Ten Bai Hat"

pnpm run lint:storyboard -- --storyboard src/storyboards/<slug>.storyboard.json
```

`lint:storyboard` cần đạt 0 lỗi trước khi render. Bạn có thể đổi FPS (`24`, `30` hoặc `60`) bằng cờ `--fps <N>` từ file `.align.json` đã duyệt mà không tốn thêm credit căn chỉnh lời.

### 4. Render ảnh kiểm tra và xuất video MP4

```powershell
# Xuất 1 khung hình kiểm tra nhanh
pnpm exec remotion still src/index.ts KineticDynamic out/<slug>_f120.png --frame=120 --props=src/storyboards/<slug>.props.json

# Xuất video MP4 hoàn chỉnh
pnpm exec remotion render src/index.ts KineticDynamic out/<slug>.mp4 --props=src/storyboards/<slug>.props.json
```

### 5. Phân tích video tham khảo và kiểm duyệt QA

```powershell
# Trích xuất chỉ số từng khung hình và bảng contact sheet 60 khung hình từ video tham khảo
pnpm run analyze:ref -- --input references/ref.mp4 --out-dir out/ref-analysis/ref

# So sánh song song khung hình render với video tham khảo
node scripts/qa/compare-frames.mjs references/ref.mp4 out/<slug>.mp4 out/qa/pairs.png 21 45 66 150

# Đo mật độ chuyển động theo khung hình và theo giây
node scripts/qa/motion-stats.mjs "REF=references/ref.mp4" "OUT=out/<slug>.mp4" --fps 30
node scripts/qa/motion-profile.mjs OUT out/<slug>.mp4 30 30
```

## Danh sách Script

| Lệnh | Chức năng |
| --- | --- |
| `pnpm run dev` | Mở Remotion Studio (`src/index.ts`) |
| `pnpm run build:hk1999` | Render composition `HK1999Demo` ra `out/hk1999-demo.mp4` |
| `pnpm run typecheck` | Kiểm tra kiểu TypeScript (`tsc --noEmit`) |
| `pnpm run prep:audio` | Tách file MP3 và tính dữ liệu năng lượng/onset JSON |
| `pnpm run align:lyrics` | Căn chỉnh lời qua ElevenLabs forced alignment hoặc STT (đọc `.env.local`) |
| `pnpm run gen:storyboard` | Sinh file storyboard và Remotion props JSON theo style pack |
| `pnpm run lint:storyboard` | Kiểm lỗi đồng bộ thời gian, độ dễ đọc và bố cục của storyboard |
| `pnpm run analyze:ref` | Tạo contact sheet và chỉ số biến đổi từng khung hình cho video tham khảo |
| `pnpm run qa:compare` | Chạy script so sánh khung hình QA |

## Cấu trúc thư mục

```text
.
├── .agents/skills/          # Bộ agent skills (tạo video, phân tích reference, quy tắc QA)
├── docs/                    # Tài liệu thiết kế chuyển động và motion spec của từng reference
├── public/audio/            # File âm thanh dùng trực tiếp trong Remotion compositions
├── references/              # Dữ liệu transcript/audio tham khảo cục bộ (video reference bị git-ignore)
├── scripts/                 # Công cụ xử lý audio, căn chỉnh lời, sinh storyboard, lint và QA
│   └── qa/                  # So sánh khung hình song song và thống kê chuyển động
└── src/
    ├── Root.tsx             # Khai báo toàn bộ Remotion compositions
    ├── compositions/        # Composition chính KineticMV
    ├── engine/              # CameraRig, StageViewport, easing, fonts, legibility, primitives/
    ├── storyboards/         # Storyboard TS dựng tay, file align đã duyệt, storyboard JSON sinh tự động
    └── styles/              # Định nghĩa 5 style pack
```

## Lưu ý về file cục bộ

- Toàn bộ video tham khảo trong `references/` (`*.mp4`, `*.mov`, `*.mkv`, `*.webm`), video xuất trong `out/` và file bí mật `.env.local` đều được loại trừ qua `.gitignore`.
- Hai storyboard dựng tay (`src/storyboards/hk1999-vn.ts` và `src/storyboards/hk1999-2.ts`) được viết thủ công theo motion spec trong `docs/blueprints/` và không bị ghi đè bởi `gen:storyboard`.
