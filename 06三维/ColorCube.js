// 顶点着色器
import {initShaders} from "../initShaders.js";
import Matrix4 from "../Matrix4.js";

const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_MvpMatrix;
    varying vec4 v_Color;
    void main() {
        gl_Position = u_MvpMatrix * a_Position;
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
        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE ,0);
    }
}

// 配置顶点位置
function initVertexBuffers(gl) {
    // 坐标
    let vertices = new Float32Array([
        // 正方体的顶点坐标
         1.0, 1.0, 1.0, 1.0, 1.0, 1.0,  //v0白色
        -1.0, 1.0, 1.0, 1.0, 0.0, 1.0,  //v1品红色
        -1.0,-1.0, 1.0, 1.0, 0.0, 0.0,  //v2红色
         1.0,-1.0, 1.0, 1.0, 1.0, 0.0,  //v3
         1.0,-1.0,-1.0, 0.0, 1.0, 0.0,  //v4
         1.0, 1.0,-1.0, 0.0, 1.0, 1.0,  //v5
        -1.0, 1.0,-1.0, 0.0, 0.0, 1.0,  //v6
        -1.0,-1.0,-1.0, 0.0, 0.0, 0.0,  //v7
    ])
    // 索引
    let indices = new Uint8Array([
        0,1,2,0,2,3,
        0,3,4,0,4,5,
        0,5,6,0,6,1,
        1,6,7,1,7,2,
        7,4,3,7,3,2,
        4,7,6,4,6,5
    ])

    // 创建缓冲区对象
    bindBuffer(gl, vertices,indices)
    return indices.length
}

// 配置缓冲区
function bindBuffer(gl, vertices,indices) {
    const BUFFER_SIZE = vertices.BYTES_PER_ELEMENT
    // 坐标缓冲区和索引缓冲区
    const vertexBuffer = gl.createBuffer();
    const indicesBuffer = gl.createBuffer();
    if (!vertexBuffer || !indicesBuffer) {
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
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, BUFFER_SIZE * 6, 0)
    gl.enableVertexAttribArray(a_Position)
    // 顶点坐标
    const a_Color = gl.getAttribLocation(gl.program, 'a_Color')
    if (a_Color < 0) {
        console.log('获取a_Color失败')
        return
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, BUFFER_SIZE * 6, BUFFER_SIZE * 3)
    gl.enableVertexAttribArray(a_Color)

    // 将顶点索引写入缓冲区
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

main()
