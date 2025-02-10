// 顶点着色器程序
// 包含位置、颜色、视图矩阵和投影矩阵
import {initShaders} from "../initShaders.js";
import Matrix4 from "../Matrix4.js";

const VSHADER_SOURCE = `
    attribute vec4 a_Position;    // 顶点位置
    attribute vec4 a_Color;       // 顶点颜色
    uniform mat4 u_ViewMatrix;    // 视图矩阵
    uniform mat4 u_ProjectMatrix; // 投影矩阵
    varying vec4 v_Color;         // 传递给片元着色器的颜色
    void main() {
        // 顶点坐标计算：投影矩阵 * 视图矩阵 * 顶点位置
        gl_Position = u_ProjectMatrix * u_ViewMatrix * a_Position;
        v_Color = a_Color;
    }
`

// 片元着色器程序
const FSHADER_SOURCE = `
  precision mediump float;      // 设置精度
  varying vec4 v_Color;        // 接收顶点着色器传递的颜色
  void main() {
    gl_FragColor = v_Color;    // 设置片元颜色
  }
  `

function main() {
  const canvas = document.getElementById('webgl');
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
    // 设置顶点位置正方形
    const n = initVertexBuffers(gl)
    if (n < 0) {
      console.log('设置顶点位置错误')
      return
    }
    // 视图矩阵
    const u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix')
    if (!u_ViewMatrix) {
      console.log('获取u_ViewMatrix失败')
      return
    }
    // 透视投影矩阵
    const u_ProjectMatrix = gl.getUniformLocation(gl.program, 'u_ProjectMatrix')
    if (!u_ProjectMatrix) {
      console.log('获取u_ProjectMatrix失败')
      return
    }
    const viewMatrix = new Matrix4()
    const projectMatrix = new Matrix4()
    viewMatrix.setLookAt(0,0,5,    // 视点位置(eyeX, eyeY, eyeZ)
                        0,0,-100,   // 观察目标点(atX, atY, atZ)
                        0,1,0)      // 上方向(upX, upY, upZ)
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.matrix)
    projectMatrix.setPerspective(30,                    // 视角30度
                                 canvas.width/canvas.height, // 宽高比
                                 1,                       // 近裁剪面
                                 100)                     // 远裁剪面
    gl.uniformMatrix4fv(u_ProjectMatrix, false, projectMatrix.matrix)
    draw(gl, n)
  }
}
function draw(gl, n) {
  // 设置背景色
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // 设置清除颜色为黑色
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, n);
}
// 配置顶点位置
function initVertexBuffers(gl) {
  // 图形顶点位置
  let vertices = new Float32Array([
    //右侧的3个三角形
    0.75,1.0,-4.0,  0.4,1.0,0.4, // 绿色三角在最后面
    0.25,-1.0,-4.0, 0.4,1.0,0.4,
    1.25,-1.0,-4.0, 1.0,0.4,0.4,
    0.75,1.0,-2.0,  1.0,1.0,0.4, // 黄色三角在中间
    0.25,-1.0,-2.0, 1.0,1.0,0.4,
    1.25,-1.0,-2.0, 1.0,0.4,0.4,
    0.75,1.0,0.0, 0.4,0.4,1.0,   // 蓝色三角在最前面
    0.25,-1.0,0.0,  0.4,0.4,1.0,
    1.25,-1.0,0.0,  1.0,0.4,0.4,

    //左侧的3个三角形
    -0.75,1.0,-4.0,  0.4,1.0,0.4,//绿色三角形在最后面
    -1.25,-1.0,-4.0,  0.4,1.0,0.4,
    -0.25,-1.0,-4.0,  1.0,0.4,0.4,
    -0.75,1.0,-2.0,  1.0,1.0,0.4,//黄色三角形在中间
    -1.25,-1.0,-2.0,  1.0,1.0,0.4,
    -0.25,-1.0,-2.0,  1.0,0.4,0.4,
    -0.75,1.0,0.0,  0.4,0.4,1.0,//蓝色三角形在最前面
    -1.25,-1.0,0.0,  0.4,0.4,1.0,
    -0.25,-1.0,0.0,  1.0,0.4,0.4,
  ])
  //顶点数量
  const n = 18;
  // 创建缓冲区对象
  bindBuffer(gl, vertices)
  return n

}

// 配置缓冲区
function bindBuffer(gl, vertices) {
  const BUFFER_SIZE = vertices.BYTES_PER_ELEMENT

  // 创建并绑定缓冲区
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  // 配置顶点位置属性
  const a_Position = gl.getAttribLocation(gl.program, 'a_Position')
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, BUFFER_SIZE * 6, 0)
  gl.enableVertexAttribArray(a_Position)

  // 配置顶点颜色属性
  const a_Color = gl.getAttribLocation(gl.program, 'a_Color')
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, BUFFER_SIZE * 6, BUFFER_SIZE * 3)
  gl.enableVertexAttribArray(a_Color)
}

main()
