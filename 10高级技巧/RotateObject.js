import { initShaders } from "../initShaders.js";
import Matrix4 from "../Matrix4.js";
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_TexCoord;
  uniform mat4 u_MvpMatrix;
  varying vec2 v_TexCoord;
  void main() {
    gl_Position = u_MvpMatrix * a_Position;
    v_TexCoord = a_TexCoord;
  }
`
var FSHADER_SOURCE = `
  precision mediump float;
  uniform sampler2D u_Sampler;
  varying vec2 v_TexCoord;
  void main() {
    gl_FragColor = texture2D(u_Sampler, v_TexCoord);
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
        // 设置背景色
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // 设置清除颜色为黑色
        // 开启隐藏面消除功能
        gl.enable(gl.DEPTH_TEST);
        const u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix')
        if (!u_MvpMatrix) {
            console.log('failed')
            return
        }
        // 配置视图投影矩阵
        const vpMatrix = new Matrix4()
        const mvpMatrix = new Matrix4()
        vpMatrix.setPerspective(30.0, canvas.width / canvas.height, 1.0, 100.0);
        vpMatrix.lookAt(3.0, 3.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        // 注册鼠标事件
        let currentAngle = [0.0, 0.0]
        initEventHandlers(canvas, currentAngle)
        // 设置纹理
        if (!initTextures(gl)) {
            console.log('设置纹理错误')
            return
        }
        let tick = function () {
            // 渲染

            draw(gl, n, vpMatrix, mvpMatrix, u_MvpMatrix, currentAngle)
            requestAnimationFrame(tick)
        }
        tick()

    }
}
function initEventHandlers(canvas, currentAngle) {
    let dragging = false;
    let lastX = -1, lastY = -1;
    canvas.onmousedown = function (ev) {
        let x = ev.clientX, y = ev.clientY;
        let rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x;
            lastY = y;
            dragging = true
        }
    }
    canvas.onmouseup = function (ev) {
        dragging = false

    }

    canvas.onmousemove = function (ev) {
        let x = ev.clientX, y = ev.clientY;

        if (dragging) {
            let factor = 100 / canvas.height
            let dx = factor * (x - lastX)
            let dy = factor * (y - lastY)
            // 将沿Y轴旋转的角度控制在-90到90之间
            currentAngle[0] = Math.max(-90.0, Math.min(90.0, currentAngle[0] + dy))
            currentAngle[1] = currentAngle[1] + dx
        }
        lastX = x;
        lastY = y;
    }
}
function draw(gl, n, vpMatrix, mvpMatrix, u_MvpMatrix, currentAngle) {
    // 计算模型视图投影矩阵
    mvpMatrix.set(vpMatrix)
    mvpMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0)
    mvpMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0)
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.matrix)

    // 清除深度缓冲区   深度缓冲区 也称Z缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    // 绘制图形
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
    let vertices = new Float32Array([
        // 正方体的顶点坐标
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,  // v0-v3-v4-v5 right
        1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,  // v1-v6-v7-v2 left
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,  // v7-v4-v3-v2 down
        1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0   // v4-v7-v6-v5 back
    ])
    let texCoords = new Float32Array([
        1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,    // v0-v1-v2-v3 front
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,    // v0-v3-v4-v5 right
        1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,    // v0-v5-v6-v1 up
        1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,    // v1-v6-v7-v2 left
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,    // v7-v4-v3-v2 down
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0     // v4-v7-v6-v5 back
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
    if (!bindBuffer(gl,3 ,vertices, 'a_Position')) {
        return -1
    }
    if (!bindBuffer(gl, 2,texCoords, 'a_TexCoord')) {
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
function bindBuffer(gl,num, data, attribute) {
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

// 设置纹理
function initTextures(gl) {
    // 创建纹理对象
    const texture = gl.createTexture()
    if (!texture) {
        console.log('创建纹理对象失败')
        return false
    }
    // 获取纹理的u_Sampler的存储位置
    const u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler')
    if (!u_Sampler) {
        console.log('获取u_Sampler失败')
        return false
    }
    // 创建图像对象
    const image = new Image()
    // 注册图像加载事件的响应函数
    image.onload = function () {
        loadTexture(gl, texture, u_Sampler, image)
    }
    image.src = '../public/demo.png'
    return true
}
function loadTexture(gl, texture, u_Sampler, image) {
    // 对纹理图形进行Y轴反转
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    console.log('绑定纹理...');
    // 开启0号纹理单元
    gl.activeTexture(gl.TEXTURE0)
    // 绑定纹理对象到纹理单元
    gl.bindTexture(gl.TEXTURE_2D, texture);
    console.log('纹理绑定状态:', gl.isTexture(texture));
    // 设置纹理对象参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    // 部分 WebGL 实现可能会限制非 2^n 图像的 MIRRORED_REPEAT 或 REPEAT 模式
    // 尝试将图片尺寸调整为 2 的幂次方，例如 256x256 或 512x512。如果无法调整图片，改用 CLAMP_TO_EDGE 模式
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 设置纹理图像
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    console.log('纹理图像尺寸:', image.width, image.height);
    // 将0号纹理传递给着色器
    gl.uniform1i(u_Sampler, 0)
    console.log('传递纹理给着色器...');

}
main()