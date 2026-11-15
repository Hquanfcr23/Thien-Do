import {useId,useState,useRef,useEffect} from 'react';
import {createPortal} from 'react-dom';

export const definitions:Record<string,string>={
 'Ứng viên':'Nhân vật có thể được cân nhắc bổ nhiệm vào chức vụ. Nhiều ứng viên hơn cho bạn thêm lựa chọn nhân sự.',
 'Thi hành':'Hệ số thể hiện hiệu quả thực thi thuế của Phủ. Thuế thực thu còn phụ thuộc chính sách, kiểm soát, ổn định và chi hành chính.',
 'Thi công':'Tốc độ thực hiện công việc tại công trường; cần có đủ lao động và vật tư để tiếp tục xây dựng.',
 'Chính thống':'Mức công nhận quyền cai trị của triều đại; có tác động đến ổn định các Huyện.',
 'Sĩ khí':'Tinh thần của đơn vị quân; có thể thay đổi theo tình trạng tiếp tế và việc kiểm tra hậu cần.',
 'Năng lực đảm nhiệm':'Điểm tổng hợp theo thuộc tính và trọng số của chức vụ, quyết định hiệu quả của một số công việc được giao.',
 'Quản trị':'Năng lực điều hành công việc, được dùng trong thi hành địa phương và nhiều chức vụ trung ương.',
 'Tài chính':'Năng lực quản lý tài chính; ảnh hưởng thi hành của Phủ, một số chức vụ và khả năng điều tra.',
 'Giao tiếp':'Khả năng phối hợp công vụ; ảnh hưởng hệ số thi hành của Phủ và quan hệ khi hợp tác.',
 'Uy tín':'Danh tiếng của nhân vật; ảnh hưởng điểm phù hợp của các chức trung ương và phản ứng của phe.',
 'Trung thành':'Mức trung thành của nhân vật; được dùng tính năng lực Thủ phụ và thi hành của Tri phủ.',
 'Liêm chính':'Mức trong sạch, bằng 100 trừ tham nhũng; ảnh hưởng điểm phù hợp của nhiều chức trung ương và mức chiếm dụng.',
 'Tham vọng':'Mức mong muốn quyền lực của nhân vật; ảnh hưởng kỳ vọng và ủng hộ của phe.',
 'Sức khỏe':'Tình trạng sức khỏe của nhân vật; ảnh hưởng thi hành địa phương và khả năng giữ chức.',
 'Tin cậy':'Mức tin tưởng có hướng từ một nhân vật đối với người khác; quan hệ ngược lại có thể khác.',
 'Ổn định':'Mức ổn định tại địa phương, ảnh hưởng việc thu thuế. Cấp trên hiển thị bình quân theo dân số các Huyện.',
 'Kiểm soát':'Mức kiểm soát tại địa phương, ảnh hưởng việc thu thuế. Cấp trên hiển thị bình quân theo dân số các Huyện.',
 'Dân số':'Số dân trong địa bàn; cấp trên tổng hợp từ các Huyện trực thuộc.',
 'Ngân khố':'Bạc công có thể dùng cho các khoản chi và điều chuyển theo quy định ngân sách.',
 'Kho lương công':'Lương thực thuộc Nhà nước, có thể dành cho dự trữ, cứu trợ hoặc điều chuyển.',
 'Chi hành chính':'Phần ngân sách hành chính thực trả sau chiếm dụng so với định mức tháng; không đại diện cho toàn bộ đời sống địa phương.',
 'Mức chứng cứ':'Mức chứng cứ được ghi trong hồ sơ giám sát; không phải xác suất người bị giám sát có tội.',
 'Khả năng phát hiện':'Xác suất phát hiện khi có tài sản chiếm dụng thuộc hồ sơ; kết quả còn phụ thuộc người điều tra và hình thức giám sát.',
 'Nguy cơ nghi oan':'Xác suất phát sinh nghi vấn sai khi không có tài sản chiếm dụng thuộc hồ sơ.',
 'Thuế danh nghĩa':'Giá trị thuế tính theo chính sách trước khi xét khả năng thu thực tế. Thuế đất trên 20% làm giảm tỷ lệ có thể thu; phần chưa thu vẫn thuộc về dân.',
 'Thuế đã nộp':'Thuế đã thu từ dân; hàng có thể còn vận chuyển và chưa chuyển thành bạc trong ngân khố.',
 'Giá tham chiếu':'Giá hiện hành dùng làm cơ sở giao dịch tại sàn Phủ; giá tại Huyện còn xét vận tải.',
 'Công suất tuyến':'Lượng hàng tối đa tuyến có thể vận chuyển trong kỳ, tính bằng tải chuẩn.',
 'Khẩu phần':'Lượng lương thực dân được cung cấp so với nhu cầu; thiếu khẩu phần ảnh hưởng đời sống và dân số.',
 'Bảo trì':'Chi phí duy trì công trình theo thời gian; thiếu nguồn lực có thể làm giảm tình trạng công trình.',
 'Tình trạng':'Mức nguyên vẹn của công trình hoặc tuyến, ảnh hưởng hiệu quả sử dụng.',
 'Dự trữ công':'Lương thực Nhà nước giữ trong kho để sử dụng về sau, gồm cứu trợ và điều phối.',
 'Quỹ vận hành':'Phần ngân sách được giữ lại để đáp ứng chi phí công và các giới hạn an toàn.',
 'Thuế đất':'Tỷ lệ thuế áp dụng lên sản xuất tại địa phương. Trên 20%, mỗi điểm % tăng thêm làm khả năng thu giảm 1,25 điểm %, tối thiểu còn 25% thuế danh nghĩa; kiểm soát, ổn định và bảo vệ khẩu phần có thể giảm số thu tiếp.',
 'Thuế thương mại':'Tỷ lệ thuế áp dụng cho hoạt động giao thương theo chính sách hiệu lực.',
 'Lệnh mua':'Nhu cầu mua có xét điều kiện và nguồn lực; không đồng nghĩa giao dịch đã hoàn tất.',
 'Lệnh bán':'Hàng đang được chào bán; chỉ thu được bạc khi có người mua trả.',
 'Hàng đang về':'Hàng đang trên đường đến sàn hoặc công trình; chưa thể sử dụng tại nơi nhận.',
 'Tiếp tế':'Tình trạng cung cấp nhu cầu cho đơn vị quân; thiếu tiếp tế có thể làm giảm sĩ khí.'
};
export function Metric({name,children}:{name:string;children?:React.ReactNode}){
 const id=useId(),ref=useRef<HTMLSpanElement>(null),[open,setOpen]=useState(false),[pos,setPos]=useState({left:0,top:0});
 useEffect(()=>{if(!open)return;const move=()=>{const r=ref.current?.getBoundingClientRect();if(r)setPos({left:Math.max(8,Math.min(window.innerWidth-328,r.left)),top:Math.min(r.bottom+8,Math.max(8,window.innerHeight-190))});};move();window.addEventListener('scroll',move,true);window.addEventListener('resize',move);return()=>{window.removeEventListener('scroll',move,true);window.removeEventListener('resize',move);};},[open]);
 return <><span ref={ref} className="metric-help" tabIndex={0} aria-describedby={open?id:undefined} onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)} onClick={e=>{e.stopPropagation();setOpen(true)}} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);e.stopPropagation()}else if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();setOpen(true)}}}>{children??name}</span>{open&&createPortal(<span role="tooltip" id={id} className="metric-tooltip" style={{left:pos.left,top:pos.top}}><strong>{name}</strong><span>{definitions[name]}</span></span>,document.body)}</>;
}
