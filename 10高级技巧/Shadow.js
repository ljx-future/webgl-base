import { initShaders, createProgram } from "../initShaders.js";
import Matrix4 from "../Matrix4.js";

const SHADOW_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '}\n';

// Fragment shader program
const SHADOW_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);\n' +
  '}\n';

// Vertex shader program for regular drawing
const VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_MvpMatrixFromLight;\n' +
  'varying vec4 v_PositionFromLight;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_PositionFromLight = u_MvpMatrixFromLight * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program for regular drawing
const FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_ShadowMap;\n' +
  'varying vec4 v_PositionFromLight;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;\n' +
  '  vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);\n' +
  '  float depth = rgbaDepth.r;\n' + // Retrieve the z-value from R
  '  float visibility = (shadowCoord.z > depth + 0.005) ? 0.7 : 1.0;\n' +
  '  gl_FragColor = vec4(v_Color.rgb * visibility, v_Color.a);\n' +
  '}\n';

let OFFSCREEN_WIDTH = 2048, OFFSCREEN_HEIGHT = 2048;
let LIGHT_X = 0, LIGHT_Y = 7, LIGHT_Z = 2; // Position of the light source
function main() {
  const canvas = document.querySelector('#webgl');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    console.log('webgl supported');
    return;
  } else {
    // 初始化阴影着色器
    const shadowProgram = createProgram(gl, SHADOW_VSHADER_SOURCE, SHADOW_FSHADER_SOURCE);
    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
    shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
    if (shadowProgram.a_Position < 0 || !shadowProgram.u_MvpMatrix) {
      console.log('failed to get attrib location or uniform location');
      return;
    }
    // 初始化正向绘制着色器
    const program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    program.u_MvpMatrixFromLight = gl.getUniformLocation(program, 'u_MvpMatrixFromLight');
    program.u_ShadowMap = gl.getUniformLocation(program, 'u_ShadowMap');
    if (program.a_Position < 0 || program.a_Color < 0 || !program.u_MvpMatrix || !program.u_MvpMatrixFromLight || !program.u_ShadowMap) {
      console.log('failed to get attrib location or uniform location');
      return;
    }
    //  初始化三角形和平面
    let triangle = initVertexBuffersForTriangle(gl);
    let plane = initVertexBuffersForPlane(gl);
    console.log(triangle, plane);

    if (!triangle || !plane) {
      console.log('failed to initialize the buffer object')
      return;
    }
    // 初始化帧缓冲区
    let fbo = initFrameBufferObject(gl);
    if (!fbo) {
      console.log('failed to initialize the frame buffer object')
      return;
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);

    // 光源位置观察
    const viewProjMatrixFromLight = new Matrix4();
    viewProjMatrixFromLight.setPerspective(70.0, OFFSCREEN_WIDTH / OFFSCREEN_HEIGHT, 1.0, 100.0);
    viewProjMatrixFromLight.lookAt(LIGHT_X, LIGHT_Y, LIGHT_Z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    // 任意位置观察
    const viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(45, canvas.width / canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(0.0, 7.0, 9.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    let currentAngle = 0.0;
    let mvpMatrixFromLight_t = new Matrix4(); // A model view projection matrix from light source (for triangle)
    let mvpMatrixFromLight_p = new Matrix4(); // A model view projection matrix from light source (for plane)
    let tick = function () {
      currentAngle = animate(currentAngle);

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, OFFSCREEN_HEIGHT, OFFSCREEN_HEIGHT);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(shadowProgram);
      drawTriangle(gl, triangle, shadowProgram, currentAngle, viewProjMatrixFromLight);
      mvpMatrixFromLight_t.set(g_mvpMatrix);
      drawPanel(gl, plane, shadowProgram, viewProjMatrixFromLight);
      mvpMatrixFromLight_p.set(g_mvpMatrix);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniform1i(program.u_ShadowMap, 0);
      gl.uniformMatrix4fv(program.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.matrix);
      drawTriangle(gl, triangle, program, currentAngle, viewProjMatrix);
      gl.uniformMatrix4fv(program.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.matrix);
      drawPanel(gl, plane, program, viewProjMatrix);

      requestAnimationFrame(tick);
    }
    tick();

  }
}
// Coordinate transformation matrix
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();
function drawTriangle(gl, triangle, shadowProgram, currentAngle, viewProjMatrix) {
  g_modelMatrix.setRotate(currentAngle, 0, 1, 0);
  draw(gl, triangle, shadowProgram, viewProjMatrix);
}

function drawPanel(gl, plane, shadowProgram, viewProjMatrix) {
  g_modelMatrix.setRotate(-45, 1, 1, 1);
  // g_modelMatrix.rotate(-45, 0, 0, 1);
  draw(gl, plane, shadowProgram, viewProjMatrix);
}

function draw(gl, obj, program, viewProjMatrix) {
  initAttributeVariable(gl, program.a_Position, obj.verticesBuffer);
  if (program.a_Color) {
    initAttributeVariable(gl, program.a_Color, obj.colorsBuffer);
  }

  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.matrix);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indicesBuffer);
  gl.drawElements(gl.TRIANGLES, obj.numIndices, gl.UNSIGNED_BYTE, 0);
}
function initAttributeVariable(gl, a_attribute, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}
// Rotation angle (degrees/second)
var ANGLE_STEP = 30.0;
// Last time that this function was called
var g_last = Date.now();
function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}
function initVertexBuffersForTriangle(gl) {
  // Create a triangle
  //       v2
  //      / |
  //     /  |
  //    /   |
  //  v0----v1

  // Vertex coordinates
  let vertices = new Float32Array([-0.8, 3.5, 0.0, 0.8, 3.5, 0.0, 0.0, 3.5, 1.8]);
  // Colors
  let colors = new Float32Array([1.0, 0.5, 0.0, 1.0, 0.5, 0.0, 1.0, 0.0, 0.0]);
  // Indices of the vertices
  let indices = new Uint8Array([0, 1, 2]);
  let obj = new Object()
  obj.verticesBuffer = initBuffer(gl, vertices, 3, gl.FLOAT)
  obj.colorsBuffer = initBuffer(gl, colors, 3, gl.FLOAT)
  obj.indicesBuffer = initElementBuffer(gl, indices, gl.UNSIGNED_BYTE)
  if (!obj.verticesBuffer || !obj.colorsBuffer || !obj.indicesBuffer) {
    console.log('failed to initialize the buffer object')
    return null
  }
  obj.numIndices = indices.length

  // 解绑缓冲区对象
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
  return obj
}
function initVertexBuffersForPlane(gl) {
  // Create a plane
  //  v1------v0
  //  |        |
  //  |        |
  //  |        |
  //  v2------v3

  // Vertex coordinates
  let vertices = new Float32Array([
    3.0, -1.7, 2.5, -3.0, -1.7, 2.5, -3.0, -1.7, -2.5, 3.0, -1.7, -2.5    // v0-v1-v2-v3
  ]);

  // Colors
  let colors = new Float32Array([
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0
  ]);

  // Indices of the vertices
  let indices = new Uint8Array([0, 1, 2, 0, 2, 3]);
  let obj = new Object()
  obj.verticesBuffer = initBuffer(gl, vertices, 3, gl.FLOAT)
  obj.colorsBuffer = initBuffer(gl, colors, 3, gl.FLOAT)
  obj.indicesBuffer = initElementBuffer(gl, indices, gl.UNSIGNED_BYTE)
  if (!obj.verticesBuffer || !obj.colorsBuffer || !obj.indicesBuffer) {
    console.log('failed to initialize the buffer object')
    return null
  }
  obj.numIndices = indices.length

  // 解绑缓冲区对象
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
  return obj
}
function initBuffer(gl, data, num, type) {
  // 创建缓冲区对象
  let buffer = gl.createBuffer()
  if (!buffer) {
    console.log('failed to create buffer')
    return null
  }
  // 绑定缓冲区对象
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  // 将数据写入缓冲区
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

  num && (buffer.num = num)
  type && (buffer.type = type)
  return buffer
}
function initElementBuffer(gl, data, type) {
  // 创建缓冲区对象
  let buffer = gl.createBuffer()
  if (!buffer) {
    console.log('failed to create buffer')
    return null
  }
  // 绑定缓冲区对象
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
  // 将数据写入缓冲区
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW)

  buffer.type = type
  return buffer
}
function initFrameBufferObject(gl) {
  let framebuffer, texture, depthBuffer;
  let error = function () {
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    if (texture) gl.deleteTexture(texture);
    if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
    return null;
  }
  framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    console.log('failed to create framebuffer')
    return error();
  }
  texture = gl.createTexture();
  if (!texture) {
    console.log('failed to create texture')
    return error();
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  depthBuffer = gl.createRenderbuffer();
  if (!depthBuffer) {
    console.log('failed to create depth buffer')
    return error();
  }
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.log('failed to initialize the frame buffer object')
    return error();
  }
  framebuffer.texture = texture;

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  return framebuffer;
}
main();