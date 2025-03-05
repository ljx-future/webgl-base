function main() {
  const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
if (!ctx) {
  alert('当前浏览器不支持canvas,请升级最新版或者更换谷歌浏览器');
}
// 获取缩放倍率
const getPixelRatio = context => {
  return window.devicePixelRatio || 1;
};

const ratio = getPixelRatio();
// 保存原来的宽高
const oldWidth = canvas.width;
const oldHeight = canvas.height;

// canvas画布进行放大
canvas.width = canvas.width * ratio;
canvas.height = canvas.height * ratio;

// 在css里将宽高设置为原来的大小
canvas.style.width = oldWidth + 'px';
canvas.style.height = oldHeight + 'px';

// 考虑到内容的缩放，将ctx缩放
ctx.scale(ratio, ratio);
ctx.beginPath();
ctx.lineWidth = 2;
ctx.fillStyle = 'rgba(64,158,255,0.3)';
ctx.strokeStyle = 'rgba(64,158,255,0.8)';
const positionList = [
  {
    "left": 74,
    "width": 73,
    "top": 21,
    "height": 19
  },
  {
    "left": 148,
    "width": 73,
    "top": 21,
    "height": 19
  },
  {
    "left": 296,
    "width": 73,
    "top": 21,
    "height": 19
  }
]
positionList.forEach(item => {
  const { left, width, top, height } = item;
  ctx.moveTo(left, height);
  ctx.rect(left, top, width, height);
  // ctx.closePath();
});
ctx.fill();
ctx.stroke();
}
main();
