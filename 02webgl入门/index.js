// 顶点着色器
var VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute float a_PointSize;
void main() {
  gl_Position = a_Position;
  gl_PointSize = a_PointSize;
}`
var FSHADER_SOURCE = `void main() {
  gl_FragColor = vec4(1.0,0.0,0.0,1.0);
}`
function initShaders(gl,VSHADER_SOURCE,FSHADER_SOURCE) {
  const program = createProgram(gl,VSHADER_SOURCE,FSHADER_SOURCE)
  if (!program) {
    return false
  }
  gl.program = program
  gl.useProgram(program)
  return true
}
function createProgram(gl,VSHADER_SOURCE,FSHADER_SOURCE) {
  const vertexShader = loadShader(gl,gl.VERTEX_SHADER,VSHADER_SOURCE)
  const fragmentShader = loadShader(gl,gl.FRAGMENT_SHADER,FSHADER_SOURCE)
  if(!vertexShader || !fragmentShader){
    return null;
  }
  // 创建程序对象
  const program = gl.createProgram()
  if(!program){
    return null;
  }
  // 将程序对象分配顶点着色器和片元着色器
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  // 链接着色器
  gl.linkProgram(program);
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (!linked) {
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader)
    gl.deleteShader(vertexShader)
    return null;
  }
  return program
}
function loadShader(gl,type,source) {
  const shader = gl.createShader(type);
  if(shader === null) {
    console.log('failed loadShader')
    return null;
  }
  // 设置着色器的源代码
  gl.shaderSource(shader,source)
  //  编辑着色器
  gl.compileShader(shader)
  // 检查是否编译成功
  var compiled = gl.getShaderParameter(shader,gl.COMPILE_STATUS);
  if(!compiled) {
    const error = gl.getShaderInfoLog(shader)
    console.log('failed compiled：'+error)
    gl.deleteShader(shader)
    return null;
  }
  return shader
}
function main() {
  const canvas = document.getElementById('content');
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
    let a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize')
    if (a_Position < 0) {
      console.log('failed location')
      return
    }

    gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0)
    gl.vertexAttrib1f(a_PointSize, 10.0)

    // 清空canvas颜色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 清空canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 绘制
    gl.drawArrays(gl.POINTS, 0, 1)
  }
}
main()