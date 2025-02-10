// 顶点着色器
import {initShaders} from "../initShaders.js";
import Matrix4 from "../Matrix4.js";

const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ModuleMatrix;
    uniform mat4 u_ProjectMatrix;
    varying vec4 v_Color;
    void main() {
        gl_Position = u_ProjectMatrix * u_ViewMatrix * u_ModuleMatrix * a_Position;
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
        // 模型矩阵
        const u_ModuleMatrix = gl.getUniformLocation(gl.program, 'u_ModuleMatrix')
        if (!u_ModuleMatrix) {
            console.log('获取u_ModuleMatrix失败')
            return
        }
        // 视图矩阵
        const u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix')
        if (!u_ViewMatrix) {
            console.log('获取u_ViewMatrix失败')
            return
        }
        // 透视投影矩阵
        const u_ProjectMatrix = gl.getUniformLocation(gl.program, 'u_ProjectMatrix')
        if (!u_ProjectMatrix) {
            console.log('获取u_ProjectMatrix失败')
            return
        }
        const moduleMatrix = new Matrix4()
        const viewMatrix = new Matrix4()
        const projectMatrix = new Matrix4()
        viewMatrix.setLookAt(0, 0, 5, 0, 0, -100, 0, 1, 0)
        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.matrix)
        projectMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100)
        gl.uniformMatrix4fv(u_ProjectMatrix, false, projectMatrix.matrix)
        // 绘制图形
        // 设置背景色
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // 设置清除颜色为黑色
        gl.clear(gl.COLOR_BUFFER_BIT);
        // 绘制右侧的一组三角形
        moduleMatrix.setTranslate(0.75, 0, 0)
        gl.uniformMatrix4fv(u_ModuleMatrix, false, moduleMatrix.matrix)
        gl.drawArrays(gl.TRIANGLES, 0, n);
        // 绘制左侧的一组三角形
        moduleMatrix.setTranslate(-0.75, 0, 0)
        gl.uniformMatrix4fv(u_ModuleMatrix, false, moduleMatrix.matrix)
        gl.drawArrays(gl.TRIANGLES, 0, n);
    }
}

// 配置顶点位置
function initVertexBuffers(gl) {
    // 图形顶点位置
    let vertices = new Float32Array([
        // 原始位置的3个三角形
        0.0, 1.0, -4.0, 0.4, 1.0, 0.4, // 绿色三角在最后面
        -0.5, -1.0, -4.0, 0.4, 1.0, 0.4,
        0.5, -1.0, -4.0, 1.0, 0.4, 0.4,
        0.0, 1.0, -2.0, 1.0, 1.0, 0.4, // 黄色三角在中间
        -0.5, -1.0, -2.0, 1.0, 1.0, 0.4,
        0.5, -1.0, -2.0, 1.0, 0.4, 0.4,
        0.0, 1.0, 0.0, 0.4, 0.4, 1.0,   // 蓝色三角在最前面
        -0.5, -1.0, 0.0, 0.4, 0.4, 1.0,
        0.5, -1.0, 0.0, 1.0, 0.4, 0.4,
    ])
    //顶点数量
    const n = 9;
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

}

main()
