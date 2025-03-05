// 顶点着色器
import { initShaders } from "../initShaders.js";
import Matrix4 from "../Matrix4.js";
let VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Normal;\n' +        // 法向量
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_ModelMatrix;\n' +    // 模型矩阵 -- 进行变换
    'uniform mat4 u_NormalMatrix;\n' +    // 用来变换法向量的矩阵 -- 逆转置矩阵
    'varying vec3 v_Position;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    // Make the length of the normal 1.0
    // 计算变换后的法向量并归一化
    '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
    '  v_Color = vec4(1.0, 0.4, 0.0, 1.0);\n' +
    '}\n';

// Fragment shader program
let FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform vec3 u_LightColor;\n' +     // 光线颜色
    'uniform vec3 u_LightDirection;\n' + // 归一化的世界坐标 (in the world coordinate, normalized)
    'uniform vec3 u_AmbientLight;\n' +  // 环境光颜色
    'varying vec3 v_Position;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    // Make the length of the normal 1.0
    // 计算变换后的法向量并归一化
    '  vec3 normal = normalize(v_Normal);\n' +
    // Dot product of the light direction and the orientation of a surface (the normal)
    '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
    // Calculate the color due to diffuse reflection
    // 计算漫反射光的颜色
    '  vec3 diffuse = u_LightColor * vec3(v_Color) * nDotL;\n' +
    // 计算环境光产生的反射光颜色
    '  vec3 ambient = u_AmbientLight * vec3(v_Color);\n' +
    '  gl_FragColor = vec4(diffuse + ambient, v_Color.a);\n' +
    '}\n';
// Rotation angle (degrees/second)
const ANGLE_STEP = 3.0; // 递增/递减的长度
let g_arm1_angle = 90.0 // arm1 第一节大臂的旋转角度
let g_arm2_angle = 45.0 // arm2 第二节小臂的旋转角度
let g_handle_angle = 0.0 // handle 手掌的旋转角度
let g_finger_angle = 0.0 // finger1 手指的旋转角度
let vpMatrix = new Matrix4()
let mvpMatrix = new Matrix4()
let baseMatrix = new Matrix4()
let modelMatrix = new Matrix4()
let normalMatrix = new Matrix4()
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

        // 获取映射的变量
        let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
        let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
        let u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
        let u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
        let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
        let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
        if (!u_MvpMatrix || !u_LightColor || !u_LightDirection || !u_AmbientLight || !u_NormalMatrix || !u_ModelMatrix) {
            console.log('Failed to get the storage location');
            return;
        }
        // 光线颜色
        gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
        // 设置归一化世界坐标 (在世界坐标系)
        let lightDirection = new Vector3([0.0, 0.5, 0.7]);
        lightDirection.normalize();     // 归一化
        gl.uniform3fv(u_LightDirection, lightDirection.elements);

        // 环境光颜色
        gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2)

        // 模型视图投影矩阵
        vpMatrix.setPerspective(50, canvas.width / canvas.height, 1, 100)
        vpMatrix.lookAt(20.0, 10.0, 30.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        console.log("vpMatrix", vpMatrix.matrix);

        draw(gl, n, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix)
        document.onkeydown = function (ev) { keydown(ev, gl, n, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix); };

    }
}

function keydown(event, gl, n, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix) {
    switch (event.keyCode) {
        case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
            g_arm1_angle = (g_arm1_angle + ANGLE_STEP) % 360;
            break;
        case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
            g_arm1_angle = (g_arm1_angle - ANGLE_STEP) % 360;
            break;
        case 40: // Up arrow key -> the positive rotation of joint1 around the z-axis
            if (g_arm2_angle < 135.0) g_arm2_angle += ANGLE_STEP;
            break;
        case 38: // Down arrow key -> the negative rotation of joint1 around the z-axis
            if (g_arm2_angle > -135.0) g_arm2_angle -= ANGLE_STEP;
            break;
        case 90: // 'ｚ'key -> the positive rotation of joint2
            g_handle_angle = (g_handle_angle + ANGLE_STEP) % 360;
            break;
        case 88: // 'x'key -> the negative rotation of joint2
            g_handle_angle = (g_handle_angle - ANGLE_STEP) % 360;
            break;
        case 86: // 'v'key -> the positive rotation of joint3
            if (g_finger_angle < 60.0) g_finger_angle = (g_finger_angle + ANGLE_STEP) % 360;
            break;
        case 67: // 'c'key -> the nagative rotation of joint3
            if (g_finger_angle > -60.0) g_finger_angle = (g_finger_angle - ANGLE_STEP) % 360;
            break;
    }
    draw(gl, n, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix)
}
// 配置顶点位置
function initVertexBuffers(gl) {
    // 坐标
    let vertices = new Float32Array([
        0.5, 1.0, 0.5, -0.5, 1.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0, 0.5, // v0-v1-v2-v3 front
        0.5, 1.0, 0.5, 0.5, 0.0, 0.5, 0.5, 0.0, -0.5, 0.5, 1.0, -0.5, // v0-v3-v4-v5 right
        0.5, 1.0, 0.5, 0.5, 1.0, -0.5, -0.5, 1.0, -0.5, -0.5, 1.0, 0.5, // v0-v5-v6-v1 up
        -0.5, 1.0, 0.5, -0.5, 1.0, -0.5, -0.5, 0.0, -0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
        -0.5, 0.0, -0.5, 0.5, 0.0, -0.5, 0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
        0.5, 0.0, -0.5, -0.5, 0.0, -0.5, -0.5, 1.0, -0.5, 0.5, 1.0, -0.5  // v4-v7-v6-v5 back
    ]);
    // Normal
    let normals = new Float32Array([
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0  // v4-v7-v6-v5 back
    ]);

    // Indices of the vertices
    let indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ]);

    // 创建缓冲区对象
    if (!bindBuffer(gl, vertices, 'a_Position')) {
        return -1
    }
    if (!bindBuffer(gl, normals, 'a_Normal')) {
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
        console.log(attribute + '获取失败')
        return false;
    }
    gl.vertexAttribPointer(a_attribute, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(a_attribute)
    return true
}
function draw(gl, n, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix) {
    // 清除深度缓冲区   深度缓冲区 也称Z缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    let baseHeight = 2.0;
    // 绘制底座
    modelMatrix.setTranslate(0.0, -12.0, 0.0)
    drawBox(gl, n, 10, baseHeight, 10, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix)

    // 绘制arm1大臂
    let armLength = 10.0;
    modelMatrix.translate(0.0, baseHeight, 0.0)
    modelMatrix.rotate(g_arm1_angle, 0, 1.0, 0)
    drawBox(gl, n, 3, armLength, 3, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix)
    // 绘制arm2小臂
    modelMatrix.translate(0.0, armLength, 0.0)
    modelMatrix.rotate(g_arm2_angle, 0, 0, 1)
    drawBox(gl, n, 4, armLength, 4, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix)
    // 绘制handle手掌
    let handleLength = 2.0
    modelMatrix.translate(0.0, armLength, 0.0)
    modelMatrix.rotate(g_handle_angle,0,1,0)
    drawBox(gl, n, 3, handleLength, 6, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix)

    // 手指模型的平移定位
    modelMatrix.translate(0.0, handleLength, 0.0)
    baseMatrix.set(modelMatrix)
    // 绘制手指1
    let fingerLength = 2.0
    modelMatrix.translate(0, 0, 2)
    modelMatrix.rotate(g_finger_angle, 1, 0, 0)
    drawBox(gl, n, 1, fingerLength, 1, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, 'finger')
    // 绘制手指2
    modelMatrix.translate(0, 0, -2)
    modelMatrix.rotate(-g_finger_angle, 1, 0, 0)
    drawBox(gl, n, 1, fingerLength, 1, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, 'finger')
}
function drawBox(gl, n, width, height, depth, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix,type = '') {
    if (type !== 'finger') {
        baseMatrix.set(modelMatrix)
    }
    modelMatrix.scale(width, height, depth)
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);

    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.matrix)
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.matrix)
    // 根据模型矩阵计算用来变换法向量的矩阵
    // 得到模型矩阵的逆转置矩阵
    normalMatrix.setInverseOf(modelMatrix)
    normalMatrix.transpose()
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.matrix)
    // 绘制图形
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    modelMatrix.set(baseMatrix)
}
main()
