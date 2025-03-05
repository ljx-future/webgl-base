import { initShaders } from "../initShaders.js";
let VSHADER_SOURCE = `
attribute vec4 a_Position;
void main() {
  gl_Position = a_Position;
  gl_PointSize = 10.0;
}
`;
let FSHADER_SOURCE =
  "precision mediump float;\n" +
  "uniform vec4 u_FragColor;\n" +
  "void main() {\n" +
  "  float dist = distance(gl_PointCoord,vec2(0.5,0.5));\n" +
  "  if(dist < 0.5) {\n" +
  "    gl_FragColor = u_FragColor;\n" +
  "  } else { discard; }\n" +
  "}"
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
    // 设置顶点位置
    let n = initVertexBuffers(gl)
    if (n < 0) {
      console.log('设置顶点位置错误')
      return
    }
    let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')
    if (!u_FragColor) {
      console.log('failed location')
      return
    }
    gl.uniform4fv(u_FragColor, [1.0, 0.0, 0.0, 1.0])

    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.POINTS, 0, n)
  }
}
function initVertexBuffers(gl) {
  let vertices = new Float32Array([
    0.0, 0.5, -0.5, -0.5, 0.5, -0.5
  ])
  let n = 3 //顶点数量
  // 创建缓冲区对象
  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('创建缓冲区对象失败');
    return -1;
  }
  // 将缓冲区对象绑定到目标
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  // 向缓冲区对象写入数据
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  let a_Position = gl.getAttribLocation(gl.program, 'a_Position')
  if (a_Position < 0) {
    console.log('failed location')
    return
  }

  // 将缓冲区对象分配至a_Position
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0)
  // 链接a_Position变量与 分配给它的缓冲区对象
  gl.enableVertexAttribArray(a_Position)
  return n;
}
main()