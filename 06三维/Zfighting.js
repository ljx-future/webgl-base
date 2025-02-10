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
        //Set clear color and enable the hidden surface removal function
        gl.clearColor(0, 0, 0, 1);
        gl.enable(gl.DEPTH_TEST);

        const moduleMatrix = new Matrix4()
        const viewMatrix = new Matrix4()
        const projectMatrix = new Matrix4()
        const mvpMatrix = new Matrix4()
        viewMatrix.setLookAt(3.06, 2.5, 10.0, 0, 0, -2, 0, 1, 0)
        projectMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100)
        mvpMatrix.set(projectMatrix).multiply(viewMatrix).multiply(moduleMatrix)
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.matrix)

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // 设置多边形偏移避免深度冲突
        gl.enable(gl.POLYGON_OFFSET_FILL);
        // 绘制三角形
        gl.drawArrays(gl.TRIANGLES, 0, n/2);
        gl.polygonOffset(1.0, 1.0);
        // 绘制三角形
        gl.drawArrays(gl.TRIANGLES, n/2, n/2);
    }
}

// 配置顶点位置
function initVertexBuffers(gl) {
    // 避免深度冲突
    let vertices = new Float32Array([
        // Vertex coordinates and color
        0.0,  2.5,  -5.0,  0.4,  1.0,  0.4, // The green triangle
        -2.5, -2.5,  -5.0,  0.4,  1.0,  0.4,
        2.5, -2.5,  -5.0,  1.0,  0.4,  0.4,

        0.0,  3.0,  -5.0,  1.0,  0.4,  0.4, // The yellow triagle
        -3.0, -3.0,  -5.0,  1.0,  1.0,  0.4,
        3.0, -3.0,  -5.0,  1.0,  1.0,  0.4,
    ])
    //顶点数量
    const n = 6;
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
