import { initShaders } from "../initShaders.js";
import Matrix4 from "../Matrix4.js";
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_TexCoord;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  v_TexCoord = a_TexCoord;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform sampler2D u_Sampler;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
    '}\n';
let OFFSCREEN_WIDTH = 256
let OFFSCREEN_HEIGHT = 256
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
        // 设置正方形顶点缓冲区
        const cube = initVertexBuffers(gl)
        // 设置矩形顶点缓冲区
        const plane = initVertexBuffersForPlane(gl)
        if (cube < 0 || plane < 0) {
            console.log('设置顶点位置错误')
            return
        }
        // 创建正方形的纹理材质
        const cubeTexture = initTextures(gl)
        if (!cubeTexture) {
            console.log('创建正方形的纹理材质错误')
            return
        }
        // 创建帧缓冲区对象
        const framebuffer = initFramebufferObject(gl)
        if (!framebuffer) {
            console.log('创建帧缓冲区对象错误')
            return
        }
        // 开启隐藏面消除功能
        gl.enable(gl.DEPTH_TEST);
        const a_Position = gl.getAttribLocation(gl.program, 'a_Position')
        const a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord')
        const u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix')
        if (a_Position < 0 || a_TexCoord < 0 || !u_MvpMatrix) {
            console.log('failed')
            return
        }

        // 矩形平面
        let viewProjMatrix = new Matrix4();   // Prepare view projection matrix for color buffer
        viewProjMatrix.setPerspective(30, canvas.width / canvas.height, 1.0, 100.0);
        viewProjMatrix.lookAt(0.0, 0.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        // 正方体
        let viewProjMatrixFBO = new Matrix4();   // Prepare view projection matrix for FBO
        viewProjMatrixFBO.setPerspective(30.0, OFFSCREEN_WIDTH / OFFSCREEN_HEIGHT, 1.0, 100.0);
        viewProjMatrixFBO.lookAt(0.0, 2.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

        let currentAngle = 0.0
        let tick = function () {
            // 渲染
            currentAngle = animate(currentAngle)

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);              // Change the drawing destination to FBO
            gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); // Set a viewport for FBO

            gl.clearColor(0.2, 0.2, 0.4, 1.0); // Set clear color (the color is slightly changed)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear FBO

            drawCube(gl, cube, cubeTexture, u_MvpMatrix, a_Position, a_TexCoord, currentAngle, viewProjMatrixFBO)

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);        // Change the drawing destination to color buffer
            gl.viewport(0, 0, canvas.width, canvas.height);  // Set the size of viewport back to that of <canvas>

            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the color buffer

            drawPanel(gl, plane, framebuffer.texture, u_MvpMatrix, a_Position, a_TexCoord, currentAngle, viewProjMatrix)

            requestAnimationFrame(tick)
        }
        tick()

    }
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
    let newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
}
// Coordinate transformation matrix
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();
function drawCube(gl, cube, texture, u_MvpMatrix, a_Position, a_TexCoord, currentAngle, viewProjMatrix) {
    // 计算模型视图投影矩阵
    g_modelMatrix.setRotate(20.0, 1.0, 0.0, 0.0);
    g_modelMatrix.rotate(currentAngle, 0.0, 1.0, 0.0);

    g_mvpMatrix.set(viewProjMatrix)
    g_mvpMatrix.multiply(g_modelMatrix)
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.matrix)

    drawTexturedObject(gl, cube, texture, a_Position, a_TexCoord)
}
function drawPanel(gl, panel, texture, u_MvpMatrix, a_Position, a_TexCoord, currentAngle, viewProjMatrix) {
    // Calculate a model matrix
    g_modelMatrix.setTranslate(0, 0, 1);
    g_modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
    g_modelMatrix.rotate(currentAngle, 0.0, 1.0, 0.0);

    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.matrix)

    drawTexturedObject(gl, panel, texture, a_Position, a_TexCoord,)
}
function drawTexturedObject(gl, o, texture, a_Position, a_TexCoord) {
    // Assign the buffer objects and enable the assignment
    initAttributeVariable(gl, a_Position, o.verticesBuffer);    // Vertex coordinates
    initAttributeVariable(gl, a_TexCoord, o.texCoordBuffer);  // Texture coordinates

    // Bind the texture object to the target
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indicesBuffer);
    gl.drawElements(gl.TRIANGLES, o.numIndices, o.indicesBuffer.type, 0);
}
// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
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
    var o = new Object();
    o.verticesBuffer = bindBuffer(gl, 3, vertices, gl.FLOAT)
    o.texCoordBuffer = bindBuffer(gl, 2, texCoords, gl.FLOAT)
    o.indicesBuffer = bindIndicesBuffer(gl, indices, gl.UNSIGNED_BYTE)
    // 创建缓冲区对象
    if (!o.verticesBuffer || !o.texCoordBuffer || !o.indicesBuffer) {
        return -1
    }
    o.numIndices = indices.length;
    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return o
}
function initVertexBuffersForPlane(gl) {
    // Create face
    //  v1------v0
    //  |        |
    //  |        |
    //  |        |
    //  v2------v3

    // Vertex coordinates
    var vertices = new Float32Array([
        1.0, 1.0, 0.0, -1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0    // v0-v1-v2-v3
    ]);

    // Texture coordinates
    var texCoords = new Float32Array([1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0]);

    // Indices of the vertices
    var indices = new Uint8Array([0, 1, 2, 0, 2, 3]);
    var o = new Object();
    o.verticesBuffer = bindBuffer(gl, 3, vertices, gl.FLOAT)
    o.texCoordBuffer = bindBuffer(gl, 2, texCoords, gl.FLOAT)
    o.indicesBuffer = bindIndicesBuffer(gl, indices, gl.UNSIGNED_BYTE)
    // 创建缓冲区对象
    if (!o.verticesBuffer || !o.texCoordBuffer || !o.indicesBuffer) {
        return -1
    }
    o.numIndices = indices.length;
    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return o
}

// 配置缓冲区
function bindBuffer(gl, num, data, type) {
    // 创建缓冲区
    const attributeBuffer = gl.createBuffer();
    if (!attributeBuffer) {
        console.log('创建缓冲区失败')
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    attributeBuffer.num = num
    attributeBuffer.type = type

    return attributeBuffer
}
// 配置缓冲区
function bindIndicesBuffer(gl, data, type) {
    // 创建缓冲区
    const attributeBuffer = gl.createBuffer();
    if (!attributeBuffer) {
        console.log('创建缓冲区失败')
        return false;
    }
    // 将顶点索引写入缓冲区
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, attributeBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    attributeBuffer.type = type

    return attributeBuffer
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
    return texture
}
function loadTexture(gl, texture, u_Sampler, image) {
    // 对纹理图形进行Y轴反转
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    console.log('绑定纹理...');
    // 开启0号纹理单元
    // gl.activeTexture(gl.TEXTURE0)
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
    // 解绑纹理对象
    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture object

}
// 创建帧缓冲区对象
function initFramebufferObject(gl) {
    const framebuffer = gl.createFramebuffer()
    if (!framebuffer) {
        console.log('创建帧缓冲区对象失败')
        return false
    }
    // 创建纹理对象
    let texture = gl.createTexture(); // Create a texture object
    if (!texture) {
        console.log('Failed to create texture object');
        return false;
    }
    gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the object to target
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    framebuffer.texture = texture;
    // 创建渲染缓冲区对象
    let depthbuffer = gl.createRenderbuffer()
    if (!depthbuffer) {
        console.log('创建渲染缓冲区对象失败')
        return false
    }
    // 绑定渲染缓冲区对象
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthbuffer);
    // 设置渲染缓冲区对象的存储
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
    // 绑定帧缓冲区对象
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    // 绑定纹理对象到帧缓冲区对象
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    // 绑定渲染缓冲区对象到帧缓冲区对象
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthbuffer);
    // 检查帧缓冲区对象是否完整
    let e = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (gl.FRAMEBUFFER_COMPLETE !== e) {
        console.log('创建帧缓冲区对象失败')
        return false
    }

    // 解绑帧缓冲区对象
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // 解绑纹理对象
    gl.bindTexture(gl.TEXTURE_2D, null);
    // 解绑渲染缓冲区对象
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return framebuffer;
}

main()