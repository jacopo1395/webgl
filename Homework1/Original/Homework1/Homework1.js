"use strict";

var canvas;
var gl;

var numVertices = 36;

var texSize = 256;
var numChecks = 8;

var program;

var texture1, texture2, texture3;
var t1, t2;

var c;

var flag = false;

/*
███    ███ ██    ██
████  ████  ██  ██
██ ████ ██   ████
██  ██  ██    ██
██      ██    ██
*/

var positional = false;
var directional = false;
var spotlight = false;

var positionalLoc, positionalLoc2;
var directionalLoc, directionalLoc2;
var spotlighLoc, spotlighLoc2;

var normalsArray = [];

var ambientColor, diffuseColor, specularColor;

var modelView, projection;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var normalMatrix, normalMatrixLoc;



var lightPosition = vec4(0.0, 0.0, -2.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var lightDirection = vec4( 0.0, 0.0, -1.0, 1.0 );
var cutOff = 0.90;

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 100.0;
/*

█████ █████ █████ █████ █████ █████ █████ █████ █████ █████ █████ █████ █████
*/




var image1 = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        var patchx = Math.floor(i / (texSize / numChecks));
        var patchy = Math.floor(j / (texSize / numChecks));
        if (patchx % 2 ^ patchy % 2) c = 255;
        else c = 0;
        //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
        image1[4 * i * texSize + 4 * j] = c;
        image1[4 * i * texSize + 4 * j + 1] = c;
        image1[4 * i * texSize + 4 * j + 2] = c;
        image1[4 * i * texSize + 4 * j + 3] = 255; //255
    }
}

var image2 = new Uint8Array(4 * texSize * texSize);

// Create a checkerboard pattern
for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        image2[4 * i * texSize + 4 * j] = 127 + 127 * Math.sin(0.1 * i * j);
        image2[4 * i * texSize + 4 * j + 1] = 127 + 127 * Math.sin(0.1 * i * j);
        image2[4 * i * texSize + 4 * j + 2] = 127 + 127 * Math.sin(0.1 * i * j);
        image2[4 * i * texSize + 4 * j + 3] = 255;
    }
}

var image3 = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
        image3[4 * i * texSize + 4 * j] = Math.random()*128;
        image3[4 * i * texSize + 4 * j + 1] = Math.random()*128;
        image3[4 * i * texSize + 4 * j + 2] = Math.random()*128;
        image3[4 * i * texSize + 4 * j + 3] = Math.random()*128;
    }
}

var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0), // black
    vec4(1.0, 0.0, 0.0, 1.0), // red
    vec4(1.0, 1.0, 0.0, 1.0), // yellow
    vec4(0.0, 1.0, 0.0, 1.0), // green
    vec4(0.0, 0.0, 1.0, 1.0), // blue
    vec4(1.0, 0.0, 1.0, 1.0), // magenta
    vec4(0.0, 1.0, 1.0, 1.0), // white
    vec4(0.0, 1.0, 1.0, 1.0) // cyan
];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [45.0, 45.0, 45.0];
var type = true; //false= Phong  |  true = Gouraud
var typeLoc, typeLoc2;
var thetaLoc;

var texture = false;
var textureLoc;

function configureTexture() {
    texture1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture3 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture3);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image3);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function quad(a, b, c, d) {
    /*
    ███    ███ ██    ██
    ████  ████  ██  ██
    ██ ████ ██   ████
    ██  ██  ██    ██
    ██      ██    ██
    */


    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);



    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);
    normalsArray.push(normal);

    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[1]);
    normalsArray.push(normal);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);
    normalsArray.push(normal);

    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);
    normalsArray.push(normal);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);
    normalsArray.push(normal);

    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[3]);
    normalsArray.push(normal);

    /*

    █████ █████ █████ █████ █████
    */


}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}


window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);


    // projection = ortho(-1, 1, -1, 1, -100, 100);

    /*
    ███    ███ ██    ██
    ████  ████  ██  ██
    ██ ████ ██   ████
    ██  ██  ██    ██
    ██      ██    ██
    */


    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);


    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProductP"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProductP"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProductP"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPositionP"), flatten(lightPosition));

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProductD"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProductD"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProductD"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPositionD"), flatten(lightPosition));

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProductS"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProductS"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProductS"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPositionS"), flatten(lightPosition));

    gl.uniform4fv(gl.getUniformLocation(program, "lightDirectionS"), flatten(lightDirection));
    gl.uniform1f(gl.getUniformLocation(program, "cutOff"), cutOff);

    //2
    gl.uniform1f(gl.getUniformLocation(program, "shininess2"), materialShininess);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProductP2"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProductP2"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProductP2"), flatten(specularProduct));

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProductD2"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProductD2"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProductD2"), flatten(specularProduct));

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProductS2"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProductS2"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProductS2"), flatten(specularProduct));

    gl.uniform4fv(gl.getUniformLocation(program, "lightDirectionS2"), flatten(lightDirection));
    gl.uniform1f(gl.getUniformLocation(program, "cutOff2"), cutOff);

    // gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projection));

    /*

    █████ █████ █████ █████ █████ █████ █████ █████ █████ █████ █████ █████ █████ █████ █████
    */



    configureTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.uniform1i(gl.getUniformLocation(program, "Tex0"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.uniform1i(gl.getUniformLocation(program, "Tex1"), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture3);
    gl.uniform1i(gl.getUniformLocation(program, "Tex2"), 2);

    thetaLoc = gl.getUniformLocation(program, "theta");
    typeLoc = gl.getUniformLocation(program, "type");
    typeLoc2 = gl.getUniformLocation(program, "type2");

    textureLoc = gl.getUniformLocation(program, "texture");

    positionalLoc = gl.getUniformLocation(program, "positional");
    directionalLoc = gl.getUniformLocation(program, "directional");
    spotlighLoc = gl.getUniformLocation(program, "spotlight");

    positionalLoc2 = gl.getUniformLocation(program, "positional2");
    directionalLoc2 = gl.getUniformLocation(program, "directional2");
    spotlighLoc2 = gl.getUniformLocation(program, "spotlight2");


    document.getElementById("ButtonX").onclick = function() {
        axis = xAxis;
    };
    document.getElementById("ButtonY").onclick = function() {
        axis = yAxis;
    };
    document.getElementById("ButtonZ").onclick = function() {
        axis = zAxis;
    };
    document.getElementById("ButtonT").onclick = function() {
        flag = !flag;
    };
    document.getElementById("ButtonL").onclick = function() {
        type = !type;
        if(type)
            document.getElementById("type").innerHTML="Gouraud";
        else document.getElementById("type").innerHTML="Phong";
    };

    document.getElementById("ButtonP").onclick = function() {
        positional = !positional;
    };

    document.getElementById("ButtonD").onclick = function() {
        directional = !directional;
    };

    document.getElementById("ButtonA").onclick = function() {
        spotlight = !spotlight;
    };
    document.getElementById("ButtonTex").onclick = function() {
        texture = !texture;
    };

    render();
}

var render = function() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (flag) theta[axis] += 2.0;
    gl.uniform3fv(thetaLoc, theta);
    gl.uniform1i(typeLoc, type);
    gl.uniform1i(typeLoc2, type);
    gl.uniform1i(textureLoc, texture);

    gl.uniform1i(positionalLoc, positional);
    gl.uniform1i(positionalLoc2, positional);

    gl.uniform1i(directionalLoc, directional);
    gl.uniform1i(directionalLoc2, directional);

    gl.uniform1i(spotlighLoc, spotlight);
    gl.uniform1i(spotlighLoc2, spotlight);

    // modelView = mat4();
    // modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    // modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    // modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
    //
    // gl.uniformMatrix4fv( gl.getUniformLocation(program,
    //         "modelViewMatrix"), false, flatten(modelView) );
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    requestAnimFrame(render);
}
