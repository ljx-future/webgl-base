import { initShaders } from "../initShaders.js";

// varying变量
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  varying vec4 v_Color;

  void main() {
    gl_Position = a_Position;
    gl_PointSize = 10.0;
    v_Color = a_Color;
  }
`
const FSHADER_SOURCE = `
  precision mediump float;
  varying vec4 v_Color;
  void main() {
    gl_FragColor = v_Color;
  }
`

function main() {
  const canvas = document.getElementById('webgl')
  const gl = canvas.getContext('webgl');
  if (!gl) {
    console.log('webgl supported');
    return;
  } else {
    // 初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('failed')
      return
    }
    // 设置顶点位置-三角形顶点
    initVertexBuffers(gl)
  }
}
// 绘制图形
function initVertexBuffers(gl) {
  // 图形顶点位置
  let vertices = new Float32Array([
    0.0, 0.3, 1.0,0.0,0.0,
    -0.3, -0.3, 0.0,1.0,0.0,
     0.3, -0.3, 0.0,0.0,1.0
  ])

  let n = vertices.length / 5 //顶点数量
  if (n < 0) {
    console.log('设置顶点位置错误')
    return
  }

  // 三角形顶点数据传递
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position')
  if (a_Position < 0) {
    console.log("load faild a_Position")
    return
  }
  let a_Color = gl.getAttribLocation(gl.program,'a_Color')
  if (a_Color < 0) {
    console.log("load faild a_Color")
    return
  }
  bindBuffer(gl, vertices, a_Position,a_Color)

  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLES, 0, n)
}

// 创建并使用缓冲区对象
function bindBuffer(gl, vertices, a_Position,a_Color) {

  const SIZE = vertices.BYTES_PER_ELEMENT
  // 1、创建缓冲区对象
  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('创建缓冲区对象失败');
    return -1;
  }
  // 2、将缓冲区对象绑定到目标
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  // 3、向缓冲区对象写入数据
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  // 4、将缓冲区对象分配至a_Position
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, SIZE * 5, 0)
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, SIZE * 5, SIZE * 2)
  // 5、链接a_Position变量与 分配给它的缓冲区对象
  gl.enableVertexAttribArray(a_Position)
  gl.enableVertexAttribArray(a_Color)
}

main()