import {initShaders} from "../initShaders.js";
import Matrix4 from "../Matrix4.js";

var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute float a_Face;\n' +   // Surface number (Cannot use int for attribute variable)
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform int u_PickedFace;\n' + // Surface number of selected face
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  int face = int(a_Face);\n' + // Convert to int
    '  vec3 color = (face == u_PickedFace) ? vec3(1.0) : a_Color.rgb;\n' +
    '  if(u_PickedFace == 0) {\n' + // if 0, set face number to v_Color
    '    v_Color = vec4(color, a_Face/255.0);\n' +
    '  } else {\n' +
    '    v_Color = vec4(color, a_Color.a);\n' +
    '  };\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

const ANGLE_STEP = 20.0; // Rotation angle (degrees/second)
function main() {
    const canvas = document.getElementById('webgl');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }
    // 设置顶点位置正方形
    const n = initVertexBuffers(gl)
    if (n < 0) {
        console.log('设置顶点位置错误')
        return
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.enable(gl.DEPTH_TEST);

    // 获取映射的变量
    let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    let u_PickedFace = gl.getUniformLocation(gl.program, 'u_PickedFace');
    if (u_MvpMatrix < 0 || u_PickedFace < 0) {
        console.log('Failed to get the storage location of u_MvpMatrix or u_PickedFace');
        return;
    }

    const viewProjMatrix = new Matrix4()
    // 模型视图投影矩阵
    viewProjMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100)
    viewProjMatrix.lookAt(0, 0, 7, 0, 0, 0, 0, 1, 0)

    gl.uniform1i(u_PickedFace, -1)
    canvas.onmousedown = function (ev) {
        let x = ev.clientX, y = ev.clientY;
        let rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            let x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
            checkFace(gl, n, x_in_canvas, y_in_canvas, currentAngle, u_PickedFace, viewProjMatrix, u_MvpMatrix)

        }
    }
    let currentAngle = 0.0
    let tick = function () {   // Start drawing
        currentAngle = animate(currentAngle);
        draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix);
        requestAnimationFrame(tick);
    };
    tick();
}

// 配置顶点位置
function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    // 坐标
    let vertices = new Float32Array([
        // 正方体的顶点坐标
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,  // v0-v3-v4-v5 right
        1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,  // v1-v6-v7-v2 left
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,  // v7-v4-v3-v2 down
        1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0   // v4-v7-v6-v5 back
    ])
    let colors = new Float32Array([
        0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
        0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
        1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
        1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
        1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
        0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0   // v4-v7-v6-v5 back
    ])
    // 六个面
    let faces = new Uint8Array([   // Faces
        1, 1, 1, 1,     // v0-v1-v2-v3 front
        2, 2, 2, 2,     // v0-v3-v4-v5 right
        3, 3, 3, 3,     // v0-v5-v6-v1 up
        4, 4, 4, 4,     // v1-v6-v7-v2 left
        5, 5, 5, 5,     // v7-v4-v3-v2 down
        6, 6, 6, 6,     // v4-v7-v6-v5 back
    ]);
    // 索引
    let indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ])
    const indicesBuffer = gl.createBuffer();
    if (!indicesBuffer) {
        console.log('创建缓冲区失败')
        return false;
    }
    // 创建缓冲区对象
    if (!bindBuffer(gl, vertices, gl.FLOAT, 3, 'a_Position')) {
        return -1
    }
    if (!bindBuffer(gl, colors, gl.FLOAT, 3, 'a_Color')) {
        return -1
    }
    if (!bindBuffer(gl, faces, gl.UNSIGNED_BYTE, 1, 'a_Face')) {
        return -1
    }

    // gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // 将顶点索引写入缓冲区
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return indices.length
}

// 配置缓冲区
function bindBuffer(gl, data, type, num, attribute) {
    // 创建缓冲区
    const attributeBuffer = gl.createBuffer();
    if (!attributeBuffer) {
        console.log('创建缓冲区失败')
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    // 顶点坐标
    const a_attribute = gl.getAttribLocation(gl.program, attribute)
    if (a_attribute < 0) {
        console.log('获取a_Position失败：', attribute)
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0)
    gl.enableVertexAttribArray(a_attribute)
    return true
}

let last = Date.now();

// 自动旋转角度
function animate(angle) {
    let now = Date.now();   // Calculate the elapsed time
    let elapsed = now - last;
    last = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    let newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle % 360;
}

function checkFace(gl, n, x_in_canvas, y_in_canvas, currentAngle, u_PickedFace, viewProjMatrix, u_MvpMatrix) {
    // Read pixel at the clicked position
    gl.uniform1i(u_PickedFace, 0)
    draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix); // Draw the cube
    let pixels = new Uint8Array(4)
    gl.readPixels(x_in_canvas, y_in_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    gl.uniform1i(u_PickedFace, pixels[3]); // Pass the surface number to u_PickedFace
    draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix);
}

const mvpMatrix = new Matrix4()

function draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix) {
    mvpMatrix.set(viewProjMatrix)
    mvpMatrix.rotate(currentAngle, 1, 0, 0)
    mvpMatrix.rotate(currentAngle, 0, 1, 0)
    mvpMatrix.rotate(currentAngle, 0, 0, 1)
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.matrix)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0)
}

main()