var canvasColorPicker = $('#colorpicker')[0];
var canvasColorSelect = $('#colorselect')[0];
var canvasCircle = $("#colorpickerCircle")[0];
var ctx = canvasColorPicker.getContext('2d');
var ctxSelect = canvasColorSelect.getContext('2d');
var ctxCircle = canvasCircle.getContext("2d");


function unitConversion(unit) {
    var hexconv = unit.toString(16);
    return hexconv.length === 1 ? '0' + hexconv : hexconv;
}


var colorConvert = {
    // convert RGB to Hex
    RGBtoHex: function (r, g, b) {
        return "#" + unitConversion(r) + unitConversion(g) + unitConversion(b);
    },
    hslToRgb: function (h, s, l) {
        var r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            var hue2rgb = function hue2rgb(p, q, t) {
                if (t < 0)
                    t += 1;
                if (t > 1)
                    t -= 1;
                if (t < 1 / 6)
                    return p + (q - p) * 6 * t;
                if (t < 1 / 2)
                    return q;
                if (t < 2 / 3)
                    return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },
    rgbToHsl: function (r, g, b) {
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }

        return [Math.floor(h * 360), Math.floor(s * 100), Math.floor(l * 100)];
    }
}


colorsampler = function (event, obj) {
    rect = obj.getBoundingClientRect();
    var c = obj.getContext('2d');
    var x = event.pageX - rect.left;
    var y = event.pageY - rect.top;
    var p = c.getImageData(x, y, 1, 1).data;
    var colorCode;
    var r = p[0];
    var g = p[1];
    var b = p[2];
    var alpha = p[3];
    var a = Math.floor((100 * alpha) / 255) / 100;

    if (a <= 0) {
        colorCode = ((r << 16) | (g << 8) | b).toString(16);
    } else {
        colorCode = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }

    if (colorCode === "0")
        colorCode = "transparent";

    return colorCode;
}

colorseelct = function (event) {
    rect = canvasColorSelect.getBoundingClientRect();
    var x = event.pageX - rect.left;
    var y = event.pageY - rect.top;
    var p = ctxSelect.getImageData(x, y, 1, 1).data;
    var r = p[0];
    var g = p[1];
    var b = p[2];
    var alpha = p[3];
    var a = Math.floor((100 * alpha) / 255) / 100;
    return {rgba: [r, g, b, a], hsl: colorConvert.rgbToHsl(r, g, b)};
}

function simple(hue) {
    for (row = 0; row < canvasColorPicker.height; row++) {
        var percent = (row * 100) / canvasColorPicker.height;
        var grad = ctx.createLinearGradient(0, 0, canvasColorPicker.width, 0);
        grad.addColorStop(0, 'hsl(' + hue + ', 0%, ' + (100 - percent) + '%)');
        grad.addColorStop(1, 'hsl(' + hue + ', 100%, ' + (100 - percent) + '%)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, row, canvasColorPicker.width, 1);
    }
}

function range() {
    var gradient = ctxSelect.createLinearGradient(0, 0, 0, canvasColorSelect.height);
    // Create color gradient
    gradient.addColorStop(0, "rgb(255,   0,   0)");
    gradient.addColorStop(0.15, "rgb(255,   0, 255)");
    gradient.addColorStop(0.33, "rgb(0,     0, 255)");
    gradient.addColorStop(0.49, "rgb(0,   255, 255)");
    gradient.addColorStop(0.67, "rgb(0,   255,   0)");
    gradient.addColorStop(0.84, "rgb(255, 255,   0)");
    gradient.addColorStop(1, "rgb(255,   0,   0)");

    ctxSelect.fillStyle = gradient;

    ctxSelect.fillRect(0, 0, canvasColorSelect.width, canvasColorSelect.height);
}
range();


simple(88);

canvasColorPicker.addEventListener('mousemove', function (e) {
    $('#colorPreview').css('background', colorsampler(e, this));
});
canvasColorPicker.addEventListener('click', function (e) {
    $('#colorSelected').css('background', colorsampler(e, this));
});
canvasCircle.addEventListener('mousemove', function (e) {
    $('#colorPreview').css('background', colorsampler(e, this));
});
canvasCircle.addEventListener('click', function (e) {
    $('#colorSelected').css('background', colorsampler(e, this));
});
canvasColorSelect.addEventListener('mousemove', function (e) {
    var rgba = colorseelct(e);
    simple(rgba.hsl[0]);
});

var init = function () {
    $('#tabs ul li').click(function (){
        var id = $(this).data('id');

        $('#tabs ul li').removeClass('active');
        $(this).addClass('active');
        $('.pickerContainer').removeClass('active');
        $('.pickerContainer#'+id).addClass('active');
    });
}


var CX = canvasCircle.width / 2,
        CY = canvasCircle.height / 2,
        sx = CX,
        sy = CY;

function circle() {
    for (var i = 0; i < 360; i += 0.1) {
        var rad = i * (2 * Math.PI) / 360;
        ctxCircle.strokeStyle = "hsla(" + i + ", 100%, 50%, 1.0)";
        ctxCircle.beginPath();
        ctxCircle.moveTo(CX, CY);
        ctxCircle.lineTo(CX + sx * Math.cos(rad), CY + sy * Math.sin(rad));
        ctxCircle.stroke();
    }
}
init();
circle();