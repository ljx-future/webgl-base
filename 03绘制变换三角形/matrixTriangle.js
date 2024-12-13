import { initShaders } from "../initShaders.js";
import Matrix4 from "../Matrix4.js";
// 旋转三角形 -- 绕z轴进行旋转 -- 矩阵
/*
 * 注意 在 webgl中 矩阵为 列主序  根据公式计算需要 将行主序 转为 列主序
 * 转换方式为 沿左上到右下 为 对称轴 将对称位置的数据进行交换
 */
/*
* 平移矩阵
* 数据公式为行主序
* 数据公式：
* [1, 0, 0, dx,      [x
*  0, 1, 0, dy,  *    y
*  0, 0, 1, dz        z
*  0, 0, 0, 1 ]       1]
*/
/*
* 旋转矩阵
* 数据公式为行主序
* 数据公式：
* [cos, -sin,  0,  0,      [x
*  sin,  cos,  0,  0,  *    y
*    0,    0,  1,  0        z
*    0,    0,  0,  1 ]      1]
*/
/*
* 缩放矩阵
* 数据公式为行主序
* 数据公式：
* [sx,  0,  0,  0,      [x
*  0,  sy,  0,  0,  *    y
*  0,   0,  sz, 0        z
*  0,   0,  0,  1 ]      1]
*/

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
// 获取矩阵对应操作
const matrixActionFn = {
  translation: translationFn,
  rotate: rotateFn,
  scale: scaleFn,
}
// 修改值体验不同矩阵变换操作
const actionType = 'rotate'
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
// 三角形顶点
function initVertexBuffers(gl) {

  let vertices = new Float32Array([
    0.0, 0.5, -0.5, -0.5, 0.5, -0.5
  ])

  let n = vertices.length / 2 //顶点数量
  if (n < 0) {
    console.log('设置顶点位置错误')
    return
  }
  matrixActionFn[actionType](gl)

  // 三角形顶点数据传递
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position')
  if (a_Position < 0) {
    console.log("load faild Uniform")
    return
  }
  bindBuffer(gl, vertices, a_Position)

  gl.clearColor(0.0, 0.0, 0.0, 1.0)
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
// 平移操作
function translationFn(gl) {
  const dx = 0.5, dy = -0.5, dz = 0
  const matrix4 = new Matrix4()
  matrix4.setTranslate(dx, dy, dz)
  const u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix')
  if (!u_xformMatrix) {
    return
  }
  gl.uniformMatrix4fv(u_xformMatrix, false, matrix4.matrix)
}
// 旋转操作
function rotateFn(gl) {
  // 旋转角度
  const ANGLT = -90.0
  const matrix4 = new Matrix4()
  matrix4.setRotate(ANGLT,0,0,1)
  let u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix')
  if (!u_xformMatrix) {
    console.log("load faild Uniform")
    return
  }
  gl.uniformMatrix4fv(u_xformMatrix, false, matrix4.matrix)
}
function scaleFn(gl) {
  // 缩放倍数
  const sx = 2, sy = 2, sz = 1
  const matrix4 = new Matrix4()
  matrix4.setScale(sx, sy, sz)
  let u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix')
  if (!u_xformMatrix) {
    console.log("load faild Uniform")
    return
  }
  gl.uniformMatrix4fv(u_xformMatrix, false, matrix4.matrix)
}
main()