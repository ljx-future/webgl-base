import {initShaders} from '../initShaders.js'
let VSHADER_SOURCE = `
  attribute vec4 a_Position;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = 10.0;
  }
`
let FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`
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
    let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')
    if (!u_FragColor) {
      console.log('failed location')
      return
    }

    canvas.onmousedown = function (ev) {
      click(ev,gl,canvas,a_Position,u_FragColor)
    }
    // 清空canvas颜色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 清空canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
}
var g_points = [] // 存储点的位置
var g_colors = [] // 存储点的颜色
function click(ev,gl,canvas,a_Position,u_FragColor) {
  // 鼠标 坐标
  let x = ev.clientX;
  let y = ev.clientY;
  let rect = ev.target.getBoundingClientRect();

  // 转canvas坐标 相对于canvas原点坐标
  let canvansXY = {x:0,y:0}
  canvansXY.x = x - rect.left;
  canvansXY.y = y - rect.top;
  // 相对于canvas中心点坐标
  let center = {x:0,y:0}
  center.x = canvansXY.x - canvas.width/2
  center.y = canvas.height/2 - canvansXY.y
  // webgl坐标系为[-1,1] 所以 除以canvas.width/2、canvas.height/2 进行缩小
  x = center.x / (canvas.width/2)
  y = center.y / (canvas.height/2)
  g_points.push([x,y])
  if (x >= 0.0 && y>=0.0) { //第一象限
    g_colors.push([1.0,0.0,0.0,1.0])
  }else if(x < 0.0 && y<0.0){ //第三象限
    g_colors.push([1.0,0.7,0.8,1.0])
  }else { //第三四象限
    g_colors.push([1.0,1,0.0,1.0])
  }

  // 清空canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
  let len = g_points.length
  for(let i = 0;i<len;i++) {
    let xy = g_points[i]
    let raga = g_colors[i]

    // 传递给webgl变量
    gl.vertexAttrib3f(a_Position, xy[0],xy[1],0.0)
    gl.uniform4fv(u_FragColor, raga)
    // gl.uniform4f(u_FragColor, raga[0],raga[1],raga[2],raga[3],)
    gl.drawArrays(gl.POINTS, 0, 1)
  }
}
main()