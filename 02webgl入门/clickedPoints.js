import {initShaders} from '../initShaders.js'
var VSHADER_SOURCE = `
attribute vec4 a_Position;
void main() {
  gl_Position = a_Position;
  gl_PointSize = 10.0;
}
`
var FSHADER_SOURCE = `void main() {
  gl_FragColor = vec4(1.0,0.0,0.0,1.0);
}`
function main() {
  const canvas = document.getElementById('content')
  const gl = canvas.getContext('webgl');
  if(!gl){
    console.log('webgl supported');
    return;
  }else{
    // 初始化着色器
    if(!initShaders(gl,VSHADER_SOURCE,FSHADER_SOURCE)){
      console.log('failed')
      return
    }
    let a_Position = gl.getAttribLocation(gl.program, 'a_Position')
    if (a_Position < 0) {
      console.log('failed location')
      return
    }

    canvas.onmousedown = function (event) {
      click(event,gl,canvas,a_Position)
    }
      // 清空canvas颜色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 清空canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
}
var g_points = [] // 存储点的位置

function click(event,gl,canvas,a_Position) {
  let x = event.clientX;
  let y = event.clientY;
  let rect = event.target.getBoundingClientRect();
  x = ((x - rect.left) - canvas.height/2) / (canvas.height/2)
  y = (canvas.width/2 - (y - rect.top))/(canvas.width/2)
  g_points.push(x);
  g_points.push(y);
  // 清空canvas颜色
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // 清空canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
  let len = g_points.length;
  for(let i = 0;i < len; i+=2){
    gl.vertexAttrib3f(a_Position, g_points[i], g_points[i+1], 0.0);
    // 绘制
    gl.drawArrays(gl.POINTS, 0, 1)
  }
}

main()