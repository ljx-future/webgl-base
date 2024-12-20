import { initShaders } from "../initShaders.js";

var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_TexCoord;
  varying vec2 v_TexCoord;
  void main() {
    gl_Position = a_Position;
    v_TexCoord = a_TexCoord;
  }
`
var FSHADER_SOURCE = `
  precision mediump float;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  varying vec2 v_TexCoord;
  void main() {
    vec4 color0 = texture2D(u_Sampler0, v_TexCoord);
    vec4 color1 = texture2D(u_Sampler1, v_TexCoord);
    gl_FragColor = color0 * color1;
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
    // 设置纹理
    if (!initTextures(gl, n)) {
      console.log('设置纹理错误')
      return
    }
  }
}
// 配置顶点位置
function initVertexBuffers(gl) {
  // 图形顶点位置
  let vertices = new Float32Array([
    // 顶点坐标  纹理坐标
    -0.5,0.5,0.0,1.0,
    -0.5,-0.5,0.0,0.0,
     0.5,0.5,1.0,1.0,
     0.5,-0.5,1.0,0.0,
  ])
   //顶点数量
  const n = vertices.length / 4;
  // 创建缓冲区对象
  bindBuffer(gl, vertices)
  return n
}
// 配置缓冲区
function bindBuffer(gl, vertices) {
  const BUFFER_SIZE = vertices.BYTES_PER_ELEMENT
  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('创建缓冲区失败')
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
  // 顶点坐标
  const a_Position = gl.getAttribLocation(gl.program, 'a_Position')
  if (a_Position < 0) {
    console.log('获取a_Position失败')
    return
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, BUFFER_SIZE * 4, 0)
  gl.enableVertexAttribArray(a_Position)
  // 纹理坐标
  const a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord')
  if (a_TexCoord < 0) {
    console.log('获取a_TexCoord失败')
    return
  }
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, BUFFER_SIZE * 4, BUFFER_SIZE * 2)
  gl.enableVertexAttribArray(a_TexCoord)
}
// 设置纹理
function initTextures(gl,n) {
  // 创建纹理对象
  const texture0 = gl.createTexture()
  const texture1 = gl.createTexture()
  if (!texture0 || !texture1) {
    console.log('创建纹理对象失败')
    return false
  }
  // 获取纹理的u_Sampler的存储位置
  const u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0')
  const u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1')
  if (!u_Sampler0 || !u_Sampler1) {
    console.log('获取u_Sampler失败')
    return false
  }
  // 创建图像对象
  const image0 = new Image()
  const image1= new Image()
  // 注册图像加载事件的响应函数
  image0.onload = function () {
    loadTexture(gl, n, texture0, u_Sampler0, image0,0)
  }
  image1.onload = function () {
    loadTexture(gl, n, texture1, u_Sampler1, image1,1)
  }
  image0.src = '../public/demo.png'
  image1.src = '../public/round.png'
  return true
}
let g_texUnit0 = false,g_texUnit1 = false;
function loadTexture(gl, n, texture, u_Sampler, image, index) {
  // 对纹理图形进行Y轴反转
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  console.log('绑定纹理...');
  // 开启0,1号纹理单元 gl.TEXTURE0 gl.TEXTURE1
  gl.activeTexture(gl[`TEXTURE${index}`])
  // 绑定纹理对象到纹理单元
  gl.bindTexture(gl.TEXTURE_2D, texture);
  console.log('纹理绑定状态:', gl.isTexture(texture));
  // 设置纹理对象参数
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  // 部分 WebGL 实现可能会限制非 2^n 图像的 MIRRORED_REPEAT 或 REPEAT 模式
  // 尝试将图片尺寸调整为 2 的幂次方，例如 256x256 或 512x512。如果无法调整图片，改用 CLAMP_TO_EDGE 模式
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // 设置纹理图像
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image)
  console.log('纹理图像尺寸:', image.width, image.height);
  // 将0号纹理传递给着色器
  gl.uniform1i(u_Sampler, index)
  console.log('传递纹理给着色器...');
  if (index == 1) {
    g_texUnit0 = true
  }else {
    g_texUnit1 = true
  }
  if (g_texUnit0 && g_texUnit1) {
    // 清空画布
    gl.clear(gl.COLOR_BUFFER_BIT)
    // 绘制矩形
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n)
    console.log('绘制完成');
  }

}
main()