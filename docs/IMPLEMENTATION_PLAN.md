# Kế hoạch triển khai Đế Nghiệp

## Trạng thái hiện tại
Map Quality Rework: xem MAP_QUALITY_REWORK.md và MAP_QUALITY_RESULTS.json cho geometry union từ Huyện, nhãn theo zoom, camera, kiểm tra topology và nghiệm thu hình ảnh. Bounds trong save vẫn giữ tương thích, không còn là hình dạng lãnh thổ được render.
Phase 2 được người dùng cho phép và đã triển khai: 3 Châu/7 Phủ/10 Quận/24 Huyện, SVG liên kết GameState, cây/aggregation, lưu schema v2 và migration v1. Quy ước tiền tệ cập nhật: lượng bạc, 1 lượng = 1000 đồng. Xem PHASE_2_REPORT.md cho kiểm thử và giới hạn địa đồ Fictional. UI prototype giữ nguyên phong cách; mobile hoãn Phase 1–3. Không triển khai Phase 3 khi chưa được cho phép.

## Kiểm tra ban đầu và nguồn
Ngày 12/11/2026: workspace trống, chưa có Git checkout hay project. GitHub Hquanfcr23/Thien-Do có size 0 và `git ls-remote` không trả refs. Không có code cũ cần di trú. Bản DOCX người dùng cung cấp được sao chép nguyên bản vào docs; đã đọc nội dung toàn bộ 16 mục và phụ lục A/B bằng OOXML. DESIGN_SOURCE.txt giữ thứ tự đoạn/bảng để tra cứu, không thay thế DOCX. Không xác minh lại các nguồn lịch sử phụ lục vì Phase 1 chỉ dùng dữ liệu Fictional.

## Phân tích thiết kế và quyết định
Đây là grand strategy kết hợp dynasty simulation: sản xuất cần đất/lao động/vật tư; vận tải giới hạn khả năng phân phối; thuế thực thu phụ thuộc thi hành; chính trị và quân sự tác động ngược về lao động, an ninh và ngân sách. Không thay liên kết này bằng chỉ số tăng giảm độc lập. Giảm số thực thể để kiểm soát scope, không bỏ các cơ chế đã chốt.

Sandbox là chế độ duy nhất. Thế giới trong nước quản lý chi tiết, bên ngoài ở cấp chiến lược. Bản đồ gameplay từ 3–5 Châu với phân bố Phủ/Quận/Huyện không đồng đều. Tên cấp, chức quan và quyền hạn qua profile theo thời đại. Dữ liệu chính thức cần phân loại nguồn; các tên Hổ Báo Kỵ, quân Đường/Tống và cơ quan Minh là ví dụ theo thời đại, không phải danh mục cùng tồn tại. Cẩm Y Vệ/Đông Xưởng không mặc định là binh chủng dã chiến.

React + TypeScript + Vite đảm nhiệm static app; Zustand giữ phiên đang chơi. Zod là nguồn type và validator tại ranh giới dữ liệu. Engine dùng module TypeScript thuần và selectors; không event bus, ECS, worker hay backend ở Foundation. IndexedDB qua idb giữ nhiều slot và transaction; save envelope có schemaVersion/campaignVersion/timestamp. Vitest kiểm tra domain và persistence bằng fake-indexeddb; test giả lập không thay thế smoke test trình duyệt.

Luồng: UI → store/action → engine → state mới + log → store → render; persistence nhận snapshot đã validate. UI state (ô lưu, busy, thông báo) riêng với GameState. Sau này command queue phải lưu cùng state; chỉ commit kết quả tick một lần, rồi autosave. Không lưu state trung gian nếu tick lỗi. Simulation time tách wall clock.

## Data model cốt lõi
| Model | Foundation | Mở rộng theo phase |
|---|---|---|
| GameState | campaign/version, seed, calendar, country, dynasty, units, characters, armies, flags, history | markets, routes, buildings, populations, factions, externalPolities, orders, delayed effects |
| Calendar | năm, tháng 1–12, hàm mùa/đổi năm | tốc độ 1/2/4, pause, báo cáo năm |
| Country | ID, ngân khố quan, kho lương thạch, năng lực hành chính 0–100 | chính sách, ngân sách, thuế danh nghĩa/thực thu |
| AdministrativeProfile/Unit | cấp tùy cấu hình, parentId, governorId, locationId, treasury/stability/development, population/resources cấp cơ sở | quyền hạn, truyền lệnh, đổi địa giới có lịch sử |
| Character/Dynasty | năng lực, sức khỏe, tuổi, trung thành, tham vọng, tham nhũng, uy tín, provenance; emperor/heir, chính thống, luật kế vị | gia phả, bảo trợ, đào tạo, quan hệ, khủng hoảng |
| MilitaryUnit | category, roles, binh chủng thành phần/quân số, chỉ huy, supply, upkeep, history/honors/predecessors, provenance | MilitaryProfile danh mục tên và tuyển quân; hành quân/chiến dịch |
| Provenance | 4 loại theo phụ lục A; attested cần nguồn và thời kỳ | kiểm tra profile/thời đại khi nhập campaign |
| Save | envelope version 1 + timestamp + validated state | migration vN → vN+1, autosave sau tick, quản lý metadata |

Chưa thêm container rỗng vào GameState cho hệ thống chưa triển khai. Khi thực hiện phase liên quan, bổ sung schema có nghĩa và migration. Các hợp đồng dự kiến:
- PopulationCohort tại Huyện: dân số, hộ thuế, lao động theo nghề; ba interest groups nông dân/sĩ tộc/thương-thợ; quân nhân/quan chức là vai trò nghề, tránh trùng đầu người.
- GoodsDefinition, CropProfile, ProductionRecipe, Market: đơn vị đo, lịch gieo/thu theo vùng, đầu vào/đầu ra, demand/inventory/price, tax rules. Ghi sổ money/goods để kiểm tra bảo toàn.
- TransportRoute/Shipment: endpoints, road/river/canal/ferry, capacity/tháng, cost, travelTime, loss, security, weather, transit cargo. Không teleport hàng; capacity chia sẻ dân sự/quân sự.
- BuildingDefinition/Instance: nông nghiệp, thủy lợi, thương nghiệp, sản xuất, phòng thủ, giao thông; chi phí, lao dịch, tiến độ, bảo trì, điều kiện và tác động năng lực/rủi ro.
- Faction/Office/SpecialOrganization: thành viên, ảnh hưởng, quan hệ, ngân sách/quyền hạn; hoạn quan và tổ chức giám sát tùy profile.
- ExternalPolity: lãnh thổ khái quát, thủ lĩnh, sức mạnh/ổn định/thống nhất, quan hệ/lợi ích, state machine.
- EventDefinition/ActiveEvent: trigger, choices, requirements/costs, immediate/delayed effects, cooldown/uniqueness, lịch sử quyết định.

## Phụ thuộc và pipeline
Đồ thị chính: địa lý + mùa vụ + dân cư → sản xuất → tồn kho/thị trường → thuế/ngân khố → công trình/hành chính/quân sự. Giao thông → phân phối/giá/tiếp tế/truyền lệnh. Thiếu lương → tử vong/di cư/bất mãn → lao động/thực thu. Quan lại/phe → thi hành/tham nhũng → ngân sách/chính thống. Quân sự → an ninh/chiến tranh → tuyến/ruộng/lao động. Kế vị → trung thành/quyền chỉ huy → ổn định. Ngoại giao → thương mại/đe dọa → an ninh/chi phí. Sự kiện đọc các trạng thái và tạo tác động có thời hạn.

Thứ tự tick theo brief §5.2: (1) chốt lệnh, (2) kinh tế sản xuất/tiêu dùng/thuế/lương/giá/tồn kho, (3) logistics, (4) dân số, (5) hành chính, (6) quân sự, (7) chính trị/kế vị, (8) ngoại giao, (9) sự kiện, (10) log/báo cáo/state save. Kinh tế dùng năng lực thi hành và nhân lực đầu tháng; hành chính/dân số mới ảnh hưởng kỳ kế tiếp. Hàng đến trong logistics sẵn sàng cho quân sự cùng tháng, cho kinh tế tháng sau. Quân lương ghi khoản chi một lần ở kinh tế; quân sự chỉ tiêu hao/tạo nhu cầu, không trừ ngân khố lần nữa. Mỗi quyết định timing cần test hồi quy. Đánh dấu date của kỳ đang xử lý rõ ràng trước đổi tháng; tháng 12 phát báo cáo năm rồi chuyển năm.

## Roadmap và nghiệm thu từng phase
| Phase | Milestone chạy được | Test và tiêu chí nghiệm thu |
|---|---|---|
| 1 Foundation | scaffold strict, schema/types, module calendar/selectors, fictional seed, UI tạo hồ sơ, 3 ô thủ công + autosave trước reset, import/export JSON | typecheck/lint/test/build; calendar biên mùa/đổi năm; reject corrupt/future save; IndexedDB roundtrip; browser tạo/lưu/tải/reload; README |
| 2 Map & Admin | SVG hai lớp, tọa độ chung, 3–5 Châu không chia đều, đầy đủ cây, pan/zoom/hover/select/layers, panel, biên giới | ID/parent/rank không chu trình; aggregate không trùng; chọn các cấp và đổi layer, viewport nhỏ, dữ liệu vùng biên |
| 3 Calendar & Economy | command queue, monthly pipeline, pause/1×/2×/4×, crop theo vùng, production/consumption/market/tax/grain, báo cáo năm | cùng seed/lệnh → cùng state; không mutate; bảo toàn hàng/tiền; thu hoạch khác tháng; thiếu nguyên liệu; thực thu khác danh nghĩa; 12 tick/đổi năm |
| 4 Logistics & Infrastructure | graph road/river, shipment có thời gian/capacity/cost/loss, công trình đủ các nhóm, bottleneck | tắc tuyến/đường cắt, hàng transit không mất/trùng, capacity không vượt, công trình thiếu vốn/lao động/bảo trì |
| 5 Population & Court | ba lợi ích, sinh/tử/di cư, chức quan/phe, bổ nhiệm/thanh tra, hoạn quan/cơ quan tùy profile | conservation dân số có nguồn biến động, hạn chế lao động, tham nhũng ảnh hưởng thu thực tế, xung đột phe có nguyên nhân |
| 6 Dynasty & Military | gia phả/heir/đào tạo/chuyển ngôi; profile lực lượng, named armies, tuyển/huấn luyện/tiếp tế/hành quân/chiến đấu/vây/rút | không trùng quân số/chi phí, cung ứng cắt gây hệ quả, địa hình/chỉ huy có báo cáo; tên không quyết định sức mạnh; kế vị đổi quyền lực |
| 7 Diplomacy & Events | ngoại thế lực rule-based, thương mại/triều cống/hôn nhân/liên minh/chiến tranh, choices/delayed/cooldown, nhật ký | FSM deterministic, chi phí hợp lệ, hệ quả kéo dài qua save, sự kiện không lặp vô hạn, auto-pause quan trọng |
| 8 Sandbox Polish | cân bằng, tutorial nhẹ, performance, save migration/recovery, static deploy | chơi 10 năm, save/load không mất state, stress 3–5 Châu, core loop không lỗi, hoàn thành mọi tiêu chí MVP §16.3 |

Mỗi phase chia PR/milestone nhỏ theo data → engine → test → UI → browser verification. Không thực hiện Phase 2 khi bàn giao Foundation.

## Rủi ro và việc cần chốt ở phase thích hợp
- Công thức năng suất/giá/thuế và đơn vị đo chi tiết chưa được brief định lượng: cần cấu hình, phân tích nhạy cảm và fixture, không tự nhận là công thức lịch sử.
- IndexedDB có thể bị trình duyệt xóa/hạn chế quota; UI báo lỗi và hỗ trợ JSON backup. Không có cloud backup. File import tối đa 10 MB ở Foundation.
- Chưa có schema cũ nên migration Foundation chỉ là version gate, không giả lập migration vô nghĩa.
- UI prototype hiện đã được người dùng chấp nhận: Main Menu và màn hình trị vì có địa đồ tham chiếu; không phải lãnh thổ mô phỏng hay nghiệm thu Phase 2. Dừng đầu tư UI/đồ họa và chờ phép trước Phase 2. Hoãn responsive mobile trong Phase 1–3 theo chỉ thị mới.
- Performance đo sau khi có dataset thực; chỉ thêm worker nếu profiling chỉ ra cần thiết.


## Cập nhật Phase 2 — geographic rebuild
Người dùng đã cho phép Phase 2 và yêu cầu thay hình học giả lập bằng GIS thực. Xem [báo cáo GIS](REAL_GIS_REPORT.md), [nguồn dữ liệu](GIS_SOURCES.json), [kết quả browser](REAL_GIS_RESULTS.json). Các ghi chú chờ phép Phase 2 ở trên là trạng thái Foundation cũ; không còn áp dụng. Phase 3 vẫn chưa được phép.
