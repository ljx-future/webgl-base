import { initShaders } from "../initShaders.js";
let VSHADER_SOURCE = `
  attribute vec4 a_Position;
  void main() {
    gl_Position = a_Position;
  }
`
let FSHADER_SOURCE = `
  precision mediump float;
  uniform float u_Width;
  uniform float u_Height;
  void main() {
    gl_FragColor = vec4(gl_FragCoord.x/u_Width,0.0,gl_FragCoord.y/u_Height,1.0);
  }
`
function main() {
  const canvas = document.getElementById('webgl')
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
    // 设置顶点位置-三角形顶点
    initVertexBuffers(gl)
  }
}
// 三角形顶点
function initVertexBuffers(gl) {
  let vertices = new Float32Array([
    0.0,0.5,-0.5,-0.5,0.5,-0.5
  ])
  let n = vertices.length / 2 //顶点数量
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position')
  if (a_Position < 0) {
    console.log('failed location')
    return
  }
  bindBuffer(gl,vertices,a_Position)
  if (n<0) {
    console.log('设置顶点位置错误')
    return
  }
  let u_Width = gl.getUniformLocation(gl.program, 'u_Width')
  let u_Height = gl.getUniformLocation(gl.program, 'u_Height')
  if (!u_Width || !u_Height) {
    console.log('failed location u_Width or u_Height')
    return
  }
  gl.uniform1f(u_Width, gl.drawingBufferWidth)
  gl.uniform1f(u_Height, gl.drawingBufferHeight)

  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  // gl.drawArrays(gl.TRIANGLES, 0, n)
  // gl.drawArrays(gl.LINES, 0, n)
  // gl.drawArrays(gl.LINE_STRIP, 0, n)
  gl.drawArrays(gl.TRIANGLES, 0, n)
}
// 创建并使用缓冲区对象
function bindBuffer(gl,vertices,a_Position) {
   // 1、创建缓冲区对象
   let vertexBuffer = gl.createBuffer();
   if(!vertexBuffer){
     console.log('创建缓冲区对象失败');
     return -1;
   }
  // 2、将缓冲区对象绑定到目标
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  // 3、向缓冲区对象写入数据
  gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW)

  // 4、将缓冲区对象分配至a_Position
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0)
  // 5、链接a_Position变量与 分配给它的缓冲区对象
  gl.enableVertexAttribArray(a_Position)
}
main()