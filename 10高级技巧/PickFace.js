import {initShaders} from "../initShaders.js";
import Matrix4 from "../Matrix4.js";

var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform bool u_Clicked;\n' + // Mouse is pressed
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  if (u_Clicked) {\n' + //  Draw in red if mouse is pressed
    '    v_Color = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    '  } else {\n' +
    '    v_Color = a_Color;\n' +
    '  }\n' +
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
    let u_Clicked = gl.getUniformLocation(gl.program, 'u_Clicked');
    if (u_MvpMatrix < 0 || u_Clicked < 0) {
        console.log('Failed to get the storage location of u_MvpMatrix or u_Clicked');
        return;
    }

    const viewProjMatrix = new Matrix4()

    // 模型视图投影矩阵
    viewProjMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100)
    viewProjMatrix.lookAt(0, 0, 7, 0, 0, 0, 0, 1, 0)

    gl.uniform1f(u_Clicked, 0)

    canvas.onmousedown = function (ev) {
        let x = ev.clientX,y = ev.clientY;
        let rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            let x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
            let picked = check(gl, n, x_in_canvas, y_in_canvas, currentAngle, u_Clicked, viewProjMatrix, u_MvpMatrix)
            if (picked){
                console.log('The cube was selected! ')
            }

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
    // 索引
    let indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ])

    // 创建缓冲区对象
    if (!bindBuffer(gl, 3, vertices, 'a_Position')) {
        return -1
    }
    if (!bindBuffer(gl, 2, colors, 'a_Color')) {
        return -1
    }
    const indicesBuffer = gl.createBuffer();
    if (!indicesBuffer) {
        console.log('创建缓冲区失败')
        return false;
    }
    // 将顶点索引写入缓冲区
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return indices.length
}

// 配置缓冲区
function bindBuffer(gl, num, data, attribute) {
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
    gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, 0, 0)
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

function check(gl, n, x_in_canvas, y_in_canvas, currentAngle, u_Clicked, viewProjMatrix, u_MvpMatrix) {
    let picked = false;
    gl.uniform1f(u_Clicked,1)
    draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix)
    // Read pixel at the clicked position
    let pixels = new Uint8Array(4)
    gl.readPixels(x_in_canvas, y_in_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    // 如何选中像素颜色为rgba 中r为255 则为选中  因为设置的选中变色为 (255,0,255,255)
    if (pixels[0] === 255) {
        picked = true
    }
    gl.uniform1i(u_Clicked, 0);  // Pass false to u_Clicked(rewrite the cube)
    draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix); // Draw the cube
    return picked;
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