// 顶点着色器
import {initShaders} from "../initShaders.js";
import Matrix4 from "../Matrix4.js";

const VSHADER_SOURCE = `
    attribute vec4 a_attribute;
    attribute vec4 a_Color;
    uniform mat4 u_MvpMatrix;
    varying vec4 v_Color;
    void main() {
        gl_Position = u_MvpMatrix * a_attribute;
        v_Color = a_Color;
    }
`
const FSHADER_SOURCE = `
  precision mediump float;
  varying vec4 v_Color;
  void main() {
    gl_FragColor = v_Color;
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
        // 模型视图投影矩阵
        const u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix')
        if (!u_MvpMatrix) {
            console.log('获取u_MvpMatrix失败')
            return
        }
        const mvpMatrix = new Matrix4()
        mvpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100)
        mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0)
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.matrix)
        // 设置背景色
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // 设置清除颜色为黑色
        // 开启隐藏面消除功能
        gl.enable(gl.DEPTH_TEST);
        // 清除深度缓冲区   深度缓冲区 也称Z缓冲区
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        // 绘制图形
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    }
}

// 配置顶点位置
function initVertexBuffers(gl) {
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
        1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0, // v0-v1-v2-v3 front(blue)
        1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v0-v3-v4-v5 right(green)
        1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v0-v5-v6-v1 up(red)
        1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v1-v6-v7-v2 left
        1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
        1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0   // v4-v7-v6-v5 back
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
    if (!bindBuffer(gl, vertices, 'a_attribute')) {
        return -1
    }
    if (!bindBuffer(gl, colors, 'a_Color')) {
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
function bindBuffer(gl, data, attribute) {
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
        console.log('获取a_Position失败')
        return false;
    }
    gl.vertexAttribPointer(a_attribute, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(a_attribute)
    return true
}

main()
