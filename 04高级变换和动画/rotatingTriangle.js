import { initShaders } from "../initShaders.js";
import Matrix4 from "../Matrix4.js";

const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_xformMatrix;
  void main() {
    gl_Position = u_xformMatrix * a_Position;
  }
`
const FSHADER_SOURCE = `
  void main() {
    gl_FragColor = vec4(1.0,0.0,0.0,1.0);
  }
`
const ANGLE_STEP = 45.0

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
    0.0, 0.3, -0.3, -0.3, 0.3, -0.3
  ])

  let n = vertices.length / 2 //顶点数量
  if (n < 0) {
    console.log('设置顶点位置错误')
    return
  }

  // 三角形顶点数据传递
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position')
  if (a_Position < 0) {
    console.log("load faild Uniform")
    return
  }
  bindBuffer(gl, vertices, a_Position)

  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  // 复杂变换
  matirxAction(gl,n)
}
// 矩阵变换操作
function matirxAction(gl,n) {
  const u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix')
  if (!u_xformMatrix) {
    return
  }
  let currentAngle = 0.0
  const matrix4 = new Matrix4()
  const tick = function() {
    // 更新旋转角
    currentAngle = animate(currentAngle)
    draw(gl,n,currentAngle,matrix4,u_xformMatrix)
    requestAnimationFrame(tick)
  }
  tick()
}
// 更新角度
let g_last = Date.now()
function animate(angle) {
  let now = Date.now()
  let elapsed = now - g_last
  g_last = now
  let newAngle = angle + ( ANGLE_STEP + elapsed ) / 1000.0;
  return newAngle %= 360
}
// 绘制
function draw(gl,n,currentAngle,matrix4,u_xformMatrix) {
  matrix4.setRotate(currentAngle,0,0,1)
  matrix4.translate(0.35,0,0)
  gl.uniformMatrix4fv(u_xformMatrix, false, matrix4.matrix)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLES, 0, n)
}
// 创建并使用缓冲区对象
function bindBuffer(gl, vertices, a_Position) {
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
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0)
  // 5、链接a_Position变量与 分配给它的缓冲区对象
  gl.enableVertexAttribArray(a_Position)
}

main()