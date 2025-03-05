import {initShaders} from "../initShaders.js";
import Matrix4 from "../Matrix4.js";

var VSHADER_SOURCE =
'attribute vec4 a_Position;\n' +
'attribute vec4 a_Color;\n' +
'uniform mat4 u_MvpMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'varying float v_Dist;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '  v_Dist = gl_Position.w;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE = '#ifdef GL_ES\n' + 'precision mediump float;\n' + '#endif\n' + 'uniform vec3 u_FogColor;\n' + 'uniform vec2 u_FogDist;\n' + 'varying vec4 v_Color;\n' + 'varying float v_Dist;\n' + 'void main() {\n' + '  float fogFactor = clamp((u_FogDist.y - v_Dist) / (u_FogDist.y - u_FogDist.x), 0.0, 1.0);\n' + '  vec3 color = mix(u_FogColor, vec3(v_Color), fogFactor);\n' + '  gl_FragColor = vec4(color, v_Color.a);\n' + '}\n';

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


    // 雾气的颜色
    let fogColor = new Float32Array([0.137, 0.231, 0.423])
    // 物化的起点和终点  与 视点的距离 [起点距离，重点距离]
    let fogDist = new Float32Array([55, 80])
    // 视点在世界坐标系下的坐标
    let eye = new Float32Array([25, 35, 35, 1.0])


    // 获取映射的变量
    let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    let u_FogColor = gl.getUniformLocation(gl.program, 'u_FogColor');
    let u_FogDist = gl.getUniformLocation(gl.program, 'u_FogDist');
    if (!u_MvpMatrix || !u_FogColor || !u_FogDist) {
        console.log('Failed');
        return;
    }

    gl.uniform3fv(u_FogColor, fogColor)
    gl.uniform2fv(u_FogDist, fogDist)


    gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1.0)
    gl.enable(gl.DEPTH_TEST);


    const mvpMatrix = new Matrix4()
    const modelMatrix = new Matrix4()

    modelMatrix.setScale(8, 8, 8);
    mvpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 1000)
    mvpMatrix.lookAt(eye[0], eye[1], eye[2], 0, 2, 0, 0, 1, 0)
    mvpMatrix.multiply(modelMatrix)
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.matrix)
    document.onkeydown = function(ev){ keydown(ev, gl, n, u_FogDist, fogDist); };
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0)

    const modelViewMatrix = new Matrix4();
    modelViewMatrix.setLookAt(eye[0], eye[1], eye[2], 0, 2, 0, 0, 1, 0);
    modelViewMatrix.multiply(modelMatrix);
    modelViewMatrix.multiplyVector4([1, 1, 1, 1]);
    mvpMatrix.multiplyVector4([1, 1, 1, 1]);
    modelViewMatrix.multiplyVector4([-1, 1, 1, 1]);
    mvpMatrix.multiplyVector4([-1, 1, 1, 1]);

}
function keydown(ev, gl, n, u_FogDist, fogDist) {
    switch (ev.keyCode) {
        case 38: // Up arrow key -> Increase the maximum distance of fog
            fogDist[1]  += 1;
            break;
        case 40: // Down arrow key -> Decrease the maximum distance of fog
            if (fogDist[1] > fogDist[0]) fogDist[1] -= 1;
            break;
        default: return;
    }
    gl.uniform2fv(u_FogDist, fogDist);   // Pass the distance of fog
    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Draw
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
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
    let vertices = new Float32Array([// 正方体的顶点坐标
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,  // v0-v3-v4-v5 right
        1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,  // v1-v6-v7-v2 left
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,  // v7-v4-v3-v2 down
        1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0   // v4-v7-v6-v5 back
    ])
    let colors = new Float32Array([0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
        0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
        1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4, 1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
        1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
        1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
        0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0, 0.4, 1.0, 1.0   // v4-v7-v6-v5 back
    ])
    // 索引
    let indices = new Uint8Array([0, 1, 2, 0, 2, 3,    // front
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
    if (!bindBuffer(gl, 3, colors, 'a_Color')) {
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

main()