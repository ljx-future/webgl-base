import { initShaders } from "../initShaders.js";
// 旋转三角形 -- 绕z轴进行旋转 -- 公式
/*
* 绕z轴进行旋转z坐标不变
* 公式推导
* 原坐标  x = rconsA; y = rsinA;
* 旋转后坐标   x` = rcons(A+B) ; y` = rsin(A+B);
* 结合带入替换:  x` = xconsB - ysinB;   y` = xsinB + yconsB   z`=z
*/
let VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_CosB,u_SinB;
  void main() {
    gl_Position.x = a_Position.x * u_CosB - a_Position.y * u_SinB;
    gl_Position.y = a_Position.x * u_SinB + a_Position.y * u_CosB;
    gl_Position.z = a_Position.z;
    gl_Position.w = 1.0;
  }
`
let FSHADER_SOURCE = `
  void main() {
    gl_FragColor = vec4(1.0,0.0,0.0,1.0);
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
  // 旋转角度
  const ANGLT = -90.0
  let vertices = new Float32Array([
    0.0,0.5,-0.5,-0.5,0.5,-0.5
  ])

  let n = vertices.length / 2 //顶点数量

  // 将旋转图形所需的数据传递给顶点着色器
  let radian = Math.PI * ANGLT  / 180.0  //转为弧度制
  const cosB = Math.cos(radian);
  const sinB = Math.sin(radian);
  let u_CosB = gl.getUniformLocation(gl.program, 'u_CosB')
  let u_SinB = gl.getUniformLocation(gl.program, 'u_SinB')
  if (!u_CosB || !u_SinB) {
    console.log("load faild Uniform")
    return
  }
  gl.uniform1f(u_CosB, cosB)
  gl.uniform1f(u_SinB, sinB)

  // 三角形顶点数据传递
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position')
  if (a_Position < 0) {
    console.log("load faild Uniform")
    return
  }
  bindBuffer(gl,vertices,a_Position)
  if (n<0) {
    console.log('设置顶点位置错误')
    return
  }
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)
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