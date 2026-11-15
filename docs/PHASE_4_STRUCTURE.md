# Đế Nghiệp — cấu trúc Phase 4 (bản thảo thiết kế)

**Trạng thái:** Đặc tả giao việc đang hoàn thiện. Các quyết định ghi “ĐÃ CHỐT” là yêu cầu bắt buộc; mục “CHƯA CHỐT” không được tự suy diễn thành quyết định gameplay. **Việc gửi lại file này không tự cấp quyền sửa code**: chỉ triển khai khi lời nhắn kèm theo yêu cầu thực thi Phase 4. Nếu được giao triển khai, đọc AGENTS.md và kiểm tra code hiện hành trước khi sửa; tra cứu brief khi cần đối chiếu. Yêu cầu trực tiếp mới hơn của người dùng được ưu tiên.

## Cách dùng tài liệu khi giao lại cho agent

1. Đọc toàn bộ file này và AGENTS.md. Đối chiếu với code thực tế, tra cứu brief khi cần; không giả định roadmap cũ vẫn đúng.
2. Lập bảng đối chiếu **yêu cầu → dữ liệu → bước engine → UI → test**. Thực hiện tuần tự milestone 4.1–4.6; không triển khai phase sau.
3. Giữ invariant Phase 1–3, ID hành chính, bảo toàn tiền/hàng, 24 lượt điều hành và 12 lần quyết toán kinh tế mỗi năm. Thay schema phải có migration và fixture save cũ.
4. Với điểm CHƯA CHỐT ảnh hưởng trực tiếp đến luật chơi, trình bày phương án cụ thể để người dùng quyết định trước khi code phần đó. Có thể tiếp tục những phần độc lập đã chốt.
5. Sau mỗi milestone chạy kiểm thử theo AGENTS.md, tự sửa lỗi, báo cáo phần hoàn thành/chưa hoàn thành. Không tự commit, push hoặc tuyên bố Phase 4 hoàn thành khi chưa đạt tiêu chí.

## 1. Bối cảnh và mục tiêu

Roadmap cũ đặt vận tải và hạ tầng ở Phase 4, nhưng yêu cầu trực tiếp đã chuyển các hệ thống đó vào Phase 3. Đề xuất hiện tại: Phase 4 tập trung **Triều đình và quản trị lãnh thổ**, bám Game Design Brief v1.1 mục 9. Hệ thống phải tạo quyết định về con người và quyền lực có hậu quả kiểm chứng được trên nền kinh tế, hành chính và ổn định hiện có.

Vòng chơi dự kiến: **bổ nhiệm → thi hành tại Châu/Phủ → thu, chi và ổn định thay đổi → phe phái phản ứng → giám sát hoặc điều chuyển**. Mỗi thay đổi cần được giải thích trong báo cáo; không cộng trừ chỉ số tùy ý.

## 2. Những nền tảng cần giữ

- Trung ương → Châu → Phủ → Huyện. Châu ban chính sách; Phủ giữ ngân khố, kho lương công và sàn giao dịch; Huyện là nơi dân cư và sản xuất.
- 24 lượt điều hành/năm, hai lượt mỗi tháng; chỉ 12 kỳ quyết toán kinh tế. Lệnh chính trị cần có thời điểm xử lý xác định, không tính tác dụng hai lần.
- Bạc và hàng hóa phải bảo toàn theo sổ hiện hành. Tham nhũng là chuyển tài sản sang một chủ thể có ghi nhận hoặc thất thoát có nguồn đích rõ ràng; không tự xóa bạc/hàng.
- Engine deterministic, độc lập React; dữ liệu save cũ phải có migration, không tạo thêm tài sản hay đổi ID hành chính.
- Phân biệt nội dung lịch sử có chứng cứ, lấy cảm hứng lịch sử và giả tưởng. Cơ quan đặc biệt chỉ xuất hiện theo campaign phù hợp, không mặc định ghép tên nhiều thời đại.

## 3. Các milestone đề xuất

| Mốc | Nội dung | Kết quả người chơi thấy |
| --- | --- | --- |
| 4.1 Chức vụ và nhân vật | Người chơi bổ nhiệm Châu/Phủ; quan Huyện tượng trưng; bộ thông số có tác dụng theo chức vụ. | Một người có vị trí, phạm vi trách nhiệm và lịch sử công vụ rõ ràng. |
| 4.2 Cai trị và xây tự chủ | Hiệu quả thi hành; quan Phủ tự lựa chọn công trình theo ưu tiên, nhu cầu và nguồn lực thật. | Chính sách Châu/Phủ định hướng rõ việc xây; người chơi thấy lý do xây hoặc trì hoãn. |
| 4.3 Quan hệ nhân vật | Loại quan hệ, tin cậy không đối xứng, ký ức có nguyên nhân và ảnh hưởng công vụ. | Hợp tác/đối đầu có lịch sử và hậu quả, không phải điểm trang trí. |
| 4.4 Phe phái | Lõi thành viên, lợi ích, người dẫn dắt, ảnh hưởng và phản ứng; profile thời đại mở rộng sau. | Phe có mục tiêu và công cụ cụ thể mà chưa làm triều đình quá tải. |
| 4.5 Giám sát | Thanh tra, điều tra, cảnh cáo, xét xử và xử lý thất thoát; chi phí, thời gian, chứng cứ, nguy cơ oan sai. | Người chơi cân nhắc giữa kiểm soát tham nhũng và rủi ro chính trị. |
| 4.6 Tích hợp | UI Triều đình, xây dựng theo chính sách, báo cáo; save/migration, cân bằng và QA. | Có thể điều hành nhiều Phủ qua nhiều năm mà không phải thao tác nhân sự ở mọi Huyện. |

Mỗi milestone chỉ chuyển sang mốc sau khi dữ liệu, engine, kiểm thử và UI liên quan đã chạy được; không thêm nút hay tổ chức chỉ để trang trí.

## 4. Ranh giới cơ chế dự kiến

**Nhân vật được bổ nhiệm:** Giữ ID ổn định, tuổi, sức khỏe, năng lực quản trị, năng lực tài chính, năng lực giao tiếp, trung thành, tham vọng, liêm chính, uy tín, quan hệ và phe. Mỗi thông số phải ảnh hưởng ít nhất một quyết định, một hậu quả quan sát được và một phép kiểm thử; bỏ hoặc gộp thông số không đạt điều này. Năng lực quân sự/mưu lược chỉ hiện khi vai trò thực sự sử dụng. Tách khả năng cá nhân khỏi quyền hạn chức vụ; một người không giữ nhiều chức toàn thời gian không tương thích.

**Chức vụ:** Người chơi bổ nhiệm và điều chuyển quan Châu, quan Phủ. Chức vụ gắn vào một đơn vị/cơ quan, quyết định phạm vi, ngân sách được giám sát và loại quyết định có thể thi hành. Việc chuyển giao cần có độ trễ. Quan Huyện chỉ là đại diện bộ máy địa phương: được tạo deterministically từ seed và lưu một lần với ID, tên, tuổi/vòng đời tối thiểu; khi mất hoặc mãn nhiệm mới thay. Không có bộ chỉ số chính trị và không là cấp bổ nhiệm trực tiếp. Hiệu quả Huyện đến từ điều kiện địa phương và quan Phủ chủ quản.

**Hiệu quả:** Quan chức ảnh hưởng tỷ lệ thực hiện của các dòng đã tồn tại; không tạo thuế, lương hay hàng từ hư không. Mọi thất thoát, thu hồi, ban thưởng và chi phí thanh tra phải đi qua sổ tài chính phù hợp.

**Phe phái:** Lõi gồm thành viên, người dẫn dắt, nguồn ảnh hưởng, lợi ích, địa bàn, hành động và điều kiện phản ứng; không chỉ là điểm thiện cảm. Khởi đầu 2–3 mạng quyền lực phù hợp Ninh triều giả tưởng. Tham khảo Hán/Đường/Tống/Minh qua profile riêng; không ghép tổ chức và tên gọi nhiều thời đại thành một mặc định.

**Giám sát:** Kết quả phụ thuộc bằng chứng và năng lực điều tra. Có thể không phát hiện sai phạm hoặc kết luận sai; báo cáo phải phân biệt nghi vấn và kết luận.

## 5. Quyền xây dựng và chính sách đã chốt

Quan Phủ là chủ thể tự đánh giá và xếp công trình tại Phủ cùng các Huyện trực thuộc. Quan Châu định hướng và điều phối, không giữ kho hay ngân khố mới. Người chơi **chỉ đặt ưu tiên**, không xếp công trình trực tiếp. Mức ưu tiên cao nhất gần như một chỉ thị bắt buộc: quan phải khởi công loại công trình đó sớm nhất khi điều kiện phù hợp. Nó không vượt qua thiếu bạc, vật tư, lao động, tuyến vận tải/công suất, giới hạn cấp, dự án trùng, dự trữ tối thiểu hoặc nguy cơ thiệt hại nghiêm trọng cho địa bàn. Nếu trì hoãn, báo cáo phải nêu điều kiện chặn và thời điểm có thể xét lại; không được âm thầm bỏ lệnh.

Các mức ưu tiên dự kiến từ **cấm**, **thấp**, **bình thường**, **cao**, đến **chỉ thị trọng tâm**. Người chơi có thể đặt chỉ thị trọng tâm cho bất kỳ loại công trình hợp lệ ở Châu hoặc Phủ, không có hạn mức tùy tiện về số địa bàn được định hướng; giới hạn chỉ đến từ nguồn lực, công suất và an toàn thực tế. Mức ưu tiên là thứ tự xét dự án, không phải thưởng sản lượng hay tạo tài nguyên. Nhu cầu được suy từ thiếu lương, đất/nước, công suất kho, sản xuất, tuyến đường, tình trạng công trình, ngân sách, giá vật tư và lao động. Quan chọn hữu hạn dự án mỗi kỳ, tính bảo trì và dự trữ trước khi mở công trình mới; dùng seed chỉ để phá hòa giữa phương án ngang nhau. Không chạy vòng lặp mua/xây vô hạn. Người chơi có thể thay ưu tiên hoặc cấm một loại đầu tư để ngăn tổn thất; không có nút ra lệnh xây trực tiếp.

Chính sách Châu là **mặc định cho các Phủ trực thuộc**. Mỗi Phủ có thể kế thừa hoặc dùng chính sách riêng. Khi các Phủ không còn cùng một cấu hình hiệu lực, UI Châu hiển thị **Tùy chỉnh**; đó là trạng thái suy ra, không phải chính sách thứ ba. Cần phân biệt giá trị Châu, giá trị ghi đè của Phủ và giá trị đang có hiệu lực. Đổi chính sách Châu chỉ cập nhật các Phủ đang kế thừa; không xóa cấu hình riêng của Phủ. Chính sách kinh tế Phase 3 hiện có phải được chuyển sang mô hình này mà không mất quyết định hoặc save cũ.

## 6. Quan hệ nhân vật đã chốt

Quan hệ là mạng có ID hai nhân vật, loại quan hệ (thân tộc, thầy trò, đồng liêu, bảo trợ, đối thủ, ân oán), độ tin cậy **có hướng** và ký ức sự kiện quan trọng. A tin B không suy ra B tin A. Bổ nhiệm, tiến cử, hợp tác, bãi nhiệm, điều tra, cứu giúp hoặc làm tổn hại lợi ích có thể tạo ký ức và đổi quan hệ. Biến động lớn cần nguyên nhân; ký ức thường có thể phai dần, thân tộc và ân oán lớn tồn tại lâu hơn. Quan hệ tác động hợp tác công vụ, ủng hộ bổ nhiệm, tiếp nhận chỉ thị, che giấu sai phạm hoặc cung cấp tin tức, nhưng không thay thế năng lực cá nhân.

**Thông tin hiển thị:** người chơi được thấy toàn bộ quan hệ và thông số thật ngay từ đầu. Điều tra vẫn cần thiết để xử lý hành vi hoặc chứng minh sai phạm, không dùng để mở khóa dữ liệu nhân vật. UI phải nêu vì sao hai người hợp tác/đối đầu, tránh chỉ vẽ mạng dây nối.

## 7. Giao diện dự kiến

Tab **Triều đình** là trung tâm ra quyết định: tổng quan việc cần xử lý, danh sách chức vụ, hồ sơ nhân vật, phe phái và giám sát. Bảng hành chính Châu/Phủ dẫn tới quan phụ trách. Báo cáo tháng cho biết thay đổi nào đến từ chính sách, kinh tế hay quản trị. UI giữ phong cách hiện tại, ưu tiên khả năng đọc và quản lý nhanh nhiều địa bàn.

## 8. Kiểm thử và nghiệm thu dự kiến

- Bổ nhiệm/điều chuyển đúng chức và đúng địa bàn; không trùng chức vụ hay nhân vật.
- Cùng seed và lệnh cho cùng kết quả; hai lượt điều hành không xử lý tác dụng chính trị hoặc kinh tế hai lần.
- Quan cai quản ảnh hưởng dòng thu/chi, thi hành và ổn định qua nguyên nhân có thể truy vết; bạc/hàng vẫn bảo toàn.
- Ưu tiên xây cấp Châu truyền đúng xuống Phủ kế thừa; Phủ ghi đè độc lập và Châu hiển thị Tùy chỉnh đúng. Chỉ thị trọng tâm dẫn tới dự án khi đủ điều kiện; thiếu điều kiện hoặc rủi ro nghiêm trọng phải trì hoãn có lý do. Không vượt ngân sách, vật tư, công suất, lao động hay giới hạn dự án.
- Quan Huyện được tạo một lần theo seed, tên/ID ổn định qua save/load, thay thế khi kết thúc vòng đời; không phát sinh bộ chỉ số quan lại đầy đủ.
- Quan hệ không đối xứng, ký ức có nguyên nhân, hậu quả công vụ và lưu/tải ổn định; người chơi xem được toàn bộ thông tin.
- Phe phản ứng theo điều kiện thực, có cả lợi ích và bất lợi; tránh một lựa chọn luôn thắng.
- Giám sát dùng ngân sách/thời gian thật; kết quả và hậu quả tồn tại qua save/load.
- Migration giữ nguyên game Phase 1–3; UI được kiểm tra bằng Playwright tại các thao tác mới. Bộ 9 chiến lược Phase 3 chỉ chạy khi có yêu cầu kiểm thử chiến lược.

## 9. Vấn đề còn cần thảo luận

1. **Số nhân vật và phe khởi đầu:** đủ tạo lựa chọn thực, không tăng nhân sự chỉ để lấp danh sách.
2. **Quyền lực địa phương:** ngoài giới hạn vật lý và nguy cơ thiệt hại nghiêm trọng, quan có thể cố tình làm sai hoặc chống chỉ thị trọng tâm đến mức nào?
3. **Ngưỡng thiệt hại nghiêm trọng:** tiêu chuẩn định lượng và ưu tiên giữa sống còn, bảo trì, dự trữ và công trình mới.
4. **Tham nhũng và tài sản tư:** nơi ghi nhận bạc/hàng bị chiếm dụng, khả năng thu hồi và hậu quả ngân sách.
5. **Giám sát:** mức tin cậy của chứng cứ, hình phạt và hậu quả oan sai. Thông số/quan hệ nhân vật đã công khai, không dùng điều tra để mở khóa chúng.
6. **Hoàng tộc, hoạn quan và cơ quan đặc biệt:** cơ chế nào thuộc Phase 4, cơ chế nào để giai đoạn kế vị/quân sự; phụ thuộc profile thời đại.
7. **Tốc độ biến động:** tần suất quan hệ, phe và tham nhũng thay đổi để 24 lượt điều hành có ý nghĩa mà không gây quá tải thao tác.

## 10. Nguồn tham khảo thiết kế

- Game Design Brief v1.1, mục 9–10: nguồn yêu cầu chính thức. Yêu cầu trực tiếp mới của người dùng quyết định các điểm đã chốt phía trên.
- [Victoria 3 — Dev Diary #53: Characters](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-53-characters): vai trò làm thay đổi tác dụng đặc điểm và uy tín.
- [Victoria 3 — Dev Diary #57](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-57-the-journey-so-far): tách lợi ích nhóm và người lãnh đạo/phong trào.
- [RTK8 Remake — Officer Abilities](https://www.koeitecmoamerica.com/manual/rtk8-remake/en/3300.html) và [Relationship Chart and Trust](https://www.koeitecmoamerica.com/manual/rtk8-remake/en/3500.html): năng lực gắn nhiệm vụ và quan hệ tạo tác dụng. Đây là tham chiếu từ RTK8 Remake, không gán quy tắc chi tiết cho RTK11 khi chưa xác minh nguồn chính thức.
- [Crusader Kings III — giới thiệu chính thức](https://www.paradoxinteractive.com/media/press-releases/paradox-interactive/an-heir-is-born-crusader-kings-iii-announced): nhân vật, gia tộc, hội đồng và xung đột quyền lực làm nguồn cảm hứng; không sao chép quan hệ chư hầu châu Âu. 

## 11. Ngoài phạm vi bản thảo Phase 4

Kế vị hoàn chỉnh, đảo chính, nội chiến, quân đội và chiến tranh đầy đủ, ngoại giao sâu. Các hệ thống này cần nền quyền lực và quân sự đủ vững ở các phase tiếp theo. Không triển khai Phase 4 chỉ từ tài liệu này; người dùng sẽ duyệt và chỉnh thiết kế trước.

## 12. Hợp đồng triển khai và bàn giao khi được phép code

| Hệ thống | Dữ liệu tối thiểu | Bước xử lý và bất biến | Kiểm chứng bắt buộc |
| --- | --- | --- | --- |
| Quan chức/chức vụ | ID nhân vật, chức vụ, địa bàn, nhiệm kỳ, năng lực có tác dụng; quan Huyện tối giản | Một chức toàn thời gian/người; hiệu ứng chỉ trong phạm vi chức vụ; thay quan không nhân đôi hiệu ứng | Bổ nhiệm, chuyển giao, mất chức, save/load |
| Chính sách Châu/Phủ | Mặc định Châu, ghi đè Phủ, giá trị hiệu lực | Châu đổi không ghi đè Phủ đã tùy chỉnh; “Tùy chỉnh” chỉ là nhãn suy ra | Kế thừa, ghi đè, đổi lại, migration chính sách cũ |
| Xây tự chủ | Ưu tiên từng loại công trình, nhu cầu, dự án, lý do trì hoãn | Chỉ xét một lần mỗi tháng; ưu tiên cao phải được xét trước; không vượt bạc/hàng/lao động/công suất/dự trữ; không xếp trùng | Đủ điều kiện thì xây, thiếu thì chờ có lý do, nhiều Phủ/seed, bảo toàn |
| Quan hệ/phe | Cặp nhân vật có hướng, loại quan hệ, ký ức, thành viên và lợi ích phe | Quan hệ đổi bởi nguyên nhân; không tạo quan hệ mọi cặp nếu không tương tác; thông tin hiển thị đầy đủ | Bất đối xứng, ký ức, ảnh hưởng công vụ, save/load, hiệu năng |
| Cai trị/giám sát | Dòng thu chi đã có, bằng chứng, lệnh giám sát và kết quả | Không tạo bạc/hàng; thất thoát và thu hồi có bút toán; một kết quả không áp dụng hai lần | Bảo toàn, định tuyến ngân sách, quyết toán hai lượt, báo cáo nguyên nhân |

**Thứ tự trong monthly tick cần chốt bằng test:** nhận lệnh → cập nhật bổ nhiệm/chính sách có hiệu lực → quan Phủ xét dự án tự chủ trước bước xây dựng → kinh tế và vận tải theo pipeline hiện hành → cập nhật quan hệ/phe và báo cáo. Nếu thứ tự thực tế của engine đòi vị trí khác, ghi rõ lý do và kiểm chứng không dùng dữ liệu tương lai hoặc xử lý hai lần. Hai lượt điều hành chỉ là hai cửa sổ ra lệnh; không chạy hai monthly tick.

**Định nghĩa hoàn thành:** người chơi có thể đặt ưu tiên Châu hoặc Phủ, thấy quan Phủ khởi công hay trì hoãn có lý do, quan được bổ nhiệm tạo hiệu quả cai trị có thể truy vết, quan hệ và phe gây hậu quả thực, giám sát có chi phí và kết quả, save cũ mở đúng, các test liên quan và Playwright đạt. Báo cáo cuối liệt kê công thức/đơn vị/đánh đổi đã dùng, kết quả QA, giới hạn và quyết định thiết kế còn mở. Không tạo UI hoặc chỉ số chưa nối với GameState và engine.
