import {initShaders} from "../initShaders.js";
import Matrix4 from "../Matrix4.js";

const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  uniform float u_Opacity;
  uniform mat4 u_ProjectMatrix;
  uniform mat4 u_ViewMatrix;
  varying vec4 v_Color;
  void main() {
    gl_Position = u_ProjectMatrix * u_ViewMatrix * a_Position;
    v_Color = vec4(a_Color.rgb, u_Opacity);
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
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl. G1_ONE)
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
        // u_Opacity
        const u_Opacity = gl.getUniformLocation(gl.program, 'u_Opacity')
        if (!u_Opacity) {
            console.log('获取u_Opacity失败')
            return
        }
        const viewMatrix = new Matrix4()
        const projectMatrix = new Matrix4()
        document.onkeydown = function (ev) {
            keydown(ev, gl, n, u_ViewMatrix, viewMatrix, u_Opacity)
        }
        projectMatrix.setOrtho(-1.0, 1.0, -1.0, 1.0, 0.0, 2.0)
        gl.uniformMatrix4fv(u_ProjectMatrix, false, projectMatrix.matrix)
        draw(gl, n, u_ViewMatrix, viewMatrix, u_Opacity)
    }
}

// 视点
let g_eyeX = 0.20, g_eyeY = 0.25, g_eyeZ = 0.25, g_Opacity = 1.0;

function keydown(ev, gl, n, u_ViewMatrix, viewMatrix, u_Opacity) {
    // 右键
    if (ev.keyCode == 39) {
        g_eyeX += 0.01
    } else if (ev.keyCode == 37) {
        // 左键
        g_eyeX -= 0.01
    } else if (ev.keyCode == 38) {
        // 上键
        g_Opacity = g_Opacity >= 1 ? 1 : g_Opacity + 0.1
    } else if (ev.keyCode == 40) {
        // 下键
        g_Opacity = g_Opacity > 0 ?  g_Opacity - 0.1 : 0
    } else {
        return;
    }
    draw(gl, n, u_ViewMatrix, viewMatrix, u_Opacity)
}

function draw(gl, n, u_ViewMatrix, viewMatrix, u_Opacity) {
    viewMatrix.setLookAt(g_eyeX, g_eyeY, g_eyeZ, 0, 0, 0, 0, 1, 0)
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.matrix)
    gl.uniform1f(u_Opacity, g_Opacity)
    // 设置背景色
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // 设置清除颜色为黑色
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

// 配置顶点位置
function initVertexBuffers(gl) {
    // 图形顶点位置
    let vertices = new Float32Array([
        // 顶点坐标          颜色
        0.0, 0.5, -0.4, 0.4, 1.0, 0.4,
        -0.5, -0.5, -0.4, 0.4, 1.0, 0.4,
        0.5, -0.5, -0.4, 1.0, 0.4, 0.4,
        0.5, 0.4, -0.2, 1.0, 0.4, 0.4,
        -0.5, 0.4, -0.2, 1.0, 1.0, 0.4,
        0.0, -0.6, -0.2, 1.0, 1.0, 0.4,
        0.0, 0.5, 0.0, 0.4, 0.4, 1.0,
        -0.5, -0.5, 0.0, 0.4, 0.4, 1.0,
        0.5, -0.5, 0.0, 1.0, 0.4, 0.4
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