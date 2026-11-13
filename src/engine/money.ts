export const COINS_PER_TAEL=1000;
export function toCoins(taels:number){if(!Number.isFinite(taels)||taels<0)throw new Error('Số tiền không hợp lệ.');return Math.round(taels*COINS_PER_TAEL);}
export function formatSilver(taels:number){return `${taels.toLocaleString('vi-VN',{maximumFractionDigits:3})} lượng bạc`;}
